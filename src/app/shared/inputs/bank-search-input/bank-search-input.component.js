import React from 'react';
import invoiz from 'services/invoiz.service';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import debounce from 'es6-promise-debounce';
import config from 'config';

const fetchBanks = searchTerm => {
	return invoiz
		.request(`${config.resourceHost}banking/banks?filter=${searchTerm}`, { auth: true })
		.then(({ body: { data } }) => {
			const options = data.banks.map(bank => {
				bank.name = `${bank.name} | ${bank.location} | ${bank.bankCode} | ${bank.bic}`;
				return bank;
			});
			return {
				options
			};
		});
};

class BankSearchInputComponent extends React.Component {
	componentDidMount() {
		const { autoFocus } = this.props;

		if (autoFocus) {
			setTimeout(() => {
				if (this.refs.bankSearchSelectInput && this.refs.bankSearchSelectInput.refs) {
					this.refs.bankSearchSelectInput.refs.bankSearchSelectInput.focus();
				}
			}, 300);
		}
	}

	getBankSearchSelectOptions() {
		const { onBankChanged, resources } = this.props;

		const onChange = selectedOption => {
			onBankChanged && onBankChanged(selectedOption);
		};

		const loadOptions = (searchTerm, callback) => {
			if (!searchTerm || (searchTerm && searchTerm.trim().length < 3)) {
				return callback(null, { options: [] });
			}

			return fetchBanks(searchTerm.trim());
		};

		return {
			placeholder: '',
			labelKey: 'name',
			valueKey: 'bankCode',
			cache: false,
			loadOptions: debounce(loadOptions, 300),
			handleChange: onChange,
			ignoreAccents: false
		};
	}

	render() {
		const { selectedBank, resources } = this.props;

		return (
			<SelectInputComponent
				ref="bankSearchSelectInput"
				name="bankSearchSelectInput"
				value={selectedBank}
				allowCreate={false}
				noResultsText={resources.bankSupportMessage}
				loadingPlaceholder={resources.str_searchBank}
				options={this.getBankSearchSelectOptions()}
			/>
		);
	}
}

export default BankSearchInputComponent;
