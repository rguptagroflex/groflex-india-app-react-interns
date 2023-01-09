import invoiz from 'services/invoiz.service';
import config from 'config';
import NotificationService from 'services/notification.service';

/*
 * Actions
 */
const START_FETCHING_ACHIEVEMENT_DATA = 'invoiz/dashboard/achievementCenter/START_FETCHING_ACHIEVEMENT_DATA';
const FINISHED_FETCHING_ACHIEVEMENT_DATA = 'invoiz/dashboard/achievementCenter/FINISHED_FETCHING_ACHIEVEMENT_DATA';
const ERROR_FETCHING_ACHIEVEMENT_DATA = 'invoiz/dashboard/achievementCenter/ERROR_FETCHING_ACHIEVEMENT_DATA';
const RESET_STATE = 'invoiz/dashboard/achievementCenter/RESET_STATE';

/*
 * Reducer
 */
const initialState = {
	isLoading: true,
	errorOccurred: false,
	achievementData: {}
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case START_FETCHING_ACHIEVEMENT_DATA:
			return Object.assign({}, initialState, {
				isLoading: true
			});

		case FINISHED_FETCHING_ACHIEVEMENT_DATA:
			const { achievementData } = action;
			return Object.assign({}, state, {
				isLoading: false,
				errorOccurred: false,
				achievementData
			});

		case ERROR_FETCHING_ACHIEVEMENT_DATA:
			return Object.assign({}, state, {
				isLoading: false,
				errorOccurred: true
			});

		case RESET_STATE:
			return Object.assign({}, state, initialState);

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const startFetchingAchievementData = () => {
	return {
		type: START_FETCHING_ACHIEVEMENT_DATA
	};
};

const finishedFetchingAchievementData = achievementData => {
	return {
		type: FINISHED_FETCHING_ACHIEVEMENT_DATA,
		achievementData
	};
};

const errorFetchingAchievementData = () => {
	return {
		type: ERROR_FETCHING_ACHIEVEMENT_DATA
	};
};

const resetState = () => {
	return {
		type: RESET_STATE
	};
};

export const fetchAchievementData = () => {
	return dispatch => {
		dispatch(startFetchingAchievementData());

		invoiz
			.request(`${config.resourceHost}tenant/awards`, { auth: true })
			.then(({ body: { data } }) => {
				dispatch(finishedFetchingAchievementData(data));
			})
			.catch(() => {
				dispatch(errorFetchingAchievementData());
			});
	};
};

export const postAchievementData = () => {
	return dispatch => {
		dispatch(startFetchingAchievementData());

		invoiz
			.request(`${config.resourceHost}tenant/awards`, { auth: true, method: 'POST' })
			.then(() => {
				NotificationService.show({
					message: 'Deine nächste nächste Rechnung geht auf uns :)',
					svgIcon: 'party-blue'
				});

				invoiz
					.request(`${config.resourceHost}tenant/awards`, { auth: true })
					.then(({ body: { data } }) => {
						dispatch(finishedFetchingAchievementData(data));
					})
					.catch(() => {
						dispatch(errorFetchingAchievementData());
					});
			})
			.catch(() => {
				dispatch(errorFetchingAchievementData());
			});
	};
};

export const resetAchievementData = () => {
	return dispatch => {
		dispatch(resetState());
	};
};
