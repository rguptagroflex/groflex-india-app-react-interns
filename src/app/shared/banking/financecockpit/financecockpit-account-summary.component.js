import React from 'react';
import _ from 'lodash';
import config from 'config';
import moment from 'moment';
import { connect } from 'react-redux';
import PerfectScrollbar from 'perfect-scrollbar';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import { formatCurrency } from 'helpers/formatCurrency';
// import { formatDate } from 'helpers/formatDate';
import { formatClientDate } from 'helpers/formatDate';
import { formatIban } from 'helpers/formatIban';
import { fetchAccounts } from 'helpers/banking/fetchAccounts';
import {
	resetCockpit,
	fetchNewTransactions,
	fetchBalances,
	fetchCashflow,
	fetchRevenues,
	setInitialSyncDone
} from 'redux/ducks/banking/financeCockpit';

const TEXT_NO_IBAN = 'Keine IBAN vorhanden';

class FinanceCockpitAccountSummaryComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			accounts: props.accounts,
			selectedAccountIds: props.selectedAccountIds,
			isMultiAccountSummaryCollapsed: true,
			initialSyncDone: false
		};

		this.perfectScrollbar = null;
		this.accountSelectTimer = null;
		this.updateAccountsTimer = null;
		this.onWindowResize = this.onWindowResize.bind(this);
	}

	componentDidMount() {
		const { accounts, selectedAccountIds } = this.state;
		$(window).on('resize', this.onWindowResize);
		this.props.fetchNewTransactions(selectedAccountIds);

		let initialSyncDone = false;

		if (accounts && accounts.length > 0) {
			accounts.forEach(account => {
				if (account.initialSyncDone) {
					initialSyncDone = true;
				}
			});
		}

		if (!initialSyncDone) {
			clearTimeout(this.updateAccountsTimer);

			this.updateAccountsTimer = setTimeout(() => {
				this.updateAccounts();
			}, 5000);
		} else {
			this.setState({ initialSyncDone: true }, () => {
				this.props.setInitialSyncDone(true);
			});
		}
	}

	componentWillUnmount() {
		this.isUnmounted = true;
		this.props.resetCockpit();
		this.destroyScrollbar();
		$(window).off('resize', this.onWindowResize);
	}

	destroyScrollbar() {
		if (this.perfectScrollbar) {
			this.perfectScrollbar.destroy();
		}
	}

	onAccountSelect(accountId, isAccountSelected) {
		const { accounts } = this.state;
		const { onAccountsChange } = this.props;
		const currentSelectedAccountIds = this.state.selectedAccountIds.concat();
		let selectedAccountIds = [];

		if (currentSelectedAccountIds.indexOf(accountId) === -1) {
			currentSelectedAccountIds.push(accountId);
		}

		selectedAccountIds = currentSelectedAccountIds.filter(selectedAccountId => {
			return accountId === selectedAccountId ? !isAccountSelected : selectedAccountId !== 'all';
		});

		if (selectedAccountIds.length === 0) {
			selectedAccountIds = [accountId];
		}

		if (accountId === 'all' && !isAccountSelected) {
			selectedAccountIds = ['all'];
		}

		selectedAccountIds.sort((a, b) => {
			const currentFoundIndex = accounts.findIndex(account => account.id === a);
			const nextFoundIndex = accounts.findIndex(account => account.id === b);
			return currentFoundIndex - nextFoundIndex;
		});

		this.setState(
			{
				selectedAccountIds
			},
			() => {
				WebStorageService.setItem(WebStorageKey.SELECTED_BANK_ACCOUNTS_COCKPIT, selectedAccountIds);
				clearTimeout(this.accountSelectTimer);

				onAccountsChange && onAccountsChange(selectedAccountIds);

				this.accountSelectTimer = setTimeout(() => {
					this.props.fetchNewTransactions(selectedAccountIds);

					setTimeout(() => {
						this.props.fetchBalances(selectedAccountIds);

						setTimeout(() => {
							this.props.fetchCashflow(selectedAccountIds, 0);

							setTimeout(() => {
								this.props.fetchRevenues(selectedAccountIds);
							});
						});
					});
				}, 1000);
			}
		);
	}

	onToggleMultiAccountSummaryCollapsedState() {
		const { isMultiAccountSummaryCollapsed, accounts } = this.state;

		this.setState({ isMultiAccountSummaryCollapsed: !isMultiAccountSummaryCollapsed }, () => {
			setTimeout(() => {
				if (
					!this.state.isMultiAccountSummaryCollapsed &&
					$('.perfect-scrollbar-items').length > 0 &&
					accounts.length > 5
				) {
					this.perfectScrollbar = new PerfectScrollbar('.perfect-scrollbar-items', {
						suppressScrollX: true
					});
				} else if (this.state.isMultiAccountSummaryCollapsed) {
					this.destroyScrollbar();
				}
			}, 0);
		});
	}

	onWindowResize() {
		_.debounce(() => {
			if (this.perfectScrollbar) {
				this.perfectScrollbar.update();
			}
		}, 100);
	}

	updateAccounts() {
		const { selectedAccountIds } = this.state;

		fetchAccounts().then(accountsReponse => {
			const { accounts } = accountsReponse.body.data;
			let initialSyncDone = false;

			if (!this.state.initialSyncDone) {
				if (accounts && accounts.length > 0) {
					accounts.forEach(account => {
						if (account.initialSyncDone) {
							initialSyncDone = true;
						}
					});
				}

				if (!initialSyncDone) {
					clearTimeout(this.updateAccountsTimer);

					if (!this.isUnmounted) {
						this.updateAccountsTimer = setTimeout(() => {
							this.updateAccounts();
						}, 5000);
					}
				}
			} else {
				initialSyncDone = true;
			}

			if (!this.isUnmounted) {
				this.setState({ initialSyncDone }, () => {
					if (this.state.initialSyncDone) {
						this.props.setInitialSyncDone();

						setTimeout(() => {
							this.props.fetchNewTransactions(selectedAccountIds);
						}, 3000);
					}
				});
			}
		});
	}

	render() {
		const { accounts, isMultiAccountSummaryCollapsed, selectedAccountIds } = this.state;
		const { resources } = this.props;
		if (!accounts) {
			return null;
		}

		if (selectedAccountIds.length === 0) {
			selectedAccountIds.push('all');
		}

		const isAllSelected = selectedAccountIds.indexOf('all') !== -1;
		const isSingleSummary = accounts.length === 1;
		let singleAccountSummary = null;
		let multiAccountSummary = null;
		let accountDataSingle = null;
		const accountDataMulti = {
			balance: 0,
			balanceDates: [],
			lastUpdated: '-'
		};
		let accountList = [];
		const isScollableSummaryListExpanded = accounts.length >= 6 && !isMultiAccountSummaryCollapsed;

		if (isSingleSummary) {
			accountDataSingle = {
				name: accounts[0].accountName,
				iban: accounts[0].accountIban ? formatIban(accounts[0].accountIban) : TEXT_NO_IBAN,
				balance: accounts[0].accountBalance ? formatCurrency(accounts[0].accountBalance) : null,
				bankLogo:
					accounts[0].bankLogoSmall &&
					`url(${config.resourceHost + 'banking/images?p=' + accounts[0].bankLogoSmall})`,
				lastUpdated: accounts[0].accountBalanceDate
				// ? formatDate(accounts[0].accountBalanceDate, 'YYYY-MM-DD', 'DD.MM.YYYY')
					? formatClientDate(accounts[0].accountBalanceDate)
					: null
			};

			singleAccountSummary = (
				<div className="widgetContainer box box-large-bottom financecockpit-account-summary-single">
					<div className="blue-box-top">
						<div className="icon-circle">
							<div className="icon icon-banking" />
						</div>
					</div>

					<div className="account-summary">
						<div className="account-summary-row1">
							<div
								className="account-icon"
								style={{
									backgroundImage: accountDataSingle.bankLogo
								}}
							/>
							<div className="account-title">{accountDataSingle.name}</div>
						</div>
						<div className="account-summary-row2">{accountDataSingle.iban}</div>
						<div className="account-summary-row3">{accountDataSingle.balance}</div>
						<div className="account-summary-row4">
							{resources.str_lastUpdated}: {accountDataSingle.lastUpdated}
						</div>
					</div>
				</div>
			);
		} else {
			accounts.forEach(account => {
				accountDataMulti.balance += account.accountBalance;
				accountDataMulti.balanceDates.push(account.accountBalanceDate);
			});

			if (accountDataMulti.balanceDates.length > 0) {
				accountDataMulti.balanceDates = accountDataMulti.balanceDates.map(date => moment(date));
				accountDataMulti.lastUpdated = moment.max(accountDataMulti.balanceDates);
				// accountDataMulti.lastUpdated = formatDate(accountDataMulti.lastUpdated, 'YYYY-MM-DD', 'DD.MM.YYYY');
				accountDataMulti.lastUpdated = formatClientDate(accountDataMulti.lastUpdated);
			}

			if (!isAllSelected) {
				accountDataMulti.balance = 0;
				accountDataMulti.balanceDates = [];

				accounts.forEach(account => {
					if (selectedAccountIds.indexOf(account.id) !== -1) {
						accountDataMulti.balance += account.accountBalance;
						accountDataMulti.balanceDates.push(account.accountBalanceDate);
					}
				});

				accountDataMulti.balanceDates = accountDataMulti.balanceDates.map(date => moment(date));
				accountDataMulti.lastUpdated = moment.max(accountDataMulti.balanceDates);
				// accountDataMulti.lastUpdated = formatDate(accountDataMulti.lastUpdated, 'YYYY-MM-DD', 'DD.MM.YYYY');
				accountDataMulti.lastUpdated = formatClientDate(accountDataMulti.lastUpdated);
			}

			accountList = accounts.map(account => {
				return {
					selected: selectedAccountIds.indexOf(account.id) !== -1 || isAllSelected,
					id: account.id,
					name: account.accountName,
					subTitle: account.accountIban || TEXT_NO_IBAN,
					balance: account.accountBalance,
					bankIconUrl:
						account.bankLogoSmall &&
						`url(${config.resourceHost + 'banking/images?p=' + account.bankLogoSmall})`
				};
			});

			accountList = accountList.sort((a, b) => {
				return b.balance - a.balance;
			});

			if (accountList.length > 2 && isMultiAccountSummaryCollapsed) {
				accountList = accountList.slice(0, 2);
			}

			multiAccountSummary = (
				<div className="widgetContainer box box-large-bottom financecockpit-account-summary-multi">
					{isMultiAccountSummaryCollapsed ? (
						<div className="blue-box-top">
							<div className="icon-circle">
								<div className="icon icon-banking" />
							</div>

							<div className="account-summary">
								<div className="account-summary-row1">{resources.str_overallBalance}</div>
								<div className="account-summary-row2">{formatCurrency(accountDataMulti.balance)}</div>
								<div className="account-summary-row3">
									{resources.str_lastUpdated}: {accountDataMulti.lastUpdated}
								</div>
							</div>
						</div>
					) : null}

					{isMultiAccountSummaryCollapsed ? (
						<div
							className="account-list-header-collapsed-state"
							onClick={() => this.onAccountSelect('all', isAllSelected)}
						>
							<div className="item-left">
								<label className="checkbox" />
								<input
									className="checkbox_input"
									type="checkbox"
									checked={isAllSelected}
									readOnly={true}
								/>
								<span className="checkbox_visual" />
							</div>
							<div>{resources.str_allAccounts}</div>
						</div>
					) : (
						<div className="account-list top-sticky">
							<div
								className="account-list-item"
								onClick={() => this.onAccountSelect('all', isAllSelected)}
							>
								<div className="item-left">
									<label className="checkbox" />
									<input
										className="checkbox_input"
										type="checkbox"
										checked={isAllSelected}
										readOnly={true}
									/>
									<span className="checkbox_visual" />
								</div>
								<div className="item-middle">
									<div className="top-row">
										<div className="account-title">{resources.str_allAccountss}</div>
									</div>
									<div className="bottom-row text-muted">{resources.str_overallBalance}</div>
								</div>
								<div className="item-right">
									<div className="account-balance">{formatCurrency(accountDataMulti.balance)}</div>
								</div>
							</div>

							<div className="bottom-shadow" />
						</div>
					)}

					<div
						className={`account-list perfect-scrollbar-items ${
							isScollableSummaryListExpanded ? 'scrollable-expanded' : ''
						}`}
					>
						{accountList.map((account, idx) => {
							return (
								<div
									key={account.id}
									className={`account-list-item ${idx === accountList.length - 1 ? 'last-item' : ''}`}
									onClick={() => this.onAccountSelect(account.id, account.selected)}
								>
									<div className="item-left">
										<label className="checkbox" />
										<input
											className="checkbox_input"
											type="checkbox"
											checked={account.selected}
											readOnly={true}
										/>
										<span className="checkbox_visual" />
									</div>
									<div className="item-middle">
										<div className="top-row">
											<div className="account-title">
												<div
													className="account-icon"
													style={{
														backgroundImage: account.bankIconUrl || null
													}}
												/>
												{account.name}
											</div>
										</div>
										<div className="bottom-row text-muted">{account.subTitle}</div>
									</div>
									<div className="item-right">
										<div className="account-balance">{formatCurrency(account.balance)}</div>
									</div>
								</div>
							);
						})}

						{isScollableSummaryListExpanded ? (
							<div
								className="account-list-item-footer"
								onClick={() => this.onToggleMultiAccountSummaryCollapsedState()}
							>
								<div>{resources.str_showLess}</div>
								<div className="icon icon-sort_up" />
							</div>
						) : null}
					</div>

					{isScollableSummaryListExpanded ? (
						<div className="financecockpit-account-summary-multi-white-bottom-shadow" />
					) : null}

					{accounts.length > 2 &&
					(accounts.length < 6 || (accounts.length >= 6 && isMultiAccountSummaryCollapsed)) ? (
							<div
								className={`account-list-footer ${isMultiAccountSummaryCollapsed ? '' : 'expanded'}`}
								onClick={() => this.onToggleMultiAccountSummaryCollapsedState()}
							>
								<div>{isMultiAccountSummaryCollapsed ? resources.str_showAll : resources.str_showLess}</div>
								<div
									className={`icon ${isMultiAccountSummaryCollapsed ? 'icon-sort_down' : 'icon-sort_up'}`}
								/>
							</div>
						) : null}
				</div>
			);
		}

		if (this.perfectScrollbar) {
			this.perfectScrollbar.update();
		}

		return (
			<div className="col-xs-6 col-gutter-right-20">
				{isSingleSummary ? singleAccountSummary : multiAccountSummary}
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { isLoadingNewTransactions, errorOccurredNewTransactions, newTransactions } = state.banking.financeCockpit;
	const { resources } = state.language.lang;
	return {
		isLoadingNewTransactions,
		errorOccurredNewTransactions,
		newTransactions,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchNewTransactions: selectedAccountIds => {
			dispatch(fetchNewTransactions(selectedAccountIds));
		},
		fetchBalances: selectedAccountIds => {
			dispatch(fetchBalances(selectedAccountIds));
		},
		fetchCashflow: (selectedAccountIds, monthOffset) => {
			dispatch(fetchCashflow(selectedAccountIds, monthOffset));
		},
		fetchRevenues: selectedAccountIds => {
			dispatch(fetchRevenues(selectedAccountIds));
		},
		setInitialSyncDone: initialSyncDoneOnStartup => {
			dispatch(setInitialSyncDone(initialSyncDoneOnStartup));
		},
		resetCockpit: () => {
			dispatch(resetCockpit());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(FinanceCockpitAccountSummaryComponent);
