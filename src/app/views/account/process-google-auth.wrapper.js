import React from 'react';
import config from 'config';
import invoiz from 'services/invoiz.service';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import SharedDataService from 'services/shared-data.service';
import { parseQueryString } from 'helpers/parseQueryString';

class ProcessGoogleAuthWrapper extends React.Component {

	handleGoogleResponse() {
		const queryParams = parseQueryString(window.location.search);
		if (queryParams && queryParams.code) {
			invoiz
				.request(`${config.resourceHost}session/googleLoginOrSignup`, {
					method: 'POST',
					data: {
						code: decodeURIComponent(queryParams.code)
					}
				})
				.then(response => {
					SharedDataService.set('google-oauth-login-error', null);
					WebStorageService.setItem(WebStorageKey.RETURN_AFTER_LOGIN, '/');
					return invoiz.user.login(response).then(redirectTo => {
						invoiz.router.navigate(redirectTo);
					});
				}).catch(error => {
					SharedDataService.set('google-oauth-login-error', error);
					invoiz.router.navigate('/');
				});
		}
	}

    componentDidMount() {
		this.handleGoogleResponse(true);
	}

    render() {
		return null;
	}
}

export default ProcessGoogleAuthWrapper;
