import React from 'react';
import RecurringInvoiceListComponent from './recurring-invoice-list.component';
import store from 'redux/store';
import { Provider } from 'react-redux';
import RecurringInvoiceListNewComponent from './recurring-invoice-list-new.component';

class RecurringInvoiceListWrapper extends React.Component {
    render() {
		return (
			<Provider store={store}>
				<RecurringInvoiceListNewComponent />
			</Provider>
		);
	}
}

export default RecurringInvoiceListWrapper;
