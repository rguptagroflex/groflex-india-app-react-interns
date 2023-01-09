import React from 'react';
import invoiz from 'services/invoiz.service';
import { fetchAccounts } from 'helpers/banking/fetchAccounts';
import TopbarComponent from 'shared/topbar/topbar.component';
import LoaderComponent from 'shared/loader/loader.component';
import { Provider, connect } from 'react-redux';
import store from 'redux/store';
import WebStorageKey from 'enums/web-storage-key.enum';
import { updateSelectedAccounts, updateSelectedAccountsForAllViews } from 'helpers/updateSelectedAccounts';
import FinanceCockpitAccountSummaryComponent from 'shared/banking/financecockpit/financecockpit-account-summary.component';
import FinanceCockpitNewTransactionsComponent from 'shared/banking/financecockpit/financecockpit-new-transactions.component';
import FinanceCockpitBalanceStatsComponent from 'shared/banking/financecockpit/financecockpit-balance-stats.component';
import FinanceCockpitCashflowStatsComponent from 'shared/banking/financecockpit/financecockpit-cashflow-stats.component';
import FinanceCockpitRevenuesExpensesComponent from 'shared/banking/financecockpit/financecockpit-revenues-expenses.component';
import ModalService from 'services/modal.service';
import BankAccountSetupComponent from 'shared/modals/bank-account-setup-modal.component';

class BankingFinanceCockpitComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			accounts: null
		};
	}

	componentDidMount() {
		this.updateAccounts();
	}

	onAccountsChange(selectedAccountIds) {
		if (
			this.refs.cashflowStats &&
			this.refs.cashflowStats.getWrappedInstance() &&
			this.refs.cashflowStats.getWrappedInstance().updateSelectedAccountIds
		) {
			this.refs.cashflowStats.getWrappedInstance().updateSelectedAccountIds(selectedAccountIds);
		}
	}

	onTopbarAction(action) {
		const { resources } = this.props;
		if (action === 'addAccount') {
			ModalService.open(
				<BankAccountSetupComponent
					onFinish={addedAccounts => {
						updateSelectedAccountsForAllViews(addedAccounts);
						invoiz.router.navigate('/banking/financecockpit', true, true);
						invoiz.showNotification(resources.bankAccoutSetupSuccessMessage);
					}}
					resources={resources}
				/>,
				{
					width: 790,
					padding: 0,
					afterClose: isFromCancel => {
						if (isFromCancel) {
							ModalService.close();
						}
					}
				}
			);
		}
	}

	updateAccounts() {
		fetchAccounts().then(accountsReponse => {
			const { accounts } = accountsReponse.body.data;

			if (accounts.length === 0) {
				invoiz.router.redirectTo('/banking/setup');
			} else {
				this.setState({
					accounts,
					selectedAccountIds: updateSelectedAccounts(accounts, WebStorageKey.SELECTED_BANK_ACCOUNTS_COCKPIT)
				});
			}
		});
	}

	render() {
		const { accounts, selectedAccountIds } = this.state;
		const { resources } = this.props;
		if (!accounts) {
			return (
				<div className="banking-financecockpit-wrapper loader-wrapper">
					<LoaderComponent visible={true} />
				</div>
			);
		}

		const dropdownEntries = [
			{
				label: resources.str_addBankaccount,
				action: 'addAccount',
				dataQsId: 'banking-transactions-topbar-popoverItem-addAccounts'
			}
		];

		return (
			<Provider store={store}>
				<div className="banking-financecockpit-wrapper wrapper-has-topbar">
					<TopbarComponent
						title={resources.str_financialCockpit}
						viewIcon="icon-banking"
						dropdownEntries={[dropdownEntries]}
						dropdownCallback={entry => this.onTopbarAction(entry.action)}
					/>

					<div className="row">
						<FinanceCockpitAccountSummaryComponent
							accounts={accounts}
							selectedAccountIds={selectedAccountIds}
							onAccountsChange={selectedAccountIds => this.onAccountsChange(selectedAccountIds)}
						/>
						<FinanceCockpitNewTransactionsComponent />
					</div>

					<div className="row">
						<FinanceCockpitBalanceStatsComponent
							accounts={accounts}
							selectedAccountIds={selectedAccountIds}
						/>
					</div>

					<div className="row">
						<FinanceCockpitCashflowStatsComponent
							accounts={accounts}
							selectedAccountIds={selectedAccountIds}
							ref="cashflowStats"
						/>
					</div>

					<div className="row">
						<FinanceCockpitRevenuesExpensesComponent
							accounts={accounts}
							selectedAccountIds={selectedAccountIds}
						/>
					</div>
				</div>
			</Provider>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(BankingFinanceCockpitComponent);
