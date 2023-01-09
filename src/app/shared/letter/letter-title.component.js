import React from 'react';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';

const KEY_CODE_ENTER = 13;
const KEY_CODE_ESCAPE = 27;

class LetterTitleComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			title: props.title || props.placeholder,
			placeholder: props.placeholder
		};

		this.original = props.title || props.placeholder;
	}

	componentWillReceiveProps(newProps) {
		const { title } = newProps;
		this.original = title;
		this.setState({ title });
	}

	render() {
		return (
			<div className="letter-title-component-wrapper outlined">
				<span className="edit-icon"/>
				<TextInputExtendedComponent
					ref={`letter-title-input`}
					name={`letter-title-input`}
					errorClass='error-top'
					required={true}
					value={this.state.title}
					placeholder={this.state.placeholder}
					onChange={val => this.setState({ title: val })}
					onBlur={() => this.onBlur()}
					onKeyDown={ev => this.onKeyDown(ev)}
				/>
			</div>
		);
	}

	onBlur() {
		const title = this.state.title || this.original;
		this.props.onChange && this.props.onChange(title);
	}

	onKeyDown(ev) {
		if (ev.keyCode === KEY_CODE_ESCAPE) {
			ev.preventDefault();
			this.setState({ title: this.original }, () => {
				this.refs['letter-title-input'].refs['letter-title-input'].blur();
			});
		} else if (ev.keyCode === KEY_CODE_ENTER) {
			ev.preventDefault();
			if (!this.state.title) {
				this.setState({ title: this.original }, () => {
					this.refs['letter-title-input'].refs['letter-title-input'].blur();
				});
			} else {
				this.refs['letter-title-input'].refs['letter-title-input'].blur();
			}
		}
	}
}

export default LetterTitleComponent;
