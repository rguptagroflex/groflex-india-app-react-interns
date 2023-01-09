import React from 'react';
import { deleteSelectedInvoices } from 'redux/ducks/invoice/invoiceList';
import { connect } from 'react-redux';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';

class InvoiceMultiActionComponent extends React.Component {
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
			const list = selectedItems.map(invoice => {
				return (
					<div
						className="invoice-multi-action-list-item"
						key={`invoice-multi-action-list-item-${invoice.id}`}
					>
						<span className="list-item-first-col">{resources.str_draft}</span>
						<span className="list-item-second-col">{invoice.displayName}</span>
						{finishedProcessingMultiAction && invoice.multiProcessSuccess ? (
							<span className="icon icon-check" />
						) : finishedProcessingMultiAction && !invoice.multiProcessSuccess ? (
							<span className="icon icon-close" />
						) : null}
					</div>
				);
			});

			return (
				<div className="invoice-multi-action-component-wrapper">
					<div>{resources.invoiceDeleteWarningMessage}</div>

					<div className="invoice-multi-action-list">{list}</div>

					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							{finishedProcessingMultiAction ? null : (
								<ButtonComponent
									type="cancel"
									callback={() => ModalService.close(true)}
									label={resources.str_abortStop}
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
									label={resources.str_shutdown}
									dataQsId="modal-btn-confirm"
								/>
							) : (
								<ButtonComponent
									buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-trashcan'}
									type={'secondary'}
									disabled={this.state.processing}
									callback={() => this.onProcessConfirm()}
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

	onProcessConfirm() {
		this.setState({ processing: true });
		this.props.deleteSelectedInvoices();
	}
}

const mapDispatchToProps = dispatch => {
	return {
		deleteSelectedInvoices: () => {
			dispatch(deleteSelectedInvoices());
		}
	};
};

const mapStateToProps = state => {
	const { selectedItems, finishedProcessingMultiAction } = state.invoice.invoiceList;
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
)(InvoiceMultiActionComponent);
