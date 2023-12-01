import invoiz from 'services/invoiz.service';
import React from 'react';
import TopbarComponent from 'shared/topbar/topbar.component';
import {
	fetchOfferList,
	sortOfferList,
	paginateOfferList,
	filterOfferList,
	searchOfferList,
	deleteOffer,
	selectAllOffers,
	selectOffer,
	deleteSelectedOffers
} from 'redux/ducks/offer/offerList';
import { connect, Provider } from 'react-redux';
import store from 'redux/store';
import ListComponent from 'shared/list/list.component';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatDate } from 'helpers/formatDate';
import PopoverComponent from 'shared/popover/popover.component';
import PaginationComponent from 'shared/pagination/pagination.component';
import FilterComponent from 'shared/filter/filter.component';
import ModalService from 'services/modal.service';
import { copyAndEditTransaction } from 'helpers/transaction/copyAndEditTransaction';
import ButtonComponent from 'shared/button/button.component';
import OfferMultiActionComponent from 'shared/offer-multi-action/offer-multi-action.component';
import OfferMultiAction from 'enums/offer/offer-multi-action.enum';
import OfferState from 'enums/offer/offer-state.enum';
import OfferTypes from 'enums/impress/offer-types.enum';
import LoadingService from 'services/loading.service';
import SharedDataService from 'services/shared-data.service';
import ListSearchComponent from 'shared/list-search/list-search.component';

import userPermissions from 'enums/user-permissions.enum';

class OfferListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			canCreateOffer: null,
			canUpdateOffer: null,
			canDeleteOffer: null,
			canCreateImprezzOffer: null,
			canUpdateImprezzOffer: null,
			canDeleteImprezzOffer: null,
			canAcceptOffer: null,
			canRejectOffer: null
		};
	}
	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_OFFER)) {
			invoiz.user.logout(true);
		}
		this.props.fetchOfferList(true, this.props.isImpressOfferList);
		this.setState({
			canCreateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_OFFER),
			canDeleteOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_OFFER),
			canUpdateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_OFFER),
			canCreateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_IMPREZZ_OFFER),
			canUpdateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_IMPREZZ_OFFER),
			canDeleteImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_IMPREZZ_OFFER),
			canAcceptOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.ACCEPT_OFFER),
			canRejectOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.REJECT_OFFER)
		});
	}

	render() {
		const {
			isLoading,
			columns,
			currentPage,
			totalPages,
			filterItems,
			offerListData: { offers, meta },
			allSelected,
			selectedItems,
			searchText,
			resources
		} = this.props;

		const tableRows = this.createTableRows(offers);
		const allCount = meta && meta.filter && meta.filter.all && meta.filter.all.count;
		const { canCreateOffer, canDeleteOffer, canUpdateOffer, canCreateImprezzOffer, canAcceptOffer, canRejectOffer } = this.state;

		const listContent = (
			<div>
				<ListComponent
					allSelected={allSelected}
					selectable={canDeleteOffer && canAcceptOffer && canRejectOffer}
					selectedCallback={(id, isChecked) => this.onSelected(id, isChecked)}
					selectedAllCallback={isChecked => this.onAllSelected(isChecked)}
					clickable={true}
					rowCallback={(offerId, row) => this.onRowClick(offerId, row)}
					sortable={true}
					columns={columns}
					rows={tableRows}
					columnCallback={column => this.onSort(column)}
					resources={resources}
				/>

				{totalPages > 1 ? (
					<div className="offer-list-pagination">
						<PaginationComponent
							currentPage={currentPage}
							totalPages={totalPages}
							onPaginate={page => this.onPaginate(page)}
						/>
					</div>
				) : null}
			</div>
		);

		const emptyListContent = this.props.isImpressOfferList ? (
			<div className="empty-list-box">
				<div className="text-placeholder icon icon-paint" />
				<div className="text-h2">{resources.offerImpressListHeadingText}</div>
				<div className="">{resources.offerImpressCreateNow}</div>
				<ButtonComponent
					label={resources.str_hereWeGo}
					buttonIcon="icon-plus"
					dataQsId="empty-impress-list-create-button"
					callback={() => invoiz.router.navigate('/')}
					disabled={!canCreateOffer}
				/>
			</div>
		) : (
			<div className="empty-list-box">
				<div className="text-placeholder icon icon-offer" />
				<div className="text-h2">{resources.offerListHeadingText}</div>
				<div className="">{resources.offerCreateNow}</div>
				<ButtonComponent
					label={resources.str_hereWeGo}
					buttonIcon="icon-plus"
					dataQsId="empty-list-create-button"
					callback={() => invoiz.router.navigate('/offer/new')}
					disabled={!canCreateOffer}
				/>
			</div>
		);

		const topbarButtons = [];

		if (canCreateOffer) {
			if (!this.props.isImpressOfferList) {
				topbarButtons.push({
					type: 'primary',
					label: resources.str_createOffer,
					buttonIcon: 'icon-plus',
					action: 'create'
				});
			}
		}
				
		if (selectedItems && selectedItems.length > 0) {
			let allCanBeAccepted = true;
			let allCanBeRejected = true;
			let allCanBeSetOpen = true;

			selectedItems.forEach(offer => {
				if (offer.state !== OfferState.OPEN && offer.state !== OfferState.REJECTED) {
					allCanBeAccepted = false;
				}

				if (offer.state !== OfferState.OPEN && offer.state !== OfferState.ACCEPTED) {
					allCanBeRejected = false;
				}

				if (offer.state !== OfferState.ACCEPTED && offer.state !== OfferState.REJECTED) {
					allCanBeSetOpen = false;
				}
			});

			if (allCanBeAccepted) {
				topbarButtons.push({
					type: 'primary',
					label: resources.str_accept,
					buttonIcon: 'icon-check',
					action: 'accept-offers'
				});
			}

			topbarButtons.push({
				type: topbarButtons.length < 2 ? 'danger' : 'text',
				label: resources.str_clear,
				buttonIcon: 'icon-trashcan',
				action: 'delete-offers'
			});

			if (allCanBeSetOpen) {
				topbarButtons.push({
					type: topbarButtons.length < 2 ? 'primary' : 'text',
					label: resources.str_openlySet,
					buttonIcon: 'icon-edit',
					action: 'setopen-offers'
				});
			}

			if (allCanBeRejected) {
				topbarButtons.push({
					type: topbarButtons.length < 2 ? 'danger' : 'text',
					label: resources.str_decline,
					buttonIcon: 'icon-close',
					action: 'reject-offers'
				});
			}
		}
		// cmt by sandy
		// if (canCreateImprezzOffer) {
		// 	if (!selectedItems || (selectedItems && selectedItems.length === 0)) {
		// 		topbarButtons.push({
		// 			type: this.props.isImpressOfferList ? 'primary' : 'default',
		// 			label: (
		// 				<span> {resources.offerImpressCreateText} {/* <sup>{resources.str_beta}</sup> */}
		// 				</span>
		// 			),
		// 			buttonIcon: 'icon-paint',
		// 			action: 'create-impress-offer'
		// 		});
		// 	}
		// }

		topbarButtons.reverse();

		const topbar = (
			<TopbarComponent
				title={resources.str_deals}
				viewIcon={`icon-offer`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
				buttons={topbarButtons}
			/>
		);

		return (
			<div className="offer-list-component-wrapper">
				{topbar}

				<div className="offer-list-head">
					<div className="offer-list-head-content">
						<ListSearchComponent
							value={searchText}
							placeholder={resources.str_searchOffers}
							onChange={val => this.onSearch(val)}
						/>
						{isLoading ? null : allCount > 0 ? (
							<FilterComponent items={filterItems} onChange={filter => this.onFilterList(filter)} resources={resources} />
						) : null}{' '}
					</div>
				</div>

				<div className="box offer-list-wrapper">
					{isLoading ? null : allCount > 0 ? (
						listContent
					) : searchText.trim().length > 0 ? (
						<div className="empty-list-box">{resources.offerEmptySearchResultText}</div>
					) : isLoading ? null : (
						emptyListContent
					)}
				</div>
			</div>
		);
	}

	createOffer() {
		invoiz.router.navigate('/offer/new');
	}

	onTopbarButtonClick(action) {
		const { resources } = this.props;
		switch (action) {
			case 'create':
				this.createOffer();
				break;
			case 'create-impress-offer':
				SharedDataService.set(
					'offer-impress-templates-returnToImpressOfferList',
					this.props.isImpressOfferList
				);
				invoiz.router.navigate('/');
				break;
			case 'delete-offers':
				ModalService.open(
					<Provider store={store}>
						<OfferMultiActionComponent
							action={OfferMultiAction.DELETE}
							onConfirm={() => this.onMultiActionConfirmed()}
						/>
					</Provider>,
					{
						width: 500,
						headline: resources.str_deleteOffers
					}
				);
				break;
			case 'accept-offers':
				ModalService.open(
					<Provider store={store}>
						<OfferMultiActionComponent
							action={OfferMultiAction.ACCEPT}
							onConfirm={() => this.onMultiActionConfirmed()}
						/>
					</Provider>,
					{
						width: 500,
						headline: resources.str_acceptOffers
					}
				);
				break;
			case 'reject-offers':
				ModalService.open(
					<Provider store={store}>
						<OfferMultiActionComponent
							action={OfferMultiAction.REJECT}
							onConfirm={() => this.onMultiActionConfirmed()}
						/>
					</Provider>,
					{
						width: 500,
						headline: resources.str_rejectOffers
					}
				);
				break;

			case 'setopen-offers':
				ModalService.open(
					<Provider store={store}>
						<OfferMultiActionComponent
							action={OfferMultiAction.SET_OPEN}
							onConfirm={() => this.onMultiActionConfirmed()}
						/>
					</Provider>,
					{
						width: 500,
						headline: resources.str_openOffers
					}
				);
				break;
		}
	}

	onSelected(id, checked) {
		this.props.selectOffer(id, checked);
	}

	onAllSelected(checked) {
		this.props.selectAllOffers(checked);
	}

	onMultiActionConfirmed() {
		ModalService.close();
		this.props.fetchOfferList(true, this.props.isImpressOfferList);
	}

	onRowClick(offerId, row) {
		const { offer } = row;
		if (offer.type === 'impress') {
			// if (offer.state !== OfferState.DRAFT) {
			// 	invoiz.router.navigate(`/offer/impress/${offerId}`);
			// } else {
			// 	// invoiz.router.navigate(`/offer/impress/edit/${offerId}`);
			// 	invoiz.router.navigate(`/offer/impress/detail/${offerId}`);
			// }
			invoiz.router.navigate(`/offer/impress/detail/${offerId}`);
		} else {
			invoiz.router.navigate(`/offer/${offerId}`);
		}
	}

	onDropdownEntryClick(offer, entry) {
		const isImpress = offer.type === 'impress';
		const { resources } = this.props;
		switch (entry.action) {
			case 'edit':
				if (isImpress) {
					setTimeout(() => {
						invoiz.router.navigate(`/offer/impress/edit/${offer.id}`);
					});
				} else {
					setTimeout(() => {
						invoiz.router.navigate(`/offer/edit/${offer.id}`);
					});
				}
				break;

			case 'copyAndEdit':
				LoadingService.show(resources.str_offerCopy);
				copyAndEditTransaction({
					invoiceModel: {
						type: 'offer',
						id: offer.id
					},
					onCopySuccess: () => {
						LoadingService.hide();
					},
					onCopyError: () => {
						LoadingService.hide();
					}
				});
				break;

			case 'delete':
				ModalService.open(resources.offerDeleteConfirmText, {
					width: 500,
					headline: resources.str_deleteOffer,
					cancelLabel: resources.str_abortStop,
					confirmIcon: 'icon-trashcan',
					confirmLabel: resources.str_clear,
					confirmButtonType: 'secondary',
					onConfirm: () => {
						ModalService.close();
						this.props.deleteOffer(offer.id, offer.number, this.props.isImpressOfferList);
					}
				});
				break;
		}
	}

	onFilterList(filter) {
		this.props.filterOfferList(filter, this.props.isImpressOfferList);
	}

	onPaginate(page) {
		this.props.paginateOfferList(page, this.props.isImpressOfferList);
		window.scrollTo(0, 0);
	}

	onSort(column) {
		this.props.sortOfferList(column, this.props.isImpressOfferList);
	}

	onSearch(searchText) {
		this.props.searchOfferList(searchText, this.props.isImpressOfferList);
	}

	createTableRows(offers) {
		const rows = [];
		const { resources } = this.props;
		const { canCreateOffer, canCreateImprezzOffer, canUpdateOffer, canUpdateImprezzOffer, canDeleteOffer, canDeleteImprezzOffer } = this.state;
		const dropdownEntries = [
			{
				dataQsId: `offer-list-item-dropdown-entry-edit`,
				label: resources.str_toEdit,
				action: 'edit'
			},
			{
				dataQsId: `offer-list-item-dropdown-entry-copy-and-edit`,
				label: resources.str_copyEdit,
				action: 'copyAndEdit'
			},
			{
				dataQsId: `offer-list-item-dropdown-entry-delete`,
				label: resources.str_clear,
				action: 'delete'
			}
		];

		let dropdown;

		
			if (offers) {
				offers.forEach((offer, index) => {
					if (canUpdateOffer && canDeleteOffer && canCreateOffer) {
					dropdown = (
						<div
							className="offer-list-cell-dropdown icon icon-arr_down"
							id={`offer-list-dropdown-anchor-${index}`}
						>
							<PopoverComponent
								showOnClick={true}
								contentClass={`offer-list-cell-dropdown-content`}
								entries={[dropdownEntries]}
								onClick={entry => this.onDropdownEntryClick(offer, entry)}
								elementId={`offer-list-dropdown-anchor-${index}`}
								offsetLeft={-3}
								offsetTop={10}
							/>
						</div>
					);
				}
					rows.push({
						id: offer.id,
						offer,
						selected: offer.selected,
						cells: [
							{ value: offer.state === OfferState.DRAFT ? resources.str_draft : offer.number },
							{ value: offer.displayName },
							{ value: formatDate(offer.date) },
							{ value: formatCurrency(offer.totalGross) },
							{ value: offer.type === OfferTypes.IMPRESS ? <div className="icon icon-paint" /> : '' },
							{ value: dropdown }
						]
					});
				});
				
		}

		

		return rows;
	}
}

const mapStateToProps = state => {
	const {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		filterItems,
		allSelected,
		selectedItems,
		offerListData,
		searchText
	} = state.offer.offerList;
	const { resources } = state.language.lang;
	return {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		filterItems,
		allSelected,
		selectedItems,
		offerListData,
		searchText,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchOfferList: (reset, isImpressOfferList) => {
			dispatch(fetchOfferList(reset, isImpressOfferList));
		},
		paginateOfferList: (page, isImpressOfferList) => {
			dispatch(paginateOfferList(page, isImpressOfferList));
		},
		sortOfferList: (column, isImpressOfferList) => {
			dispatch(sortOfferList(column, isImpressOfferList));
		},
		filterOfferList: (filterItem, isImpressOfferList) => {
			dispatch(filterOfferList(filterItem, isImpressOfferList));
		},
		searchOfferList: (searchText, isImpressOfferList) => {
			dispatch(searchOfferList(searchText, isImpressOfferList));
		},
		deleteOffer: (id, number, isImpressOfferList) => {
			dispatch(deleteOffer(id, number, isImpressOfferList));
		},
		selectOffer: (id, checked) => {
			dispatch(selectOffer(id, checked));
		},
		selectAllOffers: selected => {
			dispatch(selectAllOffers(selected));
		},
		deleteSelectedOffers: () => {
			dispatch(deleteSelectedOffers());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(OfferListComponent);
