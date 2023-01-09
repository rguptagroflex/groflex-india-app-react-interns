import invoiz from 'services/invoiz.service';
import config from 'config';
// import Offer from 'models/offer.model';
import PurchaseOrder from 'models/purchase-order.model';
import q from 'q';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import { format } from 'util';

/*
 * Actions
 */
const INIT_PURCHASE_ORDER_LIST = 'invoiz/purchaseOrder/INIT_PURCHASE_ORDER_LIST';
const RESET_PURCHASE_ORDER_LIST = 'invoiz/purchaseOrder/RESET_PURCHASE_ORDER_LIST';
const START_FETCHING_PURCHASE_ORDER_LIST = 'invoiz/purchaseOrder/START_FETCHING_PURCHASE_ORDER_LIST';
const FINISHED_FETCHING_PURCHASE_ORDER_LIST = 'invoiz/purchaseOrder/FINISHED_FETCHING_PURCHASE_ORDER_LIST';
const ERROR_FETCHING_PURCHASE_ORDER_LIST = 'invoiz/purchaseOrder/ERROR_FETCHING_PURCHASE_ORDER_LIST';
const SORT_PURCHASE_ORDER_LIST = 'invoiz/purchaseOrder/SORT_PURCHASE_ORDER_LIST';
const PAGINATE_PURCHASE_ORDER_LIST = 'invoiz/purchaseOrder/PAGINATE_PURCHASE_ORDER_LIST';
const FILTER_PURCHASE_ORDER_LIST = 'invoiz/purchaseOrder/FILTER_PURCHASE_ORDER_LIST';
const SEARCH_PURCHASE_ORDER_LIST = 'invoiz/purchaseOrder/SEARCH_PURCHASE_ORDER_LIST';
const SELECT_ITEM = 'invoiz/purchaseOrder/SELECT_ITEM';
const SELECT_ALL = 'invoiz/purchaseOrder/SELECT_ALL';
const FINISHED_PROCESS_SELECTED = 'invoiz/purchaseOrder/FINISHED_PROCESS_SELECTED';
const FINISHED_PROCESSING_SELECTED_ITEMS = 'invoiz/purchaseOrder/FINISHED_PROCESSING_SELECTED_ITEMS';

/*
 * Reducer
 */
const initialState = {
	initialized: false,
	isLoading: true,
	errorOccurred: false,
	allSelected: false,
	selectedItems: [],
	finishedDeletingItems: false,
	columns: [
		{ key: 'number', title: 'Nr.', width: '190px', resourceKey: 'serialNumber' },
		{ key: 'customerData.name', title: 'Kunde', width: '250px', resourceKey: 'payee' },
		{ key: 'date', title: 'Datum', width: '130px', sorted: 'desc', resourceKey: 'date' },
		{ key: 'totalGross', title: 'Brutto', width: '150px', align: 'right', resourceKey: 'gross' },
		// {
		// 	key: 'impressOffer',
		// 	title: 'IMPRESS',
		// 	width: '100px',
		// 	notSortable: true,
		// 	notClickable: true,
		// 	align: 'center',
		// 	valueStyle: { fontSize: 22, padding: 0, lineHeight: '22px' },
		// 	resourceKey: 'impress'
		// },
		{ key: 'dropdown', title: '', width: '50px', notSortable: true, notClickable: true, resourceKey: '' }
	],
	currentPage: 1,
	totalPages: 1,
	filterItems: [
		{ title: 'Alle', count: 0, active: true, key: 'all', resouceKey: 'all' },
		{ title: 'Offen', count: 0, active: false, key: 'open', resouceKey: 'open' },
		{ title: 'Angenommen', count: 0, active: false, key: 'accepted', resouceKey: 'accepted' },
		{ title: 'Abgerechnet', count: 0, active: false, key: 'expensed', resouceKey: 'expensed' },
		{ title: 'Abgelehnt', count: 0, active: false, key: 'rejected', resouceKey: 'rejected' }
	],
	orderBy: 'date',
	sortDirection: 'desc',
	currentFilter: 'all',
	searchText: '',
	purchaseOrderListData: {
		purchaseOrders: [],
		meta: {}
	}
};

let searchTimer = null;

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_PURCHASE_ORDER_LIST: {
			const settings = WebStorageService.getItem(WebStorageKey.PURCHASEORDER_LIST_SETTINGS);

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

		case RESET_PURCHASE_ORDER_LIST: {
			// const { isImpressOfferList } = action;
			const newState = JSON.parse(JSON.stringify(initialState));

			// if (isImpressOfferList) {
			// 	newState.filterItems.splice(1, 0, { title: 'Entwurf', count: 0, active: false, key: 'draft', resouceKey: 'draft' });
			// }

			return newState;
		}

		case START_FETCHING_PURCHASE_ORDER_LIST: {
			return { ...state, isLoading: true };
		}

		case FINISHED_FETCHING_PURCHASE_ORDER_LIST: {
			const { purchaseOrderListData } = action;
			const { count, filter } = purchaseOrderListData.meta;
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
			WebStorageService.setItem(
				 WebStorageKey.PURCHASEORDER_LIST_SETTINGS,
				{
					orderBy,
					sortDirection,
					currentFilter
				}
			);

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				purchaseOrderListData,
				allSelected: false,
				selectedItems: [],
				totalPages,
				filterItems: newFilterItems,
				searchText
			};
		}

		case PAGINATE_PURCHASE_ORDER_LIST: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case ERROR_FETCHING_PURCHASE_ORDER_LIST: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		case SORT_PURCHASE_ORDER_LIST: {
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

		case FILTER_PURCHASE_ORDER_LIST: {
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

		case SEARCH_PURCHASE_ORDER_LIST: {
			const { searchText } = action;
			return { ...state, isLoading: searchText.trim().length === 0, searchText };
		}

		case SELECT_ITEM: {
			const { purchaseOrderListData } = state;
			const { id, selected } = action;

			const selectedItems = [];

			purchaseOrderListData.purchaseOrders.forEach(purchaseOrder => {
				if (purchaseOrder.id === id) {
					purchaseOrder.selected = selected;
				}

				if (purchaseOrder.selected) {
					selectedItems.push(purchaseOrder);
				}
			});

			const allSelected = selectedItems.length === purchaseOrderListData.purchaseOrders.length;

			return {
				...state,
				purchaseOrderListData,
				allSelected,
				selectedItems
			};
		}

		case SELECT_ALL: {
			const { purchaseOrderListData } = state;
			const { selected } = action;

			purchaseOrderListData.purchaseOrders.forEach(purchaseOrder => {
				purchaseOrder.selected = selected;
			});

			return {
				...state,
				purchaseOrderListData,
				allSelected: selected,
				selectedItems: selected ? purchaseOrderListData.purchaseOrders : []
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
const initPurchaseOrderList = () => {
	return {
		type: INIT_PURCHASE_ORDER_LIST
	};
};

const resetPurchaseOrderList = () => {
	return {
		type: RESET_PURCHASE_ORDER_LIST
	};
};

const startFetchingPurchaseOrderList = () => {
	return {
		type: START_FETCHING_PURCHASE_ORDER_LIST
	};
};

const finishedFetchingPurchaseOrderList = (purchaseOrderListData) => {
	return {
		type: FINISHED_FETCHING_PURCHASE_ORDER_LIST,
		purchaseOrderListData
	};
};

const errorFetchingPurchaseOrderList = () => {
	return {
		type: ERROR_FETCHING_PURCHASE_ORDER_LIST
	};
};

const paginate = page => {
	return {
		type: PAGINATE_PURCHASE_ORDER_LIST,
		page
	};
};

const sort = clickedColumn => {
	return {
		type: SORT_PURCHASE_ORDER_LIST,
		clickedColumn
	};
};

const filter = filterItem => {
	return {
		type: FILTER_PURCHASE_ORDER_LIST,
		filterItem
	};
};

const search = searchText => {
	return {
		type: SEARCH_PURCHASE_ORDER_LIST,
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

export const fetchPurchaseOrderList = (reset) => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetPurchaseOrderList());
		}

		if (!getState().purchaseOrder.purchaseOrderList.initialized) {
			dispatch(initPurchaseOrderList());
		}

		dispatch(startFetchingPurchaseOrderList());

		const { currentPage, orderBy, sortDirection, currentFilter, searchText } = getState().purchaseOrder.purchaseOrderList;

		const limit = 20;
		const offset = (currentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		const queryString = `?offset=${offset}&searchText=${searchText}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}&filter=${currentFilter}`;

		invoiz
			.request(`${config.resourceHost}purchaseOrder${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const purchaseOrders = data.map(purchaseOrder => {
					return new PurchaseOrder(purchaseOrder);
				});
				dispatch(finishedFetchingPurchaseOrderList({ purchaseOrders, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingPurchaseOrderList());
			});
	};
};

export const paginatePurchaseOrderList = (page) => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchPurchaseOrderList(false));
	};
};

export const sortPurchaseOrderList = (column) => {
	return dispatch => {
		dispatch(sort(column));
		dispatch(fetchPurchaseOrderList(false));
	};
};

export const filterPurchaseOrderList = (filterItem) => {
	return dispatch => {
		dispatch(filter(filterItem));
		dispatch(fetchPurchaseOrderList(false));
	};
};

export const searchPurchaseOrderList = (searchText) => {
	return dispatch => {
		dispatch(search(searchText));

		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			dispatch(fetchPurchaseOrderList(false));
		}, 500);
	};
};

export const deletePurchaseOrder = (id, number) => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		invoiz
			.request(`${config.resourceHost}purchaseOrder/${id}`, {
				auth: true,
				method: 'DELETE'
			})
			.then(() => {
				invoiz.page.showToast({ message: format(resources.purchaseOrderDeleteSuccessMessage, number) });
				dispatch(fetchPurchaseOrderList(false));
			});
	};
};

export const selectPurchaseOrder = (id, selected) => {
	return dispatch => {
		dispatch(selectItem(id, selected));
	};
};

export const selectAllPurchaseOrders = selected => {
	return dispatch => {
		dispatch(selectAll(selected));
	};
};

export const deleteSelectedPurchaseOrders = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().purchaseOrder.purchaseOrderList;

		const requests = selectedItems.map(purchaseOrder => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}purchaseOrder/${purchaseOrder.id}`, {
						auth: true,
						method: 'DELETE'
					})
					.then(() => {
						dispatch(finishedProcessingItem(purchaseOrder.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedProcessingItem(purchaseOrder.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			dispatch(finishedProcessingSelectedItems());
		});
	};
};

export const acceptSelectedPurchaseOrders = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().purchaseOrder.purchaseOrderList;

		const requests = selectedItems.map(purchaseOrder => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}purchaseOrder/${purchaseOrder.id}/state`, {
						auth: true,
						method: 'PUT',
						data: { state: 'accepted' }
					})
					.then(() => {
						dispatch(finishedProcessingItem(purchaseOrder.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedProcessingItem(purchaseOrder.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			dispatch(finishedProcessingSelectedItems());
		});
	};
};

export const rejectSelectedPurchaseOrders = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().purchaseOrder.purchaseOrderList;

		const requests = selectedItems.map(purchaseOrder => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}purchaseOrder/${purchaseOrder.id}/state`, {
						auth: true,
						method: 'PUT',
						data: { state: 'rejected' }
					})
					.then(() => {
						dispatch(finishedProcessingItem(purchaseOrder.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedProcessingItem(purchaseOrder.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			dispatch(finishedProcessingSelectedItems());
		});
	};
};

export const setOpenSelectedPurchaseOrders = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().purchaseOrder.purchaseOrderList;

		const requests = selectedItems.map(purchaseOrder => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}purchaseOrder/${purchaseOrder.id}/state`, {
						auth: true,
						method: 'PUT',
						data: { state: 'open' }
					})
					.then(() => {
						dispatch(finishedProcessingItem(purchaseOrder.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedProcessingItem(purchaseOrder.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			dispatch(finishedProcessingSelectedItems());
		});
	};
};
