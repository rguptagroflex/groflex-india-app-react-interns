import invoiz from 'services/invoiz.service';
import config from 'config';
import q from 'q';
import Expense from 'models/expense.model';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';

/*
 * Actions
 */
const INIT_EXPENSE_LIST = 'invoiz/expense/INIT_EXPENSE_LIST';
const RESET_EXPENSE_LIST = 'invoiz/expense/RESET_EXPENSE_LIST';
const START_FETCHING_EXPENSE_LIST = 'invoiz/expense/START_FETCHING_EXPENSE_LIST';
const FINISHED_FETCHING_EXPENSE_LIST = 'invoiz/expense/FINISHED_FETCHING_EXPENSE_LIST';
const ERROR_FETCHING_EXPENSE_LIST = 'invoiz/expense/ERROR_FETCHING_EXPENSE_LIST';
const SORT_EXPENSE_LIST = 'invoiz/expense/SORT_EXPENSE_LIST';
const PAGINATE_EXPENSE_LIST = 'invoiz/expense/PAGINATE_EXPENSE_LIST';
const FILTER_EXPENSE_LIST = 'invoiz/expense/FILTER_EXPENSE_LIST';
const SEARCH_EXPENSE_LIST = 'invoiz/expense/SEARCH_CUSTOMER_LIST';
const SELECT_EXPENSE = 'invoiz/expense/SELECT_EXPENSE';
const SELECT_ALL = 'invoiz/expense/SELECT_ALL';
const FINISHED_DELETE_SELECTED = 'invoiz/expense/FINISHED_DELETE_SELECTED';
const FINISHED_DELETING_SELECTED_ITEMS = 'invoiz/expense/FINISHED_DELETING_SELECTED_ITEMS';

/*
 * Reducer
 */
const initialState = {
	initialized: false,
	isLoading: true,
	errorOccurred: false,
	allSelected: false,
	selectedItems: [],
	columns: [
		{ key: 'date', title: 'Belegdatum', width: '120px', sorted: 'desc', resourceKey: 'documentDate' },
		{ key: 'customerData.name', title: 'Zahlungsempfänger', resourceKey: 'payee' },
		// { key: 'payee', title: 'Zahlungsempfänger', resourceKey: 'payee' },
		{ key: 'type', title: 'Type', width: '100px', resourceKey: 'type' },
		{ key: 'payKind', title: 'Status', width: '100px', resourceKey: 'status' },
		{ key: 'totalGross', title: 'Brutto', width: '150px', align: 'right',resourceKey: 'gross' },
		// { key: 'priceTotal', title: 'Brutto', width: '120px', align: 'right', resourceKey: 'gross' },
		{ key: 'dropdown', title: '', width: '50px', notSortable: true, notClickable: true, resourceKey: '' }
	],
	currentPage: 1,
	totalPages: 1,
	filterItems: [
		{ title: 'Alle', count: 0, active: true, key: 'all', resouceKey: 'all' },
		{ title: 'Offen', count: 0, active: false, key: 'open', resouceKey: 'open' },
		{ title: 'Bezahlt', count: 0, active: false, key: 'paid', resouceKey: 'paid' }
	],
	orderBy: 'date',
	sortDirection: 'desc',
	currentFilter: 'all',
	searchText: '',
	expenseListData: {
		expenses: [],
		meta: {}
	},
	finishedDeletingItems: false
};

let searchTimer = null;

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_EXPENSE_LIST: {
			const settings = WebStorageService.getItem(WebStorageKey.EXPENSE_LIST_SETTINGS);

			if (settings) {
				const { filterItems, columns } = state;
				const { orderBy, sortDirection, currentFilter } = settings;
				const newFilterItems = filterItems.map(filterItem => {
					filterItem.active = currentFilter === filterItem.key;
					return filterItem;
				});
				const newColumns = columns.map(column => {
					if (column.key === orderBy) {
						column.sorted = sortDirection;
					} else {
						delete column.sorted;
					}
					return column;
				});
				return {
					...state,
					initialized: true,
					orderBy,
					sortDirection,
					currentFilter,
					filterItems: newFilterItems,
					columns: newColumns,
					searchText: ''
				};
			} else {
				return { ...state, initialized: true };
			}
		}

		case RESET_EXPENSE_LIST: {
			return { ...initialState };
		}

		case START_FETCHING_EXPENSE_LIST: {
			return { ...state, isLoading: true };
		}

		case FINISHED_FETCHING_EXPENSE_LIST: {
			const { expenseListData } = action;
			const { count, filter } = expenseListData.meta;
			const totalPages = Math.ceil(count / 20);
			const { filterItems, searchText } = state;

			const newFilterItems = filterItems.map(filterItem => {
				const filterData = filter[filterItem.key];
				if (filterData) {
					filterItem.count = filterData.count;
				}
				return filterItem;
			});

			const { orderBy, sortDirection, currentFilter } = state;
			WebStorageService.setItem(WebStorageKey.EXPENSE_LIST_SETTINGS, {
				orderBy,
				sortDirection,
				currentFilter
			});

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				expenseListData,
				totalPages,
				allSelected: false,
				selectedItems: [],
				filterItems: newFilterItems,
				searchText
			};
		}

		case PAGINATE_EXPENSE_LIST: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case ERROR_FETCHING_EXPENSE_LIST: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		case SORT_EXPENSE_LIST: {
			const { clickedColumn } = action;
			const { columns } = state;
			let orderBy, sortDirection;

			const newColumns = columns.map(column => {
				if (column.key === clickedColumn.key) {
					column.sorted = column.sorted === 'desc' ? 'asc' : 'desc';
					orderBy = column.key;
					sortDirection = column.sorted;
				} else {
					delete column.sorted;
				}

				return column;
			});

			return { ...state, orderBy, sortDirection, columns: newColumns };
		}

		case FILTER_EXPENSE_LIST: {
			const { filterItem } = action;
			const { filterItems } = state;
			let currentFilter;

			const newFilterItems = filterItems.map(filter => {
				filter.active = filter.key === filterItem.key;
				if (filter.active) {
					currentFilter = filter.key;
				}
				return filter;
			});

			return {
				...state,
				currentFilter,
				filterItems: newFilterItems,
				currentPage: 1
			};
		}

		case SEARCH_EXPENSE_LIST: {
			const { searchText } = action;
			return { ...state, isLoading: searchText.trim().length === 0, searchText };
		}

		case SELECT_EXPENSE: {
			const { expenseListData } = state;
			const { id, selected } = action;

			const selectedItems = [];

			expenseListData.expenses.forEach(expense => {
				if (expense.id === id) {
					expense.selected = selected;
				}

				if (expense.selected) {
					selectedItems.push(expense);
				}
			});

			const allSelected = selectedItems.length === expenseListData.expenses.length;

			return {
				...state,
				expenseListData,
				allSelected,
				selectedItems
			};
		}

		case SELECT_ALL: {
			const { expenseListData } = state;
			const { selected } = action;

			expenseListData.expenses.forEach(expense => {
				expense.selected = selected;
			});

			return {
				...state,
				expenseListData,
				allSelected: selected,
				selectedItems: selected ? expenseListData.expenses : []
			};
		}

		case FINISHED_DELETE_SELECTED: {
			const { selectedItems } = state;
			const { id, success } = action;

			selectedItems.forEach(expense => {
				if (expense.id === id) {
					expense.deleteSuccess = success;
				}
			});

			return {
				...state,
				selectedItems
			};
		}

		case FINISHED_DELETING_SELECTED_ITEMS: {
			return { ...state, finishedDeletingItems: true };
		}

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const initExpenseList = () => {
	return {
		type: INIT_EXPENSE_LIST
	};
};

const resetExpenseList = () => {
	return {
		type: RESET_EXPENSE_LIST
	};
};

const startFetchingExpenseList = () => {
	return {
		type: START_FETCHING_EXPENSE_LIST
	};
};

const finishedFetchingExpenseList = expenseListData => {
	return {
		type: FINISHED_FETCHING_EXPENSE_LIST,
		expenseListData
	};
};

const errorFetchingExpenseList = () => {
	return {
		type: ERROR_FETCHING_EXPENSE_LIST
	};
};

const paginate = page => {
	return {
		type: PAGINATE_EXPENSE_LIST,
		page
	};
};

const sort = clickedColumn => {
	return {
		type: SORT_EXPENSE_LIST,
		clickedColumn
	};
};

const filter = filterItem => {
	return {
		type: FILTER_EXPENSE_LIST,
		filterItem
	};
};

const search = searchText => {
	return {
		type: SEARCH_EXPENSE_LIST,
		searchText
	};
};

const selectItem = (id, selected) => {
	return {
		type: SELECT_EXPENSE,
		id,
		selected
	};
};

const selectAll = selected => {
	return {
		type: SELECT_ALL,
		selected
	};
};

const finishedDeletingItem = (id, success) => {
	return {
		type: FINISHED_DELETE_SELECTED,
		id,
		success
	};
};

const finishedDeletingSelectedItems = () => {
	return {
		type: FINISHED_DELETING_SELECTED_ITEMS
	};
};

export const fetchExpenseList = reset => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetExpenseList());
		}

		if (!getState().expense.expenseList.initialized) {
			dispatch(initExpenseList());
		}

		dispatch(startFetchingExpenseList());

		const { currentPage, orderBy, sortDirection, currentFilter, searchText } = getState().expense.expenseList;

		const limit = 20;
		const offset = (currentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		const queryString = `?offset=${offset}&searchText=${searchText}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}&filter=${currentFilter}`;
		invoiz
			.request(`${config.resourceHost}expense${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const expenses = data.map(expense => {
					return new Expense(expense);
				});
				dispatch(finishedFetchingExpenseList({ expenses, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingExpenseList());
			});
	};
};

export const paginateExpenseList = page => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchExpenseList());
	};
};

export const sortExpenseList = column => {
	return dispatch => {
		dispatch(sort(column));
		dispatch(fetchExpenseList());
	};
};

export const filterExpenseList = filterItem => {
	return dispatch => {
		dispatch(filter(filterItem));
		dispatch(fetchExpenseList());
	};
};

export const searchExpenseList = searchText => {
	return dispatch => {
		dispatch(search(searchText));

		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			dispatch(fetchExpenseList());
		}, 500);
	};
};

export const deleteExpense = id => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		invoiz
			.request(`${config.resourceHost}expense/${id}`, {
				auth: true,
				method: 'DELETE'
			})
			.then(() => {
				invoiz.page.showToast({ message: resources.expenseDeleteSuccessMessage });
				dispatch(fetchExpenseList());
			});
	};
};

export const selectExpense = (id, selected) => {
	return dispatch => {
		dispatch(selectItem(id, selected));
	};
};

export const selectAllExpenses = selected => {
	return dispatch => {
		dispatch(selectAll(selected));
	};
};

export const deleteSelectedExpenses = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().expense.expenseList;

		const requests = selectedItems.map(expense => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}expense/${expense.id}`, {
						auth: true,
						method: 'DELETE'
					})
					.then(() => {
						dispatch(finishedDeletingItem(expense.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedDeletingItem(expense.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			dispatch(finishedDeletingSelectedItems());
		});
	};
};
