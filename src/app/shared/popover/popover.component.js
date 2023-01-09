import React from 'react';
import Direction from 'enums/direction.enum';
import * as ReactDOM from 'react-dom';
import { scrollbarWidth } from 'helpers/scrollbarWidth';

class PopoverComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			contentClass: this.props.contentClass || '',
			cursor: this.props.cursor || 'pointer',
			entries: this.props.entries || [],
			html: this.props.html || '',
			isVisible: false,
			text: this.props.text || '',
			onClick: this.props.onClick,
			showOnHover: !!this.props.showOnHover,
			openDirection: this.props.openDirection || Direction.BOTTOM,
			alignment: this.props.alignment || Direction.RIGHT,
			arrowAlignment: this.props.arrowAlignment || Direction.RIGHT,
			arrowOffset: this.props.arrowOffset || 10,
			elementId: this.props.elementId,
			anchorElementId: this.props.anchorElementId,
			fixedWidth: this.props.fixedWidth || 0,
			fixedHeight: this.props.fixedHeight || 0,
			noPointer: !!this.props.noPointer,
			offsetTop: this.props.offsetTop || 0,
			offsetLeft: this.props.offsetLeft || 0,
			keepOpenOnOutsideClick: !!this.props.keepOpenOnOutsideClick,
			keepOpenOnEntryClick: !!this.props.keepOpenOnEntryClick
		};

		if (!this.props.showOnHover) {
			this.outsideClickListener = this.outsideClickListener.bind(this);
		}

		if (this.props.showOnHover) {
			this.mouseOverListener = this.mouseOverListener.bind(this);
			this.mouseOutListener = this.mouseOutListener.bind(this);
		}

		if (this.props.showOnClick) {
			this.clickListener = this.clickListener.bind(this);
		}

		this.resizeListener = this.resizeListener.bind(this);
		this.scrollListener = this.scrollListener.bind(this);

		this.wrapperRef = null;
		this.hoverTimer = null;
	}

	componentWillReceiveProps(props) {
		this.setState({
			contentClass: props.contentClass || '',
			cursor: props.cursor || 'pointer',
			entries: props.entries || [],
			html: props.html || '',
			text: props.text || '',
			onClick: props.onClick,
			showOnHover: !!props.showOnHover,
			showOnClick: !!props.showOnClick,
			openDirection: props.openDirection || Direction.BOTTOM,
			alignment: props.alignment || Direction.RIGHT,
			arrowAlignment: props.arrowAlignment || Direction.RIGHT,
			arrowOffset: props.arrowOffset || 10,
			elementId: props.elementId,
			anchorElementId: props.anchorElementId,
			fixedWidth: props.fixedWidth || 0,
			fixedHeight: props.fixedHeight || 0,
			offsetTop: props.offsetTop || 0,
			offsetLeft: props.offsetLeft || 0,
			keepOpenOnOutsideClick: !!props.keepOpenOnOutsideClick,
			keepOpenOnEntryClick: !!props.keepOpenOnEntryClick
		});

		if (!props.showOnHover && !this.outsideClickListener) {
			this.outsideClickListener = this.outsideClickListener.bind(this);
		}

		if (props.showOnHover) {
			this.mouseOverListener = this.mouseOverListener.bind(this);
			this.mouseOutListener = this.mouseOutListener.bind(this);
		} else if (props.showOnClick) {
			this.clickListener = this.clickListener.bind(this);
		}
	}

	componentWillUnmount() {
		const referenceElement = document.getElementById(this.state.elementId);

		if (referenceElement) {
			referenceElement.removeEventListener('mouseenter', this.mouseOverListener);
			referenceElement.removeEventListener('mouseleave', this.mouseOutListener);
			referenceElement.removeEventListener('click', this.clickListener);
		}

		if (this.wrapperRef) {
			this.wrapperRef.removeEventListener('mouseenter', this.mouseOverListener);
			this.wrapperRef.removeEventListener('mouseleave', this.mouseOutListener);
		}

		window.removeEventListener('resize', this.resizeListener);
		window.removeEventListener('scroll', this.scrollListener);
	}

	componentDidMount() {
		setTimeout(() => {
			$(`#${this.state.elementId}`).css('cursor', this.state.cursor);
		});

		window.addEventListener('resize', this.resizeListener);
		window.addEventListener('scroll', this.scrollListener);

		if (this.props.showOnHover) {
			setTimeout(() => {
				const referenceElement = document.getElementById(this.state.elementId);
				if (!referenceElement) {
					return;
				}

				referenceElement.addEventListener('mouseenter', this.mouseOverListener);
				referenceElement.addEventListener('mouseleave', this.mouseOutListener);
				this.wrapperRef.addEventListener('mouseenter', this.mouseOverListener);
				this.wrapperRef.addEventListener('mouseleave', this.mouseOutListener);
			});
		}

		if (this.props.showOnClick) {
			
			setTimeout(() => {
				const referenceElement = document.getElementById(this.state.elementId);
				if (!referenceElement) {
					return;
				}

				referenceElement.addEventListener('click', this.clickListener);
			});
		}
	}

	render() {
		let content = null;
		const entries = [];
		let count = 0;

		if (this.state.entries && this.state.entries.length > 0) {
			this.state.entries.forEach((group, gIndex) => {
				if (gIndex > 0) {
					entries.push(<div className="popover-divider" key={`popover-divider-${gIndex}`} />);
				}

				group.forEach(entry => {
					count++;
					const icon = entry.icon ? <div className={`popover-entry-icon ${entry.icon}`} /> : null;
					entries.push(
						<div
							className={`popover-entry ${entry.customEntryClass || ''}`}
							onClick={() => this.handleClick(entry)}
							key={`popover-entry-${count}`}
							data-qs-id={entry.dataQsId}
						>
							{icon}
							<div className="popover-entry-label">{entry.label}</div>
						</div>
					);
				});
			});
		}

		if (entries.length > 0) {
			content = entries;
		} else if (this.state.text) {
			content = <div dangerouslySetInnerHTML={{ __html: this.state.text }} />;
		} else if (this.state.html) {
			content = this.state.html;
		}

		const position = this.calculatePosition();
		const arrowStyle = this.createArrowStyle();

		const wrapperStyle = {
			display: this.state.isVisible ? 'block' : 'none',
			width: this.state.fixedWidth ? this.state.fixedWidth : 'auto',
			height: this.state.fixedHeight ? this.state.fixedHeight : 'auto'
		};

		if (position) {
			wrapperStyle.left = position.left;
			wrapperStyle.top = position.top;
			wrapperStyle.right = position.right;
			wrapperStyle.transform = position.transform;
		}

		return (
			<div className="popover-wrapper" style={wrapperStyle} ref={c => (this.wrapperRef = c)}>
				<div className={this.state.contentClass}>{this.props.children || content}</div>

				<div className="popover-arrow" style={arrowStyle} />
			</div>
		);
	}

	show(delayOutsideClickListener, delay) {
		if (!this.state.isVisible) {
			if (delayOutsideClickListener) {
				setTimeout(() => {
					document.addEventListener('click', this.outsideClickListener);
					this.setState({ isVisible: true }, () => {
						const wrapperRect = this.wrapperRef && this.wrapperRef.getBoundingClientRect();

						if (wrapperRect) {
							if (wrapperRect.top + wrapperRect.height >= $(window).height()) {
								this.setState({ openDirection: Direction.TOP, offsetTop: this.state.offsetTop * -1 });
							}
						}
					});
				}, delay || 0);
			} else {
				document.addEventListener('click', this.outsideClickListener);
				this.setState({ isVisible: true }, () => {
					const wrapperRect = this.wrapperRef && this.wrapperRef.getBoundingClientRect();

					if (wrapperRect) {
						if (wrapperRect.top + wrapperRect.height >= $(window).height()) {
							this.setState({ openDirection: Direction.TOP, offsetTop: this.state.offsetTop * -1 });
						}
					}
				});
			}
		}
	}

	hide() {
		if (this.state.isVisible) {
			document.removeEventListener('click', this.outsideClickListener);
			this.setState({ isVisible: false }, () => {
				this.props.onPopoverHide && this.props.onPopoverHide();
			});
		}
	}

	outsideClickListener(event) {
		if (this.showOnHover || this.state.keepOpenOnOutsideClick) {
			return;
		}

		try {
			const element = ReactDOM.findDOMNode(this);

			if (element && !element.contains(event.target)) {
				if (!!element && !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)) {
					this.hide();
				}
			}
		} catch (e) {}
	}

	clickListener() {
		this.show(true);
		this.props.onElementClicked && this.props.onElementClicked();
	}

	mouseOverListener(event) {
		clearTimeout(this.hoverTimer);
		this.hoverTimer = setTimeout(() => {
			this.setState({ isVisible: true });
		}, 100);
	}

	mouseOutListener(event) {
		clearTimeout(this.hoverTimer);
		this.hoverTimer = setTimeout(() => {
			this.setState({ isVisible: false });
		}, 100);
	}

	resizeListener(event) {
		clearTimeout(this.resizeTimer);
		this.resizeTimer = setTimeout(() => {
			this.calculatePosition();
			this.hide();
		}, 50);
	}

	scrollListener(event) {
		this.hide();
	}

	handleClick(entry) {
		if (this.state.showOnHover) {
			return;
		}

		if (typeof this.state.onClick === 'function') {
			this.state.onClick(entry);
		}

		if (!this.state.keepOpenOnEntryClick) {
			this.hide();
		}
	}

	createArrowStyle() {
		const arrowStyle = {};

		switch (this.state.openDirection) {
			case Direction.TOP:
				arrowStyle.bottom = '-5px';
				break;

			case Direction.BOTTOM:
				arrowStyle.top = '-5px';
				break;
		}

		switch (this.state.arrowAlignment) {
			case Direction.RIGHT:
				arrowStyle.right = this.state.arrowOffset + 'px';
				break;

			case Direction.LEFT:
				arrowStyle.left = this.state.arrowOffset + 'px';
				break;

			case Direction.CENTER:
				arrowStyle.left = '50%';
				arrowStyle.transform = 'translateX(-50%)';
				break;
		}

		return arrowStyle;
	}

	calculatePosition() {
		const referenceElement = document.getElementById(this.state.anchorElementId || this.state.elementId);
		let position = null;

		if (referenceElement) {
			const refRect = referenceElement.getBoundingClientRect();
			let left = 'auto';
			let right =
				window.innerWidth - scrollbarWidth() - (refRect.left + refRect.width + this.state.offsetLeft) + 'px';
			let top = refRect.top + refRect.height + this.state.offsetTop + 'px';

			if (this.state.alignment === Direction.LEFT) {
				right = 'auto';
				left = refRect.left + this.state.offsetLeft + 'px';
			}

			if (this.state.alignment === Direction.CENTER) {
				right = 'auto';
				left = refRect.left + refRect.width / 2 - this.state.fixedWidth / 2 + this.state.offsetLeft + 'px';
			}

			if (this.state.openDirection === Direction.TOP) {
				top = refRect.top - this.state.fixedHeight + this.state.offsetTop + 'px';
			}

			position = {
				top,
				right,
				left
			};

			return position;
		}
	}
}

export default PopoverComponent;
