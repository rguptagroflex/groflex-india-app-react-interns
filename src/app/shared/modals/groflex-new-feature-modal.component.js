import React from 'react';
import config from 'config';
import accountingLivePopup from 'assets/images/accountingLivePopup.png';
import Invoiz from '../../services/invoiz.service';

class GroflexNewFeatureLiveModalComponent extends React.Component {
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
		//await this.upgradeToFreePlan();
		window.location.reload();
	}

	render() {
		const { title, okButtonLabel } = this.props;

		return (
			<div>
				{/* <div className='groflexPopupHeading'>Accounting is Live !</div> */}
				
					<img className='groflexPopupImage' src={accountingLivePopup}/>
				
				{/* <div className='groflexPopupText1'>
					<span>
						Imprezz is shuttting down on <b>April 30th 2023.</b><br/>
						Don’t worry you can easily switch to your “grofleX” account using “imprezz” login credentials.<br/>
					</span>
					<span className='groflexPopupText2'>
					<b>Note:</b> All your “imprezz” data will be automatically migrated to “grofleX”
					</span>
				</div> */}
			</div>
		);
	}
}

export default GroflexNewFeatureLiveModalComponent;
