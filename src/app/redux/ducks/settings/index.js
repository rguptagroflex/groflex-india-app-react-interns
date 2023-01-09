import { combineReducers } from 'redux';
import bankAccountSetup from './bankAccountSetup';
import documentExport from './documentExport';

export default combineReducers({
	bankAccountSetup,
	documentExport
});
