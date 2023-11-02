import invoiz from "services/invoiz.service";
import React from "react";
import config from "config";
import { formatClientDate } from "helpers/formatDate";
// import moment from 'moment';
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import ModalService from "services/modal.service";
import ButtonComponent from "shared/button/button.component";
import CustomSelectOptionComponent from "shared/custom-select-option/custom-select-option.component";
import LoaderComponent from "shared/loader/loader.component";

class DocumentExportSendModal extends React.Component {
	constructor(props) {
		super(props);
		const { resources } = this.props;
		this.state = {
			regard: resources.str_bookingDocuments,
			messageText: "",
			recipients: [],
			recipientsError: "",
			isSubmitting: false,
			isLoadingEmails: false,
			documentExportItem: null,
			senderEmail: "",
		};
	}

	componentDidMount() {
		const { documentExportItem, resources } = this.props;

		this.setState({
			documentExportItem,
			regard: `${resources.str_bookingDocuments} ${documentExportItem.displayPeriod}`,
			messageText: [
				`${resources.str_ladiesAndGentlemenText},\n\n`,
				resources.sendAccountingDocumentsForThePeriodText,
				` ${documentExportItem.displayPeriod}.\n\n`,
				resources.str_yourSincerely,
			].join(""),
		});
	}

	onMessageTextChange(val) {
		this.setState({ messageText: val });
	}

	onRecipientChange(selectOptions) {
		const newRecipients = [];

		if (selectOptions && selectOptions.length > 0) {
			selectOptions.forEach((option) => {
				if (config.emailCheck.test(option.value)) {
					newRecipients.push(option);
				}
			});
		}

		this.setState({
			recipients: newRecipients,
			recipientsError: "",
		});
	}

	onSubmitClicked() {
		const { onSendDocumentExportSuccess, resources } = this.props;
		const { regard, messageText, recipients, documentExportItem, senderEmail } = this.state;

		if (regard.trim().length === 0) {
			return;
		} else if (!senderEmail) {
			this.setState({ recipientsError: resources.mandatoryFieldValidation });
		} else {
			this.setState({ isSubmitting: true }, () => {
				const data = {
					id: documentExportItem.id,
					subject: regard,
					// recipients: recipients.map(recipient => recipient.value),
					recipients: [senderEmail],
					text: messageText.replace(/\n/g, "<br>"),
				};

				invoiz
					.request(`${config.settings.endpoints.accountantExportUrl}${documentExportItem.id}/send`, {
						auth: true,
						data,
						method: "POST",
					})
					.then(() => {
						// documentExportItem.sentAt = moment().format('DD.MM.YYYY');
						documentExportItem.sentAt = formatClientDate();
						onSendDocumentExportSuccess && onSendDocumentExportSuccess(documentExportItem);
						invoiz.page.showToast({ message: resources.documentExportSendSuccess });
						ModalService.close();
					})
					.catch(() => {
						this.showToast({ type: "error", message: resources.documentExportSendError });
						this.setState({ isSubmitting: false });
					});
			});
		}
	}

	render() {
		const { regard, messageText, recipients, recipientsError, isLoadingEmails, senderEmail } = this.state;
		const { resources } = this.props;
		return (
			<div className="document-export-send-modal">
				{isLoadingEmails ? (
					<LoaderComponent visible={true} />
				) : (
					<div>
						<div className="row">
							<TextInputExtendedComponent
								ref="regardInput"
								customWrapperClass={"col-xs-12"}
								name={"regard"}
								value={regard}
								onChange={(val) => this.setState({ regard: val })}
								label={resources.str_subject}
								autoComplete="off"
								spellCheck="false"
								required={true}
							/>
						</div>

						<div className="row">
							{/* <div className="email-view-select-label">{resources.str_emailAddress}</div> */}
							{/* <SelectInputComponent
								allowCreate={false}
								notAsync={true}
								value={recipients}
								options={{
									multi: true,
									clearable: false,
									backspaceRemoves: true,
									noResultsText: false,
									labelKey: 'label',
									valueKey: 'value',
									matchProp: 'value',
									placeholder: resources.str_enterEmailAddress,
									handleChange: this.onRecipientChange.bind(this),
									optionComponent: CustomSelectOptionComponent
								}}
							/> */}
							<TextInputExtendedComponent
								ref="regardInput"
								customWrapperClass={"col-xs-12"}
								name={"senderEmail"}
								value={senderEmail}
								onChange={(senderEmail) => this.setState({ senderEmail })}
								label={`Enter e-mail address`}
								autoComplete="off"
								spellCheck="false"
								required={true}
							/>
						</div>

						{recipientsError.length > 0 ? (
							<div className="recipients-error input_error">{recipientsError}</div>
						) : null}

						<div className="document-export-textarea">
							<div className="email-view-select-label">{resources.str_message}</div>
							<textarea
								className="textarea_input"
								value={messageText}
								onChange={(evt) => this.onMessageTextChange(evt.nativeEvent.target.value)}
							/>
							<div className="textarea_bar" />
						</div>

						<div className="modal-base-footer">
							<div className="modal-base-confirm">
								<ButtonComponent
									buttonIcon={"icon-mail"}
									type={"primary"}
									disabled={this.state.isSubmitting}
									callback={() => this.onSubmitClicked()}
									label={resources.str_sendEmail}
									dataQsId="modal-btn-confirm"
								/>
							</div>
							<div className="modal-base-cancel">
								<ButtonComponent
									type="cancel"
									callback={() => ModalService.close(true)}
									label={resources.str_abortStop}
									dataQsId="modal-btn-cancel"
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}
}

export default DocumentExportSendModal;
