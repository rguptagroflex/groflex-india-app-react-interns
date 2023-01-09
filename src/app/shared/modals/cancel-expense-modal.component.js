import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import { updateSubscriptionDetails } from 'helpers/updateSubsciptionDetails';
import { format } from 'util';
import TabInputComponent from 'shared/inputs/tab-input/tab-input.component';
class CancelExpenseModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			notes: '',
			refundType: 'debits'
		};
	}

	onRefundTypeChange(type) {
		this.setState({ refundType: type })
	}

	render() {
		const { isSaving } = this.state;
		const { resources } = this.props;
		
		return (
			<div>
				<div className="modal-base-headline"> {format(resources.str_cancelExpense || 'Cancel Expenditure %s:', this.props.expense.receiptNumber)}</div>
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
				{/* <div className="u_pt_10">
					<span className="textarea_label">Add amount and create:</span>
					<div className="col-xs-8">
						<TabInputComponent
						key="toggleRefundCreditsBalance"
						items={[{ label: `Add to balance`, value: `debits` }, { label: `Refund to source`, value: `balance` }]}
						value={this.state.refundType}
						componentClass=""
						onChange={event => this.onRefundTypeChange(event)}
						dataQsId="dashboard-taxEstimation-tabs-yearMonth"
				/>
					</div>
					<span className="cancel-info u_mt_10" style={{display: `flex`}}><span className="icon icon-info"/><span className="textarea_label" style={{marginLeft: 5}}>{' '}{this.state.refundType === `debits` ? `Selecting this option will create a debit note that can be applied to upcoming invoices` : `Selecting this option will create a debit note and will be considered as refunded to source`}</span>
					</span>
				</div> */}

				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							dataQsId="cancelInvoice-btn-cancel"
							callback={() => ModalService.close()}
							type="cancel"
							label={'Close'}
						/>
					</div>

					<div className="modal-base-confirm">
						<ButtonComponent
							buttonIcon=""
							dataQsId="cancelInvoice-btn-confirm"
							loading={isSaving}
							callback={() => this.cancelInvoice()}
							label={resources.str_cancel}
						/>
					</div>
				</div>
			</div>
		);
	}

	cancelInvoice() {
		const { notes, isSaving, refundType } = this.state;
		const {  expense, resources } = this.props;

		if (isSaving) {
			return;
		}

		this.setState({ isSaving: true }, () => {
			invoiz
				.request(`${config.resourceHost}expense/${expense.id}/cancel`, {
					method: 'POST',
					auth: true,
					data: {
						notes,
						refundType
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
}

export default CancelExpenseModalComponent;
