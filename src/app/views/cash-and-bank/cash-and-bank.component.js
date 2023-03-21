import React from "react";
import TopbarComponent from "../../shared/topbar/topbar.component";

const CashAndBankComponent = () => {
	return (
		<div className="cash-and-bank-component-wrapper">
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
			<TopbarComponent title={`Cash and Bank`} viewIcon={`icon-coins`} />
			<div className="bank-list-wrapper"></div>
			<div className="cash-list-wrapper"></div>
		</div>
	);
};

export default CashAndBankComponent;
