import React from 'react';
import _ from 'lodash';
import invoiz from 'services/invoiz.service';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import { parseQueryString } from 'helpers/parseQueryString';

class RegistrationWithEmailWrapper extends React.Component {
    componentDidMount() {
		const queryParams = parseQueryString(window.location.search);
		let email = null;

		if (queryParams && queryParams.email) {
			email = decodeURIComponent(_.escape(queryParams.email));
			WebStorageService.removeItem('user');
			WebStorageService.setItem(WebStorageKey.REGISTRATION_EMAIL, email);

			invoiz.router.navigate('/account/register/approve', true, true);
		} else {
			invoiz.router.redirectTo(invoiz.user.loggedIn ? '/' : '/account/login');
		}
	}

    render() {
		return <div />;
	}
}

export default RegistrationWithEmailWrapper;
