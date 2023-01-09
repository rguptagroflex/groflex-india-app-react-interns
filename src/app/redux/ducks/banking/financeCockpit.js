import invoiz from 'services/invoiz.service';
import config from 'config';
// import { formatDate } from 'helpers/formatDate';
import { formateClientDateMonthYear } from 'helpers/formatDate';
import { formatCurrency } from 'helpers/formatCurrency';

const formatRevenueExpenseFrequency = value => {
	let formattedValue = '';

	switch (value) {
		case 'weekly':
			formattedValue = 'wöchentlich';
			break;

		case 'biweekly':
			formattedValue = '14-tägig';
			break;

		case 'monthly':
			formattedValue = 'monatlich';
			break;

		case 'bimonthly':
			formattedValue = '2-monatlich';
			break;

		case 'quarter':
			formattedValue = '3-monatlich';
			break;

		case 'quarterly':
			formattedValue = 'vierteljährlich';
			break;

		case 'yearly':
			formattedValue = 'jährlich';
			break;

		case 'biyearly':
		case 'half yearly':
			formattedValue = 'halbjährlich';
			break;

		case 'once':
			formattedValue = 'einmalig';
			break;
	}

	return formattedValue;
};

/*
 * Actions
 */
const START_FETCHING_NEW_TRANSACTIONS = 'invoiz/banking/financeCockpit/START_FETCHING_NEW_TRANSACTIONS';
const FINISHED_FETCHING_NEW_TRANSACTIONS = 'invoiz/banking/financeCockpit/FINISHED_FETCHING_NEW_TRANSACTIONS';
const ERROR_FETCHING_NEW_TRANSACTIONS = 'invoiz/banking/financeCockpit/ERROR_FETCHING_NEW_TRANSACTIONS';

const START_FETCHING_BALANCES = 'invoiz/banking/financeCockpit/START_FETCHING_BALANCES';
const FINISHED_FETCHING_BALANCES = 'invoiz/banking/financeCockpit/FINISHED_FETCHING_BALANCES';
const ERROR_FETCHING_BALANCES = 'invoiz/banking/financeCockpit/ERROR_FETCHING_BALANCES';

const START_FETCHING_CASHFLOW = 'invoiz/banking/financeCockpit/START_FETCHING_CASHFLOW';
const FINISHED_FETCHING_CASHFLOW = 'invoiz/banking/financeCockpit/FINISHED_FETCHING_CASHFLOW';
const ERROR_FETCHING_CASHFLOW = 'invoiz/banking/financeCockpit/ERROR_FETCHING_CASHFLOW';

const START_FETCHING_REVENUES = 'invoiz/banking/financeCockpit/START_FETCHING_REVENUES';
const FINISHED_FETCHING_REVENUES = 'invoiz/banking/financeCockpit/FINISHED_FETCHING_REVENUES';
const ERROR_FETCHING_REVENUES = 'invoiz/banking/financeCockpit/ERROR_FETCHING_REVENUES';
const START_FETCHING_EXPENSES = 'invoiz/banking/financeCockpit/START_FETCHING_EXPENSES';
const FINISHED_FETCHING_EXPENSES = 'invoiz/banking/financeCockpit/FINISHED_FETCHING_EXPENSES';
const ERROR_FETCHING_EXPENSES = 'invoiz/banking/financeCockpit/ERROR_FETCHING_EXPENSES';

const RESET_STATE = 'invoiz/banking/financeCockpit/RESET_STATE';
const SET_INITIAL_SYNC_DONE_STATE = 'invoiz/banking/financeCockpit/SET_INITIAL_SYNC_DONE_STATE';

/*
 * Reducer
 */
const initialState = {
	initialSyncDone: false,
	initialSyncDoneOnStartup: false,
	/*
	 * New transactions
	 */
	isLoadingNewTransactions: true,
	errorOccurredNewTransactions: false,
	newTransactions: [],
	/*
	 * Balances
	 */
	isLoadingBalances: true,
	errorOccurredBalances: false,
	balances: [],
	/*
	 * Cashflow
	 */
	isLoadingCashflow: true,
	errorOccurredCashflow: false,
	cashflow: [],
	/*
	 * Revenues / Expenses
	 */
	isLoadingRevenues: true,
	isLoadingExpenses: true,
	errorOccurredRevenues: false,
	errorOccurredExpenses: false,
	revenues: [],
	expenses: []
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		/*
		 * New transactions
		 */
		case START_FETCHING_NEW_TRANSACTIONS:
			return Object.assign({}, state, {
				isLoadingNewTransactions: true
			});

		case FINISHED_FETCHING_NEW_TRANSACTIONS:
			const { newTransactions } = action;

			return Object.assign({}, state, {
				isLoadingNewTransactions: false,
				errorOccurredNewTransactions: false,
				newTransactions
			});

		case ERROR_FETCHING_NEW_TRANSACTIONS:
			return Object.assign({}, state, {
				isLoadingNewTransactions: false,
				errorOccurredNewTransactions: true
			});

		/*
		 * Balances
		 */
		case START_FETCHING_BALANCES:
			return Object.assign({}, state, {
				isLoadingBalances: true
			});

		case FINISHED_FETCHING_BALANCES:
			const { balances } = action;

			return Object.assign({}, state, {
				isLoadingBalances: false,
				errorOccurredBalances: false,
				balances
			});

		case ERROR_FETCHING_BALANCES:
			return Object.assign({}, state, {
				isLoadingBalances: false,
				errorOccurredBalances: true
			});

		/*
		 * Cashflow
		 */
		case START_FETCHING_CASHFLOW:
			return Object.assign({}, state, {
				isLoadingCashflow: true
			});

		case FINISHED_FETCHING_CASHFLOW:
			const { cashflow } = action;

			return Object.assign({}, state, {
				isLoadingCashflow: false,
				errorOccurredCashflow: false,
				cashflow
			});

		case ERROR_FETCHING_CASHFLOW:
			return Object.assign({}, state, {
				isLoadingCashflow: false,
				errorOccurredCashflow: true
			});

		/*
		 * Revenues / Expenses
		 */
		case START_FETCHING_REVENUES:
			return Object.assign({}, state, {
				isLoadingRevenues: true
			});

		case FINISHED_FETCHING_REVENUES:
			const { revenues } = action;

			return Object.assign({}, state, {
				isLoadingRevenues: false,
				errorOccurredRevenues: false,
				revenues
			});

		case ERROR_FETCHING_REVENUES:
			return Object.assign({}, state, {
				isLoadingRevenues: false,
				errorOccurredRevenues: true
			});

		case START_FETCHING_EXPENSES:
			return Object.assign({}, state, {
				isLoadingExpenses: true
			});

		case FINISHED_FETCHING_EXPENSES:
			const { expenses } = action;

			return Object.assign({}, state, {
				isLoadingExpenses: false,
				errorOccurredExpenses: false,
				expenses
			});

		case ERROR_FETCHING_EXPENSES:
			return Object.assign({}, state, {
				isLoadingExpenses: false,
				errorOccurredExpenses: true
			});

		/*
		 * Global
		 */
		case RESET_STATE:
			return Object.assign({}, state, initialState);

		case SET_INITIAL_SYNC_DONE_STATE:
			const { initialSyncDoneOnStartup } = action;

			return Object.assign({}, state, {
				initialSyncDone: true,
				initialSyncDoneOnStartup
			});

		default:
			return state;
	}
}

/*
 * Action Creators
 */

/*
 * New transactions
 */
const startFetchingNewTransactions = () => {
	return {
		type: START_FETCHING_NEW_TRANSACTIONS
	};
};

const finishedFetchingNewTransactions = newTransactions => {
	return {
		type: FINISHED_FETCHING_NEW_TRANSACTIONS,
		newTransactions
	};
};

const errorFetchingNewTransactions = () => {
	return {
		type: ERROR_FETCHING_NEW_TRANSACTIONS
	};
};

/*
 * Balances
 */
const startFetchingBalances = () => {
	return {
		type: START_FETCHING_BALANCES
	};
};

const finishedFetchingBalances = balances => {
	return {
		type: FINISHED_FETCHING_BALANCES,
		balances
	};
};

const errorFetchingBalances = () => {
	return {
		type: ERROR_FETCHING_BALANCES
	};
};

/*
 * Cashflow
 */
const startFetchingCashflow = () => {
	return {
		type: START_FETCHING_CASHFLOW
	};
};

const finishedFetchingCashflow = cashflow => {
	return {
		type: FINISHED_FETCHING_CASHFLOW,
		cashflow
	};
};

const errorFetchingCashflow = () => {
	return {
		type: ERROR_FETCHING_CASHFLOW
	};
};

/*
 * Revenues / Expenses
 */
const startFetchingRevenues = () => {
	return {
		type: START_FETCHING_REVENUES
	};
};

const finishedFetchingRevenues = revenues => {
	return {
		type: FINISHED_FETCHING_REVENUES,
		revenues
	};
};

const errorFetchingRevenues = () => {
	return {
		type: ERROR_FETCHING_REVENUES
	};
};

const startFetchingExpenses = () => {
	return {
		type: START_FETCHING_EXPENSES
	};
};

const finishedFetchingExpenses = expenses => {
	return {
		type: FINISHED_FETCHING_EXPENSES,
		expenses
	};
};

const errorFetchingExpenses = () => {
	return {
		type: ERROR_FETCHING_EXPENSES
	};
};

/*
 * Global
 */
const resetState = () => {
	return {
		type: RESET_STATE
	};
};

const setInitialSyncDoneState = initialSyncDoneOnStartup => {
	return {
		type: SET_INITIAL_SYNC_DONE_STATE,
		initialSyncDoneOnStartup
	};
};

export const fetchNewTransactions = selectedAccountIds => {
	return dispatch => {
		dispatch(startFetchingNewTransactions());

		let accountId = selectedAccountIds ? selectedAccountIds.join(',') : null;

		if (accountId === 'all') {
			accountId = null;
		}

		invoiz
			.request(
				`${
					config.resourceHost
				}banking/accounts/transactions?offset=0&limit=100&orderBy=bookingDate&sortOrder=desc&filter=all&searchTerm=&accountId=${accountId ||
					''}`,
				{ auth: true }
			)
			.then(({ body: { data: { bankAccountTransactions } } }) => {
				let transactions = [];

				bankAccountTransactions.forEach(transaction => {
					if (transaction.booked && transactions.length < 5) {
						transactions.push({
							cells: [
								// { value: formatDate(new Date(transaction.bookingDate), 'YYYY-MM-DD', 'DD.MM.YY') },
								{ value: formateClientDateMonthYear(new Date(transaction.bookingDate)) },
								{ value: transaction.bookingContactName || transaction.bankAccountName },
								{ value: formatCurrency(transaction.bookingAmount) }
							]
						});
					}
				});

				if (transactions[0] && transactions[0].cells.length === 0) {
					transactions = [];
				}

				dispatch(finishedFetchingNewTransactions(transactions));
			})
			.catch(() => {
				dispatch(errorFetchingNewTransactions());
			});
	};
};

export const fetchBalances = selectedAccountIds => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		dispatch(startFetchingBalances());

		let accountId = selectedAccountIds ? selectedAccountIds.join(',') : null;

		if (accountId === 'all') {
			accountId = null;
		}

		invoiz
			.request(`${config.resourceHost}banking/accounts/balances?accountId=${accountId || ''}`, {
				auth: true
			})
			.then(({ body: { data: { accountBalances } } }) => {
				const labels = [];

				accountBalances.forEach(balance => {
					const monthIndex = new Date(balance.date).getMonth();
					const month = resources.monthNames[monthIndex];

					if (labels.indexOf(month) === -1) {
						labels.push(month);
					} else {
						labels.push(' ');
					}
				});

				dispatch(
					finishedFetchingBalances({
						series: accountBalances.map(balance => {
							return {
								value: balance.balance,
								meta: balance.date
							};
						}),
						labels
					})
				);
			})
			.catch(() => {
				dispatch(errorFetchingBalances());
			});
	};
};

export const fetchCashflow = (selectedAccountIds, monthOffset) => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		dispatch(startFetchingCashflow());

		let accountId = selectedAccountIds ? selectedAccountIds.join(',') : null;

		if (accountId === 'all') {
			accountId = null;
		}

		invoiz
			.request(
				`${config.resourceHost}finance/cockpit/cashflow?accountId=${accountId ||
					''}&monthOffset=${monthOffset}`,
				{
					auth: true
				}
			)
			.then(({ body: { data } }) => {
				let monthLabels = data.map(item => {
					return item.month - 1;
				});

				monthLabels = monthLabels.map(monthIndex => {
					return resources.monthNames[monthIndex];
				});

				const series1 = [
					{
						data: [],
						name: 'inflowFix'
					},
					{
						data: [],
						name: 'inflowVariable'
					}
				];

				const series2 = [
					{
						data: [],
						name: 'outflowFix'
					},
					{
						data: [],
						name: 'outflowVariable'
					}
				];

				data.forEach(item => {
					series1[0].data.push({ value: item.inflowFixed, meta: item.inflowTotal });
					series1[1].data.push({ value: item.inflowVariable });

					series2[0].data.push({ value: Math.abs(item.outflowFixed), meta: Math.abs(item.outflowTotal) });
					series2[1].data.push({ value: Math.abs(item.outflowVariable) });
				});

				dispatch(
					finishedFetchingCashflow({
						series1,
						series2,
						labels: monthLabels,
						monthOffset
					})
				);
			})
			.catch(() => {
				dispatch(errorFetchingCashflow());
			});
	};
};

export const fetchRevenues = selectedAccountIds => {
	return dispatch => {
		dispatch(startFetchingRevenues());
		dispatch(startFetchingExpenses());

		let accountId = selectedAccountIds ? selectedAccountIds.join(',') : null;

		if (accountId === 'all') {
			accountId = null;
		}

		invoiz
			.request(`${config.resourceHost}finance/cockpit/expected/revenues?accountId=${accountId || ''}`, {
				auth: true
			})
			.then(({ body: { data } }) => {
				let revenues = [];

				data.forEach(revenue => {
					revenues.push({
						cells: [
						//	{ value: formatDate(new Date(revenue.date), 'YYYY-MM-DD', 'DD.MM.YY') },
							{ value: formateClientDateMonthYear(new Date(revenue.date)) },
							{ value: revenue.name1 || revenue.name2 },
							{ value: formatRevenueExpenseFrequency(revenue.frequency.toLowerCase()) },
							{ value: `+ ${formatCurrency(revenue.amount)}` }
						]
					});
				});

				if (revenues[0] && revenues[0].cells.length === 0) {
					revenues = [];
				}

				dispatch(finishedFetchingRevenues(revenues));

				invoiz
					.request(`${config.resourceHost}finance/cockpit/expected/expenses?accountId=${accountId || ''}`, {
						auth: true
					})
					.then(({ body: { data } }) => {
						let expenses = [];

						data.forEach(expense => {
							expenses.push({
								cells: [
									// { value: formatDate(new Date(expense.date), 'YYYY-MM-DD', 'DD.MM.YY') },
									{ value: formateClientDateMonthYear(new Date(expense.date)) },
									{ value: expense.name1 || expense.name2 },
									{ value: formatRevenueExpenseFrequency(expense.frequency.toLowerCase()) },
									{ value: `- ${formatCurrency(expense.totalGross)}` }
								]
							});
						});

						if (expenses[0] && expenses[0].cells.length === 0) {
							expenses = [];
						}

						dispatch(finishedFetchingExpenses(expenses));
					})
					.catch(() => {
						dispatch(errorFetchingExpenses());
					});
			})
			.catch(() => {
				dispatch(errorFetchingRevenues());
			});
	};
};

export const setInitialSyncDone = initialSyncDoneOnStartup => {
	return dispatch => {
		dispatch(setInitialSyncDoneState(initialSyncDoneOnStartup));
	};
};

export const resetCockpit = () => {
	return dispatch => {
		dispatch(resetState());
	};
};
