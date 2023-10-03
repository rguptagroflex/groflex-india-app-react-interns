import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import { notificationTypes } from 'helpers/constants';
import OvalToggleComponent from 'shared/oval-toggle/oval-toggle.component';
import userPermissions from 'enums/user-permissions.enum';

class NotificationsComponent extends React.Component {
	constructor(props) {
		super();

		this.state = {
			notificateEmail: props.account.notificateEmail,
			notificatePush: props.account.notificatePush,
			canUpdateEmail: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_EMAIL_INTEGRATION)
		};
	}

	onCheckboxValueChange(type, value) {
		const { resources } = this.props;
		const data = {};
		const newState = {};

		switch (type) {
			case notificationTypes.NOTIFICATION_TYPE_PUSH:
				data.notificatePush = value;
				newState.notificatePush = value;
				break;
			case notificationTypes.NOTIFICATION_TYPE_EMAIL:
				data.notificateEmail = value;
				newState.notificateEmail = value;
				break;
		}

		invoiz
			.request(config.settings.endpoints.notification, {
				method: 'POST',
				data,
				auth: true
			})
			.then(() => {
				invoiz.page.showToast(resources.notificationSaveSuccesMessage);
				this.setState(newState);
			})
			.catch(() => {
				invoiz.page.showToast({
					message: resources.notificationSaveErrorMessage,
					type: 'error'
				});
			});
	}

	render() {
		const { notificateEmail, notificatePush, canUpdateEmail } = this.state;
		const { resources } = this.props;
		return (
			<div className="settings-notifications-component u_p_20">
				<div className="row "> {/*u_pt_60 u_pb_40  u_pt_20*/}
					<div className="col-xs-12 text-h4 u_pb_20">{resources.str_notifications}</div>
					{/* <div className="col-xs-12"> */}
					<div className="col-xs-10">
						<div className="u_pb_10 notifications-info">
							<span>{resources.notificationSettingInfo}</span>
						</div>
						</div>

						<div className="col-xs-2">
							<div className="row">
								<OvalToggleComponent
							
									labelLeft
									onChange={() => {
										if (canUpdateEmail) {
											this.onCheckboxValueChange(
												notificationTypes.NOTIFICATION_TYPE_EMAIL,
												!notificateEmail
											);
										}
									}}
									checked={notificateEmail}
									// labelText={resources.str_byEmail}
									newStyle={true}
									customClass={'toggle-email'}
								/>

								{/* <OvalToggleComponent
									labelLeft
									onChange={() => {
										this.onCheckboxValueChange(
											notificationTypes.NOTIFICATION_TYPE_PUSH,
											!notificatePush
										);
									}}
									checked={notificatePush}
									labelText={resources.str_bySmartphone}
									newStyle={true}
									customClass={'toggle-phone'}
								/> */}
							</div>
						</div>
					{/* </div> */}
				</div>
			</div>
		);
	}
}

export default NotificationsComponent;
