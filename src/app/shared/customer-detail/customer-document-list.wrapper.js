import React from 'react';
import CustomerDocumentListComponent from './customer-document-list.component';
import store from 'redux/store';
import { Provider } from 'react-redux';

class CustomerDocumentListWrapper extends React.Component {
	render() {
		return (
			<Provider store={store}>
				<CustomerDocumentListComponent customer={this.props.customer} />
			</Provider>
		);
	}
}

export default CustomerDocumentListWrapper;
