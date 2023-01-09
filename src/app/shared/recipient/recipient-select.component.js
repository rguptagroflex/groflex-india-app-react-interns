import _ from "lodash";
import React from "react";
import debounce from "es6-promise-debounce";
import invoiz from "services/invoiz.service";
import config from "config";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import { contactTypes } from "helpers/constants";

// const fetchCustomer = search => {
// 	search = search || '*';
// 	return invoiz
// 		.request(`${config.getAllCustomers}?search='${encodeURIComponent(search)}'`, { auth: true })
// 		.then(response => {
// 			const {
// 				body: { data: customers }
// 			} = response;
// 			const mappedOptions = customers.map(customer => {
// 				const {
// 					id,
// 					name,
// 					address: { street, zipCode, city, countryIso, gstNumber, cinNumber },
// 					contactPersons
// 				} = customer;
// 				const omittedCustomerData = _.omit(customer, ['address', 'contactPersons']);

// 				if (contactPersons && contactPersons.length > 0) {
// 					const { id: contactPersonId, salutation, title, firstName, lastName } = contactPersons[0];
// 					omittedCustomerData.contact = {
// 						id: contactPersonId,
// 						salutation,
// 						title,
// 						firstName,
// 						lastName
// 					};
// 				}

// 				const mappedCustomerData = Object.assign({}, omittedCustomerData, {
// 					street,
// 					zipCode,
// 					city,
// 					countryIso,
// 					gstNumber,
// 					cinNumber
// 				});
// 				return { value: id, label: name, customerData: mappedCustomerData };
// 			});

// 			return { options: mappedOptions };
// 		});
// };

class RecipientSelectComponent extends React.Component {
	handleOnBlur(event) {
		const { handleAddOption } = this.props;
		const newCustomerName = event.target.value.trim();

		if (newCustomerName.length > 0) {
			setTimeout(() => {
				handleAddOption({ value: newCustomerName });
			}, 100);
		}
	}

	getOptions() {
		const { handleChange, handleAddOption, resources, recipientType } = this.props;
		const loadOptions = (searchTerm) => {
			return fetchCustomer(searchTerm.trim(), recipientType);
		};

		const fetchCustomer = (searchTerm, recipientType) => {
			searchTerm = searchTerm || "*";
			const query = `?type=${recipientType}&search='${encodeURIComponent(searchTerm)}'`;
			return invoiz.request(`${config.getAllCustomers}${query}`, { auth: true }).then((response) => {
				const {
					body: { data: customers },
				} = response;
				const mappedOptions = customers.map((customer) => {
					const {
						id,
						name,
						address: { street, zipCode, city, countryIso, gstNumber, cinNumber },
						contactPersons,
					} = customer;
					if (countryIso === "IN") {
						customer.baseCurrency = '';
						customer.exchangeRate = 0.0;
						customer.defaultExchangeRateToggle = false
					}
					const omittedCustomerData = _.omit(customer, ["address", "contactPersons"]);

					if (contactPersons && contactPersons.length > 0) {
						const { id: contactPersonId, salutation, title, firstName, lastName } = contactPersons[0];
						omittedCustomerData.contact = {
							id: contactPersonId,
							salutation,
							title,
							firstName,
							lastName,
						};
					}

					const mappedCustomerData = Object.assign({}, omittedCustomerData, {
						street,
						zipCode,
						city,
						countryIso,
						gstNumber,
						cinNumber,
					});
					return { value: id, label: name, customerData: mappedCustomerData };
				});

				return { options: mappedOptions };
			});
		};

		return {
			placeholder:
				recipientType === contactTypes.CUSTOMER
					? resources.str_enterSelectCustomers
					: resources.str_enterSelectPayee,
			handleChange,
			autofocus: true,
			// getCustomLabelToHighlight: option => {
			// 	return `${option.displayLabel || option.label}`;
			// },
			// cache: false,
			loadOptions: debounce(loadOptions, 300),
			onNewOptionClick: handleAddOption,
		};
	}

	render() {
		// const { handleChange, handleAddOption, resources } = this.props;

		// const options = {
		// 	placeholder: resources.str_enterSelectCustomers,
		// 	handleChange,
		// 	autofocus: true,
		// 	loadOptions: fetchCustomer,
		// 	onNewOptionClick: handleAddOption
		// };

		return (
			<SelectInputComponent
				containerClass="recipientSelectCustomerInput"
				// options={options}
				options={this.getOptions()}
				onBlur={(evt) => this.handleOnBlur(evt)}
				ref={"selectInput"}
			/>
		);
	}
}

export default RecipientSelectComponent;
