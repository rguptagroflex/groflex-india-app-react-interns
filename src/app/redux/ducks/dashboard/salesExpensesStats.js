import invoiz from 'services/invoiz.service';
import config from 'config';
import _ from 'lodash';
import { getResource } from 'helpers/resource';

/*
 * Actions
 */
const START_FETCHING_STATS_DATA = 'invoiz/dashboard/salesExpensesStats/START_FETCHING_STATS_DATA';
const START_FETCHING_ADDITIONAL_STATS_DATA = 'invoiz/dashboard/salesExpensesStats/START_FETCHING_ADDITIONAL_STATS_DATA';
const FINISHED_FETCHING_STATS_DATA = 'invoiz/dashboard/salesExpensesStats/FINISHED_FETCHING_STATS_DATA';
const ERROR_FETCHING_STATS_DATA = 'invoiz/dashboard/salesExpensesStats/ERROR_FETCHING_STATS_DATA';

/*
 * Reducer
 */
const initialState = {
	isLoading: true,
	isLoadingAdditionalStats: false,
	errorOccurred: false,
	chartData: {},
	footerData: {}
};

export default function reducer(state = initialState, action) {
	const { chartData, footerData } = action;
	const currentFooterData = state.footerData;
	let parsedChartData = null;

	switch (action.type) {
		case START_FETCHING_STATS_DATA:
			return Object.assign({}, state, {
				isLoading: true,
				isLoadingAdditionalStats: false
			});

		case START_FETCHING_ADDITIONAL_STATS_DATA:
			return Object.assign({}, state, {
				isLoading: false,
				isLoadingAdditionalStats: true
			});

		case FINISHED_FETCHING_STATS_DATA:
			parsedChartData = parseChartData(chartData);

			return Object.assign({}, state, {
				isLoading: false,
				isLoadingAdditionalStats: false,
				chartData: parsedChartData,
				footerData: footerData || currentFooterData,
				errorOccurred: false
			});

		case ERROR_FETCHING_STATS_DATA:
			return Object.assign({}, state, {
				isLoading: false,
				isLoadingAdditionalStats: false,
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

const startFetchingAdditionalStatsData = () => {
	return {
		type: START_FETCHING_ADDITIONAL_STATS_DATA
	};
};

const finishedFetchingStatsData = data => {
	return {
		type: FINISHED_FETCHING_STATS_DATA,
		chartData: data.chartData,
		footerData: data.footerData
	};
};

const errorFetchingStatsData = () => {
	return {
		type: ERROR_FETCHING_STATS_DATA
	};
};

const parseChartData = data => {
	const chartData = {
		labels: [],
		series: [],
		headerYearLabel: '',
		prevDataExist: data.prevDataExist,
		nextDataExist: data.nextDataExist
	};

	const monthOrder = _.pluck(data.turnoverMonthly, 'month');

	const monthLabels = monthOrder.map(itm => getResource('monthNames')[itm - 1]);
	chartData.labels = monthLabels;

	chartData.series = [
		{
			data: _.map(data.turnoverMonthly, item => {
				const meta = `${item.month}/${item.year}`;

				return {
					meta,
					value: item.value
				};
			}),
			name: 'sales'
		},
		{
			data: _.map(data.expensesMonthly, item => {
				const meta = `${item.month}/${item.year}`;

				return {
					meta,
					value: item.value
				};
			}),
			name: 'expenses'
		}
	];

	const chartYears = data.turnoverMonthly
		.map(salesObj => salesObj.year)
		.concat(data.expensesMonthly.map(expensesObj => expensesObj.year));

	chartData.headerYearLabel = _.uniq(chartYears).join('/');

	return chartData;
};

export const fetchStatsData = (monthOffset, isAdditionalRequest) => {
	return dispatch => {
		if (isAdditionalRequest) {
			dispatch(startFetchingAdditionalStatsData());
		} else {
			dispatch(startFetchingStatsData());
		}

		invoiz
			.request(`${config.dashboard.endpoints.stats}turnoverExpenses?monthOffset=${monthOffset}`, {
				auth: true
			})
			.then(({ body: { data: chartData } }) => {
				if (!isAdditionalRequest) {
					invoiz
						.request(`${config.dashboard.endpoints.stats}turnoverExpenseAggregations`, {
							auth: true
						})
						.then(({ body: { data: footerData } }) => {
							if (!isAdditionalRequest) {
							}
							dispatch(
								finishedFetchingStatsData({
									chartData,
									footerData
								})
							);
						})
						.catch(() => {
							dispatch(errorFetchingStatsData());
						});
				} else {
					dispatch(
						finishedFetchingStatsData({
							chartData
						})
					);
				}
			})
			.catch(() => {
				dispatch(errorFetchingStatsData());
			});
	};
};
