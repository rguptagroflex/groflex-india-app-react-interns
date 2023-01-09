import invoiz from 'services/invoiz.service';
import React from 'react';
import PropTypes from 'prop-types';
import dragula from 'react-dragula';
import accounting from 'accounting';
import Decimal from 'decimal.js';
import debounce from 'es6-promise-debounce';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import NumberInputComponent from 'shared/inputs/number-input/number-input.component';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import CurrencyInputComponent from 'shared/inputs/currency-input/currency-input.component';
import PercentageInputComponent from 'shared/inputs/percentage-input/percentage-input.component';
import config from 'config';
import { formatCurrency } from 'helpers/formatCurrency';
import HtmlInputComponent from 'shared/inputs/html-input/html-input.component';
import PopoverComponent from 'shared/popover/popover.component';
import { generateUuid } from 'helpers/generateUuid';
import { format } from 'util';
import ModalService from 'services/modal.service';
import { contactTypes } from 'helpers/constants';
import CheckboxInputComponent from 'shared/inputs/checkbox-input/checkbox-input.component';
import { position } from 'tether';
import article from '../../redux/ducks/article/index';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import DateInputComponent from 'shared/inputs/date-input/date-input.component';
import { formatApiDate, formatClientDate } from '../../helpers/formatDate';

class LetterPositionsInventoryManualComponent extends React.Component {
	constructor(props) {
		super(props);

		const { positions } = props;
		positions.forEach(pos => {
			pos.tempId = generateUuid();
		});

		this.state = {
			addingArticle: false,
			miscOptions: props.miscOptions,
			showPopoverPosition: null,
			popoverElementId: null,
			showInventoryPopover: null,
			popoverInventoryElementId: null,
			createNewTrackArticle: false,
			addOpeningAndMinimum: false,
			trackedArticlesInventory: props.trackedArticlesInventory
		};

		this.amountRefs = [];
		this.fetchedArticles = [];
		this.addPositionSelect = null;
		this.articlesFetchedInitially = false;
	}

	componentDidUpdate(prevProps) {
		if (this.props.miscOptions.customers !== prevProps.miscOptions.customers) {
			this.setState({miscOptions: this.props.miscOptions})
		}
	}

	render() {
		const { columns, positions, resources } = this.props;
		const { showPopoverPosition, popoverElementId, showInventoryPopover, popoverInventoryElementId, isInvoice, createNewTrackArticle, addOpeningAndMinimum } = this.state;
		if (!columns) {
			return null;
		}
		//const vatOptions = invoiz.user.vatCodes;
		const popoverHtml = !showPopoverPosition ? null : (
			<div className="vat-popover-content">
				<div className="vat-headline">{resources.str_articleVat}</div>
				<div className="vat-list">
					{vatOptions.map(vatObj => {
						return (
							<div
								className={`${showPopoverPosition.vatPercent === vatObj.value ? 'active' : ''}`}
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
						onClick={() => this.onPriceKindChange('gross')}
						className={`${priceKind === 'net' ? '' : 'active'}`}
					>
						{resources.str_gross}
					</div>
					<div
						onClick={() => this.onPriceKindChange('net')}
						className={`${priceKind === 'net' ? 'active' : ''}`}
					>
						{resources.str_net}
					</div>
				</div>
			</div>
		);

		const popoverInventoryHtml = !showInventoryPopover ? null : ( 
			<div className="inventory-popover-checkbox-content">
			<CheckboxInputComponent
				name={'trackedInInventory'}
				label={`Track article in inventory?`}
				checked={showInventoryPopover['trackedInInventory']}
				onChange={() => this.onInventoryTrackArticleChange(showInventoryPopover, !this.state.addOpeningAndMinimum)}
			/>
			{
				showInventoryPopover['trackedInInventory'] ? 			
				<div className="inventory-inputs">
				<NumberInputComponent
						//ref={elem => (this.amountRefs[index] = elem)}
						label={`Opening balance`}
						selectOnFocus={true}
						name={'opening-balance'}
						placeholder={`Enter opening balance`}
						isDecimal={true}
						value={showInventoryPopover['openingBalance']}
						placeholder={`Enter minimum balance`}
						//onKeyDown={e => this.onKeyDown(e, column.name, index)}
						onBlur={(value, name) => this.onOpeningBalanceChange(showInventoryPopover, value)}
						
					/>
				<NumberInputComponent
						//ref={elem => (this.amountRefs[index] = elem)}
						selectOnFocus={true}
						label={`Minimum balance`}
						name={'minimum-balance'}
						value={showInventoryPopover['minimumBalance']}
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
							//willReceiveNewValueProps={true}
							name="purchasePrice"
							value={showInventoryPopover['purchasePrice']}
							label={`Avg. purchase price`}
							//onKeyDown={e => this.onKeyDown(e, column.name, index)}
							selectOnFocus={true}
							onBlur={(value, name) => this.onPurchasePriceChange(showInventoryPopover, value)}
						/>
					<span className="opening-disclaimer"><span className="opening-note">Note: </span>Entering 0 as opening balance will result in the opening balance taken as quantity entered in the document.</span> 
			</div>: null
			}

		</div>
		);

		const activeColumns = columns.filter(col => col.active);
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
						{/* <div className="letter-positions-item" /> */}
						{(
							<div className="letter-positions-item-remove">
								<button
									className="document_info-action button-icon-close"
									onClick={() => this.onPositionRemove(position)}
								/>
							</div>
						)}
						{cols}
					</div>

					{/* <div className="letter-positions-item-textarea inline">
						<HtmlInputComponent
							ref={`positions-item-${index}-ref`}
							placeholder= {resources.str_description}
							value={position.description}
							onBlur={quill => this.onTextareaChange(position, quill.value)}
						/>
					</div> */}
				</div>
			);
		});

		const newArticleSection = this.createNewPositionSection();

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

				{showInventoryPopover && popoverInventoryElementId && isInvoice === true ? (
					<PopoverComponent
						ref={`letter-positions-inventory-popover`}
						offsetTop={14}
						fixedWidth={150}
						//fixedHeight={330}
						elementId={popoverInventoryElementId}
						html={popoverInventoryHtml}
						onPopoverHide={() => {
							this.setState({ showInventoryPopover: null, popoverInventoryElementId: null });
						}}
					/>
				) : null}
				<div className="letter-positions-items" ref="letterPositionsItems">
					{positionItems}
				</div>

				<div className="letter-positions-add-position">{newArticleSection}</div>
			</div>
		);
	}

	onPurchasePriceChange(position, value) {
		const { positions } = this.props;
		 positions.forEach(pos => {
		 	if (pos.tempId === position.tempId) {
				pos.purchasePrice = parseFloat(value);
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	getNewPositionOptions() {
		const { resources } = this.props;
		const loadOptions = (searchTerm, callback) => {
			if (!this.articlesFetchedInitially) {
				return fetchArticles(searchTerm.trim());
			}

			if (!searchTerm || (searchTerm && searchTerm.trim().length < 3)) {
				return callback(null, { options: [] });
			}

			return fetchArticles(searchTerm.trim());
		};

		const fetchArticles = searchTerm => {
			return invoiz
				.request(`${config.resourceHost}find/article/*?search=${searchTerm}`, { auth: true })
				.then(({ body: { data } }) => {
					this.fetchedArticles = data;
					const options = data.map(item => {
						return {
							label: `${item.title}`,
							displayLabel: item.title,
							value: item.id,
							isExisting: true
						};
					});
					return { options };
				});
		};

		return {
			placeholder: `Select article`,
			labelKey: 'label',
			valueKey: 'value',
			matchProp: 'label',
			// getCustomLabelToHighlight: option => {
			// 	return `${option.displayLabel || option.label}`;
			// },
			cache: false,
			loadOptions: debounce(loadOptions, 300),
			handleChange: option => {
				this.selectedAddArticleOption = option;
				this.setState({ addingArticle: false }, () => {
					if (!this.onPositionBlurring) {
						this.onNewPositionSelectBlur(true);
						this.onPositionBlurring = true;
					}
				});
			}
		};
	}

	onPositionRemove(position) {
		const { positions } = this.props;
		const newPositions = positions.filter(pos => pos.tempId !== position.tempId);
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
		if (!this.props.isActiveComponentHasError) {
			if (this.props.activeComponentAction !== undefined) {
				this.props.activeComponentAction('positionComponent', undefined);
			}

			positions.push({
				tempId: generateUuid(),
				title: '',
				action: 'incoming',
				// metaData: {
				// 	type: 'article'
				// },
				quantity: 0,
			//	customer: null,
				unit: 'pcs',
				itemModifiedDate: formatApiDate(new Date()),
				purchasePrice: 0,
				price: 0,
				purchasePriceGross: 0,
				priceGross: 0,
				trackedInInventory: false,
				value: 0,
			});

			this.setState({ addingArticle: true }, () => {
				this.addPositionSelect.refs['addPositionSelect'].focus();
			});
		} else {
			return;
		}
	}

	onNewPositionSelectInputChange(input) {
		this.newPositionInput = input.trim();
	}

	onNewPositionSelectBlur() {
		if (this.onPositionBlurring) {
			this.onPositionBlurring = false;
			return;
		}
		const { positions, resources, recipientType, isInvoice, trackedArticlesInventory } = this.props;
		let position = positions[positions.length - 1];
		let articleAdded = false;

		if (this.selectedAddArticleOption || this.newPositionInput) {
			if (this.selectedAddArticleOption) {
				if (this.selectedAddArticleOption.isExisting) {
					const article = this.fetchedArticles.find(
						article => article.id === this.selectedAddArticleOption.value
					);
					const inventoryItem = trackedArticlesInventory.find(
						inventory => inventory.articleId === this.selectedAddArticleOption.value
					)
					position.title = article.title;
					position.purchasePrice = article.purchasePrice;
					position.price = article.price;
					position.priceGross = article.priceGross,
					position.purchasePriceGross = article.purchasePriceGross,
					position.unit = article.unit;
					position.vatPercent = article.vatPercent;
					position.metaData = {
						id: article.id,
						type: 'article',
						number: article.number,
						purchasePrice: article.purchasePrice,
						calculationBase: article.calculationBase
					};
					position.trackedInInventory = article.trackedInInventory;
					position.currentStock = inventoryItem ? inventoryItem.currentStock: null;
					position.inventoryId = inventoryItem ? inventoryItem.id: null;

				} 
				// else {
				// 	position.metaData.type = 'custom';
				// 	position.metaData.uniqueidentifier = generateUuid();
				// 	position.title = this.selectedAddArticleOption.label;
				// 	this.setState({createNewTrackArticle: true}, () => {
				// 		this.showInventoryPopover(`inventory-popover-${position.tempId}`, position);
				// 	})
				// }
			} 
			// else if (this.newPositionInput) {
			// 	position.metaData.type = 'custom';
			// 	position.metaData.uniqueidentifier = generateUuid();
			// 	position.title = this.newPositionInput;
			// }
			//position = this.calculate(position);
			articleAdded = true;
		} else {
			this.state.addingArticle && positions.pop();
		}

		this.selectedAddArticleOption = null;
		this.newPostionInput = null;

		this.setState({ addingArticle: false }, () => {
			if (articleAdded) {
				const ref = this.amountRefs[this.amountRefs.length - 1];
				if (ref && ref.refs && ref.refs['action']) {
					ref.refs['action'].focus();
				}
			}
			this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
		});
	}

	// onDragAndDrop(el, target, source, sibling) {
	// 	const { positions } = this.props;
	// 	const currentItems = this.refs['letterPositionsItems'].childNodes;
	// 	const currentOrder = Array.from(currentItems).map(elem => elem.dataset.id);
	// 	const newPositions = currentOrder.map(id => positions.find(pos => pos.tempId === id));
	// 	this.props.onPositionsChanged && this.props.onPositionsChanged(newPositions);
	// }

	onTextChange(position, value) {
		const { positions } = this.props;

		positions.forEach(pos => {
			if (pos.tempId === position.tempId) {
				pos.title = value;
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	// onTextareaChange(position, value) {
	// 	const { positions } = this.props;

	// 	positions.forEach(pos => {
	// 		if (pos.tempId === position.tempId) {
	// 			pos.description = value;
	// 			if (value === '<p><br></p><p><br></p>' || value === '<p><br></p>') {
	// 				pos.description = value.replace('<p><br></p><p><br></p>', '').replace('<p><br></p>', '');
	// 			}
	// 		}
	// 	});

	// 	this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	// }

	forceBlur() {
		const { positions } = this.props;
		positions.forEach((pos, index) => {
			this.refs[`positions-item-${index}-ref`] && this.refs[`positions-item-${index}-ref`].blur();
		});
	}

	onInventoryActionChange(position, value) {
		const name = !value || !value.name ? '' : value.name;
		const { miscOptions } = this.state;
		const { positions, resources, onFetchCustomers } = this.props;
		this.props.onPositionsChanged && this.props.onFetchCustomers(value);

		positions.forEach(pos => {
			if (pos.tempId === position.tempId) {
				pos.action = name;
			}
		});

			this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	onAmountChange(position, value) {
		const { positions } = this.props;

		positions.forEach(pos => {
			if (pos.tempId === position.tempId) {
				pos.quantity = parseFloat(value);
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	onDateChange(position, value, date) {
		const { positions } = this.props;
		positions.forEach(pos => {
			if (pos.tempId === position.tempId) {
			pos.itemModifiedDate = formatApiDate(date);
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	onCustomerChange(position, value) {
		const { positions } = this.props;

		positions.forEach(pos => {
			if (pos.tempId === position.tempId) {
				pos.customer = value ? value.value : null;
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	onPriceChange(position, value, type) {
		const { positions } = this.props;

		positions.forEach(pos => {
			if (pos.tempId === position.tempId) {
				if (type === 'purchasePrice') {
					pos.purchasePrice = accounting.unformat(value, config.currencyFormat.decimal);
					pos.purchasePrice = new Decimal(pos.purchasePrice).toDP(2).toNumber();

					pos.purchasePriceGross = pos.purchasePrice * (1 + pos.vatPercent / 100);
					pos.purchasePriceGross = new Decimal(pos.purchasePriceGross).toDP(2).toNumber();				
				} else {
					pos.price = accounting.unformat(value, config.currencyFormat.decimal);
					pos.price = new Decimal(pos.price).toDP(2).toNumber();

					pos.priceGross = pos.price * (1 + pos.vatPercent / 100);
					pos.priceGross = new Decimal(pos.priceGross).toDP(2).toNumber();
				}	
				//pos = this.calculate(position);		
			}
		});

		this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
	}

	calculate(position) {

		position.purchasePriceGross = position.purchasePrice * (1 + vatPercent / 100);
		position.priceGross = position.price * (1 + vatPercent / 100);

		position.purchasePrice = new Decimal(position.purchasePrice).toDP(2).toNumber();
		position.purchasePriceGross = new Decimal(position.purchasePriceGross).toDP(2).toNumber();
		position.price = new Decimal(position.price).toDP(2).toNumber();
       	position.priceGross = new Decimal(position.priceGross).toDP(2).toNumber();

		return position;
	}

	onInventoryTrackArticleChange(position, value) {
		const { positions } = this.props;
		this.setState({ addOpeningAndMinimum: !this.state.addOpeningAndMinimum }, () => {
			positions.forEach(pos => {
				if (pos.tempId === position.tempId) {
					pos.trackedInInventory = value;
					pos.currentStock = null;
					pos.minimumBalance = null;
					pos.openingBalance = null;
					pos.purchasePrice = null;
				}
			});
			this.props.onPositionsChanged && this.props.onPositionsChanged(positions);
		})
	}


	onPriceKindChange(priceKind) {
		this.props.onPriceKindChange && this.props.onPriceKindChange(priceKind);
	}

	onKeyDown(e, columnName, positionIndex) {
		// if (e.keyCode === 9 || e.which === 9) {
		// 	setTimeout(() => {
		// 		this.hideVatPopover();
		// 		this.hideInventoryPopover();
		// 	});
		// }

		if (!columnName || !positionIndex) {
			return;
		}

		if (e.keyCode === 13 || e.which === 13) {
			e.preventDefault();
			this.hideVatPopover();
			this.hideInventoryPopover();
			let selector = `#letter-positions-item-${positionIndex} .letter-positions-item-column-amount .Select-input input`;
			if (columnName === 'quantity') {
				selector = `#letter-positions-item-${positionIndex} .letter-positions-item-textarea .ql-editor`;
			} else if (columnName !== 'action') {
				const activeColumns = this.props.columns.filter(col => col.active && col.editable);
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

	calculate(position) {
		const { priceKind } = this.props;

		if (invoiz.user.isSmallBusiness || priceKind === 'net') {
			position.priceGross = position.priceNet * (1 + position.vatPercent / 100);
		} else {
			position.priceNet = position.priceGross / (1 + position.vatPercent / 100);
		}

		position.totalNet = new Decimal(position.priceNet * position.amount).toDP(2).toNumber();
		position.totalGross = new Decimal(position.priceGross * position.amount).toDP(2).toNumber();

		position.totalNetAfterDiscount = new Decimal(position.totalNet)
			.minus((position.totalNet * position.discountPercent) / 100)
			.toDP(2)
			.toNumber();

		position.totalGrossAfterDiscount = new Decimal(position.totalGross)
			.minus((position.totalGross * position.discountPercent) / 100)
			.toDP(2)
			.toNumber();

		return position;
	}

	createNewPositionSection() {
		const { addingArticle } = this.state;
		const { resources, positions } = this.props;

		return (
			<div>
				{positions.length < 10 ? (				<div
					className={`letter-positions-add-position-button outlined ${
						addingArticle ? 'add-position-button-invis' : ''
					}`}
					onClick={() => this.onNewPositionClick()}
				>
					<span className="icon icon-rounded icon-plus" />
					{`Add new inventory entry`}
				</div>) : null}


				<div
					className={`letter-positions-add-position-select ${
						!addingArticle ? 'add-position-select-invis' : ''
					}`}
				>
					<SelectInputComponent
						ref={elem => (this.addPositionSelect = elem)}
						name="addPositionSelect"
						value={null}
						allowCreate={false}
						options={this.getNewPositionOptions()}
						onBlur={() => this.onNewPositionSelectBlur()}
						onInputChange={input => this.onNewPositionSelectInputChange(input)}
					/>
				</div>
			</div>
		);
	}

	createPositionColumn(position, column, index) {
		let element;
		const { resources, isInvoice } = this.props;
		switch (column.name) {
			case 'title': {
				const value = position['title'] || '';
				element = (
					<div
					// onClick={() => {
					// 	this.showInventoryPopover(`inventory-popover-${position.tempId}`, position);
					// }}
					>
					<TextInputExtendedComponent
						name={`title`}
						value={value}
						onKeyDown={e => this.onKeyDown(e, column.name, index)}
						onBlur={(target, value) => this.onTextChange(position, value)}
					/>
					</div>

				);
				break;
			}
			case 'action': {
				const value = position['action'] || 0;
				const { miscOptions } = this.state;
				const loadedOptions = miscOptions.inventoryActions.map(action => {
					return {name: action,
					isExisting: true};
				});
				const selectOptions = {
					placeholder: `Select action`,
					labelKey: 'name',
					valueKey: 'name',
					cache: false,
					handleChange: value => {
						if (!value || (value && !value.isDummy && value.name)) {
							this.onInventoryActionChange(position, value);
						}
					},
					ignoreAccents: false
				};
				element = (
					<div>
						<SelectInputComponent
							onKeyDown={e => this.onKeyDown(e)}
							ref={elem => (this.amountRefs[index] = elem)}
							name={'action'}
							value={{ name: position.action }}
							allowCreate={false}
							notAsync={true}
							options={selectOptions}
							loadedOptions={loadedOptions}
						/>
					</div>

				);
				break;
			}

			case 'quantity': {
				const value = position['quantity'] || 0;
				const units = position['unit']
				element = (
					<div>
						<NumberInputComponent
							id={`quantity-field-${position.tempId}`}
							//ref={elem => (this.amountRefs[index] = elem)}
							selectOnFocus={true}
							name={'quantity'}
							value={parseFloat(value)}
							isDecimal={false}
							onKeyDown={e => this.onKeyDown(e, column.name, index)}
							onBlur={(value, name) => this.onAmountChange(position, value, name)}
						/>
					</div>
				);
				break;
			}

			// case 'customer': {
			// 	const value = position['customer'] || '';
			// 	const { miscOptions } = this.state;
			// 	const loadedOptions = miscOptions.customers.map(customer => {
			// 		return {name: customer.name,
			// 			value: customer.name,
			// 		isExisting: true};
			// 	});
			// 	const selectOptions = {
			// 		placeholder: `Select customer`,
			// 		labelKey: 'name',
			// 		valueKey: 'value',
			// 		cache: false,
			// 		handleChange: value => {
			// 			if (!value || (value && !value.isDummy && value.name)) {
			// 				this.onCustomerChange(position, value);
			// 			}
			// 		},
			// 		ignoreAccents: false
			// 	};
			// 	element = (
			// 		<div>
			// 			<SelectInputComponent
			// 				onKeyDown={e => this.onKeyDown(e)}
			// 				name={'customer'}
			// 				value={{ name: position.customer }}
			// 				allowCreate={false}
			// 				notAsync={true}
			// 				options={selectOptions}
			// 				loadedOptions={loadedOptions}
			// 			/>
			// 		</div>

			// 	);
			// 	break;
			// }

			case 'itemModifiedDate': {
				const value = position[column.name] || 0;
				element = (
					<div className="dateInput">
						<DateInputComponent
							ref="customDatePickerInput"
							name="itemModifiedDate"
							allowClear={true}
							//placeholder={moment().format(config.dateFormat.client)}
							value={value ? formatClientDate(value) : null}
							onChange={(name, value, date) => this.onDateChange(position, value, date)}
							// onBlur={(newDate) => {
							//     if (updatedAt !== newDate) {
							//         this.onDateChanged(newDate ? moment(newDate, config.dateFormat.client).toDate() : null);
							//     }
							// }}
						/>
				 </div>
				);
				break;
			}

			case 'purchasePrice': {
				const price = parseFloat(position.purchasePrice)
				element = (
					<CurrencyInputComponent
					willReceiveNewValueProps={true}
					name="purchasePrice"
					value={price}
					onKeyDown={e => this.onKeyDown(e, column.name, index)}
					selectOnFocus={true}
					onBlur={value => this.onPriceChange(position, value, 'purchasePrice')}
					disabled={position.action === 'outgoing'}
				/>
				);
				break;
			}

			case 'salesPrice': {
				//const { priceKind } = this.props;
				const price = parseFloat(position.price)
				element = (
					<div
						// id={`vat-popover-price-${position.tempId}`}
						// onClick={() => {
						// 	if (!invoiz.user.isSmallBusiness) {
						// 		this.showVatPopover(`vat-popover-price-${position.tempId}`, position);
						// 	}
						// }}
					>
						<CurrencyInputComponent
							willReceiveNewValueProps={true}
							name="salesPrice"
							value={price}
							onKeyDown={e => this.onKeyDown(e, column.name, index)}
							selectOnFocus={true}
							onBlur={value => this.onPriceChange(position, value, 'price')}
							disabled={position.action === 'incoming'}
						/>
					</div>
				);
				break;
			}
		}

		return element;
	}

	showVatPopover(elementId, position) {
		this.setState({ showPopoverPosition: position, popoverElementId: elementId }, () => {
			setTimeout(() => {
				this.refs['letter-positions-vat-popover'] && this.refs['letter-positions-vat-popover'].show(true, 100);
			});
		});
	}

	showInventoryPopover(elementId, position) {
		this.setState({ showInventoryPopover: position, popoverInventoryElementId: elementId }, () => {
			setTimeout(() => {
				this.refs['letter-positions-inventory-popover'] && this.refs['letter-positions-inventory-popover'].show(true, 100);
			});
		});
	}

	hideInventoryPopover() {
		this.setState({ showPopoverPosition: null, popoverElementId: null, createNewTrackArticle: false });
	}

	hideVatPopover() {
		this.setState({ showPopoverPosition: null, popoverElementId: null });
	}
}

LetterPositionsInventoryManualComponent.propTypes = {
	onPositionsChanged: PropTypes.func,
	onPriceKindChange: PropTypes.func
};

export default LetterPositionsInventoryManualComponent;
