import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import { Provider } from 'react-redux';
import Menu from 'shared/nav-main/components/menu.component';
import store from 'redux/store';
import { updateSubscriptionDetails } from 'helpers/updateSubsciptionDetails';

class NavMainComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			activeItem: '',
			activeSubmenuItem: '',
			menuItems: JSON.parse(JSON.stringify(config.menuItemsData))
		};

		invoiz.on('menuItemChanged', ({ menuItem, submenuItem }) => {
			let activeItem = '';
			let activeSubmenuItem = '';
			let activeMenuItems = null;

			if (menuItem) {
				activeMenuItems = this.updateMenuActiveItems(menuItem, submenuItem);
				activeItem = activeMenuItems.activeItem;
				activeSubmenuItem = activeMenuItems.activeSubmenuItem;
			}

			setTimeout(() => {
				if (this.refs && this.refs.menu) {
					this.setState({
						activeItem,
						activeSubmenuItem
					});
				}
			});
		});

		updateSubscriptionDetails();
	}

	updateMenuActiveItems(itemName, submenuItemName) {
		const { menuItems } = this.state;
		let activeItem = null;
		let activeSubmenuItem = null;
		menuItems.forEach(menuItem => {
			menuItem.active = menuItem.name === itemName;

			if (menuItem.active) {
				activeItem = menuItem.name;

				if (menuItem.submenuItems && menuItem.submenuItems.length > 0) {
					menuItem.submenuItems.forEach(submenuItem => {
						submenuItem.active = submenuItem.name === submenuItemName;

						if (submenuItem.active) {
							activeSubmenuItem = submenuItem.name;
						}
					});
				}
			}
		});

		return {
			activeItem,
			activeSubmenuItem
		};
	}

	render() {
		const { activeItem, activeSubmenuItem } = this.state;

		return (
			<Provider store={store}>
				<Menu ref="menu" activeItem={activeItem} activeSubmenuItem={activeSubmenuItem} />
			</Provider>
		);
	}
}

export default NavMainComponent;
