import React from 'react';
import _ from 'lodash';

const FADE_TRANSITION_TIME = 400;
const HIDE_AFTER_TIME = 3500;

class NotificationComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isOpening: true,
			isHiding: false
		};

		this.hideTimeout = null;
		this.removeTimeout = null;
	}

	componentDidMount() {
		setTimeout(() => {
			this.setState({ isOpening: false });
		}, 50);

		this.startTimeouts();
	}

	clearTimeouts() {
		clearTimeout(this.hideTimeout);
		clearTimeout(this.removeTimeout);
	}

	onClick() {
		const { isHiding } = this.state;
		const { id, onClick, onRemove } = this.props;

		if (!isHiding) {
			onClick && onClick();
			onRemove && onRemove(id);
		}
	}

	onRemove() {
		const { isHiding } = this.state;
		const { id, onRemove } = this.props;

		if (!isHiding) {
			onRemove && onRemove(id);
		}
	}

	startTimeouts() {
		this.hideTimeout = setTimeout(() => {
			this.setState({ isHiding: true });

			this.removeTimeout = setTimeout(() => {
				this.props.onRemove && this.props.onRemove(this.props.id);
			}, FADE_TRANSITION_TIME);
		}, HIDE_AFTER_TIME);
	}

	render() {
		const { isHiding, isOpening } = this.state;
		const { title, points, type, svgIcon } = this.props;
		let message = this.props.message;

		if (!_.isString(message)) {
			message = 'error';
		}

		return (
			<div
				className={`notification-component ${isOpening ? 'opening' : ''} ${isHiding ? 'hiding' : ''}`}
				onClick={() => this.onClick()}
				onMouseOver={() => this.clearTimeouts()}
				onMouseOut={() => this.startTimeouts()}
			>
				<div className="icon icon-close2" onMouseUp={() => this.onRemove()} />
				{points ? <div className="points-indicator">+{points}</div> : null}
				<div className="content">
					<div className={`left-col ${type || ''}`}>
						{type ? (
							<div className={`icon icon-${type === 'success' ? 'check_medium' : 'exclamation_mark2'}`} />
						) : null}
						{svgIcon ? <img src={`/assets/images/svg/${svgIcon}.svg`} width="38" height="38" /> : null}
					</div>
					<div className="right-col">
						<div className="title">{title}</div>
						<div className="message" dangerouslySetInnerHTML={{ __html: message }} />
					</div>
				</div>
			</div>
		);
	}
}

export default NotificationComponent;
