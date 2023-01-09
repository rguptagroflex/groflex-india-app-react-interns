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

class BulkPaymentModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isDeviation: false,
			isDeviationSet: false,
			isSaving: false,

			//==== 
			isValid: this.props.payment.amount > 0,

			paymentAmount:this.props.payment.amount,
			totalAmount:this.props.payment.amount,
			isNormalPayment:true,

			//---------
			hasDues:this.props.customer && this.props.customer.openingBalance > 0,
			duesAmount:this.props.customer?(this.props.customer.openingBalance):0,
			clearDues:false,

			//-----------
            previousBalance:this.props.customer
									? - (this.props.customer.credits + this.props.customer.balance + 
												( this.props.customer.openingBalance < 0 ?  this.props.customer.openingBalance : 0 )
									  )
									:0,
			usePreviousBalance:false	
                              
		};
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

	save() {
		const { isSaving, totalAmount, paymentAmount, usePreviousBalance } = this.state;
		const { payment, onSave, resources, customer } = this.props;
		
		payment.amount=paymentAmount
		payment.clearDues = true
		if (usePreviousBalance) {
			payment.useCredits = - customer.credits; // payment // receiving amount // so +ve
			payment.useBalance = - customer.balance;
		}

		if(totalAmount > payment.outstandingBalance)
		  payment.type = PAYMENT_TYPE.EXCESS
		if (isSaving) {
			return;
		}


		this.setState({ isSaving: true }, () => {
			invoiz
				.request(`${config.resourceHost}customer/${customer.id}/bulkPayment`, {
					method: 'POST',
					auth: true,
					data: payment
				})
				.then(() => {
					invoiz.page.showToast(resources.str_paymentSaveSuccessMessage);
					ModalService.close();
					onSave && onSave();
				})
				.catch(error => {
					if (error && error.statusCode === 401) {
						invoiz.page.showToast({ type: 'error', message: resources.str_paymentTimeoutMessage });
					} else {
						invoiz.page.showToast({ type: 'error', message: resources.str_paymentSaveErrorMessage });
					}

					ModalService.close();
				});
		});
	}

	hanldeAmountChange(value){
		let  {paymentAmount,totalAmount,usePreviousBalance, clearDues,isNormalPayment ,previousBalance} = this.state
		let {payment} = this.props

		   paymentAmount = accounting.unformat(value, config.currencyFormat.decimal);
		   if(paymentAmount < 0)
		   paymentAmount = 0

		   if(usePreviousBalance && paymentAmount >= payment.amount )
		     usePreviousBalance = false
		 
			 totalAmount = paymentAmount + ( usePreviousBalance ? previousBalance : 0 )
			 isNormalPayment =  totalAmount <= payment.amount  
	
			this.setState({ paymentAmount,totalAmount, clearDues, usePreviousBalance,isNormalPayment });
	}

	handlePreviousBalanceCheckbox(){
		
		let { usePreviousBalance, previousBalance,paymentAmount,totalAmount}=this.state
		let {payment} = this.props


		usePreviousBalance= !usePreviousBalance
		
		paymentAmount=usePreviousBalance
									?(previousBalance > paymentAmount ) ? 0 :paymentAmount - previousBalance
									:paymentAmount == 0 ? payment.amount : paymentAmount + previousBalance

		totalAmount=paymentAmount +( usePreviousBalance ? previousBalance : 0 )

		this.setState({usePreviousBalance,previousBalance,totalAmount,paymentAmount,isNormalPayment:true })
	}

	createPaymentView() {
		const { payment, resources,  invoiceOutstandingAmount } = this.props;
		let {  
			isSaving,paymentAmount,totalAmount,usePreviousBalance,previousBalance,duesAmount,isNormalPayment
            } = this.state;
		if (payment.date && payment.date instanceof Date) {
			// payment.date = moment(payment.date).format(config.dateFormat.api);
			payment.date = formatApiDate(payment.date);
		}

		return (
			<div>
				<div className="modal-base-headline">{resources.str_registerPayment}</div>

				<div className="row">
					<div className="col-xs-6">
						<div className="payment-create-label">{resources.openInvoiceBalance}</div>
						<div className="payment-create-value">{ formatCurrency (invoiceOutstandingAmount || 0)}</div>
					</div>

					<div className="col-xs-6">
						<div className="payment-create-label">{resources.previosDues}</div>
						<div className="payment-create-value">{ formatCurrency(duesAmount || 0 )}</div>
					</div>
				</div>


				<div className="row">
					<div className="col-xs-6">
						<DateInputComponent
							label={resources.str_dateOfReceiptPayment}
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
									 this.hanldeAmountChange(value)
								}
								
							}}
							label={resources.str_amountOfPayment}
						/>
					</div>
				</div>

				<div className="row">
					<div className="col-xs-12">
						<TextInputExtendedComponent
							name="notes"
							dataQsId="create-payment-notes"
							value={payment.notes || resources.bulkPaymentNoteText}
							label={resources.bulkPaymentNote}
							onChange={value => {
								payment.notes = value.trim();
							}}
						/>
					</div>
				</div>

				<div className="row">
				{
					( previousBalance > 0 ) &&

					<div className="col-xs-12 utilize-credits-balance">
			
{/* 						<div className="payment-create-label">{`Utilize`}</div> */}
		
							<CheckboxInputComponent
								name={'credits'}
								disabled={(previousBalance) <= 0}
								label={`Use available balance of ${formatCurrency(previousBalance )}`}
								checked={usePreviousBalance}
								
								onChange={() => {this.handlePreviousBalanceCheckbox()}}
							/>

				</div> 

				}
			
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
							buttonIcon={ isNormalPayment ? 'icon-check' : ''}
							dataQsId="createPayment-btn-save"
							loading={isSaving}
							disabled={totalAmount<=0}
							callback={() => {
								if (isNormalPayment) {
									this.payFull();
								} else {
                                   	this.continue();
								}
							}}
							label={isNormalPayment ? resources.str_toSave : resources.str_continue}
						/>
					</div>
				</div>
			</div>
		);
	}

	createDeviationView() {
		const { payment, resources } = this.props;
		const { isDeviationSet,previousBalance,usePreviousBalance, isSaving,totalAmount } = this.state;

	
		const isMore =totalAmount > payment.amount;
		let deviationAmount = totalAmount - payment.amount;

		let headerText ="Additional amount of "
		let subHeadingText="You have entered an excess amount"
		let messageText


		let extraAmount
		let reamingPreviousBalance

		if(usePreviousBalance)
		{
			extraAmount = deviationAmount
			reamingPreviousBalance = previousBalance > payment.amount ? previousBalance - payment.amount : 0
		}
		if(!( usePreviousBalance))
	    extraAmount = deviationAmount





		 if(extraAmount > 0)
		 {
			 headerText ="Excess amount of "
			 subHeadingText="You have entered an excess amount"
       		 messageText=`The excess payment of ${formatCurrency( extraAmount  )} can be used for upcoming invoices`
			 deviationAmount = extraAmount
		 }  
		
		 if(reamingPreviousBalance > 0)
		 {
			headerText ="Excess amount of "
			subHeadingText="You have entered an excess amount"
			messageText=`The excess amount of ${formatCurrency( deviationAmount || reamingPreviousBalance  )}  can be used for upcoming invoices`
		 }

		const element = isMore ? (
		<div className="payment-create-content">
			<div className="icon icon-coins_drop" />
			<div>{messageText}</div>
	
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
					{isMore ? <span>{headerText} </span> : resources.minAmountOfText}
					<span className="deviation-amount">{formatCurrency(deviationAmount)}</span>
					<div className="deviation-description text-placeholder">
						{isMore ? subHeadingText : resources.chooseFollowingOptionsText}
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

export default BulkPaymentModalComponent;
