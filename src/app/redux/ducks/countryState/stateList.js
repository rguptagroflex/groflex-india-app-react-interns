import invoiz from 'services/invoiz.service';
import config from 'config';

/*
 * Actions
 */
const FETCHING_STATE_LIST = 'FETCHING_STATE_LIST';
const ERROR_FETCHING_STATE_LIST = 'ERROR_FETCHING_STATE_LIST';

/*
 * Reducer
 */
const initialState = {
	stateListData: [],
	errorOccurred: false,
	isLoading: true
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case FETCHING_STATE_LIST:
			return {
				stateListData: action.payload.data,
				errorOccurred: false,
				isLoading: false
			};
		case ERROR_FETCHING_STATE_LIST: {
			return { ...state,
				errorOccurred: true,
				isLoading: false
			};
		}
		default:
			return state;
	}
}

/*
 * Action Creators
 */

const fetchingStateList = (payload) => {
	return {
		type: FETCHING_STATE_LIST,
		payload
	};
};

const errorFetchingStateList = (langType) => {
	return {
		type: ERROR_FETCHING_STATE_LIST,
		langType
	};
};

export const fetchStateList = () => {
	return (dispatch) => {
		invoiz
			.request(`${config.resourceHost}india/states`, {
				auth: true,
				isConcurrent: true
			})
			.then((response) => {
        		dispatch(fetchingStateList(response.body));
		    })
			.catch(() => {
				dispatch(errorFetchingStateList());
			});
	};
};
