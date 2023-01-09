import React from 'react';
import Chartist from 'chartist';
import isFeatureSupported from 'helpers/isFeatureSupported';
import { formatCurrencyTruncated, formatCurrency, formatCurrencySymbolDisplayInFront } from 'helpers/formatCurrency';
import { createChartTooltip } from 'helpers/createChartTooltip';

const DONUT_CHART_DEFAULT_STROKE_WIDTH = 60;
const DONUT_CHART_CUSTOM_STROKE_WIDTH = 80;
const DONUT_CHART_PADDING = DONUT_CHART_CUSTOM_STROKE_WIDTH - DONUT_CHART_DEFAULT_STROKE_WIDTH;
const DONUT_CHART_STATES = {
	INIT: 'chartState_init',
	RENDERED: 'chartState_rendered'
};

class TaxEstimationDonutChart extends React.Component {
	constructor(props) {
		super(props);
		const { netProfit, grossTurnover } = this.props;

		this.donutChart = {};
		this.donutChartInnerCircle = {};
		this.donutChartStartAngle = 0;
		this.isSmilSupported = isFeatureSupported('smil');
		this.netProfit = netProfit ? formatCurrencySymbolDisplayInFront(netProfit) : 0;
		this.grossTurnover = grossTurnover ? formatCurrencySymbolDisplayInFront(grossTurnover) : 0;
		this.target = props.target;

		this.state = {
			currentChartState: DONUT_CHART_STATES.INIT
		};
	}

	componentDidMount() {
		this.initChart();
	}

	componentWillUpdate(props) {
		if (this.state.currentChartState === DONUT_CHART_STATES.RENDERED) {
			this.updateChart(props);
		}
	}

	updateChart({ data: { series }, netProfit, grossTurnover }) {
		this.netProfit = netProfit ? formatCurrencySymbolDisplayInFront(netProfit) : 0;
		this.grossTurnover = grossTurnover ? formatCurrencySymbolDisplayInFront(grossTurnover) : 0;
		this.donutChartStartAngle = 0;

		this.donutChart.off('draw', evt => this.onChartDataEventRendered(evt));

		this.setState({
			currentChartState: DONUT_CHART_STATES.INIT
		});

		this.initChart(true);
	}

	initChart(isUpdate) {
		let series = [];
		const {
			data: { series: chartSeries }
		} = this.props;

		if ($(`.${this.target}`).length === 0 || $(`.${this.target}_innerCircle`).length === 0) return;

		if (chartSeries.length <= 0) {
			series.push({
				value: 1
			});
		} else {
			series = chartSeries;
		}

		if (!isUpdate) {
			this.createTooltip(chartSeries);
		}

		this.donutChartInnerCircle = new Chartist.Pie(
			`.${this.target}_innerCircle`,
			{
				series: [
					{
						className: 'ct-inner-circle',
						data: 1
					}
				]
			},
			{
				donut: false,
				chartPadding:
					DONUT_CHART_CUSTOM_STROKE_WIDTH * 2 - DONUT_CHART_DEFAULT_STROKE_WIDTH - DONUT_CHART_PADDING / 2,
				showLabel: false
			}
		);

		this.donutChart = new Chartist.Pie(
			`.${this.target}`,
			{
				series
			},
			{
				donut: true,
				chartPadding: DONUT_CHART_PADDING,
				startAngle: this.donutChartStartAngle,
				showLabel: false,
				labelOffset: 10
			}
		);

		this.donutChart.on('created', data => {
			setTimeout(() => {
				if (this.state.currentChartState === DONUT_CHART_STATES.INIT) {
					this.donutChart.off('draw', evt => this.onChartDataEventInit(evt));
					this.donutChart.on('draw', evt => this.onChartDataEventRendered(evt));
					this.donutChart.update(null, { startAngle: this.donutChartStartAngle }, true);

					if (this.refs.donutChartWrapper) {
						this.setState({
							currentChartState: DONUT_CHART_STATES.RENDERED
						});
					}
				}
			}, 0);
		});

		this.donutChart.on('draw', evt => this.onChartDataEventInit(evt));
	}

	createTooltip(chartSeries) {
		createChartTooltip({
			tooltipClass: 'tooltipDarkgray',
			target: this.target,
			tooltipSelector: '.ct-slice-donut',
			onMouseEnter: ($point, $toolTip) => {
				const value = $point.attr('ct:value');
				const meta = $point.attr('ct:meta');
				const seriesName = $point.parent().attr('ct:series-name');

				if (seriesName === 'netProfit') {
					$toolTip.hide();
				} else {
					if (chartSeries.length !== 0) {
						$toolTip.html(`${meta}<br>${formatCurrency(value)}`).show();
					}
				}
			}
		});
	}

	onChartDataEventInit(data) {
		if (data.type === 'slice') {
			if (data.series && data.series.name && data.series.name === 'netProfit') {
				this.donutChartStartAngle = 360 - data.endAngle / 2;
			}
		}
	}

	onChartDataEventRendered(data) {
		if (this.isSmilSupported && data.type === 'slice') {
			const pathLength = data.element._node.getTotalLength();

			data.element.attr({
				'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
			});

			const animationDefinition = {
				'stroke-dashoffset': {
					id: 'anim' + data.index,
					dur: 500,
					from: -pathLength + 'px',
					to: '0px',
					easing: Chartist.Svg.Easing.easeOutQuint,
					fill: 'freeze'
				}
			};

			if (data.index !== 0) {
				animationDefinition['stroke-dashoffset'].begin = 'anim' + (data.index - 1) + '.end';
			}

			data.element.attr({
				'stroke-dashoffset': -pathLength + 'px'
			});

			data.element.animate(animationDefinition, false);
		}
	}

	render() {
		const { resources } = this.props;
		return (
			<div className="col-xs-7" ref={'donutChartWrapper'}>
				<div className={`donut-chart-wrapper`}>
					<div className={`${this.target} chartist-donut-chart ${this.state.currentChartState}`} />
					<div className={`${this.target}_innerCircle chartist-donut-chart donutChartPlaceholder`} />
					<div className="chartLabel chartLabel_netProfit_value">
						<span>{this.netProfit}</span>
					</div>
					<div className="chartLabel chartLabel_netProfit">
						<span>{resources.str_yours}</span>
					</div>
					<div className="chartLabel chartLabel_grossTurnover_value">
						<span>{this.grossTurnover}</span>
					</div>
					<div className="chartLabel chartLabel_grossTurnover">
						<span>{resources.str_sales}</span>
					</div>
				</div>
			</div>
		);
	}
}

export default TaxEstimationDonutChart;
