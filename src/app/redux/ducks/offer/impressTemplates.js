import invoiz from 'services/invoiz.service';
import config from 'config';

/*
 * Actions
 */
const START_FETCHING_TEMPLATES_DATA = 'invoiz/offers/impress/START_FETCHING_TEMPLATES_DATA';
const FINISHED_FETCHING_TEMPLATES_DATA = 'invoiz/offers/impress/FINISHED_FETCHING_TEMPLATES_DATA';
const ERROR_FETCHING_TEMPLATES_DATA = 'invoiz/offers/impress/ERROR_FETCHING_TEMPLATES_DATA';

/*
 * Reducer
 */
const initialState = {
	isLoading: true,
	errorOccurred: false,
	templates: []
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case START_FETCHING_TEMPLATES_DATA:
			return Object.assign({}, state, {
				isLoading: true
			});

		case FINISHED_FETCHING_TEMPLATES_DATA:
			const { templates } = action;

			return Object.assign({}, state, {
				isLoading: false,
				errorOccurred: false,
				templates
			});

		case ERROR_FETCHING_TEMPLATES_DATA:
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
const startFetchingTemplatesData = () => {
	return {
		type: START_FETCHING_TEMPLATES_DATA
	};
};

const finishedFetchingTemplatesData = ({ templates }) => {
	return {
		type: FINISHED_FETCHING_TEMPLATES_DATA,
		templates
	};
};

const errorFetchingTemplatesData = () => {
	return {
		type: ERROR_FETCHING_TEMPLATES_DATA
	};
};

export const fetchTemplates = () => {
	return dispatch => {
		dispatch(startFetchingTemplatesData());
		dispatch(
			finishedFetchingTemplatesData({
				templates: []
			})
		);
		// invoiz
		// 	.request(`${config.resourceHost}impress/templates`, { auth: true })
		// 	.then(({ body: { data } }) => {
		// 		invoiz
		// 			.request(config.settings.endpoints.getTenantInfo, { auth: true })
		// 			.then(({ body: { data: { logoPath } } }) => {
		// 				invoiz.user.logoPath = logoPath;

						// dispatch(
						// 	finishedFetchingTemplatesData({
						// 		templates: data
						// 	})
						// );
		// 			})
		// 			.catch(() => {
		// 				dispatch(errorFetchingTemplatesData());
		// 			});
		// 	})
		// 	.catch(() => {
		// 		dispatch(errorFetchingTemplatesData());
		// 	});
	};
};
