import React from "react";
import _ from "lodash";
import SVGInline from "react-svg-inline";
import toastSuccess from "../../../assets/images/svg/toastSuccess.svg";
import toastError from "../../../assets/images/svg/toastError.svg";

const FADE_TRANSITION_TIME = 400;
const HIDE_AFTER_TIME = 3500;
// const HIDE_AFTER_TIME = 35777700;

class NotificationComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isOpening: true,
			isHiding: false,
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
			message = "error";
		}

		return (
			<div
				className={`notification-component ${type === "success" ? "successBg" : "errorBg"} ${
					isOpening ? "opening" : ""
				} ${isHiding ? "hiding" : ""}`}
				onClick={() => this.onClick()}
				onMouseOver={() => this.clearTimeouts()}
				onMouseOut={() => this.startTimeouts()}
			>
				<div className="icon icon-close2" onMouseUp={() => this.onRemove()} />
				{points ? <div className="points-indicator">+{points}</div> : null}
				<div className="content">
					<div className="type-box">
						<div className={`left-col ${type || ""}`}>
							{type ? (
								// <div className={`icon icon-${type === "success" ? "check_medium" : "exclamation_mark2"}`} />
								<SVGInline
									svg={type === "success" ? toastSuccess : toastError}
									width="21px"
									height="21px"
								/>
							) : null}
							{/* {svgIcon ? <img src={`/assets/images/svg/${svgIcon}.svg`} width="38" height="38" /> : null} */}
						</div>
						<div className="right-col">
							<div className="title">{title}</div>
							{/* <div className="message" dangerouslySetInnerHTML={{ __html: message }} /> */}
							<div
								className="message text-h3"
								// dangerouslySetInnerHTML={{ __html: type === "success" ? "Success" : "Error" }}
							>
								{type === "success" ? "Success" : "Error"}
							</div>
						</div>
					</div>
					<div className="notification-message">{message}</div>
				</div>
			</div>
		);
	}
}

export default NotificationComponent;
