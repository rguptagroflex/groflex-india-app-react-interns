import React from 'react';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatDate, formatApiDate } from 'helpers/formatDate';
import ExpenseEditComponent from 'views/expense/expense-edit.component';
import invoiz from 'services/invoiz.service';
import config from 'config';
import Expense from 'models/expense.model';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import { format } from 'util';

class CreateExpensesModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			transactions: this.props.transactions || []
		};
	}

	componentWillReceiveProps(props) {
		this.setState({
			transactions: props.transactions
		});
	}

	editExpense(transaction) {
		invoiz
			.request(`${config.resourceHost}expense/${transaction.expense.id}`, {
				auth: true
			})
			.then(response => {
				const expense = new Expense(response.body.data);

				this.setState({
					editExpense: true,
					expenseForEdit: expense,
					editingTransactionId: transaction.id
				});
			});
	}

	cancelEdit() {
		this.setState({ editExpense: false, expenseForEdit: null, editingTransactionId: null });
	}

	completeEdit() {
		const editedExpense = this.refs['edit-expense-component'].state.expense;
		const { transactions } = this.state;
		transactions.forEach(transaction => {
			if (transaction.id === this.state.editingTransactionId) {
				transaction.bookingContactName = editedExpense.payee;
				// transaction.bookingDate = formatDate(editedExpense.date, 'DD.MM.YYYY', 'YYYY-MM-DD');
				transaction.bookingDate = formatApiDate(editedExpense.date);
				transaction.purposeDescription = editedExpense.description;
				transaction.bookingAmount = editedExpense.priceTotal;
			}
		});
		this.refs['edit-expense-component']
			.saveFromModal()
			.then(() => {
				this.setState({ transactions, editExpense: false, expenseForEdit: null, editingTransactionId: null });
			})
			.catch(e => {
				return;
			});
	}

	render() {
		let element = null;
		const { resources } = this.props;
		if (!this.state.editExpense) {
			const transactionElements = [];

			this.state.transactions.forEach((transaction, index) => {
				const headlineElement = <div className="expense-headline">{transaction.bookingContactName}</div>;

				transactionElements.push(
					<li
						className={`expense-item ${!transaction.bookingContactName ? 'no-headline' : ''}`}
						key={`expense-item-${index}`}
					>
						{transaction.bookingContactName ? headlineElement : null}
						<div className="expense-subheadline">
							<span>{resources.str_documentDate}:</span> {formatDate(transaction.bookingDate)}
							<span className="expense-purpose">{resources.str_use}:</span> {transaction.purposeDescription}
						</div>
						<div className="expense-amount">{formatCurrency(Math.abs(transaction.bookingAmount))}</div>
						<div className="expense-edit icon icon-edit" onClick={() => this.editExpense(transaction)} />
					</li>
				);
			});

			element = (
				<div>
					<div className="modal-base-close" onClick={() => ModalService.close()} />
					<div className="modal-base-headline">
						<div dangerouslySetInnerHTML={{ __html: format(resources.createExpenseModalHeadline, this.state.transactions.length, this.state.transactions.length > 1 ? resources.str_expenses : resources.str_output) }} ></div>
						{/* Du hast {<span>{this.state.transactions.length}</span>}{' '}
						{this.state.transactions.length > 1 ? 'Ausgaben' : 'Ausgabe'} angelegt */}
					</div>

					<div className="create-expenses-modal-content">
						<ul>{transactionElements}</ul>
					</div>

					<div className="modal-base-footer">
						<div className="modal-base-confirm">
							<ButtonComponent
								dataQsId="createExpensesModal-btn-finish"
								callback={() => ModalService.close()}
								label={resources.str_finished}
							/>
						</div>
					</div>
				</div>
			);
		} else {
			element = (
				<div>
					<div className="modal-base-close" onClick={() => this.cancelEdit()} />
					<div className="modal-base-headline">{resources.str_editOutput}</div>

					<div className="create-expenses-modal-content edit-expense">
						<ExpenseEditComponent
							ref="edit-expense-component"
							expense={this.state.expenseForEdit}
							isModal={true}
						/>
					</div>

					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							<ButtonComponent
								dataQsId="createExpensesModal-btn-cancel"
								type="cancel"
								callback={() => this.cancelEdit()}
								label={resources.str_abortStop}
							/>
						</div>

						<div className="modal-base-confirm">
							<ButtonComponent
								dataQsId="createExpensesModal-btn-save"
								callback={() => this.completeEdit()}
								label={resources.str_toSave}
							/>
						</div>
					</div>
				</div>
			);
		}

		return element;
	}
}

export default CreateExpensesModalComponent;
