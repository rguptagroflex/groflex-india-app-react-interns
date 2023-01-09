import invoiz from "services/invoiz.service";
import React from "react";
import moment from "moment";
import ButtonComponent from "shared/button/button.component";
import PerfectScrollbar from "perfect-scrollbar";
import config from "config";

import { downloadPdf } from "../../helpers/downloadPdf";
import { downloadFile } from "helpers/downloadFile";
import lang from "lang";

class EmailPreviewModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			attachments: [],
		};

		this.perfectScrollbar = null;
		this.fetchAttachments = this.fetchAttachments.bind(this);
	}

	componentDidMount() {
		if (this.props.emailId) {
			this.fetchAttachments().then((resp) => {
				const initAttachments = this.props.email.attachments;
				initAttachments.forEach((attachment) => {
					if (resp && resp.length > 0) {
						resp.forEach((respAttachment) => {
							if (attachment.filename === respAttachment.name) {
								attachment.id = respAttachment.id;
								attachment.isInvoizAttachment = false;
							} else {
								attachment.isInvoizAttachment = true;
							}
						});
					} else {
						attachment.isInvoizAttachment = true;
					}
				});

				this.setState({
					attachments: initAttachments,
				});
				setTimeout(() => {
					this.perfectScrollbar = new PerfectScrollbar(".email-preview-modal-scroll-container", {
						suppressScrollX: true,
					});
				}, 0);
			});
		}
	}

	componentWillUnmount() {
		if (this.perfectScrollbar) {
			this.perfectScrollbar.destroy();
		}
	}

	fetchAttachments() {
		return new Promise((resolve, reject) => {
			invoiz
				.request(`${config.resourceHost}email/attachments/${this.props.emailId}`, {
					auth: true,
				})
				.then(({ body }) => {
					resolve(body.data);
				})
				.catch((err) => {
					console.log(err);
					reject(err);
				});
		});
	}

	downloadAttachment(attachment) {
		const { item } = this.props;

		if (attachment.isInvoizAttachment) {
			const typeForRequest = item.getType + "Id";
			const endpoint = `${item.getType}/${parseInt(item[typeForRequest], 10)}/document`;
			invoiz
				.request(`${config.resourceHost}${endpoint}`, {
					method: "POST",
					auth: true,
					data: {
						isPrint: false,
					},
				})
				.then(({ body: { data: path } }) => {
					downloadPdf({
						pdfUrl: config.imageResourceHost + path.path,
						title: attachment.filename,
						isPost: false,
					});
				})
				.catch(() => {
					invoiz.showNotification({ message: lang.defaultErrorMessage, type: "error" });
				});
		} else {
			downloadFile(
				`${config.resourceHost}email/download/${attachment.id}`,
				attachment.filename,
				attachment.contentType
			);
		}
	}

	render() {
		const { date, email, type, onConfirm } = this.props;
		const { attachments } = this.state;
		const types = {
			offer: "quotation",
			challan: "delivery challan",
			invoice: "invoice",
			expense: "expense",
			purchaseOrder: "purchase order",
		};
		let href;

		if (type === "invoice") {
			href = email.linkToInvoiceCustomerCenter;
		} else if (type === "offer") {
			href = email.linkToOfferCustomerCenter;
		} else if (type === "challan") {
			href = email.linkToChallanCustomerCenter;
		} else if (type === "deliverynote") {
			href = email.linkToDeliveryNoteCustomerCenter;
		} else if (type === "purchaseOrder") {
			href = email.linkToDeliveryNoteCustomerCenter;
		}
		return (
			<React.Fragment>
				<div className="email-preview-modal has-footer u_mb_60">
					<div className="email-preview-modal-scroll-container">
						<h5 className="headline text-h5 u_mt_0">Preview sent e-mail</h5>
						<div className="text-small text-muted u_mb_4">Date</div>
						<div className="u_mb_16">{moment(date).format("DD/MM/YYYY, HH:mm")}</div>
						<div className="text-small text-muted u_mb_4">Recipient</div>
						<div className="u_mb_16">
							{email.to.map((to, index) => {
								return <span key={index}>{`${to}${index < email.to.length - 1 ? `, ` : ``}`}</span>;
							})}
						</div>
						<div className="text-small text-muted u_mb_4">Subject</div>
						<div className="u_mb_16">{email.subject}</div>
						<div className="email-text u_mb_16">
							<div className="u_mb_16" dangerouslySetInnerHTML={{ __html: email.text }}></div>
							<a className="email-link" target="_blank">
								<span>&rarr;</span>
								{`View ${types[type]} online`}
							</a>
							<div className="u_mb_16" dangerouslySetInnerHTML={{ __html: email.textAdditional }}></div>
						</div>
						{attachments && !!attachments.length && (
							<React.Fragment>
								<div className="text-small text-muted u_mb_4">Attachments</div>
								{attachments.map((attachment, index) => {
									return (
										<div
											className="u_vc text-truncate email-attachment-row"
											key={index}
											onClick={() => this.downloadAttachment(attachment)}
										>
											<div className="icon icon-attachment text-muted u_mr_6"></div>
											{attachment.filename}
										</div>
									);
								})}
							</React.Fragment>
						)}
					</div>
				</div>
				<div className="modal-base-footer">
					<div className="modal-base-confirm">
						<ButtonComponent
							type={"primary"}
							callback={() => onConfirm()}
							label={"Close"}
							dataQsId="modal-btn-confirm"
						/>
					</div>
				</div>
			</React.Fragment>
		);
	}
}

export default EmailPreviewModalComponent;
