import React from 'react';
// import invoiz from 'services/invoiz.service';
import LoginComponent from 'views/account/login.component';
import { detectDevice } from 'helpers/detectDevice';

class LoginWrapper extends React.Component {
    componentDidMount() {
		if (detectDevice() === 'phone' || detectDevice() === 'tablet') {
			// invoiz.router.navigate('/account/mobile');
		}
	}

    render() {
		return <LoginComponent />;
	}
}

export default LoginWrapper;
