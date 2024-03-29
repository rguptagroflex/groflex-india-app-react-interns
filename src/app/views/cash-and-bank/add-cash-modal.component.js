import React, { useEffect, useState } from "react";
import ModalService from "../../services/modal.service";
import ButtonComponent from "../../shared/button/button.component";
import NumberInputComponent from "../../shared/inputs/number-input/number-input.component";

const AddCashModalComponent = ({ onConfirm }) => {
	useEffect(() => {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		return () => {
			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
		};
	}, []);

	const [newCashData, setNewCashData] = useState({
		type: "cash",
		openingBalance: 0,
		bankName: "cash",
		accountNumber: "cash",
		accountName: "cash",
		IFSCCode: "cash",
		branch: "",
		customerId: "",
		notes: "",
	});
	const handleOpeningBalanceChange = (value) => {
		if (!value) {
			setNewCashData({ ...newCashData, openingBalance: 0 });
			return;
		}
		setNewCashData({ ...newCashData, openingBalance: value });
	};

	const handleNotesChange = (event) => {
		setNewCashData({ ...newCashData, notes: event.target.value });
	};

	const handleSave = () => {
		onConfirm(newCashData);
	};
	// console.log(newCashData, "add modal cash data hai");

	return (
		<div className="add-cash-modal-container" style={{ minHeight: "200px" }}>
			<div style={{ padding: "20px", boxShadow: "0px 1px 4px 0px #0000001F" }} className="modal-base-headline">
				Add opening balance
			</div>

			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }} className="add-cash-modal-body-container">
				<div style={{ padding: "35px 30px", backgroundColor: "white" }} className="add-cash-modal-body">
					<NumberInputComponent
						defaultNonZero
						onChange={handleOpeningBalanceChange}
						value={newCashData.openingBalance}
						label="Opening balance"
					/>
					<div className="textarea">
						<label style={{ fontSize: "16px" }} className="textarea_label">
							Notes
						</label>
						<textarea
							className="textarea_input"
							rows="4"
							onChange={handleNotesChange}
							value={newCashData.notes}
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
					<ButtonComponent
						disabled={!newCashData.openingBalance}
						buttonIcon="icon-check"
						callback={handleSave}
						label={"Save"}
					/>
				</div>
			</div>
		</div>
	);
};

export default AddCashModalComponent;
