import React from 'react';
import invoiz from 'services/invoiz.service';
import _ from 'lodash';
import config from 'config';
import lang from 'lang';
import ModalService from 'services/modal.service';
import ChangeEmailModal from 'shared/modals/change-email-modal.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import TextInputHintComponent from 'shared/inputs/text-input/text-input-hint.component';
import ButtonComponent from 'shared/button/button.component';
import { errorCodes } from 'helpers/constants';

const EMPTY_MESSAGE = 'This is a mandatory field';
const PASSWORD_STRENGTH_LEVELS = ['Unsure', 'Sufficient', 'For Sure', 'Fort Knox'];
const { INVALID } = errorCodes;

class ChangeUserComponent extends React.Component {
	constructor(props) {
		super(props);

		const { firstName, lastName } = props.account && props.account.user;

		this.state = {
			firstName: firstName || '',
			lastName: lastName || '',
			isGoogleAccount: !!(invoiz.user && invoiz.user.googleId && invoiz.user.googleId.length > 0),
			isAppleAccount: !!(invoiz.user && invoiz.user.appleId && invoiz.user.appleId.length > 0),
			oldPassword: '',
			newPassword: '',
			passwordStrength: 1,
			passwordStrengthVisible: false,
			oldPasswordError: '',
			newPasswordError: '',
			newPasswordHint: config.lang.passwordHint,
			wasOldPasswordChanged: false,
			wasNewPasswordChanged: false,
			noPasswordChanged: true
		};

		this.onInputChange = this.onInputChange.bind(this);

		invoiz.on('userModelSubscriptionDataSet', () => {
			const isGoogleAccount = !!(invoiz.user && invoiz.user.googleId && invoiz.user.googleId.length > 0);
			const isAppleAccount = !!(invoiz.user && invoiz.user.appleId && invoiz.user.appleId.length > 0);

			if (!this.isUnmounted) {
				this.setState({ isGoogleAccount, isAppleAccount });
			}
		});
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	getOldPasswordError() {
		const { oldPassword, newPassword } = this.state;
		let oldPasswordError = '';

		if (oldPassword.length === 0 && newPassword.length > 0) {
			oldPasswordError = EMPTY_MESSAGE;
		}

		return oldPasswordError;
	}

	getNewPasswordError() {
		const { newPassword, oldPassword } = this.state;
		let newPasswordError = '';

		if (newPassword.length === 0 && oldPassword.length > 0) {
			newPasswordError = EMPTY_MESSAGE;
		} else if (newPassword.length > 0 && !config.passwordChecks[1].test(newPassword)) {
			newPasswordError = config.lang.passwordHint;
		}

		return newPasswordError;
	}

	getNewPasswordHint(newPasswordError) {
		let newPasswordHint = this.state.newPasswordHint;

		if (newPasswordError.length > 0) {
			newPasswordHint = '';
		} else {
			newPasswordHint = config.lang.passwordHint;
		}

		return newPasswordHint;
	}

	onSave() {
		const { firstName, lastName, oldPassword, newPassword } = this.state;
		const { resources } = this.props;
		
		this.validate((isFormValid) => {
			if (isFormValid) {
				const data = {};

				if (oldPassword && newPassword) {
					data.password = oldPassword;
					data.newPassword = newPassword;
				}

				data.firstName = firstName;
				data.lastName = lastName;

				invoiz
					.request(config.account.endpoints.changePassword, {
						method: 'PUT',
						auth: true,
						data,
					})
					.then(() => {
						invoiz.page.showToast({ message: resources.accountDetailsSuccessMessage });
					})
					.catch((error) => {
						const {
							body: { meta },
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

	onEditEmailBtnClick() {
		const { email } = this.props.account.user;
		const { resources } = this.props;

		ModalService.open(<ChangeEmailModal accountEmail={email} resources={resources} />, {
			headline: 'Change e-mail address',
			isCloseable: false,
			width: 520,
			padding: 40,
			noTransform: true,
		});
	}

	onInputChange(value, name) {
		const state = _.cloneDeep(this.state);

		state[name] = value;
		this.setState(state);
	}

	render() {
		const {
			firstName,
			lastName,
			isGoogleAccount,
			isAppleAccount,
			oldPassword,
			oldPasswordError,
			newPassword,
			newPasswordError,
			newPasswordHint,
			passwordStrength,
			passwordStrengthVisible,
			noPasswordChanged
		} = this.state;
		const title = firstName || lastName ? `${firstName || ''} ${lastName || ''}` : 'Profile';
		const { resources } = this.props;
		const isEmptyError = newPasswordError === EMPTY_MESSAGE;

		if (isGoogleAccount || isAppleAccount) {
			return null;
		}

		return (
			<div className="settings-change-user-component">
				 <div className="row "> {/*u_pt_60 u_pb_40 */}
					<div className="col-xs-12 text-h4 u_pb_20">{'Profile'}</div> {/* {title} */}
					<div className="col-xs-12">
						{/* <div className="col-xs-12"> */}
							<div className="row">
								<TextInputExtendedComponent
									customWrapperClass="col-xs-6"
									name="firstName"
									value={firstName}
									onChange={this.onInputChange}
									label="First Name"
									autoComplete="new-password"
									spellCheck="false"
								/>

								<TextInputExtendedComponent
									customWrapperClass="col-xs-6"
									name="lastName"
									value={lastName}
									onChange={this.onInputChange}
									label="Last Name"
									autoComplete="new-password"
									spellCheck="false"
								/>
							</div>
							<div className="row update-email-row">
								{/* <div className="col-xs-6">
									<div className="user-email-label">Registered e-mail address</div>
								</div> */}
								{/* <div className="col-xs-6"> */}
									<TextInputExtendedComponent
										customWrapperClass="col-xs-6"
										label="Registered e-mail address"
										name="userEmail"
										value={this.props.account.user.email}
										autoComplete="off"
										spellCheck="false"
										disabled={true}
									/>
								{/* </div> */}
								<div className="col-xs-6">
									{!isGoogleAccount && !isAppleAccount && (
										<div className="form_input update-email-link">
											<a onClick={() => this.onEditEmailBtnClick()}>Change e-mail address</a>
										</div>
									)}
								</div>
							</div>
							{/* <div className="row">
								<div className="col-xs-6 col-xs-offset-6 text-right">
									{!isGoogleAccount && !isAppleAccount && (
										<div className="form_input update-email-link">
											<a onClick={() => this.onEditEmailBtnClick()}>Change e-mail address</a>
										</div>
									)}
								</div>
							</div> */}
							{/* {!isGoogleAccount && !isAppleAccount && (
								<div className="row u_mt_10">
									<div className="col-xs-6">
										<TextInputExtendedComponent
											name={'oldPassword'}
											value={oldPassword}
											onChange={(value, name) => {
												this.onInputChange(value, name);
												this.setState({
													wasOldPasswordChanged: true
												});
											}}
											onKeyUp={() => this.onOldPasswordKeyUp()}
											label={'Old Password'}
											autoComplete="new-password"
											spellCheck="false"
											isPassword={true}
											errorMessage={oldPasswordError}
										/>
									</div>

									<div
										className={`col-xs-6 new-password-input ${
											passwordStrengthVisible ? '' : ''
										}`}
									>
										<TextInputExtendedComponent
											name={'newPassword'}
											value={newPassword}
											onChange={(value, name) => {
												this.onInputChange(value, name);
												this.setState({
													wasNewPasswordChanged: true
												});
											}}
											onKeyUp={() => this.onNewPasswordKeyUp()}
											onBlur={() => this.onNewPasswordBlur()}
											onFocus={() => this.onNewPasswordFocus()}
											label={'New Password'}
											autoComplete="new-password"
											spellCheck="false"
											isPassword={true}
											noInputBar={true}
											customWrapperClass={`new-password-input-wrapper ${isEmptyError ? 'with-empty-error' : ''}`}
											errorMessage={newPasswordError}
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
									</div>
								</div>
							)} */}
						{/* </div> */}
						<div className="col-xs-6 col-xs-offset-6">						
							<ButtonComponent
								buttonIcon={'icon-check'}
								type="primary"
								callback={() => this.onSave()}
								label={resources.str_toSave}
								dataQsId="settings-account-btn-save-profil"
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default ChangeUserComponent;
