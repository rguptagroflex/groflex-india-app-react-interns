import React from 'react';

class CircleProgressBarComponent extends React.Component {
	constructor (props) {
		super(props);

		const {
			circleRadius,
			circleLineWidth,
			circleColorBackground,
			circleColorOuter,
			circleColorProgress,
			valueCircleFill,
			valueCircleStrokeWidth,
			valueCircleTextStyle,
			valueCircleTextColor,
			valueCircleTextOffsetY,
			valueCircleRadius,
			animationSpeed,
			minValue,
			reachedValue,
			maxValue
		} = this.props;

		this.canvas = null;
		this.context = null;
		this.centerX = 0;
		this.centerY = 0;
		this.circleRadius = circleRadius;
		this.circleLineWidth = circleLineWidth;
		this.circleColorBackground = circleColorBackground;
		this.circleColorOuter = circleColorOuter;
		this.circleColorProgress = circleColorProgress;
		this.valueCircle = {
			x: 0,
			y: 0,
			fill: valueCircleFill,
			stroke: this.circleColorProgress,
			strokeWidth: valueCircleStrokeWidth,
			textStyle: valueCircleTextStyle,
			textColor: valueCircleTextColor,
			textOffsetY: valueCircleTextOffsetY,
			radius: valueCircleRadius
		};

		this.animationSpeed = animationSpeed;
		this.currentAngle = 0;
		this.currentValue = 0;

		this.minValue = minValue || 0;
		this.reachedValue = reachedValue;
		this.maxValue = maxValue;

		if (this.reachedValue >= this.maxValue) {
			this.reachedValue = this.maxValue;
		}

		this.targetAngle = (360 / 100) * ((this.reachedValue - this.minValue) / (this.maxValue - this.minValue)) * 100;

		this.step = this.step.bind(this);
	}

	componentDidMount () {
		setTimeout(() => {
			this.init();
		});
	}

	componentWillUnmount () {
		window.cancelAnimationFrame(this.step);
	}

	init () {
		this.canvas = this.refs.canvas;

		if (!this.canvas) {
			return;
		}

		this.context = this.canvas.getContext('2d');
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.centerX = this.canvas.width / 2;
		this.centerY = this.canvas.height / 2;
		window.requestAnimationFrame(this.step);
	}

	drawArcs () {
		this.context.beginPath();

		this.context.arc(
			this.centerX,
			this.centerY,
			this.circleRadius,
			(Math.PI / 180) * 270,
			(Math.PI / 180) * (270 + 360)
		);

		this.context.strokeStyle = this.circleColorOuter;
		this.context.fillStyle = this.circleColorBackground;
		this.context.lineWidth = this.circleLineWidth;
		this.context.fill();
		this.context.stroke();

		this.context.beginPath();
		this.context.strokeStyle = this.circleColorProgress;
		this.context.lineWidth = this.circleLineWidth;

		this.context.arc(
			this.centerX,
			this.centerY,
			this.circleRadius,
			(Math.PI / 180) * 270,
			(Math.PI / 180) * (270 + this.currentAngle)
		);

		this.context.stroke();
	}

	drawValueCircle () {
		this.valueCircle.x = this.centerX + Math.cos((Math.PI / 180) * (270 + this.currentAngle)) * this.circleRadius;
		this.valueCircle.y = this.centerY + Math.sin((Math.PI / 180) * (270 + this.currentAngle)) * this.circleRadius;

		this.context.fillStyle = this.valueCircle.fill;
		this.context.beginPath();
		this.context.arc(this.valueCircle.x, this.valueCircle.y, this.valueCircle.radius, 0, Math.PI * 2, true);
		this.context.closePath();
		this.context.fill();
		this.context.lineWidth = this.valueCircle.strokeWidth;
		this.context.strokeStyle = this.valueCircle.stroke;
		this.context.stroke();

		this.context.font = this.valueCircle.textStyle;
		this.context.textAlign = 'center';
		this.context.fillStyle = this.valueCircle.textColor;
		this.context.fillText(
			Math.round(this.currentValue),
			this.valueCircle.x,
			this.valueCircle.y + this.valueCircle.textOffsetY
		);
	}

	step () {
		this.currentAngle += this.animationSpeed;
		this.currentValue += this.reachedValue / (this.targetAngle / this.animationSpeed);

		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		if (this.currentAngle < this.targetAngle) {
			window.requestAnimationFrame(this.step);
		} else {
			this.currentValue = this.reachedValue;
		}

		this.drawArcs();
		this.drawValueCircle();
	}

	render () {
		const { canvasSize } = this.props;

		return (
			<div className="canvas-wrapper" style={{ width: canvasSize, height: canvasSize }}>
				<canvas ref="canvas" width={canvasSize} height={canvasSize} />
			</div>
		);
	}
}

export default CircleProgressBarComponent;
