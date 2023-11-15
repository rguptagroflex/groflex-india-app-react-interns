import invoiz from "services/invoiz.service";
import React from "react";
// import moment from 'moment';
import Decimal from "decimal.js";
import config from "config";
import TopbarComponent from "shared/topbar/topbar.component";
import LetterHeaderComponent from "shared/letter/letter-header.component";
import LetterSenderComponent from "shared/letter/letter-sender.component";
import RecipientComponent from "shared/recipient/recipient.component";
import LetterMetaComponent from "shared/letter/letter-meta.component";
import ModalService from "services/modal.service";
import LetterTitleComponent from "shared/letter/letter-title.component";
import HtmlInputComponent from "shared/inputs/html-input/html-input.component";
import Invoice from "models/invoice.model";
import LetterPositionsHeadComponent from "shared/letter/letter-positions-head.component";
import LetterPositionsComponent from "shared/letter/letter-positions.component";
import LetterPositionsTotalComponent from "shared/letter/letter-positions-total.component";
import LetterFooterComponent from "shared/letter/letter-footer.component";
import LetterPayConditionsComponent from "shared/letter/letter-pay-conditions.component";
import LetterPaymentComponent from "shared/letter/letter-payment.component";
import { connect, Provider } from "react-redux";
import Customer from "models/customer.model";
import { handleTransactionFormErrors } from "helpers/errors";
import { generateUuid } from "helpers/generateUuid";
import RecurringInvoiceSettingsComponent from "shared/recurring-invoice-settings/recurring-invoice-settings.component";
import ProjectSettingsComponent from "shared/project-settings/project-settings.component";
import Letter from "models/letter/letter.model";
// import { formatDate } from 'helpers/formatDate';
import { formatClientDate, formateClientDateMonthYear } from "helpers/formatDate";
import { updateArticles } from "helpers/transaction/updateArticles";
import { updateExpenseArticles } from "helpers/transaction/updateExpenseArticles";
import { saveInventory } from "helpers/transaction/saveInventory";
import { saveInvoice } from "helpers/transaction/saveInvoice";
import { saveCustomer } from "helpers/transaction/saveCustomer";
import { saveRecurringInvoice } from "helpers/transaction/saveRecurringInvoice";
import { saveTransactionSettings } from "helpers/transaction/saveTransactionSettings";
import { saveProject } from "helpers/transaction/saveProject";
import { savePaymentOptions } from "helpers/transaction/savePaymentOptions";
import { getInvoiceNumber } from "helpers/transaction/getInvoiceNumber";
import { saveOffer } from "helpers/transaction/saveOffer";
import Offer from "models/offer.model";
import { savePurchaseOrder } from "helpers/transaction/savePurchaseOrder";
import PurchaseOrder from "models/purchase-order.model";
// import InvoizPayToggleComponent from 'shared/invoiz-pay/invoiz-pay-toggle.component';
import { formatIban } from "helpers/formatIban";
import { formatNumber } from "helpers/formatNumber";
import { format } from "util";
import { convertToWords } from "helpers/convertRupeesIntoWords";
import ChangeDetection from "helpers/changeDetection";
import WebStorageService from "services/webstorage.service";
import WebStorageKey from "enums/web-storage-key.enum";
import userPermissions from "enums/user-permissions.enum";
import BuyAddonModalComponent from "shared/modals/upgrade/buy-addon-modal.component";
import ChargebeeAddon from "enums/chargebee-addon.enum";
import DeliveryChallan from "../../models/delivery-challan.model";
import { saveDeliveryChallan } from "../../helpers/transaction/saveDeliveryChallan";
import groflexLetterFooterIcon from "../../../assets/images/groflex_name_logo_color_no_tag.png";
import { Link } from "react-router-dom";
// const LETTER_MAX_WIDTH = 925;
// const LETTER_MAX_HEIGHT = 1309;
const changeDetection = new ChangeDetection();

class TransactionEditComponent extends React.Component {
	constructor(props) {
		super(props);

		if (invoiz.cache && invoiz.cache.invoice) {
			const {
				invoice: { customer, times },
			} = invoiz.cache;
			if (customer) {
				const customerData = new Customer(customer);
				props.transaction.setCustomer(customerData);
				invoiz.cache.invoice.customer = null;
			}

			if (times) {
				const positions = this.parseCachedPositions(times);
				props.transaction.positions = positions;
				invoiz.cache.invoice.times = null;
			}
		}
		props.letter.sender = "BILLED TO";
		props.transaction.columns = [
			{
				name: "SNo",
				label: "S.NO",
				active: true,
				required: true,
				editable: false,
			},
			...props.transaction.columns,
		];
		this.state = {
			transaction: props.transaction,
			letter: props.letter,
			miscOptions: props.miscOptions,
			numerationOptions: props.numerationOptions,
			payConditions: props.payConditions,
			paymentSetting: props.paymentSetting,
			letterRecipientState: null,
			recurringInvoice: props.recurringInvoice,
			project: props.project,
			initialInvoizPayData: props.transaction && props.transaction.invoizPayData,
			isActiveComponentHasError: false,
			activeComponent: "none",
			isReloadingLetterHeader: false,
			canCreateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_OFFER),
			canCreateChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_CHALLAN),
			submenuVisible: this.props.isSubmenuVisible,
		};
		this.footerOriginalValues = props.letter.footer.map((column) => column.metaData.html);
		this.onDocumentClick = this.onDocumentClick.bind(this);
		this.createCustomer = false;
		this.updateCustomer = false;
		this.activeComponentHandler = this.activeComponentHandler.bind(this);
	}

	componentDidMount() {
		setTimeout(() => {
			window.scrollTo(0, 0);
		}, 0);
		setTimeout(() => {
			const original = JSON.parse(JSON.stringify(this.state.transaction));
			changeDetection.bindEventListeners();
			changeDetection.setModelGetter(() => {
				const current = JSON.parse(JSON.stringify(this.state.transaction));

				return {
					original,
					current,
				};
			});
		}, 0);
		window.addEventListener("click", this.onDocumentClick);

		if (this.state.transaction.customerData !== "IN" && this.state.transaction.exchangeRate > 0) {
			let newData = {
				outstandingAmount: this.state.transaction.outstandingAmount / this.state.transaction.exchangeRate,
				totalGross: this.state.transaction.totalGross / this.state.transaction.exchangeRate,
				totalNet: this.state.transaction.totalNet / this.state.transaction.exchangeRate,
			};
			this.setState({ transaction: Object.assign({}, this.state.transaction, newData) });
		}
	}

	componentWillUnmount() {
		window.removeEventListener("click", this.onDocumentClick);
		changeDetection.unbindEventListeners();
	}

	componentDidUpdate(prevProps) {
		const { isSubmenuVisible } = this.props;

		if (prevProps.isSubmenuVisible !== isSubmenuVisible) {
			this.setState({ submenuVisible: isSubmenuVisible });
		}
	}

	getInvoizPayPage() {
		const { resources } = this.props;
		const { transaction, initialInvoizPayData, numerationOptions } = this.state;
		let invoizPayData = this.state.transaction && this.state.transaction.invoizPayData;

		if (!invoizPayData && initialInvoizPayData) {
			invoizPayData = initialInvoizPayData;
		}

		const isInvoizPayDisabled =
			!transaction.useAdvancedPaymentOptions ||
			(!transaction.useAdvancedPaymentPayPal && !transaction.useAdvancedPaymentTransfer);

		const accountHolder = (invoizPayData && invoizPayData.bankAccountHolder) || "";
		const iban =
			(invoizPayData && invoizPayData.bankAccountIban && formatIban(invoizPayData.bankAccountIban)) || "";
		const bic = (invoizPayData && invoizPayData.bankAccountBic) || "";
		const amount = transaction && transaction.totalGross ? formatNumber(transaction.totalGross) : "";
		const amountPaypal =
			transaction && transaction.totalGross ? transaction.totalGross.toString().replace(".", ",") : "";
		const purpose =
			transaction &&
			`${resources.str_invoiceNumber} ${getInvoiceNumber(numerationOptions, transaction.state, transaction.number)
				.toString()
				.toUpperCase()}`;
		const paypalLink =
			transaction.useAdvancedPaymentOptions && transaction.useAdvancedPaymentPayPal
				? `https://www.paypal.me/${invoizPayData && invoizPayData.paypalUserName}` +
				  (amountPaypal ? `/${amountPaypal}eur` : "")
				: "";

		const invoizPayCarrier = (
			<div
				className={`carrier ${
					!transaction.useAdvancedPaymentOptions || !transaction.useAdvancedPaymentTransfer ? "disabled" : ""
				}`}
			>
				<img src="/assets/images/bank_transfer_carrier.png" />

				{transaction.useAdvancedPaymentOptions && transaction.useAdvancedPaymentTransfer ? (
					<div>
						<div className="carrier-name">{accountHolder}</div>
						<div className="carrier-iban">{iban}</div>
						<div className="carrier-bic">{bic}</div>
						<div className="carrier-amount">{amount}</div>
						<div className="carrier-purpose">{purpose}</div>
					</div>
				) : null}
			</div>
		);

		const invoizPaypalCode = (
			<div
				className={`qr-code-paypal ${
					!transaction.useAdvancedPaymentOptions || !transaction.useAdvancedPaymentPayPal ? "disabled" : ""
				}`}
			>
				<img src="/assets/images/qr_code_placeholder.png" width="145" />

				<div className="qr-code-logo">
					<img src="/assets/images/paypal.png" width="75" />
					<div>
						{resources.str_scanQRCode}
						<br /> {resources.str_paypalText}
					</div>
					<div className="link">{paypalLink}</div>
				</div>
			</div>
		);
		const invoizGiroCode = (
			<div
				className={`qr-code-girocode ${
					!transaction.useAdvancedPaymentOptions || !transaction.useAdvancedPaymentTransfer ? "disabled" : ""
				}`}
			>
				<img src="/assets/images/qr_code_placeholder.png" width="145" />

				<div className="qr-code-logo">
					<img src="/assets/images/giro-code.png" width="80" />
					<div>
						{resources.str_QRCodeAboutText}
						<br />
						{resources.str_scanBankingAppText}
						<br />
						{resources.str_transferAmountOnline}
					</div>
				</div>
			</div>
		);

		return (
			<div
				className="invoiz-page-elements"
				onClick={() => {
					this.refs.invoizPayToggle && this.refs.invoizPayToggle.openInvoizPaySetupModal();
				}}
			>
				{invoizPayCarrier}
				<div className={`invoiz-page-footer ${isInvoizPayDisabled ? "disabled" : ""}`}>
					<div className="headline">
						{resources.str_convinentOnlinePay}{" "}
						<span className="link">https://sicher-zahlen.de/[Autom. Vergabe]</span>
					</div>
					<div className="sub-headline">{resources.str_furtherPaymentOptions}:</div>
					<div className="qr-codes-wrapper">
						{invoizPaypalCode}
						{invoizGiroCode}
					</div>
				</div>
			</div>
		);
	}

	addParagraphToLetterFooter(columnIndex) {
		const footerArr = this.state.letter.footer;
		footerArr[columnIndex].metaData.html += "<p>................ : ...............</p>";
		this.setState({
			...this.state,
			letter: { ...this.state.letter, footer: footerArr },
		});
	}

	render() {
		const {
			transaction,
			letter,
			letterRecipientState,
			numerationOptions,
			miscOptions,
			payConditions,
			saving,
			recurringInvoice,
			project,
			paymentSetting,
			submenuVisible,
			// ,initialInvoizPayData
		} = this.state;
		const { isRecurring, isProject, isDeposit, isClosing, isOffer, resources, isPurchaseOrder, isDeliveryChallan } =
			this.props;
		// console.log(letter, "letter in transaction edit");
		// console.log(transaction, "transaction in transaction edit");
		// console.log(letter, "letter in transaction edit");

		let title = transaction.id ? resources.editInvoice : resources.str_makeBillText;
		if (isRecurring) {
			title = recurringInvoice.id ? resources.editSubscriptionInvoice : resources.createInvoiceSubscription;
		} else if (isProject) {
			title = resources.createProjectInvoiceInstallment;
		} else if (isDeposit) {
			title = transaction.id ? resources.editbudgetBill : resources.str_createBudgetBill;
		} else if (isClosing) {
			title = transaction.id ? resources.editFinalInvoice : resources.createFinalInvoice;
		} else if (isOffer) {
			title = transaction.id ? resources.editOffer : resources.str_createOffer;
		} else if (isDeliveryChallan) {
			title = transaction.id ? resources.editChallan : resources.str_createChallan;
		} else if (isPurchaseOrder) {
			title = transaction.id ? resources.editPurchaseOrder : resources.str_createPurchaseOrder;
		}
		const topbar = (
			<TopbarComponent
				title={title}
				hasCancelButton={true}
				buttonCallback={() => this.save()}
				buttons={[
					{
						type: "primary",
						label: resources.str_toSave,
						buttonIcon: "icon-check",
						loading: saving,
					},
				]}
			/>
		);

		const deliveryDateField = transaction.infoSectionFields.find((field) => field.name === "deliveryDate");
		const deliveryPeriodField = transaction.infoSectionFields.find((field) => field.name === "deliveryPeriod");

		const noDeliveryDateText =
			!isOffer &&
			!isPurchaseOrder &&
			!isDeliveryChallan &&
			(!deliveryDateField || !deliveryDateField.active) &&
			(!deliveryPeriodField || !deliveryPeriodField.active)
				? resources.invoiceDeliveryPeriodFieldText
				: null;

		if (!isOffer && !isPurchaseOrder && !isDeliveryChallan) {
			paymentSetting.usePayPal = transaction.useAdvancedPaymentPayPal;
			paymentSetting.useTransfer = transaction.useAdvancedPaymentTransfer;
		}
		const classLeft =
			this.props.sideBarVisibleStatic["invoices"].sidebarVisible ||
			this.props.sideBarVisibleStatic["expenditure"].sidebarVisible
				? "alignLeftEdit"
				: "";

		return (
			<div className="transaction-edit-component-wrapper wrapper-has-topbar-with-margin">
				{topbar}

				<div className={`transaction-edit-wrapper ${classLeft}`}>
					{isRecurring ? (
						<RecurringInvoiceSettingsComponent
							onChange={(recurringInvoice) => this.setState({ recurringInvoice })}
							recurringInvoice={recurringInvoice}
							resources={resources}
						/>
					) : null}
					{isProject ? (
						<ProjectSettingsComponent
							onChange={(project) => this.setState({ project })}
							project={project}
							resources={resources}
						/>
					) : null}
					<div className="box transaction-form-page" id="letter-form-measure">
						<div className="transaction-form-header">
							{/* <LetterHeaderComponent
								items={letter.header}
								onCancel={() => this.onLetterHeaderCancel()}
								onFinish={elements => this.onLetterHeaderEdited(elements)}
								resources={resources}
								activeComponentAction={this.activeComponentHandler}
								isActiveComponentHasError={this.state.isActiveComponentHasError}
								activeComponent={this.state.activeComponent}
							/> */}
							{this.state.isReloadingLetterHeader ? null : (
								<LetterHeaderComponent
									items={letter.header}
									onCancel={() => this.onLetterHeaderCancel()}
									onFinish={(elements) => this.onLetterHeaderEdited(elements)}
									resources={resources}
								/>
							)}
						</div>

						<div className="transaction-form-sender">
							<LetterSenderComponent
								value={letter.sender}
								// value={"BILLED TO"}
								onChange={(val) => this.onLetterSenderChange(val)}
								resources={resources}
							/>
						</div>

						<div className="transaction-form-row">
							<div className="transaction-form-recipient-title">
								<RecipientComponent
									transaction={transaction}
									customerData={transaction.customerData}
									recipientState={letterRecipientState}
									onChange={(option, baseCurrency, exchangeRate) =>
										this.onRecipientChange(option, baseCurrency, exchangeRate)
									}
									onCloseEditMode={(
										customerData,
										baseCurrency,
										exchangeRate,
										defaultExchangeRateToggle
									) =>
										this.onRecipientEditClose(
											customerData,
											baseCurrency,
											exchangeRate,
											defaultExchangeRateToggle
										)
									}
									resources={resources}
									activeComponentAction={this.activeComponentHandler}
									isActiveComponentHasError={this.state.isActiveComponentHasError}
									activeComponent={this.state.activeComponent}
									recipientType={isPurchaseOrder ? "payee" : "customer"}
									customerFullData={transaction.customer}
								/>

								<div className="transaction-form-title">
									<LetterTitleComponent
										title={transaction.title}
										placeholder={`${
											isOffer
												? resources.str_offer
												: isPurchaseOrder
												? resources.str_purchaseOrder
												: isDeliveryChallan
												? resources.str_challan
												: resources.str_invoice
										}`}
										onChange={(value) => this.onTitleChange(value)}
									/>
								</div>
							</div>
							<div className="transaction-form-meta">
								<LetterMetaComponent
									numerationOptions={numerationOptions}
									isRecurring={isRecurring}
									recurringInvoice={recurringInvoice}
									data={transaction}
									isOffer={isPurchaseOrder ? false : isOffer}
									isPurchaseOrder={isPurchaseOrder}
									onChange={(transaction) => this.onLetterMetaChange(transaction)}
									resources={resources}
									activeComponentAction={this.activeComponentHandler}
									isActiveComponentHasError={this.state.isActiveComponentHasError}
									activeComponent={this.state.activeComponent}
								/>
							</div>
						</div>

						<div className="transaction-form-textarea outlined">
							<span className="edit-icon" />
							<div className="inline">
								<HtmlInputComponent
									label="Label"
									ref={"transaction-introduction-ref"}
									value={transaction.texts.introduction}
									onBlur={(quill) => this.onIntroductionChange(quill.value)}
								/>
							</div>
						</div>

						<div className="transaction-form-positions">
							<LetterPositionsHeadComponent
								customerData={transaction.customerData}
								positions={transaction.positions}
								columns={transaction.columns}
								isPurchaseOrder={isPurchaseOrder}
								onColumnsClose={(columns) => this.onLetterPositionsColumnsChange(columns)}
							/>

							<LetterPositionsComponent
								transaction={transaction}
								customerData={transaction.customerData}
								ref={"transaction-positions-ref"}
								isDeposit={isProject || isDeposit || isClosing}
								columns={transaction.columns}
								positions={transaction.positions}
								discount={transaction.discount}
								miscOptions={miscOptions}
								priceKind={transaction.priceKind}
								onPositionsChanged={(positions) => this.onLetterPositionsChange(positions)}
								onPriceKindChange={(priceKind) => this.onLetterPriceKindChange(priceKind)}
								resources={resources}
								activeComponentAction={this.activeComponentHandler}
								isActiveComponentHasError={this.state.isActiveComponentHasError}
								activeComponent={this.state.activeComponent}
								recipientType={isPurchaseOrder ? "payee" : "customer"}
								//isOfferOrPurchaseOrder={isOffer || isPurchaseOrder ? false : true}
								isInvoice={isOffer || isPurchaseOrder || isDeliveryChallan ? false : true}
								articlePurchaseOrder={
									isPurchaseOrder ? WebStorageService.getItem(WebStorageKey.ARTICLE_PO_ENTRY) : null
								}
							/>
						</div>

						<div
							className="transaction-form-total"
							style={
								isOffer || isPurchaseOrder || isRecurring || isDeliveryChallan
									? { width: "100%" }
									: { display: "flex" }
							}
						>
							{/* {!isOffer && !isPurchaseOrder && !isRecurring && !isDeliveryChallan && (
								// uncomment when razorpay intrigrate 
								// <div className="transaction-form-payment" style={{ width: "90%" }}>
								// 	<LetterPaymentComponent
								// 		resources={resources}
								// 		onEnablePaymentChange={(paymentData) => this.onEnablePaymentChange(paymentData)}
								// 		onEnablePartialChange={(paymentData) =>
								// 			this.onEnablePartialPayment(paymentData)
								// 		}
								// 		transaction={transaction}
								// 	/>
								// </div>
							)} */}
							<LetterPositionsTotalComponent
								onChange={(value) => this.onLetterPriceKindChange(value)}
								onDiscountChange={(value) => this.onDiscountChange(value)}
								onChargesChange={(value) => this.onAdditionalChargeChange(value)}
								positions={transaction.positions}
								totalDiscount={transaction.totalDiscount}
								additionalCharges={transaction.additionalCharges}
								priceKind={transaction.priceKind}
								resources={resources}
								customerData={transaction.customerData}
								activeComponentAction={this.activeComponentHandler}
								isActiveComponentHasError={this.state.isActiveComponentHasError}
								activeComponent={this.state.activeComponent}
								transaction={transaction}
							/>
						</div>
						{/* </div> */}

						<div className="transaction-positions-totalInWords">
							{transaction.totalGross &&
							transaction.customerData &&
							transaction.customerData.countryIso === "IN"
								? `${resources.str_totalInWords}: ${convertToWords(transaction.totalGross)} ${
										resources.str_only
								  }`
								: ""}
						</div>
						<div className="transaction-no-delivery-date">{noDeliveryDateText}</div>

						{isPurchaseOrder ? (
							<div className="transaction-form-textarea outlined">
								<span className="edit-icon" />
								<div className="inline">
									<HtmlInputComponent
										value={
											transaction.payConditionData &&
											transaction.payConditionData.purchaseOrderText
										}
										ref={"transaction-order-payCondition-ref"}
										onBlur={(quill) => this.onLetterPayConditionsChange(quill.value)}
										placeholder={resources.str_enterPaymentConditions}
									/>
								</div>
							</div>
						) : (
							<div className="transaction-form-pay-conditions">
								<LetterPayConditionsComponent
									autoDunningEnabled={transaction.autoDunningEnabled}
									payConditions={payConditions}
									payConditionId={transaction.payConditionId}
									dunningRecipients={transaction.dunningRecipients}
									isInvoice={!isOffer}
									isPurchaseOrder={isPurchaseOrder}
									onChange={(payConditions, payConditionId, autoDunningEnabled, dunningRecipients) =>
										this.onLetterPayConditionsChange(
											payConditions,
											payConditionId,
											autoDunningEnabled,
											dunningRecipients
										)
									}
									resources={resources}
									activeComponentAction={this.activeComponentHandler}
									isActiveComponentHasError={this.state.isActiveComponentHasError}
									activeComponent={this.state.activeComponent}
								/>
							</div>
						)}

						{isOffer || isPurchaseOrder || isDeliveryChallan ? (
							<div className="transaction-form-textarea outlined">
								<span className="edit-icon" />
								<div className="inline">
									<HtmlInputComponent
										value={
											transaction.deliveryConditionData && transaction.deliveryConditionData.text
										}
										ref={"transaction-delivery-ref"}
										onBlur={(quill) => this.onDeliveryConditionChange(quill.value)}
										placeholder={resources.str_enterDeliveryConditions}
									/>
								</div>
							</div>
						) : null}

						{transaction.smallBusiness && (
							<div className="transaction-form-smallbusiness">{transaction.smallBusinessText}</div>
						)}

						<div className="transaction-form-textarea outlined">
							<span className="edit-icon" />
							<div className="inline">
								<HtmlInputComponent
									value={transaction.texts.conclusion}
									ref={"transaction-conclusion-ref"}
									onBlur={(quill) => this.onConclusionChange(quill.value)}
									placeholder={resources.str_enterSupportOptions}
								/>
							</div>
						</div>

						{/* {
								!isOffer && !isPurchaseOrder && !isRecurring && (
									<div className="transaction-form-payment">
										<LetterPaymentComponent
										resources={resources}
										onEnablePaymentChange={paymentData => this.onEnablePaymentChange(paymentData)}
										onEnablePartialChange={paymentData => this.onEnablePartialPayment(paymentData)}
										transaction={transaction}
										/>
									</div>
								)
							} */}

						<div className="transaction-form-footer">
							<LetterFooterComponent
								ref={`letter-footer-component-ref`}
								columns={letter.footer}
								onSave={(columns) => this.onLetterFooterSave(columns)}
								onChange={(column, value) => this.onLetterFooterChange(column, value)}
								onReset={() => this.onLetterFooterReset()}
								resources={resources}
								addParagraphToLetterFooter={(columnIndex) =>
									this.addParagraphToLetterFooter(columnIndex)
								}
							/>
						</div>
						<div className="last-footer-msg-container">
							{/* <div className="thank-you-msg">
								We thank you for your order and look forward to further cooperation.
							</div> */}
							<div className="groflex-ad">
								<img className="footer-logo" src={groflexLetterFooterIcon} alt="logo" />
								<div>Try Free Invoicing and Accounting software here </div>
								<div>
									<a className="app-link" target="_blank" href="https://app.groflex.in">
										&nbsp;app.groflex.in
									</a>
								</div>
							</div>
						</div>
					</div>
					{/* {isOffer ? null : (
						<div className="row">
							<div className="col-xs-12">
								<InvoizPayToggleComponent
									ref="invoizPayToggle"
									activated={
										transaction.useAdvancedPaymentOptions &&
										(transaction.useAdvancedPaymentPayPal || transaction.useAdvancedPaymentTransfer)
									}
									initialInvoizPayData={initialInvoizPayData}
									invoizPayData={transaction.invoizPayData}
									paymentSetting={paymentSetting}
									onToggled={(invoizPayData, paymentSettingFromModal, isFromCancel) => {
										const { transaction } = this.state;
										const paymentSetting = JSON.parse(JSON.stringify(this.state.paymentSetting));
										const newState = {};

										if (invoizPayData) {
											transaction.invoizPayData = invoizPayData;
											newState.initialInvoizPayData = invoizPayData;
										} else if (transaction.invoizPayData) {
											delete transaction.invoizPayData;
										}

										if (paymentSettingFromModal) {
											if (paymentSettingFromModal.usePayPal) {
												transaction.useAdvancedPaymentPayPal = paymentSetting.usePayPal = true;
											} else {
												transaction.useAdvancedPaymentPayPal = paymentSetting.usePayPal = false;
											}

											if (paymentSettingFromModal.useTransfer) {
												transaction.useAdvancedPaymentTransfer = paymentSetting.useTransfer = true;
											} else {
												transaction.useAdvancedPaymentTransfer = paymentSetting.useTransfer = false;
											}

											if (
												paymentSettingFromModal.usePayPal ||
												paymentSettingFromModal.useTransfer
											) {
												transaction.useAdvancedPaymentOptions = true;
												transaction.acceptUserAgreement = true;
											}

											if (paymentSettingFromModal.financeApiAccountId) {
												paymentSetting.financeApiAccountId =
													paymentSettingFromModal.financeApiAccountId;
											} else {
												delete paymentSetting.financeApiAccountId;
											}
										} else {
											transaction.useAdvancedPaymentOptions = false;
											transaction.acceptUserAgreement = false;
										}

										newState.transaction = transaction;
										newState.paymentSetting = paymentSetting;

										this.setState(newState);
									}}
									resources={resources}
								/>
							</div>
						</div>
					)} */}
					{/* {isOffer ? null : (
						<div className="box transaction-invoiz-page">
							<div className="row">
								<div className="col-xs-12">{this.getInvoizPayPage()}</div>
							</div>
						</div>
					)} */}
					<div className="box transaction-notes">
						<div className="transaction-notes-description">
							<div className="transaction-notes-headline">{resources.str_remarks}</div>

							<div className="transaction-notes-subheadline">
								{format(
									resources.notesRemarkSubHeading,
									isOffer
										? resources.str_theOffer
										: isPurchaseOrder
										? resources.str_purchaseOrderSmall
										: isDeliveryChallan
										? resources.str_challanSmall
										: resources.str_theBill
								)}
							</div>
						</div>

						<div className="transaction-notes-input">
							<HtmlInputComponent
								placeholder={format(
									resources.notesRemarkPlaceholder,
									isOffer
										? resources.thisOfferText
										: isPurchaseOrder
										? resources.str_purchaseOrderSmall
										: isDeliveryChallan
										? resources.str_challanSmall
										: resources.thisBill
								)}
								value={transaction.notes}
								ref={"transaction-notes-ref"}
								onBlur={(quill) => this.onNotesChange(quill.value)}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	onNotesChange(val) {
		const { transaction } = this.state;
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		transaction.notes = val;
		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		this.setState({ transaction: newTransaction });
	}

	onLetterPayConditionsChange(payConditions, payConditionId, autoDunningEnabled, dunningRecipients) {
		const { transaction } = this.state;
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		if (isPurchaseOrder) {
			transaction.payConditionData.purchaseOrderText = payConditions;
			transaction.payConditionData.dueEditable = true;
			const newTransaction = new PurchaseOrder(transaction);
			this.setState({ transaction: newTransaction });
		} else {
			transaction.payConditionId = payConditionId;
			transaction.payConditionData = payConditions.find((cond) => cond.id === payConditionId);
			transaction.autoDunningEnabled = autoDunningEnabled;
			transaction.dunningRecipients = dunningRecipients;
			const newTransaction = isOffer
				? new Offer(transaction)
				: isDeliveryChallan
				? new DeliveryChallan(transaction)
				: new Invoice(transaction);
			this.setState({ payConditions, transaction: newTransaction });
		}
	}

	onLetterPositionsChange(positions) {
		const { transaction } = this.state;
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		transaction.positions = positions;
		//transaction.totalGross = positions.reduce((a, b) => a + b.totalGrossAfterDiscount, 0) || 0;
		transaction.totalNet = positions.reduce((a, b) => a + b.totalNetAfterDiscount, 0) || 0;
		let vatAmounts =
			positions.reduce((a, b) => (a = a + (b.totalGrossAfterDiscount - b.totalNetAfterDiscount)), 0) || 0;
		transaction.totalGross =
			transaction.totalNet -
			transaction.totalNet * (transaction.totalDiscount / 100) +
			vatAmounts +
			Object.values(transaction.additionalCharges).reduce((a, b) => a + b, 0);
		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		this.setState({ transaction: newTransaction });
	}

	onLetterPriceKindChange(priceKind) {
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		const { transaction } = this.state;
		transaction.priceKind = priceKind;
		//transaction.totalDiscount = 0;
		let vatAmounts =
			transaction.positions.reduce(
				(a, b) => (a = a + (b.totalGrossAfterDiscount - b.totalNetAfterDiscount)),
				0
			) || 0;
		transaction.totalGross =
			transaction.totalNet -
			transaction.totalNet * (transaction.totalDiscount / 100) +
			vatAmounts +
			Object.values(transaction.additionalCharges).reduce((a, b) => a + b, 0);
		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		this.setState({ transaction: newTransaction });
	}

	onDiscountChange(discountPercent) {
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		const { transaction } = this.state;
		transaction.totalDiscount = discountPercent;
		transaction.totalNet = transaction.positions.reduce((a, b) => a + b.totalNetAfterDiscount, 0) || 0;
		let vatAmounts =
			transaction.positions.reduce(
				(a, b) => (a = a + (b.totalGrossAfterDiscount - b.totalNetAfterDiscount)),
				0
			) || 0;
		transaction.totalGross =
			transaction.totalNet -
			transaction.totalNet * (transaction.totalDiscount / 100) +
			vatAmounts +
			Object.values(transaction.additionalCharges).reduce((a, b) => a + b, 0);
		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		this.setState({ transaction: newTransaction });
	}

	onAdditionalChargeChange(value) {
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		const { transaction } = this.state;
		transaction.additionalCharges = value;
		transaction.totalNet = transaction.positions.reduce((a, b) => a + b.totalNetAfterDiscount, 0) || 0;
		let vatAmounts =
			transaction.positions.reduce(
				(a, b) => (a = a + (b.totalGrossAfterDiscount - b.totalNetAfterDiscount)),
				0
			) || 0;
		transaction.totalGross =
			transaction.totalNet -
			transaction.totalNet * (transaction.totalDiscount / 100) +
			vatAmounts +
			Object.values(transaction.additionalCharges).reduce((a, b) => a + b, 0);
		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		this.setState({ transaction: newTransaction });
	}

	onLetterPositionsColumnsChange(columns) {
		const { transaction } = this.state;
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		transaction.columns = columns;
		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		this.setState({ transaction: newTransaction });
	}

	onEnablePaymentChange(paymentData) {
		const { transaction } = this.state;
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		transaction.razorpayPaymentData = paymentData;
		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		this.setState({ transaction: newTransaction });
	}

	onEnablePartialPayment(paymentData) {
		const { transaction } = this.state;
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		transaction.razorpayPaymentData = paymentData;
		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		this.setState({ transaction: newTransaction });
	}

	onLetterFooterChange(columns) {
		const { letter } = this.state;
		letter.footer = columns;
		this.setState({ letter });
	}

	onLetterFooterSave(columns) {
		const { resources } = this.props;
		const { letter } = this.state;
		invoiz
			.request(config.letter.endpoints.saveLetterPaperUrl, {
				auth: true,
				method: "POST",
				data: letter,
			})
			.then(() => {
				invoiz.page.showToast({ message: resources.letterFooterSaveSuccessMessage });
			})
			.catch(() => {
				invoiz.page.showToast({ type: "error", message: resources.letterFooterSaveErrorMessage });
			});
	}

	onLetterFooterReset() {
		const { letter } = this.state;
		letter.footer = letter.footer.map((column, index) => {
			column.metaData.html = this.footerOriginalValues[index];
			return column;
		});
		this.setState({ letter });
	}

	onDocumentClick(e) {
		invoiz.trigger("documentClicked", e);
	}

	onIntroductionChange(value) {
		const { transaction } = this.state;
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		transaction.texts.introduction = value;
		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		this.setState({ transaction: newTransaction });
	}

	onConclusionChange(value) {
		const { transaction, isPurchaseOrder, isDeliveryChallan } = this.state;
		const { isOffer } = this.props;
		transaction.texts.conclusion = value;
		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		this.setState({ transaction: newTransaction });
	}

	onDeliveryConditionChange(value) {
		const { transaction } = this.state;
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		transaction.deliveryConditionData.text = value;
		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		this.setState({ transaction: newTransaction });
	}

	onTitleChange(value) {
		const { transaction } = this.state;
		const { isOffer, resources, isPurchaseOrder, isDeliveryChallan } = this.props;
		transaction.title =
			value ||
			(isOffer ? resources.str_offer : isDeliveryChallan ? resources.str_challan : resources.str_invoice);
		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		this.setState({ transaction: newTransaction });
	}

	onLetterHeaderEdited(elements) {
		const { resources } = this.props;
		const { letter } = this.state;
		letter.header = elements;

		this.setState({ letter }, () => {
			invoiz
				.request(config.letter.endpoints.saveLetterPaperUrl, {
					auth: true,
					method: "POST",
					data: letter,
				})
				.then((response) => {
					const {
						body: { data },
					} = response;
					const newLetter = new Letter(data);
					// this.setState({ letter: newLetter });
					this.setState({ isReloadingLetterHeader: true }, () => {
						this.setState({ letter: newLetter, isReloadingLetterHeader: false });
					});
					invoiz.page.showToast({ message: resources.letterHeaderSaveSuccessMessage });
				})
				.catch(() => {
					invoiz.page.showToast({ type: "error", message: resources.letterHeaderSaveErrorMessage });
				});
		});
	}

	onLetterSenderChange(val) {
		const { resources } = this.props;
		const { letter } = this.state;
		letter.sender = val;

		this.setState({ letter }, () => {
			invoiz
				.request(config.letter.endpoints.saveLetterPaperUrl, {
					auth: true,
					method: "POST",
					data: letter,
				})
				.then((response) => {
					const {
						body: { data },
					} = response;
					const newLetter = new Letter(data);
					this.setState({ letter: newLetter });
				})
				.catch(() => {
					invoiz.page.showToast({ type: "error", message: resources.defaultErrorMessage });
				});
		});
	}

	onLetterMetaChange(data) {
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		const { deliveryPeriodStartDate, deliveryPeriodEndDate } = data;
		if (deliveryPeriodStartDate && deliveryPeriodEndDate) {
			// data.deliveryPeriod = `${formatDate(deliveryPeriodStartDate, 'YYYY-MM-DD', 'DD.MM.YY')} - ${formatDate(
			// 	deliveryPeriodEndDate,
			// 	'YYYY-MM-DD',
			// 	'DD.MM.YY'
			// )}`;
			data.deliveryPeriod = `${formateClientDateMonthYear(
				deliveryPeriodStartDate
			)} - ${formateClientDateMonthYear(deliveryPeriodEndDate)}`;
		}
		const newTransaction = isOffer
			? new Offer(data)
			: isPurchaseOrder
			? new PurchaseOrder(data)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(data);
		this.setState({ transaction: newTransaction });
	}

	onRecipientChange(selectedOption, baseCurrency, exchangeRate) {
		const { transaction } = this.state;
		const { isOffer, resources, isPurchaseOrder, isDeliveryChallan } = this.props;
		if (selectedOption) {
			const { customerData } = selectedOption;
			if (customerData.notesAlert) {
				ModalService.open(<div dangerouslySetInnerHTML={{ __html: customerData.notes }} />, {
					headline: isPurchaseOrder ? resources.str_payeeNote : resources.str_cutomerNote,
					cancelLabel: resources.str_shutdown,
					confirmLabel: resources.str_ok,
					confirmIcon: "icon-check",
					onConfirm: () => {
						ModalService.close();
					},
				});
			}

			if (
				!isOffer &&
				!isPurchaseOrder &&
				!isDeliveryChallan &&
				customerData.email &&
				transaction.dunningRecipients &&
				transaction.dunningRecipients.indexOf(customerData.email) < 0
			) {
				transaction.dunningRecipients.push(customerData.email);
			}
			const newTransaction = isOffer
				? new Offer(transaction)
				: isPurchaseOrder
				? new PurchaseOrder(transaction)
				: isDeliveryChallan
				? new DeliveryChallan(transaction)
				: new Invoice(transaction);

			if (customerData.countryIso !== "IN") {
				newTransaction.priceKind = "net";
				newTransaction.baseCurrency = baseCurrency;
				newTransaction.exchangeRate = exchangeRate;
			}
			newTransaction.baseCurrency = customerData.baseCurrency;
			newTransaction.exchangeRate = customerData.exchangeRate;

			newTransaction.setCustomer(customerData);
			newTransaction.positions = this.calculatePositions(newTransaction);
			this.setState({ transaction: newTransaction });
		} else {
			const newTransaction = isOffer
				? new Offer(transaction)
				: isPurchaseOrder
				? new PurchaseOrder(transaction)
				: isDeliveryChallan
				? new DeliveryChallan(transaction)
				: new Invoice(transaction);
			//	if (transaction.countryIso !== "IN") {
			newTransaction.positions = [];
			//	}
			newTransaction.baseCurrency = "";
			newTransaction.exchangeRate = 0.0;
			newTransaction.setCustomer({});
			newTransaction.positions = this.calculatePositions(newTransaction);
			this.setState({ transaction: newTransaction });
		}
		this.updateCustomer = false;
		this.createCustomer = false;
	}

	onRecipientEditClose(customerData, baseCurrency, exchangeRate, defaultExchangeRateToggle) {
		const { isOffer, isPurchaseOrder, isDeliveryChallan } = this.props;
		customerData.name =
			customerData.kind === "company"
				? customerData.companyName
				: customerData.firstName + " " + customerData.lastName;
		const { transaction } = this.state;
		if (customerData.id) {
			this.updateCustomer = true;
		} else {
			this.createCustomer = true;
		}
		//transaction.setCustomer(customerData);
		if (
			customerData.email &&
			transaction.dunningRecipients &&
			transaction.dunningRecipients.indexOf(customerData.email) < 0
		) {
			transaction.dunningRecipients.push(customerData.email);
		}

		const newTransaction = isOffer
			? new Offer(transaction)
			: isPurchaseOrder
			? new PurchaseOrder(transaction)
			: isDeliveryChallan
			? new DeliveryChallan(transaction)
			: new Invoice(transaction);
		newTransaction.setCustomer(customerData);
		if (customerData.countryIso !== "IN" && baseCurrency && exchangeRate) {
			this.createCustomer
				? (newTransaction.customerData.defaultExchangeRateToggle = defaultExchangeRateToggle)
				: customerData.defaultExchangeRateToggle;
			newTransaction.priceKind = "net";
			newTransaction.exchangeRate = exchangeRate;
			newTransaction.baseCurrency = baseCurrency;
			defaultExchangeRateToggle
				? (newTransaction.customerData.exchangeRate = exchangeRate)
				: newTransaction.customerData.exchangeRate;
			defaultExchangeRateToggle
				? (newTransaction.customerData.defaultExchangeRateToggle = defaultExchangeRateToggle)
				: newTransaction.customerData.defaultExchangeRateToggle;
			newTransaction.positions = this.calculatePositions(newTransaction);
		}
		this.setState({ transaction: newTransaction, isActiveComponentHasError: false });
	}

	parseCachedPositions(times) {
		const { resources } = this.props;
		const positions = times.map((time) => {
			const formattedDescription = time.taskDescription.replace(/(\r\n|\n|\r)/gm, "<br/>");
			const positionDescriptionHeaderTime = time.taskDescriptionPrefix ? ` | ${time.taskDescriptionPrefix}` : "";
			// const description = `<div>
			// 	<b>${moment(time.startDate).format(config.dateFormat.client)}${positionDescriptionHeaderTime}</b>
			// 	</div>
			// 	<div>${formattedDescription}</div>
			// `;
			const description = `<div>
				<b>${formatClientDate(time.startDate)}${positionDescriptionHeaderTime}</b>
				</div>
				<div>${formattedDescription}</div>
			`;
			const vatRate = invoiz.user.isSmallBusiness ? 0.0 : config.defualtVatPercent;
			const data = {
				metaData: {
					id: time.id,
					pricePerHour: time.pricePerHour,
					type: "time",
				},
				tempId: generateUuid(),
				unit: resources.str_hrs,
				showDescription: true,
				title: resources.str_time,
				discountPercent: 0,
				vatPercent: vatRate,
				priceNet: time.pricePerHour,
				priceGross: invoiz.user.isSmallBusiness
					? time.pricePerHour
					: new Decimal(time.pricePerHour * (1 + vatRate / 100)).toDP(2).toNumber(),
				amount: time.durationInMinutes / 60,
				description,
			};
			data.totalNet = new Decimal(data.priceNet * data.amount).toDP(2).toNumber();
			data.totalGross = new Decimal(data.priceGross * data.amount).toDP(2).toNumber();
			data.totalNetAfterDiscount = new Decimal(data.totalNet)
				.minus((data.totalNet * data.discountPercent) / 100)
				.toDP(2)
				.toNumber();
			data.totalGrossAfterDiscount = new Decimal(data.totalGross)
				.minus((data.totalGross * data.discountPercent) / 100)
				.toDP(2)
				.toNumber();

			return data;
		});

		return positions;
	}

	save() {
		const { resources, isOffer, isDeliveryChallan } = this.props;
		const { canCreateOffer, canCreateChallan } = this.state;
		this.refs["letter-footer-component-ref"].forceBlur();
		this.refs["transaction-introduction-ref"] && this.refs["transaction-introduction-ref"].blur();
		this.refs["transaction-delivery-ref"] && this.refs["transaction-delivery-ref"].blur();
		this.refs["transaction-conclusion-ref"] && this.refs["transaction-conclusion-ref"].blur();
		this.refs["transaction-notes-ref"] && this.refs["transaction-notes-ref"].blur();
		this.refs["transaction-positions-ref"] && this.refs["transaction-positions-ref"].forceBlur();
		this.refs["transaction-order-payCondition-ref"] && this.refs["transaction-order-payCondition-ref"].blur();

		// Remove offer limitation 25-11-2022
		// if (isOffer && !canCreateOffer) {
		// 	ModalService.open(
		// 		<BuyAddonModalComponent
		// 			price={999}
		// 			addon={ChargebeeAddon.CHARGEBEE_ADDON_QUOTATION}
		// 			heading="Buy Quotation Add-on"
		// 			subheading="Seal business deals swiftly with professional quotations"
		// 			features={[
		// 				"Create professional quotations",
		// 				"Convert them into invoice in single click",
		// 				"Track the status of quotations",
		// 				"Get quotations overviewed in dashboard",
		// 			]}
		// 		/>,
		// 		{
		// 			width: 800,
		// 			padding: 0,
		// 			noTransform: true,
		// 			isCloseable: true,
		// 		}
		// 	);
		// 	return;
		// }
		// Remove offer limitation 25-11-2022 end

		// TODO: Handle subscription later
		// if (isDeliveryChallan && !canCreateChallan) {
		// 	ModalService.open(
		// 		<BuyAddonModalComponent
		// 			price={999}
		// 			addon={ChargebeeAddon.CHARGEBEE_ADDON_QUOTATION}
		// 			heading="Buy Quotation Add-on"
		// 			subheading="Seal business deals swiftly with professional quotations"
		// 			features={[
		// 				"Create professional Delivery Challans",
		// 				"Convert them into invoice in single click",
		// 				"Track the status of Delivery Challans",
		// 				"Get Delivery Challans overviewed in dashboard",
		// 			]}
		// 		/>,
		// 		{
		// 			width: 800,
		// 			padding: 0,
		// 			noTransform: true,
		// 			isCloseable: true,
		// 		}
		// 	);
		// 	return;
		// }

		setTimeout(() => {
			this.setState({ saving: true }, () => {
				const { transaction, paymentSetting } = this.state;
				const { isRecurring, isProject, isDeposit, isOffer, isClosing, isPurchaseOrder, isDeliveryChallan } =
					this.props;
				const requestData = { ...transaction };
				requestData.paymentSetting = paymentSetting;

				requestData.columns = requestData.columns.map((col) => {
					delete col.editable;
					delete col.hidden;
					return { ...col };
				});

				requestData.columns = requestData.columns.filter((c) => c.name != "SNo");

				delete requestData.deliveryPeriodStartDate;
				delete requestData.deliveryPeriodEndDate;

				requestData.infoSectionFields.forEach((field) => {
					if (field.name === "deliveryPeriod") {
						field.value = requestData.deliveryPeriod;
					}
				});

				if (!isOffer && !isPurchaseOrder && !isDeliveryChallan) {
					requestData.cashDiscountSetting = !requestData.cashDiscountSetting.active
						? null
						: requestData.cashDiscountSetting;
				}

				saveTransactionSettings(
					isOffer,
					isPurchaseOrder,
					isDeliveryChallan,
					requestData.infoSectionFields,
					requestData.infoSectionCustomFields,
					// !isProject && !isDeposit && !isClosing && !isOffer && !isPurchaseOrder ? requestData.columns : null
					!isProject && !isDeposit && !isClosing ? requestData.columns : null
				).then(
					() => {
						// console.log("save trans data")
						saveCustomer(
							this.createCustomer || this.updateCustomer ? requestData : null,
							this.createCustomer
						).then(
							(newOrUpdateCustomerData) => {
								// console.log("save customer")
								if (!newOrUpdateCustomerData) {
									if (this.createdCustomerId) {
										requestData.customerId = this.createdCustomerId;
									}
								} else {
									requestData.customerId = newOrUpdateCustomerData.id;
									if (this.createCustomer) {
										this.createdCustomerId = newOrUpdateCustomerData.id;
									}
								}

								if (requestData.customerData) {
									delete requestData.customerData.email;
									if (isRecurring || isDeposit || isClosing) {
										delete requestData.customerData.id;
									}
								}

								this.createCustomer = false;
								this.updateCustomer = false;

								if (isPurchaseOrder) {
									updateExpenseArticles(
										!isProject && !isDeposit && !isClosing ? requestData.positions : null,
										requestData.customerData
									)
										.then(() => this.saveData(requestData))
										.catch((error) => {
											this.setState({ saving: false });
											const errors =
												(error && error.meta) || (error && error.body && error.body.meta);
											handleTransactionFormErrors(null, errors, "purchaseOrder");
										});
								} else {
									updateArticles(
										!isProject && !isDeposit && !isClosing ? requestData.positions : null,
										requestData.customerData
									)
										.then(() => {
											requestData.positions.map((item) => {
												if (!isOffer && !isDeliveryChallan) {
													if (item.trackedInInventory === false) {
														item.itemModifiedDate = requestData.date;
														saveInventory(item, requestData.date);
													}
												}
											});
										})
										.then(() => this.saveData(requestData))
										.catch((error) => {
											this.setState({ saving: false });
											const errors =
												(error && error.meta) || (error && error.body && error.body.meta);
											handleTransactionFormErrors(null, errors, isOffer ? "offer" : "invoice");
										});
								}
							},
							() => {
								this.createCustomer = false;
								this.updateCustomer = false;
								this.setState({ saving: false });
								invoiz.page.showToast({ type: "error", message: `ERROR` });
							}
						);
					},
					(err) => {
						console.log("err saving data", err);
						this.setState({ saving: false });
						invoiz.page.showToast({ type: "error", message: `ERROR` });
					}
				);
			});
		});
	}
	saveData(requestData) {
		// console.log("save data")
		const { resources } = this.props;
		const { recurringInvoice, project } = this.state;
		const { isRecurring, isProject, isDeposit, isOffer, isClosing, isPurchaseOrder, isDeliveryChallan } =
			this.props;
		let redirectUrl = "";
		new Promise((resolve, reject) => {
			if (isProject) {
				project.customerId = requestData.customerId;
				saveProject(project, requestData).then(
					(projectId) => {
						redirectUrl = `project/${projectId}`;
						resolve();
					},
					(error) => {
						reject(error);
					}
				);
			} else if (isRecurring) {
				recurringInvoice.invoiceData = requestData;
				saveRecurringInvoice(recurringInvoice).then(
					(id) => {
						amplitude.getInstance().logEvent("created_recurring_invoice");
						redirectUrl = `recurringinvoice/${id}`;
						resolve();
					},
					(error) => {
						reject(error);
					}
				);
			} else if (isOffer) {
				saveOffer(requestData).then(
					(id) => {
						amplitude.getInstance().logEvent("created_quotation");
						redirectUrl = `offer/${id}`;
						resolve();
					},
					(error) => {
						reject(error);
					}
				);
			} else if (isDeliveryChallan) {
				saveDeliveryChallan(requestData).then(
					(id) => {
						amplitude.getInstance().logEvent("created_delivery_challan");
						redirectUrl = `deliveryChallan/${id}`;
						resolve();
					},
					(error) => {
						reject(error);
					}
				);
			} else if (isPurchaseOrder) {
				savePurchaseOrder(requestData).then(
					(id) => {
						amplitude.getInstance().logEvent("created_purchase_order");
						redirectUrl = `purchase-order/${id}`;
						resolve();
					},
					(error) => {
						reject(error);
					}
				);
			} else {
				saveInvoice(requestData, isDeposit, isClosing).then(
					(id) => {
						redirectUrl = `invoice/${id}`;
						resolve();
					},
					(error) => {
						reject(error);
					}
				);
			}
		}).then(
			() => {
				if (!isOffer && !isPurchaseOrder && !isDeliveryChallan) {
					savePaymentOptions(requestData).then(
						() => {
							invoiz.router.navigate(redirectUrl);
						},
						(err) => {
							this.setState({ saving: false });
							invoiz.page.showToast({
								type: "error",
								message: resources.defaultErrorMessage,
							});
						}
					);
				} else {
					invoiz.router.navigate(redirectUrl);
				}
			},
			(error) => {
				this.setState({ saving: false });
				const errors = (error && error.meta) || (error && error.body && error.body.meta);
				handleTransactionFormErrors(
					null,
					errors,
					isOffer
						? "offer"
						: isPurchaseOrder
						? "purchaseOrder"
						: isDeliveryChallan
						? "deliveryChallan"
						: "invoice"
				);
			}
		);
	}
	calculatePositions(transaction) {
		const { exchangeRate, baseCurrency, customerData } = transaction;
		transaction.positions.forEach((pos) => {
			if (transaction.priceKind === "net") {
				pos.priceGross =
					(customerData && customerData.countryIso !== "IN") || baseCurrency !== ""
						? pos.priceNet * (1 + pos.vatPercent / 100)
						: pos.priceNet;
				pos.priceNet =
					(customerData && customerData.countryIso !== "IN") || baseCurrency !== ""
						? pos.metaData.articlePriceNet / exchangeRate
						: pos.priceNet;
			} else {
				pos.priceNet = pos.priceGross / (1 + pos.vatPercent / 100);
			}
			pos.totalNet = new Decimal(pos.priceNet * pos.amount).toDP(2).toNumber();
			pos.totalGross =
				customerData.countryIso !== "IN" || baseCurrency !== ""
					? pos.totalNet
					: new Decimal(pos.priceGross * pos.amount).toDP(2).toNumber();
			pos.discountPercent = transaction.discount;
			pos.totalNetAfterDiscount = new Decimal(pos.totalNet)
				.minus((pos.totalNet * pos.discountPercent) / 100)
				.toDP(2)
				.toNumber();
			pos.totalGrossAfterDiscount =
				customerData.countryIso !== "IN" || baseCurrency !== ""
					? pos.totalNetAfterDiscount
					: new Decimal(pos.totalGross)
							.minus((pos.totalGross * pos.discountPercent) / 100)
							.toDP(2)
							.toNumber();
			pos.vatPercent = customerData.countryIso !== "IN" || baseCurrency !== "" ? 0 : pos.vatPercent;
		});

		return transaction.positions;
	}

	activeComponentHandler(activeComponent, error) {
		this.setState({ activeComponent });
		if (typeof error !== "undefined") {
			this.setState({
				isActiveComponentHasError: error,
			});
		}
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	const isSubmenuVisible = state.global.isSubmenuVisible;
	const sideBarVisibleStatic = state.global.sideBarVisibleStatic;
	return {
		resources,
		isSubmenuVisible,
		sideBarVisibleStatic,
	};
};
const mapDispatchToProps = (dispatch) => {
	return {
		submenuVisible: (payload) => {
			dispatch(submenuVisible(payload));
		},
	};
};

// export default TransactionEditComponent;
export default connect(mapStateToProps, mapDispatchToProps)(TransactionEditComponent);
