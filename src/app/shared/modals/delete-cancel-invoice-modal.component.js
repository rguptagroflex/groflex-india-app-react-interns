import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import { updateSubscriptionDetails } from 'helpers/updateSubsciptionDetails';
import CheckboxInputComponent from 'shared/inputs/checkbox-input/checkbox-input.component';
import { format } from 'util';
import planPermissions from "enums/plan-permissions.enum";

class DeleteCancelInvoiceModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			cancelActive: true,
			confirmDelete: false,
			notes: '',
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_CREDIT_NOTE),
		};
	}

	render() {
		const { cancelActive, isSaving } = this.state;
		const { invoice, resources } = this.props;

		const cancelElement = (
			<div>
				<div className="modal-base-headline"> {format(resources.invoiceCancelHeading, invoice.number)}</div>
				<div className="cancel-invoice-notes">
					<div className="textarea">
						<label className="textarea_label">{resources.str_cancellationReason}</label>
						<textarea
							data-qs-id="cancel-invoice-notes"
							className="textarea_input"
							rows="4"
							onChange={event => this.setState({ notes: event.target.value })}
						/>
						<span className="textarea_bar" />
					</div>
				</div>

				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							dataQsId="cancelInvoice-btn-cancel"
							callback={() => ModalService.close()}
							type="cancel"
							label={resources.str_abortStop}
						/>
					</div>

					<div className="modal-base-confirm">
						<ButtonComponent
							buttonIcon="icon-storniert"
							dataQsId="cancelInvoice-btn-confirm"
							loading={isSaving}
							callback={() => this.cancelInvoice()}
							label={resources.str_cancel}
							disabled={this.state.planRestricted}
						/>
					</div>
				</div>
			</div>
		);

		const deleteElement = (
			<div>
				<div className="modal-base-close" onClick={() => ModalService.close()} />
				<div className="modal-base-headline">{format(resources.invoiceDeleteHeading, invoice.number)}</div>
				<div className="delete-invoice-warning">
					<div className="delete-invoice-warning-icon">!</div>
					<div className="delete-invoice-warning-text">
						{resources.invoiceCompletedMessage}
					</div>
				</div>

				<CheckboxInputComponent
					name={'confirmDelete'}
					label={resources.deleteBillWarningMessage}
					checked={this.state.confirmDelete}
					onChange={() => this.setState({ confirmDelete: !this.state.confirmDelete })}
				/>

				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							dataQsId="cancelInvoice-btn-cancel"
							callback={() => ModalService.close()}
							type="cancel"
							label={resources.str_abortStop}
						/>
					</div>

					<div className="modal-base-confirm">
						<ButtonComponent
							type="secondary"
							buttonIcon="icon-trashcan"
							dataQsId="deleteInvoice-btn-confirm"
							loading={isSaving}
							disabled={!this.state.confirmDelete}
							callback={() => this.deleteInvoice()}
							label={resources.str_clear}
						/>
					</div>
				</div>
			</div>
		);

		return (
			<div>
				<div className="delete-cancel-invoice-tabs">
					<div
						className={`delete-cancel-tab cancel ${!cancelActive ? 'inactive' : ''}`}
						onClick={() => this.setState({ cancelActive: true })}
					>
						{resources.str_canelInvoice}
					</div>

					<div
						className={`delete-cancel-tab delete ${cancelActive ? 'inactive' : ''}`}
						onClick={() => this.setState({ cancelActive: false })}
					>
						{resources.str_deleteInvoice}
					</div>
				</div>

				{cancelActive ? cancelElement : deleteElement}
			</div>
		);
	}

	cancelInvoice() {
		const { notes, isSaving } = this.state;
		const { invoice, resources } = this.props;

		if (isSaving) {
			return;
		}

		this.setState({ isSaving: true }, () => {
			invoiz
				.request(`${config.resourceHost}invoice/${invoice.id}/cancel`, {
					method: 'POST',
					auth: true,
					data: {
						notes
					}
				})
				.then(() => {
					updateSubscriptionDetails();
					invoiz.page.showToast({ message: resources.invoiceCancelSuccessMessage });
					invoiz.router.reload();
					ModalService.close();
				})
				.catch(() => {
					invoiz.page.showToast({ message: resources.defaultErrorMessage, type: 'error' });
					ModalService.close();
				});
		});
	}

	deleteInvoice() {
		const { isSaving } = this.state;
		const { invoice, resources } = this.props;

		if (isSaving) {
			return;
		}

		this.setState({ isSaving: true }, () => {
			invoiz
				.request(`${config.resourceHost}invoice/${invoice.id}`, {
					method: 'DELETE',
					auth: true
				})
				.then(() => {
					updateSubscriptionDetails();
					invoiz.page.showToast({ message: resources.invoiceDeleteConfirmationMessage });
					if (this.props.isFromList) {
						invoiz.router.reload();
					} else {
						invoiz.router.navigate('/invoices');
					}
					ModalService.close();
				})
				.catch(() => {
					invoiz.page.showToast({ message: resources.defaultErrorMessage, type: 'error' });
					ModalService.close();
				});
		});
	}
}

export default DeleteCancelInvoiceModalComponent;
