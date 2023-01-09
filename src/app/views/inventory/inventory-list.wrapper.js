import React from 'react';
import store from 'redux/store';
import { Provider } from 'react-redux';
import InventoryListNewComponent from './inventory-list-new.component';

class InventoryListWrapper extends React.Component {
    render() {
		return (
			<Provider store={store}>
				<InventoryListNewComponent />
			</Provider>
		);
	}
}

export default InventoryListWrapper;
