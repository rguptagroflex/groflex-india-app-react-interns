import invoiz from 'services/invoiz.service';
import React from 'react';
import { connect } from 'react-redux';
import WidgetComponent from 'shared/dashboard/components/widget.component';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import { formatCurrencySymbolDisplayInFront } from 'helpers/formatCurrency'; // formatCurrency
import { fetchStatsData } from 'redux/ducks/dashboard/invoiceOfferStats';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';

class DashboardInvoiceQuotationStatsComponent extends React.Component {
	componentDidMount() {
		this.refresh();
	}

	navigateToView(url, isInvoiceUrl, itemCount) {
		const webStorageKey = isInvoiceUrl ? WebStorageKey.INVOICE_LIST_SETTINGS : WebStorageKey.OFFER_LIST_SETTINGS;
		let listSettings = WebStorageService.getItem(webStorageKey);
		const currentFilter = itemCount === 0 ? 'all' : isInvoiceUrl ? 'locked' : 'open';

		if (listSettings) {
			listSettings.currentFilter = currentFilter;
		} else {
			listSettings = {
				orderBy: 'date',
				sortDirection: 'desc',
				currentFilter
			};
		}

		WebStorageService.setItem(webStorageKey, {
			orderBy: listSettings.orderBy,
			sortDirection: listSettings.sortDirection,
			currentFilter: listSettings.currentFilter
		});

		invoiz.router.navigate(url);
	}

	render() {
		const { isLoading, errorOccurred, statsData, resources } = this.props;

		const content = errorOccurred ? (
			<div>
				<div className="widgetContainer box invoice-quotation-small-stats-box">
					<WidgetErrorComponent
						reason={resources.str_dataDefaultError}
						buttonTitle={resources.str_updateNow}
						onButtonClick={this.refresh.bind(this)}
						noIcon={true}
					/>
				</div>
				<div className="widgetContainer box invoice-quotation-small-stats-box">
					<WidgetErrorComponent
						reason={resources.str_dataDefaultError}
						buttonTitle={resources.str_updateNow}
						onButtonClick={this.refresh.bind(this)}
						noIcon={true}
					/>
				</div>
				<div className="widgetContainer box invoice-quotation-small-stats-box">
					<WidgetErrorComponent
						reason={resources.str_dataDefaultError}
						buttonTitle={resources.str_updateNow}
						onButtonClick={this.refresh.bind(this)}
						noIcon={true}
					/>
				</div>
			</div>
		) : (
			<div>
				<WidgetComponent loaderText={resources.str_dataLoader} loading={isLoading} containerClass="invoice-quotation-small-stats-box">
					<div className="box-header">
						<div
							className="text-h5 u_mb_0"
							onClick={() => this.navigateToView('/offers', false, statsData.offerStats.count)}
						>
							{resources.dashboardOpenQuotation} <span className="icon icon-arr_right text-muted" />
						</div>
					</div>
					{statsData.offerStats ? (
						<div className="box-content">
							<div className="left-content">
								<div className="stats-label text-muted">{resources.str_amount}</div>
								<div
									className="stats-value"
									onClick={() => this.navigateToView('/offers', false, statsData.offerStats.count)}
								>
									{/* {formatCurrency(statsData.offerStats.total)} */}
									{formatCurrencySymbolDisplayInFront(statsData.offerStats.total)}
								</div>
							</div>
							<div className="right-content">
								<div className="stats-label text-muted">{resources.str_quantity}</div>
								<div
									className="stats-value"
									onClick={() => this.navigateToView('/offers', false, statsData.offerStats.count)}
								>
									{statsData.offerStats.count}
								</div>
							</div>
						</div>
					) : null}
				</WidgetComponent>
				<WidgetComponent loaderText={resources.str_dataLoader} loading={isLoading} containerClass="invoice-quotation-small-stats-box">
					<div className="box-header">
						<div
							className="text-h5 u_mb_0"
							onClick={() => this.navigateToView('/offers', false, statsData.offerStats.count)}
						>
							{resources.str_quotationNotYetInvoiced} <span className="icon icon-arr_right text-muted" />
						</div>
					</div>
					{statsData.offerStatsNotYetInvoiced ? (
						<div className="box-content">
							<div className="left-content">
								<div className="stats-label text-muted">{resources.str_amount}</div>
								<div
									className="stats-value"
									onClick={() => this.navigateToView('/offers', false, statsData.offerStatsNotYetInvoiced.count)}
								>
									{/* {formatCurrency('0000')} */}
									{formatCurrencySymbolDisplayInFront(statsData.offerStatsNotYetInvoiced.total)}
								</div>
							</div>
							<div className="right-content">
								<div className="stats-label text-muted">{resources.str_quantity}</div>
								<div
									className="stats-value"
									onClick={() => this.navigateToView('/offers', false, statsData.offerStatsNotYetInvoiced.count)}
								>
									{statsData.offerStatsNotYetInvoiced.count}
								</div>
							</div>
						</div>
					) : null}
				</WidgetComponent>
				<WidgetComponent loaderText={resources.str_dataLoader} loading={isLoading} containerClass="invoice-quotation-small-stats-box">
					<div className="box-header">
						<div
							className="text-h5 u_mb_0"
							onClick={() => this.navigateToView('/invoices', true, statsData.invoiceStats.count)}
						>
							{resources.dashboardOpenInvoices} <span className="icon icon-arr_right text-muted" />
						</div>
					</div>
					{statsData.invoiceStats ? (
						<div className="box-content">
							<div className="left-content">
								<div className="stats-label text-muted">{resources.str_amount}</div>
								<div
									className="stats-value"
									onClick={() => this.navigateToView('/invoices', true, statsData.invoiceStats.count)}
								>
									{/* {formatCurrency(statsData.invoiceStats.total)} <br/> */}
									{formatCurrencySymbolDisplayInFront(statsData.invoiceStats.total)}
								</div>
							</div>
							<div className="right-content">
								<div className="stats-label text-muted">{resources.str_quantity}</div>
								<div
									className="stats-value"
									onClick={() => this.navigateToView('/invoices', true, statsData.invoiceStats.count)}
								>
									{statsData.invoiceStats.count}
								</div>
							</div>
						</div>
					) : null}
				</WidgetComponent>
			</div>
		);

		return content;
	}

	refresh() {
		this.props.fetchStatsData();
	}
}

const mapStateToProps = state => {
	const { isLoading, errorOccurred, statsData } = state.dashboard.invoiceOfferStats;
	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		statsData,
		resources
	};
};
const mapDispatchToProps = dispatch => {
	return {
		fetchStatsData: () => {
			dispatch(fetchStatsData());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(DashboardInvoiceQuotationStatsComponent);
