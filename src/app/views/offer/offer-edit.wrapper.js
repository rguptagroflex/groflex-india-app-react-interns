import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import _ from 'lodash';
import Offer from 'models/offer.model';
import Letter from 'models/letter/letter.model';
import { getPayConditions, getMiscellaneousData } from 'helpers/getSettingsData';
import TransactionEditComponent from 'shared/transaction/transaction-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class OfferEditWrapper extends React.Component {
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
			invoiz.request(`${config.offer.resourceUrl}/${parseInt(id, 10)}`, { auth: true }),
			invoiz.request(config.settings.endpoints.getNumerationSettings, { auth: true, method: 'GET' }),
			getPayConditions(),
			getMiscellaneousData()
		])
			.then(([editOfferResponse, numerationsResponse, payConditionsResponse, miscDataResponse]) => {
				const {
					body: {
						data: { offer: offerData, letterElements }
					}
				} = editOfferResponse;

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

				const selectedPayCondition = payConditions.find(pc => pc.id === offerData.payConditionId);

				if (!selectedPayCondition) {
					const defaultPayCondition = payConditions.find(pc => pc.isDefault);
					offerData.payConditionId = defaultPayCondition.id;
				}

				const offer = new Offer(offerData);
				const letter = new Letter(letterElements);

				offer.customerData = _.isEmpty(offer.customerData)
					? undefined
					: Object.assign({}, offer.customerData, { id: offer.customerId });
				try {
					if (!this.ignoreLastFetch) {
						this.setState({
							preFetchData: {
								offer,
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
				invoiz.router.navigate('/offers');
				invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
			});
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

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

export default connect(mapStateToProps)(OfferEditWrapper);
