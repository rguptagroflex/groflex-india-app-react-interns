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
import Offer from "models/offer.model";
import Payment from "models/payment.model";
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
import ChargebeePlan from "enums/chargebee-plan.enum";
import { formatDate, formatApiDate } from "helpers/formatDate";
import OfferState from "enums/offer/offer-state.enum";
import OfferTypes from "enums/impress/offer-types.enum";
import SharedDataService from "services/shared-data.service";
import OfferMultiAction from "enums/offer/offer-multi-action.enum";
import OfferMultiActionComponent from "shared/offer-multi-action/offer-multi-action.component";
import planPermissions from "enums/plan-permissions.enum";
import RestrictedOverlayComponent from "shared/overlay/restricted-overlay.component";
import { redirectToChargebee } from "../../helpers/redirectToChargebee";
class OfferListNewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			offerData: null,
			selectedRows: [],
			canCreateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_OFFER),
			canDeleteOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_OFFER),
			canUpdateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_OFFER),
			canCreateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_IMPREZZ_OFFER),
			canUpdateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_IMPREZZ_OFFER),
			canDeleteImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_IMPREZZ_OFFER),
			canAcceptOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.ACCEPT_OFFER),
			canRejectOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.REJECT_OFFER),
			canSetOfferOpen: invoiz.user && invoiz.user.hasPermission(userPermissions.SET_OPEN_OFFER),
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_OFFER),
			submenuVisible: this.props.isSubmenuVisible,
		};
	}

	componentDidUpdate(prevProps) {
		const { isSubmenuVisible } = this.props;

		if (prevProps.isSubmenuVisible !== isSubmenuVisible) {
			this.setState({ submenuVisible: isSubmenuVisible });
		}
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_OFFER)) {
			invoiz.user.logout(true);
		}
	}

	createTopbar() {
		const { isLoading, selectedRows } = this.state;
		const {
			canCreateOffer,
			canDeleteOffer,
			canUpdateOffer,
			canCreateImprezzOffer,
			canAcceptOffer,
			canRejectOffer,
			canSetOfferOpen,
		} = this.state;
		const { resources } = this.props;
		const topbarButtons = [];

		if (!isLoading) {
			if (selectedRows && selectedRows.length > 0) {
				let allCanBeAccepted = true;
				let allCanBeRejected = true;
				let allCanBeSetOpen = true;

				selectedRows.forEach((offer) => {
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
						type: "primary",
						label: resources.str_accept,
						buttonIcon: "icon-check",
						action: "accept-offers",
						disabled: !canAcceptOffer,
					});
				}

				topbarButtons.push({
					type: topbarButtons.length < 2 ? "danger" : "text",
					label: resources.str_clear,
					buttonIcon: "icon-trashcan",
					action: "delete-offers",
					disabled: !canDeleteOffer,
				});

				if (allCanBeSetOpen) {
					topbarButtons.push({
						type: topbarButtons.length < 2 ? "primary" : "text",
						label: resources.str_openlySet,
						buttonIcon: "icon-edit",
						action: "setopen-offers",
						disabled: !canSetOfferOpen,
					});
				}

				if (allCanBeRejected) {
					topbarButtons.push({
						type: topbarButtons.length < 2 ? "danger" : "text",
						label: resources.str_decline,
						buttonIcon: "icon-close",
						action: "reject-offers",
						disabled: !canRejectOffer,
					});
				}
			}

			//			if (canCreateOffer) {

			topbarButtons.push({
				type: "primary",
				// label: resources.str_createOffer,
				label: "Create Proforma Invoice",
				buttonIcon: "icon-plus",
				// action: canCreateOffer ? "create" : "upgrade",
				action: "create",
				disabled: false,
			});
			//	}
			// if (canCreateImprezzOffer) {
			// if (!selectedRows || (selectedRows && selectedRows.length === 0)) {
			// 	topbarButtons.push({
			// 		type: this.props.isImpressOfferList ? "primary" : "default",
			// 		label: (
			// 			<span>
			// 				{" "}
			// 				{resources.offerImpressCreateText} {/* <sup>{resources.str_beta}</sup> */}
			// 			</span>
			// 		),
			// 		buttonIcon: "icon-paint",
			// 		action: "create-impress-offer",
			// 		// disabled: !canCreateImprezzOffer,
			// 	});
			// }
			// }
		}

		const topbar = (
			<TopbarComponent
				title={"Proforma Invoices"}
				viewIcon={`icon-credit_card`}
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
			withText ? `<span class='cell-status-icon-text'>${stateIconLabel.text}</span>` : ""
		}</div>`;
	}

	getStateIconLabel(value) {
		const iconLabelObj = {};

		switch (value) {
			case OfferState.DRAFT:
			case OfferState.TEMP:
				iconLabelObj.icon = "entwurf state-draft";
				iconLabelObj.text = "Draft";
				break;

			case OfferState.OPEN:
				iconLabelObj.icon = "offen state-locked";
				iconLabelObj.text = "Open";
				break;

			case OfferState.INVOICED:
				iconLabelObj.icon = "rechnung state-paid";
				iconLabelObj.text = "Invoiced";
				break;

			case OfferState.REJECTED:
				iconLabelObj.icon = "storniert state-cancelled";
				iconLabelObj.text = "Declined";
				break;

			case OfferState.ACCEPTED:
			case OfferState.PROJECT_CREATED:
				iconLabelObj.icon = "bezahlt state-paid";
				iconLabelObj.text = "Accepted";
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

	onActionCellPopupItemClick(offer, entry) {
		const isImpress = offer.type === "impress";
		const { resources } = this.props;
		switch (entry.action) {
			case "edit":
				if (isImpress) {
					setTimeout(() => {
						invoiz.router.navigate(`/offer/impress/edit/${offer.id}`);
					});
				} else {
					setTimeout(() => {
						invoiz.router.navigate(`/proformaInvoice/edit/${offer.id}`);
					});
				}
				break;
			// case "copyAndEdit":
			// 	LoadingService.show(resources.str_offerCopy);
			// 	copyAndEditTransaction({
			// 		invoiceModel: {
			// 			type: "offer",
			// 			id: offer.id,
			// 		},
			// 		onCopySuccess: () => {
			// 			LoadingService.hide();
			// 		},
			// 		onCopyError: () => {
			// 			LoadingService.hide();
			// 		},
			// 	});
			// 	break;

			case "delete":
				ModalService.open("Are you sure you want to delete the quotation? This action cannot be undone!", {
					width: 500,
					headline: "Delete quotation",
					cancelLabel: "Cancel",
					confirmIcon: "icon-trashcan",
					confirmLabel: "Delete",
					confirmButtonType: "danger",
					onConfirm: () => {
						invoiz
							.request(`${config.resourceHost}offer/${offer.id}`, {
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
				invoiz.router.navigate("/proformaInvoice/new");
				break;
			case "upgrade":
				this.setState({ planRestricted: true });
				break;
			case "delete-offers":
				if (this.refs.listAdvanced) {
					let selectedRowsData = this.refs.listAdvanced.getSelectedRows({
						prop: "number",
						sort: "asc",
					});

					selectedRowsData = selectedRowsData.map((offer) => {
						return new Offer(offer);
					});

					ModalService.open(
						<DeleteRowsModal
							deleteUrlPrefix={`${config.resourceHost}offer/`}
							text="Are you sure you would like to delete the following quotation(s)? This action cannot be undone!"
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
							headline: "Delete Quotation(s)",
						}
					);
				}

				break;
			case "create-impress-offer":
				// SharedDataService.set(
				// 	"offer-impress-templates-returnToImpressOfferList"
				// 	//this.props.isImpressOfferList
				// );
				invoiz.router.navigate("/offer/impress/templates");
				break;
			case "accept-offers":
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
			case "reject-offers":
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

			case "setopen-offers":
				ModalService.open(
					<Provider store={store}>
						<OfferMultiActionComponent
							action={OfferMultiAction.SET_OPEN}
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
						headline: resources.str_openOffers,
					}
				);
				break;
		}
	}

	onActionSettingPopupItemClick(entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case "textModules":
				invoiz.router.navigate("/settings/text-modules/offer");
				break;
			case "numberRange":
				invoiz.router.navigate("/settings/more-settings/offer");
				break;
		}
	}

	render() {
		const { resources } = this.props;
		const {
			canCreateOffer,
			canDeleteOffer,
			canUpdateOffer,
			canUpdateImprezzOffer,
			canChangeAccountData,
			planRestricted,
			submenuVisible,
		} = this.state;

		const classLeft = submenuVisible ? "alignLeftContent" : "";
		return (
			<div className="invoice-list-component-wrapper">
				{planRestricted ? (
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
				) : null}
				{this.createTopbar()}

				<div className={`invoice-list-wrapper ${classLeft}`}>
					<ListAdvancedComponent
						resources={this.props.resources}
						ref="listAdvanced"
						columnDefs={[
							{
								headerName: "Number",
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
									longName: "Quotation number",
									convertNumberToTextFilterOnDemand: true,
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
								headerName: "Quotation type",
								field: "type",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								cellRenderer: (evt) => {
									return evt.value === "standard" ? "Standard" : "Imprezz";
								},
								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
							{
								headerName: "Status",
								field: "state",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								cellRenderer: (evt) => {
									return this.getInvoiceStatusMarkup(evt.value, true, evt.data);
								},
								comparator: (a, b) => {
									const order = [
										// Bezahlt
										OfferState.ACCEPTED,

										// Entwurf
										OfferState.DRAFT,

										// Offen
										OfferState.OPEN,

										// Storniert
										OfferState.INVOICED,

										// Überfällig
										OfferState.REJECTED,
									];

									return order.indexOf(a) - order.indexOf(b);
								},
								filterParams: {
									suppressMiniFilter: true,
									valueFormatter: (evt) => {
										return this.getStateIconLabel(evt.value).text;
									},
									values: [
										OfferState.ACCEPTED,
										OfferState.DRAFT,
										OfferState.OPEN,
										OfferState.INVOICED,
										OfferState.REJECTED,
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
								headerName: "Date created",
								field: "date",
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
						]}
						defaultSortModel={{
							colId: "",
							sort: "desc",
						}}
						emptyState={{
							iconClass: "icon-credit_card",
							headline: resources.offerListHeadingText,
							subHeadline: resources.offerCreateNow,
							buttons: (
								<React.Fragment>
									<ButtonComponent
										label={resources.str_hereWeGo}
										buttonIcon="icon-plus"
										restricted={planRestricted}
										dataQsId="empty-list-create-button"
										callback={() => invoiz.router.navigate("/offer/new")}
										disabled={!canCreateOffer}
									/>
								</React.Fragment>
							),
						}}
						// fetchUrls={[
						// 	`${config.resourceHost}invoice?offset=0&searchText=&limit=9999999&orderBy=date&desc=true&filter=everything&trigger=true`,
						// ]}
						fetchUrls={[
							`${config.resourceHost}offer?offset=0&searchText=&limit=9999999&orderBy=date&desc=true&filter=all&trigger=true`,
						]}
						headTabbedFilterItemsFunc={(offers) => {
							return [
								{
									filter: {
										field: "state",
										setNull: true,
									},
									label: "All",
									count: offers.length,
								},
								// {
								// 	filter: {
								// 		field: 'state',
								// 		filterType: 'set',
								// 		values: [OfferState.DRAFT, OfferState.TEMP],
								// 	},
								// 	label: 'Draft',
								// 	count: offers.filter((offer) => offer.state === OfferState.DRAFT).length,
								// },
								{
									filter: {
										field: "state",
										filterType: "set",
										values: [OfferState.OPEN],
									},
									label: "Open",
									count: offers.filter((offer) => offer.state === OfferState.OPEN).length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: [OfferState.ACCEPTED],
									},
									label: "Accepted",
									count: offers.filter((offer) => offer.state === OfferState.ACCEPTED).length,
								},

								{
									filter: {
										field: "state",
										filterType: "set",
										values: [OfferState.INVOICED],
									},
									label: "Invoiced",
									count: offers.filter((offer) => offer.state === OfferState.INVOICED).length,
								},
								{
									filter: {
										field: "state",
										filterType: "set",
										values: [OfferState.REJECTED],
									},
									label: "Declined",
									count: offers.filter((offer) => offer.state === OfferState.REJECTED).length,
								},
							];
						}}
						responseDataMapFunc={(offers) => {
							offers = offers.map((offer) => {
								offer = new Offer(offer);

								const numberBeginsWithZero = offer.number.toString().substr(0, 1) === "0";

								const customerNumberBeginsWithZero =
									offer.customerData.number.toString().substr(0, 1) === "0";

								offer.number =
									offer.number.toString().length === 0
										? Infinity
										: isNaN(Number(offer.number)) || numberBeginsWithZero
										? offer.number
										: Number(offer.number);

								offer.customerName = (offer.customerData && offer.customerData.name) || "";

								offer.date = offer.date ? moment(offer.date).format(config.dateFormat.client) : "";

								return offer;
							});

							return offers;
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
						exportFilename={`Exported quotations list ${moment().format(config.dateFormat.client)}`}
						multiSelect={true}
						usePagination={true}
						searchFieldPlaceholder={"Quotations"}
						loadingRowsMessage={"Loading quotations ..."}
						noFilterResultsMessage={"No quotations matched the filter"}
						webStorageKey={WebStorageKey.OFFER_LIST_SETTINGS}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								const entries = [];
								let offer = null;

								if (item) {
									offer = new Offer(item);
									if (canUpdateOffer) {
										entries.push({
											label: "Edit",
											action: "edit",
											dataQsId: "offer-list-item-dropdown-entry-edit",
										});
										// entries.push({
										// 	label: "Copy and edit",
										// 	action: "copyAndEdit",
										// 	dataQsId: "offer-list-item-dropdown-copyandedit",
										// });
									}
									if (canDeleteOffer) {
										entries.push({
											label: "Delete",
											action: "delete",
											dataQsId: "offer-list-item-dropdown-delete",
										});
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

								return [entries];
							},
							onSettingPopupItemClicked: (popupEntry) => {
								this.onActionSettingPopupItemClick(popupEntry);
							},
						}}
						onRowDataLoaded={(offerData) => {
							if (!this.isUnmounted) {
								this.setState({
									offerData,
									isLoading: false,
								});
							}
						}}
						onRowClicked={(offer) => {
							invoiz.router.navigate(
								`/proformaInvoice/${
									offer.type === `standard` ? offer.id : `impress/detail/${offer.id}`
								}`
							);
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
	const isSubmenuVisible = state.global.isSubmenuVisible;
	const { resources } = state.language.lang;
	return {
		resources,
		isSubmenuVisible,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		submenuVisible: (payload) => {
			dispatch(submenuVisible(payload));
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(OfferListNewComponent);
