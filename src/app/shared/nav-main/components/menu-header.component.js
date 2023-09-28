import { Link } from "react-router-dom";
import invoiz from "services/invoiz.service";
import React from "react";
import { connect } from "react-redux";
import SVGInline from "react-svg-inline";
import groflexLogo from "assets/images/svg/groflex.svg";
import imprezzLogoSmall from "assets/images/groflex_short_icon.png";
import WebStorageService from "services/webstorage.service";
import WebStorageKey from "enums/web-storage-key.enum";
// import { fetchNewsfeedCount, updateNewsfeedCountReset } from 'redux/ducks/newsfeed';
import GlobalSearchModalComponent from "../../modals/global-search-modal.component";
import ModalService from "services/modal.service";

import userPermissions from "enums/user-permissions.enum";
import SearchComponent from "../../search/search-component";

class MenuHeaderComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			showComponent: false,
		};
		// this.state = {
		// 	canReceiveNotifications: null
		// };
	}
	componentDidMount() {
		const { onNewsfeedIconClick } = this.props;
		setTimeout(() => {
			$(".menuBar_container, .menuHeader_logo, .menuHeader_search")
				.off("click")
				.on("click", (evt) => {
					onNewsfeedIconClick(true);
				});
		}, 0);
	}

	componentWillUnmount() {
		// invoiz.off('updateNewsfeedCount');
	}

	onSearchClick() {
		const { onSearchIconClick } = this.props;
		onSearchIconClick();
		// const { resources } = this.props;
		// ModalService.open(<GlobalSearchModalComponent resources={resources} />, {
		// 	width: 800,
		// 	padding: 40,
		// 	modalClass: "global-search-modal-component",
		// 	afterOpen: () => {
		// 		$("#global-search-input").focus();
		// 	},
		// });
	}

	// onNewsfeedClick() {
	// 	const { onNewsfeedIconClick, updateNewsfeedCountReset } = this.props;

	// 	updateNewsfeedCountReset();
	// 	onNewsfeedIconClick(false);
	// }

	render() {
		const { submenuVisible, resources } = this.props;
		// let { newsfeedUnreadCount } = this.props;
		// const { resetNewsFeedCount } = this.props;

		// if (resetNewsFeedCount) {
		// 	newsfeedUnreadCount = 0;
		// }

		let adminIndicator = null;
		if (WebStorageService.getItem(WebStorageKey.ADMIN_MODE_ACTIVE)) {
			adminIndicator = <div className="menu-overlay-admin-indicator">{resources.simulationText}</div>;
		}

		return (
			<div className={`menuHeader ${submenuVisible ? "submenu-visible" : ""}`}>
				{adminIndicator}
				<div className="menuHeader_logo">
					<Link className={`logo`} to="/">
						{/* <SVGInline width="138px" height="50px" svg={groflexLogo} /> */}
						{/* <div className="icon icon-groflex_short_icon" /> */}
						<img src={imprezzLogoSmall} alt="BigCo Inc. logo" height="24px" width="30px" />
					</Link>
					<Link className={`logo`} to="/">
						<div className="imprezz-small-image-div">
							<img className="imprezz-small-image" src={imprezzLogoSmall} />
						</div>
					</Link>
				</div>

				{/* <a className="menuHeader_search icon icon-search" onClick={this.onSearchClick.bind(this)} /> */}

				{/* <a className="menuHeader_newsfeed icon icon-bell" onClick={this.onNewsfeedClick.bind(this)}>
					{newsfeedUnreadCount > 0 ? <span className="menuHeader_badge">{newsfeedUnreadCount}</span> : null}
				</a> */}
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	// const { unreadCount, resetCount } = state.newsfeed;
	const { resources } = state.language.lang;
	return {
		// newsfeedUnreadCount: unreadCount,
		// resetNewsFeedCount: resetCount,
		resources,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		// fetchNewsfeedCount: () => {
		// 	dispatch(fetchNewsfeedCount());
		// },
		// updateNewsfeedCountReset: () => {
		// 	dispatch(updateNewsfeedCountReset());
		// }
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(MenuHeaderComponent);
