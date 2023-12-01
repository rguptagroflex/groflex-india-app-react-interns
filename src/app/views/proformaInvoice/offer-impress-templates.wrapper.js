import React from 'react';
import OfferImpressTemplatesComponent from './offer-impress-templates.component';
import store from 'redux/store';
import { Provider } from 'react-redux';

class OfferImpressTemplatesWrapper extends React.Component {
    render() {
		return (
			<Provider store={store}>
				<OfferImpressTemplatesComponent />
			</Provider>
		);
	}
}

export default OfferImpressTemplatesWrapper;
