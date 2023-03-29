import React, { useState } from "react";
import SVGInline from "react-svg-inline";
import plusIcon from "../../../assets/images/icons/plus.svg";
import menu_three_dots from "../../../assets/images/icons/menu_three_dots.svg";
import ModalService from "../../services/modal.service";
import OnClickOutside from "../../shared/on-click-outside/on-click-outside.component";
import AddBankModalComponent from "./add-bank-modal.component";
import EditBankModalComponent from "./edit-bank-modal.component";

const BankListComponent = () => {
	const [banksList, setbanksList] = useState([
		{
			bankName: "HDFC bank",
			accountNumber: "7543635659650233",
			accountName: "Joe Doe",
			ifscCode: "GD56936F4",
			balance: 2300,
			openingBalance: 0,
			branch: "",
			customerId: "",
			notes: "",
		},
		{
			bankName: "Axis Bank",
			accountNumber: "6596457832103652",
			accountName: "Luna Davidson",
			ifscCode: "RP49673J1",
			balance: 1658,
			openingBalance: 0,
			branch: "",
			customerId: "",
			notes: "",
		},
		// {
		// 	bankName: "Axis Bank",
		// 	accountNumber: "6596457832103653",
		// 	accountName: "Luna Davidson",
		// 	ifscCode: "RP49673J2",
		// 	balance: 1658,
		// 	openingBalance: 0,
		// 	branch: "",
		// 	customerId: "",
		// 	notes: "",
		// },
	]);

	const openAddBankModal = () => {
		const handleAddBank = (newBankData) => {
			setbanksList([...banksList, { ...newBankData }]);
			console.log(newBankData, "Hogaya add bank");
			ModalService.close();
		};

		ModalService.open(<AddBankModalComponent onConfirm={handleAddBank} />, {
			width: 630,
		});
	};
	const openEditBankModal = (index) => {
		const handleEditBank = (editedBankData) => {
			let newBanksList = [...banksList];
			newBanksList[index] = { ...editedBankData };
			setbanksList([...newBanksList]);
			console.log(editedBankData, "Hogaya edit bank");
			ModalService.close();
		};

		ModalService.open(<EditBankModalComponent formData={banksList[index]} onConfirm={handleEditBank} />, {
			width: 630,
		});
	};

	const openDeleteBankModal = () => {
		const handleDeleteBank = (accountNumber) => {
			const newBankList = banksList.filter((bank) => {
				return bank.accountNumber !== accountNumber;
			});
			console.log(newBankList, "NEW BANK LIST AFTER DELETING");
			setbanksList([...newBankList]);
			ModalService.close()
		};
		ModalService.open()
	};

	const BankListColumnHeadings = () => {
		return (
			<div style={{ fontWeight: "600" }} className="bank-row column-headings">
				<div
					style={{ borderTop: "1px solid #C6C6C6", borderRadius: "4px", height: "0.5px" }}
					className="bank-row-divider"
				/>
				<div
					className="box"
					style={{
						boxShadow: "0px 10px 10px 0px #cccccc",
						padding: 0,
						margin: 0,
						display: "grid",
						gridTemplateColumns: "2fr 3fr 2fr 2fr 2fr 4fr",
						textAlign: "center",
					}}
				>
					<p>Bank name</p>
					<p>Account number</p>
					<p>Account name</p>
					<p>IFSC code</p>
					<p>Balance</p>
					<p />
				</div>
			</div>
		);
	};

	const BankListRowItem = ({ bankName, accountName, accountNumber, ifscCode, balance, lastItem, index }) => {
		const [menuOptionVisible, setMenuOptionVisible] = useState(false);

		return (
			<div className="bank-row">
				<div
					style={{ borderTop: "1px solid #C6C6C6", borderRadius: "4px", height: "0.5px" }}
					className="bank-row-divider"
				/>
				<div
					className="box"
					style={{
						boxShadow: lastItem ? "0px 10px 10px -10px #cccccc" : "0px 10px 10px 0px #cccccc",
						padding: 0,
						margin: 0,
						display: "grid",
						gridTemplateColumns: "2fr 3fr 2fr 2fr 2fr 4fr",
						textAlign: "center",
					}}
				>
					<p style={{ padding: "0 5px" }}>{bankName}</p>
					<p style={{ padding: "0 5px" }}>{accountNumber}</p>
					<p style={{ padding: "0 5px" }}>{accountName}</p>
					<p style={{ padding: "0 5px" }}>{ifscCode}</p>
					<p style={{ padding: "0 5px" }}>
						₹
						{Number(balance).toLocaleString("en", {
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
										zIndex: 1,
									}}
								>
									<p
										onClick={() => {
											openEditBankModal(index);
										}}
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
										onClick={() => openDeleteBankModal(accountNumber)}
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
	console.log(banksList, "BANK LIST");
	return (
		<div style={{ padding: 0, margin: "0 0 25px 0" }} className="box bank-list-wrapper">
			<div
				style={{ display: "flex", padding: "0px 36px", justifyContent: "space-between" }}
				className="bank-list-heading"
			>
				<p style={{ margin: "21px 0" }} className="text-h4">
					Bank Details
				</p>
				<p
					onClick={banksList.length < 3 ? openAddBankModal : null}
					// className="add-bank-button"
					style={{
						margin: "auto 0",
						fontWeight: "600",
						color: banksList.length < 3 ? "#00A353" : "#C6C6C6",
						cursor: banksList.length < 3 ? "pointer" : "default",
						border: `1px solid ${banksList.length < 3 ? "#00A353" : "#C6C6C6"}`,
						padding: "8px 25px",
						borderRadius: "4px",
					}}
				>
					<SVGInline
						width="14px"
						height="14px"
						svg={plusIcon}
						fill={banksList.length < 3 ? "#00A353" : "#C6C6C6"}
					/>
					<span style={{ marginLeft: "7px" }}> Add new bank</span>
				</p>
			</div>
			{banksList.length ? (
				<div className="bank-list">
					<BankListColumnHeadings />
					{banksList.map((item, index) => {
						return (
							<BankListRowItem
								key={item.ifscCode}
								bankName={item.bankName}
								accountName={item.accountName}
								accountNumber={item.accountNumber}
								ifscCode={item.ifscCode}
								balance={item.balance}
								lastItem={banksList.length === index + 1}
								index={index}
							/>
						);
					})}
				</div>
			) : null}
		</div>
	);
};

export default BankListComponent;
