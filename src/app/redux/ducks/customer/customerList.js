import invoiz from 'services/invoiz.service';
import config from 'config';
import q from 'q';
import Customer from 'models/customer.model';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';

/*
 * Actions
 */
const INIT_CUSTOMER_LIST = 'invoiz/customer/INIT_CUSTOMER_LIST';
const RESET_CUSTOMER_LIST = 'invoiz/customer/RESET_CUSTOMER_LIST';
const START_FETCHING_CUSTOMER_LIST = 'invoiz/customer/START_FETCHING_CUSTOMER_LIST';
const FINISHED_FETCHING_CUSTOMER_LIST = 'invoiz/customer/FINISHED_FETCHING_CUSTOMER_LIST';
const ERROR_FETCHING_CUSTOMER_LIST = 'invoiz/customer/ERROR_FETCHING_CUSTOMER_LIST';
const SORT_CUSTOMER_LIST = 'invoiz/customer/SORT_CUSTOMER_LIST';
const PAGINATE_CUSTOMER_LIST = 'invoiz/customer/PAGINATE_CUSTOMER_LIST';
const SEARCH_CUSTOMER_LIST = 'invoiz/customer/SEARCH_CUSTOMER_LIST';
const SELECT_ITEM = 'invoiz/customer/SELECT_ITEM';
const SELECT_ALL = 'invoiz/customer/SELECT_ALL';
const FINISHED_DELETE_SELECTED = 'invoiz/customer/FINISHED_DELETE_SELECTED';
const FINISHED_DELETING_SELECTED_ITEMS = 'invoiz/customer/FINISHED_DELETING_SELECTED_ITEMS';

/*
 * Reducer
 */
const initialState = {
	initialized: false,
	isLoading: true,
	allSelected: false,
	selectedItems: [],
	finishedDeletingItems: false,
	multipleDeleteError: null,
	errorOccurred: false,
	columns: [
		{ key: 'number', title: 'Nr.', minWidth: '70px', resourceKey: 'serialNumber' }, // minWidth: '120px'
		{ key: 'name', title: 'Name', sorted: 'asc', resourceKey: 'name' },
		{ key: 'address.street', title: 'Address', width: '280px', resourceKey: 'address', ellipsis: { maxLine: 2, ellipsis: '...', basedOn: 'letters' } },
		// { key: 'address.zipCode', title: 'PLZ', width: '120px', resourceKey: 'postcode' }, // width: '80px'
		// { key: 'address.city', title: 'Ort', width: '200px', resourceKey: 'place' },
		{ key: 'type', title: 'Category', width: '120px', resourceKey: 'category' },
		{ key: 'tell', title: 'Telefon', width: '140px', resourceKey: 'phone' },
		{ key: 'dropdown', title: '', width: '50px', notSortable: true, notClickable: true, resourceKey: '' }
	],
	currentPage: 1,
	totalPages: 1,
	orderBy: 'name',
	sortDirection: 'asc',
	searchText: '',
	customerListData: {
		customers: [],
		meta: {}
	}
};

let searchTimer = null;

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_CUSTOMER_LIST: {
			const settings = WebStorageService.getItem(WebStorageKey.CUSTOMER_LIST_SETTINGS);

			if (settings) {
				const { columns } = state;
				const { orderBy, sortDirection } = settings;
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
					searchText: ''
				};
			} else {
				return { ...state, initialized: true };
			}
		}

		case RESET_CUSTOMER_LIST: {
			return { ...initialState };
		}

		case START_FETCHING_CUSTOMER_LIST: {
			return { ...state, isLoading: true };
		}

		case FINISHED_FETCHING_CUSTOMER_LIST: {
			const { customerListData } = action;
			const { count } = customerListData.meta;
			const totalPages = Math.ceil(count / 20);
			const { searchText } = state;

			const { orderBy, sortDirection } = state;
			WebStorageService.setItem(WebStorageKey.CUSTOMER_LIST_SETTINGS, {
				orderBy,
				sortDirection
			});

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				customerListData,
				allSelected: false,
				selectedItems: [],
				totalPages,
				searchText
			};
		}

		case PAGINATE_CUSTOMER_LIST: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case SEARCH_CUSTOMER_LIST: {
			const { searchText } = action;
			return { ...state, isLoading: searchText.trim().length === 0, searchText };
		}

		case ERROR_FETCHING_CUSTOMER_LIST: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		case SORT_CUSTOMER_LIST: {
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

		case SELECT_ITEM: {
			const { customerListData } = state;
			const { id, selected } = action;

			const selectedItems = [];

			customerListData.customers.forEach(customer => {
				if (customer.id === id) {
					customer.selected = selected;
				}

				if (customer.selected) {
					selectedItems.push(customer);
				}
			});

			const allSelected = selectedItems.length === customerListData.customers.length;

			return {
				...state,
				customerListData,
				allSelected,
				selectedItems
			};
		}

		case SELECT_ALL: {
			const { customerListData } = state;
			const { selected } = action;

			customerListData.customers.forEach(customer => {
				customer.selected = selected;
			});

			return {
				...state,
				customerListData,
				allSelected: selected,
				selectedItems: selected ? customerListData.customers : []
			};
		}

		case FINISHED_DELETE_SELECTED: {
			const { selectedItems } = state;
			const { id, success } = action;

			selectedItems.forEach(item => {
				if (item.id === id) {
					item.deleteSuccess = success;
				}
			});

			return {
				...state,
				selectedItems
			};
		}

		case FINISHED_DELETING_SELECTED_ITEMS: {
			const { err } = action;
			return { ...state, finishedDeletingItems: true, multipleDeleteError: err };
		}

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const initCustomerList = () => {
	return {
		type: INIT_CUSTOMER_LIST
	};
};

const resetCustomerList = () => {
	return {
		type: RESET_CUSTOMER_LIST
	};
};

const startFetchingCustomerList = () => {
	return {
		type: START_FETCHING_CUSTOMER_LIST
	};
};

const finishedFetchingCustomerList = customerListData => {
	return {
		type: FINISHED_FETCHING_CUSTOMER_LIST,
		customerListData
	};
};

const errorFetchingCustomerList = () => {
	return {
		type: ERROR_FETCHING_CUSTOMER_LIST
	};
};

const paginate = page => {
	return {
		type: PAGINATE_CUSTOMER_LIST,
		page
	};
};

const sort = clickedColumn => {
	return {
		type: SORT_CUSTOMER_LIST,
		clickedColumn
	};
};

const search = searchText => {
	return {
		type: SEARCH_CUSTOMER_LIST,
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

const finishedDeletingItem = (id, success) => {
	return {
		type: FINISHED_DELETE_SELECTED,
		id,
		success
	};
};

const finishedDeletingSelectedItems = err => {
	return {
		type: FINISHED_DELETING_SELECTED_ITEMS,
		err
	};
};

export const fetchCustomerList = reset => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetCustomerList());
		}

		if (!getState().customer.customerList.initialized) {
			dispatch(initCustomerList());
		}

		dispatch(startFetchingCustomerList());

		const { currentPage, orderBy, sortDirection, searchText } = getState().customer.customerList;

		const limit = 20;
		const offset = (currentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		const queryString = `?offset=${offset}&searchText=${searchText}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}`;

		invoiz
			.request(`${config.resourceHost}customer${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const customers = data.map(customer => {
					return new Customer(customer);
				});
				dispatch(finishedFetchingCustomerList({ customers, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingCustomerList());
			});
	};
};

export const paginateCustomerList = page => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchCustomerList());
	};
};

export const sortCustomerList = column => {
	return dispatch => {
		dispatch(sort(column));
		dispatch(fetchCustomerList());
	};
};

export const searchCustomerList = searchText => {
	return dispatch => {
		dispatch(search(searchText));

		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			dispatch(fetchCustomerList());
		}, 500);
	};
};

export const deleteCustomer = id => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		invoiz
			.request(`${config.resourceHost}customer/${id}`, {
				auth: true,
				method: 'DELETE'
			})
			.then(() => {
				invoiz.page.showToast({ message: resources.customerDeleteSuccessMessage });
				dispatch(fetchCustomerList());
			})
			.catch(res => {
				const { body } = res;
				const errorMessage =
					body.meta.id && body.meta.id[0].code === 'NOT_ALLOWED'
						? resources.customerDeleteNotAllowedMessage
						: resources.defaultErrorMessage;
				invoiz.page.showToast({ type: 'error', message: errorMessage });
			});
	};
};

export const selectCustomer = (id, selected) => {
	return dispatch => {
		dispatch(selectItem(id, selected));
	};
};

export const selectAllCustomers = selected => {
	return dispatch => {
		dispatch(selectAll(selected));
	};
};

export const deleteSelectedCustomers = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().customer.customerList;
		const resources = getState().language.lang.resources;
		const requests = selectedItems.map(customer => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}customer/${customer.id}`, {
						auth: true,
						method: 'DELETE'
					})
					.then(() => {
						dispatch(finishedDeletingItem(customer.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedDeletingItem(customer.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			const errors = res.filter(r => r.state === 'rejected');
			let errorMessage = null;
			if (errors && errors.length > 0) {
				const { body } = errors[0].reason;
				errorMessage =
					body.meta.id && body.meta.id[0].code === 'NOT_ALLOWED'
						? resources.customersDeleteNotAllowedMessage
						: resources.defaultErrorMessage;
			}
			dispatch(finishedDeletingSelectedItems(errorMessage));
		});
	};
};
