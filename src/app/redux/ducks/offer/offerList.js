import invoiz from 'services/invoiz.service';
import config from 'config';
import Offer from 'models/offer.model';
import q from 'q';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import { format } from 'util';

/*
 * Actions
 */
const INIT_OFFER_LIST = 'invoiz/offer/INIT_OFFER_LIST';
const RESET_OFFER_LIST = 'invoiz/offer/RESET_OFFER_LIST';
const START_FETCHING_OFFER_LIST = 'invoiz/offer/START_FETCHING_OFFER_LIST';
const FINISHED_FETCHING_OFFER_LIST = 'invoiz/offer/FINISHED_FETCHING_OFFER_LIST';
const ERROR_FETCHING_OFFER_LIST = 'invoiz/offer/ERROR_FETCHING_OFFER_LIST';
const SORT_OFFER_LIST = 'invoiz/offer/SORT_OFFER_LIST';
const PAGINATE_OFFER_LIST = 'invoiz/offer/PAGINATE_OFFER_LIST';
const FILTER_OFFER_LIST = 'invoiz/offer/FILTER_OFFER_LIST';
const SEARCH_OFFER_LIST = 'invoiz/offer/SEARCH_OFFER_LIST';
const SELECT_ITEM = 'invoiz/offer/SELECT_ITEM';
const SELECT_ALL = 'invoiz/offer/SELECT_ALL';
const FINISHED_PROCESS_SELECTED = 'invoiz/offer/FINISHED_PROCESS_SELECTED';
const FINISHED_PROCESSING_SELECTED_ITEMS = 'invoiz/offer/FINISHED_PROCESSING_SELECTED_ITEMS';

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
		{ key: 'number', title: 'Nr.', width: '180px', resourceKey: 'serialNumber' },
		{ key: 'customerData.name', title: 'Kunde', resourceKey: 'customer' },
		{ key: 'date', title: 'Datum', width: '120px', sorted: 'desc', resourceKey: 'date' },
		{ key: 'totalGross', title: 'Brutto', width: '120px', align: 'right', resourceKey: 'gross' },
		{
			key: 'impressOffer',
			title: 'IMPRESS',
			width: '100px',
			notSortable: true,
			notClickable: true,
			align: 'center',
			valueStyle: { fontSize: 22, padding: 0, lineHeight: '22px' },
			resourceKey: 'impress'
		},
		{ key: 'dropdown', title: '', width: '50px', notSortable: true, notClickable: true, resourceKey: '' }
	],
	currentPage: 1,
	totalPages: 1,
	filterItems: [
		{ title: 'Alle', count: 0, active: true, key: 'all', resouceKey: 'all' },
		{ title: 'Offen', count: 0, active: false, key: 'open', resouceKey: 'open' },
		{ title: 'Angenommen', count: 0, active: false, key: 'accepted', resouceKey: 'accepted' },
		{ title: 'Abgerechnet', count: 0, active: false, key: 'invoiced', resouceKey: 'invoiced' },
		{ title: 'Abgelehnt', count: 0, active: false, key: 'rejected', resouceKey: 'rejected' }
	],
	orderBy: 'date',
	sortDirection: 'desc',
	currentFilter: 'all',
	searchText: '',
	offerListData: {
		offers: [],
		meta: {}
	}
};

let searchTimer = null;

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_OFFER_LIST: {
			const { isImpressOfferList } = action;
			const settings = WebStorageService.getItem(
				isImpressOfferList ? WebStorageKey.OFFER_IMPRESS_LIST_SETTINGS : WebStorageKey.OFFER_LIST_SETTINGS
			);

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

		case RESET_OFFER_LIST: {
			const { isImpressOfferList } = action;
			const newState = JSON.parse(JSON.stringify(initialState));

			if (isImpressOfferList) {
				newState.filterItems.splice(1, 0, { title: 'Entwurf', count: 0, active: false, key: 'draft', resouceKey: 'draft' });
			}

			return newState;
		}

		case START_FETCHING_OFFER_LIST: {
			return { ...state, isLoading: true };
		}

		case FINISHED_FETCHING_OFFER_LIST: {
			const { offerListData, isImpressOfferList } = action;
			const { count, filter } = offerListData.meta;
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
				isImpressOfferList ? WebStorageKey.OFFER_IMPRESS_LIST_SETTINGS : WebStorageKey.OFFER_LIST_SETTINGS,
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
				offerListData,
				allSelected: false,
				selectedItems: [],
				totalPages,
				filterItems: newFilterItems,
				searchText
			};
		}

		case PAGINATE_OFFER_LIST: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case ERROR_FETCHING_OFFER_LIST: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		case SORT_OFFER_LIST: {
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

		case FILTER_OFFER_LIST: {
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

		case SEARCH_OFFER_LIST: {
			const { searchText } = action;
			return { ...state, isLoading: searchText.trim().length === 0, searchText };
		}

		case SELECT_ITEM: {
			const { offerListData } = state;
			const { id, selected } = action;

			const selectedItems = [];

			offerListData.offers.forEach(offer => {
				if (offer.id === id) {
					offer.selected = selected;
				}

				if (offer.selected) {
					selectedItems.push(offer);
				}
			});

			const allSelected = selectedItems.length === offerListData.offers.length;

			return {
				...state,
				offerListData,
				allSelected,
				selectedItems
			};
		}

		case SELECT_ALL: {
			const { offerListData } = state;
			const { selected } = action;

			offerListData.offers.forEach(offer => {
				offer.selected = selected;
			});

			return {
				...state,
				offerListData,
				allSelected: selected,
				selectedItems: selected ? offerListData.offers : []
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
const initOfferList = isImpressOfferList => {
	return {
		type: INIT_OFFER_LIST,
		isImpressOfferList
	};
};

const resetOfferList = isImpressOfferList => {
	return {
		type: RESET_OFFER_LIST,
		isImpressOfferList
	};
};

const startFetchingOfferList = () => {
	return {
		type: START_FETCHING_OFFER_LIST
	};
};

const finishedFetchingOfferList = (offerListData, isImpressOfferList) => {
	return {
		type: FINISHED_FETCHING_OFFER_LIST,
		offerListData,
		isImpressOfferList
	};
};

const errorFetchingOfferList = () => {
	return {
		type: ERROR_FETCHING_OFFER_LIST
	};
};

const paginate = page => {
	return {
		type: PAGINATE_OFFER_LIST,
		page
	};
};

const sort = clickedColumn => {
	return {
		type: SORT_OFFER_LIST,
		clickedColumn
	};
};

const filter = filterItem => {
	return {
		type: FILTER_OFFER_LIST,
		filterItem
	};
};

const search = searchText => {
	return {
		type: SEARCH_OFFER_LIST,
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

export const fetchOfferList = (reset, isImpressOfferList) => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetOfferList(isImpressOfferList));
		}

		if (!getState().offer.offerList.initialized) {
			dispatch(initOfferList(isImpressOfferList));
		}

		dispatch(startFetchingOfferList());

		const { currentPage, orderBy, sortDirection, currentFilter, searchText } = getState().offer.offerList;

		const limit = 20;
		const offset = (currentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		let queryString = `?offset=${offset}&searchText=${searchText}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}&filter=${currentFilter}`;

		if (isImpressOfferList) {
			queryString += `&type=impress`;
		}

		invoiz
			.request(`${config.resourceHost}offer${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const offers = data.map(offer => {
					return new Offer(offer);
				});
				dispatch(finishedFetchingOfferList({ offers, meta }, isImpressOfferList));
			})
			.catch(() => {
				dispatch(errorFetchingOfferList());
			});
	};
};

export const paginateOfferList = (page, isImpressOfferList) => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchOfferList(false, isImpressOfferList));
	};
};

export const sortOfferList = (column, isImpressOfferList) => {
	return dispatch => {
		dispatch(sort(column));
		dispatch(fetchOfferList(false, isImpressOfferList));
	};
};

export const filterOfferList = (filterItem, isImpressOfferList) => {
	return dispatch => {
		dispatch(filter(filterItem));
		dispatch(fetchOfferList(false, isImpressOfferList));
	};
};

export const searchOfferList = (searchText, isImpressOfferList) => {
	return dispatch => {
		dispatch(search(searchText));

		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			dispatch(fetchOfferList(false, isImpressOfferList));
		}, 500);
	};
};

export const deleteOffer = (id, number, isImpressOfferList) => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		invoiz
			.request(`${config.resourceHost}offer/${id}`, {
				auth: true,
				method: 'DELETE'
			})
			.then(() => {
				invoiz.page.showToast({ message: format(resources.offerDeleteSuccessMessage, number) });
				dispatch(fetchOfferList(false, isImpressOfferList));
			});
	};
};

export const selectOffer = (id, selected) => {
	return dispatch => {
		dispatch(selectItem(id, selected));
	};
};

export const selectAllOffers = selected => {
	return dispatch => {
		dispatch(selectAll(selected));
	};
};

export const deleteSelectedOffers = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().offer.offerList;

		const requests = selectedItems.map(offer => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}offer/${offer.id}`, {
						auth: true,
						method: 'DELETE'
					})
					.then(() => {
						dispatch(finishedProcessingItem(offer.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedProcessingItem(offer.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			dispatch(finishedProcessingSelectedItems());
		});
	};
};

export const acceptSelectedOffers = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().offer.offerList;

		const requests = selectedItems.map(offer => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}offer/${offer.id}/state`, {
						auth: true,
						method: 'PUT',
						data: { state: 'accepted' }
					})
					.then(() => {
						dispatch(finishedProcessingItem(offer.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedProcessingItem(offer.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			dispatch(finishedProcessingSelectedItems());
		});
	};
};

export const rejectSelectedOffers = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().offer.offerList;

		const requests = selectedItems.map(offer => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}offer/${offer.id}/state`, {
						auth: true,
						method: 'PUT',
						data: { state: 'rejected' }
					})
					.then(() => {
						dispatch(finishedProcessingItem(offer.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedProcessingItem(offer.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			dispatch(finishedProcessingSelectedItems());
		});
	};
};

export const setOpenSelectedOffers = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().offer.offerList;

		const requests = selectedItems.map(offer => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}offer/${offer.id}/state`, {
						auth: true,
						method: 'PUT',
						data: { state: 'open' }
					})
					.then(() => {
						dispatch(finishedProcessingItem(offer.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedProcessingItem(offer.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			dispatch(finishedProcessingSelectedItems());
		});
	};
};
