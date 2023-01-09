import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import q from 'q';
import Expense from 'models/expense.model';
import ExpenseEditComponent from './expense-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

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

		const fetchData = () => {
			return invoiz.request(`${config.expense.resourceUrl}/${parseInt(id, 10)}`, { auth: true });
		};

		const showEdit = response => {
			try {
				
				if (!this.ignoreLastFetch) {
					this.setState({
						preFetchData: {
							expense: new Expense(response.body.data)
						}
					});
				}
			} catch (e) {
				console.log(e);
			}
		};

		const onFetchError = response => {
			invoiz.router.navigate('/expenses');
			invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
		};

		q.fcall(fetchData)
			.then(showEdit)
			.catch(onFetchError)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<ExpenseEditComponent expense={preFetchData.expense} resources={resources} />
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
