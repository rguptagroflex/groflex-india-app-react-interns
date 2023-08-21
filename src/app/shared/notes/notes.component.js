import React from 'react';
import PropTypes from 'prop-types';
import { notesStates, htmlInputEmptyStates } from 'helpers/constants';
import NotesDisplayComponent from 'shared/notes/notes-display.component';
import NotesFormComponent from 'shared/notes/notes-form.component';

const { NOTES_FORM_STATE, NOTES_DISPLAY_STATE } = notesStates;
const { DEFAULT_HTML_EMPTY_STATE, HTML_LIST_EMPTY_STATE } = htmlInputEmptyStates;

const emptyHtmlInputState = [DEFAULT_HTML_EMPTY_STATE, HTML_LIST_EMPTY_STATE];

class NotesComponent extends React.Component {
	constructor(props) {
		super(props);

		const {
			data: { notes: value, notesAlert },
			viewState
		} = props;

		this.state = {
			viewState: viewState || NOTES_DISPLAY_STATE,
			value,
			oldValue: undefined,
			showAlert: notesAlert,
			oldShowAlert: false
		};
	}

	onEditClick() {
		if (this.state.viewState !== NOTES_DISPLAY_STATE) {
			return;
		}
		const { value, showAlert } = this.state;
		this.setState({ viewState: NOTES_FORM_STATE, oldValue: value, oldShowAlert: showAlert });
	}

	onInputChange(value) {
		this.setState({ value });
	}

	onAlertToggle(value) {
		this.setState({ showAlert: !!(value === '1') });
	}

	onSaveClick() {
		const { value, showAlert } = this.state;
		const { onSave } = this.props;

		this.setState({ viewState: NOTES_DISPLAY_STATE }, () => {
			onSave({
				notes: !value || emptyHtmlInputState.indexOf(value) > -1 ? '' : value,
				notesAlert: showAlert
			});
		});
	}

	onCancelClick() {
		const { oldValue } = this.state;
		this.setState({ value: oldValue, viewState: NOTES_DISPLAY_STATE });
	}

	render() {
		let activeComponent;
		const { heading, placeholder, notesAlertLabel, showToggleInput, resources, defaultFocus } = this.props;
		const { viewState, value, showAlert } = this.state;

		switch (viewState) {
			case NOTES_DISPLAY_STATE:
				activeComponent = <NotesDisplayComponent value={value} resources={resources} />;
				break;
			case NOTES_FORM_STATE:
				activeComponent = (
					<NotesFormComponent
						value={value}
						showAlert={showAlert}
						showToggleInput={showToggleInput}
						placeholder={placeholder}
						notesAlertLabel={notesAlertLabel}
						onAlertToggle={this.onAlertToggle.bind(this)}
						onInputChange={this.onInputChange.bind(this)}
						onSave={this.onSaveClick.bind(this)}
						onCancel={this.onCancelClick.bind(this)}
						resources={resources}
						defaultFocus={defaultFocus}
					/>
				);
				break;
		}

		return (
			<div>
				<div className="notes_heading text-h4">{heading}</div>
				<div className="notes_content row u_ml_2">
					<div
						onClick={this.onEditClick.bind(this)}
						style={{width: "259px",
							height: "80px",
							flexShrink: "0"}}
						className={`col-xs-12 ${viewState === NOTES_DISPLAY_STATE ? 'notes-display-wrapper' : ''}`}
					>
						{activeComponent}
					</div>
				</div>
			</div>
		);
	}
}

NotesComponent.propTypes = {
	placeholder: PropTypes.string,
	notesAlertLabel: PropTypes.string,
	showToggleInput: PropTypes.bool,
	viewState: PropTypes.string,
	onSave: PropTypes.func.isRequired
};

export default NotesComponent;
