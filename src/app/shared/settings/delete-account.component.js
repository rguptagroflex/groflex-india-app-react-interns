import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import TextInputComponent from 'shared/inputs/text-input/text-input.component';
import ButtonComponent from 'shared/button/button.component';
import HtmlInputComponent from 'shared/inputs/html-input/html-input.component';
import ModalService from 'services/modal.service';
import ChargebeePlan from 'enums/chargebee-plan.enum';
import SubscriptionStatus from 'enums/subscription-status.enum';
import { formatDate } from 'helpers/formatDate';
import { errorCodes } from 'helpers/constants';
import { format } from 'util';
import ZohoPlan from 'enums/zoho-plan.enum';

const { INVALID, INCORRECT } = errorCodes;

class DeleteAccountComponent extends React.Component {
	constructor(props) {
		super(props);

		this._isMounted = false;

		this.state = {
			isGoogleAccount: !!(invoiz.user && invoiz.user.googleId && invoiz.user.googleId.length > 0),
			disableAccountDeleteButton: false,
			checkCaptcha: '',
			password: '',
			passwordError: '',
			checkCaptchaError: '',
			reason: '',
			wasCaptchaChanged: false,
			wasPasswordChanged: false
		};

		// invoiz.on('userModelSubscriptionDataSet', () => {
		// 	const isGoogleAccount = !!(invoiz.user && invoiz.user.googleId && invoiz.user.googleId.length > 0);
		// 	this.setState({ isGoogleAccount });
		// });
	}

	componentDidMount() {
		this._isMounted = true;

		
			invoiz.on('userModelSubscriptionDataSet', () => {
				if (this._isMounted) {	
				const isGoogleAccount = !!(invoiz.user && invoiz.user.googleId && invoiz.user.googleId.length > 0);
				this.setState({ isGoogleAccount });
				}
			});
		
	}

	getError(value) {
		let error = '';
		const { resources } = this.props;
		if (value.length === 0) {
			error = resources.mandatoryFieldValidation;
		}

		return error;
	}

	onCaptchaUp() {
		const { checkCaptcha, wasCaptchaChanged } = this.state;

		if (wasCaptchaChanged) {
			setTimeout(() => {
				this.setState({ checkCaptchaError: this.getError(checkCaptcha) });
			});
		}
	}

	onPasswordKeyUp() {
		const { password, wasPasswordChanged } = this.state;

		if (wasPasswordChanged) {
			setTimeout(() => {
				this.setState({ passwordError: this.getError(password) });
			});
		}
	}

	onDeleteAccountClicked() {
		const { resources } = this.props;
		const { checkCaptcha, password, reason, isGoogleAccount } = this.state;
		const checkCaptchaError = this.getError(checkCaptcha);
		const passwordError = this.getError(password);

		const data = {
			reason
		};

		const checkConfirmationArray = ['ich bin mir sicher', "i'm sure"];

		if (!isGoogleAccount) {
			data.password = password;
		}

		if (checkCaptchaError.length > 0 || (!isGoogleAccount && passwordError.length > 0)) {
			this.setState({ checkCaptchaError, passwordError });
			return;
		// } else if (checkCaptcha.toLowerCase() !== resources.str_iAmSure) {
		} else if (!(checkConfirmationArray.includes(checkCaptcha.toLowerCase()))) {
			this.setState({ checkCaptchaError: resources.confirmationIncorrectMessage });
			return;
		}

		this.setState({ disableAccountDeleteButton: true }, () => {
			invoiz.request(config.settings.endpoints.getSubscriptionDetails, { auth: true }).then(response => {
				const {
					body: {
						data: { nextBillingAt, planId, status }
					}
				} = response;
				const formattedDate = formatDate(nextBillingAt);

				if (
					planId === ChargebeePlan.TRIAL ||
					planId === ChargebeePlan.TRIAL_21 ||
					status === SubscriptionStatus.CANCELLED ||
					status === SubscriptionStatus.NON_RENEWING ||
					planId === ZohoPlan.TRIAL
				) {
					this.onDeleteAccountConfirm(data);
				} else {
					ModalService.open(
						<div dangerouslySetInnerHTML={{ __html: format(resources.accountDeleteWarningMessage, formattedDate) }}>
						</div>,
						{
							headline: resources.str_deleteText,
							cancelLabel: resources.str_abortStop,
							confirmLabel: resources.str_clear,
							confirmIcon: 'icon-trashcan',
							confirmButtonType: 'secondary',
							onConfirm: () => {
								ModalService.close();
								this.onDeleteAccountConfirm(data);
							},
							afterClose: () => {
								this.setState({ disableAccountDeleteButton: false });
							}
						}
					);
				}
			});
		});
	}

	onDeleteAccountConfirm(data) {
		const { resources } = this.props;
		invoiz
			.request(config.account.endpoints.prepareDelete, {
				method: 'PUT',
				auth: true,
				data
			})
			.then(() => {
				invoiz.page.showToast(resources.accountDeleteConfirmSuccessMessage);
			})
			.catch(error => {
				const {
					body: { meta }
				} = error;
				let message = resources.accountDeleteErrorMessage;

				if (meta.password && (meta.password[0].code === INVALID || meta.password[0].code === INCORRECT)) {
					message = resources.accountWrongPasswordMessage;
				}

				invoiz.page.showToast({ type: 'error', message });
				this.setState({ disableAccountDeleteButton: false });
			});
	}

	componentWillUnmount () {
		this._isMounted = false;
   }

	render() {
		const { checkCaptchaError, passwordError, disableAccountDeleteButton, isGoogleAccount } = this.state;
		const { resources } = this.props;
		return (
			<div className="settings-deleteaccount-component">
				<div className="row u_pt_20"> {/*u_pt_60 u_pb_40 */}
					<div className="col-xs-12 text-h4 u_pb_20">{resources.str_deleteText}</div>
					<div className="col-xs-12">
						{/* <div className="col-xs-12"> */}
							<div className="row">
								<div className="col-xs-12 deleteaccount-info">
									{resources.accountDeleteInfo}
								</div>

								{isGoogleAccount ? null : (
									<div className="form_input col-xs-6">
										<TextInputComponent
											name={'password'}
											value={this.state.senderEmailName}
											onChange={evt =>
												this.setState({
													password: evt.target.value,
													wasPasswordChanged: true
												})
											}
											onKeyUp={() => this.onPasswordKeyUp()}
											label={resources.enterPasswordText}
											autoComplete="off"
											spellCheck="false"
											isPassword={true}
											errorMessage={passwordError}
										/>
									</div>
								)}

								<div className="form_input col-xs-6">
									<TextInputComponent
										name={'checkCaptcha'}
										value={this.state.senderEmail}
										onChange={evt =>
											this.setState({
												checkCaptcha: evt.target.value,
												wasCaptchaChanged: true
											})
										}
										onKeyUp={() => this.onCaptchaUp()}
										label={resources.enterIAmSureText}
										// label={'Bitte gib „Ich bin mir sicher" ein'}
										autoComplete="off"
										spellCheck="false"
										errorMessage={checkCaptchaError}
									/>
								</div>

								<div className="col-xs-12">
									<div className="deleteaccount-reason">
										{resources.accountDeleteReason}
									</div>

									<HtmlInputComponent
										value={this.state.reason}
										onTextChange={val => this.setState({ reason: val })}
									/>
								</div>
							</div>
						{/* </div> */}
						<div className="col-xs-6 col-xs-offset-6">
							<ButtonComponent
								buttonIcon={'icon-trashcan'}
								type="primary"
								callback={() => this.onDeleteAccountClicked()}
								label={resources.str_deleteText}
								disabled={disableAccountDeleteButton}
								dataQsId="settings-deleteAccount-btn-delete"
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default DeleteAccountComponent;
