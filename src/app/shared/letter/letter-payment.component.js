import invoiz from "services/invoiz.service";
import React from "react";
import NumberInputComponent from "shared/inputs/number-input/number-input.component";
import CurrencyInputComponent from "shared/inputs/currency-input/currency-input.component";
import ButtonComponent from "shared/button/button.component";
import config from "config";
import moment from "moment";
import ModalService from "services/modal.service";
import accounting from "accounting";
import Decimal from "decimal.js";
import { formatApiDate, formatClientDate } from "../../helpers/formatDate";
import CheckboxInputComponent from "shared/inputs/checkbox-input/checkbox-input.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import KycProgress from "enums/razorpay-kyc-progress.enum";
import KycStatus from "enums/razorpay-kyc-status.enum";
import RazorpayKycSetupModal from "shared/modals/razorpay-kyc-setup-modal.component";
import store from "redux/store";

const { ACCOUNT, BANK_DETAILS, STAKEHOLDER, COMPLETED } = KycProgress;
const { CREATED, ACTIVE, CLARIFICATION, REJECTED, REVIEW, SUSPENDED } = KycStatus;

class LetterPaymentComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			partialEnabled: false,
			enablePayment: false,
			kycProgress: invoiz.user && invoiz.user.razorpayKycProgress,
			kycStatus: invoiz.user && invoiz.user.razorpayKycStatus,
			paymentData: props.transaction && props.transaction.razorpayPaymentData,
		};
	}

	componentDidMount() {
		const { paymentData } = this.state;
		const { enablePayment, paymentLink } = paymentData;
		if (enablePayment && paymentLink.partial) {
			this.setState({ enablePayment, partialEnabled: paymentLink.partial });
		} else if (paymentLink.partial) {
			this.setState({ partialEnabled: paymentLink.partial });
		} else if (enablePayment) {
			this.setState({ enablePayment });
		}
	}

	componentWillReceiveProps(newProps) {
		this.setState({ paymentData: newProps.transaction.razorpayPaymentData });
	}

	enablePayment() {
		const { kycProgress, kycStatus, enablePayment, paymentData, partialEnabled } = this.state;
		const { resources, onEnablePaymentChange } = this.props;
        
	if (kycProgress === COMPLETED && kycStatus === ACTIVE) {
		let newData;

		newData = Object.assign({}, paymentData, { enablePayment: !this.state.enablePayment });

		this.setState({
			enablePayment: !this.state.enablePayment,
			paymentLink: !this.state.enablePayment
				? { id: null, partial: false, url: null, status: null }
				: paymentData.paymentLink,
			paymentQr: !this.state.enablePayment
				? { id: null, isInvoice: true, url: null, status: null }
				: paymentData.paymentQr,
		});
		this.props.onEnablePaymentChange(newData);
		} else {
		    this.setState({ enablePayment: false }, () => {
		        ModalService.open(<RazorpayKycSetupModal isClarification={false} resources={resources} account={invoiz.user && invoiz.user} store={store}/>, {
		            isCloseable: true,
		            modalClass: "razorpaykyc-setup-modal-component",
		            width: 700,
		        });
		    })
		}
	}

	enablePartial() {
		const { kycProgress, kycStatus, enablePayment, paymentData, partialEnabled } = this.state;
		const { resources, onEnablePartialChange } = this.props;
		let newData;

		let partialData = {
			paymentLink: {
				partial: !this.state.partialEnabled,
			},
		};

		newData = Object.assign({}, paymentData, partialData);
		this.setState({ partialEnabled: !this.state.partialEnabled });

		this.props.onEnablePartialChange(newData);
	}

	render() {
		const { enablePayment, partialEnabled, paymentData } = this.state;
		const { paymentLink, paymentQr } = paymentData;
		const qrUrl = paymentQr.url ? `data:image/jpeg;base64,${paymentQr.url}` : "/assets/images/qr_code_placeholder_imprezz.png";
		const linkUrl = paymentLink.url ? paymentLink.url : "https://rzp.io/i/12345678";
		const imgWidth = paymentQr.url ? "120" : "120";
		return (
			<div className="letter-payment-component">
				<div className="payment-options">
					<CheckboxInputComponent
						name={"enablePayment"}
						label={`Receive online payments`}
						checked={enablePayment}
						onChange={() => this.enablePayment()}
					/>
					{/* {enablePayment ? (
						<CheckboxInputComponent
							name={"partialEnabled"}
							label={`Enable partial payments`}
							checked={partialEnabled}
							onChange={() => this.enablePartial()}
						/>
					) : null} */}
				</div>
				{enablePayment ? (
					<React.Fragment>
						<div className="payments">
							<div className="payment-qr">
								<span>Scan and pay</span>
								<img src={qrUrl} width={imgWidth} className="qr" />
							</div>
							<div className="payment-link">
								<span>Payment link</span>
								<a className="payment-link-url" href={linkUrl}>
									{linkUrl}
								</a>
							</div>
						</div>
					</React.Fragment>
				) : null}
			</div>
		);
	}
}

export default LetterPaymentComponent;
