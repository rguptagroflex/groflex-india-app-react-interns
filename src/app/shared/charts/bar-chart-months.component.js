import React from 'react';
import _ from 'lodash';
import Chartist from 'chartist';

class BarChartMonthsComponent extends React.Component {
	constructor(props) {
		super(props);
		this.chart = {};
		this.target = props.target;
	}

	componentDidMount() {
		setTimeout(() => {
			this.initChart();
		});
	}

	componentWillUpdate(props) {
		this.updateChart(props.data);
	}

	getMonthArray(chartData) {
		const monthOrder = _.pluck(chartData, 'month');

		let monthArray = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
		monthArray = monthOrder.map(itm => monthArray[itm - 1]);

		return monthArray;
	}

	updateChart(newChartData) {
		const seriesData = _.pluck(newChartData, 'sales');

		if (this.chart.update) {
			this.chart.update({
				labels: this.getMonthArray(newChartData),
				series: [seriesData]
			});
		}
	}

	initChart() {
		const { data } = this.props;
		const chartData = data;
		const seriesData = _.pluck(chartData, 'sales');

		if ($(`.${this.target}`).length === 0) return;

		this.chart = new Chartist.Bar(
			`.${this.target}`,
			{
				labels: this.getMonthArray(chartData),
				series: [seriesData]
			},
			{
				low: 0
			}
		);
	}

	render() {
		return <div className={`${this.target} chart barChartColor`} />;
	}
}

export default BarChartMonthsComponent;
