import invoiz from "services/invoiz.service";
import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { setSubmenuVisibleGlobal } from "../../../redux/ducks/global";
import { setSideBarVisibleStatic } from "../../../redux/ducks/global";
const SubmenuItemComponent = ({
	url,
	active,
	name,
	resourceKey,
	resources,

	closeSearchOnMenuItemClick,
	closeNotificationOnMenuItemClick,

	setSideBarVisibleStatic,
}) => {
	const className = `submenuItem ${active ? "submenuItem-active" : ""}`;

	const setGlobalSideBarVisibleStatic = () => {
		console.log("Name: ", name);
		if (
			name === "offer" ||
			name === "recurringInvoice" ||
			name === "timetracking" ||
			name === "invoice" ||
			name === "proformaInvoices"
		) {
			setSideBarVisibleStatic({
				invoices: { name: "invoices", sidebarVisible: true },
				expenditure: { name: "expenditure", sidebarVisible: false },
			});
		} else if (
			name === "transactions" ||
			name === "cashAndBank" ||
			name === "debitNotes" ||
			name === "creditNotes" ||
			name === "expenditures" ||
			name === "reports" ||
			name === "chartOfAccounts"
		) {
			setSideBarVisibleStatic({
				invoices: { name: "invoices", sidebarVisible: false },
				expenditure: { name: "expenditure", sidebarVisible: true },
			});
		}
	};

	const navigateToPage = (url) => {
		closeNotificationOnMenuItemClick();
		closeSearchOnMenuItemClick();

		// if (url === '/offers') {
		// 	invoiz.offerListNaviagtion = true;
		// } else {
		// 	invoiz.offerListNaviagtion = false;
		// }
		invoiz.trigger("updateNewsfeedCount");
		invoiz.router.navigate(url);
	};

	// console.log("Name: ", name);

	return (
		<li className={className}>
			<a
				onClick={() => {
					setGlobalSideBarVisibleStatic();
					navigateToPage(url);
				}}
				data-href={url}
				data-qs-id={`global-submenu-item-${name}`}
			>
				{resources.subMenuItems[resourceKey]}
			</a>
		</li>
	);
};

SubmenuItemComponent.propTypes = {
	url: PropTypes.string,
	active: PropTypes.bool,
	resourceKey: PropTypes.string,
};

SubmenuItemComponent.defaultProps = {
	url: "",
	active: false,
	resourceKey: "",
};

const mapStateToProps = (state) => {
	return {};
};

const mapDispatchToProps = (dispatch) => {
	return {
		setSideBarVisibleStatic: (payload) => {
			dispatch(setSideBarVisibleStatic(payload));
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(SubmenuItemComponent);

// export default SubmenuItemComponent;
