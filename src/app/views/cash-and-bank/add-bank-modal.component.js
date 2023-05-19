import React, { useEffect, useState } from "react";
import ModalService from "../../services/modal.service";
import ButtonComponent from "../../shared/button/button.component";
import NumberInputComponent from "../../shared/inputs/number-input/number-input.component";
import SelectInput from "../../shared/inputs/select-input/select-input.component";
import TextInputComponent from "../../shared/inputs/text-input/text-input.component";
import TextInputErrorComponent from "../../shared/inputs/text-input/text-input-error.component";

const bankNamesList = [
	{ label: "Bank Of Baroda", value: "Bank Of Baroda" },
	{ label: "Bank of Maharashtra", value: "Bank of Maharashtra" },
	{ label: "Canara Bank", value: "Canara Bank" },
	{ label: "Central Bank of India", value: "Central Bank of India" },
	{ label: "Indian Overseas Bank", value: "Indian Overseas Bank" },
	{ label: "Bank of India", value: "Bank of India" },
	{ label: "Indian Bank", value: "Indian Bank" },
];

const accountTypesList = [
	{ label: "Savings", value: "savings" },
	{ label: "Current", value: "current" },
];

const AddBankModalComponent = ({ onConfirm }) => {
	useEffect(() => {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		return () => {
			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
		};
	}, []);

	const [reEnteredAccountNumber, setReEnteredAccountNumber] = useState("");
	const [newBankData, setNewBankData] = useState({
		type: "bank",
		bankName: "",
		accountNumber: "",
		accountType: "",
		IFSCCode: "",
		openingBalance: 0,
		branch: "",
		customerId: "",
		notes: "",
		cashType: "cash",
	});
	const [formErrors, setFormErrors] = useState({
		bankNameError: "",
		accountNumberError: "",
		reEnterAccountNumberError: "",
		// accountTypeError: "",
		IFSCCodeError: "",
		openingBalanceError: "",
	});

	const handleBankNameChange = (event) => {
		// if (!option) {
		// 	return;
		// }
		setNewBankData({ ...newBankData, bankName: event.target.value });
		setFormErrors({ ...formErrors, bankNameError: "" });
	};

	const handleAccountNumberChange = (event) => {
		let enteredAccountNumber = event.target.value;

		if (/[^0-9]/.test(enteredAccountNumber)) return;

		if (!enteredAccountNumber) {
			setNewBankData({ ...newBankData, accountNumber: "" });
			return;
		}
		setNewBankData({ ...newBankData, accountNumber: enteredAccountNumber });
		setFormErrors({ ...formErrors, accountNumberError: "" });
		if (enteredAccountNumber === reEnteredAccountNumber) {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "" });
		}
	};

	const handleReEnterAccountNumberChange = (event) => {
		let reEnteredAccountNumber = event.target.value;

		if (/[^0-9]/.test(reEnteredAccountNumber)) return;

		if (!reEnteredAccountNumber) {
			setReEnteredAccountNumber("");
			return;
		}
		setReEnteredAccountNumber(reEnteredAccountNumber);
		if (reEnteredAccountNumber === newBankData.accountNumber) {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "" });
		} else {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "Account number does not match" });
		}
	};

	const handleIfscCodeChange = (event) => {
		const enteredIfsc = event.target.value;

		if (enteredIfsc.length > 11 || /[^a-zA-Z0-9]/.test(enteredIfsc)) {
			return;
		}
		if (enteredIfsc.length < 11) {
			setNewBankData({ ...newBankData, IFSCCode: enteredIfsc });
			setFormErrors({ ...formErrors, IFSCCodeError: "IFSC Code must be 11 digits" });
			return;
		}
		setNewBankData({ ...newBankData, IFSCCode: enteredIfsc });
		setFormErrors({ ...formErrors, IFSCCodeError: "" });
	};

	const handleAccountTypeChange = (option) => {
		if (!option) return;
		setNewBankData({ ...newBankData, accountType: option.value, accountName: option.value });
		// setFormErrors({ ...formErrors, accountTypeError: "" });
	};

	const handleOpeningBalanceChange = (value) => {
		if (!value) {
			setNewBankData({ ...newBankData, openingBalance: 0 });
			return;
		}
		setNewBankData({ ...newBankData, openingBalance: value });
		setFormErrors({ ...formErrors, openingBalanceError: "" });
	};

	const handleBranchChange = (event) => {
		setNewBankData({ ...newBankData, branch: event.target.value });
	};

	const handleCustomerIdChange = (event) => {
		setNewBankData({ ...newBankData, customerId: event.target.value });
	};

	const handleNotesChange = (event) => {
		setNewBankData({ ...newBankData, notes: event.target.value });
	};

	const checkForEmptyFields = () => {
		let emptyFlag = false;
		if (!newBankData.bankName) {
			setFormErrors({ ...formErrors, bankNameError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!newBankData.accountNumber) {
			setFormErrors({ ...formErrors, accountNumberError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!reEnteredAccountNumber) {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "This is a mandatory field" });
			emptyFlag = true;
		}
		// if (!newBankData.accountType) {
		// 	setFormErrors({ ...formErrors, accountTypeError: "This is a mandatory field" });
		// 	emptyFlag = true;
		// }
		if (!newBankData.IFSCCode) {
			setFormErrors({ ...formErrors, IFSCCodeError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!newBankData.openingBalance) {
			setFormErrors({ ...formErrors, openingBalanceError: "This is a mandatory field" });
			emptyFlag = true;
		}
		return emptyFlag;
	};

	const handleSave = () => {
		//Check for empty fields
		if (checkForEmptyFields()) return;

		//check for reentered acc number
		if (newBankData.accountNumber !== reEnteredAccountNumber) {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "Account number does not match" });
			return;
		}

		//Finally submitting if no errors of any type
		if (Object.values(formErrors).every((error) => error === "")) {
			onConfirm(newBankData);
		}
	};

	console.log("Add bank Form data", newBankData);
	console.log("Add bank Form errors", formErrors);
	return (
		<div className="add-bank-modal-container" style={{ minHeight: "200px" }}>
			<div style={{ padding: "20px", boxShadow: "0px 1px 4px 0px #0000001F" }} className="modal-base-headline">
				Add bank details
			</div>

			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }} className="add-bank-modal-body-container">
				<div style={{ padding: "35px 30px", backgroundColor: "white" }} className="add-bank-modal-body">
					<div style={{ marginBottom: "0px" }}>
						{/* <SelectInput
							allowCreate={false}
							notAsync={true}
							loadedOptions={bankNamesList}
							value={newBankData.bankName}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Select Bank*",
								handleChange: handleBankNameChange,
							}}
						/> */}
						<TextInputComponent
							errorMessage={formErrors.bankNameError}
							label="Bank name*"
							value={newBankData.bankName}
							onChange={handleBankNameChange}
						/>
						{/* <div style={{ marginTop: "18px" }}> */}
						<TextInputErrorComponent
							errorMessage={formErrors.bankNameError}
							visible={!!formErrors.bankNameError}
						/>
						{/* </div> */}
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							<TextInputComponent
								errorMessage={formErrors.accountNumberError}
								label="Account number*"
								value={newBankData.accountNumber}
								onChange={handleAccountNumberChange}
							/>
						</div>
						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							<TextInputComponent
								errorMessage={formErrors.reEnterAccountNumberError}
								label="Re-enter account number*"
								value={reEnteredAccountNumber}
								onChange={handleReEnterAccountNumberChange}
							/>
						</div>
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							<TextInputComponent
								errorMessage={formErrors.IFSCCodeError}
								label="IFSC Code*"
								value={newBankData.IFSCCode}
								onChange={handleIfscCodeChange}
							/>
						</div>
						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							<TextInputComponent
								label="Customer ID"
								value={newBankData.customerId}
								onChange={handleCustomerIdChange}
							/>
						</div>
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							{/* <TextInputComponent
								errorMessage={formErrors.accountNameError}
								label="Account name*"
								value={newBankData.accountName}
								onChange={handleAccountNameChange}
							/> */}
							<SelectInput
								allowCreate={false}
								notAsync={true}
								loadedOptions={accountTypesList}
								value={newBankData.accountType}
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
							<TextInputErrorComponent
								errorMessage={formErrors.accountTypeError}
								visible={!!formErrors.accountTypeError}
							/>
						</div>
						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							<TextInputComponent
								label="Branch"
								value={newBankData.branch}
								onChange={handleBranchChange}
							/>
						</div>
					</div>

					<div style={{ width: "100%" }}>
						<NumberInputComponent
							defaultNonZero
							errorMessage={formErrors.openingBalanceError}
							label="Opening balance*"
							value={newBankData.openingBalance}
							onChange={handleOpeningBalanceChange}
						/>
					</div>
					<div style={{ paddingTop: "10px" }} className="textarea">
						<label style={{ fontSize: "16px" }} className="textarea_label">
							Notes
						</label>
						<textarea
							className="textarea_input"
							rows="4"
							onChange={handleNotesChange}
							value={newBankData.notes}
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

export default AddBankModalComponent;
