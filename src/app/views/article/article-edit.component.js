import React from "react";
import invoiz from "services/invoiz.service";
import config from "config";
import accounting from "accounting";
import Decimal from "decimal.js";
import TopbarComponent from "shared/topbar/topbar.component";
import ChangeDetection from "helpers/changeDetection";
import CurrencyInputComponent from "shared/inputs/currency-input/currency-input.component";
import HtmlInputComponent from "shared/inputs/html-input/html-input.component";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import TabInputComponent from "shared/inputs/tab-input/tab-input.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import NumberInputComponent from "shared/inputs/number-input/number-input.component";
import Article from "models/article.model";
import Inventory from "models/inventory.model";
import { handleTransactionFormErrors } from "helpers/errors";
import InventoryAction from "enums/inventory/inventory-action.enum";
import InventorySource from "enums/inventory/inventory-source.enum";
import Uploader from "fine-uploader";
import _ from "lodash";
import NotificationsComponent from "shared/settings/notifications.component";
import WebStorageKey from "enums/web-storage-key.enum";
import WebStorageService from "services/webstorage.service";
import debounce from "es6-promise-debounce";
import ArticleSearchSelectComponent from "shared/article-search/article-search-select.component";
import userPermissionsEnum from "enums/user-permissions.enum";
import planPermissionsEnum from "../../enums/plan-permissions.enum";
import SVGInline from "react-svg-inline";
import UploadIcon from "../../../assets/images/icons/upload_icon.svg";

const changeDetection = new ChangeDetection();
class ArticleEditComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			selectedImageFile: null,
			manualUploader: null,
			savedArticleId: null,
			articleId: null,
			article: {
				imageUrl: null,
			},
			showDeleteButton: false,
		};

		this.initManualUploader = this.initManualUploader.bind(this);
		this.uploadImageAndNavigate = this.uploadImageAndNavigate.bind(this);
		this.addFile = this.addFile.bind(this);
		this.handleMouseEnter = this.handleMouseEnter.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.deleteImage = this.deleteImage.bind(this);
		this.addSelectedFile = this.addSelectedFile.bind(this);
		if (this.props.nextArticleNumber) {
			this.props.article.number = this.props.nextArticleNumber;
		}

		this.state = {
			article: this.props.article || new Article(),
			inventory: this.props.inventory || new Inventory(),
			currentStockError: "",
			disableOpeningBalance: false,
			noInventory: true, //invoiz.user && invoiz.user.hasPlanPermission(planPermissionsEnum.NO_INVENTORY),   open when we lunch inventory
			canCreateStockMovement: invoiz.user && invoiz.user.hasPermission(userPermissionsEnum.CREATE_STOCK_MOVEMENT),
		};
		this.vatPercentOptions = {
			loadOptions: (input, callback) => {
				callback(null, {
					options: invoiz.user.vatCodes,
					complete: true,
				});
			},
			clearable: false,
			searchable: false,
			backspaceRemoves: false,
			labelKey: "name",
			valueKey: "value",
			handleChange: (option) => this.onArticleFieldChange("vatPercent", option.value),
		};
		// this.purchaseVatPercentOptions = {  // not use purchase vatPercent
		// 	loadOptions: (input, callback) => {
		// 		callback(null, {
		// 			options: invoiz.user.vatCodes,
		// 			complete: true
		// 		});
		// 	},
		// 	clearable: false,
		// 	searchable: false,
		// 	backspaceRemoves: false,
		// 	labelKey: 'name',
		// 	valueKey: 'value',
		// 	handleChange: option =>
		// 		this.onArticleFieldChange('purchaseVatPercent', option.value)
		// };
	}
	setArticleId(id) {
		this.setState({ articleId: id });
	}

	componentDidMount() {
		const { article, inventory } = this.state;
		const articleId = this.setArticleId(articleId); // Initialize article ID
		setTimeout(() => {
			if (
				WebStorageService.getItem(WebStorageKey.TRACK_STOCK_SCROLL) &&
				WebStorageService.getItem(WebStorageKey.TRACK_STOCK_SCROLL).scrollTrack
			) {
				window.scrollTo(0, 1000);
				WebStorageService.removeItem(WebStorageKey.TRACK_STOCK_SCROLL);
			} else {
				window.scrollTo(0, 0);
			}
		}, 0);
		setTimeout(() => {
			const original = JSON.parse(JSON.stringify(this.state.article));
			changeDetection.bindEventListeners();
			changeDetection.setModelGetter(() => {
				const current = JSON.parse(JSON.stringify(this.state.article));

				return {
					original,
					current,
				};
			});
		}, 0);

	

		if (inventory.currentStock !== null && inventory.openingBalance !== null) {
			this.setState({ disableOpeningBalance: true });
		}

		if (!inventory.id) {
			this.setState({
				inventory: {
					...this.state.inventory,
					action: InventoryAction.INCOMING,
					source: InventorySource.MANUAL,
				},
			});
		}
	}

	componentWillUnmount() {
		changeDetection.unbindEventListeners();
	}
	
	addFile(files) {
		console.log("Files:", files);
		console.log("this.manualUploader:", this.manualUploader);
		if (!files) {
			return;
		}

		_.each(files, (file) => {
			console.log("Adding file:", file);
			// this.manualUploader.addFiles([file]);
		});
	}

	// addSelectedFile(event) {
	// 	const file = event.target.files[0];
	// 	this.addFile([file]);
	// 	this.setState({
	// 		selectedImageFile: file,
	// 	});

	// 	event.target.value = "";
	// }
	addSelectedFile(event) {
		console.log("addSelectedFile called");
		const file = event.target.files[0];
		this.addFile([file]);
		this.setState({
			selectedImageFile: file,
			imageUrl: URL.createObjectURL(file),
		});

		// this.uploadImageAndNavigate(this.state.article, this.state.article.id);

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
	initManualUploader(articleId) {
		console.log("Initializing manualUploader...");
		const { resources } = this.props;
		const { selectedImageFile } = this.state;
		console.log("Adding selected image file to manualUploader:", selectedImageFile);
		if (!selectedImageFile) {
			return; 
		}

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
					customHeaders: {
						authorization: `Bearer ${invoiz.user.token}`, // Use 'Authorization' instead of 'authorization'
					},
					endpoint: `${config.article.endpoints.articleImageUrl}/${articleId}`,
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
						if (response.data.imageUrl) {
							const updatedArticle = {
								...this.state.article,
								imageUrl: response.data.imageUrl,
							};
							this.setState({ article: updatedArticle });
						}
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
		// this.manualUploader.addFiles([selectedImageFile]);
	}

	navigateToArticlePage(articleId) {
		invoiz.router.navigate(`article/${articleId}`);
	}
	handleMouseEnter() {
		console.log("Mouse entered");
		this.setState({ showDeleteButton: true });
	}

	handleMouseLeave() {
		console.log("Mouse left");
		this.setState({ showDeleteButton: false });
	}
	
	deleteImage() {
		this.setState((prevState) => ({
			article: {
				...prevState.article,
				imageUrl: null,
			},
		}));
	}

	render() {
		const { imageUrl, selectedImageFile } = this.state;
		const {
			showDeleteButton,
		} = this.state;
		const { units, categories, resources } = this.props;
		const { article, inventory, currentStockError, canCreateStockMovement, noInventory } = this.state;
		const unitOptions = units.map((unit) => {
			return { name: unit };
		});

		const categoryOptions = categories.map((category) => {
			return { name: category };
		});
		// const imageUrl = !article.imageUrl
		// 	? null
		// 	: article.imageUrl.includes("type=external")
		// 	? article.imageUrl
		// 	: `${config.imageResourceHost}${article.imageUrl}`;

		const topbar = (
			<TopbarComponent
				title={article.id ? resources.articleEditArticleHeading : resources.articleCreateArticleHeading}
				hasCancelButton={true}
				cancelButtonCallback={() => this.onCancel()}
				buttonCallback={(evt, button) => this.onTopbarButtonClick(button.action)}
				buttons={[
					{
						type: "primary",
						label: resources.str_toSave,
						buttonIcon: "icon-check",
						action: "save",
						dataQsId: "article-topbar-button-save",
						disabled: currentStockError,
					},
				]}
			/>
		);

		return (
			<div className="article-edit-component-wrapper">
				{topbar}

				<div className={`wrapper-has-topbar-with-margin`}>
					{/*  box wrapper-has-topbar-with-margin*/}
					<div className="row">
						<div className="col-xs-7 ">
							<div className="row box-wrapper u_pt_20 u_mb_16 u_p_20">
								{/*  u_pb_40 u_pt_60 */}
								<div className="col-xs-12 text-h4 u_pb_20">{resources.str_designation}</div>
								<div className="col-xs-12">
									<div className="row">
										<div className="article-edit-article-number col-xs-6">
											<TextInputExtendedComponent
												name="articleNumber"
												required={true}
												dataQsId="article-edit-articleNumber"
												value={article.number}
												label={resources.str_articleNumber}
												onChange={(value) => this.onArticleFieldChange("number", value)}
											/>
										</div>
										{/* <div className="row"> */}
										<div className="col-xs-6">
											<TextInputExtendedComponent
												name="hsnSacCode"
												ref="article-edit-text-input-hsnSacCode"
												dataQsId="article-edit-hsnSacCode"
												value={article.hsnSacCode}
												label={resources.str_hsnSacCode}
												onChange={(value) => this.onArticleFieldChange("hsnSacCode", value)}
											/>
										</div>
										{/* </div> */}
									</div>

									<div className="row">
										<div className="col-xs-12 u_pb_20">
											{/* <label>{resources.str_designation}</label> */}
											{/* <SelectInputComponent
											name="title"
											label={'Title'}
											options={this.getArticleOptions()}
											onBlur={evt => this.handleOnTitleBlur(evt)}
											value={ article.title }
											allowCreate={true}
											ref="article-edit-text-input-title"		
										/> */}

											{/* <TextInputExtendedComponent
										name="title"
										ref="article-edit-text-input-title"
										required={true}
										dataQsId="article-edit-title"
										value={article.title}
										label={resources.str_designation}
										onChange={value => this.onArticleFieldChange('title', value)}
									/> */}
											<ArticleSearchSelectComponent
												handleAddOption={this.handleSelectAddOption.bind(this)}
												handleChange={this.handleSelectChange.bind(this)}
												resources={resources}
												article={article}
											/>
										</div>
									</div>

									<div className="row">
										<div className="col-xs-6 u_pt_10">
											<HtmlInputComponent
												ref={"article-edit-description-ref"}
												dataQsId={"article-edit-description"}
												placeholder={resources.str_description}
												value={article.description}
												onTextChange={(value) =>
													this.onArticleFieldChange("description", value)
												}
											/>
										</div>
										<div className="col-xs-6">
											<div
												className="article-image"
												style={{
													height: "61px",
													display: "flex",
													flexDirection: "column",
													justifyContent: "center",
													alignItems: "center",
													border: "1px solid #C6C6C6",
													padding: "20px",
													marginTop: "15px",
													width: "140px",
													position: "relative",
													overflow: "hidden",
												}}
												onMouseEnter={this.handleMouseEnter}
												onMouseLeave={this.handleMouseLeave}
											>
												{imageUrl ? (
													<div style={{ position: "relative" }}>
														<img
															alt="Uploaded Image"
															src={imageUrl}
															style={{
																width: "100%",
																height: "100%",
																objectFit: "cover", // Cover the entire container
															}}
														/>
														{showDeleteButton && (
															<button
																style={{
																	position: "absolute",
																	top: "50%",
																	left: "50%",
																	transform: "translate(-50%, -50%)",
																	color: "#FFFFFFF",
																	backgroundColor: "#00A353",
																	border: "none",
																	padding: "5px 10px",
																	borderRadius: "5px",
																	cursor: "pointer",
																}}
																onClick={this.deleteImage}
															>
																Delete
															</button>
														)}
													</div>
												) : (
													<label className="text-muted">
														<p style={{ margin: "0" }}>
															<span
																style={{
																	color: "#00A353",
																	padding: "8px 42px",
																	borderRadius: "5px",
																	display: "inline-flex",
																	alignItems: "center",
																	cursor: "pointer",
																	gap: "6px",
																}}
															>
																<SVGInline
																	width="14px"
																	height="14px"
																	svg={UploadIcon}
																/>
																{`Upload`}
															</span>
															<span style={{ marginLeft: "40px" }}>Drop a file</span>
														</p>
														<input
															className="u_hidden"
															type="file"
															onChange={this.addSelectedFile.bind(this)}
														/>
													</label>
												)}
											</div>
										</div>
									</div>

								
									<div className="row">
										<div className="col-xs-12">
											<TextInputExtendedComponent
												name="eanNo"
												ref="article-edit-text-input-ean"
												dataQsId="article-edit-ean"
												value={article.eanNo}
												label={`EAN`}
												onChange={(value) => this.onArticleFieldChange("eanNo", value)}
											/>
										</div>
									</div>
									<div className="col-xs-12">
										<div className="row">
											<div className="col-xs-12">
												<div className="article-edit-unit">
													<label>{resources.str_unit}</label>
													<SelectInputComponent
														name="unit"
														notAsync={true}
														options={{
															clearable: false,
															searchable: false,
															labelKey: "name",
															valueKey: "name",
															handleChange: (option) =>
																this.onArticleFieldChange("unit", option.name),
														}}
														value={article.unit || "Stk."}
														loadedOptions={unitOptions}
														dataQsId="article-edit-unit"
													/>
												</div>
											</div>
										</div>

										<div className="row">
											<div className="col-xs-12">
												<div className="article-edit-category">
													<label>{resources.str_articleCategory}</label>
													<SelectInputComponent
														name="category"
														notAsync={true}
														options={{
															clearable: false,
															searchable: false,
															labelKey: "name",
															valueKey: "name",
															handleChange: (option) =>
																this.onArticleFieldChange("category", option.name),
														}}
														value={article.category || resources.str_notAvailable}
														loadedOptions={categoryOptions}
														dataQsId="article-edit-category"
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="row box-wrapper u_pt_20 u_mb_16 u_p_20 ">
								<div className="col-xs-12 text-h4 u_pb_20">{resources.str_price}</div>
								<div className="col-xs-12">
									<div className="row">
										<div className="col-xs-12">
											<div className="article-edit-vatpercent">
												<label>{resources.articleVATRateLabel}</label>
												<SelectInputComponent
													name="vatPercent"
													options={this.vatPercentOptions}
													value={article.vatPercent}
													dataQsId="article-edit-vatPercent"
												/>
											</div>
											{invoiz.user.isSmallBusiness ? (
												<small className="article-edit-vatpercent-hint">
													{resources.articleVatSmallBusinessHint}
												</small>
											) : null}
										</div>
									</div>
									{/* <div className="row">
								<div className="col-xs-12">
									<div className="article-edit-vatpercent">
										<label>{resources.str_purchaseVatRate}</label>
										<SelectInputComponent
											name="purchaseVatPercent"
											options={this.purchaseVatPercentOptions}
											value={article.purchaseVatPercent}
											dataQsId="article-edit-purchaseVatPercent"											
										/>
									</div>
									{invoiz.user.isSmallBusiness ? (
										<small className="article-edit-purchaseVatPercent-hint">
											{resources.articleVatSmallBusinessHint}
										</small>
									) : null}
								</div>
							</div> */}

									{invoiz.user.isSmallBusiness ? (
										<div className="row">
											<div className="col-xs-12">
												<div className="article-edit-purchasePrice">
													<CurrencyInputComponent
														name="price"
														dataQsId="article-edit-purchasePrice"
														value={article.purchasePrice}
														selectOnFocus={true}
														onBlur={(value) => this.onPriceChange("purchasePrice", value)}
														label={resources.str_purchasePrice}
														hasBorder={true}
														leftLabel={true}
														willReceiveNewValueProps={true}
													/>
												</div>
											</div>
										</div>
									) : (
										<div className="article-edit-price-net-gross">
											<div className="row">
												<div className="col-xs-12">
													<div className="article-edit-purchasePricenet">
														<CurrencyInputComponent
															name="priceNet"
															dataQsId="article-edit-purchasePriceNet"
															value={article.purchasePrice}
															selectOnFocus={true}
															onBlur={(value) =>
																this.onPriceChange("purchasePrice", value)
															}
															label={resources.str_purchasePriceNet}
															hasBorder={true}
															leftLabel={true}
															willReceiveNewValueProps={true}
														/>
													</div>
												</div>
											</div>
											<div className="row">
												<div className="col-xs-12">
													<div className="article-edit-purchasePricegross">
														<CurrencyInputComponent
															name="purchasePriceGross"
															dataQsId="article-edit-purchasePriceGross"
															value={article.purchasePriceGross}
															selectOnFocus={true}
															onBlur={(value) =>
																this.onPriceChange("purchasePriceGross", value)
															}
															label={resources.str_purchasePriceGross}
															hasBorder={true}
															leftLabel={true}
															willReceiveNewValueProps={true}
														/>
													</div>
												</div>
											</div>
										</div>
									)}

									{invoiz.user.isSmallBusiness ? (
										<div className="row">
											<div className="col-xs-12">
												<div className="article-edit-price">
													<CurrencyInputComponent
														name="price"
														dataQsId="article-edit-price"
														value={article.price}
														selectOnFocus={true}
														onBlur={(value) => this.onPriceChange("price", value)}
														label={resources.str_sellingPrice}
														hasBorder={true}
														leftLabel={true}
														willReceiveNewValueProps={true}
													/>
												</div>
											</div>
										</div>
									) : (
										<div className="article-edit-price-net-gross">
											<div className="row">
												<div className="col-xs-12">
													<div className="article-edit-pricenet">
														<CurrencyInputComponent
															name="priceNet"
															dataQsId="article-edit-priceNet"
															value={article.price}
															selectOnFocus={true}
															onBlur={(value) => this.onPriceChange("price", value)}
															label={resources.str_salesPriceNet}
															hasBorder={true}
															leftLabel={true}
															willReceiveNewValueProps={true}
														/>
													</div>
												</div>
											</div>
											<div className="row">
												<div className="col-xs-12">
													<div className="article-edit-pricegross">
														<CurrencyInputComponent
															name="priceGross"
															dataQsId="article-edit-priceGross"
															value={article.priceGross}
															selectOnFocus={true}
															onBlur={(value) => this.onPriceChange("priceGross", value)}
															label={resources.str_salesPriceGross}
															hasBorder={true}
															leftLabel={true}
															willReceiveNewValueProps={true}
														/>
													</div>
												</div>
											</div>
										</div>
									)}

									<div className="row">
										<div className="col-xs-12" />
									</div>

									<div className="row">
										<div className="col-xs-12">
											<div className="article-edit-mrp">
												<CurrencyInputComponent
													name="mrp"
													dataQsId="article-edit-mrp"
													value={article.mrp}
													selectOnFocus={true}
													onBlur={(value) => this.onMrpChange("mrp", value)}
													label={`MRP`}
													hasBorder={true}
													leftLabel={true}
													willReceiveNewValueProps={true}
												/>
											</div>
										</div>
									</div>
								</div>
							</div>
							{!noInventory && (
								<div className="row u_pt_20">
									<div className="col-xs-12 text-h4 u_pb_20">{resources.articleInventory}</div>
									<div className="col-xs-12">
										<div className="article-edit-track-inventory">
											<label className="notes-alert-label">
												{resources.trackArticleInventory}
											</label>
											<TabInputComponent
												componentClass={"article-edit-notes-alert-toggle"}
												items={[
													{ label: resources.str_yes, value: "1" },
													{ label: resources.str_no, value: "0" },
												]}
												value={article.trackedInInventory ? "1" : "0"}
												onChange={(val) => this.onArticleFieldChange("trackedInInventory", val)}
												dataQsId="article-edit-trackInventory"
											/>
											{article.trackedInInventory === "1" ||
											article.trackedInInventory === true ? (
												<div className="article-inventory-inputs">
													<NumberInputComponent
														label={`${resources.articleOpeningBalance} (in ${article.unit})`}
														value={parseFloat(inventory.openingBalance)}
														name="openingBalance"
														isDecimal={false}
														onChange={(value) =>
															this.onInventoryFieldChange("openingBalance", value)
														}
														//	onBlur={value => this.onInventoryFieldBlur(value)}
														defaultNonZero={false}
														errorMessage={currentStockError}
														disabled={this.state.disableOpeningBalance}
													/>
													<NumberInputComponent
														label={`${resources.articleMinimumBalance} (in ${article.unit})`}
														value={parseFloat(inventory.minimumBalance)}
														name="minimumBalance"
														isDecimal={false}
														onChange={(value) =>
															this.onInventoryFieldChange("minimumBalance", value)
														}
														defaultNonZero={false}
														//disabled={!canChangeAccountData}
													/>
													<div className="article-edit-inventory-alert">
														<label className="inventory-alert-label">
															{`Remind me when article stock is below ${inventory.minimumBalance} ${article.unit}`}
														</label>
														<TabInputComponent
															componentClass={"article-edit-alert-inventory-toggle"}
															items={[
																{ label: resources.str_yes, value: "1" },
																{ label: resources.str_no, value: "0" },
															]}
															value={inventory.lowStockAlert ? "1" : "0"}
															onChange={(val) =>
																this.onInventoryFieldChange("lowStockAlert", val)
															}
															dataQsId="inventory-edit-lowStockAlert"
															disabled={inventory.minimumBalance <= 0}
														/>
													</div>
												</div>
											) : null}
										</div>
									</div>
								</div>
							)}
						</div>
						<div className="col-xs-5 ">
							<div className="row box-wrapper u_pt_20 u_ml_10 u_p_20">
								<div className="col-xs-12 text-h4 u_pb_20">{resources.str_remarks}</div>
								<div className="col-xs-12">
									<HtmlInputComponent
										ref={"article-edit-notes-ref"}
										dataQsId={"article-edit-notes"}
										placeholder={resources.articleLeaveCommentsPlaceholder}
										value={article.notes}
										onTextChange={(value) => this.onArticleFieldChange("notes", value)}
									/>

									<div className="article-edit-notes-alert">
										<label className="notes-alert-label">
											{resources.str_showNoteConfirmation}
										</label>
										<TabInputComponent
											componentClass={"article-edit-notes-alert-toggle"}
											items={[
												{ label: resources.str_yes, value: "1" },
												{ label: resources.str_no, value: "0" },
											]}
											value={article.notesAlert ? "1" : "0"}
											onChange={(val) => this.onArticleFieldChange("notesAlert", val)}
											dataQsId="article-edit-notesAlert"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	onArticleFieldChange(key, value) {
		const { article } = this.state;
		article[key] = value;
		this.setState({ article }, () => {
			if (key === "vatPercent" || key === "purchaseVatPercent") {
				this.calculatePrices();
			}
		});
	}

	handleSelectAddOption(option) {
		const { article } = this.state;
		let newData = {
			title: option.value,
			isValidated: false,
		};
		this.setState({
			article: Object.assign({}, article, newData),
		});
	}

	handleSelectChange(option) {
		const { article } = this.state;
		if (option) {
			if (option.eanData) {
				const { eanData } = option;
				let newData = {
					title: eanData.name,
					isValidated: true,
					description: `<p>${eanData.productDescription}</p>`,
					eanNo: eanData.barCode,
					mrp: eanData.mrp,
					category: eanData.category,
					vatPercent: eanData.gst,
					priceGross: eanData.mrp,
					externalImageUrl: eanData.imageUrl || "",
					price: eanData.mrp / (1 + eanData.gst / 100),
				};
				this.setState({
					article: Object.assign({}, article, newData),
				});
			} else {
				let newData = {
					title: option.value,
					isValidated: false,
				};
				this.setState({
					article: Object.assign({}, article, newData),
				});
			}
		} else {
			let newData = {
				title: "",
				isValidated: false,
				eanNo: "",
				priceGross: 0,
				price: 0,
				description: "",
				mrp: 0,
				category: "",
				externalImageUrl: "",
			};
			this.setState({
				article: Object.assign({}, article, newData),
			});
		}
	}

	onInventoryFieldChange(key, value) {
		const { inventory, currentStockError } = this.state;

		inventory[key] = value;
		this.setState({ inventory });
	}

	onMrpChange(key, value) {
		const { article } = this.state;
		value = value.toString().replace(/-/gi, "");
		// value = accounting.unformat(value, ',');
		value = accounting.unformat(value, config.currencyFormat.decimal);

		article[key] = value;
		if (!article["priceGross"] || article["priceGross"] > value) article["priceGross"] = value;
		this.setState({ article }, () => {
			article.price = article.priceGross / (1 + article.vatPercent / 100);

			article.purchasePrice = new Decimal(article.purchasePrice).toDP(2).toNumber();
			article.purchasePriceGross = new Decimal(article.purchasePriceGross).toDP(2).toNumber();
			article.price = new Decimal(article.price).toDP(2).toNumber();
			article.priceGross = new Decimal(article.priceGross).toDP(2).toNumber();
			article.mrp = new Decimal(article.mrp).toDP(2).toNumber();

			this.setState({ article });
		});
	}

	onPriceChange(key, value) {
		const { article } = this.state;
		const { resources } = this.props;
		value = value.toString().replace(/-/gi, "");
		// value = accounting.unformat(value, ',');
		value = accounting.unformat(value, config.currencyFormat.decimal);

		if (key === "priceGross" && article.mrp && value > article.mrp) {
			invoiz.showNotification({ message: resources.str_mrpAndPriceGrossErrorMessage, type: "error" });
			value = article.mrp;
		}

		article[key] = value;
		this.setState({ article }, () => {
			this.calculatePrices(key === "priceGross" || key === "purchasePriceGross" || key === "mrp");
		});
	}

	calculatePrices(baseOnGross) {
		const { article } = this.state;
		if (!baseOnGross) {
			article.purchasePriceGross = article.purchasePrice * (1 + article.vatPercent / 100);
			if (article.priceGross) article.price = article.priceGross / (1 + article.vatPercent / 100);
			else article.priceGross = article.price * (1 + article.vatPercent / 100);
		} else {
			article.purchasePrice = article.purchasePriceGross / (1 + article.vatPercent / 100);
			article.price = article.priceGross / (1 + article.vatPercent / 100);
		}
		article.purchasePrice = new Decimal(article.purchasePrice).toDP(2).toNumber();
		article.purchasePriceGross = new Decimal(article.purchasePriceGross).toDP(2).toNumber();
		article.price = new Decimal(article.price).toDP(2).toNumber();
		article.priceGross = new Decimal(article.priceGross).toDP(2).toNumber();
		if (!article.mrp) article.mrp = new Decimal(article.priceGross).toDP(2).toNumber();

		this.setState({ article });
	}

	onTopbarButtonClick(action) {
		switch (action) {
			case "save":
				this.onSave();
				break;
		}
	}
	uploadImageAndNavigate(article, articleId, selectedImageFile) {
		console.log("Calling uploadImageAndNavigate...");
		this.initManualUploader(articleId);
		this.manualUploader.addFiles([this.state.selectedImageFile]);
		// console.log("this.manualUploader after init:", this.manualUploader);
	}

	onCancel() {
		window.history.back();
	}
	onSave() {
		console.log("Entering onSave");
		let { article, inventory, currentStockError } = this.state;

		if (!article.title) {
			this.refs["article-edit-text-input-title"] &&
				this.refs["article-edit-text-input-title"].validateAndSetValue();
			return;
		}
		// article.imageUrl = this.state.article.imageUrl;

		article.notesAlert = article.notesAlert === "0" ? false : !!article.notesAlert;
		article.trackedInInventory = article.trackedInInventory === "0" ? false : !!article.trackedInInventory;

		inventory.lowStockAlert = inventory.lowStockAlert === "0" ? false : !!inventory.lowStockAlert;

		const articleUrl = `${config.resourceHost}article${article.id ? `/${article.id}` : ""}`;
		//const inventoryUrl = `${config.resourceHost}inventory${article.trackedInInventory && inventory.id ? `/${inventory.id}` : ''}`;
		const inventoryUrl = `${config.resourceHost}inventory${
			article.trackedInInventory && inventory.id ? `/inventorybalancealert/${inventory.id}` : ""
		}`;

		const method = article.id ? "PUT" : "POST";
		const inventoryMethod = article.trackedInInventory && inventory.id ? "PUT" : "POST";

		if (article.trackedInInventory) {
			console.log("Entering trackedInInventory block");

			if (!currentStockError) {
				inventory["unit"] = article["unit"];
				inventory["title"] = article["title"];
				inventory["price"] = article["price"];
				inventory["number"] = article["number"];
				inventory["priceGross"] = article["priceGross"];
				inventory["price"] = article["price"];
				inventory["purchasePrice"] = article["purchasePrice"];
				inventory["purchasePriceGross"] = article["purchasePriceGross"];
				inventory["category"] = article["category"];
				if (
					inventory["quantity"] === 0 ||
					inventory["value"] === 0 ||
					inventory["currentStock"] === 0 ||
					inventory["currentStock"] === null
				) {
					inventory["currentStock"] = inventory["openingBalance"];
					inventory["quantity"] = inventory["openingBalance"];
				}
				inventory["source"] = ``;
				inventory["action"] = InventoryAction.INCOMING;
				inventory["value"] = parseFloat(inventory["quantity"]) * parseFloat(article["purchasePrice"]);
				inventory["vatPercent"] = article["vatPercent"];
				inventory["itemModifiedDate"] = inventory["updatedAt"];
				invoiz
					.request(articleUrl, {
						auth: true,
						method,
						data: article,
					})
					.then((response) => {
						console.log("Article request successful", response);
						if (!article.id) {
							amplitude.getInstance().logEvent("created_article");
						}
						inventory["articleId"] = response.body.data.id;
						this.setState({ inventory }, () => {
							invoiz
								.request(inventoryUrl, {
									auth: true,
									method: inventoryMethod,
									data: inventory,
								})
								.then((response) => {
									invoiz.router.navigate(`article/${inventory["articleId"]}`);
								});
						});
					})
					.catch((error) => {
						const errors = (error && error.meta) || (error && error.body && error.body.meta);
						handleTransactionFormErrors(null, errors, "Inventory");
					});
			}
		} else {
			console.log("Entering else block");
			invoiz
				.request(articleUrl, {
					auth: true,
					method,
					data: article,
				})
				.then((response) => {
					const {
						body: {
							data: { id },
						},
					} = response;
					// this.initManualUploader(id);
					const selectedImageFile = this.state.selectedImageFile;

					if (selectedImageFile) {
						console.log("Calling uploadImageAndNavigate...");
						this.uploadImageAndNavigate(article, id, selectedImageFile);
					} else {
						if (!article.id) {
							amplitude.getInstance().logEvent("created_article");
						}
						if (inventory.id) {
							invoiz.request(`${config.resourceHost}inventory/${inventory.id}`, {
								auth: true,
								method: "DELETE",
							});
						}
						invoiz.router.navigate(`article/${id}`);
					}
				})
				.catch((error) => {
					const errors = (error && error.meta) || (error && error.body && error.body.meta);
					handleTransactionFormErrors(null, errors, "Article");
				});
		}
	}
}

export default ArticleEditComponent;
