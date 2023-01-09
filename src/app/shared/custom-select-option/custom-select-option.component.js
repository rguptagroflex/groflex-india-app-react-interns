import PropTypes from 'prop-types';
import React from 'react';

class CustomSelectOptionComponent extends React.Component {
    // static propTypes: {
	// 	children: PropTypes.node,
	// 	className: PropTypes.string,
	// 	isDisabled: PropTypes.bool,
	// 	isFocused: PropTypes.bool,
	// 	isSelected: PropTypes.bool,
	// 	onFocus: PropTypes.func,
	// 	onSelect: PropTypes.func,
	// 	option: PropTypes.object.isRequired
	// };

    handleMouseDown (event) {
		event.preventDefault();
		event.stopPropagation();
		this.props.onSelect(this.props.option, event);
	};

    handleMouseEnter (event) {
		this.props.onFocus(this.props.option, event);
	};

    handleMouseMove (event) {
		if (this.props.isFocused) return;
		this.props.onFocus(this.props.option, event);
	};

    render() {
		const { email } = this.props.option;
		return (
			<div
				className={'email-view-select-option'}
				onMouseDown={evt => this.handleMouseDown(evt)}
				onMouseEnter={evt => this.handleMouseEnter(evt)}
				onMouseMove={evt => this.handleMouseMove(evt)}
				title={this.props.option.title}
			>
				<div className="email-view-select-option-value">{this.props.children}</div>
				<div className="email-view-select-option-subvalue">{email}</div>
			</div>
		);
	}
}

export default CustomSelectOptionComponent;
