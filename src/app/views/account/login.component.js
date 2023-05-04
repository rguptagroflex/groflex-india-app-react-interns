// import _ from 'lodash';
import invoiz from 'services/invoiz.service';
import { Link } from 'react-router-dom';
import React from 'react';
import config from 'config';
import ButtonComponent from 'shared/button/button.component';
import ModalService from 'services/modal.service';

import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
// import coffeeIcon from 'assets/images/svg/coffee.svg';
// import sittingIcon from 'assets/images/svg/sitting.svg';
// import owlIcon from 'assets/images/svg/owl.svg';
// import sleepIcon from 'assets/images/svg/sleep.svg';
import sidebarMorningIcon from 'assets/images/svg/15_million_freelancers.svg';
import sidebarAfternoonIcon from 'assets/images/svg/160_countries.svg';
import sidebarEveningIcon from 'assets/images/svg/gst.svg';
import sidebarNightIcon from 'assets/images/svg/startups.svg';
import landingImage from "assets/images/login/login.jpg";
import OldBrowserModalComponent from 'shared/modals/old-browser-modal.component';
import { isOutdatedBrowser } from 'helpers/isOutdatedBrowser';
// import { errorCodesWithMessages } from 'helpers/constants';
import { format } from 'util';
import SharedDataService from 'services/shared-data.service';
import TextInputComponent from 'shared/inputs/text-input/text-input.component';
import imprezzLogoSmall from 'assets/images/impress_short_icon.png';
import { connect } from 'react-redux';
import { detectDevice } from 'helpers/detectDevice';
import Carousel from 'shared/carousel/Carousel.component';
import Invoiz from 'services/invoiz.service';

class LoginComponent extends React.Component {
	constructor(props) {
		super(props);
		this._isMounted = false;
		this.state = {
			email: '',
			password: '',
			emailError: '',
			passwordError: '',
			oauthGoogleUrl: null,
			oauthLoginError: '',
			isLogginIn: false,
			hidePassword:true,
			activeSlide: 0,
			hidePasswordField: true,
		};
		this.isMobile = detectDevice() === 'phone';// || detectDevice() === 'tablet';

		this.handleSubmitFailure = this.handleSubmitFailure.bind(this);

		const { resources } = this.props;
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
		const { resources } = this.props;
		const error = SharedDataService.get('google-oauth-login-error');
		this._isMounted = true;

		if (this._isMounted) {
			if (error) {
				if (
					error.body &&
					error.body.meta &&
					error.body.meta.email &&
					error.body.meta.email[0] &&
					error.body.meta.email[0].code &&
					error.body.meta.email[0].code === 'EXISTS'
				) {
					this.setState({ oauthLoginError: resources.alreadyRegisteredError });
				} else {
					this.setState({ oauthLoginError: resources.noRegisteredError });
				}
			}
			invoiz
			.request(`${config.resourceHost}oauth`, {
				method: 'GET'
			})
			.then(({ body: { data: { google } } }) => {
				if (!this.isUnmounted) {
					this.setState({ oauthGoogleUrl: google });
				}
			});
		}		
	}

	componentWillUnmount() {
		this._isMounted = false;
		this.isUnmounted = true;
	}

	onInputChange(ev, key) {
		const value = ev.target.value;
		if (key === 'email') {
			this.setState({ email: value, emailError: '' });
		} else {
			this.setState({ password: value, passwordError: '' });
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
					passwordError: resources.requiredFieldValidation
				});
			}

			if (this.state.email.length === 0) {
				this.setState({
					emailError: resources.requiredFieldValidation
				});
			}
		}
	}
	onViewPasswordClick(){
		this.setState({hidePassword : ! this.state.hidePassword})
	}

	onGoogleLoginClicked() {
		window.location.href = this.state.oauthGoogleUrl;
	}

	async onEmailSubmit() {
		const { resources } = this.props;
		const email = this.state.email.trim();

		if(!email) {
			return this.setState({emailError: resources.requiredFieldValidation});
		} else if(!config.emailCheck.test(email)) {
			return this.setState({emailError: resources.invalidEmailError});
		}

		WebStorageService.setItem(WebStorageKey.REGISTRATION_EMAIL, email)

		try {
			await Invoiz.request(config.account.endpoints.checkUser, {data: {email}});
			this.setState({hidePasswordField: false});
		} catch(error) {
			if(error.body === "Not Found") {
				invoiz.router.navigate('/account/register')
			}
		}

		// const loginUser = response => {
		// 	invoiz.user.userEmail = email;
		// 	return invoiz.user.login(response).then(redirectTo => {
		// 		invoiz.router.navigate(redirectTo);
		// 	});
		// };

		// const 

		// this.setState({ isLogginIn: true }, () => {
		// 	invoiz
		// 		.request(config.account.endpoints.login, {
		// 			method: 'POST',
		// 			data: {
		// 				email,
		// 				password
		// 			}
		// 		})
		// 		.then(loginUser)
		// 		.catch(this.handleSubmitFailure);
		// });
	}

	onLoginSubmit() {
		const { resources } = this.props;
		const email = this.state.email.trim();
		const password = this.state.password.trim();

		if (email.length === 0 || password.length === 0) {
			this.setState({
				emailError: email.length === 0 ? resources.requiredFieldValidation : '',
				passwordError: password.length === 0 ? resources.requiredFieldValidation : ''
			});
		} else if (!config.emailCheck.test(email)) {
			this.setState({
				emailError: resources.invalidEmailError
			});
		} else {
			const loginUser = response => {
				invoiz.user.userEmail = email;
				return invoiz.user.login(response).then(redirectTo => {
					invoiz.router.navigate(redirectTo);
				});
			};

			this.setState({ isLogginIn: true }, () => {
				invoiz
					.request(config.account.endpoints.login, {
						method: 'POST',
						data: {
							email,
							password
						}
					})
					.then(loginUser)
					.catch(this.handleSubmitFailure);
			});
		}
	}
	handleSubmitFailure (error) {
		if (this._isMounted) {
			this.setState({ isLogginIn: false });
			const { resources } = this.props;
			const errorMappings = {
				email: { label: resources.str_email, stateKey: 'emailError' },
				password: { label: resources.str_password, stateKey: 'passwordError' }
			};
	
			if (error.body === 'Unauthorized') {
				invoiz.showNotification({ type: 'info', message: resources.approveEmailInfoMessage });
				return invoiz.router.navigate(`account/approve_resend/${this.data.email}`);
			}
	
			if (!error.body && !error.body.meta) {
				return;
			}
	
			for (const name in error.body.meta) {
				const field = errorMappings[name];
	
				if (name === 'oauth') {
					this.setState({
						oauthLoginError: resources.googleSignInInfoMessage
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
	
				if (filteredError.indexOf('%s') > -1) {
					const serverMessage = format(filteredError, field.label);
					const stateObj = {};
					stateObj[field.stateKey] = serverMessage;
					this.setState(
						{
							emailError: '',
							passwordError: ''
						},
						() => {
							this.setState(stateObj);
						}
					);
					return;
				}
			}
		}
		
	};

	onEmailKeyDown(e) {
		const  { hidePasswordField } = this.state;
		const keyCode = e.keyCode || e.which;

		if (keyCode === 13) {
			hidePasswordField ? this.onEmailSubmit() : this.onLoginSubmit()
		}

		this.setState({ emailError: '' });
	}

	render() {
		const { oauthGoogleUrl, oauthLoginError, isLogginIn, activeSlide, hidePasswordField } = this.state;
		const { resources } = this.props;
		const hours = new Date().getHours();
		let sidebarIcon = null;
		let sidebarText = '';

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

				{!this.isMobile ? 
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

					{/* <div className="landing-carousel-wrapper">
						<Carousel 
							className="landing-carousel"
							activeSlide={activeSlide} 
							updateActiveSlide={slide => this.setState({activeSlide: slide})}
						>
							<Carousel.Slides>
								<div className="landing-carousel-slide text-center">
									<p className="landing-carousel-slide-title">Best and Easiest Billing Software!</p>
									<div className="landing-carousel-slide-content">
										<img className="landing-carousel-slide-content-image" width={200} height={200} src="/assets/images/svg/landing/landing-slide1.svg" />
										<div className="landing-carousel-slide-content-points">
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg"/>
												<p>Create GST compliant invoices</p>
											</div>
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg"/>
												<p>Recurring invoices for your buis</p>
											</div>
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg"/>
												<p>Create bills in multiple currencies</p>
											</div>
										</div>
									</div>
								</div>
								<div className="landing-carousel-slide text-center">
									<p className="landing-carousel-slide-title">Sales Insights at your Finger Tips</p>
									<div className="landing-carousel-slide-content">
										<img className="landing-carousel-slide-content-image" width={200} height={200} src="/assets/images/svg/landing/landing-slide2.svg" />
										<div className="landing-carousel-slide-content-points">
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg"/>
												<p>Analyse your business better</p>
											</div>
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg"/>
												<p>Real-time business data</p>
											</div>
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg"/>
												<p>Get your sales numbers increasing<br></br> with smart products</p>
											</div>
										</div>
									</div>
								</div>
								<div className="landing-carousel-slide text-center">
									<p className="landing-carousel-slide-title">Manage your Expenses Effectively</p>
									<div className="landing-carousel-slide-content">
										<img className="landing-carousel-slide-content-image" width={200} height={200} src="/assets/images/svg/landing/landing-slide3.svg" />
										<div className="landing-carousel-slide-content-points">
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg"/>
												<p>Track all your expenses and <br></br>purchases in one place</p>
											</div>
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg"/>
												<p>Easiest tool for expense tracking</p>
											</div>
											<div className="point">
												<img src="/assets/images/icons/green_check_mark.svg"/>
												<p>Create purchase orders</p>
											</div>
										</div>
									</div>
								</div>
							</Carousel.Slides>
							<Carousel.PageIndicators>
								<button
									key={0}
									className={activeSlide === 0 ? 'active': ''}
									onClick={() => this.setState({activeSlide: 0})}
								/>
								<button
									key={1}
									className={activeSlide === 1 ? 'active': ''}
									onClick={() => this.setState({activeSlide: 1})}
								/>
								<button
									key={2}
									className={activeSlide === 2 ? 'active': ''}
									onClick={() => this.setState({activeSlide: 2})}
								/>
							</Carousel.PageIndicators>
						</Carousel>
					</div> */}
					
					
					<img className='landing-image' src={landingImage}/>

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
						<div style={{display: 'flex'}}>
							<p>For more details visit <a href={"https://groflex.in"} target="_blank">www.groflex.in</a></p>
							<a href="https://groflex.in/terms-&-conditions" target="_blank">Terms & Conditions</a>
						</div>
					</div>

					{/* <div className="landing-fact">
						<div className="landing-fact-icon-background"> 
							<div className="login-fact-icon">
								<SVGInline height="100px" svg={sidebarIcon} />
							</div>
						</div>
						<div className="landing-fact-text">{sidebarText}</div>
					</div>
					<div className="landing-sidebar-footer">
						<a href="https://www.imprezz.in/imprint/" target="_blank">
							{resources.str_imprint}
						</a>
						<div className="link-divider" />
						<a href="https://www.imprezz.in/privacy-policy/" target="_blank">
							{resources.str_termsPrivacy}
						</a>
					</div> */}
				</div>
				: null}			
			
				<div className="landing-content">
				{this.isMobile ? <div className="imprezz-logo">
						<Link to="/account/login">
							<img src="/assets/images/svg/groflex.svg" />
						</Link>
					</div> : null }
					<div className="landing-content-inner">
						<div className="landing-content-inner-header">
							{this.isMobile ? <div className="mobile-text-content">{resources.mobileDisplayText}</div> : null}
							<div className="landing-content-headline">
								{hidePasswordField ? resources.str_register : resources.str_login} <br></br>
								<span className='sub-heading'>{resources.str_loginSub }</span>
							</div>
							<div className="landing-email-input-wrapper">
								<div className="login-input-wrapper">
									<TextInputComponent
										// autoComplete
										value={this.state.email}
										label={resources.str_enterEmail}
										id={'login-email'}
										name={'login-email'}
										errorMessage={this.state.emailError}
										onChange={e => this.onInputChange(e, 'email')}
										// onKeyDown={e => this.onInputKeyDown(e, 'email')}
										onKeyDown={e => this.onEmailKeyDown(e)}
									/>

									{ !hidePasswordField &&
										<TextInputComponent
											value={this.state.password}
											label={resources.str_password}
											id={'login-password'}
											name={'login-password'}
											isPassword={this.state.hidePassword}
											errorMessage={this.state.passwordError}
											onChange={e => this.onInputChange(e, 'password')}
											onKeyDown={e => this.onInputKeyDown(e, 'password')}
											icon = {this.state.hidePassword ? 'icon-invisible' : 'icon-visible'}
											iconAction = {() => this.onViewPasswordClick()}
											wrapperClass="password-field"
										/>
									}
								</div>

								{oauthLoginError ? <div className="google-error">{oauthLoginError}</div> : null}
								
								{ !hidePasswordField &&
									<div className="left- text-right" style={{marginTop: '0px'}}>
										{/* {`${resources.str_forgotPassword}?`} {this.isMobile ? <br/> : null} */}
										<Link to="/account/forgot_password">
											{resources.str_forgotPassword}
										</Link>
									</div>
								}
								{/* <div>
									{resources.noAccount} {this.isMobile ? <br/> : null}<Link to="/account/register">{resources.str_joinNow}</Link>
								</div> */}

								<ButtonComponent
									callback={() => hidePasswordField ? this.onEmailSubmit() : this.onLoginSubmit()}
									label={hidePasswordField ? resources.loginLabel : 'Login'}
									disabled={isLogginIn}
									dataQsId="login-btn-login"
									customCssClass="login-btn"
								/>

								{ !hidePasswordField &&
									<p style={{marginTop: 0}}>Don't have an account? <Link to={"/account/register"}>SIGN UP</Link></p>
								}
								
							</div>
						</div>
						{/* <div className='landing-content-inner-middle'>{resources.str_loginBetweenLable}</div> */}
						<div className="landing-content-inner-footer">
							<hr></hr> 
							{oauthGoogleUrl ? (
								<ButtonComponent
									callback={() => this.onGoogleLoginClicked()}
									label={resources.googleLogin}
									// buttonIcon={'icon-google'}
									customCssClass={'button-google'}
									disabled={isLogginIn}
									dataQsId="login-btn-googleLogin"
								/>
							) : null}
							
							<p className="terms-privacy-link">
								By signing up you're agreeing to our 
								<a href="https://groflex.in/terms-&-conditions" target="_blank">TERMS & CONDITIONS</a>
							</p>
						</div>
					</div>
					<div className="landing-content-footer">
						<div className="left-link">
							{`${resources.str_forgotPassword}?`} {this.isMobile ? <br/> : null}<Link to="/account/forgot_password">{resources.str_resetPassword}</Link>
						</div>
						<div>
							{resources.noAccount} {this.isMobile ? <br/> : null}<Link to="/account/register">{resources.str_joinNow}</Link>
						</div>
					</div>
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

export default connect(mapStateToProps)(LoginComponent);
