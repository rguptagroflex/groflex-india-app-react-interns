import invoiz from "services/invoiz.service";
import React from "react";
import { Link } from "react-router-dom";
import config from "config";
import { format } from "util";
import ButtonComponent from "shared/button/button.component";
import ModalService from "services/modal.service";
import SVGInline from "react-svg-inline";
import forgotPasswordIcon from "assets/images/svg/passwort_vergessen_white.svg";
import OldBrowserModalComponent from "shared/modals/old-browser-modal.component";
import { isOutdatedBrowser } from "helpers/isOutdatedBrowser";
import TextInputComponent from "shared/inputs/text-input/text-input.component";
import { connect } from "react-redux";
import imprezzLogoSmall from "assets/images/impress_short_icon.png";
import landingImage from "assets/images/login/login.jpg";
import { detectDevice } from "helpers/detectDevice";
import Carousel from "shared/carousel/Carousel.component";
import FirstColumn from "./firstColumn.component";

class ForgotPasswordComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			email: "",
			emailError: "",
			activeSlide: 0,
		};
		this.isMobile = detectDevice() === "phone" || detectDevice() === "tablet";
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

	onInputChange(ev) {
		const value = ev.target.value;
		this.setState({ email: value, emailError: "" });
	}

	onInputKeyDown(e) {
		const { resources } = this.props;
		const keyCode = e.keyCode || e.which;

		if (keyCode === 13 && this.state.email && !this.state.emailError) {
			this.sendLinkSubmit();
		} else if (keyCode === 13) {
			if (this.state.email.length === 0) {
				this.setState({
					emailError: resources.requiredFieldValidation,
				});
			}
		}
	}

	sendLinkSubmit() {
		const email = this.state.email.trim();
		const { resources } = this.props;
		if (email.length === 0) {
			this.setState({
				emailError: email.length === 0 ? resources.requiredFieldValidation : "",
			});
		} else if (!config.emailCheck.test(email)) {
			this.setState({
				emailError: resources.invalidEmailError,
			});
		} else {
			invoiz
				.request(config.account.endpoints.forgotPassword, { method: "PUT", data: { email } })
				.then(() => {
					invoiz.showNotification({
						message: resources.emailSentInfoMessage,
						wrapperClass: "absolute-top",
					});
					invoiz.router.navigate("/account/login");
				})
				.catch((error) => {
					const {
						body,
						body: { meta },
					} = error;

					if (!body || !meta) {
						return;
					}

					if (meta["oauth"]) {
						this.setState({
							emailError: resources.googleSignInInfoMessage,
						});
					}

					if (meta["email"]) {
						const errorCode = meta["email"][0].code;
						const filteredError = resources.errorCodesWithMessages[errorCode];

						if (!filteredError) return;

						if (filteredError.indexOf("%s") > -1) {
							const serverMessage = format(filteredError, "E-Mail");
							this.setState({ emailError: serverMessage });
							return;
						}
					}
				});
		}
	}

	render() {
		const { resources } = this.props;
		const { activeSlide } = this.state;

		// const old = (
		// 	<div className="landing-sidebar">
		// 		<div className="imprezz-logo">
		// 			<Link to="/account/login">
		// 				<img src="/assets/images/svg/groflex.svg" />
		// 			</Link>
		// 		</div>

		// 		{/* <div className="landing-fact-imprezz-logo">
		// 				<Link to="/account/login">
		// 					<img className="imprezz-small-image" src={imprezzLogoSmall} />
		// 				</Link>
		// 			</div> */}

		// 		{/* <div className="landing-carousel-wrapper">
		// 			<Carousel
		// 					className="landing-carousel"
		// 					activeSlide={activeSlide}
		// 					updateActiveSlide={slide => this.setState({activeSlide: slide})}
		// 				>
		// 					<Carousel.Slides>
		// 						<div className="landing-carousel-slide text-center">
		// 							<p className="landing-carousel-slide-title">Best and Easiest Billing Software!</p>
		// 							<div className="landing-carousel-slide-content">
		// 								<img className="landing-carousel-slide-content-image" width={200} height={200} src="/assets/images/svg/landing/landing-slide1.svg" />
		// 								<div className="landing-carousel-slide-content-points">
		// 									<div className="point">
		// 										<img src="/assets/images/icons/green_check_mark.svg"/>
		// 										<p>Create GST compliant invoices</p>
		// 									</div>
		// 									<div className="point">
		// 										<img src="/assets/images/icons/green_check_mark.svg"/>
		// 										<p>Recurring invoices for your buis</p>
		// 									</div>
		// 									<div className="point">
		// 										<img src="/assets/images/icons/green_check_mark.svg"/>
		// 										<p>Create bills in multiple currencies</p>
		// 									</div>
		// 								</div>
		// 							</div>
		// 						</div>
		// 						<div className="landing-carousel-slide text-center">
		// 							<p className="landing-carousel-slide-title">Sales Insights at your Finger Tips</p>
		// 							<div className="landing-carousel-slide-content">
		// 								<img className="landing-carousel-slide-content-image" width={200} height={200} src="/assets/images/svg/landing/landing-slide2.svg" />
		// 								<div className="landing-carousel-slide-content-points">
		// 									<div className="point">
		// 										<img src="/assets/images/icons/green_check_mark.svg"/>
		// 										<p>Analyse your business better</p>
		// 									</div>
		// 									<div className="point">
		// 										<img src="/assets/images/icons/green_check_mark.svg"/>
		// 										<p>Real-time business data</p>
		// 									</div>
		// 									<div className="point">
		// 										<img src="/assets/images/icons/green_check_mark.svg"/>
		// 										<p>Get your sales numbers increasing<br></br> with smart products</p>
		// 									</div>
		// 								</div>
		// 							</div>
		// 						</div>
		// 						<div className="landing-carousel-slide text-center">
		// 							<p className="landing-carousel-slide-title">Manage your Expenses Effectively</p>
		// 							<div className="landing-carousel-slide-content">
		// 								<img className="landing-carousel-slide-content-image" width={200} height={200} src="/assets/images/svg/landing/landing-slide3.svg" />
		// 								<div className="landing-carousel-slide-content-points">
		// 									<div className="point">
		// 										<img src="/assets/images/icons/green_check_mark.svg"/>
		// 										<p>Track all your expenses and <br></br>purchases in one place</p>
		// 									</div>
		// 									<div className="point">
		// 										<img src="/assets/images/icons/green_check_mark.svg"/>
		// 										<p>Easiest tool for expense tracking</p>
		// 									</div>
		// 									<div className="point">
		// 										<img src="/assets/images/icons/green_check_mark.svg"/>
		// 										<p>Create purchase orders</p>
		// 									</div>
		// 								</div>
		// 							</div>
		// 						</div>
		// 					</Carousel.Slides>
		// 					<Carousel.PageIndicators>
		// 						<button
		// 							key={0}
		// 							className={activeSlide === 0 ? 'active': ''}
		// 							onClick={() => this.setState({activeSlide: 0})}
		// 						/>
		// 						<button
		// 							key={1}
		// 							className={activeSlide === 1 ? 'active': ''}
		// 							onClick={() => this.setState({activeSlide: 1})}
		// 						/>
		// 						<button
		// 							key={2}
		// 							className={activeSlide === 2 ? 'active': ''}
		// 							onClick={() => this.setState({activeSlide: 2})}
		// 						/>
		// 					</Carousel.PageIndicators>
		// 				</Carousel>
		// 			</div> */}

		// 		<img className="landing-image" src={landingImage} />

		// 		<div className="media-coverage text-center">
		// 			<p className="media-coverage-title">National media that has covered us!</p>
		// 			<div className="media-coverage-sources">
		// 				<div className="media-coverage-sources-item">
		// 					<img src="/assets/images/landing/hindu.png" />
		// 				</div>
		// 				<div className="media-coverage-sources-item">
		// 					<img src="/assets/images/landing/indian-express.png" />
		// 				</div>
		// 				<div className="media-coverage-sources-item">
		// 					<img src="/assets/images/landing/indian-retailers.png" />
		// 				</div>
		// 			</div>
		// 		</div>
		// 		{/* <div className="landing-fact">
		// 				<div className="landing-fact-icon-background">
		// 					<div className="login-fact-icon">
		// 						<SVGInline height="100px" svg={sidebarIcon} />
		// 					</div>
		// 				</div>
		// 				<div className="landing-fact-text">{sidebarText}</div>
		// 			</div>
		// 			<div className="landing-sidebar-footer">
		// 				<a href="https://www.imprezz.in/imprint/" target="_blank">
		// 					{resources.str_imprint}
		// 				</a>
		// 				<div className="link-divider" />
		// 				<a href="https://www.imprezz.in/privacy-policy/" target="_blank">
		// 					{resources.str_termsPrivacy}
		// 				</a>
		// 			</div> */}
		// 		{/* <div className="landing-fact-imprezz-logo">
		// 				<Link to="/account/login">
		// 					<img className="imprezz-small-image" src={imprezzLogoSmall} />
		// 				</Link>
		// 			</div>
		// 			<div className="landing-fact">
		// 				<div className="landing-fact-icon-background">
		// 					<div className="forgot-password-fact-icon">
		// 						<SVGInline height="100px" svg={forgotPasswordIcon} />
		// 					</div>
		// 				</div>
		// 				<div className="landing-fact-text">
		// 					{`${resources.str_forgotPassword}?`}
		// 					<br />
		// 					{resources.sidebarforgotPasswordText}
		// 				</div>
		// 			</div>
		// 			<div className="landing-sidebar-footer">
		// 				<a href="https://www.imprezz.in/imprint/" target="_blank">
		// 					{resources.str_imprint}
		// 				</a>
		// 				<div className="link-divider" />
		// 				<a href="https://www.imprezz.in/privacy-policy/" target="_blank">
		// 					{resources.str_termsPrivacy}
		// 				</a>
		// 			</div>
		// 		</div> */}
		// 	</div>
		// );
		return (
			<div className="landing-wrapper forgot-password-wrapper">
				<FirstColumn />
				<div className="landing-content">
					{/* <div className="invoiz-logo">
						<Link to="/account/login">
							<img src="/assets/images/svg/imprezz.svg" />
						</Link>
					</div> */}
					<div className="landing-content-inner">
						{this.isMobile ? (
							<div className="mobile-text-content">{resources.mobileDisplayText}</div>
						) : null}
						<div className="landing-content-headline">{`${resources.str_forgotPassword}`}</div>
						<p className="forgot-password-description" style={{ padding: "0 15px" }}>
							{resources.emailSentCaption}
						</p>
						<div className="landing-email-input-wrapper">
							<div className="forgot-password-input-wrapper">
								<TextInputComponent
									value={this.state.email}
									label={resources.emailInputLabel}
									id={"forgot-password-email"}
									name={"forgot-password-email"}
									errorMessage={this.state.emailError}
									onChange={(e) => this.onInputChange(e)}
									onKeyDown={(e) => this.onInputKeyDown(e)}
								/>
							</div>

							<ButtonComponent
								callback={() => this.sendLinkSubmit()}
								label={resources.str_sendLink}
								dataQsId="forgot-password-btn-send"
							/>
						</div>
						<div style={{ margin: "10px 0px", marginBottom: "20px" }}>
							Do you remember the password nowwww?{" "}
							<Link className="login-now-btn" to="/account/login">
								{resources.str_toTheLogin}
							</Link>
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

export default connect(mapStateToProps)(ForgotPasswordComponent);
