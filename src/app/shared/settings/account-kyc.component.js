import React from "react";
import invoiz from "services/invoiz.service";
import _ from "lodash";
import config from "config";
import ProgressBarComponent from "shared/progress-bar/progress-bar.component";
import ButtonComponent from "shared/button/button.component";
import { errorCodes } from "helpers/constants";
import RazorpayKycModal from "shared/modals/razorpay-kyc-modal.component";
import ModalService from "services/modal.service";
import KycProgress from "enums/razorpay-kyc-progress.enum";
import RazorpayKycSetupModal from "shared/modals/razorpay-kyc-setup-modal.component";
import KycStatus from "enums/razorpay-kyc-status.enum";
import Active from "assets/images/svg/kyc_active.svg";
import GreenCheckStep from "assets/images/svg/kyc_check_green.svg";
import YellowCheckStep from "assets/images/svg/kyc_check_yellow.svg";
import Clarification from "assets/images/svg/kyc_clarification1.svg";
import Verification from "assets/images/svg/kyc_verification.svg";
import SVGInline from "react-svg-inline";
import store from "redux/store";

const { CREATED, CLARIFICATION, ACTIVE, REJECTED, REVIEW, SUSPENDED } = KycStatus;

const { ACCOUNT, BANK_DETAILS, STAKEHOLDER, COMPLETED } = KycProgress;

const { INVALID } = errorCodes;
class AccountKycProgressComponent extends React.Component {
	constructor(props) {
		super(props);
		this._isMounted = false;
		this.state = {
			kycStep: props.account.razorpayKycProgress,
			kycStatus: props.account.razorpayKycStatus,
		};
	}

	componentDidMount() {
		this._isMounted = true;
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	getIconAndStatus(kycStatus) {
		let iconStatus = null;
		switch (kycStatus) {
			case ACTIVE:
				iconStatus = (
					<span className="status-text">
						<SVGInline width="17px" svg={Active} />
						<span className="text-green" style={{ marginLeft: 10 }}>
							Account activated
						</span>
					</span>
				);
				break;
			case CLARIFICATION:
				iconStatus = (
					<span className="status-text">
						<SVGInline width="17px" svg={Clarification} />
						<span className="text-orange" style={{ marginLeft: 10 }}>
							Needs clarification
						</span>
					</span>
				);
				break;
			case CREATED:
			case REVIEW:
				iconStatus = (
					<span className="status-text">
						<SVGInline width="17px" svg={Verification} />
						<span style={{ marginLeft: 10, color: '#FFAA2C' }}>
							Under review
						</span>
					</span>
				);
				break;
			default:
				break;
		}

		return iconStatus;
	}

	render() {
		const { resources, account } = this.props;
		const { kycStep, kycStatus } = this.state;
		return (
			<div className="settings-kycform-component">
				<div className="row u_pt_20"> {/*u_pt_60 u_pb_40 */}
					<div className="col-xs-12 text-h4 u_pb_20">{`KYC Form`}</div>
					{kycStep === COMPLETED ? (
						<div className="col-xs-12">
							{/* <div className="col-xs-12"> */}
								<div className="kyc-complete-text">
									<span>{kycStatus === CLARIFICATION ? `We need some clarifications regarding your KYC, please clarify them at the earliest` : 
									kycStatus === REVIEW ? `The KYC review process can take up to 4 - 5 days to get approved` : `Your account is now activated`}</span>
								</div>
								{/* <div className="row">

								</div> */}
								<div className="row">
									<div className="col-xs-12 u_mr_40">
										<ProgressBarComponent progress={kycStep} />
									</div>
								</div>
							{/* </div> */}
							<div className={`col-xs-12 clarification`}>
								{this.getIconAndStatus(kycStatus)}
								<ButtonComponent
									type="primary"
									callback={() => {
										if (kycStatus === CLARIFICATION) {
										ModalService.open(
											<RazorpayKycSetupModal
												account={invoiz.user && invoiz.user}
												store={store}
												isClarification={true}
											/>,
											{
												isCloseable: true,
												modalClass: "razorpaykyc-setup-modal-component",
												width: 700,
											}
										);
										} else {
											ModalService.open(
												<RazorpayKycModal
													account={invoiz.user && invoiz.user}
													resources={resources}
												/>,
												{
													isCloseable: true,
													width: 920,
													//padding: "5px 40px 40px",
													modalClass: "razorpaykyc-modal-component",
												}
											);
										}
									}}
									//disabled={`${kycStep === COMPLETED}`}
									label={kycStatus === CLARIFICATION ? `Add clarification` : `View form`}
									dataQsId="settings-account-btn-viewKycForm"
									disabled={kycStep === COMPLETED && kycStatus === ACTIVE ? true : false }
								/>
							</div>
						</div>
					) : (
						<div className="col-xs-12">
							<div className="col-xs-12">
								<div className="kyc-complete-text">
									<span>{resources.accountSettingsCompleteKyc}</span>
								</div>
								<div className="row">
									<div className="col-xs-12 u_mr_40">
										<ProgressBarComponent progress={kycStep} />
									</div>
								</div>
							</div>
							<div className="col-xs-6 col-xs-offset-6">
								<ButtonComponent
									type="primary"
									callback={() => {
										ModalService.open(
											<RazorpayKycModal
												account={invoiz.user && invoiz.user}
												resources={resources}
											/>,
											{
												isCloseable: true,
												width: 920,
												//padding: "5px 40px 40px",
												modalClass: "razorpaykyc-modal-component",
											}
										);
									}}
									//disabled={`${kycStep === COMPLETED}`}
									label={`View form`}
									dataQsId="settings-account-btn-viewKycForm"
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}
}

export default AccountKycProgressComponent;
