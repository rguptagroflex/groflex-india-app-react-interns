import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import q from 'q';
import { getPayConditions, getMiscellaneousData } from 'helpers/getSettingsData';
import Customer from 'models/customer.model';
import CustomerEditComponent from 'views/customer/customer-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class CustomerEditWrapper extends React.Component {
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

		const fetchData = () => {
			const requests = [
				invoiz.request(`${config.customer.resourceUrl}/${parseInt(id, 10)}`, { auth: true }),
				invoiz.request(`${config.customer.resourceUrl}/${parseInt(id, 10)}/salesVolume`, {
					auth: true
				}),
				getPayConditions(),
				getMiscellaneousData()
			];
			return q.all(requests);
		};

		const onFetchError = response => {
			invoiz.router.navigate('/customers');
			invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
		};

		const showEdit = (customerResponse, salesVolume, payConditions, miscellaneousData) => {
			const {
				body: { data }
			} = customerResponse;
			const customer = new Customer(data);
			customer.salesOrExpensesVolumeData = salesVolume.body.data;
			try {
				if (!this.ignoreLastFetch) {
					this.setState({
						preFetchData: {
							customer,
							payConditions: payConditions.body.data,
							customerCategories: miscellaneousData.body.data.customerCategories,
							jobTitles: miscellaneousData.body.data.jobTitles,
							salutations: miscellaneousData.body.data.salutations,
							titles: miscellaneousData.body.data.titles
						}
					});
				}
			} catch (e) {
				console.log(e);
			}
		};

		q.fcall(fetchData)
			.catch(onFetchError)
			.spread(showEdit)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<CustomerEditComponent
				customer={preFetchData.customer}
				payConditions={preFetchData.payConditions}
				customerCategories={preFetchData.customerCategories}
				jobTitles={preFetchData.jobTitles}
				salutations={preFetchData.salutations}
				titles={preFetchData.titles}
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

export default connect(mapStateToProps)(CustomerEditWrapper);
