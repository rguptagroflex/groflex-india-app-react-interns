import invoiz from 'services/invoiz.service';
import config from 'config';
import q from 'q';
import RecurringInvoice from 'models/recurring-invoice.model';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';

/*
 * Actions
 */
const INIT_RECURRING_INVOICE_LIST = 'invoiz/recurring-invoice/INIT_RECURRING_INVOICE_LIST';
const RESET_RECURRING_INVOICE_LIST = 'invoiz/recurring-invoice/RESET_RECURRING_INVOICE_LIST';
const START_FETCHING_RECURRING_INVOICE_LIST = 'invoiz/recurring-invoice/START_FETCHING_RECURRING_INVOICE_LIST';
const FINISHED_FETCHING_RECURRING_INVOICE_LIST = 'invoiz/recurring-invoice/FINISHED_FETCHING_RECURRING_INVOICE_LIST';
const ERROR_FETCHING_RECURRING_INVOICE_LIST = 'invoiz/recurring-invoice/ERROR_FETCHING_RECURRING_INVOICE_LIST';
const SORT_RECURRING_INVOICE_LIST = 'invoiz/recurring-invoice/SORT_RECURRING_INVOICE_LIST';
const PAGINATE_RECURRING_INVOICE_LIST = 'invoiz/recurring-invoice/PAGINATE_RECURRING_INVOICE_LIST';
const FILTER_RECURRING_INVOICE_LIST = 'invoiz/recurring-invoice/FILTER_RECURRING_INVOICE_LIST';
const SEARCH_RECURRING_INVOICE_LIST = 'invoiz/recurring-invoice/SEARCH_RECURRING_INVOICE_LIST';
const SELECT_ITEM = 'invoiz/recurring-invoice/SELECT_ITEM';
const SELECT_ALL = 'invoiz/recurring-invoice/SELECT_ALL';
const FINISHED_PROCESS_SELECTED = 'invoiz/recurring-invoice/FINISHED_PROCESS_SELECTED';
const FINISHED_PROCESSING_SELECTED_ITEMS = 'invoiz/recurring-invoice/FINISHED_PROCESSING_SELECTED_ITEMS';

/*
 * Reducer
 */
const initialState = {
	isLoading: true,
	errorOccurred: false,
	initialized: false,
	columns: [],
	currentPage: 1,
	totalPages: 1,
	allSelected: false,
	selectedItems: [],
	finishedDeletingItems: false,
	filterItems: [
		{ title: 'Alle', count: 0, active: true, key: 'all', resouceKey: 'all' },
		{ title: 'Nicht gestartet', count: 0, active: false, key: 'draft', resouceKey: 'notStarted' },
		{ title: 'Aktiv', count: 0, active: false, key: 'started', resouceKey: 'active' },
		{ title: 'Beendet', count: 0, active: false, key: 'finished', resouceKey: 'finished' },
		{ title: 'Nächste 30 Tage', count: 0, active: false, key: 'within30Days', resouceKey: 'within30Days' }
	],
	orderBy: 'name',
	sortDirection: 'desc',
	currentFilter: 'all',
	searchText: '',
	recurringInvoiceListData: {
		recurringInvoices: [],
		meta: {}
	}
};

let searchTimer = null;

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_RECURRING_INVOICE_LIST: {
			const isSmallBusiness = invoiz.user.isSmallBusiness;
			const settings = WebStorageService.getItem(WebStorageKey.RECURRING_INVOICE_LIST_SETTINGS);
			const columns = [
				{ key: 'name', title: 'Kunde', sorted: 'desc', resourceKey: 'customer' },
				{ key: 'startDate', title: 'Abo-Start', resourceKey: 'subscriptionStart' }, // width: '120px'
				{ key: 'recurrence', title: 'Intervall', resourceKey: 'interval' },
				{ key: 'nextDate', title: 'Nächste Ausf.', width: '130px', resourceKey: 'nextDate' },
				{
					key: isSmallBusiness ? 'totalNet' : 'totalGross',
					title: isSmallBusiness ? 'Summe' : 'Brutto',
					width: '120px',
					align: 'right',
					resourceKey: isSmallBusiness ? 'total' : 'gross'
				},
				{ key: 'dropdown', title: '', width: '50px', notSortable: true, notClickable: true, resourceKey: '' }
			];

			if (settings) {
				const { filterItems } = state;
				const { sortDirection, currentFilter } = settings;
				let { orderBy } = settings;

				if (orderBy === 'totalGross' && isSmallBusiness) {
					orderBy = 'totalNet';
				} else if (orderBy === 'totalNet' && !isSmallBusiness) {
					orderBy = 'totalGross';
				}

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
				return { ...state, columns, initialized: true };
			}
		}

		case RESET_RECURRING_INVOICE_LIST: {
			return { ...initialState };
		}

		case START_FETCHING_RECURRING_INVOICE_LIST: {
			return {
				...state,
				isLoading: true
			};
		}

		case FINISHED_FETCHING_RECURRING_INVOICE_LIST: {
			const { recurringInvoiceListData } = action;
			const { count, filter } = recurringInvoiceListData.meta;
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
			WebStorageService.setItem(WebStorageKey.RECURRING_INVOICE_LIST_SETTINGS, {
				orderBy,
				sortDirection,
				currentFilter
			});

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				allSelected: false,
				selectedItems: [],
				recurringInvoiceListData,
				totalPages,
				filterItems: newFilterItems,
				searchText
			};
		}

		case PAGINATE_RECURRING_INVOICE_LIST: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case ERROR_FETCHING_RECURRING_INVOICE_LIST: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		case SORT_RECURRING_INVOICE_LIST: {
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

		case FILTER_RECURRING_INVOICE_LIST: {
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

			return { ...state, currentFilter, filterItems: newFilterItems, currentPage: 1 };
		}

		case SEARCH_RECURRING_INVOICE_LIST: {
			const { searchText } = action;
			return { ...state, isLoading: searchText.trim().length === 0, searchText };
		}

		case SELECT_ITEM: {
			const { recurringInvoiceListData } = state;
			const { id, selected } = action;

			const selectedItems = [];

			recurringInvoiceListData.recurringInvoices.forEach(recInvoice => {
				if (recInvoice.id === id) {
					recInvoice.selected = selected;
				}

				if (recInvoice.selected) {
					selectedItems.push(recInvoice);
				}
			});

			const allSelected = selectedItems.length === recurringInvoiceListData.recurringInvoices.length;

			return {
				...state,
				recurringInvoiceListData,
				allSelected,
				selectedItems
			};
		}

		case SELECT_ALL: {
			const { recurringInvoiceListData } = state;
			const { selected } = action;

			recurringInvoiceListData.recurringInvoices.forEach(recInvoice => {
				recInvoice.selected = selected;
			});

			return {
				...state,
				recurringInvoiceListData,
				allSelected: selected,
				selectedItems: selected ? recurringInvoiceListData.recurringInvoices : []
			};
		}

		case FINISHED_PROCESS_SELECTED: {
			const { selectedItems } = state;
			const { id, success } = action;

			selectedItems.forEach(item => {
				if (item.id === id) {
					item.multiProcessSuccess = success;
				}
			});

			return {
				...state,
				selectedItems
			};
		}

		case FINISHED_PROCESSING_SELECTED_ITEMS: {
			return { ...state, finishedProcessingMultiAction: true };
		}

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const initRecurringInvoiceList = () => {
	return {
		type: INIT_RECURRING_INVOICE_LIST
	};
};

const resetRecurringInvoiceList = () => {
	return {
		type: RESET_RECURRING_INVOICE_LIST
	};
};

const startFetchingRecurringInvoiceList = () => {
	return {
		type: START_FETCHING_RECURRING_INVOICE_LIST
	};
};

const finishedFetchingRecurringInvoiceList = recurringInvoiceListData => {
	return {
		type: FINISHED_FETCHING_RECURRING_INVOICE_LIST,
		recurringInvoiceListData
	};
};

const errorFetchingRecurringInvoiceList = () => {
	return {
		type: ERROR_FETCHING_RECURRING_INVOICE_LIST
	};
};

const paginate = page => {
	return {
		type: PAGINATE_RECURRING_INVOICE_LIST,
		page
	};
};

const sort = clickedColumn => {
	return {
		type: SORT_RECURRING_INVOICE_LIST,
		clickedColumn
	};
};

const filter = filterItem => {
	return {
		type: FILTER_RECURRING_INVOICE_LIST,
		filterItem
	};
};

const search = searchText => {
	return {
		type: SEARCH_RECURRING_INVOICE_LIST,
		searchText
	};
};

const selectItem = (id, selected) => {
	return {
		type: SELECT_ITEM,
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

const finishedProcessingItem = (id, success) => {
	return {
		type: FINISHED_PROCESS_SELECTED,
		id,
		success
	};
};

const finishedProcessingSelectedItems = () => {
	return {
		type: FINISHED_PROCESSING_SELECTED_ITEMS
	};
};

export const fetchRecurringInvoiceList = reset => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetRecurringInvoiceList());
		}

		if (!getState().recurringInvoice.recurringInvoiceList.initialized) {
			dispatch(initRecurringInvoiceList());
		}

		dispatch(startFetchingRecurringInvoiceList());

		const {
			currentPage,
			orderBy,
			sortDirection,
			currentFilter,
			searchText
		} = getState().recurringInvoice.recurringInvoiceList;

		const limit = 20;
		const offset = (currentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		const queryString = `?offset=${offset}&searchText=${searchText}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}&filter=${currentFilter}`;

		invoiz
			.request(`${config.resourceHost}recurringinvoice${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const recurringInvoices = data.map(recurringInvoice => {
					return new RecurringInvoice(recurringInvoice);
				});
				dispatch(finishedFetchingRecurringInvoiceList({ recurringInvoices, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingRecurringInvoiceList());
			});
	};
};

export const paginateRecurringInvoiceList = page => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchRecurringInvoiceList());
	};
};

export const sortRecurringInvoiceList = column => {
	return dispatch => {
		dispatch(sort(column));
		dispatch(fetchRecurringInvoiceList());
	};
};

export const filterRecurringInvoiceList = filterItem => {
	return dispatch => {
		dispatch(filter(filterItem));
		dispatch(fetchRecurringInvoiceList());
	};
};

export const searchRecurringInvoiceList = searchText => {
	return dispatch => {
		dispatch(search(searchText));

		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			dispatch(fetchRecurringInvoiceList());
		}, 500);
	};
};

export const deleteRecurringInvoice = id => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		invoiz
			.request(`${config.resourceHost}recurringinvoice/${id}`, {
				auth: true,
				method: 'DELETE'
			})
			.then(() => {
				invoiz.page.showToast({ message: resources.recurringInvoiceDeleteSuccessMessage });
				dispatch(fetchRecurringInvoiceList());
			});
	};
};

export const selectRecurringInvoice = (id, selected) => {
	return dispatch => {
		dispatch(selectItem(id, selected));
	};
};

export const selectAllRecurringInvoices = selected => {
	return dispatch => {
		dispatch(selectAll(selected));
	};
};

export const deleteSelectedRecurringInvoices = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().recurringInvoice.recurringInvoiceList;

		const requests = selectedItems.map(recInvoice => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}recurringinvoice/${recInvoice.id}`, {
						auth: true,
						method: 'DELETE'
					})
					.then(() => {
						dispatch(finishedProcessingItem(recInvoice.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedProcessingItem(recInvoice.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			dispatch(finishedProcessingSelectedItems());
		});
	};
};
