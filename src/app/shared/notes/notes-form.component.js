import React from 'react';
import PropTypes from 'prop-types';
import HtmlInputComponent from 'shared/inputs/html-input/html-input.component';
import TabInputComponent from 'shared/inputs/tab-input/tab-input.component';

class NotesForm extends React.Component {
	render() {
		const {
			value,
			showAlert,
			showToggleInput,
			placeholder,
			notesAlertLabel,
			onSave,
			onCancel,
			onInputChange,
			onAlertToggle,
			resources,
			defaultFocus
		} = this.props;

		const notesToggleInput = showToggleInput ? (
			<div className="col-xs-8 switchInput">
				<label className="notes-alert-label">{notesAlertLabel}</label>
				<TabInputComponent
					componentClass={'customer-edit-notes-alert-toggle'}
					items={[{ label: resources.str_yes, value: '1' }, { label: resources.str_no, value: '0' }]}
					value={showAlert ? '1' : '0'}
					onChange={val => onAlertToggle(val)}
					dataQsId="customer-edit-notesAlert"
				/>
			</div>
		) : null;

		return (
			<div className="notesEdit">
				<div className="notesEdit_content">
					<HtmlInputComponent placeholder={placeholder} value={value} onTextChange={onInputChange} defaultFocus={defaultFocus} />
					<div className="notesEdit_controls">
						<button className="button button-square button-small button-icon-close" onClick={onCancel} />
						<button
							className="button button-primary button-square button-small button-icon-check"
							onClick={onSave}
						/>
					</div>
				</div>

				{notesToggleInput}
			</div>
		);
	}
}

NotesForm.propTypes = {
	value: PropTypes.string,
	showAlert: PropTypes.bool,
	onSave: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
	onInputChange: PropTypes.func.isRequired,
	onAlertToggle: PropTypes.func.isRequired
};

NotesForm.defaultProps = {
	value: '',
	showAlert: false,
	showToggleInput: false
};

export default NotesForm;
