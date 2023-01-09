import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import _ from 'lodash';
import PurchaseOrder from 'models/purchase-order.model';
import Letter from 'models/letter/letter.model';
import { getPayConditions, getMiscellaneousData } from 'helpers/getSettingsData';
import TransactionEditComponent from 'shared/transaction/transaction-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class PurchaseOrderEditWrapper extends React.Component {
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

		if (!id) return;

		Promise.all([
			invoiz.request(`${config.purchaseOrder.resourceUrl}/${parseInt(id, 10)}`, { auth: true }),
			invoiz.request(config.settings.endpoints.getNumerationSettings, { auth: true, method: 'GET' }),
			getPayConditions(),
			getMiscellaneousData()
		])
			.then(([editPurchaseOrderResponse, numerationsResponse, payConditionsResponse, miscDataResponse]) => {
				const {
					body: {
						data: { purchaseOrder, letterElements }
					}
				} = editPurchaseOrderResponse;

				const {
					body: {
						data: { purchaseOrder: numerationOptions }
					}
				} = numerationsResponse;

				const {
					body: { data: miscOptions }
				} = miscDataResponse;

				const {
					body: { data: payConditions }
				} = payConditionsResponse;

				const selectedPayCondition = payConditions.find(pc => pc.id === purchaseOrder.payConditionId);

				if (!selectedPayCondition) {
					const defaultPayCondition = payConditions.find(pc => pc.isDefault);
					purchaseOrder.payConditionId = defaultPayCondition.id;
				}

				const purchaseOrderData = new PurchaseOrder(purchaseOrder);
				const letter = new Letter(letterElements);

				purchaseOrderData.customerData = _.isEmpty(purchaseOrderData.customerData)
					? undefined
					: Object.assign({}, purchaseOrderData.customerData, { id: purchaseOrderData.customerId });

				try {
					if (!this.ignoreLastFetch) {
						this.setState({
							preFetchData: {
								purchaseOrderData,
								letter,
								numerationOptions,
								miscOptions,
								payConditions
							}
						});
					}
				} catch (e) {
					console.log(e);
				}
			})
			.catch(() => {
				invoiz.router.navigate('/purchase-orders');
				invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
			});
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<TransactionEditComponent
				transaction={preFetchData.purchaseOrderData}
				letter={preFetchData.letter}
				numerationOptions={preFetchData.numerationOptions}
				miscOptions={preFetchData.miscOptions}
				payConditions={preFetchData.payConditions}
				isPurchaseOrder={true}
				resources={ resources }
			/>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.loadingPurchaseOrder} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(PurchaseOrderEditWrapper);
