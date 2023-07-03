import invoiz from "services/invoiz.service";
import React from "react";
import ChargebeePlan from "enums/chargebee-plan.enum";
import RazorpayPlan from "enums/razorpay-plan.enum";
import SubscriptionStatus from "enums/subscription-status.enum";
import SubscriptionVendor from "enums/subscription-vendor.enum";
import moment from "moment";
import { redirectToChargebee } from "helpers/redirectToChargebee";
// import { redirectToZohoApi } from 'helpers/redirectToZohoApi';
import { redirectToRazorpay } from "helpers/redirectToRazorpayCheckout";
import { formatDate } from "helpers/formatDate";
import { formatCurrencySymbolDisplayInFront } from "helpers/formatCurrency";
import ModalService from "services/modal.service";
import UpgradeModalComponent from "shared/modals/upgrade-modal.component";
import ImpressContingentModal from "shared/modals/impress-contingent-modal.component";
import ButtonComponent from "shared/button/button.component";
import { format } from "util";
import ZohoPlan from "enums/zoho-plan.enum";
import ChargebeeAddon from "../../enums/chargebee-addon.enum";
import RadioInputComponent from "shared/inputs/radio-input/radio-input.component";
import LoaderComponent from 'shared/loader/loader.component';

class AccountSubscriptionComponent extends React.Component {
	constructor(props) {
		super(props);

		this._isMounted = false;

		this.onManageSubscriptionClick = this.onManageSubscriptionClick.bind(this);

		this.state = {
			updatedSubscriptionDetail: null,
			planType: "yearly",
			planPrice: "₹3999/ Year",
			isLoading: false
		};

		// invoiz.on('userModelSubscriptionDataSet', () => {
		// 	this.setState({ updatedSubscriptionDetail: invoiz.user.subscriptionData });
		// });
	}
	componentDidMount() {
		this._isMounted = true;
		invoiz.on("userModelSubscriptionDataSet", () => {
			if (this._isMounted) {
				this.setState({ updatedSubscriptionDetail: { ...this.props.subscriptionDetail, ...invoiz.user.subscriptionData} });
			}
		});
	}

	getAccountContent() {
		const { resources } = this.props;
		let { subscriptionDetail } = this.props;

		if (this.state.updatedSubscriptionDetail) {
			subscriptionDetail = this.state.updatedSubscriptionDetail;
		}

		let title;
		let content;
		let buttonTitle;

		const subscriptionNextPaymentDate = subscriptionDetail.nextBillingAt
			? formatDate(subscriptionDetail.nextBillingAt)
			: null;

		let subscriptionQuotaFormatted = 0;
		let subscriptionQuotaLimitFormatted = 0;
		let subscriptionQuotaPercentage = 0;

		if (
			(subscriptionDetail.planId !== ChargebeePlan.UNLIMITED &&
			subscriptionDetail.planId !== ChargebeePlan.UNLIMITED_999 &&
			subscriptionDetail.planId !== ChargebeePlan.UNLIMITED_YEARLY &&
			subscriptionDetail.planId !== RazorpayPlan.UNLIMITED_YEARLY ) ||
			subscriptionDetail.planId !== RazorpayPlan.UNLIMITED_MONTHLY
		) {
			subscriptionQuotaFormatted = formatCurrencySymbolDisplayInFront(subscriptionDetail.usedContingent);
			subscriptionQuotaLimitFormatted = formatCurrencySymbolDisplayInFront(subscriptionDetail.contingentLimit);
			subscriptionQuotaPercentage =
				(subscriptionDetail.usedContingent / subscriptionDetail.contingentLimit) * 100;
		}

		if (
			subscriptionDetail.status === SubscriptionStatus.CANCELLED ||
			subscriptionDetail.status === SubscriptionStatus.NON_RENEWING
		) {
			const activeTill = subscriptionDetail.activeTill && formatDate(subscriptionDetail.activeTill);

			if (moment() <= new Date(subscriptionDetail.activeTill)) {
				content = format(resources.accountActiveTillDate, activeTill);
			} else {
				content = resources.accountNoActive;
			}

			title = resources.str_accountTerminated;
			buttonTitle = resources.str_activeNow;
		} else {
			switch (subscriptionDetail.planId) {
				case ChargebeePlan.TRIAL_21:
				case ChargebeePlan.TRIAL:
					if (subscriptionDetail.trialDays === 0) {
						content = resources.invoizTrialExpired;
					} else {
						content = resources.unlockInvoiceMessage;
					}

					title = resources.invoiceTrialVersion;
					buttonTitle = resources.str_upgradeNow;
					break;
				case ChargebeePlan.STARTER:
				case ChargebeePlan.STANDARD:
				case ChargebeePlan.UNLIMITED:
				case ChargebeePlan.FREE_MONTH:
				case ChargebeePlan.STARTER_249:
				case ChargebeePlan.STANDARD_749:
				case ChargebeePlan.UNLIMITED_999:
				case ChargebeePlan.FREE_YEARLY:
				case ChargebeePlan.STARTER_YEARLY:
				case ChargebeePlan.STANDARD_YEARLY:
				case ChargebeePlan.UNLIMITED_YEARLY:
				case ChargebeePlan.STARTER_MONTHLY:
				case ChargebeePlan.STANDARD_MONTHLY:
				case ChargebeePlan.UNLIMITED_MONTHLY:
				case ChargebeePlan.STARTER_YEARLY_21:
				case ChargebeePlan.STANDARD_YEARLY_21:
				case ChargebeePlan.UNLIMITED_YEARLY_21:
				case ChargebeePlan.FREE_PLAN_2021:
				case ChargebeePlan.UNLIMITED_INTERNAL:
				case ChargebeePlan.FREE_PLAN:
					const isUnlimitedPlan =
						subscriptionDetail.planId === ChargebeePlan.UNLIMITED ||
						subscriptionDetail.planId === ChargebeePlan.UNLIMITED_999 ||
						subscriptionDetail.planId === ChargebeePlan.UNLIMITED_YEARLY ||
						subscriptionDetail.planId === ChargebeePlan.UNLIMITED_MONTHLY ||
						subscriptionDetail.planId === ChargebeePlan.UNLIMITED_INTERNAL ||
						subscriptionDetail.planId === ChargebeePlan.UNLIMITED_YEARLY_21 ||
						subscriptionDetail.planId === ChargebeePlan.FREE_PLAN_2021 || 
						subscriptionDetail.planId === ChargebeePlan.FREE_PLAN;
					title = (
						<div>
							{isUnlimitedPlan
								? resources.subscriptionUnlimitedInvoiceFare
								: resources.subscriptionInvoiceFare}{" "}
							{isUnlimitedPlan ? null : (
								<span className="text-normal text-medium">
									({subscriptionQuotaLimitFormatted} {resources.subscriptionTurnoverPerYear})
								</span>
							)}
						</div>
					);

					if (subscriptionQuotaPercentage <= 0) {
						subscriptionQuotaPercentage = 0;
					} else if (subscriptionQuotaPercentage >= 100) {
						subscriptionQuotaPercentage = 100;
					}

					content = (
						<div>
							{isUnlimitedPlan ? null : (
								<div>
									<span className="text-semibold text-medium">{resources.consumedVolume}: </span>
									<span className="text-medium">
										{subscriptionQuotaFormatted} {resources.str_fromSmall}{" "}
										{subscriptionQuotaLimitFormatted}
									</span>
									<div className="subscription-quota-bar">
										<div
											className="subscription-quota-used"
											style={{ width: `${subscriptionQuotaPercentage}%` }}
										/>
									</div>
								</div>
							)}
							{subscriptionDetail.vendor === SubscriptionVendor.CHARGEBEE ? (
								<div className="text-semibold text-medium">
									{format(resources.subscriptionNextPlanInfo, subscriptionNextPaymentDate)}
								</div>
							) : null}
						</div>
					);


					//buttonTitle = resources.str_manageTariff;
					buttonTitle = `Upgrade plan`;
					break;
			}
		}

		return { title, content, buttonTitle };
	}

	getImpressContent() {
		let { subscriptionDetail } = this.props;
		const { resources } = this.props;
		if (this.state.updatedSubscriptionDetail) {
			subscriptionDetail = this.state.updatedSubscriptionDetail;
		}

		let impressTitle;
		let impressContent;
		let hasImpressButton = false;
		let isUnlimited = false;
		let isTrial = false;

		switch (subscriptionDetail.planId) {
			case ChargebeePlan.TRIAL_21:
			case ChargebeePlan.TRIAL: {
				isTrial = true;
				break;
			}

			case ChargebeePlan.UNLIMITED:
			case ChargebeePlan.UNLIMITED_999:
			case ChargebeePlan.UNLIMITED_YEARLY:
			case ChargebeePlan.UNLIMITED_MONTHLY:
			case ChargebeePlan.UNLIMITED_INTERNAL:
			case ChargebeePlan.UNLIMITED_YEARLY_21: {
				isUnlimited = true;
				break;
			}

			case ChargebeePlan.STARTER:
			case ChargebeePlan.STANDARD:
			case ChargebeePlan.FREE_MONTH:
			case ChargebeePlan.STARTER_249:
			case ChargebeePlan.STANDARD_749:
			case ChargebeePlan.FREE_YEARLY:
			case ChargebeePlan.STARTER_YEARLY:
			case ChargebeePlan.STANDARD_YEARLY:
			case ChargebeePlan.STARTER_MONTHLY:
			case ChargebeePlan.STANDARD_MONTHLY:
			case ChargebeePlan.STANDARD_YEARLY_21:{
				isUnlimited = false;
				break;
			}
		}

		if (isUnlimited) {
			hasImpressButton = false;
			impressTitle = resources.invoiceImpressUnlimited;
			impressContent = (
				<div>
					<span className="text-semibold text-medium">{resources.monthlyUnlimitedImpressOffer}</span>
				</div>
			);
		} else if (!ChargebeePlan.STARTER_YEARLY_21) {
			const contingentMax = subscriptionDetail.contingentLimitImpressOffers;
			const contingentUsed = subscriptionDetail.usedContingentImpressOffers;
			const contingentPercentage = (contingentUsed / contingentMax) * 100;

			hasImpressButton = true;
			impressTitle = resources.str_impressQuotationTitle;
			impressContent = (
				<div>
					<span className="text-semibold text-medium">{resources.usedContingent}: </span>
					<span className="text-medium">
						{contingentUsed} {resources.str_fromSmall} {contingentMax}
					</span>
					<div className="subscription-quota-bar">
						<div className="subscription-quota-used" style={{ width: `${contingentPercentage}%` }} />
					</div>
				</div>
			);
		}

		if (isTrial) {
			hasImpressButton = false;
			impressTitle = resources.imprezzQuotationsTrialVersion;
			impressContent = resources.unlockImprezzQuotationsMessage;
		}

		return { impressTitle, impressContent, hasImpressButton };
	}

	onUpgradeImpressContingentClick() {
		let { subscriptionDetail } = this.props;
		const { resources } = this.props;
		if (this.state.updatedSubscriptionDetail) {
			subscriptionDetail = this.state.updatedSubscriptionDetail;
		}

		ModalService.open(
			<ImpressContingentModal
				isDepleted={subscriptionDetail.contingentLimitImpressOffers === 0}
				onAddonUpgraded={() => {
					this.setState({ updatedSubscriptionDetail: invoiz.user.subscriptionData });
				}}
				resources={resources}
			/>,
			{
				width: 1010,
				padding: 0,
				isCloseable: true,
			}
		);
	}

	onManageSubscriptionClick(portal) {
		const { resources } = this.props;
		let { subscriptionDetail } = this.props;
		let { planType } = this.state;
		let plan = ChargebeePlan.ACCOUNTING_YEARLY_PLAN;
		if (this.state.updatedSubscriptionDetail) {
			subscriptionDetail = this.state.updatedSubscriptionDetail;
		}

		if (portal) {
			if (planType === "yearly") {
				plan = ChargebeePlan.ACCOUNTING_YEARLY_PLAN;
			} else if (planType === "monthly") {
				plan = ChargebeePlan.ACCOUNTING_MONTHLY_PLAN;
			} else {
				plan = ChargebeePlan.ACCOUNTING_TRIAL_PLAN;
			}
			this.setState({ isLoading: true });
			redirectToChargebee(plan, false);
		} 
		// else if (
		// 	subscriptionDetail.planId === ChargebeePlan.TRIAL ||
		// 	subscriptionDetail.planId === ChargebeePlan.TRIAL_21 ||
		// 	subscriptionDetail.planId === ZohoPlan.TRIAL
		// ) {
		// 	ModalService.open(<UpgradeModalComponent title={resources.str_timeToStart} resources={resources} subscriptionDetail={subscriptionDetail}/>, {
		// 		width: 1196,
		// 		padding: 0,
		// 		isCloseable: true,
		// 	});
		// } else {
		// 	ModalService.open(<UpgradeModalComponent title={resources.str_timeToStart} resources={resources} subscriptionDetail={subscriptionDetail}/>, {
		// 		width: 1196,
		// 		padding: 0,
		// 		isCloseable: true,
		// 	});
		// }
	}

	// onManageRazorpaySubClick() {
	// 	redirectToRazorpay(`trial`, false)
	// }

	componentWillUnmount() {
		this._isMounted = false;
	}

	getPlanName() {
		let { subscriptionDetail } = this.props;
		if (subscriptionDetail.planId === ChargebeePlan.FREE_PLAN) {
			return `Free Plan`;
		} else if (subscriptionDetail.planId === ChargebeePlan.ACCOUNTING_MONTHLY_PLAN) { 
			return `Accounting Monthly Plan`;
		} else if (subscriptionDetail.planId === ChargebeePlan.ACCOUNTING_YEARLY_PLAN) { 
			return `Accounting Yearly Plan`;
		} else if (subscriptionDetail.planId === ChargebeePlan.ACCOUNTING_TRIAL_PLAN) { 
			return `Accounting Trial Plan`;
		} else {
			return ``;
		}
	}

	checkAddonExists(subscriptionDetail, addon) {
		let addonExists = false;
		if(subscriptionDetail.chargebeeSubscription.customer) {
			if (subscriptionDetail.chargebeeSubscription.customer.addons) {
				addonExists = Object.keys(subscriptionDetail.chargebeeSubscription.customer.addons).includes(addon);
			}
		}
		return addonExists;
	}

	onPlanTypeFieldChange(value) {
		// const { resources } = this.props;
		// // let { planType } = this.state;
		// planType
		// customer[key] = value;
		if(value === "yearly") {
			this.setState({ planType:value, planPrice: "₹3999/ Year" });
		} else if(value === "monthly") {
			this.setState({ planType:value, planPrice: "₹399/ Month"  });
		} else {
			this.setState({ planType:value, planPrice: "Accounting Trial Plan 14 days"  });
		}
		
	}

	getPlanDetails() {
		const { resources } = this.props;
		let { subscriptionDetail } = this.props;

		if (this.state.updatedSubscriptionDetail) {
			subscriptionDetail = this.state.updatedSubscriptionDetail;
		}

		let title;
		let content;
		let buttonTitle;

		const subscriptionNextPaymentDate = subscriptionDetail.nextBillingAt
			? formatDate(subscriptionDetail.nextBillingAt)
			: null;

		const subscriptionCurrentTermStartDate = subscriptionDetail.currentTermStart
		? formatDate(subscriptionDetail.currentTermStart)
		: null;

		const subscriptionCurrentTermEndDate = subscriptionDetail.currentTermEnd
		? formatDate(subscriptionDetail.currentTermEnd)
		: null;
		

		let subscriptionDatePercentage = 0;
		let subscriptionDateColor = '#00A353';
		if (
			subscriptionDetail.status === SubscriptionStatus.CANCELLED ||
			subscriptionDetail.status === SubscriptionStatus.NON_RENEWING
		) {
			const currentTermEnd = subscriptionDetail.currentTermEnd && formatDate(subscriptionDetail.currentTermEnd);

			if (moment() <= new Date(subscriptionDetail.currentTermEnd)) {
				content = format(resources.accountActiveTillDate, currentTermEnd);
			} else {
				content = resources.accountNoActive;
			}

			title = resources.str_accountTerminated;
			buttonTitle = resources.str_activeNow;
		} else {
			let b = moment(subscriptionDetail.currentTermStart);
			let a = moment(subscriptionDetail.currentTermEnd);
			let c = moment();
			let totalDays = a.diff(b, 'days');
			let remainingDays = c.diff(b, 'days');
			subscriptionDatePercentage = (remainingDays / totalDays) * 100;
			if (subscriptionDatePercentage > 100) {
				subscriptionDatePercentage = 100
				subscriptionDateColor = '#F03636'
			} else if (subscriptionDatePercentage > 85 && subscriptionDatePercentage < 99) {
				subscriptionDateColor = '#dd7474'
			}
			switch (subscriptionDetail.planId) {
				case ChargebeePlan.ACCOUNTING_MONTHLY_PLAN:
				case ChargebeePlan.ACCOUNTING_YEARLY_PLAN:
				case ChargebeePlan.ACCOUNTING_TRIAL_PLAN:
				case ChargebeePlan.FREE_PLAN:

				content = (
						<div>
							{(
								<div>
									<span className="text-medium text-start-date" >{'Start Date'} : {subscriptionCurrentTermStartDate}</span>
									<span className="text-medium text-end-date">
										{'End Date'} : {subscriptionCurrentTermEndDate}
									</span>
									<div className="subscription-quota-bar">
										<div
											className="subscription-quota-used"
											style={{ width: `${subscriptionDatePercentage}%`, background:`${subscriptionDateColor}`  }}
										/>
									</div>
								</div>
							)}
							{subscriptionDetail.vendor === SubscriptionVendor.CHARGEBEE && subscriptionDetail.planId !=  ChargebeePlan.ACCOUNTING_TRIAL_PLAN ? (
								<div className="text-semibold text-next-payment">
									{format(resources.subscriptionNextPlanInfo, subscriptionNextPaymentDate)}
								</div>
							) : null}
							{subscriptionDetail.vendor === SubscriptionVendor.CHARGEBEE && subscriptionDetail.planId ===  ChargebeePlan.ACCOUNTING_TRIAL_PLAN ? (
								<div className="text-semibold text-next-payment">
									{format(resources.subscriptionTrialExpirePlanInfo, subscriptionNextPaymentDate)}
								</div>
							) : null}
						</div>
					);
					title = this.getPlanName();
					//buttonTitle = resources.str_manageTariff;
					buttonTitle = `Upgrade plan`;
					break;
			}
		}

		return { title, subscriptionCurrentTermStartDate, subscriptionCurrentTermEndDate, subscriptionNextPaymentDate, content, buttonTitle };
	}

	render() {
		const { resources } = this.props;
		let { subscriptionDetail, canEditSubscription } = this.props;
		let { planType, planPrice, isLoading } = this.state;
		// const { title, content, buttonTitle } = this.getAccountContent();
		const { title, content } = this.getPlanDetails();
		// const { impressTitle, impressContent } = this.getImpressContent(); //, hasImpressButton
		let buttonElement2;
		let buttonElement1;
		if (this.state.updatedSubscriptionDetail) {
			subscriptionDetail = this.state.updatedSubscriptionDetail;
		}

		// let unlimitedPlan =
		// 	subscriptionDetail.status === "active" &&
		// 	(subscriptionDetail.planId === ChargebeePlan.UNLIMITED ||
		// 		subscriptionDetail.planId === ChargebeePlan.UNLIMITED_999 ||
		// 		subscriptionDetail.planId === ChargebeePlan.UNLIMITED_YEARLY ||
		// 		subscriptionDetail.planId === RazorpayPlan.UNLIMITED_YEARLY);

		// if (!title) {
		// 	return null;
		// }

		// if (subscriptionDetail.vendor === SubscriptionVendor.CHARGEBEE) {
		// 	buttonElement1 = (
		// 		<ButtonComponent
		// 			buttonIcon={"icon-visible"}
		// 			type="secondary"
		// 			isWide={false}
		// 			callback={() => this.onManageSubscriptionClick(true)}
		// 			label={`Manage subscription`}
		// 			dataQsId="settings-account-btn-subscription"
		// 			disabled={!canEditSubscription}
		// 		/>
		// 	);

		// 	buttonElement2 = (
		// 		<ButtonComponent
		// 			buttonIcon={"icon-check"}
		// 			type="primary"
		// 			isWide={false}
		// 			callback={() => this.onManageSubscriptionClick(false)}
		// 			label={buttonTitle}
		// 			dataQsId="settings-account-btn-subscription"
		// 			disabled={!canEditSubscription}
		// 		/>
		// 	);
		// } 
		// else if (
		// 	subscriptionDetail.vendor === SubscriptionVendor.ZOHO &&
		// 	!(
		// 		subscriptionDetail.status === "active" &&
		// 		(subscriptionDetail.planId === ZohoPlan.UNLIMITED ||
		// 			subscriptionDetail.planId === ZohoPlan.UNLIMITED_999 ||
		// 			subscriptionDetail.planId === ZohoPlan.UNLIMITED_YEARLY)
		// 	)
		// ) {
		// 	buttonElement = (
		// 		<ButtonComponent
		// 			buttonIcon={"icon-check"}
		// 			type="primary"
		// 			isWide={false}
		// 			callback={() => this.onManageSubscriptionClick()}
		// 			label={buttonTitle}
		// 			dataQsId="settings-account-btn-subscription"
		// 			disabled={!canEditSubscription}
		// 		/>
		// 	);
		// } else if (subscriptionDetail.vendor === SubscriptionVendor.RZRPAY) {
		// 	buttonElement2 = (
		// 		<ButtonComponent
		// 			buttonIcon={"icon-check"}
		// 			type="primary"
		// 			isWide={false}
		// 			callback={() => this.onManageSubscriptionClick()}
		// 			label={buttonTitle}
		// 			dataQsId="settings-account-btn-subscription"
		// 			disabled={!canEditSubscription}
		// 		/>
		// 	);
		// }

		// let purchasedQuotationAddon = this.checkAddonExists(subscriptionDetail, ChargebeeAddon.CHARGEBEE_ADDON_QUOTATION);
		// let purchasedImprezzQuotationAddon = this.checkAddonExists(subscriptionDetail, ChargebeeAddon.CHARGEBEE_ADDON_IMPREZZ_QUOTATION);
		// let purchasedInventoryAddon = this.checkAddonExists(subscriptionDetail, ChargebeeAddon.CHARGEBEE_ADDON_INVENTORY);
		
		return (
			// <div className="settings-subscription-component">
			// 	{
			// 		subscriptionDetail.planId || true ? // only initial plan for groflex
			// 		<div className="row">
			// 			<div className="col-xs-12 text-h4 u_pb_20">{resources.str_yourTariff}</div>
			// 			<div className="col-xs-12">
			// 				<div className="text-h5 u_mb_8">{'Free Plan'}</div>
			// 				{/* <div className="text-h5 u_mb_8">{''}</div> */}
			// 				{/* <div className="text-h6 u_mb_8">{title}</div>
			// 				<div>{content}</div> */}
			// 				{/* {subscriptionDetail.status === SubscriptionStatus.CANCELLED ? null : (
			// 					<div>
			// 						<div className="text-h6 u_mb_8 account-impress-headline">{impressTitle}</div>
			// 						<div>{impressContent}</div>
			// 					</div>
			// 				)} */}
			// 				{/* <div className="row" style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}>
			// 					<div className="">{buttonElement1}</div>
			// 					<div className="" style={{ marginLeft: 15 }}>
			// 						{buttonElement2}
			// 					</div>
			// 				</div> */}
			// 			</div>
			// 		</div>
			// 		: subscriptionDetail.planId === ChargebeePlan.FREE_PLAN_2021
			// 		? <div className="row u_pt_20"> {/*u_pt_60 u_pb_40 */}
			// 			<div className="col-xs-12 text-h4 u_pb_20">Add-On</div>
			// 			<div className="col-xs-12">
			// 				<div className="text-h5 u_mb_8">Buy Add-On for your Groflex business</div>
			// 				<div className="row">
			// 					<div className="col-xs-12">
			// 						<span style={{lineHeight: '35px'}} className="text-normal text-large">Unlimited Quotations at ₹999/year</span>
			// 						{/* {subscriptionDetail.status === SubscriptionStatus.CANCELLED ? null : (
			// 							<div>
			// 								<div className="text-h6 u_mb_8 account-impress-headline">{impressTitle}</div>
			// 								<div>{impressContent}</div>
			// 							</div>
			// 						)} */}
			// 						{
			// 							purchasedQuotationAddon 
			// 								? <div>
			// 									<p style={{display: 'inline', backgroundColor: "#D9F9D4", width: 'min-content', padding: '5px 10px', borderRadius: '4px'}}>Active</p>
			// 									<p style={{display: 'inline-block', marginLeft: '10px'}}>valid till {formatDate(subscriptionDetail.nextBillingAt)}</p>
			// 								</div>
			// 								// : <div className="row" style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}>
			// 								// 	<div className="" style={{ marginLeft: 15 }}>
			// 								// 		<ButtonComponent
			// 								// 			type="primary"
			// 								// 			isWide={false}
			// 								// 			callback={() => redirectToChargebee(ChargebeePlan.FREE_PLAN_2021)}
			// 								// 			label="Buy Now"
			// 								// 			dataQsId="settings-account-btn-subscription"
			// 								// 			disabled={!canEditSubscription}
			// 								// 		/>
			// 								// 	</div>
			// 								// </div>
			// 								: <div style={{display: 'inline-block', float: 'right'}}>
			// 									<ButtonComponent
			// 										type="primary"
			// 										isWide={false}
			// 										callback={() => redirectToChargebee(ChargebeePlan.FREE_PLAN_2021)}
			// 										label="Buy Now"
			// 										dataQsId="settings-account-btn-subscription"
			// 										disabled={!canEditSubscription}
			// 									/>
			// 								</div>
			// 						}
			// 					</div>
			// 					<div className="col-xs-12" style={{marginTop: '10px'}}>
			// 						<div style={{marginBottom: '10px'}}>
			// 							<hr></hr>
			// 						</div>
			// 						<span style={{lineHeight: '35px'}} className="text-normal text-large">Unlimited Imprezz Quotations at ₹1499/year</span>
			// 						{/* {subscriptionDetail.status === SubscriptionStatus.CANCELLED ? null : (
			// 							<div>
			// 								<div className="text-h6 u_mb_8 account-impress-headline">{impressTitle}</div>
			// 								<div>{impressContent}</div>
			// 							</div>
			// 						)} */}
			// 						{
			// 							purchasedImprezzQuotationAddon
			// 							? <div>
			// 								<p style={{display: 'inline', backgroundColor: "#D9F9D4", width: 'min-content', padding: '5px 10px', borderRadius: '4px'}}>Active</p>
			// 								<p style={{display: 'inline-block', marginLeft: '10px'}}>valid till {formatDate(subscriptionDetail.nextBillingAt)}</p>
			// 							</div>
			// 							: <div style={{display: 'inline-block', float: 'right'}}>
			// 								<ButtonComponent
			// 									type="primary"
			// 									isWide={false}
			// 									callback={() => redirectToChargebee(ChargebeePlan.FREE_PLAN_2021, false, ChargebeeAddon.CHARGEBEE_ADDON_IMPREZZ_QUOTATION)}
			// 									label="Buy Now"
			// 									dataQsId="settings-account-btn-subscription"
			// 									disabled={!canEditSubscription}
			// 								/>
			// 							</div>
			// 						}
			// 					</div>
			// 					<div className="col-xs-12" style={{marginTop: '10px'}}>
			// 						<div style={{marginBottom: '10px'}}>
			// 							<hr></hr>
			// 						</div>
			// 						<span style={{lineHeight: '35px'}} className="text-normal text-large">Inventory at ₹1999/year</span>
			// 						{/* {subscriptionDetail.status === SubscriptionStatus.CANCELLED ? null : (
			// 							<div>
			// 								<div className="text-h6 u_mb_8 account-impress-headline">{impressTitle}</div>
			// 								<div>{impressContent}</div>
			// 							</div>
			// 						)} */}
			// 						{
			// 							purchasedInventoryAddon
			// 							? <div>
			// 								<p style={{display: 'inline', backgroundColor: "#D9F9D4", width: 'min-content', padding: '5px 10px', borderRadius: '4px'}}>Active</p>
			// 								<p style={{display: 'inline-block', marginLeft: '10px'}}>valid till {formatDate(subscriptionDetail.nextBillingAt)}</p>
			// 							</div>
			// 							: <div style={{display: 'inline-block', float: 'right'}}>
			// 								<ButtonComponent
			// 									type="primary"
			// 									isWide={false}
			// 									callback={() => redirectToChargebee(ChargebeePlan.FREE_PLAN_2021, false, ChargebeeAddon.CHARGEBEE_ADDON_INVENTORY)}
			// 									label="Buy Now"
			// 									dataQsId="settings-account-btn-subscription"
			// 									disabled={!canEditSubscription}
			// 								/>
			// 							</div>
			// 						}
			// 					</div>
			// 				</div>
			// 			</div>
			// 		</div>
			// 		: <div className="row u_pt_20"> {/*u_pt_60 u_pb_40 */}
			// 			<div className="col-xs-12 text-h4 u_pb_20">{resources.str_yourTariff}</div>
			// 			<div className="col-xs-12">
			// 				<div className="text-h5 u_mb_8">{this.getPlanName()}</div>
			// 				<div className="text-h6 u_mb_8">{title}</div>
			// 				<div>{content}</div>
			// 				{subscriptionDetail.status === SubscriptionStatus.CANCELLED ? null : (
			// 					<div>
			// 						<div className="text-h6 u_mb_8 account-impress-headline">{impressTitle}</div>
			// 						<div>{impressContent}</div>
			// 					</div>
			// 				)}
			// 				{/* <div className="row" style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}>
			// 					<div className="">{buttonElement1}</div>
			// 					<div className="" style={{ marginLeft: 15 }}>
			// 						{buttonElement2}
			// 					</div>
			// 				</div> */}
			// 			</div>
			// 		</div>
			// 	}
			// </div>
			
			subscriptionDetail.planId && subscriptionDetail.planId === ChargebeePlan.FREE_PLAN ? 
				<div>
					{isLoading ? (
						<LoaderComponent text={"Loading..."} visible={isLoading} />
					) : (null)}
					<div className="box" style={{padding: "26px 32px"}}>
						<div className="row">
							<div className="col-xs-12 text-h4 u_pb_20">{resources.str_yourTariff}</div>
							<div className="col-xs-12">
								<div className="text-h5 u_mb_8">{'Free Plan'}</div>
							</div>
						</div>
					</div>
					{/* Uncomment when accounting live */}
					<div className="box" style={{padding: "26px 32px"}}>
						<div className="row">
							<div className="col-xs-12 text-h4 u_pb_10">{"Accounting Module"}</div>
							<div className="col-xs-12 text-h6 u_pb_20">{"Your one-stop solution for all your accounting needs ! Here’s what you will get in the accounting module. "}</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon icon-check_circle">&nbsp;Cash and Bank</div>
							</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon icon-check_circle">&nbsp;Transactions</div>
							</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon icon-check_circle">&nbsp;Chart of Accounts</div>
							</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon icon-check_circle">&nbsp;Bank Reconciliation</div>
							</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon icon-check_circle">&nbsp;Cash Flow</div>
							</div>
							<div className="col-xs-12 u_pt_20 u_pb_20">							
								<div className="text-h5 u_mb_8">{'Choose Plan'}</div>
							</div>
							<div className="col-xs-12">
								<div className="row">
									<RadioInputComponent
										wrapperClass={`plan-type-toggle col-xs-6`}
										options={[
											{ label: "Yearly (Save 20%)", value: "yearly" },
											{ label: "Monthly", value: "monthly" },
											{ label: "Trial", value: "accountingTrial" },
										]}
										value={planType || "yearly"}
										onChange={(val) => this.onPlanTypeFieldChange(val)}
										dataQsId="plan-type"
									/>
								</div>
							</div>
							<div className="col-xs-12 u_pt_10">							
								<div className="text-h5 plan-price-text">{planPrice}</div>
							</div>
							<div className="col-xs-12" style={{"textAlign": "right"}}>							
								<ButtonComponent
									buttonIcon={"icon-check"}
									type="primary"
									isWide={false}
									callback={() => this.onManageSubscriptionClick(true)}
									label={"Buy Now"}
									dataQsId="settings-account-btn-subscription"
									disabled={!canEditSubscription}
								/>
							</div>
						</div>
					</div>
				</div>
			: 
			(subscriptionDetail.planId && subscriptionDetail.planId === ChargebeePlan.ACCOUNTING_TRIAL_PLAN ) ? 
				<div className="settings-subscription-component">
					{isLoading ? (
						<LoaderComponent text={"Loading..."} visible={isLoading} />
					) : (null)}
					<div className="box" style={{padding: "26px 32px"}}>
						<div className="row">
							<div className="col-xs-12 text-h4 u_pb_20">{resources.str_yourTariff}</div>
							<div className="col-xs-12">
								<div className="text-h5 u_mb_8">{title}</div>
							</div>
							<div className="col-xs-12 text-h6 u_pb_20">{"You can now access these premium features "}</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon active icon-check_circle">&nbsp;Cash and Bank</div>
							</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon active icon-check_circle">&nbsp;Transactions</div>
							</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon active icon-check_circle">&nbsp;Chart of Accounts</div>
							</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon active icon-check_circle">&nbsp;Bank Reconciliation</div>
							</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon active icon-check_circle">&nbsp;Cash Flow</div>
							</div>
							<div className="col-xs-12 u_pt_20">{content}</div>
							<div className="col-xs-12 u_pt_20 u_pb_20">							
								<div className="text-h5 u_mb_8">{'Choose Plan'}</div>
							</div>
							<div className="col-xs-12">
								<div className="row">
									<RadioInputComponent
										wrapperClass={`plan-type-toggle col-xs-6`}
										options={[
											{ label: "Yearly (Save 20%)", value: "yearly" },
											{ label: "Monthly", value: "monthly" },
										]}
										value={planType || "yearly"}
										onChange={(val) => this.onPlanTypeFieldChange(val)}
										dataQsId="plan-type"
									/>
								</div>
							</div>
							<div className="col-xs-12 u_pt_10">							
								<div className="text-h5 plan-price-text">{planPrice}</div>
							</div>
							<div className="col-xs-12" style={{"textAlign": "right"}}>							
								<ButtonComponent
									buttonIcon={"icon-check"}
									type="primary"
									isWide={false}
									callback={() => this.onManageSubscriptionClick(true)}
									label={"Buy Now"}
									dataQsId="settings-account-btn-subscription"
									disabled={!canEditSubscription}
								/>
							</div>
							{/* <div className="col-xs-12 text-next-payment u_pt_20">{"Your next payment will be on 27.03.2024"}</div> */}
						</div>
					</div>
				</div>
			:
			(subscriptionDetail.planId && ( subscriptionDetail.planId === ChargebeePlan.ACCOUNTING_MONTHLY_PLAN || subscriptionDetail.planId === ChargebeePlan.ACCOUNTING_YEARLY_PLAN )) ? 
				<div className="settings-subscription-component">
					<div className="box" style={{padding: "26px 32px"}}>
						<div className="row">
							<div className="col-xs-12 text-h4 u_pb_20">{resources.str_yourTariff}</div>
							<div className="col-xs-12">
								<div className="text-h5 u_mb_8">{title}</div>
							</div>
							<div className="col-xs-12 text-h6 u_pb_20">{"You can now access these premium features "}</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon active icon-check_circle">&nbsp;Cash and Bank</div>
							</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon active icon-check_circle">&nbsp;Transactions</div>
							</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon active icon-check_circle">&nbsp;Chart of Accounts</div>
							</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon active icon-check_circle">&nbsp;Bank Reconciliation</div>
							</div>
							<div className="text-h6 u_pl_10">	
								<div className="icon active icon-check_circle">&nbsp;Cash Flow</div>
							</div>
							<div className="col-xs-12 u_pt_20">{content}</div>
							{/* <div className="col-xs-12 text-next-payment u_pt_20">{"Your next payment will be on 27.03.2024"}</div> */}
						</div>
					</div>
				</div>
			: 
			null
		);
	}
}

export default AccountSubscriptionComponent;
