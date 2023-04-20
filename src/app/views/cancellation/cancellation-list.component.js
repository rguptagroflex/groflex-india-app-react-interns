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
import InvoiceState from 'enums/invoice/invoice-state.enum';
import Invoice from 'models/invoice.model';
import Cancellation from 'models/cancellation.model';
import ModalService from 'services/modal.service';
import CancelInvoiceModalComponent from 'shared/modals/cancel-invoice-modal.component';
import DeleteCancelInvoiceModalComponent from 'shared/modals/delete-cancel-invoice-modal.component';
import DeleteRowsModal from 'shared/modals/list-advanced/delete-rows-modal.component';
import { ListAdvancedDefaultSettings, transactionTypes } from 'helpers/constants';
import { localeCompare, localeCompareNumeric, dateCompare, dateCompareSort } from 'helpers/sortComparators';
import { getScaledValue } from 'helpers/getScaledValue';
import { formatCurrency } from 'helpers/formatCurrency';
import { connect, Provider } from 'react-redux';
import store from 'redux/store';
import InvoiceMultiActionComponent from 'shared/invoice-multi-action/invoice-multi-action.component';
import userPermissions from 'enums/user-permissions.enum';
import { formatDate, formatApiDate } from 'helpers/formatDate';
import planPermissions from "enums/plan-permissions.enum";
import RestrictedOverlayComponent from "shared/overlay/restricted-overlay.component";

const PAYABLE_STATES = [InvoiceState.DUNNED, InvoiceState.LOCKED, InvoiceState.PARTIALLY_PAID];
const CANCEL_OR_DELETE_STATES = ['open', InvoiceState.DUNNED, InvoiceState.LOCKED];
const CANCEL_STATES = [InvoiceState.PAID, InvoiceState.PARTIALLY_PAID];
const NOT_ALLOWED_TO_COPY = [
	transactionTypes.TRANSACTION_TYPE_DEPOSIT_INVOICE,
	transactionTypes.TRANSACTION_TYPE_CLOSING_INVOICE
];

const debitNoteState = transactionTypes.TRANSACTION_TYPE_CANCELLATION_DEBIT

class CancellationListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			cancellationData: null,
			selectedRows: [],
			cancelType: props.cancelType,
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_CREDIT_NOTE) || invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_DEBIT_NOTE)
		};
	}
	componentDidMount () {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_ACCOUNTING)) {
			invoiz.user.logout(true);
		}
	}
	componentWillUnmount() {
		this.isUnmounted = true;
	}

	createTopbar() {
		const { isLoading, selectedRows, cancelType } = this.state;
		const { resources } = this.props;
		const topbarButtons = [];

		if (!isLoading) {
			if (selectedRows && selectedRows.length > 0) {
				let allDeletable = true;
					topbarButtons.push({
						type: 'danger',
						label: resources.str_clear,
						buttonIcon: 'icon-trashcan',
						action: 'delete-invoices',
					});
				//}
			}

			// topbarButtons.push({
			// 	type: 'primary',
			// 	label: resources.str_makeBillText,
			// 	buttonIcon: 'icon-plus',
			// 	action: 'create',
			// 	disabled: !canCreateInvoice
			// });
		}

		const topbar = (
			<TopbarComponent
				title={ cancelType === debitNoteState ? `Debit notes` : `Credit notes` }
				viewIcon={`icon-rechnung`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action, selectedRows)}
				buttons={topbarButtons}
			/>
		);

		return topbar;
	}

	onActionCellPopupItemClick(invoice, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case 'delete':
				invoice.hideInvoizPay = false;
				const model = new Invoice(invoice);

				if (invoice.invoiceType === 'cancellation') {
					return invoiz.page.showToast({ message: resources.cancellationDeleteErrorMessage, type: 'error' });
				} else if (!invoice.isLocked) {
					ModalService.open(resources.deleteInvoiceWarningMessage,
						{
							headline: resources.str_deleteInvoice,
							cancelLabel: resources.str_abortStop,
							confirmLabel: resources.str_clear,
							confirmIcon: 'icon-trashcan',
							confirmButtonType: 'secondary',
							onConfirm: () => {
								ModalService.close();

								invoiz
									.request(`${config.resourceHost}invoice/${invoice.id}`, {
										auth: true,
										method: 'DELETE',
									})
									.then(() => {
										invoiz.page.showToast({ message: resources.invoiceDeleteSuccessMessage });

										ModalService.close();

										if (this.refs.listAdvanced) {
											this.refs.listAdvanced.removeSelectedRows([invoice]);
										}
									})
									.catch(() => {
										invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
									});
							}
						}
					);
				} else if (CANCEL_STATES.indexOf(invoice.state) > -1) {
					ModalService.open(<CancelInvoiceModalComponent invoice={invoice} resources={resources} />, {
						headline: format(resources.str_cancelInvoice, invoice.number),
						width: 800
					});
				} else {
					ModalService.open(<DeleteCancelInvoiceModalComponent invoice={invoice} isFromList={true} resources={resources} />, {
						width: 800,
						modalClass: 'delete-cancel-invoice-modal-component'
					});
				}
				break;
		}
	}

	onTopbarButtonClick(action, selectedRows) {
		const { resources } = this.props;
		switch (action) {
			case 'create':
				invoiz.router.navigate('/invoice/new');
				break;
			case 'delete-invoices':
				if (this.refs.listAdvanced) {
					let selectedRowsData = this.refs.listAdvanced.getSelectedRows({
						prop: 'number',
						sort: 'asc',
					});

					selectedRowsData = selectedRowsData.map((invoice) => {
						return new Invoice(invoice);
					});

					ModalService.open(
						<DeleteRowsModal
							deleteUrlPrefix={`${config.resourceHost}invoice/`}
							text="Are you would like to delete the following invoice(s)? This action cannot be undone!"
							firstColLabelFunc={() => 'Draft'}
							secondColLabelFunc={(item) => item.displayName}
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
							headline: 'Delete Invoice(s)',
						}
					);
					ModalService.open(
					<Provider store={store}>
						<InvoiceMultiActionComponent onConfirm={() => this.onMultiActionConfirmed()} />
					</Provider>,
					{
						width: 500,
						headline: resources.str_deleteInvoices
					}
				);
				}

				break;
		}
	}

	render() {
		const { resources } = this.props;
		const { cancelType, planRestricted, canChangeAccountData } = this.state;
		return (
			<div className="cancellation-list-component-wrapper">
					{planRestricted ? (
					<RestrictedOverlayComponent
						message={
							canChangeAccountData
							? `${cancelType === debitNoteState ? `Debit`: `Credit`} Notes are not available in your current plan`
							: `You don’t have permission to access ${cancelType === debitNoteState ? `debit`: `credit`} Notes`
						}
						owner={canChangeAccountData}
					/>
				) : null}
				{this.createTopbar()}

				<div className="cancellation-list-wrapper">
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
									longName: `${cancelType === debitNoteState ? `Debit note number` : `Credit note number`}`,
									convertNumberToTextFilterOnDemand: true,
								},
							},
							{
								headerName: 'Customer name',
								field: 'customerName',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
							{
								headerName: 'Date created',
								field: 'date',
								filter: true,
								comparator: (date1, date2) => dateCompareSort(date1, date2, config.dateFormat.client),
								 filterParams: {
								 	suppressAndOrCondition: true,
								 	filterOptions: ListAdvancedDefaultSettings.DATE_FILTER_PARAMS_OPTIONS,
								 	comparator: (filterLocalDateAtMidnight, cellValue) =>
										dateCompare(filterLocalDateAtMidnight, cellValue, config.dateFormat.client),
								 },
							},
							 {
							 	headerName: 'Total gross',
							 	field: 'totalGross',
							 	hide: true,
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
							{
								headerName: 'Amount credited',
								field: 'paidAmount',
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
									longName: 'Amount credited',
									calculateHeaderSum: true,
								},
							},
							{
								headerName: 'Amount available',
								hide: true,
								field: 'refundAvailable',
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
									longName: 'Amount available',
									calculateHeaderSum: true,
								},
							},
							{
								headerName: 'Refund type',
								field: 'refundType',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								valueFormatter: (evt) => {
									return cancelType === debitNoteState ? evt.value === `debits` ? `Debits` : `Cash/Bank` : evt.value === `credits` ? `Credits` : `Cash/Bank`;
								},
								customProps: {
									longName: 'Refund type',
								},
							},
							{
								headerName: 'Total net',
								field: 'totalNet',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								hide: true,
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
							colId: 'number',
							sort: 'desc',
						}}
						emptyState={{
							iconClass: 'icon-rechnung',
							headline: `No ${cancelType === debitNoteState ? `debit` : `credit`} notes generated yet`,
							subHeadline: `${cancelType === debitNoteState ? `Debit notes are created when expenditures are cancelled` : `Credit notes are created when invoices are cancelled`}`,
							buttons: (
								<React.Fragment>
									<ButtonComponent
										label="Los geht's"
										buttonIcon="icon-plus"
										dataQsId="empty-list-create-button"
										callback={() => invoiz.router.navigate('/invoice/new')}
									/>
									<ButtonComponent
					label={resources.str_hereWeGo}
					buttonIcon="icon-plus"
					dataQsId="empty-list-create-button"
					callback={() => invoiz.router.navigate('/invoice/new')}
					// disabled={!canCreateInvoice}
				/>
								</React.Fragment>
							),
						}}
                        fetchUrls={[
							`${config.resourceHost}${cancelType === debitNoteState ? `expenseCancellation` : `cancellation`}?offset=0&searchText=&limit=9999999&orderBy=date&desc=true&filter=${cancelType === debitNoteState ? `debitsAndBalance` : `creditsAndBalance`}&trigger=true`
						]}
						// headTabbedFilterItemsFunc={(invoices) => {
						// 	return [
						// 		{
						// 			filter: {
						// 				field: 'state',
						// 				setNull: true,
						// 			},
						// 			label: 'All',
						// 			count: invoices.length,
						// 		},
						// 		{
						// 			filter: {
						// 				field: 'state',
						// 				filterType: 'set',
						// 				values: [InvoiceState.DRAFT],
						// 			},
						// 			label: 'Draft',
						// 			count: invoices.filter((invoice) => invoice.state === InvoiceState.DRAFT).length,
						// 		},
						// 		{
						// 			filter: {
						// 				field: 'state',
						// 				filterType: 'set',
						// 				values: [InvoiceState.LOCKED],
						// 			},
						// 			label: 'Open',
						// 			count: invoices.filter((invoice) => invoice.state === InvoiceState.LOCKED).length,
						// 		},
						// 		{
						// 			filter: {
						// 				field: 'state',
						// 				filterType: 'set',
						// 				values: [InvoiceState.PAID],
						// 			},
						// 			label: 'Paid',
						// 			count: invoices.filter((invoice) => invoice.state === InvoiceState.PAID).length,
						// 		},
						// 		{
						// 			filter: {
						// 				field: 'state',
						// 				filterType: 'set',
						// 				values: [InvoiceState.CANCELLED],
						// 			},
						// 			label: 'Canceled',
						// 			count: invoices.filter((invoice) => invoice.state === InvoiceState.CANCELLED)
						// 				.length,
						// 		},
						// 		{
						// 			filter: {
						// 				field: 'state',
						// 				filterType: 'set',
						// 				values: [InvoiceState.DUNNED],
						// 			},
						// 			label: 'Reminded',
						// 			count: invoices.filter((invoice) => invoice.state === InvoiceState.DUNNED).length,
						// 		},
						// 	];
						// }}
						responseDataMapFunc={(cancellations) => {
							cancellations = cancellations.map((cancellation) => {
								cancellation = new Cancellation(cancellation);
								cancellation.customerName = cancellation.displayCustomerName;
								cancellation.date = cancellation.date
									? moment(cancellation.date).format(config.dateFormat.client)
									: '';

								return cancellation;
							});

							return cancellations;
						}}
						exportExcelCallbacks={{
							processCellCallback: (params) => {
								let value = params.value;
								return value;
							},
						}}
						restricted={planRestricted}
						columnsSettingsModalWidth={680}
						exportFilename={`Exported ${cancelType === debitNoteState ? `debit` : `credit`} notes list ${moment().format(config.dateFormat.client)}`}
						multiSelect={true}
						usePagination={true}
						searchFieldPlaceholder={`${cancelType === debitNoteState ? `Debit Notes` : `Credit Notes`} `}
						loadingRowsMessage={`Loading ${cancelType === debitNoteState ? `debit` : `credit`} notes ...`}
						noFilterResultsMessage={`No ${cancelType === debitNoteState ? `debit` : `credit`} notes matched the filter`}
						webStorageKey={cancelType === debitNoteState ? WebStorageKey.DEBIT_CANCELLATION_LIST_SETTINGS: WebStorageKey.CANCELLATION_LIST_SETTINGS}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								const entries = [];
								let cancellation = null;

								if (item) {
									cancellation = new Cancellation(item);
											entries.push({
												label: 'Delete',
												action: 'delete',
												dataQsId: 'cancellation-list-item-dropdown-delete',
											});
										

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
						onRowDataLoaded={(cancellationData) => {
							if (!this.isUnmounted) {
								this.setState({
									cancellationData,
									isLoading: false,
								});
							}
						}}
						onRowClicked={(cancellation) => {
							invoiz.router.navigate(`${cancelType === debitNoteState ? `/expenses/cancellation/` : `/cancellation/`}${cancellation.id}`);
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

export default connect(mapStateToProps)(CancellationListComponent);

