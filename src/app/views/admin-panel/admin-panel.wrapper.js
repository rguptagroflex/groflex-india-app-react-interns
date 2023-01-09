import React from 'react';
import AdminPanelComponent from './admin-panel.component';
import store from 'redux/store';
import { Provider } from 'react-redux';

class AdminPanelWrapper extends React.Component {
    render() {
		return (
			<Provider store={store}>
				<AdminPanelComponent />
			</Provider>
		);
	}
}

export default AdminPanelWrapper;
