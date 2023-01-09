import React from 'react';
import CustomerListComponent from './customer-list.component';
import store from 'redux/store';
import { Provider } from 'react-redux';
import CustomerListNewComponent from './customer-list-new.component';

class CustomerListWrapper extends React.Component {
    render() {
		return (
			<Provider store={store}>
				<CustomerListNewComponent />
			</Provider>
		);
	}
}

export default CustomerListWrapper;
