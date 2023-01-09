import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import CheckboxInputComponent from 'shared/inputs/checkbox-input/checkbox-input.component';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import ButtonComponent from 'shared/button/button.component';
import ChangeDetection from 'helpers/changeDetection';

const changeDetection = new ChangeDetection();

const TAX_OPTIONS = {
	IS_SUBJECT_TO_IMPUTED_TAX_TRUE: 'isSubjectToImputedTaxationTrue',
	IS_SUBJECT_TO_IMPUTED_TAX_FALSE: 'isSubjectToImputedTaxationFalse',
	SMALL_BUSINESS: 'isSmallBusiness'
};

class TaxSettingsComponent extends React.Component {
	constructor(props) {
		super(props);
		const { resources } = this.props;
		const { isSubjectToImputedTaxation } = this.props.account;
		let selectedOption;

		if (isSubjectToImputedTaxation) {
			selectedOption = TAX_OPTIONS.IS_SUBJECT_TO_IMPUTED_TAX_TRUE;
		} else {
			selectedOption = TAX_OPTIONS.IS_SUBJECT_TO_IMPUTED_TAX_FALSE;
		}

		this.state = {
			selectedOption,
			salesTaxFrequency: this.props.account.salesTaxFrequency,
			permanentExtensionOfPaymentDeadline: this.props.account.permanentExtensionOfPaymentDeadline
		};

		this.taxFrequencyOptions = [
			{ label: resources.str_perMonth, key: 'monthly' },
			{ label: resources.str_quaterly, key: 'quarterly' },
			{ label: resources.str_yearly, key: 'yearly' }
		];
		this.taxFrequencySelectOptions = {
			searchable: false,
			clearable: false,
			backspaceRemoves: false,
			labelKey: 'label',
			valueKey: 'key',
			matchProp: 'label',
			handleChange: option => this.onTaxFrequencyChange(option)
		};
	}

	componentDidMount() {
		setTimeout(() => {
			setTimeout(() => {
				const dataOriginal = JSON.parse(JSON.stringify(this.state));

				changeDetection.bindEventListeners();

				changeDetection.setModelGetter(() => {
					const currentData = JSON.parse(JSON.stringify(this.state));

					return {
						original: dataOriginal,
						current: currentData
					};
				});
			}, 0);
		});
	}

	componentWillUnmount() {
		changeDetection.unbindEventListeners();
	}

	onTaxFrequencyChange(option) {
		this.setState({ salesTaxFrequency: option.key });
	}

	onTaxSettingsSaveClick() {
		const { resources } = this.props;
		const { selectedOption, salesTaxFrequency, permanentExtensionOfPaymentDeadline } = this.state;

		const data = {
			isSmallBusiness: selectedOption === TAX_OPTIONS.SMALL_BUSINESS,
			isSubjectToImputedTaxation: selectedOption === TAX_OPTIONS.IS_SUBJECT_TO_IMPUTED_TAX_TRUE,
			salesTaxFrequency,
			permanentExtensionOfPaymentDeadline
		};

		invoiz
			.request(config.settings.endpoints.account, {
				method: 'POST',
				data,
				auth: true
			})
			.then(() => {
				invoiz.showNotification(resources.accountTaxSuccessMessage);
				invoiz.user.isSmallBusiness = data.isSmallBusiness;
				invoiz.trigger('accountSettingsTaxSettingsSaved', data.isSmallBusiness);

				const dataOriginal = JSON.parse(JSON.stringify(this.state));

				changeDetection.setModelGetter(() => {
					const currentData = JSON.parse(JSON.stringify(this.state));

					return {
						original: dataOriginal,
						current: currentData
					};
				});
			})
			.catch(() => {
				invoiz.showNotification({ message: resources.accountTaxErrorMessage, type: 'error' });
			});
	}

	handleOptionChange(changeEvent) {
		this.setState({
			selectedOption: changeEvent.target.value
		});
	}

	onFrequencyExtensionChange(isChecked) {
		this.setState({ permanentExtensionOfPaymentDeadline: isChecked });
	}

	render() {
		const { resources } = this.props;
		return (
			<div className="settings-taxsettings-component">
				<div className="settings-account-component">
					<div className="row u_pt_60 u_pb_40">
						<div className="col-xs-4 form_groupheader_edit text-h4">{resources.str_controlSettings}</div>
						<div className="col-xs-8">
							<div className="settings-taxsettings-row">
								<div className="taxsettings-col-left">
									<input
										id="account-settings-tax-settings-option1"
										type="radio"
										value={TAX_OPTIONS.IS_SUBJECT_TO_IMPUTED_TAX_TRUE}
										className="radio-custom"
										checked={
											this.state.selectedOption === TAX_OPTIONS.IS_SUBJECT_TO_IMPUTED_TAX_TRUE
										}
										onChange={evt => this.handleOptionChange(evt)}
									/>
									<span className="radio-custom-circle" />
								</div>
								<div className="taxsettings-col-right text-muted">
									<label htmlFor="account-settings-tax-settings-option1">{resources.str_targetTaxation}</label>
									<div className="info-text">
										{resources.accountTaxSettingsTaxInfo}
									</div>
								</div>
							</div>
							<div className="settings-taxsettings-row">
								<div className="taxsettings-col-left">
									<input
										id="settings-tax-settings-option2"
										type="radio"
										value={TAX_OPTIONS.IS_SUBJECT_TO_IMPUTED_TAX_FALSE}
										className="radio-custom"
										checked={
											this.state.selectedOption === TAX_OPTIONS.IS_SUBJECT_TO_IMPUTED_TAX_FALSE
										}
										onChange={evt => this.handleOptionChange(evt)}
									/>
									<span className="radio-custom-circle" />
								</div>
								<div className="taxsettings-col-right text-muted">
									<label htmlFor="settings-tax-settings-option2">{resources.str_actualTaxation}</label>
									<div className="info-text">
										{resources.accountTaxSettingsActualTaxInfo}
									</div>
								</div>
							</div>
							<div className="settings-taxsettings-row">
								<div className="taxsettings-col-left">
									<input
										id="settings-tax-settings-option3"
										type="radio"
										value={TAX_OPTIONS.SMALL_BUSINESS}
										className="radio-custom"
										checked={this.state.selectedOption === TAX_OPTIONS.SMALL_BUSINESS}
										onChange={evt => this.handleOptionChange(evt)}
									/>
									<span className="radio-custom-circle" />
								</div>
								<div className="taxsettings-col-right text-muted">
									<label htmlFor="settings-tax-settings-option3">{resources.str_smallBusiness}</label>
									<div className="info-text">
										{resources.accountTaxSettingsSmallBusinessInfo}
									</div>
								</div>
							</div>

							<div className="taxsettings-frequency">
								<div className="text-h6">{resources.accountTaxSettingsFrequencyInfo}</div>
								<SelectInputComponent
									searchable={false}
									allowCreate={false}
									notAsync={true}
									options={this.taxFrequencySelectOptions}
									value={this.state.salesTaxFrequency}
									loadedOptions={this.taxFrequencyOptions}
								/>

								<div className="taxsettings-checkbox">
									<CheckboxInputComponent
										label={resources.str_permanentExtension}
										checked={this.state.permanentExtensionOfPaymentDeadline}
										onChange={checked => this.onFrequencyExtensionChange(checked)}
									/>
								</div>
							</div>

							<div className="col-xs-6 col-xs-offset-6 u_mt_24 u_pd-r0">
								<ButtonComponent
									buttonIcon={'icon-check'}
									type="primary"
									callback={() => this.onTaxSettingsSaveClick()}
									label={resources.str_toSave}
									dataQsId="settings-account-btn-taxSettings"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default TaxSettingsComponent;
