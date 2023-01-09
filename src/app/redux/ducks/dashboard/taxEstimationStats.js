import invoiz from 'services/invoiz.service';
import moment from 'moment';
import config from 'config';
import { dateConstants } from 'helpers/constants';

/*
 * Actions
 */
const TOGGLE_STATE_TAX_ESTIMATION_DISPLAY = 'invoiz/dashboard/taxEstimationStats/TOGGLE_STATE_TAX_ESTIMATION_DISPLAY';
const START_FETCHING_TAX_ESTIMATION_STATS_DATA =
	'invoiz/dashboard/taxEstimationStats/START_FETCHING_TAX_ESTIMATION_STATS_DATA';
const FINISHED_FETCHING_TAX_ESTIMATION_STATS_DATA =
	'invoiz/dashboard/taxEstimationStats/FINISHED_FETCHING_TAX_ESTIMATION_STATS_DATA';
const ERROR_FETCHING_TAX_ESTIMATION_STATS_DATA =
	'invoiz/dashboard/taxEstimationStats/ERROR_FETCHING_TAX_ESTIMATION_STATS_DATA';
const ERROR_FETCHING_TAX_ESTIMATION_SETTING =
	'invoiz/dashboard/taxEstimationStats/ERROR_FETCHING_TAX_ESTIMATION_SETTING';

/*
 * Reducer
 */
const { YEAR: STATE_YEAR, MONTH: STATE_MONTH } = dateConstants;

const initialState = {
	toggleState: STATE_YEAR,
	isLoading: true,
	statsErrorOccurred: false,
	isEstimationActivated: true,
	tradeTaxCalculationNotPossible: false,
	headerData: {
		[STATE_YEAR]: '',
		[STATE_MONTH]: ''
	},
	salesData: {
		[STATE_YEAR]: {},
		[STATE_MONTH]: {}
	}
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case TOGGLE_STATE_TAX_ESTIMATION_DISPLAY: {
			return Object.assign({}, state, {
				toggleState: action.state
			});
		}

		case START_FETCHING_TAX_ESTIMATION_STATS_DATA:
			return Object.assign({}, state, {
				isLoading: true
			});

		case FINISHED_FETCHING_TAX_ESTIMATION_STATS_DATA:
			const { salesData, headerData, tradeTaxCalculationNotPossible } = action;
			return Object.assign({}, state, {
				isLoading: false,
				headerData,
				salesData,
				statsErrorOccurred: false,
				isEstimationActivated: true,
				tradeTaxCalculationNotPossible
			});

		case ERROR_FETCHING_TAX_ESTIMATION_STATS_DATA:
			return Object.assign({}, state, {
				isLoading: false,
				statsErrorOccurred: true
			});

		case ERROR_FETCHING_TAX_ESTIMATION_SETTING:
			return Object.assign({}, state, {
				isLoading: false,
				isEstimationActivated: false
			});

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const currentYear = moment().year();
const currentMonth = new Date().getMonth() + 1;

export const toggleState = state => {
	return {
		type: TOGGLE_STATE_TAX_ESTIMATION_DISPLAY,
		state
	};
};

const startFetchingTaxEstimationStatsData = () => {
	return {
		type: START_FETCHING_TAX_ESTIMATION_STATS_DATA
	};
};

const finishedFetchingTaxEstimationStatsData = ({ headerData, salesData, tradeTaxCalculationNotPossible }) => {
	return {
		type: FINISHED_FETCHING_TAX_ESTIMATION_STATS_DATA,
		headerData,
		salesData,
		tradeTaxCalculationNotPossible
	};
};

const errorFetchingTaxEstimationStatsData = () => {
	return {
		type: ERROR_FETCHING_TAX_ESTIMATION_STATS_DATA
	};
};

const errorFetchingTaxEstimationSetting = () => {
	return {
		type: ERROR_FETCHING_TAX_ESTIMATION_SETTING
	};
};

export const fetchTaxEstimationStats = () => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		const currentMonthName = resources.monthNames[moment().format('M') - 1];
		dispatch(startFetchingTaxEstimationStatsData());

		invoiz
			.request(`${config.resourceHost}estimationSetting/year/${currentYear}`, {
				auth: true,
				method: 'GET'
			})
			.then(() => {
				Promise.all([
					invoiz.request(`${config.dashboard.endpoints.estimationStats}estimation?year=${currentYear}`, {
						auth: true
					}),
					invoiz.request(
						`${
							config.dashboard.endpoints.estimationStats
						}estimation?year=${currentYear}&month=${currentMonth}`,
						{ auth: true }
					)
				])
					.then(([yearResponse, monthResponse]) => {
						const {
							body: { data: yearData, meta: yearMeta }
						} = yearResponse;
						const {
							body: { data: monthData, meta: monthMeta }
						} = monthResponse;
						const isYearTradeTaxError = yearMeta.zip || yearMeta.city;
						const isMonthTradeTaxError = monthMeta.zip || monthMeta.city;

						const statsData = {
							headerData: {
								[STATE_YEAR]: `${resources.str_estimateFor} ${currentYear}`,
								[STATE_MONTH]: `${resources.str_estimateFor} ${currentMonthName}`
							},
							salesData: {
								[STATE_YEAR]: Object.assign({}, yearData, { netProfit: yearData.yours }),
								[STATE_MONTH]: Object.assign({}, monthData, { netProfit: monthData.yours })
							},
							tradeTaxCalculationNotPossible: isYearTradeTaxError || isMonthTradeTaxError
						};

						dispatch(finishedFetchingTaxEstimationStatsData(statsData));
					})
					.catch(() => {
						dispatch(errorFetchingTaxEstimationStatsData());
						invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
					});
			})
			.catch(() => {
				dispatch(errorFetchingTaxEstimationSetting());
			});
	};
};
