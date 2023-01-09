import invoiz from 'services/invoiz.service';
import config from 'config';
import Timetracking from 'models/timetracking.model';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';

/*
 * Actions
 */
const INIT_TIMETRACKING_LIST = 'invoiz/timetracking/INIT_TIMETRACKING_LIST';
const RESET_TIMETRACKING_LIST = 'invoiz/timetracking/RESET_TIMETRACKING_LIST';
const START_FETCHING_TIMETRACKING_LIST = 'invoiz/timetracking/START_FETCHING_TIMETRACKING_LIST';
const FINISHED_FETCHING_TIMETRACKING_LIST = 'invoiz/timetracking/FINISHED_FETCHING_TIMETRACKING_LIST';
const ERROR_FETCHING_TIMETRACKING_LIST = 'invoiz/timetracking/ERROR_FETCHING_TIMETRACKING_LIST';
const SORT_TIMETRACKING_LIST = 'invoiz/timetracking/SORT_TIMETRACKING_LIST';
const PAGINATE_TIMETRACKING_LIST = 'invoiz/timetracking/PAGINATE_TIMETRACKING_LIST';
const FILTER_TIMETRACKING_LIST = 'invoiz/timetracking/FILTER_TIMETRACKING_LIST';
const SEARCH_TIMETRACKING_LIST = 'invoiz/timetracking/SEARCH_TIMETRACKING_LIST';

/*
 * Reducer
 */
const initialState = {
	initialized: false,
	isLoading: true,
	errorOccurred: false,
	columns: [
		{ key: 'customerName', title: 'Kunde', sorted: 'desc', resourceKey: 'customer' },
		{ key: 'rowCount', title: 'Aufwände', resourceKey: 'activity' },
		{ key: 'durationInMinutes', title: 'Dauer', width: '120px', resourceKey: 'duration' },
		{ key: 'priceTotal', title: 'Betrag', width: '120px', align: 'right', resourceKey: 'amountTitle' }
	],
	currentPage: 1,
	totalPages: 1,
	filterItems: [
		{ title: 'Alle', count: 0, active: true, key: 'default', resouceKey: 'all' },
		{ title: 'Offen', count: 0, active: false, key: 'open', resouceKey: 'open' },
		{ title: 'Abgerechnet', count: 0, active: false, key: 'invoiced', resouceKey: 'invoiced' }
	],
	orderBy: 'customerName',
	sortDirection: 'desc',
	currentFilter: 'default',
	searchText: '',
	timetrackingListData: {
		timetrackings: [],
		meta: {}
	}
};

let searchTimer = null;

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_TIMETRACKING_LIST: {
			const settings = WebStorageService.getItem(WebStorageKey.TIMETRACKING_LIST_SETTINGS);

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

		case RESET_TIMETRACKING_LIST: {
			return { ...initialState };
		}

		case START_FETCHING_TIMETRACKING_LIST: {
			return { ...state, isLoading: true };
		}

		case FINISHED_FETCHING_TIMETRACKING_LIST: {
			const { timetrackingListData } = action;
			const { count, filter } = timetrackingListData.meta;
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
			WebStorageService.setItem(WebStorageKey.TIMETRACKING_LIST_SETTINGS, {
				orderBy,
				sortDirection,
				currentFilter
			});

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				timetrackingListData,
				totalPages,
				filterItems: newFilterItems,
				searchText
			};
		}

		case PAGINATE_TIMETRACKING_LIST: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case ERROR_FETCHING_TIMETRACKING_LIST: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		case SORT_TIMETRACKING_LIST: {
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

		case FILTER_TIMETRACKING_LIST: {
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

		case SEARCH_TIMETRACKING_LIST: {
			const { searchText } = action;
			return { ...state, isLoading: searchText.trim().length === 0, searchText };
		}

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const initTimetrackingList = () => {
	return {
		type: INIT_TIMETRACKING_LIST
	};
};

const resetTimetrackingList = () => {
	return {
		type: RESET_TIMETRACKING_LIST
	};
};

const startFetchingTimetrackingList = () => {
	return {
		type: START_FETCHING_TIMETRACKING_LIST
	};
};

const finishedFetchingTimetrackingList = timetrackingListData => {
	return {
		type: FINISHED_FETCHING_TIMETRACKING_LIST,
		timetrackingListData
	};
};

const errorFetchingTimetrackingList = () => {
	return {
		type: ERROR_FETCHING_TIMETRACKING_LIST
	};
};

const paginate = page => {
	return {
		type: PAGINATE_TIMETRACKING_LIST,
		page
	};
};

const sort = clickedColumn => {
	return {
		type: SORT_TIMETRACKING_LIST,
		clickedColumn
	};
};

const filter = filterItem => {
	return {
		type: FILTER_TIMETRACKING_LIST,
		filterItem
	};
};

const search = searchText => {
	return {
		type: SEARCH_TIMETRACKING_LIST,
		searchText
	};
};

export const fetchTimetrackingList = reset => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetTimetrackingList());
		}

		if (!getState().timetracking.timetrackingList.initialized) {
			dispatch(initTimetrackingList());
		}

		dispatch(startFetchingTimetrackingList());

		const {
			currentPage,
			orderBy,
			sortDirection,
			currentFilter,
			searchText
		} = getState().timetracking.timetrackingList;

		const limit = 20;
		const offset = (currentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		const queryString = `?offset=${offset}&searchText=${searchText}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}&filter=${currentFilter}`;

		invoiz
			.request(`${config.resourceHost}trackedTime${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const timetrackings = data.map(timetracking => {
					return new Timetracking(timetracking);
				});
				dispatch(finishedFetchingTimetrackingList({ timetrackings, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingTimetrackingList());
			});
	};
};

export const paginateTimetrackingList = page => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchTimetrackingList());
	};
};

export const sortTimetrackingList = column => {
	return dispatch => {
		dispatch(sort(column));
		dispatch(fetchTimetrackingList());
	};
};

export const filterTimetrackingList = filterItem => {
	return dispatch => {
		dispatch(filter(filterItem));
		dispatch(fetchTimetrackingList());
	};
};

export const searchTimetrackingList = searchText => {
	return dispatch => {
		dispatch(search(searchText));

		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			dispatch(fetchTimetrackingList());
		}, 500);
	};
};

export const deleteTimetracking = id => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		invoiz
			.request(`${config.resourceHost}timetracking/${id}`, {
				auth: true,
				method: 'DELETE'
			})
			.then(() => {
				invoiz.page.showToast({ message: resources.timeTrackingDeleteSuccessMessage });
				dispatch(fetchTimetrackingList());
			});
	};
};
