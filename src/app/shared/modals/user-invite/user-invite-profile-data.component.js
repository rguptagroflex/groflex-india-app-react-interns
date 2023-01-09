import React from 'react';
import SVGInline from 'react-svg-inline';
import _ from 'lodash';
import config from 'config';
import lang from 'lang';

import ButtonComponent from 'shared/button/button.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import ModalService from 'services/modal.service';

class UserInviteProfileDateComponent extends React.Component {

	render() {
		return (
			<div className='user-invite-modal-content'>
				<div className='user-invite-modal-headline text-semibold'>Complete profile data</div>
				<div className='user-invite-modal-subheadline'>Store additional profile data to make working in a team easier</div>
				<div className='user-invite-modal-inputs'>
					{/* <div className='col-xs-12'> */}
					<TextInputExtendedComponent
						required={true}
						name='firstName'
						label='First Name'
						onChange={(evt, name) => this.props.handleInputChange && this.props.handleInputChange(evt, name)}
						variant='outlined-rounded'
					/>
					{/* </div> */}
					{/* <div className='col-xs-12'> */}
					<TextInputExtendedComponent
						required={true}
						name='lastName'
						label='Last Name'
						onChange={(evt, name) => this.props.handleInputChange && this.props.handleInputChange(evt, name)}
						variant='outlined-rounded'
					/>
					{/* </div> */}
					{/* <div className='col-xs-12'> */}
					<TextInputExtendedComponent
						required={true}
						name='companyName'
						label='Company Name'
						onChange={(evt, name) => this.props.handleInputChange && this.props.handleInputChange(evt, name)}
						variant='outlined-rounded'
					/>
					{/* </div> */}
				</div>
				<div className='modal-base-footer'>
					<div className='modal-base-cancel'>
						<ButtonComponent
							type='cancel'
							callback={() => ModalService.close()}
							label={lang.cancel}
							dataQsId='modal-user-invite-btn-close'
						/>
					</div>
					<div className='modal-base-confirm'>
						<ButtonComponent
							type='primary'
							callback={() => {
								this.props.setStep && this.props.setStep();
							}}
							label={lang.done} dataQsId='modal-user-invite-btn-close'
						/>
					</div>
				</div>

			</div>
		);
	}
}

export default UserInviteProfileDateComponent;
