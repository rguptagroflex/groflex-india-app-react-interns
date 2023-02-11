import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import ButtonComponent from 'shared/button/button.component';
import ModalService from 'services/modal.service';
import OldBrowserModalComponent from 'shared/modals/old-browser-modal.component';
import { isOutdatedBrowser } from 'helpers/isOutdatedBrowser';
import TextInputComponent from 'shared/inputs/text-input/text-input.component';
// import { formatNumber } from 'helpers/formatNumber';
import { Link } from 'react-router-dom';
import { format } from 'util';
import { connect } from 'react-redux';
import imprezzLogoSmall from 'assets/images/impress_short_icon.png';
import landingImage from "assets/images/login/login.jpg";
import { detectDevice } from 'helpers/detectDevice';

class ResetPasswordComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			password: '',
			passwordRetyped: '',
			passwordsMatch: false,
			showPasswordError: false,
			passwordValid: false,
			passwordAlert: false,
			passwordAlertClicked: false,
			passwordInfo: ''
		};
		const { resources } = this.props;
		this.checkPasswordTimer = null;
		this.isMobile = detectDevice() === 'phone' || detectDevice() === 'tablet';

		setTimeout(() => {
			if (isOutdatedBrowser()) {
				ModalService.open(<OldBrowserModalComponent resources={resources} />, {
					isCloseable: true,
					width: 800,
					padding: 0,
					noTransform: true
				});
			}
		}, 1000);
	}

	componentDidMount() {
		setTimeout(() => {
			$('input[type="password"]')[0].focus();
		});
	}

	render() {
		const { resources } = this.props;
		const content = this.createPasswordForm();
		let iconSrc = '/assets/images/svg/lock.svg';
		let factText = this.state.passwordInfo || '';

		if (!this.state.passwordValid) {
			iconSrc = '/assets/images/svg/lock_half.svg';
			factText = this.state.passwordInfo || '';
		}

		return (
			<div className={`landing-wrapper reset-password-wrapper`}>
				<div className="landing-sidebar">
					<div className="imprezz-logo">
						<Link to="/account/login">
							<img src="/assets/images/svg/groflex.svg" />
						</Link>
					</div>

					<img className='landing-image' src={landingImage}/>

					<div className="footer">
						<hr></hr>
						<div style={{display: 'flex'}}>
							<p>For more details visit <a href={"https://groflex.io"} target="_blank">www.groflex.in</a></p>
							<a href="https://www.groflex.io/privacy-policy/" target="_blank">Terms & Conditions</a>
						</div>
					</div>
				</div>

				<div className="landing-content">
					{content}
					<div className="landing-content-footer">
						{resources.doNotForgetStr} <Link to="/account/login">{resources.str_toTheLogin}</Link>
					</div>
				</div>
			</div>
		);
	}

	onPasswordInput(ev) {
		const { resources } = this.props;
		const password = ev.target.value.trim();
		const passwordStrength = Math.round(Math.pow(96, password.length) / 1000000000);
		let duration = '';

		switch (true) {
			case passwordStrength < 60:
				if (passwordStrength < 1) {
					duration = `1 ${resources.str_seconds}`;
				} else {
					duration = `${passwordStrength} ${resources.str_seconds}`;
				}
				break;

			case passwordStrength >= 60 && passwordStrength < 2400:
				duration = `${Math.round(passwordStrength / 60)} ${resources.str_minutes}`;
				break;

			case passwordStrength >= 2400 && passwordStrength < 57600:
				duration = `${Math.round(passwordStrength / 2400)} ${resources.str_hours}`;
				break;

			case passwordStrength >= 57600 && passwordStrength < 1728000:
				duration = `${Math.round(passwordStrength / 57600)} ${resources.str_day}`;
				break;

			case passwordStrength >= 1728000 && passwordStrength < 51840000:
				duration = `${Math.round(passwordStrength / 1728000)} ${resources.str_months}`;
				break;

			case passwordStrength >= 51840000:
				let dur = Math.round(passwordStrength / 51840000);
				dur = dur > 800000000000000000000 ? 800000000000000000000 : dur;
				// dur = formatNumber(dur, { thousand: config.currencyFormat.thousand });
				duration = `${dur} ${resources.str_years}`;
				break;
		}

		const passwordInfo = format(resources.sidebarRegisterPasswordInfo, duration);

		this.setState({ password, passwordInfo }, () => {
			this.checkPasswordValidity();
		});
	}

	onPasswordRetype(ev) {
		const passwordRetyped = ev.target.value.trim();

		this.setState({ passwordRetyped }, () => {
			this.checkPasswordValidity();
		});
	}

	onPasswordKeydown(e) {
		const keyCode = e.keyCode || e.which;

		if (keyCode === 13 && this.state.passwordValid && this.state.passwordsMatch && !this.state.showPasswordError) {
			this.onSetPassword();
		}
	}

	onPasswordRetypeFocus() {
		this.checkPasswordValidity();
		this.setState({ passwordAlert: true });
	}

	onPasswordCheckClick() {
		if (this.state.passwordAlert) {
			this.setState({ passwordAlertClicked: true });
		}
	}

	checkPasswordValidity() {
		const passwordLengthValid = this.state.password.length > 7;
		const passwordAlphaValid = /[A-Z]+/.test(this.state.password) && /[a-z]+/.test(this.state.password);
		const passwordSpecialValid = /[^a-zA-Z]+/.test(this.state.password);
		const passwordsMatch = this.state.password === this.state.passwordRetyped;

		this.setState(
			{
				passwordValid: passwordLengthValid && passwordAlphaValid && passwordSpecialValid,
				passwordsMatch,
				showPasswordError: false
			},
			() => {
				clearTimeout(this.checkPasswordTimer);
				this.checkPasswordTimer = setTimeout(() => {
					this.setState({
						showPasswordError:
							this.state.password.length > 0 && this.state.passwordRetyped.length > 0 && !passwordsMatch
					});
				}, 1000);
			}
		);
	}

	onSetPassword() {
		const { resources } = this.props;

		if (!this.state.passwordValid || !this.state.passwordsMatch) {
			this.onPasswordCheckClick();
		} else {
			if (this.state.password === this.state.passwordRetyped) {
				const data = {
					password: this.state.password,
					token: this.props.token
				};

				invoiz
					.request(config.account.endpoints.resetPassword, { method: 'PUT', data })
					.then(response => {
						invoiz.page.showToast({
							message: resources.str_passwordSuccessfullResetMessage,
							wrapperClass: 'absolute-top'
						});
						invoiz.router.navigate('/account/login');
					})
					.catch(() => {
						invoiz.page.showToast({
							message: resources.defaultErrorMessage,
							type: 'error',
							wrapperClass: 'absolute-top'
						});
					});
			} else {
				this.setState({
					passwordsMatch: false
				});
			}
		}
	}

	createPasswordForm() {
		const {
			password,
			passwordRetyped,
			passwordValid,
			passwordsMatch,
			passwordAlert,
			passwordAlertClicked,
			showPasswordError
		} = this.state;
		const { resources } = this.props;
		const passwordLengthValid = password.length > 7;
		const passwordAlphaValid = /[A-Z]+/.test(password) && /[a-z]+/.test(password);
		const passwordSpecialValid = /[^a-zA-Z]+/.test(password);
		const checkIcon = <span className={`icon icon-check`} />;
		const alertIcon = <span className={`icon icon-close`} />;
		const passwordErrorElement = (
			<div className="landing-password-error">{resources.passwordNotMatch}</div>
		);

		return (
			<div className="landing-content-inner">
				{this.isMobile ? <div className="mobile-text-content">{resources.mobileDisplayText}</div> : null}
				<div className={`landing-content-headline ${passwordAlertClicked && !passwordValid ? 'alert' : ''}`}>
				 {resources.str_resetPassword}<br></br>
								<span className='sub-heading'>{resources.str_enterNewPasswordText}</span>
				</div>

				<div className={showPasswordError ? 'landing-password-mismatch' : ''}>
					<TextInputComponent
						value={password}
						isPassword={true}
						placeholder={resources.str_yourPassword}
						onKeyDown={e => this.onPasswordKeydown(e)}
						onChange={e => this.onPasswordInput(e)}
					/>

					<TextInputComponent
						value={passwordRetyped}
						isPassword={true}
						placeholder={resources.str_confirmPassword}
						onFocus={() => this.onPasswordRetypeFocus()}
						onKeyDown={e => this.onPasswordKeydown(e)}
						onChange={e => this.onPasswordRetype(e)}
					/>

					{showPasswordError && passwordErrorElement}

					<p
						className={`landing-password-validity ${
							passwordAlertClicked && !passwordLengthValid ? 'alert' : ''
						}`}
					>
						{resources.passwordValCharLengthText}
						<span
							className={`landing-password-check ${
								passwordLengthValid ? 'checked' : passwordAlert ? 'alert' : ''
							}`}
							onClick={() => this.onPasswordCheckClick()}
						>
							{passwordLengthValid ? checkIcon : null}
							{!passwordLengthValid && passwordAlert ? alertIcon : null}
						</span>
					</p>

					<p
						className={`landing-password-validity ${
							passwordAlertClicked && !passwordAlphaValid ? 'alert' : ''
						}`}
					>
						{resources.passwordValUpperAndLowerCaseText}
						<span
							className={`landing-password-check ${
								passwordAlphaValid ? 'checked' : passwordAlert ? 'alert' : ''
							}`}
							onClick={() => this.onPasswordCheckClick()}
						>
							{passwordAlphaValid ? checkIcon : null}
							{!passwordAlphaValid && passwordAlert ? alertIcon : null}
						</span>
					</p>

					<p
						className={`landing-password-validity ${
							passwordAlertClicked && !passwordSpecialValid ? 'alert' : ''
						}`}
					>
						{resources.passwordValNumberText}
						<span
							className={`landing-password-check ${
								passwordSpecialValid ? 'checked' : passwordAlert ? 'alert' : ''
							}`}
							onClick={() => this.onPasswordCheckClick()}
						>
							{passwordSpecialValid ? checkIcon : null}
							{!passwordSpecialValid && passwordAlert ? alertIcon : null}
						</span>
					</p>

					<ButtonComponent
						callback={() => this.onSetPassword()}
						customCssClass={`${!passwordValid || !passwordsMatch ? 'disabled' : ''}`}
						label={resources.str_resetPassword}
						dataQsId="reset-password-password-confirm"
					/>

					{passwordAlertClicked && !passwordValid ? (
						<p className="landing-email-error invalid-password">{resources.str_insecurePassword}</p>
					) : null}
				</div>
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return {
		resources
	};
};

export default connect(mapStateToProps)(ResetPasswordComponent);
