import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import { getMiscellaneousData } from 'helpers/getSettingsData';
import Expense from 'models/expense.model';
import ExpenseEditComponent from './expense1-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';
import _ from 'lodash';

class ExpenseEditWrapper extends React.Component {
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
			invoiz.request(`${config.expense.resourceUrl}/${parseInt(id, 10)}`, { auth: true }),
			getMiscellaneousData()
		])
			.then(
				([
					editExpenseResponse,
					miscDataResponse
				]) => {
					const {
						body: {
							data: { expense: expenseData }
						}
					} = editExpenseResponse;

					const {
						body: { data: miscOptions }
					} = miscDataResponse;
					const expense = new Expense(expenseData,true);
					expense.customerData = _.isEmpty(expense.customerData)
					? undefined
					: Object.assign({}, expense.customerData, { id: expense.customerId });
					if (expenseData.purchaseOrder) expense.purchaseOrder = expenseData.purchaseOrder;
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

export default connect(mapStateToProps)(ExpenseEditWrapper);
