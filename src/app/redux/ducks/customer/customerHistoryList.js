// import invoiz from 'services/invoiz.service';
// import config from 'config';
// import WebStorageService from 'services/webstorage.service';
// import WebStorageKey from 'enums/web-storage-key.enum';
// import CustomerHistoryItem from 'models/customer-history-item.model';

// const FETCH_COUNT = 5;

// /*
//  * Actions
//  */
// const INIT_CUSTOMER_HISTORY_LIST = 'invoiz/customer/INIT_CUSTOMER_HISTORY_LIST';
// const RESET_CUSTOMER_HISTORY_LIST = 'invoiz/customer/RESET_CUSTOMER_HISTORY_LIST';
// const START_FETCHING_CUSTOMER_HISTORY_LIST = 'invoiz/customer/START_FETCHING_CUSTOMER_HISTORY_LIST';
// const FINISHED_FETCHING_CUSTOMER_HISTORY_LIST = 'invoiz/customer/FINISHED_FETCHING_CUSTOMER_HISTORY_LIST';
// const ERROR_FETCHING_CUSTOMER_HISTORY_LIST = 'invoiz/customer/ERROR_FETCHING_CUSTOMER_HISTORY_LIST';
// const SORT_CUSTOMER_HISTORY_LIST = 'invoiz/customer/SORT_CUSTOMER_HISTORY_LIST';
// const PAGINATE_CUSTOMER_HISTORY_LIST = 'invoiz/customer/PAGINATE_CUSTOMER_HISTORY_LIST';
// const FILTER_CUSTOMER_HISTORY_LIST = 'invoiz/customer/FILTER_CUSTOMER_HISTORY_LIST';

// /*
//  * Reducer
//  */
// const initialState = {
// 	initialized: false,
// 	isLoading: true,
// 	errorOccurred: false,
// 	columns: [
// 		{ key: 'date', title: 'Datum', width: '130px', resourceKey: 'date' },
// 		{ key: 'type', title: 'Vorgang', width: '230px', resourceKey: 'operation' },
// 		{ key: 'number', title: 'Nr.', resourceKey: 'serialNumber' },
// 		{ key: 'totalGross', title: 'Brutto', width: '140px', align: 'right', resourceKey: 'gross' }
// 	],
// 	currentPage: 1,
// 	totalPages: 1,
// 	filterItems: [
// 		{ title: 'Alle', count: 0, active: true, key: 'all', resouceKey: 'all' },
// 		{ title: 'Rechnungen', count: 0, active: false, key: 'invoice', resouceKey: 'invoice' },
// 		{ title: 'Angebote', count: 0, active: false, key: 'offer', resouceKey: 'offer' },
// 		{ title: 'Expenses', count: 0, active: false, key: 'expense', resouceKey: 'expenses' },
// 		{ title: 'Angebote', count: 0, active: false, key: 'purchaseOrder', resouceKey: 'purchaseOrder' }
// 	],
// 	orderBy: 'date',
// 	sortDirection: 'desc',
// 	currentFilter: 'all',
// 	customerHistoryListData: {
// 		customerHistoryItems: [],
// 		meta: {}
// 	}
// };

// export default function reducer(state = initialState, action) {
// 	switch (action.type) {
// 		case INIT_CUSTOMER_HISTORY_LIST: {
// 			const settings = WebStorageService.getItem(WebStorageKey.CUSTOMER_HISTORY_LIST_SETTINGS);

// 			if (settings) {
// 				const { filterItems, columns } = state;
// 				const { orderBy, sortDirection, currentFilter } = settings;

// 				const newFilterItems = filterItems.map(filterItem => {
// 					filterItem.active = currentFilter === filterItem.key;
// 					return filterItem;
// 				});

// 				const newColumns = columns.map(column => {
// 					if (column.key === orderBy) {
// 						column.sorted = sortDirection;
// 					} else {
// 						delete column.sorted;
// 					}
// 					return column;
// 				});

// 				return {
// 					...state,
// 					initialized: true,
// 					orderBy,
// 					sortDirection,
// 					columns: newColumns,
// 					currentFilter,
// 					filterItems: newFilterItems
// 				};
// 			} else {
// 				return { ...state, initialized: true };
// 			}
// 		}

// 		case RESET_CUSTOMER_HISTORY_LIST: {
// 			return { ...initialState };
// 		}

// 		case START_FETCHING_CUSTOMER_HISTORY_LIST: {
// 			return { ...state, isLoading: true };
// 		}

// 		case FINISHED_FETCHING_CUSTOMER_HISTORY_LIST: {
// 			const { customerHistoryListData } = action;
// 			const { count, filter } = customerHistoryListData.meta;
// 			const totalPages = Math.ceil(count / FETCH_COUNT);
// 			const { filterItems } = state;

// 			const newFilterItems = filterItems.map(filterItem => {
// 				const filterData = filter[filterItem.key];
// 				if (filterData) {
// 					filterItem.count = filterData.count;
// 				}
// 				return filterItem;
// 			});

// 			const { orderBy, sortDirection, currentFilter } = state;

// 			WebStorageService.setItem(WebStorageKey.CUSTOMER_HISTORY_LIST_SETTINGS, {
// 				orderBy,
// 				sortDirection,
// 				currentFilter
// 			});

// 			return {
// 				...state,
// 				isLoading: false,
// 				errorOccurred: false,
// 				customerHistoryListData,
// 				selectedItems: [],
// 				totalPages,
// 				filterItems: newFilterItems
// 			};
// 		}

// 		case PAGINATE_CUSTOMER_HISTORY_LIST: {
// 			const { page } = action;
// 			return { ...state, currentPage: page };
// 		}

// 		case ERROR_FETCHING_CUSTOMER_HISTORY_LIST: {
// 			return { ...state, isLoading: false, errorOccurred: true };
// 		}

// 		case SORT_CUSTOMER_HISTORY_LIST: {
// 			const { clickedColumn } = action;
// 			const { columns } = state;
// 			let orderBy, sortDirection;

// 			const newColumns = columns.map(column => {
// 				if (column.key === clickedColumn.key) {
// 					column.sorted = column.sorted === 'desc' ? 'asc' : 'desc';
// 					orderBy = column.key;
// 					sortDirection = column.sorted;
// 				} else {
// 					delete column.sorted;
// 				}

// 				return column;
// 			});

// 			return { ...state, orderBy, sortDirection, columns: newColumns };
// 		}

// 		case FILTER_CUSTOMER_HISTORY_LIST: {
// 			const { filterItem } = action;
// 			const { filterItems } = state;
// 			let currentFilter;

// 			const newFilterItems = filterItems.map(filter => {
// 				filter.active = filter.key === filterItem.key;
// 				if (filter.active) {
// 					currentFilter = filter.key;
// 				}
// 				return filter;
// 			});

// 			return { ...state, currentFilter, filterItems: newFilterItems, currentPage: 1 };
// 		}

// 		default:
// 			return state;
// 	}
// }

// /*
//  * Action Creators
//  */
// const initCustomerHistoryList = () => {
// 	return {
// 		type: INIT_CUSTOMER_HISTORY_LIST
// 	};
// };

// const resetCustomerHistoryList = () => {
// 	return {
// 		type: RESET_CUSTOMER_HISTORY_LIST
// 	};
// };

// const startFetchingCustomerHistoryList = () => {
// 	return {
// 		type: START_FETCHING_CUSTOMER_HISTORY_LIST
// 	};
// };

// const finishedFetchingCustomerHistoryList = customerHistoryListData => {
// 	return {
// 		type: FINISHED_FETCHING_CUSTOMER_HISTORY_LIST,
// 		customerHistoryListData
// 	};
// };

// const errorFetchingCustomerHistoryList = () => {
// 	return {
// 		type: ERROR_FETCHING_CUSTOMER_HISTORY_LIST
// 	};
// };

// const paginate = page => {
// 	return {
// 		type: PAGINATE_CUSTOMER_HISTORY_LIST,
// 		page
// 	};
// };

// const sort = clickedColumn => {
// 	return {
// 		type: SORT_CUSTOMER_HISTORY_LIST,
// 		clickedColumn
// 	};
// };

// const filter = filterItem => {
// 	return {
// 		type: FILTER_CUSTOMER_HISTORY_LIST,
// 		filterItem
// 	};
// };

// export const fetchCustomerHistoryList = (customerId, reset) => {
// 	return (dispatch, getState) => {
// 		if (reset) {
// 			dispatch(resetCustomerHistoryList());
// 		}

// 		if (!getState().customer.customerHistoryList.initialized) {
// 			dispatch(initCustomerHistoryList());
// 		}

// 		dispatch(startFetchingCustomerHistoryList());

// 		const { currentPage, orderBy, sortDirection, currentFilter } = getState().customer.customerHistoryList;

// 		const limit = FETCH_COUNT;
// 		const offset = (currentPage - 1) * limit;
// 		const isDesc = sortDirection === 'desc';
// 		const queryString = `?offset=${offset}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}&filter=${currentFilter}`;

// 		invoiz
// 			.request(`${config.resourceHost}customer/${customerId}/history${queryString}`, {
// 				auth: true
// 			})
// 			.then(({ body: { data, meta } }) => {
// 				const customerHistoryItems = data.map(customerHistoryItem => {
// 					return new CustomerHistoryItem(customerHistoryItem);
// 				});

// 				dispatch(finishedFetchingCustomerHistoryList({ customerHistoryItems, meta }));
// 			})
// 			.catch(() => {
// 				dispatch(errorFetchingCustomerHistoryList());
// 			});
// 	};
// };

// export const paginateCustomerHistoryList = (customerId, page) => {
// 	return dispatch => {
// 		dispatch(paginate(page));
// 		dispatch(fetchCustomerHistoryList(customerId));
// 	};
// };

// export const sortCustomerHistoryList = (customerId, column) => {
// 	return dispatch => {
// 		dispatch(sort(column));
// 		dispatch(fetchCustomerHistoryList(customerId));
// 	};
// };

// export const filterCustomerHistoryList = (customerId, filterItem) => {
// 	return dispatch => {
// 		dispatch(filter(filterItem));
// 		dispatch(fetchCustomerHistoryList(customerId));
// 	};
// };
import invoiz from 'services/invoiz.service';
import config from 'config';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import HistoryItem from 'models/history-item.model';
import CustomerEmailItem from 'models/customer-email-item.model';
import { applyAppEnabledFilterItems } from 'helpers/apps/applyAppEnabledFilterItems';
import lang from 'lang';
//import Todo from 'models/todo.model';

const FETCH_COUNT = 20;

/*
 * Actions
 */
const INIT_CUSTOMER_HISTORY_LIST = 'invoiz/customer/INIT_CUSTOMER_HISTORY_LIST';
const RESET_CUSTOMER_HISTORY_LIST = 'invoiz/customer/RESET_CUSTOMER_HISTORY_LIST';
const START_FETCHING_CUSTOMER_HISTORY_LIST = 'invoiz/customer/START_FETCHING_CUSTOMER_HISTORY_LIST';
const FINISHED_FETCHING_CUSTOMER_HISTORY_LIST = 'invoiz/customer/FINISHED_FETCHING_CUSTOMER_HISTORY_LIST';
const ERROR_FETCHING_CUSTOMER_HISTORY_LIST = 'invoiz/customer/ERROR_FETCHING_CUSTOMER_HISTORY_LIST';
const PAGINATE_CUSTOMER_HISTORY_LIST = 'invoiz/customer/PAGINATE_CUSTOMER_HISTORY_LIST';
const FILTER_CUSTOMER_HISTORY_LIST = 'invoiz/customer/FILTER_CUSTOMER_HISTORY_LIST';
const UPDATE_HISTORY_FILTER_ITEMS = 'invoiz/customer/UPDATE_HISTORY_FILTER_ITEMS';
const LOAD_MORE = 'invoiz/customer/LOAD_MORE';

/*
 * Reducer
 */
const initialState = {
	isLoading: true,
	isLoadingMore: false,
	errorOccurred: false,
	initialized: false,
	columns: [],
	count: 0,
	currentPage: 1,
	totalPages: 1,
	remaining: 0,
	offset: 0,
	firstLoadDone: false,
	filterItems: [
		{ title: 'All', count: 0, active: true, key: 'all' },
		{ title: 'Communications', count: 0, active: false, key: 'communication' },
		{ title: 'Actions', count: 0, active: false, key: 'document' },
	],
	currentFilter: 'all',
	customerHistoryListData: {
		customerHistoryItems: [],
		meta: {},
		// customerTodoItems: [],
		// customerTodoMeta: {},
		// customerEmailItems: [],
	},
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_CUSTOMER_HISTORY_LIST: {
			const settings = WebStorageService.getItem(WebStorageKey.CUSTOMER_HISTORY_LIST_SETTINGS);
			if (settings) {
				const { filterItems } = state;
				let { currentFilter } = settings;

				const newFilterItems = filterItems.map((filterItem) => {
					filterItem.active = currentFilter === filterItem.key;
					// if (filterItem.active && filterItem.count === 0 && !settings.forceCurrentFilter) {
					// 	filterItem.active = false;
					// 	filterItems[0].active = true;
					// 	currentFilter = 'all';
					// }

					return filterItem;
				});

				return {
					...state,
					initialized: true,
					currentFilter,
					filterItems: newFilterItems,
				};
			} else {
				return { ...state, initialized: true };
			}
		}

		case RESET_CUSTOMER_HISTORY_LIST: {
			return { ...initialState };
		}

		case UPDATE_HISTORY_FILTER_ITEMS: {
			const { filterItems } = state;

			const newFilterItems = applyAppEnabledFilterItems(
				filterItems,
				WebStorageKey.CUSTOMER_HISTORY_LIST_SETTINGS
			);

			return { ...state, filterItems: newFilterItems };
		}

		case START_FETCHING_CUSTOMER_HISTORY_LIST: {
			return { ...state, isLoading: true };
		}

		case FINISHED_FETCHING_CUSTOMER_HISTORY_LIST: {
			const { customerHistoryListData } = action;
			let { firstLoadDone, remaining } = state;
			const { filter } = customerHistoryListData.meta;
			let { count } = customerHistoryListData.meta;
		//	const countCustomerTodo = customerHistoryListData.customerTodoMeta.count || 0;
			if (firstLoadDone) {
				remaining -= FETCH_COUNT;
			} else {
				remaining = count - FETCH_COUNT;
			}

			//count += countCustomerTodo;

			const totalPages = Math.ceil(count / FETCH_COUNT);
			const { filterItems, currentFilter, isLoadingMore } = state;

			const newCustomerHistoryListData = customerHistoryListData;

			if (isLoadingMore) {
				const prevCustomerHistoryItems = state.customerHistoryListData.customerHistoryItems;
				newCustomerHistoryListData.customerHistoryItems = prevCustomerHistoryItems.concat(
					customerHistoryListData.customerHistoryItems
				);
			}

			let newFilterItems = filterItems.map((filterItem) => {
				const filterData = filter[filterItem.key];
				if (filterData) {
					// if (filterItem.key === 'all' || filterItem.key === 'todo') {
					// 	filterItem.count = filterData.count + countCustomerTodo;
					// } else {
					// 	filterItem.count = filterData.count;
					// }
					// if (filterItem.resouceKey === 'all') {
					// 	filterItem.count = filterData.count;
					// } else {
					// 	filterItem.count = filterData.count;
					// }
					filterItem.count = filterData.count;
				}
				return filterItem;
			});
			//newFilterItems = applyAppEnabledFilterItems(newFilterItems, WebStorageKey.CUSTOMER_HISTORY_LIST_SETTINGS);

			WebStorageService.setItem(WebStorageKey.CUSTOMER_HISTORY_LIST_SETTINGS, {
				currentFilter,
			});

				firstLoadDone = true;
			return {
				...state,
				isLoading: false,
				isLoadingMore: false,
				errorOccurred: false,
				customerHistoryListData: newCustomerHistoryListData,
				selectedItems: [],
				totalPages,
				count,
				filterItems: newFilterItems,
				firstLoadDone,
				remaining,
			};
		}

		case PAGINATE_CUSTOMER_HISTORY_LIST: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case ERROR_FETCHING_CUSTOMER_HISTORY_LIST: {
			return { ...state, isLoading: false, isLoadingMore: false, errorOccurred: true };
		}

		case FILTER_CUSTOMER_HISTORY_LIST: {
			const { filterItem } = action;
			const { filterItems } = state;
			const firstLoadDone = false;
			let currentFilter;
			const newFilterItems = filterItems.map((filter) => {
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
				currentPage: 1,
			//	currentPageTodo: 1,
				firstLoadDone,
			};
		}

		case LOAD_MORE: {
			let { offset, currentPage } = state;
			const { remaining } = state;
			if (remaining > 0) {
				offset += FETCH_COUNT;
				currentPage++;
			}
			return { ...state, offset, currentPage, remaining, isLoadingMore: true };
		}

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const initCustomerHistoryList = () => {
	return {
		type: INIT_CUSTOMER_HISTORY_LIST,
	};
};

const resetCustomerHistoryList = () => {
	return {
		type: RESET_CUSTOMER_HISTORY_LIST,
	};
};

const startFetchingCustomerHistoryList = () => {
	return {
		type: START_FETCHING_CUSTOMER_HISTORY_LIST,
	};
};

const finishedFetchingCustomerHistoryList = (customerHistoryListData) => {
	return {
		type: FINISHED_FETCHING_CUSTOMER_HISTORY_LIST,
		customerHistoryListData,
	};
};

const errorFetchingCustomerHistoryList = () => {
	return {
		type: ERROR_FETCHING_CUSTOMER_HISTORY_LIST,
	};
};

const paginate = (page) => {
	return {
		type: PAGINATE_CUSTOMER_HISTORY_LIST,
		page,
	};
};

const loadMoreHistoryEntries = () => {
	return {
		type: LOAD_MORE,
	};
};

const filter = (filterItem, customerId) => {
	return {
		type: FILTER_CUSTOMER_HISTORY_LIST,
		filterItem,
		customerId,
	};
};

const updateFilterItemsAction = () => {
	return {
		type: UPDATE_HISTORY_FILTER_ITEMS,
	};
};

export const fetchCustomerHistoryList = (customerId, reset) => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetCustomerHistoryList());
		}

		if (!getState().customer.customerHistoryList.initialized) {
			dispatch(initCustomerHistoryList());
		}

		dispatch(startFetchingCustomerHistoryList());
		let { currentFilter } = getState().customer.customerHistoryList;
		const {
			currentPage,
			firstLoadDone,
			//customerHistoryListData: { customerTodoMeta, customerTodoItems },
		} = getState().customer.customerHistoryList;

		if (!currentFilter) {
			currentFilter = 'all';
		}
		const limit = FETCH_COUNT;
		const offsetHistory = (currentPage - 1) * limit;
		const baseUrl = `${config.resourceHost}history`;
		const queryStringHistory = `?customerId=${customerId}&offset=${offsetHistory}&limit=${limit}&filter=${currentFilter}`;
	//	const queryStringTodo = `todo?customerId=${customerId}&filter=all`;
		const queryStringEmail = `email/customer/${customerId}`;
		if (firstLoadDone) {
			invoiz
				.request(`${baseUrl}${queryStringHistory}`, {
					auth: true,
				})
				.then(({ body: { data, meta } }) => {
					const customerHistoryItems = data.map((customerHistoryItem) => {
						return new HistoryItem(customerHistoryItem);
					});
					dispatch(
						finishedFetchingCustomerHistoryList({
							customerHistoryItems,
							meta,
							//customerTodoItems,
							customerTodoMeta,
						})
					);
				})
				.catch(() => {
					dispatch(errorFetchingCustomerHistoryList());
				});
		} else {
			Promise.all([
				invoiz.request(`${baseUrl}${queryStringHistory}`, {
					auth: true,
				}),
				// invoiz.request(`${config.resourceHost}${queryStringTodo}`, {
				// 	auth: true,
				// }),
				// invoiz.request(`${config.resourceHost}${queryStringEmail}`, {
				// 	auth: true,
				// }),
			])
				.then(([historyResponse, emailResponse]) => {
					const customerHistoryData = historyResponse.body.data;
					const meta = historyResponse.body.meta;
					// const customerTodoMeta = todoResponse.body.meta;
					// const customerTodoData = todoResponse.body.data;
				//	const customerEmailData = emailResponse.body.data;

					// customerEmailData.forEach((emailItem) => {
					// 	customerHistoryData.forEach((historyItem) => {
					// 		if (emailItem.id === historyItem.emailId) {
					// 			historyItem.emailType = emailItem.emailType;
					// 			historyItem.date = emailItem.date;
					// 		}
					// 	});
					// });

					// let customerTodoItems = [];

					// if (currentFilter === 'all' || currentFilter === 'todo') {
					// 	customerTodoItems = customerTodoData.map((customerTodoItem) => {
					// 		return new Todo(customerTodoItem);
					// 	});
					// }
					const customerHistoryItems = customerHistoryData.map((customerHistoryItem) => {
						return new HistoryItem(customerHistoryItem);
					});
					// const customerEmailItems = customerEmailData.map((customerEmailItem) => {
					// 	return new CustomerEmailItem(customerEmailItem);
					// });

					dispatch(
						finishedFetchingCustomerHistoryList({
							customerHistoryItems,
							meta,
						//	customerTodoItems,
							//customerTodoMeta,
							//customerEmailItems,
						})
					);
				})
				.catch(() => {
					dispatch(errorFetchingCustomerHistoryList());
				});
		}
	};
};

export const paginateCustomerHistoryList = (customerId, page) => {
	return (dispatch) => {
		dispatch(paginate(page));
		dispatch(fetchCustomerHistoryList(customerId));
	};
};

export const filterCustomerHistoryList = (filterItem, customerId) => {
	return (dispatch) => {
		dispatch(filter(filterItem));
		dispatch(fetchCustomerHistoryList(customerId));
	};
};

export const updateHistoryFilterItems = () => {
	return (dispatch) => {
		dispatch(updateFilterItemsAction());
	};
};

// export const deleteTodo = (id, customerId) => {
// 	return (dispatch) => {
// 		invoiz
// 			.request(`${config.resourceHost}todo/${id}`, {
// 				auth: true,
// 				method: 'DELETE',
// 			})
// 			.then(() => {
// 				invoiz.page.showToast({ message: lang.todoDeleteSuccessMessage });
// 				dispatch(fetchCustomerHistoryList(customerId, true));
// 			});
// 	};
// };

export const deleteNote = (id, customerId) => {
	return (dispatch) => {
		invoiz
			.request(`${config.resourceHost}history/${id}`, {
				auth: true,
				method: 'DELETE',
			})
			.then(() => {
				invoiz.page.showToast({ message: lang.activityDeleteSuccessMessage });
				dispatch(fetchCustomerHistoryList(customerId, true));
			})
			.catch(() => {
				dispatch(errorFetchingCustomerHistoryList());
			});
	};
};

export const deleteEmail = (id, customerId) => {
	return (dispatch) => {
		invoiz
			.request(`${config.resourceHost}email/${id}`, {
				auth: true,
				method: 'DELETE',
			})
			.then(() => {
				invoiz.page.showToast({ message: lang.activityDeleteSuccessMessage });
				dispatch(fetchCustomerHistoryList(customerId, true));
			})
			.catch(() => {
				dispatch(errorFetchingCustomerHistoryList());
			});
	};
};

// export const changeToDone = (id, customerId) => {
// 	return (dispatch) => {
// 		invoiz
// 			.request(`${config.resourceHost}todo/${id}/doneAt`, {
// 				auth: true,
// 				method: 'PUT',
// 			})
// 			.then(() => {
// 				invoiz.page.showToast({ message: lang.todoDoneSuccessMessage });
// 				dispatch(fetchCustomerHistoryList(customerId, true));
// 			})
// 			.catch(() => {
// 				dispatch(errorFetchingCustomerHistoryList());
// 			});
// 	};
// };

export const newDueDate = (id, date, customerId) => {
	return (dispatch) => {
		invoiz
			.request(`${config.resourceHost}todo/${id}/date`, {
				auth: true,
				method: 'PUT',
				data: {
					date,
				},
			})
			.then(() => {
				invoiz.page.showToast({ message: lang.todoNewDueDateSuccessMessage });
				dispatch(fetchCustomerHistoryList(customerId, true));
			})
			.catch(() => {});
	};
};

export const loadMore = (customerId) => {
	return (dispatch) => {
		dispatch(loadMoreHistoryEntries());
		dispatch(fetchCustomerHistoryList(customerId));
	};
};
