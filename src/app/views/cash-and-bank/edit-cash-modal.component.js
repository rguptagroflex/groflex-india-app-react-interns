import React, { useEffect, useState } from "react";
import ModalService from "../../services/modal.service";
import ButtonComponent from "../../shared/button/button.component";
import { formatCurrency } from "../../helpers/formatCurrency";
import SelectInput from "../../shared/inputs/select-input/select-input.component";

const cashTypeList = [
	{ label: "Cash", value: "cash" },
	{ label: "Petty Cash", value: "pettyCash" },
];

const EditCashModalComponent = ({ formData, onConfirm }) => {
	const [cashData, setCashData] = useState({
		...formData,
		openingBalance: formData.openingBalance,
		notes: formData.notes,
	});

	const [cashType, setCashType] = useState(formData.cashType);

	const handleCashTypeChange = (option) => {
		if (!option) {
			return;
		}
		setCashType(option.value);
		setCashData({ ...cashData, accountNumber: option.value, bankName: option.label });
		// setFormErrors({ ...formErrors, bankNameError: "" });
	};

	const handleNotesChange = (event) => {
		setCashData({ ...cashData, notes: event.target.value });
	};

	const handleSave = () => {
		onConfirm({ ...cashData });
	};
	console.log(cashData, "edit modal cash data hai");

	return (
		<div className="edit-cash-modal-container" style={{ minHeight: "200px" }}>
			<div style={{ padding: "20px", boxShadow: "0px 1px 4px 0px #0000001F" }} className="modal-base-headline">
				Edit bank details
			</div>

			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }} className="edit-cash-modal-body-container">
				<div style={{ padding: "35px 30px", backgroundColor: "white" }} className="edit-cash-modal-body">
					<div style={{ marginBottom: "21px" }}>
						<label style={{ color: "#747474", fontSize: "16px" }}>Opening balance</label>
						<div style={{ marginTop: "10px" }}>{formatCurrency(cashData.openingBalance)}</div>
					</div>
					{/* <SelectInput
						allowCreate={false}
						notAsync={true}
						loadedOptions={cashTypeList}
						value={cashType}
						options={{
							clearable: false,
							noResultsText: false,
							labelKey: "label",
							valueKey: "value",
							matchProp: "label",
							placeholder: "Cash type",
							handleChange: handleCashTypeChange,
						}}
					/> */}
					<div style={{ marginTop: "18px" }} className="textarea">
						<label style={{ fontSize: "16px" }} className="textarea_label">
							Notes
						</label>
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
						disabled={!cashData.openingBalance}
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
