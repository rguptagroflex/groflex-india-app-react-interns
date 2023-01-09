import React from 'react';

class CollapsableComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isCollapsed: true
		};

		this.collapsableHead = null;
	}

	toggle() {
		const isCollapsed = !this.state.isCollapsed;
		this.setState({ isCollapsed });
	}

	render() {
		const { autoHeadWidth } = this.props;
		const isCollapsed = this.state.isCollapsed;

		return (
			<div className={`collapsable-component ${autoHeadWidth ? 'auto-head-width' : ''}`}>
				<div
					className="collapsable-head-wrapper"
					onClick={() => {
						this.toggle();
					}}
				>
					<div>{this.props.children.map(child => (child.props['data-collapsable-head'] ? child : null))}</div>
					<div className={`icon icon-${isCollapsed ? 'sort_down' : 'sort_up'}`} />
				</div>
				<div className={`collapsable-body-wrapper ${isCollapsed ? '' : 'expanded'}`}>
					{this.props.children.map(child => (child.props['data-collapsable-body'] ? child : null))}
				</div>
			</div>
		);
	}
}

export default CollapsableComponent;
