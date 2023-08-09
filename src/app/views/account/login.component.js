// import _ from 'lodash';
import invoiz from "services/invoiz.service";
import React from "react";
import config from "config";
import ButtonComponent from "shared/button/button.component";
import ModalService from "services/modal.service";
import WebStorageService from "services/webstorage.service";
import WebStorageKey from "enums/web-storage-key.enum";
// import coffeeIcon from 'assets/images/svg/coffee.svg';
// import sittingIcon from 'assets/images/svg/sitting.svg';
// import owlIcon from 'assets/images/svg/owl.svg';
// import sleepIcon from 'assets/images/svg/sleep.svg';
import sidebarMorningIcon from "assets/images/svg/15_million_freelancers.svg";
import sidebarAfternoonIcon from "assets/images/svg/160_countries.svg";
import groflexIcon from "assets/images/groflex_name_logo_color_no_tag.png";
import loginBg from "../../../assets/images/login/loginpage_bg.png";
import { Link } from "react-router-dom";
import googleIcon from "assets/images/social/google.png";
import sidebarEveningIcon from "assets/images/svg/gst.svg";
import sidebarNightIcon from "assets/images/svg/startups.svg";
// import loginBg from "assets/images/login/loginpage_bg.jpg";
import OldBrowserModalComponent from "shared/modals/old-browser-modal.component";
import { isOutdatedBrowser } from "helpers/isOutdatedBrowser";
// import { errorCodesWithMessages } from 'helpers/constants';
import { format } from "util";
import SharedDataService from "services/shared-data.service";
import TextInputComponent from "shared/inputs/text-input/text-input.component";
import imprezzLogoSmall from "assets/images/impress_short_icon.png";
import { connect } from "react-redux";
import { detectDevice } from "helpers/detectDevice";
import Carousel from "shared/carousel/Carousel.component";
import Invoiz from "services/invoiz.service";
import FirstColumn from "./firstColumn.component";

// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

class LoginComponent extends React.Component {
	constructor(props) {
		super(props);
		this._isMounted = false;
		this.state = {
			email: "",
			password: "",
			emailError: "",
			passwordError: "",
			oauthGoogleUrl: null,
			oauthLoginError: "",
			isLogginIn: false,
			hidePassword: true,
			activeSlide: 0,
			hidePasswordField: true,
		};
		this.isMobile = detectDevice() === "phone"; // || detectDevice() === 'tablet';

		this.handleSubmitFailure = this.handleSubmitFailure.bind(this);

		const { resources } = this.props;
		setTimeout(() => {
			if (isOutdatedBrowser()) {
				ModalService.open(<OldBrowserModalComponent resources={resources} />, {
					isCloseable: true,
					width: 800,
					padding: 0,
					noTransform: true,
				});
			}
		}, 1000);
	}

	componentDidMount() {
		const { resources } = this.props;
		const error = SharedDataService.get("google-oauth-login-error");
		this._isMounted = true;

		if (this._isMounted) {
			if (error) {
				if (
					error.body &&
					error.body.meta &&
					error.body.meta.email &&
					error.body.meta.email[0] &&
					error.body.meta.email[0].code &&
					error.body.meta.email[0].code === "EXISTS"
				) {
					this.setState({ oauthLoginError: resources.alreadyRegisteredError });
				} else {
					this.setState({ oauthLoginError: resources.noRegisteredError });
				}
			}
			invoiz
				.request(`${config.resourceHost}oauth`, {
					method: "GET",
				})
				.then(
					({
						body: {
							data: { google },
						},
					}) => {
						if (!this.isUnmounted) {
							this.setState({ oauthGoogleUrl: google });
						}
					}
				);
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
		this.isUnmounted = true;
	}

	onInputChange(ev, key) {
		const value = ev.target.value;
		if (key === "email") {
			this.setState({ email: value, emailError: "" });
		} else {
			this.setState({ password: value, passwordError: "" });
		}
	}

	onInputKeyDown(e, key) {
		const { resources } = this.props;
		const keyCode = e.keyCode || e.which;

		if (
			keyCode === 13 &&
			this.state.email &&
			this.state.password &&
			!this.state.emailError &&
			!this.state.passwordError
		) {
			this.onEmailSubmit();
		} else if (keyCode === 13) {
			if (this.state.password.length === 0) {
				this.setState({
					passwordError: resources.requiredFieldValidation,
				});
			}

			if (this.state.email.length === 0) {
				this.setState({
					emailError: resources.requiredFieldValidation,
				});
			}
		}
	}
	onViewPasswordClick() {
		this.setState({ hidePassword: !this.state.hidePassword });
	}

	onGoogleLoginClicked() {
		window.location.href = this.state.oauthGoogleUrl;
	}

	async onEmailSubmit() {
		const { resources } = this.props;
		const email = this.state.email.trim();

		if (!email) {
			return this.setState({ emailError: resources.requiredFieldValidation });
		} else if (!config.emailCheck.test(email)) {
			return this.setState({ emailError: resources.invalidEmailError });
		}

		WebStorageService.setItem(WebStorageKey.REGISTRATION_EMAIL, email);

		try {
			await Invoiz.request(config.account.endpoints.checkUser, { data: { email } });
			this.setState({ hidePasswordField: false });
		} catch (error) {
			if (error.body === "Not Found") {
				invoiz.router.navigate("/account/register");
			}
		}
	}

	onLoginSubmit() {
		const { resources } = this.props;
		const email = this.state.email.trim();
		const password = this.state.password.trim();

		if (email.length === 0 || password.length === 0) {
			this.setState({
				emailError: email.length === 0 ? resources.requiredFieldValidation : "",
				passwordError: password.length === 0 ? resources.requiredFieldValidation : "",
			});
		} else if (!config.emailCheck.test(email)) {
			this.setState({
				emailError: resources.invalidEmailError,
			});
		} else {
			const loginUser = (response) => {
				invoiz.user.userEmail = email;
				return invoiz.user.login(response).then((redirectTo) => {
					invoiz.router.navigate(redirectTo);
				});
			};

			this.setState({ isLogginIn: true }, () => {
				invoiz
					.request(config.account.endpoints.login, {
						method: "POST",
						data: {
							email,
							password,
						},
					})
					.then(loginUser)
					.catch(this.handleSubmitFailure);
			});
		}
	}
	handleSubmitFailure(error) {
		if (this._isMounted) {
			this.setState({ isLogginIn: false });
			const { resources } = this.props;
			const errorMappings = {
				email: { label: resources.str_email, stateKey: "emailError" },
				password: { label: resources.str_password, stateKey: "passwordError" },
			};

			if (error.body === "Unauthorized") {
				invoiz.showNotification({ type: "info", message: resources.approveEmailInfoMessage });
				return invoiz.router.navigate(`account/approve_resend/${this.data.email}`);
			}

			if (!error.body && !error.body.meta) {
				return;
			}

			for (const name in error.body.meta) {
				const field = errorMappings[name];

				if (name === "oauth") {
					this.setState({
						oauthLoginError: resources.googleSignInInfoMessage,
					});
				}

				if (!field) {
					return;
				}

				const errorCode = error.body.meta[name][0].code;

				// const filteredError = _.find(errorCodesWithMessages, error => {
				// 	return error.type === errorCode;
				// });

				const filteredError = resources.errorCodesWithMessages[errorCode];

				if (!filteredError) return;

				if (filteredError.indexOf("%s") > -1) {
					const serverMessage = format(filteredError, field.label);
					const stateObj = {};
					stateObj[field.stateKey] = serverMessage;
					this.setState(
						{
							emailError: "",
							passwordError: "",
						},
						() => {
							this.setState(stateObj);
						}
					);
					return;
				}
			}
		}
	}

	onEmailKeyDown(e) {
		const { hidePasswordField } = this.state;
		const keyCode = e.keyCode || e.which;

		if (keyCode === 13) {
			hidePasswordField ? this.onEmailSubmit() : this.onLoginSubmit();
		}

		this.setState({ emailError: "" });
	}

	render() {
		const { oauthGoogleUrl, oauthLoginError, isLogginIn, activeSlide, hidePasswordField } = this.state;
		const { resources } = this.props;
		const hours = new Date().getHours();
		let sidebarIcon = null;
		let sidebarText = "";

		if (hours >= 5 && hours < 12) {
			sidebarText = resources.sidebarMorningText;
			// sidebarIcon = coffeeIcon;
			sidebarIcon = sidebarMorningIcon;
		} else if (hours >= 12 && hours < 18) {
			sidebarText = resources.sidebarAfterNoonText;
			// sidebarIcon = sittingIcon;
			sidebarIcon = sidebarAfternoonIcon;
		} else if (hours >= 18 && hours < 23) {
			sidebarText = resources.sidebarEveningText;
			// sidebarIcon = owlIcon;
			sidebarIcon = sidebarEveningIcon;
		} else if (hours >= 23 || hours < 5) {
			sidebarText = resources.sidebarNightText;
			// sidebarIcon = sleepIcon;
			sidebarIcon = sidebarNightIcon;
		}

		return (
			<div className="landing-wrapper login-wrapper">
				{!this.isMobile ? <FirstColumn /> : null}

				<div className="landing-content">
					{this.isMobile ? (
						<div className="imprezz-logo">
							<Link to="/account/login">
								<img src="/assets/images/svg/groflex.svg" />
							</Link>
						</div>
					) : null}
					<div className="landing-content-inner">
						<div className="landing-content-inner-header">
							{this.isMobile ? (
								<div className="mobile-text-content">{resources.mobileDisplayText}</div>
							) : null}
							<div className="landing-content-headline">
								{hidePasswordField ? resources.str_login : resources.str_login} <br></br>
								{/* <span className="sub-heading">{resources.str_loginSub}</span> */}
							</div>
							<div className="landing-email-input-wrapper">
								<div className="login-input-wrapper">
									<TextInputComponent
										// autoComplete
										autoFocus={true}
										wrapperClass="no-vertical-margin"
										value={this.state.email}
										label={resources.str_enterEmail}
										id={"login-email"}
										name={"login-email"}
										errorMessage={this.state.emailError}
										onChange={(e) => this.onInputChange(e, "email")}
										// onKeyDown={e => this.onInputKeyDown(e, 'email')}
										onKeyDown={(e) => this.onEmailKeyDown(e)}
									/>

									{!hidePasswordField && (
										<TextInputComponent
											value={this.state.password}
											label={resources.str_password}
											id={"login-password"}
											name={"login-password"}
											isPassword={this.state.hidePassword}
											errorMessage={this.state.passwordError}
											onChange={(e) => this.onInputChange(e, "password")}
											onKeyDown={(e) => this.onInputKeyDown(e, "password")}
											icon={this.state.hidePassword ? "icon-invisible" : "icon-visible"}
											iconAction={() => this.onViewPasswordClick()}
											wrapperClass="password-field"
										/>
									)}
								</div>

								{oauthLoginError ? <div className="google-error">{oauthLoginError}</div> : null}

								{!hidePasswordField && (
									<div className="left- text-right" style={{ marginBottom: "10px" }}>
										{/* {`${resources.str_forgotPassword}?`} {this.isMobile ? <br/> : null} */}
										<Link
											className="color-primary is-bold"
											to="/account/forgot_password"
										>{`${resources.str_forgotPassword}?`}</Link>
									</div>
								)}
								{/* <div>
									{resources.noAccount} {this.isMobile ? <br/> : null}<Link to="/account/register">{resources.str_joinNow}</Link>
								</div> */}

								<ButtonComponent
									wrapperClass="no-top-margin"
									callback={() => (hidePasswordField ? this.onEmailSubmit() : this.onLoginSubmit())}
									label={hidePasswordField ? resources.loginLabel : "Login"}
									disabled={isLogginIn}
									dataQsId="login-btn-login"
									customCssClass="login-btn"
								/>

								<div className="or-div">
									<div
										style={{
											backgroundColor: "#00A353",
											height: "1px",
											width: "100%",
										}}
									/>
									<div style={{ margin: "0 23px" }}>Or</div>
									<div
										style={{
											backgroundColor: "#00A353",
											height: "1px",
											width: "100%",
										}}
									/>
								</div>

								{!hidePasswordField && (
									<p style={{ marginTop: 0 }}>
										Don't have an account?{" "}
										<Link className="color-primary is-bold" to={"/account/register"}>
											Sign up
										</Link>
									</p>
								)}
							</div>
						</div>
						{/* <div className='landing-content-inner-middle'>{resources.str_loginBetweenLable}</div> */}
						<div className="landing-content-inner-footer">
							{/* <hr></hr> */}
							{oauthGoogleUrl ? (
								<ButtonComponent
									wrapperClass="no-vertical-margin"
									callback={() => this.onGoogleLoginClicked()}
									// label={resources.googleLogin}
									// buttonIcon={'icon-google'}
									customCssClass={"button-google"}
									disabled={isLogginIn}
									dataQsId="login-btn-googleLogin"
								>
									<div className="button-google-content">
										<img
											width={20}
											height={20}
											style={{ marginRight: "10px", display: "inline-block" }}
											src={googleIcon}
											alt="loginwithgoogle"
										/>
										<span>{resources.googleLogin}</span>
									</div>
								</ButtonComponent>
							) : null}

							{/* <p>
								<span>Don't have an account? </span>
								<Link className="color-primary is-bold" to={"/account/register"}>
									Sign up
								</Link>
							</p> */}
							<p className="terms-privacy-link">
								By signing up you're agreeing to our{" "}
								<Link
									className="color-primary is-bold"
									to="https://groflex.in/terms-&-conditions"
									target="_blank"
								>
									Terms & Privacy
								</Link>
							</p>
						</div>
					</div>
					<div className="landing-content-footer">
						<div className="left-link">
							{`${resources.str_forgotPassword}?`} {this.isMobile ? <br /> : null}
							<Link to="/account/forgot_password">{resources.str_resetPassword}</Link>
						</div>
						<div>
							{resources.noAccount} {this.isMobile ? <br /> : null}
							<Link to="/account/register">{resources.str_joinNow}</Link>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return {
		resources,
	};
};

export default connect(mapStateToProps)(LoginComponent);
