import React from 'react';
import KycProgress from "enums/razorpay-kyc-progress.enum";

const { ACCOUNT, BANK_DETAILS, STAKEHOLDER, COMPLETED } = KycProgress;

class ProgressBarComponent extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			currentProgress: 0
		}
	}

	componentDidMount() {
		this.calculateProgress();
	}

	calculateProgress() {
		const { progress } = this.props;
		let progressValue = 0;

		switch (progress) {
			case ACCOUNT:
				progressValue = 25;
				break;
			case BANK_DETAILS:
				progressValue = 75;
				break;
			case STAKEHOLDER:
				progressValue = 50;
				break;
			case COMPLETED:
				progressValue = 100;
				break;
		}
			this.setState(
				{
					currentProgress: progressValue,
				}
			);
	}

	render () {
		const { currentProgress } = this.state;
		return (
			<div className="progress-container">
				<span className="progress-text">{`${currentProgress}% complete`}</span>
				<div className="progress-bar-outer">
					<span className="progress-bar" style={{ width: `${currentProgress}%` }}></span>
				</div>
			</div>
		);
	}
}

export default ProgressBarComponent;
