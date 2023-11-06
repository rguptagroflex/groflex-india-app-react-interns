import React from "react";
import ModalService from "services/modal.service";
import ButtonComponent from "shared/button/button.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import PaymentOption from "models/payment-option.model";
import NumberInputComponent from "shared/inputs/number-input/number-input.component";
import CheckboxInputComponent from "shared/inputs/checkbox-input/checkbox-input.component";

class PaymentOptionsModalComponent extends React.Component {
	constructor(props) {
		super(props);

		const { invoiceText, offerText } = props;

		this.state = {
			editing: !!props.paymentOption,
			paymentOption:
				props.paymentOption || new PaymentOption({ invoiceText, offerText, name: invoiceText || offerText }),
			paymentOptionNameErrorMessage: "",
			isInitialDefault: props.paymentOption && props.paymentOption.isDefault,
		};
	}

	render() {
		const { resources } = this.props;
		const { paymentOption, editing, paymentOptionNameErrorMessage, isInitialDefault } = this.state;

		const content = (
			<div className="payment-options-modal-content">
				<div className="modal-base-headline">
					{resources.str_termsOfPayment} {editing ? resources.str_toEditSmall : resources.str_add}
				</div>
				<div className="row">
					<div className="col-xs-8">
						<TextInputExtendedComponent
							name="name"
							value={paymentOption.name}
							label={resources.str_nameOfTermsOfPayment}
							onChange={(val) => {
								this.setState({ paymentOptionNameErrorMessage: "" }, () => {
									this.onChange(val, "name");
								});
							}}
							onBlur={({ value }) => {
								this.setState(
									{
										paymentOptionNameErrorMessage:
											value.trim().length === 0 ? resources.mandatoryFieldValidation : "",
									},
									() => {
										this.onChange(value, "name");
									}
								);
							}}
							errorMessage={paymentOptionNameErrorMessage}
						/>
					</div>
					<div className="col-xs-4">
						<div className="payment-options-duedays">
							<NumberInputComponent
								name="dueDays"
								value={paymentOption.dueDays}
								label={resources.str_paymentSmall}
								isDecimal={false}
								onBlur={(value) => this.onChange(parseInt(value), "dueDays")}
								precision={0}
								min={0}
							/>
							<div className="payment-options-duedays-label">{resources.str_days}</div>
						</div>
					</div>
				</div>

				<div className="textarea">
					<label className="textarea_label">{resources.str_textOnOffers}</label>
					<textarea
						data-qs-id="payment-options-modal-offerText"
						className="textarea_input"
						rows="5"
						defaultValue={paymentOption.offerText}
						onChange={(event) => this.onChange(event.target.value, "offerText")}
					/>
					<span className="textarea_bar" />
				</div>

				<div className="textarea">
					<label className="textarea_label">{resources.str_textOnBills}</label>
					<textarea
						data-qs-id="payment-options-modal-invoiceText"
						className="textarea_input"
						rows="5"
						defaultValue={paymentOption.invoiceText}
						onChange={(event) => this.onChange(event.target.value, "invoiceText")}
					/>
					<span className="textarea_bar" />
				</div>

				<div className="row">
					<div className="col-xs-6">
						<div className="payment-options-checkbox">
							<CheckboxInputComponent
								dataQsId="payment-options-modal-isInstant"
								name={"isInstant"}
								label={resources.invoicePaidCompletionText}
								checked={paymentOption.isInstant}
								onChange={() => this.onToggle("isInstant")}
							/>
						</div>
					</div>
					<div className="col-xs-6">
						<div className="payment-options-checkbox">
							<CheckboxInputComponent
								dataQsId="payment-options-modal-isDefault"
								name={"isDefault"}
								label={resources.str_standardPaymentTerms}
								checked={paymentOption.isDefault}
								onChange={() => this.onToggle("isDefault")}
								disabled={editing && isInitialDefault}
							/>
						</div>
					</div>
				</div>

				<div className="modal-base-footer">
					<div className="modal-base-confirm">
						<ButtonComponent
							type="primary"
							callback={() => this.onSaveClick()}
							buttonIcon="icon-check"
							label={resources.str_toSave}
							dataQsId="payment-options-modal-btn-assign"
						/>
					</div>
					<div className="modal-base-cancel">
						<ButtonComponent
							type="cancel"
							callback={() => ModalService.close(true)}
							label={resources.str_abortStop}
							dataQsId="payment-options-modal-btn-cancel"
						/>
					</div>
				</div>
			</div>
		);

		return content;
	}

	onToggle(property) {
		const { paymentOption } = this.state;
		paymentOption[property] = !paymentOption[property];
		this.setState({ paymentOption });
	}

	onChange(value, property) {
		if (property === "dueDays" && isNaN(value)) {
			value = 0;
		}
		const { paymentOption } = this.state;
		paymentOption[property] = value;
		this.setState({ paymentOption });
	}

	onSaveClick() {
		const { paymentOption } = this.state;
		const { resources } = this.props;
		if (paymentOption.name.trim().length === 0) {
			this.setState({ paymentOptionNameErrorMessage: resources.mandatoryFieldValidation });
		} else {
			this.props.onSave && this.props.onSave(this.state.paymentOption);
		}
	}
}

export default PaymentOptionsModalComponent;
