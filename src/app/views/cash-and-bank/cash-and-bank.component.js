import React, { useEffect, useState } from "react";
import userPermissions from "enums/user-permissions.enum";
import TopbarComponent from "../../shared/topbar/topbar.component";
import BankListComponent from "./bank-list.component";
import CashListComponent from "./cash-list.component";
import invoiz from "../../services/invoiz.service";
import { connect } from "react-redux";
const CashAndBankComponent = (props) => {
	useEffect(() => {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_ACCOUNTING)) {
			invoiz.user.logout(true);
		}
	}, []);

	const classLeft =
		props.sideBarVisibleStatic["invoices"].sidebarVisible ||
		props.sideBarVisibleStatic["expenditure"].sidebarVisible
			? "leftAlignCashAndBank"
			: "";
	return (
		<div style={{ padding: "35px 65px" }} className={`cash-and-bank-component-wrapper ${classLeft}`}>
			<TopbarComponent title={`Cash and Bank`} viewIcon={`icon-coins`} />
			<BankListComponent />
			<CashListComponent />
		</div>
	);
};

const mapStateToProps = (state) => {
	const sideBarVisibleStatic = state.global.sideBarVisibleStatic;
	return {
		sideBarVisibleStatic,
	};
};

export default connect(mapStateToProps, null)(CashAndBankComponent);
// export default CashAndBankComponent;
