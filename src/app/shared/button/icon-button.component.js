import React from 'react';
import PropTypes from 'prop-types';

const IconButtonComponent = (props) => {
	const { id, dataQsId, icon, label, labelAction, hint, size, wrapperClass, callback, type } = props;

	return (
		<div className={`icon-button-wrapper ${wrapperClass || ''}`}>
			<button
				id={id}
				data-qs-id={dataQsId}
				className={`icon-button icon-button-${size} icon-button-${type} u_c`}
				onClick={() => {
					callback && callback();
				}}
			>
				<div className={`icon ${icon}`}></div>
			</button>
			{label && (
				<div
					className={`text-small text-semibold text-center u_mt_6 u_c ${
						labelAction ? 'icon-button-label-action' : ''
					}`}
					onClick={() => {
						labelAction && labelAction();
					}}
				>
					{label}
					{labelAction && <div className="icon icon-arr_down u_ml_2"></div>}
				</div>
			)}
			{hint && <div className="icon-button-hint text-truncate">{hint}</div>}
		</div>
	);
};

IconButtonComponent.propTypes = {
	dataQsId: PropTypes.string,
	icon: PropTypes.string,
	label: PropTypes.string,
	labelAction: PropTypes.func,
	hint: PropTypes.string,
	size: PropTypes.string,
	wrapperClass: PropTypes.string,
	callback: PropTypes.func,
	type: PropTypes.string,
};

IconButtonComponent.defaultProps = {
	size: 'medium',
	type: 'secondary',
};

export default IconButtonComponent;
