import React, { useEffect, useState } from "react";
import ModalService from "../../services/modal.service";
import ButtonComponent from "../../shared/button/button.component";
import TextInputComponent from "../../shared/inputs/text-input/text-input.component";

const EditBankModalComponent = ({ formData, onConfirm }) => {
	const [reEnteredAccountNumber, setReEnteredAccountNumber] = useState(formData.accountNumber);
	const [editedBankData, setEditedBankData] = useState({
		...formData,
		bankName: formData.bankName,
		accountNumber: formData.accountNumber,
		accountName: formData.accountName,
		IFSCCode: formData.IFSCCode,
		// balance: formData.balance,
		openingBalance: formData.openingBalance,
		branch: formData.branch,
		customerId: formData.customerId,
		notes: formData.notes,
	});
	const [formErrors, setFormErrors] = useState({
		accountNumberError: "",
		reEnterAccountNumberError: "",
		accountNameError: "",
		IFSCCodeError: "",
	});

	useEffect(() => {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		return () => {
			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
		};
	}, []);

	const handleAccountNumberChange = (event) => {
		let enteredAccountNumber = event.target.value;
		if (!enteredAccountNumber) {
			setEditedBankData({ ...editedBankData, accountNumber: "" });
			return;
		}
		enteredAccountNumber = enteredAccountNumber
			.split("-")
			.join("")
			.match(/.{1,4}/g)
			.join("-");
		setEditedBankData({ ...editedBankData, accountNumber: enteredAccountNumber });
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
		if (reEnteredAccountNumber === editedBankData.accountNumber) {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "" });
		} else {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "Account number does not match" });
		}
	};

	const handleAccountNameChange = (event) => {
		setEditedBankData({ ...editedBankData, accountName: event.target.value });
		setFormErrors({ ...formErrors, accountNameError: "" });
	};

	const handleIfscCodeChange = (event) => {
		const enteredIfsc = event.target.value;
		if (enteredIfsc.length < 11) {
			setEditedBankData({ ...editedBankData, IFSCCode: enteredIfsc });
			setFormErrors({ ...formErrors, IFSCCodeError: "IFSC Code must be 11 digits" });
		} else if (enteredIfsc.length > 11) {
			return;
		} else {
			setEditedBankData({ ...editedBankData, IFSCCode: enteredIfsc });
			setFormErrors({ ...formErrors, IFSCCodeError: "" });
		}
	};

	const handleBranchChange = (event) => {
		setEditedBankData({ ...editedBankData, branch: event.target.value });
	};

	const handleCustomerIdChange = (event) => {
		setEditedBankData({ ...editedBankData, customerId: event.target.value });
	};

	const handleNotesChange = (event) => {
		setEditedBankData({ ...editedBankData, notes: event.target.value });
	};
	const checkForEmptyFields = () => {
		let emptyFlag = false;

		if (!editedBankData.accountNumber) {
			setFormErrors({ ...formErrors, accountNumberError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!reEnteredAccountNumber) {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!editedBankData.accountName) {
			setFormErrors({ ...formErrors, accountNameError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!editedBankData.IFSCCode) {
			setFormErrors({ ...formErrors, IFSCCodeError: "This is a mandatory field" });
			emptyFlag = true;
		}
		return emptyFlag;
	};

	const handleSave = () => {
		//Check for empty fields
		if (checkForEmptyFields()) return;

		//check for reentered acc number
		if (editedBankData.accountNumber !== reEnteredAccountNumber) {
			setFormErrors({ ...formErrors, reEnterAccountNumberError: "Account number does not match" });
			return;
		}

		//Finally submitting if no errors of any type
		if (Object.values(formErrors).every((error) => error === "")) {
			onConfirm(editedBankData);
		}
	};

	// console.log(editedBankData, "Edit bank data from edit modal");
	// console.log(reEnteredAccountNumber, "reintered acc number from edit bank modal");
	return (
		<div className="add-bank-modal-container" style={{ minHeight: "200px" }}>
			<div style={{ padding: "20px", boxShadow: "0px 1px 4px 0px #0000001F" }} className="modal-base-headline">
				Edit bank details
			</div>

			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }} className="add-bank-modal-body-container">
				<div style={{ padding: "35px 30px", backgroundColor: "white" }} className="add-bank-modal-body">
					<div style={{ flexWrap: "nowrap", margin: "0 0 20px 0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							<label style={{ color: "#747474", fontSize: "16px" }}>Bank name</label>
							<div style={{ marginTop: "10px" }}>{editedBankData.bankName}</div>
						</div>
						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							<label style={{ color: "#747474", fontSize: "16px" }}>Opening balance</label>
							<div style={{ marginTop: "10px" }}>
								₹
								{Number(editedBankData.openingBalance).toLocaleString("en", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</div>
						</div>
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							<TextInputComponent
								errorMessage={formErrors.accountNumberError}
								label="Account number*"
								value={editedBankData.accountNumber}
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
								errorMessage={formErrors.accountNameError}
								label="Account name*"
								value={editedBankData.accountName}
								onChange={handleAccountNameChange}
							/>
						</div>
						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							<TextInputComponent
								label="Branch"
								value={editedBankData.branch}
								onChange={handleBranchChange}
							/>
						</div>
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							<TextInputComponent
								label="Customer Id"
								value={editedBankData.customerId}
								onChange={handleCustomerIdChange}
							/>
						</div>
						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							<TextInputComponent
								errorMessage={formErrors.IFSCCodeError}
								label="IFSC code*"
								value={editedBankData.IFSCCode}
								onChange={handleIfscCodeChange}
							/>
						</div>
					</div>
					<div style={{ paddingTop: "10px" }} className="textarea">
						<label style={{ fontSize: "16px" }} className="textarea_label">
							Notes
						</label>
						<textarea
							className="textarea_input"
							rows="4"
							onChange={handleNotesChange}
							value={editedBankData.notes}
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

export default EditBankModalComponent;
