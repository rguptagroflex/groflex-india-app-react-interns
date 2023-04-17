import React, { useEffect, useState } from "react";
import ModalService from "../../services/modal.service";
import ButtonComponent from "../../shared/button/button.component";

const EditCashModalComponent = ({ formData, onConfirm }) => {
	const [cashData, setCashData] = useState({
		...formData,
		openingBalance: formData.openingBalance,
		notes: formData.notes,
	});

	useEffect(() => {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		return () => {
			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
		};
	}, []);

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

			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }} className="edit-cash-modal-body-container">
				<div style={{ padding: "35px 30px", backgroundColor: "white" }} className="edit-cash-modal-body">
					<div style={{ marginBottom: "21px" }}>
						<label style={{ color: "#747474", fontSize: "16px" }}>Opening balance</label>
						<div style={{ marginTop: "10px" }}>
							₹
							{Number(cashData.openingBalance).toLocaleString("en", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</div>
					</div>
					<div className="textarea">
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
