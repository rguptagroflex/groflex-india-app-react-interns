import React from 'react';

class DetailViewHeadComponent extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			leftElements: this.props.leftElements || [],
			rightElements: this.props.rightElements || [],
			actionElements: this.props.actionElements || []
		};
	}

	componentWillReceiveProps (props) {
		this.setState({
			leftElements: props.leftElements || [],
			rightElements: props.rightElements || [],
			actionElements: props.actionElements || []
		});
	}

	onControlClick (controlAction, isActive) {
		if (!isActive && this.props.controlActionCallback) {
			this.props.controlActionCallback(controlAction);
		}
	}

	render () {
		const leftElements = [];
		const rightElements = [];
		const actionElements = [];

		this.state.leftElements.forEach((element, index) => {
			leftElements.push(
				<div className={`detail-view-head-entry`} key={`detail-view-head-left-entry-${index}`}>
					<div className="detail-view-head-headline">{element.headline}</div>
					<div className="detail-view-head-value">{element.value}</div>
					<div className="detail-view-head-sub-value">{element.subValue}</div>
				</div>
			);
		});

		this.state.rightElements.forEach((element, index) => {
			rightElements.push(
				<div
					className={`detail-view-head-entry ${
						index === this.state.rightElements.length - 1 ? 'detail-view-head-entry-last' : ''
					}`}
					key={`detail-view-head-right-entry-${index}`}
				>
					<div className="detail-view-head-headline">{element.headline}</div>
					<div className="detail-view-head-value">{element.value}</div>
					<div className="detail-view-head-sub-value">{element.subValue}</div>
				</div>
			);
		});

		this.state.actionElements.forEach((element, index) => {
			const icon = <div className={`icon ${element.actionActive ? 'loader_spinner' : element.icon}`} />;
			actionElements.push(
				<div
					id={element.id}
					className={`detail-view-head-controls-item ${element.controlsItemClass || ''}`}
					key={`detail-view-head-control-${index}`}
					onClick={() => this.onControlClick(element.action, element.actionActive)}
					data-qs-id={element.dataQsId}
				>
					{element.href ? (
						<a href={element.href} target="_blank">
							{icon}
							{element.name}
						</a>
					) : (
						<div>
							{icon}
							{element.name}
						</div>
					)}
				</div>
			);
		});

		const head = (
			<div className="detail-view-head-wrapper">
				<div className="detail-view-head-infos">
					<div className="detail-view-head-left-side">{leftElements}</div>

					<div className="detail-view-head-right-side">{rightElements}</div>
				</div>

				<div className="detail-view-head-controls">{actionElements}</div>
			</div>
		);

		return head;
	}
}

export default DetailViewHeadComponent;
