import React from 'react';
import Chartist from 'chartist';
import ChartistSliceDonutMargin from 'chartist-plugin-slicedonutmargin';
import isFeatureSupported from 'helpers/isFeatureSupported';
import { formatCurrencyTruncated, formatCurrencySymbolDisplayInFront } from 'helpers/formatCurrency';
import { createChartTooltip } from 'helpers/createChartTooltip';

class TopSalesDonutChart extends React.Component {
	constructor(props) {
		super(props);
		const { totalSalesSum } = this.props;

		this.donutChart = {};
		this.isSmilSupported = isFeatureSupported('smil');
		this.totalSalesSum = totalSalesSum ? formatCurrencySymbolDisplayInFront(totalSalesSum) : formatCurrencySymbolDisplayInFront(0);
		this.target = props.target;
	}

	componentDidMount() {
		this.initChart();
	}

	componentWillUpdate(props) {
		const {
			data: { series: chartSeries },
			totalSalesSum
		} = props;

		this.donutChart.update({
			series: chartSeries
		});

		this.totalSalesSum = totalSalesSum ? formatCurrencySymbolDisplayInFront(totalSalesSum) : formatCurrencySymbolDisplayInFront(0);
	}

	initChart() {
		let series = [];
		const {
			data: { series: chartSeries }
		} = this.props;

		if ($(`.${this.target}`).length === 0) return;

		if (chartSeries.length < 0) {
			series.push({
				value: 1
			});
		} else {
			series = chartSeries;
		}

		this.createTooltip(chartSeries);

		this.donutChart = new Chartist.Pie(
			`.${this.target}`,
			{
				series
			},
			{
				donut: true,
				showLabel: false,
				labelOffset: 10,
				plugins: [
					ChartistSliceDonutMargin({
						sliceMargin: chartSeries.length === 1 ? 0 : 4
					})
				]
			}
		);

		this.donutChart.on('draw', evt => this.onChartDataEventRendered(evt));
	}

	createTooltip() {
		createChartTooltip({
			target: this.target,
			tooltipSelector: '.ct-slice-donut',
			onMouseEnter: ($point, $toolTip) => {
				const value = $point.attr('ct:value');
				const meta = $point.attr('ct:meta');
				const seriesName = $point.parent().attr('ct:series-name');

				$toolTip
					.removeClass('tooltip-sales-top1')
					.removeClass('tooltip-sales-top2')
					.removeClass('tooltip-sales-top3')
					.removeClass('tooltip-sales-top4')
					.removeClass('tooltip-sales-top5');
				$toolTip.addClass('tooltip-' + seriesName);

				$toolTip.html(`${meta}<br>${formatCurrencySymbolDisplayInFront(value)}`).show();
			}
		});
	}

	onChartDataEventRendered(data) {
		const seriesLength = data.group.parent().querySelectorAll('g').svgElements.length;

		if (data.type === 'slice') {
			data.element.attr({
				'data-slicemargin': seriesLength === 1 ? 0 : 4
			});
		}
	}

	render() {
		return (
			<div className="col-xs-7">
				<div className={`donut-chart-wrapper`}>
					<div className={`${this.target} chartist-donut-chart`} />
					<div className="chartLabel chartLabel_totalSalesSum">
						<span>{this.props.stringTotal}</span>
					</div>
					<div className="chartLabel chartLabel_totalSalesSum_value">
						<span>{this.totalSalesSum}</span>
					</div>
				</div>
			</div>
		);
	}
}

export default TopSalesDonutChart;
