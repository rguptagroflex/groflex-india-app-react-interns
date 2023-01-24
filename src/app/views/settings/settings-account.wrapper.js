import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import q from 'q';
import Account from 'models/settings/account.model';
import PaymentOption from 'models/payment-option.model';
import SettingsAccountComponent from './settings-account.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class SettingsAccountWrapper extends React.Component {
    constructor(props) {
		super(props);
		
		this.state = {
			preFetchData: null
		};
	}

    componentDidMount() {
		this.preFetch();
	}

    componentWillUnmount() {
		this.ignoreLastFetch = true;
	}

    preFetch ()  {
		const { resources } = this.props;
		const fetchData = () => {
			const requests = [
				invoiz.request(`${config.settings.endpoints.account}`, {
					auth: true
				}),
				invoiz.request(`${config.settings.endpoints.getUserData}`, {
					auth: true,
				}),
				invoiz.request(`${config.settings.endpoints.notification}`, {
					auth: true
				}),
				invoiz.request(config.settings.endpoints.getSubscriptionDetails, {
					auth: true
				}),
				invoiz.request(`${config.resourceHost}tenant/payment/setting`, {
					auth: true
				}),
				invoiz.request(`${config.settings.endpoints.payConditions}`, {
					auth: true
				})
			];

			return q.all(requests);
		};

		const showView = ([
			modelResponse,
			userResponse,
			notificationResponse,
			subscriptionDetailResponse,
			paymentSettingResponse,
			payConditionsResponse
		]) => {
			const {
				body: { data: accountModelData }
			} = modelResponse;
			const {
				body: { data: userData },
			} = userResponse;
			const {
				body: { data: subDetailData }
			} = subscriptionDetailResponse;
			const {
				body: {
					data: { notificatePush, notificateEmail }
				}
			} = notificationResponse;

			if (paymentSettingResponse) {
				const {
					body: {
						data: { invoizPayState }
					}
				} = paymentSettingResponse;
				accountModelData.invoizPayState = invoizPayState;
			}
			if (payConditionsResponse) {
				const {
					body: { data: payConditionsData }
				} = payConditionsResponse;
	
				accountModelData.payConditions = payConditionsData.map(payCondition => {
					return new PaymentOption(payCondition);
				});
			}
			

			accountModelData.user = userData;
			accountModelData.notificatePush = notificatePush;
			accountModelData.notificateEmail = notificateEmail;

			try {
				if (!this.ignoreLastFetch) {
					this.setState({
						preFetchData: {
							account: new Account(accountModelData),
							subscriptionDetail: subDetailData,
							payConditions: accountModelData.payConditions
						}
					});
					if (accountModelData) {
						invoiz.user.mobile = accountModelData.mobile;
					}
				}
			} catch (err) {
				console.log(err);
			}
		};

		const onFetchError = () => {
			invoiz.router.navigate(`/`);
			invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
		};

		fetchData()
			.then(showView)
			.catch(onFetchError);
	};

    render() {
		const { preFetchData } = this.state;
		const { resources, location } = this.props;
		console.log('location', location)
		return preFetchData ? (
			<SettingsAccountComponent
				account={preFetchData.account}
				subscriptionDetail={preFetchData.subscriptionDetail}
				payConditions={preFetchData.payConditions}
				resources={resources}
				pathName={location.pathname}
			/>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.settingsAccountLoadAccountSettings} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(SettingsAccountWrapper);
