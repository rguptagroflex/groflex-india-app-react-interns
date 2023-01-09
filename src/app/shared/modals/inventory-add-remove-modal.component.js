import invoiz from 'services/invoiz.service';
import React from 'react';
import NumberInputComponent from 'shared/inputs/number-input/number-input.component';
import DateInputComponent from 'shared/inputs/date-input/date-input.component';
import CurrencyInputComponent from 'shared/inputs/currency-input/currency-input.component';
import ButtonComponent from 'shared/button/button.component';
// import { redirectToZohoApi } from 'helpers/redirectToZohoApi';
import { redirectToChargebee } from 'helpers/redirectToChargebee';
import config from 'config';
import moment from 'moment';
import ModalService from 'services/modal.service';
import accounting from 'accounting';
import Decimal from 'decimal.js';
import InventoryAction from 'enums/inventory/inventory-action.enum';
import InventorySource from 'enums/inventory/inventory-source.enum';
import { formatApiDate, formatClientDate } from '../../helpers/formatDate';
import CheckboxInputComponent from 'shared/inputs/checkbox-input/checkbox-input.component';

class InventoryAddRemoveModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
            updatedAt: this.props.btnSelectedRow.updatedAt,
            itemModifiedDate: null,
            quantity: 0,
            salesPrice: this.props.btnSelectedRow.price,
            purchasePrice: this.props.btnSelectedRow.purchasePrice,
            priceGross: this.props.btnSelectedRow.priceGross,
            purchasePriceGross: this.props.btnSelectedRow.purchasePriceGross,
            vatPercent: this.props.btnSelectedRow.vatPercent,
            errorMessageStock: {
                errorMessageQuantity: '',
                errorMessageQuantityBelowStock: '',
            },
            currentStock: this.props.btnSelectedRow.currentStock,
            value: this.props.btnSelectedRow.value,
            overridePrice: false,
            overiddenPurchasePrice: this.props.btnSelectedRow.purchasePrice,
            overiddenSalesPrice: this.props.btnSelectedRow.price,
            overiddenPriceGross: this.props.btnSelectedRow.priceGross,
            overiddenPurchasePriceGross: this.props.btnSelectedRow.purchasePriceGross,
		};
    }

	onQuantityInputChange(value, name) {
        let { quantity, currentStock, purchasePrice, salesPrice } = this.state;
        const { actionType } = this.props;
       // if (name === 'quantity') {
            quantity = value;
       // }

		this.setState({ quantity, currentStock });
	}

	onInputBlur(value) {
        const { resources, actionType } = this.props;
        const { currentStock } = this.state;
        if (actionType === 'Remove') {
            if (value.length < 0 || value.length === 0 || value < 0) {
                this.setState({ errorMessageStock: {
                    errorMessageQuantity: `Please enter a value that is greater than zero!` }
                });
            } else if (value > currentStock) {
                this.setState({ errorMessageStock: {
                    errorMessageQuantity: `Please enter a value that is not below the current stock!` }
                });
            }
            else {
                this.setState({ errorMessageStock: {
                    errorMessageQuantity: `` }
                });
            }
        } else {
            if (value.length < 0 || value.length === 0 || value < 0 ) {
                this.setState({ errorMessageStock: {
                    errorMessageQuantity: `Please enter a value that is greater than zero!` }
                });
            } else {
                this.setState({ errorMessageStock: {
                    errorMessageQuantity: `` }
                });
            }
        }

    }
    
    calculateStockValue () {
        let { quantity, currentStock, value, purchasePrice, salesPrice } = this.state;

    }

	onSubmitClicked() {
        const { resources, btnSelectedRow, onConfirm, actionType } = this.props;
        const { updatedAt, quantity, salesPrice, purchasePrice, priceGross, purchasePriceGross, itemModifiedDate, overridePrice, overiddenPriceGross, overiddenPurchasePrice, overiddenPurchasePriceGross, overiddenSalesPrice } = this.state;
        let { currentStock, value } = this.state;
        const articleUrl = `${config.resourceHost}article/${btnSelectedRow.id}`;
        const inventoryUrl = `${config.resourceHost}inventory/${btnSelectedRow.inventoryId}`;

		if (!itemModifiedDate || !quantity) {
			return;
		} else {

            if (actionType === 'Add') {
               // currentStock = currentStock + quantity
                //value = quantity * purchasePrice;
            } else if (actionType ==='Remove'){
              //  currentStock = currentStock - quantity
                //value = currentStock * salesPrice;
            }
			const articleData = {
                id: btnSelectedRow.id,
                title: btnSelectedRow.title,
                number: btnSelectedRow.number.toString(),
                unit: btnSelectedRow.unit,
                price: overridePrice ? salesPrice : this.props.btnSelectedRow.price,
                purchasePrice: overridePrice ? purchasePrice : this.props.btnSelectedRow.purchasePrice,
                priceGross: overridePrice ? priceGross : this.props.btnSelectedRow.priceGross,
                purchasePriceGross: overridePrice ? purchasePriceGross : this.props.btnSelectedRow.purchasePriceGross,
            };

            const inventoryData = {
                id: btnSelectedRow.inventoryId,
                articleId: btnSelectedRow.id,
                source: InventorySource.MANUAL,
                action:  actionType === 'Add' ? InventoryAction.INCOMING : InventoryAction.OUTGOING,
                title: btnSelectedRow.title,
                unit: btnSelectedRow.unit,
                price: salesPrice,
                purchasePrice: purchasePrice,
                priceGross: priceGross,
                purchasePriceGross: purchasePriceGross,
                currentStock,
                quantity,
                updatedAt,
                itemModifiedDate,
                value
            }
			invoiz
				.request(articleUrl, {
					method: 'PUT',
					data: articleData,
					auth: true
				})
				.then((response) => {
                    invoiz
                    .request(inventoryUrl, {
                        method: 'PUT',
                        data: inventoryData,
                        auth: true
                    }).then((response) => {
                        onConfirm(response);
                    })
				})
				.catch(response => {
					invoiz.page.showToast({
						message: `Could not update article stock!`,
						type: 'error'
					});
				});

		}
    }
    
    onDateChange(name, value, date) {
        let { itemModifiedDate } = this.state;
        itemModifiedDate = formatApiDate(date);
        this.setState({itemModifiedDate})
	}
    
    onPriceChange(key, value) {
		value = value.toString().replace(/-/gi, '');
		value = accounting.unformat(value, config.currencyFormat.decimal);

		if (key === 'purchasePrice') {
            //if (this.state.overridePrice === false) {
                this.setState({purchasePrice: value}, () => {
                    this.calculatePrices(key === 'purchasePriceGross');
                })
          //  } 
        } else if (key === 'salesPrice') {
           // if (this.state.overridePrice === false) {
                this.setState({salesPrice: value}, () => {
                    this.calculatePrices(key === 'priceGross');
                })
          //  }
        }
	}

	calculatePrices(baseOnGross) {
		let { salesPrice, purchasePrice, priceGross, purchasePriceGross, vatPercent, overiddenPurchasePrice, overiddenSalesPrice, overiddenPurchasePriceGross, overiddenPriceGross } = this.state;

		if (!baseOnGross) {
			purchasePriceGross = purchasePrice * (1 + vatPercent / 100);
            priceGross = salesPrice * (1 + vatPercent / 100);
            overiddenPurchasePriceGross = overiddenPurchasePrice * (1 + vatPercent / 100);
			overiddenPriceGross = overiddenSalesPrice * (1 + vatPercent / 100);
		} else {
			purchasePrice = purchasePriceGross / (1 + vatPercent / 100);
            salesPrice = priceGross / (1 + vatPercent / 100);
            overiddenPurchasePriceGross = overiddenPurchasePrice * (1 + vatPercent / 100);
			overiddenPriceGross = overiddenSalesPrice * (1 + vatPercent / 100);
		}

		purchasePrice = new Decimal(purchasePrice).toDP(2).toNumber();
		purchasePriceGross = new Decimal(purchasePriceGross).toDP(2).toNumber();
		salesPrice = new Decimal(salesPrice).toDP(2).toNumber();
        priceGross = new Decimal(priceGross).toDP(2).toNumber();
        overiddenPurchasePrice = new Decimal(overiddenPurchasePrice).toDP(2).toNumber();
		overiddenPurchasePriceGross = new Decimal(overiddenPurchasePriceGross).toDP(2).toNumber();
		overiddenSalesPrice = new Decimal(overiddenSalesPrice).toDP(2).toNumber();
		overiddenPriceGross = new Decimal(overiddenPriceGross).toDP(2).toNumber();

		this.setState({ salesPrice, purchasePrice, priceGross, purchasePriceGross, overiddenPurchasePrice, overiddenSalesPrice, overiddenPurchasePriceGross, overiddenPriceGross });
	}


	render() {
        const { itemModifiedDate, quantity, salesPrice, purchasePrice, errorMessageStock, overridePrice, overiddenPurchasePrice, overiddenSalesPrice } = this.state;
        const { resources, actionType } = this.props;
		return (
			<div>
				{/* <div>{`Add/Remove article stock`}</div> */}
				<div className="inventory-add-remove-modal">
					<div className="row col-xs-12">
						<NumberInputComponent
							ref="inventory-quantity-input"
							dataQsId="inventory-quantity"
							label={`Quantity`}
							name={'quantity'}
							maxLength="10"
							value={parseFloat(quantity)}
							isDecimal={true}
                            errorMessage={errorMessageStock.errorMessageQuantity}
							onChange={(value, name) => this.onQuantityInputChange(value, name)}
							onBlur={value => this.onInputBlur(value)}
                            defaultNonZero={true}
						/>
					</div>
                    <div className="row col-xs-12">
            		{
                        actionType === 'Add' ? (<CurrencyInputComponent
                            name={overridePrice ? `overiddenPurchasePrice` : `purchasePrice`}
                            dataQsId="inventory-edit-purchasePriceNet"
                            value={overridePrice ===true ? overiddenPurchasePrice : purchasePrice}
                            selectOnFocus={true}
                            onBlur={value => this.onPriceChange('purchasePrice', value)}
                            label={resources.str_purchasePriceNet}
                            // hasBorder={true}
                            // leftLabel={true}
                            // willReceiveNewValueProps={true}
						/>) : (<CurrencyInputComponent
                            name={overridePrice ? `overiddenSalesPrice` : `salesPrice`}
                            dataQsId="inventory-edit-salesPriceNet"
                            value={overridePrice === true ? overiddenSalesPrice : salesPrice}
                            selectOnFocus={true}
                            onBlur={value => this.onPriceChange('salesPrice', value)}
                            label={resources.str_salesPriceNet}
                            // hasBorder={true}
                            // leftLabel={true}
                            // willReceiveNewValueProps={true}
						/>)
                    }
                    </div>
                    <div className="row col-xs-12">
                    <CheckboxInputComponent
								name={'overridePrice'}
								label={`Set as default price`}
								checked={this.state.overridePrice}
								onChange={() => this.setState({ overridePrice: !this.state.overridePrice })}
							/>
                    </div>
                    <div className="row col-xs-12" style={{paddingTop: 20}}>
                        <div className="dateInput">
                            <label className="dateInput_label">{`Date`}</label>
                                <DateInputComponent
				                    ref="customDatePickerInput"
				                    name="itemModifiedDate"
				                    allowClear={true}
                                    //placeholder={moment().format(config.dateFormat.client)}
                                    value={itemModifiedDate ? formatClientDate(itemModifiedDate) : null}
                                    onChange={(name, value, date) => this.onDateChange(name, value, date)}
                                    // onBlur={(newDate) => {
                                    //     if (updatedAt !== newDate) {
                                    //         this.onDateChanged(newDate ? moment(newDate, config.dateFormat.client).toDate() : null);
                                    //     }
                                    // }}
			                    />
                         </div>
                    </div>
                    {/* <div className="row col-xs-12"> */}
                    {/* <span className="opening-disclaimer" style={{marginTop: "20px", fontSize: "11px"}}><span className="opening-note" style={{fontWeight: 'bold'}}>Note: </span>Please use manual stock functionality only for backdating!</span>  */}
                    {/* </div> */}
					<div className="modal-base-footer">
                    <div className="modal-base-cancel">
								<ButtonComponent
									type="cancel"
									callback={() => ModalService.close(true)}
									label={resources.str_abortStop}
									dataQsId="modal-btn-cancel"
								/>
						</div>
						<div className="modal-base-confirm">
							<ButtonComponent
								// buttonIcon={'icon-check'}
								type={'primary'}
								disabled={(this.state.quantity <= 0 || this.state.errorMessageStock.errorMessageQuantity !== '')}
								callback={() => this.onSubmitClicked()}
								label={`Save`}
								dataQsId="modal-btn-confirm"
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default InventoryAddRemoveModal;
