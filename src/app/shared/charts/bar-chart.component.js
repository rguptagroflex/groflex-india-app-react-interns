import React from 'react';
import Chartist from 'chartist';
import { createChartTooltip } from 'helpers/createChartTooltip';
import config from 'config';
import { formatCurrencySymbolDisplayInFront } from 'helpers/formatCurrency';

class BarChartComponent extends React.Component {
	constructor(props) {
		super(props);
		this.chart = {};
		this.chartData = props.data;
		this.target = props.target;
		this.tooltipSelector = props.tooltipSelector || '.ct-bar';
	}

	componentDidMount() {
		this.initChart();
	}

	componentWillUpdate(props) {
		this.updateChart(props.data);
	}

	updateChart(newChartData) {
		this.chartData = newChartData
		this.chart.update({
			labels: newChartData.labels,
			series: newChartData.series
		});
		this.initChart();
	}

	initChart() {
		const { data, onMouseEnter, onCreated, onBarClick } = this.props;
		const chartData = this.chartData;
		const chartDataValues = [];
		let barStrokeWidth = 20;
		let highestChartValueLength = 2;
		let axisYOffset = 30;
		let chartSeriesMonthLength = 0;
		let seriesBarDistance = 10;

		// console.log('chartData.series', chartData.series)

		if(!chartData.series) return;

			barStrokeWidth = 50;
			if(chartData.series[0].data.length >= 6) barStrokeWidth = 20;

			if (chartData.series.length > 0) {
				chartData.series.forEach((seriesObj, seriesIndex) => {
					seriesObj.data.forEach(dataObj => {
						chartDataValues.push(Math.round(dataObj.value));

						if (seriesIndex === 0) {
							chartSeriesMonthLength++;
						}
					});
				});
				switch (chartSeriesMonthLength) {
					case 1:
					case 2:
						seriesBarDistance = 130 / 2;
						break;

					case 3:
						seriesBarDistance = 108 / 2;
						break;

					case 4:
						seriesBarDistance = 86 / 2;
						break;

					case 5:
						seriesBarDistance = 64 / 2;
						break;

					case 6:
						seriesBarDistance = 42 / 2;
						break;
				}

				if (chartSeriesMonthLength >= 7) {
					chartSeriesMonthLength = 'max';
					seriesBarDistance = 10;
				}

				highestChartValueLength = Math.max.apply(null, chartDataValues).toString().length + 3;
				switch (highestChartValueLength) {
					case 1:
					case 2:
						axisYOffset = 25;
						break;

					case 3:
						axisYOffset = 35;
						break;

					case 4:
						axisYOffset = 45;
						break;

					case 5:
						axisYOffset = 50;
						break;

					case 6:
						axisYOffset = 55;
						break;

					case 7:
					case 8:
					case 9:
						axisYOffset = 65;
						break;
					case 10:
						axisYOffset = 75;
						break;
				}

				if (highestChartValueLength >= 11) {
					axisYOffset = 100;
				}
			}
		

		if ($(`.${this.target}`).length === 0) return;

		$(`.${this.target}`).addClass('chart-series-count-' + chartSeriesMonthLength);

		this.chart = new Chartist.Bar(
			`.${this.target}`,
			{
				labels: chartData.labels,
				series: chartData.series
			},
			{
				axisX: {
					offset: 50,
					showGrid: false,
					showLabel: true
				},
				axisY: {
					offset: axisYOffset,
					showGrid: true,
					showLabel: true,
					scaleMinSpace: 30,
					labelInterpolationFnc: value => {
						return `${formatCurrencySymbolDisplayInFront(value)}`;
					}
				},
				low: 0,
				seriesBarDistance: barStrokeWidth + seriesBarDistance,
				height: 260
			}
		);

		createChartTooltip({
			target: this.target,
			tooltipSelector: this.tooltipSelector,
			onMouseEnter
		});

		this.chart.on('draw', data => {
			onBarClick(data);

			if (data.type === 'bar') {

				data.element._node.style["stroke-width"] = `${barStrokeWidth}px`;

				// animate the bars from bottom to top
				data.element.animate({
					y2: {
						dur: 200,
						from: data.y1,
						to: data.y2,
						easing: this.chart.svg.easeOutQuint
					},
					opacity: {
						dur: 200,
						from: 0,
						to: 1,
						easing: this.chart.svg.easeOutQuint
					}
				});
			}
		});

		this.chart.on('created', ctx => {
			onCreated && onCreated(ctx);

			const groups = ctx.svg.querySelectorAll('g.ct-series').svgElements;

			groups.forEach((group, groupIndex) => {
				group.querySelectorAll('line').svgElements.forEach((line, lineIndex) => {
					if (line.attr('ct:value') === '0') {
						// groups[groupIndex === 0 ? 1 : 0]
						// 	.querySelectorAll('line')
						// 	.svgElements[lineIndex].attr({ 'data-realign': groupIndex === 0 ? 'left' : 'right' });
					}
				});
			});
		});
	}

	render() {
		return <div className={`${this.target} chartist-bar-chart`} />;
	}
}

export default BarChartComponent;
