import React from "react";
import { connect } from "react-redux";
import { fetchNewsfeedCount, updateNewsfeedCountReset } from "redux/ducks/newsfeed";
import { userLoggedOut } from "redux/ducks/global";
import invoiz from "services/invoiz.service";
import config from "config";
import SearchComponent from "../../search/search-component";
import SVGInline from "react-svg-inline";
import bell from "assets/images/icons/bell_2.svg";
import profile from "assets/images/icons/profile_new.svg";
import profile_hover from "assets/images/icons/profile_hover.svg";
import search from "assets/images/icons/search_new.svg";
import search_hover from "assets/images/icons/search_hover.svg";
import bell_hover from "assets/images/icons/bell_new.svg";
import { setSubmenuVisibleGlobal } from "../../../redux/ducks/global";
import Tooltip from "@material-ui/core/Tooltip";
import { setSideBarVisibleStatic } from "../../../redux/ducks/global";
class MenuFooterComponent extends React.Component {
	constructor(props) {
		super(props);
		const { closeSearchOnMenuItemClick, closeNotificationOnMenuItemClick } = this.props;

		this.state = {
			tenant: {
				companyAddress: {},
			},
			profileHoverActive: false,
			searchHoverActive: false,
			notificationHoverActive: false,
			closeSearchOnMenuItemClick,
			closeNotificationOnMenuItemClick,
		};

		this.navigateToPage = this.navigateToPage.bind(this);
		this.iconChangeOnHover = this.iconChangeOnHover.bind(this);
		this.searchIconHover = this.searchIconHover.bind(this);
		this.notificationIconHover = this.notificationIconHover.bind(this);
	}

	componentDidMount() {
		const { fetchNewsfeedCount, onNewsfeedIconClick } = this.props;

		fetchNewsfeedCount();
		this.fetchTenantDetails();

		invoiz.on("updateNewsfeedCount", () => {
			fetchNewsfeedCount();
		});

		setTimeout(() => {
			$(".menuBar_container, .menuHeader_logo, .menuHeader_search")
				.off("click")
				.on("click", (evt) => {
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
		invoiz.off("updateNewsfeedCount");
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
		this.setState({ tenant: response });
	}

	navigateToPage(url) {
		const { submenuVisible, isSubmenuVisible } = this.props;
		submenuVisible(false);
		this.props.setSideBarVisibleStatic({
			invoices: { name: "invoices", sidebarVisible: false },
			expenditure: { name: "expenditure", sidebarVisible: false },
		});
		// console.log("Footer: ", isSubmenuVisible);
		invoiz.trigger("updateNewsfeedCount");
		invoiz.trigger("triggerSubmenuHide");
		invoiz.router.navigate(url);
	}
	onSearchClick() {
		const { onSearchIconClick } = this.props;

		onSearchIconClick();
	}

	iconChangeOnHover() {
		const { profileHoverActive } = this.state;
		this.setState({ profileHoverActive: !profileHoverActive });
	}

	searchIconHover() {
		const { searchHoverActive } = this.state;
		this.setState({ searchHoverActive: !searchHoverActive });
	}

	notificationIconHover() {
		const { notificationHoverActive } = this.state;
		this.setState({ notificationHoverActive: !notificationHoverActive });
	}

	render() {
		const { submenuVisibleVar, resources, activeItem, activeSubmenuItem } = this.props;
		const { submenuVisible } = this.props;
		let { newsfeedUnreadCount } = this.props;
		const { resetNewsFeedCount } = this.props;
		const {
			profileHoverActive,
			notificationHoverActive,
			searchHoverActive,
			closeSearchOnMenuItemClick,
			closeNotificationOnMenuItemClick,
		} = this.state;

		if (resetNewsFeedCount) {
			newsfeedUnreadCount = 0;
		}

		const iconClass = "icon icon-logout_outlined";

		const logoutClass = `menuItem small ${iconClass} ${submenuVisibleVar ? "menuItem-notFocused" : ""}`;

		const notificationClass = `menuItem notificationIcon`;

		return (
			<div className="menuFooter">
				<Tooltip title="Search" placement="right" arrow>
					<div
						className="search-footer menuItem"
						onClick={() => {
							closeNotificationOnMenuItemClick(), this.onSearchClick();
						}}
						onMouseLeave={() => {
							this.searchIconHover();
						}}
						onMouseEnter={() => {
							this.searchIconHover();
						}}
					>
						{searchHoverActive ? (
							<SVGInline svg={search_hover} width="24px" height="24px" />
						) : (
							<SVGInline svg={search} width="24px" height="24px" />
						)}
					</div>
				</Tooltip>

				<Tooltip title="Notifications" placement="right" arrow>
					<div
						className={notificationClass}
						onClick={() => {
							this.onNewsfeedClick();
							closeSearchOnMenuItemClick();
						}}
						onMouseLeave={() => {
							this.notificationIconHover();
						}}
						onMouseEnter={() => {
							this.notificationIconHover();
						}}
					>
						{notificationHoverActive ? (
							<div>
								<SVGInline svg={bell_hover} width="24px" height="24px" />
								{newsfeedUnreadCount > 0 ? (
									<span className="menuHeader_badge">({newsfeedUnreadCount})</span>
								) : null}
							</div>
						) : (
							<div>
								<SVGInline svg={bell} width="24px" height="24px" />
								{newsfeedUnreadCount > 0 ? (
									<span className="menuHeader_badge">({newsfeedUnreadCount})</span>
								) : null}
							</div>
						)}
					</div>
				</Tooltip>

				<div
					className="menuItem profile_logo"
					onMouseLeave={() => {
						this.iconChangeOnHover();
					}}
					onMouseEnter={() => {
						this.iconChangeOnHover();
					}}
				>
					{/* <span className=" icon icon-user_outlined"></span> */}
					{profileHoverActive ? (
						<SVGInline svg={profile_hover} width="24px" height="24px" />
					) : (
						<SVGInline svg={profile} width="24px" height="24px" />
					)}
					{/* <SVGInline svg={profile} width="24px" height="24px" /> */}
					<div className="menu-profile-popup">
						<div className="menu-profile-popup-head">
							<div className="icon icon-user_outlined"></div>

							<div className="text-info">
								{this.state.tenant.companyAddress.companyName || "Business Name"}
							</div>
						</div>
						<div className="menu-profile-popup-middle1">
							<a
								className={`menuItem small icon icon-settings_outlined ${
									activeSubmenuItem == "account" ? "menuItem-active" : ""
								}`}
								onClick={() => this.navigateToPage("/settings/account")}
								data-href="/settings/account"
								data-qs-id={`global-menu-item-Account-details`}
							>
								{"Account details"}
							</a>
							{/* <a
								className={`menuItem small icon icon-settings_outlined ${
									activeSubmenuItem == "account-setting" ? "menuItem-active" : ""
								}`}
								onClick={() => this.navigateToPage("/settings/account-setting")}
								data-href="/settings/account-setting"
								data-qs-id={`global-menu-item-Setting`}
							>
								{"Account Settings"}
							</a> */}

							<a
								className={`menuItem small icon icon-credit_card ${
									activeSubmenuItem == "billing" ? "menuItem-active" : ""
								}`}
								onClick={() => this.navigateToPage("/settings/billing")}
								data-href="/settings/billing"
								data-qs-id={`global-menu-item-Your-billing`}
							>
								{"Your billing"}
							</a>
							<a
								className={`menuItem small icon icon-teams ${
									activeSubmenuItem == "user" ? "menuItem-active" : ""
								}`}
								onClick={() => this.navigateToPage("/settings/user")}
								data-href="/settings/user"
								data-qs-id={`global-menu-item-Your-Teams`}
							>
								{"Teams"}
							</a>
						</div>

						<div className="menu-profile-popup-middle2">
							<a
								className="menuItem small icon icon-help_outlined"
								href="https://groflex.in"
								target="_blank"
							>
								{/* {"Groflex Help Center"} */}
								{"Help"}
							</a>
							<a
								className="menuItem small icon icon-vpn_policy"
								href="https://groflex.in/privacy-policy"
								target="_blank"
							>
								{/* {"Terms & Conditions"} */}
								{"Privacy Policy"}
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

const mapStateToProps = (state) => {
	const { unreadCount, resetCount } = state.newsfeed;
	const { resources } = state.language.lang;
	const isSubmenuVisible = state.global.isSubmenuVisible;

	return {
		resources,
		newsfeedUnreadCount: unreadCount,
		resetNewsFeedCount: resetCount,
		isSubmenuVisible,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		userLoggedOut: () => {
			dispatch(userLoggedOut());
		},
		fetchNewsfeedCount: () => {
			dispatch(fetchNewsfeedCount());
		},
		updateNewsfeedCountReset: () => {
			dispatch(updateNewsfeedCountReset());
		},
		submenuVisible: (payload) => {
			dispatch(setSubmenuVisibleGlobal(payload));
		},
		setSideBarVisibleStatic: (payload) => {
			dispatch(setSideBarVisibleStatic(payload));
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(MenuFooterComponent);
