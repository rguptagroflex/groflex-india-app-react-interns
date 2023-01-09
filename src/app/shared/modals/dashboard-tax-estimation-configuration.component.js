import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import PropTypes from 'prop-types';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import CurrencyInputComponent from 'shared/inputs/currency-input/currency-input.component';
import PercentageInputComponent from 'shared/inputs/percentage-input/percentage-input.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import sanitizeNumber from 'helpers/sanitizeNumber';
import ButtonComponent from 'shared/button/button.component';
import ModalService from 'services/modal.service';
import { getCompanyTypes } from 'helpers/getCompanyTypes';

class TaxEstimationConfigurationComponent extends React.Component {
	constructor(props) {
		super(props);

		const { id, companyType, zipCode, city, incomeTaxRate, totalProfit } = props.data;
		const isCapitalCompanySelected = companyType && this.isCapitalCompany(companyType);
		const estimatedProfit = isCapitalCompanySelected ? 0 : totalProfit || 0;
		const { resources } = this.props;

		this.state = {
			id: id || null,
			companyType: companyType || '',
			estimatedProfit,
			taxRate: isCapitalCompanySelected ? 0 : incomeTaxRate || 0,
			zip: zipCode || '',
			city: { label: city, value: city, zip: zipCode } || null,
			cityOptions: [],
			isValid: isCapitalCompanySelected ? true : !!(companyType && zipCode && city && totalProfit),
			isCapitalCompanySelected,
			isTaxRateInputDisabled: estimatedProfit <= 0
		};

		this.companyTypeOptions = {
			loadOptions: (input, callback) => {
				callback(null, {
					options: getCompanyTypes(),
					complete: true
				});
			},
			clearable: false,
			backspaceRemoves: false,
			labelKey: 'label',
			valueKey: 'value',
			matchProp: 'label',
			placeholder: resources.companyTypeText,
			handleChange: this.onCompanyTypeChange.bind(this)
		};

		this.citySelectOptions = {
			clearable: true,
			backspaceRemoves: true,
			labelKey: 'label',
			valueKey: 'value',
			matchProp: 'label',
			placeholder: resources.str_place,
			handleChange: this.onCityChange.bind(this)
		};

		this.onCompanyTypeChange = this.onCompanyTypeChange.bind(this);
		this.onEstimatedProfitBlur = this.onEstimatedProfitBlur.bind(this);
		this.onEstimatedProfitChange = this.onEstimatedProfitChange.bind(this);
		this.onTaxRateBlur = this.onTaxRateBlur.bind(this);
		this.onZipChange = this.onZipChange.bind(this);
		this.onCityChange = this.onCityChange.bind(this);
		this.onCompleteClick = this.onCompleteClick.bind(this);
		this.checkValidity = this.checkValidity.bind(this);
	}

	isCapitalCompany(companyType) {
		return companyType === 'corporation';
	}

	onCompleteClick() {
		const { onSave } = this.props;
		if (typeof this.state.city !== 'string') {
			this.state.city = this.state.city && this.state.city.label;
		}
		onSave(this.state);
		ModalService.close();
	}

	onCompanyTypeChange(selectedOption) {
		this.setState(
			{
				companyType: selectedOption ? selectedOption.value : '',
				isCapitalCompanySelected: selectedOption && this.isCapitalCompany(selectedOption.value)
			},
			() => {
				this.checkValidity();
			}
		);
	}

	onEstimatedProfitBlur(value) {
		const sanitized = sanitizeNumber(value, { precision: config.currencyFormat.precision, thousand: '', decimal: config.currencyFormat.decimal });
		const newValue = sanitized && sanitized.value;

		this.setState({ estimatedProfit: newValue || 0 });

		if (!newValue || newValue <= 0) {
			this.checkValidity();
		}
	}

	onEstimatedProfitChange(value) {
		const sanitized = sanitizeNumber(value, { precision: config.currencyFormat.precision, thousand: '', decimal: config.currencyFormat.decimal });
		const newValue = sanitized && sanitized.value;

		if (newValue === this.state.estimatedProfit) {
			return;
		}

		this.setState({ estimatedProfit: newValue || 0 });

		clearTimeout(this.taxRateTimeout);

		this.taxRateTimeout = setTimeout(() => {
			if (newValue > 0) {
				invoiz
					.request(`${config.resourceHost}estimationSetting/calculateTaxRate?value=${newValue}`, {
						auth: true,
						method: 'GET'
					})
					.then(response => {
						const { taxRate } = response.body.data;
						this.setState({ taxRate, isTaxRateInputDisabled: false });
						this.checkValidity();
					});
			} else {
				this.setState({ isTaxRateInputDisabled: true });
			}
		}, 500);
	}

	onTaxRateBlur(value) {
		const sanitized = sanitizeNumber(value, { precision: config.currencyFormat.precision, thousand: '', decimal: config.currencyFormat.decimal });
		const newValue = sanitized && sanitized.value;
		this.setState({ taxRate: newValue || 0 });
	}

	onZipChange(value) {
		this.setState({ zip: value }, () => {
			if (value.length > 3) {
				invoiz
					.request(config.dashboard.endpoints.findCity + encodeURIComponent(value), {
						method: 'GET',
						auth: true
					})
					.then(response => {
						const cities = response && response.body && response.body.data;
						const newCityOptions = cities.map(cityData => {
							const zip = cityData.zipCodes && cityData.zipCodes[0] && cityData.zipCodes[0].zipCode;
							return { value: cityData.name, label: cityData.name, zip };
						});

						this.setState({ cityOptions: newCityOptions });
						if (newCityOptions && newCityOptions[0]) {
							this.setState({ city: newCityOptions[0] });
						}
						this.checkValidity();
					})
					.catch(() => {
						this.checkValidity();
					});
			}
		});
	}

	onCityChange(value) {
		if (!value) {
			this.setState({ city: null }, () => {
				this.checkValidity();
			});
		} else {
			this.setState({ city: value.label }, () => {
				if (!this.state.zip || this.state.zip.length < 5) {
					this.setState({ zip: value.zip }, () => {
						this.checkValidity();
					});
				}
				this.checkValidity();
			});
		}
	}

	checkValidity() {
		const isValidProfit =
			(this.state.companyType && this.isCapitalCompany(this.state.companyType)) || this.state.estimatedProfit;
		const valid = this.state.companyType && this.state.zip && this.state.city && isValidProfit;
		this.setState({ isValid: valid });
	}

	render() {
		const { resources } = this.props;
		return (
			<div className="taxEstimationConfigurationWrapper">
				<h5 className="headline text-h5">{resources.str_setProfile}</h5>

				<h6 className="company-type">{resources.companyTypeText}</h6>

				<SelectInputComponent
					allowCreate={false}
					value={this.state.companyType}
					options={this.companyTypeOptions}
					dataQsId="dashboard-taxEstimation-configuration-companytype"
				/>

				<h6 className="company-location">{resources.str_headquarters}</h6>

				<div className="row company-location-inputs">
					<div className="col-xs-4">
						<TextInputExtendedComponent
							value={this.state.zip}
							name="zip"
							placeholder={resources.str_postcode}
							onChange={this.onZipChange}
							dataQsId="dashboard-taxEstimation-configuration-zip"
						/>
					</div>

					<div className="col-xs-8">
						<SelectInputComponent
							allowCreate={true}
							notAsync={true}
							options={this.citySelectOptions}
							value={this.state.city}
							loadedOptions={this.state.cityOptions}
							onChange={this.onCityChange}
							dataQsId="dashboard-taxEstimation-configuration-city"
						/>
					</div>
				</div>

				<div
					className="row estimated-profit"
					style={{ visibility: this.state.isCapitalCompanySelected ? 'hidden' : 'visible' }}
				>
					<div className="col-xs-7">
						<h6 className="label">{resources.forecastedProfitText}</h6>
						<div className="subheadline">{resources.profitFromPreviousYearText}</div>
					</div>
					<div className="col-xs-5 estimated-profit-input-container">
						<CurrencyInputComponent
							value={this.state.estimatedProfit}
							name="estimatedProfit"
							onChange={this.onEstimatedProfitChange}
							onBlur={this.onEstimatedProfitBlur}
							dataQsId="dashboard-taxEstimation-configuration-profit"
						/>
					</div>
				</div>

				<div
					className="row tax-rate"
					style={{ visibility: this.state.isCapitalCompanySelected ? 'hidden' : 'visible' }}
				>
					<div className="col-xs-7">
						<h6 className="label">{resources.str_incomeTaxRate}</h6>
					</div>
					<div className="col-xs-5">
						<PercentageInputComponent
							value={this.state.taxRate}
							name="percent"
							numberKind="percent"
							min={0}
							max={100}
							onBlur={this.onTaxRateBlur}
							disabled={this.state.isTaxRateInputDisabled}
							dataQsId="dashboard-taxEstimation-configuration-taxrate"
						/>
					</div>
				</div>

				<div className="modal-base-footer">
					<div className="cancel-wrapper">
						<ButtonComponent
							dataQsId="dashboard-taxEstimation-configuration-btn-cancel"
							type="cancel"
							callback={() => ModalService.close()}
							label={resources.str_abortStop}
						/>
					</div>
					<div className="save-wrapper">
						<ButtonComponent
							dataQsId="dashboard-taxEstimation-configuration-btn-save"
							buttonIcon="icon-check"
							disabled={!this.state.isValid}
							callback={() => this.onCompleteClick()}
							label={resources.str_finished}
						/>
					</div>
				</div>

				<div className="row align-right" />
			</div>
		);
	}
}

TaxEstimationConfigurationComponent.propTypes = {
	city: PropTypes.string,
	companyType: PropTypes.number,
	estimatedProfit: PropTypes.number,
	taxRate: PropTypes.number,
	zip: PropTypes.number
};

export default TaxEstimationConfigurationComponent;
