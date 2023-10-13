/*
 * Actions
 */
const USER_LOGOUT = "invoiz/global/USER_LOGOUT";
const SUBMENU_VISIBLE = "invoiz/global/SUBMENU_VISIBLE";

/*
 * Reducer
 */
const initialState = {
	isLoggedOut: false,
	isSubmenuVisible: false,
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

export const submenuVisible = (payload) => {
	// console.log(payload);
	return (dispatch, getstate) => {
		dispatch({
			type: SUBMENU_VISIBLE,
			payload,
		});
		// console.log("global state is :", getstate());
	};
};
