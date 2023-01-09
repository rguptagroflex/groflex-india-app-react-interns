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
const { ACCOUNT, BANK_DETAILS, STAKEHOLDER, COMPLETED } = KycProgress;
import NavBarModal from "shared/modal-nav/modal-nav.component";
import EmailInputComponent from "shared/inputs/email-input/email-input.component";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import SelectStateInputComponent from "shared/select-state/select-state.component";
class RazorpayContactComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			businessType: null,
			businessTypes: [
				{
					label: "Sole Proprietorship",
					value: "proprietorship",
					disabled: false,
				},
				{
					label: `Partnership`,
					value: "partnership",
					disabled: false,
				},
				{
					label: `Not yet registered`,
					value: "not_yet_registered",
					disabled: false,
				},
				{
					label: `Private limited company`,
					value: "private_limited",
					disabled: false,
				},
				{
					label: `Limited liability partnership`,
					value: "llp",
					disabled: false,
				},
				{
					label: `Public limited`,
					value: "public_limited",
					disabled: false,
				},
				// {
				// 	label: "Individual",
				// 	value: "individual",
				// 	disabled: false,
				// },
				{
					label: `NGO`,
					value: "ngo",
					disabled: false, // Add it back later
				},
				// {
				// 	label: `Educational institute`,
				// 	value: "educational_institutes",
				// 	disabled: false,
				// },
				{
					label: `Trust`,
					value: "trust",
					disabled: false,
				},
				{
					label: `Society`,
					value: "society",
					disabled: false,
				},
			],
			errorMessages: this.props.errors,
		};
	}

	onStateChanged(indiaStateObj) {
		this.props.onAccountChange(indiaStateObj, "state");
	}

	onBusinessTypeChange(option) {
		this.props.onAccountChange(option.value, "businessType");
	}

	onInputChange(value, name) {
		this.props.onAccountChange(value, name);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.errors !== this.state.errorMessages) {
			this.setState({ errorMessages: nextProps.errors });
		}
	}

	checkProperties() {
		const { errorMessages } = this.state;
		for (var key in errorMessages) {
			if (errorMessages[key] !== null && errorMessages[key] != "")
				return true;
		}
		return false;
	}
	

	render() {
		const { account, accountDetails, kycProgress } = this.props;
		const { businessType, contactName, customerFacingName, legalBusinessName, legalInfo, profile, email, mobile } =
			accountDetails;
		const { errorMessages } = this.state;
		return (
			<div className="row u_pt_40 u_pb_40 razorpaykyc-modal-contact">
				<div className="col-xs-4 form_groupheader_edit text-h4">{`Contact and business details`}</div>
				<div className="col-xs-8">
					<div className="col-xs-12">
						<div className="row">
							<TextInputExtendedComponent
								customWrapperClass={"col-xs-6"}
								name={"contactName"}
								value={contactName || ""}
								onChange={(value, name) => this.onInputChange(value, name)}
								label={`Contact name`}
								autoComplete="off"
								spellCheck="false"
								disabled={this.props.kycProgress === COMPLETED}
								errorMessage={errorMessages["contactName"]}
							/>

							<TextInputExtendedComponent
								customWrapperClass={"col-xs-6"}
								name={"email"}
								value={email}
								label={`Contact e-mail`}
								autoComplete="off"
								spellCheck="false"
								onChange={(value, name) => this.onInputChange(value, name)}
								disabled={(kycProgress === STAKEHOLDER ||
									kycProgress === BANK_DETAILS ||
									kycProgress === ACCOUNT ||
									kycProgress === COMPLETED) ? true : false }
								errorMessage={errorMessages["email"]}
							/>

							<div className="col-xs-6">
								<NumberInputComponent
									ref="mobile-number-input"
									dataQsId="settings-account-mobile"
									label={"Business mobile"}
									name={"mobile"}
									maxLength="10"
									value={parseInt(mobile)}
									customWrapperClass={"col-xs-6"}
									isDecimal={false}
									defaultNonZero={true}
									onChange={(value, name) => this.onInputChange(value, name)}
									disabled={(kycProgress === STAKEHOLDER ||
										kycProgress === BANK_DETAILS ||
										kycProgress === ACCOUNT ||
										kycProgress === COMPLETED) ? true : false }
									errorMessage={errorMessages["mobile"]}
								/>
							</div>

							<div className="col-xs-6" style={{ marginTop: -7 }}>
								<label style={{ fontSize: 13, color: "#747474" }}>Business type</label>
								<SelectInputComponent
									ref="businessType"
									name="businessType"
									allowCreate={false}
									notAsync={true}
									options={{
										searchable: false,
										//placeholder: "Select business type",
										labelKey: "label",
										valueKey: "value",
										clearable: false,
										backspaceRemoves: false,
										handleChange: (option) => this.onBusinessTypeChange(option),
										openOnFocus: false,
									}}
									value={businessType}
									loadedOptions={this.state.businessTypes}
									disabled={
										kycProgress === STAKEHOLDER ||
										kycProgress === BANK_DETAILS ||
										kycProgress === ACCOUNT ||
										kycProgress === COMPLETED
											? true
											: false
									}
								/>
								{errorMessages["businessType"] !== "" ? (
									<span className="input_error" style={{ marginTop: 18 }}>
										{errorMessages["businessType"]}
									</span>
								) : (
									``
								)}
							</div>

							{/* <div className="col-xs-6">
								<SelectInputComponent
									ref="businessField"
									name="businessField"
									allowCreate={false}
									notAsync={true}
									options={{
										searchable: false,
										placeholder: "Select business category",
										labelKey: "label",
										valueKey: "value",
										clearable: false,
										backspaceRemoves: false,
										//handleChange: onChange,
										openOnFocus: false,
									}}
									//value={this.state.invoiceDate}
									loadedOptions={this.state.businessTypes}
									//onFocus={() => this.onInputFocus('invoiceDateDisplay')}
									//onBlur={this.onInputBlur}
									//onChange={this.onDateOptionChange}
									// placeholder={`Business type`}
									customWrapperClass={"col-xs-6"}
								/>
							</div>

							<div className="col-xs-6">
								<SelectInputComponent
									ref="businessTurnover"
									name="businessTurnover"
									allowCreate={false}
									notAsync={true}
									options={{
										searchable: false,
										placeholder: "Select business turnover",
										labelKey: "label",
										valueKey: "value",
										clearable: false,
										backspaceRemoves: false,
										//handleChange: onChange,
										openOnFocus: false,
									}}
									//value={this.state.invoiceDate}
									loadedOptions={this.state.businessTypes}
									//onFocus={() => this.onInputFocus('invoiceDateDisplay')}
									//onBlur={this.onInputBlur}
									//onChange={this.onDateOptionChange}
									// placeholder={`Business type`}
									customWrapperClass={"col-xs-6"}
								/>
							</div> */}
							<div className="input-additional col-xs-6">
								<TextInputExtendedComponent
									//customWrapperClass={"col-xs-6"}
									name={"legalBusinessName"}
									value={legalBusinessName || ""}
									onChange={(value, name) => this.onInputChange(value, name)}
									label={`Legal business name`}
									autoComplete="off"
									spellCheck="false"
									disabled={this.props.kycProgress === COMPLETED}
									errorMessage={errorMessages["legalBusinessName"]}
								/>
								{!errorMessages["legalBusinessName"] ? (
									<span className="text-small text-muted">Name as listed on business PAN card</span>
								) : null}
							</div>

							<div className="input-additional col-xs-6">
								<TextInputExtendedComponent
									//customWrapperClass={"col-xs-6"}
									name={"customerFacingName"}
									value={customerFacingName || ""}
									onChange={(value, name) => this.onInputChange(value, name)}
									label={`Customer facing name`}
									autoComplete="off"
									spellCheck="false"
									disabled={this.props.kycProgress === COMPLETED}
									errorMessage={errorMessages["customerFacingName"]}
								/>
								{!errorMessages["customerFacingName"] ? (
									<span className="text-small text-muted">Name your customers are familiar with</span>
								) : null}
							</div>

							<TextInputExtendedComponent
								customWrapperClass={"col-xs-12"}
								name={"street1"}
								value={profile.addresses.registeredAddress.street1 || ""}
								onChange={(value, name) => this.onInputChange(value, name)}
								label={`Address line 1`}
								autoComplete="off"
								spellCheck="false"
								required={true}
								errorMessage={errorMessages["street1"]}
								disabled={this.props.kycProgress === COMPLETED}
							/>

							<TextInputExtendedComponent
								customWrapperClass={"col-xs-12"}
								name={"street2"}
								value={profile.addresses.registeredAddress.street2 || ""}
								onChange={(value, name) => this.onInputChange(value, name)}
								label={`Address line 2`}
								autoComplete="off"
								spellCheck="false"
								required={true}
								errorMessage={errorMessages["street2"]}
								disabled={this.props.kycProgress === COMPLETED}
							/>
							<div className="col-xs-6" style={{ marginTop: -7 }}>
								<label style={{ fontSize: 13, color: "#747474" }}>State</label>

								<SelectStateInputComponent
									stateId={
										(profile.addresses.registeredAddress.state &&
											profile.addresses.registeredAddress.state.id) ||
										""
									}
									onStateChanged={this.onStateChanged.bind(this)}
									store={this.props.store}
									errorMessage={errorMessages["state"]}
									disabled={this.props.kycProgress === COMPLETED}
								/>
							</div>

							<TextInputExtendedComponent
								customWrapperClass={"col-xs-6"}
								name={"city"}
								value={profile.addresses.registeredAddress.city || ""}
								onChange={(value, name) => this.onInputChange(value, name)}
								label={`City`}
								autoComplete="off"
								spellCheck="false"
								required={true}
								errorMessage={errorMessages["city"]}
								disabled={this.props.kycProgress === COMPLETED}
							/>
							<div className="col-xs-6">
								<NumberInputComponent
									ref="pincode-number-input"
									//	dataQsId="settings-account-mobile"
									label={"Pincode"}
									name={"postalCode"}
									maxLength="10"
									value={parseInt(profile.addresses.registeredAddress.postalCode || 0)}
									customWrapperClass={"col-xs-6"}
									isDecimal={false}
									required={true}
									errorMessage={errorMessages["postalCode"]}
									onChange={(value, name) => this.onInputChange(value, name)}
									//	onBlur={value => this.onMobileNumberBlur(value)}
									defaultNonZero={true}
									disabled={this.props.kycProgress === COMPLETED}
								/>
							</div>

							<div className="input-additional col-xs-6">
								<TextInputExtendedComponent
									//customWrapperClass={"col-xs-6"}
									ref="account-edit-text-input-gstNumber"
									name={"gstNumber"}
									label={"GST number"}
									// required={true}
									autoComplete="off"
									spellCheck="false"
									value={legalInfo.gstNumber || ""}
									onChange={(value, name) => this.onInputChange(value, name)}
									disabled={this.props.kycProgress === COMPLETED}
									errorMessage={errorMessages["gstNumber"]}
								/>
								{!errorMessages["gstNumber"] ? (
									<span className="text-small text-muted">Optional field</span>
								) : null}
							</div>

							<TextInputExtendedComponent
								customWrapperClass={"col-xs-6"}
								ref="account-edit-text-input-cinNumber"
								dataQsId="account-edit-text-input-cinNumber"
								name={"cinNumber"}
								label={businessType === "llp" ? `LLPIN` : `CIN number`}
								required={
									businessType === "public_limited" ||
									businessType === "private_limited" ||
									businessType === "llp"
										? true
										: false
								}
								autoComplete="off"
								spellCheck="false"
								value={legalInfo.cinNumber || ""}
								onChange={(value, name) => this.onInputChange(value, name)}
								disabled={this.props.kycProgress === COMPLETED}
								errorMessage={
									errorMessages["cinNumber"] === ""
										? (businessType === "public_limited" ||
												businessType === "private_limited" ||
												businessType === "llp") &&
										  (legalInfo.cinNumber === null || legalInfo.cinNumber === "")
											? `CIN/LLPIN is required`
											: ""
										: errorMessages["cinNumber"]
								}
							/>
							<TextInputExtendedComponent
								customWrapperClass={"col-xs-6"}
								ref="account-edit-text-input-panNumber"
								dataQsId="account-edit-text-input-panNumber"
								name={"panNumber"}
								label={"Business PAN"}
								required={
									businessType !== "not_yet_registered" ||
									businessType !== "proprietorship" ||
									businessType !== null
										? false
										: true
								}
								autoComplete="off"
								spellCheck="false"
								value={legalInfo.panNumber || ""}
								onChange={(value, name) => this.onInputChange(value, name)}
								disabled={this.props.kycProgress === COMPLETED}
								errorMessage={
									errorMessages["panNumber"] === ""
										? (businessType === "public_limited" ||
												businessType === "private_limited" ||
												businessType === "llp" ||
												businessType === "partnership" ||
												businessType === "trust" ||
												businessType === "society" ||
												businessType === "individual" ||
												businessType === "ngo" ||
												businessType === "educational_institutes") &&
										  (legalInfo.panNumber === null || legalInfo.panNumber === "")
											? "Business PAN is required"
											: ""
										: errorMessages["panNumber"]
								}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default RazorpayContactComponent;
