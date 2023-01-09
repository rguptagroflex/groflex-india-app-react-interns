import React from "react";
import invoiz from "services/invoiz.service";
import lang from "lang";
import moment from "moment";
import config from "config";
import _ from "lodash";
import TopbarComponent from "shared/topbar/topbar.component";
import ListAdvancedComponent from "shared/list-advanced/list-advanced.component";
import ButtonComponent from "shared/button/button.component";
import WebStorageKey from "enums/web-storage-key.enum";
import InvoiceState from "enums/invoice/invoice-state.enum";
import DeliveryChallanState from "enums/delivery-challan/delivery-challan-state.enum";
// import Invoice from "models/invoice.model";
import LoadingService from "services/loading.service";
import ModalService from "services/modal.service";
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
import userPermissions from "enums/user-permissions.enum";
import { formatDate, formatApiDate } from "helpers/formatDate";
import DeleteCancelChallanModalComponent from "../../shared/modals/delete-cancel-challan-modal.component";
import planPermissions from "../../enums/plan-permissions.enum";
import DeliveryChallan from "../../models/delivery-challan.model";

const CANCEL_OR_DELETE_STATES = [DeliveryChallanState.DELIVERED];
const CANCEL_STATES = [InvoiceState.PAID, InvoiceState.PARTIALLY_PAID];
const NOT_ALLOWED_TO_COPY = [
	transactionTypes.TRANSACTION_TYPE_DEPOSIT_INVOICE,
	transactionTypes.TRANSACTION_TYPE_CLOSING_INVOICE,
];

class DeliveryChallanListNewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			challanData: null,
			selectedRows: [],
			canCreateChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_CHALLAN),
			canDeleteChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_CHALLAN),
			canUpdateChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_CHALLAN),
			canAcceptChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.ACCEPT_CHALLAN),
			canDeclineChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.DECLINE_CHALLAN),
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
			canSetChallanOpen: invoiz.user && invoiz.user.hasPermission(userPermissions.SET_OPEN_CHALLAN),
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_CHALLAN),
			// canRegisterPayment: invoiz.user && invoiz.user.hasPermission(userPermissions.ENTER_CHALLAN_PAYMENT),
			// canCreateReminder: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_INVOICE_REMINDER),
		};
	}
	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_OFFER)) {
			invoiz.user.logout(true);
		}
	}
	componentWillUnmount() {
		this.isUnmounted = true;
	}
	createTopbar() {
		const { isLoading, selectedRows } = this.state;
		const { canDeleteChallan, canAcceptChallan, canDeclineChallan, canSetChallanOpen } = this.state;
		const { resources } = this.props;
		const topbarButtons = [];

		if (!isLoading) {
			if (selectedRows && selectedRows.length > 0) {
				let allCanBeAccepted = true;
				let allCanBeRejected = true;
				let allCanBeSetOpen = true;

				selectedRows.forEach((challan) => {
					if (
						challan.state !== DeliveryChallanState.OPEN &&
						challan.state !== DeliveryChallanState.DECLINED
					) {
						allCanBeAccepted = false;
					}

					if (
						challan.state !== DeliveryChallanState.OPEN &&
						challan.state !== DeliveryChallanState.DELIVERED
					) {
						allCanBeRejected = false;
					}

					if (
						challan.state !== DeliveryChallanState.DELIVERED &&
						challan.state !== DeliveryChallanState.DECLINED
					) {
						allCanBeSetOpen = false;
					}
				});

				if (allCanBeAccepted) {
					topbarButtons.push({
						type: "primary",
						label: resources.str_accept,
						buttonIcon: "icon-check",
						action: "deliver-challans",
						disabled: !canAcceptChallan,
					});
				}

				topbarButtons.push({
					type: topbarButtons.length < 2 ? "danger" : "text",
					label: resources.str_clear,
					buttonIcon: "icon-trashcan",
					action: "delete-challans",
					disabled: !canDeleteChallan,
				});

				if (allCanBeSetOpen) {
					topbarButtons.push({
						type: topbarButtons.length < 2 ? "primary" : "text",
						label: resources.str_openlySet,
						buttonIcon: "icon-edit",
						action: "setopen-offers",
						disabled: !canSetChallanOpen,
					});
				}

				if (allCanBeRejected) {
					topbarButtons.push({
						type: topbarButtons.length < 2 ? "danger" : "text",
						label: resources.str_decline,
						buttonIcon: "icon-close",
						action: "decline-challans",
						disabled: !canDeclineChallan,
					});
				}
			}

			//			if (canCreateOffer) {

			topbarButtons.push({
				type: "primary",
				label: resources.str_makeChallanText,
				buttonIcon: "icon-plus",
				// action: canCreateOffer ? "create" : "upgrade",
				action: "create",
				disabled: false,
			});
		}

		const topbar = (
			<TopbarComponent
				title={resources.str_challan}
				viewIcon={`icon-offer`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action, selectedRows)}
				buttons={topbarButtons}
			/>
		);

		return topbar;
	}
	getChallanStatusMarkup(value, withText, data) {
		const stateIconLabel = this.getStateIconLabel(value);
		// console.log(data);
		// console.log(withText);
		// console.log(value);
		// if (withText && data && value === data.stateOriginal) {
		// 	stateIconLabel.text = "Overdue / Reminded";
		// }

		return `<div class="cell-status-icon"><div class='icon icon-${stateIconLabel.icon}'></div> ${
			withText ? `<span class='cell-status-icon-text'>${stateIconLabel.text}</span>` : ""
		}</div>`;
	}

	getStateIconLabel(value) {
		const iconLabelObj = {};

		switch (value) {
			case DeliveryChallanState.OPEN:
				iconLabelObj.icon = "offen state-locked";
				iconLabelObj.text = "Open";
				break;

			case DeliveryChallanState.DELIVERED:
				iconLabelObj.icon = "bezahlt state-paid";
				iconLabelObj.text = "Delivered";
				break;

			case DeliveryChallanState.INVOICED:
				iconLabelObj.icon = "rechnung state-paid";
				iconLabelObj.text = "Invoiced";
				break;

			case DeliveryChallanState.DECLINED:
				iconLabelObj.icon = "storniert state-cancelled";
				iconLabelObj.text = "Declined";
				break;
			default:
				break;
		}

		return iconLabelObj;
	}

	// getTypeLabel(value) {
	// 	let label = "";

	// 	switch (value) {
	// 		default:
	// 			label = "Challan";
	// 			break;
	// 	}

	// 	return label;
	// }

	onActionCellPopupItemClick(challan, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case "edit":
				setTimeout(() => {
					invoiz.router.navigate(`/challan/edit/${challan.id}`);
				});

				break;
			case "copyAndEdit":
				LoadingService.show(resources.str_challanCopy);
				copyAndEditTransaction({
					invoiceModel: {
						type: "deliveryChallan",
						id: challan.id,
					},
					onCopySuccess: () => {
						LoadingService.hide();
					},
					onCopyError: () => {
						LoadingService.hide();
					},
				});
				break;

			case "delete":
				ModalService.open("Are you sure you want to delete the challan? This action cannot be undone!", {
					width: 500,
					headline: "Delete challan",
					cancelLabel: "Cancel",
					confirmIcon: "icon-trashcan",
					confirmLabel: "Delete",
					confirmButtonType: "danger",
					onConfirm: () => {
						invoiz
							.request(`${config.resourceHost}challan/${challan.id}`, {
								auth: true,
								method: "DELETE",
							})
							.then(() => {
								invoiz.page.showToast({ message: resources.offerDeleteSuccessMessage });

								ModalService.close();

								if (this.refs.listAdvanced) {
									this.refs.listAdvanced.removeSelectedRows([offer]);
								}
							})
							.catch((res) => {
								invoiz.page.showToast({ type: "error", message: resources.defaultErrorMessage });
							});
					},
				});
				break;
		}
	}

	onTopbarButtonClick(action, selectedRows) {
		const { resources } = this.props;
		switch (action) {
			case "create":
				invoiz.router.navigate("/challan/new");
				break;
			//!at the end
			case "upgrade":
				this.setState({ planRestricted: true });
				break;
			case "delete-challans":
				if (this.refs.listAdvanced) {
					let selectedRowsData = this.refs.listAdvanced.getSelectedRows({
						prop: "number",
						sort: "asc",
					});

					selectedRowsData = selectedRowsData.map((challan) => {
						return new Offer(challan);
					});

					ModalService.open(
						<DeleteRowsModal
							deleteUrlPrefix={`${config.resourceHost}challan/`}
							text="Are you sure you would like to delete the following challan(s)? This action cannot be undone!"
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
							headline: "Delete challan(s)",
						}
					);
				}

				break;

			case "deliver-challan":
				ModalService.open(
					<Provider store={store}>
						<OfferMultiActionComponent
							action={OfferMultiAction.ACCEPT}
							selectedItems={selectedRows}
							onConfirm={() => {
								if (this.refs.listAdvanced) {
									this.refs.listAdvanced.clearSelectedRows();
									this.refs.listAdvanced.fetchRows();
								}
								ModalService.close();
							}}
						/>
					</Provider>,
					{
						width: 500,
						headline: resources.str_acceptOffers,
					}
				);
				break;
			case "decline-challan":
				ModalService.open(
					<Provider store={store}>
						<OfferMultiActionComponent
							action={OfferMultiAction.REJECT}
							selectedItems={selectedRows}
							onConfirm={() => {
								if (this.refs.listAdvanced) {
									this.refs.listAdvanced.clearSelectedRows();
									this.refs.listAdvanced.fetchRows();
								}
								ModalService.close();
							}}
						/>
					</Provider>,
					{
						width: 500,
						headline: resources.str_rejectOffers,
					}
				);
				break;

			// case "setopen-offers":
			// 	ModalService.open(
			// 		<Provider store={store}>
			// 			<OfferMultiActionComponent
			// 				action={OfferMultiAction.SET_OPEN}
			// 				selectedItems={selectedRows}
			// 				onConfirm={() => {
			// 					if (this.refs.listAdvanced) {
			// 						this.refs.listAdvanced.clearSelectedRows();
			// 						this.refs.listAdvanced.fetchRows();
			// 					}
			// 					ModalService.close();
			// 				}}
			// 			/>
			// 		</Provider>,
			// 		{
			// 			width: 500,
			// 			headline: resources.str_openOffers,
			// 		}
			// 	);
			// 	break;
		}
	}

	render() {
		const { resources } = this.props;
		const { canCreateChallan, canDeleteChallan, canUpdateChallan, planRestricted, canChangeAccountData } =
			this.state;
		console.log(canCreateChallan, "challan");
		return (
			<div className="invoice-list-component-wrapper">
				{/* {planRestricted ? (
					<RestrictedOverlayComponent
						buttonLabel="Buy Now"
						showButton={invoiz.user.planId === ChargebeePlan.FREE_PLAN_2021}
						message={
							canChangeAccountData
								? invoiz.user.planId === ChargebeePlan.FREE_PLAN_2021
									? "Get access to unlimited quotations at ₹999/year"
									: `Quotations are not available for your current plan`
								: `You don’t have permission to access quotations`
						}
						owner={canChangeAccountData}
					/>
				) : null} */}
				{this.createTopbar()}

				<div className="invoice-list-wrapper">
					<ListAdvancedComponent
						resources={this.props.resources}
						ref="listAdvanced"
						columnDefs={[
							{
								headerName: "Challan number",
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
									longName: "Challan number",
									convertNumberToTextFilterOnDemand: true,
								},
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
								headerName: "Customer name",
								field: "customerName",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter",
							},
							{
								headerName: "Status",
								field: "state",
								filter: "agSetColumnFilter",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								cellRenderer: (evt) => {
									return this.getChallanStatusMarkup(evt.value, true, evt.data);
								},
								comparator: (a, b) => {
									const order = [
										DeliveryChallanState.OPEN,
										DeliveryChallanState.DELIVERED,
										DeliveryChallanState.INVOICED,
										DeliveryChallanState.DECLINED,
									];

									return order.indexOf(a) - order.indexOf(b);
								},
								filterParams: {
									suppressMiniFilter: true,
									valueFormatter: (evt) => {
										return this.getStateIconLabel(evt.value).text;
									},
									values: [
										DeliveryChallanState.OPEN,
										DeliveryChallanState.DELIVERED,
										DeliveryChallanState.INVOICED,
										DeliveryChallanState.DECLINED,
									],
								},
								customProps: {
									disableContextMenuCopyItem: true,
									filterListItemValueRenderer: (value, listItemHtml) => {
										const iconHtml = this.getChallanStatusMarkup(value);
										$(iconHtml).insertBefore($(listItemHtml).find(".ag-set-filter-item-value"));
									},
									onColumnResized: (evt) => {
										updateStatusIconCellColumns(evt, 96);
									},
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
							// {
							// 	headerName: "Type",
							// 	field: "type",
							// 	hide: true,
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	//hide: true,
							// 	comparator: (a, b) => {
							// 		const order = [
							// 			transactionTypes.TRANSACTION_TYPE_RECURRING_INVOICE,
							// 			transactionTypes.TRANSACTION_TYPE_DEPOSIT_INVOICE,
							// 			transactionTypes.TRANSACTION_TYPE_INVOICE,
							// 			transactionTypes.TRANSACTION_TYPE_CLOSING_INVOICE,
							// 			transactionTypes.TRANSACTION_TYPE_POS_RECEIPT,
							// 		];

							// 		return order.indexOf(a) - order.indexOf(b);
							// 	},
							// 	valueFormatter: (evt) => {
							// 		return this.getTypeLabel(evt.value);
							// 	},
							// 	filterParams: {
							// 		suppressMiniFilter: true,
							// 		valueFormatter: (evt) => {
							// 			return this.getTypeLabel(evt.value);
							// 		},
							// 	},
							// 	customProps: {
							// 		disableContextMenuCopyItem: true,
							// 	},
							// },
						]}
						defaultSortModel={{
							colId: "number",
							sort: "desc",
						}}
						emptyState={{
							iconClass: "icon-rechnung",
							headline: "No Challan created yet",
							subHeadline: resources.createChallanText,
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
										callback={() => invoiz.router.navigate("/challan/new")}
										disabled={canCreateChallan}
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
						headTabbedFilterItemsFunc={(challans) => {
							{
								console.log("invoices", challans);
							}
							return [
								{
									filter: {
										field: "state",
										setNull: true,
									},
									label: "All",
									count: challans.length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: [DeliveryChallanState.OPEN],
									},
									label: "Open",
									count: challans.filter((challan) => challan.state === DeliveryChallanState.OPEN)
										.length,
								},
								{
									filter: {
										field: "type",
										filterType: "set",
										values: [DeliveryChallanState.DELIVERED],
									},
									label: "Delivered",
									count: challans.filter((challan) => challan.type === DeliveryChallanState.DELIVERED)
										.length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: [DeliveryChallanState.INVOICED],
									},
									label: "Open",
									count: challans.filter((challan) => challan.state === DeliveryChallanState.INVOICED)
										.length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: [DeliveryChallanState.DECLINED],
									},
									label: "Declined",
									count: challans.filter((challan) => challan.state === DeliveryChallanState.DECLINED)
										.length,
								},
							];
						}}
						// responseDataMapFunc={(Challans) => {
						// 	Challans = Challans.map((challan) => {
						// 		challan = new Invoice(challan);

						// 		const numberBeginsWithZero = challan.number.toString().substr(0, 1) === "0";

						// 		const customerNumberBeginsWithZero =
						// 			challan.customerData.number.toString().substr(0, 1) === "0";

						// 		challan.dueSince = challan.outstandingAmount
						// 			? moment().diff(challan.dueToDate, "days") || null
						// 			: null;

						// 		challan.number =
						// 			challan.number.toString().length === 0
						// 				? Infinity
						// 				: isNaN(Number(challan.number)) || numberBeginsWithZero
						// 				? challan.number
						// 				: Number(challan.number);

						// 		challan.customerNumber = challan.customerData
						// 			? isNaN(Number(challan.customerData.number)) || customerNumberBeginsWithZero
						// 				? challan.customerData.number
						// 				: Number(challan.customerData.number)
						// 			: "";

						// 		//invoice.customerName = (invoice.customerData && invoice.customerData.name) || '';
						// 		challan.customerName = challan.displayName;
						// 		challan.customerEmail = (challan.customer && challan.customer.email) || "";

						// 		challan.customerPhone =
						// 			(challan.customer &&
						// 				(challan.customer.phone1 ||
						// 					challan.customer.phone2 ||
						// 					challan.customer.mobile)) ||
						// 			"";

						// 		if (challan.customerData && challan.customerData.contact) {
						// 			challan.customerName = `${challan.customerName} | ${challan.customerData.contact.name}`;

						// 			if (challan.customerData.contact.email) {
						// 				challan.customerEmail = challan.customerData.contact.email;
						// 			}

						// 			if (
						// 				challan.customerData.contact.phone1 ||
						// 				challan.customerData.contact.phone2 ||
						// 				challan.customerData.contact.mobile
						// 			) {
						// 				challan.customerPhone =
						// 					challan.customerData.contact.phone1 ||
						// 					challan.customerData.contact.phone2 ||
						// 					challan.customerData.contact.mobile;
						// 			}
						// 		}

						// 		if (challan.state === InvoiceState.SENT) {
						// 			challan.state = InvoiceState.LOCKED;
						// 		} else if (challan.state === InvoiceState.PRINTED) {
						// 			challan.state = InvoiceState.PAID;
						// 		}

						// 		if (challan.isOverDueToDate) {
						// 			challan.stateOriginal = challan.state;
						// 			challan.state = InvoiceState.DUNNED;
						// 		}

						// 		challan.date = challan.date
						// 			? moment(challan.date).format(challan.dateFormat.client)
						// 			: "";
						// 		challan.dueToDate = challan.dueToDate
						// 			? moment(challan.dueToDate).format(config.dateFormat.client)
						// 			: "";

						// 		challan.vatAmount = challan.totalGross - challan.totalNet;

						// 		return challan;
						// 	});

						// 	return Challans;
						// }}
						exportExcelCallbacks={{
							processCellCallback: (params) => {
								let value = params.value;

								// if (params.column.colId === "state") {
								// 	value = this.getStateIconLabel(value).text;
								// }

								// if (params.column.colId === "type") {
								// 	value = this.getTypeLabel(value);
								// }

								return value;
							},
						}}
						columnsSettingsModalWidth={680}
						exportFilename={`Exported Challans list ${moment().format(config.dateFormat.client)}`}
						multiSelect={true}
						usePagination={true}
						searchFieldPlaceholder={"Challans"}
						loadingRowsMessage={"Loading Challans ..."}
						noFilterResultsMessage={"No Challans matched the filter"}
						webStorageKey={WebStorageKey.DELIVERY_LIST_SETTINGS}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								const entries = [];
								let challan = null;

								if (item) {
									challan = new DeliveryChallan(item);

									// if (canRegisterPayment) {
									// 	if (PAYABLE_STATES.includes(invoice.state)) {
									// 		entries.push({
									// 			label: "Add payment",
									// 			action: "addPayment",
									// 			dataQsId: "invoice-list-item-dropdown-addpayment",
									// 		});
									// 	}
									// }

									if (canUpdateChallan) {
										if (challan.state === DeliveryChallanState.OPEN) {
											entries.push({
												label: "Edit",
												action: "edit",
												dataQsId: "challan-list-item-dropdown-entry-edit",
											});
											entries.push({
												label: "Copy and edit",
												action: "copyAndEdit",
												dataQsId: "challan-list-item-dropdown-copyandedit",
											});
										}

										// if (!NOT_ALLOWED_TO_COPY.includes(challan.type)) {
										// 	entries.push({
										// 		label: "Copy and edit",
										// 		action: "copyAndEdit",
										// 		dataQsId: "invoice-list-item-dropdown-copyandedit",
										// 	});
										// }
									}

									// entries.push({
									// 	dataQsId: `invoice-list-item-dropdown-entry-print`,
									// 	label: 'Print',
									// 	action: 'print',
									// });

									if (canDeleteChallan) {
										if (challan.state === DeliveryChallanState.OPEN) {
											entries.push({
												label: "Delete",
												action: "delete",
												dataQsId: "invoice-list-item-dropdown-delete",
											});
										}

										// if (!challan.metaData.closingChallanExists) {
										// 	if (CANCEL_OR_DELETE_STATES.includes(challan.state)) {
										// 		entries.push({
										// 			label: "Cancel / Delete",
										// 			action: "delete",
										// 			dataQsId: "invoice-list-item-dropdown-delete",
										// 		});
										// 	} else if (CANCEL_STATES.includes(challan.state)) {
										// 		entries.push({
										// 			label: "Cancel",
										// 			action: "delete",
										// 			dataQsId: "invoice-list-item-dropdown-delete",
										// 		});
										// 	}
										// }
									}
									// if (canCreateReminder) {
									// 	if (invoice.isOverDue) {
									// 		entries.push({
									// 			label: "Create payment reminder",
									// 			action: "dun",
									// 			dataQsId: "invoice-list-item-dropdown-dun",
									// 		});
									// 	}
									// }

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
						onRowDataLoaded={(challanData) => {
							if (!this.isUnmounted) {
								this.setState({
									challanData,
									isLoading: false,
								});
							}
						}}
						onRowClicked={(challan) => {
							invoiz.router.navigate(`/challan/${challan.id}`);
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

export default connect(mapStateToProps)(DeliveryChallanListNewComponent);
