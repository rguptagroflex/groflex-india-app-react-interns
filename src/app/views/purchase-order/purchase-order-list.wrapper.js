import React from 'react';
import { Provider } from 'react-redux';
import PurchaseOrderListComponent from './purchase-order-list.component';
import store from 'redux/store';
import PurchaseOrderListNewComponent from './purchase-order-list-new.component';

class PurchaseOrderListWrapper extends React.Component {
    render() {
		return <Provider store={store}>
			<PurchaseOrderListNewComponent isImpressOfferList={false} />
		</Provider>;
	}
}

export default PurchaseOrderListWrapper;
