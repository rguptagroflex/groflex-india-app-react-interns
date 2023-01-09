import React from 'react';
import config from 'config';
import partyIcon from 'assets/images/svg/party-white-blue.svg';
import SVGInline from 'react-svg-inline';
import ButtonComponent from 'shared/button/button.component';
import Invoiz from '../../services/invoiz.service';

class UpgradeSmallModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.onConfirm = props.onConfirm;
		this.onConfirmButtonClick = this.onConfirmButtonClick.bind(this);
	}

	async upgradeToFreePlan() {
		await Invoiz.request(`${config.resourceUrls.user}/upgradeToFreePlan`, {method: 'POST', auth: true});
	}

	async onConfirmButtonClick() {
		// this.onConfirm();
		await this.upgradeToFreePlan();
		window.location.reload();
	}

	render() {
		const { title, claim, subClaim, okButtonLabel } = this.props;

		return (
			<div className="upgrade-small-modal-component">
				<div className="upper-half">
					<div className="upper-half-icon">
						<SVGInline width="80px" height="80px" svg={partyIcon} />
					</div>

					<h2 className="title">{title}</h2>
				</div>

				<p className="claim">
					With your success, there is no stopping you, but you have exceeded the turnover quota of your current plan. 
					Upgrade to the new Free Plan to continue enjoying all the benefits of Imprezz!
				</p>

				{subClaim ? <p className="subclaim" dangerouslySetInnerHTML={{ __html: subClaim }} /> : null}

				{okButtonLabel ? (
					<ButtonComponent
						dataQsId="upgradeSmallModal-btn-confirm"
						label={okButtonLabel}
						callback={() => this.onConfirmButtonClick()}
						buttonIcon={`icon-arrow_right`}
					/>
				) : null}
			</div>
		);
	}
}

export default UpgradeSmallModalComponent;
