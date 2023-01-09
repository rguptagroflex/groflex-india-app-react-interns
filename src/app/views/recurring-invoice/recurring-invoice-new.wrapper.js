import invoiz from 'services/invoiz.service';
import React from 'react';
import _ from 'lodash';
import config from 'config';
import Invoice from 'models/invoice.model';
import Letter from 'models/letter/letter.model';
import RecurringInvoice from 'models/recurring-invoice.model';
import { getPayConditions, getMiscellaneousData, getTextModules } from 'helpers/getSettingsData';
import TransactionEditComponent from 'shared/transaction/transaction-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';
import Customer from 'models/customer.model';
class RecurringInvoiceNewWrapper extends React.Component {
    constructor(props) {
		super(props);
		
		this.state = {
			preFetchData: null
		};
	}

    componentDidMount() {
		// this.preFetch();
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
					.catch(err => {
						invoiz.router.navigate(`/customer/${customerId}`);
						invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
						reject(err);
					});
			} else {
				resolve(null);
			}
		});
	};

    preFetch (customerData)  {
		const { resources } = this.props;
		customerData = typeof customerData === 'string' ? null : customerData;
		Promise.all([
			invoiz.request(config.invoice.endpoints.getNewInvoice, { auth: true }),
			invoiz.request(config.settings.endpoints.getNumerationSettings, { auth: true, method: 'GET' }),
			getPayConditions(),
			getMiscellaneousData(),
			getTextModules(),
			invoiz.request(`${config.resourceHost}tenant/payment/setting`, { auth: true }),
			invoiz.request(config.settings.endpoints.account, { auth: true, method: 'GET' })
		])
			.then(
				([
					newInvoiceResponse,
					numerationsResponse,
					payConditionsResponse,
					miscDataResponse,
					textModulesResponse,
					paymentSettingResponse,
					accountResponse
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

					const {
						body: {
							data: { recurringInvoice: textModule }
						}
					} = textModulesResponse;

					const invoice = new Invoice(invoiceData);
					const letter = new Letter(letterElements);

					const recurringInvoice = new RecurringInvoice({
						mailContent: textModule.email,
						subject: textModule.emailSubject
					});

					if (!invoice.invoizPayData) {
						invoice.setInvoizPayData(accountData);
					}

					if (customerData) {
						invoice.setCustomer(new Customer(customerData));
						if (customerData.address.countryIso !== "IN") {
							invoice.baseCurrency = customerData.baseCurrency;
							invoice.exchangeRate = customerData.exchangeRate;
							invoice.priceKind = 'net';
							invoice.customerData.indiaState = {};
						}
					} else {
					invoice.customerData = _.isEmpty(invoice.customerData)
						? undefined
						: Object.assign({}, invoice.customerData, { id: invoice.customerId });
					}

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
									isRecurring: true,
									recurringInvoice
								}
							});
						}
					} catch (e) {
						console.log(e);
					}
				}
			)
			.catch(() => {
				invoiz.router.navigate('/invoices/recurringInvoice');
				invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
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
				isRecurring={true}
				recurringInvoice={preFetchData.recurringInvoice}
				resources={ resources }
			/>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.recurringLoadingSubscriptionInvoice} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(RecurringInvoiceNewWrapper);
