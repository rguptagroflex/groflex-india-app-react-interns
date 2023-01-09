import React from 'react';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatDate } from 'helpers/formatDate';
import { deleteSelectedExpenses } from 'redux/ducks/expense/expenseList';
import { connect } from 'react-redux';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';

class ExpenseDeleteModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			deleting: false
		};
	}

	componentWillReceiveProps(props) {
		const { selectedItems, onConfirm, finishedDeletingItems } = props;
		if (finishedDeletingItems) {
			const successfulItems = selectedItems.filter(item => item.deleteSuccess);
			if (successfulItems && successfulItems.length === selectedItems.length) {
				onConfirm();
			}
		}
	}

	render() {
		const { expense, selectedItems, onConfirm, finishedDeletingItems, resources } = this.props;

		if (expense) {
			return (
				<div className="expense-delete-modal">
					<div>{resources.expenseDeleteConfirmText}</div>
					<ul>
						<li>
							<b>{resources.str_recipient}:</b> <span>{expense.displayName}</span>
						</li>
						<li>
							<b>{resources.str_documentDate}:</b> <span>{formatDate(expense.date)}</span>
						</li>
						<li>
							<b>{resources.str_amount}:</b> <span>{formatCurrency(expense.totalGross)}</span>
						</li>
					</ul>

					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							<ButtonComponent
								type="cancel"
								callback={() => ModalService.close(true)}
								label={resources.str_abortStop}
								dataQsId="modal-btn-cancel"
							/>
						</div>
						<div className="modal-base-confirm">
							<ButtonComponent
								buttonIcon={'icon-trashcan'}
								type={'secondary'}
								callback={() => onConfirm && onConfirm()}
								label={resources.str_clear}
								dataQsId="modal-btn-confirm"
							/>
						</div>
					</div>
				</div>
			);
		} else if (selectedItems) {
			const list = selectedItems.map(expense => {
				return (
					<div className="expense-delete-list-item" key={`expense-delete-list-item-${expense.id}`}>
						<b className="list-item-first-col">{resources.str_recipient}:</b>
						<span className="list-item-second-col">{expense.displayName}</span>
						<br />
						<span className="list-item-first-col">{formatDate(expense.date)}</span>
						<span className="list-item-second-col">{formatCurrency(expense.totalGross)}</span>
						{finishedDeletingItems && expense.deleteSuccess ? (
							<span className="icon icon-check" />
						) : finishedDeletingItems && !expense.deleteSuccess ? (
							<span className="icon icon-close" />
						) : null}
					</div>
				);
			});

			return (
				<div className="expense-delete-modal">
					<div>{resources.expenseDeleteConfirmText}{' '}{resources.str_undoneMessage}</div>

					<div className="expense-delete-list">{list}</div>

					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							{finishedDeletingItems ? null : (
								<ButtonComponent
									type="cancel"
									callback={() => ModalService.close(true)}
									label={resources.str_abortStop}
									dataQsId="modal-btn-cancel"
								/>
							)}
						</div>
						<div className="modal-base-confirm">
							{finishedDeletingItems ? (
								<ButtonComponent
									buttonIcon={'icon-check'}
									type={'primary'}
									callback={() => onConfirm && onConfirm()}
									label={resources.str_shutdown}
									dataQsId="modal-btn-confirm"
								/>
							) : (
								<ButtonComponent
									buttonIcon={this.state.deleting ? 'loader_spinner' : 'icon-trashcan'}
									type={'secondary'}
									disabled={this.state.deleting}
									callback={() => this.onDeleteSelectedConfirm()}
									label={resources.str_clear}
									dataQsId="modal-btn-confirm"
								/>
							)}
						</div>
					</div>
				</div>
			);
		}
	}

	onDeleteSelectedConfirm() {
		this.setState({ deleting: true });
		this.props.deleteSelectedExpenses();
	}
}

const mapDispatchToProps = dispatch => {
	return {
		deleteSelectedExpenses: () => {
			dispatch(deleteSelectedExpenses());
		}
	};
};

const mapStateToProps = state => {
	const { selectedItems, finishedDeletingItems } = state.expense.expenseList;
	const { resources } = state.language.lang;
	return {
		selectedItems,
		finishedDeletingItems,
		resources
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(ExpenseDeleteModalComponent);
