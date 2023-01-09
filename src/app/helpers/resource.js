import store from 'redux/store';

export const getResource = (key) => {
	const state = store.getState();
	const resources = state.language.lang.resources;
	return resources[key];
};

export const getFullResources = () => {
	const state = store.getState();
	const resources = state.language.lang.resources;
	return resources;
};
