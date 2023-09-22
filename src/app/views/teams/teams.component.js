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
import { updateSubscriptionDetails } from "helpers/updateSubsciptionDetails";
import config from "../../../config";

import TeamsTopbarComponent from "./teams-topbar.component";
import webStorageKeyEnum from "../../enums/web-storage-key.enum";
import multiUserRoleType from "../../enums/multiuser-role-type.enum";
import {
	canExtendUsers,
	isChargebeeSubscriber,
	isRazorpaySubscriber,
	isZohoSubscriber,
} from "../../helpers/subscriptionHelpers";
import TopbarComponent from "../../shared/topbar/topbar.component";
import MissingProfileDataModalComponent from "../../shared/modals/missing-profile-data-modal.component";
import UserInviteModalComponent from "../../shared/modals/user-invite/user-invite-modal.component";
import ChangeUserRoleModal from "../../shared/modals/change-user-role-modal.component";
import { handleNotificationErrorMessage } from "../../helpers/errorMessageNotification";

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
					} else {
						this.setState({ caRole: null });
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

	openMissingProfileDataModal() {
		const { resources } = this.props;
		ModalService.open(
			<MissingProfileDataModalComponent
				onConfirm={() => this.fetchUserList()}
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

	openUpgradeModal() {
		const { resources } = this.props;
		// ModalService.open(<UpgradeModalComponent title={resources.str_timeToStart} resources={resources} />, {
		// 	width: 1196,
		// 	padding: 0,
		// 	isCloseable: true
		// });
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
					onConfirm={() => this.updateUserData()}
					maxUserCount={maxUserCount}
					userCount={currentPaidUsers}
					canInviteUser={canInviteUser}
					openUpgradeModal={() => this.openUpgradeModal()}
					isLoading={isLoading}
					resources={resources}
					inviteCAOnly={inviteCAOnly}
					refreshGrid={() => this.setState({ refreshData: !this.state.refreshData })}
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

	onTopbarButtonClick(action, selectedRows) {
		const { resources } = this.props;
		switch (action) {
			case "inviteUser":
				this.inviteUser();
				break;
			case "inviteCaOnly":
				this.inviteUser(true);
				break;
			default:
				break;
		}
	}

	createTopbar() {
		const { isLoading, selectedRows, canCreateCustomer, canDeleteCustomer } = this.state;

		const topbarButtons = [];
		// console.log(!this.state.caRole.length, "this.state.caRole.length");

		if (!isLoading) {
			if (this.state.caRole === null) {
				topbarButtons.push({
					type: "primary",
					label: "Invite CA",
					action: "inviteCaOnly",
					disabled: false,
				});
			}
			if (this.state.currentPaidUsers < this.state.maxUserCount) {
				topbarButtons.push({
					type: "primary",
					label: "Invite New User",
					action: "inviteUser",
					disabled: false,
					// buttonIcon: "icon-plus",
					// action: "create",
					// disabled: !canCreateCustomer,
					// rightIcon: "icon-arrow_solid_down",
				});
			}
		}

		const topbar = (
			// <TeamsTopbarComponent
			// 	title={this.state.topbarHeading ? this.state.topbarHeading : "Teams"}
			// 	viewIcon={`icon-users`}
			// 	buttons={topbarButtons}
			// 	buttonCallback={() => {}}
			// />
			<TopbarComponent
				title={this.state.topbarHeading ? this.state.topbarHeading : "Teams"}
				viewIcon={`icon-users`}
				buttons={topbarButtons}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action, selectedRows)}
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
								// this.getPaidUsers();
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
		// console.log(this, "THIS PROPS ke pehle ka IN UPDATE USER ROLE MODAL");
		// console.log(this.props, "THIS PROPS IN UPDATE USER ROLE MODAL");
		// console.log(user, selectedRole, "user, selectedRole IN UPDATE USER ROLE MODAL");
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
					this.setState({ refreshData: !this.state.refreshData });
				})
				.catch((err) => {
					console.log(err);
				});
		}
	}

	onActionCellPopupItemClick(teamMember, entry) {
		const { resources } = this.props;

		// console.log("teamMember", teamMember);
		// console.log(deleteCAUser, "deleteCAUser");

		const { firstName, lastName, id, email, hasConfirmedEmail, role } = teamMember;
		const { caRole, pendingSeatInvites } = this.state;

		switch (entry.action) {
			case "changeUserRole":
				const step = 0;
				ModalService.open(
					<ChangeUserRoleModal
						user={teamMember}
						onConfirm={(user, selectedRole) => this.updateUserRole(user, selectedRole)}
					/>,
					{
						isClosable: true,
						width: 566,
						padding: "10px 40px 30px",
						borderRadius: "6px",
					}
				);
				break;

			case "inviteAgain":
				invoiz
					.request(`${config.resourceHost}user/resend/${teamMember.id}`, {
						auth: true,
						method: "POST",
					})
					.then(() => {
						invoiz.showNotification({
							message: `The invitation to ${teamMember.email} has been sent again.`,
						});
						if (teamMember.isExpired) {
							this.fetchUserList();
						}
						this.setState({ refreshData: !this.state.refreshData });
					})
					.catch((error) => {
						const meta = error.body && error.body.meta;
						handleNotificationErrorMessage(meta);
					});
				break;

			case "deleteUser":
				ModalService.open(
					`Are you sure that you would like to delete user ${
						firstName && lastName ? `${firstName} ${lastName}` : `${email}`
					} from this Groflex account? Please note you can always invite this user back later.`,
					{
						headline: "Delete user",
						cancelLabel: "Cancel",
						confirmLabel: "Delete user",
						confirmButtonType: "primary",
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
									this.setState({ refreshData: !this.state.refreshData });
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

			case "deleteCAUser":
				ModalService.open(
					`Are you sure that you would like to delete the Chartered Accountant ${
						firstName && lastName ? `${firstName} ${lastName}` : `${email}`
					} from this Groflex account? Please note you can always invite this user back later.`,
					{
						headline: "Delete Chartered Accountant",
						cancelLabel: "Cancel",
						confirmLabel: "Delete",
						confirmButtonType: "primary",
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
									this.setState({
										// caRole: null,
										refreshData: !this.state.refreshData,
									});
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

			case "deletePaidUser":
				this.setState(
					{
						isLoading: true,
					},
					() => {
						updateSubscriptionDetails(() => {
							const {
								currentPaidUsers,
								maxUserCount,
								currentUserCount,
								currentAddons,
								pendingSeatInvites,
							} = invoiz.user.subscriptionData;
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
				break;
			default:
				break;
		}
	}

	render() {
		const { resources } = this.props;
		const { canCreateCustomer, canUpdateCustomer, canDeleteCustomer } = this.state;
		console.log(this.state, "Teams component State");
		// console.log(resources, "Teams component Resources");
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
										if (user.isCurrent) return;
										allUsersList.push(user);
									});
								});
							}
							// console.log(rolesList, "rolesList");
							// console.log(allUsersList, "allUsersList");
							if (allUsersList && allUsersList.length > 0) {
								return allUsersList;
							}
							return [];
						}}
						columnDefs={[
							{
								headerName: "User's name",
								field: "firstName",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter",
								cellRenderer: (evt) => {
									const { firstName, lastName, isCurrent, hasConfirmedEmail, isExpired, email } =
										evt.data;
									// console.log(evt, "evt from cellRenderer");
									if (isCurrent) {
										return `<b>${firstName} ${lastName} (You)</b>`;
									} else if (!hasConfirmedEmail) {
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
								// console.log(item, "action cell item");
								const entries = [];
								if (item) {
									const { hasConfirmedEmail, isCurrent, isExpired } = item;
									if (hasConfirmedEmail && !isCurrent) {
										entries.push({
											dataQsId: `teams-list-item-dropdown-entry-change-role`,
											label: "Change role",
											action: "changeUserRole",
										});
									}
									if (!hasConfirmedEmail) {
										entries.push({
											dataQsId: `teams-list-item-dropdown-entry-invite-again`,
											label: "Invite again",
											action: "inviteAgain",
										});
									}
									if (item.role[0] === "charteredaccountant") {
										entries.push({
											dataQsId: `teams-list-item-dropdown-entry-deleteCAUser`,
											label: "Delete Chartered Accountant",
											action: "deleteCAUser",
										});
									} else {
										entries.push({
											dataQsId: `teams-list-item-dropdown-entry-delete`,
											label: "Delete user",
											action: "deleteUser",
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
						usePagination={true}
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
						emptyState={{
							// iconClass: "icon-rechnung",
							headline: "No team members yet",
							// subHeadline: resources.createBillText,
							buttons: (
								<React.Fragment>
									{/* <ButtonComponent
										label="Los geht's"
										buttonIcon="icon-plus"
										dataQsId="empty-list-create-button"
										callback={() => invoiz.router.navigate('/invoice/new')}
									/> */}
									<ButtonComponent
										label={"Invite New User"}
										// buttonIcon="icon-plus"
										dataQsId="empty-list-create-button"
										callback={() => this.inviteUser()}
										// disabled={!canCreateCustomer}
									/>
								</React.Fragment>
							),
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
