import React from "react";
import invoiz from "services/invoiz.service";
import lang from "lang";
import moment from "moment";
import _, { capitalize } from "lodash";
import { getLabelForCountry } from "helpers/getCountries";
// import TopbarComponent from "shared/topbar/topbar.component";
import { formatCurrency } from "helpers/formatCurrency";
import ModalService from "services/modal.service";
import DeleteRowsModal from "shared/modals/list-advanced/delete-rows-modal.component";
import ListAdvancedComponent from "shared/list-advanced/list-advanced.component";
import ButtonComponent from "shared/button/button.component";
// import UpgradeFullscreenModalComponent from 'shared/modals/upgrade-fullscreen-modal.component';
import ChargebeePlan from "enums/chargebee-plan.enum";
// import AppType from 'enums/apps/app-type.enum';
// import { navigateToAppId } from 'helpers/apps/navigateToAppId';
import { customerTypes, ListAdvancedDefaultSettings } from "helpers/constants";
import { localeCompare, localeCompareNumeric, dateCompare, dateCompareSort } from "helpers/sortComparators";
import { getScaledValue } from "helpers/getScaledValue";
import WebStorageKey from "enums/web-storage-key.enum";
import WebStorageService from "services/webstorage.service";
import { isNil } from "helpers/isNil";
import userPermissions from "enums/user-permissions.enum";
import { connect, Provider } from "react-redux";
import store from "redux/store";
import Customer from "../../models/customer.model";
import { formatCurrencySymbolDisplayInFront } from "helpers/formatCurrency";
import OnClickOutside from "../../shared/on-click-outside/on-click-outside.component";
import { formatDate, formatApiDate, formateClientDateMonthYear } from "helpers/formatDate";
import q from "q";
import config from "../../../config";

import TeamsTopbarComponent from "./teams-topbar.component";
import webStorageKeyEnum from "../../enums/web-storage-key.enum";
import multiuserRoleType from "../../enums/multiuser-role-type.enum";
import {
	canExtendUsers,
	isChargebeeSubscriber,
	isRazorpaySubscriber,
	isZohoSubscriber,
} from "../../helpers/subscriptionHelpers";

class TeamsListComponent extends React.Component {
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
			refreshData: false,
			isLoading: false,
			topbarHeading: "Teams",
			selectedRows: [],
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

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	createTopbar() {
		const { isLoading, selectedRows, canCreateCustomer, canDeleteCustomer } = this.state;

		const topbarButtons = [];

		if (!isLoading) {
			topbarButtons.push({
				type: "primary",
				label: "Invite New User",
				// buttonIcon: "icon-plus",
				// action: "create",
				action: "drop-down",
				disabled: !canDeleteCustomer,
				// rightIcon: "icon-arrow_solid_down",
			});
		}

		const topbar = (
			<TeamsTopbarComponent
				title={this.state.topbarHeading ? this.state.topbarHeading : "Teams"}
				viewIcon={`icon-users`}
				buttons={topbarButtons}
			/>
		);

		return topbar;
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
			case multiuserRoleType.ADMIN:
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

	onActionCellPopupItemClick(teamMember, entry) {
		const { resources } = this.props;

		// console.log("teamMember", teamMember);
		const { firstName, lastName, id, email, hasConfirmedEmail, role } = teamMember;
		switch (entry.action) {
			case "changeRole":

			case "inviteAgain":
			case "delete":
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
				break;
		}
	}

	render() {
		const { resources } = this.props;
		const { canCreateCustomer, canUpdateCustomer, canDeleteCustomer } = this.state;
		return (
			<div className="teams-list-component-wrapper">
				{this.createTopbar()}

				<div className="teams-list-wrapper">
					<ListAdvancedComponent
						fetchUrls={[`${config.settings.endpoints.getUserList}`]}
						refreshData={this.state.refreshData}
						ref="listAdvanced"
						defaultSortModel={{
							colId: "number",
							sort: "asc",
						}}
						responseDataMapFunc={(userList) => {
							const rolesList = userList.roles;
							const allUsersList = [];
							if (rolesList && rolesList.length > 0) {
								rolesList.forEach((role) => {
									role.users.forEach((user) => {
										allUsersList.push(user);
									});
								});
							}
							// console.log(rolesList, "rolesList");
							// console.log(allUsersList, "allUsersList");
							if (allUsersList && allUsersList.length > 0) {
								return allUsersList;
							}
						}}
						columnDefs={[
							{
								headerName: "User's name",
								field: "firstName",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter",
								cellRenderer: (evt) => {
									const { firstName, lastName, isCurrent, hasConfirmedEmail, isExpired } = evt.data;
									// console.log(evt, "evt from cellRenderer");
									if (isCurrent) {
										return `<b>${firstName} ${lastName} (You)</b>`;
									} else if (!hasConfirmedEmail && !isExpired) {
										return "-";
									}
									return `${firstName} ${lastName}`;
								},
							},
							{
								headerName: "Role",
								field: "role",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter",
								cellRenderer: (evt) => {
									if (evt.value[0] === "charteredaccountant") {
										return "Chartered Accountant";
									}
									return capitalize(evt.value[0]);
								},
							},
							{
								headerName: "Email",
								field: "email",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter",
							},
							{
								headerName: "Status",
								field: "status",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter",
								cellRenderer: (evt) => {
									const { hasConfirmedEmail, isExpired } = evt.data;
									if (hasConfirmedEmail) {
										return "Accepted";
									} else if (!hasConfirmedEmail && isExpired) {
										return "Expired";
									} else if (!hasConfirmedEmail && !isExpired) {
										return "Invitation sent";
									}
								},
							},
						]}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								console.log(item, "action cell item");
								const entries = [];
								if (item) {
									const { hasConfirmedEmail, isCurrent, isExpired } = item;
									if (hasConfirmedEmail && !isCurrent) {
										entries.push({
											dataQsId: `teams-list-item-dropdown-entry-change-role`,
											label: "Change role",
											action: "changeRole",
										});
									}
									if (!hasConfirmedEmail && !isExpired) {
										entries.push({
											dataQsId: `teams-list-item-dropdown-entry-invite-again`,
											label: "Invite again",
											action: "inviteAgain",
										});
									}
									if (!isCurrent) {
										entries.push({
											dataQsId: `teams-list-item-dropdown-entry-delete`,
											label: "Delete user",
											action: "delete",
										});
									}
								}
								return [entries];
							},
							onPopupItemClicked: (itemData, popupEntry) => {
								// console.log(itemData, "itemdata");
								// console.log(popupEntry, "popupEntry");
								this.onActionCellPopupItemClick(itemData, popupEntry);
							},
						}}
						multiSelect={true}
						usePagination={false}
						exportFilename={`Exported Teams list ${moment().format(config.dateFormat.client)}`}
						gatherRemovedSelectedRowsBy="id"
						loadingRowsMessage={"Loading Teams list..."}
						noFilterResultsMessage={"No Team member match the filter"}
						webStorageKey={webStorageKeyEnum.TEAMS_LIST_SETTING}
						onRowSelectionChanged={(selectedRows) => {
							if (!this.isUnmounted) {
								this.setState({ selectedRows });
							}
						}}
					/>
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

export default connect(mapStateToProps)(TeamsListComponent);
