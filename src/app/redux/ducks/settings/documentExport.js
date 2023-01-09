import invoiz from 'services/invoiz.service';
import config from 'config';
import DocumentExportItem from 'models/settings/document-export-item.model';

const FETCH_COUNT = 5;

/*
 * Actions
 */
const INIT_DOCUMENT_EXPORT = 'invoiz/settings/documentExport/INIT_DOCUMENT_EXPORT';
const RESET_DOCUMENT_EXPORT = 'invoiz/settings/documentExport/RESET_DOCUMENT_EXPORT';
const START_FETCHING_DOCUMENT_EXPORT = 'invoiz/settings/documentExport/START_FETCHING_DOCUMENT_EXPORT';
const FINISHED_FETCHING_DOCUMENT_EXPORT = 'invoiz/settings/documentExport/FINISHED_FETCHING_DOCUMENT_EXPORT';
const ERROR_FETCHING_DOCUMENT_EXPORT = 'invoiz/settings/documentExport/ERROR_FETCHING_DOCUMENT_EXPORT';
const PAGINATE_DOCUMENT_EXPORT = 'invoiz/settings/documentExport/PAGINATE_DOCUMENT_EXPORT';
const UPDATE_DOCUMENT_EXPORT_ITEM = 'invoiz/settings/documentExport/UPDATE_DOCUMENT_EXPORT_ITEM';

/*
 * Reducer
 */
const initialState = {
	initialized: false,
	isLoading: true,
	errorOccurred: false,
	columns: [
		{ key: 'createdAt', title: 'Datum', width: '110px', resourceKey: 'date' },
		{ key: 'exportPeriod', title: 'Exportzeitraum', width: '200px', resourceKey: 'exportPeriod' },
		{ key: 'exportFormat', title: 'Inhalte', width: '120px', resourceKey: 'exportFormat' },
		{ key: 'type', title: 'Inhalte', width: '110px', resourceKey: 'type' },
		{ key: 'actions', title: 'Aktionen', resourceKey: 'actions' }
	],
	currentPage: 1,
	totalPages: 1,
	orderBy: 'createdAt',
	sortDirection: 'desc',
	documentExportData: {
		data: [],
		meta: {}
	}
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case INIT_DOCUMENT_EXPORT: {
			return { ...state, initialized: true };
		}

		case RESET_DOCUMENT_EXPORT: {
			return { ...initialState };
		}

		case START_FETCHING_DOCUMENT_EXPORT: {
			return { ...state, isLoading: true };
		}

		case FINISHED_FETCHING_DOCUMENT_EXPORT: {
			const { documentExportData } = action;
			const { count } = documentExportData.meta;
			const totalPages = Math.ceil(count / FETCH_COUNT);

			return {
				...state,
				isLoading: false,
				errorOccurred: false,
				documentExportData,
				totalPages
			};
		}

		case UPDATE_DOCUMENT_EXPORT_ITEM: {
			let documentExportData = state.documentExportData && JSON.parse(JSON.stringify(state.documentExportData));
			const { updatedDocumentExportItem } = action;

			if (documentExportData && documentExportData.data) {
				documentExportData.data.forEach((item, idx) => {
					if (item.id === updatedDocumentExportItem.id) {
						documentExportData.data[idx] = new DocumentExportItem(updatedDocumentExportItem);
					} else {
						documentExportData.data[idx] = new DocumentExportItem(item);
					}
				});
			} else {
				documentExportData = JSON.parse(JSON.stringify(initialState.documentExportData));
			}

			return { ...state, documentExportData };
		}

		case PAGINATE_DOCUMENT_EXPORT: {
			const { page } = action;
			return { ...state, currentPage: page };
		}

		case ERROR_FETCHING_DOCUMENT_EXPORT: {
			return { ...state, isLoading: false, errorOccurred: true };
		}

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const initDocumentExportList = () => {
	return {
		type: INIT_DOCUMENT_EXPORT
	};
};

const resetDocumentExportList = () => {
	return {
		type: RESET_DOCUMENT_EXPORT
	};
};

const startFetchingDocumentExportList = () => {
	return {
		type: START_FETCHING_DOCUMENT_EXPORT
	};
};

const finishedFetchingDocumentExportList = documentExportData => {
	return {
		type: FINISHED_FETCHING_DOCUMENT_EXPORT,
		documentExportData
	};
};

const errorFetchingDocumentExportList = () => {
	return {
		type: ERROR_FETCHING_DOCUMENT_EXPORT
	};
};

const paginate = page => {
	return {
		type: PAGINATE_DOCUMENT_EXPORT,
		page
	};
};

const updateDocumentExportItem = updatedDocumentExportItem => {
	return {
		type: UPDATE_DOCUMENT_EXPORT_ITEM,
		updatedDocumentExportItem
	};
};

const checkStatus = id => {
	return invoiz.request(`${config.settings.endpoints.accountantExportUrl}${id}`, { auth: true }).then(response => {
		const { data } = response.body;
		return data;
	});
};

const setIntervalForStatusCheck = (dispatch, documentExportItem, timer) => {
	if (documentExportItem.pendingUpdatesTimeout) {
		window.clearTimeout(documentExportItem.pendingUpdatesTimeout);
	}

	if (documentExportItem.status !== 'pending') {
		return;
	}

	documentExportItem.pendingUpdatesTimeout = window.setTimeout(() => {
		checkStatus(documentExportItem.id).then(item => {
			if (item.status === 'pending') {
				setIntervalForStatusCheck(dispatch, documentExportItem, 2);
			} else {
				window.clearTimeout(documentExportItem.pendingUpdatesTimeout);
			}

			dispatch(updateDocumentExportItem(item));
		});
	}, timer * 1000);
};

export const fetchDocumentExportList = reset => {
	return (dispatch, getState) => {
		if (reset) {
			dispatch(resetDocumentExportList());
		}

		if (!getState().settings.documentExport.initialized) {
			dispatch(initDocumentExportList());
		}

		dispatch(startFetchingDocumentExportList());

		const { currentPage } = getState().settings.documentExport;

		const limit = FETCH_COUNT;
		const offset = (currentPage - 1) * limit;
		const queryString = `?offset=${offset}&limit=${limit}&orderBy=createdAt&desc=true`;

		invoiz
			.request(`${config.settings.endpoints.accountantExportUrl}${queryString}`, {
				auth: true
			})
			.then(({ body: { data, meta } }) => {
				const itemData = data.map(documentExportItem => {
					const item = new DocumentExportItem(documentExportItem);
					setIntervalForStatusCheck(dispatch, item, 1);
					return item;
				});

				dispatch(finishedFetchingDocumentExportList({ data: itemData, meta }));
			})
			.catch(() => {
				dispatch(errorFetchingDocumentExportList());
			});
	};
};

export const paginateDocumentExportList = page => {
	return dispatch => {
		dispatch(paginate(page));
		dispatch(fetchDocumentExportList());
	};
};

export const updateDocumentExportList = item => {
	return dispatch => {
		dispatch(updateDocumentExportItem(item));
	};
};
