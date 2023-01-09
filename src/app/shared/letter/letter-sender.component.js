import React from 'react';
import HtmlInputComponent from 'shared/inputs/html-input/html-input.component';

const KEY_CODE_ENTER = 13;
const KEY_CODE_ESCAPE = 27;

class LetterSenderComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			sender: props.value
		};

		this.original = props.value;
	}

	render() {
		const { resources } = this.props;
		return (
			<div className="letter-sender-component-wrapper outlined">
				<span className="edit-icon"/>
				<HtmlInputComponent
					placeholder={resources.str_yourAddress}
					keyboardBindings={{
						enter: {
							key: 13,
							handler: () => {}
						}
					}}
					onKeyUp={({ event, quill }) => {
						if (event.keyCode === KEY_CODE_ESCAPE) {
							this.discardLetterSenderChanges = true;
							quill.blur();
						}
						if (event.keyCode === KEY_CODE_ENTER) {
							quill.blur();
						}
					}}
					wrapperClass={'inline'}
					displayBlueLine={true}
					formats={['bold', 'italic', 'underline']}
					value={this.state.sender}
					onTextChange={value => this.onTextChange(value)}
					onBlur={() => this.onBlur()}
				/>
			</div>
		);
	}

	onTextChange(val) {
		this.setState({ sender: val });
	}

	onBlur() {
		if (this.discardLetterSenderChanges) {
			this.discardLetterSenderChanges = false;
			this.setState({ sender: this.original });
			return;
		}
		if (this.props.value !== this.state.sender) {
			this.original = this.state.sender;
			this.props.onChange(this.state.sender);
		}
	}
}

export default LetterSenderComponent;
