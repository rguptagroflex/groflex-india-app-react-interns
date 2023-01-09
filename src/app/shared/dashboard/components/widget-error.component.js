import React from 'react';

const WidgetErrorComponent = ({ reason, buttonTitle, iconSize, onButtonClick, noIcon }) => {
	const iconClass = `widgetError_icon widgetError_icon-${iconSize || 'large'} icon icon-cloud_error`;
	return (
		<div className="text-center">
			{noIcon ? null : <div className={iconClass} />}
			<div className="text-h5">{reason}</div>
			<button className="u_mt_20 button button-primary" onClick={onButtonClick}>
				{buttonTitle}
			</button>
		</div>
	);
};

export default WidgetErrorComponent;
