import React from 'react';
import { connect } from 'react-redux';
import { dateConstants } from 'helpers/constants';
import WidgetComponent from 'shared/dashboard/components/widget.component';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import TopSalesDonutChart from 'shared/dashboard/components/top-sales-donut-chart.component';
import { formatCurrencyTruncated, formatCurrencySymbolDisplayInFront } from 'helpers/formatCurrency';

import { fetchQuotationDayStatsData } from 'redux/ducks/dashboard/invoiceOfferStats';

const { YEAR: STATE_YEAR } = dateConstants;
const TOP_SALES_TYPES = {
	customers: 'customers',
	articles: 'articles',
	customerCategories: 'customerCategories',
	articleCategories: 'articleCategories'
};

class DashboardQuotationComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			salesType: TOP_SALES_TYPES.customers,
			periodType: STATE_YEAR
		};
	}

	componentDidMount() {
		this.refresh();
	}

	createChartData() {
		const { quotationStatsData } = this.props;

		const chartData = {
			series: [],
			totalSalesSum: 0
		};

		if (quotationStatsData.lessThanThirtyDays > 0) {
			chartData.series.push({
				className: 'ct-series-sales-top1',
				data: quotationStatsData.lessThanThirtyDays,
				meta: 'less than 30 days',
				name: 'sales-top1'
			});
		}

		if (quotationStatsData.thirtyOneToNinetyDays > 0) {
			chartData.series.push({
				className: 'ct-series-sales-top2',
				data: quotationStatsData.thirtyOneToNinetyDays,
				meta: '31-90 days',
				name: 'sales-top2'
			});
		}

		if (quotationStatsData.ninetyOneToOneEightyDays > 0) {
			chartData.series.push({
				className: 'ct-series-sales-top3',
				data: quotationStatsData.ninetyOneToOneEightyDays,
				meta: '91-180 days',
				name: 'sales-top3'
			});
		}

		if (quotationStatsData.moreThanOneEightyDays > 0) {
			chartData.series.push({
				className: 'ct-series-sales-top4',
				data: quotationStatsData.moreThanOneEightyDays,
				meta: 'more than 180 days',
				name: 'sales-top4'
			});
		}
		chartData.totalSalesSum = quotationStatsData.lessThanThirtyDays + quotationStatsData.thirtyOneToNinetyDays + quotationStatsData.ninetyOneToOneEightyDays + quotationStatsData.moreThanOneEightyDays;

		return chartData;
	}

	render() {
		const { isLoading, errorOccurred, resources, quotationStatsData } = this.props;

		const quotationChartData = this.createChartData();

		const chartData = {
			series: [
				{
					data: quotationStatsData.lessThanThirtyDays,
					meta: 'less than 30 days'
				},
				{
					data: quotationStatsData.thirtyOneToNinetyDays,
					meta: '31-90 days'
				},
				{
					data: quotationStatsData.ninetyOneToOneEightyDays,
					meta: '91-180 days'
				},
				{
					data: quotationStatsData.moreThanOneEightyDays,
					meta: 'more than 180 days'
				}
			]
		};

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
						<div className="text-h5 u_mb_0">{resources.dashboardTopSalesHeading}</div>
					</div>
				</div>
				{chartData.series.length > 0 ? (
					<div className="row">
						<TopSalesDonutChart
							target="topSalesStats1"
							data={quotationChartData}
							totalSalesSum={quotationChartData.totalSalesSum}
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
													{resources.str_revenue}: {formatCurrencySymbolDisplayInFront(seriesObj.data)}
												</div>
											</div>
										);
									  })
									: null}
							</div>
						</div>
					</div>
				) : (
					null
				)}
			</div>
		);

		return (
			<WidgetComponent
				loaderText={resources.str_dataLoader}
				loading={isLoading}
				containerClass="box-large-bottom dashboard-quotation-wrapper"
			>
				{content}
			</WidgetComponent>
		);
	}

	refresh() {
		this.props.fetchQuotationDayStatsData();
	}
}

const mapStateToProps = state => {
	const { isLoading, errorOccurred, quotationStatsData } = state.dashboard.invoiceOfferStats;
	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		quotationStatsData,
		resources
	};
};
const mapDispatchToProps = dispatch => {
	return {
		fetchQuotationDayStatsData: () => {
			dispatch(fetchQuotationDayStatsData());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(DashboardQuotationComponent);
