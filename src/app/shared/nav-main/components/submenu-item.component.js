import invoiz from 'services/invoiz.service';
import React from 'react';
import PropTypes from 'prop-types';

const SubmenuItemComponent = ({ url, active, name, resourceKey, resources }) => {
	const className = `submenuItem ${active ? 'submenuItem-active' : ''}`;

	const navigateToPage = url => {
		// if (url === '/offers') {
		// 	invoiz.offerListNaviagtion = true;
		// } else {
		// 	invoiz.offerListNaviagtion = false;
		// }
		invoiz.trigger('updateNewsfeedCount');
		invoiz.router.navigate(url);
	};

	return (
		<li className={className}>
			<a onClick={() => navigateToPage(url)} data-href={url} data-qs-id={`global-submenu-item-${name}`}>
				{resources.subMenuItems[resourceKey]}
				{/* {title} */}
			</a>
		</li>
	);
};

SubmenuItemComponent.propTypes = {
	url: PropTypes.string,
	active: PropTypes.bool,
	resourceKey: PropTypes.string
};

SubmenuItemComponent.defaultProps = {
	url: '',
	active: false,
	resourceKey: ''
};

export default SubmenuItemComponent;
