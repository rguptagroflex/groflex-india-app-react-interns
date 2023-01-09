import React from 'react';
import {
	deleteSelectedOffers,
	acceptSelectedOffers,
	rejectSelectedOffers,
	setOpenSelectedOffers,
} from 'redux/ducks/offer/offerList';
import { connect } from 'react-redux';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import OfferMultiAction from 'enums/offer/offer-multi-action.enum';

class OfferMultiActionComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			processing: false,
		};
	}

	componentDidUpdate(prevProps) {
		const { finishedProcessingMultiAction } = this.props;
		if (
			prevProps.finishedProcessingMultiAction !== finishedProcessingMultiAction &&
			finishedProcessingMultiAction
		) {
			const { selectedItems, onConfirm } = this.props;
			const successfulItems = selectedItems.filter((item) => item.multiProcessSuccess);
			if (successfulItems && successfulItems.length === selectedItems.length) {
				onConfirm();
			}
		}
	}

	render() {
		const { selectedItems, onConfirm, finishedProcessingMultiAction, action } = this.props;

		if (selectedItems) {
			const list = selectedItems.map((offer) => {
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
					claim = 'Möchtest du die Angebote wirklich löschen? Dies kann nicht rückgängig gemacht werden!';
					confirmButton = (
						<ButtonComponent
							buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-trashcan'}
							type={'danger'}
							disabled={this.state.processing}
							callback={() => this.onProcessConfirm()}
							label={'Löschen'}
							dataQsId="modal-btn-confirm"
						/>
					);
					break;

				case OfferMultiAction.SET_OPEN:
					claim =
						'Möchtest du die Angebote wirklich auf offen setzen? Dies kann nicht rückgängig gemacht werden!';
					confirmButton = (
						<ButtonComponent
							buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-edit'}
							type={'secondary'}
							disabled={this.state.processing}
							callback={() => this.onProcessConfirm()}
							label={'Auf offen setzen'}
							dataQsId="modal-btn-confirm"
						/>
					);
					break;

				case OfferMultiAction.ACCEPT:
					claim = 'Möchtest du die Angebote wirklich annehmen? Dies kann nicht rückgängig gemacht werden!';
					confirmButton = (
						<ButtonComponent
							buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-check'}
							type={'primary'}
							disabled={this.state.processing}
							callback={() => this.onProcessConfirm()}
							label={'Annehmen'}
							dataQsId="modal-btn-confirm"
						/>
					);
					break;

				case OfferMultiAction.REJECT:
					claim = 'Möchtest du die Angebote wirklich ablehnen? Dies kann nicht rückgängig gemacht werden!';
					confirmButton = (
						<ButtonComponent
							buttonIcon={this.state.processing ? 'loader_spinner' : 'icon-close'}
							type={'danger'}
							disabled={this.state.processing}
							callback={() => this.onProcessConfirm()}
							label={'Ablehnen'}
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
								confirmButton
							)}
						</div>
					</div>
				</div>
			);
		}
	}

	onProcessConfirm() {
		const { action } = this.props;

		this.setState({ processing: true });

		switch (action) {
			case OfferMultiAction.DELETE:
				this.props.deleteSelectedOffers();
				break;

			case OfferMultiAction.SET_OPEN:
				this.props.setOpenSelectedOffers();
				break;

			case OfferMultiAction.ACCEPT:
				this.props.acceptSelectedOffers();
				break;

			case OfferMultiAction.REJECT:
				this.props.rejectSelectedOffers();
				break;
		}
	}
}

const mapDispatchToProps = (dispatch) => {
	return {
		deleteSelectedOffers: () => {
			dispatch(deleteSelectedOffers());
		},
		acceptSelectedOffers: () => {
			dispatch(acceptSelectedOffers());
		},
		rejectSelectedOffers: () => {
			dispatch(rejectSelectedOffers());
		},
		setOpenSelectedOffers: () => {
			dispatch(setOpenSelectedOffers());
		},
	};
};

const mapStateToProps = (state) => {
	const { selectedItems, finishedProcessingMultiAction } = state.offer.offerList;

	return {
		selectedItems,
		finishedProcessingMultiAction,
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(OfferMultiActionComponent);
