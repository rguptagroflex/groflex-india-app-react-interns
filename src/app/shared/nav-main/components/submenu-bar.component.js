import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import CloseIcon from "@material-ui/icons/Close";
import { connect } from "react-redux";
import { submenuVisible } from "../../../redux/ducks/global";
import arrowLeft from "assets/images/svg/semicircular-left-arrow.svg";
import collapse from "assets/images/icons/collapse.svg";
import SVGInline from "react-svg-inline";
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
	submenuVisible,
	isSubmenuVisible,
	submenuClick,
	submenuItemClicked,
	submenuCloseIconClicked,
	submenuActive,
	showSubmenu,
	active,
	closeSearchOnMenuItemClick,
	closeNotificationOnMenuItemClick,
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
	const visibleClass = visible || submenuClick ? "submenu-visible" : "u_hidden";

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

	const onCloseClick = () => {
		hideSubmenu();
		submenuCloseIconClicked();
		submenuVisible(false);
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
	return (
		<div>
			<div className={className} onMouseLeave={() => hideSubmenu()} onMouseEnter={() => showSubmenu()}>
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
	const isSubmenuVisible = state.global.isSubmenuVisible;

	return {
		isSubmenuVisible,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		submenuVisible: (payload) => {
			dispatch(submenuVisible(payload));
		},
	};
};

// export default SubmenuBarComponent;
export default connect(mapStateToProps, mapDispatchToProps)(SubmenuBarComponent);
