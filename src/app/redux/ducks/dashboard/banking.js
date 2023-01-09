import invoiz from 'services/invoiz.service';
import config from 'config';

/*
 * Actions
 */
const START_FETCHING_BANKING_DATA = 'invoiz/dashboard/banking/START_FETCHING_BANKING_DATA';
const FINISHED_FETCHING_BANKING_DATA = 'invoiz/dashboard/banking/FINISHED_FETCHING_BANKING_DATA';
const ERROR_FETCHING_BANKING_DATA = 'invoiz/dashboard/banking/ERROR_FETCHING_BANKING_DATA';
const RESET_STATE = 'invoiz/dashboard/banking/RESET_STATE';

/*
 * Reducer
 */
const initialState = {
	isLoading: true,
	errorOccurred: false,
	bankingData: {}
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case START_FETCHING_BANKING_DATA:
			return Object.assign({}, state, {
				isLoading: true
			});

		case FINISHED_FETCHING_BANKING_DATA:
			const { bankingData } = action;
			return Object.assign({}, state, {
				isLoading: false,
				errorOccurred: false,
				bankingData
			});

		case ERROR_FETCHING_BANKING_DATA:
			return Object.assign({}, state, {
				isLoading: false,
				errorOccurred: true
			});

		case RESET_STATE:
			return Object.assign({}, initialState);

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const startFetchingBankingData = () => {
	return {
		type: START_FETCHING_BANKING_DATA
	};
};

const finishedFetchingBankingData = bankingData => {
	return {
		type: FINISHED_FETCHING_BANKING_DATA,
		bankingData
	};
};

const errorFetchingBankingData = () => {
	return {
		type: ERROR_FETCHING_BANKING_DATA
	};
};

const resetState = () => {
	return {
		type: RESET_STATE
	};
};

export const fetchBankingData = () => {
	return dispatch => {
		dispatch(startFetchingBankingData());

		invoiz
			.request(`${config.resourceHost}banking/accounts`, { auth: true })
			.then(({ body: { data } }) => {
				if (data.accounts && data.accounts.length > 0) {
					invoiz
						.request(`${config.resourceHost}dashboard/liquidity`, { auth: true })
						.then(({ body: { data } }) => {
							dispatch(finishedFetchingBankingData(data));
						})
						.catch(() => {
							dispatch(errorFetchingBankingData());
						});
				} else {
					dispatch(finishedFetchingBankingData(data));
				}
			})
			.catch(() => {
				dispatch(errorFetchingBankingData());
			});
	};
};

export const resetBankingData = () => {
	return dispatch => {
		dispatch(resetState());
	};
};
