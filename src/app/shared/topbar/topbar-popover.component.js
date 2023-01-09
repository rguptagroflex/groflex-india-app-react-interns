import React from 'react';

class TopbarPopoverComponent extends React.Component {
	constructor (props) {
		super(props);

		this.onDocumentClick = this.onDocumentClick.bind(this);

		this.state = {
			elements: this.props.elements,
			isPopoverToggling: false,
			isPopoverVisible: false
		};
	}

	componentDidMount () {
		$(window).on('mousedown', this.onDocumentClick);
	}

	componentWillUnmount () {
		$(window).off('mousedown', this.onDocumentClick);
	}

	onElementClick (element) {
		if (this.props.onClick) {
			this.props.onClick(element);
		}
	}

	onDocumentClick (event) {
		const { elements } = this.state;

		if (
			!$(event.target).hasClass('topbar-popover-title') &&
			!$(event.target).hasClass('topbar-popover-item') &&
			elements.length > 0
		) {
			this.togglePopover(true);
		}
	}

	togglePopover (forceHide) {
		const { isPopoverVisible, isPopoverToggling } = this.state;

		if (!isPopoverToggling) {
			this.setState({
				isPopoverToggling: true,
				isPopoverVisible: forceHide ? !forceHide : !isPopoverVisible
			});

			setTimeout(() => {
				if (this.refs.popover) {
					this.setState({
						isPopoverToggling: false
					});
				}
			}, 400);
		}
	}

	render () {
		const { elements, isPopoverVisible } = this.state;

		if (elements.length === 0) {
			return null;
		}

		const activeElement =
			elements.find(element => {
				return element.active;
			}) || elements[0];

		return (
			<div className="topbar-popover" ref="popover">
				<div className="topbar-popover-title" onClick={() => this.togglePopover()}>
					<div className="element-title">
						<span className="element-name">{activeElement.label}</span>
					</div>
					<div className={`popover-arrow icon icon-sort_down ${isPopoverVisible ? 'active' : ''}`} />
				</div>
				<div className={`topbar-popover-items ${isPopoverVisible ? 'visible' : ''}`}>
					{elements.map((element, index) => {
						return element.active ? null : (
							<div
								key={`topbar-popover-item-${index}`}
								className="topbar-popover-item"
								onClick={() => this.onElementClick(element)}
							>
								{element.label}
							</div>
						);
					})}
				</div>
			</div>
		);
	}
}

export default TopbarPopoverComponent;
