import { combineReducers } from 'redux';
import articleList from './articleList';
import articleHistoryList from './articleHistoryList';

export default combineReducers({ articleList, articleHistoryList });
