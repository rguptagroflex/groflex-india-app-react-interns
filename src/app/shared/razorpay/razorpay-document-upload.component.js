import invoiz from "services/invoiz.service";
import React from "react";
import config from "config";
import CheckboxInputComponent from "shared/inputs/checkbox-input/checkbox-input.component";
import KycProgress from "enums/razorpay-kyc-progress.enum";
const { ACCOUNT, BANK_DETAILS, STAKEHOLDER, COMPLETED } = KycProgress;
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import { connectWithStore } from "helpers/connectWithStore";
import store from "redux/store";
import InfoIcon from "assets/images/svg/kyc_info.svg";
import SVGInline from "react-svg-inline";
import Uploader from "fine-uploader";
import { handleTransactionFormErrors, handleImageError } from "helpers/errors";
import _ from "lodash";
import { format } from "util";
import GreenCheckStep from "assets/images/svg/kyc_check_green.svg";
import { handleRazorpayErrors } from "helpers/errors";
import LoaderComponent from "shared/loader/loader.component";
class RazorpayDocumentUploadComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			errorMessages: this.props.errors,
			idTypes: [
				{
					label: "Aadhar",
					value: "aadhar",
					disabled: false,
				},
				{
					label: `Passport`,
					value: "passport",
					disabled: false,
				},
				{
					label: `Voter ID`,
					value: "voter_id",
					disabled: false,
				},
			],
			businessProofTypes: [
				{
					label: "Shop establishment certificate",
					value: "shop_establishment_certificate",
					disabled: false,
				},
				{
					label: `GST certificate`,
					value: "gst_certificate",
					disabled: false,
				},
				{
					label: `MSME certificate`,
					value: "msme_certificate",
					disabled: false,
				}
			],
			uploadedDocument: [],
			completedKyc: this.props.completeKyc,
			documentAddressType: "",
			businessProofType: "",
			documentType: "",
			documentUploadErrors: ``,
			fileUploading: false,
			requiredDocuments: this.props.completeKyc ? [] : _.cloneDeep(this.props.documentDetails.requiredDocuments),
		};
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.errors !== this.props.errorMessages) {
			this.setState({ errorMessages: nextProps.errors });
		}
	}

	componentDidMount() {
		const { documentDetails } = this.props;
		const docType =
		documentDetails.stakeholderDocuments && (documentDetails.stakeholderDocuments.length || !_.isEmpty(documentDetails.stakeholderDocuments)) &&
			documentDetails.stakeholderDocuments.individual_proof_of_address[0].type.substring(
				0,
				documentDetails.stakeholderDocuments.individual_proof_of_address[0].type.indexOf("_")
			);
		const proofType = documentDetails.accountDocuments && (documentDetails.accountDocuments.length || !_.isEmpty(documentDetails.accountDocuments)) && 
		documentDetails.accountDocuments.business_proof_of_identification[0].type

		if (docType && docType === `voter`) {
			this.setState({ documentAddressType: `voter_id`, businessProofType: proofType });
		} else {
			this.setState({ documentAddressType: docType, businessProofType: proofType });
		}
		setTimeout(() => {
			this.initManualUploader();
		});
	}

	addFile(files) {
		if (!files) {
			return;
		}

	//	_.each(files, (file) => {
			this.manualUploader.addFiles([file]);
	//	});
	}

	addSelectedFile (event, name) {
		const { documentAddressType } = this.state;
		const file = event.target.files[0];
		//this.addFile([file]);
		event.target.value = "";
		if (name === `front` || name === `back`) {
			//this.state.uploadedDocument.push("individual_proof_of_address");
			this.state.uploadedDocument.push(name);
			this.state.uploadedDocument.push(`${documentAddressType}_${name}`);
			this.manualUploader.addFiles([file], {documentType: `${documentAddressType}_${name}`}, `${config.razorpay.endpoints.uploadStakeholderDocuments}`)
		} else if (name === `personal_pan`) {
			this.state.uploadedDocument.push("individual_proof_of_identification");
			this.manualUploader.addFiles([file], {documentType: `${name}`} ,`${config.razorpay.endpoints.uploadStakeholderDocuments}`)
		} else if (name === `business_pan_url`) {
			this.state.uploadedDocument.push(`business_proof_of_identification`);
			this.state.uploadedDocument.push(`business_proof_of_identification.business_pan_url`);
			this.manualUploader.addFiles([file], {documentType: `${name}`} ,`${config.razorpay.endpoints.uploadMerchantDocuments}`)
		} else if (name === `business_proof_url`) {
			this.state.uploadedDocument.push(`business_proof_of_identification`);
			this.state.uploadedDocument.push(`business_proof_of_identification.business_proof_url`);
			// this.manualUploader.setEndpoint(`${config.razorpay.endpoints.uploadMerchantDocuments}`);
			// this.manualUploader.setParams({
			// 	documentType: `${name}`,
			// });
			this.manualUploader.addFiles([file], {documentType: `${name}`} ,`${config.razorpay.endpoints.uploadMerchantDocuments}`)
		} else if (name === `form_12a_url`) {
			this.state.uploadedDocument.push(`additional_documents.form_12a_url`);
			this.manualUploader.addFiles([file], {documentType: `${name}`} ,`${config.razorpay.endpoints.uploadMerchantDocuments}`)
		} else if (name === `form_80g_url`) {
			this.state.uploadedDocument.push(`additional_documents.form_80g_url`);
			this.manualUploader.addFiles([file], {documentType: `${name}`} ,`${config.razorpay.endpoints.uploadMerchantDocuments}`)
		} else if (name === `shop_establishment_certificate`) {
			this.state.uploadedDocument.push(`business_proof_of_identification`);
			this.state.uploadedDocument.push(`shop_establishment_certificate`);
			this.manualUploader.addFiles([file], {documentType: `${name}`} ,`${config.razorpay.endpoints.uploadMerchantDocuments}`)
		} else if (name === `gst_certificate`) {
			this.state.uploadedDocument.push(`business_proof_of_identification`);
			this.state.uploadedDocument.push(`gst_certificate`);
			this.manualUploader.addFiles([file], {documentType: `${name}`} ,`${config.razorpay.endpoints.uploadMerchantDocuments}`)
		} else if (name === `msme_certificate`) {
			this.state.uploadedDocument.push(`business_proof_of_identification`);
			this.state.uploadedDocument.push(`msme_certificate`);
			this.manualUploader.addFiles([file], {documentType: `${name}`} ,`${config.razorpay.endpoints.uploadMerchantDocuments}`)
		}
	}

	initDragAndDropUploader() {
		Uploader.DragAndDrop({
			dropZoneElements: [document.getElementById("document-box")],
			callbacks: {
				processingDroppedFilesComplete: (files) => {
					this.addFile(files);
				},
			},
		});
	}

	initManualUploader() {
		const { documentAddressType, requiredDocuments, businessProofType } = this.state;
		this.manualUploader = new Uploader.FineUploaderBasic(
			_.assign({}, config.razorpay.fineUploader, {
				autoUpload: true,
				multiple: false,
				messages: {
					typeError: `Incorrect type`,
				},
				request: {
					customHeaders: { authorization: `Bearer ${invoiz.user.token}` },
					inputName: "filename",
					filenameParam: "filename"
				},
				callbacks: {
					onComplete: (id, fileName, response) => {
						if (!response.success) {
							return;
						}
						const { uploadedDocument } = this.state;

						this.setState({ uploadedDocument }, () => {
							
							const required = requiredDocuments.filter(obj => {
								if (obj.field_reference === `individual_proof_of_address`) {
									if (uploadedDocument.includes(`${documentAddressType}_front`) && uploadedDocument.includes(`${documentAddressType}_back`)) {
										return obj.field_reference !== `individual_proof_of_address`;
									} else {
										return obj.field_reference === `individual_proof_of_address`;
									}
								} else {
									return !uploadedDocument.includes(obj.field_reference)
								}
							})
							this.setState({ requiredDocuments: required, fileUploading: false });
							invoiz.page.showToast({ message: `Uploaded document successfully!` });
						});
					},
					onProgress: (id, name, uploadedBytes, totalBytes) => {
						this.setState({ fileUploading: true })
					},
					onError: (id, name, errorReason, xhr) => {
						if (xhr) {
							const { meta: error } = JSON.parse(xhr.response);
							this.setState({ fileUploading: false });
							return invoiz.showNotification({ type: `error`, message: `Could not upload file`})
						}
					},
				},
			})
		);
	}

	completeKyc() {
		this.setState({ completedKyc: !this.state.completedKyc }, () => {
			this.props.onComplete(this.state.completedKyc);
		});
	}

	onDocumentTypeChange(name, option) {
		if (name === `documentAddressType`) {
			this.setState({ documentAddressType: option.value }, () => {
				setTimeout(() => {
					this.initManualUploader();
				});
			});
		} else if (name === `businessProofType`) {
			this.setState({ businessProofType: option.value }, () => {
				setTimeout(() => {
					this.initManualUploader();
				});
			});
		}
	}

	render() {
		const { documentDetails } = this.props;
		const { documentAddressType, documentType, businessProofType, requiredDocuments } = this.state;
		const { accountDocuments, stakeholderDocuments } = documentDetails;
		return (
			<div className="row u_pt_40 u_pb_40 razorpaykyc-modal-document">
				<div className="col-xs-3 form_groupheader_edit text-h4">{`Upload documents`}</div>
				<div className="col-xs-9">
					{
						this.state.fileUploading ? <LoaderComponent visible={true} text={`File uploading`}/> : null
					}
					<div className="col-xs-12">
						<div className="row">
							<div className="row col-xs-12">
								<span className="info-text">
									<SVGInline svg={InfoIcon} style={{ marginRight: 10 }} />
									The maximum supported file size for JPG/PNG and PDF files are 4MB and 2MB
									respectively. Please make sure to upload all pages of the documents.
								</span>
							</div>
							<div className="row col-xs-12">
								<span className="input_error text-medium">{this.state.localErrorMessage}</span>
							</div>
							<div className="row col-xs-12">
								<div className="address-proof u_mt_20">
									<div className="text-h5 u_mb_10">Owner's address proof</div>
									<SelectInputComponent
										ref="documentAddressType"
										name="documentAddressType"
										allowCreate={false}
										notAsync={true}
										options={{
											searchable: false,
											placeholder: "Choose type of address proof",
											labelKey: "label",
											valueKey: "value",
											clearable: false,
											backspaceRemoves: false,
											handleChange: (option) => this.onDocumentTypeChange('documentAddressType', option),
											openOnFocus: false,
										}}
										value={documentAddressType}
										loadedOptions={this.state.idTypes}
										errorMessage={this.state.errorMessages["documentType"]}
										//onFocus={() => this.onInputFocus('invoiceDateDisplay')}
										//onBlur={this.onInputBlur}
										//onChange={this.onDateOptionChange}
										// placeholder={`Business type`}
										//customWrapperClass={"col-xs-6"}
										//disabled={this.state.completedKyc}
										disabled={
											(stakeholderDocuments && stakeholderDocuments.length || !_.isEmpty(stakeholderDocuments)) &&
											stakeholderDocuments.individual_proof_of_address.some(
												(e) =>
													e.type === `${documentAddressType}_front` ||
													e.type === `${documentAddressType}_back`
											)
												? true
												: false
										}
									/>
									<div className="row">
										<div className="upload-box col-xs-6">
											{/* <div id="document-box" className="document-box"><span className="text-primary">Upload</span> or drop a file</div> */}
											<div
												id="document-box"
												className={`document-box  ${
													this.state.uploadedDocument.includes("front") ||
													((stakeholderDocuments && stakeholderDocuments.length ||
														!_.isEmpty(stakeholderDocuments)) &&
														stakeholderDocuments.individual_proof_of_address.some(
															(e) => e.type === `${documentAddressType}_front`
														))
														? `success`
														: ``
												}`}
											>
												{/* {this.state.uploadedDocument.includes("front") ||
												((stakeholderDocuments && stakeholderDocuments.length || !_.isEmpty(stakeholderDocuments)) &&
													stakeholderDocuments.individual_proof_of_address.some(
														(e) => e.type === `${documentAddressType}_front`
													)) ? (
													<SVGInline svg={GreenCheckStep} className="check-success" />
												) : null} */}
												<label className="text-muted upload-button">
													{/* <span> */}
													{this.state.uploadedDocument.includes("front") ||
												((stakeholderDocuments && stakeholderDocuments.length || !_.isEmpty(stakeholderDocuments)) &&
													stakeholderDocuments.individual_proof_of_address.some(
														(e) => e.type === `${documentAddressType}_front`
													)) ? (
													<SVGInline svg={GreenCheckStep} className="check-success" />
												) : null}
														{this.state.uploadedDocument.includes("front") ||
														((stakeholderDocuments && stakeholderDocuments.length ||
															!_.isEmpty(stakeholderDocuments)) &&
															stakeholderDocuments.individual_proof_of_address.some(
																(e) => e.type === `${documentAddressType}_front`
															)) ? (
															<span
																className={`text-primary`}
																style={{ fontSize: 13, marginLeft: 5 }}
															>
																File uploaded or click to re-upload
															</span>
														) : (
															<span>
																<span className={`text-primary`}>Upload</span> document
															</span>
														)}
													{/* </span> */}
													<input
														className="u_hidden"
														type="file"
														disabled={this.props.kycProgress === COMPLETED || !this.state.documentAddressType}
														onChange={(event, name) => {
															this.state.completedKyc
																? null
																: this.addSelectedFile(event, "front");
														}}
													/>
												</label>
											</div>
											<span className="text-muted text-medium">Front</span>
										</div>
										<div className="upload-box col-xs-6">
											<div
												id="document-box"
												className={`document-box ${
													this.state.uploadedDocument.includes("back") ||
													((stakeholderDocuments && stakeholderDocuments.length ||
														!_.isEmpty(stakeholderDocuments)) &&
														stakeholderDocuments.individual_proof_of_address.some(
															(e) => e.type === `${documentAddressType}_back`
														))
														? `success`
														: ``
												}`}
											>
												{/* {this.state.uploadedDocument.includes("back") ||
												((stakeholderDocuments && stakeholderDocuments.length || !_.isEmpty(stakeholderDocuments)) &&
													stakeholderDocuments.individual_proof_of_address.some(
														(e) => e.type === `${documentAddressType}_back`
													)) ? (
													<SVGInline svg={GreenCheckStep} className="check-success" />
												) : null} */}
												<label className="text-muted">
												{this.state.uploadedDocument.includes("back") ||
												((stakeholderDocuments && stakeholderDocuments.length || !_.isEmpty(stakeholderDocuments)) &&
													stakeholderDocuments.individual_proof_of_address.some(
														(e) => e.type === `${documentAddressType}_back`
													)) ? (
													<SVGInline svg={GreenCheckStep} className="check-success" />
												) : null}
														{this.state.uploadedDocument.includes("back") ||
														((stakeholderDocuments && stakeholderDocuments.length ||
															!_.isEmpty(stakeholderDocuments)) &&
															stakeholderDocuments.individual_proof_of_address.some(
																(e) => e.type === `${documentAddressType}_back`
															)) ? (
															<span
																className={`text-primary`}
																style={{ fontSize: 13, marginLeft: 5 }}
															>
																File uploaded or click to re-upload
															</span>
														) : (
															<span>
																<span className={`text-primary`}>Upload</span> document
															</span>
														)}
													<input
														className="u_hidden"
														type="file"
														disabled={this.props.kycProgress === COMPLETED || !documentAddressType}
														onChange={(event, name) => {
															this.state.completedKyc
																? null
																: this.addSelectedFile(event, "back");
														}}
													/>
												</label>
											</div>
											<span className="text-muted text-medium">Back</span>
										</div>
									</div>
								</div>
							</div>
							{this.props.documentDetails.requiredDocuments.map((element) => {
								const { field_reference } = element;
								if (
									field_reference !== `individual_proof_of_address` &&
									field_reference !== `accepted`
									//field_reference !== `business_proof_of_identification`
								) {
									return (
										<div className="row col-xs-12" key={field_reference}>
											<div className="documents u_mt_20">
												<div
													className={`${
														field_reference ===
														`business_proof_of_identification.business_proof_url`
															? `text-h6`
															: `text-h5`
													} u_mb_10`}
												>
													{field_reference === `individual_proof_of_identification`
														? `Owner's PAN`
														: field_reference ===
														  `business_proof_of_identification.business_pan_url`
														? `Business PAN`
														: field_reference ===
														  `business_proof_of_identification.business_proof_url`
														? `CIN / Partnership Deed / NGO Certificate / Trust Certificate / Society Certificate`
														: field_reference === `additional_documents.form_12a_url`
														? `Form 12A`
														: field_reference === `business_proof_of_identification`
														? `Business proof type`
														: `Form 80G`}
												</div>
												<div className="row address-proof col-xs-12">
													{
														field_reference === `business_proof_of_identification` ? (
															<SelectInputComponent
															ref="businessProofType"
															name="businessProofType"
															allowCreate={false}
															notAsync={true}
															options={{
																searchable: false,
																placeholder: "Choose business proof type",
																labelKey: "label",
																valueKey: "value",
																clearable: false,
																backspaceRemoves: false,
																handleChange: (option) => this.onDocumentTypeChange('businessProofType',option),
																openOnFocus: false,
															}}
															value={businessProofType}
															loadedOptions={this.state.businessProofTypes}
															errorMessage={this.state.errorMessages["documentType"]}
															disabled={this.props.kycProgress === COMPLETED ? true : false}
														/>
														) : null
													}
													<div className="row">
													<div className="upload-box col-xs-12">
														<div
															id="document-box"
															className={`document-box  ${
																this.state.uploadedDocument.includes(field_reference)
																	? `success`
																	: ``
															}`}
														>
															{/* {this.state.uploadedDocument.includes(field_reference) ? (
																<SVGInline
																	svg={GreenCheckStep}
																	className="check-success"
																/>
															) : null} */}
															<label className="text-muted">
																{/* <span> */}
																{this.state.uploadedDocument.includes(field_reference) ? (
																<SVGInline
																	svg={GreenCheckStep}
																	className="check-success"
																/>
															) : null}
																	{this.state.uploadedDocument.includes(
																		field_reference
																	) ? (
																		<span
																			className={`text-primary`}
																			style={{ fontSize: 13, marginLeft: 5 }}
																		>
																			File uploaded or click to re-upload
																		</span>
																	) : (
																		<span>
																			<span className={`text-primary`}>
																				Upload
																			</span>{" "}
																			document
																		</span>
																	)}
																{/* </span> */}
																<input
																	className="u_hidden"
																	type="file"
																	disabled={this.props.kycProgress === COMPLETED || field_reference === `business_proof_of_identification` ? !businessProofType : false}
																	onChange={(event, name) => {
																		this.state.completedKyc
																			? null
																			: this.addSelectedFile(
																					event,
																					field_reference ===
																						`individual_proof_of_identification`
																						? `personal_pan`
																						: field_reference ===
																						  `business_proof_of_identification.business_pan_url`
																						? `business_pan_url`
																						: field_reference ===
																						  `business_proof_of_identification.business_proof_url`
																						? `business_proof_url`
																						: field_reference ===
																						  `additional_documents.form_12a_url`
																						? `form_12a_url`
																						: field_reference ===
																						  `business_proof_of_identification`
																						? businessProofType
																						: `form_80g_url`
																			  );
																	}}
																/>
															</label>
														</div>
														{/* <span className="text-muted text-medium">Back</span> */}
													</div>
													</div>
												</div>
											</div>
										</div>
									);
								}
							})}
							{accountDocuments && accountDocuments.hasOwnProperty("business_proof_of_identification")
								? accountDocuments.business_proof_of_identification.map((element) => {
										return (
											<div className="row col-xs-12" key={element.type}>
												<div className="documents u_mt_20">
													<div
														className={`text-h5 u_mb_10`}
													>
														{element.type === `business_proof_url`
															? `CIN / Partnership Deed / NGO Certificate / Trust Certificate / Society Certificate`
															: (element.type === `msme_certificate` || 
															element.type === `shop_establishment_certificate` ||
															element.type === `gst_certificate`) ? `Business proof type` : `Business PAN`}
													</div>
													<div className="row col-xs-12">
														{
															(element.type === `msme_certificate` || element.type === `shop_establishment_certificate` || element.type === `gst_certificate`) ? (
																<div style={{width: '100%', marginBottom: 20}}>
															<SelectInputComponent
															ref="businessProofType"
															name="businessProofType"
															allowCreate={false}
															notAsync={true}
															options={{
																searchable: false,
																placeholder: "Choose business proof type",
																labelKey: "label",
																valueKey: "value",
																clearable: false,
																backspaceRemoves: false,
																handleChange: (option) => this.onDocumentTypeChange('businessProofType',option),
																openOnFocus: false,
															}}
															value={businessProofType}
															loadedOptions={this.state.businessProofTypes}
															errorMessage={this.state.errorMessages["documentType"]}
															disabled={this.props.kycProgress === COMPLETED ? true : false}
														/>
																</div>
															) : null
														}
														<div className="upload-box col-xs-12">
															<div id="document-box" className={`document-box success`}>
																<label className="text-muted">
																	{/* <span> */}
																	<SVGInline
																	svg={GreenCheckStep}
																	className="check-success"
																/>
																		<span
																			className={`text-primary`}
																			style={{ fontSize: 13, marginLeft: 5 }}
																		>
																			File uploaded or click to re-upload
																		</span>
																	{/* </span> */}
																	<input
																		className="u_hidden"
																		type="file"
																		disabled={this.props.kycProgress === COMPLETED}
																		onChange={(event, name) => {
																			this.state.completedKyc
																				? null
																				: this.addSelectedFile(
																						event,
																						element.type ===
																							`msme_certificate`
																							? `msme_certificate`
																							: element.type ===
																							  `shop_establishment_certificate`
																							? `shop_establishment_certificate`
																							: element.type === `business_pan_url` ? `business_pan_url` : `business_proof_url`
																				  );
																		}}
																	/>
																</label>
															</div>
															{/* <span className="text-muted text-medium">Back</span> */}
														</div>
													</div>
												</div>
											</div>
										);
								  })
								: null}
							{stakeholderDocuments && stakeholderDocuments.hasOwnProperty("individual_proof_of_identification")
								? accountDocuments.business_proof_of_identification.map((element) => {
										return (
											<div className="row col-xs-12" key={element.type}>
												<div className="documents u_mt_20">
													<div
														className={`${
															element.type === `personal_pan` ? `text-h6` : `text-h5`
														} u_mb_10`}
													>
														Owner's PAN
													</div>
													<div className="row">
														<div className="upload-box col-xs-12">
															<div id="document-box" className={`document-box success`}>
													
																<label className="text-muted">
																	<SVGInline
																	svg={GreenCheckStep}
																	className="check-success"
																/>
																		<span
																			className={`text-primary`}
																			style={{ fontSize: 13, marginLeft: 5 }}
																		>
																			File uploaded or click to re-upload
																		</span>
																	<input
																		className="u_hidden"
																		type="file"
																		disabled={this.props.kycProgress === COMPLETED}
																		onChange={(event, name) => {
																			this.state.completedKyc
																				? null
																				: this.addSelectedFile(
																						event,
																						`personal_pan`
																				  );
																		}}
																	/>
																</label>
															</div>
															{/* <span className="text-muted text-medium">Back</span> */}
														</div>
													</div>
												</div>
											</div>
										);
								  })
								: null}

							<div className="row col-xs-12 u_mt_20 complete-checkbox">
								<CheckboxInputComponent
									name={"completedKyc"}
									checked={this.state.completedKyc}
									onChange={() => this.completeKyc()}
									disabled={!_.isEmpty(this.state.requiredDocuments) || this.props.kycProgress === COMPLETED}
								/>
								<span className="tandc text-medium">
									I agree to Razorpay's{" "}
									<a href="https://razorpay.com/terms/" target="_blank">
										terms and conditions
									</a>
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return {
		resources,
	};
};

export default connectWithStore(store, RazorpayDocumentUploadComponent, mapStateToProps);
