import invoiz from 'services/invoiz.service';
import moment from 'moment';

/*
 * Actions
 */
const FETCHING_LANGUAGE_DETAIL = 'FETCHING_LANGUAGE_DETAIL';
const ERROR_FETCHING_LANGUAGE_DETAIL = 'ERROR_FETCHING_LANGUAGE_DETAIL';

/*
 * Reducer
 */
const initialState = {
	resources: null,
	language: '',
	isLoading: true,
	errorOccurred: false
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case FETCHING_LANGUAGE_DETAIL:
			return {
				resources: action.payload.data,
				language: action.payload.language,
				isLoading: false,
				errorOccurred: false
			};
		case ERROR_FETCHING_LANGUAGE_DETAIL: {
			return { ...state,
				type: action.langType,
				isLoading: false,
				errorOccurred: true
			};
		}
		default:
			return state;
	}
}

/*
 * Action Creators
 */
const fetchingLanguageDetail = (payload) => {
	return {
		type: FETCHING_LANGUAGE_DETAIL,
		payload
	};
};

const errorFetchingLanguageDetail = (language) => {
	return {
		type: ERROR_FETCHING_LANGUAGE_DETAIL,
		language
	};
};

export const fetchLanguageFile = language => {
	const date = moment().unix();
	return (dispatch) => {
		invoiz
			.request(`/lang/lang_${language}.json?d=${date}`, {
				auth: true,
				isConcurrent: true
			})
			.then((response) => {
				const payload = {
					data: response.body,
					language
				};
				dispatch(fetchingLanguageDetail(payload));
			})
			.catch(() => {
				dispatch(errorFetchingLanguageDetail(language));
			});
	};
};
