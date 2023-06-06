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
import WebStorageService from "services/webstorage.service";
import Article from "models/article.model";
import Inventory from "models/inventory.model";
import LoadingService from "services/loading.service";
import ModalService from "services/modal.service";
import ArticleDeleteComponent from "shared/article-delete/article-delete.component";

import DeleteRowsModal from "shared/modals/list-advanced/delete-rows-modal.component";
import InventoryAddRemoveModal from "shared/modals/inventory-add-remove-modal.component";
import { ListAdvancedDefaultSettings, transactionTypes } from "helpers/constants";
import { localeCompare, localeCompareNumeric, dateCompare, dateCompareSort } from "helpers/sortComparators";
import { getScaledValue } from "helpers/getScaledValue";
import { formatCurrency } from "helpers/formatCurrency";

import { updateStatusIconCellColumns } from "helpers/list-advanced/updateStatusIconCellColumns";
import { connect, Provider } from "react-redux";
import store from "redux/store";
import userPermissions from "enums/user-permissions.enum";
import planPermissions from "enums/plan-permissions.enum";
import { formatDate, formatApiDate } from "helpers/formatDate";

class ArticleListNewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			articleData: null,
			inventoryData: null,
			btnSelectedRow: null,
			selectedRows: [],
			canCreateArticle: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_ARTICLE),
			canUpdateArticle: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_ARTICLE),
			canDeleteArticle: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_ARTICLE),
			isInventoryNotAvailable: true, //invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_INVENTORY),  open when we lunch inventory
		};
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	createTopbar() {
		const { isLoading, selectedRows, canCreateArticle, canDeleteArticle } = this.state;
		const { resources } = this.props;
		const topbarButtons = [];

		if (!isLoading) {
			// if (selectedRows && selectedRows.length > 0) {
			// 	let allDeletable = true;

			// 	selectedRows.forEach((invoice) => {
			// 		if (invoice.state !== InvoiceState.DRAFT) {
			// 			allDeletable = false;
			// 		}
			// 	});

			// 	if (allDeletable) {
			// 		topbarButtons.push({
			// 			type: 'danger',
			// 			label: resources.str_clear,
			// 			buttonIcon: 'icon-trashcan',
			// 			action: 'delete-invoices',
			// 		});
			// 	}
			// }
			if (selectedRows && selectedRows.length > 0) {
				topbarButtons.push({
					type: "danger",
					label: resources.str_clear,
					buttonIcon: "icon-trashcan",
					action: "delete-articles",
					disabled: !canDeleteArticle,
				});
			}

			//   if (canCreateArticle) {
			topbarButtons.push({
				type: "primary",
				label: resources.createArticle,
				buttonIcon: "icon-plus",
				action: "create",
				//disabled: !canCreateArticle
			});
			//   }
		}

		const topbar = (
			<TopbarComponent
				title={resources.str_article}
				viewIcon={`icon-article_outlined`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action, selectedRows)}
				buttons={topbarButtons}
			/>
		);

		return topbar;
	}

	// getInvoiceStatusMarkup(value, withText, data) {
	// 	const stateIconLabel = this.getStateIconLabel(value);

	// 	if (
	// 		withText &&
	// 		data &&
	// 		value === InvoiceState.DUNNED &&
	// 		data.stateOriginal &&
	// 		data.stateOriginal === InvoiceState.DUNNED
	// 	) {
	// 		stateIconLabel.text = 'Overdue / Reminded';
	// 	}

	// 	return `<div class="cell-status-icon"><div class='icon icon-${stateIconLabel.icon}'></div> ${
	// 		withText ? `<span class='cell-status-icon-text'>${stateIconLabel.text}</span>` : ''
	// 	}</div>`;
	// }

	// getStateIconLabel(value) {
	// 	const iconLabelObj = {};

	// 	switch (value) {
	// 		case InvoiceState.DRAFT:
	// 			iconLabelObj.icon = 'entwurf state-draft';
	// 			iconLabelObj.text = 'Draft';
	// 			break;

	// 		case InvoiceState.LOCKED:
	// 		case InvoiceState.SENT:
	// 			iconLabelObj.icon = 'offen state-locked';
	// 			iconLabelObj.text = 'Open';
	// 			break;

	// 		case InvoiceState.PARTIALLY_PAID:
	// 			iconLabelObj.icon = 'offen state-locked';
	// 			iconLabelObj.text = 'Partially paid';
	// 			break;

	// 		case InvoiceState.CANCELLED:
	// 			iconLabelObj.icon = 'storniert state-cancelled';
	// 			iconLabelObj.text = 'Canceled';
	// 			break;

	// 		case InvoiceState.DUNNED:
	// 			iconLabelObj.icon = 'ueberfaellig state-dunned';
	// 			iconLabelObj.text = 'Reminded';
	// 			break;

	// 		case InvoiceState.PAID:
	// 		case InvoiceState.PRINTED:
	// 			iconLabelObj.icon = 'bezahlt state-paid';
	// 			iconLabelObj.text = 'Paid';
	// 			break;

	// 		default:
	// 			break;
	// 	}

	// 	return iconLabelObj;
	// }

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

	onActionCellPopupItemClick(article, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case "edit":
				setTimeout(() => {
					invoiz.router.navigate(`/article/edit/${article.id}`);
				});
				break;

			case "delete":
				ModalService.open(`${resources.articleDeleteConfirmText} ${resources.str_undoneMessage}`, {
					width: 500,
					headline: resources.articleDelete,
					cancelLabel: resources.str_abortStop,
					confirmIcon: "icon-trashcan",
					confirmLabel: resources.str_clear,
					confirmButtonType: "secondary",
					onConfirm: () => {
						ModalService.close();
						invoiz
							.request(`${config.resourceHost}article/${article.id}`, {
								auth: true,
								method: "DELETE",
							})
							.then(() => {
								invoiz.page.showToast({ message: resources.articleDeleteSuccessMessage });
								ModalService.close();
								if (this.refs.listAdvanced) {
									this.refs.listAdvanced.removeSelectedRows([article]);
								}
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
				invoiz.router.navigate("/article/new");
				break;
			case "delete-articles":
				if (this.refs.listAdvanced) {
					let selectedRowsData = this.refs.listAdvanced.getSelectedRows({
						prop: "number",
						sort: "asc",
					});

					selectedRowsData = selectedRowsData.map((article) => {
						return new Article(article);
					});

					ModalService.open(
						<DeleteRowsModal
							deleteUrlPrefix={`${config.resourceHost}article/`}
							text="Are you sure you would like to delete the following article(s)? This action cannot be undone!"
							firstColLabelFunc={() => "Article name"}
							secondColLabelFunc={(item) => item.title}
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
							headline: "Delete articles",
						}
					);
				}

				break;
		}
	}

	getBtnModalClicked(text, data, evt) {
		const { resources } = this.props;
		const { articleData } = this.state;
		if (text === resources.str_trackInInventory) {
			WebStorageService.setItem(WebStorageKey.TRACK_STOCK_SCROLL, { scrollTrack: true });
			invoiz.router.navigate(`/article/edit/${data.id}`);
		} else {
			console.log(data);
			ModalService.open(
				<InventoryAddRemoveModal
					resources={resources}
					actionType={text}
					btnSelectedRow={data}
					onConfirm={(response) => {
						let updateddata = response.body.data;
						if (this.refs.listAdvanced) {
							this.refs.listAdvanced.updateRowStockData(evt.node.id, updateddata);
						}
						invoiz.page.showToast({ message: `Successfully updated article stock!` });
						ModalService.close();
						invoiz.router.reload();
					}}
				/>,
				{
					headline: `${text} article stock`,
					width: 520,
					padding: 40,
					noTransform: true,
					isCloseableViaOverlay: false,
				}
			);
		}
	}

	onActionSettingPopupItemClick(entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case "articlecategory":
				invoiz.router.navigate("/settings/more-settings/article-categories");
				break;
			case "moresettings":
				invoiz.router.navigate("/settings/more-settings/article");
				break;
			case "importacticles":
				invoiz.router.navigate("/settings/data-import/articles/1");
				break;
		}
	}

	render() {
		const { resources } = this.props;
		const { canUpdateArticle, canDeleteArticle, canCreateArticle } = this.state;

		let columnDefs = [
			{
				headerName: "No.",
				field: "number",
				suppressMovable: true,
				maxWidth: 100,
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
					longName: "Article number",
					convertNumberToTextFilterOnDemand: true,
				},
			},
			{
				headerName: "Article name",
				field: "title",
				minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
				width: getScaledValue(86, window.innerWidth, 1600),
				comparator: localeCompare,
				...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
			},
			{
				headerName: "MRP",
				maxWidth: 250,
				hide: false,
				field: "mrp",
				//suppressMovable: true,
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
				cellStyle: (evt) => {
					return { textAlign: "left" };
				},
			},
			{
				headerName: "Current stock",
				field: "currentStock",
				maxWidth: 200,
				sort: "desc",
				minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
				width: getScaledValue(86, window.innerWidth, 1600),
				cellRenderer: (evt) => {
					return evt.value === Infinity
						? ""
						: evt.data.trackedInInventory && evt.data.currentStock !== null
						? `${evt.value} ${evt.data.unit}`
						: null;
				},
				comparator: localeCompareNumeric,
				cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
				cellStyle: (evt) => {
					if (evt.data.trackedInInventory) {
						if (evt.value < evt.data.minimumBalance) {
							return {
								color: "red",
							};
						} else {
							return null;
						}
					}
				},
				filter: "agNumberColumnFilter",
				filterParams: {
					suppressAndOrCondition: true,
				},
				customProps: {
					longName: "Current stock",
					convertNumberToTextFilterOnDemand: true,
				},
			},
			{
				headerName: "Current stock value",
				field: "value",
				minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
				width: getScaledValue(86, window.innerWidth, 1600),
				//hide: true,
				comparator: localeCompareNumeric,
				cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
				valueFormatter: (evt) => {
					return evt.value === Infinity
						? ""
						: evt.data.trackedInInventory && evt.data.currentStock !== null
						? `${formatCurrency(parseFloat(evt.data.currentStock) * parseFloat(evt.data.avgPurchaseValue))}`
						: "";
				},
				filter: "agNumberColumnFilter",
				filterParams: {
					suppressAndOrCondition: true,
				},
				customProps: {
					calculateHeaderSum: true,
				},
				cellStyle: (evt) => {
					return { textAlign: "left" };
				},
			},
			{
				headerName: "Category",
				hide: true,
				field: "category",
				minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
				comparator: localeCompare,
				...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
			},
			{
				headerName: "HSN/SAC code",
				hide: true,
				maxWidth: 200,
				field: "hsnSacCode",
				minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
				comparator: localeCompare,
				...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
			},
			{
				headerName: "Avg. purchase price",
				minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
				width: getScaledValue(86, window.innerWidth, 1600),
				field: "avgPurchaseValue",
				//hide: true,
				comparator: localeCompareNumeric,
				cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
				valueFormatter: (evt) => {
					return evt.value === Infinity
						? ""
						: evt.data.trackedInInventory
						? `${formatCurrency(evt.value)}`
						: "";
				},
				filter: "agNumberColumnFilter",
				filterParams: {
					suppressAndOrCondition: true,
				},
				// customProps: {
				// 	calculateHeaderSum: true,
				// },
				cellStyle: (evt) => {
					return { textAlign: "left" };
				},
			},
			{
				headerName: "Minimum stock",
				field: "minimumBalance",
				maxWidth: 200,
				sort: "desc",
				minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
				width: getScaledValue(86, window.innerWidth, 1600),
				cellRenderer: (evt) => {
					return evt.value === Infinity
						? ""
						: evt.data.trackedInInventory && evt.data.minimumBalance !== null
						? `${evt.value} ${evt.data.unit}`
						: null;
				},
				comparator: localeCompareNumeric,
				cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
				filter: "agNumberColumnFilter",
				filterParams: {
					suppressAndOrCondition: true,
				},
				customProps: {
					longName: "Minimum Balance",
					convertNumberToTextFilterOnDemand: true,
				},
			},
			{
				headerName: "Default purchase price",
				maxWidth: 250,
				minWidth: 250,
				hide: true,
				field: "purchasePrice",
				//suppressMovable: true,
				//minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
				comparator: localeCompareNumeric,
				cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
				valueFormatter: (evt) => {
					return formatCurrency(evt.value);
				},
				cellStyle: (evt) => {
					return { textAlign: "left" };
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
				headerName: "Default purchase price (gross)",
				maxWidth: 250,
				field: "purchasePriceGross",
				hide: true,
				//suppressMovable: true,
				minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
				comparator: localeCompareNumeric,
				cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
				valueFormatter: (evt) => {
					return formatCurrency(evt.value);
				},
				cellStyle: (evt) => {
					return { textAlign: "left" };
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
			// 	headerName: 'Default current stock value',
			// 	field: 'defaultCurrentStockValue',
			// 	minWidth: 200,
			// 	maxWidth: 300,
			// 	hide: true,
			// 	comparator: localeCompareNumeric,
			// 	cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
			// 	valueFormatter: (evt) => {
			// 		//return formatCurrency(parseFloat(evt.data.currentStock) * parseFloat(evt.data.purchasePrice));
			// 		return evt.data.trackedInInventory ? (`${formatCurrency(parseFloat(evt.data.currentStock) * parseFloat(evt.data.purchasePrice))}`) : null;
			// 	},
			// 	filter: 'agNumberColumnFilter',
			// 	filterParams: {
			// 		suppressAndOrCondition: true,
			// 	},
			// 	// customProps: {
			// 	// 	calculateHeaderSum: true,
			// 	// },
			// 	cellStyle: (evt) => {
			// 		return { textAlign: 'left' }
			// 	},
			// },
			{
				headerName: "Sales price (net)",
				maxWidth: 250,
				hide: true,
				field: "price",
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
				cellStyle: (evt) => {
					return { textAlign: "left" };
				},
			},
			{
				headerName: "Sales price (gross)",
				maxWidth: 250,
				hide: true,
				field: "priceGross",
				//suppressMovable: true,
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
				cellStyle: (evt) => {
					return { textAlign: "left" };
				},
			},
			{
				headerName: "Stock actions",
				field: "trackedInInventory",
				filter: true,
				minWidth: 120,
				//minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
				width: getScaledValue(86, window.innerWidth, 1600),
				suppressMovable: true,
				//	enableHiding: false,
				suppressMenu: true,
				cellRenderer: "btnCellRenderer",
				cellRendererParams: {
					resources,
				},
			},
		];

		const inventoryFields = ["trackedInInventory", "currentStock", "value", "minimumBalance"];

		if (this.state.isInventoryNotAvailable) {
			columnDefs = columnDefs.filter((column) => !inventoryFields.includes(column.field));
		}

		return (
			<div className="article-list-component-wrapper">
				{this.createTopbar()}

				<div className="article-list-wrapper">
					<ListAdvancedComponent
						resources={this.props.resources}
						ref="listAdvanced"
						columnDefs={columnDefs}
						onCellBtnClicked={(text, data, evt) => {
							this.getBtnModalClicked(text, data, evt);
						}}
						defaultSortModel={{
							colId: "number",
							sort: "desc",
						}}
						emptyState={{
							iconClass: "icon-article_outlined",
							headline: "No articles created yet",
							subHeadline: resources.createOrImportArticalText,
							buttons: (
								<React.Fragment>
									<ButtonComponent
										label={resources.createArticle}
										buttonIcon="icon-plus"
										dataQsId="empty-list-create-button"
										callback={() => invoiz.router.navigate("/article/new")}
										disabled={!canCreateArticle}
									/>
								</React.Fragment>
							),
						}}
						fetchUrls={[
							`${config.resourceHost}article?offset=0&searchText=&limit=9999999&orderBy=number&desc=false`,
							`${config.resourceHost}inventory?offset=0&searchText=&limit=9999999&orderBy=articleId&desc=false`,
						]}
						onMultiRowData={(responses) => {
							responses = responses[0].map((article) => {
								article = new Article(article);
								if (article["trackedInInventory"]) {
									responses[1].map((inventoryItem) => {
										if (article["id"] === inventoryItem["articleId"]) {
											article["inventoryId"] = inventoryItem["id"];
											article["currentStock"] = inventoryItem["currentStock"];
											article["minimumBalance"] = inventoryItem["minimumBalance"];
											article["value"] = inventoryItem["value"];
											article["itemModifiedDate"] = inventoryItem["itemModifiedDate"];
											article["unit"] = inventoryItem["unit"];
											article["avgPurchaseValue"] = inventoryItem["avgPurchaseValue"];
										}
									});
								}
								const numberBeginsWithZero = article.number.toString().substr(0, 1) === "0";

								// const customerNumberBeginsWithZero =
								// 	invoice.customerData.number.toString().substr(0, 1) === '0';

								article.number =
									article.number.toString().length === 0
										? Infinity
										: isNaN(Number(article.number)) || numberBeginsWithZero
										? article.number
										: Number(article.number);

								// invoice.customerNumber = invoice.customerData
								// 	? isNaN(Number(invoice.customerData.number)) || customerNumberBeginsWithZero
								// 		? invoice.customerData.number
								// 		: Number(invoice.customerData.number)
								// 	: '';

								article.title = article.title || "";

								article.hsnSacCode = article.hsnSacCode || "";

								article.category = article.category || "";
								return article;
							});

							return responses;
							// if (!this.isUnmounted) {
							// 	this.setState({
							// 		inventoryData: inventory
							// 	}, () => {
							// 	});
							// }

							//return inventory;
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
						exportFilename={`Exported articles list ${moment().format(config.dateFormat.client)}`}
						multiSelect={true}
						usePagination={true}
						searchFieldPlaceholder={"Articles"}
						loadingRowsMessage={"Loading articles ..."}
						noFilterResultsMessage={"No articles matched the filter"}
						webStorageKey={WebStorageKey.ARTICLE_LIST_SETTINGS}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								const entries = [];
								let article = null;

								if (item) {
									article = new Article(item);
									if (canUpdateArticle && canDeleteArticle) {
										entries.push({
											dataQsId: `article-list-item-dropdown-entry-delete`,
											label: resources.str_clear,
											action: "delete",
										});

										entries.push({
											dataQsId: `article-list-item-dropdown-entry-edit`,
											label: resources.str_toEdit,
											action: "edit",
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
									label: "Article category",
									action: "articlecategory",
									dataQsId: "setting-list-item-dropdown-articlecategory",
								});
								entries.push({
									label: "Article Units",
									action: "moresettings",
									dataQsId: "setting-list-item-dropdown-moresettings",
								});
								entries.push({
									label: "Import Articles",
									action: "importacticles",
									dataQsId: "setting-list-item-dropdown-importarticles",
								});

								return [entries];
							},
							onSettingPopupItemClicked: (popupEntry) => {
								this.onActionSettingPopupItemClick(popupEntry);
							},
						}}
						onRowDataLoaded={(articleData) => {
							if (!this.isUnmounted) {
								this.setState({
									articleData,
									isLoading: false,
								});
							}
						}}
						onRowClicked={(article) => {
							invoiz.router.navigate(`/article/${article.id}`);
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

export default connect(mapStateToProps)(ArticleListNewComponent);
