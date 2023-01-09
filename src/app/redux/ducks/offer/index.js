import { combineReducers } from 'redux';
import offerList from './offerList';
import impressTemplates from './impressTemplates';
import impressEdit from './impressEdit';

export default combineReducers({ offerList, impressTemplates, impressEdit });
