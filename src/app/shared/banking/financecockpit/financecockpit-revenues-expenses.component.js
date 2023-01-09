import invoiz from 'services/invoiz.service';
import React from 'react';
import { connect } from 'react-redux';
import LoaderComponent from 'shared/loader/loader.component';
import { fetchRevenues } from 'redux/ducks/banking/financeCockpit';
import store from 'redux/store';
import ListComponent from 'shared/list/list.component';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import SVGInline from 'react-svg-inline';
import kurbel from 'assets/images/svg/kurbel_grau.svg';
import sparschwein from 'assets/images/svg/sparschwein_grau.svg';

const TABLE_COLLAPSED_ITEM_COUNT = 5;
const TABLE_CELL_HEIGHT = 60;
const TABLE_HEAD_HEIGHT = 40;

class FinanceCockpitRevenuesExpensesComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			accounts: props.accounts,
			selectedAccountIds: props.selectedAccountIds,
			isRevenuesListCollapsed: true,
			isExpensesListCollapsed: true
		};

		this.storeSubscriber = store.subscribe(() => {
			const { initialSyncDone, initialSyncDoneOnStartup } = store.getState().banking.financeCockpit;

			if (initialSyncDone) {
				this.storeSubscriber();

				if (!initialSyncDoneOnStartup) {
					setTimeout(() => {
						this.props.fetchRevenues(this.state.selectedAccountIds);
					}, 3000);
				}
			}
		});
	}

	componentDidMount() {
		this.props.fetchRevenues(this.state.selectedAccountIds);
	}

	componentWillUnmount() {
		this.storeSubscriber();
	}

	onToggleExpensesList() {
		const { isExpensesListCollapsed } = this.state;
		this.setState({ isExpensesListCollapsed: !isExpensesListCollapsed });
	}

	onToggleRevenuesList() {
		const { isRevenuesListCollapsed } = this.state;
		this.setState({ isRevenuesListCollapsed: !isRevenuesListCollapsed });
	}

	render() {
		const {
			isLoadingRevenues,
			isLoadingExpenses,
			errorOccurredRevenues,
			errorOccurredExpenses,
			revenues,
			expenses,
			initialSyncDone,
			resources
		} = this.props;

		const { accounts, isExpensesListCollapsed, isRevenuesListCollapsed } = this.state;

		let content = null;

		const emptyStateContentRevenues = (
			<div className="empty-state">
				<SVGInline width="70px" svg={kurbel} />
				<div className="empty-state-headline">{resources.emptyStateContentRevenueText}</div>
				<div className="empty-state-subheadline">{resources.emptyStateContentRevenueSubHeadline}</div>
			</div>
		);

		const emptyStateContentExpenses = (
			<div className="empty-state expenses">
				<SVGInline width="110px" svg={sparschwein} />
				<div className="empty-state-headline">{resources.emptyStateContentExpensesText}</div>
				<div className="empty-state-subheadline">{resources.emptyStateContentExpensesSubHeadline}</div>
			</div>
		);

		if (!initialSyncDone || !accounts) {
			content = (
				<div className="widgetContainer box box-large-bottom financecockpit-revenues-expenses">
					<LoaderComponent visible={true} text={resources.bankingtransactionLoadingText} />
				</div>
			);
		} else {
			content = (
				<div className="widgetContainer box box-large-bottom financecockpit-revenues-expenses">
					<div className="box-header">
						<div className="box-headline">{resources.expectedRevenue}</div>
					</div>

					{errorOccurredRevenues ? (
						<WidgetErrorComponent
							reason={resources.revenueNotLoadedText}
							buttonTitle={resources.str_reload}
							onButtonClick={() => invoiz.router.reload()}
							noIcon={true}
						/>
					) : isLoadingRevenues ? (
						<div className="empty-state">
							<LoaderComponent visible={true} text={resources.revenueChargedText} />
						</div>
					) : revenues.length > 0 ? (
						<div>
							<div
								className="table-wrapper"
								style={{
									height:
										revenues.length > TABLE_COLLAPSED_ITEM_COUNT && isRevenuesListCollapsed
											? `${TABLE_CELL_HEIGHT * TABLE_COLLAPSED_ITEM_COUNT +
													TABLE_HEAD_HEIGHT +
													50}px`
											: 'auto'
								}}
							>
								<ListComponent
									selectable={false}
									clickable={false}
									sortable={false}
									columns={[
										{
											title: 'Datum',
											width: 150,
											resourceKey: 'date'
										},
										{
											title: 'Empfänger',
											resourceKey: 'receivers'
										},
										{
											title: 'Rhythmus',
											width: 120,
											resourceKey: 'rhythm'
										},
										{
											title: 'Betrag',
											width: 120,
											align: 'right',
											resourceKey: 'amountTitle'
										}
									]}
									rows={revenues}
									emptyFallbackElement={resources.str_dataDefaultError}
									resources={resources}
								/>
							</div>

							{revenues.length > TABLE_COLLAPSED_ITEM_COUNT ? (
								<div className="table-footer" onClick={() => this.onToggleRevenuesList()}>
									{isRevenuesListCollapsed ? (
										<div className="revenues-expenses-list-white-bottom-shadow" />
									) : null}

									<div>{isRevenuesListCollapsed ? resources.str_showAll : resources.str_showLess}</div>
									<div
										className={`icon ${
											isRevenuesListCollapsed ? 'icon-sort_down' : 'icon-sort_up'
										}`}
									/>
								</div>
							) : null}
						</div>
					) : (
						emptyStateContentRevenues
					)}

					<div className="table-separator" />

					<div className="box-header table-expenses-header">
						<div className="box-headline">{resources.expectedExpenses}</div>
					</div>

					{errorOccurredExpenses ? (
						<WidgetErrorComponent
							reason={resources.expenseNotLoadedText}
							buttonTitle={resources.str_reload}
							onButtonClick={() => invoiz.router.reload()}
							noIcon={true}
						/>
					) : isLoadingExpenses ? (
						<div className="empty-state">
							<LoaderComponent visible={true} text={resources.bankingExpenseLoadText} />
						</div>
					) : expenses.length > 0 ? (
						<div>
							<div
								className="table-wrapper"
								style={{
									height:
										expenses.length > TABLE_COLLAPSED_ITEM_COUNT && isExpensesListCollapsed
											? `${TABLE_CELL_HEIGHT * TABLE_COLLAPSED_ITEM_COUNT +
													TABLE_HEAD_HEIGHT +
													50}px`
											: 'auto'
								}}
							>
								<ListComponent
									selectable={false}
									clickable={false}
									sortable={false}
									columns={[
										{
											title: 'Datum',
											width: 150,
											resourceKey: 'date'
										},
										{
											title: 'Empfänger',
											resourceKey: 'receivers'
										},
										{
											title: 'Rhythmus',
											width: 120,
											resourceKey: 'rhythm'
										},
										{
											title: 'Betrag',
											width: 120,
											align: 'right',
											resourceKey: 'amountTitle'
										}
									]}
									rows={expenses}
									emptyFallbackElement={resources.str_dataDefaultError}
									resources={resources}
								/>
							</div>

							{expenses.length > TABLE_COLLAPSED_ITEM_COUNT ? (
								<div className="table-footer" onClick={() => this.onToggleExpensesList()}>
									{isExpensesListCollapsed ? (
										<div className="revenues-expenses-list-white-bottom-shadow" />
									) : null}

									<div>{isExpensesListCollapsed ? resources.str_showAll : resources.str_showLess}</div>
									<div
										className={`icon ${
											isExpensesListCollapsed ? 'icon-sort_down' : 'icon-sort_up'
										}`}
									/>
								</div>
							) : null}
						</div>
					) : (
						emptyStateContentExpenses
					)}
				</div>
			);
		}

		return <div className="col-xs-12">{content}</div>;
	}
}

const mapStateToProps = state => {
	const {
		isLoadingRevenues,
		isLoadingExpenses,
		errorOccurredRevenues,
		errorOccurredExpenses,
		revenues,
		expenses,
		initialSyncDone
	} = state.banking.financeCockpit;
	const { resources } = state.language.lang;

	return {
		isLoadingRevenues,
		isLoadingExpenses,
		errorOccurredRevenues,
		errorOccurredExpenses,
		revenues,
		expenses,
		initialSyncDone,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchRevenues: selectedAccountIds => {
			dispatch(fetchRevenues(selectedAccountIds));
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(FinanceCockpitRevenuesExpensesComponent);
