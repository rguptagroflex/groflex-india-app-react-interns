import invoiz from "services/invoiz.service";
import React from "react";
import PropTypes from "prop-types";
import SubMenuBarComponent from "shared/nav-main/components/submenu-bar.component";
import SubMenuItemComponent from "shared/nav-main/components/submenu-item.component";
import userPermissions from "enums/user-permissions.enum";
import planPermissions from "enums/plan-permissions.enum";
import { connect } from "react-redux";
import sales from "assets/images/icons/sales_new.svg";
import expense from "assets/images/icons/accounting_icon.svg";
import sales_hover from "assets/images/icons/sales_hover.svg";
import expense_hover from "assets/images/icons/expense_hover.svg";
import SVGInline from "react-svg-inline";
// import store from "../../redux/store";
const buildSubmenuComponents = (
	permissions,
	canViewDunning,
	canViewTimesheet,
	noInventory,
	submenuItems,
	activeSubmenuItem,
	resources,
	closeNotificationOnMenuItemClick,
	closeSearchOnMenuItemClick
) => {
	const { canImportArticle, canImportContact, viewAccounting, canViewExpenses } = permissions;
	// console.log('submenuItems', submenuItems)
	if (!canImportArticle && !canImportContact) {
		submenuItems = submenuItems.filter((item) => item.name !== "dataImport");
	}

	if (!canViewDunning) {
		submenuItems = submenuItems.filter((item) => item.name !== "dunning");
	}

	if (!canViewExpenses) {
		submenuItems = submenuItems.filter(
			(item) => item.name !== "expenditure" && item.name !== "chartOfAccounts" && item.name !== "cashAndBank"
		);
	}
	// In all case we need to show timesheet
	// if (!canViewTimesheet) {
	// 	submenuItems = submenuItems.filter(item => item.name !== 'timetracking');
	// }

	if (noInventory) {
		submenuItems = submenuItems.filter((item) => item.name !== "inventory");
	}

	return submenuItems.map((submenuItemData) => {
		const { name } = submenuItemData;
		let active;

		if (name === activeSubmenuItem) {
			active = true;
		}

		return (
			<SubMenuItemComponent
				key={name}
				active={active}
				{...submenuItemData}
				resources={resources}
				closeNotificationOnMenuItemClick={closeNotificationOnMenuItemClick}
				closeSearchOnMenuItemClick={closeSearchOnMenuItemClick}
			/>
		);
	});
};

class MenuItemWithSubmenuComponent1 extends React.Component {
	constructor(props) {
		super(props);

		const {
			activeSubmenuItem,
			closeSearchOnMenuItemClick,
			closeNotificationOnMenuItemClick,
			toggleSubmenuVisibility,
			setSubmenuVisible,
			setSubmenuVisibility,
		} = this.props;

		this.state = {
			setSubmenuVisibility,
			setSubmenuVisible,
			closeNotificationOnMenuItemClick,
			closeSearchOnMenuItemClick,
			submenuVisible: false,
			activeSubmenuItem,
			isCollapsedState: false,
			canViewTextBlocks: null,
			canViewDunning: null,
			canViewTimesheet: null,
			planRestricted: null,
			canChangeAccountData: null,
			noInventory: null,
			submenuVisibleOnclick: false,
			submenuClick: false,
			iconHoverActive: false,
			toggleSubmenuVisibility,
		};

		this.windowResizeTimeout = null;
		this.onWindowResize = this.onWindowResize.bind(this);

		$(window).off("resize", this.onWindowResize);
		$(window).on("resize", this.onWindowResize);

		this.hideSubmenu = this.hideSubmenu.bind(this);
		this.submenuItemClicked = this.submenuItemClicked.bind(this);
		this.submenuCloseIconClicked = this.submenuCloseIconClicked.bind(this);
		this.iconChangeOnHover = this.iconChangeOnHover.bind(this);
	}

	componentDidUpdate(prevProps) {
		const { active } = this.props;
		if (prevProps.active !== active && active === false) {
			this.submenuCloseIconClicked();
		}
	}

	componentDidMount() {
		this.setState({
			canViewTextBlocks: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_TEXT_MODULES),
			canViewDunning: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_DUNNING),
			canViewTimesheet: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_TIMESHEET),
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_OFFER),
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
			noInventory: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_INVENTORY),
		});
		this.onWindowResize();
		invoiz.on("triggerSubmenuHide", this.hideSubmenu, this);
		invoiz.on("triggerSubmenuSwitch", this.switchSubmenu, this);
	}

	componentWillReceiveProps(newProps) {
		const { activeSubmenuItem } = newProps;
		const { activeSubmenuItem: currentActiveSubmenuItem } = this.state;

		if (activeSubmenuItem !== currentActiveSubmenuItem) {
			this.setState({ activeSubmenuItem });
		}
	}

	componentWillUnmount() {
		invoiz.off("triggerSubmenuHide", this.hideSubmenu, this);
		invoiz.off("triggerSubmenuSwitch", this.switchSubmenu, this);
		$(window).off("resize", this.onWindowResize);
	}

	// hideSubmenu(noChangeTrigger) {
	// 	this.setState({ submenuVisible: false }, () => {
	// 		const { onSubmenuVisiblityChanged } = this.props;

	// 		if (!noChangeTrigger) {
	// 			onSubmenuVisiblityChanged(false);
	// 		}
	// 	});
	// }

	hideSubmenu() {
		this.setState({ submenuVisible: false });
	}
	isSubmenuClick(evt) {
		return evt && evt.nativeEvent.target && $(evt.nativeEvent.target).closest(".submenu").length > 0;
	}

	iconChangeOnHover() {
		const { iconHoverActive } = this.state;
		this.setState({ iconHoverActive: !iconHoverActive });
		// console.log("Icon type:", iconHoverActive);
	}

	// showSubmenu(evt, isClick, checkCollapsedState) {
	// 	const { isCollapsedState } = this.state;
	// 	const isSubmenuClick = isClick && this.isSubmenuClick(evt);
	// 	let showSubmenu = true;

	// 	if (checkCollapsedState) {
	// 		showSubmenu = !isCollapsedState;
	// 	}

	// 	if (!isSubmenuClick && showSubmenu) {
	// 		invoiz.trigger("triggerSubmenuSwitch");

	// 		this.setState({ submenuVisible: true }, () => {
	// 			const { onSubmenuVisiblityChanged } = this.props;
	// 			onSubmenuVisiblityChanged(true);

	// 			if (isClick) {
	// 				this.navigateToFirstSubmenuItem();
	// 			}
	// 		});
	// 	}
	// }
	showSubmenu() {
		this.setState({ submenuVisible: true });
	}

	navigateToFirstSubmenuItem(evt) {
		const { submenuItems } = this.props;
		const isSubmenuClick = this.isSubmenuClick(evt);
		const { submenuVisible } = this.state;
		if (submenuItems && submenuItems[0].url && !isSubmenuClick) {
			// if (submenuItems[0].url !== '/offers') {
			// 	invoiz.offerListNaviagtion = false;
			// }
			invoiz.router.navigate(submenuItems[0].url);
		}
	}
	toggleClick(e) {
		// if (this.state.submenuVisible) {
		// 	this.navigateToFirstSubmenuItem();
		// }
		this.setState({ submenuVisibleOnclick: !this.state.submenuVisibleOnclick, active: !this.state.active });
	}

	switchSubmenu() {
		this.setState({ submenuVisible: false });
	}

	onWindowResize() {
		clearTimeout(this.windowResizeTimeout);
		this.windowResizeTimeout = setTimeout(() => {
			if (this.refs.subMenuBarNormal || this.refs.subMenuBarCollapsed) {
				this.setState({ isCollapsedState: !window.matchMedia("(min-width:1300px)").matches });
				if (!window.matchMedia("(min-width:1300px)").matches) {
					this.hideSubmenu();
				}
			}
		}, 100);
	}

	submenuItemClicked() {
		this.setState({ submenuClick: true });
	}

	submenuCloseIconClicked() {
		this.setState({ submenuClick: false });
	}

	render() {
		// console.log("Mid submenu", this.props.setSubmenuVisible);
		const {
			submenuVisible,
			activeSubmenuItem,
			isCollapsedState,
			canViewDunning,
			canViewTimesheet,
			noInventory,
			canView,
			submenuVisibleOnclick,
			submenuClick,
			iconHoverActive,
			closeSearchOnMenuItemClick,
			closeNotificationOnMenuItemClick,
			toggleSubmenuVisibility,
			setSubmenuVisibility,
			setSubmenuVisible,
		} = this.state;
		const {
			title,
			name,
			submenuItems,
			icon,
			hasImprintAndPrivacy,
			resourceKey,
			resources,
			permissions,
			active,
			isSubmenuVisible,
			submenuItemClicked,
			submenuCloseIconClicked,
		} = this.props;
		const submenuItemComponents = buildSubmenuComponents(
			permissions,
			canViewDunning,
			canViewTimesheet,
			noInventory,
			submenuItems,
			activeSubmenuItem,
			resources,
			closeNotificationOnMenuItemClick,
			closeSearchOnMenuItemClick
		);

		const iconClass = `icon icon-${icon}`;
		// const activeClass = active ? "icon-arr_down menuItem-active" : "icon-arr_right";
		// console.log(active);
		const activeClass = active ? "menuItem-active" : "";
		// console.log("Store: ", isSubmenuVisible);
		const submenuActive = activeClass === "menuItem-active";

		const menuIcons = {
			sales: iconHoverActive ? sales_hover : sales,
			expense: iconHoverActive ? expense_hover : expense,
		};

		// const className = `menuItem menuItem-hasSubmenu ${iconClass} ${activeClass} `;
		const className = `menuItem menuItem-hasSubmenu  ${activeClass} `;
		// console.log(submenuItems);

		return (
			<li key={name} id={name}>
				<div className={`sub-menu-main ${submenuVisible ? "visible" : ""}`}>
					<div
						ref="subMenuBarCollapsed"
						// onMouseEnter={() => this.showSubmenu(name)}
						// onMouseEnter={() => console.log(name)}
						className={className}
						data-href={submenuItems[0].url}
						data-qs-id={`global-menu-item-${name}`}
						onMouseEnter={() => {
							this.showSubmenu();
							this.iconChangeOnHover();
							toggleSubmenuVisibility();
						}}
						onMouseLeave={() => {
							this.iconChangeOnHover();
							toggleSubmenuVisibility();
						}}
						onClick={() => {
							closeSearchOnMenuItemClick();
							closeNotificationOnMenuItemClick();
						}}
						// onMouseLeave={() => {
						// 	this.hideSubmenu();
						// }}
					>
						<SVGInline svg={menuIcons[icon]} width="24px" height="24px" className="menuItemIcon" />
					</div>

					<SubMenuBarComponent
						key={`sub-item-${isSubmenuVisible.name}`}
						visible={submenuVisible}
						title={title}
						name={name}
						hasImprintAndPrivacy={hasImprintAndPrivacy}
						resourceKey={resourceKey}
						resources={resources}
						visibleOnclick={submenuVisibleOnclick}
						hideSubmenu={this.hideSubmenu}
						showSubmenu={this.showSubmenu}
						submenuItemClicked={this.submenuItemClicked}
						submenuCloseIconClicked={this.submenuCloseIconClicked}
						submenuClick={submenuClick}
						active={active}
						closeSearchOnMenuItemClick={closeSearchOnMenuItemClick}
						closeNotificationOnMenuItemClick={closeNotificationOnMenuItemClick}
						// setSubmenuVisible={setSubmenuVisible}
						setSubmenuVisible={this.props.setSubmenuVisible}
						setSubmenuVisibility={setSubmenuVisibility}
					>
						{submenuItemComponents}
					</SubMenuBarComponent>
				</div>
			</li>
		);
	}
}

MenuItemWithSubmenuComponent1.propTypes = {
	title: PropTypes.string,
	url: PropTypes.string,
	icon: PropTypes.string,
	active: PropTypes.bool,
	submenuItems: PropTypes.array,
	activeSubmenuItem: PropTypes.string,
	onSubmenuVisiblityChanged: PropTypes.func,
	resourceKey: PropTypes.string,
};

MenuItemWithSubmenuComponent1.defaultProps = {
	title: "",
	url: "",
	icon: "",
	active: false,
	submenuItems: [],
	activeSubmenuItem: "",
	resourceKey: "",
};

const mapStateToProps = (state) => {
	const isSubmenuVisible = state.global.isSubmenuVisible;

	return {
		isSubmenuVisible,
	};
};

export default connect(mapStateToProps, null)(MenuItemWithSubmenuComponent1);

// export default MenuItemWithSubmenuComponent1;
