import React from 'react';
import PropTypes from 'prop-types';

const SubmenuBarComponent = ({ title, name, visible, hasImprintAndPrivacy, children, resourceKey, resources }) => {
	const visibleClass = visible ? 'submenu-visible' : 'u_hidden';
	const className = `submenu submenu-${name} ${visibleClass}`;

	const imprint = (
		<div className="submenuImprint">
			<div>
				<a href="https://groflex.in/privacy-policy" target="_blank">
					{resources.str_imprint}
				</a>
			</div>
			<div>
				<a href="https://groflex.in/terms-&-conditions" target="_blank">
					{"Terms & Conditions"}
				</a>
			</div>
		</div>
	);

	return (
		<div className={className}>
			{/* <h5 className="submenuTitle">{resources.menuItems[resourceKey].toUpperCase()}</h5> */}
			{/* {title.toUpperCase()} */}
			<ul className="submenuList">{children}</ul>
			{hasImprintAndPrivacy ? imprint : null}
		</div>
	);
};

SubmenuBarComponent.propTypes = {
	title: PropTypes.string,
	visible: PropTypes.bool
};

SubmenuBarComponent.defaultProps = {
	title: '',
	visible: false
};

export default SubmenuBarComponent;
