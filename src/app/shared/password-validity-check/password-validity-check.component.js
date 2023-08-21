import React from "react";

// TODO: replace logic in registration and forgot password component with this component
class RegistrationInvitationComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			checkPassword: props.checkPassword || false,
		};

		this.checkPassword = this.checkPassword.bind(this);
	}

	componentDidUpdate(prevProps) {
		if (this.state.checkPassword && prevProps.password !== this.props.password) {
			this.setState({ checkPassword: false });
		}

		if (prevProps.checkPassword !== this.props.checkPassword && this.props.checkPassword) {
			this.checkPassword();
		}
	}

	checkPassword() {
		!this.state.checkPassword &&
			this.setState({
				checkPassword: true,
			});
	}

	render() {
		const { password } = this.props;
		const { checkPassword } = this.state;
		const passwordLengthValid = password.length > 7;
		const passwordAlphaValid = /[A-Z]+/.test(password) && /[a-z]+/.test(password);
		const passwordSpecialValid = /[^a-zA-Z]+/.test(password);

		return (
			<div>
				<div className="password-validity">
					{/* Min. 8 characters */}
					At least 8 characters
					<div
						className={`password-validity-check u_c ${passwordLengthValid ? "checked" : ""} ${
							!passwordLengthValid && checkPassword ? "alert" : ""
						}`}
						onClick={this.checkPassword}
					>
						{passwordLengthValid && <div className="icon icon-check"></div>}
						{!passwordLengthValid && checkPassword && <div className="icon icon-close"></div>}
					</div>
				</div>
				<div className="password-validity">
					{/* Min. 1 Uppercase & lowercase letters */}
					At least 1 number or special character
					<div
						className={`password-validity-check u_c ${passwordAlphaValid ? "checked" : ""} ${
							!passwordAlphaValid && checkPassword ? "alert" : ""
						}`}
						onClick={this.checkPassword}
					>
						{passwordAlphaValid && <div className="icon icon-check"></div>}
						{!passwordAlphaValid && checkPassword && <div className="icon icon-close"></div>}
					</div>
				</div>
				<div className="password-validity">
					{/* Min. 1 Number or special character */}
					At least 1 number or special character
					<div
						className={`password-validity-check u_c ${passwordSpecialValid ? "checked" : ""} ${
							!passwordSpecialValid && checkPassword ? "alert" : ""
						}`}
						onClick={this.checkPassword}
					>
						{passwordSpecialValid && <div className="icon icon-check"></div>}
						{!passwordSpecialValid && checkPassword && <div className="icon icon-close"></div>}
					</div>
				</div>
			</div>
		);
	}
}

export default RegistrationInvitationComponent;
