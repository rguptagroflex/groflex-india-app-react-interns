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

class ClearDuesModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isDeviation: false,
			isDeviationSet: false,
			isSaving: false,
			isValid: this.props.payment.amount > 0,
			paymentAmount:this.props.payment.amount,
			dueAmount:this.props.customer?( this.props.customer.balance < 0 ? -this.props.customer.balance:0) :0
		};
	}

	componentDidMount() {
	
	}

	render() {
        let element = this.createPaymentView();

		return element;
	}

	payFull() {
		const { payment } = this.props;
		payment.type = PAYMENT_TYPE.PAYMENT;
		this.save();
	}


	save() {
		const { isSaving,paymentAmount,dueAmount } = this.state;
		const { payment, onSave, resources, customer } = this.props;
		
		if (isSaving) {
			return;
		}
		payment.financialAccounting = payment.type;
	
		this.setState({ isSaving: true }, () => {
			invoiz
				.request(`${config.resourceHost}customer/${customer.id}/clearDues`, {
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

	createPaymentView() {
		const { payment, dunning, resources, skipAndContinue } = this.props;
		let {  isSaving,paymentAmount,dueAmount } = this.state;
		if (payment.date && payment.date instanceof Date) {
			// payment.date = moment(payment.date).format(config.dateFormat.api);
			payment.date = formatApiDate(payment.date);
		}

		return (
			<div>
				<div className="modal-base-headline">{resources.str_clearDues}</div>

				<div className="row">

					<div className="col-xs-6">
						<div className="payment-create-label">{resources.dueAmount}</div>
						<div className="payment-create-value">{ formatCurrency(dueAmount)}</div>
					</div>
				</div>

				<div className="row">
					<div className="col-xs-12">
						{dunning ? (
							<div className="payment-create-dunning-hint">
								{resources.invoiceInDunningStageText} <b>{dunning.label}</b>
								<span className="payment-create-dunning-charge">
									({resources.str_dunningCharge}:{formatCurrency(dunning.charge)})
								</span>
							</div>
						) : null}
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
							
							
							onChange={value => {
								if (value!=='') {
									// payment.amount = accounting.unformat(value, ',');
									paymentAmount = accounting.unformat(value, config.currencyFormat.decimal);
								 	payment.amount=paymentAmount
								}
								
								this.setState({ isValid:paymentAmount > 0,paymentAmount });
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
							value={payment.notes}
							label={resources.duesNote}
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
							dataQsId="createPayment-btn-confirm"
							callback={() => {
                                ModalService.close();
                                skipAndContinue()
                            }}
						
							label={'Skip'}
						/>
					</div>

					<div className="modal-base-confirm">
						<ButtonComponent
							buttonIcon={paymentAmount > 0 ? 'icon-check' : ''}
							dataQsId="createPayment-btn-save"
							loading={isSaving}
							disabled={paymentAmount<=0}
							callback={() => {
                                this.payFull();
								// this.continue();
							}}
							label={ 'Pay Dues' }
						/>
					</div>
				</div>
			</div>
		);
	}

	
}

export default ClearDuesModalComponent;
