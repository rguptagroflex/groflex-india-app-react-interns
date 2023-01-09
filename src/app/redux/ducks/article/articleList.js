import invoiz from 'services/invoiz.service';
import config from 'config';
import q from 'q';
import Article from 'models/article.model';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';

/*
 * Actions
 */
const INIT_ARTICLE_LIST = 'invoiz/article/INIT_ARTICLE_LIST';
const RESET_ARTICLE_LIST = 'invoiz/article/RESET_ARTICLE_LIST';
const START_FETCHING_ARTICLE_LIST = 'invoiz/article/START_FETCHING_ARTICLE_LIST';
const FINISHED_FETCHING_ARTICLE_LIST = 'invoiz/article/FINISHED_FETCHING_ARTICLE_LIST';
const ERROR_FETCHING_ARTICLE_LIST = 'invoiz/article/ERROR_FETCHING_ARTICLE_LIST';
const SORT_ARTICLE_LIST = 'invoiz/article/SORT_ARTICLE_LIST';
const PAGINATE_ARTICLE_LIST = 'invoiz/article/PAGINATE_ARTICLE_LIST';
const SEARCH_ARTICLE_LIST = 'invoiz/article/SEARCH_CUSTOMER_LIST';
const SELECT_ITEM = 'invoiz/article/SELECT_ITEM';
const SELECT_ALL = 'invoiz/article/SELECT_ALL';
const FINISHED_DELETE_SELECTED = 'invoiz/article/FINISHED_DELETE_SELECTED';
const FINISHED_DELETING_SELECTED_ITEMS = 'invoiz/article/FINISHED_DELETING_SELECTED_ITEMS';

/*
 * Reducer
 */
const initialState = {
	initialized: false,
	isLoading: true,
	allSelected: false,
	selectedItems: [],
	finishedDeletingItems: false,
	errorOccurred: false,
	columns: [
		{ key: 'number', title: 'Nr.', width: '140px', minWidth: '120px', resourceKey: 'serialNumber' },
		{ key: 'title', title: 'Name', sorted: 'desc', resourceKey: 'name' },
		{ key: 'hsnSacCode', title: 'HSN/SAC', resourceKey: 'hsnSacCode' },
		{ key: 'price', title: 'Netto', width: '150px', align: 'right', resourceKey: 'net' },
		{ key: 'priceGross', title: 'Brutto', width: '150px', align: 'right', resourceKey: 'gross' },
		{ key: 'dropdown', title: '', width: '50px', notSortable: true, notClickable: true, resourceKey: '' }
	],
	currentPage: 1,
	totalPages: 1,
	orderBy: 'title',
	sortDirection: 'desc',
	searchText: '',
	articleListData: {
		articles: [],
		meta: {}
	}
};

let searchTimer = null;

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_ARTICLE_LIST: {
			const settings = WebStorageService.getItem(WebStorageKey.ARTICLE_LIST_SETTINGS);

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

		case RESET_ARTICLE_LIST: {
			return { ...initialState };
		}

		case START_FETCHING_ARTICLE_LIST: {
			return { ...state, isLoading: true };
		}

		case FINISHED_FETCHING_ARTICLE_LIST: {
			const { articleListData } = action;
			const { count } = articleListData.meta;
			const totalPages = Math.ceil(count / 20);
			const { searchText } = state;

			const { orderBy, sortDirection } = state;
			WebStorageService.setItem(WebStorageKey.ARTICLE_LIST_SETTINGS, {
				orderBy,
				sortDirection
			});

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				articleListData,
				allSelected: false,
				selectedItems: [],
				totalPages,
				searchText
			};
		}

		case PAGINATE_ARTICLE_LIST: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case ERROR_FETCHING_ARTICLE_LIST: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		case SORT_ARTICLE_LIST: {
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

		case SEARCH_ARTICLE_LIST: {
			const { searchText } = action;
			return { ...state, isLoading: searchText.trim().length === 0, searchText };
		}

		case SELECT_ITEM: {
			const { articleListData } = state;
			const { id, selected } = action;

			const selectedItems = [];

			articleListData.articles.forEach(article => {
				if (article.id === id) {
					article.selected = selected;
				}

				if (article.selected) {
					selectedItems.push(article);
				}
			});

			const allSelected = selectedItems.length === articleListData.articles.length;

			return {
				...state,
				articleListData,
				allSelected,
				selectedItems
			};
		}

		case SELECT_ALL: {
			const { articleListData } = state;
			const { selected } = action;

			articleListData.articles.forEach(article => {
				article.selected = selected;
			});

			return {
				...state,
				articleListData,
				allSelected: selected,
				selectedItems: selected ? articleListData.articles : []
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
			return { ...state, finishedDeletingItems: true };
		}

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const initArticleList = () => {
	return {
		type: INIT_ARTICLE_LIST
	};
};

const startFetchingArticleList = () => {
	return {
		type: START_FETCHING_ARTICLE_LIST
	};
};

const resetArticleList = () => {
	return {
		type: RESET_ARTICLE_LIST
	};
};

const finishedFetchingArticleList = articleListData => {
	return {
		type: FINISHED_FETCHING_ARTICLE_LIST,
		articleListData
	};
};

const errorFetchingArticleList = () => {
	return {
		type: ERROR_FETCHING_ARTICLE_LIST
	};
};

const paginate = page => {
	return {
		type: PAGINATE_ARTICLE_LIST,
		page
	};
};

const sort = clickedColumn => {
	return {
		type: SORT_ARTICLE_LIST,
		clickedColumn
	};
};

const search = searchText => {
	return {
		type: SEARCH_ARTICLE_LIST,
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

const finishedDeletingSelectedItems = () => {
	return {
		type: FINISHED_DELETING_SELECTED_ITEMS
	};
};

export const fetchArticleList = reset => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetArticleList());
		}

		if (!getState().article.articleList.initialized) {
			dispatch(initArticleList());
		}

		dispatch(startFetchingArticleList());

		const { currentPage, orderBy, sortDirection, searchText } = getState().article.articleList;

		const limit = 20;
		const offset = (currentPage - 1) * limit;
		const isDesc = sortDirection === 'desc';
		const queryString = `?offset=${offset}&searchText=${searchText}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}`;

		invoiz
			.request(`${config.resourceHost}article${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const articles = data.map(article => {
					return new Article(article);
				});
				dispatch(finishedFetchingArticleList({ articles, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingArticleList());
			});
	};
};

export const paginateArticleList = page => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchArticleList());
	};
};

export const sortArticleList = column => {
	return dispatch => {
		dispatch(sort(column));
		dispatch(fetchArticleList());
	};
};

export const searchArticleList = searchText => {
	return dispatch => {
		dispatch(search(searchText));

		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			dispatch(fetchArticleList());
		}, 500);
	};
};

export const deleteArticle = id => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		invoiz
			.request(`${config.resourceHost}article/${id}`, {
				auth: true,
				method: 'DELETE'
			})
			.then(() => {
				invoiz.page.showToast({ message: resources.articleDeleteSuccessMessage });
				dispatch(fetchArticleList());
			});
	};
};

export const selectArticle = (id, selected) => {
	return dispatch => {
		dispatch(selectItem(id, selected));
	};
};

export const selectAllArticles = selected => {
	return dispatch => {
		dispatch(selectAll(selected));
	};
};

export const deleteSelectedArticles = () => {
	return (dispatch, getState) => {
		const { selectedItems } = getState().article.articleList;

		const requests = selectedItems.map(article => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}article/${article.id}`, {
						auth: true,
						method: 'DELETE'
					})
					.then(() => {
						dispatch(finishedDeletingItem(article.id, true));
						resolve();
					})
					.catch(err => {
						dispatch(finishedDeletingItem(article.id, false));
						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			dispatch(finishedDeletingSelectedItems());
		});
	};
};
