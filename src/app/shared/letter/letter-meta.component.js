import invoiz from "services/invoiz.service";
import React from "react";
// import moment from 'moment';
import config from "config";
import PropTypes from "prop-types";
import { isEmpty } from "lodash";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import { convertDateKeyToPreview } from "helpers/convertDateKeyToPreview";
import InvoiceState from "enums/invoice/invoice-state.enum";
import NumerationConfigComponent from "shared/numeration-config/numeration-config.component";
import ModalService from "services/modal.service";
import NumberInputComponent from "shared/inputs/number-input/number-input.component";
import DateInputComponent from "shared/inputs/date-input/date-input.component";
import PopoverComponent from "shared/popover/popover.component";
import Direction from "enums/direction.enum";
import Invoice from "models/invoice.model";
import { formateClientDateMonthYear, formatApiDate } from "helpers/formatDate";
import OfferState from "enums/offer/offer-state.enum";
import Offer from "models/offer.model";
import PurchaseOrder from "models/purchase-order.model";
import { getInvoiceNumber } from "helpers/transaction/getInvoiceNumber";

const KEYCODE_ENTER = 13;
const KEYCODE_ESCAPE = 27;
const MAX_CUSTOM_FIELDS = 3;

// move into lang resource file
// const letterMetaInfoLabel = {
// 	offerNumber: 'Angebots-Nr.',
// 	invoiceNumber: 'Rechnungs-Nr.',
// 	customerNumber: 'Kunden-Nr.',
// 	invoiceDate: 'Rechnungsdatum',
// 	offerDate: 'Angebotsdatum',
// 	deliveryDate: 'Lieferdatum',
// 	deliveryPeriod: 'Lieferzeitraum'
// };

const DELIVERY_DATE_NAME = "deliveryDate";
const DATE_NAME = "date";
const DELIVERY_PERIOD_NAME = "deliveryPeriod";
const DELIVERY_PERIOD_START_NAME = "deliveryPeriodStartDate";
const DELIVERY_PERIOD_END_NAME = "deliveryPeriodEndDate";

class LetterMetaComponent extends React.Component {
	constructor(props) {
		super(props);
		this._isMounted = false;
		this.state = {
			active: false,
			data: props.data,
			originalData: props.data,
			numerationOptions: props.numerationOptions,
			isOffer: props.isOffer,
			isPurchaseOrder: props.isPurchaseOrder,
			initialCustomerNumber: null,
		};

		this.numerationModalActive = false;

		this.onFormKeydown = this.onFormKeydown.bind(this);
	}

	componentDidMount() {
		this._isMounted = true;
		if (this._isMounted) {
			invoiz.on("documentClicked", () => this.onDocumentClick());
			document.addEventListener("keydown", this.onFormKeydown);
		}
	}

	componentWillUnmount() {
		this._isMounted = false;
		if (!this._isMounted) {
			invoiz.off("documentClicked", () => this.onDocumentClick());
			document.removeEventListener("keydown", this.onFormKeydown);
		}
	}

	componentWillReceiveProps(newProps) {
		const { data, error, isOffer, isPurchaseOrder } = newProps;
		let { active, initialCustomerNumber } = this.state;

		if (!isEmpty(error)) {
			active = true;
		}

		if (newProps.activeComponent !== "metaComponent") {
			active = false;
		} else {
			active = true;
		}

		if (!initialCustomerNumber) {
			initialCustomerNumber = data.customerData && data.customerData.number ? data.customerData.number : null;
		}

		const newData = isOffer ? new Offer(data) : isPurchaseOrder ? new PurchaseOrder(data) : new Invoice(data);

		this.setState({ data: newData, active, initialCustomerNumber, error });
	}

	render() {
		const { data, active } = this.state;
		if (!data) {
			return null;
		}

		const content = active ? this.createForm() : this.createDisplay();

		return (
			<div className="letter-meta-component-wrapper outlined">
				<span className="edit-icon" />
				<div onClick={(ev) => this.onComponentClick(ev)}>{content}</div>
			</div>
		);
	}

	onComponentClick(event) {
		!this.state.active && invoiz.trigger("documentClicked", event);
		const e = event.nativeEvent;
		e.stopPropagation();
		e.stopImmediatePropagation();

		if (!this.props.isActiveComponentHasError) {
			if (this.props.activeComponentAction !== undefined) {
				this.props.activeComponentAction("metaComponent", undefined);
			}
			if (!this.state.active) {
				const newData = this.props.isOffer
					? new Offer(this.state.data)
					: this.props.isPurchaseOrder
					? new PurchaseOrder(this.state.data)
					: new Invoice(this.state.data);
				this.setState({ active: true, originalData: newData });
			}
		}
	}

	onDocumentClick() {
		if (this.state.active && !this.numerationModalActive) {
			this.onCloseEditMode();
		}
	}

	onCloseEditMode() {
		const { active, data, _isMounted } = this.state;
		if (!active) return;

		if (data.customerData && !data.customerData.number) {
			data.customerData.number = this.state.initialCustomerNumber;
		}

		if (_isMounted) {
			this.setState({ active: false }, () => {
				this.props.onChange(data);
			});
		}
	}

	onCancelEditMode() {
		const { originalData } = this.state;
		const newData = this.props.isOffer
			? new Offer(originalData)
			: this.props.isPurchaseOrder
			? new PurchaseOrder(originalData)
			: new Invoice(originalData);
		this.setState({ data: newData, active: false });
	}

	onFormKeydown(event) {
		if (this.state.active) {
			if (event.keyCode === KEYCODE_ESCAPE) {
				this.onCancelEditMode();
			}

			if (event.keyCode === KEYCODE_ENTER) {
				this.onCloseEditMode();
			}
		}
	}

	onFieldHideClick(field, index) {
		const { data } = this.state;
		let originalField = data.infoSectionFields.find((infoField) => infoField.name === field.name);

		if (!originalField && index >= 0) {
			originalField = data.infoSectionCustomFields[index];
		}

		if (originalField) {
			originalField.active = false;
		}

		const newData = this.props.isOffer
			? new Offer(data)
			: this.props.isPurchaseOrder
			? new PurchaseOrder(data)
			: new Invoice(data);
		this.setState({ data: newData });
	}

	onFieldLabelChange(value, name) {
		const { data } = this.state;
		const field = data.infoSectionFields.find((field) => field.name === name);
		field.label = value;
		const newData = this.props.isOffer
			? new Offer(data)
			: this.props.isPurchaseOrder
			? new PurchaseOrder(data)
			: new Invoice(data);
		this.setState({ data: newData });
	}

	onCustomerNumberChange(number) {
		const { data } = this.state;
		data.customerData = { ...data.customerData, number: parseInt(number, 10) };
		const newData = this.props.isOffer
			? new Offer(data)
			: this.props.isPurchaseOrder
			? new PurchaseOrder(data)
			: new Invoice(data);
		this.setState({ data: newData });
	}

	onCustomFieldValueChange(value, index) {
		const { data } = this.state;
		const field = data.infoSectionCustomFields[index];
		field.value = value;
		const newData = this.props.isOffer
			? new Offer(data)
			: this.props.isPurchaseOrder
			? new PurchaseOrder(data)
			: new Invoice(data);
		this.setState({ data: newData });
	}

	onCustomFieldLabelChange(value, index) {
		const { data } = this.state;
		const field = data.infoSectionCustomFields[index];
		field.label = value;
		const newData = this.props.isOffer
			? new Offer(data)
			: this.props.isPurchaseOrder
			? new PurchaseOrder(data)
			: new Invoice(data);
		this.setState({ data: newData });
	}

	onDateRangeChange(name, value, date) {
		const { deliveryPeriodStart, deliveryPeriodEnd } = this.refs;
		const { data } = this.state;
		value = formateClientDateMonthYear(value, config.dateFormat.client);
		const newData = Object.assign({}, data, { [name]: value });

		if (!deliveryPeriodStart || !deliveryPeriodEnd) {
			return;
		}

		if (name === DELIVERY_PERIOD_START_NAME) {
			deliveryPeriodStart.picker.setStartRange(date);
			deliveryPeriodEnd.picker.setStartRange(date);
			deliveryPeriodEnd.picker.setMinDate(date);

			const deliveryEnd = data.deliveryPeriod.split(" - ")[1];
			newData[DELIVERY_PERIOD_NAME] = `${value} - ${deliveryEnd}`;
		}

		if (name === DELIVERY_PERIOD_END_NAME) {
			deliveryPeriodStart.picker.setEndRange(date);
			deliveryPeriodEnd.picker.setEndRange(date);

			const deliveryStart = data.deliveryPeriod.split(" - ")[0];
			newData[DELIVERY_PERIOD_NAME] = `${deliveryStart} - ${value}`;
		}

		const newObj = this.props.isOffer
			? new Offer(newData)
			: this.props.isPurchaseOrder
			? new PurchaseOrder(newData)
			: new Invoice(newData);

		this.setState({ data: newObj }, () => {
			this.props.onChange(this.state.data);
		});
	}

	onDateChange(name, value) {
		const { data } = this.state;
		// value = moment(value, 'DD.MM.YYYY').format(config.dateFormat.api);
		value = formatApiDate(value);
		const newData = Object.assign({}, data, { [name]: value });

		if (name === DATE_NAME) {
			const { infoSectionFields } = newData;
			const deliveryDateField = infoSectionFields.find((field) => field.name === DELIVERY_DATE_NAME);

			if (deliveryDateField) {
				if (!deliveryDateField.active && newData.deliveryDate !== newData.date) {
					newData.deliveryDate = newData.date;
				}
			}
		}

		const newObj = this.props.isOffer
			? new Offer(newData)
			: this.props.isPurchaseOrder
			? new PurchaseOrder(newData)
			: new Invoice(newData);

		this.setState({ data: newObj }, () => {
			this.props.onChange(this.state.data);
		});
	}

	onNumerationSaved(data) {
		const { numerationOptions } = this.state;

		numerationOptions.prefix = data.prefix;
		numerationOptions.suffix = data.suffix;
		numerationOptions.counterLength = data.counterLength;
		numerationOptions.datePart = data.datePart;
		numerationOptions.startValue = data.startValue;
		numerationOptions.placeHolder1 = data.placeHolder1;
		numerationOptions.placeHolder2 = data.placeHolder2;
		numerationOptions.placeHolder3 = data.placeHolder3;

		this.setState({ numerationOptions }, () => {
			ModalService.close();
			setTimeout(() => {
				this.numerationModalActive = false;
			}, 1000);
		});
	}

	onNumerationCancel() {
		ModalService.close();
		setTimeout(() => {
			this.numerationModalActive = false;
		}, 1000);
	}

	openNumerationModal() {
		const { isOffer, resources, isPurchaseOrder } = this.props;

		this.numerationModalActive = true;

		ModalService.open(
			<NumerationConfigComponent
				numerationOptions={
					isOffer
						? { offer: this.state.numerationOptions }
						: isPurchaseOrder
						? { purchaseOrder: this.state.numerationOptions }
						: { invoice: this.state.numerationOptions }
				}
				isOnlyInvoice={isPurchaseOrder ? isOffer : !isOffer}
				isOnlyOffer={isOffer}
				isOnlyPurchaseOrder={isPurchaseOrder}
				//	isOnlyReceipt={isReceipt}
				onCancel={() => this.onNumerationCancel()}
				onSave={(data) => this.onNumerationSaved(data)}
				resources={resources}
			/>,
			{
				modalClass: "numeration-config-modal letter-meta-numeration-config-modal",
				width: 600,
				padding: 40,
			}
		);
	}

	createForm() {
		const { isRecurring, recurringInvoice, resources } = this.props;
		const { data, numerationOptions } = this.state;
		const { infoSectionFields, infoSectionCustomFields } = data;

		const fields = infoSectionFields.map((field) => {
			const { name, active, label, required } = field;

			if (!active) {
				return;
			}

			let valueField;
			switch (name) {
				case "invoiceNumber": {
					let nextNewNumber = numerationOptions.currentValue + 1;
					let numberString = nextNewNumber.toString();
					numberString = numberString.padStart(numerationOptions.counterLength, "0");
					const datePart = convertDateKeyToPreview(numerationOptions.datePart);
					const nextNumber =
						numerationOptions.prefix +
						numerationOptions.placeHolder1 +
						datePart +
						numerationOptions.placeHolder2 +
						numberString +
						numerationOptions.placeHolder3 +
						numerationOptions.suffix;
					const number =
						data.state === InvoiceState.DRAFT || data.state === InvoiceState.RECURRING_TEMPLATE
							? nextNumber
							: data.number;

					valueField = (
						<div className="letter-meta-form-field">
							<div className="input input-aligned" onClick={(ev) => this.openNumerationModal()}>
								{number}
							</div>
						</div>
					);
					break;
				}
				case "purchaseOrderNumber":
				case "offerNumber": {
					let nextNewNumber = numerationOptions.currentValue + 1;
					let numberString = nextNewNumber.toString();
					numberString = numberString.padStart(numerationOptions.counterLength, "0");
					const datePart = convertDateKeyToPreview(numerationOptions.datePart);
					const nextNumber =
						numerationOptions.prefix +
						numerationOptions.placeHolder1 +
						datePart +
						numerationOptions.placeHolder2 +
						numberString +
						numerationOptions.placeHolder3 +
						numerationOptions.suffix;
					const number = data.state === OfferState.DRAFT ? nextNumber : data.number;
					valueField = (
						<div className="letter-meta-form-field">
							<div className="input input-aligned" onClick={(ev) => this.openNumerationModal()}>
								{number}
							</div>
						</div>
					);
					break;
				}

				case "customerNumber":
					const { error } = this.props; // todo: handle error (not in props yet)
					const infoErrorClass = !isEmpty(error) ? "document_infoError" : "";
					const errorClass = !isEmpty(error) ? "document_infoInputError" : "";
					const { customerData } = data;
					const rawCustomerNumber = customerData && customerData.number;
					const customerNumber = parseInt(rawCustomerNumber, 10) || null;

					valueField = isEmpty(customerData) ? (
						<div className="letter-meta-form-field">
							<div className="input input-aligned">{customerNumber || ""}</div>
						</div>
					) : (
						<div className={`letter-meta-form-field ${infoErrorClass}`}>
							<NumberInputComponent
								required={true}
								name={name}
								value={customerNumber}
								precision={0}
								isDecimal={false}
								focused={!isEmpty(error)}
								errorMessage={!isEmpty(error) ? error.message : ""}
								errorClass={errorClass}
								onChange={(number, name) => this.onCustomerNumberChange(number)}
								placeholder={resources.letterMetaInfoLabel[name]}
							/>
						</div>
					);
					break;

				case "date":
				case "offerDate":
				case "purchaseOrderDate":
				case "invoiceDate":
					if (isRecurring) {
						valueField = <div className="letter-meta-form-field">{recurringInvoice.displayStartDate}</div>;
					} else {
						valueField = (
							<div className="letter-meta-form-field">
								<DateInputComponent
									name={"date"}
									value={data.displayDate}
									required={required}
									onChange={(name, value) => this.onDateChange(name, value)}
								/>
							</div>
						);
					}
					break;

				case "deliveryDate":
					if (isRecurring) {
						valueField = <div className="letter-meta-form-field">{recurringInvoice.displayStartDate}</div>;
					} else {
						valueField = (
							<div className="letter-meta-form-field">
								<DateInputComponent
									name={name}
									value={data.displayDeliveryDate}
									required={required}
									onChange={(name, value) => this.onDateChange(name, value)}
								/>
							</div>
						);
					}
					break;

				case "deliveryPeriod":
					if (isRecurring) {
						valueField = (
							<div className="letter-meta-form-field">
								{recurringInvoice.displayDeliveryPeriodStartDate}
								{" - "}
								{recurringInvoice.displayDeliveryPeriodEndDate}
							</div>
						);
					} else {
						valueField = (
							<div className="letter-meta-form-field letter-meta-form-delivery-period">
								<DateInputComponent
									ref="deliveryPeriodStart"
									isRangeStart={true}
									rangeStart={data.deliveryPeriodStartDate}
									rangeEnd={data.deliveryPeriodEndDate}
									onRangeChange={(name, value, date) => this.onDateRangeChange(name, value, date)}
									name={DELIVERY_PERIOD_START_NAME}
									value={data.displayDeliveryPeriodStartDate}
									required={required}
								/>
								<span className="letter-meta-delivery-period-divider">-</span>
								<div className="delivery-period-end">
									<DateInputComponent
										ref="deliveryPeriodEnd"
										isRangeEnd={true}
										rangeStart={data.deliveryPeriodStartDate}
										rangeEnd={data.deliveryPeriodEndDate}
										onRangeChange={(name, value, date) => this.onDateRangeChange(name, value, date)}
										name={DELIVERY_PERIOD_END_NAME}
										value={data.displayDeliveryPeriodEndDate}
										required={required}
									/>
								</div>
							</div>
						);
					}
			}

			return (
				<div className="letter-meta-form-row" key={`letter-meta-form-row-${name}`}>
					<div className="letter-meta-form-label">
						<TextInputExtendedComponent
							required={true}
							name={name}
							value={label}
							onChange={(value, name) => this.onFieldLabelChange(value, name)}
							placeholder={resources.letterMetaInfoLabel[name]}
						/>
					</div>

					{valueField}

					{required ? null : (
						<div className="letter-meta-form-hide-button">
							<button
								title={resources.str_hideTitle}
								// className="document_info-action button-icon-close"
								className="document_info-action button-icon-trashcan"
								onClick={() => this.onFieldHideClick(field)}
							/>
						</div>
					)}
				</div>
			);
		});

		const customFields = infoSectionCustomFields.map((field, index) => {
			const { value, label, active } = field;

			if (!active) {
				return;
			}

			return (
				<div className="letter-meta-form-row" key={`letter-meta-form-row-custom-${index}`}>
					<div className="letter-meta-form-label">
						<TextInputExtendedComponent
							name={name}
							value={label}
							onChange={(value) => this.onCustomFieldLabelChange(value, index)}
							placeholder={resources.str_customLabel}
						/>
					</div>

					<div className="letter-meta-form-field">
						<TextInputExtendedComponent
							name={name}
							value={value}
							onChange={(value) => this.onCustomFieldValueChange(value, index)}
							placeholder={resources.str_data}
						/>
					</div>

					<div className="letter-meta-form-hide-button">
						<button
							title={resources.str_hideTitle}
							// className="document_info-action button-icon-close"
							className="document_info-action button-icon-trashcan"
							onClick={() => this.onFieldHideClick(field, index)}
						/>
					</div>
				</div>
			);
		});

		const contextMenu = this.createContextMenu();

		return (
			<div className="letter-meta-form">
				{fields}
				{customFields}
				{contextMenu}
			</div>
		);
	}

	createContextMenu() {
		const { resources } = this.props;
		const { infoSectionFields, infoSectionCustomFields } = this.state.data;
		const missingFields = infoSectionFields.filter((field) => !field.active);
		const customFieldLength = infoSectionCustomFields.reduce((a, b) => a + (b.active ? 1 : 0), 0);
		const showMenu = missingFields.length > 0 || customFieldLength < MAX_CUSTOM_FIELDS;

		let menu = null;

		if (showMenu) {
			const entries = [];
			const mainFieldEntries = missingFields.map((missingField) => {
				if (!missingField.active) {
					return {
						label: missingField.label,
						name: missingField.name,
						dataQsId: `letter-meta-add-field-${missingField.label}`,
					};
				}
			});

			const customFieldEntries =
				customFieldLength < MAX_CUSTOM_FIELDS
					? [{ label: resources.str_ownField, dataQsId: "letter-meta-add-custom", isCustomField: true }]
					: [];

			mainFieldEntries.length > 0 && entries.push(mainFieldEntries);
			customFieldEntries.length > 0 && entries.push(customFieldEntries);

			menu = (
				<div className="letter-meta-form-context-menu">
					<span className="icon icon-plus" id="letter-meta-form-context-menu-icon" />
					<PopoverComponent
						alignment={Direction.LEFT}
						arrowAlignment={Direction.LEFT}
						offsetTop={15}
						offsetLeft={-9}
						entries={entries}
						elementId={"letter-meta-form-context-menu-icon"}
						showOnClick={true}
						onClick={(entry) => this.onContextMenuClick(entry)}
					/>
				</div>
			);
		}

		return menu;
	}

	onContextMenuClick(entry) {
		const { data } = this.state;

		if (entry.isCustomField) {
			let fieldActivated = false;
			data.infoSectionCustomFields.forEach((field) => {
				if (!fieldActivated && !field.active) {
					field.value = "";
					field.label = "";
					field.active = true;
					fieldActivated = true;
				}
			});
		} else {
			data.infoSectionFields.forEach((field) => {
				if (field.name === entry.name) {
					field.active = true;
				}
			});
		}

		const newObj = this.props.isOffer
			? new Offer(data)
			: this.props.isPurchaseOrder
			? new PurchaseOrder(data)
			: new Invoice(data);

		this.setState({ data: newObj });
	}

	createDisplay() {
		const { isRecurring, recurringInvoice } = this.props;
		const { data, numerationOptions } = this.state;
		const { infoSectionFields, infoSectionCustomFields } = data;

		const fields = infoSectionFields.map((field) => {
			const { name, active, label } = field;

			if (!active) {
				return;
			}

			let valueField;

			switch (name) {
				case "invoiceNumber": {
					valueField = (
						<div className="letter-meta-display-value">
							{getInvoiceNumber(numerationOptions, data.state, data.number)}
						</div>
					);
					break;
				}

				case "purchaseOrderNumber":
				case "offerNumber": {
					let nextNewNumber = numerationOptions.currentValue + 1;
					let numberString = nextNewNumber.toString();
					//let numberString = numerationOptions.currentValue && numerationOptions.currentValue.toString();
					numberString = numberString.padStart(numerationOptions.counterLength, "0");
					const datePart = convertDateKeyToPreview(numerationOptions.datePart);
					const nextNumber =
						numerationOptions.prefix +
						numerationOptions.placeHolder1 +
						datePart +
						numerationOptions.placeHolder2 +
						numberString +
						numerationOptions.placeHolder3 +
						numerationOptions.suffix;
					const number = data.state === OfferState.DRAFT ? nextNumber : data.number;
					valueField = <div className="letter-meta-display-value">{number}</div>;
					break;
				}

				case "customerNumber":
					const { customerData } = data;
					const rawCustomerNumber = customerData && customerData.number;
					const customerNumber = parseInt(rawCustomerNumber, 10) || null;
					valueField = <div className="letter-meta-display-value">{customerNumber || ""}</div>;
					break;

				case "date":
				case "offerDate":
				case "purchaseOrderDate":
				case "invoiceDate":
					valueField = (
						<div className="letter-meta-display-value">
							{isRecurring ? recurringInvoice.displayStartDate : data.displayDate}
						</div>
					);
					break;

				case "deliveryDate":
					valueField = (
						<div className="letter-meta-display-value">
							{isRecurring ? recurringInvoice.displayStartDate : data.displayDeliveryDate}
						</div>
					);
					break;

				case "deliveryPeriod":
					valueField = (
						<div className="letter-meta-display-value">
							{isRecurring
								? `${recurringInvoice.displayDeliveryPeriodStartDate} - ${recurringInvoice.displayDeliveryPeriodEndDate}`
								: data.displayDeliveryPeriod}
						</div>
					);
					break;
			}

			return (
				<div className="letter-meta-display-row" key={`letter-meta-display-row-${name}`}>
					<div className="letter-meta-display-label">{label}</div>
					<div className="seperator-hyphen">-</div>
					{valueField}
				</div>
			);
		});

		const customFields = infoSectionCustomFields.map((field, index) => {
			const { value, label, active } = field;

			if (!active) {
				return;
			}

			return (
				<div className="letter-meta-display-row" key={`letter-meta-display-row-custom-${index}`}>
					<div className="letter-meta-display-label">{label}</div>
					<div className="seperator-hyphen">{label && value && "-"}</div>
					<div className="letter-meta-display-value">{value}</div>
				</div>
			);
		});

		return (
			<div className="letter-meta-display">
				{fields}
				{customFields}
			</div>
		);
	}
}

LetterMetaComponent.propTypes = {
	onCancel: PropTypes.func,
	onClose: PropTypes.func,
};

export default LetterMetaComponent;
