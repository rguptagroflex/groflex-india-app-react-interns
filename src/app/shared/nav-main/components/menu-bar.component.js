import React from "react";
import invoiz from "services/invoiz.service";
import PropTypes from "prop-types";
import MenuItemComponent from "shared/nav-main/components/menu-item.component";
import MenuItemWithSubmenuComponent from "shared/nav-main/components/menu-item-with-submenu.component";
import MenuItemWithSubmenuComponent1 from "shared/nav-main/components/menu-item-with-submenu.component1";
import config from "config";
import { setSubmenuVisibleGlobal } from "../../../redux/ducks/global";
import userPermissions from "enums/user-permissions.enum";
import planPermissions from "enums/plan-permissions.enum";
import { connect } from "react-redux";
class MenuBarComponent extends React.Component {
	constructor(props) {
		super(props);

		const { activeItem, activeSubmenuItem, closeSearchOnMenuItemClick, closeNotificationOnMenuItemClick } = props;
		this.state = {
			closeNotificationOnMenuItemClick,
			closeSearchOnMenuItemClick,
			activeItem,
			activeSubmenuItem,
			canSeeEditGstReports: null,
			canImportArticle: null,
			canImportContact: null,
			canViewTextBlocks: null,
			canViewDunning: null,
			canViewOffer: null,
			canViewImprezzOffer: null,
			canViewExpenses: null,
			canViewPurchaseOrder: null,
			canViewDashboard: null,
			canViewStockMovement: null,
			noGST: null,
			menuItems: config.menuItemsData,
			submenuHover: false,
		};
		this.setSubmenuVisibleHoverTrue = this.setSubmenuVisibleHoverTrue.bind(this);
		this.setSubmenuVisibleHoverFalse = this.setSubmenuVisibleHoverFalse.bind(this);
	}

	componentDidUpdate(prevProps, prevState) {
		const { submenuVisible } = this.props;
		const { activeSubmenuItem, activeItem } = this.state;
		if (prevState.activeSubmenuItem === "creditNotes" && activeSubmenuItem === "invoice") {
			submenuVisible(false);
		}
		if (prevState.activeSubmenuItem === "transactions" && activeSubmenuItem === "invoice") {
			submenuVisible(false);
		}
		if (prevState.activeItem !== "customers" && activeItem === "customers") {
			submenuVisible(false);
		}
		if (prevState.activeItem !== "articles" && activeItem === "articles") {
			submenuVisible(false);
		}
	}

	componentDidMount() {
		this.setState({
			canSeeEditGstReports: invoiz.user && invoiz.user.hasPermission(userPermissions.MODIFY_SEE_GST_REPORTS),
			canImportArticle: invoiz.user && invoiz.user.hasPermission(userPermissions.ARTICLE_IMPORT),
			canImportContact: invoiz.user && invoiz.user.hasPermission(userPermissions.CUSTOMER_IMPORT),
			canViewTextBlocks: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_TEXT_MODULES),
			canViewDunning: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_DUNNING),
			canViewOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_OFFER),
			canViewImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_IMPREZZ_OFFER),
			canViewExpenses: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_EXPENSE),
			canViewPurchaseOrder: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_PURCHASE_ORDER),
			canViewDashboard: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_DASHBOARD),
			canViewStockMovement: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_STOCK_MOVEMENT),
			noGST: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_GST_EXPORT),
			viewAccounting: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_ACCOUNTING),
		});
	}

	componentWillReceiveProps(newProps) {
		const { activeItem, activeSubmenuItem, submenuVisible } = newProps;
		const { activeItem: currentActiveItem, activeSubmenuItem: currentActiveSubmenuItem, submenuHover } = this.state;
		// const newState = Object.assign({}, this.state, { submenuVisible });
		const newState = Object.assign({}, { ...this.state, submenuVisible, submenuHover });

		if (activeItem !== currentActiveItem) {
			Object.assign(newState, { activeItem });

			const isMenuItemWithSubmenuActive = !!config.menuItemsData.find((menuItem) => {
				return menuItem.name === activeItem && !!menuItem.submenuItems;
			});

			config.menuItemsData.forEach((menuItem) => {
				if (menuItem.submenuItems) {
					if (
						menuItem.name === activeItem &&
						this.refs &&
						this.refs[`menuItemWithSubmenu-${menuItem.name}`]
					) {
						// this.refs[`menuItemWithSubmenu-${menuItem.name}`].showSubmenu(null, false, true);
					} else if (
						menuItem.name !== activeItem &&
						this.refs &&
						this.refs[`menuItemWithSubmenu-${menuItem.name}`]
					) {
						// this.refs[`menuItemWithSubmenu-${menuItem.name}`].hideSubmenu(isMenuItemWithSubmenuActive);
					}
				}
			});
		}

		if (activeSubmenuItem !== currentActiveSubmenuItem) {
			Object.assign(newState, { activeSubmenuItem });
		}

		this.setState(newState);
		this.setState({
			canViewExpenses: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_EXPENSE),
			viewAccounting: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_ACCOUNTING),
		});
	}

	buildPermittedItems() {
		const {
			canSeeEditGstReports,
			canViewImprezzOffer,
			canViewOffer,
			canViewExpenses,
			viewAccounting,
			canViewPurchaseOrder,
			canViewDashboard,
			noGST,
			menuItems,
		} = this.state;
		const permitteditems = [...config.menuItemsData];
		// console.log('permitteditems', permitteditems, invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_EXPENSE))
		//  if (!canSeeEditGstReports && !canViewExpenses && !canViewDashboard) {
		// 	return permitteditems.filter(item => item.name !== 'documentExport');
		//  }
		//  if (!canViewOffer && !canViewImprezzOffer && !canViewPurchaseOrder) {
		// 	return permitteditems.filter(item => item.name !== 'offers' && item.name !== 'purchaseOrders');
		//  }
		//  if (!canViewDashboard) {
		// 	return permitteditems.filter(item => item.name !== 'dashboard');
		//   }
		//console.log('buildPermittedItems', canViewExpenses, viewAccounting)
		if (invoiz.user.rights != null && !canViewExpenses) {
			return permitteditems.filter((item) => item.name !== "expenditure");
		}
		// if (!canSeeEditGstReports) {
		// 	return permitteditems.filter(item => item.name !== 'documentExport');
		// }
		// if (!canViewPurchaseOrder) {
		// 	return permitteditems.filter(item => item.name !== 'purchaseOrders');
		// }
		// if(noGST) {
		// 	return permitteditems.filter(item => item.name !== 'documentExport');
		// }
		// console.log('permitteditems2', permitteditems)
		return permitteditems;
	}

	buildMenuItems(items) {
		const { activeItem, activeSubmenuItem, canImportArticle, canImportContact, canViewDunning, canViewExpenses } =
			this.state;
		const { submenuVisible, onSubmenuChanged, resources } = this.props;
		const permissions = {
			canImportArticle,
			canImportContact,
			canViewDunning,
			canViewExpenses,
		};

		if (!canViewExpenses) {
			items.push({
				name: "admin-panel",
				icon: "expense",
				title: "Accounting",
				url: "/settings/billing",
				resourceKey: "accounting",
			});
		}
		//const items = [...config.menuItemsData];
		if (invoiz.user.isAdmin) {
			items.push({
				name: "admin-panel",
				icon: "settings",
				title: "Admin Panel",
				url: "/admin-panel",
				resourceKey: "adminpanel",
			});
		}

		return items.map((menuItemData) => {
			const { name, submenuItems } = menuItemData;
			const active = name === activeItem;
			Object.assign(menuItemData, { active, submenuVisible });

			if (submenuItems && submenuItems.length > 0) {
				return (
					<MenuItemWithSubmenuComponent
						ref={`menuItemWithSubmenu-${name}`}
						key={name}
						activeSubmenuItem={activeSubmenuItem}
						onSubmenuVisiblityChanged={onSubmenuChanged}
						{...menuItemData}
						resources={resources}
						permissions={permissions}
					/>
				);
			}
			return <MenuItemComponent key={name} {...menuItemData} resources={resources} />;
		});
	}

	setSubmenuVisibleHoverTrue() {
		// const { submenuHover } = this.state;
		this.setState({ submenuHover: true });
		// console.log("Set Submenu", submenuHover);
	}
	setSubmenuVisibleHoverFalse() {
		this.setState({ submenuHover: false });
	}

	buildMenuItems2(items) {
		const {
			activeItem,
			activeSubmenuItem,
			canImportArticle,
			canImportContact,
			canViewDunning,
			canViewExpenses,
			viewAccounting,
		} = this.state;
		const { submenuVisible, onSubmenuChanged, resources } = this.props;
		const permissions = {
			canImportArticle,
			canImportContact,
			canViewDunning,
			canViewExpenses,
			viewAccounting,
		};
		//const items = [...config.menuItemsData];
		if (!canViewExpenses) {
			items.push({
				name: "billing",
				icon: "expense",
				title: "Accounting",
				url: "/settings/billing",
				resourceKey: "accounting",
			});
		}

		if (invoiz.user.isAdmin) {
			items.push({
				name: "admin-panel",
				icon: "settings",
				title: "Admin Panel",
				url: "/admin-panel",
				resourceKey: "adminpanel",
			});
		}

		return items.map((menuItemData) => {
			const { closeSearchOnMenuItemClick, closeNotificationOnMenuItemClick, submenuHover } = this.state;
			const { name, submenuItems } = menuItemData;
			// console.log("Active Item", activeItem);
			const active = name === activeItem;
			Object.assign(menuItemData, { active, submenuVisible });

			if (submenuItems && submenuItems.length > 0) {
				return (
					<MenuItemWithSubmenuComponent1
						ref={`menuItemWithSubmenu-${name}`}
						key={name}
						activeSubmenuItem={activeSubmenuItem}
						onSubmenuVisiblityChanged={onSubmenuChanged}
						{...menuItemData}
						resources={resources}
						permissions={permissions}
						closeSearchOnMenuItemClick={closeSearchOnMenuItemClick}
						closeNotificationOnMenuItemClick={closeNotificationOnMenuItemClick}
						// setSubmenuVisibleHoverTrue={() => this.setSubmenuVisibleHoverTrue()}
						// setSubmenuVisibleHoverFalse={() => this.setSubmenuVisibleHoverFalse()}
						submenuHover={submenuHover}

						// activeName={activeItem}
					/>
				);
			}
			// return <MenuItemComponent key={name} {...menuItemData} resources={resources}/>;
			return (
				<li key={name}>
					<MenuItemComponent
						key={name}
						{...menuItemData}
						resources={resources}
						closeSearchOnMenuItemClick={closeSearchOnMenuItemClick}
						closeNotificationOnMenuItemClick={closeNotificationOnMenuItemClick}
						setSubmenuVisibleHoverFalse={() => this.setSubmenuVisibleHoverFalse()}
						submenuHover={submenuHover}
					/>
				</li>
			);
		});
	}

	render() {
		const { submenuVisible } = this.props;
		const menuItems = this.buildPermittedItems();
		const permittedItems = this.buildMenuItems2(menuItems);
		// console.log("Set Submenu from render", this.state.submenuHover);
		return (
			<div className="menuBar_container">
				{/* <div className={`menuBar_content ${submenuVisible ? 'submenu-visible' : ''}`}>{permittedItems}</div> */}
				<ul className={`menuBar_content ${submenuVisible ? "submenu-visible" : ""}`}>{permittedItems}</ul>
			</div>
		);
	}
}

MenuBarComponent.propTypes = {
	activeItem: PropTypes.string,
	activeSubmenuItem: PropTypes.string,
	submenuVisible: PropTypes.bool,
	onSubmenuChanged: PropTypes.func,
};

MenuBarComponent.defaultProps = {
	activeItem: "",
	activeSubmenuItem: "",
	submenuVisible: false,
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
			dispatch(setSubmenuVisibleGlobal(payload));
		},
	};
};
// export default MenuBarComponent;
export default connect(mapStateToProps, mapDispatchToProps)(MenuBarComponent);
