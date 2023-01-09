import invoiz from 'services/invoiz.service';
import config from 'config';
import URL from 'url-parse';

/*
 * Actions
 */
const START_FETCHING_NEWSFEED_DATA = 'invoiz/newsfeed/START_FETCHING_NEWSFEED_DATA';
const START_FETCHING_NEWSFEED_COUNT_DATA = 'invoiz/newsfeed/START_FETCHING_NEWSFEED_COUNT_DATA';
const FINISHED_FETCHING_NEWSFEED_DATA = 'invoiz/newsfeed/FINISHED_FETCHING_NEWSFEED_DATA';
const FINISHED_FETCHING_NEWSFEED_COUNT_DATA = 'invoiz/newsfeed/FINISHED_FETCHING_NEWSFEED_COUNT_DATA';
const ERROR_FETCHING_NEWSFEED_DATA = 'invoiz/newsfeed/ERROR_FETCHING_NEWSFEED_DATA';
const ERROR_FETCHING_NEWSFEED_COUNT_DATA = 'invoiz/newsfeed/ERROR_FETCHING_NEWSFEED_COUNT_DATA';
const FINISHED_UPDATING_NEWSFEED_COUNT_RESET = 'invoiz/newsfeed/FINISHED_UPDATING_NEWSFEED_COUNT_RESET';

/*
 * Reducer
 */
const initialState = {
	isCountLoading: true,
	isLoading: true,
	countErrorOccurred: false,
	errorOccurred: false,
	items: [],
	unreadCount: 0,
	resetCount: false
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case START_FETCHING_NEWSFEED_DATA:
			return Object.assign({}, state, {
				isLoading: true
			});
		case START_FETCHING_NEWSFEED_COUNT_DATA:
			return Object.assign({}, state, {
				isCountLoading: true
			});
		case FINISHED_FETCHING_NEWSFEED_DATA:
			const { items } = action;

			return Object.assign({}, state, {
				isLoading: false,
				errorOccurred: false,
				items
			});
		case FINISHED_FETCHING_NEWSFEED_COUNT_DATA:
			const { unreadCount } = action;

			return Object.assign({}, state, {
				isCountLoading: false,
				countErrorOccurred: false,
				unreadCount,
				resetCount: false
			});
		case ERROR_FETCHING_NEWSFEED_DATA:
			return Object.assign({}, state, {
				isLoading: false,
				errorOccurred: true
			});
		case ERROR_FETCHING_NEWSFEED_COUNT_DATA:
			return Object.assign({}, state, {
				isCountLoading: false,
				countErrorOccurred: true
			});
		case FINISHED_UPDATING_NEWSFEED_COUNT_RESET:
			return Object.assign({}, state, {
				resetCount: true
			});
		default:
			return state;
	}
}
/*
 * Action Creators
 */
const startFetchingNewsfeedData = () => {
	return {
		type: START_FETCHING_NEWSFEED_DATA
	};
};

const startFetchingNewsfeedCountData = () => {
	return {
		type: START_FETCHING_NEWSFEED_COUNT_DATA
	};
};

const finishedFetchingNewsfeedData = ({ items, unreadCount }) => {
	return {
		type: FINISHED_FETCHING_NEWSFEED_DATA,
		items,
		unreadCount
	};
};

const finishedFetchingNewsfeedCountData = ({ items, unreadCount }) => {
	return {
		type: FINISHED_FETCHING_NEWSFEED_COUNT_DATA,
		items,
		unreadCount
	};
};

const errorFetchingNewsfeedData = () => {
	return {
		type: ERROR_FETCHING_NEWSFEED_DATA
	};
};

const errorFetchingNewsfeedCountData = () => {
	return {
		type: ERROR_FETCHING_NEWSFEED_COUNT_DATA
	};
};

const finishedUpdatingNewsfeedCountReset = () => {
	return {
		type: FINISHED_UPDATING_NEWSFEED_COUNT_RESET
	};
};

export const fetchNewsfeedCount = () => {
	return dispatch => {
		dispatch(startFetchingNewsfeedCountData());

		invoiz
			.request(`${config.resourceHost}notification/count`, { auth: true })
			.then(({ body: { data: { count } } }) => {
				dispatch(
					finishedFetchingNewsfeedCountData({
						unreadCount: count
					})
				);
			})
			.catch(() => {
				dispatch(errorFetchingNewsfeedCountData());
			});
	};
};

export const fetchNewsfeedData = () => {
	return dispatch => {
		dispatch(startFetchingNewsfeedData());

		invoiz
			.request(`${config.resourceHost}notification`, { auth: true })
			.then(({ body: { data: { notifications } } }) => {
				notifications = notifications.map(notification => {
					if (notification.link) {
						notification.link = URL(notification.link).pathname;
					}

					return notification;
				});

				dispatch(
					finishedFetchingNewsfeedData({
						items: notifications
					})
				);
			})
			.catch(() => {
				dispatch(errorFetchingNewsfeedData());
			});
	};
};

export const updateNewsfeedCountReset = () => {
	return dispatch => {
		dispatch(finishedUpdatingNewsfeedCountReset());
	};
};
