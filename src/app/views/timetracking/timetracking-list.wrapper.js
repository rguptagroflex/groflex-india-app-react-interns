import React from 'react';
import TimetrackingListComponent from './timetracking-list.component';
import store from 'redux/store';
import { Provider } from 'react-redux';
import TimetrackingListNewComponent from './timetracking-list-new.component';
class TimetrackingListWrapper extends React.Component {
    render() {
		return (
			<Provider store={store}>
				<TimetrackingListNewComponent />
			</Provider>
		);
	}
}

export default TimetrackingListWrapper;
