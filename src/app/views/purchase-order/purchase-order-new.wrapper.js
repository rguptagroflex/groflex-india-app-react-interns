import invoiz from 'services/invoiz.service';
import React from 'react';
import _ from 'lodash';
import config from 'config';
import Customer from 'models/customer.model';
import PurchaseOrder from 'models/purchase-order.model';
import Letter from 'models/letter/letter.model';
import { errorCodes } from 'helpers/constants';
import { getPayConditions, getMiscellaneousData } from 'helpers/getSettingsData';
import TransactionEditComponent from 'shared/transaction/transaction-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class PurchaseOrderNewWrapper extends React.Component {
    constructor(props) {
		super(props);
		
		this.state = {
			preFetchData: null
		};
	}

    componentDidMount() {
		this.preFetchPurchaseOrder()
			.then(customerData => {
				this.preFetch(customerData);
			})
			.catch(() => {});
	}

    componentWillUnmount() {
		this.ignoreLastFetch = true;
	}

    preFetchPurchaseOrder () {
		const { resources } = this.props;
		const customerId = this.props && this.props.match && this.props.match.params && this.props.match.params.id;

		return new Promise((resolve, reject) => {
			if (customerId) {
				invoiz
					.request(`${config.resourceHost}customer/${customerId}`, {
						method: 'GET',
						auth: true
					})
					.then(response => {
						const {
							body: { data: customerData }
						} = response;

						resolve(customerData);
					})
					.catch(error => {
						invoiz.router.navigate(`/customer/${customerId}`);

						if (
							error.body.meta.counterLength &&
							error.body.meta.counterLength[0].code === errorCodes.TOO_SMALL
						) {
							invoiz.showNotification({
								type: 'error',
								message: resources.offerNumberRangeExceededMessage
							});

							return;
						}
						this.showNotification({ type: 'error', message: resources.defaultErrorMessage });
					});
			} else {
				resolve(null);
			}
		});
	};

   preFetch (customerData) {
		const { resources } = this.props;
		customerData = typeof customerData === 'string' ? null : customerData;

		Promise.all([
			invoiz.request(config.purchaseOrder.endpoints.getNewPurchaseOrder, { auth: true }),
			invoiz.request(config.settings.endpoints.getNumerationSettings, { auth: true, method: 'GET' }),
			getPayConditions(),
			getMiscellaneousData()
		])
			.then(([newPurchaseOrderResponse, numerationsResponse, payConditionsResponse, miscDataResponse]) => {
				const {
					body: {
						data: { purchaseOrder, letterElements }
					}
				} = newPurchaseOrderResponse;

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
				const purchaseOrderData = new PurchaseOrder(purchaseOrder);
				const letter = new Letter(letterElements);

				if (customerData) {
					purchaseOrderData.setCustomer(new Customer(customerData));
					if (customerData.address.countryIso !== "IN") {
						purchaseOrderData.baseCurrency = customerData.baseCurrency;
						purchaseOrderData.exchangeRate = customerData.exchangeRate;
						purchaseOrderData.priceKind = 'net';
						purchaseOrderData.customerData.indiaState = {};
					}
				} else {
					purchaseOrderData.customerData = _.isEmpty(purchaseOrderData.customerData)
						? undefined
						: Object.assign({}, purchaseOrderData.customerData, { id: purchaseOrderData.customerId });
				}

				try {
					if (!this.ignoreLastFetch) {
						this.setState({
							preFetchData: {
								purchaseOrderData,
								letter,
								numerationOptions,
								miscOptions,
								payConditions,
								isPurchaseOrder: true
							}
						});
					}
				} catch (e) {
					console.log(e);
				}
			})
			.catch(error => {
				invoiz.router.navigate('/purchase-orders');

				if (error.body.meta.counterLength && error.body.meta.counterLength[0].code === errorCodes.TOO_SMALL) {
					invoiz.showNotification({
						type: 'error',
						message: resources.purchaseOrderNumberRangeExceededMessage
					});
					return;
				}

				this.showNotification({ type: 'error', message: resources.defaultErrorMessage });
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
				<LoaderComponent text={resources.loadingpurchaseOrder} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(PurchaseOrderNewWrapper);
