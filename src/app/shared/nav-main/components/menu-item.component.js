import invoiz from "services/invoiz.service";
import React from "react";
import PropTypes from "prop-types";

const MenuItemComponent = (props) => {
	const { name, url, icon, active, submenuVisible, resourceKey, resources } = props;

	const iconClass = `icon icon-${icon}`;
	const activeClass = active ? "menuItem-active" : "";
	const submenuVisibleClass = submenuVisible ? "menuItem-notFocused" : "";
	const className = `menuItem ${iconClass} ${activeClass} ${submenuVisibleClass}`;

	const navigateToPage = (url) => {
		invoiz.trigger("updateNewsfeedCount");
		invoiz.trigger("triggerSubmenuHide");
		// if (url === '/offers') {
		// 	invoiz.offerListNaviagtion = true;
		// } else {
		// 	invoiz.offerListNaviagtion = false;
		// }
		invoiz.router.navigate(url);
	};

	return (
		<a
			className={className}
			onClick={() => navigateToPage(url)}
			data-href={url}
			data-qs-id={`global-menu-item-${name}`}
		>
			{resources.menuItems[resourceKey]}
			{/* <span className="collapsed-title">{resources.menuItems[resourceKey]}</span> */}
		</a>
	);
};

MenuItemComponent.propTypes = {
	title: PropTypes.string,
	url: PropTypes.string,
	icon: PropTypes.string,
	active: PropTypes.bool,
	submenuVisible: PropTypes.bool,
	resourceKey: PropTypes.string,
};

MenuItemComponent.defaultProps = {
	title: "",
	url: "",
	icon: "",
	active: false,
	submenuVisible: false,
	resourceKey: "",
};

export default MenuItemComponent;
