import React from 'react';
import PropTypes from 'prop-types';
import TextInputLabelComponent from 'shared/inputs/text-input/text-input-label.component';
import TextInputHintComponent from 'shared/inputs/text-input/text-input-hint.component';
import TextInputErrorComponent from 'shared/inputs/text-input/text-input-error.component';
import sanitizeText from 'helpers/sanitizeText';
import sanitizeNumber from 'helpers/sanitizeNumber';
import { formatNumber } from 'helpers/formatNumber';
import config from 'config';

class NumberInputComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: this.props.defaultNonZero ? '' : 0
		};
		this.handleChange = this.handleChange.bind(this);
		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	componentWillMount() {
		const defaultValue = this.props.value || this.props.min.toString() || '0';
		this.writeValueToInput(defaultValue, { silent: true });
	}

	// this might be relevant for some use-cases in the future
	componentWillReceiveProps (nextProps) {
	  if (nextProps.value) {
	    this.writeValueToInput(nextProps.value, { silent: true })
	  }
	}

	handleChange({ target: { value, name } }) {
		const newValue = sanitizeText(value, this.props);
		this.setValue(newValue, false, name);
	}

	handleFocus({ target }) {
		if (this.props.required) {
			return;
		}
		const newState = sanitizeNumber(target.value, this.props);
		if (this.props.isDecimal) {
			newState.value = formatNumber(newState.value, this.props);
		}
		this.setState(newState, function() {
			if (this.props.selectOnFocus) {
				target.select();
			}
		});
	}

	handleKeyDown(e) {
		this.props.onKeyDown && this.props.onKeyDown(e);
	}

	handleBlur(event) {
		let {
			target: { value }
		} = event;
		const { max, min, name, required } = this.props;

		if (required) {
			return;
		} else if (value > max || value < min) {
			value = this.refs[name].value;
		}

		this.props.onBlur && this.props.onBlur(value);

		this.writeValueToInput(value, true);
	}

	writeValueToInput(value, { silent = false }) {
		const newState = sanitizeNumber(value, this.props);
		if (this.props.isDecimal) {
			newState.value = formatNumber(newState.value, this.props);
		}
		if (newState.value === 0 && this.props.defaultNonZero) {
			return;
		}
		this.setValue(newState.value, silent);
	}

	setValue(value, silent, name) {
		const { required } = this.props;
		const inputInvalid = required && isNaN(parseInt(value));
		this.setState({ value, inputInvalid }, function() {
			if (this.props.onChange && !silent) {
				this.props.onChange(sanitizeNumber(value, this.props).value, name);
			}
		});
	}

	render() {
		const {
			leftLabel,
			hasBorder,
			errorMessage,
			errorClass,
			className,
			name,
			label,
			disabled,
			focused,
			placeholder,
			hintMessage,
			dataQsId,
			maxLength
		} = this.props;
		const { inputInvalid } = this.state;

		let inputStyle = '';
		if (leftLabel && hasBorder) {
			inputStyle = ' input-leftLabel input-boxBorder';
		} else if (leftLabel && !hasBorder) {
			inputStyle = ' input-leftLabel';
		} else if (!leftLabel && hasBorder) {
			inputStyle = ' input-boxBorder';
		}

		const inputClass = `input${errorMessage || inputInvalid ? ' input-invalid' : ''} ${this.state.value === '' && !placeholder ? 'input-empty ' : ''}`;

		return (
			<div className={`form_input ${className}${inputStyle}`} data-qs-id={dataQsId}>
				<input
					type={'text'}
					disabled={disabled}
					placeholder={placeholder}
					name={name}
					autoFocus={focused}
					ref={name}
					maxLength={maxLength}
					className={inputClass}
					onChange={this.handleChange}
					onFocus={this.handleFocus}
					onBlur={this.handleBlur}
					onKeyDown={this.handleKeyDown}
					value={this.state.value}
				/>
				<span className="input_bar" />
				<TextInputLabelComponent className="input_label" text={label} />

				<TextInputHintComponent visible={!!hintMessage} hintMessage={hintMessage} />
				<TextInputErrorComponent
					customClass={errorClass}
					visible={!!errorMessage}
					errorMessage={errorMessage}
				/>
			</div>
		);
	}
}

NumberInputComponent.propTypes = {
	value: PropTypes.number,
	name: PropTypes.string.isRequired,
	label: PropTypes.string,
	placeholder: PropTypes.string,
	focused: PropTypes.bool,
	errorClass: PropTypes.string,
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
	onChange: PropTypes.func,
	className: PropTypes.string
};

NumberInputComponent.defaultProps = {
	value: 0,
	name: '',
	label: '',
	placeholder: '',
	errorMessage: '',
	focused: false,
	errorClass: '',
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
	hasBorder: false,
	className: ''
};

export default NumberInputComponent;
