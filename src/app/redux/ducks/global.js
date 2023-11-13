/*
 * Actions
 */
const USER_LOGOUT = "invoiz/global/USER_LOGOUT";
const SUBMENU_VISIBLE = "invoiz/global/SUBMENU_VISIBLE";
const SIDEBAR_VISIBLE_HOVER = "invoiz/global/SIDEBAR_VISIBLE_HOVER";

/*
 * Reducer
 */
const initialState = {
	isLoggedOut: false,
	isSubmenuVisible: false,
	sideBarVisibleHover: {
		invoices: { name: "invoices", sidebarVisible: false },
		expenditure: { name: "expenditure", sidebarVisible: false },
	},
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case USER_LOGOUT:
			return Object.assign({}, state, {
				isLoggedOut: true,
			});
		case SUBMENU_VISIBLE:
			return Object.assign({}, state, {
				isSubmenuVisible: action.payload,
			});
		case SIDEBAR_VISIBLE_HOVER:
			return Object.assign({}, state, {
				sideBarVisibleHover: action.payload,
			});

		default:
			return state;
	}
}
/*
 * Action Creators
 */
export const userLoggedOut = () => {
	return (dispatch) => {
		dispatch({
			type: USER_LOGOUT,
		});
	};
};

export const setSubmenuVisibleGlobal = (payload) => {
	// console.log(payload);
	return (dispatch, getstate) => {
		dispatch({
			type: SUBMENU_VISIBLE,
			payload,
		});
		// console.log("global state is :", getstate());
	};
};

export const setSideBarVisibleHover = (payload) => {
	// console.log(payload);
	return (dispatch, getstate) => {
		dispatch({
			type: SIDEBAR_VISIBLE_HOVER,
			payload,
		});
		// console.log("global state is :", payload);
	};
};
