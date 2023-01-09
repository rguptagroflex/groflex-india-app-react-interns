import invoiz from 'services/invoiz.service';
import config from 'config';

/*
 * Actions
 */
const START_FETCHING_STATS_DATA = 'invoiz/dashboard/topSalesStats/START_FETCHING_STATS_DATA';
const FINISHED_FETCHING_STATS_DATA = 'invoiz/dashboard/topSalesStats/FINISHED_FETCHING_STATS_DATA';
const ERROR_FETCHING_STATS_DATA = 'invoiz/dashboard/topSalesStats/ERROR_FETCHING_STATS_DATA';

/*
 * Reducer
 */
const initialState = {
	isLoading: true,
	errorOccurred: false,
	statsData: {}
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case START_FETCHING_STATS_DATA:
			return Object.assign({}, state, {
				isLoading: true
			});

		case FINISHED_FETCHING_STATS_DATA:
			const { statsData } = action;
			return Object.assign({}, state, {
				isLoading: false,
				errorOccurred: false,
				statsData
			});

		case ERROR_FETCHING_STATS_DATA:
			return Object.assign({}, state, {
				isLoading: false,
				errorOccurred: true
			});

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const startFetchingStatsData = () => {
	return {
		type: START_FETCHING_STATS_DATA
	};
};

const finishedFetchingStatsData = statsData => {
	return {
		type: FINISHED_FETCHING_STATS_DATA,
		statsData
	};
};

const errorFetchingStatsData = () => {
	return {
		type: ERROR_FETCHING_STATS_DATA
	};
};

export const fetchStatsData = () => {
	return dispatch => {
		dispatch(startFetchingStatsData());

		invoiz
			.request(`${config.dashboard.endpoints.stats}turnoverCustomersArticles`, { auth: true })
			.then(({ body: { data } }) => {
				dispatch(finishedFetchingStatsData(data));
			})
			.catch(() => {
				dispatch(errorFetchingStatsData());
			});
	};
};
