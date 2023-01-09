import React from 'react';
import config from 'config';
import _ from 'lodash';
import invoiz from 'services/invoiz.service';
import { isNil } from 'helpers/isNil';
import RegistrationComponent from 'views/account/registration.component';
import RegistrationViewState from 'enums/account/registration-view-state.enum';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import { parseQueryString } from 'helpers/parseQueryString';
import { connect } from 'react-redux';

class RegistrationWrapper extends React.Component {
	constructor() {
		super();
		this.state = {
			amount: null
		};
	}
    

    componentDidMount() {
		const { resources } = this.props;
		let viewState = this.props.match.params && this.props.match.params.viewState;
		const queryParams = parseQueryString(window.location.search);
		if (queryParams && queryParams.redirectUrl) {
			WebStorageService.removeItem('user');
			WebStorageService.setItem(WebStorageKey.AMAZON_REDIRECT_URL, _.escape(queryParams.redirectUrl));
			WebStorageService.setItem(WebStorageKey.IS_AMAZON_REGISTRATION, true);
			invoiz.router.navigate('/account/register', true, true);
			return;
		}

		if (!viewState && window.dataLayer) {
			window.dataLayer.push({
				regStep: 'register-start',
				event: 'register'
			});
		}

		if (!viewState || viewState === RegistrationViewState.CHANGE_MAIL) {
			viewState = RegistrationViewState.START;
		}

		invoiz
			.request(config.account.endpoints.funFacts, { method: 'GET' })
			.then(response => {
				const { amount } = response.body.data;
				this.setState({ amount, viewState });
			})
			.catch(() => {
				invoiz.showNotification({
					message: resources.defaultErrorMessage,
					type: 'error',
					wrapperClass: 'absolute-top'
				});

				invoiz.router.navigate('/');
			});
	}

    render() {
		const { amount, viewState } = this.state;
		const { resources } = this.props;
		return !isNil(amount) ? <RegistrationComponent invoiceAmount={amount} viewState={viewState} resources={resources} /> : <div />;
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return {
		resources
	};
};

export default connect(mapStateToProps)(RegistrationWrapper);
