import React from 'react';
import { Provider } from 'react-redux';
import invoiz from 'services/invoiz.service';
import TopbarComponent from "shared/topbar/topbar-start-page.component";
// import DashboardTaxEstimationStatsComponent from 'shared/dashboard/dashboard-tax-estimation-stats.component';
// import DashboardOnboardingComponent from 'shared/dashboard/dashboard-onboarding.component';
import DashboardInvoiceExpenseStatsComponent from 'shared/dashboard/dashboard-invoice-expense-stats.component';
import DashboardSalesExpensesStatsComponent from 'shared/dashboard/dashboard-sales-expenses-stats.component';
import DashboardTopSalesStatsArticleComponent from 'shared/dashboard/dashboard-top-sales-stats-article.component';
import DashboardTopSalesStatsComponent from 'shared/dashboard/dashboard-top-sales-stats.component';
// import DashboardInvoiceOfferStatsComponent from 'shared/dashboard/dashboard-invoice-offer-stats.component';
// import DashboardAchievementCenterComponent from 'shared/dashboard/dashboard-achievement-center.component';
// import DashboardQuickButtonsComponent from 'shared/dashboard/dashboard-quick-buttons.component';
// import DashboardBankingComponent from 'shared/dashboard/dashboard-banking.component';
import DashboardSalesByArticleStatsComponent from 'shared/dashboard/dashboard-sales-article-stats.component';
import DashboardQuotationComponent from 'shared/dashboard/dashboard-quotation.component';
import DashboardInvoiceQuotationStatsComponent from 'shared/dashboard/dashborad-invoice-quotation-stats.component';
import store from 'redux/store';
import { scrollToTop } from 'helpers/scrollToTop';
import userPermissions from 'enums/user-permissions.enum';
import DashboardQuotationsPurchaseOrderStatsComponent from 'shared/dashboard/dashboard-quotations-purchase-order-stats.component';
import DashboardReceivablesStatsComponent from 'shared/dashboard/dashboard-receivables-stats.component';
import DashboardUnpaidExpensesStatsComponent from 'shared/dashboard/dashboard-unpaid-expenses-stats.component';
import DashboardSalesByCustomerStatsComponent from '../../shared/dashboard/dashboard-sales-customer-stats.component';
import DashboardExpenseArticleStatsComponent from '../../shared/dashboard/dashboard-expense-article-stats.component';
import DashboardSalesArticleCustomerStatsComponent from '../../shared/dashboard/dashboard-sales-article-customer-stats.component';

class DashboardComponent extends React.Component {
	constructor(props) {
		super(props);
		scrollToTop();
	}

	// render() {
	// 	return (
	// 		<Provider store={store}>
	// 			<div className="dashboard-component-wrapper">
	// 				<DashboardOnboardingComponent />
	// 				<DashboardQuickButtonsComponent />
	// 				<DashboardSalesExpensesStatsComponent />
	// 				<DashboardBankingComponent />
	// 				<div className="row">
	// 					<div className="col-xs-7 col-gutter-right-40">
	// 						<DashboardTopSalesStatsComponent />
	// 					</div>
	// 					<div className="col-xs-5 col-no-gutter-left">
	// 						<DashboardInvoiceOfferStatsComponent />
	// 					</div>
	// 				</div>
	// 				<DashboardTaxEstimationStatsComponent />
	// 				<DashboardAchievementCenterComponent />
	// 			</div>
	// 		</Provider>
	// 	);
	// }
	componentDidMount () {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_DASHBOARD)) {
			invoiz.user.logout(true);
		}
	}
	render() {
		return (
			<Provider store={store}>
				<div className="dashboard-component-wrapper">
					<TopbarComponent
						title={'Dashboard'}
						viewIcon={`icon-dashboard`}
					/>
					{/* <DashboardOnboardingComponent /> */}
					{/* <DashboardQuickButtonsComponent /> */}
					<div className="row" style={{paddingTop: '18px'}}>
						<div className="col-xs-12">
							<DashboardReceivablesStatsComponent />
						</div>
						{/* <div className="col-xs-6">
							<DashboardUnpaidExpensesStatsComponent />
						</div> */}
					</div>
					<div className="row">
						<div className="col-xs-6">
							<DashboardInvoiceExpenseStatsComponent />
						</div>
						<div className="col-xs-6">
							<DashboardQuotationsPurchaseOrderStatsComponent />
						</div>
					</div>
					{/* <div className="row">
						<div className="col-xs-12">
							<DashboardSalesExpensesStatsComponent />
						</div>
					</div> */}
					<div className="row">
						<div className="col-xs-6">
							<DashboardSalesByArticleStatsComponent />
						</div>
						<div className="col-xs-6">
							<DashboardSalesByCustomerStatsComponent />
						</div>
						{/* <div className="col-xs-6">
							<DashboardSalesArticleCustomerStatsComponent />
						</div>
						<div className="col-xs-6">
							<DashboardExpenseArticleStatsComponent />
						</div> */}
					</div>
					{/* <div className="row">
						<div className="col-xs-5 col-gutter-right-10">
							<DashboardInvoiceQuotationStatsComponent />
						</div>
						<div className="col-xs-7 col-no-gutter-left">
							<DashboardQuotationComponent />
						</div>
					</div> */}
					{/* <DashboardBankingComponent /> */}
					<div className="row">
	 					{/* <div className="col-xs-6 col-gutter-right-20">
	 						<DashboardTopSalesStatsComponent />
	 					</div>
						<div className="col-xs-6 col-gutter-left-20">
	 						<DashboardTopSalesStatsArticleComponent />
	 					</div> */}
	 					{/* <div className="col-xs-5 col-no-gutter-left">
	 						<DashboardInvoiceOfferStatsComponent />
	 					</div> */}
	 				</div>
					{/* <DashboardTaxEstimationStatsComponent /> */}
					{/* <DashboardAchievementCenterComponent /> */}
				</div>
			</Provider>
		);
	}
}

export default DashboardComponent;
