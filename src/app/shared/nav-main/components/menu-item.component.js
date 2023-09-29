import invoiz from "services/invoiz.service";
import React from "react";
import PropTypes from "prop-types";
import collapse from "assets/images/icons/collapse.svg";
import home from "assets/images/icons/home_new.svg";
import dashboard from "assets/images/icons/dashboard_new.svg";
import contact from "assets/images/icons/contact_new.svg";
import article from "assets/images/icons/articles_new.svg";
import SVGInline from "react-svg-inline";

const MenuItemComponent = (props) => {
	const { name, url, icon, active, submenuVisible, resourceKey, resources } = props;

	const iconClass = `icon icon-${icon}`;
	console.log("Icon: ", icon);

	const menuIcons = {
		home_blank: home,
		dashboard: dashboard,
		customer: contact,
		article_outlined: article,
		expense: "",
	};

	const activeClass = active ? "menuItem-active" : "";
	const submenuVisibleClass = submenuVisible ? "menuItem-notFocused" : "";
	// const className = `menuItem ${iconClass} ${activeClass} ${submenuVisibleClass}`;
	const className = `menuItem  ${activeClass} ${submenuVisibleClass}`;

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
	// console.log(menuIcons[icon]);
	console.log(icon);
	return (
		<a
			className={className}
			onClick={() => navigateToPage(url)}
			data-href={url}
			data-qs-id={`global-menu-item-${name}`}
		>
			<SVGInline svg={menuIcons[icon]} width="24px" height="24px" />
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
