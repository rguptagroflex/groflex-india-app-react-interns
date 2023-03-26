import React, { useState } from "react";
import ModalService from "../../services/modal.service";
import ButtonComponent from "../../shared/button/button.component";
import NumberInputComponent from "../../shared/inputs/number-input/number-input.component";

const EditCashModalComponent = ({ formData, onConfirm }) => {
	document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
	document.getElementsByClassName("modal-base-content")[0].style.margin = 0;

	const [cashData, setCashData] = useState({
		cashBalance: formData.cashBalance,
		notes: formData.notes,
	});
	const handleCashBalanceChange = (value) => {
		setCashData({ ...cashData, cashBalance: value });
	};

	const handleNotesChange = (event) => {
		setCashData({ ...cashData, notes: event.target.value });
	};

	const handleSave = () => {
		onConfirm(cashData);
	};
	console.log(cashData, "edit modal cash data hai");

	return (
		<div className="add-cash-modal-container" style={{ minHeight: "200px" }}>
			<div style={{ padding: "20px", boxShadow: "0px 1px 4px 0px #0000001F" }} className="modal-base-headline">
				Edit bank details
			</div>

			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }} className="add-cash-modal-body-container">
				<div style={{ padding: "35px 30px", backgroundColor: "white" }} className="add-cash-modal-body">
					<NumberInputComponent
						onChange={handleCashBalanceChange}
						value={cashData.cashBalance}
						label="Opening balance"
					/>
					<div className="textarea">
						<label className="textarea_label">Notes</label>
						<textarea
							className="textarea_input"
							rows="4"
							onChange={handleNotesChange}
							value={cashData.notes}
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
						disabled={!cashData.cashBalance}
						buttonIcon="icon-check"
						callback={handleSave}
						label={"Save"}
					/>
				</div>
			</div>
		</div>
	);
};

export default EditCashModalComponent;
