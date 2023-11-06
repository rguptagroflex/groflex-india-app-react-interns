import invoiz from "services/invoiz.service";
import React from "react";
import NumberInputComponent from "shared/inputs/number-input/number-input.component";
import CurrencyInputComponent from "shared/inputs/currency-input/currency-input.component";
import ButtonComponent from "shared/button/button.component";
import config from "config";
import moment from "moment";
import ModalService from "services/modal.service";
import { connectWithStore } from "helpers/connectWithStore";
import store from "redux/store";
import KycProgress from "enums/razorpay-kyc-progress.enum";
const { ACCOUNT, BANK_DETAILS, STAKEHOLDER, COMPLETED } = KycProgress;
import NavBarModal from "shared/modal-nav/modal-nav.component";
import EmailInputComponent from "shared/inputs/email-input/email-input.component";
import RazorpayContactComponent from "shared/razorpay/razorpay-contact.component";
import RazorpayStakeholderComponent from "shared/razorpay/razorpay-stakeholder.component";
import RazorpayBankDetailsComponent from "shared/razorpay/razorpay-bank-details.component";
import RazorpayOverviewComponent from "shared/razorpay/razorpay-overview.component";
import RazorpayDocumentUploadComponent from "shared/razorpay/razorpay-document-upload.component";
import _ from "lodash";
import { handleRazorpayErrors } from "helpers/errors";
import LoaderComponent from "shared/loader/loader.component";
class RazorpayKycModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			currentStep: 0,
			steps: [
				{ name: "start", label: "Account overview" },
				{ name: ACCOUNT, label: `Contact and business details` },
				{ name: STAKEHOLDER, label: `Stakeholder details` },
				{ name: BANK_DETAILS, label: `Bank details` },
				{ name: COMPLETED, label: `Upload documents` },
			],
			isDisabled: false,
			accountDetails: {},
			bankDetails: {},
			stakeholderDetails: {},
			documentDetails: {},
			accountErrors: {
				contactName: "",
				email: "",
				mobile: "",
				businessType: "",
				legalBusinessName: "",
				customerFacingName: "",
				street1: "",
				street2: "",
				state: "",
				city: "",
				postalCode: "",
				gstNumber: "",
				cinNumber: "",
				panNumber: "",
			},
			stakeholderErrors: {
				name: "",
				stakeholderEmail: "",
				panNumber: "",
				stakeholderMobile: "",
			},
			bankErrors: {
				ifscCode: "",
				bankAccountNumber: "",
				beneficiary: "",
			},
			documentErrors: {
				documentType: "",
			},
			kycProgress: 0,
			kycStatus: null,
			configId: null,
			completeKyc: null,
			completedKyc: false,
			accountId: null,
			stakeholderId: null,
			isSaving: false,
		};
	}

	componentDidMount() {
		amplitude.getInstance().logEvent("KYC_initiated");

		const { account } = this.props;
		Promise.all([
			invoiz.request(config.razorpay.endpoints.getAccount, { auth: true, method: "GET" }),
			invoiz.request(config.razorpay.endpoints.getStakeholder, { auth: true, method: "GET" }),
			invoiz.request(config.razorpay.endpoints.getBank, { auth: true, method: "GET" }),
			invoiz.request(config.razorpay.endpoints.getAccountDetails, { auth: true, method: "GET" }),
		])
			.then(([accountResponse, stakeholderResponse, bankResponse, documentResponse]) => {
				this.setState({
					accountDetails: {
						...accountResponse.body.data,
						mobile: parseInt(account.mobile),
						email: account.userEmail,
					},
					accountId: accountResponse.body.meta.accountId,
					bankDetails: bankResponse.body.data.bankDetails,
					stakeholderDetails: stakeholderResponse.body.data,
					stakeholderId: stakeholderResponse.body.meta.stakeholderId,
					kycProgress: accountResponse.body.meta.kycProgress,
					kycStatus: accountResponse.body.meta.kycStatus,
					configId: bankResponse.body.meta.configId,
					completeKyc: accountResponse.body.meta.kycProgress === COMPLETED ? true : false,
					documentDetails: documentResponse && documentResponse.body.data,
				});
			})
			.catch(() => {
				invoiz.showNotification({ type: "error", message: `Could not retrieve Razorpay account details!` });
			});
	}

	setStep(step) {
		const { currentStep, steps, kycProgress } = this.state;
		let stepNum;
		if (step) {
			switch (step) {
				case "start":
					stepNum = 0;
					break;
				case ACCOUNT:
					stepNum = 1;
					break;
				case STAKEHOLDER:
					stepNum = 2;
					break;
				case BANK_DETAILS:
					stepNum = 3;
					break;
				case COMPLETED:
					kycProgress === BANK_DETAILS || kycProgress === COMPLETED ? (stepNum = 4) : (stepNum = 3);
					break;

				default:
					break;
			}
			this.setState({ currentStep: stepNum });
		} else {
			this.setState({ isSaving: true });
			switch (currentStep) {
				case 0:
					this.setState({ currentStep: 1, isSaving: false });
					break;
				case 1:
					this.saveAccount();
					break;
				case 2:
					this.saveStakeholder();
					break;
				case 3:
					this.saveBankDetails();
					break;
				case 4:
					this.save();
					break;

				default:
					break;
			}
		}
	}

	getDisabled() {
		const { currentStep, kycProgress, completedKyc } = this.state;
		if (currentStep === 0 && kycProgress !== COMPLETED) {
			return false;
		} else if (kycProgress === COMPLETED) {
			return true;
		} else if (currentStep === 4 && !completedKyc) {
			return true;
		}
	}

	onAccountChanged(value, name) {
		const { accountDetails, accountErrors } = this.state;
		if (name === `panNumber` || name === `cinNumber` || name === `gstNumber`) {
			accountDetails.legalInfo[name] = value;
			if (accountErrors[name]) {
				accountErrors[name] = "";
			}
		} else if (
			name === `street1` ||
			name === `street2` ||
			name === `city` ||
			name === `postalCode` ||
			name === `state`
		) {
			accountDetails.profile.addresses.registeredAddress[name] = value;
			if (accountErrors[name]) {
				accountErrors[name] = "";
			}
		} else {
			accountDetails[name] = value;
			if (accountErrors[name]) {
				accountErrors[name] = "";
			}
		}
		this.setState({ accountDetails, accountErrors });
	}

	saveAccount() {
		const { accountDetails, currentStep, accountId, kycProgress } = this.state;
		let { accountErrors } = this.state;
		const url = accountId ? config.razorpay.endpoints.updateAccount : config.razorpay.endpoints.createAccount;

		invoiz
			.request(url, { auth: true, method: accountId ? "PUT" : "POST", data: accountDetails })
			.then((response) => {
				invoiz.page.showToast({ message: `Saved account details!`, type: "success" });
				this.setState({
					currentStep: currentStep + 1,
					isSaving: false,
					kycProgress: !accountId ? response.body.meta.kycProgress : kycProgress,
					accountId: response.body.meta.accountId,
				});
			})
			.catch((err) => {
				if (err.body.name === `RazorpayError` && err.body.message.error.field === `email`) {
					accountErrors.email = `This e-mail already exists with Razorpay!`;
					this.setState({ accountErrors: accountErrors, isSaving: false });
				} else if (err.body.name === `RazorpayError` && err.body.message.error.field === `mobile`) {
					accountErrors.mobile = `This mobile already exists with Razorpay!`;
					this.setState({ accountErrors: accountErrors, isSaving: false });
				} else {
					const errors = handleRazorpayErrors(
						err.body.meta,
						this.state.accountErrors,
						this.state.stakeholderErrors,
						this.state.bankErrors
					);
					this.setState({ accountErrors: errors.accountErrors, isSaving: false });
				}
			});
	}

	onBankChanged(value, name) {
		const { bankDetails, bankErrors } = this.state;
		bankDetails[name] = value;
		if (bankErrors[name]) {
			bankErrors[name] = "";
		}
		this.setState({ bankDetails, bankErrors });
	}

	saveBankDetails() {
		const { bankDetails, currentStep, configId } = this.state;

		const url = configId
			? config.razorpay.endpoints.updateBankDetails
			: config.razorpay.endpoints.createBankDetails;
		invoiz
			.request(url, { auth: true, method: configId ? "PUT" : "POST", data: bankDetails })
			.then((response) => {
				invoiz.page.showToast({ message: `Saved bank details!`, type: "success" });
				this.setState({
					currentStep: currentStep + 1,
					documentDetails: response.body.data,
					isSaving: false,
					configId: response.body.meta.configId,
				});
			})
			.catch((err) => {
				const errors = handleRazorpayErrors(
					err.body.meta,
					this.state.accountErrors,
					this.state.stakeholderErrors,
					this.state.bankErrors
				);
				this.setState({ bankErrors: errors.bankErrors, isSaving: false });
			});
	}

	onStakeholderChanged(value, name) {
		const { stakeholderDetails, stakeholderErrors } = this.state;
		if (name === `panNumber`) {
			stakeholderDetails.kyc[name] = value;
			if (stakeholderErrors[name]) {
				stakeholderErrors[name] = "";
			}
		} else {
			stakeholderDetails[name] = value;
			if (stakeholderErrors[name]) {
				stakeholderErrors[name] = "";
			}
		}
		this.setState({ stakeholderDetails, stakeholderErrors });
	}

	saveStakeholder() {
		const { stakeholderDetails, currentStep, stakeholderId } = this.state;

		const url = stakeholderId
			? config.razorpay.endpoints.updateStakeholder
			: config.razorpay.endpoints.createStakeholder;
		invoiz
			.request(url, {
				auth: true,
				method: stakeholderId ? "PUT" : "POST",
				data: stakeholderDetails,
			})
			.then((response) => {
				invoiz.page.showToast({ message: `Saved stakeholder details!`, type: "success" });
				this.setState({
					currentStep: currentStep + 1,
					isSaving: false,
					stakeholderId: response.body.meta.stakeholderId,
				});
			})
			.catch((err) => {
				const errors = handleRazorpayErrors(
					err.body.meta,
					this.state.accountErrors,
					this.state.stakeholderErrors,
					this.state.bankErrors
				);
				this.setState({ stakeholderErrors: errors.stakeholderErrors, isSaving: false });
			});
	}

	onComplete(value) {
		this.setState({ completedKyc: value, documentErrors: {} });
	}

	save() {
		const { completedKyc, documentErrors } = this.state;
		if (completedKyc) {
			invoiz
				.request(config.razorpay.endpoints.completeKycStatus, {
					auth: true,
					method: "POST",
					data: { completeKyc: completedKyc },
				})
				.then((response) => {
					amplitude.getInstance().logEvent("KYC_completed");

					invoiz.page.showToast({ message: `Completed KYC submission!`, type: "success" });
					this.setState({ currentStep: 0, documentErrors: {}, isSaving: false });
					ModalService.close();
					invoiz.router.reload();
				})
				.catch((err) => {
					const errors = handleRazorpayErrors(
						err.body.meta,
						this.state.accountErrors,
						this.state.stakeholderErrors,
						this.state.bankErrors,
						documentErrors
					);
					this.setState({ documentErrors: errors, isSaving: false });
				});
		} else {
			this.setState({ documentErrors: { completedKyc: `Please agree to the terms and conditions!` } });
		}
	}

	render() {
		const {
			currentStep,
			steps,
			accountDetails,
			bankDetails,
			stakeholderDetails,
			kycProgress,
			kycStatus,
			completedKyc,
			documentDetails,
			isSaving,
		} = this.state;
		const { resources, account } = this.props;
		const confirmButtonLabel = currentStep < 4 && currentStep >= 0 ? `Continue` : `Submit`;
		return (
			<div className="kyc-modal-component">
				<NavBarModal
					kycProgress={kycProgress}
					steps={steps}
					currentStep={currentStep}
					onStepClick={this.setStep.bind(this)}
				/>
				{isSaving ? (
					<LoaderComponent visible={true} text={`Saving details`} />
				) : (
					<div className="kyc-content-steps">
						<div style={{ paddingLeft: 50, paddingRight: 50 }}>
							{currentStep === 0 && (
								<RazorpayOverviewComponent
									account={account}
									kycProgress={kycProgress}
									kycStatus={kycStatus}
									resources={resources}
									setStep={this.setStep.bind(this)}
								/>
							)}
							{currentStep === 1 && (
								<RazorpayContactComponent
									store={store}
									onAccountChange={this.onAccountChanged.bind(this)}
									accountDetails={accountDetails}
									account={account}
									resources={resources}
									errors={this.state.accountErrors}
									kycProgress={kycProgress}
									isSaving={this.state.isSaving}
								/>
							)}
							{currentStep === 2 && (
								<RazorpayStakeholderComponent
									onStakeholderChange={this.onStakeholderChanged.bind(this)}
									stakeholderDetails={stakeholderDetails}
									resources={resources}
									errors={this.state.stakeholderErrors}
									kycProgress={kycProgress}
									isSaving={this.state.isSaving}
								/>
							)}
							{currentStep === 3 && (
								<RazorpayBankDetailsComponent
									onBankChange={this.onBankChanged.bind(this)}
									bankDetails={bankDetails}
									resources={resources}
									errors={this.state.bankErrors}
									kycProgress={kycProgress}
									isSaving={this.state.isSaving}
								/>
							)}
							{currentStep === 4 && (
								<RazorpayDocumentUploadComponent
									documentDetails={documentDetails}
									resources={resources}
									kycProgress={kycProgress}
									onComplete={this.onComplete.bind(this)}
									completeKyc={kycProgress === COMPLETED ? this.state.completeKyc : completedKyc}
									errors={this.state.documentErrors}
									isSaving={this.state.isSaving}
								/>
							)}
						</div>
					</div>
				)}
				<div className="modal-base-footer">
					<div className="modal-base-confirm">
						<ButtonComponent
							// buttonIcon={'icon-check'}
							type={"primary"}
							callback={() => this.setStep()}
							label={confirmButtonLabel}
							dataQsId="modal-btn-confirm"
							disabled={this.getDisabled()}
						/>
					</div>
					<div className="modal-base-cancel">
						<ButtonComponent
							type="cancel"
							callback={() => {
								ModalService.close(true);
								invoiz.router.reload();
							}}
							label={resources.str_abortStop}
							dataQsId="modal-btn-cancel"
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

export default connectWithStore(store, RazorpayKycModal, mapStateToProps);
