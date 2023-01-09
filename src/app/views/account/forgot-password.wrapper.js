import React from 'react';
// import invoiz from 'services/invoiz.service';
import ForgotPasswordComponent from 'views/account/forgot-password.component';

// import { detectDevice } from 'helpers/detectDevice';

class ForgotPasswordWrapper extends React.Component {
    componentDidMount() {
		// if (detectDevice() === 'phone' || detectDevice() === 'tablet') {
		// 	invoiz.router.navigate('/account/mobile');
		// }
	}

    render() {
		return <ForgotPasswordComponent />;
	}
}

export default ForgotPasswordWrapper;
