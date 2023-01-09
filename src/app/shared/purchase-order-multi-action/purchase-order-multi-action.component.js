import React from 'react';
import {
	deleteSelectedPurchaseOrders,
	acceptSelectedPurchaseOrders,
	rejectSelectedPurchaseOrders,
	setOpenSelectedPurchaseOrders
} from 'redux/ducks/purchase-order/purchaseOrderList';
import { connect } from 'react-redux';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import PurchaseOrderMultiAction from 'enums/purchase-order/purchase-order-multi-action.enum';
import invoiz from 'services/invoiz.service';
import config from 'config';

class PurchaseOrderMultiActionComponent extends React.Component {
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
		const { selectedItems, onConfirm, finishedProcessingMultiAction, action, resources } = this.props;
		if (selectedItems) {
			const list = selectedItems.map(purchaseOrder => {
				return (
					<div className="offer-multi-action-list-item" key={`offer-multi-action-list-item-${purchaseOrder.id}`}>
						<span className="list-item-first-col">{purchaseOrder.number}</span>
						<span className="list-item-second-col">{purchaseOrder.displayName}</span>
						{finishedProcessingMultiAction && purchaseOrder.multiProcessSuccess ? (
							<span className="icon icon-check" />
						) : finishedProcessingMultiAction && !purchaseOrder.multiProcessSuccess ? (
							<span className="icon icon-close" />
						) : null}
					</div>
				);
			});

			let claim = '';
			let confirmButton = '';
			switch (action) {
				case PurchaseOrderMultiAction.DELETE:
					claim = resources.purchaseOrderDeleteConfirmText;
					confirmButton = (
						<ButtonComponent
							buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-trashcan'}
							type={'secondary'}
							disabled={this.state.processing}
							callback={() => this.onProcessConfirm()}
							label={resources.str_clear}
							dataQsId="modal-btn-confirm"
						/>
					);
					break;

				case PurchaseOrderMultiAction.SET_OPEN:
					// claim = resources.purchaseOrderOpenConfirmText;
					claim = 'Do you really want to change the status of the purchase order(s) to open? This cannot be undone!'
					confirmButton = (
						<ButtonComponent
							buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-edit'}
							type={'default'}
							disabled={this.state.processing}
							callback={() => this.onProcessConfirm()}
							label={'Set to open'}
							dataQsId="modal-btn-confirm"
						/>
					);
					break;

				case PurchaseOrderMultiAction.ACCEPT:
					claim = 'Do you really want to change the status of the purchase order(s) to accepted? This cannot be undone!';
					confirmButton = (
						<ButtonComponent
							buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-check'}
							type={'primary'}
							disabled={this.state.processing}
							callback={() => this.onProcessConfirm()}
							label={'Set to accepted'}
							dataQsId="modal-btn-confirm"
						/>
					);
					break;

				case PurchaseOrderMultiAction.REJECT:
					claim = 'Do you really want to change the status of the purchase order(s) to declined? This cannot be undone!';
					confirmButton = (
						<ButtonComponent
							buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-close'}
							type={'secondary'}
							disabled={this.state.processing}
							callback={() => this.onProcessConfirm()}
							label={'Set to declined'}
							dataQsId="modal-btn-confirm"
						/>
					);
					break;
			}

			return (
				<div className="offer-multi-action-component-wrapper">
					<div>{claim}</div>

					<div className="offer-multi-action-list">{list}</div>

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
									label={'Close'}
									dataQsId="modal-btn-confirm"
								/>
							) : (
								confirmButton
							)}
						</div>
					</div>
				</div>
			);
		}
	}

	onProcessConfirm() {
		const { action, onConfirm, selectedItems } = this.props;

		this.setState({ processing: true });

		switch (action) {
			case PurchaseOrderMultiAction.DELETE:
				//this.props.deleteSelectedPurchaseOrders();
				break;

			case PurchaseOrderMultiAction.SET_OPEN:
				// this.props.setOpenSelectedPurchaseOrders();				

				selectedItems.map(purchaseOrder => {
					return new Promise((resolve, reject) => {
						invoiz
							.request(`${config.resourceHost}purchaseOrder/${purchaseOrder.id}/state`, {
								auth: true,
								method: 'PUT',
								data: { state: 'open' }
							})
							.then(() => {
								resolve();
								this.setState({processing: false}, () => {									
									onConfirm();
								});								
							})
							.catch(err => {

								reject(err);
								return err;
							});
					});
				});
	
				break;

			case PurchaseOrderMultiAction.ACCEPT:
				//this.props.acceptSelectedPurchaseOrders();
				selectedItems.map(purchaseOrder => {
					return new Promise((resolve, reject) => {
						invoiz
							.request(`${config.resourceHost}purchaseOrder/${purchaseOrder.id}/state`, {
								auth: true,
								method: 'PUT',
								data: { state: 'accepted' }
							})
							.then(() => {
								resolve();
								this.setState({processing: false}, () => {									
									onConfirm();
								});								
							})
							.catch(err => {
								reject(err);
								return err;
							});
					});
				});
				break;

			case PurchaseOrderMultiAction.REJECT:
				//this.props.rejectSelectedPurchaseOrders();
				selectedItems.map(purchaseOrder => {
					return new Promise((resolve, reject) => {
						invoiz
							.request(`${config.resourceHost}purchaseOrder/${purchaseOrder.id}/state`, {
								auth: true,
								method: 'PUT',
								data: { state: 'rejected' }
							})
							.then(() => {
								resolve();
								this.setState({processing: false}, () => {									
									onConfirm();
								});								
							})
							.catch(err => {

								reject(err);
								return err;
							});
					});
				});
				break;
		}
	}
}

// const mapDispatchToProps = dispatch => {
// 	return {
// 		deleteSelectedPurchaseOrders: () => {
// 			dispatch(deleteSelectedPurchaseOrders());
// 		},
// 		acceptSelectedPurchaseOrders: () => {
// 			dispatch(acceptSelectedPurchaseOrders());
// 		},
// 		rejectSelectedPurchaseOrders: () => {
// 			dispatch(rejectSelectedPurchaseOrders());
// 		},
// 		setOpenSelectedPurchaseOrders: () => {
// 			dispatch(setOpenSelectedPurchaseOrders());
// 		}
// 	};
// };

const mapStateToProps = state => {
	// const { selectedItems, finishedProcessingMultiAction } = state.purchaseOrder.purchaseOrderList;
	const { resources } = state.language.lang;
	return {
		// selectedItems,
		// finishedProcessingMultiAction,
		resources
	};
};

export default connect(
	mapStateToProps,
	// mapDispatchToProps
)(PurchaseOrderMultiActionComponent);
// export default PurchaseOrderMultiActionComponent;
