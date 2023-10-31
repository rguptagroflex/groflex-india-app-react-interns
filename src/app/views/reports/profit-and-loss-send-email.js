3;
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
import RadioInputComponent from "../../shared/inputs/radio-input/radio-input.component";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import moment from "../../../../node_modules/moment/moment";

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

const exportOption = [
	{
		id: "pdf",
		label: "PDF",
		value: ".pdf",
	},
	{
		id: "csv",
		label: "CSV",
		value: ".csv",
	},
];

class profitAndLossSendEmail extends React.Component {
	constructor(props) {
		super(props);
		const { resources } = this.props;
		console.log("resources", resources);

		this.state = {
			emailCheckBox: { pdf: false, csv: false },
			emailFileType: "",
			exportFormat: ".pdf",
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
		this.handleEmailCheckBox = this.handleEmailCheckBox.bind(this);
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

	handleEmailCheckBox(event) {
		this.setState(
			{ emailCheckBox: { ...this.state.emailCheckBox, [event.target.name]: event.target.checked } },
			() => {
				if (this.state.emailCheckBox.pdf === true && this.state.emailCheckBox.csv === true) {
					this.setState({ emailFileType: "both" });
				} else if (this.state.emailCheckBox.pdf === true) {
					this.setState({ emailFileType: "pdf" });
				} else if (this.state.emailCheckBox.csv === true) {
					this.setState({ emailFileType: "csv" });
				} else {
					this.setState({ emailFileType: "" });
				}
			}
		);
	}

	render() {
		const { exportFormat } = this.state;
		const { resources } = this.props;

		const buttonDisabled = this.isButtonDisabled();
		const headline = this.state.model.headline;
		const subHeadline = this.state.model.subheadline;
		const { emailCheckBox } = this.state;

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
				<div className="add-chart-modal-container" style={{ minHeight: "200px" }}>
					<div
						style={{
							padding: "20px",
							boxShadow: "0px 1px 4px 0px #0000001F",
						}}
						className="modal-base-headline"
					>
						Send Profit and Loss
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
								<div className="col-xs-12">
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
								<div className="col-xs-12">
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

							<div className="row">
								<div className="col-xs-12">
									<div className="textarea_label" style={{ marginTop: "5px", color: "#747474" }}>
										Message
									</div>

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

							<div className="row profit-loss-email-bottom">
								<div className="col-xs-12">
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
													<div className="expenseEdit_fileListRow">
														<div
															className="textarea_label"
															style={{ color: "#747474", marginTop: "20px" }}
														>
															{/* {"Attachments"} */}
															{`ProfitAndLoss_${moment(
																this.props.selectedDate.startDate
															).format("DD-MM-YYYY")}_${moment(
																this.props.selectedDate.endDate
															).format("DD-MM-YYYY")}.${
																this.state.emailFileType === "both"
																	? "pdf/csv"
																	: this.state.emailFileType
															}`}
														</div>
														<div className="expenseEdit_fileIcon icon icon-attachment" />
													</div>
												</div>
												{attachmentList}

												{this.state.uploadedAttachments.length < 10 ? (
													<div>
														<div className="profit-loss-email-radio">
															{/* <RadioInputComponent
																useCustomStyle={true}
																value={exportFormat}
																onChange={(value) =>
																	this.setState({ exportFormat: value })
																}
																options={exportOption}
															/> */}
															<FormGroup row>
																<FormControlLabel
																	control={
																		<Checkbox
																			checked={emailCheckBox.pdf}
																			onChange={this.handleEmailCheckBox}
																			name="pdf"
																			color="primary"
																		/>
																	}
																	label="pdf"
																/>
																<FormControlLabel
																	control={
																		<Checkbox
																			checked={emailCheckBox.csv}
																			onChange={this.handleEmailCheckBox}
																			name="csv"
																			color="primary"
																		/>
																	}
																	label="csv"
																/>
															</FormGroup>
														</div>
														{/* <div
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
															<label
																className="text-muted"
																style={{ marginTop: " -6px" }}
															>
																<p>{"Drag & drop an attachment here"}</p>
																<input
																	className="u_hidden"
																	type="file"
																	onChange={this.addSelectedFile.bind(this)}
																	accept={exportFormat}
																/>
															</label>
														</div> */}
													</div>
												) : null}
											</div>
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
										<ButtonComponent buttonIcon="icon-check" callback={handleSave} label={"Send"} />
									</div>
									<div className="modal-base-cancel">
										<ButtonComponent
											callback={() => ModalService.close()}
											type="cancel"
											label={"Cancel"}
											onClick={() => onTopbarButtonClick("send")}
										/>
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

export default profitAndLossSendEmail;
