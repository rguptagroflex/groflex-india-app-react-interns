import React from "react";
import TopbarComponent from "../../shared/topbar/topbar.component";
import BankListComponent from "./bank-list.component";
import CashListComponent from "./cash-list.component";

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
			<BankListComponent />
			<CashListComponent />
		</div>
	);
};

export default CashAndBankComponent;
