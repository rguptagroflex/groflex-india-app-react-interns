import React from 'react';
import PropTypes from 'prop-types';
import { getResource } from 'helpers/resource';

export const COMPONENT_NAME = 'js--inputError';

const TextInputErrorComponent = props => {
	const errorMessage = props.errorMessage || getResource('incorrectEntry');
	const customClass = props.customClass || '';
	const visible = props.visible || false;
	const wrapperClassName = COMPONENT_NAME + (visible ? ` input_error ${customClass}` : ' u_hidden');

	return (
		<div className={wrapperClassName}>
			<span>{errorMessage}</span>
		</div>
	);
};

TextInputErrorComponent.propTypes = {
	visible: PropTypes.bool,
	errorMessage: PropTypes.string,
	customClass: PropTypes.string
};

export default TextInputErrorComponent;
