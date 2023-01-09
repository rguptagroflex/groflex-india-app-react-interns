import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import TabInputComponent from 'shared/inputs/tab-input/tab-input.component';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import { convertDateKeyToPreview } from 'helpers/convertDateKeyToPreview';
import ButtonComponent from 'shared/button/button.component';
import ModalService from 'services/modal.service';
import FilterComponent from 'shared/filter/filter.component';
import userPermissions from 'enums/user-permissions.enum';
import NumberInputComponent from 'shared/inputs/number-input/number-input.component';
import invoice from '../../redux/ducks/invoice/index';
import OvalToggleComponent from 'shared/oval-toggle/oval-toggle.component';
import { getMonthName, formateClientDateMonth } from 'helpers/formatDate';

const INVOICE_VIEW = 'invoice';
const OFFER_VIEW = 'offer';
const PURCHASE_ORDER_VIEW = 'purchaseOrder';
const YEAR_KEY = 'YYYY';
const YEAR_SHORT_KEY = 'YY';
const YEAR_MONTH_KEY = 'YYYYMM';
const YEAR_SHORT_MONTH_KEY = 'YYMM';
const YEAR_MONTH_DAY_KEY = 'YYYYMMDD';
const YEAR_SHORT_MONTH_DAY_KEY = 'YYMMDD';
const FY_KEY = 'YYYYYY'

const FREQUENCY_YEAR = 'yearly';
const FREQUENCY_MONTH = 'monthly';
const FREQUENCY_DAY = 'daily';

// Number reset values - isPeriodic, frequency, subFrequency,endDate,currentValue,increment
class NumerationConfigComponent extends React.Component {
	constructor(props) {
		super(props);

		const invoiceOptions = this.props.numerationOptions.invoice || {};
		const offerOptions = this.props.numerationOptions.offer || {};
		const purchaseOrderOptions = this.props.numerationOptions.purchaseOrder || {};
		this.isOnlyInvoice = this.props.isOnlyInvoice;
		this.isOnlyOffer = this.props.isOnlyOffer;
		this.isOnlyPurchaseOrder = this.props.isOnlyPurchaseOrder;
		this.onSave = this.props.onSave;
		const { resources } = this.props;
		this.state = {
			currentView: this.isOnlyInvoice ? INVOICE_VIEW : this.isOnlyPurchaseOrder ? PURCHASE_ORDER_VIEW : OFFER_VIEW,
			invoicePrefix: invoiceOptions.prefix || '',
			invoiceDate: invoiceOptions.datePart || '',
			invoiceDateText: '',
			// invoiceNumber: invoiceOptions.startValue || '',
			invoiceNumber: parseInt(invoiceOptions.currentValue) + parseInt(invoiceOptions.increment) || '',
			invoiceSuffix: invoiceOptions.suffix || '',
			invoiceCounterLength: invoiceOptions.counterLength || 4,
			invoicePlaceholder1: invoiceOptions.placeHolder1 || '',
			invoicePlaceholder2: invoiceOptions.placeHolder2 || '',
			invoicePlaceholder3: invoiceOptions.placeHolder3 || '',

			invoiceIsPeriodic: invoiceOptions.isPeriodic || false,
			invoiceIncrementBy: invoiceOptions.increment || 1,
			invoiceResetFrequency: invoiceOptions.frequency || `daily`,
			invoiceResetSubFrequency: invoiceOptions.subFrequency || null,
			invoiceStartValue: invoiceOptions.startValue || 1,

			offerIsPeriodic: offerOptions.isPeriodic || false,
			offerIncrementBy: offerOptions.increment || 1,
			offerResetFrequency: offerOptions.frequency || `daily`,
			offerResetSubFrequency: offerOptions.subFrequency || null,
			offerStartValue: offerOptions.startValue || 1,

			purchaseOrderIsPeriodic: purchaseOrderOptions.isPeriodic || false,
			purchaseOrderIncrementBy: purchaseOrderOptions.increment || 1,
			purchaseOrderResetFrequency: purchaseOrderOptions.frequency || `daily`,
			purchaseOrderResetSubFrequency: purchaseOrderOptions.subFrequency || null,
			purchaseOrderStartValue: purchaseOrderOptions.startValue || 1,

			offerPrefix: offerOptions.prefix || '',
			offerDate: offerOptions.datePart || '',
			offerDateText: '',
			//offerNumber: offerOptions.startValue || '',
			offerNumber: parseInt(offerOptions.currentValue) + parseInt(offerOptions.increment)|| '',
			offerSuffix: offerOptions.suffix || '',
			offerCounterLength: offerOptions.counterLength || 4,
			offerPlaceholder1: offerOptions.placeHolder1 || '',
			offerPlaceholder2: offerOptions.placeHolder2 || '',
			offerPlaceholder3: offerOptions.placeHolder3 || '',
			purchaseOrderPrefix: purchaseOrderOptions.prefix || '',
			purchaseOrderDate: purchaseOrderOptions.datePart || '',
			purchaseOrderDateText: '',
			// purchaseOrderNumber: purchaseOrderOptions.startValue || 
			purchaseOrderNumber: parseInt(purchaseOrderOptions.currentValue) + parseInt(purchaseOrderOptions.increment) || '',
			purchaseOrderSuffix: purchaseOrderOptions.suffix || '',
			purchaseOrderCounterLength: purchaseOrderOptions.counterLength || 4,
			purchaseOrderPlaceholder1: purchaseOrderOptions.placeHolder1 || '',
			purchaseOrderPlaceholder2: purchaseOrderOptions.placeHolder2 || '',
			purchaseOrderPlaceholder3: purchaseOrderOptions.placeHolder3 || '',
			isWrapped: !!props.isWrapped,
			invoicePrefixError: '',
			invoiceSuffixError: '',
			invoiceNumberError: '',
			offerPrefixError: '',
			offerSuffixError: '',
			offerNumberError: '',
			purchaseOrderPrefixError: '',
			purchaseOrderSuffixError: '',
			purchaseOrderNumberError: '',
			dateOptions: [
				{
					label: resources.str_none,
					value: '',
					disabled: false
				},
				{
					label: `YY`,
					value: YEAR_SHORT_KEY,
					disabled: false
				},
				{
					label: `YYYY`,
					value: YEAR_KEY,
					disabled: false
				},
				{
					label: `FY - YYYYYY`,
					value: FY_KEY,
					disabled: true
				},
				{
					label: `YYMM`,
					value: YEAR_SHORT_MONTH_KEY,
					disabled: false
				},
				{
					label: `YYYYMM`,
					value: YEAR_MONTH_KEY,
					disabled: false
				},
				{
					label: `YYMMDD`,
					value: YEAR_SHORT_MONTH_DAY_KEY,
					disabled: false
				},
				{
					label: `YYYYMMDD`,
					value: YEAR_MONTH_DAY_KEY,
					disabled: false
				},
			],
			frequencyOptions: [
				{
					label: `Yearly`,
					value: FREQUENCY_YEAR
				},
				{
					label: `Monthly`,
					value: FREQUENCY_MONTH
				},
				{
					label: `Daily`,
					value: FREQUENCY_DAY
				},
			],
			subFrequencyOptions: [
					{ label: resources.monthNames[0], value: `January` },
					{ label: resources.monthNames[1], value: `February` },
					{ label: resources.monthNames[2], value: `March` },
					{ label: resources.monthNames[3], value: `April` },
					{ label: resources.monthNames[4], value: `May` },
					{ label: resources.monthNames[5], value: `June` },
					{ label: resources.monthNames[6], value: `July` },
					{ label: resources.monthNames[7], value: `August` },
					{ label: resources.monthNames[8], value: `September` },
					{ label: resources.monthNames[9], value: `October` },
					{ label: resources.monthNames[10], value: `November` },
					{ label: resources.monthNames[11], value: `December` }
			],
			invoiceDigitOptions: [],
			invoiceOfferOptions: [],
			invoicePurchaseOrderOptions: [],
			isOfferActive: true,
			isInvoiceActive: false,
			isPurchaseOrderActive: false,
			canEditNumericRanges: invoiz.user && invoiz.user.hasPermission(userPermissions.EDIT_NUMERIC_RANGES),
			incrementByError: '',
			startNumberError: ''
		};

		this.dateSelectOptions = {
			clearable: false,
			backspaceRemoves: false,
			labelKey: 'label',
			valueKey: 'value',
			matchProp: 'label',
			handleChange: this.onDateOptionChange.bind(this)
		};

		this.frequencySelectOptions = {
			clearable: false,
			backspaceRemoves: false,
			labelKey: 'label',
			valueKey: 'value',
			matchProp: 'label',
			handleChange: this.onFrequencyOptionChange.bind(this)
		}

		this.subFrequencySelectOptions = {
			clearable: false,
			backspaceRemoves: false,
			labelKey: 'label',
			valueKey: 'value',
			matchProp: 'label',
			handleChange: this.onSubFrequencyOptionChange.bind(this)
		}

		this.digitSelectOptions = {
			clearable: false,
			backspaceRemoves: false,
			labelKey: 'label',
			valueKey: 'value',
			matchProp: 'label',
			handleChange: this.onDigitOptionChange.bind(this)
		};

		this.placeholderLoadedOptions = [
			{
				label: resources.str_empty,
				value: ''
			},
			{
				label: '-',
				value: '-'
			},
			{
				label: '/',
				value: '/'
			},
			{
				label: '|',
				value: '|'
			}
		];

		this.placeholderSelectOptions = {
			clearable: false,
			backspaceRemoves: false,
			labelKey: 'label',
			valueKey: 'value',
			matchProp: 'label',
			placeholder: ''
		};

		this.onTabInputChange = this.onTabInputChange.bind(this);
		this.onInputNumberChange = this.onInputNumberChange.bind(this);
		this.onInputNumberBlur = this.onInputNumberBlur.bind(this);
		this.onPrefixChange = this.onPrefixChange.bind(this);
		this.onSuffixChange = this.onSuffixChange.bind(this);
		this.onDateOptionChange = this.onDateOptionChange.bind(this);
		this.onDigitOptionChange = this.onDigitOptionChange.bind(this);
		this.onDisplayClick = this.onDisplayClick.bind(this);
		this.onInputFocus = this.onInputFocus.bind(this);
		this.onInputBlur = this.onInputBlur.bind(this);
		this.onPrefixBlur = this.onPrefixBlur.bind(this);
		this.onSuffixBlur = this.onSuffixBlur.bind(this);
		this.onSaveClick = this.onSaveClick.bind(this);
		this.onCancelClick = this.onCancelClick.bind(this);

		setTimeout(() => {
			const datePart = this.state.currentView === INVOICE_VIEW ? invoiceOptions.datePart : this.state.currentView === PURCHASE_ORDER_VIEW ? purchaseOrderOptions.datePart : offerOptions.datePart;
			this.onDateOptionChange({ value: datePart });
			this.adjustDigitOptions(true);
			this.onInputNumberBlur();
			this.disableOptions();
		});
	}

	disableOptions() {
		const { dateOptions } = this.state;
		if (this.state.currentView === INVOICE_VIEW) {
			let newDateOptions = dateOptions.map((label) => {
				 if (this.state.invoiceIsPeriodic && this.state.invoiceResetFrequency === FREQUENCY_YEAR) {
					(label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY) ? label.disabled = true : label.disabled = false;
					return label;
				} else if (this.state.invoiceResetFrequency === FREQUENCY_MONTH && this.state.invoiceIsPeriodic) {
					label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY || label.value === FY_KEY ? label.disabled = true : label.disabled = false;
					return label;
				} else if (this.state.invoiceResetFrequency === FREQUENCY_DAY && this.state.invoiceIsPeriodic) {
					label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY || label.value === FY_KEY || label.value === YEAR_MONTH_KEY || label.value === YEAR_SHORT_MONTH_KEY ? label.disabled = true : label.disabled = false;
					return label;
				}  else if (!this.state.invoiceIsPeriodic) {
					label.value !== FY_KEY ? label.disabled = false : label.disabled = true;
				} else {
					return label;
				}
			})
		} else if (this.state.currentView === OFFER_VIEW) {
			let newDateOptions = dateOptions.map((label) => {
				if (this.state.offerIsPeriodic && this.state.offerResetFrequency === FREQUENCY_YEAR) {
				   (label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY) ? label.disabled = true : label.disabled = false;
				   return label;
			   } else if (this.state.offerResetFrequency === FREQUENCY_MONTH && this.state.offerIsPeriodic) {
				   label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY || label.value === FY_KEY ? label.disabled = true : label.disabled = false;
				   return label;
			   } else if (this.state.offerResetFrequency === FREQUENCY_DAY && this.state.offerIsPeriodic) {
				   label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY || label.value === FY_KEY || label.value === YEAR_MONTH_KEY || label.value === YEAR_SHORT_MONTH_KEY ? label.disabled = true : label.disabled = false;
				   return label;
			   }  else if (!this.state.offerIsPeriodic) {
				   label.value !== FY_KEY ? label.disabled = false : label.disabled = true;
			   } else {
				   return label;
			   }
		   })
		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			let newDateOptions = dateOptions.map((label) => {
				if (this.state.purchaseOrderIsPeriodic && this.state.purchaseOrderResetFrequency === FREQUENCY_YEAR) {
				   (label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY) ? label.disabled = true : label.disabled = false;
				   return label;
			   } else if (this.state.purchaseOrderResetFrequency === FREQUENCY_MONTH && this.state.purchaseOrderIsPeriodic) {
				   label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY || label.value === FY_KEY ? label.disabled = true : label.disabled = false;
				   return label;
			   } else if (this.state.purchaseOrderResetFrequency === FREQUENCY_DAY && this.state.purchaseOrderIsPeriodic) {
				   label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY || label.value === FY_KEY || label.value === YEAR_MONTH_KEY || label.value === YEAR_SHORT_MONTH_KEY ? label.disabled = true : label.disabled = false;
				   return label;
				}  else if (!this.state.purchaseOrderIsPeriodic) {
					label.value !== FY_KEY ? label.disabled = false : label.disabled = true;
				} else {
					return label;
				}
		   })
		}
	}

	adjustDigitOptions(adjustBoth) {
		const { resources } = this.props;
		let maxDigits;
		let dateKey;
		let options;

		if (adjustBoth || this.state.currentView === INVOICE_VIEW) {
			maxDigits = 10;
			dateKey = this.state.invoiceDate;
			options = [];

			if (dateKey === YEAR_KEY || dateKey === YEAR_SHORT_MONTH_KEY || dateKey === FY_KEY) {
				maxDigits = 6;
			} else if (dateKey === YEAR_MONTH_KEY || dateKey === YEAR_SHORT_MONTH_DAY_KEY) {
				maxDigits = 4;
			} else if (dateKey === YEAR_MONTH_DAY_KEY) {
				maxDigits = 2;
			} else if (dateKey === YEAR_SHORT_KEY) {
				maxDigits = 8;
			}

			for (let i = 2; i <= maxDigits; i++) {
				options.push({
					label: i + `-${resources.str_digit}`,
					value: i
				});
			}

			this.setState({ invoiceDigitOptions: options });

			if (this.state.invoiceCounterLength > maxDigits) {
				this.setState({ invoiceCounterLength: maxDigits });
			}

			if (this.state.invoiceNumber.length > maxDigits) {
				let number = this.state.invoiceNumber.slice(this.state.invoiceNumber.length - maxDigits);
				number = parseInt(number) < 1 ? '1' : number;
				this.setState({ invoiceNumber: number });
			}
		}

		if (adjustBoth || this.state.currentView === OFFER_VIEW) {
			maxDigits = 10;
			dateKey = this.state.offerDate;
			options = [];

			if (dateKey === YEAR_KEY || dateKey === YEAR_SHORT_MONTH_KEY || dateKey === FY_KEY) {
				maxDigits = 6;
			} else if (dateKey === YEAR_MONTH_KEY || dateKey === YEAR_SHORT_MONTH_DAY_KEY) {
				maxDigits = 4;
			} else if (dateKey === YEAR_MONTH_DAY_KEY) {
				maxDigits = 2;
			} else if (dateKey === YEAR_SHORT_KEY) {
				maxDigits = 8;
			}

			for (let i = 2; i <= maxDigits; i++) {
				options.push({
					label: i + `-${resources.str_digit}`,
					value: i
				});
			}

			this.setState({ offerDigitOptions: options });

			if (this.state.offerCounterLength > maxDigits) {
				this.setState({ offerCounterLength: maxDigits });
			}

			if (this.state.offerNumber.length > maxDigits) {
				let number = this.state.offerNumber.slice(this.state.offerNumber.length - maxDigits);
				number = parseInt(number) < 1 ? '1' : number;
				this.setState({ offerNumber: number });
			}
		}

		if (adjustBoth || this.state.currentView === PURCHASE_ORDER_VIEW) {
			maxDigits = 10;
			dateKey = this.state.purchaseOrderDate;
			options = [];

			if (dateKey === YEAR_KEY || dateKey === YEAR_SHORT_MONTH_KEY || dateKey === FY_KEY) {
				maxDigits = 6;
			} else if (dateKey === YEAR_MONTH_KEY || dateKey === YEAR_SHORT_MONTH_DAY_KEY) {
				maxDigits = 4;
			} else if (dateKey === YEAR_MONTH_DAY_KEY) {
				maxDigits = 2;
			} else if (dateKey === YEAR_SHORT_KEY) {
				maxDigits = 8;
			}

			for (let i = 2; i <= maxDigits; i++) {
				options.push({
					label: i + `-${resources.str_digit}`,
					value: i
				});
			}

			this.setState({ purchaseOrderDigitOptions: options });

			if (this.state.purchaseOrderCounterLength > maxDigits) {
				this.setState({ purchaseOrderCounterLength: maxDigits });
			}

			if (this.state.purchaseOrderNumber.length > maxDigits) {
				let number = this.state.purchaseOrderNumber.slice(this.state.purchaseOrderNumber.length - maxDigits);
				number = parseInt(number) < 1 ? '1' : number;
				this.setState({ purchaseOrderNumber: number });
			}
		}
	}

	onFrequencyOptionChange (option) {
		const { dateOptions } = this.state;
		if (this.state.currentView === INVOICE_VIEW) {
			this.setState({ invoiceResetFrequency: option.value });
			if (option.value === FREQUENCY_YEAR) {
				let newDateLabelsOptions = dateOptions.map((label) => {
					if (label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY) {
						label.disabled = true;
						return label;
					} else {
						label.disabled = false;
						return label;
					}
				})
				const dateString = convertDateKeyToPreview(FY_KEY);
				this.setState({ invoiceDateText: dateString});
				this.setState({ invoiceDate: FY_KEY })
				this.setState({dateOptions: newDateLabelsOptions})
			} else if (option.value === FREQUENCY_MONTH) {
				let newDateLabelsOptions = dateOptions.map((label) => {
					if (label.value === FY_KEY || label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY) {
						label.disabled = true;
						return label;
					} else {
						label.disabled = false;
						return label;
					}
				})
				const dateString = convertDateKeyToPreview(YEAR_SHORT_MONTH_KEY);
				this.setState({ invoiceDateText: dateString});
				this.setState({ invoiceDate: YEAR_SHORT_MONTH_KEY})
				this.setState({dateOptions: newDateLabelsOptions})
				this.setState({ invoiceResetSubFrequency: null })
			} else if (option.value === FREQUENCY_DAY) {
				let newDateLabelsOptions = dateOptions.map((label) => {
					if (label.value === FY_KEY || label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY || label.value === YEAR_MONTH_KEY || label.value === YEAR_SHORT_MONTH_KEY) {
						label.disabled = true;
						return label;
					} else {
						label.disabled = false;
						return label;
					}
				})
				const dateString = convertDateKeyToPreview(YEAR_SHORT_MONTH_DAY_KEY);
				this.setState({ invoiceDateText: dateString});
				this.setState({ invoiceDate: YEAR_SHORT_MONTH_DAY_KEY })
				this.setState({dateOptions: newDateLabelsOptions})
				this.setState({ invoiceResetSubFrequency: null })
			}
		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			this.setState({ purchaseOrderResetFrequency: option.value });
			if (option.value === FREQUENCY_YEAR) {
				let newDateLabelsOptions = dateOptions.map((label) => {
					if (label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY ) {
						label.disabled = true;
						return label;
					} else {
						label.disabled = false;
						return label;
					}
				})
				const dateString = convertDateKeyToPreview(FY_KEY);
				this.setState({ purchaseOrderDateText: dateString});
				this.setState({ purchaseOrderDate: FY_KEY })
				this.setState({dateOptions: newDateLabelsOptions})
			} else if (option.value === FREQUENCY_MONTH) {
				let newDateLabelsOptions = dateOptions.map((label) => {
					if (label.value === FY_KEY || label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY) {
						label.disabled = true;
						return label;
					} else {
						label.disabled = false;
						return label;
					}
				})
				const dateString = convertDateKeyToPreview(YEAR_SHORT_MONTH_KEY);
				this.setState({ purchaseOrderDateText: dateString});
				this.setState({ purchaseOrderDate: YEAR_SHORT_MONTH_KEY})
				this.setState({dateOptions: newDateLabelsOptions})
				this.setState({ purchaseOrderResetSubFrequency: null })
			} else if (option.value === FREQUENCY_DAY) {
				let newDateLabelsOptions = dateOptions.map((label) => {
					if (label.value === FY_KEY || label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY || label.value === YEAR_MONTH_KEY || label.value === YEAR_SHORT_MONTH_KEY) {
						label.disabled = true;
						return label;
					} else {
						label.disabled = false;
						return label;
					}
				})
				const dateString = convertDateKeyToPreview(YEAR_SHORT_MONTH_DAY_KEY);
				this.setState({ purchaseOrderDateText: dateString});
				this.setState({ purchaseOrderDate: YEAR_SHORT_MONTH_DAY_KEY })
				this.setState({dateOptions: newDateLabelsOptions})
				this.setState({ purchaseOrderResetSubFrequency: null })
			}
		} else {
			this.setState({ offerResetFrequency: option.value });
			if (option.value === FREQUENCY_YEAR) {
				let newDateLabelsOptions = dateOptions.map((label) => {
					if (label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY ) {
						label.disabled = true;
						return label;
					} else {
						label.disabled = false;
						return label;
					}
				})
				const dateString = convertDateKeyToPreview(FY_KEY);
				this.setState({ offerDateText: dateString});
				this.setState({ offerDate: FY_KEY })
				this.setState({dateOptions: newDateLabelsOptions})
			} else if (option.value === FREQUENCY_MONTH) {
				let newDateLabelsOptions = dateOptions.map((label) => {
					if (label.value === FY_KEY || label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY) {
						label.disabled = true;
						return label;
					} else {
						label.disabled = false;
						return label;
					}
				})
				const dateString = convertDateKeyToPreview(YEAR_SHORT_MONTH_KEY);
				this.setState({ offerDateText: dateString});
				this.setState({ offerDate: YEAR_SHORT_MONTH_KEY})
				this.setState({ dateOptions: newDateLabelsOptions})
				this.setState({ offerResetSubFrequency: null })
			} else if (option.value === FREQUENCY_DAY) {
				let newDateLabelsOptions = dateOptions.map((label) => {
					if (label.value === FY_KEY || label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY || label.value === YEAR_MONTH_KEY || label.value === YEAR_SHORT_MONTH_KEY) {
						label.disabled = true;
						return label;
					} else {
						label.disabled = false;
						return label;
					}
				})
				const dateString = convertDateKeyToPreview(YEAR_SHORT_MONTH_DAY_KEY);
				this.setState({ offerDateText: dateString});
				this.setState({ offerDate: YEAR_SHORT_MONTH_DAY_KEY })
				this.setState({ dateOptions: newDateLabelsOptions})
				this.setState({ offerResetSubFrequency: null })
			}
		}
		setTimeout(() => {
			this.adjustDigitOptions();
		});
	}

	onSubFrequencyOptionChange (option) {
		if (this.state.currentView === INVOICE_VIEW) {
			this.setState({ invoiceResetSubFrequency: option.value });
		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			this.setState({ purchaseOrderResetSubFrequency: option.value });
		} else {
			this.setState({ offerResetSubFrequency: option.value });
		}
		setTimeout(() => {
			this.adjustDigitOptions();
		});
	}

	onPeriodicSettingChange () {
		const { invoiceIsPeriodic, purchaseOrderIsPeriodic, offerIsPeriodic, dateOptions } = this.state;
		if (this.state.currentView === INVOICE_VIEW) {
			let newDateLabelsOptions = dateOptions.map((label) => {
				if (label.value === FY_KEY) {
					!invoiceIsPeriodic ? label.disabled = false : label.disabled = true;
					return label;
				} else if (label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY) {
					!invoiceIsPeriodic ? label.disabled = true : label.disabled = false;
					return label;
				} else {
					return label;
				}
			})
			this.setState({ invoiceIsPeriodic: !invoiceIsPeriodic, invoiceDate: !invoiceIsPeriodic ? FY_KEY : '', 
			invoiceDateText: !invoiceIsPeriodic ? convertDateKeyToPreview(FY_KEY) : '', 
			invoiceResetFrequency: !invoiceIsPeriodic ? FREQUENCY_YEAR : null, 
			invoiceResetSubFrequency: !invoiceIsPeriodic ? `January` : null,
			invoiceStartValue: 1});
		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			let newDateLabelsOptions = dateOptions.map((label) => {
				if (label.value === FY_KEY) {
					!purchaseOrderIsPeriodic ? label.disabled = false : label.disabled = true;
					return label;
				} else if (label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY) {
					!purchaseOrderIsPeriodic ? label.disabled = true : label.disabled = false;
					return label;
				} else {
					return label;
				}
			})
			this.setState({ purchaseOrderIsPeriodic: !purchaseOrderIsPeriodic, purchaseOrderDate: !purchaseOrderIsPeriodic ? FY_KEY : '', 
			purchaseOrderDateText: !purchaseOrderIsPeriodic ? convertDateKeyToPreview(FY_KEY) : '', 
			purchaseOrderResetFrequency: !purchaseOrderIsPeriodic ? FREQUENCY_YEAR : null, 
			purchaseOrderResetSubFrequency: !purchaseOrderIsPeriodic? `January` : null,
			purchaseOrderStartValue: 1});
		} else {
			let newDateLabelsOptions = dateOptions.map((label) => {
				if (label.value === FY_KEY) {
					!offerIsPeriodic ? label.disabled = false : label.disabled = true;
					return label;
				} else if (label.value === YEAR_KEY || label.value === YEAR_SHORT_KEY) {
					!offerIsPeriodic ? label.disabled = true : label.disabled = false;
					return label;
				} else {
					return label;
				}
			})
			this.setState({ offerIsPeriodic: !offerIsPeriodic, offerDate: !offerIsPeriodic ? FY_KEY : '', 
			offerDateText: !offerIsPeriodic ? convertDateKeyToPreview(FY_KEY) : '', 
			offerResetFrequency: !offerIsPeriodic ? FREQUENCY_YEAR : null, 
			offerResetSubFrequency: !offerIsPeriodic? `January` : null,
			offerStartValue: 1});
		}
	}

	onDateOptionChange(option) {
		const { resources } = this.props;
		const dateString = convertDateKeyToPreview(option.value);
		if (this.state.currentView === INVOICE_VIEW) {

			this.setState({ invoiceDate: option.value });
			this.setState({ invoiceDateText: dateString });
			if (option.value === '') {
				this.setState({ invoiceIsPeriodic: false,
				invoiceResetFrequency: null, 
				invoiceResetSubFrequency: null })
			}

		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			this.setState({ purchaseOrderDate: option.value });
			this.setState({ purchaseOrderDateText: dateString });
			if (option.value === '') {
				this.setState({ purchaseOrderIsPeriodic: false,
				purchaseOrderResetFrequency: null, 
				purchaseOrderResetSubFrequency: null })
			}
		} else {
			this.setState({ offerDate: option.value });
			this.setState({ offerDateText: dateString });
			if (option.value === '') {
				this.setState({ offerIsPeriodic: false,
				offerResetFrequency: null, 
				offerResetSubFrequency: null })
			}
		}
		setTimeout(() => {	
			if (this.state.currentView === INVOICE_VIEW) {
				// if (this.state.invoiceDate !== this.props.numerationOptions.invoice.datePart) {
					invoiz
					.request(`${config.settings.endpoints.getNumerationSettingDate}invoice/${option.value}`, {
						auth: true,
						method: 'GET'
					})
					.then(response => {
						const { currentValue, increment } = response.body.data;
						this.setState({ invoiceNumber: parseInt(currentValue) + parseInt(increment) })
						this.adjustDigitOptions();
						this.onInputNumberBlur();
					})
					.catch(() => {
						this.setState({ startNumberError: resources.numerationStartValueFetchError})
					});
				// }
			} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
		//	if (this.state.purchaseOrderDate !== this.props.numerationOptions.purchaseOrder.datePart) {
				invoiz
				.request(`${config.settings.endpoints.getNumerationSettingDate}purchaseOrder/${option.value}`, {
					auth: true,
					method: 'GET'
				})
				.then(response => {
					const { currentValue, increment } = response.body.data;
					this.setState({ purchaseOrderNumber: parseInt(currentValue) + parseInt(increment) })
					this.adjustDigitOptions();
					this.onInputNumberBlur();
				})
				.catch(() => {
					this.setState({ startNumberError: resources.numerationStartValueFetchError})
				});
			// }
			} else {
		//	if (this.state.offerDate !== this.props.numerationOptions.offer.datePart) {
				invoiz
				.request(`${config.settings.endpoints.getNumerationSettingDate}offer/${option.value}`, {
					auth: true,
					method: 'GET'
				})
				.then(response => {
					const { currentValue, increment } = response.body.data;
					this.setState({ offerNumber: parseInt(currentValue) + parseInt(increment) })
					this.adjustDigitOptions();
					this.onInputNumberBlur();
				})
				.catch(() => {
					this.setState({ startNumberError: resources.numerationStartValueFetchError})
				});
		//	}
			}
		});
	}

	onDigitOptionChange(option) {
		if (this.state.currentView === INVOICE_VIEW) {
			this.setState({ invoiceCounterLength: option.value });

			const length = this.state.invoiceNumber && this.state.invoiceNumber.length;
			if (length > option.value) {
				let number = this.state.invoiceNumber.toString();
				number = number.slice(length - option.value, length);
				number = parseInt(number) < 1 ? '1' : number;
				this.setState({ invoiceNumber: number });
			}
		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			this.setState({ purchaseOrderCounterLength: option.value });

			const length = this.state.purchaseOrderNumber && this.state.purchaseOrderNumber.length;
			if (length > option.value) {
				let number = this.state.purchaseOrderNumber.toString();
				number = number.slice(length - option.value, length);
				number = parseInt(number) < 1 ? '1' : number;
				this.setState({ purchaseOrderNumber: number });
			}
		} else {
			this.setState({ offerCounterLength: option.value });

			const length = this.state.offerNumber && this.state.offerNumber.length;
			if (length > option.value) {
				let number = this.state.offerNumber.toString();
				number = number.slice(length - option.value, length);
				number = parseInt(number) < 1 ? '1' : number;
				this.setState({ offerNumber: number });
			}
		}

		setTimeout(() => {
			this.onInputNumberBlur();
		});
	}

	onPlaceholderOptionChange(option, placeholder) {
		const newState = {};

		if (this.state.currentView === INVOICE_VIEW) {
			if (placeholder === 'placeholder1') {
				newState.invoicePlaceholder1 = option.value;
			} else if (placeholder === 'placeholder2') {
				newState.invoicePlaceholder2 = option.value;
			} else {
				newState.invoicePlaceholder3 = option.value;
			}
		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			if (placeholder === 'placeholder1') {
				newState.purchaseOrderPlaceholder1 = option.value;
			} else if (placeholder === 'placeholder2') {
				newState.purchaseOrderPlaceholder2 = option.value;
			} else {
				newState.purchaseOrderPlaceholder3 = option.value;
			}
		} else {
			if (placeholder === 'placeholder1') {
				newState.offerPlaceholder1 = option.value;
			} else if (placeholder === 'placeholder2') {
				newState.offerPlaceholder2 = option.value;
			} else {
				newState.offerPlaceholder3 = option.value;
			}
		}

		this.setState(newState);

		setTimeout(() => {
			this.adjustDigitOptions();
			this.onInputNumberBlur();
		});
	}

	onTabInputChange(filter) {
		// this.setState({ currentView: this.state.currentView === INVOICE_VIEW ? OFFER_VIEW : this.state.currentView === PURCHASE_ORDER_VIEW ? INVOICE_VIEW : PURCHASE_ORDER_VIEW });
		if (filter.key === INVOICE_VIEW) {
			this.setState({
				isOfferActive: false,
				isInvoiceActive: true,
				isPurchaseOrderActive: false,
				currentView: INVOICE_VIEW
			 });
		} else if (filter.key === PURCHASE_ORDER_VIEW) {
			this.setState({
				isOfferActive: false,
				isInvoiceActive: false,
				isPurchaseOrderActive: true,
				currentView: PURCHASE_ORDER_VIEW
			 });
		} else {
			this.setState({
				isOfferActive: true,
				isInvoiceActive: false,
				isPurchaseOrderActive: false,
				currentView: OFFER_VIEW
			 });
		}
		
		setTimeout(() => {
			const dateKey = this.state.currentView === INVOICE_VIEW ? this.state.invoiceDate : this.state.currentView === PURCHASE_ORDER_VIEW ? this.state.purchaseOrderDate : this.state.offerDate;
			this.onDateOptionChange({ value: dateKey });
			this.onInputNumberBlur();
			this.disableOptions();
		});
	}

	onInputNumberChange(event) {
		const isValid = /^[0-9]*$/.test(event.target.value);

		const maxLength =
			this.state.currentView === INVOICE_VIEW ? this.state.invoiceCounterLength : this.state.currentView === PURCHASE_ORDER_VIEW ? this.state.purchaseOrderCounterLength : this.state.offerCounterLength;
		if (!isValid || event.target.value.length > maxLength) {
			return;
		}

		if (this.state.currentView === INVOICE_VIEW) {
			this.setState({ invoiceNumber: event.target.value, invoiceNumberError: '' });
		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			this.setState({ purchaseOrderNumber: event.target.value, purchaseOrderNumberError: '' });
		} else {
			this.setState({ offerNumber: event.target.value, offerNumberError: '' });
		}
	}

	onInputNumberBlur() {
		if (this.state.currentView === INVOICE_VIEW) {
			let number = this.state.invoiceNumber.toString();
			if (parseInt(number) === 0 || number.length === 0) {
				number = this.props.numerationOptions.invoice.currentValue.toString();
				if (number.length > this.state.invoiceCounterLength) {
					number = number.slice(number.length - this.state.invoiceCounterLength);
					if (parseInt(number) < 1) {
						number = '1';
					}
				}
			}
			number = number.padStart(this.state.invoiceCounterLength, '0');
			this.setState({ invoiceNumber: number, invoiceNumberError: '' });
		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			let number = this.state.purchaseOrderNumber.toString();
			if (parseInt(number) === 0 || number.length === 0) {
				number = this.props.numerationOptions.purchaseOrder.startValue.toString();
				if (number.length > this.state.purchaseOrderCounterLength) {
					number = number.slice(number.length - this.state.purchaseOrderCounterLength);
					if (parseInt(number) < 1) {
						number = '1';
					}
				}
			}
			number = number.padStart(this.state.purchaseOrderCounterLength, '0');
			this.setState({ purchaseOrderNumber: number, purchaseOrderNumberError: '' });
		} else {
			let number = this.state.offerNumber.toString();
			if (parseInt(number) === 0 || number.length === 0) {
				number = this.props.numerationOptions.offer.startValue.toString();
				if (number.length > this.state.offerCounterLength) {
					number = number.slice(number.length - this.state.offerCounterLength);
					if (parseInt(number) < 1) {
						number = '1';
					}
				}
			}
			number = number.padStart(this.state.offerCounterLength, '0');
			this.setState({ offerNumber: number, offerNumberError: '' });
		}
	}

	onPrefixChange(event) {
		const value = event.target.value;

		if (this.state.currentView === INVOICE_VIEW) {
			this.setState({ invoicePrefix: value }, () => {
				this.onInputNumberBlur();
			});
		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			this.setState({ purchaseOrderPrefix: value }, () => {
				this.onInputNumberBlur();
			});
		} else {
			this.setState({ offerPrefix: value }, () => {
				this.onInputNumberBlur();
			});
		}
	}

	onSuffixChange(event) {
		const value = event.target.value;

		if (this.state.currentView === INVOICE_VIEW) {
			this.setState({ invoiceSuffix: value }, () => {
				this.onInputNumberBlur();
			});
		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			this.setState({ purchaseOrderSuffix: value }, () => {
				this.onInputNumberBlur();
			});
		} else {
			this.setState({ offerSuffix: value }, () => {
				this.onInputNumberBlur();
			});
		}
	}

	onDisplayClick(id, isSelect) {
		if (isSelect) {
			this.refs[id].getSelectInput().focus();
		} else {
			$('#' + id).focus();
		}
	}

	onInputFocus(id) {
		$('#' + id).addClass('triggeredHover');
	}

	onInputBlur() {
		$('.numeration-display, .numeration-number-input').removeClass('triggeredHover');
	}

	onCancelClick() {
		if (this.state.isWrapped) {
			ModalService.close();
		} else {
			this.props.onCancel && this.props.onCancel();
		}
	}

	onSaveClick() {
		const { resources } = this.props;
		const offerData = {
			counterLength: this.state.offerCounterLength,
			datePart: this.state.offerDate,
			prefix: this.state.offerPrefix,
			relationKind: 'offer',
			//startValue: this.state.offerNumber,
			suffix: this.state.offerSuffix,
			placeHolder1: this.state.offerPlaceholder1,
			placeHolder2: this.state.offerPlaceholder2,
			placeHolder3: this.state.offerPlaceholder3,
			isPeriodic: this.state.offerIsPeriodic,
			frequency: this.state.offerResetFrequency,
			subFrequency: this.state.offerResetSubFrequency,
			currentValue: parseInt(this.state.offerNumber) - 1,
			increment: this.state.offerIncrementBy,
			startValue: this.state.offerStartValue
		};
		const invoiceData = {
			counterLength: this.state.invoiceCounterLength,
			datePart: this.state.invoiceDate,
			prefix: this.state.invoicePrefix,
			relationKind: 'invoice',
			//startValue: this.state.invoiceNumber,
			suffix: this.state.invoiceSuffix,
			placeHolder1: this.state.invoicePlaceholder1,
			placeHolder2: this.state.invoicePlaceholder2,
			placeHolder3: this.state.invoicePlaceholder3,
			isPeriodic: this.state.invoiceIsPeriodic,
			frequency: this.state.invoiceResetFrequency,
			subFrequency: this.state.invoiceResetSubFrequency,
			currentValue: parseInt(this.state.invoiceNumber) - 1,
			increment: this.state.invoiceIncrementBy,
			startValue: this.state.invoiceStartValue
		};

		const purchaseOrderData = {
			counterLength: this.state.purchaseOrderCounterLength,
			datePart: this.state.purchaseOrderDate,
			prefix: this.state.purchaseOrderPrefix,
			relationKind: 'purchaseOrder',
			//startValue: this.state.purchaseOrderNumber,
			suffix: this.state.purchaseOrderSuffix,
			placeHolder1: this.state.purchaseOrderPlaceholder1,
			placeHolder2: this.state.purchaseOrderPlaceholder2,
			placeHolder3: this.state.purchaseOrderPlaceholder3,
			frequency: this.state.purchaseOrderResetFrequency,
			subFrequency: this.state.purchaseOrderResetSubFrequency,
			currentValue: parseInt(this.state.purchaseOrderNumber) - 1,
			increment: this.state.purchaseOrderIncrementBy,
			startValue: this.state.purchaseOrderStartValue,
			isPeriodic: this.state.purchaseOrderIsPeriodic,
		};

		const invoiceNumberError = resources.numerationInvoiceError;
		const offerNumberError = resources.numerationOfferError;
		const purchaseOrderNumberError = resources.numerationPurchaseOrderError;

		const incrementByError = resources.numerationIncrementNumberError;
		const startNumberError = resources.numerationStartValueNumberError;

		if (this.isOnlyOffer) {
			invoiz
				.request(config.settings.endpoints.updateOfferNumeration, {
					auth: true,
					method: 'POST',
					data: offerData
				})
				.then(response => {
					if (this.onSave) {
						this.onSave(offerData);
					}
					this.props.numerationOptions.offer.currentValue = parseInt(this.state.offerNumber);
					invoiz.page.showToast({
						message: resources.numberationOfferRangeSuccessMessage
					});
				})
				.catch(() => {
					this.setState({ offerNumberError });
				});
		} else if (this.isOnlyPurchaseOrder) {
			invoiz
				.request(config.settings.endpoints.updatePurchaseOrderNumeration, {
					auth: true,
					method: 'POST',
					data: purchaseOrderData
				})
				.then(response => {
					if (this.onSave) {
						this.onSave(purchaseOrderData);
					}
					this.props.numerationOptions.purchaseOrder.currentValue = parseInt(this.state.purchaseOrderNumber);
					invoiz.page.showToast({
						message: resources.numberationPurchaseOrderRangeSuccessMessage
					});
				})
				.catch(() => {
					this.setState({ purchaseOrderNumberError });
				});
		} else if (this.isOnlyInvoice) {
			invoiz
				.request(config.settings.endpoints.updateInvoiceNumeration, {
					auth: true,
					method: 'POST',
					data: invoiceData
				})
				.then(response => {
					if (this.onSave) {
						this.onSave(invoiceData);
					}
					this.props.numerationOptions.invoice.currentValue = parseInt(this.state.invoiceNumber);
					invoiz.page.showToast({
						message: resources.numberationInvoiceRangeSuccessMessage
					});
				})
				.catch(() => {
					this.setState({ invoiceNumberError });
				});
		} else {
			invoiz
				.request(config.settings.endpoints.updateInvoiceNumeration, {
					auth: true,
					method: 'POST',
					data: invoiceData
				})
				.then(response => {
					invoiz
						.request(config.settings.endpoints.updateOfferNumeration, {
							auth: true,
							method: 'POST',
							data: offerData
						})
						.then(response => {
							invoiz.request(config.settings.endpoints.updatePurchaseOrderNumeration, {
								auth: true,
								method: 'POST',
								data: purchaseOrderData
							}).then(response => {
								if (this.onSave) {
									this.onSave(invoiceData, offerData, purchaseOrderData);
								}
								this.props.numerationOptions.invoice.currentValue = parseInt(this.state.invoiceNumber);
								this.props.numerationOptions.offer.currentValue = parseInt(this.state.offerNumber);
								this.props.numerationOptions.purchaseOrder.currentValue = parseInt(this.state.purchaseOrderNumber);
								invoiz.page.showToast({ message: resources.numerationSaveSuccess });
							}).catch((error) => {
								if (error.body.meta && error.body.meta.increment && error.body.meta.increment[0]) {
									this.setState ({ incrementByError })
								} else if (error.body.meta && error.body.meta.startValue && error.body.meta.startValue[0]) {
									this.setState ({ startNumberError })
								} else {
									this.setState({ purchaseOrderNumberError });
								}
							});
						})
						.catch((error) => {
							if (!this.isOnlyOffer && this.state.currentView !== OFFER_VIEW) {
								this.refs['tabInput'].handleLabelClick();
							}
							setTimeout(() => {
								if (error.body.meta && error.body.meta.increment && error.body.meta.increment[0]) {
									this.setState ({ incrementByError })
								} else if (error.body.meta && error.body.meta.startValue && error.body.meta.startValue[0]) {
									this.setState ({ startNumberError })
								} else {
								this.setState({ offerNumberError });
								}
							});
						});
				})
				.catch((error) => {
					if (!this.isOnlyInvoice && this.state.currentView !== INVOICE_VIEW) {
						this.refs['tabInput'].handleLabelClick();
					}
					setTimeout(() => {
						if (error.body.meta && error.body.meta.increment && error.body.meta.increment[0]) {
							this.setState ({ incrementByError })
						} else if (error.body.meta && error.body.meta.startValue && error.body.meta.startValue[0]) {
							this.setState ({ startNumberError})
						} else {
							this.setState({ invoiceNumberError });
						}
					});
				});
		}
	}

	onPrefixBlur() {
		const { resources } = this.props;
		const errorText = resources.numberationPrefixError;

		if (!/^[a-zA-Z]*$/.test(this.state.invoicePrefix[this.state.invoicePrefix.length - 1])) {
			this.setState({ invoicePrefixError: errorText });
		} else {
			this.setState({ invoicePrefixError: '' });
		}

		if (!/^[a-zA-Z]*$/.test(this.state.offerPrefix[this.state.offerPrefix.length - 1])) {
			this.setState({ offerPrefixError: errorText });
		} else {
			this.setState({ offerPrefixError: '' });
		}
		if (!/^[a-zA-Z]*$/.test(this.state.purchaseOrderPrefix[this.state.purchaseOrderPrefix.length - 1])) {
			this.setState({ purchaseOrderPrefixError: errorText });
		} else {
			this.setState({ purchaseOrderPrefixError: '' });
		}

		this.onInputBlur();
	}

	onSuffixBlur() {
		const { resources } = this.props;
		let isValid;
		let char;
		const errorText = resources.numberationSuffixError;

		if (this.state.currentView === INVOICE_VIEW) {
			char = this.state.invoiceSuffix[0];
			isValid = /^[a-zA-Z]*$/.test(char);
			if (!isValid) {
				this.setState({ invoiceSuffixError: errorText });
			} else {
				this.setState({ invoiceSuffixError: '' });
			}
		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			char = this.state.purchaseOrderSuffix[0];
			isValid = /^[a-zA-Z]*$/.test(char);
			if (!isValid) {
				this.setState({ purchaseOrderSuffixError: errorText });
			} else {
				this.setState({ purchaseOrderSuffixError: '' });
			}
		} else {
			char = this.state.offerSuffix[0];
			isValid = /^[a-zA-Z]*$/.test(char);
			if (!isValid) {
				this.setState({ offerSuffixError: errorText });
			} else {
				this.setState({ offerSuffixError: '' });
			}
		}

		this.onInputBlur();
	}

	onIncrementByChange(key, value) {
		//const errorText = resources.numerationIncrementNumberError;

		// if (value <= 0) {
		// 	this.setState({ [key]: value, incrementByError: errorText})
		// } else {
			this.setState({ [key]: value, incrementByError: '' });
	//	}
	}

	onStartValueChange(key, value) {
		// if (value <= 0) {
		// 	this.setState({ [key]: value, startNumberError: 'Please enter a value greater or equal to 1'})
		// } else {
			this.setState({ [key]: value, startNumberError: '' });
	//	}
	}

	render() {
		let content;
		const { resources } = this.props;
		const { canEditNumericRanges } = this.state;
		if (this.state.currentView === INVOICE_VIEW) {
			content = (
				<div>
					<div className="numeration-display-wrapper">
						<span
							className={`numeration-display ${this.state.invoicePrefix ? 'has-margin' : ''}`}
							id="invoicePrefixDisplay"
							onClick={() => this.onDisplayClick('invoicePrefix')}
						>
							{this.state.invoicePrefix}
						</span>
						<span
							className={`numeration-display placeholder ${
								this.state.invoicePlaceholder1 ? 'has-margin' : ''
							}`}
							id="invoicePlaceholder1Display"
							onClick={() => this.onDisplayClick('invoicePlaceholder1', true)}
						>
							{this.state.invoicePlaceholder1}
						</span>
						<span
							className={`numeration-display ${this.state.invoiceDateText ? 'has-margin' : ''}`}
							id="invoiceDateDisplay"
							onClick={() => this.onDisplayClick('invoiceDate', true)}
						>
							{this.state.invoiceDateText}
						</span>
						<span
							className={`numeration-display placeholder ${
								this.state.invoicePlaceholder2 ? 'has-margin' : ''
							}`}
							id="invoicePlaceholder2Display"
							onClick={() => this.onDisplayClick('invoicePlaceholder2', true)}
						>
							{this.state.invoicePlaceholder2}
						</span>
						<input
							type="text"
							id="invoiceNumberDisplay"
							className={`numeration-number-input digits-${this.state.invoiceCounterLength} ${
								this.state.invoiceNumberError ? 'error' : ''
							}`}
							value={this.state.invoiceNumber}
							onBlur={this.onInputNumberBlur}
							onChange={this.onInputNumberChange}
						/>
						<span
							className={`numeration-display placeholder ${
								this.state.invoicePlaceholder3 ? 'has-margin' : ''
							}`}
							id="invoicePlaceholder3Display"
							onClick={() => this.onDisplayClick('invoicePlaceholder3', true)}
						>
							{this.state.invoicePlaceholder3}
						</span>
						<span
							className={`numeration-display ${this.state.invoiceSuffix ? 'has-margin-left' : ''}`}
							id="invoiceSuffixDisplay"
							onClick={() => this.onDisplayClick('invoiceSuffix')}
						>
							{this.state.invoiceSuffix}
						</span>
					</div>

					<div className="col-xs-12 numeration-inputs-wrapper">
						<div className="numeration-prefix">
							<label>{resources.str_prefix}</label>
							<input
								type="text"
								maxLength="3"
								id="invoicePrefix"
								value={this.state.invoicePrefix}
								className={`numeration-input ${this.state.invoicePrefixError ? 'error' : ''}`}
								onFocus={() => this.onInputFocus('invoicePrefixDisplay')}
								onBlur={this.onPrefixBlur}
								onChange={this.onPrefixChange}
							/>
						</div>

						<div
							className={`numeration-placeholder1 ${
								this.state.invoicePlaceholder1 === '' ? 'empty-selected' : ''
							}`}
						>
							<label />
							<SelectInputComponent
								ref="invoicePlaceholder1"
								name="invoicePlaceholder1"
								allowCreate={false}
								notAsync={true}
								options={Object.assign({}, this.placeholderSelectOptions, {
									handleChange: option => {
										this.onPlaceholderOptionChange(option, 'placeholder1');
									}
								})}
								value={this.state.invoicePlaceholder1}
								loadedOptions={this.placeholderLoadedOptions}
								onFocus={() => this.onInputFocus('invoicePlaceholder1Display')}
								onBlur={this.onInputBlur}
								onChange={option => {
									this.onPlaceholderOptionChange(option, 'placeholder1');
								}}
							/>
						</div>

						<div className="numeration-date-format">
							<label>{resources.str_date}</label>
							<SelectInputComponent
								ref="invoiceDate"
								name="invoiceDate"
								allowCreate={false}
								notAsync={true}
								options={this.dateSelectOptions}
								value={this.state.invoiceDate}
								loadedOptions={this.state.dateOptions}
								onFocus={() => this.onInputFocus('invoiceDateDisplay')}
								onBlur={this.onInputBlur}
								onChange={this.onDateOptionChange}
							/>
						</div>

						<div
							className={`numeration-placeholder2 ${
								this.state.invoicePlaceholder2 === '' ? 'empty-selected' : ''
							}`}
						>
							<label />
							<SelectInputComponent
								ref="invoicePlaceholder2"
								name="invoicePlaceholder2"
								allowCreate={false}
								notAsync={true}
								options={Object.assign({}, this.placeholderSelectOptions, {
									handleChange: option => {
										this.onPlaceholderOptionChange(option, 'placeholder2');
									}
								})}
								value={this.state.invoicePlaceholder2}
								loadedOptions={this.placeholderLoadedOptions}
								onFocus={() => this.onInputFocus('invoicePlaceholder2Display')}
								onBlur={this.onInputBlur}
								onChange={option => {
									this.onPlaceholderOptionChange(option, 'placeholder2');
								}}
							/>
						</div>

						<div className="numeration-digit-count">
							<label>{resources.str_serialNo}</label>
							<SelectInputComponent
								allowCreate={false}
								notAsync={true}
								options={this.digitSelectOptions}
								value={this.state.invoiceCounterLength}
								loadedOptions={this.state.invoiceDigitOptions}
								onFocus={() => this.onInputFocus('invoiceNumberDisplay')}
								onBlur={this.onInputBlur}
								onChange={this.onDigitOptionChange}
							/>
						</div>

						<div
							className={`numeration-placeholder3 ${
								this.state.invoicePlaceholder3 === '' ? 'empty-selected' : ''
							}`}
						>
							<label />
							<SelectInputComponent
								ref="invoicePlaceholder3"
								name="invoicePlaceholder3"
								allowCreate={false}
								notAsync={true}
								options={Object.assign({}, this.placeholderSelectOptions, {
									handleChange: option => {
										this.onPlaceholderOptionChange(option, 'placeholder3');
									}
								})}
								value={this.state.invoicePlaceholder3}
								loadedOptions={this.placeholderLoadedOptions}
								onFocus={() => this.onInputFocus('invoicePlaceholder3Display')}
								onBlur={this.onInputBlur}
								onChange={option => {
									this.onPlaceholderOptionChange(option, 'placeholder3');
								}}
							/>
						</div>

						<div className="numeration-suffix">
							<label>{resources.str_suffix}</label>
							<input
								type="text"
								maxLength="3"
								id="invoiceSuffix"
								value={this.state.invoiceSuffix}
								className={`numeration-input ${this.state.invoiceSuffixError ? 'error' : ''}`}
								onFocus={() => this.onInputFocus('invoiceSuffixDisplay')}
								onBlur={this.onSuffixBlur}
								onChange={this.onSuffixChange}
							/>
						</div>
					</div>
					<div className="additional-settings-wrapper">
						<div className="col-xs-6 increment-by-setting">
							<NumberInputComponent
								ref="invoiceIncrementBy"
								label={`Increment number by`}
								name="invoiceIncrementBy"
								maxLength="3"
								value={parseInt(this.state.invoiceIncrementBy)}
								isDecimal={false}
								//errorMessage={this.state.incrementByError}
								onChange={(value) => this.onIncrementByChange('invoiceIncrementBy', value)}
								defaultNonZero={true}
								hasBorder
							/>
						</div>
						<div className="periodic-setting">
								<OvalToggleComponent
									checked={this.state.invoiceIsPeriodic}
									onChange={() => {
										this.onPeriodicSettingChange()
									}}
									newStyle={true}
									labelText={`Reset numbers periodically?`}
									labelLeft
									customClass={'toggle-setting-periodic'}
								/>
						</div>
						{
							this.state.invoiceIsPeriodic ? (
								<div className="periodic-setting-frequency">
									<div className="numeration-date-format">
										<label>{`Number reset interval`}</label>
										<SelectInputComponent
											ref="invoiceResetFrequency"
											name="invoiceResetFrequency"
											allowCreate={false}
											notAsync={true}
											options={this.frequencySelectOptions}
											value={this.state.invoiceResetFrequency}
											loadedOptions={this.state.frequencyOptions}
											onFocus={() => this.onInputFocus('invoiceDateDisplay')}
											//onBlur={this.onInputBlur}
											onChange={this.onFrequencyOptionChange}
										/>
									</div>
									{
										this.state.invoiceResetFrequency === FREQUENCY_YEAR ? (
											<div className="numeration-date-format">
												<label>{`Reset number from`}</label>
												<SelectInputComponent
													ref="invoiceResetSubFrequency"
													name="invoiceResetSubFrequency"
													allowCreate={false}
													notAsync={true}
													options={this.subFrequencySelectOptions}
													value={this.state.invoiceResetSubFrequency}
													loadedOptions={this.state.subFrequencyOptions}
													//onFocus={() => this.onInputFocus('invoiceDateDisplay')}
													onBlur={this.onInputBlur}
													onChange={this.onSubFrequencyOptionChange}
												/>
											</div>
										) : null
									}
									<div className="increment-by-setting">
											<NumberInputComponent
												ref="invoiceStartValue"
												//dataQsId="settings-account-mobile"
												label={`Start number from`}
												name="invoiceStartValue"
												maxLength="6"
												value={parseInt(this.state.invoiceStartValue)}
												isDecimal={false}
												//errorMessage={this.state.startNumberError}
												onChange={(value) => this.onStartValueChange('invoiceStartValue', value)}
												//onBlur={value => this.onMobileNumberBlur(value)}
												defaultNonZero={true}
												hasBorder
											/>
									</div>
								</div>
							) : null
						}
					</div>
				</div>
			);
		} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
			content = (
				<div>
					<div className="numeration-display-wrapper">
						<span
							className={`numeration-display ${this.state.purchaseOrderPrefix ? 'has-margin' : ''}`}
							id="purchaseOrderPrefixDisplay"
							onClick={() => this.onDisplayClick('purchaseOrderPrefix')}
						>
							{this.state.purchaseOrderPrefix}
						</span>
						<span
							className={`numeration-display placeholder has-margin-left ${
								this.state.purchaseOrderPlaceholder1 ? 'has-margin' : ''
							}`}
							id="purchaseOrderPlaceholder1Display"
							onClick={() => this.onDisplayClick('purchaseOrderPlaceholder1', true)}
						>
							{this.state.purchaseOrderPlaceholder1}
						</span>
						<span
							className={`numeration-display ${this.state.purchaseOrderDateText ? 'has-margin' : ''}`}
							id="purchaseOrderDateDisplay"
							onClick={() => this.onDisplayClick('purchaseOrderDate', true)}
						>
							{this.state.purchaseOrderDateText}
						</span>
						<span
							className={`numeration-display placeholder has-margin-left ${
								this.state.purchaseOrderPlaceholder2 ? 'has-margin' : ''
							}`}
							id="purchaseOrderPlaceholder2Display"
							onClick={() => this.onDisplayClick('purchaseOrderPlaceholder2', true)}
						>
							{this.state.purchaseOrderPlaceholder2}
						</span>
						<input
							type="text"
							id="purchaseOrderNumberDisplay"
							className={`numeration-number-input digits-${this.state.purchaseOrderCounterLength} ${
								this.state.purchaseOrderNumberError ? 'error' : ''
							}`}
							value={this.state.purchaseOrderNumber}
							onBlur={this.onInputNumberBlur}
							onChange={this.onInputNumberChange}
						/>
						<span
							className={`numeration-display placeholder has-margin-left ${
								this.state.purchaseOrderPlaceholder3 ? 'has-margin' : ''
							}`}
							id="purchaseOrderPlaceholder3Display"
							onClick={() => this.onDisplayClick('purchaseOrderPlaceholder3', true)}
						>
							{this.state.purchaseOrderPlaceholder3}
						</span>
						<span
							className={`numeration-display ${this.state.purchaseOrderSuffix ? 'has-margin-left' : ''}`}
							id="purchaseOrderSuffixDisplay"
							onClick={() => this.onDisplayClick('purchaseOrderSuffix')}
						>
							{this.state.purchaseOrderSuffix}
						</span>
					</div>

					<div className="col-xs-12 numeration-inputs-wrapper">
						<div className="numeration-prefix">
							<label>{resources.str_prefix}</label>
							<input
								type="text"
								maxLength="3"
								id="purchaseOrderPrefix"
								value={this.state.purchaseOrderPrefix}
								className={`numeration-input ${this.state.purchaseOrderPrefixError ? 'error' : ''}`}
								onFocus={() => this.onInputFocus('purchaseOrderPrefixDisplay')}
								onBlur={this.onPrefixBlur}
								onChange={this.onPrefixChange}
							/>
						</div>

						<div
							className={`numeration-placeholder1 ${
								this.state.purchaseOrderPlaceholder1 === '' ? 'empty-selected' : ''
							}`}
						>
							<label />
							<SelectInputComponent
								ref="purchaseOrderPlaceholder1"
								name="purchaseOrderPlaceholder1"
								allowCreate={false}
								notAsync={true}
								options={Object.assign({}, this.placeholderSelectOptions, {
									handleChange: option => {
										this.onPlaceholderOptionChange(option, 'placeholder1');
									}
								})}
								value={this.state.purchaseOrderPlaceholder1}
								loadedOptions={this.placeholderLoadedOptions}
								onFocus={() => this.onInputFocus('purchaseOrderPlaceholder1Display')}
								onBlur={this.onInputBlur}
								onChange={option => {
									this.onPlaceholderOptionChange(option, 'placeholder1');
								}}
							/>
						</div>

						<div className="numeration-date-format">
							<label>{resources.str_date}</label>
							<SelectInputComponent
								ref="purchaseOrderDate"
								name="purchaseOrderDate"
								allowCreate={false}
								notAsync={true}
								options={this.dateSelectOptions}
								value={this.state.purchaseOrderDate}
								loadedOptions={this.state.dateOptions}
								onFocus={() => this.onInputFocus('purchaseOrderDateDisplay')}
								onBlur={this.onInputBlur}
								onChange={this.onDateOptionChange}
							/>
						</div>

						<div
							className={`numeration-placeholder2 ${
								this.state.purchaseOrderPlaceholder2 === '' ? 'empty-selected' : ''
							}`}
						>
							<label />
							<SelectInputComponent
								ref="purchaseOrderPlaceholder2"
								name="purchaseOrderPlaceholder2"
								allowCreate={false}
								notAsync={true}
								options={Object.assign({}, this.placeholderSelectOptions, {
									handleChange: option => {
										this.onPlaceholderOptionChange(option, 'placeholder2');
									}
								})}
								value={this.state.purchaseOrderPlaceholder2}
								loadedOptions={this.placeholderLoadedOptions}
								onFocus={() => this.onInputFocus('purchaseOrderPlaceholder2Display')}
								onBlur={this.onInputBlur}
								onChange={option => {
									this.onPlaceholderOptionChange(option, 'placeholder2');
								}}
							/>
						</div>

						<div className="numeration-digit-count">
							<label>{resources.str_serialNo}</label>
							<SelectInputComponent
								allowCreate={false}
								notAsync={true}
								options={this.digitSelectOptions}
								value={this.state.purchaseOrderCounterLength}
								loadedOptions={this.state.purchaseOrderDigitOptions}
								onFocus={() => this.onInputFocus('purchaseOrderNumberDisplay')}
								onBlur={this.onInputBlur}
								onChange={this.onDigitOptionChange}
							/>
						</div>

						<div
							className={`numeration-placeholder3 ${
								this.state.purchaseOrderPlaceholder3 === '' ? 'empty-selected' : ''
							}`}
						>
							<label />
							<SelectInputComponent
								ref="purchaseOrderPlaceholder3"
								name="purchaseOrderPlaceholder3"
								allowCreate={false}
								notAsync={true}
								options={Object.assign({}, this.placeholderSelectOptions, {
									handleChange: option => {
										this.onPlaceholderOptionChange(option, 'placeholder3');
									}
								})}
								value={this.state.purchaseOrderPlaceholder3}
								loadedOptions={this.placeholderLoadedOptions}
								onFocus={() => this.onInputFocus('purchaseOrderPlaceholder3Display')}
								onBlur={this.onInputBlur}
								onChange={option => {
									this.onPlaceholderOptionChange(option, 'placeholder3');
								}}
							/>
						</div>

						<div className="numeration-suffix">
							<label>{resources.str_suffix}</label>
							<input
								type="text"
								maxLength="3"
								id="purchaseOrderSuffix"
								value={this.state.purchaseOrderSuffix}
								className={`numeration-input ${this.state.purchaseOrderSuffixError ? 'error' : ''}`}
								onFocus={() => this.onInputFocus('purchaseOrderSuffixDisplay')}
								onBlur={this.onSuffixBlur}
								onChange={this.onSuffixChange}
							/>
						</div>
					</div>
					<div className="additional-settings-wrapper">
						<div className="col-xs-6 increment-by-setting">
							<NumberInputComponent
								ref="purchaseOrderIncrementBy"
								//dataQsId="settings-account-mobile"
								label={`Increment number by`}
								name="purchaseOrderIncrementBy"
								maxLength="3"
								value={this.state.purchaseOrderIncrementBy}
								isDecimal={false}
								//errorMessage={this.state.incrementByError}
								onChange={(value) => this.onIncrementByChange('purchaseOrderIncrementBy', value)}
								//onBlur={value => this.onMobileNumberBlur(value)}
								defaultNonZero={true}
								hasBorder
							/>
						</div>
						<div className="periodic-setting">
								<OvalToggleComponent
									checked={this.state.purchaseOrderIsPeriodic}
									onChange={() => {
										this.onPeriodicSettingChange()
									}}
									newStyle={true}
									labelText={`Reset numbers periodically?`}
									labelLeft
									customClass={'toggle-setting-periodic'}
								/>
						</div>
						{
							this.state.purchaseOrderIsPeriodic ? (
								<div className="periodic-setting-frequency">
									<div className="numeration-date-format">
										<label>{`Number reset interval`}</label>
										<SelectInputComponent
											ref="purchaseOrderResetFrequency"
											name="purchaseOrderResetFrequency"
											allowCreate={false}
											notAsync={true}
											options={this.frequencySelectOptions}
											value={this.state.purchaseOrderResetFrequency}
											loadedOptions={this.state.frequencyOptions}
											onFocus={() => this.onInputFocus('purchaseOrderDateDisplay')}
											//onBlur={this.onInputBlur}
											onChange={this.onFrequencyOptionChange}
										/>
									</div>
									{
										this.state.purchaseOrderResetFrequency === FREQUENCY_YEAR ? (
											<div className="numeration-date-format">
												<label>{`Reset number from`}</label>
												<SelectInputComponent
													ref="purchaseOrderResetSubFrequency"
													name="purchaseOrderResetSubFrequency"
													allowCreate={false}
													notAsync={true}
													options={this.subFrequencySelectOptions}
													value={this.state.purchaseOrderResetSubFrequency}
													loadedOptions={this.state.subFrequencyOptions}
													//onFocus={() => this.onInputFocus('invoiceDateDisplay')}
													onBlur={this.onInputBlur}
													onChange={this.onSubFrequencyOptionChange}
												/>
											</div>
										) : null
									}
									<div className="increment-by-setting">
											<NumberInputComponent
												ref="purchaseOrderStartValue"
												//dataQsId="settings-account-mobile"
												label={`Start number from`}
												name="purchaseOrderStartValue"
												maxLength="6"
												value={parseInt(this.state.purchaseOrderStartValue)}
												isDecimal={false}
												//errorMessage={this.state.startNumberError}
												onChange={(value) => this.onStartValueChange('purchaseOrderStartValue', value)}
												//onBlur={value => this.onMobileNumberBlur(value)}
												defaultNonZero={true}
												hasBorder
											/>
									</div>
								</div>
							) : null
						}
					</div>
				</div>
			);
		} else {
			content = (
				<div>
					<div className="numeration-display-wrapper">
						<span
							className={`numeration-display ${this.state.offerPrefix ? 'has-margin' : ''}`}
							id="offerPrefixDisplay"
							onClick={() => this.onDisplayClick('offerPrefix')}
						>
							{this.state.offerPrefix}
						</span>
						<span
							className={`numeration-display placeholder has-margin-left ${
								this.state.offerPlaceholder1 ? 'has-margin' : ''
							}`}
							id="offerPlaceholder1Display"
							onClick={() => this.onDisplayClick('offerPlaceholder1', true)}
						>
							{this.state.offerPlaceholder1}
						</span>
						<span
							className={`numeration-display ${this.state.offerDateText ? 'has-margin' : ''}`}
							id="offerDateDisplay"
							onClick={() => this.onDisplayClick('offerDate', true)}
						>
							{this.state.offerDateText}
						</span>
						<span
							className={`numeration-display placeholder has-margin-left ${
								this.state.offerPlaceholder2 ? 'has-margin' : ''
							}`}
							id="offerPlaceholder2Display"
							onClick={() => this.onDisplayClick('offerPlaceholder2', true)}
						>
							{this.state.offerPlaceholder2}
						</span>
						<input
							type="text"
							id="offerNumberDisplay"
							className={`numeration-number-input digits-${this.state.offerCounterLength} ${
								this.state.offerNumberError ? 'error' : ''
							}`}
							value={this.state.offerNumber}
							onBlur={this.onInputNumberBlur}
							onChange={this.onInputNumberChange}
						/>
						<span
							className={`numeration-display placeholder has-margin-left ${
								this.state.offerPlaceholder3 ? 'has-margin' : ''
							}`}
							id="offerPlaceholder3Display"
							onClick={() => this.onDisplayClick('offerPlaceholder3', true)}
						>
							{this.state.offerPlaceholder3}
						</span>
						<span
							className={`numeration-display ${this.state.offerSuffix ? 'has-margin-left' : ''}`}
							id="offerSuffixDisplay"
							onClick={() => this.onDisplayClick('offerSuffix')}
						>
							{this.state.offerSuffix}
						</span>
					</div>

					<div className="col-xs-12 numeration-inputs-wrapper">
						<div className="numeration-prefix">
							<label>{resources.str_prefix}</label>
							<input
								type="text"
								maxLength="3"
								id="offerPrefix"
								value={this.state.offerPrefix}
								className={`numeration-input ${this.state.offerPrefixError ? 'error' : ''}`}
								onFocus={() => this.onInputFocus('offerPrefixDisplay')}
								onBlur={this.onPrefixBlur}
								onChange={this.onPrefixChange}
							/>
						</div>

						<div
							className={`numeration-placeholder1 ${
								this.state.offerPlaceholder1 === '' ? 'empty-selected' : ''
							}`}
						>
							<label />
							<SelectInputComponent
								ref="offerPlaceholder1"
								name="offerPlaceholder1"
								allowCreate={false}
								notAsync={true}
								options={Object.assign({}, this.placeholderSelectOptions, {
									handleChange: option => {
										this.onPlaceholderOptionChange(option, 'placeholder1');
									}
								})}
								value={this.state.offerPlaceholder1}
								loadedOptions={this.placeholderLoadedOptions}
								onFocus={() => this.onInputFocus('offerPlaceholder1Display')}
								onBlur={this.onInputBlur}
								onChange={option => {
									this.onPlaceholderOptionChange(option, 'placeholder1');
								}}
							/>
						</div>

						<div className="numeration-date-format">
							<label>{resources.str_date}</label>
							<SelectInputComponent
								ref="offerDate"
								name="offerDate"
								allowCreate={false}
								notAsync={true}
								options={this.dateSelectOptions}
								value={this.state.offerDate}
								loadedOptions={this.state.dateOptions}
								onFocus={() => this.onInputFocus('offerDateDisplay')}
								onBlur={this.onInputBlur}
								onChange={this.onDateOptionChange}
							/>
						</div>

						<div
							className={`numeration-placeholder2 ${
								this.state.offerPlaceholder2 === '' ? 'empty-selected' : ''
							}`}
						>
							<label />
							<SelectInputComponent
								ref="offerPlaceholder2"
								name="offerPlaceholder2"
								allowCreate={false}
								notAsync={true}
								options={Object.assign({}, this.placeholderSelectOptions, {
									handleChange: option => {
										this.onPlaceholderOptionChange(option, 'placeholder2');
									}
								})}
								value={this.state.offerPlaceholder2}
								loadedOptions={this.placeholderLoadedOptions}
								onFocus={() => this.onInputFocus('offerPlaceholder2Display')}
								onBlur={this.onInputBlur}
								onChange={option => {
									this.onPlaceholderOptionChange(option, 'placeholder2');
								}}
							/>
						</div>

						<div className="numeration-digit-count">
							<label>{resources.str_serialNo}</label>
							<SelectInputComponent
								allowCreate={false}
								notAsync={true}
								options={this.digitSelectOptions}
								value={this.state.offerCounterLength}
								loadedOptions={this.state.offerDigitOptions}
								onFocus={() => this.onInputFocus('offerNumberDisplay')}
								onBlur={this.onInputBlur}
								onChange={this.onDigitOptionChange}
							/>
						</div>

						<div
							className={`numeration-placeholder3 ${
								this.state.offerPlaceholder3 === '' ? 'empty-selected' : ''
							}`}
						>
							<label />
							<SelectInputComponent
								ref="offerPlaceholder3"
								name="offerPlaceholder3"
								allowCreate={false}
								notAsync={true}
								options={Object.assign({}, this.placeholderSelectOptions, {
									handleChange: option => {
										this.onPlaceholderOptionChange(option, 'placeholder3');
									}
								})}
								value={this.state.offerPlaceholder3}
								loadedOptions={this.placeholderLoadedOptions}
								onFocus={() => this.onInputFocus('offerPlaceholder3Display')}
								onBlur={this.onInputBlur}
								onChange={option => {
									this.onPlaceholderOptionChange(option, 'placeholder3');
								}}
							/>
						</div>

						<div className="numeration-suffix">
							<label>{resources.str_suffix}</label>
							<input
								type="text"
								maxLength="3"
								id="offerSuffix"
								value={this.state.offerSuffix}
								className={`numeration-input ${this.state.offerSuffixError ? 'error' : ''}`}
								onFocus={() => this.onInputFocus('offerSuffixDisplay')}
								onBlur={this.onSuffixBlur}
								onChange={this.onSuffixChange}
							/>
						</div>
					</div>
					<div className="additional-settings-wrapper">
						<div className="col-xs-6 increment-by-setting">
							<NumberInputComponent
								ref="number-increment-input"
								//dataQsId="settings-account-mobile"
								label={`Increment number by`}
								name={'offerIncrementBy'}
								maxLength="3"
								value={parseInt(this.state.offerIncrementBy)}
								isDecimal={false}
								//errorMessage={this.state.incrementByError}
								onChange={(value) => this.onIncrementByChange('offerIncrementBy', value)}
								//onBlur={value => this.onMobileNumberBlur(value)}
								defaultNonZero={true}
								hasBorder
							/>
						</div>
						<div className="periodic-setting">
								<OvalToggleComponent
									checked={this.state.offerIsPeriodic}
									onChange={() => {
										this.onPeriodicSettingChange()
									}}
									newStyle={true}
									labelText={`Reset numbers periodically?`}
									labelLeft
									customClass={'toggle-setting-periodic'}
								/>
						</div>
						{
							this.state.offerIsPeriodic ? (
								<div className="periodic-setting-frequency">
									<div className="numeration-date-format">
										<label>{`Number reset interval`}</label>
										<SelectInputComponent
											ref="offerResetFrequency"
											name="offerResetFrequency"
											allowCreate={false}
											notAsync={true}
											options={this.frequencySelectOptions}
											value={this.state.offerResetFrequency}
											loadedOptions={this.state.frequencyOptions}
											onFocus={() => this.onInputFocus('offerDateDisplay')}
											//onBlur={this.onInputBlur}
											onChange={this.onFrequencyOptionChange}
										/>
									</div>
									{
										this.state.offerResetFrequency === FREQUENCY_YEAR ? (
											<div className="numeration-date-format">
												<label>{`Reset number from`}</label>
												<SelectInputComponent
													ref="offerResetSubFrequency"
													name="offerResetSubFrequency"
													allowCreate={false}
													notAsync={true}
													options={this.subFrequencySelectOptions}
													value={this.state.offerResetSubFrequency}
													loadedOptions={this.state.subFrequencyOptions}
													//onFocus={() => this.onInputFocus('invoiceDateDisplay')}
													onBlur={this.onInputBlur}
													onChange={this.onSubFrequencyOptionChange}
												/>
											</div>
										) : null
									}
									<div className="increment-by-setting">
											<NumberInputComponent
												ref="number-start-input"
												//dataQsId="settings-account-mobile"
												label={`Start number from`}
												name={'offerStartValue'}
												maxLength="6"
												value={parseInt(this.state.offerStartValue)}
												isDecimal={false}
												//errorMessage={this.state.startNumberError}
												onChange={(value) => this.onStartValueChange('offerStartValue', value)}
												//onBlur={value => this.onMobileNumberBlur(value)}
												defaultNonZero={true}
												hasBorder
											/>
									</div>
								</div>
							) : null
						}
					</div>
				</div>
			);
		}

		let contentWrapper = '';

		if (!this.isOnlyInvoice && !this.isOnlyOffer && !this.isOnlyPurchaseOrder) {
			let error = '';

			if (this.state.currentView === INVOICE_VIEW) {
				error = this.state.invoicePrefixError || this.state.invoiceSuffixError || this.state.invoiceNumberError || this.state.incrementByError || this.state.startNumberError;
			} else if (this.state.currentView === PURCHASE_ORDER_VIEW) {
				error = this.state.purchaseOrderPrefixError || this.state.purchaseOrderSuffixError || this.state.purchaseOrderNumberError || this.state.incrementByError || this.state.startNumberError;
			} else {
				error = this.state.offerPrefixError || this.state.offerSuffixError || this.state.offerNumberError || this.state.incrementByError || this.state.startNumberError;
			}

			const filterItems = [
				{ resouceKey: OFFER_VIEW, key: OFFER_VIEW, active: this.state.isOfferActive },
				{ resouceKey: INVOICE_VIEW, key: INVOICE_VIEW, active: this.state.isInvoiceActive },
				{ resouceKey: PURCHASE_ORDER_VIEW, key: PURCHASE_ORDER_VIEW, active: this.state.isPurchaseOrderActive }
			];

			contentWrapper = (
				<div className="row u_pt_60 u_pb_40">
					<div className="col-xs-4 form_groupheader_edit">
						<div className="text-h4">{resources.str_numberRange}</div>
					</div>
					<div className="col-xs-8 numeration-content-wrapper">
						<div className='article-history-list-head-content'>
							{/* <TabInputComponent
								ref="tabInput"
								key="toggleOfferInvoice"
								items={[
									{ label: resources.str_deals, value: OFFER_VIEW },
									{ label: resources.str_bills, value: INVOICE_VIEW },
									{ label: resources.str_purchaseOrder, value: PURCHASE_ORDER_VIEW }
								]}
								value={this.state.currentView}
								componentClass="col-xs-6 col-xs-offset-3"
								onChange={this.onTabInputChange}
							/> */}
							<FilterComponent
								items={filterItems}
								onChange={filter => this.onTabInputChange(filter)}
								resources={resources}
							/>
							{content}

							<div className="numeration-error" style={{marginBottom: 40}}>{error}</div>

							<ButtonComponent
								buttonIcon={'icon-check'}
								type="primary"
								callback={() => this.onSaveClick()}
								label={resources.str_toSave}
								dataQsId="settings-more-btn-saveNumeration"
								disabled={!canEditNumericRanges}
							/>
						</div>
					</div>
				</div>
			);
		} else {
			let headline = '';
			let footer = '';
			let error = '';

			if (this.isOnlyOffer) {
				headline = resources.numerationOfferNoEstablish;
				footer = resources.numerationFinalOfferNoAssigned;
				error = this.state.offerPrefixError || this.state.offerSuffixError || this.state.offerNumberError;
			} else if (this.isOnlyPurchaseOrder) {
				headline = resources.numerationPurchaseOrderNoEstablish;
				footer = resources.numerationFinalPurchaseOrderNoAssigned;
				error = this.state.purchaseOrderPrefixError || this.state.purchaseOrderSuffixError || this.state.purchaseOrderNumberError;
			} else {
				headline = resources.numerationInvoiceNoEstablish;
				footer = resources.numerationFinalInvoiceNoAssigned;
				error = this.state.invoicePrefixError || this.state.invoiceSuffixError || this.state.invoiceNumberError;
			}

			contentWrapper = (
				<div className="numeration-content-wrapper numeration-popover">
					<div className="text-h5 headline">{headline}</div>

					{content}

					<div className="numeration-error">{error}</div>

					<div className="footer-hint">{footer}</div>
				</div>
			);
		}

		return (
			<div className="numeration-config-component">
				{contentWrapper}

				{this.isOnlyInvoice || this.isOnlyOffer || this.isOnlyPurchaseOrder ? (
					<div className="modal-base-footer">
						<button
							className="button button-cancel button-rounded"
							onClick={this.onCancelClick}
							data-qs-id="settings-more-btn-cancelNumeration"
						>
							{resources.str_abortStop}
						</button>

						<ButtonComponent
							buttonIcon={'icon-check'}
							type="primary"
							callback={() => this.onSaveClick()}
							label={resources.str_toSave}
							dataQsId="settings-more-btn-saveNumeration"
						/>
					</div>
				) : null}
			</div>
		);
	}
}

export default NumerationConfigComponent;
