import invoiz from 'services/invoiz.service';
import React from 'react';
import business60Icon from 'assets/images/svg/business_1.svg';
import SVGInline from 'react-svg-inline';
import config from 'config';
import ModalService from 'services/modal.service';
import NotificationService from 'services/notification.service';
import { isNonChargebeeUser } from 'helpers/subscriptionHelpers';
import ImpressContingentTypes from 'enums/impress/contingent-types.enum';
import ChargebeeImpressPlans from 'enums/impress/chargebee-impress-plans.enum';
import { updateSubscriptionDetails } from 'helpers/updateSubsciptionDetails';

class ImpressContingentModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isRequestRunning: false
		};
	}

	render() {
		const { isDepleted, resources } = this.props;

		const offers = [
			{
				id: ImpressContingentTypes.SMALL,
				icon: business60Icon,
				amount: 2,
				amountDecimal: 99,
				countText: 1,
				descriptionText: (
					<div>
						{resources.str_plusOneMore}
						<br />
						{resources.str_impressOffer}
					</div>
				),
				contingentText: resources.str_unique
			},
			{
				id: ImpressContingentTypes.MEDIUM,
				icon: business60Icon,
				amount: 9,
				amountDecimal: 95,
				countText: 5,
				descriptionText: (
					<div>
						{resources.str_plusFiveMore}
						<br />
						{resources.str_impressDeals}
					</div>
				),
				contingentText: resources.str_unique
			},
			{
				id: ImpressContingentTypes.UNLIMITED,
				icon: business60Icon,
				amount: 14,
				amountDecimal: 99,
				countText: '&infin;',
				descriptionText: (
					<div>
						{resources.str_unlimitedSmall}
						<br />
						{resources.str_impressDeals}
					</div>
				),
				contingentText: resources.str_perMonth
			}
		];

		const offerElements = offers.map(offer => {
			return (
				<div className="contingent-box" key={`contingent-box-${offer.id}`}>
					<div className="contingent-count" dangerouslySetInnerHTML={{ __html: offer.countText }} />

					<div className="contingent-icon">
						<SVGInline width="55px" height="55px" svg={offer.icon} />
					</div>

					<div className="contingent-description">
						{offer.descriptionText}
						<div className="contingent-description-border" />
					</div>

					<div className="contingent-price">
						<div className="price">
							{offer.amount}
							<span className="decimal">,{offer.amountDecimal}</span>
							<span className="euro"> {config.currencyFormat.symbol}</span>
						</div>
						<div className="recurrence">{offer.contingentText}</div>
					</div>

					<button
						data-qs-id={`contingent-modal-btn-choice-${offer.id}`}
						onClick={() => this.onBuyClick(offer.id)}
						className="button button-rounded button-primary"
					>
						{resources.str_buyNow}
					</button>
				</div>
			);
		});

		const title = isDepleted
			? resources.invoiceImpressQuotaExpiredMessage
			: resources.convinceBreathTakingMessage;
		const claim = isDepleted ? (
			<span>
				{resources.convinceBreathTakingInfo}
				<br />
				{resources.selectPackageToIncreaseQuotaText}
			</span>
		) : (
			resources.selectPackageToIncreaseQuotaText
		);

		return (
			<div className={`impress-contingent-modal-component`}>
				<div className="background-box">
					<h1 className={`headline`}>{title}</h1>
					<p className="claim">{claim}</p>
				</div>

				<div className="content-box">
					{offerElements}

					<div className="modal-footer">
						<div>{resources.str_pricesExclVat}</div>
					</div>
				</div>
			</div>
		);
	}

	onBuyClick(addonId) {
		const { isRequestRunning } = this.state;
		const { onAddonUpgraded, resources } = this.props;

		if (!isRequestRunning) {
			this.setState({ isRequestRunning: true }, () => {
				if (isNonChargebeeUser()) {
					let impressPlanId = null;
					const returnUrl = window.location.pathname + '?reloadChargebee=true';

					switch (addonId) {
						case ImpressContingentTypes.SMALL:
							impressPlanId = ChargebeeImpressPlans.CHARGEBEE_PLAN_IMPRESS_1;
							break;
						case ImpressContingentTypes.MEDIUM:
							impressPlanId = ChargebeeImpressPlans.CHARGEBEE_PLAN_IMPRESS_5;
							break;
						case ImpressContingentTypes.UNLIMITED:
							impressPlanId = ChargebeeImpressPlans.CHARGEBEE_PLAN_IMPRESS_UNLIMITED;
							break;
					}

					invoiz
						.request(
							`${
								config.resourceHost
							}chargebee/impress/hosted/page/${impressPlanId}?returnUrl=${returnUrl}`,
							{
								auth: true
							}
						)
						.then(response => {
							window.location.href = response.body.data.accessUrl;
						})
						.catch(() => {
							invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
							ModalService.close();
						});
				} else {
					invoiz
						.request(`${config.resourceHost}chargebee/subscription/addons`, {
							auth: true,
							method: 'POST',
							data: {
								addonId
							}
						})
						.then(() => {
							invoiz
								.request(config.settings.endpoints.getSubscriptionDetails, {
									auth: true
								})
								.then(() => {
									let addonName = '';

									switch (addonId) {
										case ImpressContingentTypes.SMALL:
											addonName = 1;
											break;
										case ImpressContingentTypes.MEDIUM:
											addonName = 2;
											break;
										case ImpressContingentTypes.UNLIMITED:
											addonName = 3;
											break;
									}

									updateSubscriptionDetails(() => {
										ModalService.close();

										NotificationService.show({
											message: `${resources.str_package} ${addonName} ${resources.str_successfullyAdded}`,
											type: 'success'
										});

										onAddonUpgraded && onAddonUpgraded();
									});
								})
								.catch(() => {
									invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
									ModalService.close();
								});
						})
						.catch(() => {
							invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
							ModalService.close();
						});
				}
			});
		}
	}
}

export default ImpressContingentModal;
