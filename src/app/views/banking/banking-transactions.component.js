import invoiz from 'services/invoiz.service';
import React from 'react';
import { Link } from 'react-router-dom';
import config from 'config';
import moment from 'moment';
import TopbarComponent from 'shared/topbar/topbar.component';
import TopbarBankingPopoverComponent from 'shared/topbar/topbar-banking-popover.component';
import DetailViewHeadComponent from 'shared/detail-view/detail-view-head.component';
import ListComponent from 'shared/list/list.component';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatDate } from 'helpers/formatDate';
import PaginationComponent from 'shared/pagination/pagination.component';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import { updateSelectedAccounts } from 'helpers/updateSelectedAccounts';
import ModalService from 'services/modal.service';
import PopoverComponent from 'shared/popover/popover.component';
import Direction from 'enums/direction.enum';
import CreateExpensesModalComponent from 'shared/modals/create-expenses-modal.component';
import LinkInvoiceModalComponent from 'shared/modals/link-invoice-modal.component';
import FilterComponent from 'shared/filter/filter.component';
import ListSearchComponent from 'shared/list-search/list-search.component';
import { printPdf } from 'helpers/printPdf';
import { fetchAccounts } from 'helpers/banking/fetchAccounts';
import ButtonComponent from 'shared/button/button.component';
import { connect } from 'react-redux';

const itemsPerPage = 20;

const fetchTransactions = (page, orderBy, sortOrder, filter, searchValue) => {
	const limit = itemsPerPage;
	const offset = itemsPerPage * (page - 1);

	let cachedSelectedAccounts = WebStorageService.getItem(WebStorageKey.SELECTED_BANK_ACCOUNTS);
	cachedSelectedAccounts = cachedSelectedAccounts ? cachedSelectedAccounts.join(',') : null;

	if (cachedSelectedAccounts === 'all') {
		cachedSelectedAccounts = null;
	}

	const queryString = `
		?offset=${offset || 0}
		&limit=${limit}
		&orderBy=${orderBy || 'desc'}
		&sortOrder=${sortOrder || 'asc'}
		&filter=${filter || 'all'}
		&searchTerm=${searchValue || ''}
		&accountId=${cachedSelectedAccounts || ''}
	`;

	return invoiz.request(`${config.resourceHost}banking/accounts/transactions${queryString}`, {
		auth: true
	});
};

const createTableFilters = (filterData, activeFilter) => {
	const filters = [];

	if (filterData) {
		const { all, positive, negative } = filterData;

		filters.push(
			{ key: 'all', title: 'Alle', count: all.count, active: activeFilter === 'all', resouceKey: 'all' },
			{ key: 'positive', title: 'Einzahlungen', count: positive.count, active: activeFilter === 'positive', resouceKey: 'deposits' },
			{ key: 'negative', title: 'Auszahlungen', count: negative.count, active: activeFilter === 'negative', resouceKey: 'Payouts' }
		);
	}

	return filters;
};

class BankingTransactionsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			accounts: [],
			allSelected: false,
			columns: [
				{ key: 'accountName', title: 'Konto', width: '200px', resourceKey: 'tenantId' },
				{ key: 'bookingDate', title: 'Datum', width: '120px', sorted: 'desc', resourceKey: 'date' },
				{ key: 'bookingContactName', title: 'Buchung', subValueStyle: { fontWeight: 'normal' }, resourceKey: 'booking' },
				{ key: 'bookingAmount', title: 'Betrag', width: '120px', align: 'right', resourceKey: 'amountTitle' },
				{ key: 'status', title: 'Status', width: '70px', align: 'center', notSortable: true, resourceKey: 'status' }
			],
			currentPage: 1,
			initialSyncDone: false,
			totalPages: 1,
			totalExpenses: 0,
			totalIncome: 0,
			totalBalance: 0,
			rows: [],
			filters: [],
			sortOrder: 'desc',
			orderBy: 'bookingDate',
			activeFilter: 'all',
			searchValue: '',
			validToCreateExpenses: false,
			validToPrint: false,
			printing: false
		};

		this.searchTimer = null;
		this.updateTransactionTimer = null;
	}

	componentDidMount() {
		this.updateTransactions();
	}

	componentWillUnmount() {
		this.isUnmounted = true;
		clearTimeout(this.updateTransactionTimer);
	}

	render() {
		const { resources } = this.props;
		let refreshed = '';

		if (this.state.accounts.length === 0) {
			return null;
		}

		if (this.state.accounts && this.state.accounts[0]) {
			const refreshedToday = moment().diff(this.state.accounts[0].accountBalanceDate, 'days') === 0;
			const format = refreshedToday ? 'HH:mm' : 'DD.MM.YYYY, HH:mm';
			refreshed =
				(refreshedToday ? 'Heute, ' : '') +
				formatDate(this.state.accounts[0].accountBalanceDate, 'YYYY-MM-DD hh:mm', format);
		}

		const rightElements = [
			{
				headline: resources.str_updated,
				value: refreshed
			}
		];

		const leftElements = [
			{
				headline: resources.str_overallBalance,
				value: this.state.totalBalance
			}
		];

		const filterElements = [];
		this.state.filters.forEach((filter, index) => {
			filterElements.push(filter);
		});

		const tableFallbackElement = this.state.initialSyncDone ? (
			<div>{resources.str_noTransactionsFound}</div>
		) : (
			<div className="loading-spinner-wrapper">
				<div className="icon loader_spinner" /> {resources.transactionsRetrievedTakeSeveralMinutesText}
			</div>
		);

		const topbarButtons = [];
		if (this.state.validToCreateExpenses) {
			const selected = this.state.rows.filter(row => row.selected);
			topbarButtons.push({
				label: selected && selected.length > 1 ? resources.str_createExpenses : resources.str_createOutput,
				buttonIcon: 'icon-plus',
				type: 'primary',
				action: 'create-expenses'
			});
		}

		if (this.state.validToPrint) {
			topbarButtons.push({
				disabled: this.state.printing,
				label: resources.str_print,
				buttonIcon: 'icon-print',
				type: 'default',
				action: 'print'
			});
		}

		return (
			<div className="banking-transactions-wrapper wrapper-has-topbar" ref="bankingTransactionsWrapper">
				<TopbarComponent
					title={'Banking'}
					viewIcon="icon-banking"
					buttons={topbarButtons}
					buttonCallback={(event, button) => this.onTopbarButtonClick(button)}
				>
					<TopbarBankingPopoverComponent
						accounts={this.state.accounts}
						onChangeAccounts={() => this.updateTransactions()}
						resources={resources}
					/>
				</TopbarComponent>

				<div className="banking-transactions-head-container">
					<DetailViewHeadComponent leftElements={leftElements} rightElements={rightElements} />

					<div className="banking-transactions-search-wrapper">
						<ListSearchComponent
							value={this.state.searchValue}
							onChange={evt => this.onSearchInput(evt)}
							onDelayFinish={() => this.onSearchInputDelayFinish()}
							placeholder={resources.str_searchtransactions}
						/>
						<FilterComponent items={filterElements} onChange={filter => this.onFilterList(filter)} resources={resources} />
					</div>
				</div>

				<div className="banking-transactions-list-wrapper">
					<div className="box">
						<ListComponent
							allSelected={this.state.allSelected}
							expandable={true}
							expandableHeight={'310px'}
							selectable={true}
							selectedAllCallback={isChecked => this.onSelectedAll(isChecked)}
							selectedCallback={(rowId, isChecked) => this.onSelected(rowId, isChecked)}
							sortable={true}
							columns={this.state.columns}
							columnCallback={column => this.sortTransactions(column)}
							rows={this.state.rows}
							emptyFallbackElement={tableFallbackElement}
							resources={resources}
						/>

						{this.state.totalPages > 1 ? (
							<div className="banking-transaction-pagination">
								<PaginationComponent
									currentPage={this.state.currentPage}
									totalPages={this.state.totalPages}
									onPaginate={page => this.onPaginate(page)}
								/>
							</div>
						) : null}
					</div>
				</div>
			</div>
		);
	}

	createExpenses(transaction) {
		const { resources } = this.props;
		const transactions = [];

		if (!transaction) {
			this.state.rows.forEach(row => {
				if (row.selected) {
					transactions.push(row.transaction);
				}
			});
		} else {
			transactions.push(transaction);
		}

		if (transactions && transactions.length > 0) {
			Promise.all(
				transactions.map(_transaction => {
					return invoiz.request(`${config.resourceHost}expense`, {
						auth: true,
						method: 'POST',
						data: {
							financeApiBankTransactionId: _transaction.id,
							date: _transaction.bookingDate,
							description: _transaction.purposeDescription,
							payDate: _transaction.bookingDate,
							payKind: 'bank',
							payee: _transaction.bookingContactName,
							vatPercent: parseInt(config.defualtVatPercent),
							priceTotal: Math.abs(_transaction.bookingAmount)
						}
					});
				})
			).then(expenseCreateResponses => {
				this.updateTransactions();
				for (let i = 0; i < expenseCreateResponses.length; i++) {
					transactions[i].expense = expenseCreateResponses[0].body.data;
				}
				ModalService.open(<CreateExpensesModalComponent transactions={transactions} resources={resources}/>, {
					width: 700,
					modalClass: 'create-expenses-modal-component'
				});
			});
		}
	}

	deleteExpense(transaction) {
		const { expense } = transaction;
		const { resources } = this.props;
		ModalService.open(
			<div className="ampersand-delete-modal-content">
				<div>{resources.expenseDeleteConfirmText}</div>
				<ul>
					<li>
						<b>{resources.str_receiver}:</b> <span>{expense.payee}</span>
					</li>
					<li>
						<b>{resources.str_documentDate}:</b> <span>{formatDate(expense.date)}</span>
					</li>
					<li>
						<b>{resources.str_amount}:</b> <span>{formatCurrency(expense.priceTotal)}</span>
					</li>
				</ul>
			</div>,
			{
				width: 500,
				headline: resources.expenseDeleteConfirmCaption,
				cancelLabel: resources.str_abortStop,
				confirmIcon: 'icon-trashcan',
				confirmLabel: resources.str_clear,
				confirmButtonType: 'secondary',
				onConfirm: () => {
					ModalService.close();
					invoiz
						.request(
							`${config.resourceHost}expense/${transaction.expense.id}/booking/${transaction.id}/link`,
							{
								auth: true,
								method: 'DELETE'
							}
						)
						.then(() => {
							this.updateTransactions();
						});
				}
			}
		);
	}

	createInvoiceLink(transaction) {
		const { resources } = this.props;
		ModalService.open(
			<LinkInvoiceModalComponent transaction={transaction} paymentCallback={() => this.updateTransactions()} resources= {resources} />,
			{
				afterOpen: () => {
					$('.link-invoice-modal-component input').focus();
				},
				isCloseable: false,
				padding: 40,
				width: 700,
				modalClass: 'link-invoice-modal-component'
			}
		);
	}

	unlinkInvoice(transaction) {
		const { resources } = this.props;
		ModalService.open(resources.solvePaymentMessage, {
			headline: resources.str_solvePayment,
			cancelLabel: resources.str_abortStop,
			confirmLabel: resources.str_toSolve,
			confirmIcon: 'icon-trashcan',
			confirmButtonType: 'secondary',
			onConfirm: () => {
				ModalService.close();
				invoiz
					.request(`${config.resourceHost}invoice/${transaction.invoice.id}/booking/${transaction.id}/link`, {
						auth: true,
						method: 'DELETE'
					})
					.then(() => {
						this.updateTransactions();
					});
			}
		});
	}

	onStatusClick(transaction, isExpense, hasLink, event) {
		event.stopPropagation();
		if (transaction.booked) {
			if (isExpense) {
				if (!hasLink) {
					this.createExpenses(transaction);
				} else {
					this.deleteExpense(transaction);
				}
			} else {
				if (!hasLink) {
					this.createInvoiceLink(transaction);
				} else {
					this.unlinkInvoice(transaction);
				}
			}
		}
	}

	onTopbarButtonClick(button) {
		switch (button.action) {
			case 'create-expenses':
				this.createExpenses();
				break;
			case 'print':
				this.print();
				break;
		}
	}

	onSelectedAll(isChecked) {
		let validToCreateExpenses = false;
		let validToPrint = false;
		const { rows } = this.state;

		if (rows && rows.length > 0) {
			rows.forEach(row => {
				row.selected = !!isChecked;
			});

			if (isChecked) {
				validToPrint = true;
				validToCreateExpenses = true;

				rows.forEach(row => {
					if (!row.isExpense || row.expense) {
						validToCreateExpenses = false;
					}
				});
			}
		}

		this.setState({ rows, allSelected: !!isChecked, validToCreateExpenses, validToPrint });
	}

	onSelected(id, isChecked) {
		let validToCreateExpenses = false;
		let validToPrint = false;

		const row = this.state.rows.find(row => row.id === id);
		if (row) {
			row.selected = !!isChecked;

			const selectedRows = this.state.rows.filter(row => {
				return row.selected;
			});

			if (selectedRows && selectedRows.length > 0) {
				validToPrint = true;
				validToCreateExpenses = true;

				selectedRows.forEach(row => {
					if (!row.isExpense || row.expense) {
						validToCreateExpenses = false;
					}
				});
			}
		}

		this.setState({ rows: this.state.rows, allSelected: false, validToCreateExpenses, validToPrint });
	}

	onSearchInput(val) {
		this.setState({ searchValue: val }, () => {
			clearTimeout(this.searchTimer);

			this.searchTimer = setTimeout(() => {
				this.setState({ totalPages: 0, currentPage: 1 }, () => {
					this.updateTransactions();
				});
			}, 1000);
		});
	}

	onSearchInputDelayFinish() {}

	onPaginate(page) {
		this.setState({ currentPage: page, allSelected: false }, () => {
			this.updateTransactions();
			window.scrollTo(0, 0);
		});
	}

	onFilterList(filter) {
		const filters = this.state.filters;
		filters.forEach(currentFilter => {
			currentFilter.active = currentFilter.key === filter.key;
		});
		this.setState({ totalPages: 0, currentPage: 1, filters, activeFilter: filter.key }, () => {
			this.updateTransactions();
		});
	}

	print() {
		this.setState({ printing: true });
		const rows = this.state.rows.filter(row => row.selected);
		const requestData = [];

		rows.forEach(row => {
			const { transaction } = row;
			const account = this.state.accounts.find(account => account.id === transaction.bankAccountId);
			requestData.push({
				bookingContactName: transaction.bookingContactName,
				iban: transaction.bookingIban,
				bic: transaction.bookingBankIdentifier,
				purpose: transaction.purposeDescription,
				amount: transaction.bookingAmount,
				bookingDate: transaction.bookingDate,
				valutaDate: transaction.valutaDate,
				invoice: transaction.invoice,
				expense: transaction.expense,
				account: {
					name: account.accountName,
					holder: account.accountHolder,
					iban: account.accountIban,
					bank: account.bankName
				}
			});
		});

		printPdf({
			pdfUrl: `${config.resourceHost}banking/transactions/print`,
			isPost: true,
			postData: { transactions: requestData },
			callback: () => {
				this.setState({ printing: false });
			}
		});
	}

	printTransaction(transaction) {
		this.setState({ printing: true }, () => {
			const account = this.state.accounts.find(account => account.id === transaction.bankAccountId);
			const requestData = {
				bookingContactName: transaction.bookingContactName,
				iban: transaction.bookingIban,
				bic: transaction.bookingBankIdentifier,
				purpose: transaction.purposeDescription,
				amount: transaction.bookingAmount,
				bookingDate: transaction.bookingDate,
				valutaDate: transaction.valutaDate,
				invoice: transaction.invoice,
				expense: transaction.expense,
				account: {
					name: account.accountName,
					holder: account.accountHolder,
					iban: account.accountIban,
					bank: account.bankName
				}
			};

			printPdf({
				pdfUrl: `${config.resourceHost}banking/transactions/print`,
				isPost: true,
				postData: { transactions: [requestData] },
				callback: () => {
					this.setState({ printing: false });
				}
			});
		});
	}

	sortTransactions(column) {
		if (!column.notSortable) {
			const columns = this.state.columns;
			columns.forEach(col => {
				if (col.key === column.key) {
					col.sorted = !col.sorted || col.sorted === 'desc' ? 'asc' : 'desc';
					column.sorted = col.sorted;
				} else {
					col.sorted = null;
				}
			});
			this.setState({ columns, orderBy: column.key, sortOrder: column.sorted }, () => {
				this.updateTransactions();
			});
		}
	}

	refresh() {
		this.setState(
			{
				currentPage: 1,
				searchValue: ''
			},
			() => {
				this.updateTransactions();
			}
		);
	}

	updateTransactions() {
		fetchAccounts().then(accountsReponse => {
			const { accounts } = accountsReponse.body.data;
			let initialSyncDone = false;

			const selectedAccounts = updateSelectedAccounts(accounts, WebStorageKey.SELECTED_BANK_ACCOUNTS);

			if (accounts.length === 0) {
				invoiz.router.redirectTo('/banking/setup');
			} else {
				fetchTransactions(
					this.state.currentPage,
					this.state.orderBy,
					this.state.sortOrder,
					this.state.activeFilter,
					this.state.searchValue
				).then(transactionsResponse => {
					const {
						body: { meta, data }
					} = transactionsResponse;

					let totalBalanceUnformatted = 0;

					if (!this.state.initialSyncDone) {
						if (accounts && accounts.length > 0) {
							accounts.forEach(account => {
								if (account.initialSyncDone) {
									initialSyncDone = true;
								}
							});
						}

						if (!initialSyncDone) {
							clearTimeout(this.updateTransactionTimer);
							this.updateTransactionTimer = setTimeout(() => {
								this.updateTransactions();
							}, 5000);
						}
					} else {
						initialSyncDone = true;
					}

					if (selectedAccounts && accounts && accounts.length > 0 && selectedAccounts.length > 0) {
						totalBalanceUnformatted = accounts.reduce((accumulator, currentAccount) => {
							const value =
								selectedAccounts.indexOf('all') >= 0 || selectedAccounts.indexOf(currentAccount.id) >= 0
									? currentAccount.accountBalance
									: 0;
							return accumulator + value;
						}, 0);
					}

					const totalPages = Math.ceil(meta.count / itemsPerPage);
					const rows = this.createTableRows(data.bankAccountTransactions, accounts);
					const filters = createTableFilters(meta.filter, this.state.activeFilter);
					const totalExpenses = formatCurrency(meta.filter.negative.amount);
					const totalIncome = formatCurrency(meta.filter.positive.amount);
					const totalBalance = formatCurrency(totalBalanceUnformatted);

					if (!this.isUnmounted) {
						this.setState(
							{
								rows,
								filters,
								totalPages,
								totalExpenses,
								totalIncome,
								totalBalance,
								accounts,
								initialSyncDone,
								validToCreateExpenses: false,
								validToPrint: false
							},
							() => {
								if (this.refs.bankingTransactionsWrapper) {
									this.setState({ rows, filters, totalPages, accounts, initialSyncDone });
								}
							}
						);
					}
				});
			}
		});
	}

	createTableRows(transactions, accounts) {
		const { resources } = this.props;
		const rows = [];

		if (transactions && accounts) {
			transactions.forEach((transaction, index) => {
				const account = accounts.find(acc => acc.id === transaction.bankAccountId);
				const isExpense = transaction.bookingAmount < 0;
				const hasLink = transaction.expense || transaction.invoice || null;
				let tooltipText;
				let tooltipDescription;
				let statusIcon = 'icon-check';
				let statusColor = '#71BA45';

				if (isExpense) {
					if (hasLink) {
						tooltipText = resources.str_outputCreated;
						tooltipDescription = <Link to={`/expense/edit/${transaction.expense.id}`}>{resources.str_toTheExpense}</Link>;
					} else {
						tooltipText = (
							<div onClick={ev => this.onStatusClick(transaction, true, false, ev)}>
								{resources.str_createOutput}
							</div>
						);
						statusIcon = 'icon-plus';
						statusColor = '#1c7bf1';
					}
				} else {
					if (hasLink) {
						tooltipText = resources.str_invoiceAssigned;
						tooltipDescription = (
							<Link to={`/invoice/${transaction.invoice.id}`}>{transaction.invoice.number}</Link>
						);
					} else {
						tooltipText = (
							<div onClick={ev => this.onStatusClick(transaction, false, false, ev)}>
								{resources.str_assignInvoice}
							</div>
						);
						statusIcon = 'icon-link';
						statusColor = '#1c7bf1';
					}
				}

				rows.push({
					id: index,
					transaction,
					selected: false,
					isExpense,
					expense: transaction.expense,
					invoice: transaction.invoice,
					expandedContent: (
						<div className="transaction-expanded-container">
							<div className="transaction-expanded-row">
								<div className="transaction-expanded-column">
									<div className="transaction-expanded-headline">{resources.str_sender}</div>
									<div className="transaction-expanded-item">
										<div className="transaction-expanded-item-label">{resources.str_name}:</div>
										<div className="transaction-expanded-item-value">
											{(account && account.accountHolder) || ''}
										</div>
									</div>

									<div className="transaction-expanded-item">
										<div className="transaction-expanded-item-label">{resources.str_account}:</div>
										<div className="transaction-expanded-item-value">
											{(account && account.accountName) || ''}
										</div>
									</div>

									<div className="transaction-expanded-item">
										<div className="transaction-expanded-item-label">{resources.str_iban}:</div>
										<div className="transaction-expanded-item-value">
											{(account && account.accountIban) || ''}
										</div>
									</div>

									<div className="transaction-expanded-item">
										<div className="transaction-expanded-item-label">{resources.str_bank}:</div>
										<div className="transaction-expanded-item-value">
											{(account && account.bankName) || ''}
										</div>
									</div>
								</div>
								<div className="transaction-expanded-column">
									<div className="transaction-expanded-headline">
										{isExpense ? resources.str_receiver : resources.str_customerTitle}
									</div>

									<div className="transaction-expanded-item">
										<div className="transaction-expanded-item-label">{resources.str_name}:</div>
										<div className="transaction-expanded-item-value">
											{transaction.bookingContactName}
										</div>
									</div>

									<div className="transaction-expanded-item">
										<div className="transaction-expanded-item-label">{resources.str_iban}:</div>
										<div className="transaction-expanded-item-value">{transaction.bookingIban}</div>
									</div>

									<div className="transaction-expanded-item">
										<div className="transaction-expanded-item-label">{resources.str_bank}:</div>
										<div className="transaction-expanded-item-value">
											{transaction.bookingBankIdentifier}
										</div>
									</div>
								</div>
								<div className="transaction-expanded-column small">
									<div className="transaction-expanded-headline">{resources.str_details}</div>

									<div className="transaction-expanded-item">
										<div className="transaction-expanded-item-label wide">{resources.str_amount}:</div>
										<div className="transaction-expanded-item-value no-truncate">
											{formatCurrency(transaction.bookingAmount)}
										</div>
									</div>

									<div className="transaction-expanded-item">
										<div className="transaction-expanded-item-label wide">{resources.str_posting}:</div>
										<div className="transaction-expanded-item-value no-truncate">
											{formatDate(transaction.bookingDate)}
										</div>
									</div>

									<div className="transaction-expanded-item">
										<div className="transaction-expanded-item-label wide">{resources.str_valueDate}:</div>
										<div className="transaction-expanded-item-value no-truncate">
											{formatDate(transaction.valutaDate)}
										</div>
									</div>
								</div>
							</div>

							<div className="transaction-expanded-row">
								<div className="transaction-expanded-column">
									<div className="transaction-expanded-headline">{resources.str_usage}</div>

									<div className="transaction-expanded-item purpose-description">
										<div className="transaction-expanded-item-value">
											{transaction.purposeDescription}
										</div>
									</div>
								</div>
								<div className="transaction-expanded-column">
									<div className="transaction-expanded-headline">{resources.str_connections}</div>
									{isExpense && hasLink ? (
										<div className="transaction-expanded-item-value">{tooltipDescription}</div>
									) : isExpense && !hasLink ? (
										<div className="transaction-expanded-item-value">{resources.str_noOutputCreated}</div>
									) : null}

									{!isExpense && hasLink ? (
										<div className="transaction-expanded-item-value">
											{resources.str_invoiceNumberUpperCase} {tooltipDescription}
										</div>
									) : !isExpense && !hasLink ? (
										<div className="transaction-expanded-item-value">{resources.str_noInvoiceLinked}</div>
									) : null}
								</div>
							</div>

							<div className="transaction-expanded-row button-row">
								{isExpense && hasLink ? (
									<ButtonComponent
										label={resources.expenseDeleteConfirmCaption}
										type={'secondary'}
										buttonIcon={'icon-close'}
										callback={() => this.deleteExpense(transaction)}
									/>
								) : isExpense && !hasLink ? (
									<ButtonComponent
										label={resources.str_createOutput}
										buttonIcon={'icon-plus'}
										callback={() => this.createExpenses(transaction)}
									/>
								) : null}

								{!isExpense && hasLink ? (
									<ButtonComponent
										label={resources.bankingButtonRemoveLinkText}
										type={'secondary'}
										buttonIcon={'icon-unlink'}
										callback={() => this.unlinkInvoice(transaction)}
									/>
								) : !isExpense && !hasLink ? (
									<ButtonComponent
										label={resources.str_assignInvoice}
										buttonIcon={'icon-link'}
										callback={() => this.createInvoiceLink(transaction)}
									/>
								) : null}

								<ButtonComponent
									label={resources.str_print}
									buttonIcon={'icon-print'}
									type={'default'}
									callback={() => this.printTransaction(transaction)}
								/>
							</div>
						</div>
					),
					cells: [
						{ value: transaction.bankAccountName },
						{ value: formatDate(transaction.bookingDate) },
						{
							value: transaction.bookingContactName,
							subValue: transaction.purposeDescription,
							valueStyle: {
								fontWeight: '600'
							},
							subValueStyle: {
								marginTop: !transaction.bookingContactName ? 0 : '3px',
								fontWeight: 'normal',
								color: '#656768',
								fontSize: '13px'
							}
						},
						{
							value: formatCurrency(transaction.bookingAmount),
							valueStyle: {
								color: transaction.bookingAmount >= 0 ? '#71BA45' : '#fa6e6e',
								textAlign: 'right',
								fontWeight: '600'
							}
						},
						{
							value: (
								<div className={`transaction-row-status ${!transaction.booked ? 'disabled' : ''}`}>
									<div
										id={`row-status-${index}`}
										className="status-mousezone"
										onClick={ev => this.onStatusClick(transaction, isExpense, hasLink, ev)}
									>
										<div
											className={`status-icon icon ${statusIcon}`}
											style={{ background: statusColor }}
										/>
									</div>
									<PopoverComponent
										contentClass={`transaction-row-status-tooltip-content`}
										html={
											<div>
												<div className="tooltip-text">{tooltipText}</div>
												<div className="tooltip-description">{tooltipDescription}</div>
											</div>
										}
										showOnHover={transaction.booked}
										openDirection={Direction.TOP}
										arrowAlignment={Direction.CENTER}
										fixedHeight={hasLink ? 80 : 60}
										fixedWidth={200}
										offsetTop={5}
										offsetLeft={-5}
										alignment={Direction.CENTER}
										elementId={`row-status-${index}`}
									/>
								</div>
							)
						}
					],
					style: {
						background: transaction.new ? '#e9f2fb' : '#fff',
						opacity: transaction.booked ? 1 : 0.5
					}
				});
			});
		}

		return rows;
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(BankingTransactionsComponent);
