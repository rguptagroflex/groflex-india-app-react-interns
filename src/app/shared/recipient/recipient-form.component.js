import React from "react";
import PropTypes from "prop-types";
import RadioInputComponent from "shared/inputs/radio-input/radio-input.component";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import SelectStateInputComponent from "shared/select-state/select-state.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import RecipientFormCompanyComponent from "shared/recipient/recipient-form-company.component";
import RecipientFormPersonComponent from "shared/recipient/recipient-form-person.component";
import { customerTypes, balanceLabels, balanceTypes } from "helpers/constants";
import { connect } from "react-redux";
import { getCountries } from "helpers/getCountries";
import TextareaAutosize from "react-textarea-autosize";
import CurrencyInputComponent from "shared/inputs/currency-input/currency-input.component";
import CheckboxInputComponent from "shared/inputs/checkbox-input/checkbox-input.component";
import { currencyOptions } from "helpers/constants";
import accounting from "accounting";
import invoiz from "services/invoiz.service";
import config from "config";
import NumberInputComponent from "shared/inputs/number-input/number-input.component";
import planPermissions from "enums/plan-permissions.enum";
import userPermissions from "enums/user-permissions.enum";
import SVGInline from "react-svg-inline";
import AccessLock from "assets/images/svg/access_lock.svg";
import UpgradeModalComponent from "shared/modals/upgrade-modal.component";
import ButtonComponent from "shared/button/button.component";
import ModalService from "services/modal.service";

const { COMPANY, PERSON } = customerTypes;

const { NEW_CUSTOMER_LABEL, EXCESS_LABEL, DUES_LABEL, PAYEE_DUES_LABEL } = balanceLabels;

const { NEW_CUSTOMER, EXCESS, DUES } = balanceTypes;

// const CUSTOMER_TYPE_OPTIONS = [{ label: 'Firma', value: COMPANY }, { label: 'Privat', value: PERSON }];

const KEYCODE_ENTER = 13;
const KEYCODE_ESCAPE = 27;

class RecipientFormComponent extends React.Component {
	constructor(props) {
		super(props);

		this.handleKeyClick = this.handleKeyClick.bind(this);

		this.state = {
			toggledOpeningBalance: this.props.customerData.balance < 0 ? EXCESS : DUES,
			openingBalanceLabel: "",
			errorMessageMobile: "",
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_MULTICURRENCY),
		};
		this.currencySelectOptions = {
			clearable: false,
			backspaceRemoves: false,
			labelKey: "label",
			valueKey: "value",
			matchProp: "label",
			handleChange: this.onCurrencyChange.bind(this),
		};

		this.isMobileNumberValid = false;
	}

	handleKeyClick(event) {
		if (event.keyCode === KEYCODE_ESCAPE) {
			this.props.onCancelEditMode();
		}
		if (event.keyCode === KEYCODE_ENTER) {
			// this.props.onCloseEditMode();  //prevent close edit mode at enter key
		}
	}

	componentDidMount() {
		document.addEventListener("keydown", this.handleKeyClick);
		const { customerData } = this.props;
		if (customerData) {
			const { balance, openingBalance } = customerData;

			if (balance < 0) {
				this.setState({
					toggledOpeningBalance: EXCESS,
					openingBalanceLabel: EXCESS_LABEL,
				});
			} else if (openingBalance > 0 || openingBalance === 0 || !openingBalance) {
				this.setState({
					toggledOpeningBalance: DUES,
					openingBalanceLabel: DUES_LABEL,
				});
			}
		}
	}

	componentWillReceiveProps(props) {
		if (
			props.gstErrorMessage !== "" ||
			props.cinErrorMessage !== "" ||
			props.balanceErrorMessage !== "" ||
			props.mobileErrorMessage
		) {
			document.addEventListener("keydown", this.handleKeyClick);
		}
	}

	componentWillUnmount() {
		document.removeEventListener("keydown", this.handleKeyClick);
	}

	validateGstCin() {
		const { kind, gstNumber, cinNumber } = this.props.customerData;
		// if (kind === COMPANY && !gstNumber) {
		// 	this.refs['text-input-gstNumber'] &&
		// 	this.refs['text-input-gstNumber'].validateAndSetValue();
		// }
		// if (kind === COMPANY && !cinNumber) {
		// 	this.refs['text-input-cinNumber'] &&
		// 	this.refs['text-input-cinNumber'].validateAndSetValue();
		// }
	}

	onInputTextChange(value, name) {
		this.props.handleInputChange(name, value);
	}

	onGstFieldBlur(event) {
		this.props.handleGstBlur(event);
	}

	onGstChange(value, name) {
		this.props.handleGstChange(name, value);
	}
	onCinFieldBlur(event) {
		this.props.handleCinBlur(event);
	}

	onCinChange(value, name) {
		this.props.handleCinChange(name, value);
	}
	onStreetFieldChange(key, event) {
		this.props.handleInputChange(key, event.target.value);
	}
	onStateChanged(indiaStateObj) {
		// if (indiaStateObj === null) {
		// 	return;
		// }
		this.props.handleStateChange("indiaState", indiaStateObj);
	}

	onCountryChange(option) {
		this.props.handleCountryChange("countryIso", option ? option : "");
		// this.props.handleInputChange('countryIso', option ? option.iso2 : 'IN');
	}

	onContactPersonChange(option) {
		this.props.handleContactPersonChange(option);
	}

	onSalutationChange(option) {
		this.props.handleInputChange("salutation", option ? option.label : "");
	}

	onTitleChange(option) {
		this.props.handleInputChange("title", option ? option.label : "");
	}

	onCurrencyChange(option) {
		this.props.handleCurrencyChange("baseCurrency", option ? option.value : "USD");
	}

	onExchangeRateChange(value, name) {
		this.props.handleExchangeRateChange(name, value);
	}

	onDefaultExchangeRateFocus(value, name) {
		this.props.handleExchangeRateFocus(name, value);
	}

	onDefaultExchangeRateToggle(value, name) {
		this.props.handleExchangeRateToggle(name, value);
	}

	getCountrySelectOptions() {
		const { resources } = this.props;
		return {
			loadOptions: (input, callback) => {
				callback(null, {
					options: getCountries(),
					complete: true,
				});
			},
			clearable: false,
			backspaceRemoves: false,
			labelKey: "label",
			valueKey: "iso2",
			matchProp: "label",
			placeholder: resources.str_selectCountry,
			handleChange: this.onCountryChange.bind(this),
		};
	}

	// getStateSelectOptions () {
	// 	const { resources } = this.props;
	// 	return {
	// 		loadOptions: (input, callback) => {
	// 			callback(null, {
	// 				options: this.props.stateListData,
	// 				complete: true
	// 			});
	// 		},
	// 		searchable: true,
	// 		clearable: false,
	// 		backspaceRemoves: false,
	// 		labelKey: 'stateName',
	// 		valueKey: 'id',
	// 		placeholder: resources.str_selectState,
	// 		handleChange: this.onStateChange.bind(this),
	// 		openOnFocus: true
	// 	};
	// }

	onBalanceChange(value, name) {
		const { toggledOpeningBalance } = this.state;
		const { customerData } = this.props;
		let newValue;
		newValue = accounting.unformat(value, config.currencyFormat.decimal);
		if (toggledOpeningBalance === EXCESS) {
			name = "balance";
			newValue = newValue * -1;
		} else if (toggledOpeningBalance === DUES) {
			name = "openingBalance";
		}
		this.props.handleBalanceChange(name, newValue);
	}

	handleOpeningBalanceChange(value, name) {
		let balanceLabel;
		if (value === EXCESS) {
			balanceLabel = EXCESS_LABEL;
		} else if (value === DUES) {
			balanceLabel = DUES_LABEL;
		}
		this.setState({ toggledOpeningBalance: value, openingBalanceLabel: balanceLabel });
		this.props.handleBalanceChange(name, 0);
	}

	renderForm() {
		const { customerData, resources } = this.props;
		const { kind } = customerData;

		if (kind === COMPANY) {
			return (
				<RecipientFormCompanyComponent
					data={customerData}
					onInputTextChange={this.onInputTextChange.bind(this)}
					onChange={this.onContactPersonChange.bind(this)}
					resources={resources}
				/>
			);
		} else {
			return (
				<RecipientFormPersonComponent
					data={customerData}
					onInputTextChange={this.onInputTextChange.bind(this)}
					onSalutationChange={this.onSalutationChange.bind(this)}
					onTitleChange={this.onTitleChange.bind(this)}
					resources={resources}
				/>
			);
		}
	}

	onMobileBlur(event) {
		this.props.handleMobileBlur(event);
	}

	onMobileChange(value, name) {
		this.props.handleMobileChange(name, value);
	}

	restrictedContent() {
		const { resources } = this.props;

		const { canChangeAccountData  } = this.state;
		return (
			<div className="restricted-content">
				<SVGInline svg={AccessLock} height="15px" width="15px" className="access-lock" />
				<span className="text-small text-muted upgrade-text">Upgrade your plan to use Multicurrency</span>
				<ButtonComponent
					buttonIcon={"icon-visible"}
					type="secondary"
					isWide={false}
					callback={() => {
						// ModalService.open(
						// 	<UpgradeModalComponent title={resources.str_timeToStart} resources={resources} />,
						// 	{
						// 		width: 1196,
						// 		padding: 0,
						// 		isCloseable: true,
						// 	}
						// );
					}}
					label={`Upgrade`}
					dataQsId="settings-account-btn-subscription"
					disabled={!canChangeAccountData}
				/>
			</div>
		);
	}

	multiCurrencyContent() {
		const {
			customerData,
			handleKindChange,
			resources,
			errorMessage,
			gstErrorMessage,
			cinErrorMessage,
			baseCurrency,
			exchangeRate,
			balanceErrorMessage,
			defaultExchangeRateToggle,
			toggleDisable,
			type,
			mobileErrorMessage,
		} = this.props;
		const { kind, street, countryIso, indiaState, gstNumber, cinNumber, balance, openingBalance, mobile } = customerData; //  zipCode, city,
		//if (countryIso !== "IN") {
			return (
			<React.Fragment>
				<div className="recipientFormPerson_foreign">
					<SelectInputComponent
						ref="baseCurrency"
						name="baseCurrency"
						label={`Currency`}
						allowCreate={false}
						notAsync={true}
						options={this.currencySelectOptions}
						value={!baseCurrency ? customerData.baseCurrency : baseCurrency}
						loadedOptions={currencyOptions}
						//onBlur={this.onInputBlur}
						onChange={this.onCurrencyChange.bind(this)}
						placeholder={`Select currency`}
					/>
					<span className="currencyEqual">=</span>
					<CurrencyInputComponent
						willReceiveNewValueProps={true}
						name="exchangeRate"
						// value={!exchangeRate ? parseFloat(customerData.exchangeRate) : parseFloat(exchangeRate)}
						value={parseFloat(exchangeRate)}
						onBlur={(value) => this.onExchangeRateChange(value, "exchangeRate")}
						currencyType={"code"}
						onFocus={() => {
							this.onDefaultExchangeRateFocus("exchangeRate");
						}}
					/>
					<span className="icon icon-refresh_large" onClick={() => this.props.fetchRates(true)} />
				</div>
				<div className="row col-xs-12 recipientFormPerson_exrateCheckbox">
					<CheckboxInputComponent
						name={"defaultExchangeRateToggle"}
						label={`Set exchange rate as default`}
						checked={defaultExchangeRateToggle}
						onChange={() => this.onDefaultExchangeRateToggle()}
						disabled={toggleDisable}
					/>
				</div>
			</React.Fragment>)
	//	}
	}

	render() {
		const {
			customerData,
			handleKindChange,
			resources,
			errorMessage,
			gstErrorMessage,
			cinErrorMessage,
			baseCurrency,
			exchangeRate,
			balanceErrorMessage,
			defaultExchangeRateToggle,
			toggleDisable,
			type,
			mobileErrorMessage,
		} = this.props;
		const { kind, street, countryIso, indiaState, gstNumber, cinNumber, balance, openingBalance, mobile } =
			customerData; //  zipCode, city,
		const { openingBalanceLabel, toggledOpeningBalance, planRestricted } = this.state;
		const countrySelectOptions = this.getCountrySelectOptions();
		return (
			<div className="recipientForm">
				<RadioInputComponent
					wrapperClass="recipientFormRadioInput"
					key="toggleCustomerType"
					options={[
						{ label: resources.str_firma, value: COMPANY },
						{ label: resources.str_private, value: PERSON },
					]}
					value={kind || COMPANY}
					onChange={handleKindChange}
				/>
				{this.renderForm()}
				{/* <TextInputExtendedComponent
					name="street"
					value={street}
					placeholder={resources.str_street}
					onChange={this.onInputTextChange.bind(this)}
				/> */}

				{/* <div className="recipientFormAddress">
					<TextInputExtendedComponent
						name="zipCode"
						value={zipCode}
						placeholder={resources.str_postCode}
						onChange={this.onInputTextChange.bind(this)}
					/>
					<TextInputExtendedComponent
						name="city"
						value={city}
						placeholder={resources.str_place}
						onChange={this.onInputTextChange.bind(this)}
					/>
				</div> */}
				<div className={customerData.id ? `recipientForm-mobile existing` : `recipientForm-mobile`}>
					<NumberInputComponent
						dataQsId="customer-edit-mobile"
						label={`Mobile no.`}
						name={"mobile"}
						maxLength="10"
						value={parseInt(mobile)}
						isDecimal={false}
						errorMessage={mobileErrorMessage}
						onBlur={(value) => this.onMobileBlur(value)}
						onChange={(value, name) => this.onMobileChange(value, name)}
						defaultNonZero={true}
					/>
				</div>

				<div className="recipientFormCompany-address">
					<TextareaAutosize
						name="street"
						data-qs-id="customer-edit-address-street"
						className="textarea_input recipient-form--address-street"
						placeholder={resources.str_enterAddress}
						minRows={3}
						maxRows={15}
						value={street}
						onChange={(event) => this.onStreetFieldChange("street", event)}
					/>
					<span className="textarea_bar" />
				</div>
				<div className={`${countryIso !== "IN" ? "recipientFormPerson_country" : "recipientFormPerson_row"}`}>
					<SelectInputComponent
						ref="countryRef"
						name="countryIso"
						value={countryIso}
						allowCreate={false}
						options={countrySelectOptions}
						onChange={this.onCountryChange.bind(this)}
					/>
					{countryIso === "IN" ? (
						<SelectStateInputComponent
							stateId={indiaState && indiaState.id}
							onStateChanged={this.onStateChanged.bind(this)}
							errorMessage={errorMessage}
						/>
					) : null}
				</div>
				{
						countryIso !== "IN" ? (planRestricted ? this.restrictedContent() : this.multiCurrencyContent()) : null
				}
				{/* {countryIso !== "IN" ? (
					<div className="recipientFormPerson_foreign">
						<SelectInputComponent
							ref="baseCurrency"
							name="baseCurrency"
							label={`Currency`}
							allowCreate={false}
							notAsync={true}
							options={this.currencySelectOptions}
							value={!baseCurrency ? customerData.baseCurrency : baseCurrency}
							loadedOptions={currencyOptions}
							//onBlur={this.onInputBlur}
							onChange={this.onCurrencyChange.bind(this)}
							placeholder={`Select currency`}
						/>
						<span className="currencyEqual">=</span>
						<CurrencyInputComponent
							willReceiveNewValueProps={true}
							name="exchangeRate"
							// value={!exchangeRate ? parseFloat(customerData.exchangeRate) : parseFloat(exchangeRate)}
							value={parseFloat(exchangeRate)}
							onBlur={(value) => this.onExchangeRateChange(value, "exchangeRate")}
							currencyType={"code"}
							onFocus={() => {
								this.onDefaultExchangeRateFocus("exchangeRate");
							}}
						/>
						<span className="icon icon-refresh_large" onClick={() => this.props.fetchRates(true)} />
					</div>
				) : null}
				{countryIso !== "IN" ? (
					<div className="row col-xs-12 recipientFormPerson_exrateCheckbox">
						<CheckboxInputComponent
							name={"defaultExchangeRateToggle"}
							label={`Set exchange rate as default`}
							checked={defaultExchangeRateToggle}
							onChange={() => this.onDefaultExchangeRateToggle()}
							disabled={toggleDisable}
						/>
					</div>
				) : null} */}
				{kind === COMPANY && countryIso === "IN" ? (
					<div className="recipientFormPerson_row">
						<TextInputExtendedComponent
							ref="text-input-gstNumber"
							name="gstNumber"
							value={gstNumber}
							errorMessage={gstErrorMessage}
							placeholder={resources.str_gstNumber}
							onChange={this.onGstChange.bind(this)}
							onBlur={(ev) => this.onGstFieldBlur(ev)}
						/>
						<TextInputExtendedComponent
							ref="text-input-cinNumber"
							name="cinNumber"
							value={cinNumber}
							errorMessage={cinErrorMessage}
							placeholder={resources.str_cinNumber}
							onChange={this.onCinChange.bind(this)}
							onBlur={(ev) => this.onCinFieldBlur(ev)}
						/>
					</div>
				) : null}
				{/* {customerData.type === `customer` && customerData.id === undefined ? (
					<div className="recipientFormOpeningBalanceType_row">
						<span>{`Opening balance`}</span>
					</div>
				) : null}
				{customerData.id === undefined ? (
					customerData.type === `customer` ? (
						<div className="recipientFormOpeningToggleRadio">
							<RadioInputComponent
								wrapperClass=""
								key="toggleOpeningBalanceType"
								options={[
									{ label: `Previous dues`, value: DUES },
									{ label: `Excess payments`, value: EXCESS },
								]}
								value={toggledOpeningBalance}
								onChange={this.handleOpeningBalanceChange.bind(this)}
							/>
						</div>
					) : null
				) : null}
				{customerData.type === `customer` && customerData.id === undefined ? (
					<div className="">
						<CurrencyInputComponent
							value={toggledOpeningBalance === DUES ? customerData.openingBalance : customerData.balance}
							//name="balance"
							onBlur={this.onBalanceChange.bind(this)}
							dataQsId="dashboard-taxEstimation-configuration-profit"
							label={type === `payee` ? PAYEE_DUES_LABEL : openingBalanceLabel}
							willReceiveNewValueProps={true}
							errorMessage={balanceErrorMessage}
							//disabled={toggledOpeningBalance === NEW_CUSTOMER}
							openingBalanceTypeCurrency={toggledOpeningBalance}
							// currencyType={`symbol`}
							// currencyCode={baseCurrency}
						/>
					</div>
				) : null} */}
			</div>
		);
	}
}

RecipientFormComponent.propTypes = {
	handleInputChange: PropTypes.func.isRequired,
	handleContactPersonChange: PropTypes.func.isRequired,
	onCloseEditMode: PropTypes.func.isRequired,
	onCancelEditMode: PropTypes.func.isRequired,
	handleKindChange: PropTypes.func,
	customerData: PropTypes.object,
};

const mapStateToProps = (state) => {
	const { stateListData } = state.countryState.stateList;
	return {
		stateListData,
	};
};

export default connect(mapStateToProps)(RecipientFormComponent);
