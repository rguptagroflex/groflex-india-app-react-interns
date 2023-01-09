import invoiz from 'services/invoiz.service';
import React from 'react';
import _ from 'lodash';
import config from 'config';
import Customer from 'models/customer.model';
import Offer from 'models/offer.model';
import Letter from 'models/letter/letter.model';
import { errorCodes } from 'helpers/constants';
import { getPayConditions, getMiscellaneousData } from 'helpers/getSettingsData';
import TransactionEditComponent from 'shared/transaction/transaction-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';
import userPermissions from 'enums/user-permissions.enum';
import planPermissions from 'enums/plan-permissions.enum';
import ChargebeePlan from '../../enums/chargebee-plan.enum';
import RestrictedOverlayComponent from 'shared/overlay/restricted-overlay.component';
class OfferNewWrapper extends React.Component {
    constructor(props) {
		super(props);
		
		this.state = {
			preFetchData: null,
			canCreateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_OFFER),
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_OFFER),
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
		};
	}

    componentDidMount() {
		this.preFetchCustomer()
			.then(customerData => {
				this.preFetch(customerData);
			})
			.catch(() => {});
	}

    componentWillUnmount() {
		this.ignoreLastFetch = true;
	}

    preFetchCustomer ()  {
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
			invoiz.request(config.offer.endpoints.getNewOffer, { auth: true }),
			invoiz.request(config.settings.endpoints.getNumerationSettings, { auth: true, method: 'GET' }),
			getPayConditions(),
			getMiscellaneousData()
		])
			.then(([newOfferResponse, numerationsResponse, payConditionsResponse, miscDataResponse]) => {
				const {
					body: {
						data: { offer: offerData, letterElements }
					}
				} = newOfferResponse;

				const {
					body: {
						data: { offer: numerationOptions }
					}
				} = numerationsResponse;

				const {
					body: { data: miscOptions }
				} = miscDataResponse;

				const {
					body: { data: payConditions }
				} = payConditionsResponse;

				const offer = new Offer(offerData);
				const letter = new Letter(letterElements);

				if (customerData) {
					offer.setCustomer(new Customer(customerData));
					if (customerData.address.countryIso !== "IN") {
						offer.baseCurrency = customerData.baseCurrency;
						offer.exchangeRate = customerData.exchangeRate;
						offer.priceKind = 'net';
						offer.customerData.indiaState = {};
					}
				} else {
					offer.customerData = _.isEmpty(offer.customerData)
						? undefined
						: Object.assign({}, offer.customerData, { id: offer.customerId });
				}
				try {
					if (!this.ignoreLastFetch) {
						this.setState({
							preFetchData: {
								offer,
								letter,
								numerationOptions,
								miscOptions,
								payConditions,
								isOffer: true
							}
						});
					}
				} catch (e) {
					console.log(e);
				}
			})
			.catch(error => {
				invoiz.router.navigate('/offers');

				if (error.body.meta.counterLength && error.body.meta.counterLength[0].code === errorCodes.TOO_SMALL) {
					invoiz.showNotification({
						type: 'error',
						message: resources.offerNumberRangeExceededMessage
					});
					return;
				}

				this.showNotification({ type: 'error', message: resources.defaultErrorMessage });
			});
	};

    render() {
		const { preFetchData, canCreateOffer, planRestricted, canChangeAccountData } = this.state;
		const { resources } = this.props;

		// if(!canCreateOffer || planRestricted){
		// 	invoiz.router.navigate('/offers')
		// }

		return preFetchData ? (
			<TransactionEditComponent
				transaction={preFetchData.offer}
				letter={preFetchData.letter}
				numerationOptions={preFetchData.numerationOptions}
				miscOptions={preFetchData.miscOptions}
				payConditions={preFetchData.payConditions}
				isOffer={true}
				resources={ resources }
			/>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.offerLoadingOffer} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(OfferNewWrapper);
