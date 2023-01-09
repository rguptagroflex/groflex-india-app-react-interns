import React from "react";
import SVGInline from "react-svg-inline";
import _, { first } from "lodash";
import invoiz from "services/invoiz.service";
import config from "config";
import lang from "lang";
import { shuffleArray } from "helpers/shuffleArray";
import ButtonComponent from "shared/button/button.component";
import LoaderComponent from "shared/loader/loader.component";
import ModalService from "services/modal.service";
import UserWizardAccountDataCompoment from "./user-wizard-account-data.component";
import FunnelCompoment from "shared/funnel/funnel.component";
import UserWizardBusinessFieldCompoment from "./user-wizard-business-field.component";
import icon from "assets/images/svg/hand_shake.svg";
import OnboardTileWrapper from "shared/onboarding/onboardtile-wrapper.component";
import { connect, Provider } from "react-redux";
import store from "redux/store";
import RegistrationViewState from "enums/account/registration-view-state.enum";

const funnelSteps = [
	{ name: "welcomeScreen", label: `Welcome screen` },
	{ name: "accountData", label: `Account data` },
	{ name: "businessType", label: `Business type` },
	{ name: "businessTurnover", label: `Business turnover` },
	{ name: "businessField", label: `Business category` },
];

const businessFieldData = {
	businessFields: [
		{
            category: "Retail/Product",
            businessFields: [
				"Retailer",
                "E-Commerce",
                "Distributor",
                "Production / Manufacturing",
				"Wholesaler",
                "Supermarket",
            ],
        },
		{
            category: "Professional",
            businessFields: [
                "Architect",
				"Interior Designer",
                "Doctors",
                "Financial Consultants",
                "IT Consultants",
				"Lawyers",
				"Chartered Accountant",
            ],
        },
		{
            category: "Creative Industry",
            businessFields: [
                "Photography / Videography",
                "Media / Advertising",
                "Event Management",
                "Artists / Authors / Influencers",
            ],
        },
        {
            category: "Others",
            businessFields: [
                "Agriculture",
                "Freelancer",
                "Transportation"
            ],
        },
	],
};

//businessFieldData.businessFields = shuffleArray(businessFieldData.businessFields);
businessFieldData.businessFields.map((category) => {
	category.businessFields = shuffleArray(category.businessFields);
});
class UserWizardModalCompoment extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			account: props.account,
			currentStep: null,
			isLoading: false,
			isTileDisable: false,
			businesstype: null,
			businessturnover: null,
			businessField: props.account.businessField,
			otherBusinessField: "",
		};
		this.focusInputRef = React.createRef();
	}

	setStep() {
		const { currentStep } = this.state;
		this.setState(
			{
				currentStep: currentStep !== null ? currentStep + 1 : 0,
			},
			() => {
				if (this.focusInputRef.current) {
					window.setTimeout(() => {
						this.focusInputRef.current.focus();
					}, 300);
				}
			}
		);
	}

	componentDidMount() {
		this.setStep();
		this.getOtherBusinessField();
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.state.businessField !== prevState.businessField) {
			this.getOtherBusinessField();
		}
	}

	getOtherBusinessField() {
		if (this.state.businessField) {
			let hasOtherBusinessField = true;
			const businessField = this.state.businessField;

			businessFieldData.businessFields.map((category) => {
				if (category.businessFields.indexOf(businessField) !== -1) {
					return (hasOtherBusinessField = false);
				}
			});

			if (hasOtherBusinessField) {
				this.setState({
					otherBusinessField: businessField,
					businessField: "",
				});
			}
		}
	}

	disableCheck() {
		const {
			account,
			currentStep,
			businessturnover,
			businesstype,
			businessField,
			otherBusinessField,
		} = this.state;

		const { street, firstName, lastName, companyName } = account.companyAddress;

		let disabled = true;

		if (currentStep === 1) {
			disabled = !street || !firstName || !lastName || !companyName;
		} else if (currentStep === 2) {
			disabled = !businesstype;
		} else if (currentStep === 3) {
			disabled = !businessturnover;
		} else if (currentStep === 4) {
			if (businessField || otherBusinessField) {
					disabled = false;
			}
		} else {
			disabled = false;
		}

		return disabled;
	}

	onRadioChange(value, state) {
		if (state === "businessFieldExtension") {
			this.setState({ businessFieldExtension: value });
		} else if (state === "otherBusinessField") {
			this.setState({ businessField: "", otherBusinessField: value, businessFieldExtension: "" });
		} else {
			this.setState({ businessField: value, otherBusinessField: "", businessFieldExtension: "" });
		}
	}

	onConfirm() {
		const {
			account,
			currentStep,
			businessturnover,
			businesstype,
			businessField,
			otherBusinessField,
		} = this.state;
		const { resources } = this.props;
		const data = {
			companyAddress: {
				companyName: account.companyAddress.companyName,
				firstName: account.companyAddress.firstName,
				lastName: account.companyAddress.lastName,
				street: account.companyAddress.street,
				gstNumber: account.companyAddress.gstNumber,
				cinNumber: account.companyAddress.cinNumber,
				city: account.companyAddress.city,
				countryIso: account.companyAddress.countryIso,
				zipCode: account.companyAddress.zipCode,
			},
			businessType: businesstype,
			businessTurnover: businessturnover,
			businessField: otherBusinessField || businessField,
			indiaStateId: account.indiaStateId,
			mobile: account.mobile,
		};
		this.setState({ isLoading: true });
		invoiz
			.request(config.settings.endpoints.account, {
				method: "POST",
				auth: true,
				data,
			})
			.then(({ body: { data } }) => {
				invoiz.user.businessType = data.businessType;
				invoiz.user.businessTurnover = data.businessTurnover;
				invoiz.user.businessField = data.businessField;
				invoiz.user.companyAddress = data.companyAddress;
				
				this.setState({
					isLoading: false,
				});

				if (currentStep < funnelSteps.length - 1) {
					this.setStep();
				} else {
					invoiz.page.showToast({ message: resources.accountAdditionalInfoSuccessMessage });
					ModalService.close();
				}
			})
			.catch((err) => {
				this.setState({ isLoading: false });
				invoiz.page.showToast({
					message: resources.accountAdditionalInfoErrorMessage,
					type: "error",
				});
			});
	}

	onHandleTileChange(data) {
		this.setState({ [data.dropdownType]: data.id });
	}

	onInputChange(value, name) {
		const account = _.cloneDeep(this.state.account);

			if (account.companyAddress && account.companyAddress.hasOwnProperty(name)) {
				account.companyAddress[name] = value;
			}
			
		this.setState({ account });
	}

	render() {
		const { currentStep, isLoading, account } = this.state;
		const { resources } = this.props;
		const confirmButtonLabel = currentStep < 4 ? `Next` : `Done`;
		return (
			<div className="has-footer user-wizard-modal">
				{isLoading ? (
					<LoaderComponent text={`loading data`} visible={true} />
				) : (
					<React.Fragment>
						{this.props.userType === "new" && currentStep >= 1 && (
							<FunnelCompoment steps={funnelSteps} activeStep={currentStep} />
						)}
						<input ref={this.focusInputRef} className="user-wizard-focus-input" />
						{this.props.userType === "new" && currentStep === 0 && (
							<div className="user-wizard-existing-user-block">
								<div>
									<div>
										<SVGInline height="170px" svg={icon} />
									</div>
									<div className="headline">{resources.existingUserHeadline}</div>
									<div>{resources.existingUserText}</div>
								</div>
							</div>
						)}
						{currentStep === 1 && this.props.userType === "new" && (
							<UserWizardAccountDataCompoment
								accountData={account}
								resources={resources}
								onInputChange={this.onInputChange.bind(this)}
							/>
						)}
						{currentStep === 2 && (
							<div>
								<h5 className="headline text-h5 u_mb_12">{`Please select your business entity type`}</h5>
								<div className="landing-pick-businesstype">
									<OnboardTileWrapper
										onhandleTileChange={this.onHandleTileChange.bind(this)}
										regStep={RegistrationViewState.SET_BUSINESS_TYPE}
										tileClicked={this.state.businessType}
										store={store}
									/>
								</div>
							</div>
						)}
						{currentStep === 3 && (
							<div>
								<h5 className="headline text-h5 u_mb_12">{`Please select your approximate business turnover`}</h5>
								<div className="landing-pick-businessturnover">
									<OnboardTileWrapper
										onhandleTileChange={this.onHandleTileChange.bind(this)}
										regStep={RegistrationViewState.SET_BUSINESS_TURNOVER}
										tileClicked={this.state.businessTurnover}
										store={store}
									/>
								</div>
							</div>
						)}
						{currentStep === 4 && (
							<UserWizardBusinessFieldCompoment
								data={businessFieldData}
								currentBusinessField={this.state.businessField}
								otherBusinessField={this.state.otherBusinessField}
								currentBusinessFieldExtension={this.state.businessFieldExtension}
								onRadioChange={this.onRadioChange.bind(this)}
							/>
						)}
					</React.Fragment>
				)}
				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							type="cancel"
							tabIndex="15"
							callback={() => {
								if (this.state.currentStep > 0 && this.props.onConfirm) {
									this.props.onConfirm();
								}
								ModalService.close();
							}}
							label={`Cancel`}
							dataQsId="modal-btn-cancel"
						/>
					</div>
					<div className="modal-base-confirm">
						<ButtonComponent
							type={"primary"}
							tabIndex="10"
							disabled={this.disableCheck()}
							callback={() => {
								if (currentStep < 4 && this.props.userType === "new") {
									this.setStep();
								} else {
									this.onConfirm();
								}
							}}
							label={confirmButtonLabel}
							dataQsId="modal-btn-confirm"
						/>
					</div>
				</div>
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return {
		resources,
	};
};

export default connect(mapStateToProps)(UserWizardModalCompoment);
