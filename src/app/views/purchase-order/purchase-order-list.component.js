import invoiz from 'services/invoiz.service';
import React from 'react';
import TopbarComponent from 'shared/topbar/topbar.component';
import {
	fetchPurchaseOrderList,
	sortPurchaseOrderList,
	paginatePurchaseOrderList,
	filterPurchaseOrderList,
	searchPurchaseOrderList,
	deletePurchaseOrder,
	selectAllPurchaseOrders,
	selectPurchaseOrder,
	deleteSelectedPurchaseOrders
} from 'redux/ducks/purchase-order/purchaseOrderList';
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
import PurchaseOrderMultiActionComponent from 'shared/purchase-order-multi-action/purchase-order-multi-action.component';
import PurchaseOrderMultiAction from 'enums/purchase-order/purchase-order-multi-action.enum';
import PurchaseOrderState from 'enums/purchase-order/purchase-order-state.enum';
import OfferTypes from 'enums/impress/offer-types.enum';
import LoadingService from 'services/loading.service';
import ListSearchComponent from 'shared/list-search/list-search.component';
import userPermissions from 'enums/user-permissions.enum';

class PurchaseOrderListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			canCreatePurchaseOrder: null,
			canUpdatePurchaseOrder: null,
			canDeletePurchaseOrder: null
		};
	}
	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_PURCHASE_ORDER)) {
			invoiz.user.logout(true);
		}
		this.props.fetchPurchaseOrderList(true);
		this.setState({
			canCreatePurchaseOrder: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_PURCHASE_ORDER),
			canUpdatePurchaseOrder: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_PURCHASE_ORDER),
			canDeletePurchaseOrder: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_PURCHASE_ORDER)
		});
	}

	render() {
		const {
			isLoading,
			columns,
			currentPage,
			totalPages,
			filterItems,
			purchaseOrderListData: { purchaseOrders, meta },
			allSelected,
			selectedItems,
			searchText,
			resources
		} = this.props;

		const { canCreatePurchaseOrder, canUpdatePurchaseOrder, canDeletePurchaseOrder } = this.state;

		const tableRows = this.createTableRows(purchaseOrders);
		const allCount = meta && meta.filter && meta.filter.all && meta.filter.all.count;

		const listContent = (
			<div>
				<ListComponent
					allSelected={allSelected}
					selectable={canDeletePurchaseOrder}
					selectedCallback={(id, isChecked) => this.onSelected(id, isChecked)}
					selectedAllCallback={isChecked => this.onAllSelected(isChecked)}
					clickable={true}
					rowCallback={(purchaseOrderId, row) => this.onRowClick(purchaseOrderId, row)}
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
					disabled={!canCreatePurchaseOrder}
				/>
			</div>
		) : (
			<div className="empty-list-box">
				<div className="text-placeholder icon icon-order" />
				<div className="text-h2">{resources.purchaseOrderListHeadingText}</div>
				<div className="">{resources.purchaseOrderCreateNow}</div>
				<ButtonComponent
					label={resources.str_hereWeGo}
					buttonIcon="icon-plus"
					dataQsId="empty-list-create-button"
					callback={() => invoiz.router.navigate('/purchase-order/new')}
					disabled={!canCreatePurchaseOrder}
				/>
			</div>
		);

		const topbarButtons = [];

		if (!this.props.isImpressOfferList) {
			if (canCreatePurchaseOrder) {
				topbarButtons.push({
					type: 'primary',
					label: resources.str_createPurchaseOrder,
					buttonIcon: 'icon-plus',
					action: 'create'
				});
			}			
		}

		if (selectedItems && selectedItems.length > 0) {
			let allCanBeAccepted = true;
			let allCanBeRejected = true;
			let allCanBeSetOpen = true;

			selectedItems.forEach(purchaseOrder => {
				if (purchaseOrder.state !== PurchaseOrderState.OPEN && purchaseOrder.state !== PurchaseOrderState.REJECTED) {
					allCanBeAccepted = false;
				}

				if (purchaseOrder.state !== PurchaseOrderState.OPEN && purchaseOrder.state !== PurchaseOrderState.ACCEPTED) {
					allCanBeRejected = false;
				}

				if (purchaseOrder.state !== PurchaseOrderState.ACCEPTED && purchaseOrder.state !== PurchaseOrderState.REJECTED) {
					allCanBeSetOpen = false;
				}
			});

			if (allCanBeAccepted) {
				topbarButtons.push({
					type: 'primary',
					label: resources.str_accept,
					buttonIcon: 'icon-check',
					action: 'accept-purchase-orders'
				});
			}

			topbarButtons.push({
				type: topbarButtons.length < 2 ? 'danger' : 'text',
				label: resources.str_clear,
				buttonIcon: 'icon-trashcan',
				action: 'delete-purchase-orders'
			});

			if (allCanBeSetOpen) {
				topbarButtons.push({
					type: topbarButtons.length < 2 ? 'primary' : 'text',
					label: resources.str_openlySet,
					buttonIcon: 'icon-edit',
					action: 'setopen-purchase-orders'
				});
			}

			if (allCanBeRejected) {
				topbarButtons.push({
					type: topbarButtons.length < 2 ? 'danger' : 'text',
					label: resources.str_decline,
					buttonIcon: 'icon-close',
					action: 'reject-purchase-orders'
				});
			}
		}

		topbarButtons.reverse();

		const topbar = (
			<TopbarComponent
				title={resources.str_purchaseOrders}
				viewIcon={`icon-order`}
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
							placeholder={resources.str_searchPurchaseOrders}
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
						<div className="empty-list-box">{resources.purchaseOrderEmptySearchResultText}</div>
					) : isLoading ? null : (
						emptyListContent
					)}
				</div>
			</div>
		);
	}

	createPurchaseOrder() {
		invoiz.router.navigate('/purchase-order/new');
	}

	onTopbarButtonClick(action) {
		const { resources } = this.props;
		switch (action) {
			case 'create':
				this.createPurchaseOrder();
				break;
			case 'delete-purchase-orders':
				ModalService.open(
					<Provider store={store}>
						<PurchaseOrderMultiActionComponent
							action={PurchaseOrderMultiAction.DELETE}
							onConfirm={() => this.onMultiActionConfirmed()}
						/>
					</Provider>,
					{
						width: 500,
						headline: resources.str_deletePurchaseOrders
					}
				);
				break;
			case 'accept-purchase-orders':
				ModalService.open(
					<Provider store={store}>
						<PurchaseOrderMultiActionComponent
							action={PurchaseOrderMultiAction.ACCEPT}
							onConfirm={() => this.onMultiActionConfirmed()}
						/>
					</Provider>,
					{
						width: 500,
						headline: resources.str_acceptPurchaseOrders
					}
				);
				break;
			case 'reject-purchase-orders':
				ModalService.open(
					<Provider store={store}>
						<PurchaseOrderMultiActionComponent
							action={PurchaseOrderMultiAction.REJECT}
							onConfirm={() => this.onMultiActionConfirmed()}
						/>
					</Provider>,
					{
						width: 500,
						headline: resources.str_rejectPurchaseOrders
					}
				);
				break;

			case 'setopen-purchase-orders':
				ModalService.open(
					<Provider store={store}>
						<PurchaseOrderMultiActionComponent
							action={PurchaseOrderMultiAction.SET_OPEN}
							onConfirm={() => this.onMultiActionConfirmed()}
						/>
					</Provider>,
					{
						width: 500,
						headline: resources.str_openPurchaseOrders
					}
				);
				break;
		}
	}

	onSelected(id, checked) {
		this.props.selectPurchaseOrder(id, checked);
	}

	onAllSelected(checked) {
		this.props.selectAllPurchaseOrders(checked);
	}

	onMultiActionConfirmed() {
		ModalService.close();
		this.props.fetchPurchaseOrderList(true);
	}

	onRowClick(purchaseOrderId, row) {
		invoiz.router.navigate(`/purchase-order/${purchaseOrderId}`);
	}

	onDropdownEntryClick(purchaseOrder, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case 'edit':
				setTimeout(() => {
					invoiz.router.navigate(`/purchase-order/edit/${purchaseOrder.id}`);
				});
				break;

			case 'copyAndEdit':
				LoadingService.show(resources.str_purchaseOrderCopy);
				copyAndEditTransaction({
					invoiceModel: {
						type: 'purchaseOrder',
						id: purchaseOrder.id,
						navPath: 'purchase-order'
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
				ModalService.open(resources.purchaseOrderDeleteConfirmText, {
					width: 500,
					headline: resources.str_deletePurchaseOrder,
					cancelLabel: resources.str_abortStop,
					confirmIcon: 'icon-trashcan',
					confirmLabel: resources.str_clear,
					confirmButtonType: 'secondary',
					onConfirm: () => {
						ModalService.close();
						this.props.deletePurchaseOrder(purchaseOrder.id, purchaseOrder.number);
					}
				});
				break;
		}
	}

	onFilterList(filter) {
		this.props.filterPurchaseOrderList(filter);
	}

	onPaginate(page) {
		this.props.paginatePurchaseOrderList(page);
		window.scrollTo(0, 0);
	}

	onSort(column) {
		this.props.sortPurchaseOrderList(column);
	}

	onSearch(searchText) {
		this.props.searchPurchaseOrderList(searchText);
	}

	createTableRows(purchaseOrders) {
		const rows = [];
		const { resources } = this.props;
		const { canCreatePurchaseOrder, canDeletePurchaseOrder, canUpdatePurchaseOrder } = this.state;
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

		if (purchaseOrders) {
			purchaseOrders.forEach((purchaseOrders, index) => {
				let dropdown;
		if (canCreatePurchaseOrder && canUpdatePurchaseOrder && canDeletePurchaseOrder) {
			dropdown = (
				<div
					className="offer-list-cell-dropdown icon icon-arr_down"
					id={`purchaseOrders-list-dropdown-anchor-${index}`}
				>
					<PopoverComponent
						showOnClick={true}
						contentClass={`offer-list-cell-dropdown-content`}
						entries={[dropdownEntries]}
						onClick={entry => this.onDropdownEntryClick(purchaseOrders, entry)}
						elementId={`purchaseOrders-list-dropdown-anchor-${index}`}
						offsetLeft={-3}
						offsetTop={10}
					/>
				</div>
			);
		}				
				rows.push({
					id: purchaseOrders.id,
					purchaseOrders,
					selected: purchaseOrders.selected,
					cells: [
						{ value: purchaseOrders.state === PurchaseOrderState.DRAFT ? resources.str_draft : purchaseOrders.number },
						{ value: purchaseOrders.displayName },
						{ value: formatDate(purchaseOrders.date) },
						{ value: formatCurrency(purchaseOrders.totalGross) },
						{ value: purchaseOrders.type === OfferTypes.IMPRESS ? <div className="icon icon-paint" /> : '' },
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
		purchaseOrderListData,
		searchText
	} = state.purchaseOrder.purchaseOrderList;
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
		purchaseOrderListData,
		searchText,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchPurchaseOrderList: (reset) => {
			dispatch(fetchPurchaseOrderList(reset));
		},
		paginatePurchaseOrderList: (page) => {
			dispatch(paginatePurchaseOrderList(page));
		},
		sortPurchaseOrderList: (column) => {
			dispatch(sortPurchaseOrderList(column));
		},
		filterPurchaseOrderList: (filterItem) => {
			dispatch(filterPurchaseOrderList(filterItem));
		},
		searchPurchaseOrderList: (searchText) => {
			dispatch(searchPurchaseOrderList(searchText));
		},
		deletePurchaseOrder: (id, number) => {
			dispatch(deletePurchaseOrder(id, number));
		},
		selectPurchaseOrder: (id, checked) => {
			dispatch(selectPurchaseOrder(id, checked));
		},
		selectAllPurchaseOrders: selected => {
			dispatch(selectAllPurchaseOrders(selected));
		},
		deleteSelectedPurchaseOrders: () => {
			dispatch(deleteSelectedPurchaseOrders());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(PurchaseOrderListComponent);
