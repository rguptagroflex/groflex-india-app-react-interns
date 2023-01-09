import { combineReducers } from 'redux';
import taxEstimationStats from './taxEstimationStats';
import onboarding from './onboarding';
import banking from './banking';
import salesExpensesStats from './salesExpensesStats';
import topSalesStats from './topSalesStats';
import invoiceOfferStats from './invoiceOfferStats';
import achievements from './achievements';

export default combineReducers({
	taxEstimationStats,
	onboarding,
	banking,
	salesExpensesStats,
	topSalesStats,
	invoiceOfferStats,
	achievements
});
