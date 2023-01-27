import React from "react";
import invoiz from "services/invoiz.service";
import q from "q";
import config from "config";
import { format } from "util";
import TopbarComponent from "shared/topbar/topbar.component";
import ButtonComponent from "shared/button/button.component";
import HtmlInputComponent from "shared/inputs/html-input/html-input.component";
import TextInputComponent from "shared/inputs/text-input/text-input.component";
import { scrollToTop } from "helpers/scrollToTop";
import ChangeDetection from "helpers/changeDetection";
import userPermissions from "enums/user-permissions.enum";
import history from "../../helpers/history";

const changeDetection = new ChangeDetection();

class SettingsTextModulesComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			textModules: props.textModules,
			isSubmitting: false,
			canUpdateTextBlocks: null,
		};

		setTimeout(() => {
			scrollToTop();
		}, 0);
	}

	componentDidMount() {
		this.setState({
			canUpdateTextBlocks: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_TEXT_MODULES),
		});
		setTimeout(() => {
			setTimeout(() => {
				const dataOriginal = JSON.parse(JSON.stringify(this.state.textModules));

				changeDetection.bindEventListeners();

				changeDetection.setModelGetter(() => {
					const currentData = JSON.parse(JSON.stringify(this.state.textModules));

					return {
						original: dataOriginal,
						current: currentData,
					};
				});
			}, 0);
		});
	}

	componentWillUnmount() {
		changeDetection.unbindEventListeners();
	}

	onTopbarButtonClick() {
		const { resources } = this.props;
		const { textModules } = this.state;

		this.setState({ isSubmitting: true }, () => {
			const requests = [
				invoiz.request(`${config.settings.endpoints.textModule}/${textModules.offer.id}`, {
					auth: true,
					method: "PUT",
					data: {
						introduction: textModules.offer.introduction,
						conclusion: textModules.offer.conclusion,
						email: textModules.offer.email,
					},
				}),
				invoiz.request(`${config.settings.endpoints.textModule}/${textModules.purchaseOrder.id}`, {
					auth: true,
					method: "PUT",
					data: {
						introduction: textModules.purchaseOrder.introduction,
						conclusion: textModules.purchaseOrder.conclusion,
						email: textModules.purchaseOrder.email,
					},
				}),
				invoiz.request(`${config.settings.endpoints.textModule}/${textModules.invoice.id}`, {
					auth: true,
					method: "PUT",
					data: {
						introduction: textModules.invoice.introduction,
						conclusion: textModules.invoice.conclusion,
						email: textModules.invoice.email,
					},
				}),
				invoiz.request(`${config.settings.endpoints.textModule}/${textModules.posReceipt.id}`, {
					auth: true,
					method: "PUT",
					data: {
						introduction: textModules.posReceipt.introduction,
						conclusion: textModules.posReceipt.conclusion,
						email: textModules.posReceipt.email,
					},
				}),
				invoiz.request(`${config.settings.endpoints.textModule}/${textModules.recurringInvoice.id}`, {
					auth: true,
					method: "PUT",
					data: {
						email: textModules.recurringInvoice.email,
						emailSubject: textModules.recurringInvoice.emailSubject,
					},
				}),
				invoiz.request(`${config.settings.endpoints.textModule}/${textModules.cancellation.id}`, {
					auth: true,
					method: "PUT",
					data: {
						email: textModules.cancellation.email,
						emailSubject: textModules.cancellation.emailSubject,
					},
				}),
			];

			q.allSettled(requests)
				.then((results) => {
					let error = false;
					let errorOffers = false;
					let errorInvoices = false;
					let errorPosReceipts = false;
					let errorRecurringInvoices = false;
					let errorCancellations = false;

					if (results[0].state === "rejected") {
						error = errorOffers = true;

						invoiz.page.showToast({
							type: "error",
							message: format(resources.textModuleSaveErrorMessage, resources.str_deals),
						});
					}

					if (results[1].state === "rejected") {
						error = errorInvoices = true;

						invoiz.page.showToast({
							type: "error",
							message: format(resources.textModuleSaveErrorMessage, resources.str_bills),
						});
					}

					if (results[2].state === "rejected") {
						error = errorRecurringInvoices = true;

						invoiz.page.showToast({
							type: "error",
							message: format(resources.textModuleSaveErrorMessage, resources.str_recurringBills),
						});
					}

					if (results[3].state === "rejected") {
						error = errorCancellations = true;

						invoiz.page.showToast({
							type: "error",
							message: format(resources.textModuleSaveErrorMessage, resources.str_cancellationInvoice),
						});
					}

					if (!error) {
						invoiz.page.showToast({
							message: resources.textModuleUpdateSuccessMessage,
						});
					} else {
						if (!errorOffers) {
							invoiz.page.showToast({
								message: format(resources.textModuleSaveSuccessMessage, resources.str_deals),
							});
						}

						if (!errorInvoices) {
							invoiz.page.showToast({
								message: format(resources.textModuleSaveSuccessMessage, resources.str_bills),
							});
						}
						if (!errorPosReceipts) {
							invoiz.page.showToast({
								message: format(resources.textModuleSaveSuccessMessage, resources.str_bills),
							});
						}

						if (!errorRecurringInvoices) {
							invoiz.page.showToast({
								message: format(resources.textModuleSaveSuccessMessage, resources.str_recurringBills),
							});
						}

						if (!errorCancellations) {
							invoiz.page.showToast({
								message: format(
									resources.textModuleSaveSuccessMessage,
									resources.str_cancellationInvoice
								),
							});
						}
					}
				})
				.done(() => {
					const dataOriginal = JSON.stringify(this.state.textModules);

					changeDetection.setModelGetter(() => {
						const currentData = JSON.stringify(this.state.textModules);

						return {
							original: dataOriginal,
							current: currentData,
						};
					});

					this.setState({ isSubmitting: false });
					history.push("/offers");
				});
		});
	}

	updateValue(type, key, value) {
		const textModules = JSON.parse(JSON.stringify(this.state.textModules));

		if (textModules.hasOwnProperty(type)) {
			if (textModules[type].hasOwnProperty(key)) {
				textModules[type][key] = value;
			}
		}

		this.setState({ textModules });
	}

	render() {
		const { textModules, isSubmitting, canUpdateTextBlocks } = this.state;
		const { resources, pathName } = this.props;
		return (
			<div className="settings-text-modules-component wrapper-has-topbar-with-margin">
				<TopbarComponent
					title={resources.str_textModules}
					viewIcon={`icon-settings`}
					buttonCallback={(ev, button) => this.onTopbarButtonClick()}
					buttons={[
						{
							type: "primary",
							label: resources.str_toSave,
							buttonIcon: "icon-check",
							action: "save",
							disabled: isSubmitting || !canUpdateTextBlocks,
							dataQsId: "settings-textModules-btn-save",
						},
					]}
				/>

				<div className="box">
					{/* <div className="row">
						<div className="col-xs-12">
							<h2 className="u_pb_16">{resources.str_textModules}</h2>
							<div className="text-muted">
								<p>
									{resources.textmoduleCustomizeMessage}
								</p>
								<p>
									{resources.textmoduleCustomizeTextDescription}
								</p>
							</div>
						</div>
					</div> */}
					{pathName === "/settings/text-modules/offer" ? (
						<div className="row">
							<div className="col-xs-12 text-h4">
								{resources.str_offerUpperCase}
								<div className="form_groupheaderSubtext">{resources.textModuleDefaultOfferText}</div>
							</div>
							<div className="col-xs-12 u_pbt_20">
								<div className="row">
									<div className="col-xs-4 left-center-heading">
										<label>{resources.str_introductionText}</label>
									</div>
									<div className="col-xs-8">
										<HtmlInputComponent
											// label={resources.str_introductionText}
											placeholder={format(
												resources.textModulePlaceholderIntroductionText,
												resources.str_deals
											)}
											value={textModules.offer.introduction}
											onTextChange={(val) => this.updateValue("offer", "introduction", val)}
											disabled={!canUpdateTextBlocks}
										/>
									</div>
									<div className="col-xs-4 left-center-heading">
										<label>{resources.str_finalText}</label>
									</div>
									<div className="col-xs-8">
										<HtmlInputComponent
											// label={resources.str_finalText}
											placeholder={format(
												resources.textModulePlaceholderConclusionText,
												resources.str_deals
											)}
											value={textModules.offer.conclusion}
											onTextChange={(val) => this.updateValue("offer", "conclusion", val)}
											disabled={!canUpdateTextBlocks}
										/>
									</div>
									<div className="col-xs-4 left-center-heading">
										<label>{resources.str_emails}</label>
									</div>
									<div className="col-xs-8">
										<HtmlInputComponent
											// label={resources.str_emails}
											placeholder={resources.textModulesPlaceholderEmailText}
											value={textModules.offer.email}
											onTextChange={(val) => this.updateValue("offer", "email", val)}
											disabled={!canUpdateTextBlocks}
										/>
									</div>
								</div>
								<ButtonComponent
								  type="cancel"
									callback={() => {
										history.push("/offers");
									}}
									label="Cancel"
									float="float-right"
								/>
							</div>
						</div>
					) : null}

					{pathName === "/settings/text-modules/invoice" ? (
						<div>
							<div className="row">
								<div className="col-xs-12 text-h4">
									{resources.str_invoice}
									<div className="form_groupheaderSubtext">
										{resources.textModulesInvoiceSubHeader}
									</div>
								</div>
								<div className="col-xs-12 u_pbt_20">
									<div className="row">
										<div className="col-xs-4 left-center-heading">
											<label>{resources.str_introductionText}</label>
										</div>
										<div className="col-xs-8">
											<HtmlInputComponent
												// label={resources.str_introductionText}
												placeholder={format(
													resources.textModulePlaceholderIntroductionText,
													resources.str_bills
												)}
												value={textModules.invoice.introduction}
												onTextChange={(val) => this.updateValue("invoice", "introduction", val)}
												disabled={!canUpdateTextBlocks}
											/>
										</div>
										<div className="col-xs-4 left-center-heading">
											<label>{resources.str_finalText}</label>
										</div>
										<div className="col-xs-8">
											<HtmlInputComponent
												// label={resources.str_finalText}
												placeholder={format(
													resources.textModulePlaceholderConclusionText,
													resources.str_bills
												)}
												value={textModules.invoice.conclusion}
												onTextChange={(val) => this.updateValue("invoice", "conclusion", val)}
												disabled={!canUpdateTextBlocks}
											/>
										</div>
										<div className="col-xs-4 left-center-heading">
											<label>{resources.str_emails}</label>
										</div>
										<div className="col-xs-8">
											<HtmlInputComponent
												// label={resources.str_emails}
												placeholder={resources.textModulesPlaceholderEmailText}
												value={textModules.invoice.email}
												onTextChange={(val) => this.updateValue("invoice", "email", val)}
												disabled={!canUpdateTextBlocks}
											/>
										</div>
										<div className="col-xs-4 left-center-heading">
											<label>{resources.textModulesRecurringInvoiceEmailSubject}</label>
										</div>
										<div className="col-xs-8">
											<TextInputComponent
												name={"recurringInvoiceEmailSubject"}
												value={textModules.recurringInvoice.emailSubject}
												onChange={(evt) =>
													this.updateValue(
														"recurringInvoice",
														"emailSubject",
														evt.target.value
													)
												}
												// label={resources.textModulesRecurringInvoiceEmailSubject}
												placeholder={resources.textModulesPlaceholderEmailText}
												autoComplete="off"
												spellCheck="false"
												wrapperClass="box-border"
												disabled={!canUpdateTextBlocks}
											/>
										</div>
										<div className="col-xs-4 left-center-heading">
											<label>{resources.textModulesRecurringInvoiceEmailText}</label>
										</div>
										<div className="col-xs-8">
											<HtmlInputComponent
												// label={resources.textModulesRecurringInvoiceEmailText}
												placeholder={resources.textModulesPlaceholderEmailText}
												value={textModules.recurringInvoice.email}
												onTextChange={(val) =>
													this.updateValue("recurringInvoice", "email", val)
												}
												disabled={!canUpdateTextBlocks}
											/>
										</div>
										<div className="col-xs-4 left-center-heading">
											<label>{resources.textModulesCancellationEmailSubject}</label>
										</div>
										<div className="col-xs-8">
											<TextInputComponent
												name={"cancellationEmailSubject"}
												value={textModules.cancellation.emailSubject}
												onChange={(evt) =>
													this.updateValue("cancellation", "emailSubject", evt.target.value)
												}
												// label={resources.textModulesCancellationEmailSubject}
												placeholder={resources.textModulesPlaceholderEmailText}
												autoComplete="off"
												spellCheck="false"
												wrapperClass="box-border"
												disabled={!canUpdateTextBlocks}
											/>
										</div>
										<div className="col-xs-4 left-center-heading">
											<label>{resources.textModulesCancellationEmailShippment}</label>
										</div>
										<div className="col-xs-8">
											<HtmlInputComponent
												// label={resources.textModulesCancellationEmailShippment}
												placeholder={resources.textModulesPlaceholderEmailText}
												value={textModules.cancellation.email}
												onTextChange={(val) => this.updateValue("cancellation", "email", val)}
												disabled={!canUpdateTextBlocks}
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="row u_pt_20">
								<div className="col-xs-12 text-h4">
									{resources.str_posReceiptUpperCase}
									<div className="form_groupheaderSubtext">
										{resources.textModuleDefaultPosReceiptText}
									</div>
								</div>
								<div className="col-xs-12 u_pbt_20">
									<div className="row">
										<div className="col-xs-4 left-center-heading">
											<label>{resources.str_posTermsAndConditions}</label>
										</div>
										<div className="col-xs-8">
											<HtmlInputComponent
												// label={resources.str_posTermsAndConditions}
												placeholder={format(
													resources.textModulePlaceholderIntroductionText,
													resources.str_posReceiptSmall
												)}
												value={textModules.posReceipt.introduction}
												onTextChange={(val) =>
													this.updateValue("posReceipt", "introduction", val)
												}
												disabled={!canUpdateTextBlocks}
											/>
										</div>
										<div className="col-xs-4 left-center-heading">
											<label>{resources.str_finalText}</label>
										</div>
										<div className="col-xs-8">
											<HtmlInputComponent
												// label={resources.str_finalText}
												placeholder={format(
													resources.textModulePlaceholderConclusionText,
													resources.str_posReceiptSmall
												)}
												value={textModules.posReceipt.conclusion}
												onTextChange={(val) =>
													this.updateValue("posReceipt", "conclusion", val)
												}
												disabled={!canUpdateTextBlocks}
											/>
										</div>
										<div className="col-xs-4 left-center-heading">
											<label>{resources.str_emails}</label>
										</div>
										<div className="col-xs-8">
											<HtmlInputComponent
												// label={resources.str_emails}
												placeholder={resources.textModulesPlaceholderEmailText}
												value={textModules.posReceipt.email}
												onTextChange={(val) => this.updateValue("posReceipt", "email", val)}
												disabled={!canUpdateTextBlocks}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					) : null}
					{/* <div className="row u_pt_20">
						<div className="col-xs-4 form_groupheader_edit text-h4">
							{resources.str_purchaseOrderUpperCase}
							<div className="form_groupheaderSubtext">
								{resources.textModuleDefaultPurchaseOrderText}
							</div>
						</div>
						<div className="col-xs-8">
							<HtmlInputComponent
								label={resources.str_introductionText}
								placeholder={format(resources.textModulePlaceholderIntroductionText, resources.str_purchaseOrderSmall)}
								value={textModules.purchaseOrder.introduction}
								onTextChange={val => this.updateValue('purchaseOrder', 'introduction', val)}
								disabled={!canUpdateTextBlocks}
							/>

							<HtmlInputComponent
								label={resources.str_finalText}
								placeholder={format(resources.textModulePlaceholderConclusionText, resources.str_purchaseOrderSmall)}
								value={textModules.purchaseOrder.conclusion}
								onTextChange={val => this.updateValue('purchaseOrder', 'conclusion', val)}
								disabled={!canUpdateTextBlocks}
							/>

							<HtmlInputComponent
								label={resources.str_emails}
								placeholder={resources.textModulesPlaceholderEmailText}
								value={textModules.purchaseOrder.email}
								onTextChange={val => this.updateValue('purchaseOrder', 'email', val)}
								disabled={!canUpdateTextBlocks}
							/>
						</div>
					</div> */}
				</div>
			</div>
		);
	}
}

export default SettingsTextModulesComponent;
