import invoiz from "services/invoiz.service";
import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { submenuVisible } from "../../../redux/ducks/global";
const SubmenuItemComponent = ({ url, active, name, resourceKey, resources, submenuVisible }) => {
	const className = `submenuItem ${active ? "submenuItem-active" : ""}`;

	const navigateToPage = (url) => {
		submenuVisible(true);
		// if (url === '/offers') {
		// 	invoiz.offerListNaviagtion = true;
		// } else {
		// 	invoiz.offerListNaviagtion = false;
		// }
		invoiz.trigger("updateNewsfeedCount");
		invoiz.router.navigate(url);
	};

	return (
		<li className={className}>
			<a onClick={() => navigateToPage(url)} data-href={url} data-qs-id={`global-submenu-item-${name}`}>
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

const mapDispatchToProps = (dispatch) => {
	return {
		submenuVisible: (payload) => {
			dispatch(submenuVisible(payload));
		},
	};
};

export default connect(null, mapDispatchToProps)(SubmenuItemComponent);

// export default SubmenuItemComponent;
