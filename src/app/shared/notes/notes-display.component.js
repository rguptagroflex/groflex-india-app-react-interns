import React from 'react';
import PropTypes from 'prop-types';
import { htmlInputEmptyStates } from 'helpers/constants';

const { DEFAULT_HTML_EMPTY_STATE, HTML_LIST_EMPTY_STATE } = htmlInputEmptyStates;
const emptyHtmlInputState = [DEFAULT_HTML_EMPTY_STATE, HTML_LIST_EMPTY_STATE];

const NotesDisplay = ({ value, resources }) => {
	const DEFAULT_EMPTY_VALUE = resources.emptyNotesMessage;
	const style = !value || emptyHtmlInputState.indexOf(value) > -1 ? 'notes_empty' : '';

	return (
		<div>
			<pre className="htmlContent notes_display">
				<div className={style}>
					{value && emptyHtmlInputState.indexOf(value) === -1 ? (
						<div dangerouslySetInnerHTML={{ __html: value }} />
					) : (
						<div>{DEFAULT_EMPTY_VALUE}</div>
					)}
				</div>
			</pre>
		</div>
	);
};

NotesDisplay.propTypes = {
	value: PropTypes.string
};

export default NotesDisplay;
