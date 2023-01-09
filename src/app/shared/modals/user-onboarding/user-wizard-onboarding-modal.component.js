import React from 'react';
import config from 'config'
import SVGInline from 'react-svg-inline';
import { connect } from 'react-redux';

import { getCountries } from 'helpers/getCountries';
import WelcomeSvg from 'assets/images/svg/onBoarding/welcome-hero.svg';
import { fetchStatsData } from 'redux/ducks/dashboard/salesExpensesStats';
import TextInputComponent from '../../inputs/text-input/text-input.component';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import SelectStateInputComponent from 'shared/select-state/select-state.component';
import TextareaAutosize from 'react-textarea-autosize';
import Invoiz from '../../../services/invoiz.service';
import OvalToggleComponent from '../../oval-toggle/oval-toggle.component';
import ButtonComponent from '../../button/button.component';
import RegistrationViewState from '../../../enums/account/registration-view-state.enum';
import SalesIcon from 'assets/images/svg/quick-links/create-sales.svg';
import { Link } from 'react-router-dom';

class UserWizardOnBoardingModalComponent extends React.Component {
    constructor(props) {
        super();
        this.props = props;
        
        this.state = {
            account: null,
            errorMessage: "",

            businessNameError: false,
            mobileError: false,
            gstNumberError: false,

            businessName: "",
            mobile: "",
            country: "",
            state: "",
            stateError: "",
            address: "",
            gstNumber: "",
            gstRegistered: false,
            showMobileVerificationScreen: this.props.showMobileVerfication || false,
            otpInitiated: false,
            mobileOTP: "",
            disableMobileField: true,
            showGifScreen: false,
            showExploreScreen: false,
        }
    }

    async getAccount() {
        const account = (await Invoiz.request(`${config.settings.endpoints.account}`, {
            auth: true
        })).body.data;

        this.setState({
            account,
            state: account.indiaStateId,
            country: account.companyAddress.countryIso || 'IN',
            address: account.companyAddress.street,
            mobile: account.mobile
        });

        if(this.state.showMobileVerificationScreen) this.sendMobileOtp();
    }

    onCountryChange(key, value) {
		const { account } = this.state;
		account.companyAddress[key] = value;
		if (value !== 'IN') {
			account.indiaStateId = null;
		}
		this.setState({ account, country: value });
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
		this.setState({ account, errorMessage, state: indiaStateObj.id });
	}

    onAddressChange(value) {
		const { account } = this.state;
        account.companyAddress.street = value;
        this.setState({account, address: value});
    }

    sendMobileOtp() {
        const { mobile: mobileNo } = this.state;

        this.resendDisabled = true;
		Invoiz
			.request(config.account.endpoints.resendMobileOtp, {
				method: 'PUT',
				auth: true,
				data: { mobileNo }
			})
			.then(() => {
                this.setState({otpInitiated: true})
				Invoiz.page.showToast({
					message: `You have received a new OTP`,
					wrapperClass: 'absolute-top'
				});

				setTimeout(() => {
					this.resendDisabled = false;
				}, 5000);
			});
	}

    verifyOtp() {
        const { mobileOTP, mobile } = this.state;
        const { resources } = this.props;

        if(!mobileOTP) return;

        Invoiz
            .request(config.account.endpoints.validateMobileOtp, {
                method: 'PUT',
                auth: true,
                data: { mobileOtp: mobileOTP }
            })
            .then(response => {
                Invoiz.page.showToast({
					message: `Successfully Verified`,
                    wrapperClass: 'absolute-top'
				});
                Invoiz.user.mobile = mobile;
                Invoiz.user.registrationStep = 'finished';
                this.props.continue();
                this.showGifScreen();
            }).catch(error => {
                Invoiz.page.showToast({
					message: `Invalid OTP`,
                    wrapperClass: 'absolute-top',
                    type: 'error'
				});
            })
    }

    validateBusinessDetails() {
        const {
            businessName,
            state,
            mobile,
            gstNumber,
            gstRegistered
        } = this.state;

        const businessNameError = !businessName;
        const gstNumberError = (!gstNumber || gstNumber.length !== 15) && gstRegistered;
        const stateError = !state;

        let mobileError = false;
        if(mobile !== "" && mobile !== null) {
            mobileError = mobile.length !== 10;
        } else { mobileError = true };

        this.setState({businessNameError, mobileError, gstNumberError, stateError});
        return businessNameError || gstNumberError || stateError || mobileError;
    }

    continue() {
        const {
            businessName,
            state,
            address,
            country,
            gstNumber,
            mobile
        } = this.state;

        if(this.validateBusinessDetails()) return;
        
        Invoiz.request(`${config.account.endpoints.updateBusinessDetails}`, {
            method: 'PUT',
            auth: true,
            data: { businessName, country, state, address, gstNumber, mobile }
        })
            .then(async (res) => {
                Invoiz.user.registrationStep = 'finished';
                // await this.setState({showMobileVerificationScreen: true});
                // this.sendMobileOtp()
                // this.props.continue();
                this.showGifScreen();
            })
            .catch(err => {
                Invoiz.page.showToast({ message: "Couldn't update details", type: 'error' });
            })

    }

    onFinish() {
        this.props.closeModal();
    }

    componentWillMount() {
        this.getAccount();
    }

    async showGifScreen() {
        await this.setState({showGifScreen: true});
        setTimeout(() => {
            this.setState({
                showGifScreen: false,
                showExploreScreen: true
            })
        }, 3000);
    }

	render() {
        const { resources } = this.props;
        const {
            account, 
            gstRegistered,
            businessName,
            businessNameError,
            mobile,
            mobileError,
            state,
            stateError,
            country,
            address,
            gstNumberError,
            gstNumber,
            mobileOTP,
            otpInitiated,
            showMobileVerificationScreen,
            disableMobileField,
            showGifScreen,
            showExploreScreen,
        } = this.state;
        const canChangeAccountData = true;

        return (
            <React.Fragment>
                {showGifScreen
                    ? <div className="user-wizard-onboarding-modal setup-complete-row row">
                        <div className="col-xs-12 text-center">
                            <p className="heading">YAY!!!</p>
                            <p className="subheading">Your setup is complete</p>
                        </div>
                    </div>
                    : showExploreScreen
                        ? <div className="user-wizard-onboarding-modal explore-row row">
                            <div className="col-xs-12 text-center">
                                <p className="heading">Please choose an option to continue</p>
                                <SVGInline className="sales-icon" svg={SalesIcon} height="130px" width="130px" />
                                <ButtonComponent
                                    callback={() => {
                                        this.props.closeModal();
                                        Invoiz.router.navigate('/invoice/new');
                                    }}
                                    customCssClass="create-sales-button"
                                    label="Create your first invoice"
                                />
                                <p>Or</p>
                                <p className="explore-imprezz-text" onClick={() => this.onFinish()}>
                                    Explore Groflex on your own
                                </p>
                            </div>
                        </div>
                        : <div className="user-wizard-onboarding-modal row">
                        <div className="col-left col-xs-6 text-center">
                            <p className="heading">Welcome to Groflex</p>
                            <p className="subheading">Please provide your organisation<br></br>details to serve you better</p>
                            <SVGInline svg={WelcomeSvg} height="231px" width="auto" />
                        </div>
                        <div className="col-right col-xs-6" style={{padding: '40px 50px'}}>
                            {  account && 
                                (
                                    !showMobileVerificationScreen
                                        ? <div className="company-details">
                                            <TextInputComponent
                                                name="businessName"
                                                value={businessName}
                                                onChange={e => this.setState({businessName: e.target.value})}
                                                label="Business Name"
                                                autoComplete={false}
                                                spellCheck={false}
                                                errorMessage={businessNameError ? 'Business Name cannot be blank' : null}
                                            />
                                            <TextInputComponent
                                                name="mobileNo"
                                                value={mobile}
                                                maxLength="10"
                                                onChange={e => this.setState({mobile: e.target.value})}
                                                label="Mobile No"
                                                autoComplete={false}
                                                spellCheck={false}
                                                errorMessage={mobileError ? 'Mobile No is invalid' : null}
                                                disabled={true}
                                            />
    
                                            <div className="row location-inputs">
                                                <div className="col-xs-6">
                                                    <SelectInputComponent
                                                        title={resources.str_country}
                                                        name={'countryIso'}
                                                        value={country}
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
                                                        disabled={true}
                                                    />
                                                </div>
                                                <div className="col-xs-6">
                                                    { country === 'IN' ? (
                                                        <SelectStateInputComponent
                                                            store={this.props.store}
                                                            title={resources.str_state}
                                                            stateId={state || ''}
                                                            onStateChanged={this.onStateChanged.bind(this)}
                                                            errorMessage={stateError ? " " : null}
                                                            disabled={!canChangeAccountData}
                                                        />
                                                    ) : null }
                                                </div>
                                            </div>
                                            
                                            <div className="address-input">
                                                {/* <label className="textarea_label">{resources.str_streetAndHouseNumber}</label> */}
                                                <TextareaAutosize
                                                    name="street"
                                                    className="textarea_input settings-account-address-street"
                                                    placeholder={resources.str_enterAddress}
                                                    minRows={3}
                                                    maxRows={15}
                                                    value={address || ''}
                                                    onChange={(event) => this.onAddressChange(event.target.value)}
                                                    disabled={!canChangeAccountData}
                                                />
                                            </div>
    
                                            <div className="row">
                                                <div className="col-xs-10 notifications-info">
                                                    <p>My business is registered with GSTIN</p>
                                                </div>
    
                                                <div className="col-xs-2" style={{display: 'flex', marginTop: '15px'}}>
                                                    <OvalToggleComponent
                                                        labelLeft
                                                        onChange={() => this.setState({gstRegistered: !gstRegistered})}
                                                        checked={gstRegistered}
                                                        newStyle={true}
                                                        customClass={'toggle-email'}
                                                    />
                                                </div>
                                                
                                                { gstRegistered &&
                                                    <div className="col-xs-12">
                                                        <TextInputComponent
                                                            name="gstin"
                                                            value={gstNumber}
                                                            onChange={(e) => this.setState({gstNumber: e.target.value})}
                                                            label="GSTIN Number"
                                                            maxLength={"15"}
                                                            autoComplete={false}
                                                            spellCheck={false}
                                                            errorMessage={gstNumberError ? 'GST number is invalid' : null}
                                                        />
                                                    </div>
                                                }
                                            </div>
                                            
                                            <div className="text-center continue-btn">
                                                <ButtonComponent
                                                    callback={() => this.continue()}
                                                    // customCssClass={`${this.state.emailValid ? '' : 'disabled'}`}
                                                    label={resources.str_continue}
                                                    dataQsId="registration-step-email-confirm"
                                                />
                                            </div>
                                        </div>
                                        : <div className="mobile-details">
                                            <p className="heading">Verify Mobile Number</p>
    
                                            <div className="input-wrapper">
                                                <TextInputComponent
                                                    name="mobileNo"
                                                    value={mobile}
                                                    maxLength="10"
                                                    onChange={e => this.setState({mobile: e.target.value})}
                                                    label="Mobile No"
                                                    autoComplete={false}
                                                    spellCheck={false}
                                                    disabled={disableMobileField}
                                                />
                                                {/* <p className="textfield-inline" onClick={() => 
                                                    this.setState({disableMobileField: false})
                                                }>Change</p> */}
                                            </div>
                                            
                                            <div className="input-wrapper">
                                                <TextInputComponent
                                                    name="otp"
                                                    value={mobileOTP}
                                                    onChange={(e) => this.setState({mobileOTP: e.target.value})}
                                                    label="Enter OTP"
                                                    autoComplete={false}
                                                    maxLength={6}
                                                    spellCheck={false}
                                                />
                                                <p className="textfield-inline" onClick={this.sendMobileOtp.bind(this)}>Resend OTP</p>
                                            </div>
                                            
                                            <div className="text-center" style={{marginTop: '20px'}}>
                                                <ButtonComponent
                                                    callback={() => this.verifyOtp()}
                                                    // customCssClass={`${this.state.emailValid ? '' : 'disabled'}`}
                                                    label={"Verify"}
                                                    dataQsId="registration-step-email-confirm"
                                                />
                                            </div>

                                            <p className="text-center">Want to edit details? <span className="text-primary"
                                                style={{fontWeight: 600, cursor: 'pointer'}}
                                                onClick={() => {
                                                    this.setState({
                                                        showMobileVerificationScreen: false
                                                    })
                                                }}
                                            >Go Back</span></p>
                                        </div>
                                )
                            }
                        </div>
                    </div>
                }
            </React.Fragment>
        )
    }
};

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};
const mapDispatchToProps = dispatch => {
	return {
		fetchStatsData: (monthOffset, isAdditionalDataRequest) => {
			dispatch(fetchStatsData(monthOffset, isAdditionalDataRequest));
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(UserWizardOnBoardingModalComponent);


// export default UserWizardOnBoardingModalComponent;
