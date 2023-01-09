import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import q from 'q';
import { getPayConditions, getMiscellaneousData } from 'helpers/getSettingsData';
import Customer from 'models/customer.model';
import CustomerEditComponent from 'views/customer/customer-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class CustomerNewWrapper extends React.Component {
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
		const fetchData = () => {
			const requests = [
				invoiz.request(config.customer.endpoints.nextCustomerNumber, { auth: true }),
				getPayConditions(),
				getMiscellaneousData()
			];

			return q.all(requests);
		};

		const onFetchError = () => {
			invoiz.router.navigate('/customers');
			invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
		};

		const showNew = (nextNumber, payConditions, miscellaneousData) => {
			const customer = new Customer();

			if (!this.ignoreLastFetch) {
				this.setState({
					preFetchData: {
						customer,
						nextCustomerNumber: nextNumber.body.data,
						payConditions: payConditions.body.data,
						customerCategories: miscellaneousData.body.data.customerCategories,
						jobTitles: miscellaneousData.body.data.jobTitles,
						salutations: miscellaneousData.body.data.salutations,
						titles: miscellaneousData.body.data.titles
					}
				});
			}
		};

		q.fcall(fetchData)
			.catch(onFetchError)
			.spread(showNew)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<CustomerEditComponent
				customer={preFetchData.customer}
				nextCustomerNumber={preFetchData.nextCustomerNumber}
				payConditions={preFetchData.payConditions}
				customerCategories={preFetchData.customerCategories}
				jobTitles={preFetchData.jobTitles}
				salutations={preFetchData.salutations}
				titles={preFetchData.titles}
				resources={resources}
			/>
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

export default connect(mapStateToProps)(CustomerNewWrapper);
