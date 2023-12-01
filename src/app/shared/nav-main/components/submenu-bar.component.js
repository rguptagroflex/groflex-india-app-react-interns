import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import CloseIcon from "@material-ui/icons/Close";
import { connect } from "react-redux";
import { setSubmenuVisibleGlobal } from "../../../redux/ducks/global";
import arrowLeft from "assets/images/svg/semicircular-left-arrow.svg";
import collapse from "assets/images/icons/collapse.svg";
import SVGInline from "react-svg-inline";
import { setSideBarVisibleHover } from "../../../redux/ducks/global";
import { setSideBarVisibleStatic } from "../../../redux/ducks/global";
const SubmenuBarComponent = ({
	title,
	name,
	visible,
	hasImprintAndPrivacy,
	children,
	resourceKey,
	resources,
	visibleOnclick,
	hideSubmenu,

	submenuClick,
	submenuItemClicked,
	submenuCloseIconClicked,
	submenuActive,
	showSubmenu,
	active,
	closeSearchOnMenuItemClick,
	closeNotificationOnMenuItemClick,
	submenuHover,
	setSubmenuVisibleHoverFalse,
	sideBarVisibleHover,
	setSideBarVisibleHover,
	sideBarVisibleStatic,
	setSideBarVisibleStatic,
}) => {
	// console.log("Slected Key", selectedName);
	let hoverClass = "";

	const [iconClose, setIconClose] = useState(visible);
	if (active === true && visible === false) {
		hoverClass = "submenuStatic";
	}
	if (active === false && visible === true) {
		hoverClass = "submenuHover";
	}
	if (active === true && visible === true) {
		hoverClass = "submenuHover";
	}
	// const hoverClass = active ? "submenuStatic" : "submenuHover";
	// console.log("Active: ", active, "Visible", visible);
	useEffect(() => {
		setIconClose(visible);
	}, [visible]);

	// const visibleClass = submenuHover || submenuClick ? "submenu-visible" : "u_hidden";
	const visibleClass =
		sideBarVisibleHover[name].sidebarVisible || sideBarVisibleStatic[name].sidebarVisible
			? "submenu-visible"
			: "u_hidden";

	// const visibleClass = "submenu-visible";
	// console.log("key ", resourceKey);
	const className = `submenu submenu-${name} ${visibleClass} ${hoverClass}`;

	const imprint = (
		<div className="submenuImprint">
			<div>
				<a href="https://groflex.in/privacy-policy" target="_blank">
					{resources.str_imprint}
				</a>
			</div>
			<div>
				<a href="https://groflex.in/terms-&-conditions" target="_blank">
					{"Terms & Conditions"}
				</a>
			</div>
		</div>
	);

	const setSideBarVisibleStaticFalse = () => {
		setSideBarVisibleStatic({
			invoices: { name: "invoices", sidebarVisible: false },
			expenditure: { name: "expenditure", sidebarVisible: false },
		});
	};

	const onCloseClick = () => {
		hideSubmenu();
		submenuCloseIconClicked();

		// setSubmenuVisibleHoverFalse();
		setSideBarVisibleStaticFalse();
	};
	const subMenuOverlay = () => {
		setIconClose(false);
	};

	// const onMouseHover = () => {
	// 	hideSubmenu();
	// };

	const ulClicked = () => {
		alert("click");
	};

	const setSideBarVisibleHoverFalse = () => {
		setSideBarVisibleHover({
			invoices: { name: "invoices", sidebarVisible: false },
			expenditure: { name: "expenditure", sidebarVisible: false },
		});
	};

	return (
		<div>
			<div
				className={className}
				onMouseLeave={() => {
					hideSubmenu(), setSideBarVisibleHoverFalse();
				}}
				onMouseEnter={() => showSubmenu()}
			>
				{/* <div onClick={() => onCloseClick()} className=" icon icon-back_arrow submenu-close" /> */}

				<div onClick={() => onCloseClick()} className="submenu-close">
					<SVGInline svg={collapse} width="24px" height="24px" onClick={() => onCloseClick()} />
				</div>

				{/* <div onClick={() => onCloseClick()} className=" icon icon-collapse submenu-close" /> */}
				<div className="submenuTitle">
					{resources.menuItems[resourceKey].charAt(0).toUpperCase() +
						resources.menuItems[resourceKey].slice(1)}
				</div>
				<div onClick={() => submenuItemClicked()}>
					<ul className="submenuList">{children}</ul>
				</div>
				{hasImprintAndPrivacy ? imprint : null}
			</div>
		</div>
	);
};

SubmenuBarComponent.propTypes = {
	title: PropTypes.string,
	visible: PropTypes.bool,
};

SubmenuBarComponent.defaultProps = {
	title: "",
	visible: false,
};

const mapStateToProps = (state) => {
	const sideBarVisibleHover = state.global.sideBarVisibleHover;
	const sideBarVisibleStatic = state.global.sideBarVisibleStatic;

	return {
		sideBarVisibleHover,
		sideBarVisibleStatic,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		setSideBarVisibleHover: (payload) => {
			dispatch(setSideBarVisibleHover(payload));
		},
		setSideBarVisibleStatic: (payload) => {
			dispatch(setSideBarVisibleStatic(payload));
		},
	};
};

// export default SubmenuBarComponent;
export default connect(mapStateToProps, mapDispatchToProps)(SubmenuBarComponent);
