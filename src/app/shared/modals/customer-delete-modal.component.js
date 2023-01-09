import React from 'react';
import { deleteSelectedCustomers } from 'redux/ducks/customer/customerList';
import { connect } from 'react-redux';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';

class CustomerDeleteModal extends React.Component {
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
		const { selectedItems, onConfirm, finishedDeletingItems, multipleDeleteError, resources } = this.props;

		if (selectedItems) {
			const list = selectedItems.map(customer => {
				return (
					<div className="customer-delete-list-item" key={`customer-delete-list-item-${customer.id}`}>
						<span className="list-item-first-col">{customer.number}</span>
						<span className="list-item-second-col">{customer.name}</span>
						{finishedDeletingItems && customer.deleteSuccess ? (
							<span className="icon icon-check" />
						) : finishedDeletingItems && !customer.deleteSuccess ? (
							<span className="icon icon-close" />
						) : null}
					</div>
				);
			});

			return (
				<div className="customer-delete-component-modal">
					<div>{resources.customersDeleteConfirmText}  {resources.str_undoneMessage}</div>

					<div className="customer-delete-list">{list}</div>
					<div className="customer-delete-list-error">{multipleDeleteError}</div>

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
		this.props.deleteSelectedCustomers();
	}
}

const mapDispatchToProps = dispatch => {
	return {
		deleteSelectedCustomers: () => {
			dispatch(deleteSelectedCustomers());
		}
	};
};

const mapStateToProps = state => {
	const { selectedItems, finishedDeletingItems, multipleDeleteError } = state.customer.customerList;
	const { resources } = state.language.lang;

	return {
		selectedItems,
		finishedDeletingItems,
		multipleDeleteError,
		resources
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(CustomerDeleteModal);
