import React, { useState } from "react";
import SVGInline from "react-svg-inline";
import plusIcon from "../../../assets/images/icons/plus.svg";
import menu_three_dots from "../../../assets/images/icons/menu_three_dots.svg";
import ModalService from "../../services/modal.service";
import AddCashModalComponent from "./add-cash-modal.component";
import EditCashModalComponent from "./edit-cash-modal.component";
import OnClickOutside from "../../shared/on-click-outside/on-click-outside.component";

const CashListComponent = () => {
	const [cashData, setCashData] = useState({
		cashBalance: 1234,
		notes: "",
	});

	const openAddCashModal = () => {
		const handleAddCash = (newCashData) => {
			setCashData({ ...newCashData });
			console.log(newCashData, "Hogaya add cash");
			ModalService.close();
		};

		ModalService.open(<AddCashModalComponent onConfirm={handleAddCash} />, {
			width: 630,
		});
	};

	const openEditCashModal = () => {
		const handleEditCash = (editedCashData) => {
			setCashData({ ...editedCashData });
			console.log(editedCashData, "Hogaya edit cash");
			ModalService.close();
		};

		ModalService.open(<EditCashModalComponent formData={cashData} onConfirm={handleEditCash} />, {
			width: 630,
		});
	};

	const handleDeleteCashBalance = () => {
		setCashData({
			cashBalance: 0,
			notes: "",
		});
	};
	const CashListColumnHeadings = () => {
		return (
			<div style={{ fontWeight: "600" }} className="cash-row column-headings">
				<div
					style={{ borderTop: "1px solid #C6C6C6", borderRadius: "4px", height: "0.5px" }}
					className="cash-row-divider"
				/>
				<div
					className="box"
					style={{
						boxShadow: "0px 10px 10px 0px #cccccc",
						padding: 0,
						margin: 0,
						display: "grid",
						gridTemplateColumns: "1fr 9fr",
						textAlign: "center",
					}}
				>
					<p style={{ fontWeight: "600", textAlign: "left", padding: "0 0 0 2.2em" }}>Balance</p>
					<p />
				</div>
			</div>
		);
	};

	const CashRow = ({ cashBalance = 0 }) => {
		const [menuOptionVisible, setMenuOptionVisible] = useState(false);

		return (
			<div className="cash-row">
				<div
					style={{ borderTop: "1px solid #C6C6C6", borderRadius: "4px", height: "0.5px" }}
					className="bank-row-divider"
				/>
				<div
					className="box"
					style={{
						boxShadow: "0px 10px 10px -10px #cccccc",
						padding: 0,
						margin: 0,
						display: "grid",
						gridTemplateColumns: "1fr 9fr",
						textAlign: "center",
					}}
				>
					<p style={{ textAlign: "left", padding: "0 0 0 2em" }}>
						₹
						{Number(cashBalance).toLocaleString("en", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
					<div
						style={{
							color: "#00A353",
							margin: "auto 0",
							display: "flex",
							justifyContent: "right",
						}}
					>
						<span style={{ color: "#00A353", fontWeight: "600", cursor: "pointer" }}>
							View Transactions
						</span>
						<OnClickOutside onClickOutside={() => setMenuOptionVisible(false)}>
							<span
								onClick={() => setMenuOptionVisible(!menuOptionVisible)}
								style={{ margin: "0 25px 0 25px", cursor: "pointer" }}
							>
								<SVGInline svg={menu_three_dots} width="21px" height="5px" />
							</span>
							{menuOptionVisible ? (
								<div
									style={{
										width: "95px",
										color: "#272D30",
										display: "inline-block",
										position: "absolute",
										right: "-23px",
										top: "31px",
										backgroundColor: "white",
										border: "1px solid #CCCCCC",
										marginTop: "10px",
									}}
								>
									<p
										onClick={openEditCashModal}
										style={{
											margin: "8px 0",
											padding: "6px 10px",
											textAlign: "left",
											borderBottom: "1px solid #EBF5FF",
											cursor: "pointer",
										}}
									>
										Edit
									</p>
									<p
										onClick={handleDeleteCashBalance}
										style={{
											margin: "8px 0",
											padding: "6px 10px",
											textAlign: "left",
											borderBottom: "1px solid #EBF5FF",
											cursor: "pointer",
										}}
									>
										Delete
									</p>
								</div>
							) : null}
						</OnClickOutside>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div style={{ padding: 0 }} className="box cash-list-wrapper">
			<div
				style={{ display: "flex", padding: "0px 36px", justifyContent: "space-between" }}
				className="cash-list-heading"
			>
				<p style={{ margin: "21px 0" }} className="text-h4">
					Cash
				</p>
				<p
					onClick={cashData.cashBalance ? null : openAddCashModal}
					// className="add-cash-button
					style={{
						margin: "auto 0",
						fontWeight: "600",
						color: cashData.cashBalance ? "#C6C6C6" : "#00A353",
						cursor: cashData.cashBalance ? "default" : "pointer",
						border: `1px solid ${cashData.cashBalance ? "#C6C6C6" : "#00A353"}`,
						padding: "8px 25px",
						borderRadius: "4px",
					}}
				>
					<SVGInline
						width="14px"
						height="14px"
						svg={plusIcon}
						fill={cashData.cashBalance ? "#C6C6C6" : "#00A353"}
					/>
					<span style={{ marginLeft: "9px" }}>Add opening balance</span>
				</p>
			</div>
			{cashData.cashBalance ? (
				<div className="cash-list">
					<CashListColumnHeadings />
					<CashRow cashBalance={cashData.cashBalance} />
				</div>
			) : null}
		</div>
	);
};

export default CashListComponent;
