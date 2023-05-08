import React, { useEffect, useState } from "react";
import userPermissions from "enums/user-permissions.enum";
import TopbarComponent from "../../shared/topbar/topbar.component";
import BankListComponent from "./bank-list.component";
import CashListComponent from "./cash-list.component";
import invoiz from "../../services/invoiz.service";

const CashAndBankComponent = () => {
	useEffect(() => {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_ACCOUNTING)) {
			invoiz.user.logout(true);
		}
	}, []);
	return (
		<div style={{ padding: "35px 65px" }} className="cash-and-bank-component-wrapper">
			<TopbarComponent title={`Cash and Bank`} viewIcon={`icon-coins`} />
			<BankListComponent />
			<CashListComponent />
		</div>
	);
};

export default CashAndBankComponent;
