import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import { cloneDeep } from 'lodash';
import { getPasswordInfo } from 'helpers/getPasswordInfo';
import { detectDevice } from 'helpers/detectDevice';
import ModalService from 'services/modal.service';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import ButtonComponent from 'shared/button/button.component';
import PasswordValidityCheckCompoment from 'shared/password-validity-check/password-validity-check.component';
import RegistrationInvitationExpiredModalComponent from 'shared/modals/registration-invitation-expired.modal.component';
import { handleNotificationErrorMessage } from 'helpers/errorMessageNotification';
class RegistrationInvitationComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = { 
			formData: {
				firstName: '',
				lastName: '',
				password: '',
				passwordRetyped: '',
			},
			passwordError: '',
			passwordInfo: '',
			checkPassword: false,
			isSaving: false,
		};
		this.isMobile = detectDevice() === 'phone' || detectDevice() === 'tablet';
		this.onChange = this.onChange.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.checkPasswordMatch = this.checkPasswordMatch.bind(this);
	}

	componentDidUpdate(prevProps) {
		if (prevProps.isExpired !== this.props.isExpired && this.props.isExpired) {
			window.setTimeout(() => {
				ModalService.open(<RegistrationInvitationExpiredModalComponent />, {
					width: 510,
					padding: '45px 0 65px',
					closeOnEscape: false,
					modalClass: 'registration-invitation-modal',
				});
			}, 100);
		}
	}

	onKeyDown(event) {
		const keyCode = event.keyCode || event.which;

		if (keyCode === 13 && this.checkPasswordValidity) {
			this.onConfirm();
		}
	}

	onChange(value, name) {
		const formData = cloneDeep(this.state.formData);
		formData[name] = value;

		this.setState({ formData, checkPassword: false, passwordError: '' });
	}

	onConfirm() {
		
		const { firstName, lastName, password } = this.state.formData;
		invoiz
			.request(`${config.account.endpoints.registerUser}`, {
				auth: true,
				customHeaders: { authorization: `Bearer ${this.props.temporaryToken}` },
				method: 'POST',
				data: {
					firstName,
					lastName,
					password,
				},
			})
			.then((response) => {
				if (this.isMobile) {
					const url = "intent:#Intent;action=com.buhl.imprezz;category=android.intent.category.DEFAULT;category=android.intent.category.BROWSABLE;S.msg_from_browser=Launched%20from%20Browser;end";
      				window.location.replace(url);
					  
					  setTimeout(() => {
						window.location.replace(
						  "https://play.google.com/store/apps/details?id=com.buhl.imprezz"
						);
					  }, 2000);
				} else {
					invoiz.user.login(response, true).then((redirectTo) => {
						invoiz.router.navigate(redirectTo, true);
					});
				}
			})
			.catch((error) => {
				const meta = error.body && error.body.meta;
				handleNotificationErrorMessage(meta);
			});
	}

	checkPasswordOnly() {
		const { password } = this.state.formData;
		const passwordLengthValid = password.length > 7;
		const passwordAlphaValid = /[A-Z]+/.test(password) && /[a-z]+/.test(password);
		const passwordSpecialValid = /[^a-zA-Z]+/.test(password);
		let isValid = false;

		if (passwordLengthValid && passwordAlphaValid && passwordSpecialValid) {
			isValid = true;
		}

		return isValid;
	}

	checkPasswordValidity() {
		const { password, passwordRetyped } = this.state.formData;
		const passwordsMatch = password === passwordRetyped;
		let isValid = false;

		if (this.checkPasswordOnly() && passwordsMatch) {
			isValid = true;
		}

		return isValid;
	}

	checkPasswordMatch() {
		const { password, passwordRetyped } = this.state.formData;
		if (password.length > 0 && passwordRetyped.length > 0) {
			this.setState({
				passwordError: password === passwordRetyped ? '' : 'Your passwords do not match.',
			});
		}
	}

	disableConfirmButton() {
		const { firstName, lastName, password, passwordRetyped } = this.state.formData;
		let disable = true;

		if (
			!this.props.isExpired &&
			!this.props.invalidCode &&
			firstName &&
			lastName &&
			password &&
			passwordRetyped &&
			this.checkPasswordValidity()
		) {
			disable = false;
		}

		return disable;
	}

	render() {
		const { firstName, lastName, password, passwordRetyped } = this.state.formData;
		const iconSrc = this.checkPasswordOnly() ? '/assets/images/svg/lock.svg' : '/assets/images/svg/lock_half.svg';

		return (
			<div className="landing-wrapper registration-invitation-wrapper">
				<div className="landing-sidebar">
					<div className="landing-fact">
						<div className="landing-fact-icon-background" />
						<img src={iconSrc} className="landing-fact-icon" />
						<div className="landing-fact-text">{password.length > 0 ? getPasswordInfo(password) : ''}</div>
					</div>
					<div className="landing-sidebar-footer">
						<a href="https://app.imprezz.in/imprint/" target="_blank">
						imprint
						</a>
						<div className="link-divider" />
						<a href="https://app.imprezz.in/privacy-policy/" target="_blank">
						Terms &amp; Privacy
						</a>
					</div>
				</div>
				<div className="landing-content">
					<div className="invoiz-logo">
						<img src="/assets/images/svg/imprezz.svg" />
					</div>
					<div className="landing-content-inner landing-content-big">
						{this.props.invalidCode ? (
							<div className="registration-invitation-invalid">
								<div>Unfortunately, your invitation link is not valid.</div>
								<ButtonComponent
									callback={() => {
										window.location.href = 'https://app.imprezz.in/';
									}}
									label="To imprezz"
									dataQsId="registration-invitation-invalid-btn"
								/>
							</div>
						) : (
							<div className="registration-invitation-content">
								<div className="row">
									<div className="col-xs-12 col-md-6 u_mb_20">
										<TextInputExtendedComponent
											value={firstName}
											name="firstName"
											label="First Name"
											onKeyDown={this.onKeyDown}
											onChange={this.onChange}
										/>
									</div>
									<div className="col-xs-12 col-md-6 u_mb_20">
										<TextInputExtendedComponent
											value={lastName}
											name="lastName"
											label="Last Name"
											onKeyDown={this.onKeyDown}
											onChange={this.onChange}
										/>
									</div>
								</div>
								<div className="row">
									<div className="col-xs-12 col-md-6 u_mb_20">
										<TextInputExtendedComponent
											value={password}
											name="password"
											isPassword={true}
											label="Password"
											onKeyDown={this.onKeyDown}
											onChange={this.onChange}
											onBlur={() => {
												password.length > 0 && this.setState({ checkPassword: true });
												this.checkPasswordMatch();
											}}
										/>
									</div>
									<div className="col-xs-12 col-md-6 u_mb_20">
										<TextInputExtendedComponent
											value={passwordRetyped}
											name="passwordRetyped"
											isPassword={true}
											label="Confirm Password"
											onKeyDown={this.onKeyDown}
											onChange={this.onChange}
											onBlur={this.checkPasswordMatch}
											errorMessage={this.state.passwordError}
										/>
									</div>
								</div>
								<div className="row">
									<div className="col-xs-12 col-md-6 u_mb_20">
										<PasswordValidityCheckCompoment
											password={this.state.formData.password}
											checkPassword={this.state.checkPassword}
										/>
									</div>
									<div className="col-xs-12 col-md-6 u_mb_20 text-medium text-light registration-invitation-hint">
										By joining, you agree to the <a href="https://www.imprezz.in/privacy-policy/">Terms of Use and Privacy Policy.</a>
									</div>
								</div>
								<div className="row">
									<div className="col-xs-12">
										<ButtonComponent
											wrapperClass="registration-invitation-confirm-btn u_mt_20"
											buttonIcon="icon-check_medium"
											callback={() => {
												this.onConfirm();
											}}
											disabled={this.disableConfirmButton() || this.state.isSaving}
											label="Join"
											dataQsId="registration-invitation-confirm"
										/>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}
}

export default RegistrationInvitationComponent;
