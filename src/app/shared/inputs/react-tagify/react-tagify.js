import React from 'react';
import Tagify from '@yaireo/tagify/dist/tagify.min.js';

class Tags extends React.Component {
	constructor(props) {
		super(props);

		this._handleRef = this._handleRef.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onTagAdd = this.onTagAdd.bind(this);
		this.onTagRemove = this.onTagRemove.bind(this);
		this.onDropdownShow = this.onDropdownShow.bind(this);
		this.onDropdownHide = this.onDropdownHide.bind(this);

		this.state = {
			tagAdded: false,
		};
	}

	componentDidMount() {
		if (this.props.value) this.component.value = this.props.value;

		this.tagify = new Tagify(this.component, this.props.settings || {});
		this.applyOverrides();

		if (this.tagify && this.props.onInput) {
			this.tagify.on('input', (evt) => {
				this.props.onInput(evt, this.tagify.value);
			});
		}

		if (this.tagify) {
			this.tagify.on('add', this.onTagAdd);
			this.tagify.on('dropdown:show', this.onDropdownShow);
			this.tagify.on('dropdown:hide', this.onDropdownHide);
			this.tagify.on('remove', this.onTagRemove);
		}

		this.tagify.DOM.input.addEventListener('keydown', this.onKeyDown);
		this.tagify.DOM.input.addEventListener('keyup', this.onKeyUp);
		this.tagify.DOM.input.addEventListener('paste', this.onPaste);
	}

	componentWillUnmount() {
		this.tagify.DOM.input.removeEventListener('keydown', this.onKeyDown);
		this.tagify.DOM.input.removeEventListener('keyup', this.onKeyUp);
		this.tagify.DOM.input.removeEventListener('paste', this.onPaste);

		this.tagify.dropdown.hide.call(this.tagify);
		clearTimeout(this.tagify.dropdownHide__bindEventsTimeout);
	}

	componentDidUpdate(prevProps) {
		if (
			prevProps.disabled !== this.props.disabled &&
			this.props.disabled &&
			this.props.disabled === true &&
			this.tagify.DOM.input
		) {
			setTimeout(() => {
				$(this.tagify.DOM.input).blur();
			});
		}
	}

	applyOverrides() {
		// Override original "position" method to make suggestions dropdown fullwidth
		this.tagify.dropdown.position = (ddHeight) => {
			let isBelowViewport = null;
			let rect = null;
			let top = null;
			let bottom = null;
			let left = null;
			let width = null;
			const ddElm = this.tagify.DOM.dropdown;
			const sourceRect = $(this.tagify.DOM.scope).closest(this.props.wrapperSelector)[0] || this.tagify.DOM.scope;

			if (!this.tagify.state.dropdown.visible) return;

			if (this.tagify.settings.dropdown.position === 'text') {
				rect = this.tagify.getCaretGlobalPosition();
				bottom = rect.bottom;
				top = rect.top;
				left = rect.left;
				width = 'auto';
			} else {
				rect = sourceRect.getBoundingClientRect();
				top = rect.top;
				bottom = rect.bottom - 1;
				left = rect.left;
				width = rect.width + 'px';
			}

			top = Math.floor(top);
			bottom = Math.ceil(bottom);
			isBelowViewport = document.documentElement.clientHeight - bottom < (ddHeight || ddElm.clientHeight);

			// flip vertically if there is no space for the dropdown below the input
			ddElm.style.cssText =
				'left:' +
				(left + window.pageXOffset) +
				'px; width:' +
				width +
				';' +
				(isBelowViewport
					? 'bottom:' + (document.documentElement.clientHeight - top - window.pageYOffset - 2) + 'px;'
					: 'top: ' + (bottom + window.pageYOffset) + 'px');

			ddElm.setAttribute('placement', isBelowViewport ? 'top' : 'bottom');
		};

		// Override original "highlightOption" method for "showEmptyState" extension
		this.tagify.dropdown.highlightOption = (elm, adjustScroll) => {
			const className = 'tagify__dropdown__item--active';
			let itemData = null;

			if (this.tagify.state.ddItemElm) {
				this.tagify.state.ddItemElm.classList.remove(className);
				this.tagify.state.ddItemElm.removeAttribute('aria-selected');
			}

			if (!elm) {
				this.tagify.state.ddItemData = null;
				this.tagify.state.ddItemElm = null;
				this.tagify.input.autocomplete.suggest.call(this.tagify);
				return;
			}

			if ($(elm).attr('data-emptystate')) {
				return;
			}

			itemData = this.tagify.suggestedListItems[this.tagify.getNodeIndex(elm)];
			this.tagify.state.ddItemData = itemData;
			this.tagify.state.ddItemElm = elm;

			elm.classList.add(className);
			elm.setAttribute('aria-selected', true);

			if (adjustScroll) {
				elm.parentNode.scrollTop = elm.clientHeight + elm.offsetTop - elm.parentNode.clientHeight;
			}

			if (this.tagify.settings.autoComplete) {
				this.tagify.input.autocomplete.suggest.call(this.tagify, itemData);
				if (this.tagify.settings.dropdown.position !== 'manual') {
					this.tagify.dropdown.position.call(this.tagify);
				}
			}
		};

		// Add "showEmptyState" extension
		this.tagify.dropdown.showEmptyState = () => {
			const emptyStateMessage =
				(this.props.settings && this.props.settings.emptyStateMessage) || 'Es wurden keine Einträge gefunden';

			const _s = this.tagify.settings;
			let ddHeight = null;
			const isManual = _s.dropdown.position === 'manual';

			const HTMLContent = `<div class="tagify__dropdown__item__emptystate" data-emptystate="true" tabindex="0">
					<div class="col-left">
						<div class='icon-round'><div class='icon icon-close2'></div></div>
					</div>
					<div class="col-right">
						${emptyStateMessage}
					</div>
				</div>`;

			this.tagify.DOM.dropdown.content.innerHTML = HTMLContent;
			this.tagify.DOM.scope.setAttribute('aria-expanded', true);
			this.tagify.trigger('dropdown:show', this.tagify.DOM.dropdown);
			this.tagify.state.dropdown.visible = true;
			this.tagify.dropdown.position.call(this.tagify);

			if (!document.body.contains(this.tagify.DOM.dropdown)) {
				if (!isManual) {
					this.tagify.events.binding.call(this.tagify, false);
					ddHeight = this.tagify.getNodeHeight(this.tagify.DOM.dropdown);

					this.tagify.DOM.dropdown.classList.add('tagify__dropdown--initial');
					this.tagify.dropdown.position.call(this.tagify, ddHeight);
					document.body.appendChild(this.tagify.DOM.dropdown);

					setTimeout(() => this.tagify.DOM.dropdown.classList.remove('tagify__dropdown--initial'));
				}

				setTimeout(this.tagify.dropdown.events.binding.bind(this.tagify));
			}
		};
	}

	onDropdownHide() {
		$(this.props.wrapperSelector).removeClass('dropdown-open');
	}

	onDropdownShow() {
		$(this.props.wrapperSelector).addClass('dropdown-open');
	}

	onKeyDown(evt) {
		if (evt.key === 'Enter' && !evt.shiftKey) {
			evt.preventDefault();

			this.setState({
				tagAdded: false,
			});
		}
	}

	onKeyUp(evt) {
		if (evt.key === 'Enter' && !evt.shiftKey) {
			this.props.onKeyPressEnter && this.props.onKeyPressEnter(evt, this.state.tagAdded);

			this.setState({
				tagAdded: false,
			});
		}
	}

	onPaste(evt) {
		let text = '';
		const types = evt.clipboardData.types;

		if (
			(types instanceof DOMStringList && types.contains('text/html')) ||
			(types.indexOf && types.indexOf('text/html') !== -1)
		) {
			evt.stopPropagation();
			evt.preventDefault();

			if (evt.clipboardData || evt.originalEvent.clipboardData) {
				text = (evt.originalEvent || evt).clipboardData.getData('text/plain');
			} else if (window.clipboardData) {
				text = window.clipboardData.getData('Text');
			}

			text = $(`<span>${text}</span>`).text().trim();

			if (document.queryCommandSupported('insertText')) {
				document.execCommand('insertText', false, text);
			} else {
				document.execCommand('paste', false, text);
			}
		}
	}

	onTagAdd(evt) {
		if (this.tagify) {
			setTimeout(
				this.tagify.trigger.bind(
					this.tagify,
					'input',
					Object.assign({}, this.tagify.state.tag, {
						textContent: this.tagify.DOM.input.textContent,
					})
				),
				30
			);
		}

		this.setState(
			{
				tagAdded: true,
			},
			() => {
				this.tagify.loading(true).dropdown.hide.call(this.tagify);

				setTimeout(() => {
					this.setState({
						tagAdded: false,
					});
				}, 150);
			}
		);
	}

	onTagRemove(evt) {
		setTimeout(() => {
			this.tagify.DOM.input.focus();
			this.props.onTagRemove && this.props.onTagRemove(evt);
		}, 0);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const tagify = this.tagify;

		// check if value has changed
		if (nextProps.value && nextProps.value.join() !== this.props.value.join()) {
			tagify.loadOriginalValues(nextProps.value);
			// this.tagify.addTags(nextProps.value, true, true)
		}

		if (nextProps.settings.dropdown) {
			this.tagify.settings.dropdown = Object.assign(
				{},
				this.tagify.settings.dropdown,
				nextProps.settings.dropdown
			);
		}

		this.tagify.settings.maxTags = nextProps.settings.maxTags;
		this.tagify.settings.whitelist = nextProps.settings.whitelist;

		if (nextProps.showDropdown) {
			tagify.dropdown.show.call(tagify, nextProps.showDropdown);
			tagify.toggleFocusClass(true);
		} else if ('showDropdown' in nextProps && !nextProps.showDropdown) {
			tagify.dropdown.hide.call(tagify);
		}

		// do not allow react to re-render since the component is modifying its own HTML
		return false;
	}

	_handleRef(component) {
		this.component = component;
	}

	render() {
		const attrs = {
			ref: this._handleRef,
			name: this.props.name,
			className: this.props.className,
			placeholder: this.props.class,
			autoFocus: this.props.autofocus,
			value: this.props.children,
			onChange: this.props.onChange || function () {},
		};

		const { className } = this.props;

		return React.createElement(
			'div',
			{ className },
			React.createElement(this.props.mode, Object.assign({}, attrs, { defaultValue: this.props.initialValue }))
		);
	}
}

Tags.defaultProps = {
	value: [],
	mode: 'input',
};

export default Tags;
