import invoiz from 'services/invoiz.service';
import React from 'react';
import moment from 'moment';
import _ from 'lodash';
import config from 'config';
import { connect } from 'react-redux';
import WidgetComponent from 'shared/dashboard/components/widget.component';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import BarChartComponent from 'shared/charts/bar-chart.component';
import ButtonComponent from 'shared/button/button.component';
import { formatCurrencyTruncated, formatCurrencySymbolDisplayInFront } from 'helpers/formatCurrency';
// import { getMonthName, formatDate } from 'helpers/formatDate';
import { getMonthName, formateClientDateMonth } from 'helpers/formatDate';
import LoaderComponent from 'shared/loader/loader.component';

import { fetchStatsData } from 'redux/ducks/dashboard/salesExpensesStats';
import userPermissions from 'enums/user-permissions.enum';
import DateInputComponent from '../inputs/date-input/date-input.component';
import SelectInputComponent from '../inputs/select-input/select-input.component';
import { DateFilterType } from '../../helpers/constants';
const calenderIcon = require('assets/images/icons/calender.svg');
const redirectIcon = require(`assets/images/icons/arrow_up_right.svg`)
import SVGInline from 'react-svg-inline';


class DashboardSalesExpensesStatsComponent extends React.Component {
	constructor(props) {
		super(props);

		const financialYearMonthStart = moment().set('month', 2).set('date', 31);
		const customStartDate = financialYearMonthStart < moment()
			? financialYearMonthStart
			: financialYearMonthStart.set('year', moment().year() - 1);

		this.state = {
			monthOffset: 0,
			totalSalesSum: 0,
			totalExpenseSum: 0,
			canCreateInvoice: null,
			chartData: {},
			activeChartData: {},
			turnoverExpenses: {},
			dateFilterValue: DateFilterType.FISCAL_YEAR,
			subChartActive: false,
			customStartDate,
			customEndDate: moment(),
			showCustomDateRangeSelector: false,

			currentMonthName: moment().format('MMMM'),
            lastMonthName: moment().subtract(1, 'months').format('MMMM'),
            secondLastMonth: moment().subtract(2, 'months').format('MMMM'),
			currQuarter: moment().startOf('quarter').format('Q/YYYY'),
            lastQuarter: moment().subtract(3, 'months').startOf('quarter').format('Q/YYYY'),
            secondLastQuarter: moment().subtract(6, 'months').startOf('quarter').format('Q/YYYY'),
		};
	}

	addDateQueryParam() {
        const { dateFilterValue } = this.state;
        let query = '', startDate = null, endDate = null;

		switch(dateFilterValue) {
            case DateFilterType.CURR_MONTH:
                startDate = moment().utc().startOf('month').toJSON();
                endDate = moment().utc().endOf('month').toJSON();
                query = `?startDate=${startDate}&endDate=${endDate}`;
                break;
            
            case DateFilterType.LAST_MONTH:
                startDate = moment().utc().subtract(1, 'months').startOf('month').toJSON();
                endDate = moment().utc().subtract(1, 'months').endOf('month').toJSON();
                query = `?startDate=${startDate}&endDate=${endDate}`;
                break;
                
            case DateFilterType.SECOND_LAST_MONTH:
                startDate = moment().utc().subtract(2, 'months').startOf('month').toJSON();
                endDate = moment().utc().subtract(2, 'months').endOf('month').toJSON();
                query = `?startDate=${startDate}&endDate=${endDate}`;
                break;
                
            case DateFilterType.CURR_QUARTER:
                startDate = moment().utc().startOf('quarter').toJSON();
                endDate = moment().utc().toJSON();
                query = `?startDate=${startDate}&endDate=${endDate}`;
                break;
            
            case DateFilterType.LAST_QUARTER:
                startDate = moment().utc().subtract(1, 'quarter').startOf('quarter').toJSON();
                endDate = moment().utc().subtract(1, 'quarter').endOf('quarter').toJSON();
                query = `?startDate=${startDate}&endDate=${endDate}`;
                break;

            case DateFilterType.SECOND_LAST_QUARTER:
                startDate = moment().utc().subtract(2, 'quarter').startOf('quarter').toJSON();
                endDate = moment().utc().subtract(2, 'quarter').endOf('quarter').toJSON();
                query = `?startDate=${startDate}&endDate=${endDate}`;
                break;

			case DateFilterType.FISCAL_YEAR:
				const financialYearMonthStart = moment().utc().set('month', 2).set('date', 31);
				startDate = financialYearMonthStart < moment().utc()
					? financialYearMonthStart
					: financialYearMonthStart.set('year', moment().utc().year() - 1);
				endDate = endDate ? moment(endDate).utc() : moment().utc();
				query = `?startDate=${startDate.toJSON()}&endDate=${endDate.toJSON()}`;
				break;
                                    
            case DateFilterType.CUSTOM:
                query = `?startDate=${this.state.customStartDate.toJSON()}&endDate=${this.state.customEndDate.toJSON()}`;
                break;
        }
        return query;
    }

	componentDidMount() {
		this.refresh();
		this.setState({
			canCreateInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_INVOICE)
		});
		this.fetchData();
	}

	fetchData() {
		const url = `${config.dashboard.endpoints.stats}turnoverExpenses${this.addDateQueryParam()}`;
		invoiz.request(url, {auth: true})
			.then(async ({ body: { data } }) => {
				if(!data) {
					return invoiz.showNotification('error', 'Failed to fetch data');
				}
				const chartData = this.parseStatsData(data);

				let totalSalesSum = 0, totalExpenseSum = 0;
				chartData.series.forEach(seriesItem => {
					if(seriesItem.name === 'sales') {
						totalSalesSum = seriesItem.data.reduce((sum, item) => sum + item.value, 0);
					}
					else if(seriesItem.name === 'expenses') {
						totalExpenseSum = seriesItem.data.reduce((sum, item) => sum + item.value, 0);
					}
				});

				await this.setState({activeChartData: chartData});

				this.setState({
					totalSalesSum,
					totalExpenseSum,
					chartData,
					turnoverExpenses: data,
				})
			});
	}

	parseStatsData(data) {
		const { resources } = this.props;

		const chartData = {
			labels: [],
			series: [],
			headerYearLabel: '',
			prevDataExist: data.prevDataExist,
			nextDataExist: data.nextDataExist
		};
	
		const monthOrder = _.pluck(data.turnoverMonthly, 'month');
		const monthLabels = monthOrder.map(itm => moment().set('month', itm - 1).format('MMM'));
		chartData.labels = monthLabels;
	
		let series = [
			{
				data: _.map(data.turnoverMonthly, (item) => {
					const meta = `${item.month}/${item.year}`;
					return { 
						item,
						meta,
						date: meta,
						value: item.value,
					};
				}),
				color: '0f2659',
				name: 'sales'
			},
			{
				data: _.map(data.expensesMonthly, (item) => {
					const meta = `${item.month}/${item.year}`;
					return { 
						item,
						meta,
						date: meta,
						value: item.value,
					};
				}),
				color: '6A1370',
				name: 'expenses'
			}
		];

		chartData.series = series;
	
		const chartYears = data.turnoverMonthly
			.map(salesObj => salesObj.year)
			.concat(data.expensesMonthly.map(expensesObj => expensesObj.year));
	
		chartData.headerYearLabel = _.uniq(chartYears).join('/');
	
		return chartData;
	}

	onBarClick(bar) {
		const { activeChartData, turnoverExpenses, subChartActive } = this.state;

		const node = bar.element._node;
		
		if(bar.type === 'bar') {
			
			if(!subChartActive) {
				node.style.stroke = '#' + bar.series.color;
			} else {
				node.style.stroke = '#' + bar.series.data[bar.index].color;
			}
		}
		
		node.onclick = data => {
			const { chartData } = this.state;
			if(subChartActive) return;


			let totalSalesSum = 0;
			let totalExpenseSum = 0;

			const series = [
				{
					data: [
						{
							meta: bar.meta,
							date: bar.meta,
							value: _.reduce(turnoverExpenses.turnoverMonthly, (sum, item) => {
								const meta = `${item.month}/${item.year}`;
								if(bar.meta !== meta) return sum + 0;
								totalSalesSum += item.invoiceSales;
								return sum + item.invoiceSales;
							}, 0) || null,
							name: "Invoices",
							color: "0f2659",
							onLabelClick: () => invoiz.router.redirectTo('/invoices')
						}, {
							meta: bar.meta,
							date: bar.meta,
							value: _.reduce(turnoverExpenses.turnoverMonthly, (sum, item) => {
								const meta = `${item.month}/${item.year}`;
								if(bar.meta !== meta) return sum + 0;
								totalSalesSum += item.posReceiptSales;
								return sum + item.posReceiptSales;
							}, 0) || null,
							name: "Receipts",
							color: "87ACF8",
							onLabelClick: () => invoiz.router.redirectTo('/invoices')
						}, {
							meta: bar.meta,
							date: bar.meta,
							value: _.reduce(turnoverExpenses.expensesMonthly, (sum, item) => {
								const meta = `${item.month}/${item.year}`;
								if(bar.meta !== meta) return sum + 0;
								totalExpenseSum += item.expenses;
								return sum + item.expenses
							}, 0) || null,
							name: "Expenses",
							color: "6A1370",
							onLabelClick: () => invoiz.router.redirectTo('/expenses')
						}, {
							meta: bar.meta,
							date: bar.meta,
							value: _.reduce(turnoverExpenses.expensesMonthly, (sum, item) => {
								const meta = `${item.month}/${item.year}`;
								if(bar.meta !== meta) return sum + 0;
								totalExpenseSum += item.purchases;
								return sum + item.purchases;
							}, 0) || null,
							name: "Purchases",
							color: "F3BBF8",
							onLabelClick: () => invoiz.router.redirectTo('/purchase-orders')
						}
					],
					color: '0f2659',
					name: ''
				},
			];

			const labels = series[0].data.map(item => item.name);
			const month = parseInt(bar.meta.split('/')[0]);
			const year = parseInt(bar.meta.split('/')[1]);

			chartData.title = moment().month(month - 1).format("MMM") + ' ' + year;

			this.setState({
				activeChartData: {
					...chartData,
					series,
					labels
				},
				subChartActive: true,
				totalSalesSum,
				totalExpenseSum
			})
		}
	}

	onChartCreated(ctx) {

		const horizontalLabels = $('.salesExpensesStats').find('.ct-labels .ct-label.ct-horizontal');

		$('.salesExpensesStats')
			.find('.ct-series')
			.each(function() {
				if ($(this).attr('ct:series-name') === 'sales') {
					$(this)
						.find('.ct-bar')
						.each(function(i) {
							$(horizontalLabels[i]).attr('ct:value-sales', $(this).attr('ct:value'));
							$(horizontalLabels[i]).attr('ct:meta', $(this).attr('ct:meta'));
						});
				} else {
					$(this)
						.find('.ct-bar')
						.each(function(i) {
							$(horizontalLabels[i]).attr('ct:value-expenses', $(this).attr('ct:value'));
							$(horizontalLabels[i]).attr('ct:meta', $(this).attr('ct:meta'));
						});
				}
			});

		setTimeout(() => {
			if ($('.salesExpensesStats svg .ct-grids')[0]) {
				const gridStart = $('.salesExpensesStats svg .ct-labels .ct-vertical:last').outerWidth() + 13;

				$(this.refs.btnJumpPrevMonth).css('left', gridStart);
				$(this.refs.btnJumpPrevMonth)
					.add(this.refs.btnJumpNextMonth)
					.removeClass('hidden');
			}
		}, 0);
	}

	onChartMouseEnter($point, $toolTip) {
		const isLabel = $point.hasClass('ct-label');
		const { resources } = this.props;

		if (isLabel) return;
			
		const value = $point.attr('ct:value');
		const date = $point.attr('ct:meta');
		const valueSales = $point.attr('ct:value-sales');
		const valueExpenses = $point.attr('ct:value-expenses')
		const month = parseInt(date.split('/')[0]);
		const year = parseInt(date.split('/')[1]);
		const dateFormat = `${moment().month(month - 1).format("MMMM")}/${year}`;
		const seriesName = $point.parent().attr('ct:series-name');

		// if (seriesName === 'sales') {
		// 	$toolTip.removeClass('tooltiplight').removeClass('tooltipDarkgray');
		// } else {
		// 	$toolTip.addClass('tooltiplight');
		// }
		$toolTip.addClass('tooltiplight');
		$toolTip.html(`
			<div style="padding: 6px">
				<div class="chartist-tooltip-row">
					<span class="chartist-tooltip-col-center">${dateFormat}</span>
				</div>
				<div class="chartist-tooltip-row" style="margin-top: 5px; font-weight: 600">
					<span class="chartist-tooltip-col-left">Value</span>
					<span class="chartist-tooltip-col-right" style="color: rgb(15, 39, 89)">
						${formatCurrencySymbolDisplayInFront(value)}
					</span>
				</div>
			</div>
		`).show();
	}

	onChangeMonthClicked(isNextMonth) {
		let { monthOffset } = this.state;
		monthOffset = monthOffset + (isNextMonth ? 1 : -1);

		this.setState({ monthOffset }, () => {
			// this.props.fetchStatsData(this.state.monthOffset, true);
		});
	}

	updateSelectedDate() {
		const { dateFilterValue } = this.state;
		this.setState({
			showCustomDateRangeSelector: dateFilterValue === 'custom'
		})
		this.fetchData();
	}

	async onBackPressed() {
		await this.fetchData();
		await this.setState({subChartActive: false});
	}

	render() {
		const { isLoading, isLoadingAdditionalStats, footerData, errorOccurred, resources } = this.props;
		const {
			monthOffset, 
			canCreateInvoice, 
			customStartDate, 
			customEndDate, 
			chartData, 
			activeChartData, 
			dateFilterValue, 
			currentMonthName,
			subChartActive,
			lastMonthName,
			secondLastMonth,
			totalSalesSum,
			totalExpenseSum,
			showCustomDateRangeSelector,
			currQuarter,
			lastQuarter,
			secondLastQuarter
		} = this.state;

		let totalSeriesSum = 0;
		// let totalSalesSum = 0;
		// let totalExpenseSum = 0;

		if (chartData && chartData.series && chartData.series[0] && chartData.series[1]) {
			chartData.series.forEach(seriesObj => {
				// if(seriesObj.name === 'sales') {
				// 	totalSalesSum = seriesObj.data.reduce((sum, item) => sum + item.value, 0);
				// } else if(seriesObj.name === 'expenses') {
				// 	totalExpenseSum = seriesObj.data.reduce((sum, item) => sum + item.value, 0);
				// }
				seriesObj.data.forEach(dataObj => {
					totalSeriesSum += dataObj.value;
				});
			});
		}

		// if (monthOffset === 0 && totalSeriesSum === 0) {
		// 	footerData.turnoverCurrentYear = 70374.88;
		// 	footerData.turnoverPrevYear = 75234;
		// 	footerData.turnoverDiffPercentageYearly = -6;

		// 	footerData.surplusCurrentYear = 41456.88;
		// 	footerData.surplusPrevYear = 48224.12;
		// 	footerData.surplusDiffPercentageYearly = -14;

		// 	footerData.turnoverCurrentMonth = 1850;
		// 	footerData.turnoverPrevMonth = 1200;
		// 	footerData.turnoverDiffPercentageMonthly = 54;

		// 	footerData.surplusCurrentMonth = 1850;
		// 	footerData.surplusPrevMonth = 1000;
		// 	footerData.surplusDiffPercentageMonthly = 85;
		// }

		// const dateFirstOfMonth = formatDate(new Date(new Date().setDate(1)), 'YYYY-MM-DD', 'DD.MM.');
		const dateFirstOfMonth = formateClientDateMonth(new Date(new Date().setDate(1)));
		// const dateFirstOfPrevMonth = formatDate(
		// 	new Date(new Date(moment().subtract(1, 'months')).setDate(1)),
		// 	'YYYY-MM-DD',
		// 	'DD.MM.'
		// );
		const dateFirstOfPrevMonth = formateClientDateMonth(new Date(new Date(moment().subtract(1, 'months')).setDate(1)));
		// const dateToday = formatDate(new Date(), 'YYYY-MM-DD', 'DD.MM.');
		const dateToday = formateClientDateMonth(new Date());
		// const datePrevMonth = formatDate(moment().subtract(1, 'months'), 'YYYY-MM-DD', 'DD.MM.');
		const datePrevMonth = formateClientDateMonth(moment().subtract(1, 'months'));

        const dateOptions = [
            { label: currentMonthName, value: 'currMonth', group: 'month' },
			{ label: lastMonthName, value: 'lastMonth', group: 'month' },
			{ label: secondLastMonth, value: 'secondLastMonth', group: 'month' },
			{ label: `Quarter ${currQuarter}`, value: 'currQuarter', group: 'quarter' },
			{ label: `Quarter ${lastQuarter}`, value: 'lastQuarter', group: 'quarter' },
			{ label: `Quarter ${secondLastQuarter}`, value: 'secondLastQuarter', group: 'quarter' },
			{ label: 'Fiscal Year', value: 'fiscalYear', group: 'year' },
			{ label: 'Custom', value: 'custom', group: 'custom' },
        ]

		const content = errorOccurred ? (
			<WidgetErrorComponent
				reason={resources.saleDefaultErrorText}
				buttonTitle={resources.str_updateNow}
				onButtonClick={this.refresh.bind(this)}
			/>
		) : (
			<div>
				<div className="row box-header">
					<div className="col-xs-6">
						<div className="text-h4 u_mb_0" style={{fontSize: '22px'}}>{resources.dashboardSalesExpenditureStatistics}</div>
						{/* <div className="text-muted widget-subheadline">{resources.dashboardInformationForText} {chartData.headerYearLabel}</div> */}

						{ subChartActive && 
							<div className="back-button" onClick={this.onBackPressed.bind(this)}>
								<span className="tab-name">{`< Overview`}</span>
								<span className="sub-series-name"> / {activeChartData.title}</span>
							</div>
						}

						{ !subChartActive && 
							<div className="time-period-select">
								<SelectInputComponent
									allowCreate={false}
									notAsync={true}
									loadedOptions={dateOptions}
									value={dateFilterValue}
									icon={calenderIcon}
									containerClass="date-input"
									options={{
										clearable: false,
										noResultsText: false,
										labelKey: 'label',
										valueKey: 'value',
										matchProp: 'label',
										placeholder: 'Select Date',
										handleChange: async (option) => {
											await this.setState({dateFilterValue: option.value})
											this.updateSelectedDate();
										}
									}}
								/>
								{
									showCustomDateRangeSelector &&
									(
										<div className="start-end-date-selector-group">
											<DateInputComponent
												name={'date'}
												value={customStartDate.format('DD-MM-YYYY')}
												required={true}
												label={'Start Date'}
												noBorder={true}
												onChange={(name, value) => {
													this.setState({ customStartDate: moment(value, 'DD-MM-YYYY')})
													this.updateSelectedDate()
												}}
											/>
											<DateInputComponent
												name={'date'}
												value={customEndDate.format('DD-MM-YYYY')}
												required={true}
												label={'End Date'}
												noBorder={true}
												onChange={(name, value) => {
													this.setState({ customEndDate: moment(value, 'DD-MM-YYYY')})
													this.updateSelectedDate()
												}}
											/>
										</div>
									)
								}
							</div>
						}
						{/* <div className="date-selector-group" style={{display: 'flex', border: '1px solid #C4C4C4', width: 'fit-content', borderRadius: '4px', margin: '10px 0'}}>
							<DateInputComponent
								name={'date'}
								label={''}
								value={customStartDate.format('DD-MM-YYYY')}
								required={true}
								noBorder={true}
								onChange={async (name, value) => {
									this.setState({ customStartDate: moment(value, 'DD-MM-YYYY')})
									await this.updateSelectedDate({value: 'custom'})
								}}
							/>
						</div> */}
					</div>
					<div className="col-xs-6 bar-chart-legend">
						<div className="row">
							<div className="col-xs-6">
								<div className="text-center" style={{minWidth: '120px', border: '0.92px solid rgba(0,0,0,0.17)', borderRadius: '7.4px'}}>
									<div style={{padding: '12px 0px', backgroundColor: '#F2F4F6'}}>
										<p style={{margin: 0, fontSize: '12px'}}>Total Sales</p>
									</div>
									<div style={{borderTop: '0.92px solid rgba(0,0,0,0.17)', padding: '10px 0'}}>
										<p style={{padding: '0 0px', margin: 0, color: '#A2C62E', fontWeight: 600, fontSize: '18px'}}>{formatCurrencySymbolDisplayInFront(totalSalesSum)}</p>
									</div>
								</div>
							</div>
							<div className="col-xs-6 text-right">
								<div className="text-center" style={{minWidth: '120px', border: '0.92px solid rgba(0,0,0,0.17)', borderRadius: '7.4px'}}>
									<div style={{padding: '12px 0px', backgroundColor: '#F2F4F6'}}><p style={{margin: 0, fontSize: '12px'}}>Total Expenses</p></div>
									<div style={{borderTop: '0.92px solid rgba(0,0,0,0.17)', padding: '10px 0'}}>
										<p style={{padding: '0 0px', margin: 0, color: '#D94339', fontWeight: 600, fontSize: '18px'}}>{formatCurrencySymbolDisplayInFront(totalExpenseSum)}</p>
									</div>
								</div>
							</div>
						</div>
						{/* <div className="bar-chart-legend-sales text-muted">{resources.str_sales}</div>
						<div className="bar-chart-legend-expenses text-muted">{resources.str_expenses}</div> */}
					</div>
				</div>
				<div className="row box-header">
					<div className="col-xs-2"></div>
					<div className="col-xs-10">
						<div className="row" style={{justifyContent: 'right'}}>
							{ 
								!subChartActive
									? activeChartData.series &&
										activeChartData.series.map((seriesItem, index) => (
											<div key={index} className="col" style={{margin: '20px 10px 0 20px'}}>
												<span className="category-dot" style={{backgroundColor: `#${seriesItem.color}`}}></span>
												<span style={{fontSize: '14px', color: '#0079B3'}}>{seriesItem.name.toUpperCase()}</span>
											</div>
										))
									: activeChartData.series &&
									activeChartData.series[0].data.map((seriesItem, index) => (
										<div key={index} className="col" style={{margin: '20px 10px 0 20px', cursor: 'pointer'}} onClick={seriesItem.onLabelClick.bind(this)}>
											<span className="category-dot" style={{backgroundColor: `#${seriesItem.color}`}}></span>
											<span style={{fontSize: '14px', color: '#0079B3'}}>{seriesItem.name.toUpperCase()}</span>
											<SVGInline svg={redirectIcon} height="8px" width="8px" style={{marginLeft: '10px'}} />
										</div>
									))
							}
						</div>
					</div>
				</div>
				{monthOffset === 0 && totalSeriesSum === 0 ? (
					<div className="sales-expenses-placeholder-box">
						<div className="sales-expenses-placeholder-info">
							{resources.dashboardCreateYourFirstBill}
						</div>
						<ButtonComponent
							callback={() => {
								invoiz.router.navigate('/invoice/new');
							}}
							dataQsId="dashboard-salesExpenses-btn-createInvoice"
							label={resources.str_startedNow}
							buttonIcon="plus"
							disabled={!canCreateInvoice}
						/>
					</div>
				) : (
					<div className="bar-chart-wrapper">
						<LoaderComponent visible={isLoadingAdditionalStats} />
						<BarChartComponent
							target="salesExpensesStats"
							data={activeChartData}
							tooltipSelector=".ct-bar, .ct-label.ct-horizontal"
							onMouseEnter={($point, $toolTip) => this.onChartMouseEnter($point, $toolTip)}
							onCreated={ctx => this.onChartCreated(ctx)}
							onBarClick={this.onBarClick.bind(this)}
						/>

						{chartData.prevDataExist ? (
							<div
								ref="btnJumpPrevMonth"
								className="icon icon-arr_left hidden"
								onClick={() => this.onChangeMonthClicked()}
							/>
						) : null}

						{chartData.nextDataExist ? (
							<div
								ref="btnJumpNextMonth"
								className="icon icon-arr_right hidden"
								onClick={() => this.onChangeMonthClicked(true)}
							/>
						) : null}
					</div>
				)}
			</div>
		);

		return (
			<WidgetComponent
				loaderText={resources.saleLoaderText}
				loading={false}
				containerClass={`box-large-bottom dashboard-sales-expenses-wrapper ${
					monthOffset === 0 && totalSeriesSum === 0 ? 'no-data' : ''
				}`}
			>
				{content}
			</WidgetComponent>
		);
	}

	refresh() {
		// this.props.fetchStatsData(this.state.monthOffset);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};
const mapDispatchToProps = dispatch => {
	return {
		fetchStatsData: (monthOffset, isAdditionalDataRequest) => {
			dispatch(fetchStatsData(monthOffset, isAdditionalDataRequest));
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(DashboardSalesExpensesStatsComponent);
