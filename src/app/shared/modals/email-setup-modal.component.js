import React from 'react';
import config from 'config';
import _ from 'lodash';
import lang from 'lang';
import invoiz from 'services/invoiz.service';
import SVGInline from 'react-svg-inline';
import ButtonComponent from 'shared/button/button.component';
import ModalService from 'services/modal.service';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import EmailSettingsModalStatus from 'enums/email-settings-modal-status.enum';
import mail from 'assets/images/icons/mail.svg';
import exclMark from 'assets/images/icons/exclamation_mark2.svg';
import check from 'assets/images/icons/check.svg';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';

const ERROR_MESSAGE = 'Dieses Feld ist ein Pflichtfeld';

class EmailSetupModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: false,
			currentStatus: props.status || EmailSettingsModalStatus.EDITING,
			emailAccountId: props.emailAccountId,
			currentEmailAccount: props.currentEmailAccount,
			showIsDefault: props.showIsDefault,
			emailAccounts: props.emailAccounts,
			addOnLoad: props.addOnLoad || false,
			emailSettings: {
				email: props.emailAddress || (props.emailSettings && props.emailSettings.email) || '',
				password: props.emailPassword || '',
				imapHost: '',
				imapName: '',
				imapPort: 'auto',
				smtpHost: '',
				smtpName: '',
				smtpPort: 'auto',
				secure: false,
				isDefault: false,
				sendViaOwnAccount: false,
			},
			errors: {
				email: '',
				password: '',
				imapHost: '',
				imapName: '',
				smtpHost: '',
				smtpName: '',
			},
		};
		this.emailAddressRef = React.createRef();
		this.setToDefault = this.setToDefault.bind(this);
	}

	componentDidMount() {
		this.parseEmailData();

		if (this.props.addOnLoad === true) {
			this.addOnLoad();
		} else {
			if (this.props.status === EmailSettingsModalStatus.LOADING_IMAP) {
				this.setState(
					{
						currentStatus: EmailSettingsModalStatus.LOADING_IMAP,
					},
					() => {
						if (this.props.emailAccountId) {
							this.getEmailSettingDetails(this.props.emailAccountId);
						}
					}
				);
			} else if (this.props.status === EmailSettingsModalStatus.EDITING && this.props.emailAccountId) {
				this.getEmailSettingDetails(this.props.emailAccountId);
			}
		}
	}

	addOnLoad() {
		const { emailSettings, emailAccounts } = this.props;
		const { password, smtpPort } = emailSettings;
		let { email } = emailSettings;
		const emailAddress = email;

		const name = emailAddress.substring(0, emailAddress.lastIndexOf('@'));
		const host = emailAddress.substring(emailAddress.lastIndexOf('@') + 1);
		email = emailAddress;

		const otherEmailIsDefault = () => {
			let isOtherEmailDefault = false;
			emailAccounts
				.filter((emailAccountToCheck) => {
					return emailAccountToCheck.id !== this.state.emailAccountId;
				})
				.forEach((emailAccountToQuery) => {
					if (emailAccountToQuery.isDefault) {
						isOtherEmailDefault = true;
					}
				});
			return isOtherEmailDefault;
		};

		emailSettings.email = email;
		emailSettings.password = password;
		emailSettings.imapName = name;
		emailSettings.imapHost = host ? `imap.${host}` : '';
		emailSettings.smtpName = name;
		emailSettings.smtpHost = host ? `smtp.${host}` : '';
		emailSettings.isDefault = emailAccounts.length === 0 || !otherEmailIsDefault();
		emailSettings.secure = !(smtpPort === 587);

		this.setState(
			{
				isLoading: true,
			},
			() => {
				invoiz
					.request(`${config.resourceHost}setting/email`, {
						auth: true,
						method: 'POST',
						data: emailSettings,
					})
					.then(({ body: { data } }) => {
						this.props.connectCallback && this.props.connectCallback(data);
						this.setState({
							currentEmailAccount: data,
							emailAccountId: data.id,
							currentStatus: this.props.isImapActivated
								? EmailSettingsModalStatus.CONNECTION_SUCCESS_IMAP
								: EmailSettingsModalStatus.CONNECTION_SUCCESS_SMTP,
						});
					})
					.catch((err) => {
						console.log('error', err);
						if (err.body.meta.error[0].code.indexOf('Invalid login') > -1) {
							invoiz.showNotification({ message: err.body.message, type: 'error' });
							this.setState({ currentStatus: EmailSettingsModalStatus.CONNECTION_FAILED });
						} else {
							invoiz.showNotification({ message: 'Bitte prüfe deine Eingaben!', type: 'error' });
							this.setState({ currentStatus: EmailSettingsModalStatus.CONNECTION_FAILED });
						}
					});
			}
		);
	}

	setStateFromProps() {
		this.setState({
			emailSettings: {
				...this.state.emailSettings,
				email: this.props.emailAddress,
				password: this.props.emailPassword ? this.props.emailPassword : '',
			},
		});
	}

	getEmailSettingDetails(id) {
		invoiz
			.request(`${config.settings.endpoints.getEmailAccountSettings}${id}`, {
				auth: true,
			})
			.then(({ body }) => {
				const accountData = body;

				const { emailAddress, imapSettings, smtpSettings, isDefault, imapName, smtpName, secure } = accountData;
				const imapPort = imapSettings.port;
				const imapHost = imapSettings.host;
				const smtpPort = smtpSettings.port;
				const smtpHost = smtpSettings.host;
				const email = emailAddress;
				const host = email.substring(email.lastIndexOf('@') + 1);

				this.setState({
					emailSettings: {
						...this.state.emailSettings,
						email,
						password: '',
						imapName,
						imapHost: imapHost || `imap.${host}`,
						smtpName,
						smtpHost: smtpHost || `smtp.${host}`,
						imapPort,
						smtpPort,
						isDefault,
						secure,
					},
				});
			})
			.catch((err) => {
				console.log(err);
			});
	}

	addEmailAccount() {
		const { emailSettings, emailAccountId } = this.state;

		const accountIsAlreadySaved = () => {
			let accountIsSaved = false;
			this.props.emailAccounts.forEach((emailAccount) => {
				if (emailAccount.emailAddress === emailSettings.email) {
					accountIsSaved = true;
				}
			});
			return accountIsSaved;
		};

		const otherEmailIsDefault = () => {
			let isOtherEmailIsDefault = false;
			this.props.emailAccounts
				.filter((emailAccountToCheck) => {
					return emailAccountToCheck.id !== emailAccountId;
				})
				.forEach((emailAccountToQuery) => {
					if (emailAccountToQuery.isDefault) {
						isOtherEmailIsDefault = true;
					}
				});
			return isOtherEmailIsDefault;
		};

		emailSettings.isDefault = !otherEmailIsDefault();
		const isImapActivated = this.props.isImapActivated;

		emailSettings.secure = !(emailSettings.smtpPort === 587);

		if (accountIsAlreadySaved() === true) {
			invoiz.showNotification({ message: 'Das Konto ist schon vorhanden', type: 'error' });
			return;
		} else {
			this.setState(
				{
					currentStatus: EmailSettingsModalStatus.LOADING_IMAP,
				},
				() => {
					invoiz
						.request(`${config.resourceHost}setting/email`, {
							auth: true,
							method: 'POST',
							data: emailSettings,
						})
						.then(({ body: { data } }) => {
							this.props && this.props.connectCallback && this.props.connectCallback(data);
							this.setState({
								currentStatus: isImapActivated
									? EmailSettingsModalStatus.CONNECTION_SUCCESS_IMAP
									: EmailSettingsModalStatus.CONNECTION_SUCCESS_SMTP,
								currentEmailAccount: data,
								emailAccountId: data.id,
							});
						})
						.catch((err) => {
							this.setState({ currentStatus: EmailSettingsModalStatus.CONNECTION_FAILED });
							console.log(err);
							invoiz.showNotification({ message: 'Bitte prüfe deine Eingaben.', type: 'error' });
						});
				}
			);
		}
	}

	updateEmail() {
		const { emailSettings } = this.state;
		const { isImapActivated } = this.props;

		const otherEmailIsDefault = () => {
			let isOtherEmailIsDefault = false;
			this.props.emailAccounts
				.filter((emailAccountToCheck) => {
					return emailAccountToCheck.id !== this.state.emailAccountId;
				})
				.forEach((emailAccountToQuery) => {
					if (emailAccountToQuery.isDefault) {
						isOtherEmailIsDefault = true;
					}
				});
			return isOtherEmailIsDefault;
		};

		emailSettings.isDefault = !otherEmailIsDefault();

		emailSettings.secure = !(emailSettings.smtpPort === 587);

		this.setState(
			{
				currentStatus: EmailSettingsModalStatus.LOADING_IMAP,
			},
			() => {
				invoiz
					.request(`${config.resourceHost}setting/email/${this.props.emailAccountId}`, {
						auth: true,
						method: 'PUT',
						data: emailSettings,
					})
					.then(() => {
						this.setState({
							currentStatus: isImapActivated
								? EmailSettingsModalStatus.CONNECTION_SUCCESS_IMAP
								: EmailSettingsModalStatus.CONNECTION_SUCCESS_SMTP,
						});
					})
					.catch((err) => {
						this.setState({
							currentStatus: EmailSettingsModalStatus.UPDATE_FAILED,
							emailSettings: {
								...this.state.emailSettings,
								password: '',
							},
						});
						console.log(err);
					});
			}
		);
	}

	handleInputChange(evt, name, value) {
		this.setState({
			emailSettings: {
				...this.state.emailSettings,
				[name]: value,
			},
			errors: {
				...this.state.errors,
				[name]: '',
			},
		});
	}

	getImapPortSelectOptions() {
		const onChange = (selectedOption) => {
			const emailSettings = _.cloneDeep(this.state.emailSettings);
			emailSettings.imapPort = selectedOption.value;

			this.setState({ emailSettings });
		};

		return {
			searchable: false,
			placeholder: 'Auto',
			labelKey: 'label',
			valueKey: 'value',
			clearable: false,
			backspaceRemoves: false,
			handleChange: onChange,
			openOnFocus: false,
		};
	}

	getSmtpPortSelectOptions() {
		const onChange = (selectedOption) => {
			const emailSettings = _.cloneDeep(this.state.emailSettings);
			emailSettings.smtpPort = selectedOption.value;
			emailSettings.secure = !(emailSettings.smtpPort === 587);

			this.setState({ emailSettings });
		};

		return {
			searchable: false,
			placeholder: 'Auto',
			labelKey: 'label',
			valueKey: 'value',
			clearable: false,
			backspaceRemoves: false,
			handleChange: onChange,
			openOnFocus: false,
		};
	}

	sendEmailData() {
		const { emailSettings } = this.state;
		const { email, password, imapName, imapHost, smtpName, smtpHost } = emailSettings;
		for (const prop in emailSettings) {
			if (typeof emailSettings[prop] === 'string') {
				emailSettings[prop] = emailSettings[prop].trim();
			}
		}

		if (
			email.length === 0 ||
			password.length === 0 ||
			imapName.length === 0 ||
			imapHost.length === 0 ||
			smtpName.length === 0 ||
			smtpHost.length === 0
		) {
			this.setState({
				errors: {
					email: email.length === 0 ? ERROR_MESSAGE : '',
					password: password.length === 0 ? ERROR_MESSAGE : '',
					imapHost: imapHost.length === 0 ? ERROR_MESSAGE : '',
					imapName: imapName.length === 0 ? ERROR_MESSAGE : '',
					smtpHost: smtpHost.length === 0 ? ERROR_MESSAGE : '',
					smtpName: smtpName.length === 0 ? ERROR_MESSAGE : '',
				},
			});
		} else if (!config.emailCheck.test(email)) {
			this.setState({
				...this.state.emailSettings,
				errors: {
					...this.state.errors,
					email: 'Das ist keine gültige E-Mail-Adresse',
				},
			});
		} else {
			if (this.props.emailAccountId) {
				this.updateEmail();
			} else {
				this.addEmailAccount();
			}
		}
	}

	disableCheck() {
		const { emailSettings } = this.state;
		let isDisabled = false;

		for (const prop in emailSettings) {
			if (emailSettings[prop] === '' || emailSettings[prop] === 0 || emailSettings[prop] === null) {
				isDisabled = true;
			}
		}
		return isDisabled;
	}

	fetchMails(id) {
		invoiz
			.request(`${config.resourceHost}email/start/imap/${id}`, {
				auth: true,
			})
			.then(({ body: { eventId } }) => {
				WebStorageService.setItem(WebStorageKey.EMAIL_EVENT_ID, eventId);
				this.setState({
					currentStatus: EmailSettingsModalStatus.LOADING_SUCCESS_IMAP,
				});
			})
			.catch((err) => {
				console.log(err);
				invoiz.showNotification({ message: lang.defaultErrorMessage, type: 'error' });
			});
	}

	getInfoContent() {
		const { currentStatus } = this.state;
		const topPos20 =
			currentStatus === EmailSettingsModalStatus.LOADING_SUCCESS_IMAP ||
			currentStatus === EmailSettingsModalStatus.CONNECTION_SUCCESS_SMTP;

		if (
			currentStatus === EmailSettingsModalStatus.LOADING_IMAP ||
			currentStatus === EmailSettingsModalStatus.LOADING_SMTP
		) {
			return (
				<div className="u_c no-button-in-footer">
					<div className="loading-email-wrapper">
						<div className="loading-email-spinner-wrapper u_c">
							<div className="loading-email-spinner"></div>
							<SVGInline className="loading-email-envelope" svg={mail} width={'50px'} />
						</div>
						<div className="text-h4 u_mb_20">
							Die Verbindung zu deinem <br />
							Konto wird hergestellt
						</div>
						<div className="u_mb_24">Dieser Vorgang kann einige Minuten dauern.</div>
					</div>
				</div>
			);
		} else {
			let icon, title, subtitle, buttonLabel;

			if (currentStatus === EmailSettingsModalStatus.CONNECTION_SUCCESS_IMAP) {
				icon = <SVGInline svg={check} width="50px" />;
				title = 'Konto erfolgreich verknüpft';
				subtitle = (
					<div className="connection-subtext">
						Die Verknüpfung deines E&#8209;Mail&#8209;Kontos war erfolgreich.
						<br /> Deine Mails können jetzt abgerufen werden.
					</div>
				);
				buttonLabel = 'Mails abrufen';
			} else if (currentStatus === EmailSettingsModalStatus.CONNECTION_SUCCESS_SMTP) {
				icon = <SVGInline svg={check} width="50px" />;
				title = 'Konto erfolgreich verknüpft';
				subtitle = (
					<ButtonComponent
						type="primary"
						callback={() => {
							ModalService.close();
						}}
						label="Ok"
						dataQsId="modal-email-btn-ok"
					/>
				);
			} else if (currentStatus === EmailSettingsModalStatus.LOADING_SUCCESS_IMAP) {
				icon = <SVGInline svg={check} width="50px" />;
				title = 'Deine E-Mails werden abgerufen.';
				subtitle = (
					<React.Fragment>
						<div className="u_mb_24">
							Dieser Vorgang kann einige Minuten dauern.<br></br> Du kannst invoiz währenddessen weiter
							benutzen.
						</div>
						<ButtonComponent
							type="primary"
							callback={() => {
								ModalService.close();
							}}
							label="Fertig"
							dataQsId="modal-email-btn-ok"
						/>
					</React.Fragment>
				);
			} else if (currentStatus === EmailSettingsModalStatus.CONNECTION_FAILED) {
				const email =
					this.state.emailSettings.email !== ''
						? this.state.emailSettings.email
						: this.props.emailSettings.email;

				icon = <SVGInline svg={exclMark} height="50px" />;
				title = `Leider konnten wir dein
				E-Mail-Konto nicht ${this.state.addOnLoad ? 'automatisch' : ''} verknüpfen.`;

				let url = '';
				const emailSupportLinks = {
					gmail: 'https://support.google.com/mail/answer/7126229?hl=de',
					webde: 'https://hilfe.web.de/email/einstellungen/pop3-imap-einschalten.html',
					gmx: 'https://hilfe.gmx.net/pop-imap/einschalten.html#indexlink_help_pop-imap',
					icloud: 'https://support.apple.com/de-de/HT204397',
					telekom:
						'https://www.telekom.de/hilfe/festnetz-internet-tv/e-mail/e-mail-premiumleistungen/e-mails-ueber-ein-e-mail-programm-empfangen-und-senden',
					outlook:
						'https://support.microsoft.com/de-de/office/pop-imap-und-smtp-einstellungen-f%c3%bcr-outlook-com-d088b986-291d-42b8-9564-9c414e2aa040?ui=de-de&rs=de-de&ad=de',
				};

				const hostString = email.toLowerCase().substring(email.indexOf('@') + 1);
				const isGmail = hostString.match(/(gmail|googlemail)/g);
				const isKnownHost = hostString.match(
					/(gmail|googlemail|gmx.de|gmx.net|web.de|icloud.com|t-online.de|outlook.de|outlook.com|hotmail.de|hotmail.com)/g
				);

				if (isGmail) {
					url = emailSupportLinks['gmail'];
				} else if (hostString.match(/(gmx)/g)) {
					url = emailSupportLinks['gmx'];
				} else if (hostString.match(/(web.de)/g)) {
					url = emailSupportLinks['webde'];
				} else if (hostString.match(/(icloud)/g)) {
					url = emailSupportLinks['icloud'];
				} else if (hostString.match(/(t-online)/g)) {
					url = emailSupportLinks['telekom'];
				} else if (hostString.match(/(outlook|live.de|hotmail)/g)) {
					url = emailSupportLinks['outlook'];
				}

				if (isKnownHost) {
					if (isGmail) {
						subtitle = (
							<div className="connection-subtext">
								Google fordert unter Umständen eine zusätzliche Freischaltung zum Zugriff auf E&#8209;Mails. <br />
								Diese Freischaltung kannst du hier aktivieren:{' '}
								<a href="https://myaccount.google.com/lesssecureapps" target='_blank'>
									Freischaltung aktivieren
								</a>
								<br />
								<br />
								Bei E-Mail-Accounts von Google kann eine zusätzliche Freigabe notwendig sein. <br />
								Hier kannst du diese Freigabe bei Google erteilen:{' '}
								<a href="https://accounts.google.com/b/0/displayunlockcaptcha" target="_blank">
									Freigabe erteilen
								</a>
								<br />
								<br />
								Häufig muss bei deinem Mailanbieter der Zugriff erlaubt werden. <br />
								Hier findest du eine Anleitung dazu:{' '}
								<a href={url} target="_blank">
									Zugriff erlauben
								</a>
							</div>
						);
					} else {
						subtitle = (
							<div className="connection-subtext">
								Häufig muss bei deinem Mailanbieter der Zugriff erlaubt werden. <br />
								Hier findest du eine Anleitung dazu:{' '}
								<a href={url} target="_blank">
									Zugriff erlauben
								</a>
							</div>
						);
					}
				}
				buttonLabel = 'Manuell einrichten';
			} else if (currentStatus === EmailSettingsModalStatus.UPDATE_FAILED) {
				icon = <SVGInline svg={exclMark} height="50px" />;
				title = `Verbindung konnte nicht hergestellt werden.`;
				buttonLabel = 'Bearbeiten';
			}

			return (
				<div className={`${buttonLabel ? '' : 'no-button-in-footer'} ${topPos20 ? 'top-20' : ''}`}>
					<div className={`connection-failed-or-success-wrapper`}>
						<div className="icon-container u_c">{icon}</div>
						<div className="text-h4 u_mb_20">{title}</div>
						{subtitle}
					</div>
					{buttonLabel && (
						<div className="modal-base-footer">
							<div className="modal-base-cancel">
								<ButtonComponent
									type="cancel"
									callback={() => {
										ModalService.close();
									}}
									label={lang.cancel}
									dataQsId="modal-email-btn-cancel"
								/>
							</div>
							<div className="modal-base-confirm">
								<ButtonComponent
									type={`${
										currentStatus === EmailSettingsModalStatus.CONNECTION_FAILED &&
										this.state.addOnLoad
											? 'secondary'
											: 'primary'
									}`}
									callback={() => {
										if (currentStatus === EmailSettingsModalStatus.CONNECTION_SUCCESS_IMAP) {
											this.fetchMails(this.state.emailAccountId);
										} else {
											this.setState({
												currentStatus: EmailSettingsModalStatus.EDITING,
												addOnLoad: false,
											});
										}
									}}
									label={buttonLabel}
									dataQsId="modal-email-btn-confirm"
								/>
								{currentStatus === EmailSettingsModalStatus.CONNECTION_FAILED && this.state.addOnLoad && (
									<ButtonComponent
										type="primary"
										callback={() => {
											this.setState(
												{
													currentStatus: EmailSettingsModalStatus.LOADING_IMAP,
												},
												() => {
													this.addOnLoad();
												}
											);
										}}
										label="Erneut versuchen"
										dataQsId="modal-email-btn-try-again"
									/>
								)}
							</div>
						</div>
					)}
				</div>
			);
		}
	}

	parseEmailData() {
		const {
			email,
			password,
			imapName,
			imapHost,
			smtpName,
			smtpHost,
			imapPort,
			smtpPort,
		} = this.state.emailSettings;
		if (config.emailCheck.test(email) && !imapName && !imapHost && !smtpName && !smtpHost) {
			const name = email.substring(0, email.lastIndexOf('@'));
			const host = email.substring(email.lastIndexOf('@') + 1);

			this.setState({
				emailSettings: {
					...this.state.emailSettings,
					email,
					password,
					imapHost: host ? `imap.${host}` : '',
					imapName: name,
					smtpHost: host ? `smtp.${host}` : '',
					smtpName: name,
					imapPort: imapPort || 'auto',
					smtpPort: imapPort || 'auto',
					secure: !(smtpPort === 587),
				},
			});
		}
	}

	handleOnBlur() {
		this.parseEmailData(false);
	}

	setToDefault() {
		invoiz
			.request(`${config.resourceHost}setting/email/default/${this.state.emailAccountId}`, {
				auth: true,
				method: 'PUT',
				data: {
					isDefault: true,
				},
			})
			.then(() => {
				invoiz.showNotification({
					message: `${this.state.emailSettings.email} wurde als Standard festgelegt`,
				});
				this.getEmailSettingDetails(this.state.emailAccountId);
				this.props.listCallback && this.props.listCallback(this.state.emailAccountId);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	getWrapperClass() {
		let wrapperClass = '';

		if (this.state.currentStatus === EmailSettingsModalStatus.EDITING) {
			wrapperClass = 'email-setup-editing';
		} else {
			wrapperClass = 'email-setup-not-editing';
		}
		return wrapperClass;
	}

	render() {
		const {
			email,
			password,
			imapHost,
			imapName,
			imapPort,
			smtpHost,
			smtpName,
			smtpPort,
			isDefault,
		} = this.state.emailSettings;
		const { errors, currentStatus, showIsDefault } = this.state;

		return (
			<div className={`has-footer-big email-setup-modal u_c ${this.getWrapperClass()}`}>
				<React.Fragment>
					{currentStatus !== EmailSettingsModalStatus.EDITING ? (
						this.getInfoContent()
					) : (
						<div className="email-setup-modal-wrapper">
							<div className="text-h4 u_mb_20">Erweiterte Einstellungen</div>
							<div className="email-setup-modal-inputs">
								<div className="row">
									<div className="col-xs-6">
										<TextInputExtendedComponent
											name={'email'}
											value={email || ''}
											onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
											onBlur={() => this.handleOnBlur()}
											label={'E-Mail-Adresse'}
											autoComplete="off"
											spellCheck="false"
											inputClass="setup-e-mail-address"
											errorMessage={errors.email}
											variant="outlined-rounded"
											ref={this.emailAddressRef}
											autoFocus={true}
											selecOnFocus={false}
										/>
									</div>
									<div className="col-xs-6">
										<TextInputExtendedComponent
											name={'password'}
											value={password || ''}
											isPassword={true}
											onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
											label={'Passwort'}
											autoComplete="off"
											spellCheck="false"
											errorMessage={errors.password}
											variant="outlined-rounded"
										/>
									</div>
								</div>
								<div className="row">
									<div className="col-xs-12">
										<TextInputExtendedComponent
											name={'imapName'}
											value={imapName || ''}
											onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
											label={'Benutzername Posteingangs-Server'}
											autoComplete="off"
											spellCheck="false"
											errorMessage={errors.imapName}
											variant="outlined-rounded"
										/>
									</div>
								</div>
								<div className="row">
									<div className="col-xs-8">
										<TextInputExtendedComponent
											name={'imapHost'}
											value={imapHost || ''}
											onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
											label={'IMAP-Server-Adresse (Posteingangs-Server)'}
											autoComplete="off"
											spellCheck="false"
											errorMessage={errors.imapHost}
											variant="outlined-rounded"
										/>
									</div>
									<div className="col-xs-4">
										<SelectInputComponent
											name="imapPortSelectOptions"
											title="Port"
											allowCreate={false}
											notAsync={true}
											options={this.getImapPortSelectOptions()}
											value={imapPort}
											loadedOptions={[
												{
													label: 'Auto',
													value: 'auto',
												},
												{
													label: '143',
													value: 143,
												},
												{
													label: '993',
													value: 993,
												},
											]}
											variant="outlined-rounded"
											containerClass="higher-z-index"
										/>
									</div>
								</div>
								<div className="row">
									<div className="col-xs-12">
										<TextInputExtendedComponent
											name={'smtpName'}
											value={smtpName || ''}
											onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
											label={'Benutzername Postausgangs-Server'}
											autoComplete="off"
											spellCheck="false"
											errorMessage={errors.smtpName}
											variant="outlined-rounded"
										/>
									</div>
								</div>
								<div className="row">
									<div className="col-xs-8 u_mb_20">
										<TextInputExtendedComponent
											name={'smtpHost'}
											value={smtpHost || ''}
											onChange={(evt, name, value) => this.handleInputChange(value, name, evt)}
											label={'SMTP-Server-Adresse (Postausgangs-Server)'}
											autoComplete="off"
											spellCheck="false"
											errorMessage={errors.smtpHost}
											variant="outlined-rounded"
										/>
									</div>
									<div className="col-xs-4">
										<SelectInputComponent
											name="smtpPortSelectOptions"
											title="Port"
											allowCreate={false}
											notAsync={true}
											options={this.getSmtpPortSelectOptions()}
											value={smtpPort}
											loadedOptions={[
												{
													label: 'Auto',
													value: 'auto',
												},
												{
													label: '587',
													value: 587,
												},
												{
													label: '465',
													value: 465,
												},
											]}
											variant="outlined-rounded"
										/>
									</div>
								</div>
								{showIsDefault && this.state.emailAccountId && !isDefault && (
									<div className="row u_mb_20">
										<div className="col-xs-12">
											<div
												className="set-to-default text-semibold"
												onClick={() => this.setToDefault()}
											>
												Als Standard festlegen
											</div>
										</div>
									</div>
								)}
							</div>
							<div className="modal-base-footer">
								<div className="modal-base-cancel">
									<ButtonComponent
										type="cancel"
										callback={() => {
											ModalService.close();
										}}
										label={lang.cancel}
										dataQsId="modal-email-btn-cancel"
									/>
								</div>
								<div className="modal-base-confirm">
									<ButtonComponent
										type={'primary'}
										disabled={this.disableCheck()}
										callback={() => {
											this.sendEmailData();
										}}
										label={lang.connect}
										dataQsId="modal-email-btn-confirm"
										buttonIcon={'icon-check'}
									/>
								</div>
							</div>
						</div>
					)}
				</React.Fragment>
			</div>
		);
	}
}

export default EmailSetupModalComponent;
