import React from 'react';
import ResetPasswordComponent from 'views/account/reset-password.component';

class ResetPasswordWrapper extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			token: null
		};
	}
   
    componentDidMount() {
		const token = this.props.match.params && this.props.match.params.hash;
		this.setState({ token });
	}

    render() {
		const { token } = this.state;
		return token ? <ResetPasswordComponent token={token} /> : <div />;
	}
}

export default ResetPasswordWrapper;
