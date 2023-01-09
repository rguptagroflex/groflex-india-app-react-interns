import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import PaymentOption from 'models/payment-option.model';
import SettingsPaymentConditionsComponent from './settings-payment-conditions.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class SettingsPaymentConditionsWrapper extends React.Component {
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
		const showView = response => {
			const {
				body: { data }
			} = response;

			const payConditions = data.map(payCondition => {
				return new PaymentOption(payCondition);
			});

			if (!this.ignoreLastFetch) {
				this.setState({
					preFetchData: {
						payConditions
					}
				});
			}
		};

		const onFetchError = () => {
			invoiz.router.navigate(`/`);
			invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
		};

		invoiz
			.request(config.settings.endpoints.payConditions, { auth: true, method: 'GET' })
			.then(showView)
			.catch(onFetchError);
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<SettingsPaymentConditionsComponent payConditions={preFetchData.payConditions} resources={resources} />
		) : (
			<div className="box main">
				<LoaderComponent text={resources.settingsPaymentLoadingPaymentTerms} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(SettingsPaymentConditionsWrapper);
