import React, { useEffect, useState } from "react";
import ModalService from "../../services/modal.service";
import ButtonComponent from "../../shared/button/button.component";
import NumberInputComponent from "../../shared/inputs/number-input/number-input.component";
import SelectInput from "../../shared/inputs/select-input/select-input.component";
import TextInputComponent from "../../shared/inputs/text-input/text-input.component";

const AddBankModalComponent = ({ onConfirm }) => {
	useEffect(() => {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		return () => {
			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
		};
	});

	const [reEnteredAccountNumber, setReEnteredAccountNumber] = useState("");
	const [newBankData, setNewBankData] = useState({
		type: "bank",
		bankName: "",
		accountNumber: "",
		accountName: "",
		IFSCCode: "",
		// balance: "",
		openingBalance: 0,
		branch: "",
		customerId: "",
		notes: "",
	});

	const handleAccountNumberChange = (event) => {
		let enteredAccountNumber = event.target.value;
		if (!enteredAccountNumber) {
			setNewBankData({ ...newBankData, accountNumber: "" });
			return;
		}
		enteredAccountNumber = enteredAccountNumber
			.split("-")
			.join("")
			.match(/.{1,4}/g)
			.join("-");
		setNewBankData({ ...newBankData, accountNumber: enteredAccountNumber });
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
	};
	const handleBankNameChange = (option) => {
		setNewBankData({ ...newBankData, bankName: option.value });
	};
	const handleAccountNameChange = (event) => {
		setNewBankData({ ...newBankData, accountName: event.target.value });
	};
	const handleBranchChange = (event) => {
		setNewBankData({ ...newBankData, branch: event.target.value });
	};
	const handleCustomerIdChange = (event) => {
		setNewBankData({ ...newBankData, customerId: event.target.value });
	};
	const handleIfscCodeChange = (event) => {
		const enteredIfsc = event.target.value;
		if (enteredIfsc.length > 11) return;
		setNewBankData({ ...newBankData, IFSCCode: enteredIfsc });
	};
	const handleOpeningBalanceChange = (value) => {
		if (!value) {
			setNewBankData({ ...newBankData, openingBalance: 0 });
			return;
		}
		setNewBankData({ ...newBankData, openingBalance: value });
	};
	const handleNotesChange = (event) => {
		setNewBankData({ ...newBankData, notes: event.target.value });
	};
	const handleSave = () => {
		onConfirm(newBankData);
	};
	return (
		<div className="add-bank-modal-container" style={{ minHeight: "200px" }}>
			<div style={{ padding: "20px", boxShadow: "0px 1px 4px 0px #0000001F" }} className="modal-base-headline">
				Add bank details
			</div>

			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }} className="add-bank-modal-body-container">
				<div style={{ padding: "35px 30px", backgroundColor: "white" }} className="add-bank-modal-body">
					<div style={{ marginBottom: "10px" }}>
						<SelectInput
							allowCreate={false}
							notAsync={true}
							loadedOptions={[
								{ label: "BOB", value: "BOB" },
								{ label: "HDFC", value: "HDFC" },
							]}
							value={newBankData.bankName}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Select Bank",
								handleChange: handleBankNameChange,
							}}
						/>
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							<TextInputComponent
								label="Account number"
								value={newBankData.accountNumber}
								onChange={handleAccountNumberChange}
							/>
						</div>
						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							<TextInputComponent
								label="Re-enter account number"
								value={reEnteredAccountNumber}
								onChange={handleReEnterAccountNumberChange}
							/>
						</div>
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							<TextInputComponent
								label="Account name"
								value={newBankData.accountName}
								onChange={handleAccountNameChange}
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
					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							<TextInputComponent
								label="Customer ID"
								value={newBankData.customerId}
								onChange={handleCustomerIdChange}
							/>
						</div>
						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							<TextInputComponent
								label="IFSC Code"
								value={newBankData.IFSCCode}
								onChange={handleIfscCodeChange}
							/>
						</div>
					</div>
					<div style={{ width: "100%" }}>
						<NumberInputComponent
							defaultNonZero
							label="Opening balance"
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
