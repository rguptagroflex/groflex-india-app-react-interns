// import React, { useState, useEffect } from "react";
// import ModalService from "../../services/modal.service";
// import ButtonComponent from "../../shared/button/button.component";
// import TextInputComponent from "../../shared/inputs/text-input/text-input.component";
// import TextInput from "../../shared/inputs/text-input-extended/text-input-extended.component";
// import SvgInline from "react-svg-inline";

// function generalLedgerSendEmail({ onConfirm }) {
// 	useEffect(() => {
// 		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
// 		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
// 		return () => {
// 			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
// 			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
// 		};
// 	});
// 	const handleSave = () => {
// 		ModalService.close();
// 	};
// 	return (
// 		<div className="add-chart-modal-container" style={{ minHeight: "200px" }}>
// 			<div
// 				style={{
// 					padding: "20px",
// 					boxShadow: "0px 1px 4px 0px #0000001F",
// 				}}
// 				className="modal-base-headline"
// 			>
// 				Send your General Ledger by email
// 			</div>
// 			<div
// 				style={{ padding: "20px" }}
// 				// style={{ padding: "10px", backgroundColor: "#f5f5f5" }}
// 			>
// 				<div
// 					style={{ display: "flex", flexDirection: "column", marginRight: "15px" }}
// 					// style={{ padding: "35px 30px", backgroundColor: "white" }}
// 				></div>
// 				<div
// 				// style={{ width: "100%", marginRight: "15px" }}
// 				>
// 					<div
// 						//  style={{ paddingTop: "10px" }}
// 						className="textarea"
// 						// style={{ maxHeight: "30px", marginBottom: "100px" }}
// 					>
// 						<TextInputComponent
// 							name="Email Address"
// 							required
// 							// value={chartData.accountName}
// 							// onChange={handleAccountNameChange}
// 							// aria-invalid={accountNameError}
// 							// aria-describedby={accountNameError ? "accountNameError" : null}
// 							label="Email Address"
// 						/>
// 					</div>
// 					<div
// 						//  style={{ paddingTop: "10px" }}

// 						className="textarea"

// 						// style={{ maxHeight: "30px", display: "flex", flexDirection: "column", marginRight: "15px" }}
// 					>
// 						<TextInputComponent
// 							name="Subject"
// 							required
// 							// value={chartData.accountName}
// 							// onChange={handleAccountNameChange}
// 							// aria-invalid={accountNameError}
// 							// aria-describedby={accountNameError ? "accountNameError" : null}
// 							label="Subject"
// 						/>
// 					</div>
// 					<div
// 						//  style={{ paddingTop: "10px" }}
// 						className="textarea"
// 						// style={{ maxHeight: "30px", display: "flex", flexDirection: "column", marginRight: "15px" }}
// 					>
// 						<label style={{ fontSize: "16px" }} className="textarea_label">
// 							Description
// 						</label>
// 						<textarea
// 							className="textarea_input"
// 							rows="3"
// 							// onChange={handleDescriptionChange}
// 							// value={chartData.description}
// 						/>
// 						<span className="textarea_bar" />
// 					</div>
// 					<div className="email-view-attachments">
// 							<div className="row">
// 								<div className="col-xs-7">
// 									<div className="expense-receipt-list">
// 										{/* {this.state.additionalDefaultAttachmentName ? ( */}
// 											<div className="expenseEdit_fileListRow">
// 												<div className="expenseEdit_fileIcon icon icon-attachment" />
// 												<div className="list_item">
// 													{/* {this.state.additionalDefaultAttachmentName}.pdf */}
// 												</div>
// 											</div>
// 										{/* ) : null} */}
// 										<div className="expenseEdit_fileListRow">
// 											<div className="expenseEdit_fileIcon icon icon-attachment" />
// 											{/* <div className="list_item">{this.state.defaultAttachmentName}.pdf</div> */}
// 										</div>
// 									</div>
// 									{/* {attachmentList} */}

// 									{/* {this.state.uploadedAttachments.length < 10 ? ( */}
// 										<div
// 											id="emailView-attachment-dropbox"
// 											className="drop-box text-center u_mb_4"
// 											data-qs-id="expense-edit-receipt-upload"
// 										>
// 											<label className="text-muted">
// 												<p>
// 													{/* {resources.emaillViewAttachmentDragText} */}
// 													{/* &amp; {resources.emaillViewDropOrClickText}, */}
// 													<br />
// 													{/* {resources.emaillViewSelectAttachment} */}
// 												</p>
// 												<input
// 													className="u_hidden"
// 													type="file"
// 													// onChange={this.addSelectedFile.bind(this)}
// 												/>
// 											</label>
// 										</div>
// 									{/* ) : null} */}
// 								</div>
// 							</div>
// 						</div>
// 					{/* <input
// 						id="csv-upload"
// 						className="u_hidden"
// 						type="file"
// 						// onChange={handleBankStatementFileChange}
// 					/>
// 					<label htmlFor="csv-upload" style={{ fontWeight: 600, color: "#00A353", cursor: "pointer" }}>
// 						{/* <SvgInline svg={greenUploadIcon} width="20px" height="21px" /> */}

// 						{/* <span style={{ marginLeft: "5px" }}>Upload </span> */}
// 					{/* </label> */}
// 				</div>
// 			</div>

// 			<div style={{ position: "relative" }} className="modal-base-footer">
// 				<div className="modal-base-cancel">
// 					<ButtonComponent callback={() => ModalService.close()} type="cancel" label={"Cancel"} />
// 				</div>
// 				<div className="modal-base-confirm">
// 					<ButtonComponent buttonIcon="icon-check" callback={handleSave} label={"Save"} />
// 				</div>
// 			</div>
// 		</div>
// 	);
// }

// export default generalLedgerSendEmail;
///////////////////////////////////////
import invoiz from "services/invoiz.service";
import React from "react";
import _ from "lodash";
import TopbarComponent from "shared/topbar/topbar.component";
import config from "config";
import ModalService from "../../services/modal.service";
import CheckboxInputComponent from "shared/inputs/checkbox-input/checkbox-input.component";
import HtmlInputComponent from "shared/inputs/html-input/html-input.component";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import CustomSelectOptionComponent from "shared/custom-select-option/custom-select-option.component";
import OvalToggleComponent from "shared/oval-toggle/oval-toggle.component";
import SVGInline from "react-svg-inline";
import imprezzLogo from "assets/images/svg/groflex.svg";
import Uploader from "fine-uploader";
import { handleImageError } from "helpers/errors";
import { format } from "util";
import ButtonComponent from "../../shared/button/button.component";

const attachmentConfig = {
	attachmentUrl: `${config.resourceHost}email/attachment`,
	fineUploader: {
		validation: {
			acceptFiles: [
				"image/jpg",
				"image/jpeg",
				"image/png",
				"application/pdf",
				"application/zip",
				"image/svg+xml",
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				"application/msword",
				"application/msexcel",
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			],
			allowedExtensions: ["jpg", "jpeg", "pdf", "png", "zip", "svg", "doc", "docx", "xls", "xlsx"],
			sizeLimit: 5 * 1024 * 1024,
		},
		scaling: {
			sendOriginal: false,
			sizes: [{ name: "", maxSize: 3000 }],
		},
	},
};
const handleSave = () => {
	ModalService.close();
};

class generalLedgerSendEmail extends React.Component {
	// componentDidMount() {
	// 	document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
	// 	document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
	// }

	// componentWillUnmount() {w
	// 	document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
	// 	document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
	// }
	constructor(props) {
		super(props);
		const { resources } = this.props;
		console.log("resources", resources);

		this.state = {
			customerId: this.props.customerId,
			documentTitle: this.props.documentTitle,
			emails: this.props.emails || [],
			emailOptions: this.props.emailOptions || [],
			emailText: this.props.emailText || "",
			// emailTextAdditional: this.props.emailTextAdditional || resources.str_yourSincerely,
			model: this.props.model || {},
			regard: (this.props.model && this.props.model.regard) || "",
			sendCopy: false,
			autoDunningEnabled:
				this.props.model && this.props.model.invoice && this.props.model.invoice.autoDunningEnabled,
			showEmailError: false,
			uploadedAttachments: [],
			defaultAttachmentName: (this.props.model && this.props.model.regard) || "Attachment.pdf",
			additionalDefaultAttachmentName:
				(this.props.model &&
					this.props.model.type === "cancellation" &&
					`Invoice No. ${this.props.model.invoice.number}`) ||
				null,
		};

		this.emailSelectOptions = {
			multi: true,
			clearable: false,
			backspaceRemoves: true,
			noResultsText: false,
			labelKey: "label",
			valueKey: "value",
			matchProp: "value",
			// placeholder: resources.str_enterOrSelectEmail,
			placeholder: "E-mail Address",
			handleChange: this.onEmailChange.bind(this),
			optionComponent: CustomSelectOptionComponent,
		};

		this.filesToDelete = [];
	}

	componentDidMount() {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		document.getElementsByClassName("modal-base-view")[0].style.borderRadius = "8px";

		if (this.state.customerId) {
			invoiz
				.request(`${config.customer.resourceUrl}/${this.state.customerId}`, { auth: true })
				.then((response) => {
					const {
						body: { data },
					} = response;

					const emailOptions = this.mapCustomerEmails(data);

					this.setState({
						emailOptions,
						emails: emailOptions.length && emailOptions.length > 0 ? [emailOptions[0]] : [],
					});
				});
		}

		setTimeout(() => {
			this.initDragAndDropUploader();
			this.initManualUploader();
		});
	}

	addFile(files) {
		if (!files) {
			return;
		}

		_.each(files, (file) => {
			this.manualUploader.addFiles([file]);
		});
	}

	addSelectedFile(event) {
		const file = event.target.files[0];
		this.addFile([file]);
		event.target.value = "";
	}

	initDragAndDropUploader() {
		Uploader.DragAndDrop({
			dropZoneElements: [document.getElementById("emailView-attachment-dropbox")],
			callbacks: {
				processingDroppedFilesComplete: (files) => {
					this.addFile(files);
				},
			},
		});
	}

	initManualUploader() {
		const { resources } = this.props;
		console.log("resources", resources);
		this.manualUploader = new Uploader.FineUploaderBasic(
			_.assign({}, attachmentConfig.fineUploader, {
				autoUpload: true,
				multiple: true,
				messages: {
					// minSizeError: resources.fileSizeMinimumLimit,
					minSizeError: "The file '%s' must be at least 2.5 kB!",
					// sizeError: resources.fileSizeMaximumFiveMBLimit,
					sizeError: "The file '%s' may be up to 5 MB in size!",
					// typeError: resources.invalidFileType,

					typeError: "The file '%s' does not have a valid file type.",
				},
				request: {
					customHeaders: { authorization: `Bearer ${invoiz.user.token}` },
					endpoint: attachmentConfig.attachmentUrl,
					inputName: "attachment",
					filenameParam: "filename",
				},
				callbacks: {
					onComplete: (id, fileName, response) => {
						if (!response.success) {
							return;
						}
						const { name } = this.manualUploader.getFile(id);
						const obj = { id: response.data.id, name };
						const { uploadedAttachments } = this.state;
						uploadedAttachments.push(obj);
						this.setState({ uploadedAttachments });
						// invoiz.page.showToast({ message: resources.str_fileUploadSuccessMessage });
						invoiz.page.showToast("The file has been uploaded successfully");
					},
					onError: (id, name, errorReason, xhr) => {
						if (xhr && xhr.response) {
							const { meta: error } = JSON.parse(xhr.response);
							return handleImageError(this, error);
						}

						invoiz.page.showToast({
							type: "error",
							message: format(errorReason, name) || "An error occurred while uploading the file",
						});
					},
				},
			})
		);
	}

	isButtonDisabled() {
		return this.state.emails.length === 0;
	}

	mapCustomerEmails(customer) {
		const data = customer.contactPersons.reduce((dataArray, contactPerson) => {
			if (contactPerson.email) {
				const { email, name, lastName } = contactPerson;
				dataArray.push({ type: "contact", email, name, lastName, label: name, value: email });
			}
			return dataArray;
		}, []);
		const sortedData = _.sortBy(data, "lastName");
		if (customer.email) {
			const { email, name } = customer;
			sortedData.unshift({ type: "customer", email, name, label: name, value: email });
		}
		return sortedData;
	}

	navigateToDetails(isFromSave) {
		const { resources } = this.props;
		let transactionType = this.state.model.type;

		if (transactionType === "dunning") {
			transactionType = "invoice";
		}

		if (!isFromSave && this.state.uploadedAttachments.length > 0) {
			const requests = this.state.uploadedAttachments.map((attachment) => {
				invoiz.request(`${attachmentConfig.attachmentUrl}/${attachment.id}`, {
					auth: true,
					method: "DELETE",
				});
			});

			Promise.all(requests).then(() => {
				this.setState({ uploadedAttachments: [] });
			});
		}

		if (this.filesToDelete && this.filesToDelete.length > 0) {
			const requests = this.filesToDelete.map((id) => {
				invoiz.request(`${attachmentConfig.attachmentUrl}/${id}`, {
					auth: true,
					method: "DELETE",
				});
			});

			Promise.all(requests)
				.then(() => {
					if (transactionType === "offer" && this.state.model.offer.offerType === "impress") {
						invoiz.router.navigate(`/offer/impress/${this.state.model[transactionType].id}`);
					} else if (transactionType === "purchaseOrder") {
						invoiz.router.navigate(`/purchase-order/${this.state.model[transactionType].id}`);
					} else {
						invoiz.router.navigate(`/${transactionType}/${this.state.model[transactionType].id}`);
					}
				})
				.catch(() => {
					invoiz.showNotification({ type: "error", message: resources.str_saveErrorMessage });
				});
		} else {
			if (transactionType === "offer" && this.state.model.offer.offerType === "impress") {
				// invoiz.router.navigate(`/offer/impress/${this.state.model[transactionType].id}`);
				invoiz.router.navigate(`/offer/impress/${this.state.model[transactionType].id}`);
			} else if (transactionType === "purchaseOrder") {
				invoiz.router.navigate(`/purchase-order/${this.state.model[transactionType].id}`);
			} else {
				invoiz.router.navigate(`/${transactionType}/${this.state.model[transactionType].id}`);
			}
		}
	}

	onEmailChange(selectOptions) {
		const newEmails = [];

		if (selectOptions && selectOptions.length > 0) {
			selectOptions.forEach((option) => {
				if (config.emailCheck.test(option.value)) {
					newEmails.push(option);
				}
			});
		}

		this.setState({
			emails: newEmails,
			showEmailError: false,
		});
	}

	onSendClick() {
		const { resources } = this.props;
		if (this.state.emails.length === 0) {
			this.setState({
				showEmailError: true,
			});
			return;
		}

		const emails = this.state.emails.map((email) => {
			return email.value;
		});

		let attachments = this.state.uploadedAttachments.filter((attachment) => {
			return this.filesToDelete.indexOf(attachment.id) === -1;
		});

		attachments = attachments.map((attachment) => {
			return attachment.id;
		});

		const emailContent = {
			attachmentName: `${this.state.model.heading}.pdf`,
			recipients: emails,
			subject: this.state.regard,
			text: this.state.emailText,
			textAdditional: this.state.emailTextAdditional,
			sendCopy: this.state.sendCopy,
			attachments,
		};
		const endpoint = `${this.state.model.type}/${this.state.model[this.state.model.type].id}/send`;

		invoiz
			.request(`${config.resourceHost}${endpoint}`, {
				method: "POST",
				auth: true,
				data: emailContent,
			})
			.then(() => {
				if (this.state.model.type === "dunning") {
					invoiz
						.request(`${config.invoice.resourceUrl}/${this.state.model.invoice.id}/dunning/setting`, {
							auth: true,
							method: "PUT",
							data: {
								autoDunningEnabled: this.state.autoDunningEnabled,
								dunningRecipients: emailContent.recipients,
							},
						})
						.then(() => {
							// invoiz.page.showToast({ message: resources.emailViewSendEmailSuccessMessage });
							invoiz.page.showToast("The email was sent successfully");
							this.navigateToDetails(true);
						})
						.catch(() => {
							// invoiz.page.showToast({ message: resources.emailViewSendEmailErrorMessage, type: "error" });
							invoiz.page.showToast("An error occurred while sending the email");
						});
				} else {
					// invoiz.page.showToast({ message: resources.emailViewSendEmailSuccessMessage });
					invoiz.page.showToast("The email was sent successfully");
					this.navigateToDetails(true);
				}
			})
			.catch(() => {
				// invoiz.page.showToast({ message: resources.emailViewSendEmailErrorMessage, type: "error" });
				invoiz.page.showToast("An error occurred while sending the email");
			});
	}

	onTopbarButtonClick(action) {
		if (action === "send") {
			this.onSendClick();
		}
	}

	onUploadDropdownEntryClick(index, entry) {
		if (entry.action === "delete") {
		} else if (entry.action === "preview") {
			const url = `${config.resourceHost}${this.state.uploadedAttachments[index].url}`;
			window.open(url);
		}
	}

	deleteUpload(index) {
		this.filesToDelete.push(this.state.uploadedAttachments[index].id);

		const uploadedAttachments = this.state.uploadedAttachments.filter((attachment) => {
			return this.filesToDelete.indexOf(attachment.id) === -1;
		});

		this.setState({ uploadedAttachments });
	}

	render() {
		const { resources } = this.props;

		const buttonDisabled = this.isButtonDisabled();
		const headline = this.state.model.headline;
		const subHeadline = this.state.model.subheadline;

		let attachmentList = null;
		const allAttachments = this.state.uploadedAttachments;

		if (allAttachments && allAttachments.length > 0) {
			const attachments = allAttachments.map((attachment, index) => {
				return (
					<div className="expenseEdit_fileListRow" key={`attachment-item-${index}`}>
						<div className="expenseEdit_fileIcon icon icon-attachment" />
						<div className="list_item">{attachment.name}</div>
						<div
							onClick={() => this.deleteUpload(index)}
							className="list_item icon icon-trashcan"
							data-qs-id={`delete-upload`}
						/>
					</div>
				);
			});

			attachmentList = <div className="expense-receipt-list">{attachments}</div>;
		}

		return (
			<div className="email-view-wrapper wrapper-has-topbar-with-margin">
				<div
					//  style={{ marginTop: "-120px", marginBottom: "-120px" }}
					className="add-chart-modal-container"
					style={{ minHeight: "200px" }}
				>
					{/* <TopbarComponent
					backButtonCallback={() => this.navigateToDetails()}
					buttons={[
						{
							type: "primary",
							// label: resources.str_sendEmail,
							buttonIcon: "icon-mail",
							action: "send",
							dataQsId: "emailSend-topbar-btn-send",
							customCssClass: buttonDisabled ? "disabled" : "",
						},
					]}
					buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
				>
					<div className="topbar-title">{this.state.documentTitle}</div>
					{this.state.model.dunning ? null : (
						<div className="email-view-checkbox">
							<CheckboxInputComponent
								name={"sendCopy"}
								// label={resources.str_copyToMe}
								checked={this.state.sendCopy}
								onChange={() => this.setState({ sendCopy: !this.state.sendCopy })}
							/>
						</div>
					)}
				</TopbarComponent> */}

					{/* <div
					// className="email-view-headline"
					> */}
					{/* <h1>Send your General Ledger by email</h1> */}
					{/* <h2>Send your General Ledger by email</h2> */}
					<div
						style={{
							padding: "20px",
							boxShadow: "0px 1px 4px 0px #0000001F",
						}}
						// className="email-view-textarea-label"
						className="modal-base-headline"
					>
						Send General ledger
					</div>
					{/* </div> */}
					<div
						style={{
							borderTop: "1px solid #C6C6C6",
						}}
					>
						<div
							style={{
								padding: "20px",
								// padding: "35px 30px",
								borderRadius: "8px",
								backgroundColor: "white",
							}}
						>
							<div className="row">
								<div
									className="col-xs-12"
									// className="row"
								>
									<div className="email-view-select">
										{/* <div className="email-view-select-label">{resources.str_emailAddress}</div> */}
										<div className="email-view-select-label">E-Mail Address</div>
										<SelectInputComponent
											allowCreate={true}
											notAsync={true}
											loadedOptions={this.state.emailOptions}
											value={this.state.emails}
											options={this.emailSelectOptions}
										/>
									</div>
								</div>
							</div>
							<div className="row u_mt_20">
								<div
									// className="row"
									className="col-xs-12"
								>
									<TextInputExtendedComponent
										value={this.state.regard}
										required={true}
										// label={resources.str_subject}
										label={"Subject"}
										onChange={(val) => this.setState({ regard: val })}
										style={{ padding: "0px" }}
									/>
								</div>
							</div>

							<div className="row">
								<div className="col-xs-12">
									{this.state.showEmailError ? (
										// <div className="email-error">{resources.emailViewRecipientEmailText}</div>
										<div className="email-error">{"Please enter a recipient email address"}</div>
									) : null}
								</div>
							</div>

							<div className="row ">
								<div className="col-xs-12">
									{/* <div className="email-view-textarea-label">{resources.emailViewPreviewEmailText}</div> */}
									<div
										// className="email-view-textarea-label"
										className="textarea_label"
										style={{ marginTop: "5px", color: "#747474" }}
									>
										Message
									</div>
									{/* <div className="email-view-textarea">
								<div className="email-view-textarea-inner">
									<HtmlInputComponent
										displayBlueLine={false}
										// value={this.state.emailText}
										value={
											"Dear Ladies and Gentlemen,</br>Please find the current estimate attached."
										}
										onTextChange={(val) => this.setState({ emailText: val })}
									/>
									<div className="email-body-link">
										&rarr;{" "}
										{format(
											// resources.emailBodyLinkText,
											"View %s online",
											this.state.model.type === "offer"
												? "General Ledger"
												: this.state.model.type === "purchaseOrder"
												? "str_thePurchaseOrder"
												: "the statement"
										)}
									</div>
									<HtmlInputComponent
										displayBlueLine={false}
										value={this.state.emailTextAdditional}
										onTextChange={(val) => this.setState({ emailTextAdditional: val })}
										// placeholder={resources.str_yourSincerely}
										placeholder={"Yours sincerely"}
									/>
								</div>
								<div className="email-view-textarea-footer">
									{/* <span>{resources.str_poweredBy}</span> */}
									{/* <span>{"powered by"}</span>
									<SVGInline width="45px" svg={imprezzLogo} />
								</div> */}
									{/* </div> */}
									<textarea
										style={{ borderRadius: "8px" }}
										className="textarea_input"
										rows="5"
										onTextChange={(val) => this.setState({ emailTextAdditional: val })}
										value={this.state.emailTextAdditional}
									/>
								</div>
							</div>

							<div className="row">
								<div className="col-xs-6">
									{this.state.model.type === "dunning" ? (
										<div className="email-view-dunning">
											{/* <span>{resources.emaillViewAutomaticallyRemindersText}</span> */}
											<span>{"to select an attachment"}</span>
											<OvalToggleComponent
												checked={this.state.autoDunningEnabled}
												onChange={() => {
													this.setState({
														autoDunningEnabled: !this.state.autoDunningEnabled,
													});
												}}
												newStyle={true}
											/>
										</div>
									) : null}
								</div>
							</div>

							<div className="row">
								<div className="col-xs-12">
									{/* <div className="email-view-textarea-label">{resources.str_attachments}</div> */}
									<div
										// className="email-view-textarea-label"
										className="textarea_label"
										style={{ color: "#747474", marginTop: "20px" }}
									>
										{"Attachments"}
									</div>
									<div className="email-view-attachments">
										<div className="row">
											<div className="col-xs-7">
												<div className="expense-receipt-list">
													{this.state.additionalDefaultAttachmentName ? (
														<div
															style={{ marginTop: "-20px" }}
															className="expenseEdit_fileListRow"
														>
															<div className="expenseEdit_fileIcon icon icon-attachment" />
															<div className="list_item">
																{this.state.additionalDefaultAttachmentName}.pdf
															</div>
														</div>
													) : null}
													<div
														style={{ marginTop: "-20px" }}
														className="expenseEdit_fileListRow"
													>
														<div className="expenseEdit_fileIcon icon icon-attachment" />
														<div className="list_item">
															{this.state.defaultAttachmentName}.pdf
														</div>
													</div>
												</div>
												{attachmentList}

												{this.state.uploadedAttachments.length < 10 ? (
													<div
														style={{
															width: "585px",
															borderRadius: "4px",
															border: "1px solid #ccc",
															height: "50px",
														}}
														id="emailView-attachment-dropbox"
														className="drop-box text-center u_mb_4"
														data-qs-id="expense-edit-receipt-upload"
													>
														<label className="text-muted" style={{ marginTop: " -6px" }}>
															<p>
																{/* {resources.emaillViewAttachmentDragText} */}
																{"Drag & drop an attachment here"}
																{/*
														 &amp;
														  {resources.emaillViewDropOrClickText}, */}
																{/* {"Drop here or click"}
																<br /> */}
																{/* {resources.emaillViewSelectAttachment} */}
																{/* {"or click to select an attachment"} */}
															</p>
															<input
																className="u_hidden"
																type="file"
																onChange={this.addSelectedFile.bind(this)}
															/>
														</label>
													</div>
												) : null}
											</div>
										</div>
									</div>
									<div
										style={{
											// position: "relative",
											marginTop: "10px",
										}}
										className="modal-base-footer"
									>
										<div className="modal-base-confirm">
											<ButtonComponent
												buttonIcon="icon-check"
												callback={handleSave}
												label={"Send"}
												onClick={() => onTopbarButtonClick("send")}
											/>
										</div>
										<div className="modal-base-cancel">
											<ButtonComponent
												callback={() => ModalService.close()}
												type="cancel"
												label={"Cancel"}
											/>
										</div>
										
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default generalLedgerSendEmail;
