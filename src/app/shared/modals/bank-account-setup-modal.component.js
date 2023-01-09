import React from 'react';
import TooltipComponent from 'shared/tooltip/tooltip.component';
import CollapsableComponent from 'shared/collapsable/collapsable.component';
import BankSearchInputComponent from 'shared/inputs/bank-search-input/bank-search-input.component';
import LoaderComponent from 'shared/loader/loader.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import CheckboxInputComponent from 'shared/inputs/checkbox-input/checkbox-input.component';
import store from 'redux/store';
import { connectWithStore } from 'helpers/connectWithStore';
import {
	postBankAccountSetup,
	putUpdateAccountState,
	updateCurrentStepFormData,
	resetBankAccountSetup
} from 'redux/ducks/settings/bankAccountSetup';
import ModalService from 'services/modal.service';

class BankAccountSetupComponent extends React.Component {
	constructor(props) {
		super(props);

		this.props.resetBankAccountSetup();
		this.props.postBankAccountSetup(null, true);
	}

	onCancelClick() {
		ModalService.close(true);
		this.props.onCancel && this.props.onCancel();
	}

	onFinishClick(addedAccounts) {
		ModalService.close();
		this.props.onFinish && this.props.onFinish(addedAccounts);
	}

	onNextClick() {
		const { currentStepFormData } = this.props;
		const payload = {};

		if (this.validateCurrentStepFormData()) {
			if (currentStepFormData.bankSearch.active === true && currentStepFormData.bankSearch.selectedBank) {
				payload.fieldValues = [
					{
						fieldName: 'BANK_CODE',
						value: currentStepFormData.bankSearch.selectedBank.bankCode.toString(),
						securityField: false
					}
				];
			} else if (currentStepFormData.fields.length > 0) {
				payload.fieldValues = currentStepFormData.fields.map(field => {
					return {
						fieldName: field.id,
						value: field.value.toString(),
						securityField: field.securityField
					};
				});
			} else if (currentStepFormData.buttons.length > 0) {
				const selectedButton = currentStepFormData.buttons.find(button => {
					return button.selected;
				});

				payload.buttonId = selectedButton.id;
			} else if (currentStepFormData.accounts.length > 0) {
				this.props.putUpdateAccountState({ accounts: currentStepFormData.accounts });
			}

			if (currentStepFormData.accounts.length === 0) {
				this.props.postBankAccountSetup(payload);
			}
		}
	}

	renderHeadlineTooltip() {
		const { bankAccountSetupData } = this.props;
		let tooltipContent = null;

		if (bankAccountSetupData.helpText || (bankAccountSetupData.faqs && bankAccountSetupData.faqs.length > 0)) {
			tooltipContent = (
				<div>
					<div
						id="bank-account-setup-modal-headline-tooltip"
						className="btn-faq btn-tooltip icon icon-info"
					/>
					<TooltipComponent
						elementId="bank-account-setup-modal-headline-tooltip"
						isTopMostZindex={true}
						useClickEvent={true}
						maxWidth="600px"
						attachment="top right"
						targetAttachment="bottom right"
						offset="6px -6px"
					>
						<div className="bank-account-setup-modal-headline-tooltip">
							{bankAccountSetupData.pageDescription ? (
								<div className="bank-account-setup-modal-tooltip-head1">
									{bankAccountSetupData.pageDescription}
								</div>
							) : null}
							{bankAccountSetupData.helpText ? (
								<div className="bank-account-setup-modal-tooltip-head2">
									{bankAccountSetupData.helpText}
								</div>
							) : null}
							{bankAccountSetupData.faqs &&
								bankAccountSetupData.faqs.map((faqObj, faqIndex) => {
									return (
										<CollapsableComponent key={faqIndex}>
											<div data-collapsable-head>{faqObj.question}</div>
											<div data-collapsable-body>{faqObj.answer}</div>
										</CollapsableComponent>
									);
								})}
						</div>
					</TooltipComponent>
				</div>
			);
		}

		return tooltipContent;
	}

	renderStepContent() {
		const { currentStepFormData, updateCurrentStepFormData, resources } = this.props;
		let stepContent = null;

		if (currentStepFormData.bankSearch.active) {
			stepContent = (
				<div>
					<div>
						<label className="select-input-label">{`${resources.str_bankName} | ${resources.str_place} | ${resources.str_blz} | ${resources.str_bic}`}</label>
					</div>
					<BankSearchInputComponent
						autoFocus={true}
						selectedBank={currentStepFormData.bankSearch.selectedBank}
						onBankChanged={selectedBank => {
							updateCurrentStepFormData({
								bankSearch: {
									selectedBank
								}
							});
						}}
						resources={resources}
					/>
					<div
						className="bank-account-setup-field-error"
						style={{ visibility: currentStepFormData.bankSearch.error ? 'visible' : 'hidden' }}
					>
						{currentStepFormData.bankSearch.error}
					</div>
				</div>
			);
		} else {
			stepContent = (
				<div>
					{currentStepFormData.fields.map(field => {
						return (
							<div key={field.id}>
								<div className={`input-row ${field.id === 'PIN' ? 'no-margin-bottom' : ''}`}>
									<TextInputExtendedComponent
										name={field.id}
										label={field.label}
										value={field.value}
										isPassword={field.securityField}
										autoComplete="off"
										spellCheck="false"
										readOnly={!field.valueEditable}
										errorMessage={field.error}
										onChange={val => {
											updateCurrentStepFormData({
												field: {
													id: field.id,
													value: val
												}
											});
										}}
									/>
									<div className="input-label-wrapper">
										{field.helpTextShort ? (
											<div className="input-label-tooltip">
												<div
													id={`bank-account-setup-input-tooltip-${field.id}`}
													className="btn-tooltip icon icon-info"
												/>
												<TooltipComponent
													elementId={`bank-account-setup-input-tooltip-${field.id}`}
													isTopMostZindex={true}
													useClickEvent={true}
													maxWidth="600px"
													attachment="top right"
													targetAttachment="bottom right"
													offset="7px -7px"
												>
													<div className="bank-account-setup-modal-headline-tooltip">
														<div className="bank-account-setup-modal-tooltip-head2">
															{field.helpTextShort}
														</div>
													</div>
												</TooltipComponent>
											</div>
										) : null}
									</div>
								</div>
								<div>
									{field.id === 'PIN' ? (
										<div>
											<div className="input-row">
												<div className="bank-account-setup-pin-field">
													<CheckboxInputComponent
														checked={currentStepFormData.savePin || false}
														name={`${field.id}-checkbox`}
														label={resources.str_savePIN}
														onChange={checked => {
															updateCurrentStepFormData({
																savePin: checked,
																savePinError: currentStepFormData.savePinError
															});
														}}
													/>
													{currentStepFormData.savePinError ? (
														<div className="bank-account-setup-field-error">
															{currentStepFormData.savePinError}
														</div>
													) : null}
												</div>
											</div>
											<div className="input-row input_hint">
												{resources.automaticPaymentReconciliationRequiresPINSavedText}
											</div>
										</div>
									) : (
										''
									)}
								</div>
							</div>
						);
					})}
					{this.props.errorMessage ? (
						<div className="bank-account-setup-field-error">{this.props.errorMessage}</div>
					) : null}
					{currentStepFormData.buttons.map((button, buttonIndex) => {
						return (
							<div className="button-row" key={button.id}>
								<div className="button-row-col-left">
									<input
										id={`bank-account-setup-button-${buttonIndex}`}
										type="radio"
										value={button.id}
										className="radio-custom"
										checked={button.selected}
										onChange={evt => {
											updateCurrentStepFormData({
												button: {
													id: button.id,
													selected: true
												}
											});
										}}
									/>
									<span className="radio-custom-circle" />
								</div>
								<div className="button-row-col-right">
									<label htmlFor={`bank-account-setup-button-${buttonIndex}`}>{button.label}</label>
								</div>
							</div>
						);
					})}
					{
						<div
							className="bank-account-setup-field-error"
							style={{ visibility: currentStepFormData.buttonError ? 'visible' : 'hidden' }}
						>
							{currentStepFormData.buttonError}
						</div>
					}
				</div>
			);
		}

		return stepContent;
	}

	updateCurrentStepFormError(id, error) {
		const { updateCurrentStepFormData } = this.props;

		updateCurrentStepFormData({
			field: {
				id,
				error
			}
		});
	}

	validateCurrentStepFormData() {
		const { currentStepFormData, updateCurrentStepFormData, resources } = this.props;
		let isAccountsValid = true;
		let isButtonsValid = true;
		let isFieldsValid = true;
		let pinField = null;

		if (currentStepFormData.bankSearch.active) {
			if (!currentStepFormData.bankSearch.selectedBank || currentStepFormData.bankSearch.selectedBank === '') {
				updateCurrentStepFormData({
					bankSearch: {
						error: resources.str_fillOutThisField
					}
				});

				isFieldsValid = false;
			}
		} else {
			pinField = currentStepFormData.fields.find(field => {
				return field.id === 'PIN';
			});

			if (pinField) {
				updateCurrentStepFormData({
					savePin: currentStepFormData.savePin,
					savePinError: currentStepFormData.savePin ? '' : resources.pinMustBeSavedToContinueText
				});

				if (!currentStepFormData.savePin) {
					isFieldsValid = false;
				}
			}

			if (currentStepFormData.fields && currentStepFormData.fields.length > 0) {
				currentStepFormData.fields.forEach(field => {
					if (!field.optional && !field.value) {
						this.updateCurrentStepFormError(field.id, resources.str_fillOutThisField);
						isFieldsValid = false;
					} else if (field.scheme) {
						const re = new RegExp(field.scheme);

						if (!re.test(field.value)) {
							this.updateCurrentStepFormError(
								field.id,
								resources.str_invalidInputUseValidValueText
							);
							isFieldsValid = false;
						} else {
							this.updateCurrentStepFormError(field.id, '');
						}
					} else {
						this.updateCurrentStepFormError(field.id, '');
					}
				});
			}

			if (currentStepFormData.buttons && currentStepFormData.buttons.length > 0) {
				isButtonsValid = currentStepFormData.buttons.find(button => {
					return button.selected === true;
				});

				if (!isButtonsValid) {
					updateCurrentStepFormData({
						buttonError: resources.str_selectOneOfTheOptionsText
					});
				}
			}

			if (currentStepFormData.accounts && currentStepFormData.accounts.length > 0) {
				isAccountsValid = currentStepFormData.accounts.find(account => {
					return account.selected === true;
				});

				if (!isAccountsValid) {
					updateCurrentStepFormData({
						accountError: resources.str_oneAccountMustBeSelectedText
					});
				}
			}
		}

		return isAccountsValid && isButtonsValid && isFieldsValid;
	}

	render() {
		const {
			isUpdatingAccounts,
			isUpdateAccountFinished,
			isLoading,
			bankAccountSetupData,
			currentStepFormData,
			updateCurrentStepFormData,
			addedAccounts,
			resources
		} = this.props;

		const pageDescription = bankAccountSetupData.pageDescription || resources.str_linkBankAccount;
		let content = null;

		if (currentStepFormData.accounts && currentStepFormData.accounts.length) {
			content = (
				<div className="content-box">
					<div className="modal-headline">
						<h4 className="headline u_mt_0 u_pb_24 text-h4">{pageDescription}</h4>
						<h5 className="headline u_mt_0 u_pb_24 text-h5">
							{resources.str_selectAccountsToAdd}.
						</h5>
					</div>
					{currentStepFormData.accounts.map((account, accountIndex) => {
						return (
							<div className="account-list-row" key={`account-${accountIndex}`}>
								<div className="account-list-col-left">
									<CheckboxInputComponent
										checked={account.selected}
										disabled={
											isUpdatingAccounts || isUpdateAccountFinished || account.accountActive
										}
										name={`account-${accountIndex}-checkbox`}
										label={account.accountName}
										onChange={checked => {
											if (!account.accountActive) {
												updateCurrentStepFormData({
													account: {
														id: account.id,
														selected: checked
													},
													accountError: false
												});
											}
										}}
									/>
								</div>
								{account.accountIban ? (
									<div className="account-list-col-middle">{resources.str_iban}: {account.accountIban}</div>
								) : null}
								{account.selected && (isUpdatingAccounts || isUpdateAccountFinished) ? (
									account.wasActivated === true || account.wasActivated === false ? (
										<div className="account-list-col-right">
											<div className={`icon icon-${account.wasActivated ? 'check' : 'close'}`} />
										</div>
									) : (
										<div className="account-list-col-right">
											<LoaderComponent visible={true} />
										</div>
									)
								) : null}
							</div>
						);
					})}
					<div
						className="bank-account-setup-field-error"
						style={{ visibility: currentStepFormData.accountError ? 'visible' : 'hidden' }}
					>
						{currentStepFormData.accountError}
					</div>
				</div>
			);
		} else {
			content = (
				<div className="content-box">
					<div className="modal-headline">
						<h4 className="headline u_mt_0 u_pb_24 text-h4">{pageDescription}</h4>
						{this.renderHeadlineTooltip()}
					</div>
					{this.renderStepContent()}
				</div>
			);
		}

		return (
			<div className="bank-account-setup-modal-component">
				{isLoading ? (
					<div className="content-box">
						<LoaderComponent text={resources.str_dataIsProcessed} visible={isLoading} />
					</div>
				) : (
					<div>
						{content}
						{isUpdateAccountFinished ? (
							<div className="modal-footer">
								<div className="button-cancel" style={{ visibility: 'hidden' }}>
									{resources.str_abortStop}
								</div>
								<div
									className="button button-primary button-rounded"
									data-qs-id="bankAccountSetup-btn-finish"
									onClick={() => this.onFinishClick(addedAccounts)}
								>
									{resources.str_toLock}
								</div>
							</div>
						) : (
							<div className="modal-footer">
								<div
									className="button-cancel"
									data-qs-id="bankAccountSetup-btn-cancel"
									onClick={() => this.onCancelClick()}
								>
									{resources.str_abortStop}
								</div>
								{isUpdatingAccounts ? (
									<div className="button button-primary button-rounded disabled">{resources.str_continue}</div>
								) : (
									<div
										className="button button-primary button-rounded"
										data-qs-id="bankAccountSetup-btn-next"
										onClick={() => this.onNextClick()}
									>
										{resources.str_continue}
									</div>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		);
	}
}

const mapStateToProps = state => {
	const {
		isUpdatingAccounts,
		isUpdateAccountFinished,
		isLoading,
		errorMessage,
		errorOccurred,
		bankAccountSetupData,
		currentStepFormData,
		addedAccounts
	} = state.settings.bankAccountSetup;
	const { resources } = state.language.lang;

	return {
		isUpdatingAccounts,
		isUpdateAccountFinished,
		isLoading,
		errorMessage,
		errorOccurred,
		bankAccountSetupData,
		currentStepFormData,
		addedAccounts,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		postBankAccountSetup: (payload, isInit) => {
			dispatch(postBankAccountSetup(payload, isInit));
		},
		putUpdateAccountState: payload => {
			dispatch(putUpdateAccountState(payload));
		},
		updateCurrentStepFormData: formData => {
			dispatch(updateCurrentStepFormData(formData));
		},
		resetBankAccountSetup: formData => {
			dispatch(resetBankAccountSetup(formData));
		}
	};
};

export default connectWithStore(store, BankAccountSetupComponent, mapStateToProps, mapDispatchToProps);
