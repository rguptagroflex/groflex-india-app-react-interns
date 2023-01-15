import React from "react";
import invoiz from "services/invoiz.service";
import lang from "lang";
import moment from "moment";
import config from "config";
import TopbarComponent from "shared/topbar/topbar.component";
import ModalService from "services/modal.service";
import ListAdvancedComponent from "shared/list-advanced/list-advanced.component";
import ButtonComponent from "shared/button/button.component";
import { customerTypes, ListAdvancedDefaultSettings, transactionTypes } from "helpers/constants";
import { localeCompare, dateCompare, localeCompareNumeric, dateCompareSort } from "helpers/sortComparators";
import WebStorageKey from "enums/web-storage-key.enum";
import LoadingService from "services/loading.service";
import { copyAndEditTransaction } from "helpers/transaction/copyAndEditTransaction";
import RecurringInvoice from "models/recurring-invoice.model";
import RecurringInvoiceState from "enums/recurring-invoice/recurring-invoice-state.enum";
import { updateSubscriptionDetails } from "helpers/updateSubsciptionDetails";
import { formatCurrency } from "helpers/formatCurrency";
import RecurringInvoiceMultiActionComponent from "shared/modals/multi-action/recurring-invoice-multi-action.component";
import RecurringInvoiceAction from "enums/recurring-invoice/recurring-invoice-action.enum";
import { updateStatusIconCellColumns } from "helpers/list-advanced/updateStatusIconCellColumns";
import userPermissions from "enums/user-permissions.enum";
import planPermissions from "enums/plan-permissions.enum";
import { connect, Provider } from "react-redux";
import store from "redux/store";
import RestrictedOverlayComponent from "shared/overlay/restricted-overlay.component";

const { TRANSACTION_TYPE_RECURRING_INVOICE } = transactionTypes;

class RecurringInvoiceListNewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			recurringInvoice: null,
			isLoading: true,
			selectedRows: [],
			printing: false,
			canCreateRecurringInvoice:
				invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_RECURRING_INVOICE),
			canDeleteRecurringInvoice:
				invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_RECURRING_INVOICE),
			canUpdateRecurringInvoice:
				invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_RECURRING_INVOICE),
			canViewRecurringInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_RECURRING_INVOICE),
			canStartRecurringInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.START_RECURRING_INVOICE),
			canFinishRecurringInvoice:
				invoiz.user && invoiz.user.hasPermission(userPermissions.FINISH_RECURRING_INVOICE),
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_RECURRING),
		};
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	createTopbar() {
		const { isLoading, selectedRows, canDeleteRecurringInvoice, canCreateRecurringInvoice } = this.state;
		const topbarButtons = [];

		if (!isLoading) {
			if (selectedRows && selectedRows.length > 0) {
				let allDeletable = true;
				selectedRows.forEach((invoice) => {
					if (invoice.state !== RecurringInvoiceState.DRAFT) {
						allDeletable = false;
					}
				});

				if (allDeletable) {
					topbarButtons.push({
						type: "danger",
						label: "Delete",
						buttonIcon: "icon-trashcan",
						action: "delete-recurring-invoice",
						disabled:
							!selectedRows || (selectedRows && selectedRows.length === 0) || !canDeleteRecurringInvoice,
					});
				}
			}

			topbarButtons.push({
				type: "primary",
				label: "Create recurring invoice",
				buttonIcon: "icon-plus",
				action: "create",
				disabled: !canCreateRecurringInvoice,
			});
		}

		const topbar = (
			<TopbarComponent
				title="Recurring invoices"
				viewIcon="icon-lieferschein"
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
				buttons={topbarButtons}
			/>
		);

		return topbar;
	}

	getCompanyPersonIcon(value, personIconWidth) {
		return value === customerTypes.PERSON
			? `<span class="icon-user-wrapper"><img src="/assets/images/svg/user.svg" width="${personIconWidth}" /></span>`
			: `<span class="icon icon-factory"></span>`;
	}

	endSubscription(recurringInvoice) {
		const { resources } = this.props;
		const formattedCosts = formatCurrency(recurringInvoice.totalGross);

		ModalService.open(
			<div className="ampersand-delete-modal-content">
				<div>{resources.recurringFinishConfirmText}</div>
				<ul>
					<li>
						<b>Receiver:</b> <span>{recurringInvoice.name}</span>
					</li>
					<li>
						<b>Amount:</b> <span>{formattedCosts}</span>
					</li>
					<li>
						<b>Ocurrence:</b> <span>{recurringInvoice.displayRecurrence}</span>
					</li>
				</ul>
			</div>,
			{
				width: 500,
				headline: resources.recurringFinishConfirmCaption,
				cancelLabel: "Cancel",
				confirmIcon: "icon-check",
				confirmLabel: "Complete",
				confirmButtonType: "danger",
				onConfirm: () => {
					ModalService.close();
					invoiz
						.request(`${config.recurringInvoice.resourceUrl}/${recurringInvoice.id}/finish`, {
							auth: true,
							method: "PUT",
						})
						.then(() => {
							updateSubscriptionDetails();
							invoiz.router.reload();
							invoiz.page.showToast({ message: resources.recurringInvoiceFinishSuccessMessage });
						})
						.catch((xhr) => {
							if (xhr) {
								invoiz.page.showToast({
									type: "error",
									message: resources.recurringInvoiceFinishErrorMessage,
								});
							}
						});
				},
			}
		);
	}

	createActionCellPopupEntries(item, id) {
		const popupEntries = [];
		if (item && item.state === "draft") {
			popupEntries.push([
				{
					dataQsId: `recurring-invoice-list-item-dropdown-entry-copy-and-edit`,
					label: "Copy and edit",
					action: RecurringInvoiceAction.COPY_AND_EDIT,
				},
				{
					dataQsId: `recurring-invoice-list-item-dropdown-entry-delete`,
					label: "Delete",
					action: RecurringInvoiceAction.DELETE,
				},
				{
					dataQsId: `recurring-invoice-list-item-dropdown-entry-end-subscription`,
					label: "End subscription",
					action: RecurringInvoiceAction.END_SUBSCRIPTION,
				},
			]);
		}
		return popupEntries;
	}

	onActionCellPopupItemClick(recurringInvoice, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case RecurringInvoiceAction.COPY_AND_EDIT:
				if (this.refs.listAdvanced) {
					this.refs.listAdvanced.writePaginationRestoreState();
				}
				copyAndEditTransaction({
					invoiceModel: Object.assign({}, recurringInvoice, {
						type: TRANSACTION_TYPE_RECURRING_INVOICE,
					}),
					onCopySuccess: () => {
						LoadingService.hide();
					},
					onCopyError: () => {
						LoadingService.hide();
					},
				});
				break;
			case RecurringInvoiceAction.END_SUBSCRIPTION:
				this.endSubscription(recurringInvoice, entry);
				break;

			case RecurringInvoiceAction.DELETE:
				ModalService.open(
					"Are you sure you want to delete the recurring invoice(s)? This action cannot be undone!",
					{
						width: 500,
						headline: "Delete recurring invoice",
						cancelLabel: "Cancel",
						confirmIcon: "icon-trashcan",
						confirmLabel: "Delete",
						confirmButtonType: "danger",
						onConfirm: () => {
							invoiz
								.request(`${config.resourceHost}recurringInvoice/${recurringInvoice.id}`, {
									auth: true,
									method: "DELETE",
								})
								.then(() => {
									invoiz.page.showToast({ message: resources.recurringInvoiceDeleteSuccessMessage });

									ModalService.close();

									if (this.refs.listAdvanced) {
										this.refs.listAdvanced.removeSelectedRows([recurringInvoice]);
									}
								})
								.catch((res) => {
									invoiz.page.showToast({ type: "error", message: resources.defaultErrorMessage });
								});
						},
					}
				);
				break;
			default:
				break;
		}
	}

	onTopbarButtonClick(action) {
		if (action === "create") {
			invoiz.router.navigate("/recurringInvoice/new");
		} else if (action === "delete-recurring-invoice") {
			const selectedRowsData = this.refs.listAdvanced.getSelectedRows({
				prop: "number",
				sort: "asc",
			});

			ModalService.open(
				<RecurringInvoiceMultiActionComponent
					resources={this.props.resources}
					selectedItems={selectedRowsData}
					onConfirm={() => this.onMultiActionConfirmed()}
				/>,
				{
					width: 500,
					headline: "Delete recurring invoice",
				}
			);
		}
	}

	onMultiActionConfirmed() {
		ModalService.close();
		invoiz.router.reload();
	}

	getRecurringInvoiceMarkup(value, statusIconWidth, withText) {
		let icon = "";
		let text = "";
		switch (value) {
			case RecurringInvoiceState.DRAFT:
				icon = "ueberfaellig";
				text = "Not started";
				break;
			case RecurringInvoiceState.STARTED:
				icon = "bezahlt";
				text = "Active";
				break;
			case RecurringInvoiceState.FINISHED:
				icon = "check_altered";
				text = "Completed";
				break;
			default:
				break;
		}

		return `<div class="cell-status-icon"><div class='icon icon-${icon}' width="${statusIconWidth}"></div> ${
			withText ? `<span class='cell-status-icon-text'>${text}</span>` : ""
		}</div>`;
	}

	render() {
		const { resources } = this.props;
		const {
			canCreateRecurringInvoice,
			canUpdateRecurringInvoice,
			canDeleteRecurringInvoice,
			canFinishRecurringInvoice,
			planRestricted,
			canChangeAccountData,
		} = this.state;
		return (
			<div className="recurring-invoice-list-component-wrapper">
				{planRestricted ? (
					<RestrictedOverlayComponent
						message={
							canChangeAccountData
							? 'Recurring Invoices are not available in your current plan'
							: `You don’t have permission to access Recurring Invoices`
						}
						owner={canChangeAccountData}
					/>
				) : null}
				{this.createTopbar()}
				<div className="recurring-invoice-list-wrapper">
					<ListAdvancedComponent
						headTabbedFilterItemsFunc={(recurringInvoices) => {
							return [
								{
									filter: {
										field: "state",
										setNull: "true",
									},
									label: "All",
									count: recurringInvoices.length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: ["draft"],
									},
									label: "Not started",
									count: recurringInvoices.filter(
										(recurringInvoice) => recurringInvoice.state === RecurringInvoiceState.DRAFT
									).length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: ["started"],
									},
									label: "Active",
									count: recurringInvoices.filter(
										(recurringInvoice) => recurringInvoice.state === RecurringInvoiceState.STARTED
									).length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: ["finished"],
									},
									label: "Completed",
									count: recurringInvoices.filter(
										(recurringInvoice) => recurringInvoice.state === RecurringInvoiceState.FINISHED
									).length,
								},
								{
									filter: {
										field: "displayNextDate",
										filterType: "date",
										specificType: "next30days",
										type: "inRange",
										dateFrom: moment().format(config.dateFormat.api),
										dateTo: moment().add(30, "days").format(config.dateFormat.api),
									},
									label: "Next 30 days",
									count: recurringInvoices.filter(
										(recurringInvoice) => recurringInvoice.within30days === true
									).length,
								},
							];
						}}
						ref="listAdvanced"
						columnDefs={[
							{
								headerName: "Customer",
								field: "name",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: 310,
								customProps: {
									longName: "Customer",
								},
							},
							{
								headerName: "Subscription start",
								field: "displayStartDate",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: (date1, date2) => dateCompareSort(date1, date2, config.dateFormat.client),
								// filter: 'agDateColumnFilter',
								filter: true,
								// filterParams: {
								// 	suppressAndOrCondition: true,
								// 	filterOptions: ListAdvancedDefaultSettings.DATE_FILTER_PARAMS_OPTIONS,
								// 	comparator: (filterLocalDateAtMidnight, cellValue) =>
								// 		dateCompare(filterLocalDateAtMidnight, cellValue, config.dateFormat.client),
								// },
							},
							{
								headerName: "Interval",
								field: "displayRecurrence",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								customProps: {
									suppressAndOrCondition: true,
								},
							},
							{
								headerName: "Status",
								field: "state",
								comparator: localeCompare,
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: 120,
								cellRenderer: (evt) => {
									return this.getRecurringInvoiceMarkup(evt.value, 15, true);
								},
								filterParams: {
									suppressMiniFilter: true,
									valueFormatter: (evt) => {
										return evt.value === RecurringInvoiceState.DRAFT
											? "Not started"
											: evt.value === RecurringInvoiceState.STARTED
											? "Active"
											: "Completed";
									},
									values: ["draft", "started", "finished"],
								},
								customProps: {
									longName: "Status",
									disableContextMenuCopyItem: true,
									filterListItemValueRenderer: (value, listItemHtml) => {
										const iconHtml = this.getRecurringInvoiceMarkup(value, 15, false);
										$(iconHtml).insertBefore($(listItemHtml).find(".ag-set-filter-item-value"));
									},
									onColumnResized: (evt) => {
										updateStatusIconCellColumns(evt, 113);
									},
								},
							},
							{
								headerName: "Next date",
								field: "displayNextDate",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: (date1, date2) => dateCompareSort(date1, date2, config.dateFormat.client),
								// filter: 'agDateColumnFilter',
								filter: true,
								// filterParams: {
								// 	suppressAndOrCondition: true,
								// 	filterOptions: ListAdvancedDefaultSettings.DATE_FILTER_PARAMS_OPTIONS,
								// 	comparator: (filterLocalDateAtMidnight, cellValue) =>
								// 		dateCompare(filterLocalDateAtMidnight, cellValue, config.dateFormat.client),
								// },
								customProps: {
									longName: "Next date",
								},
							},
							{
								headerName: "Total net",
								field: "totalNet",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								cellRenderer: (evt) => {
									return formatCurrency(evt.value);
								},
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									calculateHeaderSum: true,
								},
								hide: true,
							},
							{
								headerName: "Total gross",
								field: "totalGross",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								cellRenderer: (evt) => {
									return formatCurrency(evt.value);
								},
								customProps: {
									calculateHeaderSum: true,
								},
							},
						]}
						defaultSortModel={{
							colId: "name",
							sort: "asc",
						}}
						emptyState={{
							iconClass: "icon-lieferschein",
							headline: "No recurring invoices created yet",
							subHeadline: resources.createRecurringText,
							buttons: (
								<React.Fragment>
									<ButtonComponent
										label={resources.str_hereWeGo}
										buttonIcon="icon-plus"
										dataQsId="empty-list-create-button"
										callback={() => invoiz.router.navigate("/recurringInvoice/new")}
										disabled={!canCreateRecurringInvoice}
									/>
								</React.Fragment>
							),
						}}
						fetchUrls={[
							// `${config.resourceHost}recurringInvoice?offset=0&searchText=&limit=9999999&orderBy=date&desc=true&filter=all&trigger=true`,
							`${config.resourceHost}recurringinvoice?offset=0&searchText=&limit=9999999&orderBy=name&desc=true`,
						]}
						responseDataMapFunc={(recurringInvoices) => {
							return recurringInvoices.map((recurringInvoice) => {
								return new RecurringInvoice(recurringInvoice);
							});
						}}
						exportExcelCallbacks={{
							processCellCallback: (params) => {
								let value = params.value;

								if (params.column.colId === "state") {
									value =
										value === RecurringInvoiceState.DRAFT
											? "Not started"
											: value === RecurringInvoiceState.STARTED
											? "Active"
											: "Completed";
								}

								return value;
							},
						}}
						exportFilename={`Exported recurring invoices list ${moment().format(config.dateFormat.client)}`}
						multiSelect={true}
						usePagination={true}
						restricted={planRestricted}
						loadingRowsMessage={"Loading recurring invoices..."}
						noFilterResultsMessage={"No recurring invoices matched the filter"}
						webStorageKey={WebStorageKey.RECURRING_INVOICE_LIST_SETTINGS}
						actionCellPopup={{
							// popupEntriesFunc: (itemData) => {
							// 	const popupArray = [
							// 		[
							// 			{
							// 				dataQsId: `recurring-invoice-list-item-dropdown-entry-copy-and-edit`,
							// 				label: 'Copy and edit',
							// 				action: RecurringInvoiceAction.COPY_AND_EDIT,
							// 			},
							// 		],
							// 	];
							// 	if (itemData && itemData.state === RecurringInvoiceState.DRAFT) {
							// 		popupArray[0].push({
							// 			dataQsId: `recurring-invoice-list-item-dropdown-entry-delete`,
							// 			label: 'Delete',
							// 			action: RecurringInvoiceAction.DELETE,
							// 		});
							// 	}
							// 	if (itemData && itemData.state === RecurringInvoiceState.STARTED) {
							// 		popupArray[0].push({
							// 			dataQsId: `recurring-invoice-list-item-dropdown-entry-end-subscription`,
							// 			label: 'End recurring invoice',
							// 			action: RecurringInvoiceAction.END_SUBSCRIPTION,
							// 		});
							// 	}
							// 	return popupArray;
							// },
							popupEntriesFunc: (item) => {
								const entries = [];
								let recurringInvoice = null;

								if (item) {
									recurringInvoice = new RecurringInvoice(item);
									if (canUpdateRecurringInvoice) {
										entries.push({
											dataQsId: `recurring-invoice-list-item-dropdown-entry-copy-and-edit`,
											label: "Copy and edit",
											action: RecurringInvoiceAction.COPY_AND_EDIT,
										});
									}
									if (canDeleteRecurringInvoice) {
										if (item && item.state === RecurringInvoiceState.DRAFT) {
											entries.push({
												dataQsId: `recurring-invoice-list-item-dropdown-entry-delete`,
												label: "Delete",
												action: RecurringInvoiceAction.DELETE,
											});
										}
									}
									if (canFinishRecurringInvoice) {
										if (item && item.state === RecurringInvoiceState.STARTED) {
											entries.push({
												dataQsId: `recurring-invoice-list-item-dropdown-entry-end-subscription`,
												label: "End recurring invoice",
												action: RecurringInvoiceAction.END_SUBSCRIPTION,
											});
										}
									}

									if (entries.length === 0) {
										entries.push({
											label: "No action available",
											customEntryClass: "popover-entry-disabled",
										});
									}
								}

								return [entries];
							},
							onPopupItemClicked: (itemData, popupEntry) => {
								this.onActionCellPopupItemClick(itemData, popupEntry);
							},
						}}
						onRowDataLoaded={(recurringInvoice) => {
							if (!this.isUnmounted) {
								this.setState({
									recurringInvoice,
									isLoading: false,
								});
							}
						}}
						onRowClicked={(recurringInvoice) => {
							invoiz.router.navigate(`/recurringInvoice/${recurringInvoice.id}`);
						}}
						onRowSelectionChanged={(selectedRows) => {
							if (!this.isUnmounted) {
								this.setState({ selectedRows });
							}
						}}
						searchFieldPlaceholder={"Recurring invoices"}
					/>
				</div>
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return {
		resources,
	};
};

export default connect(mapStateToProps)(RecurringInvoiceListNewComponent);
