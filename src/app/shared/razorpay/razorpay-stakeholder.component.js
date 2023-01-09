import React from "react";
import NumberInputComponent from "shared/inputs/number-input/number-input.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import config from "config";
import KycProgress from "enums/razorpay-kyc-progress.enum";
const { ACCOUNT, BANK_DETAILS, STAKEHOLDER, COMPLETED } = KycProgress;
class RazorpayStakeholderComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			errorMessages: this.props.errors,
		};

		this.isMobileNumberValid = false;
		this.isEmailValid = false;
	}

	onInputChange(value, name) {
		this.props.onStakeholderChange(value, name);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.errors !== this.props.errorMessages) {
			this.setState({ errorMessages: nextProps.errors });
		}
	}

	onMobileNumberBlur(value) {
		const { resources } = this.props;
		if (value.length !== 0 && (value.length < 10 || !config.mobileNumberValidation.test(value))) {
			this.setState({ errorMessageMobile: resources.validMobileNumberError });
		} else {
			this.setState({ errorMessageMobile: "" });
		}
	}

	onEmailBlur(value) {
		const { resources } = this.props;
		let { errorMessageEmail } = this.state;
		if (value.length !== 0 && !config.emailCheck.test(value)) {
			if (value.toString().length !== 0) {
				this.isEmailValid = true;
			}
			errorMessageEmail = resources.validEmailError;
		} else {
			errorMessageEmail = "";
			this.isEmailValid = false;
		}
		this.setState({ errorMessageEmail });
	}

	render() {
		const { stakeholderDetails } = this.props;
		const { name, stakeholderEmail, stakeholderMobile, kyc } = stakeholderDetails;
		const { errorMessageEmail, errorMessageMobile, errorMessages } = this.state;
		return (
			<div className="row u_pt_40 u_pb_40 kyc-modal-stakeholder">
				<div className="col-xs-4 form_groupheader_edit text-h4">{`Stakeholder details`}</div>
				<div className="col-xs-8">
					<div className="col-xs-12">
						<div className="row">
							<div className="col-xs-6">
								<TextInputExtendedComponent
									name={"name"}
									value={name || ""}
									onChange={(value, name) => this.onInputChange(value, name)}
									label={`Owner's name`}
									autoComplete="off"
									spellCheck="false"
									errorMessage={errorMessages["name"]}
									disabled={this.props.kycProgress === COMPLETED}
								/>
								{!errorMessages["name"] ? (
									<span className="text-small text-muted" style={{ marginTop: -15 }}>
										As per owner's personal PAN
									</span>
								) : null}
							</div>

							<TextInputExtendedComponent
								customWrapperClass={"col-xs-6"}
								name={"stakeholderEmail"}
								value={stakeholderEmail || ""}
								onChange={(value, name) => this.onInputChange(value, name)}
								label={`Owner's e-mail`}
								required={true}
								autoComplete="off"
								spellCheck="false"
								onBlur={(target, value) => this.onEmailBlur(value)}
								errorMessage={errorMessages["stakeholderEmail"]}
								disabled={this.props.kycProgress === COMPLETED}
							/>
						</div>
						<div className="row u_mt_10">
							<TextInputExtendedComponent
								customWrapperClass={"col-xs-6"}
								name={"panNumber"}
								label={"Owner's PAN"}
								autoComplete="off"
								spellCheck="false"
								value={kyc.panNumber || ""}
								onChange={(value, name) => this.onInputChange(value, name)}
								disabled={this.props.kycProgress === COMPLETED}
								errorMessage={errorMessages["panNumber"]}
							/>

							<div className="col-xs-6">
								<NumberInputComponent
									label={"Owner's phone"}
									name={"stakeholderMobile"}
									required={true}
									maxLength="10"
									value={parseInt(stakeholderMobile)}
									customWrapperClass={"col-xs-6"}
									isDecimal={false}
									defaultNonZero={true}
									disabled={this.props.kycProgress === COMPLETED}
									onBlur={(value) => this.onMobileNumberBlur(value)}
									onChange={(value, name) => this.onInputChange(value, name)}
									errorMessage={errorMessages["stakeholderMobile"]}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default RazorpayStakeholderComponent;
