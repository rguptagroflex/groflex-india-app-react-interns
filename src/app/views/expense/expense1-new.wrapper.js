import invoiz from 'services/invoiz.service';
import React from 'react';
import _ from 'lodash';
import config from 'config';
import Customer from 'models/customer.model';
import Invoice from 'models/invoice.model';
import { getMiscellaneousData } from 'helpers/getSettingsData';
import Expense from 'models/expense.model';
import ExpenseEditComponent from './expense1-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class ExpenseNewWrapper extends React.Component {
    constructor(props) {
		super(props);
		
		this.state = {
			preFetchData: null
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

    preFetchCustomer() {
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

   preFetch (customerData) {
		const { resources } = this.props;
		customerData = typeof customerData === 'string' ? null : customerData;

		Promise.all([
			invoiz.request(config.expense.endpoints.getNewExpense, { auth: true }),
			getMiscellaneousData()
		])
			.then(
				([
					newExpenseResponse,
					miscDataResponse
				]) => {
					const {
						body: {
							data: { expense: expenseData }
						}
					} = newExpenseResponse;

					const {
						body: { data: miscOptions }
					} = miscDataResponse;

					const expense = new Expense(expenseData);

					if (customerData) {
						expense.setCustomer(new Customer(customerData));
						if (customerData.address.countryIso !== "IN") {
							expense.baseCurrency = customerData.baseCurrency;
							expense.exchangeRate = customerData.exchangeRate;
							expense.priceKind = 'net';
							expense.customerData.indiaState = {};
						}
					} else {
						expense.customerData = _.isEmpty(expense.customerData)
							? undefined
							: Object.assign({}, expense.customerData, { id: expense.customerId });
					}

					try {
						if (!this.ignoreLastFetch) {
							this.setState({
								preFetchData: {
									expense,
									miscOptions
								}
							});
						}
					} catch (e) {
						console.log(e);
					}
				}
			)
			.catch(() => {
				invoiz.router.navigate('/expenses');
				invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
			});
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<ExpenseEditComponent
				expense={preFetchData.expense}
				miscOptions={preFetchData.miscOptions}
				resources={resources}
			/>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.str_loadExpense} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(ExpenseNewWrapper);
