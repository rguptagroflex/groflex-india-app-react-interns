import invoiz from 'services/invoiz.service';
import config from 'config';
import { fetchImpressOfferData } from 'helpers/fetchImpressOfferData';
import { getMiscellaneousData } from 'helpers/getSettingsData';
import { addElementButtonPositionFixer } from 'helpers/impress/addElementButtonPositionFixer';
import { generateUuid } from 'helpers/generateUuid';

/*
 * Actions
 */
const START_FETCHING_OFFER_DATA = 'invoiz/offers/impress/START_FETCHING_OFFER_DATA';
const START_FETCHING_BLOCKS_DATA = 'invoiz/offers/impress/START_FETCHING_BLOCKS_DATA';
const FINISHED_FETCHING_OFFER_DATA = 'invoiz/offers/impress/FINISHED_FETCHING_OFFER_DATA';
const ERROR_FETCHING_OFFER_DATA = 'invoiz/offers/impress/ERROR_FETCHING_OFFER_DATA';
const ERROR_FETCHING_BLOCKS_DATA = 'invoiz/offers/impress/ERROR_FETCHING_BLOCKS_DATA';

/*
 * Reducer
 */
const initialState = {
	isLoading: true,
	isLoadingBlocks: true,
	errorOccurred: false,
	blocksErrorOccurred: false,
	offerData: {},
	miscellaneousData: {},
	currentContentBlocks: []
};

export default function reducer(state = initialState, action) {
	let offerData = null;
	let miscellaneousData = null;
	let currentContentBlocks = [];

	switch (action.type) {
		case START_FETCHING_OFFER_DATA:
			return Object.assign({}, state, {
				isLoading: true
			});

		case START_FETCHING_BLOCKS_DATA:
			return Object.assign({}, state, {
				isLoadingBlocks: true
			});

		case FINISHED_FETCHING_OFFER_DATA:
			offerData = action.offerData;
			miscellaneousData = action.miscellaneousData;
			currentContentBlocks = action.currentContentBlocks || [];

			const newState = Object.assign({}, state, {
				isLoading: false,
				errorOccurred: false,
				blocksErrorOccurred: false,
				offerData,
				currentContentBlocks,
				miscellaneousData
			});

			if (action.setBlocksFinishedLoading) {
				newState.isLoadingBlocks = false;
			}

			return newState;

		case ERROR_FETCHING_OFFER_DATA:
			return Object.assign({}, state, {
				isLoading: false,
				errorOccurred: true
			});

		case ERROR_FETCHING_BLOCKS_DATA:
			return Object.assign({}, state, {
				isLoadingBlocks: false,
				blocksErrorOccurred: true
			});

		default:
			return state;
	}
}
/*
 * Action Creators
 */
const startFetchingOfferData = () => {
	return {
		type: START_FETCHING_OFFER_DATA
	};
};

const startFetchingBlocksData = () => {
	return {
		type: START_FETCHING_BLOCKS_DATA
	};
};

const finishedFetchingOfferData = ({
	offerData,
	currentContentBlocks,
	miscellaneousData,
	setBlocksFinishedLoading
}) => {
	return {
		type: FINISHED_FETCHING_OFFER_DATA,
		offerData,
		currentContentBlocks,
		miscellaneousData,
		setBlocksFinishedLoading
	};
};

const errorFetchingOfferData = () => {
	return {
		type: ERROR_FETCHING_OFFER_DATA
	};
};

const errorFetchingBlocksData = () => {
	return {
		type: ERROR_FETCHING_BLOCKS_DATA
	};
};

export const fetchOfferData = offerId => {
	return dispatch => {
		dispatch(startFetchingOfferData());

		fetchImpressOfferData({
			offerId,
			onSuccess: (offerData, blocks) => {
				getMiscellaneousData().then(({ body: { data } }) => {
					if (blocks) {
						blocks.forEach(block => {
							block.tempId = generateUuid();
						});
					}

					dispatch(
						finishedFetchingOfferData({
							offerData,
							currentContentBlocks: blocks,
							miscellaneousData: data,
							setBlocksFinishedLoading: true
						})
					);

					setTimeout(() => {
						window.scrollTo(0, 0);
						addElementButtonPositionFixer();
					}, 0);
				});
			},
			onError: () => {
				dispatch(errorFetchingOfferData());
			}
		});
	};
};

export const getCurrentContentBlocks = (offerId, selectedPage) => {
	return (dispatch, getState) => {
		const offerData = JSON.parse(JSON.stringify(getState().offer.impressEdit.offerData));
		const miscellaneousData = JSON.parse(JSON.stringify(getState().offer.impressEdit.miscellaneousData));

		offerData.pages.forEach(page => {
			page.selected = page.position === selectedPage.position;
		});

		dispatch(startFetchingBlocksData());

		if (selectedPage.id && !selectedPage.isEdited) {
			invoiz
				.request(`${config.resourceHost}impress/${offerId}/pages/${selectedPage.id}`, {
					auth: true
				})
				.then(({ body: { data: { blocks } } }) => {
					offerData.pages.forEach(page => {
						if (page.id === selectedPage.id) {
							page.isEdited = true;
						}
					});

					if (blocks) {
						blocks.forEach(block => {
							block.tempId = generateUuid();
						});
					}

					dispatch(
						finishedFetchingOfferData({
							offerData,
							currentContentBlocks: blocks,
							miscellaneousData,
							setBlocksFinishedLoading: true
						})
					);

					setTimeout(() => {
						window.scrollTo(0, 0);
						addElementButtonPositionFixer();
					}, 0);
				})
				.catch(() => {
					dispatch(errorFetchingBlocksData());
				});
		} else {
			if (selectedPage.blocks) {
				if (selectedPage.blocks) {
					selectedPage.blocks.forEach(block => {
						block.tempId = generateUuid();
					});
				}
			}

			dispatch(
				finishedFetchingOfferData({
					offerData,
					currentContentBlocks: selectedPage.blocks,
					miscellaneousData,
					setBlocksFinishedLoading: true
				})
			);
		}
	};
};

export const updateOfferData = (pages, blocks, globalSettings) => {
	return (dispatch, getState) => {
		const offerData = JSON.parse(JSON.stringify(getState().offer.impressEdit.offerData));
		const miscellaneousData = JSON.parse(JSON.stringify(getState().offer.impressEdit.miscellaneousData));
		const currentBlocks = getState().offer.impressEdit.currentContentBlocks;

		if (pages) {
			offerData.pages = pages;
			blocks = currentBlocks;
		} else if (blocks) {
			offerData.pages.forEach(page => {
				if (page.selected === true) {
					page.blocks = blocks;
				}
			});
		} else if (globalSettings && Object.keys(globalSettings).length > 0) {
			Object.keys(globalSettings).forEach(setting => {
				if (offerData.globalSettings.hasOwnProperty(setting)) {
					offerData.globalSettings[setting] = globalSettings[setting];

					if (!offerData.standardOfferData.impressData) {
						offerData.standardOfferData.impressData = {};
					}

					offerData.standardOfferData.impressData[setting] = globalSettings[setting];
				}
			});

			blocks = currentBlocks;
		}

		dispatch(finishedFetchingOfferData({ offerData, currentContentBlocks: blocks, miscellaneousData }));
	};
};

export const updateOfferCustomerData = (customerData, setCustomerChanged) => {
	return (dispatch, getState) => {
		const offerData = JSON.parse(JSON.stringify(getState().offer.impressEdit.offerData));
		const miscellaneousData = getState().offer.impressEdit.miscellaneousData;
		const blocks = getState().offer.impressEdit.currentContentBlocks;

		offerData.standardOfferData.customerData = customerData;

		if (customerData) {
			offerData.standardOfferData.customerId = customerData.id;
			offerData.standardOfferData.discount = customerData.discount;
		} else {
			offerData.standardOfferData.customerId = undefined;
			offerData.standardOfferData.discount = undefined;
			offerData.standardOfferData.customerContactPersons = undefined;
		}

		if (setCustomerChanged) {
			offerData.standardOfferData.customerDataChanged = true;
		}

		dispatch(finishedFetchingOfferData({ offerData, currentContentBlocks: blocks, miscellaneousData }));
	};
};

export const updateOfferStandardData = standardOfferData => {
	return (dispatch, getState) => {
		const offerData = JSON.parse(JSON.stringify(getState().offer.impressEdit.offerData));
		const miscellaneousData = getState().offer.impressEdit.miscellaneousData;
		const blocks = getState().offer.impressEdit.currentContentBlocks;

		offerData.standardOfferData = standardOfferData;

		dispatch(finishedFetchingOfferData({ offerData, currentContentBlocks: blocks, miscellaneousData }));
	};
};
