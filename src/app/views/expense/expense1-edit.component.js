import invoiz from "services/invoiz.service";
import React from "react";
import { Link } from "react-router-dom";
import TopbarComponent from "shared/topbar/topbar.component";
import TabInputComponent from "shared/inputs/tab-input/tab-input.component";

import _, { capitalize } from "lodash";
// import moment from 'moment';
import Uploader from "fine-uploader";
import Decimal from "decimal.js";
import { format } from "util";
import config from "config";
import CheckboxInputComponent from "shared/inputs/checkbox-input/checkbox-input.component";
import DateInputComponent from "shared/inputs/date-input/date-input.component";
import RadioInputComponent from "shared/inputs/radio-input/radio-input.component";
import PopoverComponent from "shared/popover/popover.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";

import RecipientComponent from "shared/recipient/recipient.component";
import ModalService from "services/modal.service";
import LetterPositionsHeadComponent from "shared/letter/letter-positions-head.component";
import LetterPositionsComponent from "shared/letter/letter-positions.component";
import LetterPositionsTotalComponent from "shared/letter/letter-positions-total.component";
import Expense from "models/expense.model";
import { updateExpenseArticles } from "helpers/transaction/updateExpenseArticles";
import { saveInventory } from "helpers/transaction/saveInventory";
import { saveExpense } from "helpers/transaction/saveExpense";
import { saveCustomer } from "helpers/transaction/saveCustomer";
import { convertToWords } from "helpers/convertRupeesIntoWords";
import { handleTransactionFormErrors, handleImageError } from "helpers/errors";
import CancelExpenseModalComponent from "shared/modals/cancel-expense-modal.component";
import ChangeDetection from "helpers/changeDetection";
import { formatApiDate } from "helpers/formatDate";
import userPermissions from "enums/user-permissions.enum";
import SelectInput from "../../shared/inputs/select-input/select-input.component";
import TextInputComponent from "../../shared/inputs/text-input/text-input.component";
import { connect } from "react-redux";
import groflexLetterFooterIcon from "../../../assets/images/groflex_name_logo_color_no_tag.png";
import editSvg from "../../../assets/images/svg/editSvg.svg";
import SVGInline from "react-svg-inline";

const changeDetection = new ChangeDetection();

const expanseTypes = { EXPENSE_TYPE: "expense", PURCHASE_TYPE: "purchase" };
class ExpenseEditComponent extends React.Component {
	constructor(props) {
		super(props);
		if (props.expense.columns[0].name.toLowerCase() !== "sno") {
			props.expense.columns = [
				{
					name: "SNo",
					label: "S.NO",
					active: true,
					required: true,
					editable: false,
				},
				...props.expense.columns,
			];
		}
		this.state = {
			expense: this.props.expense || {},
			miscOptions: props.miscOptions,
			letterRecipientState: null,
			isPaid: this.props.expense && this.props.expense.payKind !== "open",
			isModal: this.props.isModal,
			uploadedReceipts: [],
			isActiveComponentHasError: false,
			activeComponent: "none",
			saving: false,
			errorMessageReceiptNo: "",
			paymentMethodOptions: [],
			paymentMethod: "",
		};
		this.onDocumentClick = this.onDocumentClick.bind(this);
		this.createCustomer = false;
		this.updateCustomer = false;
		this.activeComponentHandler = this.activeComponentHandler.bind(this);

		this.filesToDelete = [];
	}

	getBanksList() {
		invoiz.request(`${config.resourceHost}bank`, { auth: true }).then((res) => {
			// console.log(res.body.data, "GET BANKS LIST");
			if (res.body.data.length === 0) {
				invoiz.page.showToast({ type: "error", message: "Please create Cash and Bank first" });
			}
			this.setState({
				...this.state,
				paymentMethodOptions: [...res.body.data].map((bank) => ({
					label: capitalize(bank.bankName),
					value: bank.id,
					type: bank.type,
				})),
			});
		});
	}

	getExpenseType() {
		const routeType = location.pathname.split("/").slice(-1)[0];
		// console.log(routeType, "ROUTETYPE");
		if (routeType === "new-expense") {
			this.setState({ ...this.state, expense: { ...this.state.expense, type: "expense" }, hideRadio: true });
		} else if (routeType === "new-purchase") {
			this.setState({ ...this.state, expense: { ...this.state.expense, type: "purchase" }, hideRadio: true });
		}
	}

	componentDidMount() {
		if (
			this.props.expense.customerData &&
			this.props.expense.purchaseOrder &&
			this.props.expense.purchaseOrder.number
		) {
			const newReceiptNumber = ``;
			this.props.expense.receiptNumber = this.props.expense.receiptNumber
				? this.props.expense.receiptNumber
				: newReceiptNumber;
			this.setState({ expense: this.props.expense });
		}
		if (!invoiz.user.hasPermission(userPermissions.VIEW_EXPENSE)) {
			invoiz.user.logout(true);
		}
		setTimeout(() => {
			this.initDragAndDropUploader();
			this.initManualUploader();
			// this.onTextAreaChange();

			setTimeout(() => {
				const dataOriginal = JSON.parse(JSON.stringify(this.state.expense));
				dataOriginal.receiptCount = this.state.expense.receipts.length;

				changeDetection.bindEventListeners();

				changeDetection.setModelGetter(() => {
					const currentData = JSON.parse(JSON.stringify(this.state.expense));
					currentData.receiptCount = this.state.uploadedReceipts.length;

					return {
						original: dataOriginal,
						current: currentData,
					};
				});
			}, 0);
		});
		window.addEventListener("click", this.onDocumentClick);

		if (this.state.expense.customerData !== "IN" && this.state.expense.exchangeRate > 0) {
			let newData = {
				outstandingAmount: this.state.expense.outstandingAmount / this.state.expense.exchangeRate,
				totalGross: this.state.expense.totalGross / this.state.expense.exchangeRate,
				totalNet: this.state.expense.totalNet / this.state.expense.exchangeRate,
			};
			this.setState({ expense: Object.assign({}, this.state.expense, newData) });
		}

		this.getBanksList();
		this.getExpenseType();
	}

	componentWillUnmount() {
		this.isUnmounted = true;
		window.removeEventListener("click", this.onDocumentClick);
		changeDetection.unbindEventListeners();
	}

	handlePaymentMethodChange(option) {
		if (!option) return;
		let bankdetails = this.state.paymentMethodOptions.find((x) => x.value == option.value);
		const { expense } = this.state;
		expense.payKind = bankdetails.type;
		this.setState({ ...this.state, expense, paymentMethod: option.value, bankDetailId: option.value });
	}

	render() {
		const { expense, letterRecipientState, miscOptions, saving, errorMessageReceiptNo, paymentMethod, isPaid } =
			this.state;
		let title = expense.receiptNumber ? `Expenditure ${expense.receiptNumber}` : `Create expenditure`;
		let subtitle;
		// console.log(this.state, ": IS PAid STATE");

		if (expense.metaData && expense.metaData.expenseCancellation) {
			subtitle = (
				<div>
					(Debit note no.{" "}
					<a
						onClick={() =>
							invoiz.router.redirectTo(
								`/expenses/cancellation/${expense.metaData.expenseCancellation.id}`,
								false,
								false,
								true
							)
						}
					>
						{expense.metaData.expenseCancellation.number}
					</a>{" "}
					{expense.metaData.expenseCancellation.paidAmount > 0 ? `available for utilization` : null})
				</div>
			);
		}
		const purchaseOrderNumber = expense.purchaseOrder && expense.purchaseOrder.number;
		const purchaseOrderId = expense.purchaseOrder && expense.purchaseOrder.id;
		const { resources } = this.props;
		const topbar = this.state.isModal ? null : (
			<TopbarComponent
				title={title}
				subtitle={subtitle}
				// title={this.state.expense.id ? resources.str_editOutput : resources.str_createOutput}
				hasCancelButton={true}
				cancelButtonCallback={() => this.onCancel()}
				buttonCallback={(evt, button) => this.onTopbarButtonClick(button.action)}
				backButtonRoute={"expenses"}
				buttons={[
					{
						type: "primary",
						label: resources.str_toSave,
						buttonIcon: "icon-check",
						action: "save",
						dataQsId: "expense-topbar-button-save",
						loading: saving,
						// disabled: expense.status !== "open",
						disabled: isPaid && !paymentMethod,
					},
					{
						type: "default",
						label: "Cancel", //esources.expenseEditSaveAndCaptureButtonText,
						buttonIcon: "",
						action: "cancel",
						dataQsId: "expense-topbar-button-cancel",
						loading: saving,
						// disabled: expense.status !== "paid",
					},
				]}
			/>
		);

		const isPaidElements =
			this.state.expense.payKind !== "open" ? (
				// <div className="row u_pb_40 u_pt_60">
				<div className="is-paid-elements">
					<div className="col-xs-9 paykind-wrapper">
						{/* <label className="paykind-radio-label">{resources.str_payment}</label> */}
						{/* <RadioInputComponent
							wrapperClass={`paykind-radio-wrapper`}
							options={[
								{ label: resources.str_cash, value: "cash" },
								{ label: resources.str_bank, value: "bank" },
							]}
							value={this.state.expense.payKind || "cash"}
							onChange={() => this.onPaykindChange()}
							dataQsId="expense-edit-paykind"
						/> */}
						<label className="dateInput_label">Payment Method</label>
						<SelectInput
							allowCreate={false}
							notAsync={true}
							loadedOptions={this.state.paymentMethodOptions}
							value={this.state.paymentMethod}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Payment method",
								handleChange: (option) => this.handlePaymentMethodChange(option),
							}}
						/>
					</div>
					<div className="col-xs-9 payment-date">
						<div className="dateInput">
							<label className="dateInput_label">Date</label>
							<DateInputComponent
								name={"expense-pay-date"}
								value={this.state.expense.displayPayDate}
								required={this.state.expense.payKind === "bank"}
								onChange={(name, value, date) => this.onDateChange(name, value, date)}
								dataQsId="expense-edit-date"
							/>
						</div>

						{this.state.expense.financeApiBankTransactionId ? (
							<Link
								className="payment-transaction-link"
								to={`/banking/transactions/${this.state.expense.financeApiBankTransactionId}`}
							>
								{resources.expenseEditPaymentLinkText}
							</Link>
						) : null}
					</div>
				</div>
			) : null;

		let receiptList = null;
		const allReceipts = this.state.expense.receipts.concat(this.state.uploadedReceipts);
		if (allReceipts && allReceipts.length > 0) {
			const receipts = allReceipts.map((receipt, index) => {
				const popoverEntries = [
					{
						label: resources.str_clear,
						action: "delete",
						dataQsId: `expense-upload-delete-${index}`,
					},
				];

				if (receipt.url) {
					popoverEntries.push({
						label: resources.str_preview,
						action: "preview",
						dataQsId: `expense-upload-preview-${index}`,
					});
				}

				return (
					<div className="expenseEdit_fileListRow" key={`receipt-item-${index}`}>
						<div className="expenseEdit_fileIcon icon icon-attachment" />
						<div className="list_item">{receipt.name}</div>
						{this.state.isModal ? (
							<div
								className="list_item list_control icon icon-close"
								onClick={() => this.onUploadDropdownEntryClick(index, { action: "delete" })}
							/>
						) : (
							<div
								onClick={() => this.onUploadDropdownClick(index)}
								id={`expense-upload-dropdown-anchor-${index}`}
								className="list_item list_control icon icon-arr_down"
							>
								<PopoverComponent
									entries={[popoverEntries]}
									elementId={`expense-upload-dropdown-anchor-${index}`}
									offsetLeft={23}
									offsetTop={10}
									arrowOffset={22}
									ref={`expense-upload-popover-${index}`}
									onClick={(entry) => this.onUploadDropdownEntryClick(index, entry)}
								/>
							</div>
						)}
					</div>
				);
			});
			receiptList = <div className="expense-receipt-list">{receipts}</div>;
		}
		const convertedFormPurchaseOrder = purchaseOrderNumber ? (
			<div className="text-muted font-size-small">
				Purchase Order No.: <Link to={`/purchase-order/${purchaseOrderId}`}>{purchaseOrderNumber}</Link>
			</div>
		) : null;

		console.log(this.state, "Expense edit state");
		return (
			<div
				className={`expense1-edit-component-wrapper ${
					this.props.isSubmenuVisible ? "expenseEditLeftAlign" : ""
				}`}
			>
				{topbar}

				<div className="box wrapper-has-topbar-with-margin expense-edit-form">
					{/* <div className="row">
						<div className="col-xs-8">
							<div className="text-h4 heading">
								{resources.str_details}
								{convertedFormPurchaseOrder}
							</div>
						</div>

						<div className="col-xs-4">
							<div className=" u_pt_60">
								About to change to radio
								<TabInputComponent
										key="toggleExpensePurchase"
										items={[{ label: "Expense", value: "expense" }, { label:"Purchase", value:"purchase" }]}
										value={this.state.expense.type}
										componentClass="dashboard-tab-input"
										dataQsId="dashboard-topSalesStats-tabs-yearMonth"
										onChange={e => this.onExpenseTypeChage(e)}
									/>
							</div>
						</div>
					</div> */}
					<div className="row">
						<div className="col-xs-6">
							{/* <div className={`letter-positions-total-content`}>
								<div className="text-h4 letter-positions-radio">
									{this.state.hideRadio ? (
										capitalize(this.state.expense.type)
									) : (
										<RadioInputComponent
											// useCustomStyle={true}
											key="toggleExpensePurchase"
											options={[
												{ label: "Expense", value: "expense" },
												{ label: "Purchase", value: "purchase" },
											]}
											value={this.state.expense.type}
											onChange={(e) => {
												this.onExpenseTypeChage(e);
											}}
											dataQsId="dashboard-topSalesStats-tabs-yearMonth"
										/>
									)}
								</div>
							</div> */}
							<div className="expense-type-tabs">
								<div
									className={`expense-type-option ${
										this.state.expense.type === "expense" ? "active-option" : ""
									}`}
									onClick={() => this.onExpenseTypeChage("expense")}
								>
									Expense
								</div>
								<div
									className={`expense-type-option ${
										this.state.expense.type === "purchase" ? "active-option" : ""
									}`}
									onClick={() => this.onExpenseTypeChage("purchase")}
								>
									Purchase
								</div>
							</div>
						</div>
					</div>

					<div className="row invoice-number-date-container">
						{/* <div className="col-xs-12 u_pt_28"> */}
						<div className="col-xs-6 u_pt_28">
							<div className="row">
								<div
									className="col-xs-12 text-h5 font-16px u_mb_16"
									// style={{ fontSize: "16px", fontWeight: 600 }}
								>
									{"RECEIVED FROM"}
								</div>
							</div>
							<div className="row">
								<div className="col-xs-12">
									<RecipientComponent
										transaction={expense}
										customerData={expense.customerData}
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
										recipientType={"payee"}
									/>
								</div>
							</div>
						</div>
						<div className="col-xs-6 u_pt_28">
							<div className="row" style={{ flexDirection: "row-reverse" }}>
								<div className="row col-xs-9 u_mb_6">
									<div style={{ display: "flex", alignItems: "center" }} className="col-xs-5">
										<b style={{ color: "#888787", fontWeight: 600 }}>Invoice No.*</b>
									</div>
									<div className="col-xs-2 u_pt_4">-</div>
									<div className="col-xs-5 invoice-no-input-container">
										<TextInputExtendedComponent
											name="expense-receipt-no"
											dataQsId="expense-edit-receipt-no"
											value={this.state.expense.receiptNumber}
											onChange={(value) => this.onReceiptNoChange(value)}
											errorMessage={errorMessageReceiptNo}
										/>
									</div>
								</div>
								<div className="row col-xs-9">
									<div style={{ display: "flex", alignItems: "center" }} className="col-xs-5">
										<b style={{ color: "#888787", fontWeight: 600 }}>Invoice Date*</b>
									</div>
									<div className="col-xs-2 u_pt_4">-</div>
									<div className="col-xs-5">
										<div className="dateInput">
											<DateInputComponent
												dataQsId="expense-edit-booking-date"
												name={"expense-booking-date"}
												value={this.state.expense.displayDate}
												required={true}
												onChange={(name, value, date) => this.onDateChange(name, value, date)}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Old invoice date container */}
					{/* <div className="row">
						<div className="col-xs-6">
							<div>
								<b>Invoice No.</b>
							</div>
							<div style={{ padding: "0" }} className="col-xs-12">
								<TextInputExtendedComponent
									name="expense-receipt-no"
									dataQsId="expense-edit-receipt-no"
									value={this.state.expense.receiptNumber}
									onChange={(value) => this.onReceiptNoChange(value)}
									errorMessage={errorMessageReceiptNo}
								/>
							</div>
						</div>
						<div className="col-xs-6">
							<div style={{ marginBottom: "19px" }}>
								<b>Invoice Date</b>
							</div>
							<div style={{ padding: "0" }} className="col-xs-12">
								<div className="dateInput">
									<DateInputComponent
										dataQsId="expense-edit-booking-date"
										name={"expense-booking-date"}
										value={this.state.expense.displayDate}
										required={true}
										onChange={(name, value, date) => this.onDateChange(name, value, date)}
									/>
								</div>
							</div>
						</div>
					</div> */}

					<div style={{ display: "none" }} className="row u_pb_40">
						<div className="col-xs-6">
							{/* <div className="textarea">
								<label className="textarea_label">{resources.str_description}</label>
								<textarea
									data-qs-id="expense-edit-description"
									id="expense-edit-textarea"
									className="textarea_input"
									rows="3"
									defaultValue={this.state.expense.description}
									placeholder={resources.str_pasteYourDataHere}
									onChange={() => this.onTextAreaChange()}
								/>
								<span className="textarea_bar" />
							</div> */}
							<div className="dateInput">
								<label className="dateInput_label">{`Issued invoice date`}</label>
								<DateInputComponent
									dataQsId="expense-edit-booking-date"
									name={"expense-booking-date"}
									value={this.state.expense.displayDate}
									required={true}
									onChange={(name, value, date) => this.onDateChange(name, value, date)}
								/>
							</div>
						</div>
						<div className="col-xs-6">
							{/* <div className="dateInput">
								<label className="dateInput_label">{resources.str_documentDate}</label>
								<DateInputComponent
									dataQsId="expense-edit-booking-date"
									name={'expense-booking-date'}
									value={this.state.expense.displayDate}
									required={true}
									onChange={(name, value, date) => this.onDateChange(name, value, date)}
								/>
							</div> */}
							<TextInputExtendedComponent
								name="expense-receipt-no"
								dataQsId="expense-edit-receipt-no"
								value={this.state.expense.receiptNumber}
								label={"Issued invoice no."}
								//placeholder={"Enter issued invoice no."}
								onChange={(value) => this.onReceiptNoChange(value)}
								//errorMessage={errorMessageReceiptNo}
							/>
						</div>
					</div>
					<div className="text-h4 heading u_mt_40">Articles</div>
					<div className="row u_mb_40">
						<div className="col-xs-12">
							<div className="transaction-form-positions">
								<LetterPositionsHeadComponent
									customerData={expense.customerData}
									positions={expense.positions}
									columns={expense.columns}
									onColumnsClose={(columns) => this.onLetterPositionsColumnsChange(columns)}
								/>
								<LetterPositionsComponent
									ref={"transaction-positions-ref"}
									transaction={expense}
									customerData={expense.customerData}
									isDeposit={false}
									documentDate={expense.date}
									columns={expense.columns}
									positions={expense.positions}
									discount={expense.discount}
									miscOptions={miscOptions}
									priceKind={expense.priceKind}
									onPositionsChanged={(positions) => this.onLetterPositionsChange(positions)}
									onPriceKindChange={(priceKind) => this.onLetterPriceKindChange(priceKind)}
									resources={resources}
									activeComponentAction={this.activeComponentHandler}
									isActiveComponentHasError={this.state.isActiveComponentHasError}
									activeComponent={this.state.activeComponent}
									recipientType={"payee"}
									isInvoice={true}
								/>
							</div>
							<div className="transaction-form-total">
								<div className="expense-edit-ispaid">
									<CheckboxInputComponent
										dataQsId="expense-edit-ispaid"
										name={"isPaid"}
										label={resources.str_paid}
										// checked={expense.payKind !== "open"}
										checked={expense.payKind === "cash" || expense.payKind === "bank"}
										onChange={() => this.onPaidChange()}
									/>
									{isPaidElements}
								</div>
								<div className="letter-total-container">
									<LetterPositionsTotalComponent
										onChange={(value) => this.onLetterPriceKindChange(value)}
										onDiscountChange={(value) => {
											this.onDiscountChange(value);
										}}
										onChargesChange={(value) => {
											this.onAdditionalChargeChange(value);
										}}
										totalDiscount={expense.totalDiscount}
										positions={expense.positions}
										priceKind={expense.priceKind}
										additionalCharges={expense.additionalCharges}
										resources={resources}
										customerData={expense.customerData}
										activeComponentAction={this.activeComponentHandler}
										isActiveComponentHasError={this.state.isActiveComponentHasError}
										activeComponent={this.state.activeComponent}
										transaction={expense}
									/>
									<div className="transaction-positions-totalInWords">
										{expense.totalGross
											? `Total amount (in words): ${convertToWords(expense.totalGross)} ${
													resources.str_only
											  }`
											: ""}
									</div>
								</div>
							</div>
						</div>
					</div>
					{/* <div className="text-h4 heading">{resources.expenseEditDocumentHeading}</div> */}
					<div className="text-h4 heading font-16px">UPLOAD ISSUED INVOICE</div>
					<div className="row">
						<div style={{ margin: "0 auto" }} className="col-xs-7">
							{receiptList}
							<div
								id="expense-receipt-dropbox"
								className="expense-edit-drop-box drop-box text-center u_p_10 u_mb_1"
								data-qs-id="expense-edit-receipt-upload"
							>
								<label className="text-muted">
									{/* <p className="upload-image">
										<img src="/assets/images/svg/impress_bild.svg" height="100" />
									</p> */}
									<p className="font-16px">
										<span className="color-primary font-600">
											<SVGInline
												svg={editSvg}
												width="16px"
												height="16px"
												className="vertically-middle"
											/>{" "}
											Upload
										</span>{" "}
										Or Drop a file
									</p>
									<input
										className="u_hidden"
										type="file"
										onChange={this.addSelectedFile.bind(this)}
									/>
								</label>
							</div>
						</div>
					</div>
					<div className="u_mt_10 font-16px" style={{ textAlign: "center" }}>
						Upload an issued invoiced by <span className="font-600">Drag & Drop</span> or{" "}
						<span onClick={() => this.addSelectedFile.bind(this)} className="font-600">
							Click Here
						</span>{" "}
						to select one
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
			</div>
		);
	}

	onDocumentClick(e) {
		invoiz.trigger("documentClicked", e);
	}

	onRecipientChange(selectedOption, baseCurrency, exchangeRate) {
		const { expense } = this.state;
		const { resources } = this.props;
		if (selectedOption) {
			const { customerData } = selectedOption;

			// if (customerData.notesAlert) {
			// 	ModalService.open(<div dangerouslySetInnerHTML={{ __html: customerData.notes }} />, {
			// 		headline: resources.str_cutomerNote,
			// 		cancelLabel: resources.str_shutdown,
			// 		confirmLabel: resources.str_ok,
			// 		confirmIcon: "icon-check",
			// 		onConfirm: () => {
			// 			ModalService.close();
			// 		},
			// 	});
			// }

			const newExpense = new Expense(expense);
			if (customerData.countryIso !== "IN") {
				newExpense.baseCurrency = baseCurrency;
				newExpense.exchangeRate = exchangeRate;
			}
			newExpense.baseCurrency = customerData.baseCurrency;
			newExpense.exchangeRate = customerData.exchangeRate;
			newExpense.setCustomer(customerData);
			newExpense.positions = this.calculatePositions(newExpense);
			this.setState({ expense: newExpense });
		} else {
			expense.setCustomer({});
			const newExpense = new Expense(expense);
			newExpense.positions = [];
			newExpense.baseCurrency = "";
			newExpense.exchangeRate = 0.0;
			newExpense.positions = this.calculatePositions(newExpense);
			this.setState({ expense: newExpense });
		}
		this.updateCustomer = false;
		this.createCustomer = false;
	}

	onRecipientEditClose(customerData, baseCurrency, exchangeRate, defaultExchangeRateToggle) {
		customerData.name =
			customerData.kind === "company"
				? customerData.companyName
				: customerData.firstName + " " + customerData.lastName;
		const { expense } = this.state;
		if (customerData.id) {
			this.updateCustomer = true;
		} else {
			this.createCustomer = true;
		}
		//expense.setCustomer(customerData);

		const newExpense = new Expense(expense);
		newExpense.setCustomer(customerData);
		if (customerData.countryIso !== "IN" && baseCurrency && exchangeRate) {
			this.createCustomer
				? (newExpense.customerData.defaultExchangeRateToggle = defaultExchangeRateToggle)
				: customerData.defaultExchangeRateToggle;
			newExpense.exchangeRate = exchangeRate;
			newExpense.baseCurrency = baseCurrency;
			defaultExchangeRateToggle
				? (newExpense.customerData.exchangeRate = exchangeRate)
				: newExpense.customerData.exchangeRate;
			defaultExchangeRateToggle
				? (newExpense.customerData.defaultExchangeRateToggle = defaultExchangeRateToggle)
				: newExpense.customerData.defaultExchangeRateToggle;
			newExpense.positions = this.calculatePositions(newExpense);
		}
		this.setState({ expense: newExpense, isActiveComponentHasError: false });
	}

	onLetterPositionsColumnsChange(columns) {
		const { expense } = this.state;
		expense.columns = columns;
		const newExpense = new Expense(expense);
		this.setState({ expense: newExpense });
	}

	onLetterPositionsChange(positions) {
		const { expense } = this.state;
		expense.positions = positions;
		//expense.totalGross = positions.reduce((a, b) => a + b.totalGrossAfterDiscount, 0) || 0;
		expense.totalNet = positions.reduce((a, b) => a + b.totalNetAfterDiscount, 0) || 0;
		let vatAmounts =
			expense.positions.reduce((a, b) => (a = a + (b.totalGrossAfterDiscount - b.totalNetAfterDiscount)), 0) || 0;
		expense.totalGross =
			expense.totalNet -
			expense.totalNet * (expense.totalDiscount / 100) +
			vatAmounts +
			Object.values(expense.additionalCharges).reduce((a, b) => a + b, 0);
		const newExpense = new Expense(expense);
		this.setState({ expense: newExpense });
	}

	onLetterPriceKindChange(priceKind) {
		const { expense } = this.state;
		expense.priceKind = priceKind;
		//expense.totalDiscount = 0;
		let vatAmounts =
			expense.positions.reduce((a, b) => (a = a + (b.totalGrossAfterDiscount - b.totalNetAfterDiscount)), 0) || 0;
		expense.totalGross =
			expense.totalNet -
			expense.totalNet * (expense.totalDiscount / 100) +
			vatAmounts +
			Object.values(expense.additionalCharges).reduce((a, b) => a + b, 0);
		// console.log(expense, "before");
		const newExpense = new Expense(expense);
		// console.log(newExpense, "after");
		this.setState({ expense: newExpense });
	}

	onDiscountChange(discountPercent) {
		const { expense } = this.state;
		expense.totalDiscount = discountPercent;
		expense.totalNet = expense.positions.reduce((a, b) => a + b.totalNetAfterDiscount, 0) || 0;
		let vatAmounts =
			expense.positions.reduce((a, b) => (a = a + (b.totalGrossAfterDiscount - b.totalNetAfterDiscount)), 0) || 0;
		expense.totalGross =
			expense.totalNet -
			expense.totalNet * (expense.totalDiscount / 100) +
			vatAmounts +
			Object.values(expense.additionalCharges).reduce((a, b) => a + b, 0);
		const newExpense = new Expense(expense);
		this.setState({ expense: newExpense });
	}

	onAdditionalChargeChange(value) {
		const { expense } = this.state;
		expense.additionalCharges = value;
		expense.totalNet = expense.positions.reduce((a, b) => a + b.totalNetAfterDiscount, 0) || 0;
		let vatAmounts =
			expense.positions.reduce((a, b) => (a = a + (b.totalGrossAfterDiscount - b.totalNetAfterDiscount)), 0) || 0;
		expense.totalGross =
			expense.totalNet -
			expense.totalNet * (expense.totalDiscount / 100) +
			vatAmounts +
			Object.values(expense.additionalCharges).reduce((a, b) => a + b, 0);
		const newExpense = new Expense(expense);
		this.setState({ expense: newExpense });
	}

	activeComponentHandler(activeComponent, error) {
		this.setState({
			activeComponent,
		});
		if (typeof error !== "undefined") {
			this.setState({
				isActiveComponentHasError: error,
			});
		}
	}

	calculatePositions(expense) {
		const { exchangeRate, baseCurrency, customerData } = expense;
		expense.positions.forEach((pos) => {
			if (invoiz.user.isSmallBusiness || expense.priceKind === "net") {
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
			pos.discountPercent = expense.discount;
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
		return expense.positions;
	}

	onUploadDropdownClick(index) {
		this.refs[`expense-upload-popover-${index}`].show();
	}

	onUploadDropdownEntryClick(index, entry) {
		if (entry.action === "delete") {
			const receipts = this.state.expense.receipts.concat(this.state.uploadedReceipts);
			this.filesToDelete.push(receipts[index].id);

			const { expense } = this.state;
			expense.receipts = this.state.expense.receipts.filter((receipt) => {
				return this.filesToDelete.indexOf(receipt.id) === -1;
			});

			const uploadedReceipts = this.state.uploadedReceipts.filter((receipt) => {
				return this.filesToDelete.indexOf(receipt.id) === -1;
			});

			this.setState({ uploadedReceipts, expense });
		} else if (entry.action === "preview") {
			const url = `${config.resourceHost}${this.state.expense.receipts[index].url}`;
			window.open(url);
		}
	}

	onPaidChange() {
		let { isPaid } = this.state;
		const { expense } = this.state;

		isPaid = !isPaid;

		if (expense.payKind === "open") {
			expense.payKind = "cash";
			// expense.payDate = moment().format('YYYY-MM-DD');
			expense.payDate = formatApiDate();
			//expense.status='paid'   do while saving
		} else {
			expense.payKind = "open";
			expense.payDate = null;
			//expense.status='open'
		}

		this.setState({ expense, isPaid });
	}

	onDateChange(name, value, date) {
		const { expense } = this.state;
		switch (name) {
			case "expense-booking-date":
				// expense.date = moment(date).format('YYYY-MM-DD');
				expense.date = formatApiDate(date);

				break;
			case "expense-pay-date":
				// expense.payDate = moment(date).format('YYYY-MM-DD');
				expense.payDate = formatApiDate(date);
				break;
		}
	}

	onPaykindChange() {
		const { expense } = this.state;

		expense.payKind = expense.payKind === "cash" ? "bank" : "cash";

		this.setState({ expense });
	}

	// onTextAreaChange() {
	// 	const { expense } = this.state;
	// 	const value = $('#expense-edit-textarea').val();
	// 	const rows = Math.max(1 + (value.match(/\n/g) || []).length, 3);

	// 	expense.description = value && value.trim();

	// 	$('#expense-edit-textarea').attr('rows', rows);

	// 	if (!this.isUnmounted) {
	// 		this.setState({ expense });
	// 	}
	// }

	onReceiptNoChange(value) {
		const { expense, errorMessageReceiptNo } = this.state;

		expense.receiptNumber = value;

		this.setState({ expense, errorMessageReceiptNo: "" });
	}

	onExpenseTypeChage(value) {
		const { expense } = this.state;
		expense.type = value;
		this.setState({ expense });
	}

	onTopbarButtonClick(action) {
		const { resources } = this.props;
		const { expense, errorMessageReceiptNo } = this.state;
		switch (action) {
			case "save":
				if (expense.positions.length === 0) {
					invoiz.page.showToast({ type: "error", message: `Please add atleast one article!` });
				} else if (expense.customerData === null || expense.customerData === undefined) {
					invoiz.page.showToast({ type: "error", message: `Please enter a payee!` });
				} else if (expense.receiptNumber === "") {
					this.setState({ errorMessageReceiptNo: "Please enter a receipt number!" });
					invoiz.page.showToast({ type: "error", message: `Please enter a receipt number!` });
				} else if (
					expense.receiptNumber !== "" &&
					errorMessageReceiptNo === "" &&
					expense.positions.length !== 0 &&
					expense.customerData !== undefined
				) {
					ModalService.open(
						`Please note, expenses that are not marked as paid will not reflect in the GST export file!`,
						{
							width: 600,
							headline: `Save expense`,
							cancelLabel: resources.str_abortStop,
							// confirmIcon: "icon-check",
							confirmLabel: `Save now`,
							confirmButtonType: "primary",
							onConfirm: () => {
								this.save(false);
								ModalService.close();
							},
						}
					);
				}
				break;

			case "saveAndCreate":
				if (
					expense.receiptNumber !== "" &&
					errorMessageReceiptNo === "" &&
					expense.positions.length !== 0 &&
					expense.customerId !== null
				) {
					this.save(true);
					invoiz.page.showToast({ message: resources.expenseSaveSuccessMessage });
				} else {
					this.setState({ errorMessageReceiptNo: "Please enter a receipt number!" });
					invoiz.page.showToast({ type: "error", message: `Please enter a receipt number!` });
				}

				break;
			case "cancel": {
				this.setState({ isPaid: false });
				this.cancelExpense();
			}
		}
	}

	cancelExpense() {
		const { expense } = this.state;
		const { resources } = this.props;
		ModalService.open(<CancelExpenseModalComponent expense={expense} resources={resources} />, {
			//headline: format(resources.invoiceCancelHeading, invoice.number),
			width: 800,
		});
	}

	save(createNew) {
		const { resources } = this.props;
		this.refs["transaction-positions-ref"] && this.refs["transaction-positions-ref"].forceBlur();

		setTimeout(() => {
			this.setState({ saving: true }, () => {
				const { expense } = this.state;
				const requestData = { ...expense };
				requestData.columns = requestData.columns.map((col) => {
					delete col.editable;
					delete col.hidden;
					return { ...col };
				});

				if (requestData.payKind === "open") {
					delete requestData.payDate;
				} else requestData.status = "paid";
				if (requestData.payee === null) {
					requestData.payee = "";
				}
				if (this.state.isPaid) {
					if (this.state.paymentMethod) {
						requestData.bankDetailId = this.state.paymentMethod;
					} else return invoiz.page.showToast({ type: "error", message: `Please select a payment method!` });
				}

				requestData.receipts = this.state.uploadedReceipts;

				this.saveExpenseSettings(requestData.columns).then(
					() => {
						saveCustomer(
							this.createCustomer || this.updateCustomer ? requestData : null,
							this.createCustomer
						).then(
							(newOrUpdateCustomerData) => {
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
								}

								this.createCustomer = false;
								this.updateCustomer = false;
								updateExpenseArticles(requestData.positions, requestData.customerData)
									.then(() => {
										let redirectUrl = "";
										new Promise((resolve, reject) => {
											requestData.positions.map((item) => {
												if (item.trackedInInventory === false) {
													item.itemModifiedDate = expense.date;
													saveInventory(item, requestData.date).then(
														(response) => {
															resolve();
														},
														(error) => {
															reject(error);
														}
													);
												} else {
													resolve();
												}
											});
										})
											.then(() => {
												saveExpense(requestData).then(
													(id) => {
														redirectUrl = `/expense/edit/${id}`;
													},
													(error) => {
														reject(error);
													}
												);
											})
											.then(
												() => {
													if (!this.filesToDelete || this.filesToDelete.length === 0) {
														if (createNew) {
															invoiz.router.navigate("/expense/new", true, true);
														} else {
															invoiz.router.navigate("/expenses", true, true);
														}
													}
													const requests = this.filesToDelete.map((id) => {
														return invoiz.request(
															`${config.expense.endpoints.receiptUrl}/${id}`,
															{
																auth: true,
																method: "DELETE",
															}
														);
													});
													Promise.all(requests)
														.then(() => {
															if (createNew) {
																invoiz.router.navigate("/expense/new", true, true);
															} else {
																invoiz.showNotification({
																	message: resources.expenseSaveSuccessMessage,
																});
																invoiz.router.navigate("/expenses", true, true);
															}
														})
														.catch(() => {
															invoiz.showNotification({
																type: "error",
																message: resources.str_saveErrorMessage,
															});
														});
												},
												(error) => {
													this.setState({ saving: false });
													const errors =
														(error && error.meta) ||
														(error && error.body && error.body.meta);
													handleTransactionFormErrors(null, errors, "expense");
												}
											);
									})
									.catch((error) => {
										this.setState({ saving: false });
										const errors =
											(error && error.meta) || (error && error.body && error.body.meta);
										handleTransactionFormErrors(null, errors, "expense");
									});
							},
							() => {
								this.createCustomer = false;
								this.updateCustomer = false;
								this.setState({ saving: false });
								invoiz.page.showToast({ type: "error", message: resources.defaultErrorMessage });
							}
						);
					},
					(err) => {
						this.setState({ saving: false });
						invoiz.page.showToast({ type: "error", message: resources.defaultErrorMessage });
					}
				);
			});
		});
	}

	saveExpenseSettings(columns) {
		return new Promise((resolve, reject) => {
			const data = {
				columns,
			};

			invoiz
				.request(`${config.resourceHost}setting/expense`, {
					auth: true,
					method: "POST",
					data,
				})
				.then(() => {
					resolve();
				})
				.catch((err) => {
					reject(err);
				});
		});
	}

	onCancel() {
		if (this.state.uploadedReceipts.length > 0) {
			const requests = this.state.uploadedReceipts.map((receipt) => {
				invoiz.request(`${config.expense.endpoints.receiptUrl}/${receipt.id}`, {
					auth: true,
					method: "DELETE",
				});
			});
			Promise.all(requests).then(() => {
				this.setState({ uploadedReceipts: [] });
			});
		}
		window.history.back();
		// invoiz.router.navigate('/expenses');
	}

	addFile(files) {
		if (!files) {
			return;
		}

		_.each(files, (file) => {
			this.manualUploader.addFiles([file]);
		});
	}

	addSelectedFile(event) {
		const file = event.target.files[0];
		this.addFile([file]);
		event.target.value = "";
	}

	initDragAndDropUploader() {
		Uploader.DragAndDrop({
			dropZoneElements: [document.getElementById("expense-receipt-dropbox")],
			callbacks: {
				processingDroppedFilesComplete: (files) => {
					this.addFile(files);
				},
			},
		});
	}

	initManualUploader() {
		const { resources } = this.props;
		this.manualUploader = new Uploader.FineUploaderBasic(
			_.assign({}, config.expense.fineUploader, {
				autoUpload: true,
				multiple: true,
				messages: {
					minSizeError: resources.expenseFileMinSizeError,
					sizeError: resources.expenseFileMaxSizeError,
					typeError: resources.expenseFileTypeError,
				},
				request: {
					customHeaders: { authorization: `Bearer ${invoiz.user.token}` },
					endpoint: config.expense.endpoints.receiptUrl,
					inputName: "receipt",
					filenameParam: "filename",
				},
				callbacks: {
					onComplete: (id, fileName, response) => {
						if (!response.success) {
							return;
						}
						const { name } = this.manualUploader.getFile(id);
						const obj = { id: response.data.id, name };
						const { uploadedReceipts } = this.state;
						uploadedReceipts.push(obj);
						this.setState({ uploadedReceipts });

						if (!this.state.isModal) {
							invoiz.page.showToast({ message: resources.str_fileUploadSuccessMessage });
						}
					},
					onError: (id, name, errorReason, xhr) => {
						if (xhr) {
							const { meta: error } = JSON.parse(xhr.response);
							return handleImageError(this, error);
						}

						invoiz.page.showToast({
							type: "error",
							message: format(errorReason, name) || resources.expenseEditImageUploadError,
						});
					},
				},
			})
		);
	}
}

const mapStateToProps = (state) => {
	const isSubmenuVisible = state.global.isSubmenuVisible;

	return {
		isSubmenuVisible,
	};
};

export default connect(mapStateToProps)(ExpenseEditComponent);
