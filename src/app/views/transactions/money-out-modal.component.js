import React, { useEffect, useState } from "react";
import ModalService from "../../services/modal.service";
import ButtonComponent from "../../shared/button/button.component";
import NumberInputComponent from "../../shared/inputs/number-input/number-input.component";
import SelectInput from "../../shared/inputs/select-input/select-input.component";
import TextInputComponent from "../../shared/inputs/text-input/text-input.component";
import TextInputErrorComponent from "../../shared/inputs/text-input/text-input-error.component";
import DateInputComponent from "../../shared/inputs/date-input/date-input.component";
import moment from "moment";
import invoiz from "../../services/invoiz.service";
import TextInputLabelComponent from "../../shared/inputs/text-input/text-input-label.component";
import TextInputHintComponent from "../../shared/inputs/text-input/text-input-hint.component";
import { formatApiDate } from "../../helpers/formatDate";

const accountTypes = [
	{ label: "Assets", value: "assets" },
	{ label: "Liability", value: "liability" },
	{ label: "Equity", value: "equity" },
	{ label: "Income", value: "income" },
	{ label: "Expenses", value: "expenses" },
];

const accountSubtypes = {
	assets: [
		{ label: "Account receivable", value: "accountReceivable" },
		{ label: "Customer deposits", value: "customerDeposits" },
		{ label: "Inventory", value: "inventory" },
		{ label: "Vendor credits", value: "vendorCredits" },
		{ label: "Deposits", value: "deposits" },
		{ label: "Prepaid expenses", value: "prepaidExpenses" },
		{
			label: "Property, plant and equipment",
			value: "propertyPlantAndEquipment",
		},
	],
	liability: [
		{ label: "Sales taxes", value: "salesTaxes" },
		{ label: "Customer credits", value: "customerCredits" },
		{ label: "Account payable", value: "accountPayable" },
		{ label: "Unearned revenue", value: "unearnedRevenue" },
	],
	equity: [
		{
			label: "Owner investment/drawings",
			value: "ownerInvestmentDrawings",
		},
		{ label: "Opening balance", value: "openingBalance" },
		{ label: "Retained earnings", value: "retainedEarnings" },
	],
	income: [
		{ label: "Sales", value: "sales" },
		{ label: "Discounts", value: "discounts" },
		{ label: "Other Incomes", value: "otherIncomes" },
	],
	expenses: [
		{ label: "Cost of goods sold", value: "costOfGoodsSold" },
		{ label: "Operating expenses", value: "operatingExpenses" },
		{ label: "Payroll expenses", value: "payrollExpenses" },
		{ label: "Sales taxes payment", value: "salesTaxesPayment" },
		{ label: "Utilies", value: "utilies" },
		{ label: "Advertising", value: "advertising" },
		{ label: "Transport expenses", value: "transportExpenses" },
		{ label: "Employee benefits", value: "employeeBenefits" },
		{ label: "Office expenses", value: "officeExpenses" },
		{ label: "Uncategorized expenses", value: "uncategorizedExpenses" },
	],
};

const customerOptions = [
	{ label: "Joe Black", value: 591 },
	{ label: "Michael Doe", value: 586 },
];

const paymentMethodOptions = [
	{ label: "Bank 1", value: 19 },
	{ label: "Bank 2", value: 25 },
];

const Label = ({ label, style, sublabel = "" }) => {
	return (
		<label style={{ fontSize: "16px", color: "#272D30", fontWeight: "400", ...style }} className="textarea_label">
			{label}
			<span style={{ fontWeight: "400", fontSize: "14px", color: "#747474" }}>{" " + sublabel}</span>
		</label>
	);
};

const MoneyOutModalComponent = ({ onConfirm, bankList, customerList }) => {
	useEffect(() => {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		getTransactionsList();
		return () => {
			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
		};
	}, []);

	const getTransactionsList = () => {
		invoiz
			.request(
				"https://dev.groflex.in/api/bankTransaction?offset=0&searchText=&limit=9999999&orderBy=date&desc=true",
				{ auth: true }
			)
			.then((res) => {
				console.log(res, "TRANSACTIONS");
			});
	};

	const [moneyInData, setMoneyInData] = useState({
		accountType: "",
		accountSubType: "",
		reconcileStatus: false,
		type: "out",
		notes: "",
		date: "",
		credits: 0,
		debits: 0, //debits will be edited  in this modal
		customerId: 0,
		bankDetailId: 0,
	});
	const [formErrors, setFormErrors] = useState({
		accountTypeError: "",
		accountSubTypeError: "",
		dateError: "",
		debitsError: "",
		customerIdError: "",
		bankDetailIdError: "",
	});

	const handleAccountTypeChange = (option) => {
		if (!option) {
			setMoneyInData({ ...moneyInData, accountType: "" });
			return;
		}
		setMoneyInData({ ...moneyInData, accountType: option.value });
		setFormErrors({ ...formErrors, accountTypeError: "" });
	};
	const handleAccountSubTypeChange = (option) => {
		if (!option) {
			setMoneyInData({ ...moneyInData, accountSubType: "" });
			return;
		}
		setMoneyInData({ ...moneyInData, accountSubType: option.value });
		setFormErrors({ ...formErrors, accountSubTypeError: "" });
	};
	const handleCustomerChange = (option) => {
		if (!option) {
			setMoneyInData({ ...moneyInData, customerId: "" });
			return;
		}
		setMoneyInData({ ...moneyInData, customerId: option.value });
		setFormErrors({ ...formErrors, customerIdError: "" });
	};
	const handleDateChange = (name, value, date) => {
		const formatedDate = formatApiDate(date);
	};
	const handlePaymentMethodChange = (option) => {
		if (!option) {
			setMoneyInData({ ...moneyInData, bankDetailId: "" });
			return;
		}
		setMoneyInData({ ...moneyInData, bankDetailId: option.value });
		setFormErrors({ ...formErrors, bankDetailIdError: "" });
	};
	const handleAmountChange = (value) => {
		if (!value) {
			setMoneyInData({ ...moneyInData, debits: 0 });
			setFormErrors({ ...formErrors, debitsError: "Amount can not be 0" });
			return;
		}
		setMoneyInData({ ...moneyInData, debits: value });
		setFormErrors({ ...formErrors, debitsError: "" });
	};
	const handleNotesChange = (event) => {
		setMoneyInData({ ...moneyInData, notes: event.target.value });
	};

	// Extra Form validation function
	const checkForEmptyFields = () => {
		let emptyFlag = false;
		if (!moneyInData.accountType) {
			setFormErrors({ ...formErrors, accountTypeError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!moneyInData.accountSubType) {
			setFormErrors({ ...formErrors, accountSubTypeError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!moneyInData.customerId) {
			setFormErrors({ ...formErrors, customerIdError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!moneyInData.bankDetailId) {
			setFormErrors({ ...formErrors, bankDetailIdError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!moneyInData.debits) {
			setFormErrors({ ...formErrors, debitsError: "This is a mandatory field" });
			emptyFlag = true;
		}
		return emptyFlag;
	};

	// Handle Save
	const handleSave = () => {
		//Check for empty fields
		if (checkForEmptyFields()) return;

		//Finally submitting if no errors of any type
		if (Object.values(formErrors).every((error) => error === "")) {
			onConfirm(moneyInData);
		}
	};

	console.log("Form money out", moneyInData);
	console.log("Money out Form errors", formErrors);
	return (
		<div className="money-out-modal-container" style={{ minHeight: "200px" }}>
			<div style={{ padding: "20px", boxShadow: "0px 1px 4px 0px #0000001F" }} className="modal-base-headline">
				Money Out
			</div>

			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }} className="money-out-modal-body-container">
				<div style={{ padding: "35px 30px", backgroundColor: "white" }} className="money-out-modal-body">
					<div style={{ marginBottom: "20px" }}>
						{/* <Label label={moneyInData.accountType ? "Account type*" : ""} /> */}
						<SelectInput
							allowCreate={false}
							notAsync={true}
							loadedOptions={accountTypes}
							value={moneyInData.accountType}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Account type",
								handleChange: handleAccountTypeChange,
							}}
						/>
						<div style={{ marginTop: "18px" }}>
							<TextInputErrorComponent
								errorMessage={formErrors.accountTypeError}
								visible={!!formErrors.accountTypeError}
							/>
						</div>
					</div>
					<div style={{ marginBottom: "20px", backgroundColor: !moneyInData.accountType ? "#f9f9f9" : null }}>
						{/* <Label
							label={moneyInData.accountSubtype ? "Account subtype*" : ""}
							style={{ color: "#747474" }}
						/> */}
						<SelectInput
							disabled={!moneyInData.accountType}
							allowCreate={false}
							notAsync={true}
							loadedOptions={moneyInData.accountType ? accountSubtypes[moneyInData.accountType] : null}
							value={moneyInData.accountSubType}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Account subtype",
								handleChange: handleAccountSubTypeChange,
							}}
						/>
						<div style={{ marginTop: "18px" }}>
							<TextInputErrorComponent
								errorMessage={formErrors.accountSubTypeError}
								visible={!!formErrors.accountSubTypeError}
							/>
						</div>
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0 0 5px 0" }} className="row">
						<div
							style={{
								width: "100%",
								marginRight: "15px",
								paddingTop: "5px",
							}}
							className="col_xs_6"
						>
							{/* <Label label={moneyInData.date ? "Date*" : ""} style={{ marginBottom: "16px" }} /> */}
							<DateInputComponent
								name={"date"}
								value={moneyInData.date}
								required={true}
								label={"Date"}
								noBorder={true}
								onChange={(name, value, date) => {
									setMoneyInData({ ...moneyInData, date: moment(value, "DD-MM-YYYY") });
									handleDateChange(name, value, date);
									// setMoneyInData({ ...moneyInData, date: `${value} ${currentTimeString()}` });
									// setMoneyInData({ ...moneyInData, date: value });
								}}
							/>
							<div style={{ width: "%100", borderTop: "1px solid #C6C6C6" }} />
						</div>
						<div style={{ width: "100%", marginLeft: "15px", paddingTop: "13px" }} className="col_xs_6">
							{/* <Label
								label={moneyInData.customer ? "Customer*" : ""}
								style={{ marginBottom: "8px" }}
							/> */}
							<SelectInput
								allowCreate={false}
								notAsync={true}
								loadedOptions={customerOptions}
								value={moneyInData.customerId}
								options={{
									clearable: false,
									noResultsText: false,
									labelKey: "label",
									valueKey: "value",
									matchProp: "label",
									placeholder: "Payee",
									handleChange: handleCustomerChange,
								}}
							/>
							<div style={{ marginTop: "18px" }}>
								<TextInputErrorComponent
									errorMessage={formErrors.customerIdError}
									visible={!!formErrors.customerIdError}
								/>
							</div>
						</div>
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px", paddingTop: "11px" }} className="col_xs_6">
							{/* <Label
								label={moneyInData.paymentMethod  ? "Payment method*" : ""}
								style={{ marginBottom: "8px" }}
							/> */}
							<SelectInput
								allowCreate={false}
								notAsync={true}
								loadedOptions={paymentMethodOptions}
								value={moneyInData.bankDetailId}
								options={{
									clearable: false,
									noResultsText: false,
									labelKey: "label",
									valueKey: "value",
									matchProp: "label",
									placeholder: "Payment method",
									handleChange: handlePaymentMethodChange,
								}}
							/>
							<div style={{ marginTop: "18px" }}>
								<TextInputErrorComponent
									errorMessage={formErrors.bankDetailIdError}
									visible={!!formErrors.bankDetailIdError}
								/>
							</div>
						</div>

						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							{/* <Label label={moneyInData.debits ? "Amount*" : ""} style={{ marginBottom: "8px" }} /> */}
							<NumberInputComponent
								defaultNonZero
								errorMessage={formErrors.debitsError}
								label="Amount"
								value={moneyInData.debits}
								onChange={handleAmountChange}
							/>
							<div style={{ marginTop: "18px" }}>
								{/* <TextInputErrorComponent
									errorMessage={formErrors.debitsError}
									visible={!!formErrors.debitsError}
								/> */}
							</div>
						</div>
					</div>
					<div style={{ paddingTop: "10px" }} className="textarea">
						<Label label="Notes" style={{ color: "#747474" }} />
						<textarea
							className="textarea_input"
							rows="4"
							onChange={handleNotesChange}
							value={moneyInData.notes}
						/>
						<span className="textarea_bar" />
					</div>
				</div>
			</div>

			<div style={{ position: "relative" }} className="modal-base-footer">
				<div className="modal-base-cancel">
					<ButtonComponent callback={() => ModalService.close()} type="cancel" label={"Cancel"} />
				</div>
				<div className="modal-base-confirm">
					<ButtonComponent disabled={false} buttonIcon="icon-check" callback={handleSave} label={"Save"} />
				</div>
			</div>
		</div>
	);
};

export default MoneyOutModalComponent;
