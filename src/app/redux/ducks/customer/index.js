import { combineReducers } from 'redux';
import customerList from './customerList';
import customerHistoryList from './customerHistoryList';
import customerDocumentList from './customerDocumentList';

export default combineReducers({ customerList, customerHistoryList, customerDocumentList });
