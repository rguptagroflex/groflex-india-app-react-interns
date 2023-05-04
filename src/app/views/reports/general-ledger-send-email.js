import React, { useState, useEffect } from "react";
import ModalService from "../../services/modal.service";
import ButtonComponent from "../../shared/button/button.component";
import TextInputComponent from "../../shared/inputs/text-input/text-input.component";
import TextInput from "../../shared/inputs/text-input-extended/text-input-extended.component";
import SvgInline from "react-svg-inline";



function generalLedgerSendEmail({ onConfirm }) {
	useEffect(() => {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		return () => {
			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
		};
	});
	const handleSave = () => {
		ModalService.close();
	};
	return (
		<div className="add-chart-modal-container" style={{ minHeight: "200px" }}>
			<div
				style={{
					padding: "20px",
					boxShadow: "0px 1px 4px 0px #0000001F",
				}}
				className="modal-base-headline"
			>
				Send your General Ledger by email
			</div>
			<div
				style={{ padding: "20px" }}
				// style={{ padding: "10px", backgroundColor: "#f5f5f5" }}
			>
				<div
					style={{ display: "flex", flexDirection: "column", marginRight: "15px" }}
					// style={{ padding: "35px 30px", backgroundColor: "white" }}
				></div>
				<div
				// style={{ width: "100%", marginRight: "15px" }}
				>
					<div
						//  style={{ paddingTop: "10px" }}
						className="textarea"
						// style={{ maxHeight: "30px", marginBottom: "100px" }}
					>
						<label style={{ fontSize: "16px" }} className="textarea_label">
							Email address
						</label>
						<textarea
							className="textarea_input"
							style={{ height: "10px", display: "inline-block", marginRight: "5%" }}
							rows="0.5"
							// onChange={handleDescriptionChange}
							// value={chartData.description}
						/>
						<span className="textarea_bar" />
					</div>
					<div
						//  style={{ paddingTop: "10px" }}

						className="textarea"

						// style={{ maxHeight: "30px", display: "flex", flexDirection: "column", marginRight: "15px" }}
					>
						<label style={{ fontSize: "16px" }} className="textarea_label">
							Subject
						</label>
						<textarea
							className="textarea_input"
							rows="1"
							// onChange={handleDescriptionChange}
							// value={chartData.description}
						/>
						<span className="textarea_bar" />
					</div>
					<div
						//  style={{ paddingTop: "10px" }}
						className="textarea"
						// style={{ maxHeight: "30px", display: "flex", flexDirection: "column", marginRight: "15px" }}
					>
						<label style={{ fontSize: "16px" }} className="textarea_label">
							Description
						</label>
						<textarea
							className="textarea_input"
							rows="3"
							// onChange={handleDescriptionChange}
							// value={chartData.description}
						/>
						<span className="textarea_bar" />
					</div>
					<input
						id="csv-upload"
						className="u_hidden"
						type="file"
						// onChange={handleBankStatementFileChange}
					/>
					<label htmlFor="csv-upload" style={{ fontWeight: 600, color: "#00A353", cursor: "pointer" }}>
						{/* <SvgInline svg={greenUploadIcon} width="20px" height="21px" /> */}

						<span style={{ marginLeft: "5px" }}>Upload </span>
					</label>
				</div>
			</div>

			<div style={{ position: "relative" }} className="modal-base-footer">
				<div className="modal-base-cancel">
					<ButtonComponent callback={() => ModalService.close()} type="cancel" label={"Cancel"} />
				</div>
				<div className="modal-base-confirm">
					<ButtonComponent buttonIcon="icon-check" callback={handleSave} label={"Save"} />
				</div>
			</div>
		</div>
	);
}

export default generalLedgerSendEmail;
