import invoiz from "services/invoiz.service";
import React from "react";
import TopbarComponent from "shared/topbar/topbar.component";
import BarChartMonthsComponent from "shared/charts/bar-chart-months.component";
import config from "config";
import { formatCurrency } from "helpers/formatCurrency";
import LoaderComponent from "shared/loader/loader.component";
import NotesComponent from "shared/notes/notes.component";
import Article from "models/article.model";
import Inventory from "models/inventory.model";
import ListComponent from "shared/list/list.component";
import PaginationComponent from "shared/pagination/pagination.component";
import FilterComponent from "shared/filter/filter.component";
import ButtonComponent from "shared/button/button.component";
import {
	fetchArticleHistoryList,
	sortArticleHistoryList,
	paginateArticleHistoryList,
	filterArticleHistoryList,
	fetchInventoryHistoryList,
	paginateInventoryHistoryList,
	sortInventoryHistoryList,
} from "redux/ducks/article/articleHistoryList";
import { connect } from "react-redux";
import userPermissions from "enums/user-permissions.enum";
import { formatApiDate, formatClientDate } from "../../helpers/formatDate";
import WebStorageService from "services/webstorage.service";
import WebStorageKey from "enums/web-storage-key.enum";
import { format } from "util";
import Uploader from "fine-uploader";
import _ from "lodash";
import { handleTransactionFormErrors, handleImageError } from "helpers/errors";

const TopbarActions = {
	EDIT: 1,
	CREATE_PURCHASE_ORDER: 2,
};

class ArticleDetailComponent extends React.Component {
	constructor(props) {
		super(props);

		const article = this.props.article || {};
		const inventory = this.props.inventory || {};
		const inventoryHistory = this.props.inventoryHistory || {};
		const salesVolumeData = this.props.salesVolumeData || {};

		this.state = {
			article,
			inventory,
			inventoryHistory,
			salesVolumeData,
			canUpdateArticle: null,
			canViewArticleSalesOverview: null,
			canViewOffer: null,
			uploadedArticleImage: [],
		};
	}

	componentDidMount() {
		const { article, inventory } = this.state;
		if (!invoiz.user.hasPermission(userPermissions.VIEW_ARTICLE)) {
			invoiz.user.logout(true);
		}
		this.props.fetchArticleHistoryList(this.state.article.id, true);
		if (article.trackedInInventory) {
			this.props.fetchInventoryHistoryList(this.state.inventory.id, true);
		}

		this.setState({
			canUpdateArticle: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_ARTICLE),
			canViewArticleSalesOverview:
				invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_ARTICLE_SALES_OVERVIEW),
			canViewOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_OFFER),
		});
		setTimeout(() => {
			this.initManualUploader();
		});
	}

	createArticleHistoryTableRows(articleHistoryItems) {
		const rows = [];
		if (articleHistoryItems) {
			articleHistoryItems.forEach((articleHistoryItem, index) => {
				rows.push({
					id: articleHistoryItem.id,
					articleHistoryItem,
					cells: [
						{ value: articleHistoryItem.displayDate },
						{ value: articleHistoryItem.displayType },
						{ value: articleHistoryItem.displayNumber },
						{ value: articleHistoryItem.customer },
						{ value: articleHistoryItem.displayQuantity },
						{ value: articleHistoryItem.displayPrice },
					],
				});
			});
		}

		return rows;
	}

	createInventoryTableRows(inventoryHistoryItems) {
		const rows = [];

		if (inventoryHistoryItems) {
			inventoryHistoryItems.forEach((inventoryHistoryItem, index) => {
				let sourceValues = null;
				sourceValues = inventoryHistoryItem.source.split(",");
				rows.push({
					id: inventoryHistoryItem.id,
					inventoryHistoryItem,
					cells: [
						{ value: formatClientDate(inventoryHistoryItem.itemModifiedDate) },
						{ value: inventoryHistoryItem.quantity },
						{ value: inventoryHistoryItem.currentStock },
						{ value: formatCurrency(inventoryHistoryItem.value) },
						{ value: inventoryHistoryItem.action },
						{
							value:
								sourceValues[0] !== "manual"
									? sourceValues[0] === "expense" || sourceValues[0] === "invoice"
										? sourceValues[0] + " " + sourceValues[1]
										: sourceValues[0]
									: sourceValues[0],
						},
					],
				});
			});
		}

		return rows;
	}

	addFile(files) {
		if (!files) {
			return;
		}

		_.each(files, (file) => {
			this.manualUploader.addFiles([file]);
		});
	}

	addSelectedFile(event) {
		const file = event.target.files[0];
		this.addFile([file]);
		event.target.value = "";
	}

	initDragAndDropUploader() {
		Uploader.DragAndDrop({
			dropZoneElements: [document.getElementById("expense-receipt-dropbox")],
			callbacks: {
				processingDroppedFilesComplete: (files) => {
					this.addFile(files);
				},
			},
		});
	}

	initManualUploader() {
		const { resources } = this.props;
		this.manualUploader = new Uploader.FineUploaderBasic(
			_.assign({}, config.article.fineUploader, {
				autoUpload: true,
				multiple: false,
				messages: {
					// minSizeError: resources.expenseFileMinSizeError,
					// sizeError: resources.expenseFileMaxSizeError,
					typeError: resources.expenseFileTypeError,
				},
				request: {
					customHeaders: { authorization: `Bearer ${invoiz.user.token}` },
					endpoint: `${config.article.endpoints.articleImageUrl}/${this.state.article.id}`,
					inputName: "image",
					filenameParam: "filename",
				},
				callbacks: {
					onComplete: (id, fileName, response) => {
						if (!response.success) {
							return;
						}
						const { name } = this.manualUploader.getFile(id);
						const obj = { id: response.data.id, name };
						const { uploadedArticleImage } = this.state;
						uploadedArticleImage.push(obj);
						this.setState({ uploadedArticleImage }, () => {
							invoiz.page.showToast({ message: resources.str_fileUploadSuccessMessage });
							invoiz.router.reload();
						});

						//if (!this.state.isModal) {

						//}
					},
					onError: (id, name, errorReason, xhr) => {
						if (xhr) {
							const { meta: error } = JSON.parse(xhr.response);
							return handleImageError(this, error);
						}

						invoiz.page.showToast({
							type: "error",
							message: format(errorReason, name) || resources.expenseEditImageUploadError,
						});
					},
				},
			})
		);
	}

	getBlock1Content() {
		const { article, inventory } = this.state;
		const { resources } = this.props;
		//const imageUrl = article.imageUrl && article.imageUrl.includes('type=external') ?  `${config.imageResourceHost}${article.imageUrl}`;
		//const imageUrl = `${config.imageResourceHost}${article.metaData.imageUrl}`;
		const imageUrl = !article.imageUrl
			? null
			: article.imageUrl.includes("type=external")
			? article.imageUrl
			: `${config.imageResourceHost}${article.imageUrl}`;
		return (
			<div className="box wrapper-has-topbar-with-margin">
				<div className="article-content_content row">
					<div className="article-col">
						<div className="articleImageContainer">
							<img
								className=""
								style={!article.imageUrl ? { height: 100, textAlign: "center", marginTop: 55 } : null}
								src={!article.imageUrl ? "/assets/images/icons/article_img_placeholder.svg" : imageUrl}
								alt={"Could not load image!"}
								onError={(e) => {
									e.target.style = "padding: 95px 57px 0 50px!important; font-size: 12px;";
								}}
							/>
							{!article.imageUrl ? (
								<span
									style={{ textAlign: "center", marginTop: 10, color: "#747474" }}
								>{`No image found`}</span>
							) : null}
						</div>
					</div>
					<div className="article-col">
						<div className="itemGroup" style={{ marginBottom: 0 }}>
							<div className="text-h4 text-truncatewrap" style={{ height: 56, width: 232 }}>
								{article.title}
							</div>
							<div className="item text-truncatewrap" style={{ height: 56, paddingTop: 5 }}>
								<div
									className="item_text text-truncatewrap"
									dangerouslySetInnerHTML={{ __html: format(article.description) }}
								></div>
							</div>
						</div>
						<div className="itemGroup text-right">
							<div className="item">
								<div className="item_label">{resources.str_category}</div>
								<div className="item_text">{article.displayCategory}</div>
							</div>
							<div className="item">
								<div className="item_label">{resources.str_numberShort}</div>
								<div className="item_text">{article.number}</div>
							</div>
							<div className="item">
								<div className="item_label">{resources.str_hsnSacCode}</div>
								<div className="item_text">{article.displayHsnSacCode}</div>
							</div>
							<div className="item">
								<div className="item_label">{`EAN code`}</div>
								<div className="item_text">{article.displayEANCode}</div>
							</div>
						</div>
						{/* {article.trackedInInventory ? (<div className="pagebox_subheading">
							<div className="item">
								<div className="item_label">{`Current stock`}</div>
								<div className={inventory.currentStock < inventory.minimumBalance ? "item_text low_stock_alert" : "item_text"} style={{paddingRight: 5}}>{inventory.currentStock}</div>
								<div className={inventory.currentStock < inventory.minimumBalance ? "item_text low_stock_alert" : "item_text"}>{article.unit}</div>
							</div>
							<div className="item">
								<div className="item_label">{`Minimum stock`}</div>
								<div className="item_text" style={{paddingRight: 5}}>{inventory.minimumBalance}</div>
								<div className="item_text">{article.unit}</div>
							</div>
							<div className="item">
								<div className="item_label">{`Opening balance`}</div>
								<div className="item_text" style={{paddingRight: 5}}>{inventory.openingBalance}</div>
								<div className="item_text">{article.unit}</div>
							</div>
							<div className="item">
								<div className="item_label">{`Low stock alert`}</div>
								{
									inventory.lowStockAlert ? (<div className="item_text">Enabled</div>) : (<div className="item_text">Disabled</div>)
								}
							</div>
						</div>) : null} */}
					</div>

					<div className="article-col">
						<div className="itemGroup text-right">
							<div className="item">
								<div className="item_label text-h4">{`MRP ${article.displayMRP}${"/"}${
									article.unit
								}`}</div>
								{/* <div className="item_text">{article.displayMRP + '/' + article.unit}</div> */}
							</div>
							<div className="item" style={{ paddingTop: 5 }}>
								<div className="item_label">{resources.articleVATRateLabel}</div>
								<div className="item_text">{article.displayVatPercent}</div>
							</div>
						</div>
						{invoiz.user.isSmallBusiness ? (
							<div className="itemGroup text-right">
								<div className="item">
									<div className="item_label">{`Purchase price (net)`}</div>
									<div className="item_text">{article.displayPurchasePrice}</div>
								</div>
							</div>
						) : (
							<div className="itemGroup text-right" style={{ marginTop: 50 }}>
								<div className="item">
									<div className="item_label">{`Purchase price (net)`}</div>
									<div className="item_text">{article.displayPurchasePrice}</div>
								</div>
								<div className="item">
									<div className="item_label">{`Purchase price (gross)`}</div>
									<div className="item_text">{article.displayPurchasePriceGross}</div>
								</div>
								{/* <div className="item">
									<div className="item_label">{resources.str_purchaseVatRate}</div>
									<div className="item_text">{article.displayPurchaseVatPercent}</div>
								</div> */}
								<div className="item">
									<div className="item_label">{resources.str_salesPriceNet}</div>
									<div className="item_text">{article.displayPrice}</div>
								</div>
								<div className="item">
									<div className="item_label">{resources.str_salesPriceGross}</div>
									<div className="item_text">{article.displayPriceGross}</div>
								</div>
							</div>
						)}
					</div>
					{/* {article.metaData.imageUrl === null ? (
						<div className="row">
							<div className="article-image">
								<ButtonComponent callback={() => invoiz.router.reload()} label={`Upload image`} />
							</div>
						</div>
					) : null} */}
					<div className="row">
						<div className="article-image">
							<label className="text-muted">
								<p
								// className="upload-image"
								>
									<span
										className="button button-default button-rounded"
										// style={{ color: "white" }}
									>{`Upload image`}</span>
								</p>
								<input className="u_hidden" type="file" onChange={this.addSelectedFile.bind(this)} />
							</label>
						</div>
					</div>
				</div>
				{article.trackedInInventory ? (
					<div className="article-inventory-row">
						<div className="item" style={{ flexDirection: "column" }}>
							<div className="item_label">{`Current stock`}</div>
							<div
								className={
									inventory.currentStock < inventory.minimumBalance
										? "item_text low_stock_alert"
										: "item_text"
								}
							>{`${!inventory.currentStock ? 0 : inventory.currentStock} ${article.unit}`}</div>
							{/* <div className={inventory.currentStock < inventory.minimumBalance ? "item_text low_stock_alert" : "item_text"}>{article.unit}</div> */}
						</div>
						<div className="item" style={{ flexDirection: "column" }}>
							<div className="item_label">{`Minimum stock`}</div>
							<div className="item_text">{`${inventory.minimumBalance} ${article.unit}`}</div>
							{/* <div className="item_text">{article.unit}</div> */}
						</div>
						<div className="item" style={{ flexDirection: "column" }}>
							<div className="item_label">{`Opening balance`}</div>
							<div className="item_text">{`${inventory.openingBalance} ${article.unit}`}</div>
							{/* <div className="item_text">{article.unit}</div> */}
						</div>
						<div className="item" style={{ flexDirection: "column" }}>
							<div className="item_label">{`Low stock alert`}</div>
							{inventory.lowStockAlert ? (
								<div className="item_text">Enabled</div>
							) : (
								<div className="item_text text-red">Disabled</div>
							)}
						</div>
					</div>
				) : (
					<div className="article-inventory-row_untracked">
						<span>{`Article not tracked in inventory`}</span>
					</div>
				)}
			</div>
		);
	}

	getBlock2Content() {
		const { salesVolumeData } = this.state;
		const { resources } = this.props;

		return (
			<div className="box">
				<div className="pagebox_heading text-h4">{resources.str_salesOverview}</div>
				<div className="text-muted">{resources.str_salesLastTwelveMonth}</div>

				<div className="graph-cont row">
					<div className="col-xs-3">
						<div className="item item-vertical ">
							<div className="item_label">{resources.str_totalRevenue}</div>
							<div className="item_text">{formatCurrency(salesVolumeData.turnoverTotal)}</div>
						</div>
						<div className="item item-vertical ">
							<div className="item_label">{resources.articleTotalOrdersLabel}</div>
							<div className="item_text">{salesVolumeData.invoiceCount}</div>
						</div>

						<div className="item item-vertical ">
							<div className="item_label">Ø {resources.articleQuantityPerOrderLabel}</div>
							<div className="item_text">{salesVolumeData.averageAmount}</div>
						</div>
						<div className="item item-vertical ">
							<div className="item_label">Ø {resources.str_sellingPrice}</div>
							<div className="item_text">{salesVolumeData.averagePrice}</div>
						</div>
					</div>

					<div className="col-xs-9">
						<BarChartMonthsComponent target="articleSalesVolumeStats" data={salesVolumeData.chartData} />
					</div>
				</div>
			</div>
		);
	}

	onUploadImage() {}

	onFilterList(filter) {
		this.props.filterArticleHistoryList(this.state.article.id, filter);
	}

	onPaginate(page) {
		this.props.paginateArticleHistoryList(this.state.article.id, page);
	}

	onInventoryPaginate(page) {
		this.props.paginateInventoryHistoryList(this.state.inventory.id, page);
	}

	onRowClick(row) {
		invoiz.router.navigate(row.articleHistoryItem.itemUrl);
	}

	onSort(column) {
		this.props.sortArticleHistoryList(this.state.article.id, column);
	}

	onInventorySort(column) {
		this.props.sortInventoryHistoryList(this.state.inventory.id, column);
	}

	onSaveNotesClick({ notes, notesAlert }) {
		const { resources } = this.props;
		const article = JSON.parse(JSON.stringify(this.state.article));

		article.notes = notes;
		article.notesAlert = notesAlert;

		invoiz
			.request(`${config.resourceHost}article/${article.id}`, {
				auth: true,
				method: "PUT",
				data: article,
			})
			.then((response) => {
				invoiz.page.showToast({ message: resources.articleUpdateSuccessMessage });
				const articleUpdated = new Article(article);
				this.setState({ article: articleUpdated });
			})
			.catch(() => {
				invoiz.page.showToast({ message: resources.defaultErrorMessage });
			});
	}

	onTopbarButtonClick(action) {
		const { article, inventory } = this.state;
		if (action === TopbarActions.EDIT) {
			invoiz.router.navigate(`/${config.article.clientUrl.single}/edit/${article.id}`);
		}

		if (action === TopbarActions.CREATE_PURCHASE_ORDER) {
			WebStorageService.setItem(WebStorageKey.ARTICLE_PO_ENTRY, {
				id: article.id,
				calculationBase: article.calculationBase,
				number: article.number,
				price: article.price,
				priceGross: article.priceGross,
				purchasePrice: article.purchasePrice,
				purchasePriceGross: article.purchasePriceGross,
				title: article.title,
				unit: article.unit,
				value: article.value,
				vatPercent: article.vatPercent,
				description: article.description,
				hsnSacCode: article.hsnSacCode,
				trackedInInventory: inventory.trackedInInventory,
			});
			invoiz.router.navigate(`/purchase-order/new`);
		}
	}

	render() {
		const { article, inventoryHistory, canUpdateArticle, canViewArticleSalesOverview, canViewOffer } = this.state;
		const {
			isLoading,
			errorOccurred,
			columns,
			currentPage,
			totalPages,
			filterItems,
			articleHistoryListData: { articleHistoryItems },
			inventoryHistoryListData: { inventoryHistoryItems },
			inventoryHistoryColumns,
			inventoryCurrentPage,
			inventoryTotalPages,
			resources,
		} = this.props;
		let permittedfilterItems;
		if (!canViewOffer) {
			permittedfilterItems = filterItems.filter((item) => item.key !== "offer");
		} else {
			permittedfilterItems = filterItems;
		}
		return (
			<div className="article-detail-wrapper wrapper-has-topbar">
				{canUpdateArticle ? (
					<TopbarComponent
						title={article.title}
						backButtonRoute={`/articles`}
						buttonCallback={(e, button) => this.onTopbarButtonClick(button.action)}
						buttons={[
							// { type: 'primary', label: `Create purchase order`, buttonIcon: 'icon-plus', action: TopbarActions.CREATE_PURCHASE_ORDER },
							{
								type: "primary",
								label: resources.str_toEdit,
								buttonIcon: "icon-edit2",
								action: TopbarActions.EDIT,
							},
						]}
					/>
				) : (
					<TopbarComponent
						title={article.title}
						backButtonRoute={`/articles`}
						buttonCallback={(e, button) => this.onTopbarButtonClick(button.action)}
					/>
				)}
				{this.getBlock1Content()}

				{canViewArticleSalesOverview ? this.getBlock2Content() : null}

				{article.trackedInInventory ? (
					<div className="box" style={{ height: 699 }}>
						<div className="pagebox_heading text-h4">{`Stock movement`}</div>
						<div className="pagebox_content articleHistory_container">
							{errorOccurred ? (
								<div className="article-history-error">
									<div className="error-headline">
										<h1>{resources.errorOccuredMessage}</h1>
									</div>
									<div>
										<ButtonComponent
											callback={() => invoiz.router.reload()}
											label={resources.str_reload}
										/>
									</div>
								</div>
							) : (
								<div>
									{/* <div className="article-history-list-head-content">
									{isLoading ? null : (
										<FilterComponent
											items={permittedfilterItems}
											onChange={filter => this.onFilterList(filter)}
											resources={resources}
										/>
									)}
								</div> */}

									<div className="article">
										{isLoading ? (
											<LoaderComponent visible={true} />
										) : (
											<div>
												<ListComponent
													clickable={false}
													//rowCallback={(id, row) => this.onRowClick(row)}
													sortable={true}
													columns={inventoryHistoryColumns}
													rows={this.createInventoryTableRows(inventoryHistoryItems)}
													columnCallback={(column) => this.onInventorySort(column)}
													emptyFallbackElement={resources.str_noDocumentAvailable}
													resources={resources}
												/>

												{inventoryTotalPages > 1 ? (
													<div className="article-history-list-pagination">
														<PaginationComponent
															currentPage={inventoryCurrentPage}
															totalPages={inventoryTotalPages}
															onPaginate={(page) => {
																this.onInventoryPaginate(page);
															}}
														/>
													</div>
												) : null}
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				) : null}

				<div className="box">
					<div className="pagebox_heading text-h4">{resources.str_history}</div>
					<div className="pagebox_content articleHistory_container">
						{errorOccurred ? (
							<div className="article-history-error">
								<div className="error-headline">
									<h1>{resources.errorOccuredMessage}</h1>
								</div>
								<div>
									<ButtonComponent
										callback={() => invoiz.router.reload()}
										label={resources.str_reload}
									/>
								</div>
							</div>
						) : (
							<div>
								<div className="article-history-list-head-content">
									{isLoading ? null : (
										<FilterComponent
											items={permittedfilterItems}
											onChange={(filter) => this.onFilterList(filter)}
											resources={resources}
										/>
									)}
								</div>

								<div className="article">
									{isLoading ? (
										<LoaderComponent visible={true} />
									) : (
										<div>
											<ListComponent
												clickable={true}
												rowCallback={(id, row) => this.onRowClick(row)}
												sortable={true}
												columns={columns}
												rows={this.createArticleHistoryTableRows(articleHistoryItems)}
												columnCallback={(column) => this.onSort(column)}
												emptyFallbackElement={resources.str_noDocumentAvailable}
												resources={resources}
											/>

											{totalPages > 1 ? (
												<div className="article-history-list-pagination">
													<PaginationComponent
														currentPage={currentPage}
														totalPages={totalPages}
														onPaginate={(page) => this.onPaginate(page)}
													/>
												</div>
											) : null}
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
				<div className="notes box">
					<NotesComponent
						data={article}
						heading={resources.str_remarks}
						placeholder={resources.articleEnterCommentsAboutArticleText}
						notesAlertLabel={resources.str_seeNoteConfirmationMessage}
						showToggleInput={true}
						onSave={({ notes, notesAlert }) => this.onSaveNotesClick({ notes, notesAlert })}
						resources={resources}
						defaultFocus={true}
					/>
				</div>
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		articleHistoryListData,
		inventoryHistoryListData,
		inventoryHistoryColumns,
		inventoryCurrentPage,
		inventoryTotalPages,
		filterItems,
	} = state.article.articleHistoryList;

	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		articleHistoryListData,
		filterItems,
		resources,
		inventoryHistoryListData,
		inventoryHistoryColumns,
		inventoryCurrentPage,
		inventoryTotalPages,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		fetchArticleHistoryList: (articleId, reset) => {
			dispatch(fetchArticleHistoryList(articleId, reset));
		},
		paginateArticleHistoryList: (articleId, page) => {
			dispatch(paginateArticleHistoryList(articleId, page));
		},
		fetchInventoryHistoryList: (inventoryId, reset) => {
			dispatch(fetchInventoryHistoryList(inventoryId, reset));
		},
		paginateInventoryHistoryList: (inventoryId, page) => {
			dispatch(paginateInventoryHistoryList(inventoryId, page));
		},
		sortArticleHistoryList: (articleId, column) => {
			dispatch(sortArticleHistoryList(articleId, column));
		},
		sortInventoryHistoryList: (inventoryId, column) => {
			dispatch(sortInventoryHistoryList(inventoryId, column));
		},
		filterArticleHistoryList: (articleId, filter) => {
			dispatch(filterArticleHistoryList(articleId, filter));
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(ArticleDetailComponent);
