import React from 'react';
import store from 'redux/store';
import { Provider } from 'react-redux';
import ChartofaccountNewComponent from './chartofaccount-list-new-component';

class ChartofaccountListWrapper extends React.Component {
    render() {
		return (
			<Provider store={store}>
				<ChartofaccountNewComponent />
			</Provider>
		);
	}
}

export default ChartofaccountListWrapper;
