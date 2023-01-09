import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import Invoice from 'models/invoice.model';
import Letter from 'models/letter/letter.model';
import { getPayConditions, getMiscellaneousData } from 'helpers/getSettingsData';
import TransactionEditComponent from 'shared/transaction/transaction-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';
import _ from 'lodash';
class InvoiceEditWrapper extends React.Component {
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
			invoiz.request(`${config.invoice.resourceUrl}/${parseInt(id, 10)}`, { auth: true }),
			invoiz.request(config.settings.endpoints.getNumerationSettings, { auth: true, method: 'GET' }),
			getPayConditions(),
			getMiscellaneousData(),
			invoiz.request(`${config.resourceHost}tenant/payment/setting`, { auth: true }),
			invoiz.request(config.settings.endpoints.account, { auth: true, method: 'GET' })
		])
			.then(
				([
					editInvoiceResponse,
					numerationsResponse,
					payConditionsResponse,
					miscDataResponse,
					paymentSettingResponse,
					accountResponse
				]) => {
					const {
						body: {
							data: { invoice: invoiceData, letterElements }
						}
					} = editInvoiceResponse;

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

					const selectedPayCondition = payConditions.find(pc => pc.id === invoiceData.payConditionId);
					if (!selectedPayCondition) {
						const defaultPayCondition = payConditions.find(pc => pc.isDefault);
						invoiceData.payConditionId = defaultPayCondition.id;
					}

					const invoice = new Invoice(invoiceData);
					const letter = new Letter(letterElements);

					invoice.customerData = _.isEmpty(invoice.customerData)
					? undefined
					: Object.assign({}, invoice.customerData, { id: invoice.customerId });

					if (!invoice.invoizPayData) {
						invoice.setInvoizPayData(accountData);
					}

					let isDeposit = false;
					let isClosing = false;

					if (invoice.type === 'depositInvoice') {
						isDeposit = true;
					}

					if (invoice.type === 'closingInvoice') {
						isClosing = true;
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
									isDeposit,
									isClosing
								}
							});
						}
					} catch (e) {
						console.log(e);
					}
				}
			)
			.catch(() => {
				invoiz.router.navigate('/invoices');
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
				isDeposit={preFetchData.isDeposit}
				isClosing={preFetchData.isClosing}
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

export default connect(mapStateToProps)(InvoiceEditWrapper);
