import React from 'react';
import invoiz from 'services/invoiz.service';
import { Provider } from 'react-redux';
import store from 'redux/store';
import DashboardBankingComponent from 'shared/dashboard/dashboard-banking.component';

class BankingEmptyStateComponent extends React.Component {
	onBankingSetupFinished() {
		invoiz.router.redirectTo('/banking/financecockpit');
	}

	render() {
		return (
			<Provider store={store}>
				<DashboardBankingComponent onBankingSetupFinished={() => this.onBankingSetupFinished()} />
			</Provider>
		);
	}
}

export default BankingEmptyStateComponent;
