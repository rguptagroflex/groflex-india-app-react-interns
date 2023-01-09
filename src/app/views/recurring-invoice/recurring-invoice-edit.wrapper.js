import invoiz from 'services/invoiz.service';
import React from 'react';
import _ from 'lodash';
import config from 'config';
import Invoice from 'models/invoice.model';
import Letter from 'models/letter/letter.model';
import RecurringInvoice from 'models/recurring-invoice.model';
import { getPayConditions, getMiscellaneousData } from 'helpers/getSettingsData';
import TransactionEditComponent from 'shared/transaction/transaction-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class RecurringInvoiceEditWrapper extends React.Component {
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
			invoiz.request(`${config.resourceHost}recurringInvoice/${id}`, { auth: true, method: 'GET' }),
			invoiz.request(config.settings.endpoints.getNumerationSettings, { auth: true, method: 'GET' }),
			getPayConditions(),
			getMiscellaneousData(),
			invoiz.request(`${config.resourceHost}tenant/payment/setting`, { auth: true }),
			invoiz.request(config.settings.endpoints.account, { auth: true, method: 'GET' })
		])
			.then(
				([
					recurringInvoiceResponse,
					numerationsResponse,
					payConditionsResponse,
					miscDataResponse,
					paymentSettingResponse,
					accountResponse
				]) => {
					const {
						body: { data: recurringInvoice }
					} = recurringInvoiceResponse;

					const { template } = recurringInvoice;
					const letterElements = template.letterElements;
					const invoiceData = template.invoice;
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

					const deliveryPeriodField = invoiceData.infoSectionFields.find(
						field => field.name === 'deliveryPeriod'
					);
					if (!deliveryPeriodField) {
						invoiceData.infoSectionFields.push({
							label: resources.str_deliveryPeriod,
							name: 'deliveryPeriod',
							active: false,
							required: false
						});
					}

					const selectedPayCondition = payConditions.find(pc => pc.id === invoiceData.payConditionId);
					if (!selectedPayCondition) {
						const defaultPayCondition = payConditions.find(pc => pc.isDefault);
						invoiceData.payConditionId = defaultPayCondition.id;
					}

					const invoice = new Invoice(invoiceData);
					const letter = new Letter(letterElements);
					const recInvoice = new RecurringInvoice(recurringInvoice);

					if (!invoice.invoizPayData) {
						invoice.setInvoizPayData(accountData);
					}

					invoice.customerData = _.isEmpty(invoice.customerData)
						? undefined
						: Object.assign({}, invoice.customerData, { id: invoice.customerId });

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
									recurringInvoice: recInvoice
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
				<LoaderComponent text={resources.str_loadingBill} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(RecurringInvoiceEditWrapper);
