import invoiz from "services/invoiz.service";
import React from "react";
import TopbarComponent from "shared/topbar/topbar-start-page.component";
import LoaderComponent from "shared/loader/loader.component";
import config from "config";
import { connect } from "react-redux";
import { fetchTemplates } from "redux/ducks/offer/impressTemplates";
import ButtonComponent from "shared/button/button.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import ModalService from "services/modal.service";
import NotificationService from "services/notification.service";
import PopoverComponent from "shared/popover/popover.component";
// import AccordianComponent from "shared/accordians/accordian.component";
// import SharedDataService from 'services/shared-data.service';
import OvalToggleComponent from "shared/oval-toggle/oval-toggle.component";
import ImageCropModalComponent from "shared/modals/image-crop-modal.component";
import { isPayingUser } from "helpers/subscriptionHelpers";
import userPermissions from "enums/user-permissions.enum";
import LastUsedDocumentsComponent from "./dashboard-last-used-documents.component";
import chargebeePlan from "enums/chargebee-plan.enum";
import KycProgress from "enums/razorpay-kyc-progress.enum";
import RazorpayKycSetupModal from "shared/modals/razorpay-kyc-setup-modal.component";
import RazorpayKycModal from "shared/modals/razorpay-kyc-modal.component";
import KycStatus from "enums/razorpay-kyc-status.enum";
import ActiveCheck from "assets/images/svg/kyc_active.svg";
import GreenCheckStep from "assets/images/svg/kyc_check_green.svg";
import YellowCheckStep from "assets/images/svg/kyc_check_yellow.svg";
import Clarification from "assets/images/svg/kyc_clarification1.svg";
import SVGInline from "react-svg-inline";
import store from "redux/store";
import ProgressBarComponent from "shared/progress-bar/progress-bar.component";
import Verification from "assets/images/svg/kyc_verification.svg";
import planPermissions from "enums/plan-permissions.enum";
import StartExploreComponent from "./explore/start-explore.component";
import StartQuickLinksComponent from "./quick-links/start-quick-links.component";
import StartTrackArticlesComponent from "./track-articles/start-track-articles.component";
import StartFeatureCarouselComponent from "./feature-carousel/start-feature-carousel.component";
import StartPromotionalCarouselComponent from "./promotional-carousel/start-promotional-carousel.component";
import StartArticlesLowOnStockComponent from "./track-articles/start-articles-low-on-stock.component";
import { updateUserPermissions } from 'helpers/updateUserPermissions';


const { ACCOUNT, BANK_DETAILS, STAKEHOLDER, COMPLETED } = KycProgress;
const { CREATED, CLARIFICATION, ACTIVE, REJECTED, REVIEW, SUSPENDED } = KycStatus;

const KEY_CODE_ENTER = 13;
const KEY_CODE_ESCAPE = 27;

const createImpressOffer = (templateId, evt) => {
	const isAdminButton =
		$(evt.target).closest(".admin-btn-release").length > 0 ||
		$(evt.target).closest(".admin-btn-upload-thumbnail").length > 0;

	if (!isAdminButton) {
		invoiz
			.request(`${config.resourceHost}impress?templateId=${templateId}`, {
				auth: true,
				method: "POST",
			})
			.then(({ body: { data } }) => {
				invoiz.router.navigate(`/offer/impress/edit/${data.id}`);
			});
	}
};

const deleteImpressTemplate = (templateId, resources) => {
	invoiz
		.request(`${config.resourceHost}impress/template/${templateId}`, {
			auth: true,
			method: "DELETE",
		})
		.then(() => {
			invoiz.router.reload();

			NotificationService.show({
				message: resources.templateDeleteSuccessMessage,
				type: "success",
			});
		});
};

const duplicateImpressOffer = (templateId, resources) => {
	invoiz
		.request(`${config.resourceHost}impress/template/${templateId}/copy`, {
			auth: true,
			method: "POST",
		})
		.then(() => {
			invoiz.router.reload();

			NotificationService.show({
				message: resources.templateDuplicateSuccessMessage,
				type: "success",
			});
		});
};

const renameImpressOffer = (templateTitle, templateId, successCallback, errorCallback, resources) => {
	invoiz
		.request(`${config.resourceHost}impress/template/${templateId}`, {
			auth: true,
			method: "PUT",
			data: {
				title: templateTitle && templateTitle.trim(),
			},
		})
		.then(
			({
				body: {
					data: { id },
				},
			}) => {
				successCallback && successCallback(id);

				NotificationService.show({
					message: resources.templateRenameSuccessMessage,
					type: "success",
				});
			}
		)
		.catch(({ body }) => {
			if (body.meta && body.meta.title && body.meta.title[0] && body.meta.title[0].code === "EXISTS") {
				NotificationService.show({
					message: resources.nameAlreadyExist,
					type: "error",
				});
			}

			errorCallback && errorCallback();
		});
};

class StartImpressTemplatesComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			currentEditingTemplateId: null,
			ignoreTemplateTitleBlur: false,
			templates: props.templates || null,
			templatesOriginal: props.templates || null,
			canCreateInvoice: null,
			canCreateImprezzOffer: null,
			canCreateOffer: null,
			canViewImprezzOffer: null,
			canUpdateImprezzOffer: null,
			canDeleteImprezzOffer: null,
			canInviteUser: invoiz.user && invoiz.user.hasPermission(userPermissions.INVITE_USER),
			kycProgress: invoiz.user && invoiz.user.razorpayKycProgress,
			kycStatus: invoiz.user && invoiz.user.razorpayKycStatus,
			planId: null,
			isLoadingKyc: true
		};
	}

	componentWillReceiveProps(props) {
		this.setState({
			templates: props.templates || null,
			templatesOriginal: props.templates || null,
			canCreateInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_INVOICE),
			canCreateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_OFFER),
			canCreateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_IMPREZZ_OFFER),
			canViewImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_IMPREZZ_OFFER),
			canUpdateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_IMPREZZ_OFFER),
			canDeleteImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_IMPREZZ_OFFER),
			planId: invoiz.user.subscriptionData ? invoiz.user.subscriptionData.planId : null,
		});
	}

	componentDidMount() {
		this.props.fetchTemplates();

		setTimeout(() => {
			if (invoiz.user && !invoiz.user.kycProgress && invoiz.user.kycStatus !== ACTIVE) {
				invoiz.request(config.razorpay.endpoints.getAccountDetails, { auth: true, method: "GET" }).then(({ body: { data }}) => {
					invoiz.user.kycProgress = data.kycProgress;
					invoiz.user.kycStatus = data.kycStatus;
					this.setState({ kycProgress: data.kycProgress, kycStatus: data.kycStatus, isLoadingKyc: false })
				})
			}
		}, 6000)
		setTimeout(() => {
			updateUserPermissions(() => {
				this.setState(
					{
						canCreateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_OFFER),
						canCreateInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_INVOICE),
					}
				)
			})
		}, 1000)
	}
	componentWillUnmount() {
		// invoiz.off('updateNewsfeedCount');
	}
	onDeleteTemplateClicked(templateId, resources) {
		ModalService.open(<div>{resources.impressTemplateDeleteConfirmText}</div>, {
			width: 500,
			headline: resources.impressTemplateModalHeadline,
			cancelLabel: resources.str_abortStop,
			confirmIcon: "icon-trashcan",
			confirmLabel: resources.str_clear,
			confirmButtonType: "secondary",
			onConfirm: () => {
				ModalService.close();
				deleteImpressTemplate(templateId, resources);
			},
		});
	}

	onTemplateAdminActionRelease(template) {
		invoiz
			.request(`${config.resourceHost}admin/impress/${template.id}`, {
				auth: true,
				method: "PUT",
				data: {
					isImpressTemplate: !template.isImpressTemplate,
				},
			})
			.then(({ body: { data } }) => {
				invoiz.router.reload();
			});
	}

	onTemplateAdminActionUploadThumbnail(template, resources) {
		ModalService.open(
			<ImageCropModalComponent
				offerId={template.id}
				uploadEndpoint={`${config.resourceHost}admin/impress/${template.id}/thumbnail`}
				onFinish={() => {
					invoiz.router.reload();
				}}
				resources={resources}
			/>,
			{
				headline: resources.str_choosePicture,
				width: 800,
				modalClass: "image-crop-modal",
			}
		);
	}

	onTemplateTitleBlur(template, resources) {
		const { ignoreTemplateTitleBlur, templatesOriginal } = this.state;
		const templates = JSON.parse(JSON.stringify(this.state.templates));
		let templateTitle = null;
		let isTemplateTitleChanged = true;

		if (ignoreTemplateTitleBlur) {
			this.setState({ ignoreTemplateTitleBlur: false });
			return;
		}

		templates.forEach((existingTemplate) => {
			if (existingTemplate.id === template.id) {
				templateTitle = existingTemplate.title;
			}
		});

		if (templateTitle !== null && templateTitle.trim().length === 0) {
			NotificationService.show({
				message: resources.titleError,
				type: "error",
			});

			this.setState({ currentEditingTemplateId: null, templates: templatesOriginal });

			return;
		}

		if (templateTitle) {
			templatesOriginal.forEach((existingTemplate) => {
				if (existingTemplate.id === template.id && existingTemplate.title.trim() === templateTitle.trim()) {
					isTemplateTitleChanged = false;
				}
			});
		}

		if (isTemplateTitleChanged) {
			renameImpressOffer(
				templateTitle,
				template.id,
				(newTemplateId) => {
					if (!template.isOwner) {
						templates.forEach((existingTemplate) => {
							if (existingTemplate.id === template.id) {
								existingTemplate.id = newTemplateId;
								existingTemplate.isOwner = true;
							}
						});
					}

					this.setState({ currentEditingTemplateId: null, templatesOriginal: templates, templates });
				},
				() => {
					this.setState({ currentEditingTemplateId: null, templates: templatesOriginal });
				},
				resources
			);
		} else {
			this.setState({ currentEditingTemplateId: null });
		}
	}

	onTemplateTitleFocus(templateId) {
		this.setState({ currentEditingTemplateId: templateId });
	}

	onTemplateTitleChanged(title, templateId) {
		const templates = JSON.parse(JSON.stringify(this.state.templates));

		templates.forEach((template) => {
			if (template.id === templateId) {
				template.title = title;
			}
		});

		this.setState({ templates });
	}

	onTemplateTitleKeyDown(evt) {
		const { currentEditingTemplateId, templates, templatesOriginal } = this.state;
		let templateInput = null;
		let templateOriginalTitle = null;

		if (evt.keyCode === KEY_CODE_ESCAPE) {
			evt.preventDefault();

			templatesOriginal.forEach((template) => {
				if (template.id === currentEditingTemplateId) {
					templateOriginalTitle = template.title;
					templateInput = this.refs && this.refs[`template-title-${template.id}`];
				}
			});

			if (templateOriginalTitle) {
				templates.forEach((template) => {
					if (template.id === currentEditingTemplateId) {
						template.title = templateOriginalTitle;
					}
				});

				this.setState({ currentEditingTemplateId: null, templates, ignoreTemplateTitleBlur: true }, () => {
					templateInput && templateInput.refs["template-input"].blur();
				});
			}
		} else if (evt.keyCode === KEY_CODE_ENTER) {
			evt.preventDefault();

			templates.forEach((template) => {
				if (template.id === currentEditingTemplateId) {
					templateInput = this.refs && this.refs[`template-title-${template.id}`];
				}
			});

			templateInput && templateInput.refs["template-input"].blur();
		}
	}

	quickButtonsContent(type) {
		const { resources } = this.props;
		const { kycProgress, kycStatus } = this.state;
		if (type === `multiUser`) {
			return (
				<div className="box-content">
					{/* <ButtonComponent
						callback={() => {
							invoiz.router.navigate('/settings/user');
						}}
						label={resources.str_accountOwner}
						type="danger"
					/> */}
					<ButtonComponent
						callback={() => {
							invoiz.router.navigate("/settings/user");
						}}
						label={resources.str_inviteCA}
						buttonIcon={"icon-plus"}
					/>
					<ButtonComponent
						callback={() => {
							invoiz.router.navigate("/settings/user");
						}}
						label={resources.str_buySeats}
						buttonIcon={"icon-plus"}
						type="danger"
					/>
				</div>
			);
		} else if (type === `inventory`) {
			return (
				<div className="box-content">
					{/* <ButtonComponent
						callback={() => {
							invoiz.router.navigate('/settings/user');
						}}
						label={resources.str_accountOwner}
						type="danger"
					/> */}
					<ButtonComponent
						callback={() => {
							invoiz.router.navigate("/article/new");
						}}
						label={`Create article`}
						buttonIcon={"icon-plus"}
					/>
					<ButtonComponent
						callback={() => {
							invoiz.router.navigate("/inventory");
						}}
						label={`Stock movement`}
						buttonIcon={"icon-plus"}
						type="danger"
					/>
				</div>
			);
		} else if (type === `setupKyc`) {
			let kycLabel =
				kycProgress === COMPLETED && kycStatus === CLARIFICATION ? `Add clarification` : kycProgress !== COMPLETED ? `Submit KYC` : `View form`;
			return (
				<div className="box-content">
					{kycProgress !== COMPLETED && kycProgress !== null ? <ProgressBarComponent progress={kycProgress} /> : null}
					<ButtonComponent
						callback={() => {
							kycProgress === COMPLETED && kycStatus === CLARIFICATION
								? ModalService.open(
										<RazorpayKycSetupModal
											account={invoiz.user && invoiz.user}
											store={store}
											isClarification={true}
										/>,
										{
											isCloseable: true,
											modalClass: "razorpaykyc-setup-modal-component",
											width: 700,
										}
								  )
								: ModalService.open(
										<RazorpayKycModal account={invoiz.user && invoiz.user} resources={resources} />,
										{
											isCloseable: true,
											width: 920,
											//padding: "5px 40px 40px",
											modalClass: "razorpaykyc-modal-component",
										}
								  );
						}}
						label={kycLabel}
						buttonIcon={"icon-check"}
						disabled={kycProgress === COMPLETED && kycStatus === ACTIVE}
					/>
				</div>
			);
		}
	}

	getIconAndStatus(kycStatus) {
		let iconStatus = null;
		switch (kycStatus) {
			case ACTIVE:
				iconStatus = (
					<span>
						<SVGInline width="17px" svg={ActiveCheck} />
						<span className="text-green" style={{ marginLeft: 10 }}>
							Account activated
						</span>
					</span>
				);
				break;
			case CLARIFICATION:
				iconStatus = (
					<span>
						<SVGInline width="17px" svg={Clarification} />
						<span className="text-orange" style={{ marginLeft: 10 }}>
							Needs clarification
						</span>
					</span>
				);
				break;
			case CREATED:
			case REVIEW:
				iconStatus = (
					<span>
						<SVGInline width="17px" svg={Verification} />
						<span style={{ color: "#FFAA2C", marginLeft: 10 }}>Under review</span>
					</span>
				);
			default:
				break;
		}

		return iconStatus;
	}

	render() {
		const { isLoading, errorOccurred, resources } = this.props;
		const {
			currentEditingTemplateId,
			templates,
			canCreateInvoice,
			canCreateOffer,
			canCreateImprezzOffer,
			canUpdateImprezzOffer,
			canViewImprezzOffer,
			canDeleteImprezzOffer,
			userEmail,
			planId,
			canInviteUser,
			kycProgress,
			kycStatus,
		} = this.state;
		// const returnToImpressOfferList = SharedDataService.get('offer-impress-templates-returnToImpressOfferList');
		const generalTemplate = templates.find((t) => t.isGeneralTemplate);
		const allTemplate = templates.filter((t) => !t.isGeneralTemplate);
		if (isLoading || errorOccurred) {
			if (isLoading) {
				return (
					<div className="start-impress-templates-loading">
						<LoaderComponent text={resources.str_loadingStart} visible={true} />
					</div>
				);
			}

			return null;
		}

		return (
			<div className="start-groflex-templates-component-wrapper">
				<TopbarComponent
					title={resources.str_impress}
					viewIcon={`icon-start`}
					resources={resources}
				/>
				{/* <div className="impress-templates-head">
					<div className="steps-container">
						<div className="step">
							<div className="icon-container">
								<div className="icon icon-offer" />
							</div>
							<div className="headline">{resources.str_selectTemplate}</div>
							<div className="text">{resources.templateSelectionText}</div>
						</div>
						<div className="step">
							<div className="icon-container">
								<div className="icon icon-paint" />
							</div>
							<div className="headline">{resources.str_createOffer}</div>
							<div className="text">{resources.offerCustomerText}</div>
						</div>
						<div className="step">
							<div className="icon-container">
								<div className="icon icon-rupees" />
							</div>
							<div className="headline">{resources.str_generateSales}</div>
							<div className="text">{resources.offerCustomerSentText}</div>
						</div>
					</div>
				</div> */}
				<div className="start-groflex-templates-wrapper">
					{/* {!isPayingUser() ? (
						<div className="onboarding-steps-wrapper">
							<div className="large-column-width">
								<div className="onBoarding-wrapper">
									<div className="onboarding-header-image" />
									<div className="onboarding-header1">
										{resources.onBoardingProgressHeaderAccountDataText}
									</div>
									<div className="onboarding-header2">
										{resources.onBoardingProgressSubHeaderAccountDataText}
									</div>
									<div className="onboarding-header3">
										<span>
											{resources.onBoardingProgressContentAccountDataText1}
											<br></br>
											{resources.onBoardingProgressContentAccountDataText2}{" "}
											<strong>{resources.onBoardingProgressContentAccountDataText3}</strong>.
										</span>
									</div>
								</div>
							</div>
							<div className="large-column-width">
								<div className="steps-wrapper">
									<div className="step">
										<div className="icon-container">
											<div className="icon icon-offer" />
										</div>
										<div className="step-content">
											<div className="headline">{resources.str_selectTemplate}</div>
											<div className="text">{resources.templateSelectionText}</div>
										</div>
									</div>
									<div className="step">
										<div className="icon-container">
											<div className="icon icon-paint" />
										</div>
										<div className="step-content">
											<div className="headline">{resources.str_createOffer}</div>
											<div className="text">{resources.offerCustomerText}</div>
										</div>
									</div>
									<div className="step">
										<div className="icon-container">
											<div className="icon icon-rupees" />
										</div>
										<div className="step-content">
											<div className="headline">{resources.str_generateSales}</div>
											<div className="text">{resources.offerCustomerSentText}</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					) : null} */}
					<div className="col-xs-12">
						<StartQuickLinksComponent />
					</div>
					{/* {kycStatus == ACTIVE ? ( */}
					{/* uncomment when razorpay intrigation done */}
						{/* <div className="col-xs-12"> 
							<div className="widgetContainer box box-large-bottom box-large-top dashboard-quick-buttons">
								<div className="box-header">
									{
										this.state.isLoadingKyc ? <LoaderComponent visible={true} text={`Loading KYC status`}/> : (
											<div className="text-h5 u_mb_0">
										{kycProgress !== COMPLETED ? `Complete KYC` : `KYC activation status`}
										<span style={{ fontSize: 14, fontWeight: 400, marginLeft: 20 }}>
											{kycProgress === COMPLETED
												? this.getIconAndStatus(kycStatus)
												: `Please submit KYC details to accept payments`}
										</span>
									</div>
										)
									}
									
								</div>
								{this.quickButtonsContent(`setupKyc`)}
							</div>
						</div> */}
					{/* ) : null} */}

					{/* <div className="col-xs-12"> 
						<div className="widgetContainer box" style={{padding: '10px'}}>
							<p className="text-h5">Latest Updates {kycStatus}</p>
						</div>
					</div> */}

				

					<div className="col-xs-12">
						{/* <StartFeatureCarouselComponent /> */}
					</div>

					<div className="col-xs-12">
						<StartExploreComponent />
					</div>
					
					

					<div className="dashboard-last-used-documents-component-wrapper">
						<div className="col-xs-12">
							<div className="widgetContainer box box-large-bottom" style={{ marginTop: 28 }}>
								<div className="box-header">
									<div className="text-h4 u_mb_20">{resources.str_recentlyUsed}</div>
								</div>
								<LastUsedDocumentsComponent />
							</div>
						</div>
					</div>
					{/* cmt sandy */}
					{/* <div className="row" style={{margin: 0}}>
						<StartTrackArticlesComponent />
						<StartArticlesLowOnStockComponent />
						<StartPromotionalCarouselComponent />
					</div> */}
					
					{/* <div className="col-xs-12">
						<div className="widgetContainer box box-large-bottom box-large-top dashboard-quick-buttons">
							<div className="box-header">
								<div className="text-h5 u_mb_0">{`Inventory management`}</div>
							</div>
							{this.quickButtonsContent(`inventory`)}
						</div>
					</div>
					{planId !== chargebeePlan.FREE_MONTH && canInviteUser ? (
						<div>
							<div className="col-xs-12">
								<div className="widgetContainer box box-large-bottom box-large-top dashboard-quick-buttons">
									<div className="box-header">
										<div className="text-h5 u_mb_0">{resources.str_multiUser}</div>
									</div>
									{this.quickButtonsContent(`multiUser`)}
								</div>
							</div>
							<div className="template-separator"></div>
						</div>
					) : null}
					<h3>{resources.str_gettingStarted}</h3>
					<br />
					<div className="general-template-upper-div">
						<div
							className="general-template-column-width"
							onClick={
								canCreateInvoice
									? () => {
											invoiz.router.navigate("/invoice/new");
									  }
									: null
							}
						>
							<div className="standard-invoice-template large-template-preview">
								<div className="icon icon-rechnung general-template-icon" />
							</div>
							<div className="footer">
								<div className="title">{resources.str_standard_invoices}</div>
								<div className="flex-break"></div>
								<div className="title-description">{resources.str_standard_invoices_des}</div>
							</div>
						</div>
						<div className="general-template-column-width">
							<div className="general-template large-template-preview">
								<div className="icon icon-template general-template-icon" />
								<div className="imprezz-template-button-div">
									<ButtonComponent
										label={resources.str_editTemplate}
										buttonIcon={"icon icon-edit"}
										dataQsId="impressTemplates-btn-createOffer"
										callback={() => {
											if (!generalTemplate.isOwner) {
												renameImpressOffer(
													generalTemplate.title,
													generalTemplate.id,
													(newTemplateId) => {
														invoiz.router.navigate(`/offer/impress/edit/${newTemplateId}`);
													},
													null,
													resources
												);
											} else {
												invoiz.router.navigate(`/offer/impress/edit/${generalTemplate.id}`);
											}
										}}
										disabled={!canCreateImprezzOffer || (invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_OFFER))}
									/>
									<ButtonComponent
										label={resources.str_createOffer}
										buttonIcon={"icon icon-check"}
										dataQsId="impressTemplates-btn-createOffer"
										type="default"
										callback={(evt) => createImpressOffer(generalTemplate.id, evt)}
										disabled={!canCreateImprezzOffer || (invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_OFFER))}
									/>
								</div>
							</div>
							<div className="footer">
								<div className="title">{resources.str_generalImprezzTemplate}</div>
								<div className="icons">
									{canViewImprezzOffer ? (
										<div
											id={`offer-impress-template-icon-view`}
											className="icon icon-view"
											onClick={() => {
												invoiz.router.navigate(`/offer/impress/preview/${generalTemplate.id}`);
											}}
										>
											{this.createTooltip(
												`offer-impress-template-icon-view`,
												resources.str_seeTemplate
											)}
										</div>
									) : null}
									{canCreateImprezzOffer ? (
										<div
											id={`offer-impress-template-icon-copy`}
											className="icon icon-duplicate"
											onClick={() => duplicateImpressOffer(generalTemplate.id, resources)}
										>
											{this.createTooltip(
												`offer-impress-template-icon-copy`,
												resources.str_copyTemplate
											)}
										</div>
									) : null}
								</div>
								<div className="flex-break"></div>
								<div className="title-description">{resources.str_generalImprezzTemplate_des}</div>
							</div>
						</div>
						<div
							className="general-template-column-width"
							onClick={
								(canCreateOffer || !invoiz.user.hasPlanPermission(planPermissions.NO_OFFER))
									? () => {
											invoiz.router.navigate("/offer/new");
									  }
									: null
							}
						>
							<div className="standard-quotation-template large-template-preview">
								<div className="icon icon-quotation general-template-icon" />
							</div>
							<div className="footer">
								<div className="title">{resources.str_standard_a4_quotation}</div>
								<div className="flex-break"></div>
								<div className="title-description">{resources.str_standard_a4_quotation_des}</div>
							</div>
						</div>
					</div>  */}

					{/* <h3>{resources.str_preBuildImpressTemplate}</h3>
					<br /> 
					 <div>
						{allTemplate.map((template, idx) => {
							return (
								<div key={`template-${idx}`} className="templates-column">
									<div
										// onClick={evt => createImpressOffer(template.id, evt)}
										className={`preview-image ${template.thumbnailUrl ? "" : "custom-template"} ${
											invoiz.user.isAdmin ? "admin-template" : ""
										}`}
										style={{
											backgroundImage: template.thumbnailUrl
												? `url(${config.resourceHost}${template.thumbnailUrl})`
												: null,
										}}
									>
										{invoiz.user.isAdmin && template.isOwner ? (
											<div>
												<div className="admin-btn-release">
													<span>{resources.str_approved}</span>
													<OvalToggleComponent
														checked={template.isImpressTemplate}
														onChange={() => this.onTemplateAdminActionRelease(template)}
														newStyle={true}
													/>
												</div>
												<div
													className="admin-btn-upload-thumbnail"
													onClick={() =>
														this.onTemplateAdminActionUploadThumbnail(template, resources)
													}
												>
													<span className="icon icon-upload" />
													<span>{resources.str_uploadThumbnail}</span>
												</div>
											</div>
										) : null}
										{template.thumbnailUrl ? null : (
											<div className="own-template-preview">{resources.str_ownTemplate}</div>
										)}
										<div className="imprezz-template-button-div">
											<ButtonComponent
												label={resources.str_editTemplate}
												buttonIcon={"icon icon-edit"}
												dataQsId={`offer-impress-template-icon-edit-${idx}`}
												callback={() => {
													if (!template.isOwner) {
														renameImpressOffer(
															template.title,
															template.id,
															(newTemplateId) => {
																invoiz.router.navigate(
																	`/offer/impress/edit/${newTemplateId}`
																);
															},
															null,
															resources
														);
													} else {
														invoiz.router.navigate(`/offer/impress/edit/${template.id}`);
													}
												}}
												disabled={!canUpdateImprezzOffer}
											/>
											<ButtonComponent
												customCssClass="create-offer-button"
												label={resources.str_createOffer}
												buttonIcon={"icon icon-check"}
												dataQsId="impressTemplates-btn-createOffer"
												type="default"
												callback={(evt) => createImpressOffer(template.id, evt)}
												disabled={!canCreateImprezzOffer}
											/>
										</div>
									</div>
									<div className="footer">
										<div
											className={`title outlined ${
												currentEditingTemplateId === template.id ? "outlined-focus" : ""
											}`}
										>
											<TextInputExtendedComponent
												ref={`template-title-${template.id}`}
												name="template-input"
												value={template.title}
												onChange={(val) => this.onTemplateTitleChanged(val, template.id)}
												onKeyDown={(evt) => this.onTemplateTitleKeyDown(evt)}
												onFocus={() => this.onTemplateTitleFocus(template.id)}
												onBlur={() => this.onTemplateTitleBlur(template, resources)}
												maxLength={255}
												placeholder={resources.str_title}
											/>
										</div>
										<div className="icons">
											{canViewImprezzOffer ? (
												<div
													id={`offer-impress-template-icon-view-${idx}`}
													className="icon icon-view"
													onClick={() => {
														invoiz.router.navigate(`/offer/impress/preview/${template.id}`);
													}}
												>
													{this.createTooltip(
														`offer-impress-template-icon-view-${idx}`,
														resources.str_seeTemplate
													)}
												</div>
											) : null}

											 <div
												id={`offer-impress-template-icon-edit-${idx}`}
												className="icon icon-edit"
												onClick={() => {
													if (!template.isOwner) {
														renameImpressOffer(template.title, template.id, newTemplateId => {
															invoiz.router.navigate(`/offer/impress/edit/${newTemplateId}`);
														}, null, resources);
													} else {
														invoiz.router.navigate(`/offer/impress/edit/${template.id}`);
													}
												}}
											>
												{this.createTooltip(
													`offer-impress-template-icon-edit-${idx}`,
													resources.str_editTemplate
												)}
											</div> 
											{canCreateImprezzOffer ? (
												<div
													id={`offer-impress-template-icon-copy-${idx}`}
													className="icon icon-duplicate"
													onClick={() => duplicateImpressOffer(template.id, resources)}
												>
													{this.createTooltip(
														`offer-impress-template-icon-copy-${idx}`,
														resources.str_copyTemplate
													)}
												</div>
											) : null}
											{canDeleteImprezzOffer ? (
												<div
													id={`offer-impress-template-icon-delete-${idx}`}
													className="icon icon-trashcan"
													onClick={() => this.onDeleteTemplateClicked(template.id, resources)}
												>
													{this.createTooltip(
														`offer-impress-template-icon-delete-${idx}`,
														resources.str_deleteTemplate
													)}
												</div>
											) : null}
										</div>
									</div>
								</div>
							);
						})}
					</div> */}
				</div>
			</div>
		);
	}

	createTooltip(elementId, text) {
		return (
			<PopoverComponent
				key={elementId}
				html={text}
				showOnHover={true}
				offsetTop={20}
				offsetLeft={13}
				elementId={elementId}
			/>
		);
	}
}

const mapStateToProps = (state) => {
	const { isLoading, errorOccurred, templates } = state.offer.impressTemplates;
	const { resources } = state.language.lang;
	return {
		isLoading,
		errorOccurred,
		templates,
		resources,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		fetchTemplates: () => {
			dispatch(fetchTemplates());
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(StartImpressTemplatesComponent);
