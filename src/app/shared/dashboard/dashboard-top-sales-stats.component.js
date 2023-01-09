import invoiz from 'services/invoiz.service';
import React from 'react';
import { connect } from 'react-redux';
import { dateConstants } from 'helpers/constants';
import WidgetComponent from 'shared/dashboard/components/widget.component';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import TopSalesDonutChart from 'shared/dashboard/components/top-sales-donut-chart.component';
import TabInputComponent from 'shared/inputs/tab-input/tab-input.component';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import ButtonComponent from 'shared/button/button.component';
import { formatCurrencySymbolDisplayInFront } from 'helpers/formatCurrency';

import { fetchStatsData } from 'redux/ducks/dashboard/topSalesStats';
import userPermissions from 'enums/user-permissions.enum';

const { YEAR: STATE_YEAR, MONTH: STATE_MONTH } = dateConstants;
const TOP_SALES_TYPES = {
	customers: 'customers',
	// articles: 'articles',
	customerCategories: 'customerCategories'
	// articleCategories: 'articleCategories'
};

class DashboardTopSalesStatsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			salesType: TOP_SALES_TYPES.customers,
			periodType: STATE_YEAR,
			canCreateInvoice: null
			
		};
	}

	componentDidMount() {
		this.refresh();
		this.setState({
			canCreateInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_INVOICE)
		});
	}

	createChartData(salesType) {
		const { periodType } = this.state;
		const { statsData } = this.props;

		const chartData = {
			series: [],
			totalSalesSum: 0
		};

		if (statsData[salesType] && statsData[salesType][periodType]) {
			statsData[salesType][periodType].forEach((item, index) => {
				chartData.series.push({
					name: `sales-top${index + 1}`,
					meta: item.name,
					className: `ct-series-sales-top${index + 1}`,
					data: item.value
				});
				chartData.totalSalesSum += item.value;
			});
		}
		return chartData;
	}

	getSalesTypeSelectOptions() {
		const onChange = selectedOption => {
			this.setState({ salesType: selectedOption.value });
		};

		return {
			searchable: false,
			placeholder: '',
			labelKey: 'label',
			valueKey: 'value',
			clearable: false,
			backspaceRemoves: false,
			handleChange: onChange,
			openOnFocus: false
		};
	}

	onTabInputChange(state) {
		this.setState({ periodType: state });
	}

	render() {
		const { salesType, periodType, canCreateInvoice } = this.state;
		const { isLoading, errorOccurred, resources } = this.props;

		const chartData = this.createChartData(salesType);

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
						<div className="text-h5 u_mb_0">{resources.dashboardSalesAfterText}:</div>
					</div>
					<div className="col-xs-6">
						<TabInputComponent
							key="toggleYearMonth"
							items={[{ label: resources.str_year, value: STATE_YEAR }, { label: resources.str_month, value: STATE_MONTH }]}
							value={periodType}
							componentClass="dashboard-tab-input"
							dataQsId="dashboard-topSalesStats-tabs-yearMonth"
							onChange={e => this.onTabInputChange(e)}
						/>
					</div>
				</div>
				<div className="row top-sales-select-row">
					<div className="col-xs-6">
						<SelectInputComponent
							ref="topSalesCategorySelectInput"
							name="topSalesCategorySelectInput"
							allowCreate={false}
							notAsync={true}
							options={this.getSalesTypeSelectOptions()}
							value={salesType}
							loadedOptions={[
								{
									label: resources.str_customer,
									value: TOP_SALES_TYPES.customers
								},
								// {
								// 	label: resources.str_article,
								// 	value: TOP_SALES_TYPES.articles
								// },
								{
									label: resources.str_customerCategory,
									value: TOP_SALES_TYPES.customerCategories
								}
								// ,
								// {
								// 	label: resources.str_articleCategory,
								// 	value: TOP_SALES_TYPES.articleCategories
								// }
							]}
						/>
					</div>
				</div>
				{chartData.series.length > 0 ? (
					<div className="row">
						<TopSalesDonutChart
							target="topSalesStats"
							data={chartData}
							totalSalesSum={chartData.totalSalesSum}
							stringTotal={resources.str_total}
						/>
						<div className="col-xs-5">
							<div className="top-sales-summary-table">
								{chartData && chartData.series
									? chartData.series.map((seriesObj, index) => {
										return (
											<div className="table-row" key={index}>
												<div className="table-subrow1">
													<div className={`row-value sales-top${index + 1}`}>
														{seriesObj.meta}
													</div>
												</div>
												<div className="table-subrow2 text-muted">
													{resources.str_sales}: {formatCurrencySymbolDisplayInFront(seriesObj.data)}
												</div>
											</div>
										);
									  })
									: null}
							</div>
						</div>
					</div>
				) : (
					<div className="row">
						<div className="col-xs-12">
							<div className="top-sales-placeholder-box">
								<div className="top-sales-placeholder-info">
									{resources.dashboardNoRevenueForPeriod}
								</div>
								<ButtonComponent
									callback={() => {
										invoiz.router.navigate('/invoice/new');
									}}
									dataQsId="dashboard-topSales-btn-createInvoice"
									label={resources.dashboardNowGenerateSales}
									buttonIcon="plus"
									disabled={!canCreateInvoice}
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		);

		return (
			<WidgetComponent
				loaderText={resources.saleLoaderText}
				loading={isLoading}
				containerClass="box-large-bottom dashboard-top-sales-stats-wrapper"
			>
				{content}
			</WidgetComponent>
		);
	}

	refresh() {
		this.props.fetchStatsData();
	}
}

const mapStateToProps = state => {
	const { isLoading, errorOccurred, statsData } = state.dashboard.topSalesStats;
	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		statsData,
		resources
	};
};
const mapDispatchToProps = dispatch => {
	return {
		fetchStatsData: () => {
			dispatch(fetchStatsData());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(DashboardTopSalesStatsComponent);
