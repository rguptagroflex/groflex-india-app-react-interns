/*
 * Actions
 */
const USER_LOGOUT = "invoiz/global/USER_LOGOUT";

const SIDEBAR_VISIBLE_HOVER = "invoiz/global/SIDEBAR_VISIBLE_HOVER";
const SIDEBAR_VISIBLE_STATIC = "invoiz/global/SIDEBAR_VISIBLE_STATIC";

/*
 * Reducer
 */
const initialState = {
	isLoggedOut: false,

	sideBarVisibleHover: {
		invoices: { name: "invoices", sidebarVisible: false },
		expenditure: { name: "expenditure", sidebarVisible: false },
	},
	sideBarVisibleStatic: {
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

		case SIDEBAR_VISIBLE_HOVER:
			return Object.assign({}, state, {
				sideBarVisibleHover: action.payload,
			});
		case SIDEBAR_VISIBLE_STATIC:
			return Object.assign({}, state, {
				sideBarVisibleStatic: action.payload,
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

export const setSideBarVisibleStatic = (payload) => {
	// console.log(payload);
	return (dispatch, getstate) => {
		dispatch({
			type: SIDEBAR_VISIBLE_STATIC,
			payload,
		});
		// console.log("global state is :", payload);
	};
};
