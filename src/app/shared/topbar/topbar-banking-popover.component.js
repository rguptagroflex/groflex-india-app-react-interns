import invoiz from 'services/invoiz.service';
import React from 'react';
import _ from 'lodash';
import PerfectScrollbar from 'perfect-scrollbar';
import { updateSelectedAccounts, updateSelectedAccountsForAllViews } from 'helpers/updateSelectedAccounts';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import { formatCurrency } from 'helpers/formatCurrency';
import config from 'config';
import ModalService from 'services/modal.service';
import BankAccountSetupComponent from 'shared/modals/bank-account-setup-modal.component';

class TopbarBankingPopoverComponent extends React.Component {
	constructor(props) {
		super(props);

		this.perfectScrollbar = null;

		this.onDocumentClick = this.onDocumentClick.bind(this);
		this.onWindowResize = this.onWindowResize.bind(this);

		let cachedSelectedAccounts = WebStorageService.getItem(WebStorageKey.SELECTED_BANK_ACCOUNTS);

		if (!cachedSelectedAccounts || (cachedSelectedAccounts.length && cachedSelectedAccounts.length === 0)) {
			cachedSelectedAccounts = ['all'];
			WebStorageService.setItem(WebStorageKey.SELECTED_BANK_ACCOUNTS, cachedSelectedAccounts);
		}

		this.state = {
			accounts: [],
			selectedAccountIds: cachedSelectedAccounts,
			isPopoverToggling: false,
			isPopoverVisible: false
		};
	}

	componentDidMount() {
		$(window).on('mousedown', this.onDocumentClick);
		$(window).on('resize', this.onWindowResize);
	}

	componentWillReceiveProps(nextProps) {
		const { resources } = this.props;
		const updatedAccounts = JSON.parse(JSON.stringify(nextProps.accounts));

		let accountBalanceTotal = 0;
		updatedAccounts.forEach(account => (accountBalanceTotal += account.accountBalance));

		updatedAccounts.unshift({
			id: 'all',
			accountName: resources.str_overallBalance,
			accountIban: resources.str_allAccounts,
			accountBalance: accountBalanceTotal
		});

		this.setState(
			{
				accounts: updatedAccounts,
				selectedAccountIds: updateSelectedAccounts(updatedAccounts, WebStorageKey.SELECTED_BANK_ACCOUNTS)
			},
			() => {
				setTimeout(() => {
					if (
						updatedAccounts.length > 0 &&
						!this.perfectScrollbar &&
						$('.topbar-banking-popover-items').length > 0
					) {
						this.perfectScrollbar = new PerfectScrollbar('.topbar-banking-popover-items', {
							suppressScrollX: true
						});
					}
				}, 0);
			}
		);
	}

	componentWillUnmount() {
		this.destroyScrollbar();
		$(window).off('mousedown', this.onDocumentClick);
		$(window).off('resize', this.onWindowResize);
	}

	addAccount() {
		const { resources } = this.props;
		this.togglePopover();

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

	destroyScrollbar() {
		if (this.perfectScrollbar) {
			this.perfectScrollbar.destroy();
		}
	}

	onAccountSelect(accountId, isAccountSelected) {
		const { accounts } = this.state;
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
				WebStorageService.setItem(WebStorageKey.SELECTED_BANK_ACCOUNTS, selectedAccountIds);
				this.props.onChangeAccounts && this.props.onChangeAccounts(selectedAccountIds);
			}
		);
	}

	onDocumentClick(event) {
		const { accounts } = this.state;

		if (
			!$(event.target).hasClass('topbar-banking-popover-title') &&
			!$(event.target).hasClass('topbar-banking-popover-item') &&
			accounts.length > 0
		) {
			this.togglePopover(true);
		}
	}

	onWindowResize() {
		_.debounce(() => {
			if (this.perfectScrollbar) {
				this.perfectScrollbar.update();
			}
		}, 100);
	}

	togglePopover(forceHide) {
		const { isPopoverVisible, isPopoverToggling } = this.state;

		if (!isPopoverToggling) {
			this.setState({
				isPopoverToggling: true,
				isPopoverVisible: forceHide ? !forceHide : !isPopoverVisible
			});

			setTimeout(() => {
				if (this.refs.popover) {
					this.setState({
						isPopoverToggling: false
					});
				}
			}, 400);
		}
	}

	render() {
		const { resources } = this.props;
		const { accounts, selectedAccountIds, isPopoverVisible } = this.state;
		let accountList = [];

		if (accounts.length === 0) {
			return null;
		}

		accountList = accounts.map(account => {
			return {
				selected: selectedAccountIds.indexOf(account.id) !== -1 || selectedAccountIds.indexOf('all') !== -1,
				id: account.id,
				name: account.accountName,
				subTitle: account.accountIban || resources.noIbanAvailable,
				balance: account.accountBalance,
				bankIconUrl:
					account.bankLogoSmall && `url(${config.resourceHost + 'banking/images?p=' + account.bankLogoSmall})`
			};
		});

		if (selectedAccountIds.length === 0) {
			selectedAccountIds.push('all');
		}

		const additionalAccountsLabel =
			selectedAccountIds.length === 2
				? ` + 1 ${resources.str_moreTitle}`
				: selectedAccountIds.length > 2
					? ` + ${selectedAccountIds.length - 1} ${resources.str_more}`
					: '';

		const firstSelectedAccount = accountList.find(account => {
			return account.id === selectedAccountIds[0];
		});

		const popoverTitle = {
			accountName: firstSelectedAccount.id === 'all' ? firstSelectedAccount.subTitle : firstSelectedAccount.name,
			additionalAccountsLabel,
			bankIconUrl: firstSelectedAccount.bankIconUrl
		};

		if (this.perfectScrollbar) {
			this.perfectScrollbar.update();
		}

		return (
			<div className="topbar-banking-popover" ref="popover">
				<div className="topbar-banking-popover-title" onClick={() => this.togglePopover()}>
					<div
						className="account-icon"
						style={{
							backgroundImage: popoverTitle.bankIconUrl || null
						}}
					/>
					<div className="account-title">
						<span className="account-name">{popoverTitle.accountName}</span>{' '}
						<span className="additional-accounts text-muted">{additionalAccountsLabel}</span>
					</div>
					<div className={`popover-arrow icon icon-sort_down ${isPopoverVisible ? 'active' : ''}`} />
				</div>
				<div className={`topbar-banking-popover-items ${isPopoverVisible ? 'visible' : ''}`}>
					{accountList.map(account => {
						return (
							<div
								key={account.id}
								className="topbar-banking-popover-item"
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
										<div className="account-balance">{formatCurrency(account.balance)}</div>
									</div>
									<div className="bottom-row text-muted">{account.subTitle}</div>
								</div>
							</div>
						);
					})}

					<div
						className="topbar-banking-popover-item add-account"
						onClick={() => this.addAccount()}
						data-qs-od="banking-financeCockpit-topbar-btnAddAccount"
					>
						<span className="icon icon-plus add-icon" />
						<span>{resources.str_addAccount}</span>
					</div>
				</div>
			</div>
		);
	}
}

export default TopbarBankingPopoverComponent;
