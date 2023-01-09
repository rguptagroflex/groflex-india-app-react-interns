import React from 'react';
import Expense from 'models/expense.model';
import ExpenseEditComponent from './expense-edit.component';
import { connect } from 'react-redux';

class ExpenseWrapper extends React.Component {
    render() {
		const { resources } = this.props;
		const model = new Expense();
		return <ExpenseEditComponent expense={model} resources={resources} />;
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(ExpenseWrapper);
