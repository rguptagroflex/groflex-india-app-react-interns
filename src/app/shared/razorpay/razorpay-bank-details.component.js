import React from "react";
import NumberInputComponent from "shared/inputs/number-input/number-input.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import KycProgress from "enums/razorpay-kyc-progress.enum";
const { ACCOUNT, BANK_DETAILS, STAKEHOLDER, COMPLETED } = KycProgress;
class RazorpayBankDetailsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			errorMessages: this.props.errors,
		};
	}

	onInputChange(value, name) {
		if (name) {
			this.props.onBankChange(value, name);
		}
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.errors !== this.props.errorMessages) {
		this.setState({ errorMessages: nextProps.errors });
		}
	}

	render() {
		const { bankDetails } = this.props;
		const { errorMessages } = this.state;
		return (
			<div className="row u_pt_40 u_pb_20 razorpaykyc-modal-bank">
				<div className="col-xs-4 form_groupheader_edit text-h4">{`Bank details`}</div>
				<div className="col-xs-8">
					<div className="col-xs-12">
						<div className="row">
							
								<TextInputExtendedComponent
									customWrapperClass={"col-xs-12"}
									name={"beneficiary"}
									value={bankDetails.beneficiary || ""}
									onChange={(value, name) => this.onInputChange(value, name)}
									label={`Beneficiary name`}
									autoComplete="off"
									spellCheck="false"
									errorMessage={errorMessages['beneficiary']}
									disabled={this.props.kycProgress === COMPLETED}
								/>
							<TextInputExtendedComponent
								customWrapperClass={"col-xs-6"}
								name={"ifscCode"}
								value={bankDetails.ifscCode || ""}
								onChange={(value, name) => this.onInputChange(value, name)}
								label={`IFSC code`}
								autoComplete="off"
								spellCheck="false"
								errorMessage={errorMessages['ifscCode']}
								disabled={this.props.kycProgress === COMPLETED}
							/>
							{/* <NumberInputComponent
								ref="account-number-input"
								label={"Account number"}
								name={"bankAccountNumber"}
								maxLength="16"
								value={parseInt(bankDetails.bankAccountNumber || 0)}
								className={"col-xs-6"}
								isDecimal={false}
								onChange={(value, name) => this.onInputChange(value, name)}
								defaultNonZero={true}
								errorMessage={errorMessages['bankAccountNumber']}
								disabled={this.props.kycProgress === COMPLETED}
							/> */}
							<TextInputExtendedComponent
								customWrapperClass={"col-xs-6"}
								label={"Account number"}
								name={"bankAccountNumber"}
								value={bankDetails.bankAccountNumber || ""}
								onChange={(value, name) => this.onInputChange(value, name)}
								autoComplete="off"
								spellCheck="false"
								errorMessage={errorMessages['bankAccountNumber']}
								disabled={this.props.kycProgress === COMPLETED}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default RazorpayBankDetailsComponent;
