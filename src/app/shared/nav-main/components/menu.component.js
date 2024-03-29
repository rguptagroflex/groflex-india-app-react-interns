import invoiz from 'services/invoiz.service';
import config from 'config';
import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import MenuBarComponent from 'shared/nav-main/components/menu-bar.component';
import MenuHeaderComponent from 'shared/nav-main/components/menu-header.component';
import MenuFooterComponent from 'shared/nav-main/components/menu-footer.component';
import NewsfeedComponent from 'shared/newsfeed/newsfeed.component';
import ModalService from 'services/modal.service';
import ReferralModalComponent from 'shared/modals/referral-modal.component';
import UpgradeModalComponent from 'shared/modals/upgrade-modal.component';

import { fetchNewsfeedData } from 'redux/ducks/newsfeed';
import userPermissions from 'enums/user-permissions.enum';
// import { IntercomAPI } from 'react-intercom';

class MenuComponent extends React.Component {
	constructor(props) {
		super(props);

		const { activeItem, activeSubmenuItem } = props;

		this.isNewsfeedToggling = false;

		this.state = {
			activeItem,
			activeSubmenuItem,
			hideMenu: false,
			submenuVisible: false,
			isNewsfeedVisible: false,
			canReceiveNotification: invoiz.user && invoiz.user.hasPermission(userPermissions.RECEIVE_NOTIFCATIONS),
			canViewInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_INVOICE_REMINDER),
			canViewRecurringInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_RECURRING_INVOICE)
		};
	}

	componentWillReceiveProps(newProps) {
		const { activeItem, activeSubmenuItem } = newProps;
		const { activeItem: currentActiveItem, activeSubmenuItem: currentActiveSubmenuItem } = this.state;

		const newState = Object.assign({}, this.state);

		if (activeItem && activeItem !== currentActiveItem) {
			Object.assign(newState, { activeItem });
		}

		if (activeSubmenuItem !== currentActiveSubmenuItem) {
			Object.assign(newState, { activeSubmenuItem });
		}

		this.setState(newState);
	}

	onLogout(logoutCallback) {
		this.setState({ hideMenu: true }, () => {
			logoutCallback();
			//location.reload();
			// IntercomAPI('shutdown');
			invoiz.user.logout(true);
		});
	}

	onNewsfeedIconClick(forceHide) {
		let isNewsfeedVisible = this.state.isNewsfeedVisible;

		if (!this.isNewsfeedToggling) {
			isNewsfeedVisible = !isNewsfeedVisible;
			this.isNewsfeedToggling = true;

			if (forceHide) {
				isNewsfeedVisible = false;
			}

			this.setState({ isNewsfeedVisible }, () => {
				if (isNewsfeedVisible) {
					this.props.fetchNewsfeedData();
				}
			});

			_.delay(() => {
				this.isNewsfeedToggling = false;
			}, 500);
		}
	}

	onNewsfeedItemClick(item) {
		const { resources } = this.props;
		this.onNewsfeedIconClick(true);

		invoiz.request(`${config.resourceHost}notification/${item.id}/read`, {
			auth: true,
			method: 'PUT'
		});

		setTimeout(() => {
			if (item.type && (item.type === 'referral_selected_plan' || item.type === 'referral_registered')) {
				ModalService.open(<ReferralModalComponent isBottomExpanded={true} resources={resources} />, {
					width: 870,
					padding: 0,
					isCloseable: true,
					resizePopupOnWindowResize: true,
					modalClass: 'referral-modal-component-wrapper'
				});
			} else if (item.type && item.type === 'referral_plan_tip') {
				// ModalService.open(<UpgradeModalComponent title={resources.str_timeToStart} resources={resources} />, {
				// 	width: 1196,
				// 	padding: 0,
				// 	isCloseable: true
				// });
			} else {
				invoiz.router.navigate(item.link);
			}
		}, 0);
	}

	onSubmenuChanged(submenuVisible) {
		setTimeout(() => {
			this.setState({ submenuVisible });
		}, 0);
	}

	getPermittedNotifications (items) {
		const { canViewInvoice, canViewRecurringInvoice } = this.state;
		if (!canViewInvoice) {
			return items.filter(item => !item.link.includes('invoice'));
		}
		return items;
	}

	render() {
		const { activeItem, activeSubmenuItem, hideMenu, submenuVisible, isNewsfeedVisible } = this.state;
		const { isLoadingNewsfeedItems, newsfeedItems, resources } = this.props;
		const items = this.getPermittedNotifications(newsfeedItems);
		const content = hideMenu ? null : (
			<nav className="menu">
				<MenuHeaderComponent
					onNewsfeedIconClick={this.onNewsfeedIconClick.bind(this)}
					submenuVisible={submenuVisible}
				/>
				<MenuBarComponent
					activeItem={activeItem}
					activeSubmenuItem={activeSubmenuItem}
					submenuVisible={submenuVisible}
					onSubmenuChanged={this.onSubmenuChanged.bind(this)}
					resources={resources}
				/>
				<MenuFooterComponent 
					onNewsfeedIconClick={this.onNewsfeedIconClick.bind(this)} 
					activeItem={activeItem}
					activeSubmenuItem={activeSubmenuItem}
					submenuVisible={submenuVisible} 
					onLogout={this.onLogout.bind(this)} 
				/>
				<NewsfeedComponent
					isLoading={isLoadingNewsfeedItems}
					isVisible={isNewsfeedVisible}
					items={items}
					onOverlayClick={this.onNewsfeedIconClick.bind(this)}
					onItemClick={this.onNewsfeedItemClick.bind(this)}
					resources={resources}
				/>
			</nav>
		);

		return content;
	}
}

const mapStateToProps = state => {
	const { isLoading, items } = state.newsfeed;
	const { resources } = state.language.lang;
	return {
		isLoadingNewsfeedItems: isLoading,
		newsfeedItems: items,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchNewsfeedData: () => {
			dispatch(fetchNewsfeedData());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(MenuComponent);
