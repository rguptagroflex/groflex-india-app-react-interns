import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import _ from 'lodash';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import CustomSelectOptionComponent from 'shared/custom-select-option/custom-select-option.component';

class DunningRecipientModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			contacts: [],
			emailOptions: [],
			isSaving: false,
			isValid: false
		};
	}

	componentDidMount() {
		const { invoice } = this.props;

		if (invoice.customerId) {
			invoiz.request(`${config.resourceHost}customer/${invoice.customerId}`, { auth: true }).then(response => {
				const {
					body: { data }
				} = response;

				const emailOptions = this.mapCustomerEmails(data);
				let contacts = emailOptions.length && emailOptions.length > 0 ? [emailOptions[0]] : [];
				if (invoice.dunningRecipients && invoice.dunningRecipients.length > 0) {
					contacts = invoice.dunningRecipients;
				}

				this.setState({
					emailOptions,
					contacts,
					isValid: contacts.length > 0
				});
			});
		}
	}

	render() {
		const { resources } = this.props;
		const { isValid, isSaving, contacts, emailOptions } = this.state;

		return (
			<div>
				<img className="dunning-recipient-icon" src="/assets/images/svg/dunning_email.svg" />
				<div className="dunning-recipient-text text-h3">{resources.dunningReceiptText}</div>
				<div className="dunning-recipient-select">
					<SelectInputComponent
						allowCreate={true}
						notAsync={true}
						loadedOptions={emailOptions}
						value={contacts}
						options={{
							multi: true,
							clearable: false,
							backspaceRemoves: true,
							noResultsText: false,
							labelKey: 'label',
							valueKey: 'value',
							matchProp: 'value',
							placeholder: resources.str_enterOrSelectEmail,
							handleChange: options => this.onEmailChange(options),
							optionComponent: CustomSelectOptionComponent
						}}
					/>
				</div>
				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							dataQsId="dunningRecipient-btn-cancel"
							callback={() => ModalService.close()}
							type="cancel"
							label={resources.str_abortStop}
						/>
					</div>

					<div className="modal-base-confirm">
						<ButtonComponent
							buttonIcon="icon-check"
							dataQsId="dunningRecipient-btn-save"
							loading={isSaving}
							disabled={!isValid}
							callback={() => this.save()}
							label={resources.str_toSave}
						/>
					</div>
				</div>
			</div>
		);
	}

	mapCustomerEmails(customer) {
		const data = customer.contactPersons.reduce((dataArray, contactPerson) => {
			if (contactPerson.email) {
				const { email, name, lastName } = contactPerson;
				dataArray.push({ type: 'contact', email, name, lastName, label: name, value: email });
			}
			return dataArray;
		}, []);
		const sortedData = _.sortBy(data, 'lastName');
		if (customer.email) {
			const { email, name } = customer;
			sortedData.unshift({ type: 'customer', email, name, label: name, value: email });
		}
		return sortedData;
	}

	onEmailChange(selectOptions) {
		let newContacts = [];

		if (selectOptions && selectOptions.length > 0) {
			selectOptions.forEach(option => {
				if (config.emailCheck.test(option.value)) {
					newContacts.push(option);
				}
			});
		}

		newContacts = newContacts.filter(contact => contact);

		this.setState({
			contacts: newContacts,
			isValid: newContacts.length > 0
		});
	}

	save() {
		const { isSaving, contacts } = this.state;
		const { invoice, onSave, onError, resources } = this.props;

		if (isSaving) {
			return;
		}

		const dunningRecipients = contacts.map(contact => {
			return contact.email || contact.value;
		});

		this.setState({ isSaving: true }, () => {
			invoiz
				.request(`${config.resourceHost}invoice/${invoice.id}/dunning/setting`, {
					method: 'PUT',
					auth: true,
					data: {
						autoDunningEnabled: invoice.autoDunningEnabled,
						dunningRecipients
					}
				})
				.then(() => {
					invoiz.page.showToast({ message: resources.dunninRecipientModalSaveSuccessMessage });
					onSave && onSave(dunningRecipients);
					ModalService.close();
				})
				.catch(() => {
					invoiz.page.showToast({ type: 'error', message: resources.dunninRecipientModalSaveErrorMessage });
					onError && onError();
					ModalService.close();
				});
		});
	}
}

export default DunningRecipientModalComponent;
