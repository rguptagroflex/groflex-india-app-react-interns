import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import { connect } from 'react-redux';

class ChangeEmailAccountWrapper extends React.Component {
    componentDidMount() {
		const { resources } = this.props;
		const token = this.props && this.props.match && this.props.match.params && this.props.match.params.token;

		const handleChangeEmailSuccess = response => {
			invoiz.router.navigate('/settings/account');
			invoiz.showNotification({ message: resources.accountEmailChangedSuccessMessage, wrapperClass: 'absolute-top' });
		};

		const handleChangeEmailError = response => {
			invoiz.router.navigate('/');
			invoiz.showNotification({
				message: resources.accountEmailChangedErrorMessage,
				type: 'error',
				wrapperClass: 'absolute-top'
			});
		};

		invoiz
			.request(config.account.endpoints.confirmEmailChange, { method: 'PUT', data: { token } })
			.then(handleChangeEmailSuccess)
			.catch(handleChangeEmailError);
	}

    render() {
		return <div />;
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return {
		resources
	};
};

export default connect(mapStateToProps)(ChangeEmailAccountWrapper);
