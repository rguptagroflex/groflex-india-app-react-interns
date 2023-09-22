import React, { useState } from "react";
import RoleSelectComponent from "shared/multiuser/role-select.component";
import ModalService from "services/modal.service";
import ButtonComponent from "shared/button/button.component";
import lang from "lang";
import multiUserRoleType from "enums/multiuser-role-type.enum";

class ChangeUserRoleModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			step: 0,
			setStep: 0,
			selectedRole: "",
			setSelectedRole: "",
		};
		this.onRadioChange = this.onRadioChange.bind(this);
	}
	onRadioChange(role) {
		this.setState({
			selectedRole: role,
		});
	}
	setStep(step) {
		this.setState({
			step,
		});
	}
	render() {
		const { user, onConfirm } = this.props;
		const { firstName, lastName } = user;
		const userInitRole = user.role && user.role[0];
		return (
			<div className="has-footer change-user-role-modal">
				{this.state.step === 0 ? (
					<div>
						<div className="change-user-role-modal-headline text-semibold">Change role</div>
						<div className="change-user-role-modal-subheadline">
							Determine the permissions for the user{" "}
							<span className="text-semibold">
								{firstName} {lastName}
							</span>
						</div>
						<RoleSelectComponent
							onRadioChange={this.onRadioChange}
							selectedRole={this.state.selectedRole === "" ? userInitRole : this.state.selectedRole}
							isInvite={false}
						/>
					</div>
				) : (
					<div>
						<div className="change-user-role-modal-headline text-semibold">Make the owner</div>
						<div className="change-user-role-modal-subheadline">
							Are you sure that you {firstName} {lastName} want to make the owner of this invoiz account?
							You cannot change this afterwards.
						</div>
					</div>
				)}

				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							type="cancel"
							callback={() => ModalService.close()}
							label="Cancel"
							dataQsId="modal-user-invite-btn-close"
						/>
					</div>
					<div className="modal-base-confirm">
						<ButtonComponent
							type="primary"
							callback={() => {
								if (this.state.selectedRole === multiUserRoleType.OWNER) {
									if (this.state.step === 0) {
										this.setStep(this.state.step + 1);
									} else {
										onConfirm && onConfirm(user, this.state.selectedRole);
										ModalService.close();
									}
								} else {
									onConfirm && onConfirm(user, this.state.selectedRole);
									ModalService.close();
								}
							}}
							label={this.state.step === 0 ? "Save" : "Make owner"}
							dataQsId="modal-user-invite-btn-update-or-send"
							disabled={this.state.selectedRole === userInitRole || this.state.selectedRole === ""}
						/>
					</div>
				</div>
			</div>
		);
	}
}

export default ChangeUserRoleModal;
