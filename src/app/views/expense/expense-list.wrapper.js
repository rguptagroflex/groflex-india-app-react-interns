import React from 'react';
import ExpenseListNewComponent from './expense-list-new.component';
import store from 'redux/store';
import { Provider } from 'react-redux';

class ExpenseListWrapper extends React.Component {
    render() {
		return (
			<Provider store={store}>
				<ExpenseListNewComponent />
			</Provider>
		);
	}
}

export default ExpenseListWrapper;
