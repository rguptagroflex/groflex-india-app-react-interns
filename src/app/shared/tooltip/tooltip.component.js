import React from 'react';
import * as ReactDOM from 'react-dom';
import Tether from 'tether';

class TooltipComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isVisible: false,
			isRendered: false,
			targetId: this.props.elementId,
		};

		this.keepOpenTimer = null;

		this.targetMouseOverListener = this.targetMouseOverListener.bind(this);
		this.targetMouseOutListener = this.targetMouseOutListener.bind(this);
		this.outsideClickListener = this.outsideClickListener.bind(this);
	}

	componentDidMount() {
		const { useClickEvent, keepOpenOnHover } = this.props;
		const triggerEvent = useClickEvent ? 'click' : 'mouseover';

		setTimeout(() => {
			$(`#${this.state.targetId}`).off(triggerEvent).on(triggerEvent, this.targetMouseOverListener);

			if (!useClickEvent) {
				$(`#${this.state.targetId}`).off('mouseout').on('mouseout', this.targetMouseOutListener);
			}

			if (keepOpenOnHover) {
				$(this.refs.content).off('mouseover').on('mouseover', this.targetMouseOverListener);

				$(this.refs.content).off('mouseout').on('mouseout', this.targetMouseOutListener);
			}
		}, 0);
	}

	componentWillUnmount() {
		const { useClickEvent, keepOpenOnHover } = this.props;
		const triggerEvent = useClickEvent ? 'click' : 'mouseover';

		this.isUnmounted = true;

		$(`#${this.state.targetId}`).off(triggerEvent, this.targetMouseOverListener);
		$(`#${this.state.targetId}`).off('mouseout', this.targetMouseOutListener);

		if (keepOpenOnHover) {
			$(this.refs.content).off('mouseover', this.targetMouseOverListener);
			$(this.refs.content).off('mouseout', this.targetMouseOutListener);
		}

		this.tether && this.tether.element && this.tether.element.remove();
		this.tether && this.tether.destroy();
	}

	hide() {
		if (this.state.isVisible) {
			document.removeEventListener('click', this.outsideClickListener);
			this.setState({ isVisible: false, isRendered: false });
		}
	}

	outsideClickListener(event) {
		const { keepOpenOnHover } = this.props;

		try {
			const element = ReactDOM.findDOMNode(this);

			if (
				keepOpenOnHover &&
				$(event.target).closest(`#${this.state.targetId}`) &&
				$(event.target).closest(`#${this.state.targetId}`).length > 0
			) {
				return;
			}

			if (element && !element.contains(event.target)) {
				if (!!element && !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)) {
					this.hide();
				}
			}
		} catch (e) {}
	}

	show() {
		const { attachment, targetAttachment, offset } = this.props;

		if (!this.state.isVisible) {
			document.addEventListener('click', this.outsideClickListener);
			this.setState({ isRendered: true });

			this.tether && this.tether.destroy();

			setTimeout(() => {
				if (!this.isUnmounted) {
					this.tether = new Tether({
						element: $(this.refs.content),
						target: $(`#${this.state.targetId}`),
						attachment: attachment || 'bottom left',
						targetAttachment: targetAttachment || 'top left',
						offset: offset || '0 0',
						constraints: [{ to: 'scrollParent', attachment: 'together' }],
					});

					this.setState({ isVisible: true }, () => {
						this.tether.position();

						this.tether && this.tether.destroy();

						this.tether = new Tether({
							element: $(this.refs.content),
							target: $(`#${this.state.targetId}`),
							attachment: attachment || 'bottom left',
							targetAttachment: targetAttachment || 'top left',
							offset: offset || '0 0',
							constraints: [{ to: 'scrollParent', attachment: 'together' }],
						});
					});
				}
			}, 50);
		}
	}

	targetMouseOverListener(event) {
		const { keepOpenOnHover } = this.props;

		if (keepOpenOnHover) {
			clearTimeout(this.keepOpenTimer);
		} else {
			$('.tooltip-component').attr('data-hidden', 'true');
		}

		this.show();
	}

	targetMouseOutListener(event) {
		const { keepOpenOnHover } = this.props;

		if (keepOpenOnHover) {
			clearTimeout(this.keepOpenTimer);

			this.keepOpenTimer = setTimeout(() => {
				this.hide();
			}, 500);
		} else {
			this.hide();
		}
	}

	render() {
		const { maxWidth, isTopMostZindex, translateX, additionalClass } = this.props;

		const wrapperStyle = {
			pointerEvents: this.state.isRendered ? 'auto' : 'none',
			maxWidth: maxWidth || 'auto',
		};

		const contentStyle = {};

		if (translateX) {
			contentStyle.transform = `translateX(${translateX})`;
		}

		return (
			<div
				className={`tooltip-component ${isTopMostZindex ? 'is-top-most' : ''} ${additionalClass || ''} ${
					translateX ? 'has-translate' : ''
				}`}
				style={wrapperStyle}
				data-hidden={!this.state.isVisible}
				ref={'content'}
			>
				<div className="tooltip-content" style={contentStyle}>
					{this.props.children}
				</div>
			</div>
		);
	}
}

export default TooltipComponent;
