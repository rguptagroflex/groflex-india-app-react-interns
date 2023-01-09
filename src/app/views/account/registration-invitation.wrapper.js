import React from 'react';
import config from 'config';
import invoiz from 'services/invoiz.service';
import RegistrationInvitationComponent from './registration-invitation.component';

class RegistratioInvitationWrapper extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isExpired: false,
			invalidCode: false,
			temporaryToken: '',
		};
	}

	componentDidMount() {
		const code = this.props && this.props.match && this.props.match.params && this.props.match.params.code;

		invoiz
			.request(`${config.account.endpoints.checkInvitationCode}/${code}`)
			.then((response) => {
				const temporaryToken = response.body && response.body.data;
				if (temporaryToken) {
					this.setState({ temporaryToken });
				}
			})
			.catch((error) => {
				const meta = error.body && error.body.meta;

				if (meta && meta.token && meta.token[0] && meta.token[0].code === 'EXPIRED') {
					this.setState({ isExpired: true });
				} else {
					this.setState({ invalidCode: true });
				}
			});
	}

	render() {
		return (
			<RegistrationInvitationComponent
				isExpired={this.state.isExpired}
				invalidCode={this.state.invalidCode}
				temporaryToken={this.state.temporaryToken}
			/>
		);
	}
}

export default RegistratioInvitationWrapper;