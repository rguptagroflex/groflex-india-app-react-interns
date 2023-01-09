import React from 'react';

class TimelineComponent extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			isHorizontal: !!this.props.isHorizontal,
			entries: this.props.entries || []
		};
	}

	componentWillReceiveProps (props) {
		this.setState({ isHorizontal: props.isHorizontal, entries: props.entries });
	}

	render () {
		const entries = [];

		const widthStyle = { width: '100%' };
		if (this.state.isHorizontal) {
			switch (this.state.entries.length) {
				case 2:
					widthStyle['width'] = '50%';
					break;

				case 3:
					widthStyle['width'] = '33.3%';
					break;

				case 4:
					widthStyle['width'] = '25%';
					break;

				case 5:
					widthStyle['width'] = '20%';
					break;
			}
		}

		this.state.entries.forEach((entry, index) => {
			entries.push(
				<div
					style={widthStyle}
					key={`timeline-entry-${index}`}
					className={`timeline-entry ${entry.done ? 'timeline-entry-done' : ''}`}
				>
					<div className="timeline-entry-label">{entry.label}</div>
					<div className="timeline-entry-date">{entry.dateText}</div>
				</div>
			);
		});

		let viewportClass = 'timeline-component-horizontal';
		let heightStyle = { height: 'auto' };
		if (!this.state.isHorizontal) {
			entries.reverse();
			heightStyle = { height: (entries.length - 1) * 65 + 30 + 'px' };
			viewportClass = '';
		}

		return (
			<div className={`timeline-component-wrapper ${viewportClass}`} style={heightStyle}>
				<div className="timeline-entries">{entries}</div>
				<div className="timeline-line" style={heightStyle} />
			</div>
		);
	}
}

export default TimelineComponent;
