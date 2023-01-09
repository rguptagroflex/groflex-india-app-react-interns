import React from 'react';
import multiUserRoleType from 'enums/multiuser-role-type.enum';

const RoleSelectComponent = (props) => {
	const roleArray = [
		{
			roleName: multiUserRoleType.OWNER,
			roleHeadline: 'Owner',
			roleText: 'Full access to all functions and settings. A maximum of one person can take on the role of "owner".'
		},
		{
			roleName: multiUserRoleType.ADMIN,
			roleHeadline: 'Admin',
			roleText: 'Full access to all functions. No authorization to carry out paid promotions.'
		},
		{
			roleName: multiUserRoleType.DATA_OPERATOR,
			roleHeadline: 'Accountant',
			roleText: 'Create and edit invoices, customers, articles, offers, expenses, delivery notes and time records. No insight into finances and sales.'
		},
		{
			roleName: multiUserRoleType.RESTRICTED_DATA_OPERATOR,
			roleHeadline: 'Limited User',
			roleText: 'Create and edit invoices, quotations and expenses only. Very limited access to perform administrative tasks and no insight into finances and sales.'
		},
		{
			roleName: multiUserRoleType.TAX_CONSULTANT,
			roleHeadline: 'Chartered Accountant',
			roleText: 'Creation and processing of invoices, expenses, tax consultants export and VAT. Insight into finances and sales.'
		}
	];

	const { selectedRole, onRadioChange, isInvite, inviteCAOnly } = props;
	const modifiedRoleArray = roleArray;
	if (!inviteCAOnly) {
		modifiedRoleArray.pop();
	} else {
		modifiedRoleArray.splice(0, 4);
	}
	return (
		<div className='role-select-wrapper'>			
			{modifiedRoleArray.map((role, index) => {
				const {roleName, roleHeadline, roleText} = role;
				if (isInvite && roleName === 'owner') {
					return null;
				} else {
					return (
						<div className='role-select-item' key={`role-select-item-${index}`}>
							<div className="radio-custom-circle-wrapper">
								<input
									id={`radio-input-${roleName}`}
									type="radio"
									tabIndex="0"
									name={roleName}
									value={roleName}
									className="radio-custom"
									checked={selectedRole === roleName}
									onChange={(event) => {
										onRadioChange && onRadioChange(roleName);
									}}
								/>
								<span className="radio-custom-circle" />
							</div>
							<div className={`radio-custom-label-wrapper`}>
								<label htmlFor={`radio-input-${roleName}`}>
									<div className='role-select-item-headline text-semibold'>{roleHeadline}</div>
									<div className='role-select-item-text'>{roleText}</div>
								</label>
							</div>
						</div>
					);
				}
			})}
		</div>
	);
};

export default RoleSelectComponent;
