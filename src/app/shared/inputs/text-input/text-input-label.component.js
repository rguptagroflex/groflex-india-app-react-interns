import React from 'react';
import PropTypes from 'prop-types';

const TextInputLabelComponent = props => {
	const className = props.className || '';
	const text = props.text || '';

	return <label className={className}>{text}</label>;
};

TextInputLabelComponent.propTypes = {
	class: PropTypes.string,
	text: PropTypes.string
};

export default TextInputLabelComponent;
