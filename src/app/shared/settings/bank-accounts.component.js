import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import ModalService from 'services/modal.service';
import BankAccountSetupComponent from 'shared/modals/bank-account-setup-modal.component';
import ButtonComponent from 'shared/button/button.component';
import { format } from 'util';

class BankAccountsComponent extends React.Component {
	constructor() {
		super();

		this.state = {
			bankAccounts: []
		};
	}

	componentDidMount() {
		this.getAccounts();
	}

	getAccounts() {
		invoiz
			.request(`${config.resourceHost}banking/accounts`, { auth: true })
			.then(({ body: { data: { accounts } } }) => {
				this.setState({ bankAccounts: accounts });
			});
	}

	onDeleteBankContactClick(accountId) {
		const { resources } = this.props;
		ModalService.open(resources.accountDeleteConfirmation, {
			headline: resources.str_deleteAccount,
			cancelLabel: resources.str_abortStop,
			confirmLabel: resources.str_clear,
			confirmButtonType: 'secondary',
			confirmIcon: 'icon-trashcan',
			onConfirm: () => {
				ModalService.close();
				invoiz
					.request(`${config.resourceHost}banking/account/${accountId}/state`, {
						auth: true,
						method: 'PUT',
						data: { enabled: false }
					})
					.then(({ body: { data: { accounts } } }) => {
						invoiz.page.showToast(resources.bankAccountDeleteSuccessMessage);
						this.getAccounts();
					});
			}
		});
	}

	onSetupBankContactClick() {
		const { resources } = this.props;
		ModalService.open(
			<BankAccountSetupComponent
				onFinish={() => {
					invoiz.page.showToast(resources.bankAccoutSetupSuccessMessage);
					this.getAccounts();
				}}
				resources={resources}
			/>,
			{
				width: 790,
				padding: 0,
				afterClose: isFromCancel => {
					if (!isFromCancel) {
						this.getAccounts();
					}
				}
			}
		);
	}

	render() {
		const { bankAccounts } = this.state;
		const { resources } = this.props;
		return (
			<div className="settings-bankaccounts-component">
				<div className="row u_pt_60 u_pb_40">
					<div className="col-xs-4 form_groupheader_edit text-h4">{resources.str_bankDetails}</div>
					<div className="col-xs-8">
						<div className="settings-bankaccounts-desc">
							{resources.bankAccountSettingsDescription}
						</div>
						<div className="settings-bankaccounts-accounts-desc" dangerouslySetInnerHTML={{ __html: format(resources.bankAccountAlreadySetUpText, bankAccounts.length, bankAccounts.length === 1 ? resources.str_account : resources.str_accounts) }}>
						</div>
						<div className="settings-bankaccounts-accounts">
							{bankAccounts.map(bankContact => {
								return (
									<div className="settings-bankaccounts-account-row" key={bankContact.id}>
										<div className="account-col-left icon icon-credit_card" />
										<div className="account-col-center">
											<div className="row1">{bankContact.accountName}</div>
											<div className="row3 text-muted">{bankContact.bankName}</div>
											<div className="row2 text-muted">
												{bankContact.accountIban
													? `IBAN: ${bankContact.accountIban}`
													: resources.noIbanAvailable}
											</div>
										</div>
										<div
											className="account-col-right icon icon-trashcan"
											onClick={() => this.onDeleteBankContactClick(bankContact.id)}
										/>
									</div>
								);
							})}
						</div>
						<div className="col-xs-7 col-xs-offset-5 u_mt_24 u_pd-r0">
							<ButtonComponent
								buttonIcon={'icon-plus'}
								type="primary"
								isWide={true}
								callback={() => this.onSetupBankContactClick()}
								label={resources.str_linkBankAccount}
								dataQsId="settings-bankAccounts-btn-setupAccount"
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default BankAccountsComponent;
