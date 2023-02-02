import React from 'react';
import store from 'redux/store';
import { Provider } from 'react-redux';
import TopbarComponent from 'shared/topbar/topbar.component';
import AccountComponent from 'shared/settings/account.component';
// import BankAccountsComponent from 'shared/settings/bank-accounts.component';
import AccountSubscriptionComponent from 'shared/settings/subscription.component';
// import TaxSettingsComponent from 'shared/settings/tax-settings.component';
// import AchievementCenterComponent from 'shared/settings/achievement-center.component';
import ChangePasswordComponent from 'shared/settings/change-password.component';
import SenderEmailComponent from 'shared/settings/sender-email.component';
import NotificationsComponent from 'shared/settings/notifications.component';
import DeleteAccountComponent from 'shared/settings/delete-account.component';
import AccountMigrationComponent from 'shared/settings/account-migration.component';
import ChangeUserComponent from 'shared/settings/change-user.component';
import AccountKycProgressComponent from 'shared/settings/account-kyc.component';
import PaymentConditionsComponent from 'shared/settings/payment-conditions.component';
import userPermissions from 'enums/user-permissions.enum';
import invoiz from 'services/invoiz.service';
 
class SettingsAccountComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			canDeleteAccount: null,
			canSeeSubscription: null,
			canEditSubscription: null,
			canModifyNotifications: null
		};
	}

	componentDidMount() {
		this.setState({
			canDeleteAccount: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_ACCOUNT),
			canSeeSubscription: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_PLAN_DETAILS),
			canEditSubscription: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_PLAN),
			canModifyNotifications: invoiz.user && invoiz.user.hasPermission(userPermissions.MODIFY_EMAIL_NOTIFICATIONS)
		});
	}

	render() {
		const { account, subscriptionDetail, resources, pathName, payConditions } = this.props;
		const { canDeleteAccount, canEditSubscription, canSeeSubscription, canModifyNotifications } = this.state;
		
		return (
			<Provider store={store}>
				<div className="settings-account-wrapper wrapper-has-topbar-with-margin">
					<TopbarComponent title={
						pathName === "/settings/account" ? 'Account details' : 
						pathName === "/settings/account-setting" ? 'Setting' : 
						pathName === "/settings/billing" ? 'Your Billing' : ''
						} viewIcon={`icon-user_outlined_black`} />
					<div className="box">
						{/* <h1>{resources.str_account}</h1> */}
						{pathName === "/settings/account" ? 
							<div>
								<ChangeUserComponent account={account} resources={resources} /> 
								<AccountComponent account={account} resources={resources} />
								<AccountKycProgressComponent account={account} resources={resources} />
							</div>
						: null}
						
						{pathName === "/settings/account-setting" ? 
							<div>
								<ChangePasswordComponent resources={resources} />
								<SenderEmailComponent account={account} resources={resources} />
								{canModifyNotifications ? <NotificationsComponent account={account} resources={resources} /> : null }
								<PaymentConditionsComponent payConditions={payConditions} resources={resources} />
								{ canDeleteAccount ? <DeleteAccountComponent resources={resources} /> : null }
								<AccountMigrationComponent resources={resources} />
							</div>
						: null
						}
						{pathName === "/settings/billing" ? 
							<div>
								{(canSeeSubscription || canEditSubscription) ? <AccountSubscriptionComponent canEditSubscription={canEditSubscription} subscriptionDetail={subscriptionDetail} resources={resources} /> : null }	
							</div> : null
						}
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
