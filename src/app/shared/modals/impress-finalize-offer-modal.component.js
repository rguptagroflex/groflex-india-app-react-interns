import invoiz from 'services/invoiz.service';
import React from 'react';
import ModalService from 'services/modal.service';
import UpgradeModalComponent from 'shared/modals/upgrade-modal.component';

class ImpressFinalizeOfferModal extends React.Component {
	openContingentModal() {
		const { resources } = this.props;
		// ModalService.open(<UpgradeModalComponent title={resources.str_timeToStart} resources={resources} />, {
		// 	width: 1196,
		// 	padding: 0,
		// 	isCloseable: true
		// });
	}

	render() {
		const { resources } = this.props;
		const content = (
			<div>
				{resources.offerImpressConfirmText}
			</div>
		);

		const availableLimit = invoiz.user.subscriptionData.contingentLimitImpressOffers - invoiz.user.subscriptionData.usedContingentImpressOffers;

		return (
			<div className={`impress-finalize-offer-modal-component`}>
				{content}
				{invoiz.user.subscriptionData.contingentLimitImpressOffers !== null &&
					invoiz.user.subscriptionData.contingentLimitImpressOffers !== -1 ? (
						<div>
							<br />
							<span>{resources.str_availableContingent}:</span>
							<strong className="contingent-limit-count">
								{availableLimit}
							</strong>
							<br />
							<div
								className="contingent-upgrade-link"
								onClick={() => {
									ModalService.close();

									setTimeout(() => {
										this.openContingentModal();
									}, 500);
								}}
							>
								{resources.str_increaseTheQuota}
							</div>

						</div>
					) : null}
			</div>
		);
	}
}

export default ImpressFinalizeOfferModal;
