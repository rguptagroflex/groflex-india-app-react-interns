import React from 'react';
import PropTypes from 'prop-types';
import invoiz from 'services/invoiz.service';
import config from 'config';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';

const fetchContactPersons = id => {
	return invoiz.request(`${config.customer.resourceUrl}/${id}`, { auth: true }).then(response => {
		const {
			body: {
				data: { contactPersons }
			}
		} = response;

		const mappedContactPersons = contactPersons.map(contactPerson => {
			const { salutation, title, name, firstName, lastName, id } = contactPerson;

			return {
				salutation,
				title,
				name,
				firstName,
				lastName,
				id
			};
		});
		return { options: mappedContactPersons };
	});
};

class RecipientFormCompany extends React.Component {
	componentDidMount() {
		this.refs.companyName.refs.companyName.focus();
	}
	getContactPersonSelectOptions(id) {
		const { onChange, resources } = this.props;

		const loadOptions = (input, callback) => {
			if (!id) {
				return callback(null, { options: [] });
			}

			return fetchContactPersons(id);
		};

		return {
			placeholder: resources.str_selectContact,
			labelKey: 'name',
			matchProp: 'name',
			valueKey: 'id',
			loadOptions,
			handleChange: onChange,
			valueRenderer: function(option) {
				const { salutation, title, name } = option;
				return (
					<span>
						{salutation} {title} {name}
					</span>
				);
			},
			getCustomLabelToHighlight: option => {
				const { salutation, title, name } = option;
				return `${salutation || ''} ${title || ''} ${name}`;
			}
		};
	}

	render() {
		const {
			onInputTextChange,
			data: { id, contact, companyName }, // companyNameAffix
			resources
		} = this.props;
		const contactPersonSelectOptions = this.getContactPersonSelectOptions(id);

		// check contact persons
		let contactPersonId = '';
		if (contact) {
			contactPersonId = contact.id;
		}

		return (
			<div className="recipientFormCompany">
				<TextInputExtendedComponent
					ref="companyName"
					required={true}
					name="companyName"
					placeholder={resources.str_companyName}
					value={companyName}
					onChange={onInputTextChange}
				/>
				{/* <TextInputExtendedComponent
					name="companyNameAffix"
					placeholder={resources.str_nameSuffix}
					value={companyNameAffix}
					onChange={onInputTextChange}
				/> */}
				{id ? (
					<SelectInputComponent
						ref="contactPerson"
						name="contactPerson"
						value={contactPersonId}
						allowCreate={false}
						options={contactPersonSelectOptions}
					/>
				) : null}
			</div>
		);
	}
}

RecipientFormCompany.propTypes = {
	data: PropTypes.object,
	onInputTextChange: PropTypes.func,
	onChange: PropTypes.func
};

export default RecipientFormCompany;
