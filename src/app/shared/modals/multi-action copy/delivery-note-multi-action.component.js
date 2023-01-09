import React from 'react';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import invoiz from 'services/invoiz.service';
import config from 'config';
import q from 'q';
import lang from 'lang';

class DeliveryNoteMultiActionComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			deleting: false,
			processing: false,
			confirmChecked: false,
			finishedDeletingItems: false,
			multipleDeleteError: null,
		};
	}

	onDeleteSelectedConfirm() {
		const { selectedItems } = this.props;

		this.setState({ deleting: true }, () => {
			const requests = selectedItems.map((deliveryNote) => {
				return new Promise((resolve, reject) => {
					invoiz
						.request(`${config.resourceHost}deliveryNote/${deliveryNote.id}`, {
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
				let errorMessage = null;

				if (errors && errors.length > 0) {
					const { body } = errors[0].reason;

					errorMessage =
						body.meta.id && body.meta.id[0].code === 'NOT_ALLOWED'
							? lang.customersDeleteNotAllowedMessage
							: lang.defaultErrorMessage;
				}

				this.setState({
					finishedDeletingItems: true,
					multipleDeleteError: errorMessage,
				});
			});
		});
	}

	render() {
		const { finishedDeletingItems, multipleDeleteError } = this.state;
		const { onConfirm } = this.props;

		let selectedItems = [].concat(this.props.selectedItems);
		const selectedItemsLength = selectedItems.length;
		let isSelectedItemsTruncatedMessage = null;

		if (selectedItemsLength > 10) {
			selectedItems = selectedItems.slice(0, 10);
			isSelectedItemsTruncatedMessage = `+ ${selectedItemsLength - 10} Weitere`;
		}

		if (selectedItems) {
			//console.log(selectedItems);
			const list = selectedItems.map((deliveryNote) => {
				return (
					<div className="delivery-note-delete-list-item" key={`delivery-note-delete-list-item-${deliveryNote.id}`}>
						<span className="list-item-first-col">{deliveryNote.number}</span>
						<span className="list-item-second-col">{deliveryNote.customerData.name}</span>
					</div>
				);
			});

			return (
				<div className="delivery-note-delete-component-modal">
					<div>Möchtest du die Lieferscheine wirklich löschen? Dies kann nicht rückgängig gemacht werden!</div>

					<div className="delivery-note-delete-list">{list}</div>
					{isSelectedItemsTruncatedMessage ? (
						<div>
							&hellip;
							<br />
							{isSelectedItemsTruncatedMessage}
						</div>
					) : null}

					<div className="delivery-note-delete-list-error">{multipleDeleteError}</div>

					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							{finishedDeletingItems ? null : (
								<ButtonComponent
									type="cancel"
									callback={() => ModalService.close(true)}
									label={'Abbrechen'}
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
									label={'Schließen'}
									dataQsId="modal-btn-confirm"
								/>
							) : (
								<ButtonComponent
									buttonIcon={this.state.deleting ? 'loader_spinner' : 'icon-trashcan'}
									type={'danger'}
									disabled={this.state.deleting}
									callback={() => this.onDeleteSelectedConfirm()}
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

	// render() {
	// 	const { selectedItems, onConfirm, finishedProcessingMultiAction } = this.props;
	// 	const { confirmChecked } = this.state;

	// 	if (selectedItems) {
	// 		let hasSentDeliveryNotes = false;
	// 		const list = selectedItems.map(deliveryNote => {
	// 			if (deliveryNote.state === DeliveryNoteState.SENT) {
	// 				hasSentDeliveryNotes = true;
	// 			}

	// 			return (
	// 				<div
	// 					className="delivery-note-multi-action-list-item"
	// 					key={`delivery-note-multi-action-list-item-${deliveryNote.id}`}
	// 				>
	// 					<span className="list-item-first-col">{deliveryNote.number}</span>
	// 					<span className="list-item-second-col">{deliveryNote.displayName}</span>
	// 					{finishedProcessingMultiAction && deliveryNote.multiProcessSuccess ? (
	// 						<span className="icon icon-check" />
	// 					) : finishedProcessingMultiAction && !deliveryNote.multiProcessSuccess ? (
	// 						<span className="icon icon-close" />
	// 					) : null}
	// 				</div>
	// 			);
	// 		});

	// 		let claim = 'Möchtest du die Lieferscheine wirklich löschen? Dies kann nicht rückgängig gemacht werden!';
	// 		if (hasSentDeliveryNotes) {
	// 			claim = (
	// 				<div>
	// 					<div className="delete-delivery-note-warning">
	// 						<div className="delete-delivery-note-warning-icon">!</div>
	// 						<div className="delete-delivery-note-warning-text">
	// 							Mindestens ein Lieferschein wurde bereits verschickt. Bitte beachte, dass das Löschen
	// 							der Lieferscheine nicht rückgängig gemacht werden kann.
	// 						</div>
	// 					</div>

	// 					<CheckboxInputComponent
	// 						name={'deleteDeliveryNote'}
	// 						label={'Ich möchte die Lieferscheine trotzdem löschen.'}
	// 						checked={confirmChecked}
	// 						onChange={() =>
	// 							this.setState({
	// 								confirmChecked: !confirmChecked
	// 							})
	// 						}
	// 					/>
	// 				</div>
	// 			);
	// 		}

	// 		const confirmButton = (
	// 			<ButtonComponent
	// 				buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-trashcan'}
	// 				type={'danger'}
	// 				disabled={this.state.processing || (hasSentDeliveryNotes && !confirmChecked)}
	// 				callback={() => this.onProcessConfirm()}
	// 				label={'Löschen'}
	// 				dataQsId="modal-btn-confirm"
	// 			/>
	// 		);

	// 		return (
	// 			<div className="delivery-note-multi-action-component-wrapper">
	// 				<div>{claim}</div>

	// 				<div className="delivery-note-multi-action-list">{list}</div>

	// 				<div className="modal-base-footer">
	// 					<div className="modal-base-cancel">
	// 						{finishedProcessingMultiAction ? null : (
	// 							<ButtonComponent
	// 								type="cancel"
	// 								callback={() => ModalService.close(true)}
	// 								label={'Abbrechen'}
	// 								dataQsId="modal-btn-cancel"
	// 							/>
	// 						)}
	// 					</div>
	// 					<div className="modal-base-confirm">
	// 						{finishedProcessingMultiAction ? (
	// 							<ButtonComponent
	// 								buttonIcon={'icon-check'}
	// 								type={'primary'}
	// 								callback={() => onConfirm && onConfirm()}
	// 								label={'Schließen'}
	// 								dataQsId="modal-btn-confirm"
	// 							/>
	// 						) : (
	// 							confirmButton
	// 						)}
	// 					</div>
	// 				</div>
	// 			</div>
	// 		);
	// 	}
	// }

	// onProcessConfirm() {
	// 	this.setState({ processing: true });
	// 	this.props.deleteSelectedDeliveryNotes();
	// }
}

// const mapDispatchToProps = dispatch => {
// 	return {
// 		deleteSelectedDeliveryNotes: () => {
// 			dispatch(deleteSelectedDeliveryNotes());
// 		}
// 	};
// };

// const mapStateToProps = state => {
// 	const { selectedItems, finishedProcessingMultiAction } = state.deliveryNote.deliveryNoteList;

// 	return {
// 		selectedItems,
// 		finishedProcessingMultiAction
// 	};
// };

export default DeliveryNoteMultiActionComponent;
