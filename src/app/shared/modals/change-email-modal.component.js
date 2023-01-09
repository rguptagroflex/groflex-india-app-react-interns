import invoiz from 'services/invoiz.service';
import React from 'react';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import config from 'config';
import { errorCodes } from 'helpers/constants';

const { NOT_ALLOWED, INCORRECT, INVALID, NOT_CONFIRMED } = errorCodes;

class ChangeEmailModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			accountEmail: props.accountEmail,
			newEmail: '',
			password: '',
			emailError: '',
			passwordError: '',
			wasEmailChanged: false,
			isSubmitting: false
		};
	}

	componentWillReceiveProps(props) {
		this.setState({ accountEmail: props.accountEmail });
	}

	getEmailError(email) {
		const { resources } = this.props;
		const { accountEmail } = this.state;
		let emailError = '';

		if (email.length === 0) {
			emailError = resources.mandatoryFieldValidation;
		}

		if (email.length > 0 && !config.emailCheck.test(email)) {
			// emailError = config.lang.emailHint;
			emailError = resources.validEmailMessage;
		}

		if (email.toLowerCase() === accountEmail.toLowerCase()) {
			emailError = resources.changeEmailSameAsCurrentError;
		}

		return emailError;
	}

	onEmailBlur() {
		this.setState({ wasEmailChanged: true });
	}

	onEmailChanged(val) {
		const { wasEmailChanged } = this.state;
		const emailError = this.getEmailError(val.trim());
		this.setState({ newEmail: val, emailError: wasEmailChanged ? emailError : '' });
	}

	onSubmitClicked() {
		const { resources } = this.props;
		const { newEmail, password } = this.state;
		let emailError = this.getEmailError(newEmail.trim());
		let passwordError = '';

		if (password.trim().length === 0) {
			passwordError = resources.mandatoryFieldValidation;
		}

		if (emailError.length > 0 || passwordError.length > 0) {
			this.setState({ emailError, passwordError });
		} else {
			this.setState({ emailError: '', passwordError: '', isSubmitting: true }, () => {
				const handleSubmitSuccess = response => {
					invoiz.page.showToast({ message: resources.accountEmailSuccessMessage });
					ModalService.close(true);
				};

				const handleSubmitFailure = ({ body: { meta } }) => {
					let message = resources.defaultErrorMessage;

					if (meta && meta.email && meta.email[0].code === NOT_ALLOWED) {
						emailError = message = resources.accountEmailAlreadyExistsMessage;
					}
					if (meta && meta.password && meta.password[0].code === NOT_CONFIRMED) {
						emailError = message = resources.changeEmailNotConfirmedMessage;
					}
					if (
						meta &&
						meta.password &&
						(meta.password[0].code === INCORRECT || meta.password[0].code === INVALID)
					) {
						passwordError = message = resources.accountWrongPasswordMessage;
					}

					invoiz.page.showToast({ type: 'error', message });
					this.setState({ emailError, passwordError, isSubmitting: false });
				};

				invoiz
					.request(config.account.endpoints.changeEmail, {
						method: 'PUT',
						data: { email: newEmail, password },
						auth: true
					})
					.then(handleSubmitSuccess)
					.catch(handleSubmitFailure);
			});
		}
	}

	render() {
		const { newEmail, password, emailError, passwordError } = this.state;
		const { resources } = this.props;

		return (
			<div className="change-email-modal">
				<div className="row">
					<TextInputExtendedComponent
						customWrapperClass={'col-xs-12'}
						name={'accountEmail'}
						value={newEmail}
						onChange={val => this.onEmailChanged(val)}
						onBlur={() => this.onEmailBlur()}
						label={resources.newEmailAddress}
						autoComplete="off"
						spellCheck="false"
						required={true}
						errorMessage={emailError}
					/>
				</div>

				<div className="row">
					<TextInputExtendedComponent
						customWrapperClass={'col-xs-12'}
						name={'password'}
						value={password}
						onChange={val => this.setState({ password: val })}
						label={resources.str_password}
						autoComplete="off"
						spellCheck="false"
						required={true}
						isPassword={true}
						errorMessage={passwordError}
					/>
				</div>

				<div className="row">
					<div className="col-xs-12 change-email-hint">
						{resources.newEmailMessage}
					</div>
				</div>

				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							type="cancel"
							callback={() => ModalService.close(true)}
							label={resources.str_abortStop}
							dataQsId="modal-btn-cancel"
						/>
					</div>
					<div className="modal-base-confirm">
						<ButtonComponent
							buttonIcon={'icon-check'}
							type={'primary'}
							disabled={this.state.isSubmitting}
							callback={() => this.onSubmitClicked()}
							label={resources.str_changeNow}
							dataQsId="modal-btn-confirm"
						/>
					</div>
				</div>
			</div>
		);
	}
}

export default ChangeEmailModal;
