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

const accountTypes = [
	{ label: "Assets", value: "Assets" },
	{ label: "Liability", value: "Liability" },
	{ label: "Equity", value: "Equity" },
	{ label: "Income", value: "Income" },
	{ label: "Expenses", value: "Expenses" },
];

const accountSubtypes = {
	Assets: [
		{ label: "Account receivable", value: "Account receivable" },
		{ label: "Customer deposits", value: "Customer deposits" },
		{ label: "Inventory", value: "Inventory" },
		{ label: "Vendor credits", value: "Vendor credits" },
		{ label: "Deposits", value: "Deposits" },
		{ label: "Prepaid expenses", value: "Prepaid expenses" },
		{ label: "Property, plant and equipment", value: "Property, plant and equipment" },
	],
	Liability: [
		{ label: "Sales taxes", value: "Sales taxes" },
		{ label: "Customer credits", value: "Customer credits" },
		{ label: "Account payable", value: "Account payable" },
		{ label: "Unearned revenue", value: "Unearned revenue" },
	],
	Equity: [
		{ label: "Owner investment/drawings", value: "Owner investment/drawings" },
		{ label: "Opening balance", value: "Opening balance" },
		{ label: "Retained earnings", value: "Retained earnings" },
	],
	Income: [
		{ label: "Sales", value: "Sales" },
		{ label: "Discounts", value: "Discounts" },
		{ label: "Other Incomes", value: "Other Incomes" },
	],
	Expenses: [
		{ label: "Cost of goods sold", value: "Cost of goods sold" },
		{ label: "Operating expenses", value: "Operating expenses" },
		{ label: "Payroll expenses", value: "Payroll expenses" },
		{ label: "Sales taxes payment", value: "Sales taxes payment" },
		{ label: "Utilies", value: "Utilies" },
		{ label: "Advertising", value: "Advertising" },
		{ label: "Transport expenses", value: "Transport expenses" },
		{ label: "Employee benefits", value: "Employee benefits" },
		{ label: "Office expenses", value: "Office expenses" },
		{ label: "Uncategorized expenses", value: "Uncategorized expenses" },
	],
};

const customerOptions = [
	{ label: "Joe Black", value: "Joe Black", id: 1 },
	{ label: "Michael Doe", value: "Michael Doe", id: 2 },
];

const bankOptions = [
	{ label: "Bank 1", value: "Bank 1", id: 4 },
	{ label: "Bank 2", value: "Bank 2", id: 5 },
	{ label: "Bank 3", value: "Bank 3", id: 6 },
];

const Label = ({ label, style, sublabel = "" }) => {
	return (
		<label style={{ fontSize: "16px", color: "#272D30", fontWeight: "600", ...style }} className="textarea_label">
			{label}
			<span style={{ fontWeight: "400", fontSize: "14px", color: "#747474" }}>{" " + sublabel}</span>
		</label>
	);
};

const MoneyOutModalComponent = ({ onConfirm }) => {
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
				console.log(res.body.data, "TRANSACTIONS");
			});
	};

	const [reEnteredAccountNumber, setReEnteredAccountNumber] = useState("");
	const [moneyInData, setMoneyInData] = useState({
		type: "out",
		accountType: "",
		accountSubtype: "",
		date: "",
		customer: { name: "", id: "" },
		bank: { name: "", id: "" },
		amount: 0,
		reconcileStatus: false,
		notes: "",
		// ---------------------------
		credits: "0",
		debits: "100",
		// useless below only to not break the existing code
		bankName: "",
		accountNumber: "",
		accountName: "",
		IFSCCode: "",
		balance: "",
		openingBalance: 0,
		branch: "",
		// customerId: "",
	});
	const [formErrors, setFormErrors] = useState({
		bankNameError: "",
		accountNumberError: "",
		reEnterAccountNumberError: "",
		accountNameError: "",
		IFSCCodeError: "",
		openingBalanceError: "",
	});

	const handleAccountTypeChange = (option) => {
		if (!option) {
			return;
		}
		setMoneyInData({ ...moneyInData, accountType: option.value });
		setFormErrors({ ...formErrors, bankNameError: "" });
	};
	const handleAccountSubTypeChange = (option) => {
		if (!option) {
			return;
		}
		setMoneyInData({ ...moneyInData, accountSubtype: option.value });
		setFormErrors({ ...formErrors, bankNameError: "" });
	};

	const handleCustomerChange = (option) => {
		if (!option) {
			return;
		}
		setMoneyInData({ ...moneyInData, customer: { name: option.value, id: option.id } });
	};
	const handleBankChange = (option) => {
		if (!option) {
			return;
		}
		setMoneyInData({ ...moneyInData, bank: { name: option.value, id: option.id } });
	};
	const handleAmountChange = (value) => {
		if (!value) {
			setMoneyInData({ ...moneyInData, amount: 0 });
			return;
		}
		setMoneyInData({ ...moneyInData, amount: value });
		setFormErrors({ ...formErrors, openingBalanceError: "" });
	};

	// Useless functions just to not break the code
	const handleAccountNumberChange = (event) => {
		let enteredAccountNumber = event.target.value;
		if (!enteredAccountNumber) {
			setMoneyInData({ ...moneyInData, accountNumber: "" });
			return;
		}
		enteredAccountNumber = enteredAccountNumber
			.split("-")
			.join("")
			.match(/.{1,4}/g)
			.join("-");
		setMoneyInData({ ...moneyInData, accountNumber: enteredAccountNumber });
		setFormErrors({ ...formErrors, accountNumberError: "" });
		if (enteredAccountNumber === reEnteredAccountNumber) {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "" });
		}
	};

	const handleReEnterAccountNumberChange = (event) => {
		let reEnteredAccountNumber = event.target.value;
		if (!reEnteredAccountNumber) {
			setReEnteredAccountNumber("");
			return;
		}
		reEnteredAccountNumber = reEnteredAccountNumber
			.split("-")
			.join("")
			.match(/.{1,4}/g)
			.join("-");
		setReEnteredAccountNumber(reEnteredAccountNumber);
		if (reEnteredAccountNumber === moneyInData.accountNumber) {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "" });
		} else {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "Account number does not match" });
		}
	};

	const handleAccountNameChange = (event) => {
		setMoneyInData({ ...moneyInData, accountName: event.target.value });
		setFormErrors({ ...formErrors, accountNameError: "" });
	};

	const handleIfscCodeChange = (event) => {
		const enteredIfsc = event.target.value;
		if (enteredIfsc.length < 11) {
			setMoneyInData({ ...moneyInData, IFSCCode: enteredIfsc });
			setFormErrors({ ...formErrors, IFSCCodeError: "IFSC Code must be 11 digits" });
		} else if (enteredIfsc.length > 11) {
			return;
		} else {
			setMoneyInData({ ...moneyInData, IFSCCode: enteredIfsc });
			setFormErrors({ ...formErrors, IFSCCodeError: "" });
		}
	};

	const handleOpeningBalanceChange = (value) => {
		if (!value) {
			setMoneyInData({ ...moneyInData, openingBalance: 0 });
			return;
		}
		setMoneyInData({ ...moneyInData, openingBalance: value });
		setFormErrors({ ...formErrors, openingBalanceError: "" });
	};

	const handleBranchChange = (event) => {
		setMoneyInData({ ...moneyInData, branch: event.target.value });
	};

	const handleCustomerIdChange = (event) => {
		setMoneyInData({ ...moneyInData, customerId: event.target.value });
	};

	const handleNotesChange = (event) => {
		setMoneyInData({ ...moneyInData, notes: event.target.value });
	};

	// Extra Form validation function
	const checkForEmptyFields = () => {
		let emptyFlag = false;
		if (!moneyInData.bankName) {
			setFormErrors({ ...formErrors, bankNameError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!moneyInData.accountNumber) {
			setFormErrors({ ...formErrors, accountNumberError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!reEnteredAccountNumber) {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!moneyInData.accountName) {
			setFormErrors({ ...formErrors, accountNameError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!moneyInData.IFSCCode) {
			setFormErrors({ ...formErrors, IFSCCodeError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!moneyInData.openingBalance) {
			setFormErrors({ ...formErrors, openingBalanceError: "This is a mandatory field" });
			emptyFlag = true;
		}
		return emptyFlag;
	};

	// Handle Save
	const handleSave = () => {
		//Check for empty fields
		if (checkForEmptyFields()) return;

		//check for reentered acc number
		if (moneyInData.accountNumber !== reEnteredAccountNumber) {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "Account number does not match" });
			return;
		}

		//Finally submitting if no errors of any type
		if (Object.values(formErrors).every((error) => error === "")) {
			onConfirm(moneyInData);
		}
	};

	console.log("Form money in", moneyInData);
	// console.log("Form errors", formErrors);
	return (
		<div className="money-in-modal-container" style={{ minHeight: "200px" }}>
			<div style={{ padding: "20px", boxShadow: "0px 1px 4px 0px #0000001F" }} className="modal-base-headline">
				Money Out
			</div>

			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }} className="money-in-modal-body-container">
				<div style={{ padding: "35px 30px", backgroundColor: "white" }} className="money-in-modal-body">
					<div style={{ marginBottom: "20px" }}>
						<Label label="Account type*" />
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
								placeholder: "Choose",
								handleChange: handleAccountTypeChange,
							}}
						/>
						<div style={{ marginTop: "18px" }}>
							<TextInputErrorComponent
								errorMessage={formErrors.bankNameError}
								visible={!!formErrors.bankNameError}
							/>
						</div>
					</div>
					<div style={{ marginBottom: "20px", backgroundColor: !moneyInData.accountType ? "#f9f9f9" : null }}>
						<Label
							label="Account subtype*"
							style={{ color: !moneyInData.accountType ? "#C6C6C6" : "black" }}
						/>
						<SelectInput
							disabled={!moneyInData.accountType}
							allowCreate={false}
							notAsync={true}
							loadedOptions={moneyInData.accountType ? accountSubtypes[moneyInData.accountType] : null}
							value={moneyInData.accountSubtype}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Choose",
								handleChange: handleAccountSubTypeChange,
							}}
						/>
						<div style={{ marginTop: "18px" }}>
							<TextInputErrorComponent
								errorMessage={formErrors.bankNameError}
								visible={!!formErrors.bankNameError}
							/>
						</div>
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0 0 20px 0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							<Label label={"Date*"} style={{ marginBottom: "16px" }} />
							<DateInputComponent
								name={"date"}
								value={moneyInData.date}
								required={true}
								// label={"Date"}
								noBorder={true}
								onChange={(name, value) => {
									// setMoneyInData({ ...moneyInData, date: moment(value, "DD-MM-YYYY") });
									setMoneyInData({ ...moneyInData, date: value });
								}}
							/>
							<div style={{ width: "%100", borderBottom: "1px solid #C6C6C6" }} />
						</div>
						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							<Label label={"Customer*"} style={{ marginBottom: "8px" }} />
							<SelectInput
								allowCreate={false}
								notAsync={true}
								loadedOptions={customerOptions}
								value={moneyInData.customer.name}
								options={{
									clearable: false,
									noResultsText: false,
									labelKey: "label",
									valueKey: "value",
									matchProp: "label",
									placeholder: "Choose",
									handleChange: handleCustomerChange,
								}}
							/>
						</div>
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							<Label label={"Payment method*"} style={{ marginBottom: "8px" }} />
							<SelectInput
								allowCreate={false}
								notAsync={true}
								loadedOptions={bankOptions}
								value={moneyInData.bank.name}
								options={{
									clearable: false,
									noResultsText: false,
									labelKey: "label",
									valueKey: "value",
									matchProp: "label",
									placeholder: "Choose",
									handleChange: handleBankChange,
								}}
							/>
						</div>

						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							{/* <TextInputComponent
								label="Amount"
								value={moneyInData.branch}
								onChange={handleBranchChange}
							/> */}
							<Label label={"Amount*"} style={{ marginBottom: "8px" }} />
							<NumberInputComponent
								defaultNonZero
								errorMessage={formErrors.openingBalanceError}
								// label="Amount*"
								value={moneyInData.amount}
								onChange={handleOpeningBalanceChange}
							/>
						</div>
					</div>
					{/* <div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							<TextInputComponent
								label="Customer ID"
								value={moneyInData.customerId}
								onChange={handleCustomerIdChange}
							/>
						</div>
						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							<TextInputComponent
								errorMessage={formErrors.IFSCCodeError}
								label="IFSC Code*"
								value={moneyInData.IFSCCode}
								onChange={handleIfscCodeChange}
							/>
						</div>
					</div>
					<div style={{ width: "100%" }}>
						<NumberInputComponent
							defaultNonZero
							errorMessage={formErrors.openingBalanceError}
							label="Opening balance*"
							value={moneyInData.openingBalance}
							onChange={handleOpeningBalanceChange}
						/>
					</div> */}
					<div style={{ paddingTop: "10px" }} className="textarea">
						<Label label="Notes" sublabel={"(optional)"} />
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
