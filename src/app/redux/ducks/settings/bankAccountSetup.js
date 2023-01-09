import invoiz from 'services/invoiz.service';
import q from 'q';
import config from 'config';

/*
 * Actions
 */
const START_BANKING_REQUEST = 'invoiz/settings/account/START_BANKING_REQUEST';
const FINISHED_POSTING_BANK_ACCOUNT_SETUP = 'invoiz/settings/account/FINISHED_POSTING_BANK_ACCOUNT_SETUP';
const FINISHED_PUT_UPDATE_ACCOUNT_STATE = 'invoiz/settings/account/FINISHED_PUT_UPDATE_ACCOUNT_STATE';
const ERROR_BANKING_REQUEST = 'invoiz/settings/account/ERROR_BANKING_REQUEST';
const FINISHED_UPDATING_CURRENT_STEP_FORM_DATA = 'invoiz/settings/account/FINISHED_UPDATING_CURRENT_STEP_FORM_DATA';
const RESET_STATE = 'invoiz/settings/account/RESET_STATE';

/*
 * Reducer
 */
const initialState = {
	isUpdatingAccounts: false,
	isUpdateAccountFinished: false,
	isLoading: true,
	errorMessage: null,
	errorOccurred: false,
	bankAccountSetupData: {},
	addedAccounts: null,
	currentStepFormData: {
		fields: [],
		buttons: [],
		buttonError: null,
		accounts: [],
		accountError: null,
		savePin: false,
		savePinError: null,
		bankSearch: {
			active: false,
			error: null,
			selectedBank: null
		}
	}
};

export default function reducer(state = initialState, action) {
	let currentStepFormData = JSON.parse(JSON.stringify(state.currentStepFormData));

	switch (action.type) {
		case START_BANKING_REQUEST:
			const { isUpdatingAccounts } = action;
			return Object.assign({}, state, {
				errorMessage: null,
				isLoading: !isUpdatingAccounts,
				isUpdatingAccounts
			});

		case ERROR_BANKING_REQUEST:
			const { message } = action;
			return Object.assign({}, state, {
				errorMessage: message,
				isLoading: false,
				isUpdatingAccounts: false,
				errorOccurred: true
			});

		case FINISHED_POSTING_BANK_ACCOUNT_SETUP:
			const { bankAccountSetupData } = action;
			let bankSearchField = null;
			currentStepFormData = JSON.parse(JSON.stringify(initialState.currentStepFormData));

			if (bankAccountSetupData.fields && bankAccountSetupData.fields.length > 0) {
				bankSearchField = bankAccountSetupData.fields.find(field => {
					return field.id === 'BANK_CODE';
				});

				if (bankSearchField) {
					currentStepFormData.bankSearch.active = true;
				}

				currentStepFormData.fields = bankAccountSetupData.fields.map(field => {
					return {
						id: field.id,
						label: field.label,
						optional: field.optional,
						valueEditable: field.valueEditable,
						securityField: field.securityField,
						scheme: field.scheme,
						helpTextShort: field.helpTextShort,
						value: field.value
					};
				});
			}

			if (bankAccountSetupData.buttons && bankAccountSetupData.buttons.length > 0) {
				currentStepFormData.buttons = bankAccountSetupData.buttons.map(button => {
					return {
						id: button.id,
						label: button.label,
						selected: false
					};
				});

				currentStepFormData.buttons[0].selected = true;
			}

			if (bankAccountSetupData.accounts && bankAccountSetupData.accounts.length > 0) {
				currentStepFormData.accounts = bankAccountSetupData.accounts.map(account => {
					return {
						id: account.id,
						accountName: account.accountName,
						accountIban: account.accountIban,
						accountActive: account.accountActive,
						selected: true
					};
				});
			}

			return Object.assign({}, state, {
				isLoading: false,
				isUpdatingAccounts: false,
				errorMessage: null,
				errorOccurred: false,
				bankAccountSetupData,
				currentStepFormData
			});

		case FINISHED_PUT_UPDATE_ACCOUNT_STATE:
			const { addedAccounts } = action;

			return Object.assign({}, state, {
				addedAccounts,
				isUpdateAccountFinished: true,
				isLoading: false,
				isUpdatingAccounts: false,
				errorMessage: null,
				errorOccurred: false
			});

		case FINISHED_UPDATING_CURRENT_STEP_FORM_DATA:
			const { updatedStepFormData } = action;

			if (updatedStepFormData.field) {
				const currentFields = currentStepFormData.fields;
				const fieldId = updatedStepFormData.field.id;
				const fieldIndex = currentFields.findIndex(field => field.id === fieldId);

				currentStepFormData.fields = [
					...currentFields.slice(0, fieldIndex),
					{ ...currentFields[fieldIndex], ...updatedStepFormData.field },
					...currentFields.slice(fieldIndex + 1)
				];
			}

			if (updatedStepFormData.button) {
				const currentButtons = currentStepFormData.buttons;
				const buttonId = updatedStepFormData.button.id;
				const buttonIndex = currentButtons.findIndex(button => button.id === buttonId);

				currentStepFormData.buttons.forEach(button => {
					button.selected = false;
				});

				currentStepFormData.buttons = [
					...currentButtons.slice(0, buttonIndex),
					{ ...currentButtons[buttonIndex], ...updatedStepFormData.button },
					...currentButtons.slice(buttonIndex + 1)
				];
			}

			if (updatedStepFormData.account) {
				const currentAccounts = currentStepFormData.accounts;
				const accountId = updatedStepFormData.account.id;
				const accountIndex = currentAccounts.findIndex(account => account.id === accountId);

				currentStepFormData.accounts = [
					...currentAccounts.slice(0, accountIndex),
					{ ...currentAccounts[accountIndex], ...updatedStepFormData.account },
					...currentAccounts.slice(accountIndex + 1)
				];
			}

			currentStepFormData.accountError = updatedStepFormData.accountError;
			currentStepFormData.buttonError = updatedStepFormData.buttonError;

			if (updatedStepFormData.bankSearch) {
				currentStepFormData.bankSearch.selectedBank = updatedStepFormData.bankSearch.selectedBank;
				currentStepFormData.bankSearch.error = updatedStepFormData.bankSearch.error;
			}

			if (updatedStepFormData.savePin === true || updatedStepFormData.savePin === false) {
				currentStepFormData.savePin = updatedStepFormData.savePin;
				currentStepFormData.savePinError = updatedStepFormData.savePinError;
			}

			return Object.assign({}, state, {
				currentStepFormData
			});

		case RESET_STATE:
			return initialState;

		default:
			return state;
	}
}

/*
 * Action Creators
 */
const startBackendRequest = isUpdatingAccounts => {
	return {
		type: START_BANKING_REQUEST,
		isUpdatingAccounts
	};
};

const finishedPostingBankAccountSetup = bankAccountSetupData => {
	return {
		type: FINISHED_POSTING_BANK_ACCOUNT_SETUP,
		bankAccountSetupData
	};
};

const finishedPutUpdateAccountState = addedAccounts => {
	return {
		type: FINISHED_PUT_UPDATE_ACCOUNT_STATE,
		addedAccounts
	};
};

const errorBackendRequest = message => {
	return {
		type: ERROR_BANKING_REQUEST,
		message
	};
};

const finishedUpdatingCurrentStepFormData = updatedStepFormData => {
	return {
		type: FINISHED_UPDATING_CURRENT_STEP_FORM_DATA,
		updatedStepFormData
	};
};

const resetState = () => {
	return {
		type: RESET_STATE
	};
};

export const postBankAccountSetup = (payload, isInit) => {
	return (dispatch, getState) => {
		const resources = getState().language.lang.resources;
		dispatch(startBackendRequest());

		invoiz
			.request(`${config.resourceHost}banking/contact/setup`, {
				auth: true,
				method: isInit ? 'GET' : 'POST',
				data: payload
			})
			.then(({ body: { data } }) => {
				if (data.step === 'finished') {
					invoiz
						.request(`${config.resourceHost}banking/contact/${data.contactId}/accounts`, {
							auth: true
						})
						.then(({ body: { data } }) => {
							dispatch(finishedPostingBankAccountSetup(data));
						})
						.catch(() => {
							dispatch(errorBackendRequest(resources.defaultErrorMessage));
						});
				} else {
					dispatch(finishedPostingBankAccountSetup(data));
				}
			})
			.catch(({ body: { message } }) => {
				dispatch(errorBackendRequest(message || resources.defaultErrorMessage));
			});
	};
};

export const putUpdateAccountState = payload => {
	return dispatch => {
		dispatch(startBackendRequest(true));

		const selectedAccounts = payload.accounts.filter(account => {
			const isAccountSelected = account.selected === true && account.accountActive === false;

			dispatch(
				finishedUpdatingCurrentStepFormData({
					account: {
						id: account.id,
						selected: isAccountSelected
					},
					accountError: false
				})
			);

			return isAccountSelected;
		});

		const requests = selectedAccounts.map(account => {
			return new Promise((resolve, reject) => {
				invoiz
					.request(`${config.resourceHost}banking/account/${account.id}/state`, {
						auth: true,
						method: 'PUT',
						data: { enabled: true }
					})
					.then(response => {
						dispatch(
							finishedUpdatingCurrentStepFormData({
								account: {
									id: account.id,
									wasActivated: true
								},
								accountError: false
							})
						);

						resolve({ response, account });
					})
					.catch(err => {
						dispatch(
							finishedUpdatingCurrentStepFormData({
								account: {
									id: account.id,
									wasActivated: false
								},
								accountError: false
							})
						);

						reject(err);
					});
			});
		});

		q.allSettled(requests).done(res => {
			let addedAccounts = res.filter(promise => {
				return promise.state === 'fulfilled';
			});

			addedAccounts = addedAccounts.map(promise => {
				return promise.value.account;
			});

			dispatch(finishedPutUpdateAccountState(addedAccounts));
		});
	};
};

export const updateCurrentStepFormData = formData => {
	return dispatch => {
		dispatch(finishedUpdatingCurrentStepFormData(formData));
	};
};

export const resetBankAccountSetup = () => {
	return dispatch => {
		dispatch(resetState());
	};
};
