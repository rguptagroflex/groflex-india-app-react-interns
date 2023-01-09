import invoiz from "services/invoiz.service";
import moment from "moment";
import React from "react";
import ChargebeePlan from "enums/chargebee-plan.enum";
import RazorpayPlan from "enums/razorpay-plan.enum";
import SubscriptionStatus from "enums/subscription-status.enum";
import SubscriptionVendor from "enums/subscription-vendor.enum";
import { formatDate } from "helpers/formatDate";
import { isAndroidClient } from "helpers/updateSubsciptionDetails";
import UpgradeSmallModalComponent from "shared/modals/upgrade-small-modal.component";
import ModalService from "services/modal.service";
import UpgradeModalComponent from "shared/modals/upgrade-modal.component";
import { connect } from "react-redux";
import { format } from "util";
import WebStorageService from "services/webstorage.service";
import WebStorageKey from "enums/web-storage-key.enum";
import userPermissions from 'enums/user-permissions.enum';

// import ZohoPlan from 'enums/zoho-plan.enum';

class FooterComponent extends React.Component {
	constructor(props) {
		super(props);
		let showUpgradeFooter = true;
		if (WebStorageService.getItem(WebStorageKey.HIDE_FOOTER, true)) showUpgradeFooter = false;
		this.openUpgradeModal = this.openUpgradeModal.bind(this);
		this.state = {
			subscriptionData: props.subscriptionData,
			showUpgradeFooter,
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA)
		};

		invoiz.on("userModelSubscriptionDataSet", (subscriptionData) => {
			if (subscriptionData.vendor === SubscriptionVendor.STORE) {
				if (this.refs && this.refs.footer) {
					this.setState({ subscriptionData });
				}
			}
		});
		invoiz.on(WebStorageKey.HIDE_FOOTER, () => {
			this.setState({ showUpgradeFooter: false });
		});
	}

	render() {
		const content = this.getContent();
		if (!this.state.showUpgradeFooter) return null;

		if (!content) {
			return null;
		}

		return (
			<footer className="footer-component" ref="footer">
				{content}
			</footer>
		);
	}

	openUpgradeModal() {
		const { resources } = this.props;
		const { subscriptionData } = this.state;

		if (subscriptionData.vendor === SubscriptionVendor.STORE) {
			const isAndroidStore = isAndroidClient();
			ModalService.open(
				<UpgradeSmallModalComponent
					title={resources.str_yourTurnoverStarts}
					claim={`${resources.footerUpgradeSmallModalExceededRevenue} <br /> ${resources.footerUpgradeSmallModalAdjustInvoiz}`}
					subClaim={`${resources.footerUpgradeSmallModalSubClaim} ${
						isAndroidStore ? resources.str_play : resources.str_app
					} ${resources.footerUpgradeSmallModalSubClaimUpgradeText}`}
					resources={resources}
				/>,
				{
					width: 800,
					padding: 40,
					isCloseable: true,
				}
			);
		} else {
			switch (subscriptionData.planId) {
				case ChargebeePlan.TRIAL_21:
				case ChargebeePlan.TRIAL:
					// ModalService.open(
					// 	<UpgradeModalComponent title={resources.str_timeToStart} resources={resources} />,
					// 	{
					// 		width: 1196,
					// 		padding: 0,
					// 		isCloseable: true,
					// 	}
					// );
					break;
				case ChargebeePlan.FREE_MONTH:
				case ChargebeePlan.FREE_YEARLY:
				case ChargebeePlan.STARTER:
				case ChargebeePlan.STARTER_249:
				case ChargebeePlan.STANDARD:
				case ChargebeePlan.STANDARD_749:
				case ChargebeePlan.STARTER_YEARLY:
				case ChargebeePlan.STANDARD_YEARLY:
				case ChargebeePlan.STARTER_YEARLY:
				case ChargebeePlan.STANDARD_YEARLY:
				case ChargebeePlan.UNLIMITED_YEARLY:
				case ChargebeePlan.UNLIMITED_MONTHLY:
				case ChargebeePlan.STANDARD_MONTHLY:
				case ChargebeePlan.STARTER_MONTHLY:
				case ChargebeePlan.UNLIMTED_YEARLY_21:
				case ChargebeePlan.STANDARD_YEARLY_21:
				case ChargebeePlan.STARTER_YEARLY_21:
					ModalService.open(
						<UpgradeModalComponent title={resources.str_timeToStart} resources={resources} />,
						{
							width: 1196,
							padding: 0,
							isCloseable: true,
						}
					);
					break;
			}
		}
	}

	getContent() {
		const { subscriptionData } = this.state;
		const { resources } = this.props;
		if (!subscriptionData) {
			return null;
		}
		let content;
		if (subscriptionData.vendor === SubscriptionVendor.STORE) {
			let usedContigentPercentage = parseInt(
				(subscriptionData.usedContingent / subscriptionData.contingentLimit) * 100
			);

			if (usedContigentPercentage <= 0) {
				usedContigentPercentage = 0;
			} else if (usedContigentPercentage >= 100) {
				usedContigentPercentage = 100;
			}
			if (subscriptionData.usedContingent > subscriptionData.contingentLimit) {
				content = (
					<div>
						{/* {resources.footerTariffQuotaExhausted} */}
						{subscriptionData.vendor === SubscriptionVendor.AMAZON ? (
							""
						) : (
							<b
								className="footer-link"
								onClick={this.openUpgradeModal}
								data-qs-id="global-footer-link-upgrade"
							>
								{" "}
								{resources.str_upgradeNow} <i className="icon" />
							</b>
						)}
					</div>
				);
			} else if (usedContigentPercentage >= 95) {
				content = (
					<div>
						{format(resources.footerQuotaUsedText, usedContigentPercentage)}
						{subscriptionData.vendor === SubscriptionVendor.AMAZON ? (
							""
						) : (
							<b
								className="footer-link"
								onClick={this.openUpgradeModal}
								data-qs-id="global-footer-link-upgrade"
							>
								{" "}
								{resources.str_upgradeNow} <i className="icon" />
							</b>
						)}
					</div>
				);
			}
		} else if (subscriptionData.planId === ChargebeePlan.TRIAL || subscriptionData.planId === ChargebeePlan.TRIAL_21) {
			if (subscriptionData.trialDays === 0) {
				content = (
					<div>
						{resources.invoizTrialExpired}
						<b
							className="footer-link"
							onClick={this.openUpgradeModal}
							data-qs-id="global-footer-link-upgrade"
						>
							{" "}
							{resources.str_upgradeNow} <i className="icon" />
						</b>
					</div>
				);
			} else {
				content = (
					<div>
						{resources.footerStillGetInvoice}{" "}
						<b>
							{subscriptionData.trialDays} {resources.str_days}
						</b>{" "}
						{resources.footerTryItFree}.
						<b
							className="footer-link"
							onClick={this.openUpgradeModal}
							data-qs-id="global-footer-link-upgrade"
						>
							{" "}
							{subscriptionData.vendor === SubscriptionVendor.AMAZON || (subscriptionData.vendor === SubscriptionVendor.CHARGEBEE && !this.state.canChangeAccountData) ? (
								""
							) : (
								<span>
									{resources.footerUnlockNow} <i className="icon" />
								</span>
							)}
						</b>
					</div>
				);
			}
		} else if (
			subscriptionData.status === SubscriptionStatus.CANCELLED ||
			subscriptionData.status === SubscriptionStatus.NON_RENEWING
		) {
			const activeTill = formatDate(subscriptionData.activeTill);

			if (moment() <= new Date(subscriptionData.activeTill)) {
				content = (
					<div>
						{format(resources.accountActiveTillDate, activeTill)}
						{/* <b className="footer-link" onClick={() => redirectToChargebee(null, true)}> */}
						<b className="footer-link" onClick={this.openUpgradeModal}>
							<i className="icon" data-qs-id="global-footer-link-upgrade" />{" "}
							{resources.footerGetBackNowText}
						</b>
					</div>
				);
			} else {
				content = resources.accountNoActive;
			}
		} else if (
			subscriptionData.planId !== ChargebeePlan.UNLIMITED &&
			subscriptionData.planId !== ChargebeePlan.UNLIMITED_999 &&
			subscriptionData.planId !== ChargebeePlan.UNLIMITED_YEARLY &&
			subscriptionData.planId !== ChargebeePlan.UNLIMITED_MONTHLY &&
			subscriptionData.planId !== RazorpayPlan.UNLIMITED_MONTHLY &&
			subscriptionData.planId !== RazorpayPlan.UNLIMITED_YEARLY
		) {
			let usedContigentPercentage = parseInt(
				(subscriptionData.usedContingent / subscriptionData.contingentLimit) * 100
			);
			const renewalDate = formatDate(subscriptionData.renewalDate);
			if (usedContigentPercentage <= 0) {
				usedContigentPercentage = 0;
			} else if (usedContigentPercentage >= 100) {
				usedContigentPercentage = 100;
			}
			if (subscriptionData.usedContingent > subscriptionData.contingentLimit) {
				content = (
					<div>
						{resources.footerTariffQuotaExhausted}
						{subscriptionData.vendor === SubscriptionVendor.AMAZON ? (
							""
						) : (
							<b
								className="footer-link"
								// onClick={() => redirectToChargebee(null, true)}
								onClick={this.openUpgradeModal}
								data-qs-id="global-footer-link-upgrade"
							>
								{" "}
								{resources.str_upgradeNow} <i className="icon" />
							</b>
						)}
					</div>
				);
			} else if (usedContigentPercentage >= 95) {
				content = (
					<div>
						{format(resources.footerQuotaUsedText, usedContigentPercentage)}
						{subscriptionData.vendor === SubscriptionVendor.AMAZON ? (
							""
						) : (
							<b
								className="footer-link"
								// onClick={() => redirectToChargebee(null, true)}
								onClick={this.openUpgradeModal}
								data-qs-id="global-footer-link-upgrade"
							>
								{" "}
								{resources.str_upgradeNow} <i className="icon" />
							</b>
						)}
					</div>
				);
			}
		}

		return content;
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(FooterComponent);
