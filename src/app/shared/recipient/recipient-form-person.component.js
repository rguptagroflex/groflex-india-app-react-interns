import React from 'react';
import PropTypes from 'prop-types';
import invoiz from 'services/invoiz.service';
import addTag from 'helpers/addTag';
import { getMiscellaneousData } from 'helpers/getSettingsData';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';

const fetchSalutations = () => {
	return getMiscellaneousData().then(response => {
		const {
			body: {
				data: { salutations }
			}
		} = response;
		const mappedSalutations = salutations.map(salutation => {
			return { label: salutation };
		});
		return { options: mappedSalutations };
	});
};

const fetchTitles = () => {
	return getMiscellaneousData().then(response => {
		const {
			body: {
				data: { titles }
			}
		} = response;
		const mappedTitles = titles.map(title => {
			return { label: title };
		});
		return { options: mappedTitles };
	});
};

class RecipientFormPersonComponent extends React.Component {
	constructor(props) {
		super(props);
		const {
			data: { salutation, title }
		} = props;

		this.state = {
			salutationClearable: !!salutation || false,
			titleClearable: !!title || false
		};
	}

	componentDidUpdate() {
		this.validateFirstLastName();
	}

	validateFirstLastName() {
		// this.refs.lastName.refs.lastName.focus();
		if (this.refs.lastName.refs.lastName.value === '') {
			this.refs['lastName'] &&
			this.refs['lastName'].validateAndSetValue();
		}
		if (this.refs.firstName.refs.firstName.value === '') {
			this.refs['firstName'] &&
			this.refs['firstName'].validateAndSetValue();
		}
	}

	onNewSalutationClick(option) {
		const { resources } = this.props;
		const page = invoiz.page;
		const selectInput = this.refs.salutation.getSelectInput();

		const onTagAdded = () => {
			selectInput.props.loadOptions('').then(() => {
				selectInput.select.selectValue({ label: option.label });
				this.props.onInputTextChange(option.label, 'salutation');
			});
		};
		addTag(page, 'salutation', 'salutations', resources.str_salutation, option.label, onTagAdded);
	}

	onNewTitleClick(option) {
		const { resources } = this.props;
		const page = invoiz.page;
		const selectInput = this.refs.title.getSelectInput();

		const onTagAdded = () => {
			selectInput.props.loadOptions('').then(() => {
				selectInput.select.selectValue({ label: option.label });
				this.props.onInputTextChange(option.label, 'title');
			});
		};
		addTag(page, 'title', 'titles', resources.str_title, option.label, onTagAdded);
	}

	getSalutationSelectOptions() {
		const { salutationClearable } = this.state;
		const { resources } = this.props;
		return {
			placeholder: resources.str_salutation,
			cache: false,
			loadOptions: fetchSalutations,
			labelKey: 'label',
			valueKey: 'label',
			matchProp: 'label',
			clearable: salutationClearable,
			onNewOptionClick: this.onNewSalutationClick.bind(this),
			handleChange: option => {
				this.setState({ salutationClearable: !!option }, () => {
					this.props.onSalutationChange(option);
				});
			}
		};
	}

	getTitleSelectOptions() {
		const { titleClearable } = this.state;
		const { resources } = this.props;
		return {
			placeholder: resources.str_title,
			cache: false,
			loadOptions: fetchTitles,
			labelKey: 'label',
			valueKey: 'label',
			matchProp: 'label',
			clearable: titleClearable,
			onNewOptionClick: this.onNewTitleClick.bind(this),
			handleChange: option => {
				this.setState({ titleClearable: !!option }, () => {
					this.props.onTitleChange(option);
				});
			}
		};
	}

	render() {
		const {
			onInputTextChange,
			data: { salutation, title, firstName, lastName },
			resources
		} = this.props;
		const salutationSelectOptions = this.getSalutationSelectOptions();
		const titleSelectOptions = this.getTitleSelectOptions();

		return (
			<div className="recipientFormPerson">
				<div className="recipientFormPerson_row">
					<SelectInputComponent
						ref="salutation"
						name="salutation"
						value={salutation}
						options={salutationSelectOptions}
					/>
					<SelectInputComponent ref="title" name="title" value={title} options={titleSelectOptions} />
				</div>
				<div className="recipientFormPerson_row">
					<TextInputExtendedComponent
						ref="firstName"
						required={true}
						name="firstName"
						placeholder={resources.str_firstName}
						value={firstName}
						onChange={onInputTextChange}
					/>
					<TextInputExtendedComponent
						ref="lastName"
						required={false}
						name="lastName"
						placeholder={resources.str_surName}
						value={lastName}
						onChange={onInputTextChange}
					/>
				</div>
			</div>
		);
	}
}

RecipientFormPersonComponent.propTypes = {
	data: PropTypes.object,
	onInputTextChange: PropTypes.func,
	onSalutationChange: PropTypes.func,
	onTitleChange: PropTypes.func
};

export default RecipientFormPersonComponent;
