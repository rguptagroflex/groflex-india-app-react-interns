import invoiz from 'services/invoiz.service';
// import Intercom, { IntercomAPI } from 'services/intercom.service';
import _, { first } from "lodash";
import React from 'react';
import routes from 'routes';
import { RouteTypes } from 'helpers/constants';
import { Router, Route, Switch, withRouter } from 'react-router-dom';
import { PublicRoute, PrivateRoute } from 'helpers/routes';
import history from 'helpers/history';
import { Provider } from 'react-redux';
import store from 'redux/store';
import NavMainComponent from 'shared/nav-main/nav-main.component';
import FooterComponent from 'shared/footer/footer.component';
import { getBrowserLanguage } from 'helpers/getBrowserLanguage';
import { fetchLanguageFile } from 'redux/ducks/language/lang';
import LanguageComponent from 'shared/language/language.component';
import RegistrationViewState from 'enums/account/registration-view-state.enum';
// import Intercom, { IntercomAPI } from 'react-intercom';
import config from 'config';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import { parseQueryString } from 'helpers/parseQueryString';
import RegistrationOnboardingValues from 'enums/registration-values.enum';
import UserWizardModalCompoment from 'shared/modals/user-onboarding/user-wizard-modal.component';
import moment from 'moment';
import { getRemainingTime } from 'helpers/timetracking';
import ModalService from 'services/modal.service';
import { handleNotificationErrorMessage } from 'helpers/errorMessageNotification';
import RazorpayKycSetupModal from "shared/modals/razorpay-kyc-setup-modal.component";
import { updateSubscriptionDetails } from './helpers/updateSubsciptionDetails';
import UserWizardOnBoardingModalComponent from './shared/modals/user-onboarding/user-wizard-onboarding-modal.component';

class PageContainer extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			hasFooterContent: false,
			isSubscriptionDataSet: invoiz.user && invoiz.user.subscriptionData,
			intercomUser: {}
		};

		this.isLoggedInOnce = false;
		this.intercomAppID = config.releaseStage !== "production" ? `qrsrkmrh` : `y1zi63l6`;

		// invoiz.on('footerContentUpdated', (hasFooterContent) => {
		// 	this.setState({
		// 		hasFooterContent,
		// 	});
		// });

		// this.props.history.listen((location, action) => {
		// 	if (action === 'POP') {
		// 		invoiz.trigger('historyNavigateBack', true);
		// 	}
		// });

		invoiz.on('userModelSubscriptionDataSet', this.update, this);
	}

	update() {
		this.setupIntercom()
		.then(() => {
			//console.log(this.state.intercomUser);
			let properties = {
				'FIRSTNAME': this.state.intercomUser.name,
				'EMAIL': this.state.intercomUser.email,
				'PLAN' : this.state.intercomUser.Plan,
				'SMS' : this.state.intercomUser.phone,
				'WHATSAPP': this.state.intercomUser.phone,
				'LAST_LOGIN_TIME' : this.state.intercomUser.Last_Login_Time,
				'REGISTERED_AT' : this.state.intercomUser.registeredat,
				'USEDREFERRALCODES' : this.state.intercomUser.usedReferralCodes,
				'UTM_CAMPAIGN' : this.state.intercomUser.utm_campaign,
				'UTM_SOURCE' : this.state.intercomUser.utm_source,
				'UTM_MEDIUM' : this.state.intercomUser.utm_medium,
				'UTM_TERM' : this.state.intercomUser.utm_term,
				'UTM_CONTENT' : this.state.intercomUser.utm_content
			  }
			  console.log(properties);
			sendinblue.identify(this.state.intercomUser.email, properties)
			//sendinblue || sendinblue.identify (this.state.intercomUser.email, this.state.intercomUser);
		});

		this.setState(
			{
				isSubscriptionDataSet: true,
			},
			() => {
				if (this.isLoggedIn()) {
					// if (!this.isLoggedInOnce) {
						this.isLoggedInOnce = true;
						if (invoiz.user.registrationStep !== "legal_form" && invoiz.user.registrationStep !== "mobileotp") return;
						this.showUserWizard();
					// }
				}
			}
		);
	}

	isLoggedIn() {
		return (
			invoiz.user.loggedIn &&
			invoiz.user.registrationStep &&
			// invoiz.user.registrationStep !== "legal_form" &&
			invoiz.user.registrationStep !== "mobile" &&
			invoiz.user.registrationStep !== RegistrationViewState.CHOOSE_APP_PLAN &&
			invoiz.user.registrationStep !== "code" &&
			invoiz.user.registrationStep !== "mobileotp" &&
			// invoiz.user.registrationStep !== 'businesstype' &&
			// invoiz.user.registrationStep !== 'businessturnover' &&
			// invoiz.user.registrationStep !== 'businesscategory' &&
			window.location.pathname.indexOf("/offer/impress/preview/") === -1 &&
			window.location.pathname.indexOf("/offer/impress/previewContent/") === -1 &&
			window.location.pathname.indexOf("/account/registration/invitation/") === -1
		);
	}

	showUserWizard() {
		ModalService.open(
			<UserWizardOnBoardingModalComponent
				showMobileVerfication={invoiz.user.registrationStep === "mobileotp"}
				store={store}
				continue={async () => {
					if (window && window.dataLayer) {
						window._tfa = window._tfa || [];
						window._tfa.push({notify: 'event', name: 'complete_registration', id: 1291642});
						window.dataLayer.push({'event': 'registration_completed'});
					}
					await this.setState({intercomUser: {...this.state.intercomUser, phone: invoiz.user.mobile}})
					// IntercomAPI('update');
					// IntercomAPI.update();
				}}
				closeModal={() => {
					ModalService.close(<UserWizardOnBoardingModalComponent store={store} />);
				}}
			/>,
			{
				width: 1024,
				padding: 0,
				noTransform: true,
				isCloseable: false,
			}
		)
	}

	async setupIntercom() {
		const queryParams = parseQueryString(window.location.search);
		const utmParams = WebStorageService.getItem(WebStorageKey.UTM_PARAMETERS);
		let intercomUser = {};

		if (this.isLoggedInOnce && !this.isLoggedIn()) {
			this.isLoggedInOnce = false;
		}
		if (this.isLoggedIn()) {
			const userEmail = invoiz.user.userEmail;
			const usedReferralCodes = invoiz.user.usedReferralCodes ? invoiz.user.usedReferralCodes.join(',') : '';
			const userName = `${invoiz.user.companyAddress.firstName} ${invoiz.user.companyAddress.lastName}`;
			const plan = invoiz.user.planId ? invoiz.user.planId : "Free_Plan_2021";
			const businessType = invoiz.user.businessType
				? RegistrationOnboardingValues[invoiz.user.businessType]
				: "Undefined";
			const businessCategory = invoiz.user.businessField || invoiz.user.businessCategory;
			const businessTurnover = invoiz.user.businessTurnover
				? RegistrationOnboardingValues[invoiz.user.businessTurnover]
				: "Undefined";
			const lastLogin = moment(invoiz.user.lastLogin).utcOffset("+0530").format("DD-MM-YYYY h:mm:ss a");
			const registeredTime = moment(invoiz.user.registeredAt).utcOffset("+0530").format("DD-MM-YYYY h:mm:ss a");
			intercomUser = {
				user_id: userEmail,
				email: userEmail,
				name: userName,
				Plan: plan,
				BusinessType: businessType,
				BusinessCategory: businessCategory,
				BusinessTurnover: businessTurnover,
				Last_Login_Time: lastLogin,
				Rererral_Codes: usedReferralCodes,
				registeredat: registeredTime
			};
			if (invoiz.user.mobile) {
				intercomUser.phone = invoiz.user.mobile;
			}
		}

		if (queryParams && queryParams.utm_source) {
			WebStorageService.removeItem(WebStorageKey.UTM_PARAMETERS);
			WebStorageService.setItem(WebStorageKey.UTM_PARAMETERS, queryParams);
		}

		if (utmParams) {
			utmParams.utm_campaign ? (intercomUser.utm_campaign = utmParams.utm_campaign) : null;
			utmParams.utm_source ? (intercomUser.utm_source = utmParams.utm_source) : null;
			utmParams.utm_medium ? (intercomUser.utm_medium = utmParams.utm_medium) : null;
			utmParams.utm_term ? (intercomUser.utm_term = utmParams.utm_term) : null;
			utmParams.utm_content ? (intercomUser.utm_content = utmParams.utm_content) : null;
		}
		//console.log('intercomUser', intercomUser)
		await this.setState({intercomUser: {...intercomUser}});
		invoiz.on('userModelSubscriptionDataSet', this.update, this);
	}

	componentDidMount() {
		
	}

	componentDidUpdate() {
		invoiz.on('userModelSubscriptionDataSet', this.update, this);
		// IntercomAPI('update');
		// IntercomAPI.update();
	}

	render() {
		const { hasFooterContent } = this.state;
		const isInvitationPage = window.location.pathname.indexOf("/account/registration/invitation/") !== -1;
		const classNames = {
			layout: invoiz.user.loggedIn && !isInvitationPage ? "layout layout-nav" : "layout-blank",
		};

		return (
			<LanguageComponent>
				<div className={`layout-wrapper ${hasFooterContent ? "has-footer" : ""}`}>
					<div className={classNames.layout}>
						{this.isLoggedIn() && !isInvitationPage ? <NavMainComponent /> : null}
						<section>
							<Switch>
								{routes.map((route, index) => {
									switch (route.type) {
										case RouteTypes.ROUTE:
											return (
												<Route
													key={index}
													path={route.path}
													exact={route.exact}
													component={route.component}
												/>
											);

										case RouteTypes.PRIVATE:
											return (
												<PrivateRoute
													key={index}
													path={route.path}
													exact={route.exact}
													component={route.component}
													title={route.title}
													menuItem={route.menuItem}
													submenuItem={route.submenuItem}
													pageClass={route.pageClass}
													resourceKey={route.resourceKey}
												/>
											);

										case RouteTypes.PUBLIC:
											return (
												<PublicRoute
													key={index}
													path={route.path}
													exact={route.exact}
													component={route.component}
													title={route.title}
													resourceKey={route.resourceKey}
												/>
											);
									}
								})}
							</Switch>
						</section>
					</div>

					{/* {this.isLoggedIn() && invoiz.user.subscriptionData && !isInvitationPage ? (
						<FooterComponent subscriptionData={invoiz.user.subscriptionData} />
					) : null} */}
					{/* {config.releaseStage != 'staging' && config.releaseStage != 'local'  ? <Intercom appID="y1zi63l6" { ...intercomUser } /> : null} */}
					{/* {<Intercom appID={this.intercomAppID} {...this.state.intercomUser} />} */}
					{/* {
						window.Intercom('boot', {app_id: this.intercomAppID, ...this.state.intercomUser})
					} */}
					{/* <Intercom appId={this.intercomAppID} user={this.state.intercomUser} /> */}
				</div>
			</LanguageComponent>
		);
	}
}

const PageContainerWithRouter = withRouter(PageContainer);

class AppComponent extends React.Component {
	componentDidMount() {
		// store.dispatch(fetchLanguageFile(getBrowserLanguage()));
		// set default language en
		store.dispatch(fetchLanguageFile('en'));
		// const loader = document.querySelector('#app-loader'); // hide loader in language component bcs first we get the language strings then we hide loader.
		// loader && loader.parentNode.removeChild(loader);
	}

	componentDidUpdate() {
		// IntercomAPI('update');
		// IntercomAPI.update();
	}

	render() {
		return (
			<Router history={history}>
				<Provider store={store}>
					<PageContainerWithRouter />
				</Provider>
			</Router>
		);
	}
}

export default AppComponent;
