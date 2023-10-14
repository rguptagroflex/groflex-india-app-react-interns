import React, { useEffect, useState } from "react";
import userPermissions from "enums/user-permissions.enum";
import TopbarComponent from "../../shared/topbar/topbar.component";
import BankListComponent from "./bank-list.component";
import CashListComponent from "./cash-list.component";
import invoiz from "../../services/invoiz.service";
import { connect } from "react-redux";
const CashAndBankComponent = (props) => {
	const submenVisible = props.isSubmenuVisible;
	useEffect(() => {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_ACCOUNTING)) {
			invoiz.user.logout(true);
		}
	}, []);

	const [submenuVisible, setSubmenuVisible] = useState(props.isSubmenuVisible);

	const classLeft = submenVisible ? "leftAlignCashAndBank" : "";
	return (
		<div style={{ padding: "35px 65px" }} className={`cash-and-bank-component-wrapper ${classLeft}`}>
			<TopbarComponent title={`Cash and Bank`} viewIcon={`icon-coins`} />
			<BankListComponent />
			<CashListComponent />
		</div>
	);
};

const mapStateToProps = (state) => {
	const isSubmenuVisible = state.global.isSubmenuVisible;
	return {
		isSubmenuVisible,
	};
};

export default connect(mapStateToProps, null)(CashAndBankComponent);
// export default CashAndBankComponent;
