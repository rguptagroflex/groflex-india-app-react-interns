import React from 'react';
import Chartist from 'chartist';
import { createChartTooltip } from 'helpers/createChartTooltip';
import { initStackedBarHoverAreaPlugin } from 'helpers/chartist/stackedBarHoverAreaPlugin';
import config from 'config';

class StackedGroupBarChartComponent extends React.Component {
	constructor(props) {
		super(props);

		initStackedBarHoverAreaPlugin(Chartist);

		this.chart1 = {};
		this.chart2 = {};
		this.wrapper = props.wrapper;
		this.target1 = props.target1;
		this.target2 = props.target2;
		this.tooltipSelector = props.tooltipSelector || '.ct-bar';
	}

	componentDidMount() {
		this.initChart();
	}

	componentWillUpdate(props) {
		this.updateChart(props.data);
	}

	getChartCommonOptions(visible, axisYOffset, seriesBarDistance, highestChartValue) {
		const axisY = {
			offset: axisYOffset,
			showGrid: visible,
			showLabel: visible,
			scaleMinSpace: 30,
			labelInterpolationFnc: value => {
				return `${value} ${config.currencyFormat.symbol}`;
			}
		};

		return {
			axisX: {
				offset: 40,
				showGrid: false,
				showLabel: visible
			},
			axisY,
			stackBars: true,
			low: 0,
			high: highestChartValue,
			seriesBarDistance,
			height: 260,
			plugins: visible ? [Chartist.plugins.ctStackedBarHoverArea()] : null
		};
	}

	updateChart(newChartData) {
		this.chart1.update({
			labels: newChartData.labels,
			series: newChartData.series1
		});

		this.chart2.update({
			labels: newChartData.labels,
			series: newChartData.series2
		});
	}

	initChart() {
		const { data, onMouseEnter, onCreated } = this.props;
		const chartData = data;
		const chartDataValues = [];
		let highestChartValue = 0;
		let highestChartValueLength = 2;
		let axisYOffset = 30;
		const seriesBarDistance = 42 / 2;

		if (chartData.series1.length > 0 && chartData.series2.length > 0) {
			chartData.series1.forEach((seriesObj, seriesIndex) => {
				seriesObj.data.forEach(dataObj => {
					if (dataObj.meta) {
						chartDataValues.push(dataObj.meta);
					}
				});
			});

			chartData.series2.forEach((seriesObj, seriesIndex) => {
				seriesObj.data.forEach(dataObj => {
					if (dataObj.meta) {
						chartDataValues.push(dataObj.meta);
					}
				});
			});

			highestChartValue = chartDataValues.length > 0 ? Math.max.apply(null, chartDataValues) : 100;
			highestChartValueLength =
				chartDataValues.length === 0 ? 5 : Math.max.apply(null, chartDataValues).toString().length + 3;

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
					axisYOffset = 60;
					break;

				case 9:
				case 10:
				case 11:
				case 12:
					axisYOffset = 70;
					break;
			}
		}

		if ($(`.${this.target1}`).length === 0 || $(`.${this.target2}`).length === 0) return;

		this.chart1 = new Chartist.Bar(
			`.${this.target1}`,
			{
				labels: chartData.labels,
				series: chartData.series1
			},
			this.getChartCommonOptions(true, axisYOffset, seriesBarDistance, highestChartValue)
		);

		this.chart2 = new Chartist.Bar(
			`.${this.target2}`,
			{
				labels: chartData.labels,
				series: chartData.series2
			},
			this.getChartCommonOptions(false, axisYOffset, seriesBarDistance, highestChartValue)
		);

		createChartTooltip({
			target: this.target1,
			tooltipSelector: this.tooltipSelector,
			tooltipClass: 'fixed-tooltip translate-left-top tooltipWhite',
			onMouseEnter,
			onMouseMove: () => null
		});

		this.chart1.on('created', context => {
			onCreated && onCreated(context);
		});
	}

	render() {
		return (
			<div className={`${this.wrapper}`}>
				<div className={`${this.target1} stacked-group-bar-chart1 chartist-bar-chart`} />
				<div className={`${this.target2} stacked-group-bar-chart2 chartist-bar-chart`} />
			</div>
		);
	}
}

export default StackedGroupBarChartComponent;
