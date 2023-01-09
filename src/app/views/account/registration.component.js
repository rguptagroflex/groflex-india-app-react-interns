import React from "react";
import invoiz from "services/invoiz.service";
import config from "config";
import ModalService from "services/modal.service";
import { IntercomAPI } from "services/intercom.service";
import OldBrowserModalComponent from "shared/modals/old-browser-modal.component";
import RegistrationViewState from "enums/account/registration-view-state.enum";
import ButtonComponent from "shared/button/button.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import WebStorageService from "services/webstorage.service";
import WebStorageKey from "enums/web-storage-key.enum";
import { Link } from "react-router-dom";
import { isOutdatedBrowser } from "helpers/isOutdatedBrowser";
// import { formatNumber } from 'helpers/formatNumber';
import { formatCurrencySymbolDisplayInFront } from "helpers/formatCurrency";
import { detectDevice } from "helpers/detectDevice";
import { format } from "util";
import SelectStateInputComponent from "shared/select-state/select-state.component";
import imprezzLogoSmall from "assets/images/impress_short_icon.png";

import Carousel from "shared/carousel/Carousel.component";
import OnboardTileWrapper from "shared/onboarding/onboardtile-wrapper.component";
import OnboardInputComponent from "shared/onboarding/onboard-select.component";
import { handleTwoFactorErrors } from "helpers/errors";
import { DetailViewConstants, errorCodes } from "helpers/constants";
class RegistrationComponent extends React.Component {
	constructor(props) {
		super(props);

		const email = WebStorageService.getItem(WebStorageKey.REGISTRATION_EMAIL, true);
		const isAmazon = WebStorageService.getItem(WebStorageKey.IS_AMAZON_REGISTRATION);

		this.state = {
			activationDigits: ["", "", "", ""],
			activationError: false,
			chargesVat: true,
			email: email || "",
			emailValid: email && config.emailCheck.test(email),
			emailError: false,
			emailValidError: false,
			password: "",
			passwordRetyped: "",
			passwordsMatch: false,
			hidePassword: true,
			showPasswordError: false,
			passwordValid: false,
			passwordAlert: false,
			passwordAlertClicked: false,
			passwordInfo: "",
			viewState: this.props.viewState || RegistrationViewState.START,
			showApprovalHintModal: false,
			showMobileOtpModal: false,
			oauthGoogleUrl: null,
			isAmazon: !!isAmazon,
			stateId: null,
			mobileNo: "",
			mobileValid: false,
			mobileError: false,
			mobileValidError: false,
			mobileExistsError: false,
			isFinishDisable: false,
			isStartRegistrationDisable: false,
			isSetPasswordDisable: false,
			isSetStateDisable: false,
			isTileDisable: false,
			tileClicked: null,
			businessCategoryId: null,
			mobileOtpDigits: ["", "", "", "", "", ""],
			isMobileNoDisable: false,
			mobileOtpActivationError: false,
			mobileOtp: "",
			mobileErrorMessage: "",
			activeCarouselSlide: 0,
		};
		const { resources } = this.props;
		this.randomFactNumber = Math.floor(Math.random() * 2);
		this.invoiceAmount = formatCurrencySymbolDisplayInFront(this.props.invoiceAmount);
		this.resendDisabled = false;
		this.checkPasswordTimer = null;
		this.approvalHintTimeout = null;
		this.mobileVerifyTimeout = null;
		this.isMobile = detectDevice() === "phone" || detectDevice() === "tablet";

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
		if (
			(this.state.viewState === RegistrationViewState.WAIT_FOR_APPROVAL && !this.state.email) ||
			(this.state.viewState === RegistrationViewState.JUMP_TO_APPROVAL && !this.state.email) ||
			(this.state.viewState === RegistrationViewState.SET_PASSWORD && !invoiz.user.token) ||
			(this.state.viewState === RegistrationViewState.PICK_COMPANY_TYPE && !invoiz.user.loggedIn) ||
			(this.state.viewState === RegistrationViewState.SET_MOBILE_NO && !invoiz.user.loggedIn) ||
			(this.state.viewState === RegistrationViewState.SET_BUSINESS_TYPE && !invoiz.user.loggedIn) ||
			(this.state.viewState === RegistrationViewState.SET_BUSINESS_CATEGORY && !invoiz.user.loggedIn) ||
			(this.state.viewState === RegistrationViewState.SET_BUSINESS_TURNOVER && !invoiz.user.loggedIn)
			// (this.state.viewState === RegistrationViewState.VERIFY_MOBILE_NO && !invoiz.user.loggedIn)
		) {
			invoiz.router.navigate("/account/register", true, true);
		} else if (this.state.viewState === RegistrationViewState.WAIT_FOR_APPROVAL) {
			setTimeout(() => {
				$(".landing-activation-input input")[0].focus();
			});

			this.approvalHintTimeout = setTimeout(() => {
				if (this.refs.approvalFirstActivationInput) {
					this.setState({ showApprovalHintModal: true });
				}
			}, 40000);
		}
		// else if (this.state.viewState === RegistrationViewState.VERIFY_MOBILE_NO) {
		// 	this.mobileVerifyTimeout = setTimeout(() => {
		// 		if (this.refs.mobileFirstActivationInput) {
		// 			this.setState({ showMobileOtpModal: true });
		// 		}
		// 	}, 50000);
		// }
		else if (this.state.viewState === RegistrationViewState.SET_PASSWORD) {
			setTimeout(() => {
				$('input[type="password"]')[0].focus();
			});
		} else if (this.state.viewState === RegistrationViewState.JUMP_TO_APPROVAL) {
			this.onStartRegistration();
		} else if (this.state.viewState === RegistrationViewState.PICK_COMPANY_TYPE) {
			if (
				!invoiz.releaseStage ||
				invoiz.releaseStage === "qa" ||
				invoiz.releaseStage === "staging" ||
				invoiz.releaseStage === "production"
			) {
				window._tfa = window._tfa || [];
				window._tfa.push({ notify: "event", name: "lead", id: 1165671 });
			}
		} else if (this.state.viewState === RegistrationViewState.START) {
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
		this.isUnmounted = true;
	}

	render() {
		const { viewState, showApprovalHintModal, showMobileOtpModal, activeCarouselSlide, oauthGoogleUrl } =
			this.state;
		const { resources } = this.props;
		const registrationFact = this.createRegistrationFact();
		const registrationContent = this.createRegistrationContent();
		const footer = this.createFooter();

		const approvalHintModal = (
			<div className="approval-hint-modal md_content">
				<div className="modal-wrapper">
					<div className="icon icon-close" onClick={() => this.closeApprovalHintModal()} />
					<div className="headline text-h4">{resources.str_emailNotReceive}</div>
					<div className="text-block">{resources.str_check}...</div>
					<div className="hints-block">
						<div className="hints-row">
							<div className="hints-col-left">1</div>
							<div className="hints-col-right">
								&hellip; {resources.correctnessOfEmail}:<u>{this.state.email}</u> <br />
								<a onClick={() => this.changeEmail()}>{resources.str_correctEmailAddress}</a>
							</div>
						</div>
						<div className="hints-row second-row">
							<div className="hints-col-left">2</div>
							<div className="hints-col-right">&hellip; {resources.str_spanFolder}</div>
						</div>
					</div>
					<div className="text-block">{resources.registerWaitingText}</div>
					<div className="text-block">{resources.str_stillHaveProblem}</div>
				</div>
			</div>
		);

		const mobileVerifyModal = (
			<div className="approval-hint-modal md_content">
				<div className="modal-wrapper">
					<div className="icon icon-close" onClick={() => this.closeMobileVerifyModal()} />
					<div className="headline text-h4">{`Did not receive an OTP?`}</div>
					<div className="text-block">{resources.str_check}...</div>
					<div className="hints-block">
						<div className="hints-row">
							<div className="hints-col-left">1</div>
							<div className="hints-col-right">
								&hellip; {resources.correctnessOfMobileNumber}: <u>{invoiz.user.mobile}</u> <br />
								<a onClick={() => this.changeMobile()}>{resources.correctMobileNumber}</a>
							</div>
						</div>
						{/* <div className="hints-row second-row">
							<div className="hints-col-left">2</div>
							<div className="hints-col-right">&hellip; {resources.str_requestForNewOTP}</div>
						</div> */}
					</div>
					<div className="text-block">{resources.registerMobileWaitingText}</div>
					<div className="text-block">{resources.str_stillHaveProblem}</div>
				</div>
			</div>
		);

		if (viewState !== RegistrationViewState.WAIT_FOR_APPROVAL) {
			clearTimeout(this.approvalHintTimeout);
		}

		if (viewState !== RegistrationViewState.VERIFY_MOBILE_NO) {
			clearTimeout(this.mobileVerifyTimeout);
		}

		return (
			<div className={`landing-wrapper landing-state-${viewState}`}>
				<div className="landing-sidebar">
					<div className="imprezz-logo">
						<Link to="/account/login">
							<img src="/assets/images/svg/groflex.svg" />
						</Link>
					</div>

					{/* <div className="landing-fact-imprezz-logo">
						<Link to="/account/login">
							<img className="imprezz-small-image" src={imprezzLogoSmall} />
						</Link>
					</div> */}
					{/* {registrationFact} */}

					<div className="landing-carousel-wrapper">
						<Carousel
							className="landing-carousel"
							activeSlide={activeCarouselSlide}
							updateActiveSlide={(slide) => this.setState({ activeCarouselSlide: slide })}
						>
							<Carousel.Slides>
								<div className="landing-carousel-slide text-center">
									<p className="landing-carousel-slide-title">Best and Easiest Billing Software!</p>
									<div className="landing-carousel-slide-content">
										<img
											className="landing-carousel-slide-content-image"
											width={200}
											height={200}
											src="/assets/images/svg/landing/landing-slide1.svg"
										/>
										<div className="landing-carousel-slide-content-points">
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg" />
												<p>Create GST compliant invoices</p>
											</div>
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg" />
												<p>Recurring invoices for your buis</p>
											</div>
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg" />
												<p>Create bills in multiple currencies</p>
											</div>
										</div>
									</div>
								</div>
								<div className="landing-carousel-slide text-center">
									<p className="landing-carousel-slide-title">Sales Insights at your Finger Tips</p>
									<div className="landing-carousel-slide-content">
										<img
											className="landing-carousel-slide-content-image"
											width={200}
											height={200}
											src="/assets/images/svg/landing/landing-slide2.svg"
										/>
										<div className="landing-carousel-slide-content-points">
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg" />
												<p>Analyse your business better</p>
											</div>
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg" />
												<p>Real-time business data</p>
											</div>
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg" />
												<p>
													Get your sales numbers increasing<br></br> with smart products
												</p>
											</div>
										</div>
									</div>
								</div>
								<div className="landing-carousel-slide text-center">
									<p className="landing-carousel-slide-title">Manage your Expenses Effectively</p>
									<div className="landing-carousel-slide-content">
										<img
											className="landing-carousel-slide-content-image"
											width={200}
											height={200}
											src="/assets/images/svg/landing/landing-slide3.svg"
										/>
										<div className="landing-carousel-slide-content-points">
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg" />
												<p>
													Track all your expenses and <br></br>purchases in one place
												</p>
											</div>
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg" />
												<p>Easiest tool for expense tracking</p>
											</div>
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg" />
												<p>Create purchase orders</p>
											</div>
										</div>
									</div>
								</div>
							</Carousel.Slides>
							<Carousel.PageIndicators>
								<button
									key={0}
									className={activeCarouselSlide === 0 ? "active" : ""}
									onClick={() => this.setState({ activeCarouselSlide: 0 })}
								/>
								<button
									key={1}
									className={activeCarouselSlide === 1 ? "active" : ""}
									onClick={() => this.setState({ activeCarouselSlide: 1 })}
								/>
								<button
									key={2}
									className={activeCarouselSlide === 2 ? "active" : ""}
									onClick={() => this.setState({ activeCarouselSlide: 2 })}
								/>
							</Carousel.PageIndicators>
						</Carousel>
					</div>

					<div className="media-coverage text-center">
						<p className="media-coverage-title">National media that has covered us!</p>
						<div className="media-coverage-sources">
							<div className="media-coverage-sources-item">
								<img src="/assets/images/landing/hindu.png" />
							</div>
							<div className="media-coverage-sources-item">
								<img src="/assets/images/landing/indian-express.png" />
							</div>
							<div className="media-coverage-sources-item">
								<img src="/assets/images/landing/indian-retailers.png" />
							</div>
						</div>
					</div>

					<div className="footer">
						<hr></hr>
						<div style={{ display: "flex" }}>
							<p>
								For more details visit <a href={"https://imprezz.in"}>www.imprezz.in</a>
							</p>
							<a href="https://www.imprezz.in/privacy-policy/" target="_blank">
								Terms & Privacy
							</a>
						</div>
					</div>

					{/* <div className="landing-sidebar-footer">
						<a href="https://www.imprezz.in/imprint/" target="_blank">
							{resources.str_imprint}
						</a>
						<div className="link-divider" />
						<a href="https://www.imprezz.in/privacy-policy/" target="_blank">
							{resources.str_termsPrivacy}
						</a>
					</div> */}
				</div>

				<div className="landing-content">
					<div className="landing-content-inner">
						<div className="landing-content-inner-header">
							{/* <div className="invoiz-logo">
								<Link to="/account/login">
									<img src="/assets/images/svg/imprezz.svg" />
								</Link>
							</div> */}

							{registrationContent} 

							{viewState === RegistrationViewState.WAIT_FOR_APPROVAL && showApprovalHintModal
								? approvalHintModal
								: null}

							{viewState === RegistrationViewState.VERIFY_MOBILE_NO && showMobileOtpModal
								? mobileVerifyModal
								: null}

							{footer}
						</div>
						<div className="landing-content-inner-footer">
							{oauthGoogleUrl ? (
								<hr></hr>
							) : null}
							
							{oauthGoogleUrl ? (
								<ButtonComponent
									callback={() => this.onGoogleRegisterClicked()}
									label={resources.googleLogin}
									// buttonIcon={"icon-google"}
									customCssClass={"button-google"}
									// disabled={isLogginIn}
									dataQsId="login-btn-googleLogin"
								/>
							) : null}
							{/* <p className="terms-privacy-link">
								By signing up you're agreeing to our
								<a href="https://www.imprezz.in/privacy-policy/" target="_blank">
									{" "}
									TERMS & PRIVACY
								</a>
							</p> */}
						</div>
					</div>
				</div>
			</div>
		);
	}

	closeApprovalHintModal() {
		this.setState({ showApprovalHintModal: false });
		this.refs.approvalFirstActivationInput.refs.approvalFirstActivationInput.focus();
	}

	closeMobileVerifyModal() {
		this.setState({ showMobileOtpModal: false });
		this.refs.mobileFirstActivationInput.refs.mobileFirstActivationInput.focus();
	}

	async onStartRegistration() {
		const { emailValid, viewState } = this.state;

		if (!emailValid) {
			this.setState({ emailValidError: true });
			return;
		}

		WebStorageService.setItem(WebStorageKey.REGISTRATION_EMAIL, this.state.email);
		this.setState({ isStartRegistrationDisable: true }, () => {
			invoiz
				.request(config.account.endpoints.registerEmail, {
					method: "POST",
					data: { email: this.state.email },
				})
				.then(async (response) => {
					const {
						data: { token, emailProvider },
					} = response.body;

					invoiz.user.token = token;
					WebStorageService.setItem(WebStorageKey.REGISTRATION_EMAIL_PROVIDER, emailProvider);
					this.emailProvider = emailProvider;

					console.log("push 1");
					// this.dataLayerPush({
					// 	regStep: 'register-doi',
					// 	event: 'register'
					// });
					this.setState({ isStartRegistrationDisable: false });
					await this.onSetPassword();
					invoiz.router.navigate("/account/register/doi", true);
				})
				.catch(() => {
					if (viewState === RegistrationViewState.JUMP_TO_APPROVAL) {
						this.setState({ emailError: true, viewState: RegistrationViewState.START });
					} else {
						this.setState({ emailError: true });
					}
					this.setState({ isStartRegistrationDisable: false });
				});
		});
	}

	onActivationInput(index, val) {
		const { resources } = this.props;
		const digits = this.state.activationDigits;
		let complete = true;
		digits[index] = val;
		digits.forEach((digit) => {
			if (digit.length === 0) {
				complete = false;
			}
		});

		const newState = {
			activationError: false,
			activationDigits: digits,
			showApprovalHintModal: false,
		};

		if (complete) {
			invoiz
				.request(config.account.endpoints.validateCode, {
					method: "POST",
					auth: true,
					data: { code: digits.join("") },
				})
				.then((response) => {
					console.log("push 2");

					invoiz.page.showToast({
						message: resources.registrationSucsessText,
						wrapperClass: "absolute-top",
					});
					this.dataLayerPush({
						regStep: "register-finished",
						event: "register",
					});
					invoiz.user.registrationStep = "mobile";
					invoiz.router.navigate("/account/register/mobile", true);
					// invoiz.router.navigate('/', true, true);
				})
				.catch((err) => {
					newState.activationError = true;
					this.setState(newState);
				});
		} else {
			this.setState(newState, () => {
				const nextInput = index < 3 ? index + 1 : null;
				if (this.state.activationDigits[index] && nextInput) {
					$(".landing-activation-input input")[nextInput].focus();
				}
			});
		}
	}

	onActivationPaste(index, e) {
		const pastedText = e.clipboardData.getData("Text");
		for (let i = 0; i < 4; i++) {
			if (index + i < 4) {
				this.onActivationInput(index + i, pastedText[i]);
			}
		}
	}

	onActivationKeyDown(index, e) {
		if (e && e.nativeEvent) {
			const keyCode = e.nativeEvent.keyCode || e.nativeEvent.which;
			switch (keyCode) {
				case 8:
					if (this.state.activationDigits[index].length === 0) {
						const previousIndex = index - 1;
						if (previousIndex >= 0) {
							const digits = this.state.activationDigits;
							digits[previousIndex] = "";
							this.setState({ activationDigits: digits, activationError: false }, () => {
								setTimeout(() => {
									$(".landing-activation-input input")[previousIndex].focus();
								});
							});
						}
					}
					break;
				case 37:
					const previousIndex = index > 0 ? index - 1 : 0;
					$(".landing-activation-input input")[previousIndex].focus();
					setTimeout(() => {
						$(".landing-activation-input input")[previousIndex].select();
					});
					break;
				case 39:
					const nextIndex = index < 4 ? index + 1 : 4;
					$(".landing-activation-input input")[nextIndex].focus();
					setTimeout(() => {
						$(".landing-activation-input input")[nextIndex].select();
					});
					break;
			}
		}
	}

	onMobileOtpInput(index, val) {
		const { resources } = this.props;
		const digits = this.state.mobileOtpDigits;
		let complete = true;
		digits[index] = val;
		digits.forEach((digit) => {
			if (digit.length === 0) {
				complete = false;
			}
		});

		const newState = {
			mobileOtpError: false,
			mobileOtpDigits: digits,
			showMobileOtpModal: false,
		};

		if (complete) {
			this.setState({ mobileOtp: digits.join("") });
		} else {
			this.setState(newState, () => {
				const nextInput = index < 6 ? index + 1 : null;
				if (this.state.mobileOtpDigits[index] && nextInput) {
					$(".landing-activation-mobile-input input")[nextInput].focus();
				}
			});
		}
	}

	onMobileOtpPaste(index, e) {
		const pastedText = e.clipboardData.getData("Text");
		for (let i = 0; i < 4; i++) {
			if (index + i < 4) {
				this.onMobileOtpInput(index + i, pastedText[i]);
			}
		}
	}

	onMobileOtpDown(index, e) {
		if (e && e.nativeEvent) {
			const keyCode = e.nativeEvent.keyCode || e.nativeEvent.which;
			switch (keyCode) {
				case 8:
					if (this.state.mobileOtpDigits[index].length === 0) {
						const previousIndex = index - 1;
						if (previousIndex >= 0) {
							const digits = this.state.mobileOtpDigits;
							digits[previousIndex] = "";
							this.setState({ mobileOtpDigits: digits, mobileOtpActivationError: false }, () => {
								setTimeout(() => {
									$(".landing-activation-mobile-input input")[previousIndex].focus();
								});
							});
						}
					}
					break;
				case 37:
					const previousIndex = index > 0 ? index - 1 : 0;
					$(".landing-activation-mobile-input input")[previousIndex].focus();
					setTimeout(() => {
						$(".landing-activation-mobile-input input")[previousIndex].select();
					});
					break;
				case 39:
					const nextIndex = index < 6 ? index + 1 : 6;
					$(".landing-activation-mobile-input input")[nextIndex].focus();
					setTimeout(() => {
						$(".landing-activation-mobile-input input")[nextIndex].select();
					});
					break;
			}
		}
	}

	onPasswordInput(val) {
		const { resources } = this.props;
		const passwordStrength = Math.round(Math.pow(96, val.length) / 1000000000);
		const password = val.trim();
		let duration = "";

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
		this.setState(
			{
				password,
				passwordRetyped: password,
				passwordInfo,
			},
			() => {
				this.checkPasswordValidity();
			}
		);
	}

	onPasswordRetype(val) {
		const passwordRetyped = val.trim();

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
		// const passwordsMatch = this.state.password === this.state.passwordRetyped;
		const passwordsMatch = true;

		this.setState(
			{
				passwordValid: passwordLengthValid && passwordAlphaValid && passwordSpecialValid,
				passwordsMatch,
				showPasswordError: false,
			},
			() => {
				clearTimeout(this.checkPasswordTimer);
				this.checkPasswordTimer = setTimeout(() => {
					this.setState({
						showPasswordError:
							this.state.password.length > 0 && this.state.passwordRetyped.length > 0 && !passwordsMatch,
					});
				}, 1000);
			}
		);
	}

	async onSetPassword() {
		const { resources } = this.props;
		if (!this.state.passwordValid || !this.state.passwordsMatch) {
			this.onPasswordCheckClick();
		} else {
			if (this.state.password === this.state.passwordRetyped) {
				this.setState({ isSetPasswordDisable: true }, () => {
					invoiz
						.request(config.account.endpoints.setPassword, {
							method: "POST",
							auth: true,
							data: { password: this.state.password, email: this.state.email },
						})
						.then((response) => {
							// this.dataLayerPush({
							// 	regStep: 'register-legalform',
							// 	event: 'register'
							// });
							console.log("push 4");
							this.dataLayerPush({
								regStep: "register-doi",
								event: "register",
							});

							invoiz.page.showToast({
								message: resources.str_successCreatePassword,
								wrapperClass: "absolute-top",
							});
							this.setState({ isSetPasswordDisable: false });

							// invoiz.user.login(response).then(redirectTo => {
							// 	console.log('redirect to', redirectTo)
							// 	invoiz.router.navigate(redirectTo, true);
							// });
							invoiz.user.login(response);
						})
						.catch((err) => {
							invoiz.page.showToast({ message: resources.defaultErrorMessage, type: "error" });
							this.setState({ isSetPasswordDisable: false });
						});
				});
			} else {
				this.setState({
					passwordsMatch: false,
				});
			}
		}
	}

	onMobileInput(val) {
		if (val.length < 10 || !config.mobileNumberValidation.test(val)) {
			this.setState({ mobileNo: val, mobileValid: false, mobileError: false });
		} else {
			this.setState({ mobileNo: val, mobileValid: true, mobileError: false });
		}
	}

	onMobileKeyDown(e) {
		const keyCode = e.keyCode || e.which;

		if (keyCode === 13 && this.state.mobileNo && this.state.mobileValid && !this.state.mobileError) {
			this.onSetMobileNo();
		}

		this.setState({ mobileValidError: false });
	}

	onEmailInput(val) {
		if (config.emailCheck.test(val)) {
			this.setState({ email: val, emailValid: true, emailError: false });
		} else {
			this.setState({ email: val, emailValid: false, emailError: false });
		}
	}

	onEmailKeyDown(e) {
		const keyCode = e.keyCode || e.which;

		if (keyCode === 13 && this.state.email && this.state.emailValid && !this.state.emailError) {
			this.onStartRegistration();
		}

		this.setState({ emailValidError: false });
	}

	onStateChanged(indiaStateObj) {
		this.setState({ stateId: indiaStateObj.id });
	}

	onSetState() {
		const { resources } = this.props;
		const email = WebStorageService.getItem(WebStorageKey.REGISTRATION_EMAIL);
		this.setState({ isSetStateDisable: true }, () => {
			invoiz
				.request(config.account.endpoints.setTanantState, {
					method: "PUT",
					auth: true,
					data: { indiaStateId: this.state.stateId },
				})
				.then((response) => {
					invoiz.user.indiaStateId = this.state.stateId;
					// invoiz.user.userEmail = email
					console.log("push 5");
					this.dataLayerPush({
						regStep: "register-mobile",
						event: "register",
					});
					this.setState({ isSetStateDisable: false });
					invoiz.page.showToast({
						message: resources.str_successFullSetState,
						wrapperClass: "absolute-top",
					});

					invoiz.user.registrationStep = RegistrationViewState.SET_MOBILE_NO;
					invoiz.router.navigate("/account/register/mobile", true, true);
				})
				.catch((err) => {
					invoiz.page.showToast({ message: resources.defaultErrorMessage, type: "error" });
					this.setState({ isSetStateDisable: false });
				});
		});
	}

	onSetMobileNo() {
		const { resources } = this.props;
		const email = WebStorageService.getItem(WebStorageKey.REGISTRATION_EMAIL);
		this.setState({ isMobileNoDisable: true }, () => {
			invoiz
				.request(config.account.endpoints.setTanantMobileNo, {
					method: "PUT",
					auth: true,
					data: { mobileNo: this.state.mobileNo },
				})
				.then((response) => {
					invoiz.user.mobile = this.state.mobileNo;
					// invoiz.user.userEmail = email
					console.log("push 6");
					this.dataLayerPush({
						regStep: "register-mobileotp",
						event: "register",
					});
					this.setState({ isMobileNoDisable: false });
					invoiz.page.showToast({
						message: `Successfully updated number!`,
						wrapperClass: "absolute-top",
					});

					invoiz.user.registrationStep = RegistrationViewState.VERIFY_MOBILE_NO;
					invoiz.router.navigate("/account/register/mobileotp", true, true);
				})
				.catch((err) => {
					if (err.body && err.body.meta && err.body.meta.mobile[0].code === errorCodes.EXISTS) {
						this.setState({ mobileExistsError: true, isMobileNoDisable: false });
					} else {
						invoiz.page.showToast({ message: resources.defaultErrorMessage, type: "error" });
						this.setState({ isMobileNoDisable: false });
					}
				});
		});
	}

	onFinish() {
		const { resources } = this.props;
		const { mobileOtpActivationError, viewState, mobileOtp } = this.state;

		if (!mobileOtp) {
			this.setState({ mobileOtpActivationError: true });
			return;
		}

		const email = WebStorageService.getItem(WebStorageKey.REGISTRATION_EMAIL);
		let amazonRedirectUrl = WebStorageService.getItem(WebStorageKey.AMAZON_REDIRECT_URL);
		this.setState({ isFinishDisable: true }, () => {
			invoiz
				.request(config.account.endpoints.validateMobileOtp, {
					method: "PUT",
					auth: true,
					data: { mobileOtp: this.state.mobileOtp },
				})
				.then((response) => {
					console.log("push 7");
					this.dataLayerPush({
						regStep: "register-complete",
						chargesVat: this.state.chargesVat,
						event: "register",
					});
					this.setState({ isFinishDisable: false });
					if (amazonRedirectUrl && email) {
						amazonRedirectUrl = `${decodeURIComponent(amazonRedirectUrl)}&infoField1=${encodeURIComponent(
							email
						)}`;

						WebStorageService.clear();

						window.location.href = amazonRedirectUrl;
					} else {
						invoiz.user.registrationStep = "legal_form";

						if (this.isMobile) {
							invoiz.page.showToast({
								message: resources.str_accountSucessfullSetMessage,
							});
							invoiz.router.navigate("/account/mobile");
						} else {
							if (window && window._tfa) {
								// eslint-disable-next-line no-undef
								_tfa.push({ notify: "event", name: "complete_registration", id: 1291642 });
							}
							invoiz.page.showToast({
								message: `${resources.str_accountSucessfullSetMessage} ${resources.str_haveFunWithInvoizMessage}`,
							});
							if (window && window.dataLayer) {
								window.dataLayer.push({ event: "registration_completed" });
							}
							invoiz.router.navigate("/");
						}
					}
				})
				.catch((err) => {
					let errorMessage = "";
					if (err.body.message === "Success" && err.body.meta === "OTP Expired") {
						errorMessage = resources.mobileOtpExpiredMessage;
						this.setState({ mobileOtpActivationError: true, mobileErrorMessage: errorMessage });
					} else if (err.body.message === "Error" && err.body.meta === "OTP Mismatch") {
						errorMessage = resources.mobileOtpInvalidMessage;
						this.setState({ mobileOtpActivationError: true, mobileErrorMessage: errorMessage });
					} else if (err.body.message === "Error") {
						errorMessage = resources.mobileOtpVerifyErrorMessage;
						this.setState({ mobileOtpActivationError: true, mobileErrorMessage: errorMessage });
					}
				});
		});
	}

	onFinish() {
		const { resources } = this.props;
		const { mobileOtpActivationError, viewState, mobileOtp } = this.state;

		if (!mobileOtp || mobileOtpActivationError) {
			this.setState({ mobileOtpActivationError: true });
			return;
		}

		const email = WebStorageService.getItem(WebStorageKey.REGISTRATION_EMAIL);
		let amazonRedirectUrl = WebStorageService.getItem(WebStorageKey.AMAZON_REDIRECT_URL);

		// const digits = this.state.mobileOtpDigits;
		// let complete = true;
		// digits[index] = val;
		// digits.forEach(digit => {
		// 	if (digit.length === 0) {
		// 		complete = false;
		// 	}
		// });

		// const newState = {
		// 	mobileOtpActivationError: false,
		// 	mobileOtpDigits: digits,
		// 	showMobileOtpModal: false,
		// 	isFinishDisable: false
		// };

		this.setState({ isFinishDisable: true }, () => {
			invoiz
				.request(config.account.endpoints.validateMobileOtp, {
					method: "PUT",
					auth: true,
					data: { mobileOtp: this.state.mobileOtp },
				})
				.then((response) => {
					console.log("push 8");
					this.dataLayerPush({
						regStep: "register-complete",
						chargesVat: this.state.chargesVat,
						event: "register",
					});
					this.setState({ isFinishDisable: false });
					if (amazonRedirectUrl && email) {
						amazonRedirectUrl = `${decodeURIComponent(amazonRedirectUrl)}&infoField1=${encodeURIComponent(
							email
						)}`;

						WebStorageService.clear();

						window.location.href = amazonRedirectUrl;
					} else {
						invoiz.user.registrationStep = "legal_form";

						if (this.isMobile) {
							invoiz.page.showToast({
								message: resources.str_accountSucessfullSetMessage,
							});
							invoiz.router.navigate("/account/mobile");
						} else {
							if (window) {
								if (window._tfa) {
									// eslint-disable-next-line no-undef
									_tfa.push({ notify: "event", name: "complete_registration", id: 1291642 });
								}
								if (window.dataLayer) {
									window.dataLayer.push({ event: "registration_completed" });
								}
								if (window.Intercom) {
									IntercomAPI.update();
								}
							}
							invoiz.page.showToast({
								message: `${resources.str_accountSucessfullSetMessage} ${resources.str_haveFunWithInvoizMessage}`,
							});

							invoiz.router.navigate("/");
						}
					}
				})
				.catch((err) => {
					let errorMessage = "";
					if (err.body.message === "Success" && err.body.meta === "OTP Expired") {
						errorMessage = resources.mobileOtpExpiredMessage;
						this.setState({ mobileOtpActivationError: true, mobileErrorMessage: errorMessage });
					} else if (err.body.message === "Error" && err.body.meta === "OTP Mismatch") {
						errorMessage = resources.mobileOtpInvalidMessage;
						this.setState({ mobileOtpActivationError: true, mobileErrorMessage: errorMessage });
					} else if (err.body.message === "Error") {
						errorMessage = resources.mobileOtpVerifyErrorMessage;
						this.setState({ mobileOtpActivationError: true, mobileErrorMessage: errorMessage });
					}
				});
		});
	}

	changeEmail() {
		invoiz.user.token = "";
		invoiz.router.navigate("/account/register/changemail", true, true);
	}

	changeMobile() {
		//invoiz.user.token = '';
		invoiz.router.navigate("/account/register/mobile", true, true);
	}

	resendEmail() {
		const { resources } = this.props;
		this.resendDisabled = true;
		invoiz
			.request(config.account.endpoints.resendCode, {
				method: "POST",
				auth: true,
			})
			.then(() => {
				invoiz.page.showToast({
					message: resources.activationCodeReceiveMessage,
					wrapperClass: "absolute-top",
				});

				setTimeout(() => {
					this.resendDisabled = false;
				}, 5000);
			});
	}

	resendMobileOtp() {
		const { resources } = this.props;
		this.resendDisabled = true;
		invoiz
			.request(config.account.endpoints.resendMobileOtp, {
				method: "PUT",
				auth: true,
				data: { mobileNo: invoiz.user.mobile },
			})
			.then(() => {
				invoiz.page.showToast({
					message: `You have received a new OTP`,
					wrapperClass: "absolute-top",
				});

				setTimeout(() => {
					this.resendDisabled = false;
				}, 5000);
			});
	}

	dataLayerPush(data) {
		console.log("pushing data layer", data);
		if (window.dataLayer && data) {
			window.dataLayer.push(data);
		}
	}

	onSetBusinessType() {
		const { resources } = this.props;
		this.setState({ isTileDisable: true }, () => {
			invoiz
				.request(config.account.endpoints.setBusinessType, {
					method: "PUT",
					auth: true,
					data: { businessType: this.state.tileClicked },
				})
				.then((response) => {
					invoiz.user.businessType = this.state.tileClicked;
					console.log("push 9");
					this.dataLayerPush({
						regStep: "register-businessturnover",
						event: "register",
					});
					this.setState({ isTileDisable: false });
					invoiz.page.showToast({
						message: resources.str_successfullyUpdatedBusinessType,
						wrapperClass: "absolute-top",
					});
					invoiz.user.registrationStep = RegistrationViewState.SET_BUSINESS_TURNOVER;

					invoiz.router.navigate("/account/register/businessturnover", true, true);
				})
				.catch((err) => {
					invoiz.page.showToast({ message: resources.defaultErrorMessage, type: "error" });
					this.setState({ isTileDisable: false });
				});
		});
	}

	onSetBusinessTurnoverType() {
		const { resources } = this.props;
		this.setState({ isTileDisable: true }, () => {
			invoiz
				.request(config.account.endpoints.setBusinessTurnoverType, {
					method: "PUT",
					auth: true,
					data: { businessTurnoverType: this.state.tileClicked },
				})
				.then((response) => {
					invoiz.user.businessTurnover = this.state.tileClicked;
					console.log("push 10");
					this.dataLayerPush({
						regStep: "register-businesscategory",
						event: "register",
					});
					this.setState({ isTileDisable: false });
					invoiz.page.showToast({
						message: resources.str_successfullyUpdatedBusinessTurnover,
						wrapperClass: "absolute-top",
					});
					invoiz.user.registrationStep = RegistrationViewState.SET_BUSINESS_CATEGORY;

					//invoiz.user.registrationStep = RegistrationViewState.SET_BUSINESS_TYPE;
					//invoiz.router.navigate('/account/register/businesstype', true, true);

					invoiz.router.navigate("/account/register/businesscategory", true, true);
				})
				.catch((err) => {
					invoiz.page.showToast({ message: resources.defaultErrorMessage, type: "error" });
					this.setState({ isTileDisable: false });
				});
		});
	}

	onSetBusinessCategoryType() {
		const { resources } = this.props;
		this.setState({ isTileDisable: true }, () => {
			invoiz
				.request(config.account.endpoints.setBusinessCategoryType, {
					method: "PUT",
					auth: true,
					data: { businessCategoryType: this.state.businessCategoryId },
				})
				.then((response) => {
					invoiz.user.businessCategory = this.state.businessCategoryId;
					console.log("push 11");
					this.dataLayerPush({
						regStep: "register-mobile",
						event: "register",
					});
					this.setState({ isTileDisable: false });
					invoiz.page.showToast({
						message: resources.str_successfullyUpdatedBusinessCategory,
						wrapperClass: "absolute-top",
					});
					invoiz.user.registrationStep = RegistrationViewState.SET_MOBILE_NO;
					invoiz.router.navigate("/account/register/mobile", true, true);
				})
				.catch((err) => {
					invoiz.page.showToast({ message: resources.defaultErrorMessage, type: "error" });
					this.setState({ isTileDisable: false });
				});
		});
	}

	onhandleTileChange(data) {
		this.setState({ tileClicked: data.id });
	}

	onBusinessCategoryChanged(businessCategory) {
		this.setState({ businessCategoryId: businessCategory.id });
	}

	createRegistrationContent() {
		const {
			oauthGoogleUrl,
			isAmazon,
			isFinishDisable,
			isMobileNoDisable,
			isStartRegistrationDisable,
			isSetPasswordDisable,
			isSetStateDisable,
			isTileDisable,
		} = this.state;
		const { resources } = this.props;
		let headlineElement = null;
		let contentElement = null;

		switch (this.state.viewState) {
			case RegistrationViewState.START:
				const passwordLengthValid = this.state.password.length > 7;
				const passwordAlphaValid = /[A-Z]+/.test(this.state.password) && /[a-z]+/.test(this.state.password);
				const passwordSpecialValid = /[^a-zA-Z]+/.test(this.state.password);
				const checkIcon = <span className={`icon icon-check`} />;
				const alertIcon = <span className={`icon icon-close`} />;
				const passwordErrorElement = <div className="landing-password-error">{resources.passwordNotMatch}</div>;

				headlineElement = this.isMobile ? resources.trailPeriodMessage : resources.createInvoizAccount;
				
				headlineElement = (
					<div>
					{headlineElement}
					<br></br>
					<span className='sub-heading'>{resources.str_loginSub }</span>
					</div>
				);
				const errorElement = this.state.emailError ? (
					<div className="landing-email-error">{resources.str_emailAlreadyExist}</div>
				) : null;

				contentElement = (
					<div className="landing-email-input-wrapper">
						<TextInputExtendedComponent
							onKeyDown={(e) => this.onEmailKeyDown(e)}
							value={this.state.email}
							placeholder={resources.str_yourEmailAddress}
							onChange={(val) => this.onEmailInput(val)}
						/>

						<div className={this.state.showPasswordError ? "landing-password-mismatch" : ""}>
							<TextInputExtendedComponent
								value={this.state.password}
								isPassword={this.state.hidePassword}
								placeholder={resources.str_yourPassword}
								onKeyDown={(e) => this.onPasswordKeydown(e)}
								onChange={(val) => this.onPasswordInput(val)}
								// isPassword={this.state.hidePassword}
								icon={!this.state.hidePassword ? "icon-invisible" : "icon-visible"}
								iconAction={() => {
									this.setState({ hidePassword: !this.state.hidePassword });
								}}
							/>

							{/* <TextInputExtendedComponent
							value={this.state.passwordRetyped}
							isPassword={true}
							placeholder={resources.str_confirmPassword}
							onFocus={() => this.onPasswordRetypeFocus()}
							onKeyDown={e => this.onPasswordKeydown(e)}
							onChange={val => this.onPasswordRetype(val)}
						/> */}

							{this.state.showPasswordError && passwordErrorElement}

							<p
								className={`landing-password-validity ${
									this.state.passwordAlertClicked && !passwordLengthValid ? "alert" : ""
								}`}
							>
								{resources.passwordValCharLengthText}
								<span
									className={`landing-password-check ${
										passwordLengthValid ? "checked" : this.state.passwordAlert ? "alert" : ""
									}`}
									onClick={() => this.onPasswordCheckClick()}
								>
									{passwordLengthValid ? checkIcon : null}
									{!passwordLengthValid && this.state.passwordAlert ? alertIcon : null}
								</span>
							</p>

							<p
								className={`landing-password-validity ${
									this.state.passwordAlertClicked && !passwordAlphaValid ? "alert" : ""
								}`}
							>
								{resources.passwordValUpperAndLowerCaseText}
								<span
									className={`landing-password-check ${
										passwordAlphaValid ? "checked" : this.state.passwordAlert ? "alert" : ""
									}`}
									onClick={() => this.onPasswordCheckClick()}
								>
									{passwordAlphaValid ? checkIcon : null}
									{!passwordAlphaValid && this.state.passwordAlert ? alertIcon : null}
								</span>
							</p>

							<p
								className={`landing-password-validity ${
									this.state.passwordAlertClicked && !passwordSpecialValid ? "alert" : ""
								}`}
							>
								{resources.passwordValNumberText}
								<span
									className={`landing-password-check ${
										passwordSpecialValid ? "checked" : this.state.passwordAlert ? "alert" : ""
									}`}
									onClick={() => this.onPasswordCheckClick()}
								>
									{passwordSpecialValid ? checkIcon : null}
									{!passwordSpecialValid && this.state.passwordAlert ? alertIcon : null}
								</span>
							</p>
							{/*
						<ButtonComponent
							callback={() => this.onSetPassword()}
							customCssClass={`${
								!this.state.passwordValid || !this.state.passwordsMatch ? 'disabled' : ''
							}`}
							label={resources.str_nextStep}
							dataQsId="registration-step-password-confirm"
							loading={isSetPasswordDisable}
						/> */}

							{this.state.passwordAlertClicked && !this.state.passwordValid ? (
								<p className="landing-email-error invalid-password">{resources.str_insecurePassword}</p>
							) : null}
						</div>

						{errorElement}

						<ButtonComponent
							callback={() => this.onStartRegistration()}
							// customCssClass={`${this.state.emailValid ? '' : 'disabled'}`}
							label={"Register"}
							dataQsId="registration-step-email-confirm"
							// disabled={!this.state.emailValid}
							loading={isStartRegistrationDisable}
						/>

						<p style={{ marginTop: 0 }}>
							Already registered? <Link to={"/account/login"}>SIGN IN</Link>
						</p>

						{this.state.emailValidError ? (
							<div className="landing-email-error invalid-email">{resources.str_invalidEmail}</div>
						) : null}

						<div className="landing-responsive-element">{resources.sidebarRegisterText}</div>

						{/* {oauthGoogleUrl && !isAmazon ? (
							<div className="landing-step-email-google-register-container">
								<ButtonComponent
									callback={() => this.onGoogleRegisterClicked()}
									label={this.isMobile ? resources.googleLogin : resources.continueWithGoogle}
									buttonIcon={'icon-google'}
									customCssClass={'button-google'}
									dataQsId="registration-step-email-googleRegister"
								/>
							</div>
						) : null} */}
					</div>
				);
				break;

			case RegistrationViewState.WAIT_FOR_APPROVAL:
				const emailProvider =
					this.emailProvider || WebStorageService.getItem(WebStorageKey.REGISTRATION_EMAIL_PROVIDER);
				const emailUrl = emailProvider && emailProvider.url;
				const emailName = emailProvider && emailProvider.name;

				const activationErrorElement = (
					<div className="landing-activation-error">{resources.codeInvalidMessage}</div>
				);

				const buttonElement = null;
				// emailName && emailUrl ? (
				// 	<ButtonComponent
				// 		callback={() => window.open(emailUrl)}
				// 		label={`${resources.str_to}  ${emailName}`}
				// 		dataQsId="registration-step-approval-open-mail-provider"
				// 	/>
				// ) : null;

				headlineElement = (
					<div className="center-heading">
						{/* <div dangerouslySetInnerHTML={{ __html: format(resources.activationCodeMessage, this.isMobile ? resources.str_on : '', this.isMobile ? '' : resources.str_on, this.state.email) }} >
						 </div> */}
						<p>Verify email address</p>
						{/* {resources.activationCodeMessage}  {this.isMobile ? 'an' : ''}
						<br />
						{this.isMobile ? '' : 'an '}
						<span className="landing-activation-email">{this.state.email} </span>
						{this.isMobile ? <br /> : ''}
						{resources.str_cleverly} */}
					</div>
				);
				contentElement = (
					<div>
						<p>
							Enter the OTP send to<br></br>"<strong>{this.state.email}</strong>"
						</p>
						{buttonElement}

						{/* <p>
							{resources.enterEmailCodeTe}<b>"{resources.activationCodeForInvoizText}"</b>
							{resources.confirmRegistrationText}
						</p> */}

						<div className="landing-activation-input">
							<TextInputExtendedComponent
								value={this.state.activationDigits[0]}
								onChange={(val) => this.onActivationInput(0, val)}
								onPaste={(e) => this.onActivationPaste(0, e)}
								onKeyDown={(e) => this.onActivationKeyDown(0, e)}
								ignoreChangeOnPaste={true}
								ignoreChangeOnBlur={true}
								maxLength={1}
								name={"mobileFirstActivationInput"}
								ref={"mobileFirstActivationInput"}
							/>
							<TextInputExtendedComponent
								value={this.state.activationDigits[1]}
								onChange={(val) => this.onActivationInput(1, val)}
								onPaste={(e) => this.onActivationPaste(1, e)}
								onKeyDown={(e) => this.onActivationKeyDown(1, e)}
								ignoreChangeOnPaste={true}
								ignoreChangeOnBlur={true}
								maxLength={1}
							/>
							<TextInputExtendedComponent
								value={this.state.activationDigits[2]}
								onChange={(val) => this.onActivationInput(2, val)}
								onPaste={(e) => this.onActivationPaste(2, e)}
								onKeyDown={(e) => this.onActivationKeyDown(2, e)}
								ignoreChangeOnPaste={true}
								ignoreChangeOnBlur={true}
								maxLength={1}
							/>
							<TextInputExtendedComponent
								value={this.state.activationDigits[3]}
								onChange={(val) => this.onActivationInput(3, val)}
								onPaste={(e) => this.onActivationPaste(3, e)}
								onKeyDown={(e) => this.onActivationKeyDown(3, e)}
								ignoreChangeOnPaste={true}
								ignoreChangeOnBlur={true}
								maxLength={1}
							/>

							{this.state.activationError && activationErrorElement}
						</div>
						<button className="resend-otp-button" onClick={() => this.resendEmail()}>
							Resend OTP
						</button>
						<hr></hr>
						<p>
							Change Email address {" "}
							<a onClick={() => this.changeEmail()}>
								<strong>Go Back</strong>
							</a>
						</p>
					</div>
				);
				break;

			// case RegistrationViewState.SET_PASSWORD:
			// 	const passwordLengthValid = this.state.password.length > 7;
			// 	const passwordAlphaValid = /[A-Z]+/.test(this.state.password) && /[a-z]+/.test(this.state.password);
			// 	const passwordSpecialValid = /[^a-zA-Z]+/.test(this.state.password);
			// 	const checkIcon = <span className={`icon icon-check`} />;
			// 	const alertIcon = <span className={`icon icon-close`} />;
			// 	const passwordErrorElement = (
			// 		<div className="landing-password-error">{resources.passwordNotMatch}</div>
			// 	);

			// 	headlineElement = resources.str_createPassword;
			// 	contentElement = (
			// 		<div className={this.state.showPasswordError ? 'landing-password-mismatch' : ''}>
			// 			<TextInputExtendedComponent
			// 				value={this.state.password}
			// 				isPassword={true}
			// 				placeholder={resources.str_yourPassword}
			// 				onKeyDown={e => this.onPasswordKeydown(e)}
			// 				onChange={val => this.onPasswordInput(val)}
			// 			/>

			// 			<TextInputExtendedComponent
			// 				value={this.state.passwordRetyped}
			// 				isPassword={true}
			// 				placeholder={resources.str_confirmPassword}
			// 				onFocus={() => this.onPasswordRetypeFocus()}
			// 				onKeyDown={e => this.onPasswordKeydown(e)}
			// 				onChange={val => this.onPasswordRetype(val)}
			// 			/>

			// 			{this.state.showPasswordError && passwordErrorElement}

			// 			<p
			// 				className={`landing-password-validity ${
			// 					this.state.passwordAlertClicked && !passwordLengthValid ? 'alert' : ''
			// 				}`}
			// 			>
			// 				 {resources.passwordValCharLengthText}
			// 				<span
			// 					className={`landing-password-check ${
			// 						passwordLengthValid ? 'checked' : this.state.passwordAlert ? 'alert' : ''
			// 					}`}
			// 					onClick={() => this.onPasswordCheckClick()}
			// 				>
			// 					{passwordLengthValid ? checkIcon : null}
			// 					{!passwordLengthValid && this.state.passwordAlert ? alertIcon : null}
			// 				</span>
			// 			</p>

			// 			<p
			// 				className={`landing-password-validity ${
			// 					this.state.passwordAlertClicked && !passwordAlphaValid ? 'alert' : ''
			// 				}`}
			// 			>
			// 				   {resources.passwordValUpperAndLowerCaseText}
			// 				<span
			// 					className={`landing-password-check ${
			// 						passwordAlphaValid ? 'checked' : this.state.passwordAlert ? 'alert' : ''
			// 					}`}
			// 					onClick={() => this.onPasswordCheckClick()}
			// 				>
			// 					{passwordAlphaValid ? checkIcon : null}
			// 					{!passwordAlphaValid && this.state.passwordAlert ? alertIcon : null}
			// 				</span>
			// 			</p>

			// 			<p
			// 				className={`landing-password-validity ${
			// 					this.state.passwordAlertClicked && !passwordSpecialValid ? 'alert' : ''
			// 				}`}
			// 			>
			// 				{resources.passwordValNumberText}
			// 				<span
			// 					className={`landing-password-check ${
			// 						passwordSpecialValid ? 'checked' : this.state.passwordAlert ? 'alert' : ''
			// 					}`}
			// 					onClick={() => this.onPasswordCheckClick()}
			// 				>
			// 					{passwordSpecialValid ? checkIcon : null}
			// 					{!passwordSpecialValid && this.state.passwordAlert ? alertIcon : null}
			// 				</span>
			// 			</p>

			// 			<ButtonComponent
			// 				callback={() => this.onSetPassword()}
			// 				customCssClass={`${
			// 					!this.state.passwordValid || !this.state.passwordsMatch ? 'disabled' : ''
			// 				}`}
			// 				label={resources.str_nextStep}
			// 				dataQsId="registration-step-password-confirm"
			// 				loading={isSetPasswordDisable}
			// 			/>

			// 			{this.state.passwordAlertClicked && !this.state.passwordValid ? (
			// 				<p className="landing-email-error invalid-password">{resources.str_insecurePassword}</p>
			// 			) : null}
			// 		</div>
			// 	);
			// 	break;

			case RegistrationViewState.PICK_COMPANY_TYPE:
				headlineElement = resources.str_selectYourState;
				contentElement = (
					<div className="landing-pick-legalform">
						<div>
							<SelectStateInputComponent
								stateId={this.state.stateId}
								onStateChanged={this.onStateChanged.bind(this)}
							/>
						</div>
						<ButtonComponent
							callback={() => this.onSetState()}
							disabled={this.state.stateId === null}
							label={resources.str_nextStep}
							dataQsId="registration-step-company-type-confirm"
							loading={isSetStateDisable}
						/>
					</div>
				);
				break;

			case RegistrationViewState.SET_BUSINESS_TYPE:
				headlineElement = resources.str_selectBusinessType;

				contentElement = (
					<div className="landing-pick-businesstype">
						<OnboardTileWrapper
							onhandleTileChange={this.onhandleTileChange.bind(this)}
							regStep={this.state.viewState}
							tileClicked={this.state.tileClicked}
						/>
						<ButtonComponent
							callback={() => this.onSetBusinessType()}
							disabled={this.state.tileClicked === null}
							label={resources.str_nextStep}
							dataQsId="registration-step-business-type-confirm"
							loading={isTileDisable}
						/>
					</div>
				);
				break;

			case RegistrationViewState.SET_BUSINESS_TURNOVER:
				headlineElement = resources.str_selectBusinessTurnover;
				contentElement = (
					<div className="landing-pick-businesstype">
						<OnboardTileWrapper
							onhandleTileChange={this.onhandleTileChange.bind(this)}
							regStep={this.state.viewState}
							tileClicked={this.state.tileClicked}
						/>
						<ButtonComponent
							callback={() => this.onSetBusinessTurnoverType()}
							disabled={this.state.tileClicked === null}
							label={resources.str_nextStep}
							dataQsId="registration-step-business-turnover-confirm"
							loading={isTileDisable}
						/>
					</div>
				);
				break;

			case RegistrationViewState.SET_BUSINESS_CATEGORY:
				headlineElement = resources.str_selectBusinessCategory;
				contentElement = (
					<div className="landing-pick-legalform">
						<OnboardInputComponent
							regStep={this.state.viewState}
							businessCategoryId={this.state.businessCategoryId}
							onBusinessCategoryChanged={this.onBusinessCategoryChanged.bind(this)}
						/>

						<ButtonComponent
							callback={() => this.onSetBusinessCategoryType()}
							disabled={this.state.businessCategoryId === null}
							label={resources.str_nextStep}
							dataQsId="registration-step-business-category-type-confirm"
							loading={isTileDisable}
						/>
					</div>
				);
				break;

			case RegistrationViewState.SET_MOBILE_NO:
				headlineElement = (
					<div className="center-heading">
						<p>{resources.str_enterMobileNo}</p>
					</div>
				);
				contentElement = (
					<div className="landing-pick-mobileNo">
						<div className="mobileno-input-wrapper">
							<TextInputExtendedComponent
								onKeyDown={(e) => this.onMobileKeyDown(e)}
								value={this.state.mobileNo}
								placeholder={resources.str_yourMobileNo}
								onChange={(val) => this.onMobileInput(val)}
								maxLength="10"
							/>
						</div>
						{/* <div className="landing-mobile-textInfo">{resources.str_MobileNoOTP}</div> */}
						{this.state.mobileValidError ? (
							<div className="landing-mobile-error invalid-mobile">
								{resources.validMobileNumberError}
							</div>
						) : null}
						{this.state.mobileExistsError ? (
							<div className="landing-mobile-error invalid-mobile">
								{resources.alreadyRegisteredMobileError}
							</div>
						) : null}
						<ButtonComponent
							callback={() => this.onSetMobileNo()}
							disabled={this.state.mobileNo === ""}
							label={`Verify`}
							dataQsId="registration-step-mobile"
							loading={isMobileNoDisable}
						/>
					</div>
				);
				break;

			case RegistrationViewState.VERIFY_MOBILE_NO:
				const errorMessage = this.state.mobileErrorMessage;
				const mobileActivationErrorElement = (
					<div className="landing-activation-mobile-error">{errorMessage}</div>
				);
				headlineElement = (
					<div className="center-heading">
						<div
							dangerouslySetInnerHTML={{
								__html: format(resources.mobileOtpMessage, invoiz.user.mobile),
							}}
						></div>
						{/* {resources.activationCodeMessage}  {this.isMobile ? 'an' : ''}
							<br />
							{this.isMobile ? '' : 'an '}
							<span className="landing-activation-email">{this.state.email} </span>
							{this.isMobile ? <br /> : ''}
							{resources.str_cleverly} */}
					</div>
				);
				contentElement = (
					<div>
						<p style={{ padding: "0 10px" }}>{resources.mobileOtpForImprezz}</p>

						<div className="landing-activation-mobile-input">
							<TextInputExtendedComponent
								value={this.state.mobileOtpDigits[0]}
								onChange={(val) => this.onMobileOtpInput(0, val)}
								onPaste={(e) => this.onMobileOtpPaste(0, e)}
								onKeyDown={(e) => this.onMobileOtpDown(0, e)}
								ignoreChangeOnPaste={true}
								ignoreChangeOnBlur={true}
								maxLength={1}
								name={"mobileFirstActivationInput"}
								ref={"mobileFirstActivationInput"}
							/>
							<TextInputExtendedComponent
								value={this.state.mobileOtpDigits[1]}
								onChange={(val) => this.onMobileOtpInput(1, val)}
								onPaste={(e) => this.onMobileOtpPaste(1, e)}
								onKeyDown={(e) => this.onMobileOtpDown(1, e)}
								ignoreChangeOnPaste={true}
								ignoreChangeOnBlur={true}
								maxLength={1}
							/>
							<TextInputExtendedComponent
								value={this.state.mobileOtpDigits[2]}
								onChange={(val) => this.onMobileOtpInput(2, val)}
								onPaste={(e) => this.onMobileOtpPaste(2, e)}
								onKeyDown={(e) => this.onMobileOtpDown(2, e)}
								ignoreChangeOnPaste={true}
								ignoreChangeOnBlur={true}
								maxLength={1}
							/>
							<TextInputExtendedComponent
								value={this.state.mobileOtpDigits[3]}
								onChange={(val) => this.onMobileOtpInput(3, val)}
								onPaste={(e) => this.onMobileOtpPaste(3, e)}
								onKeyDown={(e) => this.onMobileOtpDown(3, e)}
								ignoreChangeOnPaste={true}
								ignoreChangeOnBlur={true}
								maxLength={1}
							/>
							<TextInputExtendedComponent
								value={this.state.mobileOtpDigits[4]}
								onChange={(val) => this.onMobileOtpInput(4, val)}
								onPaste={(e) => this.onMobileOtpPaste(4, e)}
								onKeyDown={(e) => this.onMobileOtpDown(4, e)}
								ignoreChangeOnPaste={true}
								ignoreChangeOnBlur={true}
								maxLength={1}
							/>
							<TextInputExtendedComponent
								value={this.state.mobileOtpDigits[5]}
								onChange={(val) => this.onMobileOtpInput(5, val)}
								onPaste={(e) => this.onMobileOtpPaste(5, e)}
								onKeyDown={(e) => this.onMobileOtpDown(5, e)}
								ignoreChangeOnPaste={true}
								ignoreChangeOnBlur={true}
								maxLength={1}
							/>
							{this.state.mobileOtpActivationError && mobileActivationErrorElement}
						</div>
						<ButtonComponent
							callback={() => this.onFinish()}
							disabled={this.state.mobileOtp === ""}
							label={resources.str_finished}
							dataQsId="registration-step-mobileotp"
						/>
						<p className="text-center">
							Change Number?{" "}
							<span
								className="text-secondary"
								style={{ fontWeight: 600, cursor: "pointer" }}
								onClick={() => {
									invoiz.router.navigate("/account/register/mobile", true, true);
								}}
							>
								Go Back
							</span>
						</p>
					</div>
				);
				break;
		}

		return (
			<div className="">
				{this.isMobile ? <div className="mobile-text-content">{resources.mobileDisplayText}</div> : null}
				<div
					className={`landing-content-headline ${
						this.state.passwordAlertClicked && !this.state.passwordValid ? "alert" : ""
					}`}
				>
					{headlineElement} 
				</div>
				{contentElement}
			</div>
		);
	}

	createFooter() {
		const { isAmazon } = this.state;
		const { resources } = this.props;

		if (isAmazon) {
			return null;
		}

		switch (this.state.viewState) {
			case RegistrationViewState.START:
				return (
					<div className="landing-content-footer">
						{resources.str_alreadyHaveAccount} <Link to="/account/login">{resources.str_toTheLogin}</Link>
					</div>
				);

			case RegistrationViewState.WAIT_FOR_APPROVAL:
				return (
					<div className="landing-content-footer">
						<div className="landing-content-footer-item">
							{resources.str_typo}{" "}
							<a onClick={() => this.changeEmail()}>{resources.str_correctEmailAddress}</a>
						</div>
						<div className="landing-content-footer-item">
							{resources.str_emailNotReceive}{" "}
							<a disabled={this.resendDisabled} onClick={() => this.resendEmail()}>
								{resources.str_sendAgain}
							</a>
						</div>
					</div>
				);

			case RegistrationViewState.VERIFY_MOBILE_NO:
				return (
					<div className="landing-content-footer">
						<div className="landing-content-footer-item">
							{resources.str_typo}{" "}
							<a onClick={() => this.changeMobile()}>{resources.correctMobileNumber}</a>
						</div>
						<div className="landing-content-footer-item">
							{resources.str_mobileOtpNotReceive}{" "}
							<a disabled={this.resendDisabled} onClick={() => this.resendMobileOtp()}>
								{resources.str_sendAgain}
							</a>
						</div>
					</div>
				);
		}
	}

	createRegistrationFact() {
		const { resources } = this.props;
		let iconSrc = null;
		let factText = null;
		let factSubtext = null;

		switch (this.state.viewState) {
			case RegistrationViewState.START:
				iconSrc = "/assets/images/svg/mail.svg";
				factText = resources.sidebarRegisterText;
				break;

			case RegistrationViewState.WAIT_FOR_APPROVAL:
				const texts = [
					<div>"{resources.sidebarRegisterApprovalText1}"</div>,
					<div>
						"{resources.sidebarRegisterApprovalText2} <br />
						<b>{this.invoiceAmount}</b> {resources.str_written}"
					</div>,
				];
				const factSubtexts = [resources.sidebarSetPasswordText1, resources.sidebarSetPasswordText2];
				const icons = ["/assets/images/svg/secure.svg", "/assets/images/svg/coins.svg"];
				iconSrc = icons[this.randomFactNumber];
				factText = texts[this.randomFactNumber];
				factSubtext = factSubtexts[this.randomFactNumber];
				break;

			case RegistrationViewState.SET_PASSWORD:
				if (this.state.passwordValid) {
					iconSrc = "/assets/images/svg/lock.svg";
					factText = this.state.passwordInfo || "";
				} else {
					iconSrc = "/assets/images/svg/lock_half.svg";
					factText = this.state.passwordInfo || "";
				}
				break;
			case RegistrationViewState.VERIFY_MOBILE_NO:
				iconSrc = "/assets/images/svg/briefcase.svg";
				factText = resources.sidebarMobileVerifyText;
				break;
			case RegistrationViewState.PICK_COMPANY_TYPE:
			case RegistrationViewState.SET_BUSINESS_TYPE:
			case RegistrationViewState.SET_BUSINESS_TURNOVER:
			case RegistrationViewState.SET_BUSINESS_CATEGORY:
			case RegistrationViewState.SET_MOBILE_NO:
				iconSrc = "/assets/images/svg/briefcase.svg";
				factText = resources.sidebarPickCompanyTypeText;
				break;
		}

		const factSubtextElement = factSubtext ? <div className="landing-fact-subtext">{factSubtext}</div> : null;

		return (
			<div className="landing-fact">
				<div className="landing-fact-icon-background" />
				<img src={iconSrc} className={`landing-fact-icon`} />
				<div className="landing-fact-text">
					{factText}
					{factSubtextElement}
				</div>
			</div>
		);
	}

	onGoogleRegisterClicked() {
		WebStorageService.setItem(WebStorageKey.GOOGLE_REGISTRATION_STARTED, true);
		window.location.href = this.state.oauthGoogleUrl;
	}
}

export default RegistrationComponent;
