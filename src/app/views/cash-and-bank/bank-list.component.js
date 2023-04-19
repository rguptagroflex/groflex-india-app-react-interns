import React, { useEffect, useState } from "react";
import SVGInline from "react-svg-inline";
import plusIcon from "../../../assets/images/icons/plus.svg";
import menu_three_dots from "../../../assets/images/icons/menu_three_dots.svg";
import ModalService from "../../services/modal.service";
import OnClickOutside from "../../shared/on-click-outside/on-click-outside.component";
import AddBankModalComponent from "./add-bank-modal.component";
import EditBankModalComponent from "./edit-bank-modal.component";
import invoiz from "../../services/invoiz.service";
import config from "../../../config";
import { Link } from "react-router-dom";

const BankListComponent = () => {
	const [banksList, setBanksList] = useState([]);
	useEffect(() => {
		getBanksList();
	}, []);

	const getBanksList = () => {
		invoiz.request(`${config.resourceHost}bank`, { auth: true }).then((res) => {
			console.log(res.body.data);
			setBanksList([...res.body.data].filter((bank) => bank.type === "bank"));
		});
	};

	const getBankDetails = (id) => {
		return invoiz.request(`${config.resourceHost}bank/${id}`, { auth: true });
	};

	const openAddBankModal = () => {
		const handleAddBank = (newBankData) => {
			invoiz
				.request(`${config.resourceHost}bank`, { auth: true, method: "POST", data: { ...newBankData } })
				.then((res) => {
					setBanksList([...banksList, { ...res.body.data }]);
				});
			ModalService.close();
		};
		ModalService.open(<AddBankModalComponent onConfirm={handleAddBank} />, {
			width: 630,
		});
	};

	const openEditBankModal = (index, id) => {
		const handleEditBank = (editedBankData) => {
			invoiz
				.request(`${config.resourceHost}bank/${id}`, {
					auth: true,
					method: "PUT",
					data: { ...editedBankData },
				})
				.then((res) => {
					console.log(res, "EDIT BANK KA RESPONSE new");
					// let newBanksList = [...banksList];
					// newBanksList[index] = { ...editedBankData };
					// setBanksList([...newBanksList]);
					getBanksList();
				});

			// console.log(editedBankData, "Hogaya edit bank");
			ModalService.close();
		};
		getBankDetails(id).then((res) =>
			ModalService.open(<EditBankModalComponent formData={res.body.data} onConfirm={handleEditBank} />, {
				width: 630,
			})
		);
	};

	const openDeleteBankModal = (id) => {
		const handleDeleteBank = () => {
			invoiz.request(`${config.resourceHost}bank/${id}`, { auth: true, method: "DELETE" }).then((res) => {
				// console.log(res, "DELETE KIYA BANK");
				// const newBankList = banksList.filter((bank) => {
				// 	return bank.id !== id;
				// });
				// setBanksList([...newBankList]);
				getBanksList();
			});
			ModalService.close();
		};

		ModalService.open(`Do you really want to delete this bank account?`, {
			width: 600,
			headline: `Delete this bank account`,
			cancelLabel: "Cancel",
			confirmLabel: `Delete`,
			confirmButtonType: "primary",
			onConfirm: () => handleDeleteBank(),
		});
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
						gridTemplateColumns: "3fr 3fr 2fr 2fr 2fr 4fr",
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

	const BankListRowItem = ({ bank, lastItem, index }) => {
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
						gridTemplateColumns: "3fr 3fr 2fr 2fr 2fr 4fr",
						textAlign: "center",
					}}
				>
					<p style={{ padding: "0 5px" }}>{bank.bankName}</p>
					<p style={{ padding: "0 5px" }}>{bank.accountNumber}</p>
					<p style={{ padding: "0 5px" }}>{bank.accountName}</p>
					<p style={{ padding: "0 5px" }}>{bank.IFSCCode.toUpperCase()}</p>
					<p style={{ padding: "0 5px" }}>
						₹
						{Number(bank.openingBalance).toLocaleString("en", {
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
						<Link
							to={`/expenses/transactions/${bank.id}`}
							style={{ color: "#00A353", fontWeight: "600", cursor: "pointer" }}
						>
							View Transactions
						</Link>
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
											openEditBankModal(index, bank.id);
										}}
										style={{
											margin: "0",
											padding: "12px 10px",
											textAlign: "left",
											borderBottom: "1px solid #EBF5FF",
											cursor: "pointer",
										}}
									>
										Edit
									</p>
									<p
										onClick={() => openDeleteBankModal(bank.id)}
										style={{
											margin: "0",
											padding: "12px 10px",
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

	// console.log(banksList, "BANK LIST COMPONENT's BANK LIST");
	return (
		<div style={{ padding: 0, margin: "0 0 25px 0" }} className="box bank-list-wrapper">
			<div
				style={{ display: "flex", padding: "0px 36px", justifyContent: "space-between" }}
				className="bank-list-heading"
			>
				<p style={{ margin: "21px 0" }} className="text-h4">
					Bank Details
					<span style={{ fontSize: 12, fontWeight: 400, display: "block" }}> (Max 3 banks allowed) </span>
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
								key={item.accountNumber}
								lastItem={banksList.length === index + 1}
								index={index}
								bank={item}
								// bankName={item.bankName}
								// accountName={item.accountName}
								// accountNumber={item.accountNumber}
								// ifscCode={item.IFSCCode}
								// balance={item.openingBalance}
							/>
						);
					})}
				</div>
			) : null}
		</div>
	);
};

export default BankListComponent;
