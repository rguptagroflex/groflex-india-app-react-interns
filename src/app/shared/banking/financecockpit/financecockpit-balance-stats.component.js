import invoiz from 'services/invoiz.service';
import React from 'react';
import { connect } from 'react-redux';
import LoaderComponent from 'shared/loader/loader.component';
import LineChart from 'shared/charts/line-chart.component';
import { fetchBalances } from 'redux/ducks/banking/financeCockpit';
import store from 'redux/store';

class FinanceCockpitBalanceStatsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			accounts: props.accounts,
			selectedAccountIds: props.selectedAccountIds
		};

		this.storeSubscriber = store.subscribe(() => {
			const { initialSyncDone, initialSyncDoneOnStartup } = store.getState().banking.financeCockpit;

			if (initialSyncDone) {
				this.storeSubscriber();

				if (!initialSyncDoneOnStartup) {
					setTimeout(() => {
						this.props.fetchBalances(this.state.selectedAccountIds);
					}, 3000);
				}
			}
		});
	}

	componentDidMount() {
		const { selectedAccountIds } = this.state;
		this.props.fetchBalances(selectedAccountIds);
	}

	componentWillUnmount() {
		this.storeSubscriber();
	}

	render() {
		const { accounts } = this.state;
		const { isLoadingBalances, errorOccurredBalances, balances, initialSyncDone, resources } = this.props;
		let content = null;

		if (!accounts || isLoadingBalances || !initialSyncDone) {
			content = (
				<div className="widgetContainer box box-large-bottom financecockpit-balance-stats">
					<LoaderComponent visible={true} text={resources.bankingtransactionLoadingText} />
				</div>
			);
		} else if (errorOccurredBalances) {
			content = (
				<div className="widgetContainer box box-large-bottom financecockpit-balance-stats error-occured">
					<WidgetErrorComponent
						reason={resources.str_dataDefaultError}
						buttonTitle={resources.str_reload}
						onButtonClick={() => invoiz.router.reload()}
						noIcon={true}
					/>
				</div>
			);
		} else {
			content = (
				<div className="widgetContainer box box-large-bottom financecockpit-balance-stats">
					<div className="box-header">
						<div className="box-headline u_mb_0">{resources.bankingdevelopmentBalance}</div>
						<div className="box-subheadline text-muted">{resources.forLastNinetyDays}</div>
					</div>

					{balances.series.length > 0 ? (
						<div>
							<LineChart data={balances} tooltipSelector=".ct-chart-line" target="balanceStats" resources={resources} />
						</div>
					) : (
						<div className="empty-state">{resources.noDataAvailable}</div>
					)}
				</div>
			);
		}

		return <div className="col-xs-12">{content}</div>;
	}
}

const mapStateToProps = state => {
	const { isLoadingBalances, errorOccurredBalances, balances, initialSyncDone } = state.banking.financeCockpit;
	const { resources } = state.language.lang;
	return {
		isLoadingBalances,
		errorOccurredBalances,
		balances,
		initialSyncDone,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchBalances: selectedAccountIds => {
			dispatch(fetchBalances(selectedAccountIds));
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(FinanceCockpitBalanceStatsComponent);
