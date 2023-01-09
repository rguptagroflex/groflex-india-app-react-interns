import _ from 'lodash';
import invoiz from 'services/invoiz.service';
import config from 'config';
import React from 'react';
import TooltipComponent from 'shared/tooltip/tooltip.component';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import OvalToggleComponent from 'shared/oval-toggle/oval-toggle.component';
import CollapsableComponent from 'shared/collapsable/collapsable.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import IBANTextInputComponent from 'shared/inputs/iban-text-input/iban-text-input.component';
import BankAccountSetupComponent from 'shared/modals/bank-account-setup-modal.component';
import LoaderComponent from 'shared/loader/loader.component';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatIban } from 'helpers/formatIban';

const KEYCODE_ENTER = 13;

const STEPS = {
	START: 'start',
	PAYPAL: 'paypal',
	BANKING: 'banking'
};

const fetchAccountData = () => {
	return new Promise((resolve, reject) => {
		invoiz
			.request(`${config.resourceHost}setting/account`, {
				auth: true,
				method: 'GET'
			})
			.then(response => {
				resolve(response);
			})
			.catch(err => {
				reject(err);
			});
	});
};

const fetchBankingSetupData = () => {
	return new Promise((resolve, reject) => {
		invoiz
			.request(`${config.resourceHost}banking/accounts`, {
				auth: true,
				method: 'GET'
			})
			.then(response => {
				resolve(response);
			})
			.catch(err => {
				reject(err);
			});
	});
};

class InvoizPaySetupModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			bankAccountData: {},
			initialBankAccountData: {},
			bankAccountDataErrorMessages: {
				holder: '',
				iban: '',
				bic: ''
			},
			bankAccounts: [],
			currentStep: STEPS.START,
			displayedAccountIban: '',
			finishSetupError: '',
			invoizPayData: props.invoizPayData,
			isBankAccountFormDataValid: false,
			isBankAccountIbanValid: false,
			isBankAccountFormVisible: false,
			isCustomBankAccountSelected: false,
			isLoadingAccountData: false,
			isLoadingBankSetupData: false,
			loadedBankAccountDataFromSelectedAccount: null,
			paypalUserName: '',
			paypalUserNameError: '',
			paypalUserNameInitial: '',
			paymentSetting: props.paymentSetting,
			initialSelectedBankAccountId: props.paymentSetting && props.paymentSetting.financeApiAccountId,
			selectedBankAccountId: props.paymentSetting && props.paymentSetting.financeApiAccountId
		};
	}

	componentDidMount() {
		const { resources } = this.props;
		const { invoizPayData, selectedBankAccountId, paymentSetting } = this.state;
		const loadedBankAccountDataFromSelectedAccount = {};

		this.setState({ isLoadingAccountData: true }, () => {
			fetchAccountData().then(
				accountResponse => {
					const {
						body: { data: accountData }
					} = accountResponse;

					let accountHolder =
						accountData.companyAddress && accountData.companyAddress.companyName
							? accountData.companyAddress.companyName
							: '';

					if ((!accountHolder || accountHolder.length === 0) && accountData.companyAddress) {
						accountHolder = `${accountData.companyAddress.firstName} ${
							accountData.companyAddress.lastName
						}`;

						accountHolder = accountHolder.trim();
					}

					const bankAccountData = {
						accountHolder: accountData.bankAccountHolder || accountHolder,
						accountIban: accountData.bankAccountIban || '',
						accountBic: accountData.bankAccountBic || ''
					};

					if (invoizPayData && Object.keys(invoizPayData).length > 0) {
						bankAccountData.accountHolder =
							invoizPayData.bankAccountHolder || bankAccountData.accountHolder;
						bankAccountData.accountIban = invoizPayData.bankAccountIban || bankAccountData.accountIban;
						bankAccountData.accountBic = invoizPayData.bankAccountBic || bankAccountData.accountBic;
					}

					const displayedAccountIban = bankAccountData.accountIban || '';

					if (selectedBankAccountId) {
						if (invoizPayData && Object.keys(invoizPayData).length > 0) {
							loadedBankAccountDataFromSelectedAccount.accountHolder = invoizPayData.bankAccountHolder;
							loadedBankAccountDataFromSelectedAccount.accountIban = invoizPayData.bankAccountIban;
							loadedBankAccountDataFromSelectedAccount.accountBic = invoizPayData.bankAccountBic;
						} else if (bankAccountData) {
							loadedBankAccountDataFromSelectedAccount.accountHolder = bankAccountData.accountHolder;
							loadedBankAccountDataFromSelectedAccount.accountIban = bankAccountData.accountIban;
							loadedBankAccountDataFromSelectedAccount.accountBic = bankAccountData.accountBic;
						}

						bankAccountData.accountHolder = '';
						bankAccountData.accountIban = '';
						bankAccountData.accountBic = '';
					}

					this.setState(
						{
							bankAccountData,
							displayedAccountIban,
							initialBankAccountData: bankAccountData,
							isLoadingAccountData: false,
							loadedBankAccountDataFromSelectedAccount,
							paymentSetting,
							paypalUserName:
								(invoizPayData && invoizPayData.paypalUserName) || accountData.paypalUserName,
							paypalUserNameInitial:
								(invoizPayData && invoizPayData.paypalUserName) || accountData.paypalUserName
						},
						() => {
							this.validateBankAccountData(true);
						}
					);
				},
				() => {
					this.setState({ isLoadingAccountData: false });
					ModalService.close();
					invoiz.page.showToast({ message: resources.defaultErrorMessage, type: 'error' });
				}
			);
		});
	}

	componentWillReceiveProps(props) {
		this.setState({
			invoizPayData: props.invoizPayData,
			paymentSetting: props.paymentSetting,
			initialSelectedBankAccountId: props.paymentSetting && props.paymentSetting.financeApiAccountId,
			selectedBankAccountId: props.paymentSetting && props.paymentSetting.financeApiAccountId
		});
	}

	onBankAccountDataChange(val, key) {
		const bankAccountData = JSON.parse(JSON.stringify(this.state.bankAccountData));

		if (key === 'holder') {
			bankAccountData.accountHolder = val;
		} else if (key === 'iban') {
			bankAccountData.accountIban = val.trim();
		} else if (key === 'bic') {
			bankAccountData.accountBic = val.trim();
		}

		this.setState({ bankAccountData, selectedBankAccountId: null, isCustomBankAccountSelected: true });
	}

	onBankAccountInputKeyDown(evt, ref) {
		if (evt.keyCode === KEYCODE_ENTER && this.refs[ref]) {
			if (ref !== 'bankAccountIbanInput' && this.refs[ref].refs && this.refs[ref].refs[ref]) {
				this.refs[ref].refs[ref].blur();
			} else if (
				ref === 'bankAccountIbanInput' &&
				this.refs[ref].refs &&
				this.refs[ref].refs.textInput &&
				this.refs[ref].refs.textInput.refs &&
				this.refs[ref].refs.textInput.refs[ref]
			) {
				this.refs[ref].refs.textInput.refs[ref].blur();
			}

			this.validateBankAccountData(
				true,
				null,
				ref === 'bankAccountIbanInput' ? this.refs[ref].refs.textInput.refs[ref] : null
			);
		}
	}

	onCancelClicked() {
		ModalService.close();
		this.props.onCancel && this.props.onCancel();
	}

	onCancelBankingClicked() {
		const { initialSelectedBankAccountId, initialBankAccountData } = this.state;

		this.setState({
			bankAccountData: initialBankAccountData,
			bankAccountDataErrorMessages: {
				holder: '',
				iban: '',
				bic: ''
			},
			currentStep: STEPS.START,
			finishSetupError: '',
			isBankAccountFormVisible: false,
			isCustomBankAccountSelected: false,
			selectedBankAccountId: initialSelectedBankAccountId
		});
	}

	onCancelPaypalClicked() {
		this.setState({
			currentStep: STEPS.START,
			finishSetupError: '',
			paypalUserName: this.state.paypalUserNameInitial || ''
		});
	}

	onFinishSetupClicked() {
		const {
			bankAccounts,
			bankAccountData,
			loadedBankAccountDataFromSelectedAccount,
			paypalUserName,
			selectedBankAccountId
		} = this.state;
		const paymentSetting = JSON.parse(JSON.stringify(this.state.paymentSetting));

		if (!paymentSetting.usePayPal && !paymentSetting.useTransfer) {
			ModalService.close();
			this.props.onFinish && this.props.onFinish(null, null);
			return;
		}

		const invoizPayData = {
			bankAccountBic: bankAccountData.accountBic && bankAccountData.accountBic.trim(),
			bankAccountHolder: bankAccountData.accountHolder && bankAccountData.accountHolder.trim(),
			bankAccountIban: bankAccountData.accountIban && bankAccountData.accountIban.trim(),
			paypalUserName: paypalUserName && paypalUserName.trim()
		};

		if (selectedBankAccountId) {
			if (bankAccounts && bankAccounts.length > 0) {
				bankAccounts.forEach(bankAccount => {
					if (bankAccount.id === selectedBankAccountId) {
						invoizPayData.bankAccountBic = bankAccount.accountBic || '';
						invoizPayData.bankAccountHolder = bankAccount.accountHolder;
						invoizPayData.bankAccountIban = bankAccount.accountIban;
					}
				});
			} else if (loadedBankAccountDataFromSelectedAccount) {
				invoizPayData.bankAccountBic = loadedBankAccountDataFromSelectedAccount.accountBic;
				invoizPayData.bankAccountHolder = loadedBankAccountDataFromSelectedAccount.accountHolder;
				invoizPayData.bankAccountIban = loadedBankAccountDataFromSelectedAccount.accountIban;
			}

			paymentSetting.financeApiAccountId = selectedBankAccountId;
		} else {
			paymentSetting.financeApiAccountId = null;
		}

		ModalService.close();
		this.props.onFinish && this.props.onFinish(invoizPayData, paymentSetting);
	}

	onPaypalUsernameChange(evt) {
		const { resources } = this.props;
		let {
			target: { value }
		} = evt;

		value = value.replace(/https?:\/\//gi, '').replace(/\//gi, '');

		this.setState({
			paypalUserName: value.trim(),
			paypalUserNameError: value.trim().length === 0 ? resources.paypalUsernameError : ''
		});
	}

	onSaveBankAccountDataClicked() {
		const {
			bankAccountData,
			bankAccounts,
			isBankAccountFormDataValid,
			isBankAccountIbanValid,
			selectedBankAccountId
		} = this.state;
		const paymentSetting = JSON.parse(JSON.stringify(this.state.paymentSetting));
		let displayedAccountIban = '';

		if (selectedBankAccountId) {
			if (bankAccounts && bankAccounts.length > 0) {
				bankAccounts.forEach(bankAccount => {
					if (bankAccount.id === selectedBankAccountId) {
						displayedAccountIban = bankAccount.accountIban || bankAccount.accountName;
					}
				});
			}

			paymentSetting.useTransfer = true;
			this.setState({ currentStep: STEPS.START, displayedAccountIban, finishSetupError: '', paymentSetting });
		} else if (!isBankAccountFormDataValid || !isBankAccountIbanValid) {
			this.validateBankAccountData();
		} else if (bankAccountData && bankAccountData.accountIban) {
			bankAccountData.accountIban = bankAccountData.accountIban.replace(/\s/gi, '');
			displayedAccountIban = bankAccountData.accountIban;
			paymentSetting.useTransfer = true;

			this.setState({
				bankAccountData,
				currentStep: STEPS.START,
				displayedAccountIban,
				finishSetupError: '',
				paymentSetting
			});
		}
	}

	onSavePaypalDataClicked() {
		const { resources } = this.props;
		const { paypalUserName } = this.state;
		const paymentSetting = JSON.parse(JSON.stringify(this.state.paymentSetting));

		if (!paypalUserName || paypalUserName.trim().length === 0) {
			this.setState({ paypalUserNameError: resources.paypalUsernameError });
			return;
		}

		paymentSetting.usePayPal = paypalUserName.trim().length > 0;
		this.setState({
			currentStep: STEPS.START,
			finishSetupError: '',
			paymentSetting,
			paypalUserNameInitial: paypalUserName
		});
	}

	onSetupBankAccountClicked() {
		const { resources } = this.props;
		const { bankAccountData, loadedBankAccountDataFromSelectedAccount } = this.state;
		let selectedBankAccountId = this.state.selectedBankAccountId;
		let isCustomBankAccountSelected = this.state.isCustomBankAccountSelected;
		let isBankAccountFormVisible = this.state.isBankAccountFormVisible;

		this.setState({ currentStep: STEPS.BANKING, isLoadingBankSetupData: true }, () => {
			fetchBankingSetupData().then(
				accountsResponse => {
					const {
						body: {
							data: { accounts: bankAccounts }
						}
					} = accountsResponse;

					if (
						selectedBankAccountId &&
						loadedBankAccountDataFromSelectedAccount &&
						loadedBankAccountDataFromSelectedAccount.accountIban &&
						bankAccounts.length &&
						bankAccounts.length > 0
					) {
						bankAccounts.forEach(bankAccount => {
							if (
								bankAccount.accountIban.toLowerCase() ===
								loadedBankAccountDataFromSelectedAccount.accountIban.toLowerCase()
							) {
								selectedBankAccountId = bankAccount.id;
							}
						});
					}

					if (!selectedBankAccountId && bankAccountData.accountIban) {
						isCustomBankAccountSelected = isBankAccountFormVisible = true;
					}

					this.setState(
						{
							bankAccounts,
							isCustomBankAccountSelected,
							isBankAccountFormVisible,
							isLoadingBankSetupData: false,
							selectedBankAccountId
						},
						() => {
							this.validateBankAccountData(true);

							if (!selectedBankAccountId && bankAccountData.accountIban) {
								this.refs &&
									this.refs.bankAccountIbanInput &&
									this.refs.bankAccountIbanInput.handleBlur({
										value: bankAccountData.accountIban.trim()
									});
							}
						}
					);
				},
				() => {
					this.setState({ currentStep: STEPS.START, finishSetupError: '', isLoadingBankSetupData: false });
					invoiz.page.showToast({ message: resources.defaultErrorMessage, type: 'error' });
				}
			);
		});
	}

	onSetupPaypalClicked() {
		this.setState({ currentStep: STEPS.PAYPAL });
	}

	onToggleInvoizPaySettingClicked(isPaypalToggle) {
		const paymentSetting = JSON.parse(JSON.stringify(this.state.paymentSetting));
		const newState = {};

		if (isPaypalToggle) {
			paymentSetting.usePayPal = !paymentSetting.usePayPal;
		} else {
			paymentSetting.useTransfer = !paymentSetting.useTransfer;
		}

		newState.paymentSetting = paymentSetting;

		if (paymentSetting.usePayPal || paymentSetting.useTransfer) {
			newState.finishSetupError = '';
		}

		this.setState(newState);
	}

	openBankAccountSetupComponent() {
		const { resources } = this.props;
		ModalService.close();

		setTimeout(() => {
			ModalService.open(
				<BankAccountSetupComponent
					onFinish={() => {
						invoiz.page.showToast(resources.bankAccoutSetupSuccessMessage);
						this.props.onBankAccountSetupModalFinished && this.props.onBankAccountSetupModalFinished();
					}}
					resources={resources}
				/>,
				{
					width: 790,
					padding: 0,
					afterClose: isFromCancel => {
						if (isFromCancel) {
							this.props.onBankAccountSetupModalFinished && this.props.onBankAccountSetupModalFinished();
						}
					}
				}
			);
		}, 500);
	}

	toggleBankAccountForm(hasBankAccounts) {
		const { isBankAccountFormVisible } = this.state;

		if (hasBankAccounts) {
			this.setState({ isBankAccountFormVisible: !isBankAccountFormVisible });
		}

		this.setState({ isCustomBankAccountSelected: true, selectedBankAccountId: null });
	}

	validateBankAccountData(ignoreErrorMessages, errorInputKey, reFocusElement) {
		const { resources } = this.props;
		const { bankAccountData } = this.state;
		const bankAccountDataErrorMessages = JSON.parse(JSON.stringify(this.state.bankAccountDataErrorMessages));
		let isBankAccountFormDataValid = true;

		if (bankAccountData) {
			if (_.isString(bankAccountData.accountHolder) && bankAccountData.accountHolder.trim().length === 0) {
				isBankAccountFormDataValid = false;

				if (!errorInputKey || errorInputKey === 'holder') {
					bankAccountDataErrorMessages.holder = resources.bankAccountHolderValidation;
				}
			} else {
				bankAccountDataErrorMessages.holder = '';
			}

			if (_.isString(bankAccountData.accountIban) && bankAccountData.accountIban.trim().length === 0) {
				isBankAccountFormDataValid = false;

				if (!errorInputKey) {
					bankAccountDataErrorMessages.iban = resources.ibanErrorMessage;
				}
			} else {
				bankAccountDataErrorMessages.iban = '';
			}

			if (_.isString(bankAccountData.accountBic) && bankAccountData.accountBic.trim().length === 0) {
				isBankAccountFormDataValid = false;

				if (!errorInputKey || errorInputKey === 'bic') {
					bankAccountDataErrorMessages.bic = resources.bankBicValidationError;
				}
			} else {
				bankAccountDataErrorMessages.bic = '';
			}
		}

		const newState = { isBankAccountFormDataValid };

		if (!ignoreErrorMessages) {
			newState.bankAccountDataErrorMessages = bankAccountDataErrorMessages;
		}

		this.setState(newState, () => {
			if (!ignoreErrorMessages && !errorInputKey) {
				this.refs &&
					this.refs.bankAccountIbanInput &&
					this.refs.bankAccountIbanInput.handleBlur({ value: bankAccountData.accountIban.trim() });
			}

			if (reFocusElement && reFocusElement.focus) {
				reFocusElement.focus();
			}
		});
	}

	render() {
		const {
			bankAccountData,
			bankAccountDataErrorMessages,
			bankAccounts,
			currentStep,
			displayedAccountIban,
			finishSetupError,
			isBankAccountFormDataValid,
			isBankAccountFormVisible,
			isBankAccountIbanValid,
			isCustomBankAccountSelected,
			isLoadingAccountData,
			isLoadingBankSetupData,
			paypalUserName,
			paypalUserNameError,
			paymentSetting,
			selectedBankAccountId
		} = this.state;
		const { resources } = this.props;

		const hasFullBankAccountData = selectedBankAccountId || (bankAccountData && bankAccountData.accountIban);
		let hasBankAccounts = false;
		let headline = null;
		let subHeadline = null;
		let content = null;
		let footer = null;

		if (bankAccounts && bankAccounts.length) {
			hasBankAccounts = bankAccounts.length > 0;
		}

		switch (currentStep) {
			case STEPS.START:
				headline = (
					<div className="invoice-pay-setup-modal-headline">
						<span>
							{resources.invoicePayModalHeadline} <span className="colored">{resources.str_invoizPAY}</span>
						</span>
						<span className="icon icon-info" id="invoice-pay-setup-modal-headline-info-anchor" />
						<TooltipComponent
							elementId="invoice-pay-setup-modal-headline-info-anchor"
							attachment="bottom left"
							targetAttachment="top left"
							offset={'0 7px'}
							isTopMostZindex={true}
						>
							{resources.invoicePayToggleInfo}
							<br />
							{resources.invoicePayBankInfo}
							<br />
							{resources.invoicePayOptionInfo}
						</TooltipComponent>
					</div>
				);

				subHeadline = (
					<div className="invoice-pay-setup-modal-subheadline">
						<div>{resources.accountSetUpPaymentOptionEnabled}</div>
						{finishSetupError ? <div className="setup-error">{finishSetupError}</div> : null}
					</div>
				);

				content = isLoadingAccountData ? (
					<div className="invoice-pay-setup-modal-loading">
						<LoaderComponent text={'Lade Daten...'} visible={true} />
					</div>
				) : (
					<div className="invoice-pay-setup-modal-content">
						<div className="step-start-blocks">
							<div className="step-start-block block-left">
								{paypalUserName ? (
									<div>
										<OvalToggleComponent
											checked={paymentSetting.usePayPal}
											onChange={() => this.onToggleInvoizPaySettingClicked(true)}
											newStyle={true}
										/>
									</div>
								) : null}
								<div className="step-start-icon">
									<img src="/assets/images/paypal2.png" width="38" height="38" />
								</div>

								<div className="step-start-texts">
									<div className="text-row1">{resources.str_payPal}</div>
									{paypalUserName ? (
										<div className="text-row2">{resources.str_payPalMe}/{paypalUserName}</div>
									) : null}
								</div>

								<div>
									<ButtonComponent
										dataQsId="invoicePaySetupModal-btn-setupPaypal"
										callback={() => this.onSetupPaypalClicked()}
										label={paypalUserName ? resources.str_toEdit : resources.str_setUp}
									/>
								</div>
							</div>

							<div className="step-start-block block-left">
								{hasFullBankAccountData ? (
									<div>
										<OvalToggleComponent
											checked={paymentSetting.useTransfer}
											onChange={() => this.onToggleInvoizPaySettingClicked()}
											newStyle={true}
										/>
									</div>
								) : null}
								<div className="step-start-icon">
									<img src="/assets/images/ueberweisung.png" width="46" height="46" />
								</div>

								<div className="step-start-texts">
									<div className="text-row1">{resources.str_transfer}</div>
									{hasFullBankAccountData ? (
										<div className="text-row2">{formatIban(displayedAccountIban)}</div>
									) : null}
								</div>

								<div className="step-start-button">
									<ButtonComponent
										dataQsId="invoicePaySetupModal-btn-setupBankAccount"
										callback={() => this.onSetupBankAccountClicked()}
										label={hasFullBankAccountData ? resources.str_toEdit : resources.str_setUp}
									/>
								</div>
							</div>
						</div>
					</div>
				);

				footer = (
					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							<ButtonComponent
								dataQsId="invoicePaySetupModal-btn-cancel"
								type="cancel"
								callback={() => this.onCancelClicked()}
								label={resources.str_abortStop}
							/>
						</div>

						<div className="modal-base-confirm">
							<ButtonComponent
								dataQsId="invoicePaySetupModal-btn-save"
								callback={() => this.onFinishSetupClicked()}
								label={resources.str_finished}
							/>
						</div>
					</div>
				);
				break;

			case STEPS.PAYPAL:
				headline = <div className="invoice-pay-setup-modal-headline">{resources.str_linkYourPayPal}</div>;

				subHeadline = (
					<div className="invoice-pay-setup-modal-subheadline">
						{resources.payPalPaymentActivateInfo}
					</div>
				);

				content = (
					<div className="invoice-pay-setup-modal-content">
						<div className="step-paypal">
							<div className="step-paypal-input-row">
								<div className={`paypal-input-left ${paypalUserNameError ? 'paypal-error' : ''}`}>
									<span className="paypal-pre-input">{resources.str_payPalMe}/</span>
									<input
										type="text"
										value={paypalUserName}
										onChange={evt => this.onPaypalUsernameChange(evt)}
									/>
								</div>
								<a
									className="paypal-link"
									href="https://www.paypal.me/my/landing?entry=marketing"
									target="_blank"
								>
									{resources.str_createPayPalLink}
								</a>
							</div>
							{paypalUserNameError ? (
								<div className="paypal-error input_error">{paypalUserNameError}</div>
							) : null}
							<CollapsableComponent autoHeadWidth={true}>
								<div data-collapsable-head>{resources.str_WhyPayPalMe}</div>
								<div data-collapsable-body>
									{resources.payPalPaymentRemindInfo}
									<br />
									<br />
									{resources.payPalUseInfoText}
								</div>
							</CollapsableComponent>
						</div>
					</div>
				);

				footer = (
					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							<ButtonComponent
								dataQsId="invoicePaySetupModal-btn-back"
								type="cancel"
								callback={() => this.onCancelPaypalClicked()}
								label={resources.str_abortStop}
							/>
						</div>

						<div className="modal-base-confirm">
							<ButtonComponent
								dataQsId="invoicePaySetupModal-paypalStep-btn-save"
								customCssClass={`${
									!paypalUserName || paypalUserName.trim().length === 0 ? 'disabled' : ''
								}`}
								callback={() => this.onSavePaypalDataClicked()}
								label={resources.str_toSave}
							/>
						</div>
					</div>
				);
				break;

			case STEPS.BANKING:
				headline = <div className="invoice-pay-setup-modal-headline">{resources.str_linkYourBankAccount}</div>;

				subHeadline = (
					<div className="invoice-pay-setup-modal-subheadline">
						{resources.bankAccountSelectionInfo}
					</div>
				);

				content = isLoadingBankSetupData ? (
					<div>
						<LoaderComponent text={'Lade Bankdaten...'} visible={true} />
					</div>
				) : (
					<div className="invoice-pay-setup-modal-content">
						<div className="step-banking">
							<div
								className={`step-banking-accounts ${
									isBankAccountFormVisible && hasBankAccounts ? 'reduced' : ''
								}`}
							>
								{hasBankAccounts
									? bankAccounts.map((account, accountIndex) => {
										return account.accountIban ? (
											<div
												key={accountIndex}
												onClick={() => {
													this.setState({
														selectedBankAccountId: account.id,
														isCustomBankAccountSelected: false,
														isBankAccountFormVisible: false
													});
												}}
												className={`step-banking-account-row ${
													account.id === selectedBankAccountId ? 'selected' : ''
												}`}
											>
												<div className="col-left">
													<div className="row1">
														<div
															className="account-icon"
															style={{
																backgroundImage:
																		account.bankLogoSmall &&
																		`url(${config.resourceHost +
																			'banking/images?p=' +
																			account.bankLogoSmall})`
															}}
														/>
														<div className="account-name">{account.accountName}</div>
													</div>
													<div className="row2">{account.accountIban}</div>
												</div>
												<div className="col-right">
													{formatCurrency(account.accountBalance)}
												</div>
											</div>
										) : null;
									  })
									: null}
							</div>
							<div
								className={`step-banking-account-row custom-bank-account ${
									isBankAccountFormVisible || !hasBankAccounts ? 'open' : ''
								} ${isCustomBankAccountSelected ? 'selected' : 'false'}`}
							>
								<div
									className={`row-header ${!hasBankAccounts ? 'visible' : ''}`}
									onClick={() => this.toggleBankAccountForm(hasBankAccounts)}
								>
									<span>{resources.str_otherBankDetails}</span>
									{hasBankAccounts ? (
										<span
											className={`icon ${
												isBankAccountFormVisible ? 'icon-sort_up' : 'icon-sort_down'
											}`}
										/>
									) : null}
								</div>
								<div>
									<TextInputExtendedComponent
										ref="bankAccountHolderInput"
										name="bankAccountHolderInput"
										onKeyDown={evt => this.onBankAccountInputKeyDown(evt, 'bankAccountHolderInput')}
										onKeyUp={() => this.validateBankAccountData(false, 'holder')}
										onBlur={() => this.validateBankAccountData(false, 'holder')}
										value={bankAccountData.accountHolder}
										label={resources.str_accountOwner}
										errorMessage={bankAccountDataErrorMessages.holder}
										onChange={val => this.onBankAccountDataChange(val, 'holder')}
									/>
								</div>
								<div className="custom-bank-account-iban-bic">
									<IBANTextInputComponent
										ref="bankAccountIbanInput"
										name="bankAccountIbanInput"
										onKeyDown={evt => this.onBankAccountInputKeyDown(evt, 'bankAccountIbanInput')}
										value={bankAccountData.accountIban}
										required={true}
										label={resources.str_iban}
										errorMessage={bankAccountDataErrorMessages.iban}
										onChange={val => this.onBankAccountDataChange(val, 'iban')}
										handleValidation={(ibanIsValid, bic, isFromKeyUp) => {
											const newState = { isBankAccountIbanValid: ibanIsValid, bankAccountData };
											let bicWasSet = false;

											if (bic) {
												newState.bankAccountData.accountBic = bic;
												bicWasSet = true;
											}

											this.setState(newState, () => {
												this.validateBankAccountData(true);

												if (bicWasSet && !isFromKeyUp) {
													this.refs.bankAccountBicInput.refs.bankAccountBicInput.focus();

													setTimeout(() => {
														this.refs.bankAccountBicInput.refs.bankAccountBicInput.blur();
													}, 100);
												}
											});
										}}
										resources={resources}
									/>
									<TextInputExtendedComponent
										ref="bankAccountBicInput"
										name="bankAccountBicInput"
										onKeyDown={evt => this.onBankAccountInputKeyDown(evt, 'bankAccountBicInput')}
										onKeyUp={() => this.validateBankAccountData(false, 'bic')}
										onBlur={() => this.validateBankAccountData(false, 'bic')}
										value={bankAccountData.accountBic}
										label={resources.str_bic}
										errorMessage={bankAccountDataErrorMessages.bic}
										onChange={val => this.onBankAccountDataChange(val, 'bic')}
									/>
								</div>
							</div>
							{!hasBankAccounts ? (
								<div className="step-banking-account-add-bankaccount">
									{resources.str_emptyAccountLink}{' '}
									<span onClick={() => this.openBankAccountSetupComponent()}>
										{resources.str_LinkAccountNow}
									</span>
								</div>
							) : null}
						</div>
					</div>
				);

				footer = isLoadingBankSetupData ? null : (
					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							<ButtonComponent
								dataQsId="invoicePaySetupModal-btn-back"
								type="cancel"
								callback={() => this.onCancelBankingClicked()}
								label={resources.str_abortStop}
							/>
						</div>

						<div className="modal-base-confirm">
							<ButtonComponent
								dataQsId="invoicePaySetupModal-bankingStep-btn-save"
								customCssClass={`${
									(isBankAccountFormDataValid && isBankAccountIbanValid) || selectedBankAccountId
										? ''
										: 'disabled'
								}`}
								callback={() => this.onSaveBankAccountDataClicked()}
								label={resources.str_toSave}
							/>
						</div>
					</div>
				);
				break;
		}

		return (
			<div
				className={`invoice-pay-setup-modal-component ${
					currentStep === STEPS.BANKING ? 'content-banking' : ''
				}`}
			>
				{headline}
				{subHeadline}
				{content}
				{footer}
			</div>
		);
	}
}

export default InvoizPaySetupModalComponent;
