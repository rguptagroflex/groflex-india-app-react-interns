import _ from "lodash";
import moment from "moment";
import React from "react";
import { formatDate } from "helpers/formatDate";
import { formatTime } from "helpers/formatTime";
import PerfectScrollbar from "perfect-scrollbar";
import LoaderComponent from "shared/loader/loader.component";
import TextField from "@material-ui/core/TextField";
import ArrowDropDownOutlinedIcon from "@material-ui/icons/ArrowDropDownOutlined";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import CloseIcon from "@material-ui/icons/Close";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { notificationTypes } from "../../helpers/constants";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import SortIcon from "@material-ui/icons/Sort";
import SearchComponent from "../search/search-component";
import NewsFeedAccordian from "./newsfeed-accordian.component";
const NEWSFEED_ITEM_GROUPS = {
	TODAY: 1,
	YESTERDAY: 2,
	OLDER: 3,
};

const NEWSFEED_TYPES = {
	CHECK: "check",
	ALERT: "alert",
	AT: "at",
	EURO: "euro",
};

class NewsfeedComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selectedNotificationType: 1,
			selectedDate: moment(new Date()).format("YYYY-DD-MM"),
		};
		this.handleNotificationSort = this.handleNotificationSort.bind(this);
		this.showAlert = this.showAlert.bind(this);
		this.perfectScrollbar = null;
		this.unreadCount = 0;

		this.onWindowResize = this.onWindowResize.bind(this);

		$(window).off("resize", this.onWindowResize);
		$(window).on("resize", this.onWindowResize);
	}

	handleHeading(item) {
		const url = item.link.split("/");
		const heading = url[url.length - 2];
		return heading;
	}

	handleNotificationSort(e) {
		if (e.target.value === 3) {
			onItemClick();
		}
		this.setState({ selectedNotificationType: e.target.value });
	}
	handleDateSort(e) {
		this.setState({ selectedDate: e.target.value });
	}
	showAlert() {
		alert(`Selected Option: ${this.state.selectedDate}`);
	}

	destroyScrollbar() {
		if (this.perfectScrollbar) {
			this.perfectScrollbar.destroy();
		}
	}

	onOverlayClick() {
		const { onOverlayClick } = this.props;
		onOverlayClick(true);
	}

	onItemClick(item) {
		const { onItemClick } = this.props;
		onItemClick(item);
	}
	onItemClickNavigate(item) {
		const { onItemClickNavigate } = this.props;
		onItemClickNavigate(item);
	}

	onWindowResize() {
		_.debounce(() => {
			if (this.perfectScrollbar) {
				this.perfectScrollbar.update();
			}
		}, 100);
	}

	render() {
		const { selectedNotificationType } = this.state;
		const { isVisible, isLoading, items, resources } = this.props;
		const itemsToday = [];
		const itemsYesterday = [];
		const itemsOlder = [];
		items.forEach((item) => {
			const YESTERDAY = moment().subtract(1, "days").startOf("day");

			if (moment(item.createdAt).isSame(moment(), "day")) {
				itemsToday.push(item);
			} else if (moment(item.createdAt).isSame(YESTERDAY, "day")) {
				itemsYesterday.push(item);
			} else {
				itemsOlder.push(item);
			}
		});

		const newsfeedGroups = [
			{
				id: NEWSFEED_ITEM_GROUPS.TODAY,
				items: itemsToday,
			},
			{
				id: NEWSFEED_ITEM_GROUPS.YESTERDAY,
				items: itemsYesterday,
			},
			{
				id: NEWSFEED_ITEM_GROUPS.OLDER,
				items: itemsOlder,
			},
		];

		const isNewsfeedEmpty = itemsToday.length + itemsYesterday.length + itemsOlder.length === 0;
		let isFirstNewsItemRead = false;

		if (items.length > 0) {
			isFirstNewsItemRead = items[0].readDate !== null;
		}

		if (isVisible && !isLoading) {
			setTimeout(() => {
				$(".newsfeed-component .newsfeed-item-content").dotdotdot({ watch: true });

				this.destroyScrollbar();

				if ($(".newsfeed-component .newsfeed-items").length > 0) {
					this.perfectScrollbar = new PerfectScrollbar(".newsfeed-component .newsfeed-items", {
						suppressScrollX: true,
					});

					$(".newsfeed-component .newsfeed-items").scrollTop(0);
				}
			}, 0);
		}

		return (
			<div
				className={`newsfeed-component ${isVisible ? "visible" : ""} ${
					isFirstNewsItemRead ? "" : "first-item-unread"
				}`}
			>
				<div className="newsfeed-overlay" onClick={this.onOverlayClick.bind(this)} />
				<div className="newsfeed-items">
					{isLoading ? (
						<LoaderComponent text={resources.newsfeedLoadingText} visible={true} />
					) : isNewsfeedEmpty ? (
						<div className="newsfeed-items-today">
							<div className="newsfeed-header">
								<div>
									{resources.newsfeedHeaderText}
									<br />
									{resources.newsfeedSubHeaderText}
								</div>
							</div>
						</div>
					) : (
						<div className="notification-main">
							<div className="newsfeed-close">
								<h4>Notifications</h4>

								<p>
									<CloseIcon onClick={this.onOverlayClick.bind(this)} />
								</p>
							</div>
							<div className="sortNotification">
								<div style={{ marginRight: "24px" }}>
									<SortIcon style={{ "margin-right": "12px", "margin-top": "4px" }} />
									<FormControl>
										<Select
											value={this.state.selectedNotificationType}
											onChange={this.handleNotificationSort.bind(this)}
											displayEmpty
											inputProps={{ "aria-label": "Without label" }}
											MenuProps={{ style: { zIndex: 35000 } }}
											className="notificationDropDown"
											disableUnderline
											prop
											IconComponent={ExpandMoreIcon}
										>
											<MenuItem value={1}>Sort by: new first</MenuItem>
											<MenuItem value={2}>Sort by: old first</MenuItem>
										</Select>
									</FormControl>
								</div>
							</div>
							{newsfeedGroups.map((group, groupIndex) => {
								let groupCssClass = "";
								let groupHeaderCssClass = "";
								let groupTitle = "";
								if (group.id === 2 || group.id === 3) {
									group.id = 2;
								} else {
									group.id = 1;
								}

								switch (group.id) {
									case NEWSFEED_ITEM_GROUPS.TODAY:
										groupCssClass = "newsfeed-items-today";
										groupTitle = resources.str_today;
										break;

									case NEWSFEED_ITEM_GROUPS.YESTERDAY:
										groupCssClass = "newsfeed-items-yesterday";
										groupHeaderCssClass = "large-top";
										groupTitle = resources.str_yesterday;
										break;

									case NEWSFEED_ITEM_GROUPS.OLDER:
										groupCssClass = "newsfeed-items-older";
										groupHeaderCssClass = "large-top";
										groupTitle = resources.str_older;
										break;
								}
								return group.items.length === 0 ? null : (
									<div key={`newsfeed_group_${groupIndex}`} className={groupCssClass}>
										{/* <div className="sort-notification"></div> */}

										{/* <div className={`newsfeed-header ${groupHeaderCssClass}`}>
										<h4>Notifications</h4>
										<div>{groupTitle}</div>
									</div> */}

										{group.id === parseInt(selectedNotificationType) && group.items.length > 0 ? (
											<div>
												{console.log(group.id === parseInt(selectedNotificationType))}
												{group.items.map((item, itemIndex) => {
													let iconClass;
													let dateTimePrefix = "";

													switch (group.id) {
														case NEWSFEED_ITEM_GROUPS.TODAY:
															// dateTimePrefix = "";
															dateTimePrefix = `${moment(item.createdAt).format(
																"LL"
															)} at ${moment(item.createdAt).format("LT")}`;
															break;

														case NEWSFEED_ITEM_GROUPS.YESTERDAY:
															// dateTimePrefix = `${resources.str_yesterday}, `;
															dateTimePrefix = `${moment(item.createdAt).format(
																"LL"
															)} at ${moment(item.createdAt).format("LT")}`;
															break;

														case NEWSFEED_ITEM_GROUPS.OLDER:
															// dateTimePrefix = `${formatDate(
															// 	new Date(item.createdAt).toISOString()
															// )}, `;
															dateTimePrefix = `${moment(item.createdAt).format(
																"LL"
															)} at ${moment(item.createdAt).format("LT")}`;
															break;
													}

													switch (item.icon) {
														case NEWSFEED_TYPES.CHECK:
															iconClass = "icon-check_medium";
															break;

														case NEWSFEED_TYPES.ALERT:
															iconClass = "icon-exclamation_mark2";
															break;

														case NEWSFEED_TYPES.AT:
															iconClass = "icon-at";
															break;

														case NEWSFEED_TYPES.EURO:
															iconClass = "icon-euro";
															break;

														default:
															iconClass = "icon-groflex_short_icon";
													}

													return (
														<div className="newsfeed-main">
															<div className={`icon ${iconClass}`} />
															<NewsFeedAccordian
																read={item.readDate}
																heading={this.handleHeading(item)}
																secondaryHeading={dateTimePrefix}
																content={item.text}
																iconClass={iconClass}
																onPrimaryClick={this.onItemClick.bind(this, item)}
																onSecondaryClick={this.onItemClickNavigate.bind(
																	this,
																	item
																)}
															/>
														</div>
													);
												})}
											</div>
										) : (
											""
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		);
	}
}

export default NewsfeedComponent;
