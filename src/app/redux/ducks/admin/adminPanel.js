import invoiz from 'services/invoiz.service';
import config from 'config';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';

/*
 * Actions
 */
const INIT_ADMIN_PANEL = 'invoiz/admin/INIT_ADMIN_PANEL';
const RESET_ADMIN_PANEL = 'invoiz/admin/RESET_ADMIN_PANEL';
const START_FETCHING_ADMIN_PANEL = 'invoiz/admin/START_FETCHING_ADMIN_PANEL';
const FINISHED_FETCHING_ADMIN_PANEL = 'invoiz/admin/FINISHED_FETCHING_ADMIN_PANEL';
const ERROR_FETCHING_ADMIN_PANEL = 'invoiz/admin/ERROR_FETCHING_ADMIN_PANEL';
const SORT_ADMIN_PANEL = 'invoiz/admin/SORT_ADMIN_PANEL';
const PAGINATE_ADMIN_PANEL = 'invoiz/admin/PAGINATE_ADMIN_PANEL';
const SELECT_ITEM = 'invoiz/admin/SELECT_ITEM';
const SELECT_ALL = 'invoiz/admin/SELECT_ALL';
const SEARCH_ADMIN_PANEL = 'invoiz/admin/SEARCH_ADMIN_PANEL';
const FILTER_ADMIN_PANEL = 'invoiz/admin/FILTER_ADMIN_PANEL';
const EXPAND_TRIAL = 'invoiz/admin/EXPAND_TRIAL';
const SET_IMPRESS_LIMIT = 'invoiz/admin/SET_IMPRESS_LIMIT';

/*
 * Reducer
 */
const initialState = {
	initialized: false,
	isLoading: true,
	allSelected: false,
	selectedItems: [],
	errorOccurred: false,
	columns: [
		{ key: 'tenantId', title: 'T. ID', sorted: 'asc', width: 85, resourceKey: 'tenantId' },
		{ key: 'email', title: 'E-Mail', resourceKey: 'email' },
		{ key: 'state', title: 'Status', width: 80, resourceKey: 'status' },
		{ key: 'planId', title: 'Plan ID', width: 100, resourceKey: 'planId' },
		{ key: 'vendor', title: 'Vendor', width: 80, notSortable: true, resourceKey: 'vendor' },
		{ key: 'trialEndAt', title: 'Trial bis', width: 80, resourceKey: 'trialUp' },
		{ key: 'registeredAt', title: 'Reg. Date', width: 75, notSortable: true, resourceKey: 'startDate' },
		{ key: 'mobile', title: 'Mobile', notSortable: true, resourceKey: 'mobile' },
		{ key: 'registrationStep', title: 'Reg. Step', width: 85, notSortable: true, resourceKey: 'registrationStep' },
		{ key: 'dropdown', title: '', width: '50px', notSortable: true, notClickable: true, resourceKey: '' }
	],
	filterItems: [
		{ key: 'all', title: 'Alle', count: 0, active: true, resouceKey: 'all' },
		{ key: 'Free_Plan', title: 'Free_Plan', count: 0, resouceKey: 'free' },
		{ key: 'Accounting', title: 'Accounting', count: 0, resouceKey: 'accounting' },		
		// { key: 'trial', title: 'Trial', count: 0, resouceKey: 'trial' },
		// { key: 'Free_mnth', title: 'Free.', count: 0, resouceKey: 'free' },
		// { key: 'starter', title: 'Std.', count: 0, resouceKey: 'starter' },
		// { key: 'standard', title: 'Std.', count: 0, resouceKey: 'standard' },
		// { key: 'unlimited', title: 'Unlimited', count: 0, resouceKey: 'unlimited' }
	],
	currentPage: 1,
	totalPages: 1,
	orderBy: 'tenantId',
	sortDirection: 'asc',
	currentFilter: 'all',
	searchText: '',
	adminPanelData: {
		users: [],
		meta: {}
	}
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_ADMIN_PANEL: {
			return { ...state, initialized: true };
		}

		case RESET_ADMIN_PANEL: {
			return { ...initialState };
		}

		case START_FETCHING_ADMIN_PANEL: {
			return { ...state, isLoading: true };
		}

		case FINISHED_FETCHING_ADMIN_PANEL: {
			const { adminPanelData } = action;
			const { count, filter } = adminPanelData.meta;
			const totalPages = Math.ceil(count / 20);
			const { filterItems } = state;

			const newFilterItems = filterItems.map(filterItem => {
				const filterData = filter && filter[filterItem.key];
				if (filterData) {
					filterItem.count = filterData.count;
				}
				return filterItem;
			});

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				adminPanelData,
				allSelected: false,
				selectedItems: [],
				totalPages,
				filterItems: newFilterItems
			};
		}

		case PAGINATE_ADMIN_PANEL: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case SEARCH_ADMIN_PANEL: {
			const { searchText } = action;
			return { ...state, searchText };
		}

		case ERROR_FETCHING_ADMIN_PANEL: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		case SORT_ADMIN_PANEL: {
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

		case FILTER_ADMIN_PANEL: {
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

		case SELECT_ITEM: {
			const { adminPanelData } = state;
			const { id, selected } = action;

			const selectedItems = [];

			adminPanelData.users.forEach(user => {
				if (user.id === id) {
					user.selected = selected;
				}

				if (user.selected) {
					selectedItems.push(user);
				}
			});

			const allSelected = selectedItems.length === adminPanelData.users.length;

			return {
				...state,
				adminPanelData,
				allSelected,
				selectedItems
			};
		}

		case SELECT_ALL: {
			const { adminPanelData } = state;
			const { selected } = action;

			adminPanelData.users.forEach(user => {
				user.selected = selected;
			});

			return {
				...state,
				adminPanelData,
				allSelected: selected,
				selectedItems: selected ? adminPanelData.users : []
			};
		}

		case EXPAND_TRIAL: {
			const { adminPanelData } = state;
			const { user, date } = action;

			adminPanelData.users.forEach(u => {
				if (u.tenantId === user.tenantId) {
					u.trialEndAt = date;
				}
			});

			const newData = { ...adminPanelData };

			return {
				...state,
				adminPanelData: newData
			};
		}

		case SET_IMPRESS_LIMIT: {
			const { adminPanelData } = state;
			const { user, limit } = action;

			adminPanelData.users.forEach(u => {
				if (u.tenantId === user.tenantId) {
					u.impressOfferLimit = limit;
				}
			});

			const newData = { ...adminPanelData };

			return {
				...state,
				adminPanelData: newData
			};
		}

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const initAdminPanel = () => {
	return {
		type: INIT_ADMIN_PANEL
	};
};

const startFetchingAdminPanel = () => {
	return {
		type: START_FETCHING_ADMIN_PANEL
	};
};

const resetAdminPanel = () => {
	return {
		type: RESET_ADMIN_PANEL
	};
};

const finishedFetchingAdminPanel = adminPanelData => {
	return {
		type: FINISHED_FETCHING_ADMIN_PANEL,
		adminPanelData
	};
};

const errorFetchingAdminPanel = () => {
	return {
		type: ERROR_FETCHING_ADMIN_PANEL
	};
};

const paginate = page => {
	return {
		type: PAGINATE_ADMIN_PANEL,
		page
	};
};

const sort = clickedColumn => {
	return {
		type: SORT_ADMIN_PANEL,
		clickedColumn
	};
};

const search = searchText => {
	return {
		type: SEARCH_ADMIN_PANEL,
		searchText
	};
};

const filter = filterItem => {
	return {
		type: FILTER_ADMIN_PANEL,
		filterItem
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

const expandTrial = (user, date) => {
	return {
		type: EXPAND_TRIAL,
		user,
		date
	};
};

const setUserImpressLimit = (user, limit) => {
	return {
		type: SET_IMPRESS_LIMIT,
		user,
		limit
	};
};

export const fetchAdminPanel = reset => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetAdminPanel());
		}

		if (!getState().admin.adminPanel.initialized) {
			dispatch(initAdminPanel());
		}

		dispatch(startFetchingAdminPanel());

		const { currentPage, orderBy, sortDirection, searchText, currentFilter } = getState().admin.adminPanel;
		console.log(currentPage, orderBy, sortDirection, searchText, currentFilter)
		const limit = 20;
		const offset = (currentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		// const queryString = `?offset=${offset}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}`;
		const queryString = `?offset=${offset}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}${searchText ? '&email=' + encodeURIComponent(searchText) : '' }${currentFilter !== 'all' ? '&planId=' + currentFilter : ''}`;

		invoiz
			.request(`${config.resourceHost}admin/users${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const users = data; // todo: User / AdminPanelUser Class
				dispatch(finishedFetchingAdminPanel({ users, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingAdminPanel());
			});
	};
};

export const paginateAdminPanel = page => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchAdminPanel());
	};
};

export const sortAdminPanel = column => {
	return dispatch => {
		dispatch(sort(column));
		dispatch(fetchAdminPanel());
	};
};

export const searchAdminPanel = searchText => {
	return dispatch => {
		dispatch(search(searchText));
		dispatch(fetchAdminPanel());
	};
};

export const filterAdminPanel = filterItem => {
	return dispatch => {
		dispatch(filter(filterItem));
		dispatch(fetchAdminPanel());
	};
};

export const selectUser = (id, selected) => {
	return dispatch => {
		dispatch(selectItem(id, selected));
	};
};

export const selectAllUsers = selected => {
	return dispatch => {
		dispatch(selectAll(selected));
	};
};

export const loginAsUser = user => {
	return dispatch => {
		invoiz
			.request(`${config.resourceHost}admin/tenant/${user.tenantId}/token`, {
				auth: true,
				method: 'POST'
			})
			.then(response => {
				invoiz.user.logout(true);
				setTimeout(() => {
					WebStorageService.setItem(WebStorageKey.ADMIN_MODE_ACTIVE, true);
					invoiz.user.login(response).then(redirectTo => {
						invoiz.router.navigate(redirectTo);
					});
				}, 1000);
			})
			.catch(() => {
				console.log('ERROR');
			});
	};
};

export const expandUserTrial = (user, date) => {
	return dispatch => {
		invoiz
			.request(`${config.resourceHost}admin/tenant/${user.tenantId}/trial`, {
				auth: true,
				method: 'PUT',
				data: {
					trialEnd: encodeURIComponent(date)
				}
			})
			.then(() => {
				dispatch(expandTrial(user, date));
			})
			.catch(() => {
				console.log('error');
			});
	};
};

export const setImpressLimit = (user, limit) => {
	return dispatch => {
		invoiz
			.request(`${config.resourceHost}admin/tenant/${user.tenantId}/impress/limit`, {
				auth: true,
				method: 'PUT',
				data: {
					impressCount: limit
				}
			})
			.then(() => {
				dispatch(setUserImpressLimit(user, limit));
			})
			.catch(() => {
				console.log('error');
			});
	};
};
