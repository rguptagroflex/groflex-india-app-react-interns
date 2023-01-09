import React from 'react';

class LoadingOverlayComponent extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			visible: false,
			content: null
		};
	}

	render () {
		const { content, visible } = this.state;
		if (!visible) {
			return null;
		}

		return (
			<div className="box loading-overlay-component">
				<div className="loader_spinner" />
				<div className="loading-overlay-content">{content}</div>
			</div>
		);
	}

	show (content) {
		this.setState({ content, visible: true });
	}

	hide () {
		this.setState({ content: null, visible: false });
	}
}

export default LoadingOverlayComponent;
