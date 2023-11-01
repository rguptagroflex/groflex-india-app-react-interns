import invoiz from "services/invoiz.service";
import React from "react";
import _ from "lodash";
import config from "config";
import ModalService from "../services/modal.service";
import CheckboxInputComponent from "shared/inputs/checkbox-input/checkbox-input.component";
import HtmlInputComponent from "shared/inputs/html-input/html-input.component";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import CustomSelectOptionComponent from "shared/custom-select-option/custom-select-option.component";
import SVGInline from "react-svg-inline";
import ButtonComponent from "./button/button.component";
const checkCircleIcon = require("assets/images/icons/check_circle.svg");
const trashcanIcon = require("assets/images/icons/trashcan.svg");

class SendEmailModalComponent extends React.Component {
	// componentDidMount() {
	// 	document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
	// 	document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
	// }

	// componentWillUnmount() {
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
			emailTextAdditional: this.props.emailTextAdditional || "",
			model: this.props.model || {},
			regard: (this.props.model && this.props.model.regard) || "",
			sendCopy: false,
			autoDunningEnabled:
				this.props.model && this.props.model.invoice && this.props.model.invoice.autoDunningEnabled,
			showEmailError: false,
			sendPdf: true,
			sendCsv: false,
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
	}

	isHandleConfirmDisabled() {
		const { emails, regard, emailTextAdditional, sendCsv, sendPdf } = this.state;
		let disabledFlag = false;
		if (!emails.length) {
			// console.log("emails:", emails);
			disabledFlag = true;
		}
		if (!regard.length) {
			// console.log("regard:", regard);
			disabledFlag = true;
		}
		if (!emailTextAdditional.length) {
			// console.log("emailTextAdditional:", emailTextAdditional);
			disabledFlag = true;
		}
		if (!sendCsv && !sendPdf) {
			// console.log("sendstuff:", sendCsv);
			disabledFlag = true;
		}

		return disabledFlag;
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

	handleSubmit() {
		const { sendPdf, sendCsv } = this.state;
		let sendType = "";
		if (sendCsv && sendPdf) {
			sendType = "both";
		} else if (sendPdf) {
			sendType = "pdf";
		} else {
			sendType = "csv";
		}
		this.props.onSubmit({ ...this.state, sendType });
		// ModalService.close();
	}

	render() {
		// console.log(this.state, "State in modal email view");

		return (
			<div className="email-view-wrapper wrapper-has-topbar-with-margin send-customer-ledger-modal">
				<div className="add-chart-modal-container" style={{ minHeight: "200px" }}>
					<div
						style={{
							padding: "20px",
							boxShadow: "0px 1px 4px 0px #0000001F",
						}}
						className="modal-base-headline"
					>
						{this.props.heading}
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
										// placeholder="Subject"
										label={"Subject"}
										onChange={(val) => this.setState({ regard: val })}
										style={{ padding: "0px" }}
									/>
								</div>
							</div>

							<div className="row">
								<div className="col-xs-12">
									{this.state.showEmailError ? (
										<div className="email-error">{"Please enter a recipient email address"}</div>
									) : null}
								</div>
							</div>

							<div className="row">
								<div className="col-xs-12">
									<div className="textarea_label" style={{ marginTop: "5px", color: "#747474" }}>
										Message
									</div>

									<HtmlInputComponent
										ref={"send-email-message-ref"}
										value={this.state.emailTextAdditional}
										onBlur={(quill) => this.setState({ emailTextAdditional: quill.value })}
										onChange={(value) => this.setState({ emailTextAdditional: value })}
									/>
								</div>
							</div>

							<div className="row u_mt_20">
								<div style={{ display: "flex" }} className="col-xs-12">
									<div className="u_mr_10">
										<CheckboxInputComponent
											dataQsId="expense-edit-ispaid"
											name={"pdf"}
											label={"PDF"}
											checked={this.state.sendPdf}
											onChange={() => this.setState({ sendPdf: !this.state.sendPdf })}
										/>
									</div>

									<CheckboxInputComponent
										dataQsId="expense-edit-ispaid"
										name={"csv"}
										label={"CSV"}
										checked={this.state.sendCsv}
										onChange={() => this.setState({ sendCsv: !this.state.sendCsv })}
									/>
								</div>
							</div>

							<div className="row">
								<div className="col-xs-12">
									<div style={{ color: "#747474", marginTop: "20px", marginBottom: "10px" }}>
										{"Attachments"}
									</div>
									<div className="email-view-attachments">
										{this.state.sendPdf && (
											<div className="attachment-item u_mb_10">
												<div className="tickAndName">
													<SVGInline
														className="u_mr_10"
														svg={checkCircleIcon}
														width="16px"
														fill="#0BA84A"
													/>
													<span>{`${this.props.fileNameWithoutExt}.pdf`}</span>
												</div>
												<div
													style={{ cursor: "pointer" }}
													onClick={() => this.setState({ sendPdf: false })}
												>
													<SVGInline svg={trashcanIcon} width="16px" fill="#00a353" />
												</div>
											</div>
										)}
										{this.state.sendCsv && (
											<div className="attachment-item">
												<div className="tickAndName">
													<SVGInline
														className="u_mr_10"
														svg={checkCircleIcon}
														width="16px"
														fill="#0BA84A"
													/>
													<span>{`${this.props.fileNameWithoutExt}.csv`}</span>
												</div>
												<div
													style={{ cursor: "pointer" }}
													onClick={() => this.setState({ sendCsv: false })}
												>
													<SVGInline svg={trashcanIcon} width="16px" fill="#00a353" />
												</div>
											</div>
										)}
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
											callback={() => this.handleSubmit()}
											label={"Send"}
											disabled={this.isHandleConfirmDisabled()}
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
		);
	}
}

export default SendEmailModalComponent;
