import invoiz from "services/invoiz.service";
import React from "react";
import KycProgress from "enums/razorpay-kyc-progress.enum";
import KycStatus from "enums/razorpay-kyc-status.enum";
import { connect } from "react-redux";
import { connectWithStore } from "helpers/connectWithStore";
import store from "redux/store";
import CircleProgressBar from "shared/circle-progress-bar/circle-progress.component";
import SVGInline from "react-svg-inline";
import ArrowRight from "assets/images/svg/kyc_right.svg";
import ActiveCheck from "assets/images/svg/kyc_active.svg";
import GreenCheckStep from "assets/images/svg/kyc_check_green.svg";
import YellowCheckStep from "assets/images/svg/kyc_check_yellow.svg";
import Clarification from "assets/images/svg/kyc_clarification1.svg";
import Verification from "assets/images/svg/kyc_verification.svg";
import EmptyCheckStep from "assets/images/svg/kyc_empty_check.svg";
import LoaderComponent from 'shared/loader/loader.component';

const { ACCOUNT, BANK_DETAILS, STAKEHOLDER, COMPLETED } = KycProgress;
const { CREATED, ACTIVE, CLARIFICATION, REJECTED, REVIEW, SUSPENDED } = KycStatus;

class RazorpayOverviewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			errorMessage: "",
			kycProgress: this.props.kycProgress,
			kycStatus: this.props.kycStatus,
			circleProgress: 0
		};
	}


	handleStepChange(stepName) {
		this.props.setStep(stepName);
	}

	componentWillReceiveProps(nextProps) {
	//	if (nextProps.kycProgress !== this.state.kycProgress) {
		this.setState({ kycProgress: nextProps.kycProgress, kycStatus: nextProps.kycStatus }, () => {
			this.calculateProgress()
		})
	//}
	}

	componentDidMount() {
		this.calculateProgress()
	}

	calculateProgress() {
		const { kycProgress } = this.state;
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
					circleProgress: progressValue,
				}
			);
	}

	render() {
		const { kycProgress, kycStatus, circleProgress } = this.state;
		if (kycProgress === 0) {
			return <LoaderComponent visible={true} text={`Loading KYC progress`} />
		}
		return (
			<div className="row u_pt_40 u_pb_40 razorpaykyc-modal-overview">
				<div className="col-xs-3 form_groupheader_edit text-h4">{`Account overview`}</div>
				<div className="col-xs-9">
					<div className="col-xs-12">
						<div className="row">
							<div className="col-xs-8" style={{ display: "flex", flexDirection: "column" }}>
								<span className="text-medium text-muted">
									Complete your KYC documentation and start accepting payments
								</span>
								<span className="text-bold u_pt_10" style={{ fontSize: 14 }}>{invoiz.user && invoiz.user.mobile}</span>
								<span className="text-muted u_pt_10" style={{ fontSize: 14 }}>{invoiz.user && invoiz.user.userEmail}</span>
							</div>
							
								<CircleProgressBar
									trailStrokeColor="#e5e5e5"
									strokeColor="#0079B3"
									percentage={circleProgress}
									innerText="complete"
								/>
						</div>
						<div className="row">
							<div className="step-boxes">
								<div className="step-box" onClick={() => this.handleStepChange(ACCOUNT)}>
									<div className="left_element">
										<SVGInline svg={circleProgress >= 25 ? GreenCheckStep : EmptyCheckStep} />
										<span>Contact and business details</span>
									</div>
									<SVGInline className="arrow_right" svg={ArrowRight} />
								</div>
								<div className="step-box" onClick={circleProgress >= 50 || circleProgress === 25 ? () => this.handleStepChange(STAKEHOLDER) : null}>
									<div className="left_element">
										<SVGInline svg={circleProgress >= 50 ? GreenCheckStep : EmptyCheckStep} />
										<span>Stakeholder details</span>
									</div>

									<SVGInline className="arrow_right" svg={ArrowRight} />
								</div>
								<div className="step-box" onClick={circleProgress >= 75 || circleProgress === 50 ? () => this.handleStepChange(BANK_DETAILS) : null}>
									<div className="left_element">
										<SVGInline svg={circleProgress >= 75 ? GreenCheckStep : EmptyCheckStep} />
										<span>Bank details</span>
									</div>

									<SVGInline className="arrow_right" svg={ArrowRight} />
								</div>
								<div className="step-box" onClick={circleProgress >= 75 || circleProgress === 50 ? () => this.handleStepChange(COMPLETED) : null}>
									<div className="left_element">
										<SVGInline svg={circleProgress === 100 ? GreenCheckStep : EmptyCheckStep} />
										<span>Upload documents</span>
									</div>
									<SVGInline className="arrow_right" svg={ArrowRight} />
								</div>
							</div>
						</div>
						{/* {kycProgress === COMPLETED ? (
							<div className="row">
								<span className="text-medium text-muted">{`KYC Status: ${kycStatus}`}</span>
							</div>
						) : null} */}
					</div>
				</div>
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return {
		resources,
	};
};

export default connectWithStore(store, RazorpayOverviewComponent, mapStateToProps);
