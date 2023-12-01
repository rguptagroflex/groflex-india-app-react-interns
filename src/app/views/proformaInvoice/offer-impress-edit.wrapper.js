import React from 'react';
import OfferImpressEditComponent from './offer-impress-edit.component';
import store from 'redux/store';
import { Provider } from 'react-redux';

class OfferListWrapper extends React.Component {
    render() {
		const id = this.props && this.props.match && this.props.match.params && this.props.match.params.id;

		return (
			<Provider store={store}>
				<OfferImpressEditComponent offerId={id} />
			</Provider>
		);
	}
}

export default OfferListWrapper;
