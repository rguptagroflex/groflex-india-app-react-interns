import React from 'react';

class LoaderComponent extends React.Component {
	getdefaultProps() {
		return {
			visible: false,
			text: ''
		};
	}

	render() {
		return (
			<div className={this.props.visible ? 'loader' : 'u_hidden'}>
				<div className="loader_content">
					<div className="loader_spinner" />
					<span className="loader_text">{this.props.text}</span>
				</div>
			</div>
		);
	}
}

export default LoaderComponent;
