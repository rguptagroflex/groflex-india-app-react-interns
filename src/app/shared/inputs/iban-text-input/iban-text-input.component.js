import invoiz from 'services/invoiz.service';
import React from 'react';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import PropTypes from 'prop-types';
import config from 'config';

class IBANTextInputComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			ibanErrorMessage: null
		};

		this.keyUpTimer = null;
	}

	validateIban(bankAccountIban, isFromKeyUp) {
		const { handleValidation, resources } = this.props;

		if (!bankAccountIban) {
			handleValidation(false, null, isFromKeyUp);
			return this.setState({ ibanErrorMessage: resources.ibanErrorMessage });
		}

		const onIbanCheckResponse = response => {
			const {
				body: {
					data: { isIbanValid, bic }
				}
			} = response;

			if (isIbanValid) {
				handleValidation(isIbanValid, bic, isFromKeyUp);
				return this.setState({ ibanErrorMessage: null });
			}

			this.setState({ ibanErrorMessage: resources.ibanErrorMessage }, () => {
				handleValidation(false, null, isFromKeyUp);
				throw new Error('Invalid IBAN');
			});
		};

		const url = `${config.resourceHost}/banking/check/iban/${bankAccountIban}`;

		return invoiz
			.request(url, { headers: {} })
			.then(onIbanCheckResponse)
			.catch(error => {
				handleValidation(false, null, isFromKeyUp);
				throw error;
			});
	}

	handleBlur({ value }, isFromKeyUp) {
		const cleanValue = value.trim().replace(/\s/gi, '');
		this.validateIban(cleanValue, isFromKeyUp);
	}

	handleOnKeyUp(value) {
		clearTimeout(this.keyUpTimer);

		this.keyUpTimer = setTimeout(() => {
			this.handleBlur({ value }, true);
		}, 500);
	}

	render() {
		const { ibanErrorMessage } = this.state;
		const { errorMessage: propsErrorMessage } = this.props;

		const textInputProps = Object.assign({}, this.props, { errorMessage: ibanErrorMessage || propsErrorMessage });
		return (
			<TextInputExtendedComponent
				ref="textInput"
				{...textInputProps}
				onBlur={this.handleBlur.bind(this)}
				onKeyUp={evt => this.handleOnKeyUp(evt.target.value)}
			/>
		);
	}
}

IBANTextInputComponent.PropTypes = {
	errorClass: PropTypes.string,
	errorMessage: PropTypes.string,
	inputRef: PropTypes.func,
	inputStyle: PropTypes.string,
	name: PropTypes.string,
	onBlur: PropTypes.func,
	onChange: PropTypes.func,
	placeholder: PropTypes.string,
	value: PropTypes.string,
	required: PropTypes.required,
	handleValidation: PropTypes.func
};

IBANTextInputComponent.DefaultProps = {
	errorClass: '',
	errorMessage: '',
	inputStyle: '',
	name: '',
	placeholder: '',
	value: '',
	required: true
};

export default IBANTextInputComponent;
