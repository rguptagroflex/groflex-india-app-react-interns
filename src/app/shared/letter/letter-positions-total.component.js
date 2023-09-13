import invoiz from "services/invoiz.service";
import React from "react";
import RadioInputComponent from "shared/inputs/radio-input/radio-input.component";
import { formatCurrency, formatMoneySymbol } from "helpers/formatCurrency";
import Decimal from "decimal.js";
import CurrencyInputComponent from "shared/inputs/currency-input/currency-input.component";
import PercentageInputComponent from "shared/inputs/percentage-input/percentage-input.component";
import ButtonComponent from "shared/button/button.component";
import PopoverComponent from "shared/popover/popover.component";
import accounting from "accounting";
import config from "config";
class LetterPositionsTotalComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			editing: false,
			showDiscountPopoverPosition: null,
			popoverDiscountElementId: null,
			discountNumber: null,
			discountPercent: props.totalDiscount || 0,
			kind: props.priceKind,
			customerData: props.customerData || {},
			additionalCharges: props.additionalCharges,
			transaction: props.transaction,
		};
	}

	componentDidMount() {
		invoiz.on("documentClicked", () => this.onDocumentClick());
		const { discountPercent, discountNumber } = this.state;
		const { positions } = this.props;
		let totalNet = positions.reduce((a, b) => a + b.totalNetAfterDiscount, 0);
		let newDiscountNumber = totalNet * (discountPercent / 100);
		this.setState({ discountNumber: newDiscountNumber });
	}

	handleGstDetails(vatPercent, vatValue, vats) {
		const { customerData, resources } = this.props;
		const igstLable = resources.str_igst;
		const cgstLable = resources.str_cgst;
		const sgstLable = resources.str_sgst;
		if (customerData && customerData.indiaState && customerData.indiaState.id && invoiz.user.indiaStateId) {
			if (invoiz.user.indiaStateId === customerData.indiaState.id) {
				vats.push({ label: cgstLable, vatPercent: vatPercent / 2, value: vatValue / 2 });
				vats.push({ label: sgstLable, vatPercent: vatPercent / 2, value: vatValue / 2 });
			} else {
				vats.push({ label: igstLable, vatPercent, value: vatValue });
			}
		} else if (invoiz.user.indiaStateId) {
			vats.push({ label: cgstLable, vatPercent: vatPercent / 2, value: vatValue / 2 });
			vats.push({ label: sgstLable, vatPercent: vatPercent / 2, value: vatValue / 2 });
		}
		return vats;
	}

	componentWillReceiveProps(newProps) {
		if (newProps.isActiveComponentHasError) this.setState({ editing: false });
		if (newProps.activeComponent != "positionTotalComponent")
			this.setState({ editing: false, customerData: newProps.customerData, transaction: newProps.transaction });
	}

	showDiscountPopover(elementId) {
		this.setState({ popoverDiscountElementId: elementId }, () => {
			setTimeout(() => {
				this.refs["letter-positions-total-discount-popover"] &&
					this.refs["letter-positions-total-discount-popover"].show(true, 100);
			});
		});
	}

	onDiscountChange(value, name) {
		const { positions, resources } = this.props;
		let totalNet = positions.reduce((a, b) => a + b.totalNetAfterDiscount, 0);
		let discountNumber, discountPercent;
		if (name === "discountNumber") {
			discountNumber = value;
			discountPercent = new Decimal(((totalNet - (totalNet - value)) / totalNet) * 100).toDP(2).toNumber();

			if (discountPercent > 100 || discountPercent < 0)
				return invoiz.showNotification({
					message: resources.transactionDiscountPercentErrorMessage,
					type: "error",
				});

			if (discountNumber < 0 || discountPercent > 100)
				return invoiz.showNotification({
					message: resources.discountAmountError,
					type: "error",
				});
			this.setState(
				{
					popoverDiscountElementId: null,
					discountPercent: accounting.unformat(discountPercent, config.currencyFormat.decimal),
					discountNumber,
				},
				() => {
					this.props.onDiscountChange && this.props.onDiscountChange(this.state.discountPercent);
				}
			);
		} else if (name === "discountPercent") {
			discountPercent = value;
			discountNumber = totalNet * (discountPercent / 100);

			if (discountPercent > 100 || discountPercent < 0)
				return invoiz.showNotification({
					message: resources.transactionDiscountPercentErrorMessage,
					type: "error",
				});

			if (discountNumber < 0 || discountPercent > 100)
				return invoiz.showNotification({
					message: resources.discountAmountError,
					type: "error",
				});
			this.setState(
				{
					popoverDiscountElementId: null,
					discountPercent: accounting.unformat(discountPercent, config.currencyFormat.decimal),
					discountNumber,
				},
				() => {
					this.props.onDiscountChange && this.props.onDiscountChange(this.state.discountPercent);
				}
			);
		}
	}

	onChargesChange(value, name) {
		const { additionalCharges } = this.state;
		additionalCharges[name] = parseInt(value);
		this.setState({ additionalCharges }, () => {
			this.props.onChargesChange && this.props.onChargesChange(additionalCharges);
		});
	}

	render() {
		const { priceKind, positions, resources } = this.props;
		let {
			popoverDiscountElementId,
			discountNumber,
			discountPercent,
			customerData,
			additionalCharges,
			transaction,
		} = this.state;
		if (!priceKind || !positions) {
			return null;
		}
		let totalNet = 0;
		let totalGross = 0;
		let totalNetElement = null;
		let totalGrossElement = null;
		let totalElement = null;
		let discountedTotalNet = 0;
		let discountElement = null;
		let discountedTotalGross = 0;
		let vats = [];
		let additionalChargesElement = null;
		const vatOptions = invoiz.user.vatCodes;
		if (invoiz.user.isSmallBusiness || priceKind === "net") {
			totalNet = positions.reduce((a, b) => a + b.totalNetAfterDiscount, 0);
			discountedTotalNet =
				totalNet -
				totalNet * (discountPercent / 100) +
				Object.values(additionalCharges).reduce((a, b) => a + b, 0);
			totalNetElement = (
				<div className="letter-positions-total letter-positions-total-net">
					<div className="column-left">{resources.str_totalNet}</div>
					<div className="seperator-hyphen">-</div>
					<div className="column-right">
						{transaction.baseCurrency
							? formatMoneySymbol(totalNet, transaction.baseCurrency)
							: formatCurrency(totalNet)}
					</div>
				</div>
			);
			discountElement = (
				<div className="letter-positions-total letter-positions-total-net">
					<div className="column-left">{resources.additionalDiscount}</div>
					<div className="seperator-hyphen">-</div>
					<div className="column-discount-right">
						<div
							id={`letter-positions-discount-popover`}
							onClick={(ev) => {
								this.onStartEditing(ev);
								// this.showDiscountPopover(`letter-positions-discount-popover`);
							}}
						>
							<span>{discountPercent + "%"}</span>
						</div>
					</div>
				</div>
			);
			additionalChargesElement = (
				<div>
					<div className="letter-positions-total letter-positions-total-net">
						<div className="column-left">{`Service charge`}</div>
						<div className="seperator-hyphen">-</div>
						{/* <div className="column-currency-right"> */}
						<CurrencyInputComponent
							willReceiveNewValueProps={true}
							name="serviceCharge"
							value={parseInt(additionalCharges.serviceCharge)}
							selectOnFocus={true}
							onBlur={(value) => this.onChargesChange(value, "serviceCharge")}
							currencyTotal={true}
							currencyType={`symbol`}
							currencyCode={transaction.baseCurrency}
						/>
						{/* </div> */}
					</div>
					<div className="letter-positions-total letter-positions-total-net">
						<div className="column-left">{`Shipping charge`}</div>
						<div className="seperator-hyphen">-</div>
						{/* <div className="column-currency-right"> */}
						<CurrencyInputComponent
							willReceiveNewValueProps={true}
							name="shippingCharge"
							value={parseInt(additionalCharges.shippingCharge)}
							selectOnFocus={true}
							onBlur={(value) => this.onChargesChange(value, "shippingCharge")}
							currencyTotal={true}
							currencyType={`symbol`}
							currencyCode={transaction.baseCurrency}
						/>
						{/* </div> */}
					</div>
				</div>
			);
			discountElement = (
				<div className="letter-positions-total letter-positions-total-net">
					<div className="column-left">{resources.additionalDiscount}</div>
					<div className="seperator-hyphen">-</div>
					<div className="column-discount-right">
						<div
							id={`letter-positions-discount-popover`}
							onClick={(ev) => {
								this.onStartEditing(ev);
								// this.showDiscountPopover(`letter-positions-discount-popover`);
							}}
						>
							<span>{discountPercent + "%"}</span>
						</div>
					</div>
				</div>
			);
			let vatValue = null;
			positions &&
				positions.length !== 0 &&
				vatOptions.map((vatObj) => {
					vatValue = positions
						.filter((pos) => pos.vatPercent === vatObj.value)
						.reduce(
							(a, b) =>
								b.totalNetAfterDiscount
									? new Decimal(b.totalNetAfterDiscount)
											.mul(vatObj.value)
											.div(100)
											.add(a)
											.toDP(2)
											.toNumber()
									: a,
							0
						);
					if (vatValue > 0) {
						vats = this.handleGstDetails(vatObj.value, vatValue, vats);
					}
				});
			const totalValue = invoiz.user.isSmallBusiness
				? discountedTotalNet
				: discountedTotalNet + vats.reduce((a, b) => a + b.value, 0);
			totalElement = (
				<div className="last-letter-positions-total-container">
					<div className="letter-positions-total">
						<div className="column-left">{resources.str_total}</div>
						<div className="seperator-hyphen">-</div>
						<div className="column-right">
							{customerData && customerData.baseCurrency
								? formatMoneySymbol(totalValue, transaction.baseCurrency)
								: formatCurrency(totalValue)}
						</div>
					</div>
				</div>
			);
		} else {
			totalGross = positions.reduce((a, b) => a + b.totalGrossAfterDiscount, 0);
			totalNet = positions.reduce((a, b) => a + b.totalNetAfterDiscount, 0);
			discountedTotalNet = totalNet - totalNet * (discountPercent / 100);
			if (customerData && customerData.countryIso === "IN") {
				//discountedTotalNet = totalNet - totalNet * (discountPercent / 100);
				discountedTotalNet =
					totalNet -
					totalNet * (discountPercent / 100) +
					Object.values(additionalCharges).reduce((a, b) => a + b, 0);
				let totalNetVat = null;
				positions &&
					positions.length !== 0 &&
					vatOptions.map((vatObj) => {
						totalNetVat = positions
							.filter((pos) => pos.vatPercent === vatObj.value)
							.reduce(
								(a, b) =>
									a +
									(b.totalGrossAfterDiscount -
										b.totalGrossAfterDiscount / ((100 + vatObj.value) / 100)),
								0
							);
						const vatValue = new Decimal(totalNetVat).toDP(2).toNumber();
						if (vatValue > 0) {
							this.handleGstDetails(vatObj.value, vatValue, vats);
						}
					});
			}
			discountElement = (
				<div className="letter-positions-total letter-positions-total-net">
					<div className="column-left">{resources.additionalDiscount}</div>
					<div className="seperator-hyphen">-</div>
					<div className="column-discount-right">
						<div
							id={`letter-positions-discount-popover`}
							onClick={() => {
								this.showDiscountPopover(`letter-positions-discount-popover`);
							}}
						>
							<span>{discountPercent + "%"}</span>
						</div>
					</div>
				</div>
			);
			additionalChargesElement = (
				<div>
					<div className="letter-positions-total letter-positions-total-net">
						<div className="column-left">{`Service charge`}</div>
						<div className="seperator-hyphen">-</div>
						{/* <div className="column-currency-right"> */}
						<CurrencyInputComponent
							willReceiveNewValueProps={true}
							name="serviceCharge"
							value={parseInt(additionalCharges.serviceCharge)}
							selectOnFocus={true}
							onBlur={(value) => this.onChargesChange(value, "serviceCharge")}
							currencyTotal={true}
							currencyType={`symbol`}
							currencyCode={this.state.customerData ? transaction.baseCurrency : ""}
						/>
						{/* </div> */}
					</div>
					<div className="letter-positions-total letter-positions-total-net">
						<div className="column-left">{`Shipping charge`}</div>
						<div className="seperator-hyphen">-</div>
						{/* <div className="column-currency-right"> */}
						<CurrencyInputComponent
							willReceiveNewValueProps={true}
							name="shippingCharge"
							value={parseInt(additionalCharges.shippingCharge)}
							selectOnFocus={true}
							onBlur={(value) => this.onChargesChange(value, "shippingCharge")}
							currencyTotal={true}
							currencyType={`symbol`}
							currencyCode={this.state.customerData && this.state.customerData.baseCurrency}
						/>
						{/* </div> */}
					</div>
				</div>
			);
			discountedTotalGross = discountedTotalNet + vats.reduce((a, b) => a + b.value, 0);
			totalGrossElement = (
				<div className="last-letter-positions-total-container">
					<div className="letter-positions-total">
						<div className="column-left">{resources.str_total}</div>
						<div className="seperator-hyphen">-</div>
						<div className="column-right">
							{customerData && customerData.baseCurrency
								? formatMoneySymbol(totalNet, customerData.baseCurrency)
								: formatCurrency(discountedTotalGross)}
						</div>
					</div>
				</div>
			);
		}

		const vatElements = vats.map((vatObj) => {
			return (
				<div className="letter-positions-vat" key={`letter-positions-vat-${vatObj.vatPercent}-${vatObj.label}`}>
					<div className="column-left">
						{priceKind === "net" ? "" : resources.str_contains} {vatObj.label} {vatObj.vatPercent}%
					</div>
					<div className="seperator-hyphen">-</div>
					<div className="column-right">{formatCurrency(vatObj.value)}</div>
				</div>
			);
		});

		const discountPopoverHtml = !discountElement ? null : (
			<div className="discount-popover-content">
				<div className="discount-inputs">
					<PercentageInputComponent
						name="discountPercent"
						value={parseInt(discountPercent)}
						selectOnFocus={true}
						label={`Percentage`}
						onBlur={(value) => this.onDiscountChange(value, "discountPercent")}
					/>
					<CurrencyInputComponent
						willReceiveNewValueProps={true}
						name="discountNumber"
						label={`Amount`}
						value={parseInt(discountNumber)}
						selectOnFocus={true}
						onBlur={(value) => this.onDiscountChange(value, "discountNumber")}
						currencyType={`symbol`}
						currencyCode={transaction.baseCurrency}
					/>
				</div>
			</div>
		);
		return (
			<div className={`letter-positions-total-component`}>
				{popoverDiscountElementId ? (
					<PopoverComponent
						ref={`letter-positions-total-discount-popover`}
						offsetTop={15}
						fixedHeight={80}
						fixedWidth={240}
						elementId={popoverDiscountElementId}
						html={discountPopoverHtml}
						onPopoverHide={() => {
							this.setState({ popoverDiscountElementId: null });
						}}
					/>
				) : null}
				<div
					// className={`letter-positions-total-content ${invoiz.user.isSmallBusiness ? "" : "outlined"}`}
					// onClick={(ev) => this.onStartEditing(ev)}
					className={`letter-positions-total-content`}
				>
					{/* <span className="edit-icon" /> */}
					{/* {invoiz.user.isSmallBusiness ? null : this.state.editing ? (  */}
					{customerData && customerData.countryIso === "IN" ? (
						<div className="letter-positions-radio">
							{/* <RadioInputComponent
								useCustomStyle={true}
								value={priceKind}
								options={[
									{ value: "gross", label: resources.str_gross },
									{ value: "net", label: resources.str_net },
								]}
								onChange={(value) => {
									this.onChange(value);
									console.log(value, "VSALUE");
									console.log(priceKind, "PRICE KIND");
								}}
							/> */}
							<div
								onClick={() => {
									this.onChange("gross");
								}}
								className={`total-option ${priceKind === "gross" ? "total-active" : ""}`}
							>
								Gross
							</div>
							<div
								onClick={() => {
									this.onChange("net");
								}}
								className={`total-option ${priceKind === "net" ? "total-active" : ""}`}
							>
								Net
							</div>
						</div>
					) : null}
					{/* ) : null} */}
					{priceKind === "gross" ? discountElement : null}
					{!invoiz.user.isSmallBusiness && totalNetElement}
					{!invoiz.user.isSmallBusiness && totalGrossElement}
					{priceKind === "net" ? discountElement : null}
					{priceKind === "net" ? additionalChargesElement : null}
					{!invoiz.user.isSmallBusiness || transaction.baseCurrency === "" ? vatElements : null}
					{priceKind === "gross" ? additionalChargesElement : null}
					{totalElement}
				</div>
			</div>
		);
	}

	onDocumentClick() {
		if (this.state.editing) {
			this.setState({ editing: false });
		}
	}

	onStartEditing(ev) {
		const e = ev.nativeEvent;
		e.stopPropagation();
		e.stopImmediatePropagation();

		if (!this.props.isActiveComponentHasError) {
			if (this.props.activeComponentAction !== undefined) {
				this.props.activeComponentAction("positionTotalComponent");
			}

			if (!this.state.editing) {
				this.showDiscountPopover(`letter-positions-discount-popover`);
				this.setState({ editing: true });
			}
		}
	}

	onChange(value) {
		//this.setState({discountNumber: 0, discountPercent: 0}, () => {
		this.props.onChange && this.props.onChange(value);
		//})
	}
}

export default LetterPositionsTotalComponent;
