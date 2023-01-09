import React from 'react';
import invoiz from 'services/invoiz.service';
import PerfectScrollbar from 'perfect-scrollbar';
import sanitizeHtml from 'sanitize-html';
import LoaderComponent from 'shared/loader/loader.component';
import config from 'config';
import _ from 'lodash';
import { downloadFile } from 'helpers/downloadFile';
import CustomerEmailItem from 'models/customer-email-item.model';

class ExtendedEmailModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: false,
			showAllRecipients: false,
			showAllCopies: false,
			showAllBlindCopies: false,
			showAllfromAddresses: false,
			showAllAttachments: false,
			emails: props.emails || [],
			emailIdToShow: props.emailIdToShow,
			currentEmail: new CustomerEmailItem(props.emailToShow) || {},
			currentEmailAttachments: [],
			customerData: props.customerData || {},
			forceReload: false,
			firstLoadDone: false,
			relatedEmails: [],
		};

		this.initScrollbars = this.initScrollbars.bind(this);
		this.setEmailToShow = this.setEmailToShow.bind(this);
		this.getAttachments = this.getAttachments.bind(this);
		this.sanitizeEmailContent = this.sanitizeEmailContent.bind(this);
		this.perfectScrollbarForSidebar = null;
		this.perfectScrollbarForEmailContent = null;
		this.emailIsMounted = React.createRef();
		this.sideBarIsMounted = React.createRef();
	}

	componentDidMount() {
		this.fetchRelatedEmails()
			.then(() => {
				this.setEmailToShow(this.state.emailIdToShow);
				if (
					this.emailIsMounted &&
					this.emailIsMounted.current &&
					this.emailIsMounted.current !== null &&
					this.sideBarIsMounted &&
					this.sideBarIsMounted.current &&
					this.sideBarIsMounted.current !== null
				) {
					setTimeout(() => {
						this.initScrollbars();
					}, 0);
				}

				if (
					(this.props.emailIdToShow.isAttachmentIncluded || this.state.isAttachmentIncluded) &&
					this.currentEmailAttachments.length === 0
				) {
					this.getAttachments();
				}
			})
			.catch((err) => {
				console.log(err);
			});
		}

	componentDidUpdate() {
		if (
			!this.state.isLoading &&
			this.sideBarIsMounted &&
			this.sideBarIsMounted.current &&
			this.sideBarIsMounted.current !== null &&
			this.emailIsMounted &&
			this.emailIsMounted.current &&
			this.emailIsMounted.current !== null
		) {
			setTimeout(() => {
				this.initScrollbars();
			}, 100);
		}
	}

	initScrollbars() {
		if (!this.state.isLoading) {
			if (this.perfectScrollbarForEmailContent) {
				this.perfectScrollbarForEmailContent.destroy();
				this.perfectScrollbarForEmailContent = null;
			}

			if (this.perfectScrollbarForSidebar) {
				this.perfectScrollbarForSidebar.destroy();
				this.perfectScrollbarForSidebar = null;
			}

			this.perfectScrollbarForSidebar = new PerfectScrollbar('.extended-email-sidebar-scroll-container', {
				suppressScroll: true,
			});
			this.perfectScrollbarForEmailContent = new PerfectScrollbar('.extended-email-content-scroll-container', {
				suppressScrollX: true,
			});
		}
	}

	componentWillUnmount() {
		if (this.perfectScrollbarForSidebar) {
			this.perfectScrollbarForSidebar.destroy();
			this.perfectScrollbarForSidebar = null;
		}

		if (this.perfectScrollbarForEmailContent) {
			this.perfectScrollbarForEmailContent.destroy();
			this.perfectScrollbarForEmailContent = null;
		}
	}

	fetchRelatedEmails() {
		return new Promise((resolve, reject) => {
			invoiz
				.request(`${config.resourceHost}email/related/${this.props.emailIdToShow}`, {
					auth: true,
				})
				.then(({ body: { data } }) => {
					this.setState(
						{
							relatedEmails:
								data.length === 0
									? [this.state.currentEmail]
									: data.map((emailItem) => {
											return new CustomerEmailItem(emailItem);
									  }),
						},
						() => {
							resolve();
						}
					);
				})
				.catch((err) => {
					console.log(err);
					reject(err);
				});
		});
	}

	setEmailToShow(id) {
		const forceReload = !this.state.forceReload;

		if (id === this.state.currentEmail.id && this.state.firstLoadDone) {
			return;
		}
		this.setState(
			{
				isLoading: true,
				forceReload,
				currentEmail: {},
				currentEmailAttachments: [],
				showAllAttachments: false,
				showAllBlindCopies: false,
				showAllCopies: false,
				showAllRecipients: false,
				showAllfromAddresses: false,
			},
			() => {
				invoiz
					.request(`${config.resourceHost}email/customer/${id}/${this.props.customerData.id}`, {
						auth: true,
					})
					.then((currentEmailData) => {
						const currentEmail = new CustomerEmailItem(currentEmailData.body.data);

						if (currentEmail.isAttachmentIncluded) {
							this.fetchAttachments(id).then((rslt) => {
								this.setState({
									currentEmail,
									currentEmailAttachments: rslt,
									isLoading: false,
									firstLoadDone: true,
								});
							});
						} else {
							this.setState({
								currentEmail,
								isLoading: false,
								firstLoadDone: true,
							});
						}
					})
					.catch((err) => {
						console.log(err);
						this.setState({
							isLoading: false,
						});
					});
			}
		);
	}

	fetchAttachments(id) {
		return new Promise((resolve, reject) => {
			invoiz
				.request(`${config.resourceHost}email/attachments/${id}`, {
					auth: true,
				})
				.then(({ body }) => {
					resolve(body.data);
				})
				.catch((err) => {
					reject(err);
				});
		});
	}

	sanitizeEmailContent() {
		const content = this.state.currentEmail.body;
		let editedContent = '';
		if (content) {
			editedContent = content.replace(/&nbsp;/g, ' ');

			return sanitizeHtml(editedContent, {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(['u']),
				exclusiveFilter: (frame) => {
					return frame.tag === 'p' && !frame.text.trim();
				},
				transformTags: {
					a: sanitizeHtml.simpleTransform('a', { target: '_blank' }, true),
				},
			});
		}
	}

	createEmailList() {
		const { currentEmail, relatedEmails } = this.state;

		return relatedEmails.map((email, index) => {
			return (
				<div
					key={`email-${email.subject}-${index}`}
					className={`extended-email-sidebar-list-item ${email.id === currentEmail.id ? 'active' : ''} u_vc`}
					onClick={() => {
						this.setEmailToShow(email.id);
					}}
				>
					<div className={`icon icon-pdf ${email.emailType === 'sent' ? 'up' : ''} u_mr_10`}></div>
					<div className="email-item-subject text-truncate text-medium u_mr_10">{email.subject}</div>
					<div className="text-small">
						{email.fromToday.today ? email.timeSubstring : email.yearAndMonthDays.dayAndMonth}
					</div>
				</div>
			);
		});
	}

	getRecipients() {
		const { currentEmail } = this.state;
		const recipients = (currentEmail && currentEmail.toAddresses) || [];
		const recipientsString = recipients.map((recipient, index) => {
			return `${recipient.Address}${
				recipients.length - 1 > index || recipients.length - 1 !== index ? ', ' : ''
			}`;
		});

		if (this.state.showAllRecipients || recipientsString.toString().length < 86) {
			return recipientsString;
		} else {
			return (
				<React.Fragment>
					{recipients[0].Address}
					<div
						className="extended-email-link text-primary u_ml_4"
						onClick={() => this.setState({ showAllRecipients: true })}
					>
						+ {recipients.length - 1} weitere
					</div>
				</React.Fragment>
			);
		}
	}

	getSenders() {
		const { currentEmail } = this.state;

		const fromAddresses = (currentEmail && currentEmail.fromAddresses) || [];
		const fromAddressesString = fromAddresses.map((fromAddress, index) => {
			return `${fromAddress.Address}${
				fromAddresses.length - 1 > index || fromAddresses.length - 1 !== index ? ', ' : ''
			}`;
		});

		if (this.state.showAllfromAddresses || fromAddressesString.toString().length < 86) {
			return fromAddressesString;
		} else {
			return (
				<React.Fragment>
					{fromAddresses[0].Address}
					<div
						className="extended-email-link text-primary u_ml_4"
						onClick={() => this.setState({ showAllfromAddresses: true })}
					>
						+ {fromAddresses.length - 1} weitere
					</div>
				</React.Fragment>
			);
		}
	}

	getCopies() {
		const { currentEmail } = this.state;

		const copies = (currentEmail && currentEmail.cc) || [];
		const copiesString = copies.map((copy, index) => {
			return `${copy.Address}${copies.length - 1 > index || copies.length - 1 !== index ? ', ' : ''}`;
		});

		if (this.state.showAllRecipients || copiesString.toString().length < 86) {
			return copiesString;
		} else {
			return (
				<React.Fragment>
					{copies[0].Address}
					<div
						className="extended-email-link text-primary u_ml_4"
						onClick={() => this.setState({ showAllCopies: true })}
					>
						+ {copies.length - 1} weitere
					</div>
				</React.Fragment>
			);
		}
	}

	getBlindCopies() {
		const { currentEmail } = this.state;

		const blindCopies = (currentEmail && currentEmail.bcc) || [];
		const blindCopiesString = blindCopies.map((blindCopy, index) => {
			return `${blindCopy.Address}${
				blindCopies.length - 1 > index || blindCopies.length - 1 !== index ? ', ' : ''
			}`;
		});

		if (this.state.showAllRecipients || blindCopiesString.toString().length < 86) {
			return blindCopiesString;
		} else {
			return (
				<React.Fragment>
					{blindCopies[0].Address}
					<div
						className="extended-email-link text-primary u_ml_4"
						onClick={() => this.setState({ showAllBlindCopies: true })}
					>
						+ {blindCopies.length - 1} weitere
					</div>
				</React.Fragment>
			);
		}
	}

	getAttachments() {
		const { currentEmailAttachments, currentEmail, showAllAttachments } = this.state;
		const firstAttachment = currentEmailAttachments && currentEmailAttachments[0];

		if (
			currentEmailAttachments &&
			currentEmailAttachments.length > 0 &&
			currentEmail.isAttachmentIncluded &&
			firstAttachment
		) {
			if (!showAllAttachments && currentEmailAttachments.length !== 1) {
				return (
					<React.Fragment>
						<div
							key={`attachment-${currentEmail.id}-${firstAttachment.id}`}
							className="extended-email-attachment"
							onClick={() => this.downloadAttachment(firstAttachment)}
						>
							{firstAttachment.name}
						</div>
						<span
							className="extended-email-link text-primary u_ml_4"
							onClick={() => this.setState({ showAllAttachments: true })}
						>
							+ {currentEmailAttachments.length - 1} weitere
						</span>
					</React.Fragment>
				);
			} else {
				return currentEmailAttachments.map((attachment, index) => {
					return (
						<div
							key={`attachment-${currentEmail.id}-${attachment.id}`}
							className="extended-email-attachment"
							onClick={() => this.downloadAttachment(attachment)}
						>
							{attachment.name}
						</div>
					);
				});
			}
		}
	}

	downloadAttachment(attachment) {
		const { id, name, mimetype } = attachment;
		downloadFile(`${config.resourceHost}email/download/${id}`, name, mimetype);
	}

	getInitials() {
		const { customerData } = this.props;
		if (customerData.firstName && customerData.lastName) {
			return _.compact([customerData.firstName, customerData.lastName])
				.map((name) => name.charAt(0))
				.join('');
		} else {
			return customerData.email.slice(0, 2);
		}
	}

	render() {
		const { onConfirm, customerData } = this.props;
		const { currentEmail, isLoading, currentEmailAttachments } = this.state;
		const emailRows = this.createEmailList();

		return (
			<React.Fragment>
				<div className="extended-email-modal">
					<div className="extended-email-sidebar">
						<div className="extended-email-sidebar-wrapper">
							<div className="extended-email-sidebar-header text-semibold text-truncate">
								{currentEmail.subject}
							</div>
							<div className="extended-email-sidebar-scroll-container" ref={this.sideBarIsMounted}>
								<div className="extended-email-sidebar-list">{emailRows}</div>
							</div>
						</div>
					</div>
					{isLoading ? (
						<LoaderComponent visible={true} />
					) : (
						<div className="extended-email-wrapper">
							<div className="extended-email-header">
								<div className="extended-email-title u_vc">
									<div className="avatar-container u_mr_12">
										<div className="extended-email-avatar u_c">
											{customerData.isPerson ? (
												this.getInitials()
											) : (
												<div className="icon icon-factory" />
											)}
										</div>
									</div>
									<div className="extended-email-subject text-h4 text-truncate">
										{currentEmail.subject}
									</div>
								</div>
								<div className="u_vc u_mb_10 u_pl_4">
									<div className="extended-email-detail-label text-light text-medium">Von:</div>
									<div className="extended-email-detail-text text-semibold">{this.getSenders()}</div>
									<div className="text-medium">
										{currentEmail.dateSubstring} {currentEmail.timeSubstring}
									</div>
								</div>
								<div className="u_hc u_mb_10 u_pl_4">
									<div className="extended-email-detail-label text-light text-medium">An:</div>
									<div className="extended-email-detail-text text-semibold text-medium">
										{this.getRecipients()}
									</div>
								</div>
								{currentEmail && currentEmail.cc && currentEmail.cc.length > 0 ? (
									<div className="u_hc u_mb_10 u_pl_4">
										<div className="extended-email-detail-label text-light text-medium">Cc:</div>
										<div className="extended-email-detail-text text-semibold text-medium">
											{this.getCopies()}
										</div>
									</div>
								) : null}

								{currentEmail && currentEmail.bcc && currentEmail.bcc.length > 0 ? (
									<div className="u_hc u_mb_10 u_pl_4">
										<div className="extended-email-detail-label text-light text-medium">Bcc:</div>
										<div className="extended-email-detail-text text-semibold text-medium">
											{this.getBlindCopies()}
										</div>
									</div>
								) : null}
								{currentEmail &&
								currentEmail.isAttachmentIncluded &&
								currentEmailAttachments &&
								currentEmailAttachments.length > 0 ? (
									<div className="u_vc extended-email-detail-attachments-container">
										<div className="extended-email-detail-label text-light text-medium icon icon-attachment"></div>
										<div className="extended-email-detail-text text-medium">
											{this.getAttachments()}
										</div>
									</div>
								) : null}
							</div>
							<div className="extended-email-content">
								<div
									ref={this.emailIsMounted}
									className="extended-email-content-scroll-container"
									dangerouslySetInnerHTML={{ __html: this.sanitizeEmailContent() }}
								>
									{/* {this.sanitizeEmailContent(currentEmail.body)} */}
								</div>
							</div>
							<div className="extended-email-footer u_vc">
								<div className="extended-email-close-action u_vc" onClick={() => onConfirm()}>
									<div className="icon icon-cancel u_mr_10"></div>
									Schließen
								</div>
							</div>
						</div>
					)}
				</div>
			</React.Fragment>
		);
	}
}

export default ExtendedEmailModalComponent;
