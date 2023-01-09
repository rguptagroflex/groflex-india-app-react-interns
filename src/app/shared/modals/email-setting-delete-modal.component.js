import React from 'react';
import invoiz from 'services/invoiz.service';
import lang from 'lang';
import ButtonComponent from 'shared/button/button.component';
import ModalService from 'services/modal.service';
import SVGInline from 'react-svg-inline';
import exclMark from 'assets/images/icons/exclamation_mark2.svg';
import config from 'config';

const EmailSettingDeleteModalComponent = React.forwardRef((props, ref) => {
	const deleteEmails = (deleteWithEmails) => {
		const queryString = props.delete ? 'setting/email/' : 'email/account/';
		const deleteEmails = deleteWithEmails ? 'true' : 'false';

		if (props.emailAccounts) {
			Promise.all(
				props.emailAccounts.map((emailAccount) => {
					return invoiz
						.request(`${config.resourceHost}${queryString}${emailAccount.id}${props.delete ? `/${deleteEmails}` : ''}`, {
							auth: true,
							method: 'DELETE',
						})
						.then(() => {
							invoiz.showNotification(
								`Die Verbindung zu deinem E-Mail-Konto ${emailAccount.emailAddress} wurde erfolgreich entfernt`
							);
						})
						.catch(() => {
							invoiz.showNotification({ message: lang.defaultErrorMessage, type: 'error' });
						});
				})
			)
				.then(() => {
					props.cb && props.cb();
				})
				.catch(() => {
					invoiz.showNotification({ message: lang.defaultErrorMessage, type: 'error' });
				});
		} else if (props.email) {
			invoiz
				.request(`${config.resourceHost}${queryString}${props.email.id}/${deleteEmails}`, {
					auth: true,
					method: 'DELETE',
				})
				.then(() => {
					if (ref) {
						invoiz.showNotification(
							`Die Verbindung zu deinem E-Mail-Konto ${props.email.emailAddress} wurde erfolgreich entfernt`
						);
						ref.classList.add('hidden');
						props.cb && props.cb();
					}
				})
				.catch(() => {
					invoiz.showNotification({ message: lang.defaultErrorMessage, type: 'error' });
				});
		}
		ModalService.close();
	};

	const { isImapActivated } = props.emailActivationStatus;
	const { wasImapActivated } = props;

	const isImapDeactivated = isImapActivated !== wasImapActivated;

	return (
		<div className="has-footer-big email-setting-delete-modal u_c">
			<div className="connection-delete-wrapper">
				<div className="icon-container u_c">
					<SVGInline className="connection-delete-icon" svg={exclMark} height={'50px'} />
				</div>
				{isImapDeactivated || isImapActivated ? (
					props.emailAccounts && props.emailAccounts.length > 1 ? (
						<div className="text-h4 u_mb_20">
							Die Verknüpfung deiner
							<br /> E-Mail-Konten wurden entfernt
						</div>
					) : (
						<div className="text-h4 u_mb_20">
							Die Verknüpfung deines
							<br /> E-Mail-Kontos wird entfernt
						</div>
					)
				) : (
					<div className="text-h4 u_mb_20">Möchtest du dein Konto wirklich entfernen?</div>
				)}

				{(isImapDeactivated || isImapActivated) && (
					<div className="connection-delete-subtext">
						Möchtest du die gespeicherten Mails weiterhin in invoiz archiviert haben?
					</div>
				)}
			</div>
			<div className="modal-base-footer">
				<div className="modal-base-cancel">
					<ButtonComponent
						type="cancel"
						callback={() => {
							(isImapDeactivated || isImapActivated) &&
								props.callbackToChangeBack &&
								props.callbackToChangeBack();
							ModalService.close();
						}}
						label={lang.cancel}
						dataQsId="modal-email-btn-cancel"
					/>
				</div>

				<div className="modal-base-confirm u_vc">
					<div className={isImapDeactivated || isImapActivated ? 'u_mr_10' : ''}>
						<ButtonComponent
							type={isImapDeactivated || isImapActivated ? 'secondary' : 'primary'}
							callback={() => {
								deleteEmails(true);
							}}
							label={isImapDeactivated || isImapActivated ? 'Mails verwerfen' : 'Entfernen'}
							dataQsId="modal-email-delete-btn-confirm"
						/>
					</div>
					{isImapDeactivated || isImapActivated ? (
						<ButtonComponent
							type="primary"
							callback={() => {
								deleteEmails(false);
							}}
							label={'Mails behalten'}
							dataQsId="modal-email-keep-btn-confirm"
						/>
					) : null}
				</div>
			</div>
		</div>
	);
});

export default EmailSettingDeleteModalComponent;
