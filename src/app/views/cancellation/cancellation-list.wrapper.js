import React from 'react';
import CancellationListComponent from './cancellation-list.component';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import store from 'redux/store';
import { Provider, connect } from 'react-redux';
class CancellationListWrapper extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const { resources, location } = this.props;
		let cancelType = location.pathname === "/expenses/cancellations" ? 'debitNotes' : 'creditNotes'
		return (
			<Provider store={store}>
				{
					<CancellationListComponent resources={resources} cancelType={cancelType}/>
				}
			</Provider>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return {
		resources
	};
};

export default connect(mapStateToProps)(CancellationListWrapper);
