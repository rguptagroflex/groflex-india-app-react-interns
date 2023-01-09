import React from 'react';
import move from 'move-js';
import { formatCurrency } from 'helpers/formatCurrency';

const COLOR_CURRENT_POSITIVE = '#1c7bf1';
const COLOR_CURRENT_NEGATIVE = '#fa6e6e';
const COLOR_CURRENT_FALLING_NEGATIVE = '#1c7bf1';
const COLOR_EXPECTED_POSITIVE = '#529bf6';
const COLOR_EXPECTED_NEGATIVE = '#fa6e6e';
const COLOR_EXPECTED_MORE_NEGATIVE = '#bf0000';

const ANIMATION_DELAY = 1500;

class BarometerComponent extends React.Component {
	constructor(props) {
		super(props);

		const { currentValue, expectedValue } = this.props;
		const difference = expectedValue - currentValue;
		const increase = difference / currentValue;

		this.state = {
			currentValue: this.props.currentValue || 0,
			expectedValue: this.props.expectedValue || 0,
			difference,
			increase,
			radius: this.props.radius || 115,
			lineWidth: this.props.lineWidth || 18,
			offset: this.props.offset || 50,
			isTodayLabelLeft: false,
			calculated: false
		};

		this.canvas = null;
		this.context = null;
		this.angleStartMultiplier = 0.8;
		this.angleEndMultiplier = 2.2;
		this.angleDistance = this.angleEndMultiplier - this.angleStartMultiplier;
		this.shouldAnimate = true;
	}

	componentDidMount() {
		this.drawValues();
	}

	componentWillUnmount() {
		this.shouldAnimate = false;
	}

	render() {
		const { resources } = this.props;
		const canvasDimension = this.state.radius * 2 + this.state.lineWidth + this.state.offset;

		const needleWrapperStyle = {
			width: canvasDimension,
			height: canvasDimension
		};

		const needleStyle = {
			width: 2 * (this.state.radius * 0.8)
		};

		const needleStyle2 = {
			width: 2 * (this.state.radius * 0.8)
		};

		let difference;
		const differenceCssClass = 'barometer-value-difference';

		switch (true) {
			case this.state.difference > 0:
				difference = (
					<div className={differenceCssClass}>
						<div className="rotatable arrow-up">
							<i className="icon icon-pfeil" />
						</div>
						<div className="difference-text">+{formatCurrency(this.state.difference)}</div>
					</div>
				);
				break;
			case this.state.difference === 0:
				difference = (
					<div className={differenceCssClass}>
						<div className="rotatable arrow-mid">
							<i className="icon icon-pfeil" />
						</div>
						<div className="difference-text">{formatCurrency(this.state.difference)}</div>
					</div>
				);
				break;
			case this.state.difference < 0:
				difference = (
					<div className={differenceCssClass}>
						<div className="rotatable arrow-down">
							<i className="icon icon-pfeil" />
						</div>
						<div className="difference-text">-{formatCurrency(Math.abs(this.state.difference))}</div>
					</div>
				);
				break;
		}

		const nextMonth = resources.monthNames[new Date().getMonth()];

		const labelToday = (
			<div>
				<span>{resources.str_balanceToday}</span>
				<div className={`barometer-label-value`}>{formatCurrency(this.state.currentValue)}</div>
			</div>
		);

		const labelExpected = (
			<div className={this.state.expectedValue < 0 && 'barometer-value-negative'}>
				<span>{resources.str_endBalance} {nextMonth}</span>
				<div className={`barometer-label-value`}>{formatCurrency(this.state.expectedValue)}</div>
			</div>
		);

		return (
			<div className="barometer-component-wrapper">
				<div className="barometer-label-left">
					{this.state.calculated && (this.state.isTodayLabelLeft ? labelToday : labelExpected)}
				</div>
				<div className="barometer-label-right">
					{this.state.calculated && (this.state.isTodayLabelLeft ? labelExpected : labelToday)}
				</div>

				<div className="canvas-wrapper" style={{ width: canvasDimension }}>
					<canvas id="barometer-canvas" width={canvasDimension} height={canvasDimension} />
					<div className="needle-wrapper" style={needleWrapperStyle}>
						<div className="needle">
							<img style={needleStyle} src="/assets/images/svg/zeiger_2.svg" />
						</div>
					</div>
					<div className="needle-wrapper" style={needleWrapperStyle}>
						<div className="needle2">
							<img style={needleStyle2} src="/assets/images/svg/zeiger_1.svg" />
						</div>
					</div>
					{this.state.calculated && difference}
				</div>
			</div>
		);
	}

	drawArcs(staticArcs, animatedArcs, pointZero, noDelay) {
		if (!this.shouldAnimate) {
			return;
		}

		setTimeout(
			() => {
				this.canvas = document.getElementById('barometer-canvas');

				if (!document.querySelector('#barometer-canvas')) {
					return;
				}

				this.context = this.canvas.getContext('2d');
				this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

				const centerX = this.canvas.width / 2;
				const centerY = this.canvas.height / 2;

				const currentAnimationEndAngles = animatedArcs.map(arcInfo => {
					if (arcInfo.counterClockwise) {
						return arcInfo.endAngle;
					} else {
						return arcInfo.startAngle;
					}
				});
				const animationsEndedIndexes = [];

				const step = () => {
					this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

					this.context.beginPath();
					this.context.lineWidth = this.state.lineWidth;
					this.context.strokeStyle = '#e5e5e5';
					this.context.arc(
						centerX,
						centerY,
						this.state.radius,
						this.angleStartMultiplier * Math.PI,
						this.angleEndMultiplier * Math.PI,
						false
					);
					this.context.stroke();

					this.context.beginPath();

					staticArcs.forEach(arcInfo => {
						const { startAngle, endAngle, color } = arcInfo;
						this.context.strokeStyle = color;
						this.context.arc(centerX, centerY, this.state.radius, startAngle, endAngle, false);
					});

					this.context.stroke();
					this.context.beginPath();

					animatedArcs.forEach((arcInfo, index) => {
						const { startAngle, endAngle, color, counterClockwise } = arcInfo;
						const animationEndAngle = currentAnimationEndAngles[index];
						this.context.strokeStyle = color;
						this.context.lineWidth = this.context.lineWidth;

						if (counterClockwise) {
							this.context.arc(centerX, centerY, this.state.radius, endAngle, animationEndAngle, true);
							currentAnimationEndAngles[index] = animationEndAngle - 0.01;
							if (animationEndAngle <= startAngle) {
								animationsEndedIndexes.push(index);
							}
						} else {
							this.context.arc(centerX, centerY, this.state.radius, startAngle, animationEndAngle, false);
							currentAnimationEndAngles[index] = animationEndAngle + 0.01;
							if (animationEndAngle >= endAngle) {
								animationsEndedIndexes.push(index);
							}
						}
					});

					this.context.stroke();

					if (pointZero) {
						this.context.lineWidth = this.state.lineWidth + 5;
						this.context.beginPath();
						this.context.strokeStyle = '#000000';
						this.context.arc(
							centerX,
							centerY,
							this.state.radius + 2.5,
							pointZero,
							pointZero + 0.015,
							false
						);
						this.context.stroke();
					}

					if (this.shouldAnimate && animationsEndedIndexes.length < animatedArcs.length) {
						window.requestAnimationFrame(step);
					}
				};

				window.requestAnimationFrame(step);
			},
			noDelay ? 0 : ANIMATION_DELAY
		);
	}

	drawValues() {
		let isTodayLabelLeft;
		let needle1Radiant;
		let needle2Radiant;

		this.drawArcs([], [], null, true);

		if (this.state.currentValue >= 0) {
			if (this.state.increase >= 0 && this.state.increase < 1) {
				isTodayLabelLeft = true;
				const currentValueStartAngle = this.angleStartMultiplier;
				const currentValueEndAngle = 0.5 * this.angleDistance + this.angleStartMultiplier;
				const expectedValueEndAngle = currentValueEndAngle + (this.state.increase / 2) * this.angleDistance;

				this.drawArcs(
					[
						{
							startAngle: currentValueStartAngle * Math.PI,
							endAngle: currentValueEndAngle * Math.PI,
							color: COLOR_CURRENT_POSITIVE
						}
					],
					[
						{
							startAngle: currentValueEndAngle * Math.PI,
							endAngle: expectedValueEndAngle * Math.PI,
							color: COLOR_EXPECTED_POSITIVE
						}
					],
					this.angleStartMultiplier * Math.PI
				);

				needle1Radiant = currentValueEndAngle;
				needle2Radiant = expectedValueEndAngle;
			}

			if (this.state.increase >= 1) {
				isTodayLabelLeft = true;
				const currentValueStartAngle = this.angleStartMultiplier;
				const currentValueEndAngle =
					this.angleStartMultiplier +
					(this.state.currentValue / this.state.expectedValue) * this.angleDistance;
				const expectedValueEndAngle = 0.9 * this.angleDistance + this.angleStartMultiplier;

				this.drawArcs(
					[
						{
							startAngle: currentValueStartAngle * Math.PI,
							endAngle: currentValueEndAngle * Math.PI,
							color: COLOR_CURRENT_POSITIVE
						}
					],
					[
						{
							startAngle: currentValueEndAngle * Math.PI,
							endAngle: expectedValueEndAngle * Math.PI,
							color: COLOR_EXPECTED_POSITIVE
						}
					],
					this.angleStartMultiplier * Math.PI
				);

				needle1Radiant = currentValueEndAngle;
				needle2Radiant = expectedValueEndAngle;
			}

			if (this.state.increase < 0 && this.state.increase >= -1) {
				isTodayLabelLeft = false;
				const currentValueStartAngle = this.angleStartMultiplier;
				const currentValueEndAngle = 0.7 * this.angleDistance + this.angleStartMultiplier;
				const expectedValueEndAngle =
					this.angleStartMultiplier + 0.7 * (1 - Math.abs(this.state.increase)) * this.angleDistance;

				this.drawArcs(
					[
						{
							startAngle: currentValueStartAngle * Math.PI,
							endAngle: currentValueEndAngle * Math.PI,
							color: COLOR_CURRENT_POSITIVE
						}
					],
					[
						{
							startAngle: expectedValueEndAngle * Math.PI,
							endAngle: currentValueEndAngle * Math.PI,
							color: COLOR_CURRENT_NEGATIVE,
							counterClockwise: true
						}
					],
					this.angleStartMultiplier * Math.PI
				);

				needle1Radiant = currentValueEndAngle;
				needle2Radiant = expectedValueEndAngle;
			}
			if (this.state.increase < -1) {
				isTodayLabelLeft = false;
				const difference = Math.abs(this.state.currentValue - this.state.expectedValue);
				const currentValuePortion = Math.abs(this.state.currentValue / difference);
				const expectedValuePortion = 1 - currentValuePortion;
				const range = this.angleDistance / 2;
				const currentValueStartAngle = this.angleStartMultiplier + range;
				const currentValueEndAngle = currentValueStartAngle + currentValuePortion * range;
				const expectedValueEndAngle = currentValueStartAngle;
				const expectedValueStartAngle = currentValueStartAngle - expectedValuePortion * range;

				this.drawArcs(
					[
						{
							startAngle: currentValueStartAngle * Math.PI,
							endAngle: currentValueEndAngle * Math.PI,
							color: COLOR_CURRENT_FALLING_NEGATIVE
						}
					],
					[
						{
							startAngle: expectedValueStartAngle * Math.PI,
							endAngle: expectedValueEndAngle * Math.PI,
							color: COLOR_EXPECTED_NEGATIVE,
							counterClockwise: true
						}
					],
					currentValueStartAngle * Math.PI
				);

				needle1Radiant = currentValueEndAngle;
				needle2Radiant = expectedValueStartAngle;
			}
		} else {
			if (this.state.increase <= 0 && this.state.increase >= -1) {
				isTodayLabelLeft = true;
				const currentValueStartAngle = this.angleStartMultiplier + this.angleDistance * 0.2;
				const currentValueEndAngle =
					currentValueStartAngle + Math.abs(this.state.increase) * this.angleDistance * 0.7;
				const expectedValueStartAngle = currentValueEndAngle;
				const expectedValueEndAngle = this.angleDistance * 0.9 + this.angleStartMultiplier;

				this.drawArcs(
					[
						{
							startAngle: currentValueStartAngle * Math.PI,
							endAngle: expectedValueEndAngle * Math.PI,
							color: COLOR_EXPECTED_NEGATIVE
						}
					],
					[
						{
							startAngle: currentValueStartAngle * Math.PI,
							endAngle: expectedValueStartAngle * Math.PI,
							color: COLOR_EXPECTED_POSITIVE
						}
					],
					expectedValueEndAngle * Math.PI
				);

				needle1Radiant = currentValueStartAngle;
				needle2Radiant = currentValueEndAngle;
			}
			if (this.state.increase < -1 && this.state.increase >= -2) {
				isTodayLabelLeft = true;
				const currentValueStartAngle = this.angleStartMultiplier + this.angleDistance * 0.1;
				const currentValueEndAngle = this.angleStartMultiplier + this.angleDistance * 0.5;
				const expectedValueEndAngle =
					this.angleStartMultiplier + this.angleDistance * 0.9 * (Math.abs(this.state.increase) * 0.5);

				this.drawArcs(
					[
						{
							startAngle: currentValueStartAngle * Math.PI,
							endAngle: currentValueEndAngle * Math.PI,
							color: COLOR_EXPECTED_NEGATIVE
						}
					],
					[
						{
							startAngle: currentValueEndAngle * Math.PI,
							endAngle: expectedValueEndAngle * Math.PI,
							color: COLOR_EXPECTED_POSITIVE
						}
					],
					currentValueEndAngle * Math.PI
				);

				needle1Radiant = currentValueStartAngle;
				needle2Radiant = expectedValueEndAngle;
			}
			if (this.state.increase < -2) {
				isTodayLabelLeft = true;
				const currentValueStartAngle = this.angleStartMultiplier + this.angleDistance * 0.5;
				const currentValueEndAngle = this.angleStartMultiplier + this.angleDistance * 0.9;
				const expectedValueStartAngle =
					currentValueStartAngle -
					(currentValueEndAngle - currentValueStartAngle) * (1 / (Math.abs(this.state.increase) - 1));
				const expectedValueEndAngle = currentValueStartAngle;

				this.drawArcs(
					[
						{
							startAngle: expectedValueStartAngle * Math.PI,
							endAngle: expectedValueEndAngle * Math.PI,
							color: COLOR_EXPECTED_NEGATIVE
						}
					],
					[
						{
							startAngle: currentValueStartAngle * Math.PI,
							endAngle: currentValueEndAngle * Math.PI,
							color: COLOR_EXPECTED_POSITIVE
						}
					],
					currentValueStartAngle * Math.PI
				);

				needle1Radiant = expectedValueStartAngle;
				needle2Radiant = currentValueEndAngle;
			}
			if (this.state.increase > 0) {
				isTodayLabelLeft = false;
				const expectedValueStartAngle = this.angleStartMultiplier + this.angleDistance * 0.15;
				const currentValueEndAngle = this.angleStartMultiplier + this.angleDistance * 0.8;
				const expectedValueEndAngle =
					expectedValueStartAngle +
					(currentValueEndAngle - expectedValueStartAngle) * (1 - 1 / (this.state.increase + 1));
				const currentValueStartAngle = expectedValueEndAngle;

				this.drawArcs(
					[
						{
							startAngle: currentValueStartAngle * Math.PI,
							endAngle: currentValueEndAngle * Math.PI,
							color: COLOR_EXPECTED_NEGATIVE
						}
					],
					[
						{
							startAngle: expectedValueStartAngle * Math.PI,
							endAngle: expectedValueEndAngle * Math.PI,
							color: COLOR_EXPECTED_MORE_NEGATIVE,
							counterClockwise: true
						}
					],
					currentValueEndAngle * Math.PI
				);

				needle1Radiant = expectedValueEndAngle;
				needle2Radiant = expectedValueStartAngle;
			}
		}

		this.setState({ isTodayLabelLeft, calculated: true }, () => {
			this.animateNeedle(needle1Radiant, needle2Radiant);
		});
	}

	animateNeedle(radiantForNeedle1, radiantForNeedle2) {
		let degrees1 = radiantForNeedle1 * 180 - 180;
		let degrees2 = radiantForNeedle2 * 180 - 180;

		if (degrees1 < -180) {
			degrees1 += 360;
		}

		if (degrees2 < -180) {
			degrees2 += 360;
		}

		degrees1 -= 90;
		degrees2 -= 90;

		const duration = ((0.8 * Math.max(0, Math.min(Math.abs(degrees1 - degrees2), 200))) / 100).toFixed(2);

		move('.needle')
			.rotate(degrees1)
			.duration(0)
			.end();

		move('.needle2')
			.rotate(degrees1)
			.duration(0)
			.end();

		setTimeout(() => {
			if (!document.querySelector('.barometer-wrapper .needle2')) {
				return;
			}

			move('.needle2')
				.rotate(degrees2 + 20 * (degrees2 < degrees1 ? -1 : 1))
				.ease('in-out')
				.duration(`${duration}s`)
				.then()
				.rotate(-30 * (degrees2 < degrees1 ? -1 : 1))
				.duration('0.5s')
				.then()
				.rotate(15 * (degrees2 < degrees1 ? -1 : 1))
				.duration('0.5s')
				.then()
				.rotate(-5 * (degrees2 < degrees1 ? -1 : 1))
				.duration('0.5s')
				.pop()
				.pop()
				.pop()
				.end();
		}, ANIMATION_DELAY);
	}
}

export default BarometerComponent;
