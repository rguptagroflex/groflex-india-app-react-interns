import React from 'react';
import ButtonComponent from 'shared/button/button.component';

const RegistrationInvitationInvalidModalComponent = (props) => {
	return (
		<div className="registration-invitation-invalid-modal-component text-center">
			<div className="invoiz-logo">
				<img src="/assets/images/svg/imprezz.svg" />
			</div>
			<div className="icon-circle u_c u_mb_20">
				<div className="icon icon-exclamation_mark2"></div>
			</div>
			<div className="text-h4 u_mb_20">Invitation expired</div>
			<div className="u_mb_30">
					Contact the owner of the imprezz account 
				<br /> to be invited again.
			</div>
			<ButtonComponent
				callback={() => {
					window.location.href = 'https://app.imprezz.in/';
				}}
				label="More about imprezz"
				dataQsId="registration-invitation-invalid-modal-btn"
			/>
		</div>
	);
};
 
export default RegistrationInvitationInvalidModalComponent;
