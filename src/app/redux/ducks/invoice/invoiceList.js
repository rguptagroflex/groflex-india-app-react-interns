import invoiz from 'services/invoiz.service';
import config from 'config';
import Invoice from 'models/invoice.model';
import q from 'q';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';

/*
 * Actions
 */
const INIT_INVOICE_LIST = 'invoiz/invoice/INIT_INVOICE_LIST';
const RESET_INVOICE_LIST = 'invoiz/invoice/RESET_INVOICE_LIST';
const START_FETCHING_INVOICE_LIST = 'invoiz/invoice/START_FETCHING_INVOICE_LIST';
const FINISHED_FETCHING_INVOICE_LIST = 'invoiz/invoice/FINISHED_FETCHING_INVOICE_LIST';
const ERROR_FETCHING_INVOICE_LIST = 'invoiz/invoice/ERROR_FETCHING_INVOICE_LIST';
const SORT_INVOICE_LIST = 'invoiz/invoice/SORT_INVOICE_LIST';
const PAGINATE_INVOICE_LIST = 'invoiz/invoice/PAGINATE_INVOICE_LIST';
const FILTER_INVOICE_LIST = 'invoiz/invoice/FILTER_INVOICE_LIST';
const SEARCH_INVOICE_LIST = 'invoiz/invoice/SEARCH_INVOICE_LIST';
const SELECT_ITEM = 'invoiz/invoice/SELECT_ITEM';
const SELECT_ALL = 'invoiz/invoice/SELECT_ALL';
const FINISHED_PROCESS_SELECTED = 'invoiz/invoice/FINISHED_PROCESS_SELECTED';
const FINISHED_PROCESSING_SELECTED_ITEMS = 'invoiz/invoice/FINISHED_PROCESSING_SELECTED_ITEMS';

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
		{ title: 'Entwurf', count: 0, active: false, key: 'draft', resouceKey: 'draft' },
		{ title: 'Offen', count: 0, active: false, key: 'locked', resouceKey: 'open' },
		{ title: 'Bezahlt', count: 0, active: false, key: 'paid', resouceKey: 'paid' },
		{ title: 'Storniert', count: 0, active: false, key: 'cancelled', resouceKey: 'cancelled' },
		{ title: 'Überfällig', count: 0, active: false, key: 'overdue', resouceKey: 'overdue' }
	],
	orderBy: 'date',
	sortDirection: 'desc',
	currentFilter: 'all',
	searchText: '',
	invoiceListData: {
		invoices: [],
		meta: {}
	}
};

let searchTimer = null;

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_INVOICE_LIST: {
			const isSmallBusiness = invoiz.user.isSmallBusiness;
			const settings = WebStorageService.getItem(WebStorageKey.INVOICE_LIST_SETTINGS);
			const columns = [
				{ key: 'number', title: 'Nr.', width: '180px', resourceKey: 'serialNumber' },
				{ key: 'customerData.name', title: 'Kunde', resourceKey: 'customer' },
				{ key: 'type', title: 'Type', width: '120px', resourceKey: 'type' },
				{ key: 'date', title: 'Datum', width: '120px', sorted: 'desc', resourceKey: 'date' },
				{ key: 'dueToDate', title: 'fällig am', width: '120px', resourceKey: 'dueOn' },
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

		case RESET_INVOICE_LIST: {
			return { ...initialState };
		}

		case START_FETCHING_INVOICE_LIST: {
			return {
				...state,
				isLoading: true
			};
		}

		case FINISHED_FETCHING_INVOICE_LIST: {
			const { invoiceListData } = action;
			const { count, filter } = invoiceListData.meta;
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
			WebStorageService.setItem(WebStorageKey.INVOICE_LIST_SETTINGS, {
				orderBy,
				sortDirection,
				currentFilter
			});

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				invoiceListData,
				allSelected: false,
				selectedItems: [],
				totalPages,
				filterItems: newFilterItems,
				searchText
			};
		}

		case PAGINATE_INVOICE_LIST: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case ERROR_FETCHING_INVOICE_LIST: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		case SORT_INVOICE_LIST: {
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

		case FILTER_INVOICE_LIST: {
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

		case SEARCH_INVOICE_LIST: {
			const { searchText } = action;
			return { ...state, isLoading: searchText.trim().length === 0, searchText };
		}

		case SELECT_ITEM: {
			const { invoiceListData } = state;
			const { id, selected } = action;

			const selectedItems = [];

			invoiceListData.invoices.forEach(invoice => {
				if (invoice.id === id) {
					invoice.selected = selected;
				}

				if (invoice.selected) {
					selectedItems.push(invoice);
				}
			});

			const allSelected = selectedItems.length === invoiceListData.invoices.length;

			return {
				...state,
				invoiceListData,
				allSelected,
				selectedItems
			};
		}

		case SELECT_ALL: {
			const { invoiceListData } = state;
			const { selected } = action;

			invoiceListData.invoices.forEach(invoice => {
				invoice.selected = selected;
			});

			return {
				...state,
				invoiceListData,
				allSelected: selected,
				selectedItems: selected ? invoiceListData.invoices : []
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
const initInvoiceList = () => {
	return {
		type: INIT_INVOICE_LIST
	};
};

const resetInvoiceList = () => {
	return {
		type: RESET_INVOICE_LIST
	};
};

const startFetchingInvoiceList = () => {
	return {
		type: START_FETCHING_INVOICE_LIST
	};
};

const finishedFetchingInvoiceList = invoiceListData => {
	return {
		type: FINISHED_FETCHING_INVOICE_LIST,
		invoiceListData
	};
};

const errorFetchingInvoiceList = () => {
	return {
		type: ERROR_FETCHING_INVOICE_LIST
	};
};

const paginate = page => {
	return {
		type: PAGINATE_INVOICE_LIST,
		page
	};
};

const sort = clickedColumn => {
	return {
		type: SORT_INVOICE_LIST,
		clickedColumn
	};
};

const filter = filterItem => {
	return {
		type: FILTER_INVOICE_LIST,
		filterItem
	};
};

const search = searchText => {
	return {
		type: SEARCH_INVOICE_LIST,
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

export const fetchInvoiceList = reset => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetInvoiceList());
		}

		if (!getState().invoice.invoiceList.initialized) {
			dispatch(initInvoiceList());
		}

		dispatch(startFetchingInvoiceList());

		const { currentPage, orderBy, sortDirection, currentFilter, searchText } = getState().invoice.invoiceList;

		const limit = 20;
		const offset = (currentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		const queryString = `?offset=${offset}&searchText=${searchText}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}&filter=${currentFilter}`;
		invoiz
			.request(`${config.resourceHost}invoice${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const invoices = data.map(invoice => {
					return new Invoice(invoice);
				});
				dispatch(finishedFetchingInvoiceList({ invoices, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingInvoiceList());
			});
	};
};

export const paginateInvoiceList = page => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchInvoiceList());
	};
};

export const sortInvoiceList = column => {
	return dispatch => {
		dispatch(sort(column));
		dispatch(fetchInvoiceList());
	};
};

export const filterInvoiceList = filterItem => {
	return dispatch => {
		dispatch(filter(filterItem));
		dispatch(fetchInvoiceList());
	};
};

export const searchInvoiceList = searchText => {
	return dispatch => {
		dispatch(search(searchText));

		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			dispatch(fetchInvoiceList());
		}, 500);
	};
};

export const deleteInvoice = id => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		invoiz
			.request(`${config.resourceHost}invoice/${id}`, {
				auth: true,
				method: 'DELETE'
			})
			.then(() => {
				invoiz.page.showToast({ message: resources.invoiceDeleteSuccessMessage });
				dispatch(fetchInvoiceList());
			});
	};
};

export const selectInvoice = (id, selected) => {
	return dispatch => {
		dispatch(selectItem(id, selected));
	};
};

export const selectAllInvoices = selected => {
	return dispatch => {
		dispatch(selectAll(selected));
	};
};

export const deleteSelectedInvoices = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().invoice.invoiceList;

		const requests = selectedItems.map(invoice => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}invoice/${invoice.id}`, {
						auth: true,
						method: 'DELETE'
					})
					.then(() => {
						dispatch(finishedProcessingItem(invoice.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedProcessingItem(invoice.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			dispatch(finishedProcessingSelectedItems());
		});
	};
};
