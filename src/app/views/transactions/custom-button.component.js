import React from "react";

class CustomButtonComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			callback: this.props.callback,
			disabled: !!this.props.disabled,
			loading: !!this.props.loading,
			label: this.props.label || null,
			type: this.props.type || "primary",
			isWide: !!this.props.isWide,
			isSquare: !!this.props.isSquare,
			buttonIcon: this.props.buttonIcon || null,
			float: this.props.float || null,
			rightIcon: this.props.rightIcon || null,
		};
	}

	componentWillReceiveProps(props) {
		this.setState({
			callback: props.callback,
			disabled: !!props.disabled,
			loading: !!props.loading,
			label: props.label || null,
			type: props.type || "primary",
			isWide: !!props.isWide,
			isSquare: !!props.isSquare,
			buttonIcon: props.buttonIcon || null,
			float: props.float || null,
			rightIcon: props.rightIcon || null,
		});
	}

	render() {
		// console.log(this.state, "button state");
		const buttonClasses = `button button-${this.state.type} ${!this.state.isSquare ? "button-rounded" : ""} ${
			this.state.isWide ? "button-wide" : ""
		} ${this.state.float}`;
		const buttonIcon = this.state.buttonIcon ? (
			<div className={`icon ${this.state.loading ? "loader_spinner" : this.state.buttonIcon}`} />
		) : null;
		const rightIcon = this.state.buttonIcon ? (
			<div
				style={{
					float: "right",
					borderLeft: "2px solid white",
					margin: "0 0 0 40px",
					padding: "0 0 0 14px",
					fontSize: "7px",
				}}
				className={`icon ${this.state.rightIcon}`}
			/>
		) : null;
		const { id, dataQsId, customCssClass, wrapperClass } = this.props;

		return (
			<div
				style={{ marginTop: "17px", lineHeight: 0 }}
				className={`button-component-wrapper ${wrapperClass || ""}`}
			>
				<button
					className={`${buttonClasses} ${customCssClass || ""}`}
					disabled={this.state.disabled || this.state.loading}
					onClick={(event) => this.handleClick(event)}
					data-qs-id={dataQsId}
					id={id}
					style={{ padding: rightIcon ? "0 14px 0 40px" : null }}
				>
					{buttonIcon}
					{/* {this.state.label} */}
					<span className="text-content">
						<span>{this.state.label}</span>
						{this.state.subLabel ? <span className="sub-label">{this.state.subLabel}</span> : null}
					</span>
					{rightIcon}
				</button>
			</div>
		);
	}

	handleClick(event) {
		if (typeof this.state.callback === "function") {
			this.state.callback(event);
		}
	}
}

export default CustomButtonComponent;
