import React from 'react';
import PropTypes from 'prop-types';
import TextInputLabelComponent from 'shared/inputs/text-input/text-input-label.component';
import TextInputHintComponent from 'shared/inputs/text-input/text-input-hint.component';
import TextInputErrorComponent from 'shared/inputs/text-input/text-input-error.component';
import { getResource } from 'helpers/resource';

const getWrapperClass = (state, props) => {
	const { inputStyle, leftLabel, hasBorder } = props;

	if (leftLabel && hasBorder) {
		return 'input-boxBorder input-leftLabel';
	} else if (leftLabel && !hasBorder) {
		return 'input-leftLabel';
	} else if (!leftLabel && hasBorder) {
		return 'input-boxBorder';
	}
	return inputStyle || '';
};

class TextInput extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: props.value,
			errorMessage: props.errorMessage,
			inputClass: '',
			isInvalid: false
		};
		this.handleChange = this.handleChange.bind(this);
		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handlePaste = this.handlePaste.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.handleKeyUp = this.handleKeyUp.bind(this);
		this.handleOnClick = this.handleOnClick.bind(this);
	}

	componentWillMount() {
		if (!this.state.value && !this.props.placeholder) {
			this.setState({ inputClass: 'input-empty' });
		}
	}

	componentWillReceiveProps(newProps) {
		const { errorMessage, value } = newProps;
		const { errorMessage: currentError } = this.state;
		if (errorMessage !== currentError) {
			this.setState({ errorMessage });
		}
		const inputClass = value ? '' : 'input-empty'
		this.setState({ value, inputClass });
	}

	setError(msg) {
		this.setState({ errorMessage: msg });
	}

	handleChange(e) {
		const {
			target: { value, name }
		} = e;
		this.validateAndSetValue(value, name, e, true);
	}

	handleFocus(e) {
		const { selectOnFocus, onFocus } = this.props;
		if (selectOnFocus) {
			$(e.target).select();
		}

		onFocus && onFocus(e.target);
	}

	handleBlur(e) {
		if (!this.props.ignoreChangeOnBlur) {
			const { onBlur } = this.props;
			const {
				target: { value, name }
			} = e;
			const trimmedValue = value.trim();

			this.validateAndSetValue(trimmedValue, name);
			onBlur && onBlur(e.target, value);
		}
	}

	handlePaste(e) {
		if (this.props.ignoreChangeOnPaste) {
			e.preventDefault();
			e.stopPropagation();
		}
		this.props.onPaste && this.props.onPaste(e);
	}

	handleKeyDown(e) {
		this.props.onKeyDown && this.props.onKeyDown(e);
	}

	handleKeyUp(e) {
		this.props.onKeyUp && this.props.onKeyUp(e);
	}

	handleOnClick(e) {
		this.props.onClick && this.props.onClick(e);
	}

	validateAndSetValue(value, name, event, isChangeEvent) {
		const { placeholder, required, onChange } = this.props;
		let inputClass = '';
		let message = '';
		let isInvalid = false;

		if (value === '' && !placeholder) {
			inputClass = 'input-empty ';
		}

		if (required && !value) {
			inputClass += ' input-invalid';
			isInvalid = true;
			message = getResource('mandatoryFieldValidation');
		}

		this.setState({
			value,
			errorMessage: message,
			inputClass,
			isInvalid
		});

		if (isChangeEvent && onChange) {
			onChange(value, name, event);
		}
	}

	render() {
		const {
			name,
			placeholder,
			label,
			hintMessage,
			errorMessage,
			disabled,
			errorClass,
			dataQsId,
			maxLength,
			isPassword,
			autoComplete,
			spellCheck,
			customWrapperClass
		} = this.props;
		const { value, inputClass } = this.state;
		let isInvalid = this.state.isInvalid;

		let errMsg = errorMessage || this.state.errorMessage;

		const finalInputStyle = getWrapperClass(this.state, this.props);

		if (isInvalid && !errMsg) {
			errMsg = getResource('mandatoryFieldValidation');
		}

		if (!isInvalid && errMsg) {
			isInvalid = true;
		}

		return (
			<div className={`form_input ${customWrapperClass || ''} ${finalInputStyle}`}>
				<input
					type={isPassword ? 'password' : 'text'}
					value={value}
					name={name}
					ref={name}
					placeholder={placeholder}
					maxLength={maxLength}
					className={`input ${inputClass}`}
					disabled={disabled}
					onChange={this.handleChange}
					onBlur={this.handleBlur}
					onFocus={this.handleFocus}
					onPaste={this.handlePaste}
					onKeyDown={this.handleKeyDown}
					onKeyUp={this.handleKeyUp}
					onClick={this.handleOnClick}
					data-qs-id={dataQsId}
					autoComplete={autoComplete}
					spellCheck={spellCheck}
				/>

				<span className="input_bar" />
				<TextInputLabelComponent className="input_label" text={label} />

				<TextInputHintComponent visible={!!hintMessage} hintMessage={hintMessage} />

				<TextInputErrorComponent visible={isInvalid} customClass={errorClass} errorMessage={errMsg} />
			</div>
		);
	}
}

TextInput.propTypes = {
	value: PropTypes.string,
	name: PropTypes.string.isRequired,
	label: PropTypes.string,
	placeholder: PropTypes.string,
	hintMessage: PropTypes.string,
	required: PropTypes.bool,
	disabled: PropTypes.bool,
	leftLabel: PropTypes.bool,
	hasBorder: PropTypes.bool,
	selectOnFocus: PropTypes.bool,
	isInvalid: PropTypes.bool,
	onFocus: PropTypes.func,
	onBlur: PropTypes.func
};

TextInput.defaultProps = {
	value: '',
	name: '',
	label: '',
	placeholder: null,
	hintMessage: null,
	errorMessage: '',
	required: false,
	disabled: false,
	selectOnFocus: false,
	leftLabel: false,
	hasBorder: false,
	isInvalid: false
};

export default TextInput;
