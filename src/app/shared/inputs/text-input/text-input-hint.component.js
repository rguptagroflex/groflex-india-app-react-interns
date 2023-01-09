import React from 'react';
import PropTypes from 'prop-types';

const TextInputHintComponent = props => {
	const visible = props.visible || false;
	const hintMessage = props.hintMessage || '';
	const customClass = props.customClass || '';
	const wrapperClassName = visible ? `input_hint ${customClass}` : 'u_hidden';

	return (
		<div className={wrapperClassName}>
			<span>{hintMessage}</span>
		</div>
	);
};

TextInputHintComponent.propTypes = {
	visible: PropTypes.bool,
	hintMessage: PropTypes.string,
	customClass: PropTypes.string
};

export default TextInputHintComponent;
