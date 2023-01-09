import invoiz from 'services/invoiz.service';
import React from 'react';
import moment from 'moment';
import { redirectToChargebee } from 'helpers/redirectToChargebee';
// import { redirectToZohoApi } from 'helpers/redirectToZohoApi';
import ChargebeePlan from 'enums/chargebee-plan.enum';
// import ZohoPlan from 'enums/zoho-plan.enum';
import business60Icon from 'assets/images/svg/business_1.svg';
import business240Icon from 'assets/images/svg/business_2.svg';
import business600Icon from 'assets/images/svg/business_3.svg';
import business800Icon from 'assets/images/svg/business_4.svg';
import SVGInline from 'react-svg-inline';
// import { addLeadingZero } from 'helpers/addLeadingZero';
import { fetchOnboardingData } from 'redux/ducks/dashboard/onboarding';
import { connectWithStore } from 'helpers/connectWithStore';
import store from 'redux/store';
import config from 'config';
import { format } from 'util';
import ModalService from 'services/modal.service';
import AddMobileNumberModal from 'shared/modals/add-mobile-number-modal.component';
import { PlanLimitAndPrice } from 'helpers/constants';
import SubscriptionStatus from 'enums/subscription-status.enum';
import PopupComponent from 'shared/popup/popup.component';
import {
	multiUserContingent,
	canExtendUsers,
} from 'helpers/subscriptionHelpers';

import DualToggleComponent from 'shared/oval-toggle/dual-toggle.component';
import CheckboxInputComponent from 'shared/inputs/checkbox-input/checkbox-input.component';
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import { getResource } from 'helpers/resource';
class UpgradeModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			useOnborading: true,
			remainingMinutesOnboarding: 0,
			showPopup: false,
			popupText: '',
			chosenPlan: '',
			togglePlans: true,
			useReferralCode: false,
			referralCode:''
		};

		this.hasSubscriptionData = false;
		this.remainingMinutesCountdown = null;
		this.handleUpgradeClick = this.handleUpgradeClick.bind(this);
		this.togglePopupWindow = this.togglePopupWindow.bind(this);
		this.handleReferralCodeCheckBox = this.handleReferralCodeCheckBox.bind(this)
		this.validateAndSaveReferralCode = this.validateAndSaveReferralCode.bind(this)

		invoiz.on('userModelSubscriptionDataSet', () => {
			if (!this.hasSubscriptionData) {
				this.props.fetchOnboardingData();
			}
		});
	}

	componentDidMount() {
		if (
			invoiz.user &&
			invoiz.user.subscriptionData &&
			(invoiz.user.subscriptionData.planId === ChargebeePlan.TRIAL || invoiz.user.subscriptionData.planId === ChargebeePlan.TRIAL_21)
		) {
			if (Object.keys(invoiz.user).length > 0) {
				let remainingMinutes = 59 - moment(new Date()).diff(new Date(invoiz.user.registeredAt), 'minutes');

				this.setState({ remainingMinutesOnboarding: remainingMinutes }, () => {
					this.props.fetchOnboardingData();

					this.remainingMinutesCountdown = setInterval(() => {
						remainingMinutes = 59 - moment(new Date()).diff(new Date(invoiz.user.registeredAt), 'minutes');

						if (this.refs.upgradeModalWrapper) {
							this.setState({ remainingMinutesOnboarding: remainingMinutes });
						}

						if (remainingMinutes < 1) {
							clearInterval(this.remainingMinutesCountdown);
						}
					}, 1000);
				});
			}
		} else {
			this.setState({ useOnborading: false });
		}
		if (invoiz.user && invoiz.user.subscriptionData 
			&& (invoiz.user.subscriptionData.planId === ChargebeePlan.STARTER_YEARLY 
			|| invoiz.user.subscriptionData.planId === ChargebeePlan.STANDARD_YEARLY 
			|| invoiz.user.subscriptionData.planId === ChargebeePlan.UNLIMITED_YEARLY) ) {
				this.setState({ togglePlans: true })
			}
	}

	async validateAndSaveReferralCode(){
		  if(!this.state.referralCode)
		  invoiz.page.showToast({ type: "error", message: 'Enter a valid referral code' });
		  else{

			const data ={ code : this.state.referralCode.replace('<p>','').replace('</p>','')}
			return invoiz
					.request(`${config.resourceHost}referralCode/validateAndSave`, {
						method: "POST",
						auth: true,
						data: data,
					})
					.then(() => {
					   return "SUCCESS"	
					})
					.catch((error) => {
						const message = error && error.body && error.body.meta && error.body.meta &&  error.body.meta['code'][0]
						if (message) {
							invoiz.page.showToast({ type: "error", message:message.code  });
						} else {
						}

					});
		  }
			
		}

	async handleUpgradeClick(chargebeePlan) {
		const { currentUserCount } = invoiz.user.subscriptionData;
		// const newPlanContingent = multiUserContingent(chargebeePlan);
		// const newPlanMultiUserExtendable = canExtendUsers(chargebeePlan);
		let popupText = '';
		// if (currentUserCount !== 1 && currentUserCount > newPlanContingent) {
		// 	const { resources } = this.props;
			// if (!newPlanMultiUserExtendable) {
			// 	popupText =resources.popupText;
			// } else if (newPlanMultiUserExtendable) {
			// 	const newPlanUserDifference = currentUserCount - newPlanContingent;
			// 	popupText = (
			// 		<div>
			// 			   Your selected plan only includes {newPlanContingent === 1 ? 'one' : newPlanContingent}{' '}
			// 			    Users included.
			// 			<br />
			// 			 If you make this change, you will automatically <br />
			// 			<span className="text-semibold">{newPlanUserDifference}</span> Further
			// 			{newPlanUserDifference === 1 ? 'r' : ''} Users for ever{' '}
			// 			{/* <span className="text-semibold">9 €</span> monthly plus VAT invoiced. */}
			// 		</div>
			// 	);
			// }
		// 	this.setState(
		// 		{
		// 			popupText,
		// 			chosenPlan: chargebeePlan,
		// 		},
		// 		() => {
		// 			this.togglePopupWindow();
		// 		}
		// 	);			
		// } else {		

		   let continueToUpgrade = !this.state.useReferralCode
		  if(this.state.useReferralCode)
		  continueToUpgrade = await this.validateAndSaveReferralCode()

		if(continueToUpgrade){
			if (invoiz.user.mobile) {
				// redirectToZohoApi(zohoPlan);
				redirectToChargebee(chargebeePlan);
				invoiz.trigger('triggerModalClose');
			} else {
				const { resources } = this.props;
				ModalService.open(<AddMobileNumberModal resources={resources} chargebeePlan={chargebeePlan}/>, {
					headline: resources.upgradeMobileHeading,
					width: 520,
					padding: 50,
					noTransform: true,
					isCloseableViaOverlay: true
				});
			}
		} 
		//}
	}

	handleOnboardingInfoClick() {
		invoiz.trigger('triggerModalClose');
		invoiz.router.navigate('/');
	}
	togglePopupWindow() {
		const { showPopup } = this.state;
		this.setState({
			showPopup: !showPopup,
		});
	}

	getToggledPlans(SmallPlanInfo, mediumPlanInfo, largePlanInfo, SmallPlanInfoYearly, mediumPlanInfoYearly, largePlanInfoYearly) {
		const { togglePlans } = this.state;
		const { title, isLoading, resources } = this.props;
		const strFeatures = getResource("strFeatures").map((item, index) => {
			return <li key={index}>{item}</li>
		})
		const stdFeatures = getResource("stdFeatures").map((item, index) => {
			return <li key={index}>{item}</li>
		})
		const utdFeatures = getResource("utdFeatures").map((item, index) => {
			return <li key={index}>{item}</li>
		})

		if(togglePlans) {
			return (
				<div className="yearly-plans">
					<div className="subscription-box">
						{SmallPlanInfoYearly.disable ? (
							<div className="subscription-disable"></div>
						) : null}
						<div className="subscription-name">{resources.str_starter}</div>
						<div className="subscription-subtitle">{resources.starterTurnover}</div>
						
						<div className="subscription-price-new">
							<div className="price"><span className="rupee">{config.currencyFormat.symbol}335</span>/month</div>
							<div className="price-billed">{resources.starterBillingPrice}</div>
						</div>

						{SmallPlanInfoYearly.disable ? (
							<button
								data-qs-id="upgradeModal-btn-choice2"
								className="button button-rounded button-primary"
							>
								{resources.str_start}
							</button>
						) : <button
							data-qs-id="upgradeModal-btn-choice2"
							// onClick={() => this.handleUpgradeClick(ZohoPlan.STARTER)}
							onClick={() => this.handleUpgradeClick(ChargebeePlan.STARTER_YEARLY_21)}
							className="button button-rounded button-primary"
						>
							{resources.str_start}
						</button>
						}

						<ul className="features-list">
							{strFeatures}
						</ul>
					</div>
					<div className="subscription-box">
						{mediumPlanInfoYearly.disable ? (
							<div className="subscription-disable"></div>
						) : null}
						<div className="subscription-name">{resources.str_standard}</div>
						<div className="subscription-subtitle">{resources.standardTurnover}</div>
						
						<div className="subscription-price-new">
							<div className="price"><span className="rupee">{config.currencyFormat.symbol}835</span>/month</div>
							<div className="price-billed">{resources.standardBillingPrice}</div>
						</div>
						{/* <div className="subscription-icon">
							<SVGInline width="55px" height="55px" svg={business600Icon} />
						</div> */}

						{/* <div className="subscription-contingent">
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextSubHeadline, mediumPlanInfoYearly.contingentLimit) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeStandardQuotationHeadline) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextHeadline, mediumPlanInfoYearly.maxLimit) }}></div>
							<div className="subscription-contingent-border-small-box" />
						</div>

						<div className="subscription-price">
							<div className="price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{mediumPlanInfoYearly.amount}
							</div>
							<div className="offer-price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{mediumPlanInfoYearly.offerAmount}
							</div>
							<div className="monthly">{mediumPlanInfoYearly.monthlyText}</div>
						</div> */}
						{mediumPlanInfoYearly.disable ? (
							<button
								data-qs-id="upgradeModal-btn-choice3"
								className="button button-rounded button-primary"
							>
								{resources.str_start}
							</button>
						) : <button
							// onClick={() => this.handleUpgradeClick(ZohoPlan.STANDARD)}
							onClick={() => this.handleUpgradeClick(ChargebeePlan.STANDARD_YEARLY_21)}
							data-qs-id="upgradeModal-btn-choice3"
							className="button button-rounded button-primary"
						>
							{resources.str_start}
						</button>
						}
<ul className="features-list">
							{stdFeatures}
						</ul>
					</div>

					<div className="subscription-box last-box">
						{largePlanInfoYearly.disable ? (
							<div className="subscription-disable"></div>
						) : null}
						<div className="subscription-name">{resources.str_unlimited}</div>
						<div className="subscription-subtitle">{resources.unlimitedTurnover}</div>
						
						<div className="subscription-price-new">
							<div className="price"><span className="rupee">{config.currencyFormat.symbol}1665</span>/month</div>
							<div className="price-billed">{resources.unlimitedBillingPrice}</div>
						</div>
						{largePlanInfoYearly.disable ? (
							<button
								data-qs-id="upgradeModal-btn-choice4"
								className="button button-rounded button-primary"
							>
								{resources.str_start}
							</button>
						) : <button
							// onClick={() => this.handleUpgradeClick(ZohoPlan.UNLIMITED)}
							onClick={() => this.handleUpgradeClick(ChargebeePlan.UNLIMITED_YEARLY_21)}
							data-qs-id="upgradeModal-btn-choice4"
							className="button button-rounded button-primary"
						>
							{resources.str_start}
						  </button>
						}
						<ul className="features-list">
							{utdFeatures}
						</ul>
					</div>
		</div>
			)
		} else {
			return (
			<div className="monthly-plans">
					<div className="subscription-box">
						{SmallPlanInfo.disable ? (
							<div className="subscription-disable"></div>
						) : null}
						<div className="subscription-name">{resources.str_starter}</div>

						<div className="subscription-icon">
							<SVGInline width="55px" height="55px" svg={business240Icon} />
						</div>

						<div className="subscription-contingent">
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextSubHeadline, SmallPlanInfo.contingentLimit) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeStandardQuotationHeadline) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextHeadline, SmallPlanInfo.maxLimit) }}></div>
							{/* <div dangerouslySetInnerHTML={{ __html: format(resources.str_users) }}></div> */}
							<div className="subscription-contingent-border-small-box" />
						</div>

						<div className="subscription-price">
							{/* <div className="price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{SmallPlanInfo.amount}
							</div> */}
							<div className="original-price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{SmallPlanInfo.amount}
							</div>
							<div className="monthly">{SmallPlanInfo.monthlyText}</div>
						</div>
						{SmallPlanInfo.disable ? (
							<button
								data-qs-id="upgradeModal-btn-choice2"
								className="button button-rounded button-primary"
							>
								{resources.str_start}
							</button>
						) : <button
							data-qs-id="upgradeModal-btn-choice2"
							// onClick={() => this.handleUpgradeClick(ZohoPlan.STARTER)}
							onClick={() => this.handleUpgradeClick(ChargebeePlan.STARTER_MONTHLY)}
							className="button button-rounded button-primary"
						>
							{resources.str_start}
						</button>
						}
					</div>

					<div className="subscription-box">
						{mediumPlanInfo.disable ? (
							<div className="subscription-disable"></div>
						) : null}
						<div className="subscription-name">{resources.str_standard}</div>

						<div className="subscription-icon">
							<SVGInline width="55px" height="55px" svg={business600Icon} />
						</div>

						<div className="subscription-contingent">
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextSubHeadline, mediumPlanInfo.contingentLimit) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeStandardQuotationHeadline) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextHeadline, mediumPlanInfo.maxLimit) }}></div>
							{/* <div dangerouslySetInnerHTML={{ __html: format(resources.str_users) }}></div> */}
							<div className="subscription-contingent-border-small-box" />
						</div>

						<div className="subscription-price">
							<div className="original-price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{mediumPlanInfo.amount}
							</div>
							{/* <div className="offer-price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{mediumPlanInfo.offerAmount}
							</div> */}
							<div className="monthly">{mediumPlanInfo.monthlyText}</div>
						</div>
						{mediumPlanInfo.disable ? (
							<button
								data-qs-id="upgradeModal-btn-choice3"
								className="button button-rounded button-primary"
							>
								{resources.str_start}
							</button>
						) : <button
							// onClick={() => this.handleUpgradeClick(ZohoPlan.STANDARD)}
							onClick={() => this.handleUpgradeClick(ChargebeePlan.STANDARD_MONTHLY)}
							data-qs-id="upgradeModal-btn-choice3"
							className="button button-rounded button-primary"
						>
							{resources.str_start}
						</button>
						}

					</div>

					<div className="subscription-box last-box">
						{largePlanInfo.disable ? (
							<div className="subscription-disable"></div>
						) : null}
						<div className="subscription-name">{resources.str_unlimited}</div>

						<div className="subscription-icon">
							<SVGInline width="55px" height="55px" svg={business800Icon} />
						</div>

						<div className="subscription-contingent">
							<div dangerouslySetInnerHTML={{ __html: resources.upgradeStandardPlanSubHeading }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeStandardQuotationHeadline) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextHeadline, largePlanInfo.contingentLimit) }}></div>
							{/* <div dangerouslySetInnerHTML={{ __html: format(resources.str_users) }}></div> */}
							<div className="subscription-contingent-border-small-box" />
						</div>

						<div className="subscription-price">
							<div className="original-price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{largePlanInfo.amount}
							</div>
							{/* <div className="offer-price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{largePlanInfo.offerAmount}
							</div> */}
							<div className="monthly">{largePlanInfo.monthlyText}</div>
						</div>

						{largePlanInfo.disable ? (
							<button
								data-qs-id="upgradeModal-btn-choice4"
								className="button button-rounded button-primary"
							>
								{resources.str_start}
							</button>
						) : <button
							// onClick={() => this.handleUpgradeClick(ZohoPlan.UNLIMITED)}
							onClick={() => this.handleUpgradeClick(ChargebeePlan.UNLIMITED_MONTHLY)}
							data-qs-id="upgradeModal-btn-choice4"
							className="button button-rounded button-primary"
						>
							{resources.str_start}
						  </button>
						}
					</div>
		</div>
			);
		}
	}

	handleReferralCodeCheckBox(ref){
		this.setState({useReferralCode: !this.state.useReferralCode, referralCode: ''})
		if(!this.state.useReferralCode)
		   $(ref).focus()
	}
	handleReferralCodeChange(value){
		this.setState({referralCode: value})
	}


	render() {
		const { useOnborading, togglePlans } = this.state;
		// remainingMinutesOnboarding
		const { title, isLoading, resources } = this.props; // , onboardingData
		const { popupText, showPopup, chosenPlan } = this.state;
		// const hasOnboardingInfo =
		// 	onboardingData &&
		// 	!onboardingData.finished &&
		// 	remainingMinutesOnboarding !== null &&
		// 	remainingMinutesOnboarding > 0;
		const hasOnboardingInfo = false;
		this.hasSubscriptionData = true;

		if (useOnborading && isLoading) {
			return null;
		}
		const today = moment();
		const cybermondayStartDate = moment('21/11/2018', 'DD/MM/YYYY');
		const cybermondayEndDate = moment('29/11/2018', 'DD/MM/YYYY');
		const isCybermondayActive =
			(invoiz.user.subscriptionData.planId === ChargebeePlan.TRIAL || invoiz.user.subscriptionData.planId === ChargebeePlan.TRIAL_21) &&
			today.isBetween(cybermondayStartDate, cybermondayEndDate);
		const cybermondayCompactHeadline = title.match(/Testversion/) && isCybermondayActive;

		const isBegginnerActiveYearly = (invoiz.user.subscriptionData.planId === ChargebeePlan.STARTER_YEARLY_21);
		const isStandardActiveYearly = ( invoiz.user.subscriptionData.planId === ChargebeePlan.STANDARD_YEARLY_21);
		const isUnlimitedActiveYearly = (invoiz.user.subscriptionData.planId === ChargebeePlan.UNLIMITED_YEARLY_21);

		const isCancelledAccount = (invoiz.user.subscriptionData.status === SubscriptionStatus.CANCELLED);
		const isFreeActive = (invoiz.user.subscriptionData.planId === ChargebeePlan.FREE_MONTH);
		const isBegginnerActive = (invoiz.user.subscriptionData.planId === ChargebeePlan.STARTER 
			|| invoiz.user.subscriptionData.planId === ChargebeePlan.STARTER_249 || invoiz.user.subscriptionData.planId === ChargebeePlan.STARTER_MONTHLY );
		const isStandardActive = (invoiz.user.subscriptionData.planId === ChargebeePlan.STANDARD || invoiz.user.subscriptionData.planId === ChargebeePlan.STANDARD_749 
			|| invoiz.user.subscriptionData.planId === ChargebeePlan.STANDARD_MONTHLY);
		const isUnlimitedActive = (invoiz.user.subscriptionData.planId === ChargebeePlan.UNLIMITED || invoiz.user.subscriptionData.planId === ChargebeePlan.UNLIMITED_999 
			|| invoiz.user.subscriptionData.planId === ChargebeePlan.UNLIMITED_MONTHLY);
		const contingentLimit = invoiz.user.subscriptionData.contingentLimit;
		const { freeTenLacContingentLimit, freeContingentLimit, freefivelacContingentLimit } = PlanLimitAndPrice;
		const FreePlanInfo = {
			contingentLimit: `${config.currencyFormat.symbol} ${contingentLimit === freeTenLacContingentLimit ? freeContingentLimit : freefivelacContingentLimit} `,
			maxLimit: PlanLimitAndPrice.freeMaxLimit,
			disable: (isFreeActive || isBegginnerActive || isStandardActive || isUnlimitedActive ) ? isCancelledAccount ? (!isFreeActive && isCancelledAccount) : true : false
		};

		const SmallPlanInfo = {
			amount: PlanLimitAndPrice.smallPlanAmount,
			offerAmount: PlanLimitAndPrice.smallPlanAmountNew,
			monthlyText: resources.str_perMonth,
			contingentLimit: `${config.currencyFormat.symbol} ${PlanLimitAndPrice.smallContingentLimit} `,
			maxLimit: PlanLimitAndPrice.smallPlanMaxLimit,
			disable: (isBegginnerActive || isStandardActive || isUnlimitedActive || isBegginnerActiveYearly || isStandardActiveYearly || isUnlimitedActiveYearly) ? isCancelledAccount ? (!isBegginnerActive && isCancelledAccount) : true : false
		};

		const mediumPlanInfo = {
			amount: PlanLimitAndPrice.mediumPlanAmount,
			offerAmount: PlanLimitAndPrice.mediumPlanAmountNew,
			monthlyText: resources.str_perMonth,
			contingentLimit: `${config.currencyFormat.symbol} ${PlanLimitAndPrice.mediumContingentLimit} `,
			maxLimit: PlanLimitAndPrice.mediumPlanMaxLimit,
			disable: (isStandardActive || isUnlimitedActive || isBegginnerActiveYearly || isStandardActiveYearly || isUnlimitedActiveYearly) ? isCancelledAccount ? (!isStandardActive && isCancelledAccount) : true : false
		};

		const largePlanInfo = {
			amount: PlanLimitAndPrice.LargePlanAmount,
			offerAmount: PlanLimitAndPrice.LargePlanAmountNew,
			monthlyText: resources.str_perMonth,
			contingentLimit: resources.str_unlimited,
			disable: (isUnlimitedActive || isBegginnerActiveYearly || isStandardActiveYearly || isUnlimitedActiveYearly) ? isCancelledAccount ? (!isUnlimitedActive && isCancelledAccount) : true : false
		};

		const SmallPlanInfoYearly = {
			amount: PlanLimitAndPrice.smallPlanAmountYearly,
			offerAmount: PlanLimitAndPrice.smallPlanAmountYearlyDiscount,
			monthlyText: resources.str_perYearly,
			contingentLimit: `${config.currencyFormat.symbol} ${PlanLimitAndPrice.smallContingentLimit} `,
			maxLimit: PlanLimitAndPrice.smallPlanMaxLimit,
			disable: (isBegginnerActiveYearly || isStandardActiveYearly || isUnlimitedActiveYearly ) ? isCancelledAccount ? (!isBegginnerActiveYearly && isCancelledAccount) : true : false
		};

		const mediumPlanInfoYearly = {
			amount: PlanLimitAndPrice.mediumPlanAmountYearly,
			offerAmount: PlanLimitAndPrice.mediumPlanAmountYearlyDiscount,
			monthlyText: resources.str_perYearly,
			contingentLimit: `${config.currencyFormat.symbol} ${PlanLimitAndPrice.mediumContingentLimit} `,
			maxLimit: PlanLimitAndPrice.mediumPlanMaxLimit,
			disable: (isStandardActiveYearly || isUnlimitedActiveYearly) ? isCancelledAccount ? (!isStandardActiveYearly && isCancelledAccount) : true : false
		};

		const largePlanInfoYearly = {
			amount: PlanLimitAndPrice.LargePlanAmountYearly,
			offerAmount: PlanLimitAndPrice.LargePlanAmountYearlyDiscount,
			monthlyText: resources.str_perYearly,
			contingentLimit: resources.str_unlimited,
			disable: isUnlimitedActiveYearly ? isCancelledAccount ? (!isUnlimitedActiveYearly && isCancelledAccount) : true : false
		};

		// const isStartupYearlyActive = (invoiz.user.subscriptionData.planId === ZohoPlan.FREE_YEARLY);
		// const isBusinessYearlyActive = (invoiz.user.subscriptionData.planId === ZohoPlan.STARTER_YEARLY);
		// const isgrowthYearlyActive = (invoiz.user.subscriptionData.planId === ZohoPlan.STANDARD_YEARLY);

		// const startupYearlyPlanInfo = {
		// 	amount: PlanLimitAndPrice.startupPlanAmount,
		// 	offerAmount: PlanLimitAndPrice.startupPlanAmountNew,
		// 	yearlyText: resources.str_perYearly,
		// 	contingentLimit: `${config.currencyFormat.symbol} ${PlanLimitAndPrice.startupContingentLimit} `,
		// 	maxLimit: PlanLimitAndPrice.startupMaxLimit
		// };

		// const businessYearlyPlanInfo = {
		// 	amount: PlanLimitAndPrice.businessPlanAmount,
		// 	offerAmount: PlanLimitAndPrice.businessPlanAmountNew,
		// 	yearlyText: resources.str_perYearly,
		// 	contingentLimit: `${config.currencyFormat.symbol} ${PlanLimitAndPrice.businessContingentLimit} `,
		// 	maxLimit: PlanLimitAndPrice.businessMaxLimit
		// };

		// const growthYearlyPlanInfo = {
		// 	amount: PlanLimitAndPrice.growthPlanAmount,
		// 	offerAmount: PlanLimitAndPrice.growthPlanAmountNew,
		// 	yearlyText: resources.str_perYearly,
		// 	contingentLimit: `${config.currencyFormat.symbol} ${PlanLimitAndPrice.growthContingentLimit} `,
		// 	maxLimit: PlanLimitAndPrice.growthMaxLimit
		// };

		// const unlimitedYearlyPlanInfo = {
		// 	amount: PlanLimitAndPrice.unlimitedPlanAmount,
		// 	offerAmount: PlanLimitAndPrice.unlimitedPlanAmountNew,
		// 	yearlyText: resources.str_perYearly,
		// 	contingentLimit: resources.str_unlimited
		// };

		return (
			<div
				className={`upgrade-modal-component ${hasOnboardingInfo ? 'has-onboarding-info' : ''}`}
				ref="upgradeModalWrapper"
			>
				{showPopup && (
					ModalService.open(
						<PopupComponent
						headline="Are you sure?"
						text={popupText}
						showPopup = {showPopup}
						confirmLabel="To confirm"
						togglePopupWindow={this.togglePopupWindow}
						onConfirm={() => {
							redirectToChargebee(chosenPlan);
							this.togglePopupWindow();
						}}
					/>, {
						width: 1240,
						padding: 0,
						isCloseable: true
					})
					
				)}
				<div className="background-box">
					{isCybermondayActive ? (
						<div className="cybermonday-badge">
							<img src="/assets/images/svg/badge_cybermonday_2018.svg" width="184" />
							<div className="badge-shadow" />
						</div>
					) : null}
					<h1 className={`headline ${cybermondayCompactHeadline ? 'compact' : ''}`}>{title}</h1>
					<p className="claim">
						{resources.upgradeModalSubHeaderText}
					</p>
					{/* <span className="toggle-claim">
						{resources.str_chooseMonthlyYearlyPlan}
					</span> */}
				</div>
				{/* <div className="toggle-plan">
					<DualToggleComponent
						onChange={() => {
							this.setState({togglePlans: !togglePlans})
						}}
						checked={this.state.togglePlans}
						labelLeftText="Monthly Plans"
						labelRightText="Yearly Plans"
					/>
				</div> */}

				<div className="content-box">
					{this.getToggledPlans(SmallPlanInfo, mediumPlanInfo, largePlanInfo, SmallPlanInfoYearly, mediumPlanInfoYearly, largePlanInfoYearly)}

					{/* <div className="subscription-box">
						{FreePlanInfo.disable ? (
							<div className="subscription-disable"></div>
						) : null}
						<div className="subscription-name">{resources.str_free}</div>

						<div className="subscription-icon">
							<SVGInline width="55px" height="55px" svg={business60Icon} />
						</div>

						<div className="subscription-contingent">
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextSubHeadline, FreePlanInfo.contingentLimit) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeStandardQuotationHeadline) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextHeadline, FreePlanInfo.maxLimit) }}></div>
							<div className="subscription-contingent-border-small-box" />
						</div>

						<div className="subscription-price">
							<div className="free">
								{resources.str_lifetime}
							</div>
							<div className="free-price">
								{resources.str_free}
							</div>
							<div className="monthly">&nbsp;</div>
						</div>
						{FreePlanInfo.disable ? (
							<button
								data-qs-id="upgradeModal-btn-choice1"
								className="button button-rounded button-primary"
							>
								{resources.str_start}
							</button>
						) : <button
							data-qs-id="upgradeModal-btn-choice1"
							onClick={() => this.handleUpgradeClick(ChargebeePlan.FREE_MONTH)}
							className="button button-rounded button-primary button-free-mnth"
						>
							{resources.str_start}
						</button>
						}

					</div> */}

					{/* CONTENT GOES HERE */}

					  {/* <div className="subscription-box">
						{isBegginnerActive || isStandardActive || isStartupYearlyActive || isBusinessYearlyActive || isgrowthYearlyActive ? (
							<div className="subscription-disable"></div>
						) : null}
						<div className="subscription-name">{resources.str_startup}</div>

						<div className="subscription-icon">
							<SVGInline width="55px" height="55px" svg={business60Icon} />
						</div>

						<div className="subscription-contingent">
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextSubHeadline, startupYearlyPlanInfo.contingentLimit) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeStandardQuotationHeadline) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextHeadline, startupYearlyPlanInfo.maxLimit) }}></div>
							<div className="subscription-contingent-border-small-box" />
						</div>

						<div className="subscription-price">
							<div className="price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{startupYearlyPlanInfo.amount}
							</div>
							<div className="offer-price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{startupYearlyPlanInfo.offerAmount}
							</div>
							<div className="monthly">{startupYearlyPlanInfo.yearlyText}</div>
						</div>

						<button
							data-qs-id="upgradeModal-btn-choice1"
							onClick={() => this.handleUpgradeClick(ZohoPlan.FREE_YEARLY)}
							className="button button-rounded button-primary"
						>
							{resources.str_start}
						</button>
					</div>

					<div className="subscription-box large-box">
						{isBegginnerActive || isStandardActive || isBusinessYearlyActive || isgrowthYearlyActive ? (
							<div className="subscription-disable"></div>
						) : null}
						<div className="subscription-name">{resources.str_business}</div>

						<div className="subscription-icon">
							<SVGInline width="55px" height="55px" svg={business240Icon} />
						</div>

						<div className="subscription-contingent">
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextSubHeadline, businessYearlyPlanInfo.contingentLimit) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeStandardQuotationHeadline) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextHeadline, businessYearlyPlanInfo.maxLimit) }}></div>
							<div className="subscription-contingent-border" />
						</div>

						<div className="subscription-price">
							<div className="price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{businessYearlyPlanInfo.amount}
							</div>
							<div className="offer-price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{businessYearlyPlanInfo.offerAmount}
							</div>
							<div className="monthly">{businessYearlyPlanInfo.yearlyText}</div>
						</div>

						<button
							data-qs-id="upgradeModal-btn-choice1"
							// onClick={() => this.handleUpgradeClick(ChargebeePlan.BEGINNER)}
							// onClick={() => this.handleUpgradeClick(ZohoPlan.STARTER)}
							onClick={() => this.handleUpgradeClick(ZohoPlan.STARTER_YEARLY)}
							className="button button-rounded button-primary"
						>
							{resources.str_start}
						</button>
					</div>

					<div className="subscription-box large-box">
						{isStandardActive || isgrowthYearlyActive? (
							<div className="subscription-disable"></div>
						) : null}
						<div className="subscription-name">{resources.str_growth}</div>

						<div className="subscription-icon">
							<SVGInline width="55px" height="55px" svg={business600Icon} />
						</div>

						<div className="subscription-contingent">
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextSubHeadline, growthYearlyPlanInfo.contingentLimit) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeStandardQuotationHeadline) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextHeadline, growthYearlyPlanInfo.maxLimit) }}></div>
							<div className="subscription-contingent-border" />
						</div>

						<div className="subscription-price">
							<div className="price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{growthYearlyPlanInfo.amount}
							</div>
							<div className="offer-price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{growthYearlyPlanInfo.offerAmount}
							</div>
							<div className="monthly">{growthYearlyPlanInfo.yearlyText}</div>
						</div>

						<button
							// onClick={() => this.handleUpgradeClick(ZohoPlan.STANDARD)}
							onClick={() => this.handleUpgradeClick(ZohoPlan.STANDARD_YEARLY)}
							data-qs-id="upgradeModal-btn-choice3"
							className="button button-rounded button-primary"
						>
							{resources.str_start}
						</button>
					</div>

					<div className="subscription-box last-box">
						<div className="subscription-name">{resources.str_unlimited}</div>

						<div className="subscription-icon">
							<SVGInline width="55px" height="55px" svg={business800Icon} />
						</div>

						<div className="subscription-contingent">
							<div dangerouslySetInnerHTML={{ __html: resources.upgradeStandardPlanSubHeading }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeStandardQuotationHeadline) }}></div>
							<div dangerouslySetInnerHTML={{ __html: format(resources.upgradeTextHeadline, unlimitedYearlyPlanInfo.contingentLimit) }}></div>
							<div className="subscription-contingent-border-small-box" />
						</div>

						<div className="subscription-price">
							<div className="price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{unlimitedYearlyPlanInfo.amount}
							</div>
							<div className="offer-price">
								<span className="euro"> {config.currencyFormat.symbol}</span>{unlimitedYearlyPlanInfo.offerAmount}
							</div>
							<div className="monthly">{unlimitedYearlyPlanInfo.yearlyText}</div>
						</div>

						<button
							// onClick={() => this.handleUpgradeClick(ZohoPlan.UNLIMITED)}
							onClick={() => this.handleUpgradeClick(ZohoPlan.UNLIMITED_YEARLY)}
							data-qs-id="upgradeModal-btn-choice4"
							className="button button-rounded button-primary"
						>
							{resources.str_start}
						</button>
					</div> */}

					<div className="modal-footer">
					<div className="col-xs-12 u_mb_10">
						<div className={`${hasOnboardingInfo ? 'price-onboarding' : ''}`}>{resources.str_pricesExclVat}</div>
					</div>
						<div className="col-xs-12 referral-code">
							<div className='referral-code-checkbox'>
								<CheckboxInputComponent
									name={'referralCode'}
									//disabled={(creditsAndBalance) <= 0}
									label={`Have a referral code?`}
									checked={ this.state.useReferralCode }
				
									onChange={() => { this.handleReferralCodeCheckBox('referral-code-text-id') }}
								/>
							</div>
							{ 
							this.state.useReferralCode && 
								<div className="col-xs-3 referral-code-text">
									<TextInputExtendedComponent
										name="referralCode"
										dataQsId={'referral-code-text-id'}
										value={this.state.referralCode}
										//label={resources.str_note}
										placeholder={'Referral Code'}
										onChange={(value) => {
											this.handleReferralCodeChange(value.trim())
										}}
										focused ={ true}
									/>
							</div>
							}
							


						</div>
						{/* {hasOnboardingInfo ? (
							<div className="onboarding-info" onClick={() => this.handleOnboardingInfoClick()}>
								<div className="onboarding-left-col" />
								<div className="onboarding-middle-col">
									<div className="onboarding-headline">{resources.str_getFreeMonthNow}</div>
									<div>
										{resources.upgradeModalEliminateNextText1}{' '}
										<strong>
											00:
											{addLeadingZero(remainingMinutesOnboarding, 2)} {resources.str_hoursSmall}{' '}
										</strong>{' '}
										{resources.upgradeModalEliminateNextText2}
									</div>
								</div>
								<div className="onboarding-right-col">
									<div className="icon icon-arr_right" />
								</div>
							</div>
						) : null} */}
					</div>
				</div>
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { isLoading, errorOccurred, onboardingData } = state.dashboard.onboarding;
	const { resources } = state.language.lang;
	return {
		isLoading,
		errorOccurred,
		onboardingData,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchOnboardingData: () => {
			dispatch(fetchOnboardingData());
		}
	};
};

export default connectWithStore(store, UpgradeModalComponent, mapStateToProps, mapDispatchToProps);
