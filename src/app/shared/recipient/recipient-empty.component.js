import React from 'react';
import PropTypes from 'prop-types';
import { contactTypes } from 'helpers/constants';

const RecipientEmptyComponent = ({ handleClick, resources, recipientType }) => {
	return (
		<div className="upperDivRecipientEmpty">
			<div className="recipientEmpty" onClick={handleClick}>
			<span className="edit-icon"/>
				<div className="icon icon-rounded icon-plus" />
				<div className="recipientEmpty_label">{recipientType == contactTypes.CUSTOMER ? resources.str_enterCustomer : resources.str_enterPayee}</div>
			</div>
			{/* <div className="empty-customer-detail"><b>{resources.str_enterCustomerDetails}</b></div> */}
		</div>
	);
};

RecipientEmptyComponent.propTypes = {
	handleClick: PropTypes.func
};

export default RecipientEmptyComponent;
