import invoiz from 'services/invoiz.service';
import React from 'react';
import { connect } from 'react-redux';
import LoaderComponent from 'shared/loader/loader.component';
import { formatCurrency } from 'helpers/formatCurrency';
import StackedGroupBarChartComponent from 'shared/charts/stacked-group-bar-chart.component';
import { fetchCashflow } from 'redux/ducks/banking/financeCockpit';
import { isChromeSafari, isIE } from 'helpers/isBrowser';
import store from 'redux/store';

class FinanceCockpitCashflowStatsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			accounts: props.accounts,
			selectedAccountIds: props.selectedAccountIds,
			monthOffset: 0
		};

		this.storeSubscriber = store.subscribe(() => {
			const { initialSyncDone, initialSyncDoneOnStartup } = store.getState().banking.financeCockpit;

			if (initialSyncDone) {
				this.storeSubscriber();

				if (!initialSyncDoneOnStartup) {
					setTimeout(() => {
						this.props.fetchCashflow(this.state.selectedAccountIds, this.state.monthOffset);
					}, 3000);
				}
			}
		});
	}

	componentDidMount() {
		const { monthOffset, selectedAccountIds } = this.state;
		this.props.fetchCashflow(selectedAccountIds, monthOffset);
	}

	componentWillUnmount() {
		this.storeSubscriber();
	}

	onChartMouseEnter($point, $toolTip) {
		const { resources } = this.props;
		const parentChart1 = $point.closest('.stacked-group-bar-chart1');
		const parentChart2 = parentChart1.next('.stacked-group-bar-chart2');

		const pointInflowFixedTotal = parentChart1.find(`.ct-series-a line:eq(${$point.attr('ct:line-index')})`);
		const pointInflowVariable = parentChart1.find(`.ct-series-b line:eq(${$point.attr('ct:line-index')})`);
		const inflowFixed = pointInflowFixedTotal.attr('ct:value');
		const inflowTotal = pointInflowFixedTotal.attr('ct:meta');
		const inflowVariable = pointInflowVariable.attr('ct:value');

		const pointOutflowFixedTotal = parentChart2.find(`.ct-series-a line:eq(${$point.attr('ct:line-index')})`);
		const pointOutflowVariable = parentChart2.find(`.ct-series-b line:eq(${$point.attr('ct:line-index')})`);
		const outflowFixed = pointOutflowFixedTotal.attr('ct:value');
		const outflowTotal = pointOutflowFixedTotal.attr('ct:meta');
		const outflowVariable = pointOutflowVariable.attr('ct:value');

		let tooltipPointYRect = null;

		if (parseFloat(inflowTotal) >= parseFloat(outflowTotal)) {
			tooltipPointYRect = pointInflowVariable;
		} else {
			tooltipPointYRect = pointOutflowVariable;
		}

		if (tooltipPointYRect && !tooltipPointYRect[0]) {
			return;
		}

		const hoverAreaRect = $point[0].getBoundingClientRect();
		tooltipPointYRect = tooltipPointYRect[0].getBoundingClientRect();

		$toolTip
			.css({
				left: Math.round(hoverAreaRect.left + (isChromeSafari() ? 0 : 35)),
				top: Math.round(tooltipPointYRect.top) - 10 - 8 + (isIE() ? 12 : 0)
			})
			.html(
				`<div class="chartist-tooltip-row">
					<div class="chartist-tooltip-col col-left">
						<div class="chartist-tooltip-row text-muted col-headline">${resources.str_revenue}:</div>
						<div class="chartist-tooltip-row"><span class="chartist-tooltip-col-left">
							${resources.str_fix}:</span> <span class="chartist-tooltip-col-right amount-inflow">${formatCurrency(inflowFixed)}</span>
						</div>
						<div class="chartist-tooltip-row"><span class="chartist-tooltip-col-left">
							${resources.str_variable}:</span> <span class="chartist-tooltip-col-right amount-inflow">${formatCurrency(inflowVariable)}</span>
						</div>
						<div class="chartist-tooltip-row"><span class="chartist-tooltip-col-left">
							${resources.str_total}:</span> <span class="chartist-tooltip-col-right amount-inflow">${formatCurrency(inflowTotal)}</span>
						</div>
					</div>
					<div class="chartist-tooltip-col">
						<div class="chartist-tooltip-row text-muted col-headline">${resources.str_expenditure}:</div>
						<div class="chartist-tooltip-row"><span class="chartist-tooltip-col-left">
						${resources.str_fix}:</span> <span class="chartist-tooltip-col-right amount-outflow">${formatCurrency(outflowFixed)}</span>
						</div>
						<div class="chartist-tooltip-row"><span class="chartist-tooltip-col-left">
						${resources.str_variable}:</span> <span class="chartist-tooltip-col-right amount-outflow">${formatCurrency(outflowVariable)}</span>
						</div>
						<div class="chartist-tooltip-row"><span class="chartist-tooltip-col-left">
						${resources.str_total}:</span> <span class="chartist-tooltip-col-right amount-outflow">${formatCurrency(outflowTotal)}</span>
						</div>
					</div>
				</div>`
			)
			.show();
	}

	onChartCreated(ctx) {
		setTimeout(() => {
			if ($('.cashflowStats svg .ct-grids')[0]) {
				const gridStart = $('.cashflowStats svg .ct-labels .ct-vertical:last').outerWidth() + 13;
				$(this.refs.btnJumpPrevMonth).css('left', gridStart);
			}
		}, 0);
	}

	onChangeMonthClicked(monthOffset, isNextMonth) {
		monthOffset = monthOffset + (isNextMonth ? 1 : -1);

		this.setState({ monthOffset }, () => {
			this.props.fetchCashflow(this.state.selectedAccountIds, this.state.monthOffset);
		});
	}

	updateSelectedAccountIds(selectedAccountIds) {
		this.setState({ selectedAccountIds });
	}

	render() {
		const { accounts } = this.state;
		const { isLoadingCashflow, errorOccurredCashflow, cashflow, initialSyncDone, resources } = this.props;
		let monthOffset = this.state.monthOffset;
		let content = null;

		if (!accounts || isLoadingCashflow || !initialSyncDone) {
			content = (
				<div className="widgetContainer box box-large-bottom financecockpit-cashflow-stats">
					<LoaderComponent visible={true} text={resources.bankingtransactionLoadingText} />
				</div>
			);
		} else if (errorOccurredCashflow) {
			content = (
				<div className="widgetContainer box box-large-bottom financecockpit-cashflow-stats error-occured">
					<WidgetErrorComponent
						reason={resources.str_dataDefaultError}
						buttonTitle={resources.str_reload}
						onButtonClick={() => invoiz.router.reload()}
						noIcon={true}
					/>
				</div>
			);
		} else {
			if (cashflow.monthOffset !== undefined && cashflow.monthOffset !== null) {
				monthOffset = cashflow.monthOffset;
			}

			content = (
				<div className="widgetContainer box box-large-bottom financecockpit-cashflow-stats">
					<div className="row box-header">
						<div className="col-xs-6">
							<div className="box-headline u_mb_0">{resources.depositAndWithdrawls}</div>
							<div className="box-subheadline text-muted">{resources.overviewFixAndVariable}</div>
						</div>

						<div className="col-xs-6 bar-chart-legend">
							<div className="legend-inflow">
								<div className="legend-header">{resources.str_proceeds}</div>
								<div className="legend-detail">
									<div className="legend-subheader bar-chart-legend-inflow-fixed">{resources.str_fix}</div>
									<div className="legend-subheader bar-chart-legend-inflow-variable">{resources.str_variable}</div>
								</div>
							</div>

							<div className="legend-outflow">
								<div className="legend-header">{resources.str_payouts}</div>
								<div className="legend-detail">
									<div className="legend-subheader bar-chart-legend-outflow-fixed">{resources.str_fix}</div>
									<div className="legend-subheader bar-chart-legend-outflow-variable">{resources.str_variable}</div>
								</div>
							</div>
						</div>
					</div>

					{cashflow.series1.length > 0 ? (
						<div className="bar-chart-wrapper">
							<StackedGroupBarChartComponent
								wrapper="cashflowStats"
								target1="inflow-stats"
								target2="outflow-stats"
								data={cashflow}
								tooltipSelector=".ct-stacked-hover-area"
								onMouseEnter={($point, $toolTip) => this.onChartMouseEnter($point, $toolTip)}
								onChartCreated={ctx => this.onChartCreated(ctx)}
							/>

							<div
								ref="btnJumpPrevMonth"
								className="icon icon-arr_left"
								onClick={() => this.onChangeMonthClicked(monthOffset)}
							/>

							{monthOffset < 0 ? (
								<div
									ref="btnJumpNextMonth"
									className="icon icon-arr_right"
									onClick={() => this.onChangeMonthClicked(monthOffset, true)}
								/>
							) : null}
						</div>
					) : (
						<div className="empty-state">{resources.noDataAvailable}</div>
					)}
				</div>
			);
		}

		return <div className="col-xs-12">{content}</div>;
	}
}

const mapStateToProps = state => {
	const { isLoadingCashflow, errorOccurredCashflow, cashflow, initialSyncDone } = state.banking.financeCockpit;
	const { resources } = state.language.lang;
	return {
		isLoadingCashflow,
		errorOccurredCashflow,
		cashflow,
		initialSyncDone,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchCashflow: (selectedAccountIds, monthOffset) => {
			dispatch(fetchCashflow(selectedAccountIds, monthOffset));
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps,
	null,
	{ withRef: true }
)(FinanceCockpitCashflowStatsComponent);
