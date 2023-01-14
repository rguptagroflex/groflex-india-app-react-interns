import React from 'react';
import { connect } from 'react-redux';
import { fetchNewsfeedCount, updateNewsfeedCountReset } from 'redux/ducks/newsfeed';
import { userLoggedOut } from 'redux/ducks/global';
import invoiz from 'services/invoiz.service';
import config from 'config';

class MenuFooterComponent extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			tenant: {
				companyAddress: {}
			},
		};

		this.navigateToPage = this.navigateToPage.bind(this);
	}

	componentDidMount() {
		const { fetchNewsfeedCount, onNewsfeedIconClick } = this.props;

		fetchNewsfeedCount();
		this.fetchTenantDetails();

		invoiz.on('updateNewsfeedCount', () => {
			fetchNewsfeedCount();
		});

		setTimeout(() => {
			$('.menuBar_container, .menuHeader_logo, .menuHeader_search')
				.off('click')
				.on('click', evt => {
					onNewsfeedIconClick(true);
				});
		}, 0);
	}

	// componentWillReceiveProps(newProps) {
	// 	const { activeItem, activeSubmenuItem, submenuVisible } = newProps;
	// 	const { activeItem: currentActiveItem, activeSubmenuItem: currentActiveSubmenuItem } = this.state;
	// 	const newState = Object.assign({}, this.state, { submenuVisible });

	// 	if (activeItem !== currentActiveItem) {
	// 		Object.assign(newState, { activeItem });
	// 	}

	// 	if (activeSubmenuItem !== currentActiveSubmenuItem) {
	// 		Object.assign(newState, { activeSubmenuItem }); 
	// 	}

	// 	this.setState(newState);
	// }

	componentWillUnmount() {
		invoiz.off('updateNewsfeedCount');
	}

	onLogoutClick() {
		const { onLogout } = this.props;		

		onLogout(() => {
			this.props.userLoggedOut();
		});
	}

	onNewsfeedClick() {
		const { onNewsfeedIconClick, updateNewsfeedCountReset } = this.props;

		updateNewsfeedCountReset();
		onNewsfeedIconClick(false);
	}

	async fetchTenantDetails() {
		const tenantURL = `${config.resourceHost}tenant`;
		const response = (await invoiz.request(tenantURL, { auth: true })).body.data;
		this.setState({tenant: response})
	}

	navigateToPage(url) {
		invoiz.trigger("updateNewsfeedCount");
		invoiz.trigger("triggerSubmenuHide");
		invoiz.router.navigate(url);
	};

	render() {
		const { submenuVisible, resources, activeItem, activeSubmenuItem  } = this.props;
		let { newsfeedUnreadCount } = this.props;
		const { resetNewsFeedCount } = this.props;

		if (resetNewsFeedCount) {
			newsfeedUnreadCount = 0;
		}

		const iconClass = 'icon icon-logout_outlined';
		const logoutClass = `menuItem ${iconClass} ${submenuVisible ? 'menuItem-notFocused' : ''}`;
		const notificationClass = `menuItem icon icon-bell`;

		return (
			<div className="menuFooter">
				<div className={notificationClass} onClick={this.onNewsfeedClick.bind(this)}>
					{resources.str_notification} {newsfeedUnreadCount > 0 ? <span className="menuHeader_badge">({newsfeedUnreadCount})</span> : null}
				</div>
				<div className="menuItem profile_logo" >
					<span className=" icon icon-user_outlined"></span> My Account

					<div className="menu-profile-popup">
						<div className="menu-profile-popup-head">
							<div className="icon icon-user_outlined"></div>
							<div>{this.state.tenant.companyAddress.companyName || 'Business Name'}</div>
						</div>
						<div className="menu-profile-popup-middle1">
							<a 	className={`menuItem small icon icon-user_outlined_black ${activeSubmenuItem == 'account' ? 'menuItem-active' : ''}`}
								onClick={() => this.navigateToPage('/settings/account')} 
								data-href = "/settings/account"
								data-qs-id = {`global-menu-item-Account-details`}
							>
								{'Account details'}
							</a>
							<a  className={`menuItem small icon icon-settings_outlined ${activeSubmenuItem == 'account-setting' ? 'menuItem-active' : ''}`}
								onClick={() => this.navigateToPage('/settings/account-setting')} 
								data-href = "/settings/account-setting"
								data-qs-id = {`global-menu-item-Setting`}
							>
								{'Setting'}
							</a>
							
							<a  className={`menuItem small icon icon-credit_card ${activeSubmenuItem == 'billing' ? 'menuItem-active' : ''}`}
								onClick={() => this.navigateToPage('/settings/billing')} 
								data-href = "/settings/billing"
								data-qs-id = {`global-menu-item-Your-billing`}
							>
								{'Your billing'}
							</a>
							<a 	className={`menuItem small icon icon-credit_card ${activeSubmenuItem == 'user' ? 'menuItem-active' : ''}`}
								onClick={() => this.navigateToPage('/settings/user')} 
								data-href = "/settings/user"
								data-qs-id = {`global-menu-item-Your-Teams`}
							>
								{'Teams'}
							</a>
						</div>
						<div className="menu-profile-popup-middle2">
							<a 	className="menuItem small icon icon-help_outlined"
								href="https://groflex.in" target="_blank"
							>
								{'Groflex Help Center'}
							</a>
							<a 	className="menuItem small icon icon-vpn_policy"
								href="https://www.groflex.in/privacy-policy/" target="_blank"
							>
								{'Terms and policies'}
							</a>
						</div>
						<div className={logoutClass} onClick={this.onLogoutClick.bind(this)}>
							{resources.str_logout}
						</div>
					</div>
				</div>
				{/* <div className={logoutClass} onClick={this.onLogoutClick.bind(this)}>
					{resources.str_logout}
				</div> */}
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { unreadCount, resetCount } = state.newsfeed;
	const { resources } = state.language.lang;
	return {
		resources,
		newsfeedUnreadCount: unreadCount,
		resetNewsFeedCount: resetCount,
	};
};

const mapDispatchToProps = dispatch => {
	return {
		userLoggedOut: () => {
			dispatch(userLoggedOut());
		},
		fetchNewsfeedCount: () => {
			dispatch(fetchNewsfeedCount());
		},
		updateNewsfeedCountReset: () => {
			dispatch(updateNewsfeedCountReset());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(MenuFooterComponent);
