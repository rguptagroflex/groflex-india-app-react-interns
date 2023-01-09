import React from 'react';
import invoiz from 'services/invoiz.service';
import lang from 'lang';
import q from 'q';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';

class DeleteRowsModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			deleting: false,
			finishedDeletingItems: false,
			multipleDeleteError: null,
		};
	}

	onDeleteSelectedConfirm() {
		const { deleteUrlPrefix, selectedItems } = this.props;

		this.setState({ deleting: true }, () => {
			const requests = selectedItems.map((item) => {
				return new Promise((resolve, reject) => {
					invoiz
						.request(`${deleteUrlPrefix}${item.id}`, {
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

				if (errors && errors.length > 0 && this.props.getErrorMessage) {
					errorMessage = this.props.getErrorMessage(errors[0].reason);
				} else if (errors && errors.length > 0) {
					errorMessage = 'Unable to delete!';
				}

				if (!errorMessage && this.props.onConfirm) {
					this.props.onConfirm();
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
		const { onConfirm, text, firstColLabelFunc, secondColLabelFunc } = this.props;

		let selectedItems = [].concat(this.props.selectedItems);
		const selectedItemsLength = selectedItems.length;
		let isSelectedItemsTruncatedMessage = null;

		if (selectedItemsLength > 10) {
			selectedItems = selectedItems.slice(0, 10);
			isSelectedItemsTruncatedMessage = `+ ${selectedItemsLength - 10} More`;
		}

		if (selectedItems) {
			const list = selectedItems.map((item, index) => {
				return (
					<div className="customer-delete-list-item" key={`customer-delete-list-item-${index}`}>
						<span className="list-item-first-col">{firstColLabelFunc(item)}</span>
						<span className="list-item-second-col">{secondColLabelFunc(item)}</span>
					</div>
				);
			});

			return (
				<div className="customer-delete-component-modal">
					<div>{text}</div>

					<div className="customer-delete-list">{list}</div>
					{isSelectedItemsTruncatedMessage ? (
						<div>
							&hellip;
							<br />
							{isSelectedItemsTruncatedMessage}
						</div>
					) : null}

					<div className="customer-delete-list-error">{multipleDeleteError}</div>

					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							{!finishedDeletingItems && (
								<ButtonComponent
									type="cancel"
									callback={() => ModalService.close(true)}
									label={'Cancel'}
									dataQsId="modal-btn-cancel"
								/>
							)}
						</div>
						<div className="modal-base-confirm">
							{finishedDeletingItems && multipleDeleteError ? (
								<ButtonComponent
									buttonIcon={'icon-check'}
									type={'primary'}
									callback={() => onConfirm && onConfirm()}
									label={'Delete'}
									dataQsId="modal-btn-confirm"
								/>
							) : (
								<ButtonComponent
									buttonIcon={this.state.deleting ? 'loader_spinner' : 'icon-trashcan'}
									type={'danger'}
									disabled={this.state.deleting}
									callback={() => this.onDeleteSelectedConfirm()}
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
}

export default DeleteRowsModal;
