import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import RadioInputComponent from 'shared/inputs/radio-input/radio-input.component';
import NumberInputComponent from 'shared/inputs/number-input/number-input.component';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import OvalToggleComponent from 'shared/oval-toggle/oval-toggle.component';
import EmailInputComponent from 'shared/inputs/email-input/email-input.component';
import ModalService from 'services/modal.service';
import PaymentOptionsModalComponent from 'shared/modals/payment-options-modal.component';
import PaymentOption from 'models/payment-option.model';

const CUSTOM_OPTION_ID = 'customOption';

class LetterPayConditionsComponent extends React.Component {
	constructor(props) {
		super(props);

		const selectedOption = props.payConditions.find(cond => cond.id === props.payConditionId);

		this.state = {
			editing: false,
			customerData: props.customerData,
			payConditions: props.payConditions,
			payConditionId: props.payConditionId,
			isInvoice: props.isPurchaseOrder ? !props.isInvoice : props.isInvoice,
			isPurchaseOrder: props.isPurchaseOrder,
			autoDunningEnabled: props.autoDunningEnabled && selectedOption && selectedOption.dueDays > 0,
			dunningRecipients: props.dunningRecipients,
			showAutoDunning: selectedOption && selectedOption.dueDays > 0
		};

		this.editedDueDays = null;
		this.selectedPayConditionId = props.payConditionId;
		this.payConditionModalActive = false;
	}

	componentDidMount() {
		invoiz.on('documentClicked', () => this.onDocumentClick());
	}

	componentWillReceiveProps(props) {
		const selectedOption = props.payConditions.find(cond => cond.id === props.payConditionId);
		this.selectedPayConditionId = props.payConditionId;

		this.setState({
			payConditions: props.payConditions,
			payConditionId: props.payConditionId,
			isInvoice: props.isPurchaseOrder ? !props.isInvoice : props.isInvoice,
			isPurchaseOrder: props.isPurchaseOrder,
			autoDunningEnabled: props.autoDunningEnabled && selectedOption && selectedOption.dueDays > 0,
			dunningRecipients: props.dunningRecipients,
			showAutoDunning: selectedOption && selectedOption.dueDays > 0
		});
		if (props.activeComponent !== 'payConditionComponent') {
			this.setState({ editing: false });
		}
	}

	// componentWillReceiveProps(newProps) {
	// 	if (newProps.activeComponent != 'payConditionComponent')
	// 		{this.setState({ editing: false });}
	// }

	render() {
		const { editing } = this.state;

		const content = editing ? this.createOpenState() : this.createClosedState();

		return (
			<div
				className={`letter-pay-conditions-component ${editing ? '' : 'outlined'}`}
				onClick={e => this.onComponentClick(e)}
			>
				<span className="edit-icon"/>
				{content}
			</div>
		);
	}

	onComponentClick(event) {
		const e = event.nativeEvent;
		e.stopPropagation();
		e.stopImmediatePropagation();
		if (!this.props.isActiveComponentHasError) {
			if (this.props.activeComponentAction !== undefined) {
				this.props.activeComponentAction('payConditionComponent');
			}
			if (!this.state.editing) {
				this.setState({ editing: true });
			}
		}
	}

	onDocumentClick() {
		if (this.state.editing && !this.payConditionModalActive) {
			this.closeEdit();
		}
	}

	closeEdit() {
		if (this.creatingNewPayCondition) {
			return;
		}

		const { payConditions, payConditionId, isInvoice, autoDunningEnabled, dunningRecipients, isPurchaseOrder } = this.state;

		if (this.editedDueDays) {
			const editableCondition = payConditions.find(payCondition => payCondition.dueEditable);

			if (editableCondition) {
				if (isPurchaseOrder) {
					const { purchaseOrderText } = editableCondition;
					const parts = purchaseOrderText.split(editableCondition.dueDays.toString());
					editableCondition.purchaseOrderText = parts[0] + ` ${this.editedDueDays} ` + parts[1];
				} else if (isInvoice) {
					const { invoiceText } = editableCondition;
					const parts = invoiceText.split(editableCondition.dueDays.toString());
					editableCondition.invoiceText = parts[0] + ` ${this.editedDueDays} ` + parts[1];
				} else {
					const { offerText } = editableCondition;
					const parts = offerText.split(editableCondition.dueDays.toString());
					editableCondition.offerText = parts[0] + ` ${this.editedDueDays} ` + parts[1];
				}

				editableCondition.dueDays = this.editedDueDays;
			}
		}

		this.setState({ editing: false }, () => {
			if (this.selectedCustomOption && this.selectedPayConditionId === CUSTOM_OPTION_ID) {
				this.selectedPayConditionId = this.selectedCustomOption.id;
			}
			const id = this.selectedPayConditionId || payConditionId;
			this.props.onChange && this.props.onChange(payConditions, id, autoDunningEnabled, dunningRecipients);
		});
	}

	onCustomConditionChange(option) {
		const { resources } = this.props;
		if (option && option.tenantId) {
			this.selectedCustomOption = option;
			this.selectedPayConditionId = CUSTOM_OPTION_ID;
			this.setState({ showAutoDunning: option.dueDays > 0, payConditionId: option.id });
		} else if (option) {
			this.creatingNewPayCondition = true;
			ModalService.open(
				<PaymentOptionsModalComponent
					invoiceText={option.invoiceText}
					onSave={paymentOption => {
						invoiz
							.request(`${config.resourceHost}setting/payCondition`, {
								auth: true,
								method: 'POST',
								data: paymentOption
							})
							.then(response => {
								const {
									body: { data }
								} = response;
								const { payConditions } = this.state;
								this.selectedCustomOption = new PaymentOption(data);
								payConditions.push(this.selectedCustomOption);
								this.selectedPayConditionId = CUSTOM_OPTION_ID;
								this.setState({ payConditions, payConditionId: this.selectedCustomOption.id });
								ModalService.close();
								this.creatingNewPayCondition = false;
							});
					}}
					resources={resources}
				/>,
				{
					width: 700,
					modalClass: 'payment-options-modal-component',
					isCloseable: false,
					afterClose: isCancel => {
						if (isCancel) {
							this.creatingNewPayCondition = false;
						}
					}
				}
			);
		}
	}

	onRadioChange(value) {
		this.selectedPayConditionIdBefore = this.selectedPayConditionId;
		this.selectedPayConditionId = value === CUSTOM_OPTION_ID ? value : parseInt(value);
		const selectedOption = this.state.payConditions.find(cond => cond.id === this.selectedPayConditionId);
		if (selectedOption) {
			this.setState({ showAutoDunning: selectedOption && selectedOption.dueDays > 0 });
		} else {
			this.selectedPayConditionId = this.selectedPayConditionIdBefore;
			this.setState({ payConditionId: this.selectedPayConditionId });
		}
	}

	onEditableDueDaysChange(value) {
		this.editedDueDays = parseInt(value);
	}

	onAutoDunningToggle() {
		const { autoDunningEnabled, dunningRecipients } = this.state;

		this.setState({
			autoDunningEnabled: !autoDunningEnabled,
			dunningRecipients: autoDunningEnabled ? [] : dunningRecipients
		});
	}

	onDunningRecipientsChange(value) {
		this.setState({ dunningRecipients: value || [] });
	}

	createOpenState() {
		const { resources } = this.props;
		const {
			payConditions,
			payConditionId,
			isInvoice,
			isPurchaseOrder,
			autoDunningEnabled,
			dunningRecipients,
			showAutoDunning
		} = this.state;
		const selectedOption = payConditions.find(cond => cond.id === payConditionId);
		const customOptions = payConditions.filter(condition => !condition.isBasic);
		const customOptionSelect = (
			<SelectInputComponent
				allowCreate={true}
				notAsync={true}
				loadedOptions={customOptions}
				value={payConditionId.toString()}
				onFocus={() => {
					$('#radio-input-' + CUSTOM_OPTION_ID).click();
				}}
				options={{
					labelKey: isPurchaseOrder ? 'purchaseOrderText' : isInvoice ? 'invoiceText' : 'offerText',
					valueKey: 'id',
					matchProp: isPurchaseOrder ? 'purchaseOrderText' : isInvoice ? 'invoiceText' : 'offerText',
					placeholder: resources.paymentMethodSelectionText,
					handleChange: option => this.onCustomConditionChange(option)
				}}
			/>
		);

		let options = payConditions
			.filter(condition => condition.isBasic)
			.map((payCondition, index) => {
				const option = {
					sortId: payCondition.sortId,
					value: payCondition.id.toString(),
					label: isPurchaseOrder ? payCondition.purchaseOrderText || payCondition.name
					 : isInvoice ? payCondition.invoiceText || payCondition.name
					 : payCondition.offerText || payCondition.name
				};

				if (payCondition.dueEditable) {
					const texts = isPurchaseOrder ? payCondition.purchaseOrderText.split(payCondition.dueDays.toString()) : isInvoice
						? payCondition.invoiceText.split(payCondition.dueDays.toString())
						: payCondition.offerText.split(payCondition.dueDays.toString());
					option.label = (
						<div
							className="pay-condition-inline-number-input"
							onClick={() => {
								$('#radio-input-' + payCondition.id.toString()).click();
							}}
						>
							{texts[0]}
							<NumberInputComponent
								name={'pay-condition-editable-due-days'}
								isDecimal={false}
								precision={0}
								value={payCondition.dueDays}
								onChange={value => this.onEditableDueDaysChange(value)}
							/>
							{texts[1]}
						</div>
					);
				}
				return option;
			});

		options.push({
			extraLabel: customOptionSelect,
			value: CUSTOM_OPTION_ID,
			sortId: 9998
		});

		options = options.sort((a, b) => {
			return parseInt(a.sortId) - parseInt(b.sortId);
		});

		return (
			<div className="letter-pay-conditions-selection">
				<RadioInputComponent
					useCustomStyle={true}
					value={selectedOption && selectedOption.isBasic ? payConditionId.toString() : CUSTOM_OPTION_ID}
					onChange={value => this.onRadioChange(value)}
					options={options}
				/>
				{isInvoice && showAutoDunning ? (
					<div className="letter-pay-conditions-dunning">
						<OvalToggleComponent
							labelLeft
							onChange={() => this.onAutoDunningToggle()}
							checked={autoDunningEnabled}
							labelText={resources.sendRemainderInvoiceMessage}
						/>
						{autoDunningEnabled && (
							<EmailInputComponent
								multi
								onChange={val => this.onDunningRecipientsChange(val)}
								recipients={dunningRecipients}
								resources={resources}
							/>
						)}
					</div>
				) : null}
			</div>
		);
	}

	createClosedState() {
		const { resources } = this.props;
		const { payConditions, payConditionId, isInvoice, isPurchaseOrder } = this.state;
		const payCondition = payConditions.find(obj => obj.id === payConditionId) || payConditions[0];
		const text =
			payCondition && (isPurchaseOrder ? payCondition.purchaseOrderText : (isInvoice && payCondition.invoiceText) || (!isInvoice && payCondition.offerText));

		return (
			<span className="letter-pay-conditions-value">
				{text || (
					<span className="letter-pay-conditions-placeholder">{resources.termsOfPaymentText}</span>
				)}
			</span>
		);
	}
}

export default LetterPayConditionsComponent;
