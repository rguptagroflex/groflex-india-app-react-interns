import React from 'react';
import invoiz from 'services/invoiz.service';
import PropTypes from 'prop-types';
import MenuItemComponent from 'shared/nav-main/components/menu-item.component';
import MenuItemWithSubmenuComponent from 'shared/nav-main/components/menu-item-with-submenu.component';
import MenuItemWithSubmenuComponent1 from 'shared/nav-main/components/menu-item-with-submenu.component1';
import config from 'config';

import userPermissions from 'enums/user-permissions.enum';
import planPermissions from 'enums/plan-permissions.enum';

class MenuBarComponent extends React.Component {
	constructor(props) {
		super(props);

		const { activeItem, activeSubmenuItem } = props;
		this.state = {
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
			menuItems: config.menuItemsData
		};
	}

	componentDidMount () {
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
			noGST: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_GST_EXPORT)
		});
	}

	componentWillReceiveProps(newProps) {
		const { activeItem, activeSubmenuItem, submenuVisible } = newProps;
		const { activeItem: currentActiveItem, activeSubmenuItem: currentActiveSubmenuItem } = this.state;
		const newState = Object.assign({}, this.state, { submenuVisible });

		if (activeItem !== currentActiveItem) {
			Object.assign(newState, { activeItem });

			const isMenuItemWithSubmenuActive = !!config.menuItemsData.find(menuItem => {
				return menuItem.name === activeItem && !!menuItem.submenuItems;
			});

			config.menuItemsData.forEach(menuItem => {
				if (menuItem.submenuItems) {
					if (
						menuItem.name === activeItem &&
						this.refs &&
						this.refs[`menuItemWithSubmenu-${menuItem.name}`]
					) {
						this.refs[`menuItemWithSubmenu-${menuItem.name}`].showSubmenu(null, false, true);
					} else if (
						menuItem.name !== activeItem &&
						this.refs &&
						this.refs[`menuItemWithSubmenu-${menuItem.name}`]
					) {
						this.refs[`menuItemWithSubmenu-${menuItem.name}`].hideSubmenu(isMenuItemWithSubmenuActive);
					}
				}
			});
		}

		if (activeSubmenuItem !== currentActiveSubmenuItem) {
			Object.assign(newState, { activeSubmenuItem }); 
		}

		this.setState(newState);
	}

	buildPermittedItems () {
		const { canSeeEditGstReports, canViewImprezzOffer, canViewOffer, canViewExpenses, canViewPurchaseOrder, canViewDashboard, noGST, menuItems } = this.state;
		const permitteditems = [...config.menuItemsData];
		 if (!canSeeEditGstReports && !canViewExpenses && !canViewDashboard) {
			return permitteditems.filter(item => item.name !== 'expenses' && item.name !== 'documentExport' && item.name !== 'dashboard');
		 } 
		 if (!canViewOffer && !canViewImprezzOffer && !canViewPurchaseOrder) {
			return permitteditems.filter(item => item.name !== 'offers' && item.name !== 'purchaseOrders');
		 } 
		//  if (!canViewDashboard) {
		// 	return permitteditems.filter(item => item.name !== 'dashboard');		  
		//   } 
		 if (!canViewExpenses) {
		  return permitteditems.filter(item => item.name !== 'expenses');		  
		} 
		if (!canSeeEditGstReports) {
			return permitteditems.filter(item => item.name !== 'documentExport');			
		}
		if (!canViewPurchaseOrder) {
			return permitteditems.filter(item => item.name !== 'purchaseOrders');
		}
		if(noGST) {
			return permitteditems.filter(item => item.name !== 'documentExport');
		}
		
		return permitteditems;
	}

	buildMenuItems (items) {
		const { activeItem, activeSubmenuItem, canImportArticle, canImportContact, canViewDunning, canViewExpenses } = this.state;
		const { submenuVisible, onSubmenuChanged, resources } = this.props;
		const permissions = {
			canImportArticle,
			canImportContact,
			canViewDunning,
			canViewExpenses
			};
		 //const items = [...config.menuItemsData];
		if (invoiz.user.isAdmin) {
			items.push({ name: 'admin-panel', icon: 'settings', title: 'Admin Panel', url: '/admin-panel', resourceKey: 'adminpanel' });
		}

		return items.map(menuItemData => {
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
			return <MenuItemComponent key={name} {...menuItemData} resources={resources}/>;
		});
	}

	buildMenuItems2 (items) {
		const { activeItem, activeSubmenuItem, canImportArticle, canImportContact, canViewDunning, canViewExpenses } = this.state;
		const { submenuVisible, onSubmenuChanged, resources } = this.props;
		const permissions = {
			canImportArticle,
			canImportContact,
			canViewDunning,
			canViewExpenses
			};
		 //const items = [...config.menuItemsData];
		if (invoiz.user.isAdmin) {
			items.push({ name: 'admin-panel', icon: 'settings', title: 'Admin Panel', url: '/admin-panel', resourceKey: 'adminpanel' });
		}

		return items.map(menuItemData => {
			const { name, submenuItems } = menuItemData;
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
					/>
				);
			}
			// return <MenuItemComponent key={name} {...menuItemData} resources={resources}/>;
			return <li key={name}><MenuItemComponent key={name} {...menuItemData} resources={resources}/></li>
		});
	}

	render() {
		const { submenuVisible } = this.props;
		const menuItems = this.buildPermittedItems();
		const permittedItems = this.buildMenuItems2(menuItems);
		return (
			<div className="menuBar_container">
				{/* <div className={`menuBar_content ${submenuVisible ? 'submenu-visible' : ''}`}>{permittedItems}</div> */}
				<ul className={`menuBar_content ${submenuVisible ? 'submenu-visible' : ''}`}>{permittedItems}</ul>
			</div>
		);
	}
}

MenuBarComponent.propTypes = {
	activeItem: PropTypes.string,
	activeSubmenuItem: PropTypes.string,
	submenuVisible: PropTypes.bool,
	onSubmenuChanged: PropTypes.func
};

MenuBarComponent.defaultProps = {
	activeItem: '',
	activeSubmenuItem: '',
	submenuVisible: false
};

export default MenuBarComponent;
