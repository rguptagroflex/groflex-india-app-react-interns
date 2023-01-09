import invoiz from 'services/invoiz.service';
import config from 'config';
import { post } from 'jquery';

/*
 * Actions
 */
const FETCHING_REGISTRATION_LIST = 'FETCHING_REGISTRATION_VALUES';
const ERROR_FETCHING_REGISTRATION_LIST = 'ERROR_REGISTRATION_VALUES';

/*
 * Reducer
 */
const initialState = {
	businesstype: [],
	businessturnover: [],
	businesscategory: [],
	errorOccurred: false,
	isLoading: true
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case FETCHING_REGISTRATION_LIST:
			return {
				businesscategory: action.payload.data.businesscategory,
				businessturnover: action.payload.data.businessturnover,
				businesstype: action.payload.data.businesstype,
				errorOccurred: false,
				isLoading: false
			};
		case ERROR_FETCHING_REGISTRATION_LIST: {
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

const fetchingRegistrationList = (payload) => {
	return {
		type: FETCHING_REGISTRATION_LIST,
		payload
	};
};

const errorfetchingRegistrationList = (langType) => {
	return {
		type: ERROR_FETCHING_REGISTRATION_LIST,
		langType
	};
};

export const fetchRegistrationList = () => {
	return (dispatch) => {
		invoiz
			.request(`${config.resourceHost}registrationOnboarding/registration_onboarding_values`, {
				auth: true,
				isConcurrent: true,
				method: 'GET'
			})
			.then((response) => {
        		dispatch(fetchingRegistrationList(response.body));
		    })
			.catch(() => {
				dispatch(errorfetchingRegistrationList());
			});
	};
};
