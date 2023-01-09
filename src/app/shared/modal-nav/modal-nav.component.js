import invoiz from "services/invoiz.service";
import React from "react";

import KycProgress from "enums/razorpay-kyc-progress.enum";
const { ACCOUNT, BANK_DETAILS, STAKEHOLDER, COMPLETED } = KycProgress;

class NavBarModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			headerNames: props.steps || [],
			activeStep: props.currentStep || 0,
			progressValue: 0
		};
	}

	buildSteps() {
		const { headerNames, activeStep } = this.state;

		const navItems = headerNames.map((step, index) => {
			const activeClassStep = activeStep === index ? "active-step" : null;
			return (
				<div
					className={`nav-step ${activeClassStep}`}
					key={step.name}
					onClick={() => this.stepClick(step.name) }
				>
					<div className="nav-label">{step.label}</div>
				</div>
			);
		});

		return navItems;
	}

	componentWillReceiveProps(nextProps) {
		this.setState({ activeStep: nextProps.currentStep })
		this.calculateProgress();
	}

	componentDidMount() {
		this.calculateProgress();
	}

	calculateProgress() {
		const { kycProgress } = this.props;
		let progressValue = 0;
		switch (kycProgress) {
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
			default:
				progressValue = 0;
		}
			this.setState(
				{
					 progressValue,
				}
			);
	}

	stepClick(stepName) {
		const { progressValue } = this.state;
		let currentStep;
		switch (stepName) {
			case "start":
				currentStep = 0;
				break;
			case ACCOUNT:
				currentStep = 1;
				break;
			case STAKEHOLDER:
				(progressValue >= 50 || progressValue === 25) ? currentStep = 2 : currentStep;
				break;
			case BANK_DETAILS:
				(progressValue >= 75 || progressValue === 50) ? currentStep = 3 : currentStep;
				break;
			case COMPLETED:
				(progressValue >= 75 || progressValue === 50) ? currentStep = 4 : currentStep;
				break;

			default:
				break;
		}
		(currentStep !== undefined) ? this.setState({ activeStep: currentStep }) : null;
        (currentStep !== undefined) ? this.props.onStepClick(stepName) : null;
	}

	render() {
		return (
			<div className="main-nav">
				<div className="nav-steps">{this.buildSteps()}</div>
			</div>
		);
	}
}

export default NavBarModal;
