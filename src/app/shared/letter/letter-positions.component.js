import invoiz from "services/invoiz.service";
import React from "react";
import PropTypes from "prop-types";
import dragula from "react-dragula";
import accounting from "accounting";
import Decimal from "decimal.js";
import debounce from "es6-promise-debounce";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import NumberInputComponent from "shared/inputs/number-input/number-input.component";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import CurrencyInputComponent from "shared/inputs/currency-input/currency-input.component";
import PercentageInputComponent from "shared/inputs/percentage-input/percentage-input.component";
import config from "config";
import { formatCurrency, formatMoneySymbol } from "helpers/formatCurrency";
import HtmlInputComponent from "shared/inputs/html-input/html-input.component";
import PopoverComponent from "shared/popover/popover.component";
import { generateUuid } from "helpers/generateUuid";
import { format } from "util";
import ModalService from "services/modal.service";
import { contactTypes } from "helpers/constants";
import CheckboxInputComponent from "shared/inputs/checkbox-input/checkbox-input.component";
import WebStorageService from "services/webstorage.service";
import WebStorageKey from "enums/web-storage-key.enum";
import ButtonComponent from "shared/button/button.component";
import plusSvgGreen from "../../../assets/images/icons/plusSvgGreen.svg";
import SVGInline from "react-svg-inline";
class LetterPositionsComponent extends React.Component {
	constructor(props) {
		super(props);

		const { positions } = props;
		positions.forEach((pos) => {
			pos.tempId = generateUuid();
		});
		this.state = {
			addingArticle: false,
			miscOptions: props.miscOptions,
			showPopoverPosition: null,
			popoverElementId: null,
			showInventoryPopover: null,
			popoverInventoryElementId: null,
			isInvoice: props.isInvoice,
			createNewTrackArticle: false,
			addOpeningAndMinimum: false,
			showDiscountPopoverPosition: null,
			popoverDiscountElementId: null,
			customerData: props.customerData,
			transaction: props.transaction,
		};

		this.amountRefs = [];
		this.fetchedArticles = [];
		this.addPositionSelect = null;
		this.articlesFetchedInitially = false;
	}

	componentDidMount() {
		const { positions, articlePurchaseOrder } = this.props;

		if (articlePurchaseOrder !== null && articlePurchaseOrder !== undefined) {
			this.setState({ addingArticle: false }, () => {
				let articlePoPosition = {
					tempId: generateUuid(),
					amount: 1,
					description: articlePurchaseOrder.description,
					discountPercent: 0,
					metaData: {
						type: "article",
						id: articlePurchaseOrder.id,
						number: articlePurchaseOrder.number,
						purchasePrice: articlePurchaseOrder.purchasePrice,
						calculationBase: articlePurchaseOrder.calculationBase,
					},
					priceNet: articlePurchaseOrder.purchasePrice,
					number: articlePurchaseOrder.number,
					priceGross: articlePurchaseOrder.purchasePriceGross,
					showDescription: true,
					title: articlePurchaseOrder.title,
					unit: articlePurchaseOrder.unit,
					vatPercent: articlePurchaseOrder.vatPercent,
					totalNetAfterDiscount: 0,
					totalGrossAfterDiscount: 0,
					hsnSacCode: articlePurchaseOrder.hsnSacCode,
					trackedInInventory: articlePurchaseOrder.trackedInInventory,
				};
				articlePoPosition = this.calculate(articlePoPosition, false);
				positions.push(articlePoPosition);
				this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
				WebStorageService.removeItem(WebStorageKey.ARTICLE_PO_ENTRY);
			});
		}
		setTimeout(() => {
			this.drake = dragula([document.querySelector(".letter-positions-items")], {
				moves: function (el, container, handle) {
					return (
						handle.className &&
						handle.className.indexOf &&
						handle.className.indexOf("letter-positions-item-draggable") >= 0
					);
				},
			});
			this.drake.on("drop", this.onDragAndDrop.bind(this));
		});
	}

	componentWillReceiveProps(newProps) {
		this.setState({ customerData: newProps.customerData, transaction: newProps.transaction });
	}

	render() {
		const { isDeposit, columns, positions, priceKind, resources } = this.props;
		const {
			showPopoverPosition,
			popoverElementId,
			showInventoryPopover,
			showDiscountPopoverPosition,
			popoverInventoryElementId,
			isInvoice,
			transaction,
			customerData,
		} = this.state;
		if (!columns) {
			return null;
		}
		const vatOptions = invoiz.user.vatCodes;
		const popoverHtml = !showPopoverPosition ? null : (
			<div className="vat-popover-content">
				<div className="vat-headline">{resources.str_articleVat}</div>
				<div className="vat-list">
					{vatOptions.map((vatObj) => {
						return (
							<div
								className={`${showPopoverPosition.vatPercent === vatObj.value ? "active" : ""}`}
								key={`letter-position-list-total-vat-${vatObj.value}`}
								onClick={() => this.onVatChange(showPopoverPosition, { value: vatObj.value })}
							>
								{vatObj.name}
							</div>
						);
					})}
					{/* <div
						onClick={() => this.onVatChange(showPopoverPosition, { value: 19 })}
						className={`${showPopoverPosition.vatPercent === 19 ? 'active' : ''}`}
					>
						19%
					</div>
					<div
						onClick={() => this.onVatChange(showPopoverPosition, { value: 7 })}
						className={`${showPopoverPosition.vatPercent === 7 ? 'active' : ''}`}
					>
						7%
					</div>
					<div
						onClick={() => this.onVatChange(showPopoverPosition, { value: 0 })}
						className={`${showPopoverPosition.vatPercent === 0 ? 'active' : ''}`}
					>
						0%
					</div> */}
				</div>
				<div className="vat-type">
					<div
						onClick={() => this.onPriceKindChange("gross")}
						className={`${priceKind === "net" ? "" : "active"}`}
					>
						{resources.str_gross}
					</div>
					<div
						onClick={() => this.onPriceKindChange("net")}
						className={`${priceKind === "net" ? "active" : ""}`}
					>
						{resources.str_net}
					</div>
				</div>
			</div>
		);
		const discountPopoverHtml = !showDiscountPopoverPosition ? null : (
			<div className="discount-popover-content">
				{/* <div className="discount-headline">{`Discount`}</div> */}
				<div className="discount-inputs">
					<PercentageInputComponent
						name="discountPercent"
						value={showDiscountPopoverPosition["discountPercent"]}
						selectOnFocus={true}
						label={`Percentage`}
						//onKeyDown={(e, value) => this.onDiscountChange(e, showDiscountPopoverPosition, value, false)}
						onBlur={(value) => this.onDiscountChange(showDiscountPopoverPosition, value, false)}
					/>
					<CurrencyInputComponent
						willReceiveNewValueProps={true}
						name="discountNumber"
						label={`Amount`}
						value={showDiscountPopoverPosition["discountNumber"]}
						//onKeyDown={(e, value) => this.onDiscountChange(e, showDiscountPopoverPosition, value, false)}
						selectOnFocus={true}
						onBlur={(value) => this.onDiscountChange(showDiscountPopoverPosition, value, true)}
						currencyType={`symbol`}
						currencyCode={transaction.baseCurrency}
					/>
				</div>
				{/* <ButtonComponent
						type="primary"
						callback={() => this.hideDiscountPopover()}
						label={`Save`}
						dataQsId="discount-popup-close"
					/> */}
			</div>
		);

		const popoverInventoryHtml = !showInventoryPopover ? null : (
			<div className="inventory-popover-checkbox-content">
				<CheckboxInputComponent
					name={"trackedInInventory"}
					label={`Track article in inventory?`}
					checked={showInventoryPopover["trackedInInventory"]}
					onChange={() =>
						this.onInventoryTrackArticleChange(showInventoryPopover, !this.state.addOpeningAndMinimum)
					}
				/>
				{showInventoryPopover["trackedInInventory"] ? (
					<div className="inventory-inputs">
						<NumberInputComponent
							//ref={elem => (this.amountRefs[index] = elem)}
							label={`Opening balance`}
							selectOnFocus={true}
							name={"opening-balance"}
							// placeholder={`Enter opening balance`}
							isDecimal={true}
							value={showInventoryPopover["openingBalance"]}
							placeholder={`Enter minimum balance`}
							//onKeyDown={e => this.onKeyDown(e, column.name, index)}
							onBlur={(value, name) => this.onOpeningBalanceChange(showInventoryPopover, value)}
						/>
						<NumberInputComponent
							//ref={elem => (this.amountRefs[index] = elem)}
							selectOnFocus={true}
							label={`Minimum balance`}
							name={"minimum-balance"}
							value={showInventoryPopover["minimumBalance"]}
							isDecimal={true}
							placeholder={`Enter minimum balance`}
							//onKeyDown={e => this.onKeyDown(e, column.name, index)}
							onBlur={(value, name) => this.onMinimumBalanceChange(showInventoryPopover, value)}
						/>
						{/* <NumberInputComponent
						//ref={elem => (this.amountRefs[index] = elem)}
						selectOnFocus={true}
						label={`Avg. purchase price`}
						name={'purchasePrice'}
						value={showInventoryPopover['purchasePrice']}
						isDecimal={true}
						placeholder={`Enter average purchase price`}
						//onKeyDown={e => this.onKeyDown(e, column.name, index)}
						onBlur={(value, name) => this.onPurchasePriceChange(showInventoryPopover, value)}
					/> */}
						<CurrencyInputComponent
							willReceiveNewValueProps={true}
							name="purchasePrice"
							value={showInventoryPopover["purchasePrice"]}
							label={`Avg. purchase price`}
							//onKeyDown={e => this.onKeyDown(e, column.name, index)}
							selectOnFocus={true}
							onBlur={(value, name) => this.onPurchasePriceChange(showInventoryPopover, value)}
							currencyType={`symbol`}
							currencyCode={customerData && customerData.baseCurrency}
						/>
						<span className="opening-disclaimer">
							<span className="opening-note">Note: </span>Entering 0 as opening balance will result in the
							opening balance taken as quantity entered in the document.
						</span>
						<ButtonComponent
							type="primary"
							callback={() => this.hideInventoryPopover()}
							label={`Save`}
							dataQsId="inventory-popup-close"
						/>
					</div>
				) : null}
			</div>
		);

		const activeColumns = columns.filter((col) => col.active);
		const positionItems = positions.map((position, index) => {
			const cols = activeColumns.map((col, i) => {
				const element = this.createPositionColumn(position, col, index);
				return (
					<div
						className={`letter-positions-item-column letter-positions-item-column-${col.name} inline`}
						key={`letter-positions-item-column-${i}`}
					>
						{element}
					</div>
				);
			});

			return (
				<div
					className="letter-positions-item"
					data-id={position.tempId}
					id={`letter-positions-item-${index}`}
					key={`letter-positions-item-${position.tempId}`}
				>
					<div className="letter-positions-item-columns">
						<div className="letter-positions-item-draggable icon icon-grab" />
						{isDeposit ? null : (
							<div className="letter-positions-item-remove">
								<div
									// className="document_info-action button-icon-close"
									className="document_info-action button-icon-trashcan"
									onClick={() => this.onPositionRemove(position)}
								/>
							</div>
						)}
						{cols}
					</div>

					<div className="letter-positions-item-textarea inline">
						<HtmlInputComponent
							ref={`positions-item-${index}-ref`}
							placeholder={resources.str_description}
							value={position.description}
							onBlur={(quill) => this.onTextareaChange(position, quill.value)}
						/>
					</div>
				</div>
			);
		});

		const newArticleSection = isDeposit ? null : this.createNewPositionSection();
		return (
			<div className={`letter-positions-component-wrapper`}>
				{showPopoverPosition && popoverElementId ? (
					<PopoverComponent
						ref={`letter-positions-vat-popover`}
						offsetTop={15}
						fixedWidth={140}
						fixedHeight={85}
						elementId={popoverElementId}
						html={popoverHtml}
						onPopoverHide={() => {
							this.setState({ showPopoverPosition: null, popoverElementId: null });
						}}
					/>
				) : null}

				{showDiscountPopoverPosition && popoverElementId ? (
					<PopoverComponent
						ref={`letter-positions-discount-popover`}
						offsetTop={15}
						fixedHeight={80}
						fixedWidth={240}
						elementId={popoverElementId}
						html={discountPopoverHtml}
						onPopoverHide={() => {
							this.setState({ showDiscountPopoverPosition: null, popoverElementId: null });
						}}
					/>
				) : null}
				{/* open when we launch inventory */}
				{/* {showInventoryPopover && popoverInventoryElementId && isInvoice === true ? (
					<PopoverComponent
						ref={`letter-positions-inventory-popover`}
						offsetTop={14}
						fixedWidth={250}
						//fixedHeight={330}
						elementId={popoverInventoryElementId}
						html={popoverInventoryHtml}
						onPopoverHide={() => {
							this.setState({ showInventoryPopover: null, popoverInventoryElementId: null });
						}}
					/>
				) : null} */}
				<div className="letter-positions-items" ref="letterPositionsItems">
					{positionItems}
				</div>

				<div className="letter-positions-add-position">{newArticleSection}</div>
			</div>
		);
	}

	onOpeningBalanceChange(position, value) {
		const { positions } = this.props;
		positions.forEach((pos) => {
			if (pos.tempId === position.tempId) {
				pos.openingBalance = parseFloat(value);
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	onMinimumBalanceChange(position, value) {
		const { positions } = this.props;
		positions.forEach((pos) => {
			if (pos.tempId === position.tempId) {
				pos.minimumBalance = parseFloat(value);
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	onPurchasePriceChange(position, value) {
		const { positions } = this.props;
		positions.forEach((pos) => {
			if (pos.tempId === position.tempId) {
				pos.purchasePrice = parseFloat(value);
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	getNewPositionOptions() {
		const { resources } = this.props;
		const { customerData, transaction } = this.state;
		const loadOptions = (searchTerm, callback) => {
			if (!this.articlesFetchedInitially) {
				return fetchArticles(searchTerm.trim());
			}

			if (!searchTerm || (searchTerm && searchTerm.trim().length < 3)) {
				return callback(null, { options: [] });
			}

			return fetchArticles(searchTerm.trim());
		};

		const fetchArticles = (searchTerm) => {
			return invoiz
				.request(`${config.resourceHost}find/article/*?search=${searchTerm}`, { auth: true })
				.then(({ body: { data } }) => {
					this.fetchedArticles = data;
					const options = data.map((item) => {
						return {
							label: `${item.number} ${item.title}`,
							displayLabel: item.title,
							value: item.id,
							isExisting: true,
						};
					});
					return { options };
				});
		};

		return {
			placeholder:
				customerData && customerData.countryIso !== "IN"
					? `Select an existing article`
					: resources.str_enterSelectArticle,
			labelKey: "label",
			valueKey: "value",
			matchProp: "label",
			getCustomLabelToHighlight: (option) => {
				return `${option.displayLabel || option.label}`;
			},
			cache: false,
			loadOptions: debounce(loadOptions, 300),
			handleChange: (option) => {
				this.selectedAddArticleOption = option;
				this.setState({ addingArticle: false }, () => {
					if (!this.onPositionBlurring) {
						this.onNewPositionSelectBlur(true);
						this.onPositionBlurring = true;
					}
				});
			},
		};
	}

	onPositionRemove(position) {
		const { positions } = this.props;
		const newPositions = positions.filter((pos) => pos.tempId !== position.tempId);
		this.props.onPositionsChanged && this.props.onPositionsChanged(newPositions);
	}

	// componentWillReceiveProps(newProps) {
	// 	if (newProps.isActiveComponentHasError) {
	// 		// this.onNewPositionSelectBlur();
	// 	}
	// 	// this.handleCloseEditMode();
	// }

	onNewPositionClick() {
		const { positions, discount } = this.props;
		const { customerData } = this.state;
		if (!this.props.isActiveComponentHasError) {
			if (this.props.activeComponentAction !== undefined) {
				this.props.activeComponentAction("positionComponent", undefined);
			}
			positions.push({
				tempId: generateUuid(),
				amount: 1,
				description: "",
				discountPercent: discount || 0,
				metaData: {
					type: "article",
				},
				priceNet: 0,
				priceGross: 0,
				showDescription: true,
				title: "",
				unit: "pcs",
				vatPercent:
					invoiz.user.isSmallBusiness || (customerData && customerData.countryIso !== "IN")
						? 0
						: parseInt(config.defualtVatPercent),
				totalNetAfterDiscount: 0,
				totalGrossAfterDiscount: 0,
				hsnSacCode: null,
				trackedInInventory: null,
				articlePriceNet: 0,
				mrp: 0,
			});

			this.setState({ addingArticle: true }, () => {
				this.addPositionSelect.refs["addPositionSelect"].focus();
			});
		} else {
			return;
		}
	}

	onNewPositionSelectInputChange(input) {
		this.newPositionInput = input.trim();
	}

	onNewPositionSelectBlur() {
		const { customerData, transaction } = this.state;
		if (this.onPositionBlurring) {
			this.onPositionBlurring = false;
			return;
		}
		const { positions, resources, recipientType, isInvoice } = this.props;
		let position = positions[positions.length - 1];
		let articleAdded = false;
		if (this.selectedAddArticleOption || this.newPositionInput) {
			if (this.selectedAddArticleOption) {
				if (this.selectedAddArticleOption.isExisting) {
					const article = this.fetchedArticles.find(
						(article) => article.id === this.selectedAddArticleOption.value
					);
					position.title = article.title;
					position.description = article.description;
					position.number = article.number;
					position.priceNet =
						recipientType === contactTypes.PAYEE
							? transaction.exchangeRate > 0
								? article.purchasePrice / transaction.exchangeRate
								: article.purchasePrice
							: transaction.exchangeRate > 0
							? article.price / transaction.exchangeRate
							: article.price;
					//position.priceNet = recipientType === contactTypes.PAYEE ? article.purchasePrice : article.price;
					position.priceGross =
						recipientType === contactTypes.PAYEE ? article.purchasePriceGross : article.priceGross;
					position.unit = article.unit || "pcs";
					// position.vatPercent = invoiz.user.isSamllBusiness ? 0 : recipientType == contactTypes.PAYEE ? article.purchaseVatPercent : article.vatPercent;
					position.vatPercent =
						invoiz.user.isSamllBusiness || transaction.exchangeRate > 0 ? 0 : article.vatPercent;
					position.metaData = {
						id: article.id,
						type: "article",
						number: article.number,
						purchasePrice: article.purchasePrice,
						calculationBase: article.calculationBase,
						articlePriceNet: recipientType === contactTypes.PAYEE ? article.purchasePrice : article.price,
					};
					position.hsnSacCode = article.hsnSacCode;
					position.trackedInInventory = article.trackedInInventory;
					position.mrp = article.mrp;
					// if (!article.trackedInInventory && isInvoice === true && !this.state.createNewTrackArticle) {
					// 	this.showInventoryPopover(`inventory-popover-${position.tempId}`, position);
					// }

					if (article.notesAlert) {
						ModalService.open(<div dangerouslySetInnerHTML={{ __html: article.notes }} />, {
							headline: resources.str_noteToArticle,
							cancelLabel: resources.str_shutdown,
							confirmLabel: resources.str_ok,
							confirmIcon: "icon-check",
							onConfirm: () => {
								ModalService.close();
							},
						});
					}
				} else {
					position.metaData.type = "custom";
					position.metaData.uniqueidentifier = generateUuid();
					position.title = this.selectedAddArticleOption.label;
					this.setState({ createNewTrackArticle: true }, () => {
						this.showInventoryPopover(`inventory-popover-${position.tempId}`, position);
					});
				}
			} else if (this.newPositionInput) {
				position.metaData.type = "custom";
				position.metaData.uniqueidentifier = generateUuid();
				position.title = this.newPositionInput;
			}
			position = this.calculate(position, false);
			articleAdded = true;
		} else {
			this.state.addingArticle && positions.pop();
		}

		this.selectedAddArticleOption = null;
		this.newPostionInput = null;

		this.setState({ addingArticle: false }, () => {
			if (articleAdded) {
				const ref = this.amountRefs[this.amountRefs.length - 1];
				if (ref && ref.refs && ref.refs["amount"]) {
					ref.refs["amount"].focus();
				}
			}
			this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
		});
	}

	onDragAndDrop(el, target, source, sibling) {
		const { positions } = this.props;
		const currentItems = this.refs["letterPositionsItems"].childNodes;
		const currentOrder = Array.from(currentItems).map((elem) => elem.dataset.id);
		const newPositions = currentOrder.map((id) => positions.find((pos) => pos.tempId === id));
		this.props.onPositionsChanged && this.props.onPositionsChanged(newPositions);
	}

	onTextChange(position, value) {
		const { positions } = this.props;

		positions.forEach((pos) => {
			if (pos.tempId === position.tempId) {
				pos.title = value;
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	onHsnSacCodeChange(position, value) {
		const { positions } = this.props;

		positions.forEach((pos) => {
			if (pos.tempId === position.tempId) {
				pos.hsnSacCode = value;
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	onTextareaChange(position, value) {
		const { positions } = this.props;

		positions.forEach((pos) => {
			if (pos.tempId === position.tempId) {
				pos.description = value;
				if (value === "<p><br></p><p><br></p>" || value === "<p><br></p>") {
					pos.description = value.replace("<p><br></p><p><br></p>", "").replace("<p><br></p>", "");
				}
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	forceBlur() {
		const { positions } = this.props;
		positions.forEach((pos, index) => {
			this.refs[`positions-item-${index}-ref`] && this.refs[`positions-item-${index}-ref`].blur();
		});
	}

	onUnitChange(position, value) {
		const name = !value || !value.name ? "" : value.name;
		const { miscOptions } = this.state;
		const { positions, resources } = this.props;

		if (value && !value.isExisting) {
			miscOptions.articleUnits.push(value.name);
			invoiz
				.request(`${config.resourceHost}setting/article`, {
					auth: true,
					method: "POST",
					data: {
						units: miscOptions.articleUnits,
					},
				})
				.then(() => {
					invoiz.page.showToast({
						message: format(resources.tagAddSuccessMessage, resources.str_itemUnit, value.name),
					});
				});
		}

		positions.forEach((pos) => {
			if (pos.tempId === position.tempId) {
				pos.unit = name;
			}
		});

		this.setState({ miscOptions }, () => {
			this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
		});
	}

	onAmountChange(position, value) {
		const { positions } = this.props;

		positions.forEach((pos) => {
			if (pos.tempId === position.tempId) {
				// pos.amount = accounting.unformat(value, ',');
				pos.amount = accounting.unformat(value);
				pos = this.calculate(pos, false);
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	onPriceChange(position, value) {
		const { positions } = this.props;
		const { priceKind } = this.props;
		positions.forEach((pos) => {
			if (pos.tempId === position.tempId) {
				if (invoiz.user.isSmallBusiness || priceKind === "net") {
					//pos.priceNet = accounting.unformat(value, ',');
					pos.priceNet = accounting.unformat(value);
				} else {
					// pos.priceGross = accounting.unformat(value, ',');
					pos.priceGross = accounting.unformat(value);
					if (pos.mrp === 0 || pos.metaData.type === `custom`) {
						pos.mrp = accounting.unformat(value);
					}
				}
				pos = this.calculate(pos, false);
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	onDiscountKeyDown(e, value) {
		if (e.keyCode === 13 || e.which === 13) {
			setTimeout(() => {
				this.hideDiscountPopover();
			});
		}
	}

	onDiscountChange(position, value, numberCalculate) {
		const { positions, resources } = this.props;
		if (numberCalculate === false && (value > 100 || value < 0))
			return invoiz.showNotification({
				message: resources.transactionDiscountPercentErrorMessage,
				type: "error",
			});

		if (numberCalculate === true && (value > position.totalNet || value < 0))
			return invoiz.showNotification({
				message: `Discount amount must be between 0 and the price of the article!`,
				type: "error",
			});
		positions.forEach((pos) => {
			if (pos.tempId === position.tempId) {
				// pos.discountPercent = accounting.unformat(value, ',');
				//pos.discountPercent = accounting.unformat(value, config.currencyFormat.decimal);
				numberCalculate ? (pos.discountNumber = value) : (pos.discountPercent = accounting.unformat(value));
				pos = this.calculate(pos, numberCalculate);
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	onVatChange(position, value) {
		const { positions } = this.props;
		positions.forEach((pos) => {
			if (pos.tempId === position.tempId) {
				pos.vatPercent = value.value;
				pos = this.calculate(pos, false);
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	onInventoryTrackArticleChange(position, value) {
		const { positions, isInvoice } = this.props;
		this.setState({ addOpeningAndMinimum: !this.state.addOpeningAndMinimum }, () => {
			positions.forEach((pos) => {
				if (pos.tempId === position.tempId) {
					if (value === false) {
						pos.trackedInInventory = false;
						delete pos.currentStock;
						delete pos.minimumBalance;
						delete pos.openingBalance;
						delete pos.purchasePrice;
						delete pos.source;
						delete pos.itemModifiedDate;
						delete pos.value;
						delete pos.action;
						delete pos.lowStockAlert;
					} else {
						pos.trackedInInventory = value;
						pos.currentStock = null;
						pos.minimumBalance = null;
						pos.openingBalance = null;
						pos.purchasePrice = null;
						pos.source = `manual`;
						pos.itemModifiedDate = this.props.documentDate;
						pos.value = pos.purchasePrice * pos.openingBalance;
						pos.action = this.props.isInvoice ? `incoming` : `outgoing`;
						pos.lowStockAlert = true;
					}
				}
			});
			this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
		});
	}

	onPriceKindChange(priceKind) {
		this.props.onPriceKindChange && this.props.onPriceKindChange(priceKind);
	}

	onKeyDown(e, columnName, positionIndex) {
		if (e.keyCode === 9 || e.which === 9) {
			setTimeout(() => {
				this.hideVatPopover();
				this.hideInventoryPopover();
				this.hideDiscountPopover();
			});
		}

		if (!columnName || !positionIndex) {
			return;
		}

		if (e.keyCode === 13 || e.which === 13) {
			e.preventDefault();
			this.hideVatPopover();
			this.hideInventoryPopover();
			//this.hideDiscountPopover();
			let selector = `#letter-positions-item-${positionIndex} .letter-positions-item-column-amount .Select-input input`;
			if (columnName === "total") {
				selector = `#letter-positions-item-${positionIndex} .letter-positions-item-textarea .ql-editor`;
			} else if (columnName !== "amount") {
				const activeColumns = this.props.columns.filter((col) => col.active && col.editable);
				activeColumns.forEach((col, index) => {
					if (col.name === columnName) {
						if (index < activeColumns.length - 1) {
							selector = `#letter-positions-item-${positionIndex} .letter-positions-item-column-${
								activeColumns[index + 1].name
							} input`;
						} else {
							selector = `#letter-positions-item-${positionIndex} .letter-positions-item-textarea .ql-editor`;
						}
					}
				});
			}
			$(selector)[0].focus();
		}
	}

	calculate(position, numberCalculate) {
		const { priceKind } = this.props;
		if (invoiz.user.isSmallBusiness || priceKind === "net") {
			position.priceGross = position.priceNet * (1 + position.vatPercent / 100);
			if (position.mrp === 0 || position.metaData.type === `custom`) {
				position.mrp = position.priceNet * (1 + position.vatPercent / 100);
			}
		} else {
			position.priceNet = position.priceGross / (1 + position.vatPercent / 100);
		}
		position.totalNet = new Decimal(position.priceNet * position.amount).toDP(2).toNumber();
		position.totalGross = new Decimal(position.priceGross * position.amount).toDP(2).toNumber();
		if (!numberCalculate && position.discountPercent > 0) {
			position.totalNetAfterDiscount = new Decimal(position.totalNet)
				.minus((position.totalNet * position.discountPercent) / 100)
				.toDP(2)
				.toNumber();

			position.totalGrossAfterDiscount = new Decimal(position.totalGross)
				.minus((position.totalGross * position.discountPercent) / 100)
				.toDP(2)
				.toNumber();

			// priceKind === "net"
			// 	? (position.discountNumber = position.totalNet - position.totalNetAfterDiscount)
			// 	: (position.discountNumber = position.totalNet - position.totalNetAfterDiscount);
			position.discountNumber = position.totalNet - position.totalNetAfterDiscount;
		} else if (numberCalculate && position.discountNumber >= 0) {
			// position.totalGrossAfterDiscount = position.discountNumber
			// ? new Decimal(position.totalGross).minus(parseInt(position.discountNumber)).toDP(2).toNumber()
			// : 0;
			if (priceKind === "net") {
				position.totalNetAfterDiscount = position.discountNumber
					? new Decimal(position.totalNet).minus(position.discountNumber).toDP(2).toNumber()
					: 0;

				position.discountPercent = new Decimal(
					((position.totalNet - position.totalNetAfterDiscount) / position.totalNet) * 100
				)
					.toDP(2)
					.toNumber();

				position.totalGrossAfterDiscount = new Decimal(position.totalGross)
					.minus((position.totalGross * position.discountPercent) / 100)
					.toDP(2)
					.toNumber();
			} else {
				position.totalNetAfterDiscount = position.discountNumber
					? new Decimal(position.totalNet).minus(position.discountNumber).toDP(2).toNumber()
					: 0;

				position.discountPercent = new Decimal(
					((position.totalNet - position.totalNetAfterDiscount) / position.totalNet) * 100
				)
					.toDP(2)
					.toNumber();

				position.totalGrossAfterDiscount = new Decimal(position.totalGross)
					.minus((position.totalGross * position.discountPercent) / 100)
					.toDP(2)
					.toNumber();
			}
			// priceKind === "net"
			// 	? (position.discountPercent = new Decimal(
			// 			((position.totalNet - position.totalNetAfterDiscount) / position.totalNet) * 100
			// 	  )
			// 			.toDP(2)
			// 			.toNumber())
			// 	: (position.discountPercent = new Decimal(
			// 			((position.totalGross - position.totalGrossAfterDiscount) / position.totalGross) * 100
			// 	  )
			// 			.toDP(2)
			// 			.toNumber());
		} else {
			position.totalNetAfterDiscount = new Decimal(position.totalNet)
				.minus((position.totalNet * position.discountPercent) / 100)
				.toDP(2)
				.toNumber();

			position.totalGrossAfterDiscount = new Decimal(position.totalGross)
				.minus((position.totalGross * position.discountPercent) / 100)
				.toDP(2)
				.toNumber();

			// position.discountPercent = new Decimal(
			// 	((position.totalNet - position.totalNetAfterDiscount) / position.totalNet) * 100
			// )
			// 	.toDP(2)
			// 	.toNumber();
		}

		return position;
	}

	createNewPositionSection() {
		const { addingArticle, transaction, customerData } = this.state;
		const { resources } = this.props;

		return (
			<div>
				<div
					className={`letter-positions-add-position-button outlined ${
						addingArticle ? "add-position-button-invis" : ""
					}`}
					onClick={() => this.onNewPositionClick()}
				>
					<span className="edit-icon" />
					{/* <span className="icon icon-rounded icon-plus" /> */}
					<SVGInline width="17px" height="17px" svg={plusSvgGreen} className="vertically-middle u_mr_6" />
					{customerData && customerData.countryIso !== "IN" ? `Select article` : resources.str_enterArticle}
				</div>

				<div
					className={`letter-positions-add-position-select ${
						!addingArticle ? "add-position-select-invis" : ""
					}`}
				>
					<SelectInputComponent
						ref={(elem) => (this.addPositionSelect = elem)}
						name="addPositionSelect"
						value={null}
						allowCreate={customerData && customerData.countryIso !== "IN" ? false : true}
						options={this.getNewPositionOptions()}
						onBlur={() => this.onNewPositionSelectBlur()}
						onInputChange={(input) => this.onNewPositionSelectInputChange(input)}
					/>
				</div>
			</div>
		);
	}

	createPositionColumn(position, column, index) {
		let element;
		const { resources, isInvoice } = this.props;
		const { transaction } = this.state;
		switch (column.name) {
			case "SNo": {
				const value = index + 1;
				element = (
					<span>
						{Number(value).toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false })}
					</span>
				);
				break;
			}
			case "description": {
				const value = position["title"] || "";
				element = (
					<div
						id={`inventory-popover-${position.tempId}`}
						// onClick={() => {
						// 	this.showInventoryPopover(`inventory-popover-${position.tempId}`, position);
						// }}
					>
						<TextInputExtendedComponent
							name={`title`}
							value={value}
							onKeyDown={(e) => this.onKeyDown(e, column.name, index)}
							onBlur={(target, value) => this.onTextChange(position, value)}
						/>
					</div>
				);
				break;
			}

			case "number": {
				const { metaData } = position;
				element = (metaData && metaData.number) || position.number || <span>&mdash;</span>;
				break;
			}

			case "hsnSacCode": {
				const value = position["hsnSacCode"] || "";
				element = (
					<TextInputExtendedComponent
						name={`hsnSacCode`}
						value={value}
						onKeyDown={(e) => this.onKeyDown(e, column.name, index)}
						onBlur={(target, value) => this.onHsnSacCodeChange(position, value)}
					/>
				);
				break;
			}

			case "amount": {
				const value = position[column.name] || 0;
				const { miscOptions } = this.state;
				const loadedOptions = miscOptions.articleUnits.map((unit) => {
					return { name: unit, isExisting: true };
				});
				loadedOptions.push({
					name: resources.str_addUnit,
					isDummy: true,
				});
				const selectOptions = {
					placeholder: resources.str_choose,
					labelKey: "name",
					valueKey: "name",
					cache: false,
					handleChange: (value) => {
						if (!value || (value && !value.isDummy && value.name)) {
							this.onUnitChange(position, value);
						}
					},
					ignoreAccents: false,
				};

				element = (
					<div>
						<NumberInputComponent
							id={`amount-field-${position.tempId}`}
							ref={(elem) => (this.amountRefs[index] = elem)}
							selectOnFocus={true}
							name={"amount"}
							value={value}
							isDecimal={false}
							onKeyDown={(e) => this.onKeyDown(e, column.name, index)}
							onBlur={(value, name) => this.onAmountChange(position, value, name)}
						/>

						<SelectInputComponent
							onKeyDown={(e) => this.onKeyDown(e)}
							name={"unit"}
							value={{ name: position.unit }}
							allowCreate={true}
							notAsync={true}
							options={selectOptions}
							loadedOptions={loadedOptions}
						/>
					</div>
				);
				break;
			}

			case "vat": {
				const value = position["vatPercent"] || 0;
				const options = invoiz.user.vatCodes.map((vat) => {
					vat.value = parseInt(vat.value);
					return vat;
				});
				const selectOptions = {
					labelKey: "name",
					valueKey: "value",
					placeholder: null,
					cache: false,
					handleChange: (value) => {
						this.onVatChange(position, value);
					},
				};
				element = (
					<SelectInputComponent
						onKeyDown={(e) => this.onKeyDown(e)}
						labelKey="value"
						name={"vatPercent"}
						value={value}
						notAsync={true}
						options={selectOptions}
						loadedOptions={options}
					/>
				);
				break;
			}

			case "price": {
				const { priceKind } = this.props;
				const price =
					invoiz.user.isSmallBusiness || priceKind === "net"
						? parseFloat(position.priceNet)
						: parseFloat(position.priceGross);
				element = (
					<div
						id={`vat-popover-price-${position.tempId}`}
						onClick={() => {
							if (!invoiz.user.isSmallBusiness && this.state.transaction === "") {
								this.showVatPopover(`vat-popover-price-${position.tempId}`, position);
							}
						}}
					>
						{transaction.baseCurrency !== "" && this.state.addingArticle ? (
							formatMoneySymbol(price, transaction.baseCurrency)
						) : (
							<CurrencyInputComponent
								willReceiveNewValueProps={true}
								name="price"
								value={price}
								onKeyDown={(e) => this.onKeyDown(e, column.name, index)}
								selectOnFocus={true}
								onBlur={(value) => this.onPriceChange(position, value)}
								currencyType={`symbol`}
								currencyCode={this.state.transaction.baseCurrency}
							/>
						)}
					</div>
				);
				break;
			}

			case "discount": {
				element = (
					<div
						id={`discount-popover-${position.tempId}`}
						onClick={() => {
							this.showDiscountPopover(`discount-popover-${position.tempId}`, position);
						}}
					>
						{/* <PercentageInputComponent
						name="discountPercent"
						value={position.discountPercent}
						selectOnFocus={true}
						onKeyDown={e => this.onKeyDown(e, column.name, index)}
						onBlur={value => this.onDiscountChange(position, value)}
					/> */}
						<span className="discountDisplay">{position.discountPercent + `%`}</span>
					</div>
				);
				break;
			}

			case "total": {
				const { priceKind } = this.props;
				if (column.editable) {
					element = (
						<div
							id={`vat-popover-total-${position.tempId}`}
							onClick={() => {
								if (!invoiz.user.isSmallBusiness) {
									this.showVatPopover(`vat-popover-total-${position.tempId}`, position);
								}
							}}
						>
							<CurrencyInputComponent
								willReceiveNewValueProps={true}
								name="total"
								onKeyDown={(e) => this.onKeyDown(e, column.name, index)}
								value={
									invoiz.user.isSmallBusiness || priceKind === "net"
										? position.totalNet
										: position.totalGross
								}
								selectOnFocus={true}
								onBlur={(value) => this.onPriceChange(position, value)}
								currencyType={`symbol`}
								currencyCode={this.state.transaction.baseCurrency}
							/>
						</div>
					);
				} else {
					element =
						this.state.transaction.baseCurrency === "" || !this.state.transaction.baseCurrency
							? formatCurrency(
									invoiz.user.isSmallBusiness || priceKind === "net"
										? position.totalNetAfterDiscount
										: position.totalGrossAfterDiscount
							  )
							: formatMoneySymbol(
									priceKind === "net"
										? position.totalNetAfterDiscount
										: position.totalGrossAfterDiscount,
									this.state.transaction.baseCurrency
							  );
				}
				break;
			}
		}

		return element;
	}

	showVatPopover(elementId, position) {
		this.setState({ showPopoverPosition: position, popoverElementId: elementId }, () => {
			setTimeout(() => {
				this.refs["letter-positions-vat-popover"] && this.refs["letter-positions-vat-popover"].show(true, 100);
			});
		});
	}

	showInventoryPopover(elementId, position) {
		this.setState({ showInventoryPopover: position, popoverInventoryElementId: elementId }, () => {
			setTimeout(() => {
				this.refs["letter-positions-inventory-popover"] &&
					this.refs["letter-positions-inventory-popover"].show(true, 100);
			});
		});
	}

	showDiscountPopover(elementId, position) {
		this.calculate(position, false);
		this.setState({ showDiscountPopoverPosition: position, popoverElementId: elementId }, () => {
			setTimeout(() => {
				this.refs["letter-positions-discount-popover"] &&
					this.refs["letter-positions-discount-popover"].show(true, 100);
			});
		});
	}

	hideInventoryPopover() {
		this.setState({ showInventoryPopover: null, popoverInventoryElementId: null, createNewTrackArticle: false });
	}

	hideVatPopover() {
		this.setState({ showPopoverPosition: null, popoverElementId: null });
	}

	hideDiscountPopover() {
		this.setState({ showDiscountPopoverPosition: null, popoverElementId: null });
	}
}

LetterPositionsComponent.propTypes = {
	onPositionsChanged: PropTypes.func,
	onPriceKindChange: PropTypes.func,
};

export default LetterPositionsComponent;
