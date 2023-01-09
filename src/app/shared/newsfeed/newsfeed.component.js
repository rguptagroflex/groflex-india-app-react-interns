import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import { formatDate } from 'helpers/formatDate';
import { formatTime } from 'helpers/formatTime';
import PerfectScrollbar from 'perfect-scrollbar';
import LoaderComponent from 'shared/loader/loader.component';

const NEWSFEED_ITEM_GROUPS = {
	TODAY: 1,
	YESTERDAY: 2,
	OLDER: 3
};

const NEWSFEED_TYPES = {
	CHECK: 'check',
	ALERT: 'alert',
	AT: 'at',
	EURO: 'euro'
};

class NewsfeedComponent extends React.Component {
	constructor(props) {
		super(props);

		this.perfectScrollbar = null;
		this.unreadCount = 0;

		this.onWindowResize = this.onWindowResize.bind(this);

		$(window).off('resize', this.onWindowResize);
		$(window).on('resize', this.onWindowResize);
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

	onWindowResize() {
		_.debounce(() => {
			if (this.perfectScrollbar) {
				this.perfectScrollbar.update();
			}
		}, 100);
	}

	render() {
		const { isVisible, isLoading, items, resources } = this.props;

		const itemsToday = [];
		const itemsYesterday = [];
		const itemsOlder = [];
		items.forEach(item => {
			const YESTERDAY = moment()
				.subtract(1, 'days')
				.startOf('day');

			if (moment(item.createdAt).isSame(moment(), 'day')) {
				itemsToday.push(item);
			} else if (moment(item.createdAt).isSame(YESTERDAY, 'day')) {
				itemsYesterday.push(item);
			} else {
				itemsOlder.push(item);
			}
		});

		const newsfeedGroups = [
			{
				id: NEWSFEED_ITEM_GROUPS.TODAY,
				items: itemsToday
			},
			{
				id: NEWSFEED_ITEM_GROUPS.YESTERDAY,
				items: itemsYesterday
			},
			{
				id: NEWSFEED_ITEM_GROUPS.OLDER,
				items: itemsOlder
			}
		];

		const isNewsfeedEmpty = itemsToday.length + itemsYesterday.length + itemsOlder.length === 0;
		let isFirstNewsItemRead = false;

		if (items.length > 0) {
			isFirstNewsItemRead = items[0].readDate !== null;
		}

		if (isVisible && !isLoading) {
			setTimeout(() => {
				$('.newsfeed-component .newsfeed-item-content').dotdotdot({ watch: true });

				this.destroyScrollbar();

				if ($('.newsfeed-component .newsfeed-items').length > 0) {
					this.perfectScrollbar = new PerfectScrollbar('.newsfeed-component .newsfeed-items', {
						suppressScrollX: true
					});

					$('.newsfeed-component .newsfeed-items').scrollTop(0);
				}
			}, 0);
		}

		return (
			<div
				className={`newsfeed-component ${isVisible ? 'visible' : ''} ${
					isFirstNewsItemRead ? '' : 'first-item-unread'
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
						newsfeedGroups.map((group, groupIndex) => {
							let groupCssClass = '';
							let groupHeaderCssClass = '';
							let groupTitle = '';

							switch (group.id) {
								case NEWSFEED_ITEM_GROUPS.TODAY:
									groupCssClass = 'newsfeed-items-today';
									groupTitle = resources.str_today;
									break;

								case NEWSFEED_ITEM_GROUPS.YESTERDAY:
									groupCssClass = 'newsfeed-items-yesterday';
									groupHeaderCssClass = 'large-top';
									groupTitle = resources.str_yesterday;
									break;

								case NEWSFEED_ITEM_GROUPS.OLDER:
									groupCssClass = 'newsfeed-items-older';
									groupHeaderCssClass = 'large-top';
									groupTitle = resources.str_older;
									break;
							}

							return group.items.length === 0 ? null : (
								<div key={`newsfeed_group_${groupIndex}`} className={groupCssClass}>
									<div className={`newsfeed-header ${groupHeaderCssClass}`}>
										<div>{groupTitle}</div>
									</div>
									{group.items.map((item, itemIndex) => {
										let iconClass;
										let dateTimePrefix = '';

										switch (group.id) {
											case NEWSFEED_ITEM_GROUPS.TODAY:
												dateTimePrefix = '';
												break;

											case NEWSFEED_ITEM_GROUPS.YESTERDAY:
												dateTimePrefix = `${resources.str_yesterday}, `;
												break;

											case NEWSFEED_ITEM_GROUPS.OLDER:
												dateTimePrefix = `${formatDate(
													new Date(item.createdAt).toISOString()
												)}, `;
												break;
										}

										switch (item.icon) {
											case NEWSFEED_TYPES.CHECK:
												iconClass = 'icon-check_medium';
												break;

											case NEWSFEED_TYPES.ALERT:
												iconClass = 'icon-exclamation_mark2';
												break;

											case NEWSFEED_TYPES.AT:
												iconClass = 'icon-at';
												break;

											case NEWSFEED_TYPES.EURO:
												iconClass = 'icon-euro';
												break;

											default:
												iconClass = 'icon-groflex_short_icon';
										}

										return (
											<div
												key={`newsfeed_item_${itemIndex}`}
												onClick={this.onItemClick.bind(this, item)}
												className={`newsfeed-item ${item.readDate ? '' : 'unread'}`}
											>
												<div className="newsfeed-item-left">
													<div className={`icon ${iconClass}`} />
												</div>
												<div className="newsfeed-item-middle">
													<div
														className="newsfeed-item-content"
														title={item.text}
														dangerouslySetInnerHTML={{ __html: item.text }}
													/>
												</div>
												<div className="newsfeed-item-right">
													<span>
														{dateTimePrefix}
														{formatTime(new Date(item.createdAt).toISOString())}
													</span>
												</div>
											</div>
										);
									})}
								</div>
							);
						})
					)}
				</div>
			</div>
		);
	}
}

export default NewsfeedComponent;
