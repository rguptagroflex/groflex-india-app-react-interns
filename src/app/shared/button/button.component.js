import React from 'react';

class ButtonComponent extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			callback: this.props.callback,
			disabled: !!this.props.disabled,
			loading: !!this.props.loading,
			label: this.props.label || null,
			type: this.props.type || 'primary',
			isWide: !!this.props.isWide,
			isSquare: !!this.props.isSquare,
			buttonIcon: this.props.buttonIcon || null
		};
	}

	componentWillReceiveProps (props) {
		this.setState({
			callback: props.callback,
			disabled: !!props.disabled,
			loading: !!props.loading,
			label: props.label || null,
			type: props.type || 'primary',
			isWide: !!props.isWide,
			isSquare: !!props.isSquare,
			buttonIcon: props.buttonIcon || null
		});
	}

	render () {
		const buttonClasses = `button button-${this.state.type} ${!this.state.isSquare ? 'button-rounded' : ''} ${
			this.state.isWide ? 'button-wide' : ''
		}`;
		const buttonIcon = this.state.buttonIcon ? (
			<div className={`icon ${this.state.loading ? 'loader_spinner' : this.state.buttonIcon}`} />
		) : null;
		const { id, dataQsId, customCssClass, wrapperClass } = this.props;

		return (
			<div className={`button-component-wrapper ${wrapperClass || ''}`}>
				<button
					className={`${buttonClasses} ${customCssClass || ''}`}
					disabled={this.state.disabled || this.state.loading}
					onClick={event => this.handleClick(event)}
					data-qs-id={dataQsId}
					id={id}
				>
					{buttonIcon}
					{/* {this.state.label} */}
					<span className="text-content">
						<span>{this.state.label}</span>
						{this.state.subLabel ? <span className="sub-label">{this.state.subLabel}</span> : null}
					</span>
				</button>
			</div>
		);
	}

	handleClick (event) {
		if (typeof this.state.callback === 'function') {
			this.state.callback(event);
		}
	}
}

export default ButtonComponent;
