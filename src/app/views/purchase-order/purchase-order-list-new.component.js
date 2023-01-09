import React from 'react';
import invoiz from 'services/invoiz.service';
import lang from 'lang';
import moment from 'moment';
import config from 'config';
import _ from 'lodash';
import accounting from 'accounting';
import TopbarComponent from 'shared/topbar/topbar.component';
import ListAdvancedComponent from 'shared/list-advanced/list-advanced.component';
import ButtonComponent from 'shared/button/button.component';
import WebStorageKey from 'enums/web-storage-key.enum';
// import InvoiceState from 'enums/invoice/invoice-state.enum';
import PurchaseOrder from 'models/purchase-order.model';
import Payment from 'models/payment.model';
import LoadingService from 'services/loading.service';
import ModalService from 'services/modal.service';
import DeleteRowsModal from 'shared/modals/list-advanced/delete-rows-modal.component';
import { ListAdvancedDefaultSettings, transactionTypes } from 'helpers/constants';
import { localeCompare, localeCompareNumeric, dateCompare, dateCompareSort } from 'helpers/sortComparators';
import { getScaledValue } from 'helpers/getScaledValue';
import { formatCurrency } from 'helpers/formatCurrency';
import { copyAndEditTransaction } from 'helpers/transaction/copyAndEditTransaction';
import { printPdf, printPdfPrepare } from 'helpers/printPdf';
import { updateStatusIconCellColumns } from 'helpers/list-advanced/updateStatusIconCellColumns';
import { connect, Provider } from 'react-redux';
import store from 'redux/store';
import InvoiceMultiActionComponent from 'shared/invoice-multi-action/invoice-multi-action.component';
import userPermissions from 'enums/user-permissions.enum';
import { formatDate, formatApiDate } from 'helpers/formatDate';
import PurchaseOrderState from 'enums/purchase-order/purchase-order-state.enum';
import OfferTypes from 'enums/impress/offer-types.enum';
import SharedDataService from 'services/shared-data.service';
import purchaseOrder from '../../redux/ducks/purchase-order/index';
import PurchaseOrderMultiActionComponent from 'shared/purchase-order-multi-action/purchase-order-multi-action.component';
import PurchaseOrderMultiAction from 'enums/purchase-order/purchase-order-multi-action.enum';

class PurchaseOrderListNewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			purchaseOrderData: null,
			selectedRows: [],
			canCreatePurchaseOrder: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_PURCHASE_ORDER),
			canUpdatePurchaseOrder: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_PURCHASE_ORDER),
			canDeletePurchaseOrder: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_PURCHASE_ORDER),
			canSetPurchaseOrderOpen: invoiz.user && invoiz.user.hasPermission(userPermissions.SET_PURCHASE_ORDER_OPEN),
			canAcceptPurchaseOrder: invoiz.user && invoiz.user.hasPermission(userPermissions.ACCEPT_PURCHASE_ORDER),
			canRejectPurchaseOrder: invoiz.user && invoiz.user.hasPermission(userPermissions.REJECT_PURCHASE_ORDER),
		};
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_PURCHASE_ORDER)) {
			invoiz.user.logout(true);
		}
	}

	createTopbar() {
		const { isLoading, selectedRows } = this.state;
		const { canCreatePurchaseOrder, canUpdatePurchaseOrder, canDeletePurchaseOrder, canSetPurchaseOrderOpen, canAcceptPurchaseOrder, canRejectPurchaseOrder  } = this.state;
		const { resources } = this.props;
		const topbarButtons = [];

		if (!isLoading) {
			if (selectedRows && selectedRows.length > 0) {
				let allCanBeAccepted = true;
				let allCanBeRejected = true;
				let allCanBeSetOpen = true;
	
				selectedRows.forEach(purchaseOrder => {
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
	
				topbarButtons.push({
					type: topbarButtons.length < 2 ? 'danger' : 'text',
					label: resources.str_clear,
					buttonIcon: 'icon-trashcan',
					action: 'delete-purchase-orders',
					disabled: !canDeletePurchaseOrder
				});

				if (allCanBeAccepted) {
					topbarButtons.push({
						type: 'primary',
						label: resources.str_accept,
						buttonIcon: 'icon-check',
						action: 'accept-purchase-orders',
						disabled: !canAcceptPurchaseOrder
					});
				}

				if (allCanBeSetOpen) {
					topbarButtons.push({
						type: topbarButtons.length < 2 ? 'primary' : 'text',
						label: resources.str_openlySet,
						buttonIcon: 'icon-edit',
						action: 'setopen-purchase-orders',
						disabled: !canSetPurchaseOrderOpen
					});
				}
	
				if (allCanBeRejected) {
					topbarButtons.push({
						type: topbarButtons.length < 2 ? 'danger' : 'text',
						label: resources.str_decline,
						buttonIcon: 'icon-close',
						action: 'reject-purchase-orders',
						disabled: !canRejectPurchaseOrder
					});
				}
	
			}

			if (canCreatePurchaseOrder) {
				topbarButtons.push({
					type: 'primary',
					label: resources.str_createPurchaseOrder,
					buttonIcon: 'icon-plus',
					action: 'create',
					disabled: !canCreatePurchaseOrder
				});
		}

		}
		topbarButtons.reverse();
		const topbar = (
			<TopbarComponent
			title={resources.str_purchaseOrders}
			viewIcon={`icon-order`}
			buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action, selectedRows)}
			buttons={topbarButtons}
			/>
		);

		return topbar;
	}

	getInvoiceStatusMarkup(value, withText, data) {
		const stateIconLabel = this.getStateIconLabel(value);

		// if (
		// 	withText &&
		// 	data &&
		// 	value === InvoiceState.DUNNED &&
		// 	data.stateOriginal &&
		// 	data.stateOriginal === InvoiceState.DUNNED
		// ) {
		// 	stateIconLabel.text = 'Overdue / Reminded';
		// }

		return `<div class="cell-status-icon"><div class='icon icon-${stateIconLabel.icon}'></div> ${
			withText ? `<span class='cell-status-icon-text'>${stateIconLabel.text}</span>` : ''
		}</div>`;
	}

	getStateIconLabel(value) {
		const iconLabelObj = {};

		switch (value) {
			// case PurchaseOrderState.DRAFT:
			// case PurchaseOrderState.TEMP:
			// 	iconLabelObj.icon = 'entwurf state-draft';
			// 	iconLabelObj.text = 'Draft';
			// 	break;

			case PurchaseOrderState.OPEN:
				iconLabelObj.icon = 'offen state-locked';
				iconLabelObj.text = 'Open';
				break;

			case PurchaseOrderState.ACCEPTED:
				iconLabelObj.icon = 'offen state-paid';
				iconLabelObj.text = 'Accepted';
				break;

			case PurchaseOrderState.REJECTED:
				iconLabelObj.icon = 'storniert state-cancelled';
				iconLabelObj.text = 'Declined';
				break;		

			case PurchaseOrderState.EXPENSED:
				iconLabelObj.icon = 'expense state-paid';
				iconLabelObj.text = 'Expensed';
				break;

			default:
				break;
		}

		return iconLabelObj;
	}

	// getTypeLabel(value) {
	// 	let label = '';

	// 	switch (value) {
	// 		case transactionTypes.TRANSACTION_TYPE_DEPOSIT_INVOICE:
	// 			label = 'Abschlag';
	// 			break;

	// 		case transactionTypes.TRANSACTION_TYPE_RECURRING_INVOICE:
	// 			label = 'Recurring invoice';
	// 			break;

	// 		case transactionTypes.TRANSACTION_TYPE_CLOSING_INVOICE:
	// 			label = 'Schlussrechnung';
	// 			break;

	// 		default:
	// 			label = 'Invoice';
	// 			break;
	// 	}

	// 	return label;
	// }

	onActionCellPopupItemClick(purchaseOrder, entry) {
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
				ModalService.open(
					'Are you sure you want to delete the purchase order? This action cannot be undone!',
					{
						width: 500,
						headline: 'Delete Purchase Order',
						cancelLabel: 'Cancel',
						confirmIcon: 'icon-trashcan',
						confirmLabel: 'Delete',
						confirmButtonType: 'danger',
						onConfirm: () => {
							invoiz
								.request(`${config.resourceHost}purchaseOrder/${purchaseOrder.id}`, {
									auth: true,
									method: 'DELETE',
								})
								.then(() => {
									invoiz.page.showToast({ message: resources.purchaseOrderDeleteSuccessMessage });

									ModalService.close();

									if (this.refs.listAdvanced) {
										this.refs.listAdvanced.removeSelectedRows([purchaseOrder]);
									}
								})
								.catch((res) => {
									invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
								});
						},
					}
				);
				break;
		}
	}

	onTopbarButtonClick(action, selectedRows) {
		const { resources } = this.props;
		switch (action) {
			case 'create':
				invoiz.router.navigate('/purchase-order/new');
				break;
			case 'delete-purchase-orders':
				if (this.refs.listAdvanced) {
					let selectedRowsData = this.refs.listAdvanced.getSelectedRows({
						prop: 'number',
						sort: 'asc',
					});

					selectedRowsData = selectedRowsData.map((purchaseOrder) => {
						return new PurchaseOrder(purchaseOrder);
					});

					ModalService.open(
						<DeleteRowsModal
							deleteUrlPrefix={`${config.resourceHost}purchaseOrder/`}
							text="Are you sure you would like to delete the following purchase order(s)? This action cannot be undone!"
							firstColLabelFunc={(item) => item.number}
							secondColLabelFunc={(item) => item.customerData.name}
							selectedItems={selectedRowsData}
							onConfirm={() => {
								if (this.refs.listAdvanced) {
									this.refs.listAdvanced.removeSelectedRows();
								}

								ModalService.close();
							}}
						/>,
						{
							width: 500,
							headline: 'Delete Purchase Order(s)',
						}
					);
				}
				break;
				case 'accept-purchase-orders':
					ModalService.open(
						<Provider store={store}>
							<PurchaseOrderMultiActionComponent
								action={PurchaseOrderMultiAction.ACCEPT}
								selectedItems={selectedRows}
								onConfirm={() => {
									if (this.refs.listAdvanced) {
									this.refs.listAdvanced.clearSelectedRows();
									this.refs.listAdvanced.fetchRows();
								}
									ModalService.close();
									}
								}
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
								selectedItems={selectedRows}
								onConfirm={() => {
									if (this.refs.listAdvanced) {
										this.refs.listAdvanced.clearSelectedRows();
										this.refs.listAdvanced.fetchRows();
									}
									ModalService.close();
									}
								}
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
								selectedItems={selectedRows}
								onConfirm={() => {
									if (this.refs.listAdvanced) {
										this.refs.listAdvanced.clearSelectedRows();
										this.refs.listAdvanced.fetchRows();
									}
									 ModalService.close();
								}
							}
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

	render() {
		const { resources } = this.props;
		const { canCreatePurchaseOrder, canUpdatePurchaseOrder, canDeletePurchaseOrder } = this.state;
		return (
			<div className="invoice-list-component-wrapper">
				{this.createTopbar()}

				<div className="invoice-list-wrapper">
					<ListAdvancedComponent
						resources={this.props.resources}
						ref="listAdvanced"
						columnDefs={[
							{
								headerName: 'Number',
								field: 'number',
								sort: 'desc',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(86, window.innerWidth, 1600),
								cellRenderer: (evt) => {
									return evt.value === Infinity ? '' : evt.value;
								},
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
								filter: 'agNumberColumnFilter',
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									longName: 'Purchase order number',
									convertNumberToTextFilterOnDemand: true,
								},
							},
							{
								headerName: 'Payee',
								field: 'customerData.name',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter",
							},
							{
								headerName: 'Status',
								field: 'state',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								cellRenderer: (evt) => {
									return this.getInvoiceStatusMarkup(evt.value, true, evt.data);
								},
								comparator: (a, b) => {
									const order = [
										// Bezahlt
										PurchaseOrderState.ACCEPTED,

										// Entwurf
										//purchaseOrder.DRAFT,

										// Offen
										PurchaseOrderState.OPEN,

										// Storniert
										PurchaseOrderState.EXPENSED,

										// Überfällig
										PurchaseOrderState.REJECTED,
									];

									return order.indexOf(a) - order.indexOf(b);
								},
								filterParams: {
									suppressMiniFilter: true,
									valueFormatter: (evt) => {
										return this.getStateIconLabel(evt.value).text;
									},
									values: [
										PurchaseOrderState.ACCEPTED,
										PurchaseOrderState.OPEN,
										PurchaseOrderState.EXPENSED,
										PurchaseOrderState.REJECTED,
									],
								},
								customProps: {
									disableContextMenuCopyItem: true,
									filterListItemValueRenderer: (value, listItemHtml) => {
										const iconHtml = this.getInvoiceStatusMarkup(value);
										$(iconHtml).insertBefore($(listItemHtml).find('.ag-set-filter-item-value'));
									},
									onColumnResized: (evt) => {
										updateStatusIconCellColumns(evt, 96);
									},
								},
							},
							{
								headerName: 'Date',
								field: 'date',
								// filter: 'agDateColumnFilter',
								filter: true,
								comparator: (date1, date2) => dateCompareSort(date1, date2, config.dateFormat.client),
								// filterParams: {
								// 	suppressAndOrCondition: true,
								// 	filterOptions: ListAdvancedDefaultSettings.DATE_FILTER_PARAMS_OPTIONS,
								// 	comparator: (filterLocalDateAtMidnight, cellValue) =>
								// 		dateCompare(filterLocalDateAtMidnight, cellValue, config.dateFormat.client),
								// },
							},
							{
								headerName: 'Currency',
								field: 'baseCurrency',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								hide: true,
								filterParams: {
									suppressMiniFilter: true,
								},
								valueFormatter: (evt) => {
									return evt.value === '' || evt.value === null ? 'INR' : evt.value;
								}
							},
							{
								headerName: 'Total gross',
								field: 'totalGross',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								valueFormatter: (evt) => {
									return formatCurrency(evt.value);
								},
								filter: 'agNumberColumnFilter',
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									calculateHeaderSum: true,
								},
							},
						]}
						defaultSortModel={{
							colId: '',
							sort: 'desc',
						}}
						emptyState={{
							iconClass: 'icon-order',
							headline: resources.purchaseOrderListHeadingText,
							subHeadline: resources.purchaseOrderCreateNow,
							buttons: (
								<React.Fragment>
									<ButtonComponent
					label={resources.str_hereWeGo}
					buttonIcon="icon-plus"
					dataQsId="empty-list-create-button"
					callback={() => invoiz.router.navigate('/purchase-order/new')}
					disabled={!canCreatePurchaseOrder}
				/>
								</React.Fragment>
							),
						}}
                        fetchUrls={[
							`${config.resourceHost}purchaseOrder?offset=0&searchText=&limit=9999999&orderBy=date&desc=true&filter=all&trigger=true`
						]}
						headTabbedFilterItemsFunc={(purchaseOrders) => {
							return [
								{
									filter: {
										field: 'state',
										setNull: true,
									},
									label: 'All',
									count: purchaseOrders.length,
								},
								{
									filter: {
										field: 'state',
										filterType: 'set',
										values: [PurchaseOrderState.OPEN],
									},
									label: 'Open',
									count: purchaseOrders.filter((purchaseOrder) => purchaseOrder.state === PurchaseOrderState.OPEN).length,
								},
								{
									filter: {
										field: 'state',
										filterType: 'set',
										values: [PurchaseOrderState.ACCEPTED],
									},
									label: 'Accepted',
									count: purchaseOrders.filter((purchaseOrder) => purchaseOrder.state === PurchaseOrderState.ACCEPTED).length,
								},
								
								{
									filter: {
										field: 'state',
										filterType: 'set',
										values: [PurchaseOrderState.EXPENSED],
									},
									label: 'Expensed',
									count: purchaseOrders.filter((purchaseOrder) => purchaseOrder.state === PurchaseOrderState.EXPENSED).length,
								},
								{
									filter: {
										field: 'state',
										filterType: 'set',
										values: [PurchaseOrderState.REJECTED],
									},
									label: 'Declined',
									count: purchaseOrders.filter((purchaseOrder) => purchaseOrder.state === PurchaseOrderState.REJECTED)
										.length,
								},
							];
						}}
						responseDataMapFunc={(purchaseOrder) => {
							purchaseOrder = purchaseOrder.map((purchaseOrder) => {
								purchaseOrder = new PurchaseOrder(purchaseOrder);

								const numberBeginsWithZero = purchaseOrder.number.toString().substr(0, 1) === '0';

								const customerNumberBeginsWithZero =
									purchaseOrder.customerData.number.toString().substr(0, 1) === '0';

								purchaseOrder.number =
									purchaseOrder.number.toString().length === 0
										? Infinity
										: isNaN(Number(purchaseOrder.number)) || numberBeginsWithZero
											? purchaseOrder.number
											: Number(purchaseOrder.number);

								// invoice.customerNumber = invoice.customerData
								// 	? isNaN(Number(invoice.customerData.number)) || customerNumberBeginsWithZero
								// 		? invoice.customerData.number
								// 		: Number(invoice.customerData.number)
								// 	: '';

								purchaseOrder.customerName = (purchaseOrder.customerData && purchaseOrder.customerData.name) || '';

								// invoice.customerEmail = (invoice.customer && invoice.customer.email) || '';

								// invoice.customerPhone =
								// 	(invoice.customer &&
								// 		(invoice.customer.phone1 ||
								// 			invoice.customer.phone2 ||
								// 			invoice.customer.mobile)) ||
								// 	'';

								// if (invoice.customerData && invoice.customerData.contact) {
								// 	invoice.customerName = `${invoice.customerName} | ${invoice.customerData.contact.name}`;

								// 	if (invoice.customerData.contact.email) {
								// 		invoice.customerEmail = invoice.customerData.contact.email;
								// 	}

								// 	if (
								// 		invoice.customerData.contact.phone1 ||
								// 		invoice.customerData.contact.phone2 ||
								// 		invoice.customerData.contact.mobile
								// 	) {
								// 		invoice.customerPhone =
								// 			invoice.customerData.contact.phone1 ||
								// 			invoice.customerData.contact.phone2 ||
								// 			invoice.customerData.contact.mobile;
								// 	}
								// }

								// if (invoice.state === InvoiceState.SENT) {
								// 	invoice.state = InvoiceState.LOCKED;
								// } else if (invoice.state === InvoiceState.PRINTED) {
								// 	invoice.state = InvoiceState.PAID;
								// }

								// if (invoice.isOverDueToDate) {
								// 	invoice.stateOriginal = invoice.state;
								// 	invoice.state = InvoiceState.DUNNED;
								// }

								purchaseOrder.date = purchaseOrder.date
									? moment(purchaseOrder.date).format(config.dateFormat.client)
									: '';

								//invoice.vatAmount = invoice.totalGross - invoice.totalNet;

								return purchaseOrder ;
							});

							return purchaseOrder;
						}}
						exportExcelCallbacks={{
							processCellCallback: (params) => {
								let value = params.value;

								// if (params.column.colId === 'state') {
								// 	value = this.getStateIconLabel(value).text;
								// }

								// if (params.column.colId === 'type') {
								// 	value = this.getTypeLabel(value);
								// }

								return value;
							},
						}}
						columnsSettingsModalWidth={680}
						exportFilename={`Exported purchase orders list ${moment().format(config.dateFormat.client)}`}
						multiSelect={true}
						usePagination={true}
						searchFieldPlaceholder={'Purchase Orders'}
						loadingRowsMessage={'Loading purchase orders ...'}
						noFilterResultsMessage={'No purchase orders matched the filter'}
						webStorageKey={WebStorageKey.PURCHASEORDER_LIST_SETTINGS}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								const entries = [];
								let purchaseOrder = null;

								if (item) {
									purchaseOrder = new PurchaseOrder(item);
									if (canUpdatePurchaseOrder) {
										entries.push({
											label: 'Edit',
											action: 'edit',
											dataQsId: 'invoice-list-item-dropdown-entry-edit',
										});
										entries.push({
											label: 'Copy and edit',
											action: 'copyAndEdit',
											dataQsId: 'invoice-list-item-dropdown-copyandedit',
										});
									}
									if (canDeletePurchaseOrder) {
										entries.push({
											label: 'Delete',
											action: 'delete',
											dataQsId: 'invoice-list-item-dropdown-delete',
										});
									}
									if (entries.length === 0) {
										entries.push({
											label: 'No action available',
											customEntryClass: 'popover-entry-disabled',
										});
									}
								}

								return [entries];
							},
							onPopupItemClicked: (itemData, popupEntry) => {
								this.onActionCellPopupItemClick(itemData, popupEntry);
							},
						}}
						onRowDataLoaded={(purchaseOrderData) => {
							if (!this.isUnmounted) {
								this.setState({
									purchaseOrderData,
									isLoading: false,
								});
							}
						}}
						onRowClicked={(purchaseOrder) => {
							invoiz.router.navigate(`/purchase-order/${purchaseOrder.id}`);
						}}
						onRowSelectionChanged={(selectedRows) => {
							if (!this.isUnmounted) {
								this.setState({ selectedRows });
							}
						}}
					/>
				</div>
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return {
		resources
	};
};

export default connect(mapStateToProps)(PurchaseOrderListNewComponent);

