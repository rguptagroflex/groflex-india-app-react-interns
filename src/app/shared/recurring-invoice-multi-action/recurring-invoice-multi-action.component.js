import React from 'react';
import { deleteSelectedRecurringInvoices } from 'redux/ducks/recurring-invoice/recurringInvoiceList';
import { connect } from 'react-redux';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';

class RecurringInvoiceMultiActionComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			processing: false
		};
	}

	componentWillReceiveProps(props) {
		const { selectedItems, onConfirm, finishedProcessingMultiAction } = props;
		if (finishedProcessingMultiAction) {
			const successfulItems = selectedItems.filter(item => item.multiProcessSuccess);
			if (successfulItems && successfulItems.length === selectedItems.length) {
				onConfirm();
			}
		}
	}

	render() {
		const { selectedItems, onConfirm, finishedProcessingMultiAction, resources } = this.props;

		if (selectedItems) {
			const list = selectedItems.map(recInvoice => {
				return (
					<div
						className="rec-invoice-multi-action-list-item"
						key={`rec-invoice-multi-action-list-item-${recInvoice.id}`}
					>
						<span className="list-item-first-col">{'Draft'}</span>
						<span className="list-item-second-col">{recInvoice.name}</span>
						{finishedProcessingMultiAction && recInvoice.multiProcessSuccess ? (
							<span className="icon icon-check" />
						) : finishedProcessingMultiAction && !recInvoice.multiProcessSuccess ? (
							<span className="icon icon-close" />
						) : null}
					</div>
				);
			});

			return (
				<div className="rec-invoice-multi-action-component-wrapper">
					<div>{resources.recurringDeleteConfirmText}</div>

					<div className="rec-invoice-multi-action-list">{list}</div>

					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							{finishedProcessingMultiAction ? null : (
								<ButtonComponent
									type="cancel"
									callback={() => ModalService.close(true)}
									label={'Cancel'}
									dataQsId="modal-btn-cancel"
								/>
							)}
						</div>
						<div className="modal-base-confirm">
							{finishedProcessingMultiAction ? (
								<ButtonComponent
									buttonIcon={'icon-check'}
									type={'primary'}
									callback={() => onConfirm && onConfirm()}
									label={'End subscription'}
									dataQsId="modal-btn-confirm"
								/>
							) : (
								<ButtonComponent
									buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-trashcan'}
									type={'secondary'}
									disabled={this.state.processing}
									callback={() => this.onProcessConfirm()}
									label={'Delete'}
									dataQsId="modal-btn-confirm"
								/>
							)}
						</div>
					</div>
				</div>
			);
		}
	}

	onProcessConfirm() {
		this.setState({ processing: true });
		this.props.deleteSelectedRecurringInvoices();
	}
}

const mapDispatchToProps = dispatch => {
	return {
		deleteSelectedRecurringInvoices: () => {
			dispatch(deleteSelectedRecurringInvoices());
		}
	};
};

const mapStateToProps = state => {
	const { selectedItems, finishedProcessingMultiAction } = state.recurringInvoice.recurringInvoiceList;
	const { resources } = state.language.lang;
	return {
		selectedItems,
		finishedProcessingMultiAction,
		resources
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(RecurringInvoiceMultiActionComponent);
