import React from 'react';
import PropTypes from 'prop-types';
import $ from 'jquery';
import TextInputLabelComponent from 'shared/inputs/text-input/text-input-label.component';
import TextInputHintComponent from 'shared/inputs/text-input/text-input-hint.component';
import TextInputErrorComponent from 'shared/inputs/text-input/text-input-error.component';
import sanitizeText from 'helpers/sanitizeText';
import sanitizeNumber from 'helpers/sanitizeNumber';
import { formatNumber } from 'helpers/formatNumber';
import { formatMoney } from 'helpers/formatMoney';
import config from 'config';

const getWrapperClass = ({ wrapperClass, leftLabel, hasBorder, errorMessage }) => {
	const leftLabelClass = `${leftLabel ? 'input-leftLabel' : ''}`;
	const hasBorderClass = `${hasBorder ? 'input-boxBorder' : ''}`;

	return `form_input ${leftLabelClass} ${hasBorderClass} ${wrapperClass || ''}`;
};

class SpinnerInputComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: props.value,
			isMin: false,
			isMax: false
		};
		this.handleChange = this.handleChange.bind(this);
		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.handleMouseWheelMove = this.handleMouseWheelMove.bind(this);
		this.onIncreaseClick = this.onIncreaseClick.bind(this);
		this.onDecreaseClick = this.onDecreaseClick.bind(this);
	}

	componentWillMount() {
		const defaultValue = this.state.value || this.props.min || 0;
		this.writeValueToInput(defaultValue);
	}

	componentWillReceiveProps(newProps) {
		const { value } = newProps;
		const { symbol } = this.props;
		const { value: currentValue } = this.state;
		const parsedNewValue = `${value} ${symbol}`;

		if (value && (parsedNewValue !== currentValue && parsedNewValue !== `${currentValue} ${symbol}`)) {
			this.writeValueToInput(value);
		}
	}

	handleChange({ target: { value } }) {
		const newValue = sanitizeText(value, this.props);
		this.setValue({ value: newValue });
	}

	handleFocus({ target }) {
		const newState = sanitizeNumber(target.value, this.props);
		newState.value = formatNumber(newState.value, this.props);
		this.setState(newState, function() {
			if (this.props.selectOnFocus) {
				target.select();
			}
		});

		window.addEventListener('wheel', this.handleMouseWheelMove);
	}

	handleBlur({ target: { value } }) {
		this.writeValueToInput(value);
		window.removeEventListener('wheel', this.handleMouseWheelMove);
	}

	handleKeyDown(e) {
		if (e.keyCode === 38) {
			e.preventDefault();
			const newValue = this.increaseValue(e.shiftKey ? 10 : 1);
			this.writeValueToInput(newValue);
		} else if (e.keyCode === 40) {
			e.preventDefault();
			const newValue = this.decreaseValue(e.shiftKey ? 10 : 1);
			this.writeValueToInput(newValue);
		}
	}

	handleMouseWheelMove(e) {
		const focused = $(this.refs[this.props.name]).is(':focus');
		if (focused) {
			e.preventDefault();
			let newValue;

			// Prevent change of value when touching touchpad with two fingers
			if (!e.deltaY && !e.deltaX) {
				return;
			}

			const delta = e.deltaY ? e.deltaY : e.deltaX;
			if (delta < 0) {
				newValue = this.increaseValue(e.shiftKey ? 10 : 1);
			} else {
				newValue = this.decreaseValue(e.shiftKey ? 10 : 1);
			}

			this.writeValueToInput(newValue);
		}
	}

	onIncreaseClick(e) {
		const newValue = this.increaseValue(e.shiftKey ? 10 : 1);
		this.writeValueToInput(newValue);
	}

	onDecreaseClick(e) {
		const newValue = this.decreaseValue(e.shiftKey ? 10 : 1);
		this.writeValueToInput(newValue);
	}

	increaseValue(number) {
		const newState = sanitizeNumber(this.state.value, this.props);
		const newValue = newState.value + number;
		return newValue;
	}

	decreaseValue(number) {
		const newState = sanitizeNumber(this.state.value, this.props);
		const newValue = newState.value - number;
		return newValue;
	}

	sanitizeText(value) {
		let i = 0;
		return (
			value
				// replace everything that is not a decimal separator, minus or digit
				.replace(new RegExp('[^\\d-' + (this.props.precision ? this.props.decimal : '') + ']', 'g'), '')
				// replace all decimal separators but the first
				.replace(
					new RegExp('[' + this.props.decimal + ']', 'g'),
					function() {
						return i++ < 1 ? this.props.decimal : '';
					}.bind(this)
				)
				// replace every minus except when its the first cha
				.replace(/(?!^)-/g, '')
		);
	}

	writeValueToInput(value) {
		const newState = sanitizeNumber(value, this.props);
		newState.value = formatMoney(newState.value, this.props);
		this.setValue(newState);
	}

	setValue(state) {
		const { onChange } = this.props;
		this.setState(state, function() {
			onChange && onChange(this.state.value);
		});
	}

	render() {
		const {
			name,
			disabled,
			placeholder,
			label,
			wrapperClass,
			leftLabel,
			hasBorder,
			hintMessage,
			errorMessage
		} = this.props;
		const { value, isMax, isMin } = this.state;

		const inputClass = `input${this.props.errorMessage ? ' input-invalid' : ''}`;

		return (
			<div className={getWrapperClass({ wrapperClass, leftLabel, hasBorder })}>
				<input
					type="text"
					value={value}
					name={name}
					ref={name}
					disabled={disabled}
					placeholder={placeholder}
					className={inputClass}
					onChange={this.handleChange}
					onFocus={this.handleFocus}
					onBlur={this.handleBlur}
					onKeyDown={this.handleKeyDown}
				/>

				<div className="input_controls">
					<button
						ref="increaseButton"
						type="button"
						className="numberInput_button"
						onClick={this.onIncreaseClick}
						disabled={isMax || disabled}
					/>
					<button
						ref="decreaseButton"
						type="button"
						className="numberInput_button"
						onClick={this.onDecreaseClick}
						disabled={isMin || disabled}
					/>
				</div>

				<span className="input_bar" />
				<TextInputLabelComponent className="input_label" text={label} />

				<TextInputHintComponent visible={!!hintMessage} hintMessage={hintMessage} />
				<TextInputErrorComponent visible={!!errorMessage} errorMessage={errorMessage} />
			</div>
		);
	}
}

SpinnerInputComponent.propTypes = {
	value: PropTypes.number,
	name: PropTypes.string.isRequired,
	label: PropTypes.string,
	placeholder: PropTypes.string,
	errorMessage: PropTypes.string,
	hintMessage: PropTypes.string,
	precision: PropTypes.number,
	min: PropTypes.number,
	max: PropTypes.number,
	decimal: PropTypes.string,
	thousand: PropTypes.string,
	format: PropTypes.string,
	selectOnFocus: PropTypes.bool,
	disabled: PropTypes.bool,
	leftLabel: PropTypes.bool,
	hasBorder: PropTypes.bool,
	onChange: PropTypes.func
};

SpinnerInputComponent.defaultProps = {
	value: 0,
	name: '',
	label: '',
	placeholder: '',
	errorMessage: '',
	hintMessage: '',
	precision: config.currencyFormat.precision,
	min: NaN,
	max: NaN,
	decimal: config.currencyFormat.decimal,
	thousand: '',
	format: config.currencyFormat.format,
	selectOnFocus: false,
	disabled: false,
	leftLabel: false,
	hasBorder: false
};

export default SpinnerInputComponent;
