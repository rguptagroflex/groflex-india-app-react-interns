import invoiz from 'services/invoiz.service';
import accounting from 'accounting';
import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import config from 'config';
import RecipientFormComponent from 'shared/recipient/recipient-form.component';
import RecipientEmptyComponent from 'shared/recipient/recipient-empty.component';
import RecipientSelectComponent from 'shared/recipient/recipient-select.component';
import RecipientDisplayComponent from 'shared/recipient/recipient-display.component';
import { getConvertRate } from 'helpers/getSettingsData';
import { customerTypes, recipientStates, contactTypes } from 'helpers/constants';

const { COMPANY, PERSON } = customerTypes;
const {
	RECIPIENT_STATE_EMPTY,
	RECIPIENT_STATE_FORM,
	RECIPIENT_STATE_SELECT,
	RECIPIENT_STATE_CUSTOMER_SELECTED
} = recipientStates;

const SHOULD_CLOSE_FORM_STATES = [RECIPIENT_STATE_FORM, RECIPIENT_STATE_SELECT];

class RecipientComponent extends React.Component {
	constructor(props) {
		super(props);
		const { customerData, recipientState, recipientType } = props;
		this.state = {
			customerData: customerData || undefined,
			recipientState:
				recipientState || (customerData && Object.keys(customerData).length > 0)
					? RECIPIENT_STATE_CUSTOMER_SELECTED
					: RECIPIENT_STATE_EMPTY,
			oldCustomerData: undefined,
			errorMessage: '',
			gstErrorMessage: '',
			cinErrorMessage: '',
			mobileErrorMessage: '',
			balanceErrorMessage: '',
			currencyRates: [],
			// baseCurrency: props.baseCurrency,
			// exchangeRate: props.exchangeRate,
			baseCurrency: props.baseCurrency || '',
			exchangeRate: props.exchangeRate || 0.0,
			defaultExchangeRateToggle: false,
			toggleDisable: false
		};

		this.setData = this.setData.bind(this);
		this.isMobileNumberValid = false;

	}

	componentDidMount() {
		const { customerData } = this.state;

		invoiz.on('documentClicked', this.handleCloseEditMode, this);
		if (customerData && customerData.countryIso !== "IN") {
		this.refreshRates(false);
		}
	}

	refreshRates(forceRefresh, value) {
		const { customerData } = this.state;
		const { transaction } = this.props;
		getConvertRate().then((response) => {
			const { body } = response;
			if (forceRefresh) {
				const exRateValue = body.find(item => item.from === customerData.baseCurrency);
				const newData = { "exchangeRate": exRateValue.value };
				this.setState({ customerData: Object.assign({}, customerData, newData), baseCurrency: customerData.baseCurrency, exchangeRate: exRateValue.value, toggleDisable: false, 
			defaultExchangeRateToggle: false }, () => {
					invoiz.page.showToast({ message: `Refreshed latest currency rates!`, type: 'success' });
				});
			} else {
				if (customerData.id) {
					if (value) {
						let newData = null;
						const exRateValue = !!value.currency ? body.find(item => item.from === value.currency) : 0.0;
						newData = { 'countryIso': value.iso2,
							'indiaState': {},
							'baseCurrency':!!value.currency ? value.currency : customerData.baseCurrency, 
							'exchangeRate': !!value.currency ? exRateValue.value : customerData.exchangeRate,
							'defaultExchangeRateToggle': false
						};
						this.setState({ customerData: Object.assign({}, customerData, newData), baseCurrency: !!value.currency ? value.currency : customerData.baseCurrency,
						exchangeRate: !!value.currency ? exRateValue.value : customerData.exchangeRate, currencyRates: body });	
					} else {
					const exRateValue = body.find(item => item.from === customerData.baseCurrency);
					this.setState({ baseCurrency: customerData.baseCurrency, exchangeRate: transaction.id ? transaction.exchangeRate : customerData.defaultExchangeRateToggle ? 
						customerData.exchangeRate : exRateValue.value, currencyRates: body });
					}
				} else {
					let newData = null;
					const exRateValue = !!value.currency ? body.find(item => item.from === value.currency) : 0.0;
					newData = { 'countryIso': value.iso2,
						'indiaState': {},
						'baseCurrency':!!value.currency ? value.currency : customerData.baseCurrency, 
						'exchangeRate': !!value.currency ? exRateValue.value : customerData.exchangeRate,
						'defaultExchangeRateToggle': false
					};
					this.setState({ customerData: Object.assign({}, customerData, newData), baseCurrency: !!value.currency ? value.currency : customerData.baseCurrency,
					exchangeRate: !!value.currency ? exRateValue.value : customerData.exchangeRate, currencyRates: body });	
				// this.setState({ currencyRates: body });
				}
			}
			
		}).catch((err) => {
			if (customerData && customerData.countryIso !== "IN") {
			invoiz.page.showToast({ message: `Could not fetch latest currency rates!`, type: 'error' });
			}
		})
	}

	componentWillUnmount() {
		invoiz.off('documentClicked', this.handleCloseEditMode);
	}

	componentWillReceiveProps(newProps) {
		const { recipientState, exchangeRate, baseCurrency, customerData, transaction } = newProps;
		if (recipientState && this.state.recipientState !== recipientState) {
			this.setState({ recipientState, exchangeRate, baseCurrency });
		} else {
			this.setState({ exchangeRate: transaction.exchangeRate, baseCurrency: transaction.baseCurrency, 
				defaultExchangeRateToggle: customerData && customerData.defaultExchangeRateToggle || false,
			toggleDisable: customerData && customerData.defaultExchangeRateToggle ? true : false})
		}
		if (newProps.activeComponent !== 'recipientsComponent') { this.handleCloseEditMode(); }
	}

	setData(customerData, baseCurrency, exchangeRate, recipientState, defaultExchangeRateToggle) {
		this.setState({ recipientState }, () => {
			if (customerData) {
				this.props.onCloseEditMode(customerData, baseCurrency, exchangeRate, defaultExchangeRateToggle);
			}

			invoiz.trigger('updateRecipientCustomerNumberFinished');
		});
	}

	getRecipientState() {
		return this.state.recipientState;
	}

	handleCloseEditMode() {
		const { resources } = this.props;
		const { recipientState, customerData, baseCurrency, exchangeRate, defaultExchangeRateToggle, mobileErrorMessage } = this.state;
		if (customerData && recipientState === RECIPIENT_STATE_FORM) {
			const { kind, companyName, firstName, lastName, gstNumber, cinNumber } = customerData;
			if ((customerData.countryIso === 'IN' && customerData.indiaState && customerData.indiaState.id === null) ||
			(customerData.countryIso === 'IN' && customerData.indiaState === null) ||
			(kind === COMPANY && !companyName) ||
			// (kind === COMPANY && !cinNumber) ||
			(kind === PERSON && !firstName)) 
			{
			// (kind === COMPANY && !gstNumber)) {

				if ((customerData.countryIso === 'IN' && customerData.indiaState && customerData.indiaState.id === null) || (customerData.countryIso === 'IN' && customerData.indiaState === null)) {
					this.setState({
						errorMessage: resources.stateFieldValidation
					});
					if (this.props.activeComponentAction !== undefined) this.props.activeComponentAction('recipientsComponent', undefined);
				// return;
				}
				// if (kind === COMPANY && !gstNumber) {
				// 	this.setState({
				// 		gstErrorMessage: resources.gstFieldValidation
				// 	});
				// }
				// if (kind === COMPANY && !cinNumber) {
				// 	this.setState({
				// 		cinErrorMessage: resources.cinFieldValidation
				// 	});
				// }
				// if ((kind === COMPANY && !companyName) || (kind === PERSON && !lastName)) {
				// 	// return;
				// }
				return;
			}

			if (customerData.countryIso === '') {
				{
					invoiz.page.showToast({
						type: 'error',
						message: `Please select the contact's country!`
					});
					return;
				}
			}

			if (customerData.countryIso !== 'IN' && (customerData.baseCurrency === '' || !customerData.baseCurrency))
			{
				invoiz.page.showToast({
					type: 'error',
					message: `Please select the contact's currency!`
				});
				return;
			}

			if (kind === PERSON && !firstName) {
				invoiz.page.showToast({
					type: 'error',
					message: `Please enter the contact's first name!`
				});
				return;
			}

			if (this.state.mobileErrorMessage) {
				this.setState({
						mobileErrorMessage: `Please enter a valid mobile number!`
					});
				return;
			}
		}

		if (SHOULD_CLOSE_FORM_STATES.indexOf(recipientState) >= 0) {
			const recipientState = customerData ? RECIPIENT_STATE_CUSTOMER_SELECTED : RECIPIENT_STATE_EMPTY;
			if (customerData && !customerData.id && customerData.kind) {
				invoiz
					.request(config.customer.endpoints.nextCustomerNumber, { auth: true })
					.then(response => {
						const {
							body: { data: newCustomerNumber }
						} = response;
						customerData.number = newCustomerNumber;
					})
					.then(() => this.setData(customerData, baseCurrency, exchangeRate, recipientState, defaultExchangeRateToggle))
					.catch(() => {
						invoiz.showNotification({
							message: resources.getNextCustomerNumberErrorMessage,
							type: 'error'
						});
					});
			} else if (customerData && customerData.kind) {
				this.setData(customerData, baseCurrency, exchangeRate, recipientState, defaultExchangeRateToggle);
			} else {
				this.setData(null, baseCurrency, exchangeRate, RECIPIENT_STATE_EMPTY, defaultExchangeRateToggle);
			}
		}
	}

	handleCancelEditMode() {
		const { oldCustomerData } = this.state;
		const recipientState = oldCustomerData ? RECIPIENT_STATE_CUSTOMER_SELECTED : RECIPIENT_STATE_EMPTY;
		this.setState({ recipientState, customerData: oldCustomerData, baseCurrency: '', exchangeRate: 0.0 });
	}

	handleSelectAddOption(option) {
		const { recipientType } = this.props;
		const { currencyRates } = this.state;
		this.setState({
			customerData: {
				kind: COMPANY,
				companyName: option.value,
				street: '',
				zipCode: '',
				city: '',
				gstNumber: '',
				cinNumber: '',
				mobile: '',
				countryIso: '',
				indiaState: Object.assign(
					{ id: null, stateName: null }
				),
				type: recipientType,
				balance: 0,
				openingBalance: 0,
				exchangeRate: 0.0,
				baseCurrency: '',
				defaultExchangeRateToggle: false
			},
			recipientState: RECIPIENT_STATE_FORM,
			baseCurrency: '',
			exchangeRate: 0.0
		});
	}

	handleSelectChange(option) {
		const { onChange } = this.props;
		const { exchangeRate, baseCurrency } = this.state;
		if (option && option.customerData && option.customerData.countryIso !== "IN") {
			const newState = {
				customerData: option.customerData,
				recipientState: option ? RECIPIENT_STATE_CUSTOMER_SELECTED : RECIPIENT_STATE_EMPTY
			};
			this.setState(newState, () => {
			this.refreshRates(false);
			onChange(option, baseCurrency, exchangeRate);
			});
		} else {
		const newState = {
			customerData: option && option.customerData ? option.customerData : undefined,
			recipientState: option ? RECIPIENT_STATE_CUSTOMER_SELECTED : RECIPIENT_STATE_EMPTY
		};
		this.setState(newState, () => {
			onChange(option);
		});
	}
	}

	handleCustomerKindChange(kind) {
		const { customerData } = this.state;
		const { firstName, lastName, companyName, salutation, title, contact, gstNumber, cinNumber, balance, openingBalance, mobile } = customerData;
		const newData = {
			kind,
			companyName: '',
			firstName: '',
			lastName: '',
			salutation: '',
			title: '',
			gstNumber: '',
			cinNumber: '',
			mobile: '',
			mobile: '',
			balance: 0,
			openingBalance: 0
		};
		newData.gstNumber = gstNumber;
		newData.cinNumber = cinNumber;
		newData.balance = balance;
		newData.openingBalance = openingBalance;
		if (kind === COMPANY) {
			newData.companyName = firstName || lastName ? `${firstName} ${lastName}` : undefined;
			newData.contact = contact || undefined;
			// newData.cinNumber = '';
		} else {
			newData.salutation = salutation;
			newData.title = title;
			const nameArray = companyName && companyName.split(' ');
			if (nameArray && nameArray.length >= 0) {
				// newData.lastName = nameArray.pop();
				// newData.firstName = nameArray.join(' ');
				newData.firstName = nameArray.pop();
				newData.lastName = nameArray.join(' ');
			} else {
				newData.lastName = undefined;
				newData.firstName = undefined;
			}
			newData.contact = undefined;
		}

		const newCustomerData = Object.assign({}, customerData, newData);
		this.setState({ customerData: newCustomerData, errorMessage: '', gstErrorMessage: '', cinErrorMessage: '', balanceErrorMessage: '', mobileErrorMessage: '' });
	}

	handleFormInputChange(name, value) {
		const { customerData } = this.state;
		const newData = { [name]: value };
		this.setState({ customerData: Object.assign({}, customerData, newData) });
	}

	handleGstBlur(event) {
		const { resources } = this.props;
		let { gstErrorMessage } = this.state;
		// if (!event.value.trim()) {
		// 	gstErrorMessage = resources.gstFieldValidation;
		// } else {
		// 	gstErrorMessage = '';
		// }
		this.setState({ gstErrorMessage });
	}

	handleGstChange(name, value) {
		const { resources } = this.props;
		const { customerData } = this.state;
		let { gstErrorMessage } = this.state;
		const newData = { [name]: value };
		// if (!value.trim()) {
		// 	gstErrorMessage = resources.gstFieldValidation;
		// } else {
		// 	gstErrorMessage = '';
		// }
		this.setState({ customerData: Object.assign({}, customerData, newData), gstErrorMessage });
	}

	handleCinBlur(event) {
		const { resources } = this.props;
		let { cinErrorMessage } = this.state;
		// if (!event.value.trim()) {
		// 	cinErrorMessage = resources.cinFieldValidation;
		// } else {
		// 	cinErrorMessage = '';
		// }
		this.setState({ cinErrorMessage });
	}

	handleCinChange(name, value) {
		const { resources } = this.props;
		const { customerData } = this.state;
		let { cinErrorMessage } = this.state;
		const newData = { [name]: value };
		// if (!value.trim()) {
		// 	cinErrorMessage = resources.cinFieldValidation;
		// } else {
		// 	cinErrorMessage = '';
		// }
		this.setState({ customerData: Object.assign({}, customerData, newData), cinErrorMessage });
	}

	handleCountryChange(name, value) {
		const { customerData, currencyRates } = this.state;
		let newData = null;
		if (value.iso2 !== 'IN') {
			this.refreshRates(false, value);		
		} else {
			newData = { [name]: value.iso2,
				'indiaState': {
					id: null,
					stateName: null
				}
			};	
			this.setState({ customerData: Object.assign({}, customerData, newData) });		
		}
	}

	handleCurrencyChange(name, value) {
		const { customerData, currencyRates } = this.state;
		if (customerData.countryIso === '' || customerData.countryIso === undefined) {
			invoiz.showNotification({
				message: `Please select a country first!`,
				type: 'error'
			});
			return
		} else {
		const exRateValue = currencyRates.find(item => item.from === value);
		const newData = { [name]: !customerData.defaultExchangeRateToggle ? value : customerData.baseCurrency, 
			exchangeRate: !customerData.defaultExchangeRateToggle ? parseFloat(exRateValue.value) : customerData.exchangeRate };
		this.setState({ customerData: Object.assign({}, customerData, newData), baseCurrency: value, exchangeRate: parseFloat(exRateValue.value), toggleDisable: false});
		}
	}

	handleExchangeRateChange(name, value) {
		const { customerData, defaultExchangeRateToggle } = this.state;

		const newCustomerData = { exchangeRate: defaultExchangeRateToggle ? parseFloat(value) : customerData.exchangeRate };

		this.setState({ customerData: Object.assign({}, customerData, newCustomerData), exchangeRate: parseFloat(value), baseCurrency: customerData.baseCurrency});
	}

	handleExchangeRateFocus() {
		this.setState({ toggleDisable: false, defaultExchangeRateToggle: false })
	}

	handleExchangeRateToggle() {
		const { defaultExchangeRateToggle } = this.state;
		this.setState({ defaultExchangeRateToggle: !defaultExchangeRateToggle });
	}

	handleStateChange(name, option) {
		const { resources } = this.props;
		const { customerData } = this.state;
		let { errorMessage } = this.state;
		const newData = { [name]: option };
		if (!option) {
			errorMessage = resources.stateFieldValidation;
		} else {
			errorMessage = '';
		}
		this.setState({ customerData: Object.assign({}, customerData, newData), errorMessage });
	}

	handleContactPersonChange(option) {
		const { customerData } = this.state;

		if (!option) {
			return this.setState({ customerData: _.omit(customerData, ['contact']) });
		}

		this.setState({ customerData: Object.assign({}, customerData, { contact: option }) });
	}

	onRecipientViewClick(event) {
		const e = event.nativeEvent;
		e.stopPropagation();
		e.stopImmediatePropagation();
	}

	handleEmptyClick() {
		this.setState({ recipientState: RECIPIENT_STATE_SELECT });
		if (this.props.activeComponentAction !== undefined) this.props.activeComponentAction('recipientsComponent', undefined);
	}

	handleDisplayClick(type) {
		if (type !== 'display') return;
		if (this.props.activeComponentAction !== undefined) this.props.activeComponentAction('recipientsComponent', undefined);

		this.setState({ recipientState: RECIPIENT_STATE_FORM, oldCustomerData: this.state.customerData });
	}

	handleRemoveClick(type, event) {
		event.stopPropagation();
		if (type !== 'remove') return;

		const { onChange, onCustomerDelete } = this.props;
		this.setState({ customerData: undefined, recipientState: RECIPIENT_STATE_EMPTY }, () => {
			onChange && onChange();
		});
		onCustomerDelete && onCustomerDelete();
	}

	handleBalanceBlur(event) {
		const { resources } = this.props;
		let { balanceErrorMessage } = this.state;
		this.setState({ balanceErrorMessage });
	}

	handleBalanceChange(name, value) {
		const { resources } = this.props;
		const { customerData } = this.state;
		let { balanceErrorMessage } = this.state;
		//value = accounting.unformat(value, config.currencyFormat.decimal);
		const newData = { [name] : value };
		this.setState({ customerData: Object.assign({}, customerData, newData), balanceErrorMessage });
	}

	handleMobileChange(name, value) {
		const { resources } = this.props;
		const { customerData, mobileErrorMessage } = this.state;
		
		this.isMobileNumberValid = value.toString().length < 10 && value.toString().length > 1;

		if (value === '') {
			const newData = { [name] : '' };
			this.setState({ customerData: Object.assign({}, customerData, newData)});
		} else if (value.toString().length !== 0) {
			if (!config.mobileNumberValidation.test(value)) {
				const { resources } = this.props;
				this.setState({ mobileErrorMessage: resources.validMobileNumberError });
			} else {
				const newData = { [name] : value.toString() };
				this.setState({ customerData: Object.assign({}, customerData, newData)});
			}
		}
	}

	onMobileNumberBlur(value) {
		const { resources } = this.props;
		let { mobileErrorMessage } = this.state;
		if (value.length !== 0 && (value.length < 10 || !config.mobileNumberValidation.test(value))) {
			mobileErrorMessage = `Please enter a valid mobile number!`
		} else {
			mobileErrorMessage = ''
		}
		this.setState({ mobileErrorMessage })
	}

	render() {
		const { resources, recipientType } = this.props;
		let activeComponent;
		const { recipientState, customerData, errorMessage, gstErrorMessage, cinErrorMessage, baseCurrency, exchangeRate, defaultExchangeRateToggle, balanceErrorMessage, mobileErrorMessage } = this.state;
		// const customerNumberDispaly = recipientType != contactTypes.CUSTOMER ? (<div> Customer No : {customerData ? customerData.number : ''}</div>) : null
		switch (recipientState) {
			case RECIPIENT_STATE_EMPTY:
				activeComponent = <RecipientEmptyComponent handleClick={this.handleEmptyClick.bind(this)} resources={resources} recipientType={recipientType}/>;
				break;
			case RECIPIENT_STATE_SELECT:
				activeComponent = (
					<RecipientSelectComponent
						handleAddOption={this.handleSelectAddOption.bind(this)}
						handleChange={this.handleSelectChange.bind(this)}
						resources={resources}
						recipientType={recipientType}
					/>
				);
				break;
			case RECIPIENT_STATE_CUSTOMER_SELECTED:
				activeComponent = (
					<RecipientDisplayComponent
						customerData={customerData}
						baseCurrency={baseCurrency}
						exchangeRate={exchangeRate}
						handleClick={this.handleDisplayClick.bind(this, 'display')}
						handleRemoveClick={this.handleRemoveClick.bind(this, 'remove')}
						resources={resources}
					/>
				);
				break;
			case RECIPIENT_STATE_FORM:
				activeComponent = (
					<RecipientFormComponent
						customerData={customerData}
						onCloseEditMode={this.handleCloseEditMode.bind(this)}
						onCancelEditMode={this.handleCancelEditMode.bind(this)}
						handleKindChange={this.handleCustomerKindChange.bind(this)}
						handleInputChange={this.handleFormInputChange.bind(this)}
						handleContactPersonChange={this.handleContactPersonChange.bind(this)}
						handleCountryChange={this.handleCountryChange.bind(this)}
						handleStateChange={this.handleStateChange.bind(this)}
						handleGstChange={this.handleGstChange.bind(this)}
						handleGstBlur={this.handleGstBlur.bind(this)}
						handleCinChange={this.handleCinChange.bind(this)}
						handleCinBlur={this.handleCinBlur.bind(this)}
						handleMobileBlur={this.onMobileNumberBlur.bind(this)}
						handleBalanceChange={this.handleBalanceChange.bind(this)}
						handleCurrencyChange={this.handleCurrencyChange.bind(this)}
						handleExchangeRateChange={this.handleExchangeRateChange.bind(this)}
						handleExchangeRateToggle={this.handleExchangeRateToggle.bind(this)}
						handleExchangeRateFocus={this.handleExchangeRateFocus.bind(this)}
						handleMobileChange={this.handleMobileChange.bind(this)}
						currencyConvertRates={this.state.currencyRates}
						fetchRates={this.refreshRates.bind(this)}
						resources={resources}
						errorMessage={errorMessage}
						gstErrorMessage={gstErrorMessage}
						cinErrorMessage={cinErrorMessage}
						mobileErrorMessage={mobileErrorMessage}
						balanceErrorMessage={balanceErrorMessage}
						baseCurrency={baseCurrency}
						exchangeRate={exchangeRate}
						defaultExchangeRateToggle={defaultExchangeRateToggle}
						toggleDisable={this.state.toggleDisable}
					/>
				);
				break;
		}

		return (
			<div onClick={this.onRecipientViewClick.bind(this)} className={`${recipientType === !contactTypes.CUSTOMER ? 'recipientPayeeContainer' : ' recipientContainer'}`}>
				{/* {customerNumberDispaly} */}
				{activeComponent}
			</div>
		);
	}
}

RecipientComponent.propTypes = {
	customerData: PropTypes.object,
	onChange: PropTypes.func.isRequired,
	onCloseEditMode: PropTypes.func.isRequired,
	onCustomerDelete: PropTypes.func,
	recipientState: PropTypes.string
};

export default RecipientComponent;
