import invoiz from 'services/invoiz.service';
import config from 'config';

/*
 * Actions
 */
const START_FETCHING_STATS_DATA = 'invoiz/dashboard/invoiceOfferStats/START_FETCHING_STATS_DATA';
const FINISHED_FETCHING_STATS_DATA = 'invoiz/dashboard/invoiceOfferStats/FINISHED_FETCHING_STATS_DATA';
const ERROR_FETCHING_STATS_DATA = 'invoiz/dashboard/invoiceOfferStats/ERROR_FETCHING_STATS_DATA';
const START_FETCHING_QUOTATION_DAY_STATS_DATA = 'invoiz/dashboard/invoiceOfferStats/START_FETCHING_QUOTATION_DAY_STATS_DATA';
const FINISHED_FETCHING_QUOTATION_DAY_STATS_DATA = 'invoiz/dashboard/invoiceOfferStats/FINISHED_FETCHING_QUOTATION_DAY_STATS_DATA';
const ERROR_FETCHING_QUOTATION_DAY_STATS_DATA = 'invoiz/dashboard/invoiceOfferStats/ERROR_FETCHING_QUOTATION_DAY_STATS_DATA';

/*
 * Reducer
 */
const initialState = {
	isLoading: true,
	errorOccurred: false,
	statsData: {},
	quotationStatsData: {}
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
		case START_FETCHING_QUOTATION_DAY_STATS_DATA:
			return Object.assign({}, state, {
				isLoading: true
			});

		case FINISHED_FETCHING_QUOTATION_DAY_STATS_DATA:
			const { quotationStatsData } = action;
			return Object.assign({}, state, {
				isLoading: false,
				errorOccurred: false,
				quotationStatsData: quotationStatsData.offerNotYetInvoiceTotal
			});

		case ERROR_FETCHING_QUOTATION_DAY_STATS_DATA:
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

const startFetchingQuotationDayStatsData = () => {
	return {
		type: START_FETCHING_QUOTATION_DAY_STATS_DATA
	};
};

const finishedFetchingStatsData = statsData => {
	return {
		type: FINISHED_FETCHING_STATS_DATA,
		statsData
	};
};

const finishedQuotationDayStatsData = quotationStatsData => {
	return {
		type: FINISHED_FETCHING_QUOTATION_DAY_STATS_DATA,
		quotationStatsData
	};
};

const errorFetchingStatsData = () => {
	return {
		type: ERROR_FETCHING_STATS_DATA
	};
};

const errorFetchingQuotationDayStatsData = () => {
	return {
		type: ERROR_FETCHING_QUOTATION_DAY_STATS_DATA
	};
};

export const fetchStatsData = () => {
	return dispatch => {
		dispatch(startFetchingStatsData());

		invoiz
			.request(`${config.dashboard.endpoints.statistic}invoice`, { auth: true })
			.then(({ body: { data: { invoiceStats } } }) => {
				invoiz
					.request(`${config.dashboard.endpoints.statistic}offer`, { auth: true })
					.then(({ body: { data: { offerStats, offerStatsNotYetInvoiced } } }) => {
						dispatch(
							finishedFetchingStatsData({
								invoiceStats,
								offerStats,
								offerStatsNotYetInvoiced
							})
						);
					})
					.catch(() => {
						dispatch(errorFetchingStatsData());
					});
			})
			.catch(() => {
				dispatch(errorFetchingStatsData());
			});
	};
};

export const fetchQuotationDayStatsData = () => {
	return dispatch => {
		dispatch(startFetchingQuotationDayStatsData());
		invoiz
			.request(`${config.dashboard.endpoints.statistic}offerDayWise`, { auth: true })
			.then(({ body: { data: { offerNotYetInvoiceTotal } } }) => {
				dispatch(
					finishedQuotationDayStatsData({
						offerNotYetInvoiceTotal
					})
				);
			})
			.catch(() => {
				dispatch(errorFetchingQuotationDayStatsData());
			});
	};
};
