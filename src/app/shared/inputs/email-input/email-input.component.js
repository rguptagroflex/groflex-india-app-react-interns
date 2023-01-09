import React from 'react';
import { Creatable as Select } from 'react-select';
import config from 'config';
import _ from 'lodash';

class EmailInputComponent extends React.Component {
	constructor(props) {
		super(props);

		const { recipients } = props;

		this.state = {
			options: recipients.map(recipient => {
				return { label: recipient };
			}),
			value: recipients
		};
	}

	componentWillReceiveProps(props) {
		const { recipients } = props;

		this.state = {
			options: recipients.map(recipient => {
				return { label: recipient };
			}),
			value: recipients
		};
	}

	setAdress(value) {
		const option = value.length ? value[value.length - 1] : value;
		const { options } = this.state;

		if (option.label) {
			if (!config.emailCheck.test(option.label)) {
				// necessary to reset options because Select adds all the things
				this.setState({ options });
				return;
			}

			const { id } = option;

			if (_.findIndex(options, a => a.id === id) === -1) {
				options.push(option);
			}
		}

		this.setState({ options, value }, () => {
			const recipients = value.length ? value.map(o => o.label) : value.label ? [value.label] : [];
			this.props.onChange(recipients);
		});
	}

	handleChange(option) {
		this.setAdress(option);
	}

	getSelectProps(id) {
		const { options, value } = this.state;
		const { multi, resources } = this.props;
		return {
			options: Array.from(options),
			value,
			multi,
			placeholder: resources.emailInputEMailForReminderShipment,
			labelKey: 'label',
			matchProp: 'label',
			valueKey: 'label',
			noResultsText: resources.str_noMatches,
			onChange: this.handleChange.bind(this),
			clearable: false,
			promptTextCreator: label => {
				return `'${label}' ${resources.str_useSmall}`;
			},
			valueRenderer: function(option) {
				return <span>{option.label}</span>;
			},
			getCustomLabelToHighlight: option => {
				return `${option.label}`;
			}
		};
	}

	render() {
		const { customerId } = this.props;
		const selectProps = this.getSelectProps(customerId);

		return <Select className="emailSelect" name="dunningEmail" {...selectProps} />;
	}
}

export default EmailInputComponent;
