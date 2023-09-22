import React from "react";
import invoiz from "services/invoiz.service";
import config from "config";
import TopbarComponent from "shared/topbar/topbar.component";
import ModalService from "services/modal.service";
import UserInviteModalComponent from "shared/modals/user-invite/user-invite-modal.component";
import MissingProfileDataModalComponent from "shared/modals/missing-profile-data-modal.component";
import PopoverComponent from "shared/popover/popover.component";
import LoaderComponent from "shared/loader/loader.component";
import { handleNotificationErrorMessage } from "helpers/errorMessageNotification";
import {
	isZohoSubscriber,
	canExtendUsers,
	isChargebeeSubscriber,
	isRazorpaySubscriber,
} from "helpers/subscriptionHelpers";
import UpgradeModalComponent from "shared/modals/upgrade-modal.component";
import { updateSubscriptionDetails } from "helpers/updateSubsciptionDetails";
import { updateUserPermissions } from "helpers/updateUserPermissions";
import userPermissions from "enums/user-permissions.enum";
import chargebeePlan from "enums/chargebee-plan.enum";
import { connect } from "react-redux";
import multiUserRoleType from "enums/multiuser-role-type.enum";
import ChangeUserRoleModal from "shared/modals/change-user-role-modal.component";
import AddonUserModalComponent from "shared/modals/addon-user.modal.component.js";
import ButtonComponent from "shared/button/button.component";

class SettingsUserComponent extends React.Component {
	constructor(props) {
		super(props);

		const {
			currentUserCount,
			maxUserCount,
			planId,
			currentPaidUsers,
			pendingSeatInvites,
			currentAddons,
			tenantId,
		} = invoiz.user.subscriptionData;

		this.state = {
			isLoading: false,
			otherRoles: [],
			owner: [],
			canDeleteUser: null,
			canChangeAccountOwner: null,
			canInviteUser: null,
			currentUserCount,
			currentPaidUsers,
			maxUserCount,
			canExtendUsers: canExtendUsers(),
			showOldPlans: isZohoSubscriber(),
			canComparePlan: isChargebeeSubscriber() || isRazorpaySubscriber(),
			selectedRole: "",
			planId,
			caRole: [],
			tenantId,
			currentAddons,
			pendingSeatInvites,
			inviteUserFields: [],
		};

		this.inviteUser = this.inviteUser.bind(this);
		this.fetchUserList = this.fetchUserList.bind(this);
		this.updateUserData = this.updateUserData.bind(this);
		this.updateUserRole = this.updateUserRole.bind(this);
	}

	componentDidMount() {
		this.fetchUserList()
			.then(() => {
				const { firstName, lastName } = this.state.owner[0].users && this.state.owner[0].users[0];
				if (!firstName || !lastName) {
					this.openMissingProfileDataModal();
				}
			})
			.catch((err) => {
				console.log(err);
			});
		this.setState({
			canDeleteUser: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_USER),
			canChangeAccountOwner: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_OWNER),
			canInviteUser: invoiz.user && invoiz.user.hasPermission(userPermissions.INVITE_USER),
		});
	}

	truncateUserName() {
		setTimeout(() => {
			document.querySelectorAll('[id^="user-name-"]').forEach((item) => {
				$(item).dotdotdot({ height: 45, truncate: "letter" });
			});
		}, 0);
	}

	updateUserData(seats, invited, caonly) {
		if (seats !== null && invited === false) {
			this.setState(
				{
					isLoading: true,
				},
				() => {
					updateSubscriptionDetails(() => {
						const { currentPaidUsers, maxUserCount, currentUserCount, currentAddons, pendingSeatInvites } =
							invoiz.user.subscriptionData;
						this.setState(
							{
								pendingSeatInvites,
								currentAddons,
								currentPaidUsers,
								currentUserCount,
								maxUserCount,
								isLoading: false,
								inviteUserFields: [],
							},
							() => {
								this.fetchUserList();
								//this.getPaidUsers();
							}
						);
					});
				}
			);
		} else if (seats === null && invited === true) {
			const { inviteUserFields } = this.state;
			this.setState(
				{
					isLoading: true,
				},
				() => {
					updateSubscriptionDetails(() => {
						const { currentPaidUsers, maxUserCount, currentUserCount, currentAddons, pendingSeatInvites } =
							invoiz.user.subscriptionData;
						this.setState(
							{
								pendingSeatInvites,
								inviteUserFields: [],
								currentAddons,
								currentPaidUsers,
								currentUserCount,
								maxUserCount,
								isLoading: false,
							},
							() => {
								this.fetchUserList();
							}
						);
					});
				}
			);
		} else if (seats === null && invited === false && caonly === true) {
			this.setState(
				{
					isLoading: true,
				},
				() => {
					updateSubscriptionDetails(() => {
						const { maxUserCount, currentUserCount } = invoiz.user.subscriptionData;
						this.setState(
							{
								currentUserCount,
								maxUserCount,
								isLoading: false,
							},
							() => {
								this.fetchUserList();
							}
						);
					});
				}
			);
		} else {
			this.setState(
				{
					isLoading: true,
				},
				() => {
					updateSubscriptionDetails(() => {
						const { currentPaidUsers, maxUserCount, currentUserCount, currentAddons, pendingSeatInvites } =
							invoiz.user.subscriptionData;
						this.setState(
							{
								pendingSeatInvites,
								currentAddons,
								currentPaidUsers,
								currentUserCount,
								maxUserCount,
								isLoading: false,
								inviteUserFields: [],
							},
							() => {
								this.fetchUserList();
							}
						);
					});
				}
			);
		}
	}

	updateUserRole(user, selectedRole) {
		const { resources } = this.props;
		if (selectedRole === multiUserRoleType.OWNER) {
			invoiz
				.request(`${config.resourceHost}user/${user.id}/owner`, {
					auth: true,
					method: "POST",
				})
				.then(() => {
					updateUserPermissions(() => {
						this.setState(
							{
								canDeleteUser: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_USER),
								canChangeAccountOwner:
									invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_OWNER),
								canInviteUser: invoiz.user && invoiz.user.hasPermission(userPermissions.INVITE_USER),
							},
							() => {
								invoiz.showNotification({
									message: `${user.firstName} ${user.lastName} is now the owner of this groflex account.`,
								});
								this.fetchUserList();
								ModalService.close();
							}
						);
					});
				})
				.catch(() => {
					invoiz.showNotification({ type: "error", message: resources.defaultErrorMessage });
					ModalService.close();
				});
		} else {
			invoiz
				.request(`${config.resourceHost}user/${user.id}/role`, {
					auth: true,
					method: "POST",
					data: {
						role: selectedRole,
					},
				})
				.then(() => {
					this.updateUserData();
					invoiz.showNotification({
						message: `${user.firstName} ${user.lastName}'s role has been updated to ${this.getRoleTitle(
							selectedRole
						)}`,
					});
				})
				.catch((err) => {
					console.log(err);
				});
		}
	}

	fetchUserList() {
		const { resources } = this.props;
		return new Promise((resolve, reject) => {
			invoiz
				.request(`${config.settings.endpoints.getUserList}`, { auth: true })
				.then((response) => {
					const {
						body: {
							data: { roles },
						},
					} = response;

					const owner = roles.filter((role) => role.role === "owner");
					const otherRoles = roles.filter((role) => role.role !== "owner");
					const caRole = otherRoles.filter((name) => name.role === "charteredaccountant");
					if (caRole[0].users.length > 0) {
						this.setState({ caRole });
					}
					this.setState(
						{
							owner,
							otherRoles,
							isLoading: false,
						},
						() => {
							this.truncateUserName();
							resolve();
						}
					);
				})
				.catch((error) => {
					this.setState(
						{
							isLoading: false,
						},
						() => {
							reject(error);
							this.setState(
								{
									isLoading: false,
								},
								() => resolve()
							);
							invoiz.showNotification({ type: "error", message: resources.defaultErrorMessage });
						}
					);
				});
		});
	}

	getOwnerBox() {
		const { owner } = this.state;

		if (owner && owner.length > 0) {
			return owner.map((role, index) => {
				const { firstName, lastName, email, isCurrent } = role.users && role.users[0];
				return (
					<div key={`owner-${firstName}-${lastName}-${index}`}>
						<div className="text-semibold u_mt_20 u_mb_20">Owner</div>
						<div
							className="settings-user-box user-existing account-owner"
							key={`owner-${firstName}-${lastName}-${index}`}
						>
							<div className="settings-user-box-content">
								{/* <div className="icon icon-multi_user_owner" /> */}
								<div className="icon icon-home" />
								<div id={`user-name-${index}-owner`} className="user-box-title">
									{firstName && lastName ? `${firstName} ${lastName}` : "Owner"}
									{isCurrent && <div className="user-box-current-user">(You)</div>}
								</div>
								<div className="user-box-subtitle u_mt_6">{email}</div>
							</div>
						</div>
					</div>
				);
			});
		}
	}

	getCABox() {
		const {
			canDeleteUser,
			canInviteUser,
			canChangeAccountOwner,
			otherRoles,
			maxUserCount,
			currentPaidUsers,
			planId,
			caRole,
		} = this.state;

		if (caRole.length > 0 && planId !== chargebeePlan.TRIAL && planId !== chargebeePlan.FREE_MONTH) {
			return (
				<div>
					{caRole.map((role, index) => {
						if (role && role.users && role.users.length > 0) {
							return (
								<div className="" key={`settings-role-container-${role.role}-${index}`}>
									{/* <div className='settings-role-other-box-title text-semibold'>
										{this.getRoleTitle(role.role)}
									</div> */}
									<div className="text-semibold u_mt_20 u_mb_20">Chartered Accountant</div>
									<div className="settings-role-other-users">
										{role.users.map((user) => {
											const {
												firstName,
												lastName,
												email,
												hasConfirmedEmail,
												isCurrent,
												isExpired,
												id,
											} = user;
											const title = hasConfirmedEmail
												? `${firstName} ${lastName}`
												: isExpired
												? "Invitation expired"
												: "Invitation sent";
											return (
												<div
													className={`settings-user-box user-existing ${
														hasConfirmedEmail ? "accepted" : "pending"
													}`}
													key={`user-key-${
														hasConfirmedEmail
															? `${firstName}.${lastName}`
															: `${title.replace(" ", ".")}`
													}-${index}`}
												>
													{(canDeleteUser ||
														(canInviteUser && !hasConfirmedEmail) ||
														(canChangeAccountOwner && hasConfirmedEmail) ||
														isCurrent) && (
														<div>
															<div
																className={`popover-icon icon icon-menu icon-rotate-90`}
																id={`settings-user-box-popover-${id}`}
															/>
															{this.createPopover(
																`settings-user-box-popover-${id}`,
																user,
																true,
																isCurrent
															)}
														</div>
													)}

													<div className="settings-user-box-content">
														<div className="icon-wrapper">
															<div
																className={`icon icon-${
																	hasConfirmedEmail
																		? `icon icon-${role.role}_user`
																		: "offen"
																}`}
															/>
															{!hasConfirmedEmail && isExpired && (
																<div className="invitation-expired">
																	<div className="icon icon-exclamation_mark"></div>
																</div>
															)}
														</div>
														<div
															className="user-box-title text-semibold"
															id={`user-name-${index}`}
														>
															{title}
															{isCurrent && (
																<div className="user-box-current-user">(You)</div>
															)}
														</div>
														<div className="user-box-subtitle u_mt_6">{email}</div>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							);
						}
					})}
				</div>
			);
		} else {
			return (
				canInviteUser &&
				planId !== chargebeePlan.FREE_MONTH &&
				planId !== chargebeePlan.TRIAL &&
				caRole.length === 0 && (
					<div>
						<div className="text-semibold u_mt_20 u_mb_20">Invite CA</div>
						<div className="settings-user-box  user-new" onClick={() => this.inviteUser(true)}>
							<div className="settings-user-box-content">
								<div className="icon icon-invite_person" />
								<div className="user-box-title">Invite chatered accountant</div>
							</div>
						</div>
					</div>
					// <div className="settings-user-box user-new" style={{marginTop: 60}} onClick={() => this.inviteUser(true)}>
					// 	<div className="settings-user-box-content">
					// 		{/* <img src="/assets/images/svg/plus.svg" width="30"></img> */}
					// 		<div className={`icon icon-invite_person`} />
					// 		<div className="user-box-title" >Invite a Chartered Accountant for free</div>
					// 	</div>
					// </div>
				)
			);
		}
	}
	getRoleTitle(value) {
		let title = "";
		switch (value) {
			case multiUserRoleType.ADMIN:
				title = "Admin";
				break;
			case multiUserRoleType.DATA_OPERATOR:
				title = "Accountant";
				break;
			case multiUserRoleType.RESTRICTED_DATA_OPERATOR:
				title = "Limited User";
				break;
			case multiUserRoleType.TAX_CONSULTANT:
				title = "Chartered Accountant";
				break;
			default:
				break;
		}
		return title;
	}

	getUserList() {
		const { canDeleteUser, canInviteUser, canChangeAccountOwner, otherRoles, id } = this.state;
		const modifiedroles = otherRoles.filter((name) => name.role !== "charteredaccountant");
		if (modifiedroles && modifiedroles.length > 0) {
			return (
				<div className="settings-role-other-wrapper">
					{modifiedroles.map((role, index) => {
						if (role && role.users && role.users.length > 0) {
							return (
								<div
									className="settings-role-other-container"
									key={`settings-role-container-${role.role}-${id}`}
								>
									<div className="settings-role-other-box-title text-semibold">
										{this.getRoleTitle(role.role)}
									</div>
									<div className="settings-role-other-users">
										{role.users.map((user) => {
											const {
												firstName,
												lastName,
												email,
												hasConfirmedEmail,
												isCurrent,
												isExpired,
												id,
											} = user;
											const title = hasConfirmedEmail
												? `${firstName} ${lastName}`
												: isExpired
												? "Invitation expired"
												: "Invitation sent";
											return (
												<div
													className={`settings-user-box user-existing ${
														hasConfirmedEmail ? "accepted" : "pending"
													}`}
													key={`user-key-${
														hasConfirmedEmail
															? `${firstName}.${lastName}`
															: `${title.replace(" ", ".")}`
													}-${id}`}
												>
													{(canDeleteUser ||
														(canInviteUser && !hasConfirmedEmail) ||
														(canChangeAccountOwner && hasConfirmedEmail) ||
														isCurrent) && (
														<div>
															<div
																className={`popover-icon icon icon-menu icon-rotate-90`}
																id={`settings-user-box-popover-${id}`}
															/>
															{this.createPopover(
																`settings-user-box-popover-${id}`,
																user,
																false,
																isCurrent
															)}
														</div>
													)}

													<div className="settings-user-box-content">
														<div className="icon-wrapper">
															<div
																className={`icon icon-${
																	hasConfirmedEmail
																		? `icon icon-${role.role}_user`
																		: "offen"
																}`}
															/>
															{!hasConfirmedEmail && isExpired && (
																<div className="invitation-expired">
																	<div className="icon icon-exclamation_mark"></div>
																</div>
															)}
														</div>
														<div
															className="user-box-title text-semibold"
															id={`user-name-${id}`}
														>
															{title}
															{isCurrent && (
																<div className="user-box-current-user">(You)</div>
															)}
														</div>
														<div className="user-box-subtitle u_mt_6">{email}</div>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							);
						}
					})}
				</div>
			);
		}
	}

	openUpgradeModal() {
		const { resources } = this.props;
		// ModalService.open(<UpgradeModalComponent title={resources.str_timeToStart} resources={resources} />, {
		// 	width: 1196,
		// 	padding: 0,
		// 	isCloseable: true
		// });
	}

	openMissingProfileDataModal() {
		const { resources } = this.props;
		ModalService.open(
			<MissingProfileDataModalComponent
				onConfirm={this.fetchUserList}
				userData={this.state.owner[0]}
				isLoading={this.state.isLoading}
				resources={resources}
			/>,
			{
				isClosable: true,
				width: 500,
				// height: 400,
				padding: "10px 40px 20px",
				borderRadius: "6px",
			}
		);
	}

	inviteUser(inviteCAOnly) {
		const {
			currentUserCount,
			maxUserCount,
			canInviteUser,
			isLoading,
			canExtendUsers,
			showOldPlans,
			currentPaidUsers,
		} = this.state;
		const { resources } = this.props;
		// eslint-disable-next-line no-lone-blocks
		if (!canExtendUsers && currentPaidUsers === maxUserCount) {
			// const message = showOldPlans ? lang.upgradeToHigherPlan : lang.upgradeToNewPlan;
			// const title = showOldPlans ? 'Dein Unternehmen wächst!' : 'Plan veraltet';
			const message = resources.str_upgradeNow;
			const title = resources.str_manageTariff;

			ModalService.open(message, {
				headline: title,
				cancelLabel: "Cancel",
				confirmLabel: resources.str_selectPlanNow,
				onConfirm: () => {
					this.openUpgradeModal();
				},
			});
		} else {
			const owner = this.state.owner && this.state.owner[0];

			ModalService.open(
				<UserInviteModalComponent
					owner={owner}
					onConfirm={this.updateUserData}
					maxUserCount={maxUserCount}
					userCount={currentPaidUsers}
					canInviteUser={canInviteUser}
					openUpgradeModal={this.openUpgradeModal}
					isLoading={isLoading}
					resources={resources}
					inviteCAOnly={inviteCAOnly}
				/>,
				{
					isClosable: true,
					width: 566,
					// height: 585,
					padding: "10px 40px 30px",
					borderRadius: "6px",
				}
			);
		}
	}

	buyUser() {
		const {
			currentUserCount,
			maxUserCount,
			canInviteUser,
			isLoading,
			canExtendUsers,
			showOldPlans,
			currentPaidUsers,
			planId,
			tenantId,
			pendingSeatInvites,
		} = this.state;
		const { resources } = this.props;
		if (pendingSeatInvites !== maxUserCount && currentPaidUsers !== maxUserCount) {
			const owner = this.state.owner && this.state.owner[0];

			ModalService.open(
				<AddonUserModalComponent
					owner={owner}
					onConfirm={this.updateUserData}
					maxUserCount={maxUserCount}
					userCount={currentPaidUsers}
					pendingSeatInvites={pendingSeatInvites}
					canInviteUser={canInviteUser}
					openUpgradeModal={this.openUpgradeModal}
					isLoading={isLoading}
					resources={resources}
					planId={planId}
					tenant={tenantId}
				/>,
				{
					isClosable: true,
					width: 566,
					// height: 585,
					padding: "10px 40px 30px",
					borderRadius: "6px",
				}
			);
		}
	}

	handlePopoverClick(entry) {
		const { caRole, pendingSeatInvites } = this.state;
		const { resources } = this.props;
		if (entry.action === "deleteUser") {
			const { firstName, lastName, id, email } = entry.user;

			ModalService.open(
				`Are you sure that you would like to delete user ${
					firstName && lastName ? `${firstName} ${lastName}` : `${email}`
				} from this Groflex account? Please note you can always invite this user back later.`,
				{
					headline: "Delete user",
					cancelLabel: "Cancel",
					confirmLabel: "Delete user",
					confirmButtonType: "danger",
					confirmIcon: "icon-trashcan",
					onConfirm: () => {
						invoiz
							.request(`${config.resourceHost}tenant/user/${id}`, {
								auth: true,
								method: "DELETE",
								data: {
									pendingSeatInvites,
								},
							})
							.then(() => {
								invoiz.showNotification({
									message: `The user was successfully deleted.`,
								});
								this.updateUserData();
								ModalService.close();
								this.setState({ caRole: [] });
							})
							.catch((error) => {
								invoiz.showNotification({ type: "error", message: resources.defaultErrorMessage });
								ModalService.close();
							});
					},
					loadingOnConfirmUntilClose: true,
				}
			);
		} else if (entry.action === "deleteCAUser") {
			const { firstName, lastName, id, email } = entry.user;
			const { resources } = this.props;
			ModalService.open(
				`Are you sure that you would like to delete the Chartered Accountant ${
					firstName && lastName ? `${firstName} ${lastName}` : `${email}`
				} from this Groflex account? Please note you can always invite this user back later.`,
				{
					headline: "Delete Chartered Accountant",
					cancelLabel: "Cancel",
					confirmLabel: "Delete",
					confirmButtonType: "danger",
					confirmIcon: "icon-trashcan",
					onConfirm: () => {
						invoiz
							.request(`${config.resourceHost}tenant/user/${id}`, {
								auth: true,
								method: "DELETE",
								data: {
									pendingSeatInvites,
								},
							})
							.then(() => {
								invoiz.showNotification({
									message: `The Chartered Accountant user was successfully deleted.`,
								});
								this.updateUserData(null, false, true);
								ModalService.close();
								this.setState({ caRole: [] });
							})
							.catch((error) => {
								invoiz.showNotification({ type: "error", message: resources.defaultErrorMessage });
								ModalService.close();
							});
					},
					loadingOnConfirmUntilClose: true,
				}
			);
		} else if (entry.action === "changeUserRole") {
			const step = 0;
			ModalService.open(<ChangeUserRoleModal user={entry.user} onConfirm={this.updateUserRole} />, {
				isClosable: true,
				width: 566,
				padding: "10px 40px 30px",
				borderRadius: "6px",
			});
		} else if (entry.action === "inviteAgain") {
			invoiz
				.request(`${config.resourceHost}user/resend/${entry.user.id}`, {
					auth: true,
					method: "POST",
				})
				.then(() => {
					invoiz.showNotification({
						message: `The invitation to ${entry.user.email} has been sent again.`,
					});
					if (entry.user.isExpired) {
						this.fetchUserList();
					}
				})
				.catch((error) => {
					const meta = error.body && error.body.meta;
					handleNotificationErrorMessage(meta);
				});
		} else if (entry.action === "deletePaidUser") {
			this.setState(
				{
					isLoading: true,
				},
				() => {
					updateSubscriptionDetails(() => {
						const { currentPaidUsers, maxUserCount, currentUserCount, currentAddons, pendingSeatInvites } =
							invoiz.user.subscriptionData;
						this.setState(
							{
								pendingSeatInvites,
								inviteUserFields: [],
								currentAddons,
								currentPaidUsers,
								currentUserCount,
								maxUserCount,
								isLoading: false,
							},
							() => {
								this.fetchUserList();
							}
						);
					});
				}
			);
		}
	}

	createPopover(elementId, user, caonly, isCurrent) {
		const { canDeleteUser, canInviteUser, canChangeAccountOwner, resources } = this.state;
		const entries = [];
		if (user !== null) {
			if (user.hasConfirmedEmail && canChangeAccountOwner && !caonly) {
				entries.push({
					label: "Change role",
					action: "changeUserRole",
					dataQsId: "settings-user-popover-changeUserRole",
					user,
				});
			}

			if (!user.hasConfirmedEmail && canInviteUser) {
				entries.push({
					label: "Invite again",
					action: "inviteAgain",
					dataQsId: "settings-user-popover-inviteAgain",
					user,
				});
			}

			if (user.role[0] !== "charteredaccountant" && canDeleteUser) {
				entries.push({
					label: "Delete user",
					action: "deleteUser",
					dataQsId: "settings-user-popover-deleteUser",
					user,
				});
			}

			if (user.role[0] === "charteredaccountant" && canDeleteUser && caonly) {
				entries.push({
					label: "Delete Chartered Accountant",
					action: "deleteCAUser",
					dataQsId: "settings-user-popover-deleteCAUser",
					user,
				});
			}

			if (user.hasConfirmedEmail && isCurrent) {
				entries.push({
					label: "Delete account",
					action: "deleteUser",
					dataQsId: "settings-user-popover-deleteUser",
					user,
				});
			}
		} else {
			entries.push({
				label: "Delete paid user",
				action: "deletePaidUser",
				dataQsId: "settings-user-popover-deleteUser",
				user,
			});
		}

		return (
			<PopoverComponent
				entries={[entries]}
				key={elementId}
				showOnHover={false}
				showOnClick={true}
				elementId={elementId}
				onClick={(entry) => {
					this.handlePopoverClick(entry);
				}}
				offsetTop={17}
				offsetLeft={13}
			/>
		);
	}

	getPaidUsers() {
		const { maxUserCount, canDeleteUser, currentPaidUsers, planId, canInviteUser, pendingSeatInvites } = this.state;
		let { inviteUserFields } = this.state;
		inviteUserFields = [];
		if (pendingSeatInvites > 0) {
			for (let i = 1; i <= pendingSeatInvites; i++) {
				inviteUserFields.push(
					canInviteUser &&
						maxUserCount !== currentPaidUsers &&
						planId !== (chargebeePlan.FREE_MONTH || chargebeePlan.TRIAL) &&
						canDeleteUser && (
							<div className="settings-user-box user-new" key={i} onClick={() => this.inviteUser()}>
								<div className="settings-user-box-content">
									{/* <img src="/assets/images/icons/invite_person.svg" width="30"></img> */}
									<div className={`icon icon-invite_person`} />
									<div className="user-box-title">Invite user</div>
								</div>
							</div>
						)
				);
			}
		}
		return <div className="settings-user-paid-list">{inviteUserFields}</div>;
	}

	render() {
		const {
			currentUserCount,
			maxUserCount,
			canInviteUser,
			canExtendUsers,
			planId,
			currentPaidUsers,
			otherRoles,
			currentAddons,
			pendingSeatInvites,
		} = this.state;
		const showPriceInformation =
			canInviteUser && canExtendUsers && maxUserCount && maxUserCount <= currentUserCount;
		return (
			<div className="settings-user-component">
				<TopbarComponent
					title="Team"
					// titleSup={`${currentUserCount && maxUserCount && maxUserCount !== 1 && maxUserCount >= currentUserCount
					// 	? `${currentPaidUsers} of ${maxUserCount}`
					// 	: ''
					// }`}
					viewIcon="icon-users"
				/>
				{this.state.isLoading ? (
					<div className="box">
						<LoaderComponent visible={true} text="Loading users data" />
					</div>
				) : (
					<div className="settings-user-content">
						<div className="settings-user-owner">
							{/* <div className="text-semibold u_mt_20 u_mb_20">Owner</div> */}
							<div className="settings-user-box-container">
								{this.getOwnerBox()}
								{this.getCABox()}
								{/* {canInviteUser && maxUserCount !== pendingSeatInvites && maxUserCount !== currentPaidUsers && maxUserCount !== (pendingSeatInvites + currentPaidUsers) && planId !== chargebeePlan.FREE_MONTH && planId !== chargebeePlan.TRIAL &&  (
									<div className="settings-user-box user-new" style={{marginTop: 60}} onClick={() => this.buyUser()}>
										<div className="settings-user-box-content">
											<img src="/assets/images/svg/plus.svg" width="30"></img>
											<div className={`icon icon-seat`} />
											<div className="user-box-title" >Buy seats</div>
											{showPriceInformation && (
												<div className="settings-user-box-contingent-depleted-box">
													<div className="contingent-depleted-price-hint">9 € per month</div>
													<div className="contingent-depleted-tax-hint">plus VAT</div>
												</div>
											)}
										</div>
									</div>

								)} */}
							</div>
						</div>

						<div className="combined-users">
							<div className="settings-user-paid">
								{/* {canInviteUser && maxUserCount !== currentPaidUsers && planId !== (chargebeePlan.FREE_MONTH || chargebeePlan.TRIAL) &&  (
								<div className="settings-user-box user-new" onClick={() => this.inviteUser()}>
									<div className="settings-user-box-content">
										<img src="/assets/images/svg/plus.svg" width="30"></img>
										<div className="user-box-title" >Invite user</div>
									</div>
								</div>

							)} */}
								{canInviteUser && pendingSeatInvites > 0 ? (
									<div
										className="settings-role-other-box-title text-semibold"
										style={{ fontSize: 20 }}
									>
										Seats available to invite
									</div>
								) : null}
								{this.getPaidUsers()}
							</div>
							<div className="settings-user-other">
								{/* { planId !== chargebeePlan.FREE_MONTH && (
								<div className="text-semibold u_mt_20 u_mb_20">More users</div>
							)} */}
								{planId !== chargebeePlan.FREE_MONTH && planId !== chargebeePlan.TRIAL ? (
									<div style={{ marginBottom: 20 }}>
										<div className="text-semibold u_mt_20 u_mb_10" style={{ fontSize: 20 }}>
											Team members
										</div>
										{currentPaidUsers > 0 || pendingSeatInvites > 0 ? (
											<div>
												<span>
													Seat capacity: {currentPaidUsers} of {maxUserCount}
												</span>
												<br></br>
											</div>
										) : canInviteUser ? (
											<span>Begin adding team members by buying seats and inviting users</span>
										) : (
											<span>Members appear here when the owner invites them</span>
										)}
										{/* <span>Where {currentPaidUsers} is the current number of users.</span> */}
									</div>
								) : (
									<div>
										{planId === chargebeePlan.TRIAL ? (
											<div
												className="text-semibold u_mt_20 u_mb_30"
												style={{ fontSize: 20 }}
											>{`Please upgrade your trial plan to a paid plan to buy and invite additional users`}</div>
										) : (
											<div
												className="text-semibold u_mt_20 u_mb_30"
												style={{ fontSize: 20 }}
											>{`Please upgrade your Free monthly plan to a paid plan to buy and invite additional users`}</div>
										)}
										<ButtonComponent
											type="primary"
											callback={() => invoiz.router.navigate("/settings/account")}
											label={"Go to settings page"}
											dataQsId="modal-user-upgrade-btn"
										/>
									</div>
								)}
								<div className="settings-user-list">{this.getUserList()}</div>
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}
}
const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return { resources };
};
export default connect(mapStateToProps)(SettingsUserComponent);
