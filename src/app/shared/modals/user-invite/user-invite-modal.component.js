import React from "react";
import invoiz from "services/invoiz.service";
import config from "config";
import ModalService from "services/modal.service";
import ButtonComponent from "shared/button/button.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import { handleNotificationErrorMessage } from "helpers/errorMessageNotification";
//import { isChargebeeSubscriber } from 'helpers/subscriptionHelpers';
import RoleSelectComponent from "shared/multiuser/role-select.component";
import NumberInputComponent from "shared/inputs/number-input/number-input.component";

const modalContent = [
	{
		headline: "Invite an additional user",
		subheadline:
			"Invite a user to join your Groflex account as one of the roles below by sending them an invitation by e-mail.",
		buttonLabel: "Send invitation",
	},
	{
		headline: "Invite a Chartered Accountant",
		subheadline:
			"Creation and processing of invoices, expenses, tax consultants export and GST. Insight into finances and sales.",
		buttonLabel: "Send invitation",
	},
	{
		headline: "User successfully invited!",
		subheadline:
			"Invited {{invitedEmailAddress}} successfully. The user will receive further directions in their e-mail inbox.",
		buttonLabel: "Done",
	},
];

class UserInviteModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: false,
			currentStep: null,
			invitedEmailAddress: "",
			selectedRole: "",
			errors: {
				invitedEmailAddress: "",
				caRolePhone: "",
			},
			inviteCAOnly: props.inviteCAOnly,
			caRoleFirstName: "",
			caRoleLastName: "",
			caRoleAddress: "",
			caRolePhone: "",
			caRoleCompanyName: "",
		};

		this.setStep = this.setStep.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onRadioChange = this.onRadioChange.bind(this);
	}

	componentDidMount() {
		const { inviteCAOnly } = this.state;
		document.addEventListener("keydown", this.onKeyDown);
		if (inviteCAOnly) {
			this.setState({ currentStep: 1 });
			this.setState({ selectedRole: "charteredaccountant" });
		} else {
			this.setState({ currentStep: 0 });
		}
	}

	componentWillUnmount() {
		document.removeEventListener("keydown", this.onKeyDown);
	}

	onKeyDown(event) {
		if (this.state.currentStep === 0 && (event.key === "Enter" || event.which === 13)) {
			this.sendInvitation();
		}
	}

	setStep() {
		// this.setState({currentStep: currentStep + 1});
		this.setState({ currentStep: 2 });
	}

	handleInputChange(evt, name) {
		const { value } = evt.target;
		this.setState({
			...this.state,
			[name]: value,
			errors: {
				...this.state.errors,
				[name]: "",
			},
		});
	}

	onInputChange(value, name) {
		if (name === "caRolePhone") {
			if (!config.mobileNumberValidation.test(value)) {
				const { resources } = this.props;
				this.setState({
					errors: {
						caRolePhone: resources.validMobileNumberError,
					},
				});
			} else {
				this.setState({
					errors: {
						caRolePhone: "",
					},
				});
			}
		}

		this.setState({ caRolePhone: value });
	}

	sendCAInvitation() {
		const {
			invitedEmailAddress,
			selectedRole,
			caRoleAddress,
			caRoleCompanyName,
			caRoleFirstName,
			caRoleLastName,
			caRolePhone,
		} = this.state;
		const { owner } = this.props;
		const validEmail = config.emailCheck.test(invitedEmailAddress);
		// const ownerdomain = owner.users[0].email.substring(owner.users[0].email.lastIndexOf("@") + 1);
		// const cadomain = invitedEmailAddress.substring(invitedEmailAddress.lastIndexOf("@") + 1);
		// if (ownerdomain === cadomain) {
		// 	this.setState({
		// 		errors: {
		// 			caMailOwnerMatch: 'Chartered accountant\'s e-mail ID cannot belong to the same domain as the owner\'s e-mail ID.'
		// 		}
		// 	});
		// } else

		if (invitedEmailAddress === "" || !validEmail) {
			this.setState({
				errors: {
					invitedEmailAddress: !validEmail
						? "This is not a valid email address!"
						: "This is a mandatory field!",
				},
			});
		} else {
			this.setState(
				{
					isLoading: true,
				},
				() => {
					invoiz
						.request(`${config.resourceHost}user/tenant`, {
							auth: true,
							method: "POST",
							data: {
								email: invitedEmailAddress,
								role: selectedRole,
							},
						})
						.then(() => {
							invoiz.request(`${config.resourceHost}user/cadetails`, {
								auth: true,
								method: "POST",
								data: {
									email: invitedEmailAddress,
									role: selectedRole,
									caRoleAddress,
									caRoleCompanyName,
									caRoleFirstName,
									caRoleLastName,
									caRolePhone,
								},
							});
						})
						.then(() => {
							this.props.onConfirm && this.props.onConfirm(null, false, true);
							this.setState(
								{
									isLoading: false,
								},
								() => {
									this.setStep();
									this.props.refreshGrid();
								}
							);
						})
						.catch((error) => {
							console.error(error);
							const meta = error.body && error.body.meta;
							const message = error.body && error.body.message;
							const errorCode = error.body && error.body.errorCode;
							if (
								meta &&
								meta.user &&
								meta.user[0] &&
								meta.user[0].code &&
								meta.user[0].code === "EXISTS"
							) {
								invoiz.showNotification({
									type: "error",
									message: "A user already exists with this email address.",
								});
							} else if (errorCode && errorCode === "expired_card" && message) {
								invoiz.showNotification({
									type: "error",
									message,
								});
							} else {
								handleNotificationErrorMessage(meta);
							}
							this.setState({
								isLoading: false,
							});
						});
				}
			);
		}
	}

	sendInvitation() {
		const {
			invitedEmailAddress,
			selectedRole,
			inviteCAOnly,
			caRoleAddress,
			caRoleCompanyName,
			caRoleFirstName,
			caRoleLastName,
			caRolePhone,
		} = this.state;
		const { owner } = this.props;
		const validEmail = config.emailCheck.test(invitedEmailAddress);

		if (invitedEmailAddress === "" || !validEmail) {
			this.setState({
				errors: {
					invitedEmailAddress: !validEmail
						? "This is not a valid email address!"
						: "This is a mandatory field!",
				},
			});
		} else {
			this.setState(
				{
					isLoading: true,
				},
				() => {
					invoiz
						.request(`${config.resourceHost}user/tenant`, {
							auth: true,
							method: "POST",
							data: {
								email: invitedEmailAddress,
								role: selectedRole,
							},
						})
						.then(() => {
							this.props.onConfirm && this.props.onConfirm(null, true, false);
							this.setState(
								{
									isLoading: false,
								},
								() => {
									// console.log("thisSet Has Run succesfully");
									this.setStep();
									this.props.refreshGrid();
								}
							);
						})
						.catch((error) => {
							const meta = error.body && error.body.meta;
							const message = error.body && error.body.message;
							const errorCode = error.body && error.body.errorCode;

							if (
								meta &&
								meta.user &&
								meta.user[0] &&
								meta.user[0].code &&
								meta.user[0].code === "EXISTS"
							) {
								invoiz.showNotification({
									type: "error",
									message: "A user already exists with this email address.",
								});
							} else if (errorCode && errorCode === "expired_card" && message) {
								invoiz.showNotification({
									type: "error",
									message,
								});
							} else {
								handleNotificationErrorMessage(meta);
							}
							this.setState({
								isLoading: false,
							});
						});
				}
			);
		}
	}

	createInputFields() {
		const {
			errors,
			invitedEmailAddress,
			caRoleAddress,
			caRoleCompanyName,
			caRoleFirstName,
			caRoleLastName,
			caRolePhone,
			inviteCAOnly,
		} = this.state;
		if (inviteCAOnly) {
			return (
				<div className="user-invite-modal-inputs">
					<TextInputExtendedComponent
						required={true}
						name="invitedEmailAddress"
						label="E-Mail"
						onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
						value={invitedEmailAddress}
						errorMessage={errors.invitedEmailAddress || errors.caMailOwnerMatch}
						customWrapperClass={"setting-email-input"}
					/>
					<TextInputExtendedComponent
						required={true}
						name="caRoleFirstName"
						label="First name"
						onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
						value={caRoleFirstName}
						//errorMessage={errors.invitedEmailAddress}
						customWrapperClass={"setting-email-input"}
					/>
					<TextInputExtendedComponent
						required={true}
						name="caRoleLastName"
						label="Last name"
						onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
						value={caRoleLastName}
						//errorMessage={errors.invitedEmailAddress}
						customWrapperClass={"setting-email-input"}
					/>
					<NumberInputComponent
						label="Phone number"
						maxLength="10"
						value={parseInt(caRolePhone)}
						name="caRolePhone"
						isDecimal={false}
						//errorMessage={errorMessageMobile}
						onChange={(value, name) => this.onInputChange(value, name)}
						defaultNonZero={true}
						//disabled={!canChangeAccountData}
					/>
					<TextInputExtendedComponent
						required={true}
						name="caRoleCompanyName"
						label="Company name"
						onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
						value={caRoleCompanyName}
						//errorMessage={errors.invitedEmailAddress}
						customWrapperClass={"setting-email-input"}
					/>
					<TextInputExtendedComponent
						required={true}
						name="caRoleAddress"
						label="Office address"
						onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
						value={caRoleAddress}
						//errorMessage={errors.invitedEmailAddress}
						customWrapperClass={"setting-email-input"}
					/>
				</div>
			);
		} else {
			return (
				<div className="user-invite-modal-inputs">
					<TextInputExtendedComponent
						required={true}
						name="invitedEmailAddress"
						label="E-mail"
						onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
						value={invitedEmailAddress}
						errorMessage={errors.invitedEmailAddress}
						customWrapperClass={"setting-email-input"}
					/>
				</div>
			);
		}
	}

	onRadioChange(role) {
		this.setState({
			selectedRole: role,
		});
	}

	render() {
		const {
			currentStep,
			invitedEmailAddress,
			isLoading,
			selectedRole,
			caRoleAddress,
			caRoleCompanyName,
			caRoleFirstName,
			caRoleLastName,
			caRolePhone,
		} = this.state;
		const { userCount, maxUserCount, canInviteUser, resources, inviteCAOnly } = this.props;
		const inputs = this.createInputFields();
		const headline = currentStep !== null && modalContent && modalContent[currentStep].headline;
		const subheadline = currentStep !== null && modalContent && modalContent[currentStep].subheadline;
		console.log(this.state, this.props, "state and props in user invite modal");
		return (
			<div className="has-footer user-invite-modal">
				<div className="user-invite-modal-content">
					{canInviteUser && currentStep === 0 && (
						<div>
							<div className="user-invite-modal-headline text-semibold">{headline}</div>
							<div className="user-invite-modal-subheadline">{subheadline}</div>
							<p className="u_mb_5">
								Remaining seats :{" "}
								{`${userCount.toLocaleString("en-US", {
									minimumIntegerDigits: 2,
									useGrouping: false,
								})}/${maxUserCount}`}
							</p>

							{inputs}
							{/* {currentStep === 0 && maxUserCount && maxUserCount <= userCount && (
								<div className="user-invite-modal-content-depleted-text">
								By sending the invitation, you add a new user to your invoiz account
								for 9 € per month plus VAT {''}
									{isChargebeeSubscriber() ? 'with annual billing' : ''} added.
								</div>
							)} */}
							<RoleSelectComponent
								onRadioChange={this.onRadioChange}
								selectedRole={selectedRole}
								isInvite={true}
								inviteCAOnly={inviteCAOnly}
							/>
							<div className="modal-base-footer">
								<div className="modal-base-cancel">
									<ButtonComponent
										type="cancel"
										callback={() => ModalService.close()}
										label={resources.str_cancel}
										dataQsId="modal-user-invite-btn-close"
										loading={isLoading}
									/>
								</div>
								<div className="modal-base-confirm">
									<ButtonComponent
										type="primary"
										callback={() => currentStep === 0 && this.sendInvitation()}
										label={
											currentStep === 0 && maxUserCount && maxUserCount <= userCount
												? "Invite for a fee"
												: modalContent[currentStep].buttonLabel
										}
										dataQsId="modal-user-invite-btn-update-or-send"
										loading={isLoading}
										disabled={selectedRole === "" || !config.emailCheck.test(invitedEmailAddress)}
									/>
								</div>
							</div>
						</div>
					)}
					{canInviteUser && currentStep === 1 && (
						<div>
							<div className="user-invite-modal-headline text-semibold">{headline}</div>
							<div className="user-invite-modal-subheadline">{subheadline}</div>
							{inputs}
							{/* {currentStep === 0 && maxUserCount && maxUserCount <= userCount && (
								<div className="user-invite-modal-content-depleted-text">
								By sending the invitation, you add a new user to your invoiz account
								for 9 € per month plus VAT {''}
									{isChargebeeSubscriber() ? 'with annual billing' : ''} added.
								</div>
							)} */}
							{/* <RoleSelectComponent onRadioChange={this.onRadioChange} selectedRole={selectedRole} isInvite={true} inviteCAOnly={inviteCAOnly} /> */}
							<div className="modal-base-footer">
								<div className="modal-base-cancel">
									<ButtonComponent
										type="cancel"
										callback={() => ModalService.close()}
										label={resources.str_cancel}
										dataQsId="modal-user-invite-btn-close"
										loading={isLoading}
									/>
								</div>
								<div className="modal-base-confirm">
									<ButtonComponent
										type="primary"
										callback={() => currentStep === 1 && this.sendCAInvitation()}
										label={
											currentStep === 0 && maxUserCount && maxUserCount <= userCount
												? "Invite for a fee"
												: modalContent[currentStep].buttonLabel
										}
										dataQsId="modal-user-invite-btn-update-or-send"
										loading={isLoading}
										disabled={
											caRoleAddress === "" ||
											caRoleFirstName === "" ||
											caRoleLastName === "" ||
											caRoleCompanyName === "" ||
											caRoleCompanyName === "" ||
											caRolePhone === "" ||
											!config.emailCheck.test(invitedEmailAddress)
										}
									/>
								</div>
							</div>
						</div>
					)}
					{canInviteUser && currentStep === 2 && (
						<div className="user-invite-modal-successful-invitation">
							<div className="icon icon-check_circle"></div>
							<div className="user-invite-modal-headline text-semibold">{headline}</div>
							<div className="user-invite-modal-subheadline">
								You sent an invitation to {invitedEmailAddress}.
								<br />
								The user receives all further information in the email.
							</div>
							<ButtonComponent
								type="primary"
								label="OK"
								dataQsId="modal-user-invite-btn-ok"
								callback={() => ModalService.close()}
								loading={isLoading}
							/>
						</div>
					)}
				</div>
			</div>
		);
	}
}

export default UserInviteModalComponent;
