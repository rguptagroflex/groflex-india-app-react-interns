import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import q from 'q';
import lang from 'lang';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';

class RecurringInvoiceMultiActionComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			processing: false,
		};
	}

	render() {
		const { selectedItems, onConfirm, finishedProcessingMultiAction } = this.props;

		if (selectedItems) {
			const list = selectedItems.map((recInvoice) => {
				return (
					<div
						className="rec-invoice-multi-action-list-item"
						key={`rec-invoice-multi-action-list-item-${recInvoice.id}`}
					>
						<span className="list-item-first-col">Entwurf</span>
						<span className="list-item-second-col">{recInvoice.name}</span>
						{finishedProcessingMultiAction && recInvoice.multiProcessSuccess ? (
							<span className="icon icon-check" />
						) : finishedProcessingMultiAction && !recInvoice.multiProcessSuccess ? (
							<span className="icon icon-close" />
						) : null}
					</div>
				);
			});

			const claim = 'Möchtest du die Abo-Rechnungen wirklich löschen? Dies kann nicht rückgängig gemacht werden!';

			return (
				<div className="rec-invoice-multi-action-component-wrapper">
					<div>{claim}</div>

					<div className="rec-invoice-multi-action-list">{list}</div>

					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							{finishedProcessingMultiAction ? null : (
								<ButtonComponent
									type="cancel"
									callback={() => ModalService.close(true)}
									label={'Abbrechen'}
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
									label={'Schließen'}
									dataQsId="modal-btn-confirm"
								/>
							) : (
								<ButtonComponent
									buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-trashcan'}
									type={'danger'}
									disabled={this.state.processing}
									callback={() => this.onProcessConfirm()}
									label={'Löschen'}
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
		this.setState({ processing: true }, () => {
			const requests = this.props.selectedItems.map((invoice) => {
				return new Promise((resolve, reject) => {
					invoiz
						.request(`${config.resourceHost}recurringinvoice/${invoice.id}`, {
							auth: true,
							method: 'DELETE',
						})
						.then(() => {
							resolve();
						})
						.catch((err) => {
							reject(err);
						});
				});
			});

			q.allSettled(requests).done((res) => {
				const errors = res.filter((r) => r.state === 'rejected');

				if (errors && errors.length > 0) {
					ModalService.close();
					invoiz.page.showToast({
						message: lang.defaultErrorMessage,
						type: 'error',
					});
				} else {
					this.setState({ processing: false }, () => {
						this.props.onConfirm && this.props.onConfirm();
					});
				}
			});
		});
	}
}

export default RecurringInvoiceMultiActionComponent;
