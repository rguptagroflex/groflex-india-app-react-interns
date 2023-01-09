import React from 'react';
import {
	deleteSelectedOffers,
	acceptSelectedOffers,
	rejectSelectedOffers,
	setOpenSelectedOffers
} from 'redux/ducks/offer/offerList';
import { connect } from 'react-redux';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import OfferMultiAction from 'enums/offer/offer-multi-action.enum';
import invoiz from 'services/invoiz.service';
import config from 'config';

class OfferMultiActionComponent extends React.Component {
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
			const list = selectedItems.map(offer => {
				return (
					<div className="offer-multi-action-list-item" key={`offer-multi-action-list-item-${offer.id}`}>
						<span className="list-item-first-col">{offer.number}</span>
						<span className="list-item-second-col">{offer.displayName}</span>
						{finishedProcessingMultiAction && offer.multiProcessSuccess ? (
							<span className="icon icon-check" />
						) : finishedProcessingMultiAction && !offer.multiProcessSuccess ? (
							<span className="icon icon-close" />
						) : null}
					</div>
				);
			});

			let claim = '';
			let confirmButton = '';
			switch (action) {
				case OfferMultiAction.DELETE:
					claim = resources.offersDeleteConfirmText;
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

				case OfferMultiAction.SET_OPEN:
					//claim = resources.offerOpenConfirmText;
					claim = 'Do you really want to change the status of the quotation(s) to open? This cannot be undone!'
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

				case OfferMultiAction.ACCEPT:
					//claim = resources.offerAcceptConfirmText;
					claim = 'Do you really want to change the status of the quotation(s) to accepted? This cannot be undone!'
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

				case OfferMultiAction.REJECT:
					//claim = resources.offerDeclineConfirmText;
					claim = 'Do you really want to change the status of the quotation(s) to declined? This cannot be undone!'
					confirmButton = (
						<ButtonComponent
							buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-close'}
							type={'secondary'}
							disabled={this.state.processing}
							callback={() => this.onProcessConfirm()}
							label={resources.str_decline}
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
			case OfferMultiAction.DELETE:
				this.props.deleteSelectedOffers();
				break;

			case OfferMultiAction.SET_OPEN:
				//this.props.setOpenSelectedOffers();
				selectedItems.map(offer => {
					return new Promise((resolve, reject) => {
						invoiz
							.request(`${config.resourceHost}offer/${offer.id}/state`, {
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

			case OfferMultiAction.ACCEPT:
				//this.props.acceptSelectedOffers();
				selectedItems.map(offer => {
					return new Promise((resolve, reject) => {
						invoiz
							.request(`${config.resourceHost}offer/${offer.id}/state`, {
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

			case OfferMultiAction.REJECT:
				//this.props.rejectSelectedOffers();
				selectedItems.map(offer => {
					return new Promise((resolve, reject) => {
						invoiz
							.request(`${config.resourceHost}offer/${offer.id}/state`, {
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
// 		deleteSelectedOffers: () => {
// 			dispatch(deleteSelectedOffers());
// 		},
// 		acceptSelectedOffers: () => {
// 			dispatch(acceptSelectedOffers());
// 		},
// 		rejectSelectedOffers: () => {
// 			dispatch(rejectSelectedOffers());
// 		},
// 		setOpenSelectedOffers: () => {
// 			dispatch(setOpenSelectedOffers());
// 		}
// 	};
// };

const mapStateToProps = state => {
	// const { selectedItems, finishedProcessingMultiAction } = state.offer.offerList;
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
)(OfferMultiActionComponent);
