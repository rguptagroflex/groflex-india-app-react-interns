import React from 'react';
import Chartist from 'chartist';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatDateLong } from 'helpers/formatDate';
import { createChartTooltip } from 'helpers/createChartTooltip';
import { initTargetLinePlugin } from 'helpers/chartist/targetLinePlugin';
import { isChromeSafari, isIE, isFirefox } from 'helpers/isBrowser';
import config from 'config';

class LineChart extends React.Component {
	constructor(props) {
		super(props);

		initTargetLinePlugin(Chartist);

		this.lineChart = {};
		this.target = props.target;
		this.tooltipSelector = props.tooltipSelector;
		this.tooltipPositionTimer = null;
	}

	componentDidMount() {
		this.initChart();
	}

	componentWillUpdate(props) {
		const {
			data: { series: chartSeries }
		} = props;

		this.lineChart.update({
			series: chartSeries
		});
	}

	initChart() {
		const { data, onCreated } = this.props;

		const chartData = data;
		const chartDataValues = [];
		const chartDataRoundedValues = [];
		let chartRectY1 = 0;
		let axisYOffset = 30;
		let lowestChartValue = 0;
		let highestChartValue = 0;
		let highestChartValueLength = 2;

		if (chartData.series.length > 0) {
			chartData.series.forEach(seriesObj => {
				chartDataValues.push(seriesObj.value);
				chartDataRoundedValues.push(parseFloat(seriesObj.value));
			});

			lowestChartValue = Math.min.apply(null, chartDataValues);
			highestChartValue = chartDataValues.length > 0 ? Math.max.apply(null, chartDataValues) : 100;
			highestChartValueLength = Math.max.apply(null, chartDataRoundedValues).toString().length + 3;

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
					axisYOffset = 70;
					break;

				case 12:
					axisYOffset = 75;
					break;
			}
		}

		if (highestChartValueLength > 12) {
			axisYOffset = 85;
		}

		if ($(`.${this.target}`).length === 0) return;

		createChartTooltip({
			target: this.target,
			tooltipSelector: this.tooltipSelector,
			tooltipClass: 'fixed-tooltip tooltipWhite',
			onMouseEnter: () => {
				const $pointTargetLine = $(`.${this.target} .ct-target-line`);
				$pointTargetLine.addClass('visible');
			},
			onMouseLeave: () => {
				const points = $(`.${this.target} .ct-series .ct-point`);
				const $pointTargetLine = $(`.${this.target} .ct-target-line`);
				points.removeClass('visible');
				$pointTargetLine.removeClass('visible');
			},
			onMouseMove: (event, $toolTip) => {
				const { resources } = this.props;
				let x = event.pageX;
				const points = $(`.${this.target} .ct-series .ct-point`);
				points.removeClass('visible');

				if (isFirefox()) {
					x -= 5;
				} else if (isIE()) {
					x -= 10;
				}

				const $point = $.nearest({ x, y: event.pageY }, `.${this.target} .ct-point`, { onlyX: true });
				const $pointTargetLine = $(`.${this.target} .ct-target-line`);
				let tooltipRect = $point[0].getBoundingClientRect();
				const value = $point.attr('ct:value');
				const meta = $point.attr('ct:meta');

				let tooltipLeft = tooltipRect.left - $toolTip.width() / 2 - 8;
				let tooltipTop = tooltipRect.top - $toolTip.height() - tooltipRect.height - 28;

				if (isChromeSafari()) {
					tooltipLeft -= 4;
					tooltipTop -= 15;
				} else if (isIE()) {
					tooltipLeft += 5;
					tooltipTop -= 1;
				}

				$point.addClass('visible');

				$pointTargetLine.attr('x1', $point.attr('x1'));
				$pointTargetLine.attr('y1', chartRectY1);
				$pointTargetLine.attr('x2', $point.attr('x1'));
				$pointTargetLine.attr('y2', parseFloat($point.attr('y1')) + 5);

				$pointTargetLine.addClass('visible');

				if (parseFloat(value) === 0 && lowestChartValue === 0) {
					$pointTargetLine.removeClass('visible');
				}

				$toolTip
					.html(
						`<div>${formatDateLong(
							new Date(meta)
						)}</div><div>${resources.str_balance}: <span class="amount-value">${formatCurrency(value)}</span></div>`
					)
					.show();

				$toolTip.css({
					left: tooltipLeft,
					top: tooltipTop
				});

				clearTimeout(this.tooltipPositionTimer);

				this.tooltipPositionTimer = setTimeout(() => {
					tooltipRect = $point[0].getBoundingClientRect();
					tooltipLeft = tooltipRect.left - $toolTip.width() / 2 - 8;
					tooltipTop = tooltipRect.top - $toolTip.height() - tooltipRect.height - 28;

					if (isChromeSafari()) {
						tooltipLeft -= 4;
						tooltipTop -= 15;
					} else if (isIE()) {
						tooltipLeft += 5;
						tooltipTop -= 1;
					}

					$toolTip.css({
						left: tooltipLeft,
						top: tooltipTop
					});
				}, 30);
			}
		});

		this.lineChart = new Chartist.Line(
			`.${this.target}`,
			{
				labels: chartData.labels,
				series: [chartData.series]
			},
			{
				axisX: {
					offset: 40,
					showGrid: false,
					showLabel: true
				},
				axisY: {
					offset: axisYOffset,
					showGrid: true,
					showLabel: true,
					scaleMinSpace: 35,
					labelInterpolationFnc: value => {
						return `${parseFloat(value)} ${config.currencyFormat.symbol}`;
					}
				},
				low: lowestChartValue < 0 ? lowestChartValue : 0,
				high: highestChartValue,
				showArea: true,
				lineSmooth: Chartist.Interpolation.simple({
					divisor: 2
				}),
				fullWidth: true,
				height: 300,
				plugins: [
					Chartist.plugins.ctTargetLine({
						value: 0
					})
				]
			}
		);

		this.lineChart.on('created', ctx => {
			onCreated && onCreated(ctx);

			chartRectY1 = ctx.chartRect && ctx.chartRect.y1;

			const defs = ctx.svg.elem('defs');

			defs.elem('linearGradient', {
				id: 'lineChartGradient',
				x1: 0,
				y1: 1,
				x2: 0,
				y2: 0
			})
				.elem('stop', {
					offset: 0,
					'stop-color': 'rgba(28, 143, 241, 0.2)'
				})
				.parent()
				.elem('stop', {
					offset: 1,
					'stop-color': 'rgba(28, 143, 241, 0.5)'
				});

			this.fixLastHorizontalLabelPosition();

			setTimeout(() => {
				this.fixFirstHorizontalLabelPosition();
			}, 0);
		});
	}

	fixFirstHorizontalLabelPosition() {
		let firstHorizontalLabelIndex = -1;
		let secondHorizontalLabelIndex = -1;
		let firstHorizontalLabel = null;
		let firstHorizontalLabelClone = null;
		let secondHorizontalLabel = null;
		let firstHorizontalLabelRect = null;
		let firstHorizontalLabelCloneRect = null;
		let secondHorizontalLabelRect = null;

		$(`.${this.target} .ct-label.ct-horizontal.ct-end`).each((idx, elm) => {
			if (
				$(elm)
					.text()
					.trim().length > 0
			) {
				if (firstHorizontalLabelIndex !== -1 && secondHorizontalLabelIndex === -1) {
					secondHorizontalLabelIndex = idx;
				}

				if (firstHorizontalLabelIndex === -1) {
					firstHorizontalLabelIndex = idx;
				}
			}
		});

		firstHorizontalLabel = $(`.${this.target} .ct-label.ct-horizontal.ct-end:eq(${firstHorizontalLabelIndex})`);
		secondHorizontalLabel = $(`.${this.target} .ct-label.ct-horizontal.ct-end:eq(${secondHorizontalLabelIndex})`);

		if (firstHorizontalLabel[0]) {
			firstHorizontalLabelRect = firstHorizontalLabel[0].getBoundingClientRect();
			firstHorizontalLabelClone = firstHorizontalLabel
				.clone()
				.attr('style', '')
				.css({ 'font-size': 14 })
				.appendTo('body');
		}

		if (secondHorizontalLabel[0]) {
			secondHorizontalLabelRect = secondHorizontalLabel[0].getBoundingClientRect();
		}

		if (firstHorizontalLabelRect && secondHorizontalLabelRect) {
			firstHorizontalLabelCloneRect = firstHorizontalLabelClone[0].getBoundingClientRect();

			if (secondHorizontalLabelRect.left <= firstHorizontalLabelRect.left + firstHorizontalLabelCloneRect.width) {
				$(`.${this.target} .ct-label.ct-horizontal.ct-end:eq(${firstHorizontalLabelIndex + 10})`).text(
					secondHorizontalLabel.text()
				);
				secondHorizontalLabel.text(' ');
			}

			firstHorizontalLabelClone.remove();
		}
	}

	fixLastHorizontalLabelPosition() {
		const chartGridRect =
			$(`.${this.target}`).find('.ct-grids')[0] &&
			$(`.${this.target}`)
				.find('.ct-grids')[0]
				.getBoundingClientRect();
		let chartGridRight = 0;
		let rightLabelRect = null;
		let rightLabelRight = 0;

		if (chartGridRect) {
			chartGridRight = chartGridRect.left + chartGridRect.width;
		}

		let lastHorizontalLabelIndex = 0;
		let lastHorizontalLabelElm = null;
		let lastHorizontalLabelWidth = 0;

		$(`.${this.target} .ct-label.ct-horizontal.ct-end`).each((idx, elm) => {
			if (
				$(elm)
					.text()
					.trim().length > 0
			) {
				lastHorizontalLabelIndex = idx;
			}
		});

		lastHorizontalLabelElm = $(`.${this.target} .ct-label.ct-horizontal.ct-end:eq(${lastHorizontalLabelIndex})`);

		$(`#${this.target}-tempLastHorizontalLabelElm`).remove();

		if (lastHorizontalLabelElm) {
			const tempLastHorizontalLabelElm = $('<span/>', {
				id: `${this.target}-tempLastHorizontalLabelElm`,
				class: 'ct-label ct-horizontal ct-end'
			});

			tempLastHorizontalLabelElm.css({
				position: 'absolute',
				right:
					$(`.${this.target}`)[0].getBoundingClientRect().width -
					chartGridRect.width -
					($(`.${this.target} .ct-label.ct-vertical.ct-start:eq(0)`)[0].getBoundingClientRect().width + 20),
				bottom: 10
			});

			tempLastHorizontalLabelElm.text(lastHorizontalLabelElm.text());
			tempLastHorizontalLabelElm.appendTo(`.${this.target}`);

			lastHorizontalLabelWidth = tempLastHorizontalLabelElm[0].getBoundingClientRect().width;

			rightLabelRect = lastHorizontalLabelElm[0].getBoundingClientRect();
			rightLabelRight = rightLabelRect.left + lastHorizontalLabelWidth;

			if (rightLabelRight >= chartGridRight) {
				lastHorizontalLabelElm.hide();
			} else {
				$(`#${this.target}-tempLastHorizontalLabelElm`).remove();
			}
		}
	}

	render() {
		return (
			<div className={`line-chart-wrapper`}>
				<div className={`${this.target} chartist-line-chart`} />
			</div>
		);
	}
}

export default LineChart;
