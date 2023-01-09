import React from 'react';
import invoiz from 'services/invoiz.service';
import { connect } from 'react-redux';
import WidgetComponent from 'shared/dashboard/components/widget.component';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import ButtonComponent from 'shared/button/button.component';
import { formatCurrency } from 'helpers/formatCurrency';
import { fetchBankingData, resetBankingData } from 'redux/ducks/dashboard/banking';
import ModalService from 'services/modal.service';
import BankAccountSetupComponent from 'shared/modals/bank-account-setup-modal.component';
import BarometerComponent from 'shared/barometer/barometer.component';
import PopoverComponent from 'shared/popover/popover.component';
import Direction from 'enums/direction.enum';

class DashboardBankingComponent extends React.Component {
	componentDidMount() {
		this.refresh();

		setTimeout(() => {
			invoiz.on('triggerDashboardBankAccountSetupModal', callback => {
				this.onCreateAccountClick(callback);
			});
		}, 0);
	}

	componentWillUnmount() {
		invoiz.off('triggerDashboardBankAccountSetupModal');
		this.props.resetBankingData();
	}

	onCreateAccountClick(callback) {
		const { onBankingSetupFinished, resources } = this.props;

		ModalService.open(
			<BankAccountSetupComponent
				onFinish={() => {
					invoiz.page.showToast(resources.bankAccoutSetupSuccessMessage);
					this.props.fetchBankingData();

					if (onBankingSetupFinished) {
						onBankingSetupFinished();
					} else {
						callback && callback();
					}
				}}
				resources={resources}
			/>,
			{
				width: 790,
				padding: 0,
				afterClose: isFromCancel => {
					if (!isFromCancel) {
						this.props.fetchBankingData();

						if (onBankingSetupFinished) {
							onBankingSetupFinished();
						} else {
							callback && callback();
						}
					}
				}
			}
		);
	}

	refresh() {
		this.props.fetchBankingData();
	}

	render() {
		const { isLoading, errorOccurred, bankingData, resources } = this.props;

		const showLiquidityOverview = bankingData && bankingData.accountBalanceSum;

		if (!invoiz.user.subscriptionData || (invoiz.user.subscriptionData && !invoiz.user.subscriptionData.tenantId)) {
			return null;
		}

		const currentValue = bankingData.accountBalanceSum;
		const expectedValue =
			bankingData.accountBalanceSum +
			bankingData.invoicesSum +
			bankingData.recurringInvoicesSum -
			bankingData.recurringExpensesSum -
			bankingData.salesTaxSum;

		const currentValueFormatted = formatCurrency(currentValue);
		const expectedValueFormatted = formatCurrency(expectedValue);
		const monthName = resources.monthNames[new Date().getMonth()];

		const recurringExpensesItems =
			bankingData.recurringExpenses &&
			bankingData.recurringExpenses.map((expense, i) => {
				let element;

				if (i < 5) {
					element = (
						<div className="tooltip-expenses-item" key={`tooltip-expense-item-${i}`}>
							<div className="tooltip-expense-name">{expense.recipientName}</div>
							<div className="tooltip-expense-amount">{formatCurrency(expense.amount)}</div>
						</div>
					);
				} else if (i === 5) {
					element = (
						<div
							className="tooltip-expenses-item tooltip-expenses-item-more"
							key={`tooltip-expense-item-more`}
						>
							+ {bankingData.recurringExpenses.length - 5} {resources.str_further}
						</div>
					);
				}

				return element || null;
			});

		const recurringExpensesList =
			recurringExpensesItems && recurringExpensesItems.length > 0 ? (
				<div className="dashboard-banking-liquidity-tooltip-expenses">{recurringExpensesItems}</div>
			) : (
				<div>{resources.dashboardTotalExpensesIncurred}</div>
			);

		const hasRecurringExpenses = recurringExpensesItems && recurringExpensesItems.length > 0;

		const contentLiquidityOverview = (
			<div className="row liquidity-content">
				<div className="col-xs-7 barometer-wrapper">
					<div className="text-h4 baromter-headline">{resources.dashboardLiquidityBarometer}</div>
					<div className="text-muted baromter-sub-headline">{resources.dashboardPossibleDevelopmentEnd} {monthName}</div>
					<BarometerComponent currentValue={currentValue} expectedValue={expectedValue} resources={resources} />
				</div>
				<div className="col-xs-5 liquidity-values">
					<ul>
						<li className="liquidity-current">
							{resources.str_balanceToday}
							<span>{currentValueFormatted}</span>
						</li>
						<li id="liquidity-tooltip-anchor-invoices" data-qs-id="liquidity-tooltip-anchor-invoices">
							{resources.str_bills}
							<span>
								{bankingData.invoicesSum >= 0 ? '+ ' : '- '}
								{formatCurrency(bankingData.invoicesSum)}
							</span>
							<PopoverComponent
								contentClass={`dashboard-banking-liquidity-tooltip`}
								html={<div>{resources.dashboardInvoicesDue}</div>}
								showOnHover={true}
								arrowAlignment={Direction.LEFT}
								alignment={Direction.CENTER}
								fixedWidth={250}
								offsetTop={20}
								offsetLeft={-15}
								cursor={`help`}
								elementId={`liquidity-tooltip-anchor-invoices`}
							/>
						</li>
						{bankingData.recurringInvoicesSum ? (
							<li
								id="liquidity-tooltip-anchor-recinvoices"
								data-qs-id="liquidity-tooltip-anchor-recinvoices"
							>
								{resources.str_recurringBills}
								<span>
									{bankingData.recurringInvoicesSum >= 0 ? '+ ' : '- '}
									{formatCurrency(bankingData.recurringInvoicesSum)}
								</span>
								<PopoverComponent
									contentClass={`dashboard-banking-liquidity-tooltip`}
									html={<div>{resources.dashboardSubscriptionBillsDue}</div>}
									showOnHover={true}
									arrowAlignment={Direction.LEFT}
									alignment={Direction.CENTER}
									fixedWidth={250}
									offsetTop={20}
									offsetLeft={-15}
									cursor={`help`}
									elementId={`liquidity-tooltip-anchor-recinvoices`}
								/>
							</li>
						) : null}
						{bankingData.salesTaxSum ? (
							<li id="liquidity-tooltip-anchor-taxes" data-qs-id="liquidity-tooltip-anchor-taxes">
								{resources.str_valueAddedTax} <small>({resources.str_anfallend})</small>
								<span>
									{bankingData.salesTaxSum >= 0 ? '- ' : '+ '}
									{formatCurrency(bankingData.salesTaxSum)}
								</span>
								<PopoverComponent
									contentClass={`dashboard-banking-liquidity-tooltip`}
									html={<div>{resources.dashboardSalesTaxDue}</div>}
									showOnHover={true}
									arrowAlignment={Direction.LEFT}
									alignment={Direction.CENTER}
									fixedWidth={250}
									offsetTop={20}
									offsetLeft={-15}
									cursor={`help`}
									elementId={`liquidity-tooltip-anchor-taxes`}
								/>
							</li>
						) : null}
						<li id="liquidity-tooltip-anchor-expenses" data-qs-id="liquidity-tooltip-anchor-expenses">
							{resources.str_expenses} <small>({resources.str_recurrently})</small>
							<span>
								{bankingData.recurringExpensesSum >= 0 ? '- ' : '+ '}
								{formatCurrency(bankingData.recurringExpensesSum)}
							</span>
							<PopoverComponent
								contentClass={`dashboard-banking-liquidity-tooltip`}
								html={recurringExpensesList}
								showOnHover={true}
								arrowAlignment={Direction.LEFT}
								alignment={Direction.CENTER}
								fixedWidth={hasRecurringExpenses ? 300 : 250}
								offsetTop={20}
								offsetLeft={hasRecurringExpenses ? 10 : -15}
								cursor={`help`}
								elementId={`liquidity-tooltip-anchor-expenses`}
							/>
						</li>
						<li className={`liquidity-expected ${expectedValue < 0 && 'liquidity-negative'}`}>
							{resources.str_endBalance} {monthName}
							<span>{expectedValueFormatted}</span>
						</li>
					</ul>
				</div>
			</div>
		);

		const contentOnlineBankingSetup = (
			<div className="row">
				<div className="col-xs-7 dashboard-banking-left">
					<h3 className="text-h3">{resources.dashboardLinkBankAccountNowText}</h3>
					<ul>
						<li>{resources.dashboardCurrentAccountBalance}</li>
						<li>{resources.dashboardAutomaticPaymentAdjustment}</li>
						<li>{resources.dashboardLinkDepositsWithdrawals}</li>
					</ul>
					<ButtonComponent label="Bankkonto verknüpfen" callback={() => this.onCreateAccountClick()} />
				</div>
				<div className="col-xs-5 dashboard-banking-right">
					<div className="big-icon">
						<img src="/assets/images/svg/coins.svg" width="88px" height="88px" />
					</div>
					<h4 className="text-h4">{resources.str_banking}</h4>
					<div className="dashboard-banking-subheadline">{resources.dashboardLiquidityPlanningEasy}</div>
				</div>
			</div>
		);

		const content = errorOccurred ? (
			<div>
				<WidgetErrorComponent
					reason={resources.str_dataDefaultError}
					buttonTitle={resources.str_updateNow}
					onButtonClick={this.refresh.bind(this)}
				/>
			</div>
		) : showLiquidityOverview ? (
			contentLiquidityOverview
		) : (
			contentOnlineBankingSetup
		);

		return showLiquidityOverview ? (
			<WidgetComponent
				loaderText={resources.str_dataLoader}
				loading={isLoading}
				containerClass={`box-large-bottom ${
					showLiquidityOverview ? 'dashboard-liquidity-wrapper box-small-padding' : ''
				} ${errorOccurred || isLoading ? 'loading' : ''} dashboard-banking-component-wrapper`}
			>
				{content}
			</WidgetComponent>
		) : null;
	}
}

const mapStateToProps = state => {
	const { isLoading, errorOccurred, bankingData } = state.dashboard.banking;
	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		bankingData,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchBankingData: () => {
			dispatch(fetchBankingData());
		},
		resetBankingData: () => {
			dispatch(resetBankingData());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(DashboardBankingComponent);
