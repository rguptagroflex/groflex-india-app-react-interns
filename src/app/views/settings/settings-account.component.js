import React from "react";
import store from "redux/store";
import { Provider } from "react-redux";
import TopbarComponent from "shared/topbar/topbar.component";
import AccountComponent from "shared/settings/account.component";
// import BankAccountsComponent from 'shared/settings/bank-accounts.component';
import AccountSubscriptionComponent from "shared/settings/subscription.component";
// import TaxSettingsComponent from 'shared/settings/tax-settings.component';
// import AchievementCenterComponent from 'shared/settings/achievement-center.component';
import ChangePasswordComponent from "shared/settings/change-password.component";
import SenderEmailComponent from "shared/settings/sender-email.component";
import NotificationsComponent from "shared/settings/notifications.component";
import DeleteAccountComponent from "shared/settings/delete-account.component";
import AccountMigrationComponent from "shared/settings/account-migration.component";
import ChangeUserComponent from "shared/settings/change-user.component";
import AccountKycProgressComponent from "shared/settings/account-kyc.component";
import PaymentConditionsComponent from "shared/settings/payment-conditions.component";
import userPermissions from "enums/user-permissions.enum";
import invoiz from "services/invoiz.service";
import TabsComponent from "../../shared/tabs/tabs.component";

const tabs = ["Account Details", "Preferences"];

class SettingsAccountComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			canDeleteAccount: null,
			canSeeSubscription: null,
			canEditSubscription: null,
			canModifyNotifications: null,
		};
		this.state = {
			activeTab: "Account Details",
		};
	}
	setActiveTab(tab) {
		this.setState({ activeTab: tab });
	}

	componentDidMount() {
		this.setState({
			canDeleteAccount: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_ACCOUNT),
			canSeeSubscription: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_PLAN_DETAILS),
			canEditSubscription: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_PLAN),
			canModifyNotifications:
				invoiz.user && invoiz.user.hasPermission(userPermissions.MODIFY_EMAIL_NOTIFICATIONS),
		});
		this.setState({ activeTab: "Account Details" });
	}

	render() {
		const { account, subscriptionDetail, resources, pathName, payConditions } = this.props;
		const { canDeleteAccount, canEditSubscription, canSeeSubscription, canModifyNotifications } = this.state;
		const { activeTab } = this.state;
		return (
			<Provider store={store}>
				<div className="settings-account-wrapper wrapper-has-topbar-with-margin">
					<TopbarComponent
						title={
							pathName === "/settings/account"
								? "Account Details"
								: pathName === "/settings/account-setting"
								? "Setting"
								: pathName === "/settings/billing"
								? "Your Billing"
								: ""
						}
						viewIcon={
							pathName === "/settings/account"
								? `icon-user_outlined_black`
								: pathName === "/settings/account-setting"
								? `icon-settings_outlined`
								: pathName === "/settings/billing"
								? `icon-icon-credit_card`
								: `icon-user_outlined_black`
						}
					/>

					{pathName === "/settings/account" || pathName === "/settings/account-setting" ? (
						<div className="row">
							<div
								className="tabs-container"
								style={{ display: "flex", marginLeft: "10px", gap: "10px" }}
							>
								<TabsComponent activeTab={this.state.activeTab} setActiveTab={this.setActiveTab}>
									<TabsComponent.List>
										{tabs.map((tab, index) => (
											<div
												key={index}
												className={`tab-item ${
													this.state.activeTab === tab ? "active-tab" : ""
												}`}
												onClick={() => this.setActiveTab(tab)}
												style={{
													marginRight: "20px",
													cursor: "pointer",
													position: "relative",
													color: this.state.activeTab === tab ? "#00A353" : "#272D30",
												}}
											>
												{tab}
												{this.state.activeTab === tab && (
													<div>
														<div
															style={{
																content: "",
																display: "block",
																position: "absolute",
																bottom: "-7px",
																left: "0",
																width: "100%",
																height: "2px",
																backgroundColor: "#00A353",
															}}
														/>
														<div
															style={{
																content: "",
																display: "block",
																position: "absolute",
																bottom: "-8px",
																left:
																	this.state.activeTab === "Account Details"
																		? "0px"
																		: "-160%",
																width: "910px",
																height: "1px",
																background: "#C6C6C6",
															}}
														/>
													</div>
												)}
											</div>
										))}
									</TabsComponent.List>
								</TabsComponent>
							</div>
						</div>
					) : null}

					<div>
						{/* <h1>{resources.str_account}</h1> */}
						{pathName === "/settings/account" ? (
							<div>
								{/* className="box" */}
								{activeTab === "Account Details" && (
									<div className="row u_mt_32" style={{ width: "100%" }}>
										<div className="col-xs-7">
											<ChangeUserComponent account={account} resources={resources} />
											<AccountComponent account={account} resources={resources} />
										</div>
										<div className="col-xs-5">
											<AccountKycProgressComponent account={account} resources={resources} />
											{canSeeSubscription || canEditSubscription ? (
												<div className="accountingSubscriptionContainer">
													<AccountSubscriptionComponent
														canEditSubscription={canEditSubscription}
														subscriptionDetail={subscriptionDetail}
														resources={resources}
													/>
												</div>
											) : null}
										</div>
									</div>
								)}
								{/* <ChangeUserComponent account={account} resources={resources} />  */}
								{/* <AccountComponent account={account} resources={resources} /> */}
								{/* <AccountKycProgressComponent account={account} resources={resources} /> */}
							</div>
						) : null}

						{/* {pathName === "/settings/account-setting" ? ( */}
						{pathName === "/settings/account" ? (
							<div>
								{/* className="box" */}
								{activeTab === "Preferences" && (
									<div className="row u_mt_32">
										<div className="col-xs-7">
											<ChangePasswordComponent resources={resources} />
											{canDeleteAccount ? <DeleteAccountComponent resources={resources} /> : null}
											<PaymentConditionsComponent
												payConditions={payConditions}
												resources={resources}
											/>
											<AccountMigrationComponent resources={resources} />
										</div>
										<div className="col-xs-5">
											{canModifyNotifications ? (
												<NotificationsComponent account={account} resources={resources} />
											) : null}
											<SenderEmailComponent account={account} resources={resources} />
										</div>
									</div>
								)}
								{/* <ChangePasswordComponent resources={resources} /> */}
								{/* <SenderEmailComponent account={account} resources={resources} /> */}
								{/* {canModifyNotifications ? (
									<NotificationsComponent account={account} resources={resources} />
								) : null} */}
								{/* <PaymentConditionsComponent payConditions={payConditions} resources={resources} /> */}
								{/* {canDeleteAccount ? <DeleteAccountComponent resources={resources} /> : null} */}
								{/* <AccountMigrationComponent resources={resources} /> */}
							</div>
						) : null}
						{pathName === "/settings/billing" ? (
							<div>
								{canSeeSubscription || canEditSubscription ? (
									<AccountSubscriptionComponent
										canEditSubscription={canEditSubscription}
										subscriptionDetail={subscriptionDetail}
										resources={resources}
									/>
								) : null}
							</div>
						) : null}
						{/* <ChangeUserComponent account={account} resources={resources} />
						<AccountComponent account={account} resources={resources} />
						<AccountKycProgressComponent account={account} resources={resources} /> */}

						{/* <BankAccountsComponent resources={resources} /> */}
						{/* <div className="account_section_achievements">
							<AchievementCenterComponent />
						</div> */}
						{/* {(canSeeSubscription || canEditSubscription) ? <AccountSubscriptionComponent canEditSubscription={canEditSubscription} subscriptionDetail={subscriptionDetail} resources={resources} /> : null }						 */}
						{/* <TaxSettingsComponent account={account} resources={resources} /> */}
						{/* Setting */}
						{/* <ChangePasswordComponent resources={resources} />
						<SenderEmailComponent account={account} resources={resources} />
						{ canModifyNotifications ? <NotificationsComponent account={account} resources={resources} /> : null}						
						{ canDeleteAccount ? <DeleteAccountComponent resources={resources} /> : null }
						<AccountMigrationComponent resources={resources} /> */}
					</div>
				</div>
			</Provider>
		);
	}
}

export default SettingsAccountComponent;
