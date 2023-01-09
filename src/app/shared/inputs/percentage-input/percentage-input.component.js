import React from 'react';
import PropTypes from 'prop-types';
import TextInputLabelComponent from 'shared/inputs/text-input/text-input-label.component';
import TextInputHintComponent from 'shared/inputs/text-input/text-input-hint.component';
import TextInputErrorComponent from 'shared/inputs/text-input/text-input-error.component';
import sanitizeText from 'helpers/sanitizeText';
import sanitizeNumber from 'helpers/sanitizeNumber';
import { formatNumber } from 'helpers/formatNumber';
import { formatPercent } from 'helpers/formatPercent';
import config from 'config';

class PercentageInput extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: props.value
		};
		this.handleChange = this.handleChange.bind(this);
		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	componentWillMount() {
		const defaultValue = this.state.value || this.props.min || 0;
		this.writeValueToInput(defaultValue);
	}

	componentWillReceiveProps(newProps) {
		const { value } = newProps;
		const { value: currentValue } = this.state;
		const newState = sanitizeNumber(value, this.props);
		newState.value = formatPercent(newState.value, this.props);
		if (newState.value !== currentValue) {
			this.setState({ value: newState.value });
		}
	}

	handleChange({ target: { value } }) {
		const newValue = sanitizeText(value, this.props);
		this.setValue(newValue);
	}

	handleFocus({ target }) {
		const newState = sanitizeNumber(target.value, this.props);
		newState.value = formatNumber(newState.value, this.props);
		this.setState(newState, function() {
			if (this.props.selectOnFocus) {
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

	writeValueToInput(value) {
		const newState = sanitizeNumber(value, this.props);
		newState.value = formatPercent(newState.value, this.props);
		this.setValue(newState.value);
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
		}

		const inputClass = `input${this.props.errorMessage ? ' input-invalid' : ''}`;
		const { dataQsId } = this.props;

		return (
			<div className={'form_input' + inputStyle}>
				<input
					type="text"
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
					onKeyDown={this.handleKeyDown}
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

PercentageInput.propTypes = {
	value: PropTypes.any,
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
	onChange: PropTypes.func,
	onBlur: PropTypes.func
};

PercentageInput.defaultProps = {
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

export default PercentageInput;
