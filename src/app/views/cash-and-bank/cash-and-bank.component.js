import React from "react";
import TopbarComponent from "../../shared/topbar/topbar.component";
import SVGInline from "react-svg-inline";
import plusIcon from "../../../assets/images/icons/plus.svg";

const banksList = [
	{
		bankName: "HDFC bank",
		accountNumber: "7543-6356-5965-0233",
		accountName: "Joe Doe",
		ifcsCode: "GD56936F4",
		balance: 2300,
	},
	{
		bankName: "Axis Bank",
		accountNumber: "6596-4578-3210-3653",
		accountName: "Luna Davidson",
		ifcsCode: "RP49673J1",
		balance: 1658,
	},
	{
		bankName: "Axis Bank",
		accountNumber: "6596-4578-3210-3653",
		accountName: "Luna Davidson",
		ifcsCode: "RP49673J1",
		balance: 1658,
	},
];

const BankListColumnHeadings = () => {
	return (
		<div style={{ fontWeight: "600" }} className="bank-row column-headings">
			<div
				style={{ border: "1px solid #C6C6C6", borderRadius: "4px", height: "0.5px" }}
				className="bank-row-divider"
			/>
			<div
				className="box"
				style={{
					boxShadow: "0px 10px 10px 0px #cccccc",
					padding: 0,
					margin: 0,
					display: "grid",
					gridTemplateColumns: "2fr 3fr 2fr 2fr 2fr 5fr",
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
const BankListRowItems = ({ bankName, accountName, accountNumber, ifcsCode, balance, lastItem }) => {
	return (
		<div className="bank-row">
			<div
				style={{ border: "1px solid #C6C6C6", borderRadius: "4px", height: "0.5px" }}
				className="bank-row-divider"
			/>
			<div
				className="box"
				style={{
					boxShadow: `${lastItem ? "0px 10px 10px -10px #cccccc" : "0px 10px 10px 0px #cccccc"}`,
					padding: 0,
					margin: 0,
					display: "grid",
					gridTemplateColumns: "2fr 3fr 2fr 2fr 2fr 5fr",
					textAlign: "center",
				}}
			>
				<p>{bankName}</p>
				<p>{accountNumber}</p>
				<p>{accountName}</p>
				<p>{ifcsCode}</p>
				<p>
					₹
					{Number(balance).toLocaleString("en", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}
				</p>
				<p />
			</div>
		</div>
	);
};

const CashAndBankComponent = () => {
	return (
		<div style={{ padding: "35px 65px" }} className="cash-and-bank-component-wrapper">
			<div>
				{/* {planRestricted ? (
				<RestrictedOverlayComponent
					message={
						canChangeAccountData
							? "Expenditures are not available in your current plan"
							: `You don’t have permission to access expenditures`
					}
					owner={canChangeAccountData}
				/>
			) : null} */}
			</div>

			<TopbarComponent title={`Cash and Bank`} viewIcon={`icon-coins`} />
			<div style={{ padding: 0 }} className="box bank-list-wrapper">
				<div
					style={{ display: "flex", padding: "0px 20px", justifyContent: "space-between" }}
					className="bank-list-heading"
				>
					<p style={{ margin: "21px 0" }} className="text-h4">
						Bank Details
					</p>
					<p
						className="add-bank-button"
						style={{
							margin: "21px 0",
							color: banksList.length < 3 ? "#00A353" : "#C6C6C6",
							cursor: banksList.length < 3 ? "pointer" : "default",
							fontWeight: "600",
							margin: "auto 0",
						}}
					>
						<SVGInline width="14px" height="14px" svg={plusIcon} className="add-bank-icon" />
						<span style={{ marginLeft: "7px" }}>Add new bank</span>
					</p>
				</div>
				<div className="bank-list">
					<BankListColumnHeadings />
					{banksList.map((item, index) => {
						return (
							<BankListRowItems
								key={item.ifcsCode}
								bankName={item.bankName}
								accountName={item.accountName}
								accountNumber={item.accountNumber}
								ifcsCode={item.ifcsCode}
								balance={item.balance}
								lastItem={banksList.length === index + 1}
							/>
						);
					})}
				</div>
			</div>
			<div className="cash-list-wrapper">
				<div className=""></div>
			</div>
		</div>
	);
};

export default CashAndBankComponent;
