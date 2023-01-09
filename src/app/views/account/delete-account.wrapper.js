import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import { connect } from 'react-redux';

class DeleteAccountWrapper extends React.Component {
    componentDidMount() {
		const { resources } = this.props;
		const token = this.props && this.props.match && this.props.match.params && this.props.match.params.token;

		const handleDeleteSuccess = response => {
			invoiz.user.logout(true);
			invoiz.showNotification({ message: resources.accountDeleteSuccessMessage, wrapperClass: 'absolute-top' });
		};

		const handleDeleteError = response => {
			invoiz.router.navigate('/');

			invoiz.showNotification({
				message: resources.accountDeleteErrorMessage,
				type: 'error',
				wrapperClass: 'absolute-top'
			});
		};

		invoiz
			.request(config.account.endpoints.deleteAccount, { method: 'DELETE', data: { token } })
			.then(handleDeleteSuccess)
			.catch(handleDeleteError);
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

export default connect(mapStateToProps)(DeleteAccountWrapper);
