import React from 'react';
import PropTypes from 'prop-types';
import TextInputLabelComponent from 'shared/inputs/text-input/text-input-label.component';
import TextInputHintComponent from 'shared/inputs/text-input/text-input-hint.component';
import TextInputErrorComponent from 'shared/inputs/text-input/text-input-error.component';
import sanitizeText from 'helpers/sanitizeText';
import sanitizeNumber from 'helpers/sanitizeNumber';
import { formatCurrencyMinusPlus } from 'helpers/formatCurrency';
import { formatNumber, formatNumberCode, formatNumberSymbol } from 'helpers/formatNumber';
import { formatMoney, formatMoneyCode, formatMoneySymbol } from 'helpers/formatMoney';
import config from 'config';
import { currencyInputSymbol, currencyInputCode } from "helpers/constants";
class CurrencyInput extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: props.value,
			willReceiveNewValueProps: props.willReceiveNewValueProps,
			openingBalanceType: props.openingBalanceTypeCurrency,
			currencyType: props.currencyType,
			currencyCode: props.currencyCode
		};
		this.handleChange = this.handleChange.bind(this);
		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	componentWillReceiveProps(newProps) {
		// let formattedValue=this.formatValue(value)
		// if (this.props.willReceiveNewValueProps && this.state.value !== formattedValue) {
		// 	this.setValue(formattedValue) // =this.writeValueToInput(value);
		const { errorMessage, value, currencyCode } = newProps;
		if (this.state.willReceiveNewValueProps && this.state.value !== value) {
			this.writeValueToInput(value, currencyCode);
		}
	this.setState({ errorMessage });
	}

	componentWillMount() {
		const defaultValue = this.state.value || this.props.min || 0;
		this.writeValueToInput(defaultValue, this.props.currencyCode);
	}

	handleChange({ target: { value } }) {
		const newValue = sanitizeText(value, this.props);
		this.setValue(newValue);
	}

	handleFocus({ target }) {
		const newState = sanitizeNumber(target.value, this.props);
		newState.value = this.state.currencyType === currencyInputCode ? formatNumberCode(newState.value, this.props) : formatNumber(newState.value, this.props);
		this.setState(newState, function() {
			if (this.props.selectOnFocus) {
				target.select();
			} else if (this.props.onFocus) {
				this.props.onFocus();
				target.select();
			}
		});
	}

	handleBlur({ target: { value } }) {
		this.writeValueToInput(value);
		if (this.props.onBlur) {
			this.props.onBlur(value);
		}
	}

	handleKeyDown(e) {
		this.props.onKeyDown && this.props.onKeyDown(e);
	}

	writeValueToInput(value, baseCurrency) {
		const newState = sanitizeNumber(value, this.props)
		newState.value = this.props.currencyType === currencyInputCode ? formatMoneyCode(value): this.props.currencyType === currencyInputSymbol && baseCurrency ? 
		formatMoneySymbol(newState.value, baseCurrency) : formatMoney(newState.value, this.props)
		this.setValue(newState.value);
	}

	formatValue(value){
		const newState = sanitizeNumber(value, this.props);
		if (this.state.openingBalanceType !== undefined) {
			newState.value = formatCurrencyMinusPlus(newState.value);
		} else {
			newState.value = formatMoney(newState.value, this.props);
		}
		return newState.value
	}

	setValue(value) {
		this.setState({ value }, function() {
			if (this.props.onChange) {
				this.props.onChange(value);
			}
		});
	}

	render() {
		let inputStyle = '';
		if (this.props.leftLabel && this.props.hasBorder) {
			inputStyle = ' input-leftLabel input-boxBorder';
		} else if (this.props.leftLabel && !this.props.hasBorder) {
			inputStyle = ' input-leftLabel';
		} else if (!this.props.leftLabel && this.props.hasBorder) {
			inputStyle = ' input-boxBorder';
		} else if (!this.props.leftLabel && !this.props.hasBorder && this.props.currencyTotal) {
			inputStyle = ' input-currencyTotal';
		}

		const inputClass = `input${this.props.errorMessage ? ' input-invalid' : ''}`;
		const { dataQsId } = this.props;

		return (
			<div className={'form_input' + inputStyle}>
				<input
					type="text"
					autoComplete="off"
					value={this.state.value}
					name={this.props.name}
					ref={this.props.name}
					disabled={this.props.disabled}
					placeholder={this.props.placeholder}
					className={inputClass}
					onChange={this.handleChange}
					onKeyDown={this.handleKeyDown}
					onFocus={this.handleFocus}
					onBlur={this.handleBlur}
					data-qs-id={dataQsId}
				/>
				<span className="input_bar" />
				<TextInputLabelComponent className="input_label" text={this.props.label} />

				<TextInputHintComponent visible={!!this.props.hintMessage} hintMessage={this.props.hintMessage} />
				<TextInputErrorComponent visible={!!this.props.errorMessage} errorMessage={this.props.errorMessage} />
			</div>
		);
	}
}

CurrencyInput.propTypes = {
	value: PropTypes.number,
	name: PropTypes.string.isRequired,
	label: PropTypes.string,
	placeholder: PropTypes.string,
	errorMessage: PropTypes.string,
	hintMessage: PropTypes.string,
	symbol: PropTypes.string,
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
	onBlur: PropTypes.func,
	openingBalanceType: PropTypes.string,
	onFocus: PropTypes.func,
	currencyType: PropTypes.string,
	currencyCode: PropTypes.string,
	currencyTotal: PropTypes.bool
};

CurrencyInput.defaultProps = {
	value: 0,
	name: '',
	label: '',
	placeholder: '',
	errorMessage: '',
	hintMessage: '',
	symbol: config.currencyFormat.symbol,
	precision: config.currencyFormat.precision,
	min: NaN,
	max: NaN,
	decimal: config.currencyFormat.decimal,
	thousand: config.currencyFormat.thousand,
	format: config.currencyFormat.format,
	selectOnFocus: false,
	disabled: false,
	leftLabel: false,
	hasBorder: false,
	openingBalanceType: null,
	currencyType: '',
	currencyCode: '',
	currencyTotal: false
};

export default CurrencyInput;
