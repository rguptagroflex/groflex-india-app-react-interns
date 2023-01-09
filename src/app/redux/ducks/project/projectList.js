import invoiz from 'services/invoiz.service';
import config from 'config';
import Project from 'models/project.model';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';

/*
 * Actions
 */
const INIT_PROJECT_LIST = 'invoiz/project/INIT_PROJECT_LIST';
const RESET_PROJECT_LIST = 'invoiz/project/RESET_PROJECT_LIST';
const START_FETCHING_PROJECT_LIST = 'invoiz/project/START_FETCHING_PROJECT_LIST';
const FINISHED_FETCHING_PROJECT_LIST = 'invoiz/project/FINISHED_FETCHING_PROJECT_LIST';
const ERROR_FETCHING_PROJECT_LIST = 'invoiz/project/ERROR_FETCHING_PROJECT_LIST';
const SORT_PROJECT_LIST = 'invoiz/project/SORT_PROJECT_LIST';
const SEARCH_PROJECT_LIST = 'invoiz/project/SEARCH_PROJECT_LIST';
const PAGINATE_PROJECT_LIST = 'invoiz/project/PAGINATE_PROJECT_LIST';
const FILTER_PROJECT_LIST = 'invoiz/project/FILTER_PROJECT_LIST';

/*
 * Reducer
 */
const initialState = {
	initialized: false,
	isLoading: true,
	errorOccurred: false,
	columns: [
		{ key: 'title', title: 'Titel', resourceKey: 'title' },
		{ key: 'customer.name', title: 'Kunde', resourceKey: 'customer' },
		{ key: 'startDate', title: 'Startdatum', width: '120px', sorted: 'desc', resourceKey: 'startDate' },
		{ key: 'budget', title: 'Budget', width: '120px', align: 'right', resourceKey: 'budget' }
	],
	currentPage: 1,
	totalPages: 1,
	filterItems: [
		{ title: 'Alle', count: 0, active: true, key: 'all', resouceKey: 'all' },
		{ title: 'Aktiv', count: 0, active: false, key: 'started', resouceKey: 'active' },
		{ title: 'Nicht gestartet', count: 0, active: false, key: 'draft', resouceKey: 'notStarted' },
		{ title: 'Beendet', count: 0, active: false, key: 'finished', resouceKey: 'finished' },
		{ title: 'Bezahlt', count: 0, active: false, key: 'paid', resouceKey: 'paid' }
	],
	orderBy: 'customer.name',
	sortDirection: 'desc',
	currentFilter: 'all',
	searchText: '',
	projectListData: {
		projects: [],
		meta: {}
	}
};

let searchTimer = null;

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_PROJECT_LIST: {
			const settings = WebStorageService.getItem(WebStorageKey.PROJECT_LIST_SETTINGS);

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

		case RESET_PROJECT_LIST: {
			return { ...initialState };
		}

		case START_FETCHING_PROJECT_LIST: {
			return { ...state, isLoading: true };
		}

		case FINISHED_FETCHING_PROJECT_LIST: {
			const { projectListData } = action;
			const { count, filter } = projectListData.meta;
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
			WebStorageService.setItem(WebStorageKey.PROJECT_LIST_SETTINGS, {
				orderBy,
				sortDirection,
				currentFilter
			});

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				projectListData,
				totalPages,
				filterItems: newFilterItems,
				searchText
			};
		}

		case PAGINATE_PROJECT_LIST: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case ERROR_FETCHING_PROJECT_LIST: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		case SORT_PROJECT_LIST: {
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

		case FILTER_PROJECT_LIST: {
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

		case SEARCH_PROJECT_LIST: {
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
const initProjectList = () => {
	return {
		type: INIT_PROJECT_LIST
	};
};

const resetProjectList = () => {
	return {
		type: RESET_PROJECT_LIST
	};
};

const startFetchingProjectList = () => {
	return {
		type: START_FETCHING_PROJECT_LIST
	};
};

const finishedFetchingProjectList = projectListData => {
	return {
		type: FINISHED_FETCHING_PROJECT_LIST,
		projectListData
	};
};

const errorFetchingProjectList = () => {
	return {
		type: ERROR_FETCHING_PROJECT_LIST
	};
};

const paginate = page => {
	return {
		type: PAGINATE_PROJECT_LIST,
		page
	};
};

const sort = clickedColumn => {
	return {
		type: SORT_PROJECT_LIST,
		clickedColumn
	};
};

const filter = filterItem => {
	return {
		type: FILTER_PROJECT_LIST,
		filterItem
	};
};

const search = searchText => {
	return {
		type: SEARCH_PROJECT_LIST,
		searchText
	};
};

export const fetchProjectList = reset => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetProjectList());
		}

		if (!getState().project.projectList.initialized) {
			dispatch(initProjectList());
		}

		dispatch(startFetchingProjectList());

		const { currentPage, orderBy, sortDirection, currentFilter, searchText } = getState().project.projectList;

		const limit = 20;
		const offset = (currentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		const queryString = `?offset=${offset}&searchText=${searchText}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}&filter=${currentFilter}`;

		invoiz
			.request(`${config.resourceHost}project${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const projects = data.map(project => {
					return new Project(project);
				});
				dispatch(finishedFetchingProjectList({ projects, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingProjectList());
			});
	};
};

export const paginateProjectList = page => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchProjectList());
	};
};

export const sortProjectList = column => {
	return dispatch => {
		dispatch(sort(column));
		dispatch(fetchProjectList());
	};
};

export const filterProjectList = filterItem => {
	return dispatch => {
		dispatch(filter(filterItem));
		dispatch(fetchProjectList());
	};
};

export const searchProjectList = searchText => {
	return dispatch => {
		dispatch(search(searchText));

		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			dispatch(fetchProjectList());
		}, 500);
	};
};

export const deleteProject = id => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		invoiz
			.request(`${config.resourceHost}project/${id}`, {
				auth: true,
				method: 'DELETE'
			})
			.then(() => {
				invoiz.page.showToast({ message: resources.projectDeleteSuccessMessage });
				dispatch(fetchProjectList());
			});
	};
};
