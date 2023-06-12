import React from "react";
import invoiz from "services/invoiz.service";
import config from "config";
import ModalService from "services/modal.service";
import ButtonComponent from "shared/button/button.component";
import { formatCurrency, formatMoneySymbol } from "helpers/formatCurrency";
import { formatMoneyCode } from "helpers/formatMoney";
// import moment from 'moment';
import accounting from "accounting";
import CurrencyInputComponent from "shared/inputs/currency-input/currency-input.component";
import DateInputComponent from "shared/inputs/date-input/date-input.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import { formatApiDate } from "helpers/formatDate";
import CheckboxInputComponent from "shared/inputs/checkbox-input/checkbox-input.component";
import SelectInput from "../inputs/select-input/select-input.component";
import userPermissions from 'enums/user-permissions.enum';

const PAYMENT_TYPE = {
	PAYMENT: "payment",
	CREDIT: "credit",
	SURCHARGE: "surcharge",
	SETTLE: "settle",
	PARTIAL: "partial",
	DISCOUNT: "discount",
	BANKCHARGE: "bankcharge",
	TDS_CHARGE: "tdscharge",
	CREDITS: "creditsAdjusted",
	BALANCE: "balanceAdjusted",
	EXCESS: "excessAmount",
	EXCHANGE_GAIN: "exchangegain",
	EXCHANGE_LOSS: "exchangeloss",
};

const getTotalDues = (customer) => (customer && customer.openingBalance > 0 ? customer.openingBalance : 0);
// credits & balance are -ve
const getTotalPreviousBalance = (customer) =>
	customer
		? Math.abs(customer.credits + customer.balance + (customer.openingBalance < 0 ? customer.openingBalance : 0))
		: 0;
class PaymentCreateModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isDeviation: false,
			isDeviationSet: false,
			isSaving: false,
			isValid: this.props.payment.amount > 0,

			paymentAmount: this.props.payment.amount,
			totalAmount: this.props.payment.amount,
			requiredPaymentAmount: this.props.payment.amount,
			isNormalPayment: true,

			//---------
			hasDues: this.props.customer && this.props.customer.openingBalance > 0,
			totalDues: getTotalDues(this.props.customer),
			remaingDues: getTotalDues(this.props.customer), // total Dues
			clearingDues: 0,
			isClearingDues: false,

			//-----------
			previousBalance: getTotalPreviousBalance(this.props.customer),
			reamingPreviousBalance: getTotalPreviousBalance(this.props.customer),
			usingPreviousBalance: 0, // to track..how much previousBalance is using
			isUsingPreviousBalance: false,

			//isValid: false,
			//payment methods stuff
			paymentMethodList: [],
			bankDetailId: null,
			canViewExpense: false,
		};
		this.hanldeAmountChange = this.hanldeAmountChange.bind(this);
		this.handleUsingPreviousBalanceChange = this.handleUsingPreviousBalanceChange.bind(this);
	}

	componentDidMount() {
		invoiz.request(`${config.resourceHost}bank`, { auth: true }).then((response) => {
			const { body } = response;
			let paymentMethodList = [];
			if(body && body.data && body.data.length === 0) {
				invoiz.page.showToast({ type: "error", message: 'Please create Cash and Bank first' });
			}
			if (body && body.data && body.data.length > 0) {
				paymentMethodList = body.data.map((item) => {
					return { label: item.bankName, value: item.id };
				});
			}
			// console.log(paymentMethodList, "LISt OF PAYMENT METHODS as NEEDED");
			this.setState({ ...this.state, paymentMethodList });
		});
		this.setState({
			canViewExpense: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_EXPENSE),
		});
	}

	render() {
		const { isDeviation } = this.state;
		let element = null;
		if (isDeviation) {
			element = this.createDeviationView();
		} else {
			element = this.createPaymentView();
		}
		console.log(this.state);

		return element;
	}

	continue() {
		this.setState({ isDeviation: true });
	}

	payFull() {
		const { payment } = this.props;
		payment.type = PAYMENT_TYPE.PAYMENT;
		this.save();
	}

	setDeviation(paymentType) {
		const { payment } = this.props;
		payment.type = paymentType;
		this.setState({ isDeviationSet: true });
	}

	save() {
		const { isSaving, totalAmount, isUsingPreviousBalance, isClearingDues, paymentAmount, usingPreviousBalance, canViewExpense } =
			this.state;
		const { payment, onSave, resources, customer } = this.props;

		payment.amount = paymentAmount;
		payment.clearDues = isClearingDues;
		// payment.type = payment.type.includes('exchange') ? payment.type : totalAmount > payment.outstandingBalance ? PAYMENT_TYPE.EXCESS :payment.type
		payment.financialAccounting = payment.type;

		if (isUsingPreviousBalance) {
			// credits + debits = usingPreviousBalance
			let availableCredits = Math.abs(customer.credits);
			let difference = parseFloat(accounting.toFixed(usingPreviousBalance - availableCredits, 2));
			if (difference < 0) {
				// credits are more than usingPreviousBalance
				payment.useCredits = usingPreviousBalance;
				payment.useBalance = 0;
			} else {
				payment.useCredits = Math.abs(customer.credits);
				payment.useBalance = difference;
			}
		} else {
			payment.useCredits = 0;
			payment.useBalance = 0;
		}

		if (isSaving) {
			return;
		}
		if (canViewExpense) {
			if (!this.state.bankDetailId) {
				invoiz.page.showToast({type: "error", message: "Please select payment method"});
				return;
			}
			payment.bankDetailId = this.state.bankDetailId;
		}
		
		this.setState({ isSaving: true }, () => {
			invoiz
				.request(`${config.resourceHost}invoice/${payment.invoiceId}/payment`, {
					method: "POST",
					auth: true,
					data: payment,
				})
				.then(() => {
					invoiz.page.showToast(resources.str_paymentSaveSuccessMessage);
					ModalService.close();
					onSave && onSave();
				})
				.catch((error) => {
					if (error && error.statusCode === 401) {
						invoiz.page.showToast({ type: "error", message: resources.str_paymentTimeoutMessage });
					} else {
						invoiz.page.showToast({ type: "error", message: resources.str_paymentSaveErrorMessage });
					}

					ModalService.close();
				});
		});
	}

	hanldeAmountChange(value) {
		let {
			paymentAmount,
			totalAmount,
			requiredPaymentAmount,
			usingPreviousBalance,
			isClearingDues,
			clearingDues,
			isNormalPayment,
		} = this.state;
		let { payment } = this.props;

		paymentAmount = accounting.unformat(value, config.currencyFormat.decimal);
		if (paymentAmount < 0) paymentAmount = 0;

		totalAmount = parseFloat(accounting.toFixed(paymentAmount + usingPreviousBalance, 2));

		if (isClearingDues) {
			if (totalAmount <= payment.outstandingBalance) {
				isClearingDues = false;
				clearingDues = 0;
				requiredPaymentAmount = payment.outstandingBalance;
			}
		}
		isNormalPayment = totalAmount === requiredPaymentAmount;
		this.setState({
			paymentAmount,
			totalAmount,
			isClearingDues,
			clearingDues,
			isNormalPayment,
			requiredPaymentAmount,
		});
	}
	handlePreviousBalanceCheckbox() {
		let {
			isUsingPreviousBalance,
			previousBalance,
			usingPreviousBalance,
			reamingPreviousBalance,
			paymentAmount,
			totalAmount,
			isNormalPayment,
			requiredPaymentAmount,
		} = this.state;

		isUsingPreviousBalance = !isUsingPreviousBalance;

		if (isUsingPreviousBalance) {
			usingPreviousBalance = paymentAmount;
			if (usingPreviousBalance > previousBalance) usingPreviousBalance = previousBalance;
			if (usingPreviousBalance > requiredPaymentAmount) usingPreviousBalance = requiredPaymentAmount;

			paymentAmount = parseFloat(accounting.toFixed(paymentAmount - usingPreviousBalance, 2));
			reamingPreviousBalance = parseFloat(accounting.toFixed(previousBalance - usingPreviousBalance, 2));
		} else {
			paymentAmount = parseFloat(accounting.toFixed(paymentAmount + usingPreviousBalance, 2));
			usingPreviousBalance = 0;
			reamingPreviousBalance = previousBalance;
		}
		totalAmount = parseFloat(accounting.toFixed(paymentAmount + usingPreviousBalance, 2));
		isNormalPayment = totalAmount === requiredPaymentAmount;
		this.setState({
			isUsingPreviousBalance,
			usingPreviousBalance,
			reamingPreviousBalance,
			totalAmount,
			paymentAmount,
			isNormalPayment,
		});
	}
	handleUsingPreviousBalanceChange(value) {
		let {
			usingPreviousBalance,
			totalAmount,
			reamingPreviousBalance,
			previousBalance,
			paymentAmount,
			isNormalPayment,
			requiredPaymentAmount,
		} = this.state;
		usingPreviousBalance = accounting.unformat(value, config.currencyFormat.decimal);
		if (usingPreviousBalance < 0) usingPreviousBalance = 0;

		if (usingPreviousBalance > previousBalance) usingPreviousBalance = previousBalance;

		if (usingPreviousBalance > requiredPaymentAmount) usingPreviousBalance = requiredPaymentAmount;

		paymentAmount = parseFloat(accounting.toFixed(requiredPaymentAmount - usingPreviousBalance, 2));
		reamingPreviousBalance = parseFloat(accounting.toFixed(previousBalance - usingPreviousBalance, 2));

		if (paymentAmount < 0) paymentAmount = 0;

		totalAmount = parseFloat(accounting.toFixed(paymentAmount + usingPreviousBalance, 2));
		isNormalPayment = totalAmount === requiredPaymentAmount;

		this.setState({ usingPreviousBalance, paymentAmount, totalAmount, reamingPreviousBalance, isNormalPayment });
	}
	hanldeClearDuesCheckbox() {
		let {
			totalDues,
			isClearingDues,
			clearingDues,
			paymentAmount,
			totalAmount,
			requiredPaymentAmount,
			isNormalPayment,
			usingPreviousBalance,
		} = this.state;
		let { payment } = this.props;

		isClearingDues = !isClearingDues;

		if (isClearingDues) {
			clearingDues = totalDues;
			paymentAmount = parseFloat(accounting.toFixed(paymentAmount + clearingDues, 2)); // may be manually entered
		} else {
			paymentAmount = parseFloat(accounting.toFixed(paymentAmount - clearingDues, 2));
			clearingDues = 0;
		}
		requiredPaymentAmount = parseFloat(accounting.toFixed(payment.outstandingBalance + clearingDues, 2));
		totalAmount = parseFloat(accounting.toFixed(paymentAmount + usingPreviousBalance, 2));
		isNormalPayment = totalAmount === requiredPaymentAmount;

		this.setState({
			isClearingDues,
			clearingDues,
			totalAmount,
			paymentAmount,
			isNormalPayment,
			requiredPaymentAmount,
		});
	}
	handleClearingDuesBalanceChange(value) {
		// not in use
		let { clearingDues, paymentAmount } = this.state;
		clearingDues = accounting.unformat(value, config.currencyFormat.decimal);
		if (clearingDues < 0) clearingDues = 0;
		paymentAmount = parseFloat(accounting.toFixed(paymentAmount - usingPreviousBalance, 2));
		this.setState({ clearingDues });
	}

	createPaymentView() {
		const { payment, dunning, resources, invoice } = this.props;
		let {
			isNormalPayment,
			isSaving,
			paymentAmount,
			isUsingPreviousBalance,
			previousBalance,
			usingPreviousBalance,
			totalAmount,
			isClearingDues,
			clearingDues,
			totalDues,
			hasDues,
			canViewExpense
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
						<div className="payment-create-label">{resources.outstandingBalanceText}</div>
						<div className="payment-create-value">{formatCurrency(payment.outstandingBalance)}</div>
					</div>
					{canViewExpense ? (
						<div className="col-xs-6">
						<SelectInput
							allowCreate={false}
							notAsync={true}
							loadedOptions={this.state.paymentMethodList}
							value={this.state.bankDetailId}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Payment method",
								handleChange: (option) => {
									this.setState({ ...this.state, bankDetailId: option.value });
								},
							}}
						/>
					</div>
					) : null}
					
					{invoice.exchangeRate && invoice.baseCurrency ? (
						<div className="col-xs-6">
							<div className="payment-create-label">{`Invoice amount (1 ${
								invoice.baseCurrency
							} = ${formatMoneyCode(invoice.exchangeRate)})`}</div>
							<div className="payment-create-value">
								{`${formatMoneySymbol(
									invoice.outstandingAmount / invoice.exchangeRate,
									invoice.baseCurrency
								)} ( ${formatCurrency(invoice.outstandingAmount)} )`}
							</div>
						</div>
					) : null}
				</div>

				{hasDues && (
					<div className="row">
						{isClearingDues && false ? (
							<div className="col-xs-12 utilize-credits-balance">
								<div className="inline-checkbox-curreny-input ">
									<CheckboxInputComponent
										name={"dues"}
										label={`Clear`}
										checked={isClearingDues}
										onChange={() => {
											this.hanldeClearDuesCheckbox();
										}}
									/>
									<div className="curreny-input">
										<CurrencyInputComponent
											willReceiveNewValueProps={true}
											name="usingPreviousBalance"
											value={clearingDues}
											//onBlur={(value) => this.onPriceChange(position, value)}
											onBlur={(value) => {
												if (value !== "") this.handleClearingDuesBalanceChange(value);
											}}
											currencyType={`symbol`}
										/>
									</div>
									<div className="post-text">{`of previous dues ${formatCurrency(totalDues)}`} </div>
								</div>
							</div>
						) : (
							<div className="col-xs-8 utilize-credits-balance">
								<CheckboxInputComponent
									name={"dues"}
									label={`Clear the previous dues ${formatCurrency(totalDues)}`}
									checked={isClearingDues}
									onChange={() => {
										this.hanldeClearDuesCheckbox();
									}}
								/>
							</div>
						)}
					</div>
				)}

				{previousBalance > 0 && (
					<div className="row">
						{isUsingPreviousBalance ? (
							<div className="col-xs-12 utilize-credits-balance">
								<div className="inline-checkbox-curreny-input ">
									<CheckboxInputComponent
										name={"credits"}
										label={`Use`}
										checked={isUsingPreviousBalance}
										onChange={() => {
											this.handlePreviousBalanceCheckbox();
										}}
									/>
									<div className="curreny-input">
										<CurrencyInputComponent
											willReceiveNewValueProps={true}
											name="usingPreviousBalance"
											value={usingPreviousBalance}
											//onBlur={(value) => this.onPriceChange(position, value)}
											selectOnFocus={true}
											onBlur={(value) => {
												if (value !== "") this.handleUsingPreviousBalanceChange(value);
											}}
											currencyType={`symbol`}
										/>
									</div>
									<div className="post-text">
										{`of the previous balance ${formatCurrency(previousBalance)}`}{" "}
									</div>
								</div>
							</div>
						) : (
							<div className="col-xs-7 utilize-credits-balance">
								<CheckboxInputComponent
									name={"credits"}
									label={`Use available balance of ${formatCurrency(previousBalance)}`}
									checked={isUsingPreviousBalance}
									onChange={() => {
										this.handlePreviousBalanceCheckbox();
									}}
								/>
							</div>
						)}
					</div>
				)}

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
							value={paymentAmount}
							selectOnFocus={true}
							willReceiveNewValueProps={true}
							onBlur={(value) => {
								if (value !== "") this.hanldeAmountChange(value);
							}}
							/* 	onChange={value => {
								if (value!=='') 
									 this.hanldeAmountChange(value)

								}
							} */

							label={resources.str_paymentAmount}
						/>
					</div>
				</div>

				<div className="row">
					<div className="col-xs-12">
						<TextInputExtendedComponent
							name="notes"
							dataQsId="create-payment-notes"
							value={payment.notes}
							label={resources.str_note}
							onChange={(value) => {
								payment.notes = value.trim();
							}}
						/>
					</div>
				</div>

				{(isUsingPreviousBalance > 0 || isClearingDues) && false && (
					<div className="row">
						<div className="col-xs-6">
							<div className="payment-create-value">{`Total payment amount: ${formatCurrency(
								totalAmount
							)}`}</div>
						</div>
					</div>
				)}

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
							buttonIcon={isNormalPayment ? "icon-check" : ""}
							//buttonIcon={payment.amount === payment.outstandingBalance ? "icon-check" : ""}
							dataQsId="createPayment-btn-save"
							loading={isSaving}
							disabled={totalAmount <= 0}
							callback={() => {
								if (isNormalPayment) {
									this.payFull();
								} else {
									this.continue();
								}
							}}
							// label={  isNormalPayment ? resources.str_toSave : resources.str_continue}
							label={
								// payment.amount === payment.outstandingBalance
								isNormalPayment ? resources.str_toSave : resources.str_continue
							}
						/>
					</div>
				</div>
			</div>
		);
	}

	createDeviationView() {
		const { payment, resources, invoice } = this.props;
		let { isDeviationSet, requiredPaymentAmount, isSaving, totalAmount } = this.state;

		let headerPreText = "Excess amount of ";
		let headerDisplayAmount = Math.abs(totalAmount - requiredPaymentAmount);
		let subHeadingText = "You have entered an excess amount";
		let messageText = (messageText = `The excess payment of ${formatCurrency(
			headerDisplayAmount
		)} can be used for upcoming invoices`);

		let deviationType = "MORE";

		if (totalAmount > requiredPaymentAmount) deviationType = "MORE";
		else deviationType = "LESS";

		if (deviationType === "MORE" && invoice.baseCurrency && invoice.exchangeRate)
			deviationType = "MORE_EXCHANGE_GAIN";

		if (deviationType === "LESS" && invoice.baseCurrency && invoice.exchangeRate)
			deviationType = "LESS_EXCHANGE_LOSS";

		const isMore = deviationType.includes("MORE");

		switch (deviationType) {
			case "MORE": {
				headerPreText = "Excess amount of ";
				subHeadingText = "You have entered an excess amount";
				messageText = `The excess payment of ${formatCurrency(
					headerDisplayAmount
				)} can be used for upcoming invoices`;
				break;
			}
			case "MORE_EXCHANGE_GAIN": {
				headerPreText = "Excess amount of ";
				subHeadingText = "You have entered an excess amount";
				messageText = `The excess payment of ${formatCurrency(
					headerDisplayAmount
				)} can be used for upcoming invoices`;
				break;
			}

			default:
				break;
		}

		const element = isMore ? (
			<div className="payment-create-content">
				{deviationType === "MORE_EXCHANGE_GAIN" ? (
					<div>
						<div className="icon icon-exchange_gain" />
						<div>{resources.excessAmountTreatedExchangeGain}</div>
					</div>
				) : (
					<div>
						<div className="icon icon-coins_drop" />
						<div>{messageText}</div>
					</div>
				)}
			</div>
		) : (
			<div className="payment-deviation-choices">
				<div className="">
					<div
						className={`payment-deviation-choice ${
							isDeviationSet && payment.type === PAYMENT_TYPE.PARTIAL ? "active" : ""
						}`}
						onClick={() => this.setDeviation(PAYMENT_TYPE.PARTIAL)}
					>
						<div className="icon icon-coins" />
						<div className="payment-deviation-choice-title">{resources.treatPartialPaymentText}</div>
						<div className="payment-deviation-choice-description">
							{resources.billingStatusPartiallyPaid}
						</div>
					</div>

					<div
						className={`payment-deviation-choice ${
							isDeviationSet && payment.type === PAYMENT_TYPE.DISCOUNT ? "active" : ""
						}`}
						onClick={() => this.setDeviation(PAYMENT_TYPE.DISCOUNT)}
					>
						<div className="icon icon-percent" />
						<div className="payment-deviation-choice-title">{resources.treatAsDiscount}</div>
						<div className="payment-deviation-choice-description">{resources.billingStatusFullyPaid}</div>
					</div>
				</div>
				<div className="">
					<div
						className={`payment-deviation-choice ${
							isDeviationSet && payment.type === PAYMENT_TYPE.BANKCHARGE ? "active" : ""
						}`}
						onClick={() => this.setDeviation(PAYMENT_TYPE.BANKCHARGE)}
					>
						<div className="icon icon-bank" />
						<div className="payment-deviation-choice-title">{resources.treatAsBankFee}</div>
						<div className="payment-deviation-choice-description">{resources.billingStatusFullyPaid}</div>
					</div>
					{deviationType === "LESS_EXCHANGE_LOSS" ? (
						<div
							className={`payment-deviation-choice ${
								isDeviationSet && payment.type === PAYMENT_TYPE.EXCHANGE_LOSS ? "active" : ""
							}`}
							onClick={() => this.setDeviation(PAYMENT_TYPE.EXCHANGE_LOSS)}
						>
							<div className="icon icon-exchange_loss2" />
							<div className="payment-deviation-choice-title">{resources.treatAsLossExchange}</div>
							<div className="payment-deviation-choice-description">
								{resources.billingStatusFullyPaid}
							</div>
						</div>
					) : (
						<div
							className={`payment-deviation-choice ${
								isDeviationSet && payment.type === PAYMENT_TYPE.TDS_CHARGE ? "active" : ""
							}`}
							onClick={() => this.setDeviation(PAYMENT_TYPE.TDS_CHARGE)}
						>
							<div className="icon icon-tds" />
							<div className="payment-deviation-choice-title">{resources.treatAsTDS}</div>
							<div className="payment-deviation-choice-description">
								{resources.billingStatusFullyPaid}
							</div>
						</div>
					)}
				</div>
			</div>
		);

		return (
			<div>
				<div className="modal-base-headline">
					{/* {isMore ? <span>{resources.AadditionalAmountOfText } </span> : resources.minAmountOfText} */}
					{isMore ? <span>{headerPreText} </span> : resources.minAmountOfText}

					<span className="deviation-amount">
						{formatCurrency(headerDisplayAmount)}
						{!isMore ? <span style={{ color: "black" }}>{` as: `}</span> : ``}
					</span>
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
									// this.setDeviation(PAYMENT_TYPE.EXCESS);
									this.setDeviation(
										invoice.baseCurrency && invoice.exchangeRate
											? PAYMENT_TYPE.EXCHANGE_GAIN
											: PAYMENT_TYPE.EXCESS
									);
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

export default PaymentCreateModalComponent;
