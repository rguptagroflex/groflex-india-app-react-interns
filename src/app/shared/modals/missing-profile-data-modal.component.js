import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';

class MissingProfileDataModalComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			// firstName: props.userData.firstName || '',
			// lastName: props.userData.lastName || '',
			firstName: invoiz.user.companyAddress.firstName || '',
			lastName: invoiz.user.companyAddress.lastName || '',
			companyStreetAddress: invoiz.user.companyAddress.street || '',
			companyName: invoiz.user.companyAddress.companyName || '',
			errors: {
				firstName: '',
				lastName: '',
				companyStreetAddress: '',
				invitedEmailAddress: ''
			}
		};
	}

	handleInputChange(evt, name) {
		const { value } = evt.target;
		this.setState({
			...this.state,
			[name]: value,
			errors: {
				...this.state.errors,
				[name]: ''
			}
		});
	}

	updateUserData() {
		const { firstName, lastName, companyName, companyStreetAddress } = this.state;
		const { onConfirm, resources } = this.props;

		if (firstName === '' || lastName === '' || companyStreetAddress === '') {
			this.setState({
				errors: {
					firstName: firstName.length === 0 ? 'This is a mandatory field' : '',
					lastName: lastName.length === 0 ? 'This is a mandatory field' : '',
					companyStreetAddress: companyStreetAddress.length === 0 ? 'This is a mandatory field' : ''
				}
			});
		} else {
			invoiz
				.request(`${config.settings.endpoints.completeUserData}`, {
					auth: true,
					method: 'POST',
					data: {
						firstName,
						lastName,
						companyName,
						companyStreetAddress
					}
				})
				.then(() => {
					invoiz.showNotification({ type: 'success', message: resources.accountDetailsSuccessMessage });
					onConfirm && onConfirm();
					ModalService.close();
				})
				.catch(() => {
					invoiz.showNotification({ type: 'error', message: resources.accountDetailsErrorMessage });
				});
		}
	}

	render() {
		const { firstName, lastName, companyName, companyStreetAddress, errors } = this.state;
		const { callback, isLoading, resources } = this.props;
		const isMissingData = !firstName || !lastName || !companyStreetAddress;
		return (
			<div className="has-footer-big missing-profile-data-modal">
				<div className="missing-profile-data-headline text-semibold">Complete your profile</div>
				<div className="missing-profile-data-subheadline">
				Save profile information to manage teams easily
				</div>
				<div className="missing-profile-data-modal-inputs">
					<div className="row">
						<TextInputExtendedComponent
						    customWrapperClass={'col-xs-12'}
							required={true}
							name="firstName"
							label="First Name"
							value={firstName}
							onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
							errorMessage={errors.firstName}
						/>
					</div>
					<div className="row">
						<TextInputExtendedComponent
						    customWrapperClass={'col-xs-12'}
							required={true}
							name="lastName"
							label="Last Name"
							onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
							value={lastName}
							errorMessage={errors.lastName}
						/>
					</div>
					<div className="row">
						<TextInputExtendedComponent
							customWrapperClass={'col-xs-12'}
							required={false}
							name="companyName"
							label="Company Name"
							onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
							value={companyName}
						/>
					</div>
					<div className="row">
						<TextInputExtendedComponent
							customWrapperClass={'col-xs-12'}
							required={true}
							name="companyStreetAddress"
							label="Address"
							onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
							value={companyStreetAddress}
							errorMessage={errors.companyStreetAddress}
						/>
					</div>
				</div>
				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							type="cancel"
							callback={() => {
								ModalService.close();
								invoiz.router.navigate('/settings/account');
							}}
							label={resources.str_cancel}
							dataQsId="modal-missing-profile-data-btn-close"
							loading={isLoading}
						/>
					</div>
					<div className="modal-base-confirm">
						<ButtonComponent
							type="primary"
							callback={() => {
								this.updateUserData();
								callback && callback();
							}}
							label="Done"
							dataQsId="modal-missing-profile-data-btn-update"
							loading={isLoading}
							disabled={isMissingData}
						/>
					</div>
				</div>
			</div>
		);
	}
}

export default MissingProfileDataModalComponent;
