import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import ModalService from 'services/modal.service';
import ChangeEmailModal from 'shared/modals/change-email-modal.component';
import ButtonComponent from 'shared/button/button.component';
import ChangeDetection from 'helpers/changeDetection';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import SelectStateInputComponent from 'shared/select-state/select-state.component';
import { getCountries } from 'helpers/getCountries';
import TextareaAutosize from 'react-textarea-autosize';
import NumberInputComponent from 'shared/inputs/number-input/number-input.component';
import userPermissions from 'enums/user-permissions.enum';

import OnboardInputComponent from 'shared/onboarding/onboard-select.component';

const changeDetection = new ChangeDetection();

class AccountComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			account: props.account,
			isGoogleAccount: !!(invoiz.user && invoiz.user.googleId && invoiz.user.googleId.length > 0),
			showCompanyAddressInfo: false,
			errorMessage: '',
			errorMessageMobile: '',
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
		};

		invoiz.on('userModelSubscriptionDataSet', () => {
			const isGoogleAccount = !!(invoiz.user && invoiz.user.googleId && invoiz.user.googleId.length > 0);

			if (!this.isUnmounted) {
				this.setState({ isGoogleAccount });
			}
		});
	}

	componentDidMount() {
		this.showCompanyAddressInfo();
		
		setTimeout(() => {
			const dataOriginal = JSON.parse(JSON.stringify(this.state.account));

			changeDetection.bindEventListeners();

			changeDetection.setModelGetter(() => {
				const currentData = JSON.parse(JSON.stringify(this.state.account));

				return {
					original: dataOriginal,
					current: currentData
				};
			});
		}, 0);
	}

	componentWillUnmount() {
		this.isUnmounted = true;
		changeDetection.unbindEventListeners();
	}

	onEditEmailBtnClick() {
		const { account } = this.state;
		const { resources } = this.props;

		ModalService.open(<ChangeEmailModal accountEmail={account.accountEmail} resources={resources} />, {
			headline: resources.str_changeEmail,
			isCloseable: false,
			width: 520,
			//padding: 40,
			noTransform: true
		});
	}

	onInputChange(value, name) {
		const account = JSON.parse(JSON.stringify(this.state.account));
		if (account.companyAddress && account.companyAddress.hasOwnProperty(name)) {
			account.companyAddress[name] = value;
		}
		if (name === 'mobile') {
			if (!config.mobileNumberValidation.test(value)) {
				const { resources } = this.props;
				this.setState({ errorMessageMobile: resources.validMobileNumberError });
			} else {
				this.setState({ errorMessageMobile: '' });
			}
			account.mobile = value;
		}

		this.setState({ account });
	}
	onSaveClicked() {
		const { account } = this.state;
		const { resources } = this.props;
		if (account.companyAddress.countryIso === 'IN' && account.indiaStateId === null && account.businessType === null) {
			this.setState({
				errorMessage: resources.mandatoryFieldValidation
			});
			return;
		}
		if (account.mobile.toString().length < 10 || !config.mobileNumberValidation.test(account.mobile)) {
			this.setState({
				errorMessageMobile: resources.validMobileNumberError
			});
			return;
		}
		// if (account.companyAddress && !account.companyAddress.gstNumber) {
		// 	this.refs['account-edit-text-input-gstNumber'] &&
		// 		this.refs['account-edit-text-input-gstNumber'].validateAndSetValue();
		// 	return;
		// } else if (account.companyAddress && !account.companyAddress.cinNumber) {
		// 	this.refs['account-edit-text-input-cinNumber'] &&
		// 		this.refs['account-edit-text-input-cinNumber'].validateAndSetValue();
		// 	return;
		// }
		const data = {
			companyAddress: {
				companyName: account.companyAddress.companyName,
				firstName: account.companyAddress.firstName,
				lastName: account.companyAddress.lastName,
				street: account.companyAddress.street,
				zipCode: account.companyAddress.zipCode,
				city: account.companyAddress.city,
				countryIso: account.companyAddress.countryIso,
				gstNumber: account.companyAddress.gstNumber,
				cinNumber: account.companyAddress.cinNumber

			},
			indiaStateId: account.indiaStateId,
			mobile: account.mobile,
			businessType: account.businessType,
			businessTurnover: account.businessTurnover,
			businessCategory: account.businessCategory
		};
		invoiz
			.request(config.settings.endpoints.account, {
				method: 'POST',
				data,
				auth: true
			})
			.then(({ body: { data: { companyAddress, indiaStateId, mobile, businessCategory, businessType, businessTurnover } } }) => {
				invoiz.user.companyAddress = companyAddress;
				invoiz.user.indiaStateId = indiaStateId;
				invoiz.user.businessCategory = businessCategory;
				invoiz.user.businessTurnover = businessTurnover;
				invoiz.user.businessType = businessType;
				invoiz.user.mobile = mobile;
				invoiz.page.showToast({ message: resources.accountDetailsSuccessMessage });
				this.showCompanyAddressInfo(companyAddress);
				const dataOriginal = JSON.parse(JSON.stringify(this.state.account));
				changeDetection.setModelGetter(() => {
					const currentData = JSON.parse(JSON.stringify(this.state.account));

					return {
						original: dataOriginal,
						current: currentData
					};
				});
			})
			.catch(response => {
				invoiz.page.showToast({
					message: resources.accountDetailsErrorMessage,
					type: 'error'
				});
			});
	}

	showCompanyAddressInfo(companyAddressResponse) {
		const { account } = this.state;
		let showCompanyAddressInfo = true;
		const companyAddress = companyAddressResponse || account.companyAddress;

		Object.keys(companyAddress).forEach(key => {
			if (companyAddress[key].length > 0) {
				showCompanyAddressInfo = false;
			}
		});

		this.setState({ showCompanyAddressInfo });
	}

	onCountryChange(key, value) {
		const { account } = this.state;
		account.companyAddress[key] = value;
		if (value !== 'IN') {
			account.indiaStateId = null;
		}
		this.setState({ account });
	}

	onStateChanged (indiaStateObj) {
		const { account } = this.state;
		let { errorMessage } = this.state;
		const { resources } = this.props;
		if (!indiaStateObj) {
			account.indiaStateId = null;
			errorMessage = resources.mandatoryFieldValidation;
		} else {
			account.indiaStateId = indiaStateObj.id;
			errorMessage = '';
		}
		this.setState({ account, errorMessage });
	}

	onMobileNumberBlur(value) {
		const { resources } = this.props;
		if (value.length < 10 || !config.mobileNumberValidation.test(value)) {
			this.setState({ errorMessageMobile: resources.validMobileNumberError });
		} else {
			this.setState({ errorMessageMobile: '' });
		}
	}

	onBusinessCategoryChanged (category, regStep) {
		const { account } = this.state;
		let { errorMessage } = this.state;
		const { resources } = this.props;
		if (!category) {
			account.businessType = null;
			errorMessage = resources.mandatoryFieldValidation;
		} else {
			if (regStep === 'businesstype') {
				account.businessType = category.id;
				errorMessage = '';
			} else if (regStep === 'businessturnover') {
				account.businessTurnover = category.id;
			} else if (regStep === 'businesscategory') {
				account.businessCategory = category.id;
			}
		}
		this.setState({ account, errorMessage });
	}

	render() {
		const { account, isGoogleAccount, showCompanyAddressInfo, errorMessage, errorMessageMobile, canChangeAccountData } = this.state;
		const { resources } = this.props;
		const title = account.companyAddress.companyName || 'Companies';
		if (account.companyAddress.countryIso === '') {
			account.companyAddress.countryIso = 'IN';
		}
		return (
			<div className="settings-account-component">
				<div className="row u_pt_20"> {/*u_pt_60 u_pb_40 */}
					<div className="col-xs-12 text-h4 u_pb_20">{'Company'}</div> {/* {title} */}
					<div className="col-xs-12">
						{/* <div className="col-xs-12" /> */}
						{/* <div className="col-xs-12"> */}
							<div className="row">
								{/* <TextInputExtendedComponent
									customWrapperClass={'col-xs-12 input-leftLabel input-boxBorder setting-email-input'}
									name={'accountEmail'}
									value={account.accountEmail}
									label={resources.registeredEmailAddress}
									autoComplete="off"
									spellCheck="false"
									disabled={true}
								/>

								{isGoogleAccount ? null : (
									<div className="form_input col-xs-12 update-email-link">
										<a onClick={() => this.onEditEmailBtnClick()}>{resources.str_changeEmail}</a>
									</div>
								)} */}

								{showCompanyAddressInfo ? (
									<div className="col-xs-12 accountSettingsCompanyAddressInfo">
										{resources.accountSettingsAddressInfo}
									</div>
								) : null}

								<TextInputExtendedComponent
									customWrapperClass={'col-xs-12'}
									name={'companyName'}
									value={account.companyAddress.companyName}
									onChange={(value, name) => this.onInputChange(value, name)}
									label={resources.str_companyName}
									autoComplete="off"
									spellCheck="false"
									disabled={!canChangeAccountData}
								/>

								<TextInputExtendedComponent
									customWrapperClass={'col-xs-6'}
									name={'firstName'}
									value={account.companyAddress.firstName}
									onChange={(value, name) => this.onInputChange(value, name)}
									label={resources.str_firstName}
									autoComplete="off"
									spellCheck="false"
									disabled={!canChangeAccountData}
								/>

								<TextInputExtendedComponent
									customWrapperClass={'col-xs-6'}
									name={'lastName'}
									value={account.companyAddress.lastName}
									onChange={(value, name) => this.onInputChange(value, name)}
									label={resources.str_surName}
									autoComplete="off"
									spellCheck="false"
									disabled={!canChangeAccountData}
								/>
								<div className="col-xs-12">
									<label className="textarea_label">{resources.str_streetAndHouseNumber}</label>
									<TextareaAutosize
										name="street"
										className="textarea_input settings-account-address-street"
										placeholder={resources.str_enterAddress}
										minRows={3}
										maxRows={15}
										value={account.companyAddress.street || ''}
										onChange={(event) => this.onInputChange(event.target.value, event.target.name)}
										disabled={!canChangeAccountData}
									/>
									<span className="textarea_bar" />
								</div>

								{/* <TextInputExtendedComponent
									customWrapperClass={'col-xs-6'}
									name={'street'}
									value={account.companyAddress.street}
									onChange={(value, name) => this.onInputChange(value, name)}
									label={resources.accountSettingsStreetAndHouse}
									autoComplete="off"
									spellCheck="false"
								/>

								<TextInputExtendedComponent
									customWrapperClass={'col-xs-2'}
									name={'zipCode'}
									value={account.companyAddress.zipCode}
									onChange={(value, name) => this.onInputChange(value, name)}
									label={resources.str_postCode}
									autoComplete="off"
									spellCheck="false"
								/>

								<TextInputExtendedComponent
									customWrapperClass={'col-xs-4'}
									name={'city'}
									value={account.companyAddress.city}
									onChange={(value, name) => this.onInputChange(value, name)}
									label={resources.str_place}
									autoComplete="off"
									spellCheck="false"
								/> */}
								<div className="col-xs-6">
									<div className="settings-account-country-select">
										<SelectInputComponent
											title={resources.str_country}
											name={'countryIso'}
											value={account.companyAddress.countryIso}
											allowCreate={false}
											notAsync={true}
											options={{
												labelKey: 'label',
												valueKey: 'iso2',
												clearable: false,
												backspaceRemoves: false,
												handleChange: option =>
													this.onCountryChange('countryIso', option.iso2)
											}}
											loadedOptions={getCountries()}
											disabled={!canChangeAccountData}
										/>
									</div>
								</div>
								<div className="col-xs-6">
									<div className="settings-account-country-select">
										{ account.companyAddress.countryIso === 'IN' ? (
											<SelectStateInputComponent
												title={resources.str_state}
												stateId={account.indiaStateId}
												onStateChanged={this.onStateChanged.bind(this)}
												errorMessage={errorMessage}
												disabled={!canChangeAccountData}
											/>
									  ) : null }
									</div>
								</div>
								<div className="col-xs-12 settings-mobile">
									<div className="col-xs-6">
										<NumberInputComponent
											ref="mobile-number-input"
											dataQsId="settings-account-mobile"
											label={resources.str_mobilePhone}
											name={'mobile'}
											maxLength="10"
											value={parseInt(account.mobile)}
											isDecimal={false}
											errorMessage={errorMessageMobile}
											onChange={(value, name) => this.onInputChange(value, name)}
											onBlur={value => this.onMobileNumberBlur(value)}
											defaultNonZero={true}
											disabled={!canChangeAccountData}
										/>
									</div>
								</div>

								<TextInputExtendedComponent
									customWrapperClass={'col-xs-6'}
									ref="account-edit-text-input-gstNumber"
									name={'gstNumber'}
									label={resources.str_gstNumber}
									// required={true}
									autoComplete="off"
									spellCheck="false"
									value={account.companyAddress.gstNumber || ''}
									onChange={(value, name) => this.onInputChange(value, name)}
									disabled={!canChangeAccountData}
								/>
								<TextInputExtendedComponent
									customWrapperClass={'col-xs-6'}
									ref="account-edit-text-input-cinNumber"
									dataQsId="account-edit-text-input-cinNumber"
									name={'cinNumber'}
									label={resources.str_cinNumber}
									// required={true}
									autoComplete="off"
									spellCheck="false"
									value={account.companyAddress.cinNumber || ''}
									onChange={(value, name) => this.onInputChange(value, name)}
									disabled={!canChangeAccountData}
								/>
								{/* <div className="col-xs-8">
									<div className="settings-account-country-select">
										<OnboardInputComponent
											title={resources.str_businessTypeTitle}
											regStep={'businesstype'}
											businessCategoryId={account.businessType}
											onBusinessCategoryChanged={this.onBusinessCategoryChanged.bind(this)}
											errorMessage={errorMessage}
											disabled={!canChangeAccountData}
										/>

									</div>
								</div>
								<div className="col-xs-4">
									<div className="settings-account-country-select">
										<OnboardInputComponent
											title={resources.str_businessTurnoverTitle}
											regStep={'businessturnover'}
											businessCategoryId={account.businessTurnover}
											onBusinessCategoryChanged={this.onBusinessCategoryChanged.bind(this)}
											errorMessage={errorMessage}
											disabled={!canChangeAccountData}
										/>

									</div>
								</div>
								<div className="col-xs-12">
									<div className="settings-account-country-select">
										<OnboardInputComponent
											title={resources.str_businessCategoryTitle}
											regStep={'businesscategory'}
											businessCategoryId={account.businessCategory}
											onBusinessCategoryChanged={this.onBusinessCategoryChanged.bind(this)}
											errorMessage={errorMessage}
											disabled={!canChangeAccountData}
										/>
									</div>
								</div> */}

								{/* <input type="text" value="" onChange="" className="settings-autofilled-Field-hidden" /> */}
							</div>
						{/* </div> */}

						<div className="col-xs-6 col-xs-offset-6 button-save">
							<ButtonComponent
								buttonIcon={'icon-check'}
								type="primary"
								callback={() => this.onSaveClicked()}
								label={resources.str_toSave}
								dataQsId="settings-account-btn-accountDetails"
								disabled={!canChangeAccountData}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default AccountComponent;
