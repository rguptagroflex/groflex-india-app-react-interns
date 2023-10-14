import React from "react";
import TextInputLabelComponent from "shared/inputs/text-input/text-input-label.component";
import TextInputHintComponent from "shared/inputs/text-input/text-input-hint.component";
import TextInputErrorComponent from "shared/inputs/text-input/text-input-error.component";

import SearchIcon from "@material-ui/icons/Search";
class TextInputComponent extends React.Component {
	render() {
		const {
			id,
			name,
			value,
			placeholder,
			disabled,
			maxLength,
			isPassword,
			autoComplete,
			spellCheck,
			label,
			hintMessage,
			errorMessage,
			errorClass,
			dataQsId,
			noInputBar,
			wrapperClass,
			icon,
			iconAction,
		} = this.props;

		return (
			<div className={`text-input-component ${wrapperClass || ""}`}>
				{/* <SearchIcon /> */}
				<input
					autoFocus={this.props.autoFocus}
					className={`input ${!value ? "input-empty" : ""} ${errorMessage ? "input-invalid" : ""}`}
					tabIndex="0"
					type={isPassword ? "password" : "text"}
					id={id}
					name={name}
					placeholder={placeholder}
					disabled={disabled}
					maxLength={maxLength}
					autoComplete={autoComplete}
					spellCheck={spellCheck}
					value={value}
					data-qs-id={dataQsId}
					onChange={(ev) => this.onChange(ev)}
					onInput={(ev) => this.onInput(ev)}
					onPaste={(ev) => this.onPaste(ev)}
					onKeyUp={(ev) => this.onKeyUp(ev)}
					onKeyDown={(ev) => this.onKeyDown(ev)}
					onBlur={(ev) => this.onBlur(ev)}
					onFocus={(ev) => this.onFocus(ev)}
				/>

				{noInputBar ? null : <span className="input_bar" />}
				{icon && (
					<span
						className={`input_icon ${icon} ${iconAction ? "pointer" : ""}`}
						onClick={() => iconAction && iconAction()}
					></span>
				)}
				<TextInputLabelComponent className="input_label" text={label} />

				<TextInputHintComponent visible={!!hintMessage} hintMessage={hintMessage} />

				<TextInputErrorComponent
					visible={!!errorMessage}
					customClass={errorClass}
					errorMessage={errorMessage}
				/>
			</div>
		);
	}

	onChange(ev) {
		ev.persist();
		this.props.onChange && this.props.onChange(ev);
	}

	onInput(ev) {
		ev.persist();
		this.props.onInput && this.props.onInput(ev);
	}

	onPaste(ev) {
		ev.persist();
		this.props.onPaste && this.props.onPaste(ev);
	}

	onKeyUp(ev) {
		ev.persist();
		this.props.onKeyUp && this.props.onKeyUp(ev);
	}

	onKeyDown(ev) {
		ev.persist();
		this.props.onKeyDown && this.props.onKeyDown(ev);
	}

	onBlur(ev) {
		ev.persist();
		this.props.onBlur && this.props.onBlur(ev);
	}

	onFocus(ev) {
		ev.persist();
		this.props.onFocus && this.props.onFocus(ev);
	}
}

export default TextInputComponent;
