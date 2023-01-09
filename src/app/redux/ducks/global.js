/*
 * Actions
 */
const USER_LOGOUT = 'invoiz/global/USER_LOGOUT';

/*
 * Reducer
 */
const initialState = {
	isLoggedOut: false
};

export default function reducer(state = initialState, action) {
	switch (action.type) {
		case USER_LOGOUT:
			return Object.assign({}, state, {
				isLoggedOut: true
			});
		default:
			return state;
	}
}
/*
 * Action Creators
 */
export const userLoggedOut = () => {
	return dispatch => {
		dispatch({
			type: USER_LOGOUT
		});
	};
};
