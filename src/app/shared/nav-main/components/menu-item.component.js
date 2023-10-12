import invoiz from "services/invoiz.service";
import React, { useState } from "react";
import PropTypes from "prop-types";
import collapse from "assets/images/icons/collapse.svg";
import home from "assets/images/icons/home_new.svg";
import dashboard from "assets/images/icons/dashboard_new.svg";
import contact from "assets/images/icons/contact_new.svg";
import article from "assets/images/icons/articles_new.svg";
import home_hover from "assets/images/icons/home_hover.svg";
import SVGInline from "react-svg-inline";
import dashboard_hover from "assets/images/icons/dashboard_hover.svg";
import articles_hover from "assets/images/icons/articles_hover.svg";
import contacts_hover from "assets/images/icons/contacts_hover.svg";
const MenuItemComponent = (props) => {
	const {
		name,
		url,
		icon,
		active,
		submenuVisible,
		resourceKey,
		resources,
		closeSearchOnMenuItemClick,
		setSubmenuVisible,
		setSubmenuVisibility,
	} = props;

	const [iconHoverActive, setIconHoverActive] = useState(false);

	const iconClass = `icon icon-${icon}`;
	console.log("Icon: ", icon);

	const menuIcons = {
		home_blank: iconHoverActive ? home_hover : home,
		dashboard: iconHoverActive ? dashboard_hover : dashboard,
		customer: iconHoverActive ? contacts_hover : contact,
		article_outlined: iconHoverActive ? articles_hover : article,
		expense: "",
	};

	const activeClass = active ? "menuItem-active" : "";
	const submenuVisibleClass = submenuVisible ? "menuItem-notFocused" : "";
	// const className = `menuItem ${iconClass} ${activeClass} ${submenuVisibleClass}`;
	const className = `menuItem  ${activeClass} ${submenuVisibleClass}`;

	const navigateToPage = (url) => {
		closeSearchOnMenuItemClick();
		invoiz.trigger("updateNewsfeedCount");
		invoiz.trigger("triggerSubmenuHide");
		// if (url === '/offers') {
		// 	invoiz.offerListNaviagtion = true;
		// } else {
		// 	invoiz.offerListNaviagtion = false;
		// }
		invoiz.router.navigate(url);
	};
	// console.log(menuIcons[icon]);
	console.log(icon);
	return (
		<a
			className={className}
			onClick={() => navigateToPage(url)}
			data-href={url}
			data-qs-id={`global-menu-item-${name}`}
			onMouseEnter={() => {
				setIconHoverActive(true), setSubmenuVisibility();
			}}
			onMouseLeave={() => setIconHoverActive(false)}
		>
			<SVGInline svg={menuIcons[icon]} className="menu-item-svg" />
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
