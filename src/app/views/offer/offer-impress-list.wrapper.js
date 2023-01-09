import React from 'react';
import OfferListComponent from './offer-list.component';
import store from 'redux/store';
import { Provider } from 'react-redux';

class OfferImpressListWrapper extends React.Component {
    render() {
		return (
			<Provider store={store}>
				<OfferListComponent isImpressOfferList={true} />
			</Provider>
		);
	}
}

export default OfferImpressListWrapper;
