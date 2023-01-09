import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import q from 'q';
import store from 'redux/store';
import { Provider, connect } from 'react-redux';
import Customer from 'models/customer.model';
import CustomerDetailComponent from 'views/customer/customer-detail.component';
import CustomerDetailNewComponent from 'views/customer/customer-detail-new.component';
import LoaderComponent from 'shared/loader/loader.component';
import { getPayConditionById } from 'helpers/getSettingsData';

class CustomerDetailWrapper extends React.Component {
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

		const fetchCustomerData = () => {
			const customerId = parseInt(id, 10);

			const customerRequest = invoiz.request(`${config.customer.resourceUrl}/${customerId}`, {
				auth: true
			});

			const salesOrExpensesRequest = invoiz.request(`${config.customer.resourceUrl}/${customerId}/salesVolume`, {
				auth: true
			});

			return q.all([customerRequest, salesOrExpensesRequest]);
		};

		const fetchConditions = (customer, salesOrExpensesVolumeResponse) => {
			const EMPTY_CONDITION = { name: resources.str_standard };
			const payConditionId = customer.body.data.payConditionId;
			const payCondition = payConditionId
				? getPayConditionById(payConditionId)
				: EMPTY_CONDITION;

			return q.all([customer, salesOrExpensesVolumeResponse, payCondition]);
		};

		const showDetails = (response, salesOrExpensesVolumeResponse, payCondition) => {
			const customer = new Customer(response.body.data);
			customer.salesOrExpensesVolumeData = salesOrExpensesVolumeResponse.body.data;

			if (!this.ignoreLastFetch) {
				this.setState({
					preFetchData: {
						customer,
						payCondition: payCondition.body ? payCondition.body.data : payCondition
					}
				});
			}
		};

		const onFetchError = () => {
			invoiz.router.navigate('/customers');
			invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
		};

		q.fcall(fetchCustomerData)
			.spread(fetchConditions)
			.spread(showDetails)
			.catch(onFetchError)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<Provider store={store}>
				{/* <CustomerDetailComponent customer={preFetchData.customer} payCondition={preFetchData.payCondition} /> */}
				<CustomerDetailNewComponent customer={preFetchData.customer} payCondition={preFetchData.payCondition} resources={resources} />
			</Provider>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.str_loadCustomer} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(CustomerDetailWrapper);
