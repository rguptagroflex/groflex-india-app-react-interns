import invoiz from 'services/invoiz.service';
import config from 'config';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import ArticleHistoryItem from 'models/article-history-item.model';
import InventoryHistory from 'models/inventory-history.model';

const FETCH_COUNT = 5;

/*
 * Actions
 */
const INIT_ARTICLE_HISTORY_LIST = 'invoiz/article/INIT_ARTICLE_HISTORY_LIST';
const RESET_ARTICLE_HISTORY_LIST = 'invoiz/article/RESET_ARTICLE_HISTORY_LIST';
const START_FETCHING_ARTICLE_HISTORY_LIST = 'invoiz/article/START_FETCHING_ARTICLE_HISTORY_LIST';
const FINISHED_FETCHING_ARTICLE_HISTORY_LIST = 'invoiz/article/FINISHED_FETCHING_ARTICLE_HISTORY_LIST';
const ERROR_FETCHING_ARTICLE_HISTORY_LIST = 'invoiz/article/ERROR_FETCHING_ARTICLE_HISTORY_LIST';
const SORT_ARTICLE_HISTORY_LIST = 'invoiz/article/SORT_ARTICLE_HISTORY_LIST';
const PAGINATE_ARTICLE_HISTORY_LIST = 'invoiz/article/PAGINATE_ARTICLE_HISTORY_LIST';
const FILTER_ARTICLE_HISTORY_LIST = 'invoiz/article/FILTER_ARTICLE_HISTORY_LIST';

const INIT_INVENTORY_HISTORY_LIST = 'invoiz/article/INIT_INVENTORY_HISTORY_LIST';
const START_FETCHING_INVENTORY_HISTORY_LIST = 'invoiz/article/START_FETCHING_INVENTORY_HISTORY_LIST';
const PAGINATE_INVENTORY_HISTORY_LIST = 'invoiz/article/PAGINATE_INVENTORY_HISTORY_LIST';
const FINISHED_FETCHING_INVENTORY_HISTORY_LIST = 'invoiz/article/FINISHED_FETCHING_INVENTORY_HISTORY_LIST';
const SORT_INVENTORY_HISTORY_LIST = 'invoiz/article/SORT_INVENTORY_HISTORY_LIST';
/*
 * Reducer
 */
const initialState = {
	initialized: false,
	isLoading: true,
	errorOccurred: false,
	columns: [
		{ key: 'date', title: 'Datum', width: '130px', resourceKey: 'date' },
		{ key: 'type', title: 'Vorgang', width: '140px', resourceKey: 'operation' },
		{ key: 'number', title: 'Nr.', width: '100px', resourceKey: 'serialNumber' },
		{ key: 'customer', title: 'Kunde', resourceKey: 'customer' },
		{ key: 'amount', title: 'Anz.', width: '70px', resourceKey: 'quantity' },
		{ key: 'price', title: 'Preis', width: '140px', align: 'right', resourceKey: 'price' }
	],
	currentPage: 1,
	totalPages: 1,
	filterItems: [
		{ title: 'Alle', count: 0, active: true, key: 'all', resouceKey: 'all' },
		{ title: 'Rechnungen', count: 0, active: false, key: 'invoice', resouceKey: 'invoice' },
		{ title: 'Angebote', count: 0, active: false, key: 'offer', resouceKey: 'offer' },
		{ title: 'Expenses', count: 0, active: false, key: 'expense', resouceKey: 'expenses' },
		{ title: 'Angebote', count: 0, active: false, key: 'purchaseOrder', resouceKey: 'purchaseOrder' }
	],
	orderBy: 'date',
	sortDirection: 'desc',
	currentFilter: 'all',
	articleHistoryListData: {
		articleHistoryItems: [],
		meta: {}
	},
	inventoryHistoryColumns: [
		{key: "itemModifiedDate", resourceKey: "itemModifiedDate", sorted: "desc", title: "Date", width: "130px"},
		{key: "quantity", resourceKey: "quantity", sorted: "desc", title: "quantity", width: "130px"},
		{key: "currentStock", resourceKey: "currentStock", sorted: "desc", title: "Date", width: "130px"},
		{key: "value", resourceKey: "value", sorted: "desc", title: "Date", width: "130px"},
		{key: "action", resourceKey: "action", sorted: "desc", title: "Date", width: "130px"},
		{key: "source", resourceKey: "source", sorted: "desc", title: "Date", width: "130px"}
	],
	inventoryHistoryListData: {
		inventoryHistoryItems: [],
		meta: {}
	},
	inventoryOrderBy: 'itemModifiedDate',
	inventoryCurrentPage: 1,
	inventoryTotalPages: 1
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_ARTICLE_HISTORY_LIST: {
			const settings = WebStorageService.getItem(WebStorageKey.ARTICLE_HISTORY_LIST_SETTINGS);

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

		case INIT_INVENTORY_HISTORY_LIST: {
			//const settings = WebStorageService.getItem(WebStorageKey.ARTICLE_HISTORY_LIST_SETTINGS);

			// if (settings) {
				const { inventoryHistoryColumns } = state;
				// const { orderBy, sortDirection } = settings;
				let orderBy = 'itemModifiedDate'
				let sortDirection = 'desc'

				// const newFilterItems = filterItems.map(filterItem => {
				// 	filterItem.active = currentFilter === filterItem.key;
				// 	return filterItem;
				// });

				// const newColumns = columns.map(column => {
				// 	if (column.key === orderBy) {
				// 		column.sorted = sortDirection;
				// 	} else {
				// 		delete column.sorted;
				// 	}
				// 	return column;
				// });

				return {
					...state,
					initialized: true,
					inventoryOrderBy: orderBy,
					sortDirection,
					inventoryHistoryColumns,
					// currentFilter,
					// filterItems: newFilterItems
				};
			// } else {
			// 	return { ...state, initialized: true };
			// }
		}

		case RESET_ARTICLE_HISTORY_LIST: {
			return { ...initialState };
		}

		case START_FETCHING_ARTICLE_HISTORY_LIST: {
			return { ...state, isLoading: true };
		}

		case START_FETCHING_INVENTORY_HISTORY_LIST: {
			return { ...state, isLoading: true };
		}

		case FINISHED_FETCHING_ARTICLE_HISTORY_LIST: {
			const { articleHistoryListData } = action;
			const { count, filter } = articleHistoryListData.meta;
			const totalPages = Math.ceil(count / FETCH_COUNT);
			const { filterItems } = state;

			const newFilterItems = filterItems.map(filterItem => {
				const filterData = filter[filterItem.key];
				if (filterData) {
					filterItem.count = filterData.count;
				}
				return filterItem;
			});

			const { orderBy, sortDirection, currentFilter } = state;

			WebStorageService.setItem(WebStorageKey.ARTICLE_HISTORY_LIST_SETTINGS, {
				orderBy,
				sortDirection,
				currentFilter
			});

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				articleHistoryListData,
				selectedItems: [],
				totalPages,
				filterItems: newFilterItems
			};
		}

		case FINISHED_FETCHING_INVENTORY_HISTORY_LIST: {
			const { inventoryHistoryListData } = action;
			const { count, filter } = inventoryHistoryListData.meta;
			const inventoryTotalPages = Math.ceil(count / FETCH_COUNT);
			//const { filterItems } = state;

			// const newFilterItems = filterItems.map(filterItem => {
			// 	const filterData = filter[filterItem.key];
			// 	if (filterData) {
			// 		filterItem.count = filterData.count;
			// 	}
			// 	return filterItem;
			// });

			const { inventoryOrderBy, sortDirection} = state;

			// WebStorageService.setItem(WebStorageKey.ARTICLE_HISTORY_LIST_SETTINGS, {
			// 	orderBy,
			// 	sortDirection,
			// 	currentFilter
			// });

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				inventoryHistoryListData,
				// selectedItems: [],
				inventoryTotalPages,
				// filterItems: newFilterItems
			};
		}

		case PAGINATE_ARTICLE_HISTORY_LIST: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case PAGINATE_INVENTORY_HISTORY_LIST: {
			const { page } = action;
			return { ...state, inventoryCurrentPage: page };
		}

		case ERROR_FETCHING_ARTICLE_HISTORY_LIST: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		case SORT_ARTICLE_HISTORY_LIST: {
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

		case SORT_INVENTORY_HISTORY_LIST: {
			const { clickedColumn } = action;
			const { inventoryHistoryColumns } = state;
			let orderBy, sortDirection;

			const newColumns = inventoryHistoryColumns.map(column => {
				if (column.key === clickedColumn.key) {
					column.sorted = column.sorted === 'desc' ? 'asc' : 'desc';
					orderBy = column.key;
					sortDirection = column.sorted;
				} else {
					delete column.sorted;
				}

				return column;
			});
			
			return { ...state, inventoryOrderBy: orderBy, sortDirection, inventoryHistoryColumns: newColumns };
		}

		case FILTER_ARTICLE_HISTORY_LIST: {
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
const initArticleHistoryList = () => {
	return {
		type: INIT_ARTICLE_HISTORY_LIST
	};
};

const initInventoryHistoryList = () => {
	return {
		type: INIT_INVENTORY_HISTORY_LIST
	};
};

const resetArticleHistoryList = () => {
	return {
		type: RESET_ARTICLE_HISTORY_LIST
	};
};

const startFetchingArticleHistoryList = () => {
	return {
		type: START_FETCHING_ARTICLE_HISTORY_LIST
	};
};

const startFetchingInventoryHistoryList = () => {
	return {
		type: START_FETCHING_ARTICLE_HISTORY_LIST
	};
};

const finishedFetchingArticleHistoryList = articleHistoryListData => {
	return {
		type: FINISHED_FETCHING_ARTICLE_HISTORY_LIST,
		articleHistoryListData
	};
};

const finishedFetchingInventoryHistoryList = inventoryHistoryListData => {
	return {
		type: FINISHED_FETCHING_INVENTORY_HISTORY_LIST,
		inventoryHistoryListData
	};
};

const errorFetchingArticleHistoryList = () => {
	return {
		type: ERROR_FETCHING_ARTICLE_HISTORY_LIST
	};
};

const paginate = page => {
	return {
		type: PAGINATE_ARTICLE_HISTORY_LIST,
		page
	};
};

const paginateInventory = page => {
	return {
		type: PAGINATE_INVENTORY_HISTORY_LIST,
		page
	};
};

const sort = clickedColumn => {
	return {
		type: SORT_ARTICLE_HISTORY_LIST,
		clickedColumn
	};
};

const sortInventory = clickedColumn => {
	return {
		type: SORT_INVENTORY_HISTORY_LIST,
		clickedColumn
	};
};

const filter = filterItem => {
	return {
		type: FILTER_ARTICLE_HISTORY_LIST,
		filterItem
	};
};

export const fetchArticleHistoryList = (articleId, reset) => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetArticleHistoryList());
		}

		if (!getState().article.articleHistoryList.initialized) {
			dispatch(initArticleHistoryList());
		}

		dispatch(startFetchingArticleHistoryList());

		const { currentPage, orderBy, sortDirection, currentFilter } = getState().article.articleHistoryList;

		const limit = FETCH_COUNT;
		const offset = (currentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		const queryString = `?offset=${offset}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}&filter=${currentFilter}`;

		invoiz
			.request(`${config.resourceHost}article/${articleId}/history${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const articleHistoryItems = data.map(articleHistoryItem => {
					return new ArticleHistoryItem(articleHistoryItem);
				});

				dispatch(finishedFetchingArticleHistoryList({ articleHistoryItems, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingArticleHistoryList());
			});
	};
};

export const fetchInventoryHistoryList = (inventoryId, reset) => {
	return (dispatch, getState) => {
		// if (reset) {
		// 	dispatch(resetArticleHistoryList());
		// }

		// if (!getState().inventory.inventoryHistoryList.initialized) {
		// 	dispatch(initInventoryHistoryList());
		// }

		dispatch(startFetchingInventoryHistoryList());

		const { inventoryCurrentPage, inventoryOrderBy, sortDirection } = getState().article.articleHistoryList;

		const limit = FETCH_COUNT;
		const offset = (inventoryCurrentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		const queryString = `?offset=${offset}&limit=${limit}&orderBy=${inventoryOrderBy}&desc=${isDesc}`;

		invoiz
			.request(`${config.resourceHost}inventory/history/${inventoryId}${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const inventoryHistoryItems = data.map(articleHistoryItem => {
					return new InventoryHistory(articleHistoryItem);
				});

				dispatch(finishedFetchingInventoryHistoryList({ inventoryHistoryItems, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingArticleHistoryList());
			});
	};
};

export const paginateArticleHistoryList = (articleId, page) => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchArticleHistoryList(articleId));
	};
};

export const paginateInventoryHistoryList = (inventoryId, page) => {
	return dispatch => {
		dispatch(paginateInventory(page));
		dispatch(fetchInventoryHistoryList(inventoryId));
	};
};

export const sortArticleHistoryList = (articleId, column) => {
	return dispatch => {
		dispatch(sort(column));
		dispatch(fetchArticleHistoryList(articleId));
	};
};

export const sortInventoryHistoryList = (articleId, column) => {
	return dispatch => {
		dispatch(sortInventory(column));
		dispatch(fetchInventoryHistoryList(articleId));
	};
};

export const filterArticleHistoryList = (articleId, filterItem) => {
	return dispatch => {
		dispatch(filter(filterItem));
		dispatch(fetchArticleHistoryList(articleId));
	};
};
