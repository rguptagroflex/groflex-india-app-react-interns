import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import { formatCurrency } from 'helpers/formatCurrency';
// import moment from 'moment';
import accounting from 'accounting';
import CurrencyInputComponent from 'shared/inputs/currency-input/currency-input.component';
import DateInputComponent from 'shared/inputs/date-input/date-input.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import { formatApiDate } from 'helpers/formatDate';
import CheckboxInputComponent from 'shared/inputs/checkbox-input/checkbox-input.component';

const PAYMENT_TYPE = {
	PAYMENT: 'payment',
	CREDIT: 'credit',
	SURCHARGE: 'surcharge',
	SETTLE: 'settle',
	PARTIAL: 'partial',
	DISCOUNT: 'discount',
	BANKCHARGE: 'bankcharge',
	TDS_CHARGE: 'tdscharge',
	CREDITS: 'creditsAdjusted',
	BALANCE: 'balanceAdjusted',
	EXCESS: 'excessAmount'
};

class BulkRefundModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isDeviation: false,
			isDeviationSet: false,
			isSaving: false,
			isValid: this.props.payment.amount > 0,

			paymentAmount:this.props.payment.amount,
			maxAvailableRefund:this.props.payment.amount,
			totalAmount:this.props.payment.amount,
			isNormalPayment:true,

			...this.props.data
		};
		this.hanldeClearDuesCheckbox = this.hanldeClearDuesCheckbox.bind(this)
		this.hanldeClearInvoiceAmountCheckbox = this.hanldeClearInvoiceAmountCheckbox.bind(this)
		this.handleAmountChange = this.handleAmountChange.bind(this)
	}

	
	render() {
		const { isDeviation } = this.state;
		let element = null;
		if (isDeviation) {
			element = this.createDeviationView();
		} else {
			element = this.createPaymentView();
		}

		return element;
	}

	continue() {
		this.setState({ isDeviation: true });
	}

	payFull() {
		const { payment } = this.props;
		payment.type = PAYMENT_TYPE.PAYMENT; // not required
		this.save();
	}

	setDeviation(paymentType) {
		const { payment } = this.props;
		payment.type = paymentType;
		this.setState({ isDeviationSet: true });
	}
	async bulkPayment(payment){
		await invoiz.request(`${config.resourceHost}customer/${payment.customerId}/bulkPayment`, {
					method: 'POST',
					auth: true,
					data: payment
				})

	}
	save() {
		const { isSaving,paymentAmount, isClearingDues, isClearingInvoiceAmount,maxAvailableRefund, clearingDues, clearingInvoiceAmount } = this.state;
		const { payment, onSave, resources, customer } = this.props;
		//const previousBalance = parseFloat(accounting.toFixed(Math.abs(credits) + Math.abs(balance)  + Math.abs(openingBalance < 0 ? openingBalance : 0), 2), 10)

		if (isSaving) {
			return;
		}
			payment.financialAccounting = payment.type;
			payment.amount=paymentAmount
			payment.customerId = customer.id

			let availableCredits =  Math.abs(customer.credits) 
			let availableExcessAmount =  Math.abs(customer.balance) 

			let bulkPaymentPayload ={ ...payment, amount:0  }

			if(isClearingInvoiceAmount || isClearingDues){
				bulkPaymentPayload.clearDues = isClearingDues
				let creditsAndBalance = parseFloat(accounting.toFixed(clearingDues + clearingInvoiceAmount,2))

				let difference = parseFloat(accounting.toFixed(creditsAndBalance - availableCredits,2))
				if(difference < 0)
				{ // credits are more than usingPreviousBalance
					bulkPaymentPayload.useCredits = creditsAndBalance
					bulkPaymentPayload.useBalance = 0
				}
				else{
					bulkPaymentPayload.useCredits =  availableCredits
					bulkPaymentPayload.useBalance = difference
				}
				availableCredits = parseFloat(accounting.toFixed(availableCredits - bulkPaymentPayload.useCredits,2))
				availableExcessAmount = parseFloat(accounting.toFixed(availableExcessAmount - bulkPaymentPayload.useBalance,2))


			}

			if(paymentAmount > 0){
				let difference = parseFloat(accounting.toFixed(paymentAmount - availableCredits,2))
				if(difference < 0)
				{ // credits are more than usingPreviousBalance
				 payment.useCredits = paymentAmount
				 payment.useBalance = 0
				}
				else{
				 payment.useCredits =  availableCredits
				 payment.useBalance = difference
				}
			}

		this.setState({ isSaving: true }, async () => {
			try {
				
			if(isClearingDues || isClearingInvoiceAmount)	
				await this.bulkPayment(bulkPaymentPayload)
			
		     if(paymentAmount > 0)		
			 await invoiz
				.request(`${config.resourceHost}customer/${customer.id}/bulkRefund`, {
					method: 'POST',
					auth: true,
					data: payment
				})

				invoiz.page.showToast(resources.str_paymentSaveSuccessMessage);
				ModalService.close();
				onSave && onSave();	

			} catch (error) {
				console.log( " error ",error );
				if (error && error.statusCode === 401) {
					invoiz.page.showToast({ type: 'error', message: resources.str_paymentTimeoutMessage });
				} else {
					invoiz.page.showToast({ type: 'error', message: resources.str_paymentSaveErrorMessage });
				}

				//ModalService.close();
			}

		});
	}

	handleAmountChange(value){
	 let {paymentAmount,maxAvailableRefund} = this.state	
		paymentAmount = accounting.unformat(value, config.currencyFormat.decimal);
		if(paymentAmount < 0 )
		paymentAmount = 0
		if( paymentAmount > maxAvailableRefund )
		  paymentAmount = maxAvailableRefund
		this.setState({ paymentAmount });
	}
	hanldeClearDuesCheckbox(){
		let {isClearingDues,isClearingInvoiceAmount, maxAvailableRefund, clearingDues, clearingInvoiceAmount }=this.state
		let {totalDues, invoiceOutstandingAmount, previousBalance } = this.props.data
		isClearingDues= !isClearingDues

		maxAvailableRefund =  parseFloat(accounting.toFixed(previousBalance - clearingInvoiceAmount,2))

		if(maxAvailableRefund <=0 )
		isClearingDues = false

		if(isClearingDues){

				if( maxAvailableRefund >= totalDues){
					maxAvailableRefund = parseFloat(accounting.toFixed(maxAvailableRefund - totalDues,2))
				   clearingDues = totalDues
				}else{
				   clearingDues = maxAvailableRefund
				   maxAvailableRefund = 0
				}
			
		}
		else{
			maxAvailableRefund = parseFloat(accounting.toFixed(previousBalance - clearingInvoiceAmount,2))
			clearingDues = 0

		}
		maxAvailableRefund = maxAvailableRefund < 0 ? 0 : maxAvailableRefund


		this.setState({isClearingDues,clearingDues ,paymentAmount:maxAvailableRefund, maxAvailableRefund})
	}
	hanldeClearInvoiceAmountCheckbox(){
		let {isClearingDues,isClearingInvoiceAmount, maxAvailableRefund, clearingDues, clearingInvoiceAmount }=this.state
		let {totalDues, invoiceOutstandingAmount, previousBalance } = this.props.data
		isClearingInvoiceAmount= !isClearingInvoiceAmount

		maxAvailableRefund =  parseFloat(accounting.toFixed(previousBalance - clearingDues,2))

		if(maxAvailableRefund <=0 )
		isClearingInvoiceAmount = false

		if(isClearingInvoiceAmount){

				if( maxAvailableRefund >= invoiceOutstandingAmount){
					maxAvailableRefund = parseFloat(accounting.toFixed(maxAvailableRefund - invoiceOutstandingAmount,2))
					clearingInvoiceAmount = invoiceOutstandingAmount
				}else{
					clearingInvoiceAmount = maxAvailableRefund
				    maxAvailableRefund = 0
				}
			
		}
		else{
			clearingInvoiceAmount = 0
			maxAvailableRefund = parseFloat(accounting.toFixed(previousBalance - clearingDues,2))

		}
		maxAvailableRefund = maxAvailableRefund < 0 ? 0 : maxAvailableRefund


		this.setState({isClearingInvoiceAmount,clearingInvoiceAmount,paymentAmount:maxAvailableRefund, maxAvailableRefund})
	}
	createPaymentView() {
		const { payment, resources  } = this.props;
		const {invoiceOutstandingAmount, totalDues, previousBalance} = this.props.data
		let { isValid, totalAmount, isSaving,paymentAmount,isClearingDues, clearingDues, clearingInvoiceAmount, isClearingInvoiceAmount , maxAvailableRefund} = this.state;
		if (payment.date && payment.date instanceof Date) {
			// payment.date = moment(payment.date).format(config.dateFormat.api);
			payment.date = formatApiDate(payment.date);
		}

		return (
			<div>
				<div className="modal-base-headline">{resources.str_issueRefund}</div>

				<div className="row">
					<div className="col-xs-6">
						<div className="payment-create-label">{resources.str_balance}</div>
						<div className="payment-create-value">{ formatCurrency (previousBalance || 0)}</div>
					</div>

				</div>

			{ totalDues > 0 &&
					<div className="row">
			
						<div className="col-xs-12 utilize-credits-balance">
							<CheckboxInputComponent
							name={'dues'}
							label={`Clear ${  clearingDues && clearingDues !==totalDues ? formatCurrency(clearingDues )+ ' of': ''} the previous dues ${formatCurrency(totalDues )}`}
							checked={isClearingDues}
							onChange={() => {this.hanldeClearDuesCheckbox()}}
							/>
						</div>	
						
			</div> 
    		}
			{ invoiceOutstandingAmount > 0 &&
					<div className="row">
			
						<div className="col-xs-12 utilize-credits-balance">
							<CheckboxInputComponent
							name={'dues'}
							label={`Clear ${ clearingInvoiceAmount && clearingInvoiceAmount !==invoiceOutstandingAmount ? formatCurrency(clearingInvoiceAmount )+' of' : '' } the open invoices amount ${formatCurrency(invoiceOutstandingAmount )}`}
							checked={isClearingInvoiceAmount}
							onChange={() => {this.hanldeClearInvoiceAmountCheckbox()}}
							/>
						</div>	
						
			</div> 
    		}

				<div className="row">
					<div className="col-xs-6">
						<DateInputComponent
							label={resources.str_dateOfReceiptRefund}
							placeholder={resources.str_dateFormat}
							name="date"
							dataQsId="create-payment-date"
							// value={payment.date}
							value={payment.displayDate}
							onChange={(name, value) => {
							//	value = moment(value).format(config.dateFormat.api);
								payment.date = formatApiDate(value);
							}}
						/>
					</div>

					<div className="col-xs-6 create-payment-amount-wrapper">
						<CurrencyInputComponent
							name="amount"
							dataQsId="create-payment-amount"
							value={ paymentAmount  }
							selectOnFocus={true}
							willReceiveNewValueProps={true}
							
							
							onBlur={value => {
								if (value!=='') {
									this.handleAmountChange(value)
									// payment.amount = accounting.unformat(value, ',');
								}
								
							}}
							label={resources.refundAmount}
						/>
					</div>
				</div>

				<div className="row">
					<div className="col-xs-12">
						<TextInputExtendedComponent
							name="notes"
							dataQsId="create-payment-notes"
							value={payment.notes || resources.bulkRefundNoteText}
							label={resources.bulkRefundNote}
							onChange={value => {
								payment.notes = value.trim();
							}}
						/>
					</div>
				</div>

			

				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							dataQsId="createPayment-btn-cancel"
							callback={() => ModalService.close()}
							type="cancel"
							label={resources.str_abortStop}
						/>
					</div>

					<div className="modal-base-confirm">
						<ButtonComponent
							buttonIcon={'icon-check'}
							dataQsId="createPayment-btn-save"
							loading={isSaving}
							disabled={paymentAmount < 0 || paymentAmount >  maxAvailableRefund || previousBalance === 0 }
							callback={() => {
                                this.payFull();
                                //	this.continue();

							}}
							label={ resources.str_toSave }
						/>
					</div>
				</div>
			</div>
		);
	}

	createDeviationView() {
		const { payment, resources } = this.props;
		const { isDeviationSet,creditsAndBalance, isSaving,totalAmount,paymentAmount,utilizeCreditsAndBalance, outstandingAndDues } = this.state;

		const isMore =totalAmount > outstandingAndDues;
		const deviationAmount = totalAmount - outstandingAndDues;
		const isPaymentAmountMore=paymentAmount > outstandingAndDues;

		const element = isMore ? (
			<div className="payment-create-content">
				<div className="icon icon-coins_drop" />
				{isPaymentAmountMore && (paymentAmount!=outstandingAndDues) && 
							<div>{`The additional ${formatCurrency( paymentAmount-outstandingAndDues  )} amount paid will be added to excess payments and can be used for upcoming invoices`}</div>
				}
				{utilizeCreditsAndBalance  && 
						<div>
							{isPaymentAmountMore
                            ?`The previous balance ${formatCurrency(creditsAndBalance)} can be usded for upcoming invoices`
							:`From the previous balance only ${formatCurrency( outstandingAndDues - paymentAmount)} will be used in the current payment and the reamaing ${formatCurrency(deviationAmount)} can be used for upcoming invoices `
							}
						</div>
				}
			
			</div>
		) : (
			<div className="payment-deviation-choices">
				<div
					className={`payment-deviation-choice ${
						isDeviationSet && payment.type === PAYMENT_TYPE.PARTIAL ? 'active' : ''
					}`}
					onClick={() => this.setDeviation(PAYMENT_TYPE.PARTIAL)}
				>
					<div className="icon icon-coins" />
					<div className="payment-deviation-choice-title">{resources.treatPartialPaymentText}</div>
					<div className="payment-deviation-choice-description">{resources.billingStatusPartiallyPaid}</div>
				</div>

				<div
					className={`payment-deviation-choice ${
						isDeviationSet && payment.type === PAYMENT_TYPE.DISCOUNT ? 'active' : ''
					}`}
					onClick={() => this.setDeviation(PAYMENT_TYPE.DISCOUNT)}
				>
					<div className="icon icon-percent" />
					<div className="payment-deviation-choice-title">{resources.treatAsDiscount}</div>
					<div className="payment-deviation-choice-description">{resources.billingStatusFullyPaid}</div>
				</div>

				<div
					className={`payment-deviation-choice ${
						isDeviationSet && payment.type === PAYMENT_TYPE.BANKCHARGE ? 'active' : ''
					}`}
					onClick={() => this.setDeviation(PAYMENT_TYPE.BANKCHARGE)}
				>
					<div className="icon icon-bank" />
					<div className="payment-deviation-choice-title">{resources.treatAsBankFee}</div>
					<div className="payment-deviation-choice-description">{resources.billingStatusFullyPaid}</div>
				</div>

				<div
					className={`payment-deviation-choice ${
						isDeviationSet && payment.type === PAYMENT_TYPE.TDS_CHARGE ? 'active' : ''
					}`}
					onClick={() => this.setDeviation(PAYMENT_TYPE.TDS_CHARGE)}
				>
					<div className="icon icon-tds" />
					<div className="payment-deviation-choice-title">{resources.treatAsTDS}</div>
					<div className="payment-deviation-choice-description">{resources.billingStatusFullyPaid}</div>
				</div>
			</div>
		);

		return (
			<div>
				<div className="modal-base-headline">
					{isMore ? <span>{resources.AadditionalAmountOfText} </span> : resources.minAmountOfText}
					<span className="deviation-amount">{formatCurrency(deviationAmount)}</span>
					<div className="deviation-description text-placeholder">
						{isMore ? resources.enteredExcessAmountText : resources.chooseFollowingOptionsText}
					</div>
				</div>

				{element}

				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							dataQsId="createPayment-btn-cancel"
							callback={() => this.setState({ isDeviation: false, isDeviationSet: false })}
							type="cancel"
							label={resources.str_backSmall}
						/>
					</div>

					<div className="modal-base-confirm">
						<ButtonComponent
							buttonIcon="icon-check"
							dataQsId="createPayment-btn-save"
							loading={isSaving}
							disabled={!isMore && !isDeviationSet}
							callback={() => {
								if (isDeviationSet) {
									this.save();
								} else {
									this.setDeviation(PAYMENT_TYPE.EXCESS);
									this.save();
								}
							}}
							label={resources.str_toSave}
						/>
					</div>
				</div>
			</div>
		);
	}
}

export default BulkRefundModalComponent;
