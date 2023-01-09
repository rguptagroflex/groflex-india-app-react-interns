import React from 'react';
import ArticleListComponent from './article-list.component';
import store from 'redux/store';
import { Provider } from 'react-redux';
import ArticleListNewComponent from './article-list-new.component';

class ArticleListWrapper extends React.Component {
    render() {
		return (
			<Provider store={store}>
				<ArticleListNewComponent />
			</Provider>
		);
	}
}

export default ArticleListWrapper;
