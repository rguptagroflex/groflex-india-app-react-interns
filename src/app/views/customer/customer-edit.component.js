import React from "react";
import { format } from "util";
import invoiz from "services/invoiz.service";
import config from "config";
import accounting from "accounting";
import TopbarComponent from "shared/topbar/topbar.component";
import ChangeDetection from "helpers/changeDetection";
import HtmlInputComponent from "shared/inputs/html-input/html-input.component";
import NumberInputComponent from "shared/inputs/number-input/number-input.component";
import PercentageInputComponent from "shared/inputs/percentage-input/percentage-input.component";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import SelectStateInputComponent from "shared/select-state/select-state.component";
import TabInputComponent from "shared/inputs/tab-input/tab-input.component";
import RadioInputComponent from "shared/inputs/radio-input/radio-input.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import ButtonComponent from "shared/button/button.component";
import ModalService from "services/modal.service";
import EditContactPersonModalComponent from "shared/modals/edit-contact-person-modal.component";
import Customer from "models/customer.model";
import ContactPerson from "models/contact-person.model";
import { connect } from "react-redux";
import { getCountries } from "helpers/getCountries";
import TextareaAutosize from "react-textarea-autosize";
import { errorCodes, balanceTypes, balanceLabels } from "helpers/constants";
import { currencyOptions } from "helpers/constants";
import { gstTypeOptions } from "helpers/constants";
import CurrencyInputComponent from "shared/inputs/currency-input/currency-input.component";
import CheckboxInputComponent from "shared/inputs/checkbox-input/checkbox-input.component";
import { getConvertRate } from "helpers/getSettingsData";
import planPermissions from "enums/plan-permissions.enum";
import userPermissions from "enums/user-permissions.enum";
import SVGInline from "react-svg-inline";
import AccessLock from "assets/images/svg/access_lock.svg";
import UpgradeModalComponent from "shared/modals/upgrade-modal.component";

const changeDetection = new ChangeDetection();

const CUSTOMER_KIND = {
	COMPANY: "company",
	PERSON: "person",
};

const { NEW_CUSTOMER_LABEL, EXCESS_LABEL, DUES_LABEL, PAYEE_DUES_LABEL } = balanceLabels;

const { NEW_CUSTOMER, EXCESS, DUES } = balanceTypes;

class CustomerEditComponent extends React.Component {
	constructor(props) {
		super(props);

		if (this.props.nextCustomerNumber) {
			this.props.customer.number = this.props.nextCustomerNumber;
		}
		this.state = {
			customer: this.props.customer || new Customer(),
			// cityOptions: [],
			salutations: this.props.salutations || [],
			titles: this.props.titles || [],
			toggledOpeningBalance: this.props.customer.balance < 0 ? EXCESS : DUES,
			openingBalanceLabel: this.props.customer.balance < 0 ? EXCESS_LABEL : DUES_LABEL,
			errorMessage: "",
			gstErrorMessage: "",
			// gstTypeErrorMessage:"",
			cinErrorMessage: "",
			errorMessageMobile: "",
			errorMessageEmail: "",
			currencyRates: [],
			defaultExchangeRateToggle: props.customer.defaultExchangeRateToggle,
			currencyErrorMessage: "",
			isOpeningDisabled: false,
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_MULTICURRENCY),
		};
		this.isMobileNumberValid = false;
		this.isEmailValid = false;

		this.currencySelectOptions = {
			clearable: false,
			backspaceRemoves: false,
			labelKey: "label",
			valueKey: "value",
			matchProp: "label",
			handleChange: this.onCurrencyChange.bind(this),
		};
	}

	componentDidMount() {
		const { customer } = this.state;
		setTimeout(() => {
			window.scrollTo(0, 0);
		}, 0);
		setTimeout(() => {
			const original = JSON.parse(JSON.stringify(this.state.customer));
			changeDetection.bindEventListeners();
			changeDetection.setModelGetter(() => {
				const current = JSON.parse(JSON.stringify(this.state.customer));

				return {
					original,
					current,
				};
			});
		}, 0);

		if (customer.openingBalance > 0 || customer.balance < 0) {
			this.setState({ isOpeningDisabled: true });
		}

		if (customer && customer.id !== undefined && customer.address && customer.address.countryIso !== "IN") {
			this.refreshRates(false);
		}
	}

	componentWillUnmount() {
		changeDetection.unbindEventListeners();
	}

	refreshRates(forceRefresh, value) {
		const { customer, currencyRates, defaultExchangeRateToggle } = this.state;
		//	if (customer && customer.id !== undefined && customer.address.countryIso !== "IN") {
		getConvertRate()
			.then((response) => {
				const { body } = response;
				if (forceRefresh) {
					const exRateValue = body.find((item) => item.from === customer.baseCurrency);
					const newData = { exchangeRate: exRateValue.value };
					this.setState(
						{
							customer: Object.assign({}, customer, newData),
							currencyRates: body,
							defaultExchangeRateToggle: false,
						},
						() => {
							invoiz.page.showToast({ message: `Refreshed latest currency rates!`, type: "success" });
						}
					);
				} else {
					if (customer.id) {
						if (value) {
							const exRateValue = !!value.currency
								? body.find((item) => item.from === value.currency)
								: 0.0;
							customer.baseCurrency = !!value.currency ? value.currency : customer.baseCurrency;
							customer.exchangeRate = !!value.currency ? exRateValue.value : customer.exchangeRate;
							this.setState({ currencyRates: body, customer });
						} else {
							const exRateValue = body.find((item) => item.from === customer.baseCurrency);
							const newData = {
								exchangeRate: customer.defaultExchangeRateToggle
									? customer.exchangeRate
									: exRateValue.value,
							};
							this.setState({ customer: Object.assign({}, customer, newData), currencyRates: body });
						}
					} else {
						const exRateValue = !!value.currency ? body.find((item) => item.from === value.currency) : 0.0;
						customer.baseCurrency = !!value.currency ? value.currency : customer.baseCurrency;
						customer.exchangeRate = !!value.currency ? exRateValue.value : customer.exchangeRate;
						this.setState({ currencyRates: body, customer });
					}
				}
			})
			.catch((err) => {
				invoiz.page.showToast({ message: `Could not fetch latest currency rates!`, type: "error" });
			});
		//	}
	}

	render() {
		const { customerCategories, payConditions, resources } = this.props;
		const {
			customer,
			salutations,
			titles,
			errorMessage,
			gstErrorMessage,
			// gstTypeErrorMessage,
			cinErrorMessage,
			errorMessageMobile,
			errorMessageEmail,
			currencyErrorMessage,
			toggledOpeningBalance,
			openingBalanceLabel,
			canChangeAccountData,
			planRestricted,
		} = this.state; // cityOptions

		const salutationOptions = salutations.map((title) => {
			return { name: title, isExisting: true };
		});
		salutationOptions.push({
			name: resources.str_addUnit,
			isDummy: true,
		});

		const titleOptions = titles.map((title) => {
			return { name: title, isExisting: true };
		});
		titleOptions.push({
			name: resources.str_addUnit,
			isDummy: true,
		});

		const payConditionOptions = payConditions.map((cond) => {
			return { name: cond.name, value: cond.id };
		});
		payConditionOptions.push({ name: "Standard", value: 0 });

		const topbar = (
			<TopbarComponent
				title={customer.id ? resources.customerEditCustomerHeading : resources.customerCreateNewCustomerHeading}
				hasCancelButton={true}
				cancelButtonCallback={() => this.onCancel()}
				buttonCallback={(evt, button) => this.onTopbarButtonClick(button.action)}
				buttons={[
					{
						type: "primary",
						label: resources.str_toSave,
						buttonIcon: "icon-check",
						action: "save",
						dataQsId: "customer-topbar-button-save",
					},
				]}
			/>
		);

		const restrictedContent = (
			<div className="row restricted-content">
				<SVGInline svg={AccessLock} height="20px" width="40px" className="access-lock" />
				<span className="text-medium text-muted upgrade-text">Upgrade your plan to use Multicurrency</span>
				<ButtonComponent
					buttonIcon={"icon-visible"}
					type="secondary"
					isWide={false}
					callback={() => {
						// ModalService.open(<UpgradeModalComponent title={resources.str_timeToStart} resources={resources}/>, {
						// 	width: 1196,
						// 	padding: 0,
						// 	isCloseable: true,
						// });
					}}
					label={`Upgrade`}
					dataQsId="settings-account-btn-subscription"
					disabled={!canChangeAccountData}
				/>
			</div>
		);

		const multiCurrencyContent =
			customer.address.countryIso !== "IN" ? (
				<React.Fragment>
					<div className="row">
						<div className="col-xs-5">
							<SelectInputComponent
								title={`Currency`}
								ref="baseCurrency"
								name="baseCurrency"
								label={`Currency`}
								allowCreate={false}
								notAsync={true}
								options={this.currencySelectOptions}
								value={customer.baseCurrency}
								loadedOptions={currencyOptions}
								//onBlur={this.onInputBlur}
								onChange={this.onCurrencyChange.bind(this)}
								placeholder={`Select currency`}
								errorMessage={currencyErrorMessage}
							/>
						</div>
						<div>
							<span className="currencyEqual col-xs-2">=</span>
						</div>
						<div className="col-xs-5">
							<div className="customer-edit-exchange-rate">
								<CurrencyInputComponent
									willReceiveNewValueProps={true}
									name="exchangeRate"
									value={parseFloat(customer.exchangeRate)}
									onBlur={(value) => this.onExchangeRateChange(value, "exchangeRate")}
									currencyType={"code"}
									label={`Exchange rate`}
									onFocus={() => {
										this.setState({ defaultExchangeRateToggle: false });
									}}
								/>
							</div>
						</div>
						<span className="icon icon-refresh_large" onClick={() => this.refreshRates(true)} />
					</div>
					<div className="row col-xs-12">
						<CheckboxInputComponent
							name={"defaultExchangeRateToggle"}
							label={`Set exchange rate as default`}
							checked={this.state.defaultExchangeRateToggle || false}
							onChange={() => this.onDefaultExchangeRateToggle()}
						/>
					</div>
				</React.Fragment>
			) : null;

		const companyElements = (
			<div>
				<div className="row">
					<div className="col-xs-12">
						<TextInputExtendedComponent
							ref="customer-edit-text-input-company-name"
							name="companyName"
							required={true}
							dataQsId="customer-edit-companyName"
							value={customer.companyName || ""}
							label={resources.str_companyName}
							onChange={(value) => this.onCustomerFieldChange("companyName", value)}
						/>
					</div>
				</div>
				{/* <div className="row">
					<div className="col-xs-12">
						<TextInputExtendedComponent
							name="companyNameAffix"
							dataQsId="customer-edit-companyNameAffix"
							value={customer.companyNameAffix || ''}
							label={resources.str_nameSuffix}
							onChange={value => this.onCustomerFieldChange('companyNameAffix', value)}
						/>
					</div>
				</div> */}
			</div>
		);

		const personElements = (
			<div className="customer-edit-person-details">
				<div className="row">
					<div className="col-xs-6">
						<SelectInputComponent
							title={resources.str_salutation}
							name="salutation"
							dataQsId={"customer-edit-salutation"}
							value={customer.salutation}
							allowCreate={true}
							notAsync={true}
							options={{
								placeholder: resources.str_choose,
								labelKey: "name",
								valueKey: "name",
								handleChange: (value) => {
									if (!value || (value && !value.isDummy && value.name)) {
										this.onSalutationOrTitleChange(value, true);
									}
								},
							}}
							loadedOptions={salutationOptions}
						/>
					</div>
					<div className="col-xs-6">
						<SelectInputComponent
							title={resources.str_title}
							name="title"
							dataQsId={"customer-edit-title"}
							value={customer.title}
							allowCreate={true}
							notAsync={true}
							options={{
								placeholder: resources.str_choose,
								labelKey: "name",
								valueKey: "name",
								handleChange: (value) => {
									if (!value || (value && !value.isDummy && value.name)) {
										this.onSalutationOrTitleChange(value, false);
									}
								},
							}}
							loadedOptions={titleOptions}
						/>
					</div>
				</div>
				<div className="row">
					<div className="col-xs-6">
						<TextInputExtendedComponent
							name="firstName"
							ref="customer-edit-text-input-firstname"
							required={true}
							dataQsId="customer-edit-firstName"
							value={customer.firstName || ""}
							label={resources.str_firstName}
							onChange={(value) => this.onCustomerFieldChange("firstName", value)}
						/>
					</div>
					<div className="col-xs-6">
						<TextInputExtendedComponent
							name="lastName"
							ref="customer-edit-text-input-lastname"
							required={false}
							dataQsId="customer-edit-lastName"
							value={customer.lastName || ""}
							label={resources.str_surName}
							onChange={(value) => this.onCustomerFieldChange("lastName", value)}
						/>
					</div>
				</div>
			</div>
		);

		const contactPersonRows = customer.contactPersons.map((cP, index) => {
			const contactPerson = new ContactPerson(cP);
			return (
				<div
					className={`row customer-edit-contactperson-row ${
						index === 0 ? "customer-edit-contactperson-row-first" : ""
					}`}
					key={`customer-edit-contactperson-row-${index}`}
				>
					<div className="customer-edit-contactperson-controls">
						<div className="icon icon-trashcan u_mr_8" onClick={() => this.onDeleteContactPerson(index)} />
						<div className="icon icon-edit" onClick={() => this.onEditContactPerson(index)} />
					</div>
					<div className="row u_ml_8">
						<div className="col-xs-5">
							<div>{contactPerson.displayNameLong}</div>
						</div>
						<div className="col-xs-7">
							<div className="row">
								<div>{contactPerson.email}</div>
							</div>
						</div>
					</div>
				</div>
			);
		});
		return (
			<div className="customer-edit-component-wrapper">
				{topbar}

				<div className={`wrapper-has-topbar-with-margin`}>
					{" "}
					<div className="row">
						<div className="col-xs-7 u_mb_20 border-topbar-wrapper ">
							<div className="col-xs-12 text-h4 ">{resources.str_contactInfo}</div>
							<div className="col-xs-12">
								<div className="row">
									<RadioInputComponent
										wrapperClass={`customer-edit-type-toggle col-xs-6 u_mt_20`}
										options={[
											{ label: "Customer", value: "customer" },
											{ label: "Payee", value: "payee" },
										]}
										value={customer.type || "customer"}
										onChange={(val) => this.onCustomerFieldChange("type", val)}
										dataQsId="customer-edit-type"
									/>
								</div>
								<div className="row">
									<TabInputComponent
										componentClass={"customer-edit-kind-toggle col-xs-5"}
										items={[
											{ label: resources.str_firma, value: CUSTOMER_KIND.COMPANY },
											{ label: resources.str_private, value: CUSTOMER_KIND.PERSON },
										]}
										value={customer.kind}
										onChange={(val) => this.onCustomerFieldChange("kind", val)}
										dataQsId="customer-edit-kind"
									/>

									<div className="customer-edit-customer-number col-xs-6 col-xs-offset-1">
										{/* <input type="text" value="" className="settings-autofilled-Field-hidden" /> */}
										<NumberInputComponent
											name="customerNumber"
											dataQsId="customer-edit-customerNumber"
											label={resources.str_customerNumber}
											leftLabel={true}
											hasBorder={true}
											// precision={0}
											min={this.props.nextCustomerNumber}
											selectOnFocus={true}
											value={customer.number || this.props.nextCustomerNumber}
											isDecimal={false}
											onChange={(value) => this.onCustomerFieldChange("number", value)}
										/>
									</div>
								</div>

								{customer.kind === CUSTOMER_KIND.COMPANY ? companyElements : personElements}

								<div className="row">
									<div className="col-xs-12">
										<label className="textarea_label">{resources.str_streetAndHouseNumber}</label>
										<TextareaAutosize
											name="street"
											data-qs-id="customer-edit-address-street"
											className="textarea_input customer-edit-address-street"
											placeholder={resources.str_enterAddress}
											minRows={3}
											maxRows={15}
											value={customer.address.street || ""}
											onChange={(event) => this.onStreetFieldChange("street", event)}
										/>
										<span className="textarea_bar" />
									</div>
								</div>
								<div className="row">
									<div className="col-xs-12 u_mt_40">
										<div className="row">
											<div className=" col-xs-12">
												<SelectInputComponent
													title="Category"
													name="customerCategory"
													notAsync={true}
													options={{
														clearable: false,
														searchable: false,
														labelKey: "name",
														valueKey: "value",
														handleChange: (option) =>
															this.onCustomerFieldChange("category", option.value),
													}}
													value={customer.category}
													loadedOptions={customerCategories.map((cat) => {
														return {
															name: cat,
															value: cat === resources.str_noInformation ? "" : cat,
														};
													})}
													dataQsId="customer-edit-customerCategory"
												/>
											</div>
										</div>
									</div>
								</div>

								<div className="row">
									<div
										className={`${customer.address.countryIso !== "IN" ? "col-xs-12" : "col-xs-6"}`}
									>
										<div className="customer-edit-country-select">
											<SelectInputComponent
												title={resources.str_country}
												name="country"
												dataQsId={"customer-edit-address-country"}
												value={customer.address.countryIso}
												allowCreate={false}
												notAsync={true}
												options={{
													labelKey: "label",
													valueKey: "iso2",
													clearable: false,
													backspaceRemoves: false,
													handleChange: (option) =>
														this.onCountryFieldChange("countryIso", option),
												}}
												loadedOptions={getCountries()}
											/>
										</div>
									</div>
									<div className="col-xs-6">
										<div className="customer-edit-country-select">
											{customer.address.countryIso === "IN" ? (
												<SelectStateInputComponent
													title={resources.str_state}
													stateId={customer.indiaState && customer.indiaState.id}
													onStateChanged={this.onStateChanged.bind(this)}
													errorMessage={errorMessage}
												/>
											) : null}
										</div>
									</div>
								</div>

								{customer.kind === CUSTOMER_KIND.COMPANY && customer.address.countryIso === "IN" ? (
									<div className="row">
										<div className="col-xs-6">
											<div style={{ marginTop: "12px" }}>
												<SelectInputComponent
													// title= "GST Type"
													name="gstType"
													// ref ="customer-edit-text-input-company-gstType"
													value={customer.address.gstType}
													allowCreate={true}
													notAsync={true}
													// required={true}
													options={{
														placeholder: resources.str_gstType,
														clearable: false,
														backspaceRemoves: false,
														labelKey: "label",
														valueKey: "value",
														matchProp: "label",
														handleChange: (option) =>
															this.onGSTTypeFieldChange("gstType", option.value),
													}}
													// errorMessage={gstTypeErrorMessage}
													loadedOptions={gstTypeOptions}
												/>
											</div>
										</div>
										{customer.address.gstType !== "Unregistered" ? (
											<div className="col-xs-6">
												<TextInputExtendedComponent
													name="gstNumber"
													ref="customer-edit-text-input-company-gstNumber"
													dataQsId="customer-edit-address-gstNumber"
													value={customer.address.gstNumber || ""}
													label={resources.str_gstNumber}
													errorMessage={gstErrorMessage}
													// onBlur={ev => this.onGstFieldBlur(ev)}
													onChange={(value) => this.onGSTFieldChange("gstNumber", value)}
												/>
											</div>
										) : null}

										<div className="col-xs-6">
											<TextInputExtendedComponent
												name="cinNumber"
												ref="customer-edit-text-input-company-cinNumber"
												dataQsId="customer-edit-address-cinNumber"
												value={customer.address.cinNumber || ""}
												label={resources.str_cinNumber}
												// errorMessage={cinErrorMessage}
												// onBlur={ev => this.onCinFieldBlur(ev)}
												onChange={(value) => this.onCINFieldChange("cinNumber", value)}
											/>
										</div>
									</div>
								) : null}
								{customer.address.countryIso !== "IN" && customer.address.countryIso
									? planRestricted
										? restrictedContent
										: multiCurrencyContent
									: multiCurrencyContent}
							</div>
						
						</div>
						<div
							className="col-xs-5 "
						>
							{customer.type === `customer` || customer.type === undefined ? (
								<div className="row u_mb_20 border-topbar-wrapper u_ml_10">
									{" "}
									<div className="col-xs-12 text-h4 ">{`Opening balance`}</div>
									<div className="col-xs-12">
										<div className="row">
											<div className="col-xs-12 recipientFormOpeningToggleRadio">
												<RadioInputComponent
													wrapperClass=""
													// disabled={(customer.salesOrExpensesVolumeData && (customer.salesOrExpensesVolumeData.turnoverTotal > 0 || customer.salesOrExpensesVolumeData.credits > 0))
													// 	|| (this.state.isOpeningDisabled) ? true : false}
													key="toggleOpeningBalanceType"
													options={[
														{ label: `Previous dues`, value: DUES },
														{ label: `Excess payments`, value: EXCESS },
													]}
													value={toggledOpeningBalance}
													onChange={this.handleOpeningBalanceChange.bind(this)}
												/>
											</div>
											{/* <div className="col-xs-6">
										<CurrencyInputComponent
											value={
												toggledOpeningBalance === DUES
													? customer.openingBalance
													: customer.balance
											}
											//name="openingBalance"
											onBlur={this.onBalanceChange.bind(this)}
											dataQsId="dashboard-taxEstimation-configuration-profit"
											label={customer.type === `payee` ? PAYEE_DUES_LABEL : openingBalanceLabel}
											willReceiveNewValueProps={true}
											//errorMessage={balanceErrorMessage}
											// disabled={customer.salesOrExpensesVolumeData && (customer.salesOrExpensesVolumeData.turnoverTotal > 0 || customer.salesOrExpensesVolumeData.credits > 0 )
											// 	|| (this.state.isOpeningDisabled) ? true : false}
											openingBalanceTypeCurrency={toggledOpeningBalance}
										/>
									</div> */}
										</div>
										<div className="row">
											<div className="col-xs-12 recipientFormOpeningToggleRadio">
											</div>
											<div className="col-xs-12">
												<CurrencyInputComponent
													value={
														toggledOpeningBalance === DUES
															? customer.openingBalance
															: customer.balance
													}
													//name="openingBalance"
													onBlur={this.onBalanceChange.bind(this)}
													dataQsId="dashboard-taxEstimation-configuration-profit"
													label={
														customer.type === `payee`
															? PAYEE_DUES_LABEL
															: openingBalanceLabel
													}
													willReceiveNewValueProps={true}
													//errorMessage={balanceErrorMessage}
													// disabled={customer.salesOrExpensesVolumeData && (customer.salesOrExpensesVolumeData.turnoverTotal > 0 || customer.salesOrExpensesVolumeData.credits > 0 )
													// 	|| (this.state.isOpeningDisabled) ? true : false}
													openingBalanceTypeCurrency={toggledOpeningBalance}
												/>
											</div>
										</div>
									</div>
								</div>
							) : null}
							<div className="row u_mb_20 border-topbar-wrapper u_ml_10 ">
								<div className="col-xs-12 text-h4 ">{resources.str_conditions}</div>
								<div className="col-xs-12  u_mt_6">
									{"You can set your payment terms & discount % here"}
								</div>
								<div className="col-xs-12">
									<div className="row">
										<div className="col-xs-12">
											<div className="customer-edit-paycondition">
												<label>{resources.str_termsOfPayment}</label>
												<SelectInputComponent
													name="payCondition"
													notAsync={true}
													options={{
														clearable: false,
														searchable: false,
														labelKey: "name",
														valueKey: "value",
														handleChange: (option) =>
															this.onCustomerFieldChange("payConditionId", option.value),
													}}
													value={customer.payConditionId || 0}
													loadedOptions={payConditionOptions}
													dataQsId="customer-edit-payCondition"
												/>
											</div>
										</div>
									</div>
									<div className="row">
										<div className="col-xs-12">
											<PercentageInputComponent
												name="discount"
												dataQsId="customer-edit-discount"
												value={customer.discount}
												selectOnFocus={true}
												onBlur={(value) => this.onCustomerFieldChange("discount", value)}
												label={resources.customerDiscountListPrices}
												hasBorder={true}
												leftLabel={true}
											/>
										</div>
									</div>
								</div>
							</div>
							<div className="row u_mb_20  border-topbar-wrapper-rows u_ml_10">
								<div className="col-xs-12 u_mt_8 text-h4 u_mb_20" style={{ height: "2px" }}>
									{resources.str_contactPerson}
								</div>
								<div className="col-xs-12 u_mb_12 u_mt_10 u_ml_2">
									{"You can list all your contacts here"}
								</div>
								<div className="col-xs-12  ">
									{/* {contactPersonRows.length > 0 ? (
										<div className="customer-edit-contactpersons">{contactPersonRows}</div>
									) : null} */}
									{contactPersonRows.length > 0 ? (
										<div className="customer-edit-contactpersons-container">
											<div className="row u_ml_8">
												<div className="col-xs-5">
													<div>
														<strong>Name</strong>
													</div>
												</div>
												<div className="col-xs-7">
													<div>
														<strong>{resources.str_email}</strong>
													</div>
												</div>
											</div>

											<div className="customer-edit-contactpersons">{contactPersonRows}</div>
										</div>
									) : null}
									<div className="button-wrapper">
										<ButtonComponent
											// buttonIcon="icon-plus"
											label={resources.str_contactPersons}
											callback={() => this.onAddContactPerson()}
											type="primary"
										/>
									</div>
								</div>
								{/* </div> */}
							</div>
						</div>
						<div className="col-xs-7 border-topbar-wrapper">
							<div className="col-xs-12 text-h4 u_pb_20 ">{resources.str_communication}</div>
							<div className="col-xs-12">
								<div className="row">
									<div className="col-xs-6">
										<TextInputExtendedComponent
											ref="customerEditEmailInput"
											name="email"
											dataQsId="customer-edit-email"
											onBlur={(target, value) => this.onEmailBlur(value)}
											value={customer.email || ""}
											label={resources.str_email}
											onChange={(value, name) => this.onInputChange(value, name)}
											// onChange={value => this.onCustomerFieldChange('email', value)}
											errorMessage={errorMessageEmail}
										/>
									</div>
									<div className="col-xs-6">
										<TextInputExtendedComponent
											name="website"
											dataQsId="customer-edit-website"
											value={customer.website || ""}
											label={resources.str_website}
											onChange={(value) => this.onCustomerFieldChange("website", value)}
										/>
									</div>
								</div>

								<div className="row">
									<div className="col-xs-6">
										<NumberInputComponent
											dataQsId="customer-edit-phone1"
											label={resources.str_phone}
											name={"phone1"}
											value={parseInt(customer.phone1)}
											isDecimal={false}
											onChange={(value) => this.onCustomerFieldChange("phone1", value)}
											defaultNonZero={true}
										/>
									
									</div>
									<div className="col-xs-6">
										<NumberInputComponent
											dataQsId="customer-edit-phone2"
											label={resources.str_phone + " 2"}
											name={"phone2"}
											value={parseInt(customer.phone2)}
											isDecimal={false}
											onChange={(value) => this.onCustomerFieldChange("phone2", value)}
											defaultNonZero={true}
										/>
									
									</div>
								</div>

								<div className="row">
									<div className="col-xs-6">
										<NumberInputComponent
											dataQsId="customer-edit-mobile"
											label={resources.str_mobilePhone}
											name={"mobile"}
											maxLength="10"
											value={parseInt(customer.mobile)}
											isDecimal={false}
											errorMessage={errorMessageMobile}
											onBlur={(value) => this.onMobileNumberBlur(value)}
											onChange={(value, name) => this.onInputChange(value, name)}
											defaultNonZero={true}
										/>
									</div>

									<div className="col-xs-6">
										<TextInputExtendedComponent
											name="fax"
											dataQsId="customer-edit-fax"
											value={customer.fax || ""}
											label={resources.str_fax}
											onChange={(value) => this.onCustomerFieldChange("fax", value)}
										/>
									</div>
								</div>
							</div>
						</div>
						<div className="col-xs-5 ">
							<div className="row border-topbar-wrapper u_ml_10 ">
								<div className="col-xs-12 text-h4">{resources.str_remarks}</div>
								<div className="col-xs-12 u_mt_8">
									<HtmlInputComponent
										ref={"customer-edit-notes-ref"}
										dataQsId={"customer-edit-notes"}
										placeholder={resources.customerDepositNotesText}
										value={customer.notes}
										onTextChange={(value) => this.onCustomerFieldChange("notes", value)}
									/>

									<div className="customer-edit-notes-alert">
										<label className="notes-alert-label">
											{resources.str_showNoteConfirmation}
										</label>
										<TabInputComponent
											componentClass={"customer-edit-notes-alert-toggle"}
											items={[
												{ label: resources.str_yes, value: "1" },
												{ label: resources.str_no, value: "0" },
											]}
											value={customer.notesAlert ? "1" : "0"}
											onChange={(val) => this.onCustomerFieldChange("notesAlert", val)}
											dataQsId="customer-edit-notesAlert"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	handleOpeningBalanceChange(value, name) {
		const { customer } = this.state;
		let balanceLabel;
		if (value === EXCESS) {
			balanceLabel = EXCESS_LABEL;
		} else if (value === DUES) {
			balanceLabel = DUES_LABEL;
		}
		this.setState({ toggledOpeningBalance: value, openingBalanceLabel: balanceLabel });
	}

	onBalanceChange(value) {
		const { toggledOpeningBalance, customer } = this.state;
		let newValue;
		if (toggledOpeningBalance === EXCESS) {
			newValue = accounting.unformat(value, config.currencyFormat.decimal);
			if (newValue === 0) {
				customer["balance"] = 0;
			} else if (newValue !== customer.balance) {
				customer["balance"] = newValue * -1;
				//customer["openingBalance"] = 0;
			}
			this.setState({ customer });
		} else if (toggledOpeningBalance === DUES) {
			newValue = accounting.unformat(value, config.currencyFormat.decimal);
			if (newValue === 0) {
				customer["openingBalance"] = 0;
			} else if (newValue !== customer.openingBalance) {
				customer["openingBalance"] = newValue;
				//customer["balance"] = 0;
			}
			this.setState({ customer });
		}
	}

	onAddContactPerson() {
		const { customer, salutations, titles } = this.state;
		const { jobTitles, resources } = this.props;

		ModalService.open(
			<EditContactPersonModalComponent
				salutations={salutations}
				titles={titles}
				jobTitles={jobTitles}
				onSalutationsChange={(salutations) => this.setState({ salutations })}
				onTitlesChange={(titles) => this.setState({ titles })}
				onSave={(contactPerson) => {
					ModalService.close();
					customer.contactPersons.push(contactPerson);
					this.setState({ customer });
					invoiz.showNotification(resources.customerContactPersonSaveSuccessMessage);
				}}
				resources={resources}
			/>,
			{
				modalClass: "edit-contact-person-modal-component",
				width: 800,
			}
		);
	}

	onDeleteContactPerson(index) {
		const { customer } = this.state;
		customer.contactPersons.splice(index, 1);
		this.setState({ customer });
	}

	onEditContactPerson(index) {
		const { customer, salutations, titles } = this.state;
		const { jobTitles, resources } = this.props;
		const cP = new ContactPerson(customer.contactPersons[index]);

		ModalService.open(
			<EditContactPersonModalComponent
				contactPerson={cP}
				salutations={salutations}
				titles={titles}
				jobTitles={jobTitles}
				onSalutationsChange={(salutations) => this.setState({ salutations })}
				onTitlesChange={(titles) => this.setState({ titles })}
				onSave={(contactPerson) => {
					ModalService.close();
					customer.contactPersons[index] = contactPerson;
					this.setState({ customer });
				}}
				resources={resources}
			/>,
			{
				modalClass: "edit-contact-person-modal-component",
				width: 800,
			}
		);
	}

	onMobileNumberBlur(value) {
		const { resources } = this.props;
		if (value.length !== 0 && (value.length < 10 || !config.mobileNumberValidation.test(value))) {
			this.setState({ errorMessageMobile: resources.validMobileNumberError });
		} else {
			this.setState({ errorMessageMobile: "" });
		}
	}

	onInputChange(value, name) {
		const customer = JSON.parse(JSON.stringify(this.state.customer));
		if (name === "mobile") {
			this.isMobileNumberValid = value.toString().length < 10 && value.toString().length > 1;
			if (value.toString().length !== 0) {
				if (!config.mobileNumberValidation.test(value)) {
					const { resources } = this.props;
					this.setState({ errorMessageMobile: resources.validMobileNumberError });
				} else {
					this.setState({ errorMessageMobile: "" });
				}
			}
			customer.mobile = value;
		}
		if (name === "email") {
			const { resources } = this.props;
			if (!config.emailCheck.test(value)) {
				if (value.toString().length !== 0) {
					this.isEmailValid = true;
				}
				this.setState({ errorMessageEmail: resources.validEmailError });
			} else {
				this.setState({ errorMessageEmail: "" });
				this.isEmailValid = false;
			}
			customer.email = value;
		}

		this.setState({ customer });
	}

	onCurrencyChange(option) {
		const { customer, currencyRates, defaultExchangeRateToggle, currencyErrorMessage } = this.state;
		if (!customer.address.countryIso) {
			invoiz.page.showToast({
				type: "error",
				message: `Please select a country first!`,
			});
			return;
		} else {
			customer.baseCurrency = option.value;
			const exRateValue = currencyRates.find((item) => item.from === option.value);
			customer.exchangeRate = exRateValue.value;
			this.setState({ customer, defaultExchangeRateToggle: false });
		}
	}

	onExchangeRateChange(value, name) {
		const { customer } = this.state;
		customer.exchangeRate = value;
		this.setState({ customer, defaultExchangeRateToggle: false });
	}

	onDefaultExchangeRateToggle() {
		const { customer, defaultExchangeRateToggle } = this.state;
		this.setState({ customer, defaultExchangeRateToggle: !defaultExchangeRateToggle });
	}

	onCustomerFieldChange(key, value) {
		const { resources } = this.props;
		if (key === "discount" && value > 100) {
			value = "";
			invoiz.showNotification({ message: resources.str_notAllowedGreaterThan, type: "error" });
			return;
		}
		const { customer } = this.state;
		customer[key] = value;
		this.setState({ customer });
	}

	onGstFieldBlur(event) {
		const { resources } = this.props;
		let { gstErrorMessage } = this.state;
		if (!event.value.trim()) {
			gstErrorMessage = resources.gstFieldValidation;
		} else {
			gstErrorMessage = "";
		}
		this.setState({ gstErrorMessage });
	}

	onGSTFieldChange(key, value) {
		const { resources } = this.props;
		const { customer } = this.state;
		let { gstErrorMessage } = this.state;
		customer.address[key] = value;
		// if (!value.trim()) {
		// 	gstErrorMessage = resources.gstFieldValidation;
		// } else {
		// 	gstErrorMessage = '';
		// }
		this.setState({ gstErrorMessage, customer });
	}

	onGSTTypeFieldChange(key, value) {
		const { resources } = this.props;
		const { customer } = this.state;
		//let { gstTypeErrorMessage } = this.state;
		customer.address[key] = value;
		this.setState({ customer });
	}

	onCinFieldBlur(event) {
		const { resources } = this.props;
		let { cinErrorMessage } = this.state;
		if (!event.value.trim()) {
			cinErrorMessage = resources.cinFieldValidation;
		} else {
			cinErrorMessage = "";
		}
		this.setState({ cinErrorMessage });
	}

	onCINFieldChange(key, value) {
		const { resources } = this.props;
		const { customer } = this.state;
		let { cinErrorMessage } = this.state;
		customer.address[key] = value;
		// if (!value.trim()) {
		// 	cinErrorMessage = resources.cinFieldValidation;
		// } else {
		// 	cinErrorMessage = '';
		// }
		this.setState({ cinErrorMessage, customer });
	}

	onStreetFieldChange(key, event) {
		const { customer } = this.state;
		customer.address[key] = event.target.value;
		this.setState({ customer });
	}

	onCountryFieldChange(key, value) {
		const { customer, currencyRates } = this.state;
		customer.address[key] = value.iso2;
		if (value.iso2 !== "IN") {
			customer.indiaState = {};
			this.refreshRates(false, value);
			// {
			// 	id: null,
			// 	stateName: null
			// };
			// const exRateValue = !!value.currency ? currencyRates.find(item => item.from === value.currency) : 0.0;
			// customer.baseCurrency = !!value.currency ? value.currency : customer.baseCurrency;
			// customer.exchangeRate = !!value.currency ? exRateValue.value : customer.exchangeRate;
			this.setState({ customer });
		} else {
			customer.indiaState = {
				id: null,
				stateName: null,
			};
			this.setState({ customer });
		}
	}

	// onZipChange(value) {
	// 	const { customer } = this.state;
	// 	customer.address.zipCode = value;

	// 	this.setState(customer, () => {
	// 		if (value && value.length > 3) {
	// 			invoiz
	// 				.request(`${config.resourceHost}find/city/${encodeURIComponent(value)}`, {
	// 					method: 'GET',
	// 					auth: true
	// 				})
	// 				.then(response => {
	// 					const {
	// 						body: { data: cities }
	// 					} = response;
	// 					const newCityOptions = cities.map(cityData => {
	// 						const zipCode = cityData.zipCodes && cityData.zipCodes[0] && cityData.zipCodes[0].zipCode;
	// 						return { value: cityData.name, label: cityData.name, zipCode };
	// 					});

	// 					if (newCityOptions && newCityOptions[0]) {
	// 						customer.address.city = newCityOptions[0].label;
	// 					}

	// 					this.setState({ customer, cityOptions: newCityOptions || [] });
	// 				});
	// 		}
	// 	});
	// }

	// onCityChange(value) {
	// 	const { customer } = this.state;
	// 	if (!value) {
	// 		customer.address.city = null;
	// 	} else {
	// 		customer.address.city = typeof value === 'string' ? value : value.label;
	// 		if (!customer.address.zipCode || customer.address.zipCode.length < 5) {
	// 			customer.address.zipCode = value.zipCode;
	// 		}
	// 	}

	// 	this.setState({ customer });
	// }

	onEmailBlur(value) {
		const { resources } = this.props;
		let { errorMessageEmail } = this.state;
		if (value.length !== 0 && !config.emailCheck.test(value)) {
			if (value.toString().length !== 0) {
				this.isEmailValid = true;
			}
			errorMessageEmail = resources.validEmailError;
			// this.refs['customerEditEmailInput'].setError(resources.validEmailError);
		} else {
			errorMessageEmail = "";
			this.isEmailValid = false;
		}
		this.setState({ errorMessageEmail });
	}

	onSalutationOrTitleChange(value, isSalutation) {
		const name = !value || !value.name ? "" : value.name;
		const { customer, salutations, titles } = this.state;
		const { resources } = this.props;

		if (isSalutation) {
			customer.salutation = name;
		} else {
			customer.title = name;
		}

		if (value && !value.isExisting) {
			const data = {};
			if (isSalutation) {
				salutations.push(value.name);
				data.salutations = salutations;
			} else {
				titles.push(value.name);
				data.titles = titles;
			}

			invoiz
				.request(`${config.resourceHost}setting/contact`, {
					auth: true,
					method: "POST",
					data,
				})
				.then(() => {
					invoiz.page.showToast({
						message: format(
							resources.tagAddSuccessMessage,
							isSalutation ? resources.str_salutation : resources.str_title,
							value.name
						),
					});
				});
		}

		this.setState({ customer, salutations, titles });
	}

	onStateChanged(indiaStateObj) {
		const { resources } = this.props;
		const { customer } = this.state;
		let { errorMessage } = this.state;
		customer.indiaState = indiaStateObj;
		if (!indiaStateObj) {
			errorMessage = resources.stateFieldValidation;
		} else {
			errorMessage = "";
		}
		this.setState({ customer, errorMessage });
	}

	onTopbarButtonClick(action) {
		switch (action) {
			case "save":
				this.onSave();
				break;
		}
	}

	onSave() {
		const { customer, defaultExchangeRateToggle, planRestricted } = this.state;
		const { resources } = this.props;
		if (customer.kind === CUSTOMER_KIND.COMPANY && !customer.companyName) {
			this.refs["customer-edit-text-input-company-name"] &&
				this.refs["customer-edit-text-input-company-name"].validateAndSetValue();
			return;
		}
		if (customer.kind === CUSTOMER_KIND.PERSON && !customer.firstName) {
			this.refs["customer-edit-text-input-firstname"] &&
				this.refs["customer-edit-text-input-firstname"].validateAndSetValue();
			return;
		}
		// if (customer.kind === CUSTOMER_KIND.PERSON && !customer.lastName) {
		// 	this.refs["customer-edit-text-input-lastname"] &&
		// 		this.refs["customer-edit-text-input-lastname"].validateAndSetValue();
		// 	return;
		// }
		if (customer.address.countryIso === "IN" && customer.indiaState && customer.indiaState.id === null) {
			this.setState({
				errorMessage: resources.stateFieldValidation,
			});
			return;
		}
		if (customer.address.countryIso === "" || !customer.address.countryIso) {
			invoiz.page.showToast({
				type: "error",
				message: `Please select a country!`,
			});
			return;
		}

		if (
			customer.address.countryIso !== "IN" &&
			(customer.baseCurrency === "" || !customer.baseCurrency) &&
			planRestricted
		) {
			invoiz.page.showToast({
				type: "error",
				message: `Please upgrade your Groflex plan to use Multicurrency!`,
			});
			return;
		}

		if (customer.address.countryIso !== "IN" && (customer.baseCurrency === "" || !customer.baseCurrency)) {
			invoiz.page.showToast({
				type: "error",
				message: `Please select a base currency!`,
			});
			return;
		}
		if (
			customer.kind === CUSTOMER_KIND.COMPANY &&
			!customer.address.gstType &&
			customer.address.countryIso === "IN"
		) {
			invoiz.page.showToast({
				type: "error",
				message: `Please select GST Type`,
			});
			return;
		}

		if (
			customer.kind === CUSTOMER_KIND.COMPANY &&
			customer.address.gstType &&
			customer.address.countryIso === "IN"
		) {
			if (customer.address.gstType !== "Unregistered") {
				this.setState({
					gstErrorMessage: resources.gstFieldValidation,
				});
				this.refs["customer-edit-text-input-company-gstNumber"] &&
					this.refs["customer-edit-text-input-company-gstNumber"].validateAndSetValue();
				// return;
			} else {
				this.setState({
					gstErrorMessage: "",
				});
			}
		}

		// if (customer.kind === CUSTOMER_KIND.COMPANY && !customer.address.cinNumber) {
		// 	this.setState({
		// 		cinErrorMessage: resources.cinFieldValidation
		// 	});
		// 	this.refs['customer-edit-text-input-company-cinNumber'] &&
		// 		this.refs['customer-edit-text-input-company-cinNumber'].validateAndSetValue();
		// 	return;
		// }
		if (this.isEmailValid || (customer.email && !config.emailCheck.test(customer.email))) {
			this.setState({ errorMessageEmail: resources.validEmailError });
			return;
		}
		if (this.isMobileNumberValid || (customer.mobile && !config.mobileNumberValidation.test(customer.mobile))) {
			this.setState({ errorMessageMobile: resources.validMobileNumberError });
			return;
		}

		customer.notesAlert = customer.notesAlert === 2 ? false : !!customer.notesAlert;

		const url = `${config.resourceHost}customer${customer.id ? `/${customer.id}` : ""}`;
		const method = customer.id ? "PUT" : "POST";

		if (customer.discount) {
			// customer.discount = accounting.unformat(customer.discount, ',');
			customer.discount = accounting.unformat(customer.discount, config.currencyFormat.decimal);
		}
		if (customer.kind === CUSTOMER_KIND.COMPANY) {
			customer.lastName = "";
			customer.firstName = "";
			customer.lastName = "";
			customer.salutation = "";
			customer.title = "";
		} else if (customer.kind === CUSTOMER_KIND.PERSON) {
			customer.address.cinNumber = "";
			customer.companyName = "";
			customer.companyNameAffix = "";
			customer.address.cinNumber = "";
			customer.address.gstNumber = "";
		}
		if (customer.payConditionId === 0) {
			customer.payConditionId = null;
		}

		customer.defaultExchangeRateToggle = defaultExchangeRateToggle;

		invoiz
			.request(url, {
				auth: true,
				method,
				data: customer,
			})
			.then((response) => {
				const {
					body: {
						data: { id },
					},
				} = response;
				amplitude.getInstance().logEvent("created_customer");
				invoiz.router.navigate(`/customer/${id}`);
			})
			.catch((error) => {
				// if (error.body.meta.number && error.body.meta.number[0].code === errorCodes.EXISTS)
				if (
					error.body &&
					error.body.meta &&
					error.body.meta.number &&
					error.body.meta.number[0] &&
					error.body.meta.number[0].code
				) {
					invoiz.page.showToast({
						type: "error",
						message: resources.customerNumberAlreadyExistError,
					});
				} else {
					invoiz.showNotification({ message: resources.defaultErrorMessage, type: "error" });
				}
			});
	}

	onCancel() {
		window.history.back();
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return {
		resources,
	};
};

export default connect(mapStateToProps)(CustomerEditComponent);
