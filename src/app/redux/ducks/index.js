import { combineReducers } from 'redux';
import newsfeed from './newsfeed';
import dashboard from './dashboard';
import global from './global';
import settings from './settings';
import expense from './expense';
import article from './article';
import offer from './offer';
import purchaseOrder from './purchase-order';
import customer from './customer';
import invoice from './invoice';
import recurringInvoice from './recurring-invoice';
import project from './project';
import timetracking from './timetracking';
import admin from './admin';
import banking from './banking';
import language from './language';
import countryState from './countryState';

import registrationOnboarding from './registrationOnboarding'

const appReducer = combineReducers({
	global,
	dashboard,
	expense,
	article,
	customer,
	offer,
	purchaseOrder,
	invoice,
	recurringInvoice,
	newsfeed,
	settings,
	timetracking,
	project,
	admin,
	banking,
	language,
	countryState,
	registrationOnboarding
});

const rootReducer = (state, action) => {
	if (action.type === 'invoiz/global/USER_LOGOUT') {
		// state = undefined; // here we did not reset the language state property
		state = {
			language: state.language
		};
	}
	return appReducer(state, action);
};

export default rootReducer;
