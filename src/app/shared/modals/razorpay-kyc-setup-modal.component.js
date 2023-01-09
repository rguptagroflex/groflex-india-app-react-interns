import React from "react";
import invoiz from "services/invoiz.service";

import ButtonComponent from "shared/button/button.component";
import ModalService from "services/modal.service";
import RazorpayKycModal from "shared/modals/razorpay-kyc-modal.component";
import config from "config";

import { connect, Provider } from "react-redux";
import KycStatus from "enums/razorpay-kyc-status.enum";
import ActiveCheck from "assets/images/svg/kyc_active.svg";
import GreenCheckStep from "assets/images/svg/kyc_check_green.svg";
import YellowCheckStep from "assets/images/svg/kyc_check_yellow.svg";
import Clarification from "assets/images/svg/kyc_clarification1.svg";
import SVGInline from "react-svg-inline";
import KycProgress from "enums/razorpay-kyc-progress.enum";
const { ACCOUNT, BANK_DETAILS, STAKEHOLDER, COMPLETED } = KycProgress;
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import { connectWithStore } from "helpers/connectWithStore";
import store from "redux/store";
import InfoIcon from "assets/images/svg/kyc_info.svg";
import Uploader from "fine-uploader";
import { handleTransactionFormErrors, handleImageError } from "helpers/errors";
import _ from "lodash";
import { format } from "util";
import { handleRazorpayErrors } from "helpers/errors";
import LoaderComponent from "shared/loader/loader.component";
import NumberInputComponent from "shared/inputs/number-input/number-input.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
class RazorpayKycSetupModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isDisabled: false,
			isClarification: this.props.isClarification || false,
			errorMessages: [],
			requiredDocuments: [],
			requiredFields: [],
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
				},
			],
			isSaveDisable: true,
			businessProofType: "",
			uploadedDocument: [],
			completedKyc: this.props.completeKyc,
			documentAddressType: "",
			documentType: "",
			documentUploadErrors: ``,
			fileUploading: false,
			isLoading: true,
			accountData: {},
			stakeholderData: {},
			documentData: {},
			bankData: {},
			accountErrors: {
				contactName: "",
				email: "",
				mobile: "",
				businessType: "",
				legalBusinessName: "",
				customerFacingName: "",
				street1: "",
				street2: "",
				state: "",
				city: "",
				postalCode: "",
				gstNumber: "",
				cinNumber: "",
				panNumber: "",
			},
			stakeholderErrors: {
				name: "",
				stakeholderEmail: "",
				panNumber: "",
				stakeholderMobile: "",
			},
			bankErrors: {
				ifscCode: "",
				bankAccountNumber: "",
				beneficiary: "",
			},
		};

		this.isMobileNumberValid = false;
		this.isEmailValid = false;
	}

	componentDidMount() {
		const { isClarification } = this.state;

		if (isClarification) {
			Promise.all([invoiz.request(config.razorpay.endpoints.getAccountDetails, { auth: true, method: "GET" })])
				.then(([accountResponse]) => {
					this.setState({
						isLoading: false,
						requiredDocuments: accountResponse.body.data.requiredDocuments,
						requiredFields: _.cloneDeep(accountResponse.body.data.requiredDocuments)
					});
				})
				.catch((err) => {
					console.log(err);
				});
			setTimeout(() => {
				this.initManualUploader();
			});
		}
	}

	save() {
		const { requiredFields, accountData, stakeholderData, bankData, isSaveDisable } = this.state;
		const returnValues = requiredFields.map((element) => {
			if (element.status === `required`) {
				return true
			}
		})
		const checkTrue = (item) => item === true;
		if (returnValues.some(checkTrue)) {
			return invoiz.showNotification({ message: `Please fill in all the fields!`, type: `error` })
		} else {
			this.setState({ isSaveDisable: false })
		}
		if (!isSaveDisable) {
		const requests = [];
		if (!_.isEmpty(accountData)) {
			requests.push(
				invoiz.request(config.razorpay.endpoints.updateAccount, {
					auth: true,
					method: "PUT",
					data: accountData,
				})
			);
		} else if (!_.isEmpty(stakeholderData)) {
			requests.push(
				invoiz.request(config.razorpay.endpoints.updateStakeholder, {
					auth: true,
					method: "PUT",
					data: stakeholderData,
				})
			);
		} else if (!_.isEmpty(bankData)) {
			requests.push(
				invoiz.request(config.razorpay.endpoints.updateBankDetails, {
					auth: true,
					method: "PUT",
					data: bankData,
				})
			);
		}
		Promise.all(requests)
			.then(([accountResponse, stakeholderResponse, bankResponse]) => {
				invoiz.showNotification({ type: "success", message: `Successfully submitted clarifications!` });
				ModalService.close();
				invoiz.router.reload();
			})
			.catch((err) => {
				const errors = handleRazorpayErrors(
					err.body.meta,
					this.state.accountErrors,
					this.state.stakeholderErrors,
					this.state.bankErrors
				);
				invoiz.showNotification({ type: "error", message: `Could not save clarifications!` });
				this.setState({ accountErrors: errors.accountErrors, stakeholderErrors: errors.stakeholderErrors, bankErrors: errors.bankErrors })
			});
		}
	}

	addFile(files) {
		if (!files) {
			return;
		}

		_.each(files, (file) => {
			this.manualUploader.addFiles([file]);
		});
	}

	addSelectedFile(event, name) {
		const file = event.target.files[0];
		//this.addFile([file]);
		event.target.value = "";
		const { documentAddressType } = this.state;
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
		} else if (name === `cancelled_cheque`) {
			this.state.uploadedDocument.push("additional_documents");
			this.state.uploadedDocument.push(`cancelled_cheque`);
			// this.manualUploader.setEndpoint(`${config.razorpay.endpoints.uploadMerchantDocuments}`);
			// this.manualUploader.setParams({
			// 	documentType: `${name}`,
			// });
			this.manualUploader.addFiles([file], {documentType: `${name}`} ,`${config.razorpay.endpoints.uploadMerchantDocuments}`)
		} else if (
			name === `passport_front` ||
			name === `passport_back` ||
			name === `voter_id_front` ||
			name === `voter_id_back` ||
			name === `aadhar_front` ||
			name === `aadhar_back`
		) {
			this.state.uploadedDocument.push(name);
			this.manualUploader.addFiles([file], {documentType: `${name}`}, `${config.razorpay.endpoints.uploadStakeholderDocuments}`)
			
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
		const { resources, } = this.props;
		const { requiredFields } = this.state;
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
					filenameParam: "filename",
				},
				callbacks: {
					onComplete: (id, fileName, response) => {
						if (!response.success) {
							return;
						}
						const { uploadedDocument } = this.state;

						this.setState({ uploadedDocument }, () => {
							const required = requiredFields.filter(function (obj) {
								return !uploadedDocument.includes(obj.field_reference)
							});
							this.setState({ requiredFields: required, fileUploading: false });
							invoiz.page.showToast({ message: `Uploaded document successfully!` });
						});
					},
					onProgress: (id, name, uploadedBytes, totalBytes) => {
						this.setState({ fileUploading: true });
					},
					onError: (id, name, errorReason, xhr) => {
						if (xhr) {
							const { meta: error } = JSON.parse(xhr.response);
							return handleRazorpayErrors(error, this.state.errorMessages);
						}
					},
				},
			})
		);
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

	onInputStakeholderChange(value, name) {
		let newData;
		let data;
		let updatedData;
		const { stakeholderData, requiredFields } = this.state;
		if (name === `panNumber`) {
			if (value !== "") {
				updatedData = requiredFields.map(item => (item.field_reference === `kyc.pan`) ? { ...item, 'status': `updated`} : item);
				} else {
					updatedData = requiredFields.map(item => (item.field_reference === `kyc.pan`) ? { ...item, 'status': `required`} : item);
				}
			newData = { kyc: { panNumber: value } };
			data = Object.assign({}, stakeholderData, newData);
		} else if (name === `name`) {
			if (value !== "") {
				updatedData = requiredFields.map(item => (item.field_reference === `name`) ? { ...item, 'status': `updated`} : item);
				} else {
					updatedData = requiredFields.map(item => (item.field_reference === `name`) ? { ...item, 'status': `required`} : item);
				}
				newData = { [name]: value };
				data = Object.assign({}, stakeholderData, newData);
		} else if (name === `stakeholderEmail`) {
			if (value !== "") {
				updatedData = requiredFields.map(item => (item.field_reference === `email`) ? { ...item, 'status': `updated`} : item);
				} else {
					updatedData = requiredFields.map(item => (item.field_reference === `email`) ? { ...item, 'status': `required`} : item);
				}
				newData = { [name]: value };
				data = Object.assign({}, stakeholderData, newData);
		} else if (name === `stakeholderMobile`) {
			if (value !== "") {
				updatedData = requiredFields.map(item => (item.field_reference === `mobile`) ? { ...item, 'status': `updated`} : item);
				} else {
					updatedData = requiredFields.map(item => (item.field_reference === `mobile`) ? { ...item, 'status': `required`} : item);
				}
				newData = { [name]: value };
				data = Object.assign({}, stakeholderData, newData);
		}
		this.setState({ stakeholderData: data });
	}

	onInputBankChange(value, name) {
		let newData;
		let updatedData;
		let data;
		const { bankData } = this.state;
		let { requiredFields } = this.state;
		if (name !== undefined) {
			if (name === `beneficiary`) {
				if (value !== "") {
				updatedData = requiredFields.map(item => (item.field_reference === `settlements.beneficiary_name`) ? { ...item, 'status': `updated`} : item);
				} else {
					updatedData = requiredFields.map(item => (item.field_reference === `settlements.beneficiary_name`) ? { ...item, 'status': `required`} : item);
				}
				newData = { [name]: value };
				data = Object.assign({}, bankData, newData);
			} else if (name === `ifscCode`) {
				if (value !== "") {
					updatedData = requiredFields.map(item => (item.field_reference === `settlements.ifsc_code`) ? { ...item, 'status': `updated`} : item);
					} else {
						updatedData = requiredFields.map(item => (item.field_reference === `settlements.ifsc_code`) ? { ...item, 'status': `required`} : item);
					}
					newData = { [name]: value };
					data = Object.assign({}, bankData, newData);
			} else if (name === `bankAccountNumber`) {
				if (value !== "") {
					updatedData = requiredFields.map(item => (item.field_reference === `settlements.account_number`) ? { ...item, 'status': `updated`} : item);
					} else {
						updatedData = requiredFields.map(item => (item.field_reference === `settlements.account_number`) ? { ...item, 'status': `required`} : item);
					}
					newData = { [name]: value };
					data = Object.assign({}, bankData, newData);
			}
			this.setState({ bankData: data, requiredFields: updatedData });
		}
	}
	

	onInputAccountChange(value, name) {
		let newData;
		const { accountData } = this.state;
		let { requiredFields } = this.state;
		let updatedData;
		if (name === `panNumber` || name === `gstNumber` || name === `cinNumber`) {
			if (value !== "") {
				updatedData = requiredFields.map(item => (name === `panNumber` ? item.field_reference === `legal_info.pan` : name === `cinNumber` ? 
				item.field_reference === `legal_info.cin` : item.field_reference === `legal_info.gst` ) ? 
				{ ...item, 'status': `updated`} : item);
				} else {
					updatedData = requiredFields.map(item => (name === `panNumber` ? item.field_reference === `legal_info.pan` : name === `cinNumber` ? 
				item.field_reference === `legal_info.cin` : item.field_reference === `legal_info.gst` ) ? 
				{ ...item, 'status': `required`} : item);
				}
			newData = { legalInfo: { [name]: value } };
		} else if (name === `street1` || name === `street2` || name === `city` || name === `postalCode`) {
			if (value !== "") {
				updatedData = requiredFields.map(item => (name === `street1` ? item.field_reference === `profile.addresses.registered.street1` : name === `street2` ? 
				item.field_reference === `profile.addresses.registered.street1` : name === `city` ? 
				item.field_reference === `profile.addresses.registered.city` : item.field_reference === `profile.addresses.registered.postal_code`) ?
				{ ...item, 'status': `updated`} : item);
				} else {
					updatedData = requiredFields.map(item => (name === `street1` ? item.field_reference === `profile.addresses.registered.street1` : name === `street2` ? 
					item.field_reference === `profile.addresses.registered.street1` : name === `city` ? 
					item.field_reference === `profile.addresses.registered.city` : item.field_reference === `profile.addresses.registered.postal_code`) ?
					{ ...item, 'status': `required`} : item);
				}
			newData = { profile: { addresses: { registeredAddress: { [name]: value } } } };
		} else {
			if (value !== "") {
				updatedData = requiredFields.map(item => (name === `customerFacingName` ? item.field_reference === `customer_facing_business_name` : name === `legalBusinessName` ? 
				item.field_reference === `legal_business_name` : ``) ?
				{ ...item, 'status': `updated`} : item);
				} else {
					updatedData = requiredFields.map(item => (name === `customerFacingName` ? item.field_reference === `customer_facing_business_name` : name === `legalBusinessName` ? 
					item.field_reference === `legal_business_name` : ``) ?
					{ ...item, 'status': `required`} : item);
				}
			newData = { [name]: value };
		}
		let data = Object.assign({}, accountData, newData);
		this.setState({ accountData: data });
	}

	onMobileNumberBlur(value) {
		const { resources } = this.props;
		if (value.length !== 0 && (value.length < 10 || !config.mobileNumberValidation.test(value))) {
			this.setState({ errorMessageMobile: resources.validMobileNumberError });
		} else {
			this.setState({ errorMessageMobile: "" });
		}
	}

	onEmailBlur(value) {
		const { resources } = this.props;
		let { errorMessageEmail } = this.state;
		if (value.length !== 0 && !config.emailCheck.test(value)) {
			if (value.toString().length !== 0) {
				this.isEmailValid = true;
			}
			errorMessageEmail = resources.validEmailError;
		} else {
			errorMessageEmail = "";
			this.isEmailValid = false;
		}
		this.setState({ errorMessageEmail });
	}

	render() {
		const { resources, account } = this.props;
		const {
			isClarification,
			requiredDocuments,
			requiredFields,
			isLoading,
			businessProofType,
			errorMessages,
			accountErrors,
			stakeholderErrors,
			bankErrors,
			fileUploading,
		} = this.state;
		if (isLoading && isClarification) {
			return <LoaderComponent visible={true} text={`Loading requirements`} />;
		}
		return (
			<div className="kyc-setup-modal-component">
				<div className={isClarification ? `modal-base-headline` : `modal-base-headline-center`}>
					{" "}
					{isClarification ? `Needs clarification` : (account.razorpayKycStatus === `review` && account.razorpayKycProgress === `completed`) ?  `Account under review` : `Complete KYC`}
				</div>
				<span className={isClarification ? `` : `subtext`}>
					{isClarification
						? `Please re-enter the following fields`
						: (account.razorpayKycStatus === `review` && account.razorpayKycProgress === `completed`) ?  `The KYC review process can take up to 4 - 5 days to get approved` : `Please submit your KYC details to start accepting payments`}
				</span>

				{fileUploading ? <LoaderComponent visible={true} text={`File uploading`} /> : null}

				{isClarification
					? requiredDocuments.map((element) => {
							if (element.field_reference === `individual_proof_of_address`) {
								return (
									<div className="row col-xs-12" key={element.field_reference}>
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
													handleChange: (option) => this.onDocumentTypeChange(option),
													openOnFocus: false,
												}}
												value={documentAddressType}
												loadedOptions={this.state.idTypes}
												//errorMessage={this.state.errorMessages["documentType"]}
												//onFocus={() => this.onInputFocus('invoiceDateDisplay')}
												//onBlur={this.onInputBlur}
												//onChange={this.onDateOptionChange}
												// placeholder={`Business type`}
												//customWrapperClass={"col-xs-6"}
												//disabled={this.state.completedKyc}
											/>
											<div className="row">
												<div className="upload-box col-xs-6">
													{/* <div id="document-box" className="document-box"><span className="text-primary">Upload</span> or drop a file</div> */}
													<div
														id="document-box"
														className={`document-box  ${
															this.state.uploadedDocument.includes("front") ||
															((stakeholderDocuments.length ||
																!_.isEmpty(stakeholderDocuments)) &&
																stakeholderDocuments.individual_proof_of_address.some(
																	(e) => e.type === `${documentAddressType}_front`
																))
																? `success`
																: null
														}`}
													>
														<label className="text-muted">
															{this.state.uploadedDocument.includes("front") ||
															((stakeholderDocuments.length ||
																!_.isEmpty(stakeholderDocuments)) &&
																stakeholderDocuments.individual_proof_of_address.some(
																	(e) => e.type === `${documentAddressType}_front`
																)) ? (
																<SVGInline
																	svg={GreenCheckStep}
																	className="check-success"
																/>
															) : null}
															{this.state.uploadedDocument.includes("front") ||
															((stakeholderDocuments.length ||
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
																	<span className={`text-primary`}>Upload</span>{" "}
																	document
																</span>
															)}
															<input
																className="u_hidden"
																type="file"
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
															((stakeholderDocuments.length ||
																!_.isEmpty(stakeholderDocuments)) &&
																stakeholderDocuments.individual_proof_of_address.some(
																	(e) => e.type === `${documentAddressType}_back`
																))
																? `success`
																: null
														}`}
													>
														<label className="text-muted">
															{this.state.uploadedDocument.includes("back") ||
															((stakeholderDocuments.length ||
																!_.isEmpty(stakeholderDocuments)) &&
																stakeholderDocuments.individual_proof_of_address.some(
																	(e) => e.type === `${documentAddressType}_back`
																)) ? (
																<SVGInline
																	svg={GreenCheckStep}
																	className="check-success"
																/>
															) : null}
															{this.state.uploadedDocument.includes("back") ||
															((stakeholderDocuments.length ||
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
																	<span className={`text-primary`}>Upload</span>{" "}
																	document
																</span>
															)}
															<input
																className="u_hidden"
																type="file"
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
								);
							} else if (element.field_reference === `business_proof_of_identification`) {
								return (
									<div className="row address-proof col-xs-12 u_mt_10" key={element.field_reference}>
										<div className="text-h5 u_mb_10">Business proof</div>
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
												handleChange: (option) =>
													this.onDocumentTypeChange("businessProofType", option),
												openOnFocus: false,
											}}
											value={businessProofType}
											loadedOptions={this.state.businessProofTypes}
											errorMessage={this.state.errorMessages["documentType"]}
										/>
										<div className="upload-box col-xs-12">
											<div
												id="document-box"
												className={`document-box  ${
													this.state.uploadedDocument.includes(element.field_reference)
														? `success`
														: ``
												}`}
											>
												<label className="text-muted">
													{this.state.uploadedDocument.includes(element.field_reference) ? (
														<SVGInline svg={GreenCheckStep} className="check-success" />
													) : null}
													{this.state.uploadedDocument.includes(element.field_reference) ? (
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
														onChange={(event, name) => {
															this.addSelectedFile(event, businessProofType);
														}}
													/>
												</label>
											</div>
											{/* <span className="text-muted text-medium">Back</span> */}
										</div>
									</div>
								);
							} else if (
								element.resolution_url.includes("stakeholders") &&
								!element.resolution_url.includes("documents")
							) {
								if (element.field_reference === "kyc.pan") {
									return (
										<div className="row col-xs-12 u_mt_10" key={element.field_reference}>
											<TextInputExtendedComponent
												customWrapperClass={"col-xs-12"}
												name={"panNumber"}
												label={"Owner's PAN"}
												autoComplete="off"
												spellCheck="false"
												value={
													(this.state.stakeholderData.kyc &&
														this.state.stakeholderData.kyc.panNumber) ||
													""
												}
												onChange={(value, name) => this.onInputStakeholderChange(value, name)}
												//	disabled={!canChangeAccountData}
												errorMessage={stakeholderErrors["panNumber"] || element.description}
											/>
											{/* <span className="text-small text-red">{element.description}</span> */}
										</div>
									);
								} else if (element.field_reference === "name") {
									<div className="row col-xs-12 u_mt_10" key={element.field_reference}>
										<TextInputExtendedComponent
											name={"name"}
											value={this.state.stakeholderData.name || ""}
											onChange={(value, name) => this.onInputStakeholderChange(value, name)}
											label={`Owner's name`}
											autoComplete="off"
											spellCheck="false"
											errorMessage={stakeholderErrors["name"] || element.description}
										/>
									</div>;
								} else if (element.field_reference === "mobile") {
									<div className="row col-xs-12 u_mt_10" key={element.field_reference}>
										<NumberInputComponent
											label={"Owner's phone"}
											name={"stakeholderMobile"}
											maxLength="10"
											value={parseInt(this.state.stakeholderData.stakeholderMobile || 0)}
											isDecimal={false}
											defaultNonZero={true}
											onBlur={(value) => this.onMobileNumberBlur(value)}
											onChange={(value, name) => this.onInputStakeholderChange(value, name)}
											errorMessage={stakeholderErrors["stakeholderMobile"] || element.description}
										/>
										
									</div>;
								} else if (element.field_reference === "email") {
									<div className="row col-xs-12 u_mt_10" key={element.field_reference}>
										<TextInputExtendedComponent
											customWrapperClass={"col-xs-12"}
											name={"stakeholderEmail"}
											value={this.state.stakeholderData.stakeholderEmail || ""}
											onChange={(value, name) => this.onInputStakeholderChange(value, name)}
											label={`Owner's e-mail`}
											autoComplete="off"
											spellCheck="false"
											onBlur={(target, value) => this.onEmailBlur(value)}
											errorMessage={stakeholderErrors["stakeholderEmail"] || element.description}
										/>
									</div>;
								}
							} else if (element.resolution_url.includes("products")) {
								if (element.field_reference === "settlements.ifsc_code") {
									return (
										<div className="row col-xs-12 u_mt_10" key={element.field_reference}>
											<TextInputExtendedComponent
												customWrapperClass={"col-xs-12"}
												name={"ifscCode"}
												value={this.state.bankData.ifscCode || ""}
												onChange={(value, name) => this.onInputBankChange(value, name)}
												label={`IFSC code`}
												autoComplete="off"
												spellCheck="false"
												errorMessage={bankErrors["ifscCode"] || element.description}
											/>
										</div>
									);
								} else if (element.field_reference === "settlements.beneficiary_name") {
									return (
										<div className="row col-xs-12 u_mt_10" key={element.field_reference}>
											<TextInputExtendedComponent
												customWrapperClass={"col-xs-12"}
												name={"beneficiary"}
												value={this.state.bankData.beneficiary || ""}
												onChange={(value, name) => this.onInputBankChange(value, name)}
												label={`Beneficiary name`}
												autoComplete="off"
												spellCheck="false"
												errorMessage={bankErrors["beneficiary"] || element.description}
											/>
										</div>
									);
								} else if (element.field_reference === "settlements.account_number") {
									return (
										<div className="row col-xs-12 u_mt_10" key={element.field_reference}>
											<TextInputExtendedComponent
												customWrapperClass={"col-xs-12"}
												label={"Account number"}
												name={"bankAccountNumber"}
												value={this.state.bankData.bankAccountNumber || ""}
												onChange={(value, name) => this.onInputBankChange(value, name)}
												autoComplete="off"
												spellCheck="false"
												errorMessage={bankErrors["bankAccountNumber"] || element.description}
												disabled={this.props.kycProgress === COMPLETED}
											/>
										</div>
									);
								}
							} else if (
								element.resolution_url.includes("documents") ||
								(element.resolution_url.includes("stakeholders") &&
									element.resolution_url.includes("documents"))
							) {
								return (
									<div className="row col-xs-12" key={element.field_reference}>
										<div className="documents u_mt_20">
											<div className={`text-h5 u_mb_10`}>
												{element.field_reference === `individual_proof_of_identification.personal_pan`
													? `Owner's PAN`
													: element.field_reference ===
													  `business_proof_of_identification.business_pan_url`
													? `Business PAN`
													: element.field_reference ===
													  `business_proof_of_identification.business_proof_url`
													? `CIN / Partnership Deed / NGO Certificate / Trust Certificate / Society Certificate`
													: element.field_reference === `additional_documents.form_12a_url`
													? `Form 12A`
													: element.field_reference === `business_proof_of_identification`
													? `Business proof type`
													: element.field_reference === `additional_documents`
													? `Cancelled bank cheque`
													: element.field_reference ===
													  `individual_proof_of_address.aadhar_front`
													? `Owner Aadhar front`
													: element.field_reference ===
													  `individual_proof_of_address.aadhar_back`
													? `Owner Aadhar back`
													: element.field_reference ===
													  `individual_proof_of_address.voter_id_front`
													? `Owner Voter ID front`
													: element.field_reference ===
													  `individual_proof_of_address.voter_id_back`
													? `Owner Voter ID back`
													: element.field_reference ===
													  `individual_proof_of_address.passport_front`
													? `Owner passport front`
													: element.field_reference ===
													  `individual_proof_of_address.passport_back`
													? `Owner passport back`
													: element.field_reference ===
													`individual_proof_of_identification.personal_pan`
												  ? `Owner PAN` :
												  element.field_reference === `business_proof_of_identification.gst_certificate`
													? `GST Certificate` : 
													element.field_reference === `business_proof_of_identification.shop_establishment_certificate`
													? `Shop establishment certificate` : element.field_reference === `business_proof_of_identification.msme_certificate`
													? `MSME Certificate` : `Form 80G`}
											</div>
											<div className="row address-proof col-xs-12">
												<div className="upload-box col-xs-12">
													<div
														id="document-box"
														className={`document-box  ${
															this.state.uploadedDocument.includes(
																element.field_reference
															)
																? `success`
																: ``
														}`}
													>
														<label className="text-muted">
															{this.state.uploadedDocument.includes(
																element.field_reference
															) ? (
																<SVGInline
																	svg={GreenCheckStep}
																	className="check-success"
																/>
															) : null}
															{this.state.uploadedDocument.includes(
																element.field_reference
															) ? (
																<span
																	className={`text-primary`}
																	style={{ fontSize: 13, marginLeft: 5 }}
																>
																	File uploaded or click to re-upload
																</span>
															) : (
																<span>
																	<span className={`text-primary`}>Upload</span>{" "}
																	document
																</span>
															)}
															<input
																className="u_hidden"
																type="file"
																onChange={(event, name) => {
																	this.addSelectedFile(
																		event,
																		element.field_reference ===
																			`individual_proof_of_identification`
																			? `personal_pan`
																			: element.field_reference ===
																			  `business_proof_of_identification.business_pan_url`
																			? `business_pan_url`
																			: element.field_reference ===
																			  `business_proof_of_identification.business_proof_url`
																			? `business_proof_url`
																			: element.field_reference ===
																			  `additional_documents.form_12a_url`
																			? `form_12a_url`
																			: element.field_reference ===
																			  `business_proof_of_identification`
																			? businessProofType
																			: element.field_reference ===
																			  `additional_documents`
																			? `cancelled_cheque`
																			: element.field_reference ===
																			  `individual_proof_of_address.aadhar_front`
																			? `aadhar_front`
																			: element.field_reference ===
																			  `individual_proof_of_address.aadhar_back`
																			? `aadhar_back`
																			: element.field_reference ===
																			  `individual_proof_of_address.voter_id_front`
																			? `voter_id_front`
																			: element.field_reference ===
																			  `individual_proof_of_address.voter_id_back`
																			? `voter_id_back`
																			: element.field_reference ===
																			  `individual_proof_of_address.passport_front`
																			? `passport_front`
																			: element.field_reference ===
																			  `individual_proof_of_address.passport_back`
																			? `passport_back`
																			: element.field_reference ===
																			`individual_proof_of_identification.personal_pan`
																		  ? `personal_pan` :
																		  element.field_reference === `business_proof_of_identification.gst_certificate`
																			? `gst_certificate` : 
																			element.field_reference === `business_proof_of_identification.shop_establishment_certificate`
																			? `shop_establishment_certificate` : element.field_reference === `business_proof_of_identification.msme_certificate`
																			? `msme_certificate` : `form_80g_url`
																	);
																}}
															/>
														</label>
													</div>
													<span className="text-medium text-red">{element.description}</span>
												</div>
											
											</div>
										</div>
									</div>
								);
							} else {
								if (element.field_reference === "legal_info.gst") {
									return (
										<div className="row col-xs-12 u_mt_10">
											<TextInputExtendedComponent
												ref="account-edit-text-input-gstNumber"
												name={"gstNumber"}
												label={"GST number"}
												autoComplete="off"
												spellCheck="false"
												value={
													(this.state.accountData.legalInfo &&
														this.state.accountData.legalInfo.gstNumber) ||
													""
												}
												onChange={(value, name) => this.onInputAccountChange(value, name)}
												errorMessage={accountErrors["gstNumber"] || element.description}
											/>
										</div>
									);
								} else if (element.field_reference === "legal_info.pan") {
									return (
										<div className="row col-xs-12 u_mt_10" key={element.field_reference}>
											<TextInputExtendedComponent
												customWrapperClass={"col-xs-12"}
												ref="account-edit-text-input-panNumber"
												dataQsId="account-edit-text-input-panNumber"
												name={"panNumber"}
												label={"Business PAN"}
												// required={true}
												autoComplete="off"
												spellCheck="false"
												value={
													(this.state.accountData.legalInfo &&
														this.state.accountData.legalInfo.panNumber) ||
													""
												}
												onChange={(value, name) => this.onInputAccountChange(value, name)}
												errorMessage={accountErrors["panNumber"] || element.description}
											/>
										</div>
									);
								} else if (element.field_reference === "legal_info.cin") {
									return (
										<div className="row col-xs-12 u_mt_10" key={element.field_reference}>
											<TextInputExtendedComponent
												customWrapperClass={"col-xs-12"}
												ref="account-edit-text-input-cinNumber"
												dataQsId="account-edit-text-input-cinNumber"
												name={"cinNumber"}
												label={"CIN number"}
												autoComplete="off"
												spellCheck="false"
												value={
													(this.state.accountData.legalInfo &&
														this.state.accountData.legalInfo.cinNumber) ||
													""
												}
												onChange={(value, name) => this.onInputAccountChange(value, name)}
												errorMessage={accountErrors["cinNumber"] || element.description}
											/>
										</div>
									);
								} else if (element.field_reference === "legal_business_name") {
									return (
										<div className="row col-xs-12 u_mt_10" key={element.field_reference}>
											<TextInputExtendedComponent
												name={"legalBusinessName"}
												value={this.state.accountData.legalBusinessName || ""}
												onChange={(value, name) => this.onInputAccountChange(value, name)}
												label={`Legal business name`}
												autoComplete="off"
												spellCheck="false"
												errorMessage={accountErrors["legalBusinessName"] || element.description}
											/>
										</div>
									);
								} else if (element.field_reference === "customer_facing_business_name") {
									return (
										<div className="row col-xs-12 u_mt_10" key={element.field_reference}>
											<TextInputExtendedComponent
												//customWrapperClass={"col-xs-6"}
												name={"customerFacingName"}
												value={this.state.accountData.customerFacingName || ""}
												onChange={(value, name) => this.onInputAccountChange(value, name)}
												label={`Customer facing name`}
												autoComplete="off"
												spellCheck="false"
												errorMessage={accountErrors["customerFacingName"] || element.description}
											/>
										</div>
									);
								}
							}
					  })
					: null}
				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							type="cancel"
							callback={() => ModalService.close(true)}
							label={resources.str_abortStop}
							dataQsId="modal-btn-cancel"
						/>
					</div>
					<div className="modal-base-confirm">
						<ButtonComponent
							buttonIcon={"icon-check"}
							type={"primary"}
							callback={() => {
								!isClarification
									? ModalService.open(
											<RazorpayKycModal
												account={invoiz.user && invoiz.user}
												resources={resources}
											/>,
											{
												isCloseable: true,
												width: 920,
												//padding: "5px 40px 40px",
												modalClass: "razorpaykyc-modal-component",
											}
									  )
									: this.save();
							}}
							label={isClarification ? `Submit` : (account.razorpayKycStatus === `review` && account.razorpayKycProgress === `completed`) ?  `View form` : `Submit KYC`}
							dataQsId="modal-btn-confirm"
							disabled={false}
						/>
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

export default connect(mapStateToProps)(RazorpayKycSetupModal);
