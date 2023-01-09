import invoiz from 'services/invoiz.service';
import React from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import PerfectScrollbar from 'perfect-scrollbar';
import LoaderComponent from 'shared/loader/loader.component';
import ListComponent from 'shared/list/list.component';
import store from 'redux/store';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import SVGInline from 'react-svg-inline';
import sonnenliege from 'assets/images/svg/sonnenliege_grau.svg';

class FinanceCockpitNewTransactionsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.perfectScrollbar = null;
		this.onWindowResize = this.onWindowResize.bind(this);

		this.storeSubscriber = store.subscribe(() => {
			const {
				isLoadingNewTransactions,
				errorOccurredNewTransactions,
				newTransactions
			} = store.getState().banking.financeCockpit;

			if (!isLoadingNewTransactions && !errorOccurredNewTransactions && newTransactions.length > 0) {
				setTimeout(() => {
					if ($('.new-transactions-list')[0] && $('.new-transactions-list')[0].length > 0) {
						this.perfectScrollbar = new PerfectScrollbar('.new-transactions-list', {
							suppressScrollX: true
						});

						setTimeout(() => {
							$('.new-transactions-list').scrollTop(0);
							this.perfectScrollbar.update();
						}, 10);
					}
				}, 0);
			} else if (isLoadingNewTransactions || errorOccurredNewTransactions) {
				this.destroyScrollbar();
			}
		});
	}

	componentDidMount() {
		$(window).on('resize', this.onWindowResize);
	}

	componentWillUnmount() {
		this.destroyScrollbar();
		this.storeSubscriber();
		$(window).off('resize', this.onWindowResize);
	}

	destroyScrollbar() {
		if (this.perfectScrollbar) {
			this.perfectScrollbar.destroy();
		}
	}

	onFooterClick() {
		invoiz.router.navigate('/banking/transactions');
	}

	onWindowResize() {
		_.debounce(() => {
			if (this.perfectScrollbar) {
				this.perfectScrollbar.update();
			}
		}, 100);
	}

	render() {
		const { isLoadingNewTransactions, errorOccurredNewTransactions, newTransactions, initialSyncDone, resources } = this.props;
		let content = null;

		const emptyStateContent = (
			<div className="empty-state">
				<SVGInline width="90px" svg={sonnenliege} />
				<div className="empty-state-headline">{resources.str_leanBack}</div>
				<div className="empty-state-subheadline">{resources.notFoundNewTransaction}</div>

				<div className="new-transactions-footer" onClick={() => this.onFooterClick()}>
					<div>{resources.str_toOverview}</div>
					<div className="icon icon-arr_right" />
				</div>
			</div>
		);

		if (isLoadingNewTransactions || !initialSyncDone) {
			content = (
				<div className="widgetContainer box box-large-bottom financecockpit-new-transactions">
					<LoaderComponent visible={true} text={resources.bankingtransactionLoadingText} />
				</div>
			);
		} else if (errorOccurredNewTransactions) {
			content = (
				<div className="widgetContainer box box-large-bottom financecockpit-new-transactions error-occured">
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
				<div className="widgetContainer box box-large-bottom financecockpit-new-transactions">
					<div className="box-header">
						<div className="box-headline u_mb_0">{resources.str_accountStatement}</div>
					</div>

					{newTransactions.length === 0 ? (
						emptyStateContent
					) : (
						<div>
							<div className="new-transactions-list-header">
								<ListComponent
									selectable={false}
									clickable={false}
									sortable={false}
									columns={[
										{
											title: 'Datum',
											width: 80,
											resourceKey: 'date'
										},
										{
											title: 'Empfänger',
											width: 180,
											resourceKey: 'receivers'
										},
										{
											title: 'Betrag',
											align: 'right',
											resourceKey: 'amountTitle'
										}
									]}
									resources={resources}
								/>
							</div>

							<div className="new-transactions-list">
								<ListComponent
									selectable={false}
									clickable={false}
									sortable={false}
									columns={[
										{
											title: '',
											width: 80,
											resourceKey: ''
										},
										{
											title: '',
											width: 180,
											resourceKey: ''
										},
										{
											title: '',
											align: 'right',
											resourceKey: ''
										}
									]}
									rows={newTransactions}
									emptyFallbackElement={resources.str_dataDefaultError}
									resources={resources}
								/>
							</div>

							<div className="new-transactions-footer" onClick={() => this.onFooterClick()}>
								<div>{resources.str_toOverview}</div>
								<div className="icon icon-arr_right" />
							</div>
						</div>
					)}
				</div>
			);
		}

		return <div className="col-xs-6 col-gutter-left-20">{content}</div>;
	}
}

const mapStateToProps = state => {
	const {
		isLoadingNewTransactions,
		errorOccurredNewTransactions,
		newTransactions,
		initialSyncDone
	} = state.banking.financeCockpit;
	const { resources } = state.language.lang;

	return {
		isLoadingNewTransactions,
		errorOccurredNewTransactions,
		newTransactions,
		initialSyncDone,
		resources
	};
};

export default connect(mapStateToProps)(FinanceCockpitNewTransactionsComponent);
