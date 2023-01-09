import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import TextInputComponent from 'shared/inputs/text-input/text-input.component';
import ButtonComponent from 'shared/button/button.component';
import ChangeDetection from 'helpers/changeDetection';

import userPermissions from 'enums/user-permissions.enum';

const changeDetection = new ChangeDetection();

class SenderEmailComponent extends React.Component {
	constructor(props) {
		super();

		this.state = {
			senderEmail: props.account.senderEmail,
			senderEmailName: props.account.senderEmailName,
			senderEmailError: '',
			wasSenderEmailChanged: false,
			canUpdateEmail: null
		};
	}

	componentDidMount() {

		this.setState({
			canUpdateEmail: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_EMAIL_INTEGRATION)
		})
		setTimeout(() => {
			const dataOriginal = JSON.parse(
				JSON.stringify({
					senderEmail: this.state.senderEmail,
					senderEmailName: this.state.senderEmailName
				})
			);

			changeDetection.bindEventListeners();

			changeDetection.setModelGetter(() => {
				const currentData = JSON.parse(
					JSON.stringify({
						senderEmail: this.state.senderEmail,
						senderEmailName: this.state.senderEmailName
					})
				);

				return {
					original: dataOriginal,
					current: currentData
				};
			});
		}, 0);
	}

	componentWillUnmount() {
		changeDetection.unbindEventListeners();
	}

	getSenderEmailError(senderEmail) {
		const { resources } = this.props;
		let senderEmailError = '';

		if (senderEmail.length === 0 || !config.emailCheck.test(senderEmail)) {
			senderEmailError = resources.validEmailMessage;
		}

		return senderEmailError;
	}

	onSaveClicked() {
		const { senderEmail, senderEmailName } = this.state;
		const { resources } = this.props;
		const data = {
			senderEmailName,
			senderEmail
		};

		const senderEmailError = this.getSenderEmailError(senderEmail);

		if (senderEmailError.length === 0) {
			invoiz
				.request(config.settings.endpoints.account, {
					method: 'POST',
					auth: true,
					data
				})
				.then(() => {
					invoiz.page.showToast(resources.accountSendEmailSuccessMessage);

					const dataOriginal = JSON.parse(
						JSON.stringify({
							senderEmail: this.state.senderEmail,
							senderEmailName: this.state.senderEmailName
						})
					);

					changeDetection.setModelGetter(() => {
						const currentData = JSON.parse(
							JSON.stringify({
								senderEmail: this.state.senderEmail,
								senderEmailName: this.state.senderEmailName
							})
						);

						return {
							original: dataOriginal,
							current: currentData
						};
					});
				})
				.catch(() => {
					invoiz.page.showToast({
						message: resources.accountSendEmailErrorMessage,
						type: 'error'
					});
				});
		} else {
			this.setState({ senderEmailError });
		}
	}

	onSenderEmailKeyUp() {
		const { senderEmail, wasSenderEmailChanged } = this.state;

		if (wasSenderEmailChanged) {
			setTimeout(() => {
				this.setState({ senderEmailError: this.getSenderEmailError(senderEmail) });
			});
		}
	}

	render() {
		const { senderEmailError, canUpdateEmail } = this.state;
		const { resources } = this.props;
		return (
			<div className="settings-senderemail-component">
				<div className="row u_pt_20"> {/*u_pt_60 u_pb_40 */}
					<div className="col-xs-4 text-h4 u_pb_20">{resources.str_emailSender}</div>
					<div className="col-xs-12">
						{/* <div className="col-xs-12"> */}
							<div className="row">
								<div className="col-xs-12 sender-email-info">
									{resources.senderEmailInfo}
								</div>

								<div className="col-xs-6 sender-email-name-input">
									<TextInputComponent
										name={'senderEmailName'}
										value={this.state.senderEmailName}
										onChange={evt =>
											this.setState({
												senderEmailName: evt.target.value
											})
										}
										label={resources.str_senderName}
										autoComplete="off"
										spellCheck="false"
										disabled={!canUpdateEmail}
									/>
								</div>

								<div className="col-xs-6 sender-email-input">
									<TextInputComponent
										name={'senderEmail'}
										value={this.state.senderEmail}
										onChange={evt =>
											this.setState({
												senderEmail: evt.target.value,
												wasSenderEmailChanged: true
											})
										}
										onKeyUp={() => this.onSenderEmailKeyUp()}
										label={resources.str_replyAddress}
										autoComplete="off"
										spellCheck="false"
										errorMessage={senderEmailError}
										disabled={!canUpdateEmail}
									/>
								</div>
							</div>
						{/* </div> */}
						<div className="col-xs-6 col-xs-offset-6">
							<ButtonComponent
								buttonIcon={'icon-check'}
								type="primary"
								callback={() => this.onSaveClicked()}
								label={resources.str_toSave}
								dataQsId="settings-account-btn-saveSenderEmail"
								disabled={!canUpdateEmail}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default SenderEmailComponent;
