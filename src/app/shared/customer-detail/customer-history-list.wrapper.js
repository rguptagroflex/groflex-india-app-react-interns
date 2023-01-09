import React from 'react';
import CustomerHistoryListComponent from './customer-history-list.component';
import store from 'redux/store';
import { Provider } from 'react-redux';

class CustomerHistoryListWrapper extends React.Component {
	render() {
		return (
			<Provider store={store}>
				<CustomerHistoryListComponent
					customer={this.props.customer}
					forceReload={this.props.forceReload}
					emailStatus={this.props.emailStatus}
					fetchingEmails={this.props.fetchingEmails}
					checkEmailStatus={this.props.checkEmailStatus}
					isImapActivated={this.props.isImapActivated}
				/>
			</Provider>
		);
	}
}

export default CustomerHistoryListWrapper;
