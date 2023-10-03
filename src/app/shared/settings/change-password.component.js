import React from 'react';
import invoiz from 'services/invoiz.service';
import _ from 'lodash';
import config from 'config';
import TextInputComponent from 'shared/inputs/text-input/text-input.component';
import TextInputHintComponent from 'shared/inputs/text-input/text-input-hint.component';
import TextInputErrorComponent from 'shared/inputs/text-input/text-input-error.component';
import ButtonComponent from 'shared/button/button.component';
import { errorCodes } from 'helpers/constants';

const { INVALID } = errorCodes;

class ChangePasswordComponent extends React.Component {
	constructor() {
		super();
		this._isMounted = false;
		this.state = {
			isGoogleAccount: !!(invoiz.user && invoiz.user.googleId && invoiz.user.googleId.length > 0),
			oldPassword: '',
			newPassword: '',
			passwordStrength: 1,
			passwordStrengthVisible: false,
			oldPasswordError: '',
			newPasswordError: '',
			// newPasswordHint: config.lang.passwordHint,
			newPasswordHint: '',
			wasOldPasswordChanged: false,
			wasNewPasswordChanged: false
		};

		// invoiz.on('userModelSubscriptionDataSet', () => {
		// 	const isGoogleAccount = !!(invoiz.user && invoiz.user.googleId && invoiz.user.googleId.length > 0);
		// 	this.setState({ isGoogleAccount });
		// });
	}

	componentDidMount() {
		this._isMounted = true;
		const { resources } = this.props;
		this.setState({
			newPasswordHint: resources.passwordHint
		});
		invoiz.on('userModelSubscriptionDataSet', () => {
			if (this._isMounted) {
				const isGoogleAccount = !!(invoiz.user && invoiz.user.googleId && invoiz.user.googleId.length > 0);
				this.setState({ isGoogleAccount });
			}
		});		
	}

	getOldPasswordError() {
		const { resources } = this.props;
		const { oldPassword } = this.state;
		let oldPasswordError = '';

		if (oldPassword.length === 0) {
			oldPasswordError = resources.mandatoryFieldValidation;
		}

		return oldPasswordError;
	}

	getNewPasswordError() {
		const { resources } = this.props;
		const { newPassword } = this.state;
		let newPasswordError = '';

		if (newPassword.length === 0) {
			newPasswordError = resources.mandatoryFieldValidation;
		} else if (!config.passwordChecks[1].test(newPassword)) {
			newPasswordError = resources.passwordHint;
		}

		return newPasswordError;
	}

	getNewPasswordHint(newPasswordError) {
		const { resources } = this.props;
		let newPasswordHint = this.state.newPasswordHint;

		if (newPasswordError.length > 0) {
			newPasswordHint = '';
		} else {
			newPasswordHint = resources.passwordHint;
		}

		return newPasswordHint;
	}

	onChangePasswordClicked() {
		const { resources } = this.props;
		const { oldPassword, newPassword } = this.state;

		this.validate(isFormValid => {
			if (isFormValid) {
				const data = {
					password: oldPassword,
					newPassword
				};

				invoiz
					.request(config.account.endpoints.changePassword, {
						method: 'PUT',
						auth: true,
						data
					})
					.then(() => {
						invoiz.page.showToast(resources.accountPasswordSuccessMessage);
					})
					.catch(error => {
						const {
							body: { meta }
						} = error;

						let message = resources.accountPasswordErrorMessage;

						if (meta.password && meta.password[0].code === INVALID) {
							message = resources.accountWrongPasswordMessage;
						}

						invoiz.page.showToast({ type: 'error', message });
					});
			}
		});
	}

	onOldPasswordKeyUp() {
		const { wasOldPasswordChanged } = this.state;

		if (wasOldPasswordChanged) {
			setTimeout(() => {
				this.setState({ oldPasswordError: this.getOldPasswordError() });
			});
		}
	}

	onNewPasswordKeyUp() {
		const { newPassword, wasNewPasswordChanged } = this.state;

		const passwordStrength = _.reduce(
			config.passwordChecks,
			(total, regex) => (regex.test(newPassword) ? total + 1 : total),
			0
		);

		this.setState({ passwordStrength }, () => {
			if (wasNewPasswordChanged) {
				setTimeout(() => {
					const newPasswordError = this.getNewPasswordError();
					const newPasswordHint = this.getNewPasswordHint(newPasswordError);
					this.setState({ newPasswordError: this.getNewPasswordError(), newPasswordHint });
				});
			}
		});
	}

	onNewPasswordBlur() {
		const { newPassword } = this.state;
		let passwordStrength = this.state.passwordStrength;
		let passwordStrengthVisible = this.state.passwordStrengthVisible;

		if (newPassword.length === 0) {
			passwordStrength = 1;
			passwordStrengthVisible = false;
		}

		this.setState({ passwordStrength, passwordStrengthVisible });
	}

	onNewPasswordFocus() {
		this.setState({ passwordStrengthVisible: true });
	}

	validate(submitCallback) {
		const oldPasswordError = this.getOldPasswordError();
		const newPasswordError = this.getNewPasswordError();
		const newPasswordHint = this.getNewPasswordHint(newPasswordError);

		this.setState({ oldPasswordError, newPasswordError, newPasswordHint }, () => {
			submitCallback(oldPasswordError.length === 0 && newPasswordError.length === 0);
		});
	}

	componentWillUnmount () {
		this._isMounted = false;
	}

	render() {
		const { resources } = this.props;
		const {
			isGoogleAccount,
			oldPasswordError,
			newPasswordError,
			newPasswordHint,
			passwordStrength,
			passwordStrengthVisible
		} = this.state;

		if (isGoogleAccount) {
			return null;
		}
		const PASSWORD_STRENGTH_LEVELS = [resources.str_uncertain, resources.str_sufficient, resources.str_sure, resources.str_fortKnox];
		return (
			<div className="settings-changepassword-component u_p_20">
				<div className="row"> {/*u_pt_60 u_pb_40  u_pt_20 */}
					<div className="col-xs-12 text-h4 u_pb_20">{resources.str_changePassword}</div>
					<div className="col-xs-12">
						{/* <div className="col-xs-12"> */}
							<div className="row">
								<div className="col-xs-6">
									<TextInputComponent
										name={'oldPassword'}
										value={this.state.oldPassword}
										onChange={evt =>
											this.setState({
												oldPassword: evt.target.value,
												wasOldPasswordChanged: true
											})
										}
										onKeyUp={() => this.onOldPasswordKeyUp()}
										label={resources.str_oldPassword}
										autoComplete="off"
										spellCheck="false"
										isPassword={true}
										errorMessage={oldPasswordError}
									/>
								</div>

								<div
									className={`col-xs-6 ${
										passwordStrengthVisible ? 'password-strength-visible' : ''
									}`}
								>
									<TextInputComponent
										name={'newPassword'}
										value={this.state.newPassword}
										onChange={evt =>
											this.setState({
												newPassword: evt.target.value,
												wasNewPasswordChanged: true
											})
										}
										onKeyUp={() => this.onNewPasswordKeyUp()}
										onBlur={() => this.onNewPasswordBlur()}
										onFocus={() => this.onNewPasswordFocus()}
										label={resources.str_newPassword}
										autoComplete="off"
										spellCheck="false"
										isPassword={true}
										noInputBar={true}
									/>

									{passwordStrengthVisible ? (
										<div className="password-strength">
											<div className="input_passwordStrength">
												{PASSWORD_STRENGTH_LEVELS[passwordStrength - 1]}
											</div>
											<div className="input_passwordBar">
												<div
													className={`input_passwordStep ${
														passwordStrength >= 1 ? 'active' : ''
													}`}
												>
													<span />
												</div>
												<div
													className={`input_passwordStep ${
														passwordStrength >= 2 ? 'active' : ''
													}`}
												>
													<span />
												</div>
												<div
													className={`input_passwordStep ${
														passwordStrength >= 3 ? 'active' : ''
													}`}
												>
													<span />
												</div>
												<div
													className={`input_passwordStep ${
														passwordStrength >= 4 ? 'active' : ''
													}`}
												>
													<span />
												</div>
											</div>
										</div>
									) : null}

									<TextInputHintComponent
										visible={newPasswordHint.length > 0}
										hintMessage={newPasswordHint}
									/>
									<TextInputErrorComponent
										visible={newPasswordError.length > 0}
										errorMessage={newPasswordError}
									/>
								</div>
							</div>
						{/* </div> */}
						<div className="col-xs-6 col-xs-offset-6">
							<ButtonComponent
								buttonIcon={'icon-check'}
								type="primary"
								callback={() => this.onChangePasswordClicked()}
								label={resources.str_changePassword}
								dataQsId="settings-account-btn-changePassword"
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default ChangePasswordComponent;
