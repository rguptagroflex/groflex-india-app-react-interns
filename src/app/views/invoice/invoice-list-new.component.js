import React from "react";
import invoiz from "services/invoiz.service";
import lang from "lang";
import moment from "moment";
import config from "config";
import _ from "lodash";
import accounting from "accounting";
import TopbarComponent from "shared/topbar/topbar.component";
import ListAdvancedComponent from "shared/list-advanced/list-advanced.component";
import ButtonComponent from "shared/button/button.component";
import WebStorageKey from "enums/web-storage-key.enum";
import InvoiceState from "enums/invoice/invoice-state.enum";
import Invoice from "models/invoice.model";
import Payment from "models/payment.model";
import LoadingService from "services/loading.service";
import ModalService from "services/modal.service";
import CancelInvoiceModalComponent from "shared/modals/cancel-invoice-modal.component";
import DeleteCancelInvoiceModalComponent from "shared/modals/delete-cancel-invoice-modal.component";
import CreateDunningModalComponent from "shared/modals/create-dunning-modal.component";
import PaymentCreateModalComponent from "shared/modals/payment-create-modal.component";
import DeleteRowsModal from "shared/modals/list-advanced/delete-rows-modal.component";
import { ListAdvancedDefaultSettings, transactionTypes } from "helpers/constants";
import { localeCompare, localeCompareNumeric, dateCompare, dateCompareSort } from "helpers/sortComparators";
import { getScaledValue } from "helpers/getScaledValue";
import { formatCurrency } from "helpers/formatCurrency";
import { copyAndEditTransaction } from "helpers/transaction/copyAndEditTransaction";
import { printPdf, printPdfPrepare } from "helpers/printPdf";
import { updateStatusIconCellColumns } from "helpers/list-advanced/updateStatusIconCellColumns";
import { connect, Provider } from "react-redux";
import store from "redux/store";
import InvoiceMultiActionComponent from "shared/invoice-multi-action/invoice-multi-action.component";
import userPermissions from "enums/user-permissions.enum";
import { formatDate, formatApiDate } from "helpers/formatDate";

const PAYABLE_STATES = [InvoiceState.DUNNED, InvoiceState.LOCKED, InvoiceState.PARTIALLY_PAID];
const CANCEL_OR_DELETE_STATES = ["open", InvoiceState.DUNNED, InvoiceState.LOCKED];
const CANCEL_STATES = [InvoiceState.PAID, InvoiceState.PARTIALLY_PAID];
const NOT_ALLOWED_TO_COPY = [
	transactionTypes.TRANSACTION_TYPE_DEPOSIT_INVOICE,
	transactionTypes.TRANSACTION_TYPE_CLOSING_INVOICE,
];

class InvoiceListNewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			invoiceData: null,
			selectedRows: [],
			canCreateInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_INVOICE),
			canDeleteInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_INVOICE),
			canUpdateInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_INVOICE),
			canRegisterPayment: invoiz.user && invoiz.user.hasPermission(userPermissions.ENTER_INVOICE_PAYMENT),
			canCreateReminder: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_INVOICE_REMINDER),
		};
	}
	componentWillUnmount() {
		this.isUnmounted = true;
	}

	addPayment(invoice) {
		const { resources } = this.props;
		invoiz.request(`${config.resourceHost}invoice/${invoice.id}`, { auth: true }).then((response) => {
			const {
				body: {
					data: { invoice: invoiceData },
				},
			} = response;
			invoice.outstandingAmount = invoiceData && invoiceData.outstandingAmount;
			const openAmount = parseFloat(accounting.toFixed(invoice.outstandingAmount, 2), 10);

			const payment = new Payment({
				customerName: invoice.displayName,
				date: formatApiDate(new Date()),
				invoiceId: invoice.id,
				invoiceNumber: invoice.number,
				invoiceType: invoice.type,
				amount: openAmount,
				custId: invoice.customerId,
				outstandingBalance: openAmount,
			});

			invoiz
				.request(`${config.resourceHost}dunning/${invoice.id}`, { auth: true })
				.then((dunningListResponse) => {
					const dunnings = dunningListResponse ? dunningListResponse.body.data : [];

					const dunning = dunnings.length > 0 && dunnings[0];
					if (dunning) {
						dunning.label = !_.isEmpty(invoice.metaData.currentDunning)
							? invoice.metaData.currentDunning.label
							: "";
					}
					ModalService.open(
						<PaymentCreateModalComponent
							payment={payment}
							dunning={dunning}
							onSave={() => invoiz.router.reload()}
							resources={resources}
							invoice={invoice}
						/>,
						{
							width: 600,
							modalClass: "payment-create-modal-component",
							afterOpen: () => {
								setTimeout(() => {
									$(".create-payment-amount-wrapper input").focus();
								});
							},
						}
					);
				});
		});
	}

	dun(invoice) {
		const { resources } = this.props;
		if (_.isEmpty(invoice.metaData.nextDunning)) {
			invoiz.page.showToast({ type: "error", message: resources.dunningLastActiveDunningLevelReachedMessage });
			return;
		}

		const {
			metaData: { nextDunning: nextDunningLevel },
		} = invoice;

		ModalService.open(
			<CreateDunningModalComponent invoice={invoice} nextDunningLevel={nextDunningLevel} resources={resources} />,
			{
				headline: resources.str_createPaymentReminder,
				modalClass: "create-dunning-modal-component",
				width: 650,
			}
		);
	}

	createTopbar() {
		const { isLoading, selectedRows, canCreateInvoice, canDeleteInvoice } = this.state;
		const { resources } = this.props;
		const topbarButtons = [];
		console.log(canCreateInvoice);
		if (!isLoading) {
			if (selectedRows && selectedRows.length > 0) {
				let allDeletable = true;

				selectedRows.forEach((invoice) => {
					if (invoice.state !== InvoiceState.DRAFT) {
						allDeletable = false;
					}
				});

				if (allDeletable) {
					topbarButtons.push({
						type: "danger",
						label: resources.str_clear,
						buttonIcon: "icon-trashcan",
						action: "delete-invoices",
						disabled: !canDeleteInvoice,
					});
				}
			}

			topbarButtons.push({
				type: "primary",
				label: resources.str_makeBillText,
				buttonIcon: "icon-plus",
				action: "create",
				disabled: !canCreateInvoice,
			});
		}

		const topbar = (
			<TopbarComponent
				title={resources.str_bills}
				viewIcon={`icon-rechnung`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action, selectedRows)}
				buttons={topbarButtons}
			/>
		);

		return topbar;
	}

	getInvoiceStatusMarkup(value, withText, data) {
		const stateIconLabel = this.getStateIconLabel(value);

		if (
			withText &&
			data &&
			value === InvoiceState.DUNNED &&
			data.stateOriginal &&
			data.stateOriginal === InvoiceState.DUNNED
		) {
			stateIconLabel.text = "Overdue / Reminded";
		}

		return `<div class="cell-status-icon"><div class='icon icon-${stateIconLabel.icon}'></div> ${
			withText ? `<span class='cell-status-icon-text'>${stateIconLabel.text}</span>` : ""
		}</div>`;
	}

	getStateIconLabel(value) {
		const iconLabelObj = {};

		switch (value) {
			case InvoiceState.DRAFT:
				iconLabelObj.icon = "entwurf state-draft";
				iconLabelObj.text = "Draft";
				break;

			case InvoiceState.LOCKED:
			case InvoiceState.SENT:
				iconLabelObj.icon = "offen state-locked";
				iconLabelObj.text = "Open";
				break;

			case InvoiceState.PARTIALLY_PAID:
				iconLabelObj.icon = "offen state-locked";
				iconLabelObj.text = "Partially paid";
				break;

			case InvoiceState.CANCELLED:
				iconLabelObj.icon = "storniert state-cancelled";
				iconLabelObj.text = "Canceled";
				break;

			case InvoiceState.DUNNED:
				iconLabelObj.icon = "ueberfaellig state-dunned";
				iconLabelObj.text = "Reminded";
				break;

			case InvoiceState.PAID:
			case InvoiceState.PRINTED:
				iconLabelObj.icon = "bezahlt state-paid";
				iconLabelObj.text = "Paid";
				break;

			default:
				break;
		}

		return iconLabelObj;
	}

	getTypeLabel(value) {
		let label = "";

		switch (value) {
			case transactionTypes.TRANSACTION_TYPE_DEPOSIT_INVOICE:
				label = "Abschlag";
				break;

			case transactionTypes.TRANSACTION_TYPE_RECURRING_INVOICE:
				label = "Recurring invoice";
				break;

			case transactionTypes.TRANSACTION_TYPE_CLOSING_INVOICE:
				label = "Schlussrechnung";
				break;
			case transactionTypes.TRANSACTION_TYPE_POS_RECEIPT:
				label = "POS Receipt";
				break;

			default:
				label = "Invoice";
				break;
		}

		return label;
	}

	onActionCellPopupItemClick(invoice, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case "addPayment":
				this.addPayment(invoice);
				break;

			case "dun":
				this.dun(invoice);
				break;

			case "edit":
				setTimeout(() => {
					if (invoice.isCancelled) {
						invoiz.page.showToast({ message: resources.invoiceEditCanceledMessage, type: "error" });
						return;
					}

					if (invoice.isLocked) {
						invoiz.page.showToast({ message: resources.invoiceEditLockedMessage, type: "error" });
						return;
					}

					invoiz.router.navigate(`/invoice/edit/${invoice.id}`);
				});
				break;

			case "copyAndEdit":
				LoadingService.show(resources.copyInvoice);
				copyAndEditTransaction({
					invoiceModel: {
						type: invoice.type,
						id: invoice.id,
					},
					onCopySuccess: () => {
						LoadingService.hide();
					},
					onCopyError: () => {
						LoadingService.hide();
					},
				});
				break;

			case "print":
				printPdfPrepare({
					url: `${config.resourceHost}invoice/${parseInt(invoice.id, 10)}/document`,
					callback: (res) => {
						const { path } = res.body.data;

						printPdf({
							pdfUrl: config.imageResourceHost + path,
							isPost: false,
						});
					},
				});
				break;

			case "delete":
				invoice.hideInvoizPay = false;
				const model = new Invoice(invoice);

				if (invoice.invoiceType === "cancellation") {
					return invoiz.page.showToast({ message: resources.cancellationDeleteErrorMessage, type: "error" });
				} else if (!invoice.isLocked) {
					ModalService.open(resources.deleteInvoiceWarningMessage, {
						headline: resources.str_deleteInvoice,
						cancelLabel: resources.str_abortStop,
						confirmLabel: resources.str_clear,
						confirmIcon: "icon-trashcan",
						confirmButtonType: "secondary",
						onConfirm: () => {
							ModalService.close();

							invoiz
								.request(`${config.resourceHost}invoice/${invoice.id}`, {
									auth: true,
									method: "DELETE",
								})
								.then(() => {
									invoiz.page.showToast({ message: resources.invoiceDeleteSuccessMessage });

									ModalService.close();

									if (this.refs.listAdvanced) {
										this.refs.listAdvanced.removeSelectedRows([invoice]);
									}
								})
								.catch(() => {
									invoiz.page.showToast({ type: "error", message: resources.defaultErrorMessage });
								});
						},
					});
				} else if (CANCEL_STATES.indexOf(invoice.state) > -1) {
					ModalService.open(<CancelInvoiceModalComponent invoice={invoice} resources={resources} />, {
						//	headline: `Cancel invoice number ${invoice.number}`,
						width: 800,
					});
				} else {
					ModalService.open(
						<DeleteCancelInvoiceModalComponent invoice={invoice} isFromList={true} resources={resources} />,
						{
							width: 800,
							modalClass: "delete-cancel-invoice-modal-component",
						}
					);
				}
				break;
		}
	}

	onTopbarButtonClick(action, selectedRows) {
		const { resources } = this.props;
		switch (action) {
			case "create":
				invoiz.router.navigate("/invoice/new");
				break;
			case "delete-invoices":
				if (this.refs.listAdvanced) {
					let selectedRowsData = this.refs.listAdvanced.getSelectedRows({
						prop: "number",
						sort: "asc",
					});

					selectedRowsData = selectedRowsData.map((invoice) => {
						return new Invoice(invoice);
					});

					ModalService.open(
						<DeleteRowsModal
							deleteUrlPrefix={`${config.resourceHost}invoice/`}
							text="Are you would like to delete the following invoice(s)? This action cannot be undone!"
							firstColLabelFunc={() => "Draft"}
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
							headline: "Delete Invoice(s)",
						}
					);
					// 	ModalService.open(
					// 	<Provider store={store}>
					// 		<InvoiceMultiActionComponent onConfirm={() => this.onMultiActionConfirmed()} />
					// 	</Provider>,
					// 	{
					// 		width: 500,
					// 		headline: resources.str_deleteInvoices
					// 	}
					// );
				}

				break;
		}
	}

	onActionSettingPopupItemClick(entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case "textModules":
				invoiz.router.navigate("/settings/text-modules/invoice");
				break;
			case "numberRange":
				invoiz.router.navigate("/settings/more-settings/invoice");
				break;
			case "dunning":
				invoiz.router.navigate("/settings/dunning");
				break;
		}
	}
	render() {
		const { resources } = this.props;
		const { canCreateInvoice, canDeleteInvoice, canUpdateInvoice, canCreateReminder, canRegisterPayment } =
			this.state;
		return (
			<div className="invoice-list-component-wrapper">
				{this.createTopbar()}

				<div className="invoice-list-wrapper">
					<ListAdvancedComponent
						resources={this.props.resources}
						ref="listAdvanced"
						columnDefs={[
							{
								headerName: "Invoice number",
								field: "number",
								sort: "desc",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(86, window.innerWidth, 1600),
								cellRenderer: (evt) => {
									return evt.value === Infinity ? "" : evt.value;
								},
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									longName: "Invoice number",
									convertNumberToTextFilterOnDemand: true,
								},
							},
							{
								headerName: "Status",
								field: "state",
								filter: "agSetColumnFilter",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								cellRenderer: (evt) => {
									return this.getInvoiceStatusMarkup(evt.value, true, evt.data);
								},
								comparator: (a, b) => {
									const order = [
										// Bezahlt
										InvoiceState.PAID,
										InvoiceState.PRINTED,

										// Entwurf
										InvoiceState.DRAFT,

										// Offen
										InvoiceState.LOCKED,
										InvoiceState.SENT,
										InvoiceState.PARTIALLY_PAID,

										// Storniert
										InvoiceState.CANCELLED,

										// Überfällig
										InvoiceState.DUNNED,
									];

									return order.indexOf(a) - order.indexOf(b);
								},
								filterParams: {
									suppressMiniFilter: true,
									valueFormatter: (evt) => {
										return this.getStateIconLabel(evt.value).text;
									},
									values: [
										InvoiceState.DRAFT,
										InvoiceState.LOCKED,
										InvoiceState.PAID,
										InvoiceState.CANCELLED,
										InvoiceState.DUNNED,
										InvoiceState.PARTIALLY_PAID,
									],
								},
								customProps: {
									disableContextMenuCopyItem: true,
									filterListItemValueRenderer: (value, listItemHtml) => {
										const iconHtml = this.getInvoiceStatusMarkup(value);
										$(iconHtml).insertBefore($(listItemHtml).find(".ag-set-filter-item-value"));
									},
									onColumnResized: (evt) => {
										updateStatusIconCellColumns(evt, 96);
									},
								},
							},
							{
								headerName: "Customer name",
								field: "customerName",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter",
							},
							{
								headerName: "Date created",
								field: "date",
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
								headerName: "Due date",
								field: "dueToDate",
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
								headerName: "Due Since",
								field: "dueSince",
								comparator: localeCompareNumeric,
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								valueFormatter: (evt) => {
									return evt.value ? evt.value + " days" : "";
								},
							},
							{
								headerName: "Total gross",
								field: "totalGross",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								valueFormatter: (evt) => {
									return formatCurrency(evt.value);
								},
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									calculateHeaderSum: true,
								},
							},
							{
								headerName: "Outstanding amount",
								field: "outstandingAmount",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								valueFormatter: (evt) => {
									return formatCurrency(evt.value);
								},
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									calculateHeaderSum: true,
								},
							},
							{
								headerName: "Customer number",
								field: "customerNumber",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								hide: true,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									longName: "Customer number",
									convertNumberToTextFilterOnDemand: true,
								},
							},
							{
								headerName: "Currency",
								field: "baseCurrency",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								hide: true,
								filterParams: {
									suppressMiniFilter: true,
								},
								valueFormatter: (evt) => {
									return evt.value === "" || evt.value === null ? "INR" : evt.value;
								},
							},
							{
								headerName: "Customer e-mail ID",
								field: "customerEmail",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								hide: true,
								cellRenderer: "inlineActionCellRenderer",
								customProps: {
									inlineActionType: ListAdvancedDefaultSettings.CellInlineActionType.MAIL,
								},
							},
							{
								headerName: "Customer phone number",
								field: "customerPhone",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
								hide: true,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS_PHONE,
							},
							{
								headerName: "Total net",
								field: "totalNet",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								hide: true,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								valueFormatter: (evt) => {
									return formatCurrency(evt.value);
								},
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									calculateHeaderSum: true,
								},
							},
							{
								headerName: "GST amount",
								field: "vatAmount",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								hide: true,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								valueFormatter: (evt) => {
									return formatCurrency(evt.value);
								},
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									calculateHeaderSum: true,
								},
							},
							{
								headerName: "Type",
								field: "type",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								//hide: true,
								comparator: (a, b) => {
									const order = [
										transactionTypes.TRANSACTION_TYPE_RECURRING_INVOICE,
										transactionTypes.TRANSACTION_TYPE_DEPOSIT_INVOICE,
										transactionTypes.TRANSACTION_TYPE_INVOICE,
										transactionTypes.TRANSACTION_TYPE_CLOSING_INVOICE,
										transactionTypes.TRANSACTION_TYPE_POS_RECEIPT,
									];

									return order.indexOf(a) - order.indexOf(b);
								},
								valueFormatter: (evt) => {
									return this.getTypeLabel(evt.value);
								},
								filterParams: {
									suppressMiniFilter: true,
									valueFormatter: (evt) => {
										return this.getTypeLabel(evt.value);
									},
								},
								customProps: {
									disableContextMenuCopyItem: true,
								},
							},
						]}
						defaultSortModel={{
							colId: "number",
							sort: "desc",
						}}
						emptyState={{
							iconClass: "icon-rechnung",
							headline: "No invoices created yet",
							subHeadline: resources.createBillText,
							buttons: (
								<React.Fragment>
									{/* <ButtonComponent
										label="Los geht's"
										buttonIcon="icon-plus"
										dataQsId="empty-list-create-button"
										callback={() => invoiz.router.navigate('/invoice/new')}
									/> */}
									<ButtonComponent
										label={resources.str_hereWeGo}
										buttonIcon="icon-plus"
										dataQsId="empty-list-create-button"
										callback={() => invoiz.router.navigate("/invoice/new")}
										disabled={!canCreateInvoice}
									/>
								</React.Fragment>
							),
						}}
						// fetchUrls={[
						// 	`${config.resourceHost}invoice?offset=0&searchText=&limit=9999999&orderBy=date&desc=true&filter=everything&trigger=true`,
						// ]}
						fetchUrls={[
							`${config.resourceHost}invoice?offset=0&searchText=&limit=9999999&orderBy=date&desc=true&filter=all&trigger=true`,
						]}
						headTabbedFilterItemsFunc={(invoices) => {
							return [
								{
									filter: {
										field: "state",
										setNull: true,
									},
									label: "All",
									count: invoices.length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: [InvoiceState.DRAFT],
									},
									label: "Draft",
									count: invoices.filter((invoice) => invoice.state === InvoiceState.DRAFT).length,
								},
								{
									filter: {
										field: "type",
										filterType: "set",
										values: [transactionTypes.TRANSACTION_TYPE_POS_RECEIPT],
									},
									label: "POS Receipts",
									count: invoices.filter(
										(invoice) => invoice.type === transactionTypes.TRANSACTION_TYPE_POS_RECEIPT
									).length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: [InvoiceState.LOCKED],
									},
									label: "Open",
									count: invoices.filter((invoice) => invoice.state === InvoiceState.LOCKED).length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: [InvoiceState.PAID],
									},
									label: "Paid",
									count: invoices.filter((invoice) => invoice.state === InvoiceState.PAID).length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: [InvoiceState.PARTIALLY_PAID],
									},
									label: "Partially Paid",
									count: invoices.filter((invoice) => invoice.state === InvoiceState.PARTIALLY_PAID)
										.length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: [InvoiceState.CANCELLED],
									},
									label: "Canceled",
									count: invoices.filter((invoice) => invoice.state === InvoiceState.CANCELLED)
										.length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: [InvoiceState.DUNNED],
									},
									label: "Reminded",
									count: invoices.filter((invoice) => invoice.state === InvoiceState.DUNNED).length,
								},
							];
						}}
						responseDataMapFunc={(invoices) => {
							invoices = invoices.map((invoice) => {
								invoice = new Invoice(invoice);

								const numberBeginsWithZero = invoice.number.toString().substr(0, 1) === "0";

								const customerNumberBeginsWithZero =
									invoice.customerData.number.toString().substr(0, 1) === "0";

								invoice.dueSince = invoice.outstandingAmount
									? moment().diff(invoice.dueToDate, "days") || null
									: null;

								invoice.number =
									invoice.number.toString().length === 0
										? Infinity
										: isNaN(Number(invoice.number)) || numberBeginsWithZero
										? invoice.number
										: Number(invoice.number);

								invoice.customerNumber = invoice.customerData
									? isNaN(Number(invoice.customerData.number)) || customerNumberBeginsWithZero
										? invoice.customerData.number
										: Number(invoice.customerData.number)
									: "";

								//invoice.customerName = (invoice.customerData && invoice.customerData.name) || '';
								invoice.customerName = invoice.displayName;
								invoice.customerEmail = (invoice.customer && invoice.customer.email) || "";

								invoice.customerPhone =
									(invoice.customer &&
										(invoice.customer.phone1 ||
											invoice.customer.phone2 ||
											invoice.customer.mobile)) ||
									"";

								if (invoice.customerData && invoice.customerData.contact) {
									invoice.customerName = `${invoice.customerName} | ${invoice.customerData.contact.name}`;

									if (invoice.customerData.contact.email) {
										invoice.customerEmail = invoice.customerData.contact.email;
									}

									if (
										invoice.customerData.contact.phone1 ||
										invoice.customerData.contact.phone2 ||
										invoice.customerData.contact.mobile
									) {
										invoice.customerPhone =
											invoice.customerData.contact.phone1 ||
											invoice.customerData.contact.phone2 ||
											invoice.customerData.contact.mobile;
									}
								}

								if (invoice.state === InvoiceState.SENT) {
									invoice.state = InvoiceState.LOCKED;
								} else if (invoice.state === InvoiceState.PRINTED) {
									invoice.state = InvoiceState.PAID;
								}

								if (invoice.isOverDueToDate) {
									invoice.stateOriginal = invoice.state;
									invoice.state = InvoiceState.DUNNED;
								}

								invoice.date = invoice.date
									? moment(invoice.date).format(config.dateFormat.client)
									: "";
								invoice.dueToDate = invoice.dueToDate
									? moment(invoice.dueToDate).format(config.dateFormat.client)
									: "";

								invoice.vatAmount = invoice.totalGross - invoice.totalNet;

								return invoice;
							});

							return invoices;
						}}
						exportExcelCallbacks={{
							processCellCallback: (params) => {
								let value = params.value;

								if (params.column.colId === "state") {
									value = this.getStateIconLabel(value).text;
								}

								if (params.column.colId === "type") {
									value = this.getTypeLabel(value);
								}

								return value;
							},
						}}
						columnsSettingsModalWidth={680}
						exportFilename={`Exported invoices list ${moment().format(config.dateFormat.client)}`}
						multiSelect={true}
						usePagination={true}
						searchFieldPlaceholder={"Invoices"}
						loadingRowsMessage={"Loading invoices ..."}
						noFilterResultsMessage={"No invoices matched the filter"}
						webStorageKey={WebStorageKey.INVOICE_LIST_SETTINGS}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								const entries = [];
								let invoice = null;

								if (item) {
									invoice = new Invoice(item);

									if (canRegisterPayment) {
										if (PAYABLE_STATES.includes(invoice.state)) {
											entries.push({
												label: "Add payment",
												action: "addPayment",
												dataQsId: "invoice-list-item-dropdown-addpayment",
											});
										}
									}

									if (canUpdateInvoice) {
										if (invoice.state === InvoiceState.DRAFT) {
											entries.push({
												label: "Edit",
												action: "edit",
												dataQsId: "invoice-list-item-dropdown-entry-edit",
											});
										}

										if (!NOT_ALLOWED_TO_COPY.includes(invoice.type)) {
											entries.push({
												label: "Copy and edit",
												action: "copyAndEdit",
												dataQsId: "invoice-list-item-dropdown-copyandedit",
											});
										}
									}

									// entries.push({
									// 	dataQsId: `invoice-list-item-dropdown-entry-print`,
									// 	label: 'Print',
									// 	action: 'print',
									// });

									if (canDeleteInvoice) {
										if (invoice.state === InvoiceState.DRAFT) {
											entries.push({
												label: "Delete",
												action: "delete",
												dataQsId: "invoice-list-item-dropdown-delete",
											});
										}

										if (!invoice.metaData.closingInvoiceExists) {
											if (CANCEL_OR_DELETE_STATES.includes(invoice.state)) {
												entries.push({
													label: "Cancel / Delete",
													action: "delete",
													dataQsId: "invoice-list-item-dropdown-delete",
												});
											} else if (CANCEL_STATES.includes(invoice.state)) {
												entries.push({
													label: "Cancel",
													action: "delete",
													dataQsId: "invoice-list-item-dropdown-delete",
												});
											}
										}
									}
									if (canCreateReminder) {
										if (invoice.isOverDue) {
											entries.push({
												label: "Create payment reminder",
												action: "dun",
												dataQsId: "invoice-list-item-dropdown-dun",
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
						settingPopup={{
							settingPopupEntriesFunc: (item) => {
								const entries = [];
								entries.push({
									label: "Text modules",
									action: "textModules",
									dataQsId: "setting-list-item-dropdown-textmodules",
								});
								entries.push({
									label: "Number range",
									action: "numberRange",
									dataQsId: "setting-list-item-dropdown-numberrange",
								});
								entries.push({
									label: "Dunning",
									action: "dunning",
									dataQsId: "setting-list-item-dropdown-dunning",
								});

								return [entries];
							},
							onSettingPopupItemClicked: (popupEntry) => {
								this.onActionSettingPopupItemClick(popupEntry);
							},
						}}
						onRowDataLoaded={(invoiceData) => {
							if (!this.isUnmounted) {
								this.setState({
									invoiceData,
									isLoading: false,
								});
							}
						}}
						onRowClicked={(invoice) => {
							invoiz.router.navigate(`/invoice/${invoice.id}`);
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

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return {
		resources,
	};
};

export default connect(mapStateToProps)(InvoiceListNewComponent);
