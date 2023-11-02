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
import TabsComponent from "../../shared/tabs/tabs.component";
import SVGInline from "react-svg-inline";
import Group from "../../../assets/images/icons/Group 3086.svg";
import minimumStock from "../../../assets/images/icons/minimumStock.svg";
import totalStock from "../../../assets/images/icons/Total stock.svg";
import openingBalance from "../../../assets/images/icons/Group.svg";
import priceRed from "../../../assets/images/icons/Price_red.svg";
import priceGreen from "../../../assets/images/icons/Price.svg";

const TopbarActions = {
	EDIT: 1,
	CREATE_PURCHASE_ORDER: 2,
};
const tabs = ["Article Overview", "History"];
class ArticleDetailComponent extends React.Component {
	constructor(props) {
		super(props);

		const article = this.props.article || {};
		const inventory = this.props.inventory || {};
		const inventoryHistory = this.props.inventoryHistory || {};
		const salesVolumeData = this.props.salesVolumeData || {};
		this.state = {
			activeTab: "Article Overview",
		};
		this.state = {
			article,
			inventory,
			inventoryHistory,
			salesVolumeData,
			canUpdateArticle: null,
			canViewArticleSalesOverview: null,
			canViewOffer: null,
			canViewExpense: false,
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
			canViewExpense: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_EXPENSE),
		});
		this.setState({ activeTab: "Article Overview" });
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
	setActiveTab(tab) {
		this.setState({ activeTab: tab });
	}

	addFile(files) {
		if (!files) {
			return;
		}

		_.each(files, (file) => {
			this.manualUploader.addFile([file]);
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
			<div className="detail-wrap u_mt_48 u_p_16 getBlock1Content-wrap ">
				<div className="article-content_content row">
					<div className="article-row">
						<div className="articleImageContainer">
							<img
								className=""
								style={
									!article.imageUrl
										? {
												height: 100,
												textAlign: "center",
												borderRadius: "112px",
												border: "1px solid var(--grey-medium-dddddd, #DDD)",
												width: " 112px",
												height: " 112px",
												flexShrink: " 0",
										  }
										: null
								}
								src={!article.imageUrl ? "/assets/images/icons/article_img_placeholder.svg" : imageUrl}
								alt={"Could not load image!"}
								onError={(e) => {
									e.target.style = "padding: 95px 57px 0 50px!important; font-size: 12px;";
								}}
							/>
							{/* {!article.imageUrl ? (
								<span
									style={{ textAlign: "center", marginTop: 10, color: "#747474" }}
								>{`No image found`}</span>
							) : null} */}
						</div>
						<div className="article-content-row">
							<div className="itemGroup-article">
								<div className="text-h4 text-truncatewrap">{article.title}</div>
								<div className="item text-truncatewrap">
									<div
										className="item_text text-truncatewrap"
										dangerouslySetInnerHTML={{ __html: format(article.description) }}
									></div>
								</div>
								<div className="itemGroup text-right">
									<div className="item">
										<div className="item_label text-h4">{`MRP ${article.displayMRP}${"/"}${
											article.unit
										}`}</div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="article-row-wrap">
						<div className="itemGroup-articles text-right">
							<div className="row">
								<div className="col-xs-6">
									<div className="item-article">
										<div className="item_label">{resources.str_category}</div>
										<div className="item_text">{article.displayCategory}</div>
									</div>
								</div>
								<div className="col-xs-6">
									<div className="item-article">
										<div className="item_label">{resources.str_numberShort}</div>
										<div className="item_text">{article.number}</div>
									</div>
								</div>
							</div>
							<div>
								<div className="row">
									<div className="col-xs-6">
										<div className="item-article">
											<div className="item_label">{resources.str_hsnSacCode}</div>
											<div className="item_text">
												{article.displayHsnSacCode === "N/A" ? "-" : article.displayHsnSacCode}
											</div>
											{console.log("HSN: ", article.displayHsnSacCode)}
										</div>
									</div>
									<div className="col-xs-6">
										<div className="item-article">
											<div className="item_label">{`EAN code`}</div>
											<div className="item_text">{article.displayEANCode}</div>
										</div>
									</div>
								</div>
							</div>
							<div>
								<div className="row">
									<div className="col-xs-6">
										<div className="item-article">
											<div className="item_label">{resources.articleVATRateLabel}</div>
											<div className="item_text">{article.displayVatPercent}</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
	renderSellingPriceNet(article, resources) {
		if (article && article.displayPrice) {
			return (
				<div className="selling-price-container">
					<SVGInline className="background-image-price" svg={priceGreen} alt={"Could not load image!"} />
					<div className="item-content">
						<div className="text-muted text-medium u_mb_6" style={{ marginTop: "10px" }}>
							<span>Selling price</span>
							<br />
							<span>(Net)</span>
						</div>
						<div className="text-h6 text-primary">{article.displayPrice}</div>
					</div>
				</div>
			);
		} else {
			console.log("No displayPrice found");
			return null;
		}
	}
	renderSellingPriceGross(article, resources) {
		if (article && article.displayPriceGross) {
			return (
				<div className="selling-price-gross-container">
					<SVGInline className="background-image-price" svg={priceGreen} alt={"Could not load image!"} />
					<div className="item-content">
						<div className="text-muted text-medium u_mb_6" style={{ marginTop: "10px" }}>
							<span>Selling price</span>
							<br />
							<span>(Gross)</span>
						</div>
						<div className="text-h6 text-primary">{article.displayPriceGross}</div>
					</div>
				</div>
			);
		} else {
			return null;
		}
	}
	renderPurchasePriceNet(article, resources) {
		if (article && article.displayPurchasePrice) {
			return (
				<div className="purchase-price-net-container">
					<SVGInline className="background-image-price-red" svg={priceRed} alt={"Could not load image!"} />
					<div className="item-content">
						<div className="text-muted text-medium u_mb_6" style={{ marginTop: "10px", display: "flex" }}>
							<span>Purchase (Net)</span>
							<span>price</span>
						</div>
						<div className="text-h6 text-primary">{article.displayPurchasePrice}</div>
					</div>
				</div>
			);
		} else {
			return null;
		}
	}
	renderPurchasePriceGross(article, resources) {
		if (article && article.displayPurchasePrice) {
			return (
				<div className="purchase-price-gross-container">
					<SVGInline className="background-image-price-red" svg={priceRed} alt={"Could not load image!"} />
					<div className="item-content">
						<div className="text-muted text-medium u_mb_6" style={{ marginTop: "10px", display: "flex" }}>
							<span>Purchase (Gross) </span>
							<span>price</span>
						</div>
						<div className="text-h6 text-primary">{article.displayPurchasePriceGross}</div>
					</div>
				</div>
			);
		} else {
			return null;
		}
	}

	getBlock2Content() {
		const { salesVolumeData } = this.state;
		const { resources } = this.props;

		return (
			<div
				className="detail-wrap u_mt_16 u_p_16 u_ml_8 sales-wrap "
				style={{
					borderRadius: "10px",
					border: "1.087px solid var(--grey-dark-c-6-c-6-c-6, #C6C6C6)",
					background: "var(--font-colors-white-fffffff, #FFF)",
					width: "770px",
					height: "422px",
					flexShrink: " 0",
				}}
			>
				<div className="pagebox_heading text-h4">{resources.str_salesOverview}</div>
				<div className="text-muted">{resources.str_salesLastTwelveMonth}</div>

				<div className="graph-cont row">
					<div className="col-xs-3">
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
	getTotalRevenue() {
		const { salesVolumeData } = this.state;
		const { resources } = this.props;

		return (
			<div className="total-revenue-container">
				<SVGInline className="background-image-price" svg={priceGreen} alt={"Could not load image!"} />
				<div className="item-content">
					<div className="text-muted text-medium u_mb_6" style={{ marginTop: "15px" }}>
						<span>Total Revenue</span>
						<br />
					</div>
					<div className="text-h6 text-primary" style={{ marginTop: "10px" }}>
						{formatCurrency(salesVolumeData.turnoverTotal)}
					</div>
				</div>
			</div>
		);
	}
	getTotalOrders() {
		const { salesVolumeData } = this.state;
		const { resources } = this.props;

		return (
			<div className="total-order-container">
				<SVGInline className="background-image-price-red" svg={priceRed} alt={"Could not load image!"} />
				<div className="item-content">
					<div className="text-muted text-medium u_mb_6" style={{ marginTop: "15px" }}>
						<span>Total Orders</span>
						<br />
					</div>
					<div className="text-h6 text-primary" style={{ marginTop: "10px" }}>
						{formatCurrency(salesVolumeData.invoiceCount)}
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
		const {
			article,
			inventoryHistory,
			canUpdateArticle,
			canViewArticleSalesOverview,
			canViewOffer,
			canViewExpense,
		} = this.state;
		const { activeTab } = this.state;
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
		if (!canViewExpense) {
			permittedfilterItems = permittedfilterItems.filter(
				(item) => item.key !== "expense" && item.key !== "purchaseOrder"
			);
		}
		return (
			<div className="article-detail-wrapper wrapper-has-topbar">
				{canUpdateArticle ? (
					<TopbarComponent
						title={article.title}
						backButtonRoute={`/articles`}
						buttonCallback={(e, button) => this.onTopbarButtonClick(button.action)}
						buttons={[
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
				<div className="row">
					<div className="tabs-container" style={{ display: "flex", marginLeft: "-60px", marginTop: "30px" }}>
						<TabsComponent activeTab={this.state.activeTab} setActiveTab={this.setActiveTab}>
							<TabsComponent.List>
								{tabs.map((tab, index) => (
									<div
										key={index}
										className={`tab-item ${this.state.activeTab === tab ? "active-tab" : ""}`}
										onClick={() => this.setActiveTab(tab)}
										style={{
											marginRight: "20px",
											cursor: "pointer",
											position: "relative",
											color: this.state.activeTab === tab ? "#00A353" : "#272D30",
										}}
									>
										{tab}
										{this.state.activeTab === tab && (
											<div>
												<div
													style={{
														content: "",
														display: "block",
														position: "absolute",
														bottom: "-7px",
														left: "0",
														width: "100%",
														height: "3px",
														backgroundColor: "#00A353",
													}}
												/>
												<div
													style={{
														content: "",
														display: "block",
														position: "absolute",
														bottom: "-8px",
														left:
															this.state.activeTab === "Article Overview"
																? "0px"
																: "-270%",

														width: "1100px",
														height: "1px",
														background: "#C6C6C6",
													}}
												/>
											</div>
										)}
									</div>
								))}
							</TabsComponent.List>
						</TabsComponent>
					</div>
				</div>
				{activeTab === "Article Overview" && (
					// <div>
					<div className="row detail-wrap-article" style={{ marginLeft: "-72px" }}>
						<div className="col-xs-3">
							<div className="row">{this.getBlock1Content()}</div>
							<div className="row u_mt_16 u_p_16 detail-wrap notes-box">
								<NotesComponent
									data={article}
									heading={resources.str_remarks}
									// placeholder={resources.articleEnterCommentsAboutArticleText}
									// notesAlertLabel={resources.str_seeNoteConfirmationMessage}
									// showToggleInput={true}
									onSave={({ notes, notesAlert }) => this.onSaveNotesClick({ notes, notesAlert })}
									resources={resources}
									defaultFocus={true}
								/>
							</div>
						</div>
						<div className="col-xs-9 ">
							<div className="row ">
								<div className="col-xs-6 u_ml_10">
									<div className="row detail-wrap u_ml_8 u_mt_48">
										<div className="row u_m_16 row-box-col">
											<div className="col-xs-4 box-column">
												{" "}
												{this.renderSellingPriceNet(article, resources)}
											</div>
											<div className=" col-xs-4 box-column">
												{this.renderSellingPriceGross(article, resources)}
											</div>
											<div className="col-xs-4 box-column">{this.getTotalRevenue()}</div>
										</div>

										<div className="row u_m_16 row-box-col">
											<div className=" col-xs-4 box-column">
												{this.renderPurchasePriceNet(article, resources)}
											</div>
											<div className="col-xs-4 box-column">
												{this.renderPurchasePriceGross(article, resources)}
											</div>
											<div className=" col-xs-4 box-column">{this.getTotalOrders()}</div>
										</div>
									</div>
								</div>
								<div className="col-xs-5 u_ml_16 detail-wrap detail-information u_mt_48">
									<div className="detail-information-content">
										<div className="content-information">
											<div className="title is-4 mb-2 mt-4">
												<h4>Coming Soon</h4>
											</div>
											<div className="article-detail-information-text">
												<span>Launching new Inventory</span>
												<br />
												<span>features very soon</span>
											</div>
										</div>
										<div
											style={{
												display: "grid",
												gridTemplateColumns: "1fr 1fr",
												height: "100%",
												width: "100%",
											}}
										>
											<div
												style={{
													display: "flex",
													flexDirection: "column",
													alignItems: "center",
													height: "10%",
													padding: "8px",
												}}
											>
												<SVGInline
													className="background-image"
													svg={openingBalance}
													alt={"Could not load image!"}
												/>
												<p style={{ textAlign: "center", marginTop: "10px" }}>
													Opening Balance
												</p>
											</div>
											<div
												style={{
													display: "flex",
													flexDirection: "column",
													alignItems: "center",
													height: "10%",
													padding: "8px",
												}}
											>
												<SVGInline
													className="background-image"
													svg={Group}
													alt={"Could not load image!"}
												/>
												<p style={{ textAlign: "center", marginTop: "10px" }}>
													Low Stock Alert
												</p>
											</div>
											<div
												style={{
													display: "flex",
													flexDirection: "column",
													alignItems: "center",
													height: "10%",
													padding: "8px",
												}}
											>
												<SVGInline
													className="background-image"
													svg={minimumStock}
													alt={"Could not load image!"}
												/>
												<p>Minimum Stock</p>
											</div>
											<div
												style={{
													display: "flex",
													flexDirection: "column",
													alignItems: "center",
													height: "10%",
													padding: "8px",
												}}
											>
												<SVGInline
													className="background-image"
													svg={totalStock}
													alt={"Could not load image!"}
												/>
												<p style={{ textAlign: "center", marginTop: "10px" }}>Total Stock</p>
											</div>
										</div>
									</div>
									<div className="row"></div>
								</div>
							</div>
							<div className="row u_ml_10">
								{canViewArticleSalesOverview ? this.getBlock2Content() : null}
							</div>
						</div>

						{article.trackedInInventory ? (
							<div className="box" style={{ height: 699, display: "none" }}>
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
											)}getBlock1Content
										</div> */}

											<div className="article ">
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
					</div>
				)}

				{activeTab === "History" && (
					<div className="detail-wrap u_p_16 u_mt_48 detail-history" style={{ marginLeft: "-70px" }}>
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
				)}
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
