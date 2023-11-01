import React from "react";
import PropTypes from "prop-types";
import ReactQuill from "react-quill";
import TextInputLabelComponent from "shared/inputs/text-input/text-input-label.component";
import TextInputHintComponent from "shared/inputs/text-input/text-input-hint.component";
import TextInputErrorComponent from "shared/inputs/text-input/text-input-error.component";
import { addMutationObserver } from "helpers/mutationObserver";
import { htmlInputEmptyStates } from "helpers/constants";
import { getResource } from "helpers/resource";

const Quill = ReactQuill.Quill;
const Clipboard = Quill.import("modules/clipboard");
const Delta = Quill.import("delta");

class PlainClipboard extends Clipboard {
	onPaste(e) {
		e.preventDefault();
		const range = this.quill.getSelection();
		const text = e.clipboardData.getData("text/plain");
		const delta = new Delta().retain(range.index).delete(range.length).insert(text);
		const index = text.length + range.index;
		const length = 0;
		this.quill.updateContents(delta, "silent");
		this.quill.setSelection(index, length);
		this.quill.scrollIntoView();
	}
}
Quill.register("modules/clipboard", PlainClipboard, true);

const font = Quill.import("formats/font");
font.whitelist = [
	"",
	"sourceserifpro",
	"caveat",
	"dancingscript",
	"economica",
	"gruppo",
	"kalam",
	"merriweathersans",
	"opensanscondensed",
	"ptsansnarrow",
	"shadowsintolight",
	"tulpenone",
	"voltaire",
];
Quill.register(font, true);

const { DEFAULT_HTML_EMPTY_STATE, HTML_LIST_EMPTY_STATE } = htmlInputEmptyStates;
const emptyHtmlInputState = [DEFAULT_HTML_EMPTY_STATE, HTML_LIST_EMPTY_STATE];

const hasEmptyInnerText = (innerText) => innerText === "" || innerText === "\n";

class HtmlInputComponent extends React.Component {
	constructor(props) {
		super(props);

		const { focused, errorMessage, defaultFocus } = props;
		this.state = {
			isFocused: focused,
			errorMessage,
			defaultFocus: defaultFocus || false,
		};
		this.quillRef = null; // Quill instance
		this.toolbarEl = null; // Toolbar component
		this.reactQuillRef = null; // ReactQuill component

		this.onPaste = this.onPaste.bind(this);
		this.lastPressedKey = null;
		this.usedPaste = false;

		this.keyboardBindings = {
			tab: {
				key: 9,
				handler: () => {
					return true;
				},
			},
		};
	}

	componentDidMount() {
		const { value, focused, name, keyboardBindings } = this.props;

		this.keyboardBindings = Object.assign({}, keyboardBindings, this.keyboardBindings);
		this.setState({ isFocused: focused });
		this.attachQuillRefs();
		const quillEditor = this.quillRef;

		if (value && emptyHtmlInputState.indexOf(value) === -1 && this.state.defaultFocus === false) {
			addMutationObserver(this.refs[name], () => {
				this.setEditorValue(value);
				quillEditor.blur();
			});

			quillEditor.setText("");
		}

		$(quillEditor.theme.tooltip.root)
			.find(".ql-toolbar")
			.on("mousedown", (evt) => {
				evt.preventDefault();
			});
		if (this.state.defaultFocus) {
			this.setFocus();
		}
	}
	setFocus() {
		$(".htmlInput").addClass("htmlInput-active");
		this.placeCaretAtEnd(document.getElementsByClassName("ql-editor"));
	}

	placeCaretAtEnd(el) {
		if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
			const range = document.createRange();
			range.selectNodeContents(el[0]);
			range.collapse(false);
			const sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}
		// else if (typeof document.body.createTextRange !== 'undefined') {
		// 	const textRange = document.body.createTextRange();
		// 	textRange.moveToElementText(el[0]);
		// 	textRange.collapse(false);
		// 	textRange.select();
		// }
	}

	componentDidUpdate() {
		this.attachQuillRefs();
	}

	componentWillUnmount() {
		this.quillRef = null; // Quill instance
		this.toolbarEl = null; // Toolbar component
		this.reactQuillRef = null; // ReactQuill component
	}

	onPaste() {
		const {
			root: { innerHTML: value },
		} = this.quillRef;

		this.handleTextChange(value);
	}

	attachQuillRefs() {
		if (!this.reactQuillRef || typeof this.reactQuillRef.getEditor !== "function") return;
		this.quillRef = this.reactQuillRef.getEditor();
	}

	componentWillReceiveProps(newProps) {
		const { isFocused } = this.state;
		const { blurred, focused, errorMessage } = newProps;

		if (blurred && !focused && isFocused) {
			this.blur();
		}

		if (focused && !blurred && !isFocused) {
			this.focus();
		}

		if (errorMessage) {
			this.setState({ errorMessage });
		}
	}

	focus() {
		const { disabled, onFocus } = this.props;
		const { isFocused } = this.state;

		if (disabled || isFocused) return;

		this.setState({ isFocused: true }, () => {
			onFocus && onFocus({ quill: this.quillRef });
		});
	}

	blur() {
		const { onBlur, isRequired } = this.props;
		const { isFocused } = this.state;
		const quillEditor = this.quillRef;
		const {
			root: { innerHTML: value },
		} = quillEditor;

		if (!isFocused) return;

		if (isRequired && (emptyHtmlInputState.indexOf(value) > -1 || !value)) {
			return this.setState({ errorMessage: getResource("mandatoryFieldValidation") });
		}

		this.setState({ isFocused: false }, () => {
			onBlur && onBlur({ quill: this.quillRef, value });
		});
		$(".htmlInput").removeClass("htmlInput-active");
	}

	keydown(event) {
		const key = event.which || event.keyCode || 0;
		this.usedPaste = false;
		if (this.lastPressedKey === 17 && key === 86) {
			this.usedPaste = true;
		}
		this.lastPressedKey = key;
	}

	keyup(event) {
		const { disabled, onKeyUp } = this.props;
		if (disabled) return;
		onKeyUp && onKeyUp({ event, quill: this.quillRef });
	}

	setEditorValue(value) {
		if (!this.quillRef) {
			return;
		}

		const { root, clipboard } = this.quillRef;

		if (value === root.innerHTML) {
			return;
		}

		clipboard.dangerouslyPasteHTML(value);
	}

	handleSelectionChange() {
		const { disabled } = this.props;
		const quillEditor = this.quillRef;

		if (disabled || !quillEditor) {
			return;
		}

		if (this.usedPaste) {
			this.onPaste();
		}
	}

	handleTextChange(value) {
		this.props.onChange && this.props.onChange(value);
		const quillEditor = this.quillRef;

		if (!quillEditor) return;

		const { root } = quillEditor;
		const { errorVisible } = this.state;
		const { onTextChange } = this.props;

		if (emptyHtmlInputState.indexOf(value) === -1 && errorVisible) {
			this.setState({ errorVisible: false });
		}

		if (hasEmptyInnerText(root.innerText)) {
			quillEditor.formatLine(0, 0, "list", false);
		}

		onTextChange && onTextChange(value && emptyHtmlInputState.indexOf(value) === -1 ? value : "");
	}

	render() {
		const { isFocused, errorMessage } = this.state;
		const {
			value,
			placeholder,
			formats,
			displayBlueLine,
			name,
			label,
			disabled,
			componentClass,
			wrapperClass,
			hintMessage,
			keyboardBindings,
			dataQsId,
		} = this.props;

		let inputClass = `htmlInput ${componentClass ? componentClass + " " : ""}`;

		if (errorMessage) {
			inputClass += "htmlInput-invalid";
		} else if (isFocused) {
			inputClass += "htmlInput-active";
		} else if (disabled) {
			inputClass += "htmlInput-disabled";
		}

		const blueLine = displayBlueLine ? <span className="htmlInput_bar" /> : null;

		return (
			<div className={wrapperClass} data-qs-id={dataQsId}>
				<div ref="htmlInput" className={inputClass}>
					<TextInputLabelComponent className="htmlInput_label" text={label} />
					<div ref={name} className="htmlInput_wrapper" onPaste={this.onPaste.bind(this)}>
						<ReactQuill
							ref={(el) => {
								this.reactQuillRef = el;
							}}
							className="htmlInput_input"
							modules={{
								toolbar: formats,
								keyboard: {
									bindings: Object.assign({}, keyboardBindings, this.keyboardBindings),
								},
							}}
							theme={"bubble"}
							value={value}
							placeholder={placeholder}
							onFocus={this.focus.bind(this)}
							onBlur={(e) => this.blur(e)}
							onChange={this.handleTextChange.bind(this)}
							onChangeSelection={this.handleSelectionChange.bind(this)}
							onKeyUp={this.keyup.bind(this)}
							onKeyDown={this.keydown.bind(this)}
						/>
						{blueLine}
					</div>
				</div>

				<TextInputHintComponent
					visible={!!hintMessage}
					hintMessage={hintMessage}
					customClass="htmlInput_hint"
				/>
				<TextInputErrorComponent
					visible={!!errorMessage}
					errorMessage={errorMessage}
					customClass="htmlInput_error"
				/>
			</div>
		);
	}
}

HtmlInputComponent.propTypes = {
	name: PropTypes.string.isRequired,
	value: PropTypes.string,
	label: PropTypes.string,
	placeholder: PropTypes.string,
	disabled: PropTypes.bool,
	required: PropTypes.bool,
	componentClass: PropTypes.string,
	displayBlueLine: PropTypes.bool,
	hintMessage: PropTypes.string,
	errorMessage: PropTypes.string,
	inputClass: PropTypes.string,
	focused: PropTypes.bool,
	blurred: PropTypes.bool,
	onTextChange: PropTypes.func,
	onBlur: PropTypes.func,
	onFocus: PropTypes.func,
	keyboardBindings: PropTypes.object,
	formats: PropTypes.array,
};

HtmlInputComponent.defaultProps = {
	name: "html",
	value: "",
	label: "",
	placeholder: "",
	disabled: false,
	required: false,
	displayBlueLine: true,
	hideHtmlToolbar: false,
	componentClass: "",
	wrapperClass: "",
	hintMessage: "",
	inputClass: "",
	errorMessage: "",
	focused: false,
	blurred: false,
	formats: [["bold", "italic", "underline"], [{ list: "bullet" }]],
	keyboardBindings: {},
};

export default HtmlInputComponent;
