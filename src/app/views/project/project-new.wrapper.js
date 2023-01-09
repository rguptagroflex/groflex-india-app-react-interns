import invoiz from 'services/invoiz.service';
import React from 'react';
import _ from 'lodash';
import config from 'config';
import Invoice from 'models/invoice.model';
import Letter from 'models/letter/letter.model';
import Project from 'models/project.model';
import { getPayConditions, getMiscellaneousData } from 'helpers/getSettingsData';
import TransactionEditComponent from 'shared/transaction/transaction-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class ProjectNewWrapper extends React.Component {
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
		const offerId = this.props && this.props.match && this.props.match.params && this.props.match.params.offerId;

		const requests = [
			invoiz.request(config.depositInvoice.endpoints.createNewDepositInvoice, { auth: true, method: 'GET' }),
			invoiz.request(config.settings.endpoints.getNumerationSettings, { auth: true, method: 'GET' }),
			getPayConditions(),
			getMiscellaneousData(),
			invoiz.request(`${config.resourceHost}tenant/payment/setting`, { auth: true }),
			invoiz.request(config.settings.endpoints.account, { auth: true, method: 'GET' })
		];

		if (offerId) {
			requests.push(invoiz.request(`${config.resourceHost}offer/${offerId}`, { auth: true, method: 'GET' }));
		}

		Promise.all(requests)
			.then(
				([
					newInvoiceResponse,
					numerationsResponse,
					payConditionsResponse,
					miscDataResponse,
					paymentSettingResponse,
					accountResponse,
					offerResponse
				]) => {
					const {
						body: {
							data: { invoice: invoiceData, letterElements }
						}
					} = newInvoiceResponse;

					const {
						body: {
							data: { invoice: numerationOptions }
						}
					} = numerationsResponse;

					const {
						body: { data: miscOptions }
					} = miscDataResponse;

					const {
						body: { data: payConditions }
					} = payConditionsResponse;

					const {
						body: { data: accountData }
					} = accountResponse;

					const {
						body: { data: paymentSetting }
					} = paymentSettingResponse;

					const invoice = new Invoice(invoiceData);
					const letter = new Letter(letterElements);

					if (!invoice.invoizPayData) {
						invoice.setInvoizPayData(accountData);
					}

					let offerData;
					if (offerResponse) {
						const {
							body: {
								data: { offer }
							}
						} = offerResponse;
						offerData = offer;
						invoice.customerData = offer.customerData;
						invoice.customerId = offer.customerId;
					}

					invoice.customerData = _.isEmpty(invoice.customerData)
						? undefined
						: Object.assign({}, invoice.customerData, { id: invoice.customerId });

					const project = new Project();

					if (offerData) {
						project.offerId = offerData.id;
						project.customerId = offerData.customerId;
						project.customer = offerData.customerData;
						project.budget = offerData.totalNet;
						project.startDate = offerData.date;
						project.offerNumber = offerData.number;
					}

					invoice.positions.forEach(position => {
						position.discountPercent = 0;
						position.priceNet = 0;
						position.priceGross = 0;
						position.priceNetAfterDiscount = 0;
						position.priceGrossAfterDiscount = 0;
						position.totalNet = 0;
						position.totalGross = 0;
						position.totalNetAfterDiscount = 0;
						position.totalGrossAfterDiscount = 0;
						position.showDescription = true;
						position.description = '';
					});

					try {
						if (!this.ignoreLastFetch) {
							this.setState({
								preFetchData: {
									invoice,
									letter,
									numerationOptions,
									miscOptions,
									payConditions,
									paymentSetting,
									project
								}
							});
						}
					} catch (e) {
						console.log(e);
					}
				}
			)
			.catch(() => {
				invoiz.router.navigate('/invoices/project');
				invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
			});
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<TransactionEditComponent
				transaction={preFetchData.invoice}
				letter={preFetchData.letter}
				numerationOptions={preFetchData.numerationOptions}
				miscOptions={preFetchData.miscOptions}
				payConditions={preFetchData.payConditions}
				paymentSetting={preFetchData.paymentSetting}
				isProject={true}
				project={preFetchData.project}
				resources={ resources }
			/>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.projectLoadingProject} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(ProjectNewWrapper);
