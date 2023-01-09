import invoiz from 'services/invoiz.service';
import config from 'config';

/*
 * Actions
 */
const START_FETCHING_ONBOARDING_DATA = 'invoiz/dashboard/onboarding/START_FETCHING_ONBOARDING_DATA';
const FINISHED_FETCHING_ONBOARDING_DATA = 'invoiz/dashboard/onboarding/FINISHED_FETCHING_ONBOARDING_DATA';
const ERROR_FETCHING_ONBOARDING_DATA = 'invoiz/dashboard/onboarding/ERROR_FETCHING_ONBOARDING_DATA';
const RESET_STATE = 'invoiz/dashboard/onboarding/RESET_STATE';

/*
 * Reducer
 */
const initialState = {
	isLoading: true,
	errorOccurred: false,
	onboardingData: {}
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case START_FETCHING_ONBOARDING_DATA:
			return Object.assign({}, state, {
				isLoading: true
			});

		case FINISHED_FETCHING_ONBOARDING_DATA:
			const { onboardingData } = action;
			return Object.assign({}, state, {
				isLoading: false,
				errorOccurred: false,
				onboardingData
			});

		case ERROR_FETCHING_ONBOARDING_DATA:
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
const startFetchingArticleCategorySalesData = () => {
	return {
		type: START_FETCHING_ONBOARDING_DATA
	};
};

const finishedFetchingArticleCategorySalesData = onboardingData => {
	return {
		type: FINISHED_FETCHING_ONBOARDING_DATA,
		onboardingData
	};
};

const errorFetchingArticleCategorySalesData = () => {
	return {
		type: ERROR_FETCHING_ONBOARDING_DATA
	};
};

const resetState = () => {
	return {
		type: RESET_STATE
	};
};

export const fetchOnboardingData = isDebug => {
	return dispatch => {
		if (isDebug) {
			dispatch(
				finishedFetchingArticleCategorySalesData({
					hasConfirmedEmail: true,
					isDebug: true
				})
			);
		} else {
			dispatch(startFetchingArticleCategorySalesData());

			invoiz
				.request(`${config.resourceHost}/tenant/onboarding/info`, { auth: true })
				.then(({ body: { data } }) => {
					dispatch(finishedFetchingArticleCategorySalesData(data));
				})
				.catch(() => {
					dispatch(errorFetchingArticleCategorySalesData());
				});
		}
	};
};

export const resetOnboardingData = () => {
	return dispatch => {
		dispatch(resetState());
	};
};
