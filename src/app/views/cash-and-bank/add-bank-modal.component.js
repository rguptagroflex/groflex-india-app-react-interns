import React, { useEffect, useState } from "react";
import ModalService from "../../services/modal.service";
import ButtonComponent from "../../shared/button/button.component";
import BankSearchInputComponent from "../../shared/inputs/bank-search-input/bank-search-input.component";
import NumberInputComponent from "../../shared/inputs/number-input/number-input.component";
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
		bankName: "temporary bank",
		accountNumber: "",
		accountName: "",
		ifscCode: "",
		balance: 0,
		openingBalance: 0,
		branch: "",
		customerId: "",
		notes: "",
	});

	const handleAccountNumberChange = (value) => {
		setNewBankData({ ...newBankData, accountNumber: value });
	};
	const handleReEnterAccountNumberChange = (value) => {
		setReEnteredAccountNumber(value);
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
		setNewBankData({ ...newBankData, ifscCode: event.target.value });
	};
	const handleOpeningBalanceChange = (value) => {
		setNewBankData({ ...newBankData, openingBalance: value });
	};
	const handleNotesChange = (event) => {
		setNewBankData({ ...newBankData, notes: event.target.value });
	};

	const handleSave = () => {
		onConfirm(newBankData);
	};

	console.log(newBankData, "New bank data from modal");
	console.log(reEnteredAccountNumber, "reintered acc number from modal");
	return (
		<div className="add-bank-modal-container" style={{ minHeight: "200px" }}>
			<div style={{ padding: "20px", boxShadow: "0px 1px 4px 0px #0000001F" }} className="modal-base-headline">
				Add opening balance
			</div>

			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }} className="add-bank-modal-body-container">
				<div style={{ padding: "35px 30px", backgroundColor: "white" }} className="add-bank-modal-body">
					{/* <BankSearchInputComponent
						autoFocus={true}
						selectedBank={null}
						onBankChanged={(selectedBank) => {
							setNewBankData({ ...newBankData, bankName: selectedBank });
						}}
					/> */}
					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col_xs_6">
							<NumberInputComponent
								defaultNonZero
								label="Account number"
								value={newBankData.accountNumber}
								onChange={handleAccountNumberChange}
							/>
						</div>
						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							<NumberInputComponent
								defaultNonZero
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
								value={newBankData.ifscCode}
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
