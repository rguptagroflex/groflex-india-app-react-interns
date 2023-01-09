import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import PurchaseOrder from 'models/purchase-order.model';
import PurchaseOrderDetailComponent from 'views/purchase-order/purchase-order-detail.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';
import { format } from 'util';
import { errorCodes } from 'helpers/constants';

const { NOT_FOUND } = errorCodes;

class PurchaseOrderDetailWrapper extends React.Component {
    constructor(props) {
		super(props);
		
		this.state = {
			preFetchData: null
		};
	}

    componentDidMount() {
		this.preFetch();
	}

    componentWillUnmount() {
		this.ignoreLastFetch = true;
	}

    preFetch ()  {
		const { resources } = this.props;
		const id = this.props && this.props.match && this.props.match.params && this.props.match.params.id;

		const fetchPurchaseOrderData = () => {
			return Promise.all([invoiz.request(`${config.purchaseOrder.resourceUrl}/${parseInt(id, 10)}`, { auth: true })]);
		};

		const whenRequestsDone = ([purchaseOrderStateResponse]) => {
			const {
				body: {
					data: { purchaseOrder }
				}
			} = purchaseOrderStateResponse;

			try {
				if (!this.ignoreLastFetch) {
					this.setState({
						preFetchData: {
							purchaseOrder: new PurchaseOrder(purchaseOrder)
						}
					});
				}
			} catch (err) {
				console.log(err);
			}
		};

		const onFetchError = error => {
			const errorCode = error.body.meta && error.body.meta.id && error.body.meta.id[0] && error.body.meta.id[0].code;
			if (errorCode === NOT_FOUND) {
				const filteredError = resources.errorCodesWithMessages[errorCode];
				invoiz.showNotification({ message: format(filteredError, resources.str_purchaseOrderUpperCase), type: 'error' });
			} else {
				invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
			}
			invoiz.router.navigate(`/purchase-orders`);
		};

		fetchPurchaseOrderData()
			.then(whenRequestsDone)
			.catch(onFetchError);
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<PurchaseOrderDetailComponent purchaseOrder={preFetchData.purchaseOrder} resources={resources} />
		) : (
			<div className="box main">
				<LoaderComponent text={resources.loadingpurchaseOrder} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(PurchaseOrderDetailWrapper);
