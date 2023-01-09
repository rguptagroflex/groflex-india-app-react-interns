import invoiz from 'services/invoiz.service';
import config from 'config';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import { applyAppEnabledFilterItems } from 'helpers/apps/applyAppEnabledFilterItems';
import CustomerDocumentItem from 'models/customer-document-item.model';

const FETCH_COUNT = 5;

/*
 * Actions
 */

const INIT_CUSTOMER_DOCUMENTS_LIST = 'invoiz/customer/INIT_CUSTOMER_DOCUMENTS_LIST';
const RESET_CUSTOMER_DOCUMENTS_LIST = 'invoiz/customer/RESET_CUSTOMER_DOCUMENTS_LIST';
const START_FETCHING_CUSTOMER_DOCUMENTS_LIST = 'invoiz/customer/START_FETCHING_CUSTOMER_DOCUMENTS_LIST';
const FINISHED_FETCHING_CUSTOMER_DOCUMENTS_LIST = 'invoiz/customer/FINISHED_FETCHING_CUSTOMER_DOCUMENTS_LIST';
const ERROR_FETCHING_CUSTOMER_DOCUMENTS_LIST = 'invoiz/customer/ERROR_FETCHING_CUSTOMER_DOCUMENTS_LIST';
const SORT_CUSTOMER_DOCUMENTS_LIST = 'invoiz/customer/SORT_CUSTOMER_DOCUMENTS_LIST';
const PAGINATE_CUSTOMER_DOCUMENTS_LIST = 'invoiz/customer/PAGINATE_CUSTOMER_DOCUMENTS_LIST';
const FILTER_CUSTOMER_DOCUMENTS_LIST = 'invoiz/customer/FILTER_CUSTOMER_DOCUMENTS_LIST';
const UPDATE_FILTER_ITEMS = 'invoiz/customer/UPDATE_FILTER_ITEMS';

/*
 * Reducer
 */

const initialState = {
	initialized: false,
	isLoading: true,
	errorOccurred: false,
	columns: [
		{ key: 'date', title: 'Datum', width: '130px', resourceKey: 'date' },
		{ key: 'type', title: 'Vorgang', width: '230px', resourceKey: 'operation' },
		{ key: 'number', title: 'Nr.', width: '140px', resourceKey: 'serialNumber' },
		{ key: 'state', title: 'State', width: '140px', resourceKey: 'status' },
		{ key: 'totalGross', title: 'Brutto', width: '140px', align: 'right', resourceKey: 'gross' }
	],
	currentPage: 1,
	totalPages: 1,
	filterItems: [
		{ title: 'Alle', count: 0, active: true, key: 'all', resouceKey: 'all' },
		{ title: 'Rechnungen', count: 0, active: false, key: 'invoice', resouceKey: 'invoice' },
		{ title: 'Angebote', count: 0, active: false, key: 'offer', resouceKey: 'offer' },
		{ title: 'Expenses', count: 0, active: false, key: 'expense', resouceKey: 'expenses' },
		{ title: 'Angebote', count: 0, active: false, key: 'purchaseOrder', resouceKey: 'purchaseOrder' },
		{ title: 'Angebote', count: 0, active: false, key: 'credits', resouceKey: 'credits' }
	],
	orderBy: 'date',
	sortDirection: 'desc',
	currentFilter: 'all',
	customerDocumentListData: {
		customerDocumentItems: [],
		meta: {}
	}
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_CUSTOMER_DOCUMENTS_LIST: {
							const settings = WebStorageService.getItem(WebStorageKey.CUSTOMER_DOCUMENTS_LIST_SETTINGS);
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
									columns: newColumns,
									currentFilter,
									filterItems: newFilterItems
								};
							} else {
								return { ...state, initialized: true };
							}
						
		}

		case RESET_CUSTOMER_DOCUMENTS_LIST: {
			return { ...initialState };
		}

		case UPDATE_FILTER_ITEMS: {
			const { filterItems } = state;
			const { customerType } = action;
			const newFilterItems = filterItems.filter(filterItem => {
				return customerType === `payee` ? filterItem.key !== 'offer' && filterItem.key !== `invoice` && filterItem.key !== `credits` : filterItem.key !== `expense` && filterItem.key !== `purchaseOrder`
			});

			return { ...state, filterItems: newFilterItems};
		}

		case START_FETCHING_CUSTOMER_DOCUMENTS_LIST: {
			return { ...state, isLoading: true };
		}

		case FINISHED_FETCHING_CUSTOMER_DOCUMENTS_LIST: {
			const { customerDocumentListData } = action;
			const { count, filter } = customerDocumentListData.meta;
			const totalPages = Math.ceil(count / FETCH_COUNT);
			const { filterItems } = state;
			let newFilterItems = filterItems.map(filterItem => {
				const filterData = filter[filterItem.key];
				if (filterData) {
					filterItem.count = filterData.count;
				}

				return filterItem;
			});

			//newFilterItems = applyAppEnabledFilterItems(newFilterItems, WebStorageKey.CUSTOMER_DOCUMENTS_LIST_SETTINGS);

			const { orderBy, sortDirection, currentFilter } = state;

			WebStorageService.setItem(WebStorageKey.CUSTOMER_DOCUMENTS_LIST_SETTINGS, {
				orderBy,
				sortDirection,
				currentFilter
			});

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				customerDocumentListData,
				selectedItems: [],
				totalPages,
				filterItems: newFilterItems
			};
		}

		case PAGINATE_CUSTOMER_DOCUMENTS_LIST: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case ERROR_FETCHING_CUSTOMER_DOCUMENTS_LIST: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		case SORT_CUSTOMER_DOCUMENTS_LIST: {
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

		case FILTER_CUSTOMER_DOCUMENTS_LIST: {
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

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const initcustomerDocumentList = () => {
	return {
		type: INIT_CUSTOMER_DOCUMENTS_LIST
	};
};

const resetCustomerDocumentList = () => {
	return {
		type: RESET_CUSTOMER_DOCUMENTS_LIST
	};
};

const startFetchingCustomerDocumentList = () => {
	return {
		type: START_FETCHING_CUSTOMER_DOCUMENTS_LIST
	};
};

const finishedFetchingCustomerDocumentList = customerDocumentListData => {
	return {
		type: FINISHED_FETCHING_CUSTOMER_DOCUMENTS_LIST,
		customerDocumentListData
	};
};

const errorFetchingCustomerDocumentList = () => {
	return {
		type: ERROR_FETCHING_CUSTOMER_DOCUMENTS_LIST
	};
};

const paginate = page => {
	return {
		type: PAGINATE_CUSTOMER_DOCUMENTS_LIST,
		page
	};
};

const sort = clickedColumn => {
	return {
		type: SORT_CUSTOMER_DOCUMENTS_LIST,
		clickedColumn
	};
};

const filter = filterItem => {
	return {
		type: FILTER_CUSTOMER_DOCUMENTS_LIST,
		filterItem
	};
};

const updateFilterItemsAction = (customerType) => {
	return {
		type: UPDATE_FILTER_ITEMS,
		customerType
	};
};

export const fetchCustomerDocumentList = (customerId, reset, customerType) => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetCustomerDocumentList());
		}

		if (!getState().customer.customerDocumentList.initialized) {
			dispatch(initcustomerDocumentList(customerType));
		}

		dispatch(startFetchingCustomerDocumentList());

		const { currentPage, orderBy, sortDirection, currentFilter } = getState().customer.customerDocumentList;
		const limit = FETCH_COUNT;
		const offset = (currentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		const baseUrl = `${config.resourceHost}customer/${customerId}/history`;
		const queryString = `?offset=${offset}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}&filter=${currentFilter}`;

		invoiz
			.request(`${baseUrl}${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const customerDocumentItems = data.map(customerDocumentItem => {
					return new CustomerDocumentItem(customerDocumentItem);
				});
				dispatch(finishedFetchingCustomerDocumentList({ customerDocumentItems, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingCustomerDocumentList());
			});
	};
};

export const paginateCustomerDocumentList = (customerId, page) => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchCustomerDocumentList(customerId));
	};
};

export const sortCustomerDocumentList = (customerId, column) => {
	return dispatch => {
		dispatch(sort(column));
		dispatch(fetchCustomerDocumentList(customerId));
	};
};

export const filterCustomerDocumentList = (customerId, filterItem) => {
	return dispatch => {
		dispatch(filter(filterItem));
		dispatch(fetchCustomerDocumentList(customerId));
	};
};

export const updateFilterItems = (customerType) => {
	return dispatch => {
		dispatch(updateFilterItemsAction(customerType));
	};
};
