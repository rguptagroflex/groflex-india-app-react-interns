import invoiz from 'services/invoiz.service';
import React from 'react';
import TopbarComponent from 'shared/topbar/topbar.component';
import LoaderComponent from 'shared/loader/loader.component';
import config from 'config';
import { connect } from 'react-redux';
import { fetchTemplates } from 'redux/ducks/offer/impressTemplates';
import ButtonComponent from 'shared/button/button.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import ModalService from 'services/modal.service';
import NotificationService from 'services/notification.service';
import PopoverComponent from 'shared/popover/popover.component';
import SharedDataService from 'services/shared-data.service';
import OvalToggleComponent from 'shared/oval-toggle/oval-toggle.component';
import ImageCropModalComponent from 'shared/modals/image-crop-modal.component';
import userPermissions from 'enums/user-permissions.enum';

const KEY_CODE_ENTER = 13;
const KEY_CODE_ESCAPE = 27;

const createImpressOffer = (templateId, evt) => {
	const isAdminButton =
		$(evt.target).closest('.admin-btn-release').length > 0 ||
		$(evt.target).closest('.admin-btn-upload-thumbnail').length > 0;

	if (!isAdminButton) {
		invoiz
			.request(`${config.resourceHost}impress?templateId=${templateId}`, {
				auth: true,
				method: 'POST'
			})
			.then(({ body: { data } }) => {
				invoiz.router.navigate(`/offer/impress/edit/${data.id}`);
			});
	}
};

const createImpressTemplate = (resources) => {
	invoiz
		.request(`${config.resourceHost}impress/template`, {
			auth: true,
			method: 'POST',
			data: {
				title: resources.str_newTemplate
			}
		})
		.then(({ body: { data } }) => {
			invoiz.router.navigate(`/offer/impress/edit/${data.id}`);
		});
};

const deleteImpressTemplate = (templateId, resources) => {
	invoiz
		.request(`${config.resourceHost}impress/template/${templateId}`, {
			auth: true,
			method: 'DELETE'
		})
		.then(() => {
			invoiz.router.reload();

			NotificationService.show({
				message: resources.templateDeleteSuccessMessage,
				type: 'success'
			});
		});
};

const duplicateImpressOffer = (templateId, resources) => {
	invoiz
		.request(`${config.resourceHost}impress/template/${templateId}/copy`, {
			auth: true,
			method: 'POST'
		})
		.then(() => {
			invoiz.router.reload();

			NotificationService.show({
				message: resources.templateDuplicateSuccessMessage,
				type: 'success'
			});
		});
};

const renameImpressOffer = (templateTitle, templateId, successCallback, errorCallback, resources) => {
	invoiz
		.request(`${config.resourceHost}impress/template/${templateId}`, {
			auth: true,
			method: 'PUT',
			data: {
				title: templateTitle && templateTitle.trim()
			}
		})
		.then(({ body: { data: { id } } }) => {
			successCallback && successCallback(id);

			NotificationService.show({
				message: resources.templateRenameSuccessMessage,
				type: 'success'
			});
		})
		.catch(({ body }) => {
			if (body.meta && body.meta.title && body.meta.title[0] && body.meta.title[0].code === 'EXISTS') {
				NotificationService.show({
					message: resources.nameAlreadyExist,
					type: 'error'
				});
			}

			errorCallback && errorCallback();
		});
};

class OfferImpressTemplatesComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			currentEditingTemplateId: null,
			ignoreTemplateTitleBlur: false,
			templates: props.templates || null,
			templatesOriginal: props.templates || null,
			canCreateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_IMPREZZ_OFFER),
			canViewImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_IMPREZZ_OFFER),
			canUpdateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_IMPREZZ_OFFER),
			canDeleteImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_IMPREZZ_OFFER),
		};
	}

	componentWillReceiveProps(props) {
		this.setState({
			templates: props.templates || null,
			templatesOriginal: props.templates || null
		});
	}

	componentDidMount() {
		this.props.fetchTemplates();
	}

	onDeleteTemplateClicked(templateId, resources) {
		ModalService.open(
			<div>{resources.impressTemplateDeleteConfirmText}</div>,
			{
				width: 500,
				headline: resources.impressTemplateModalHeadline,
				cancelLabel: resources.str_abortStop,
				confirmIcon: 'icon-trashcan',
				confirmLabel: resources.str_clear,
				confirmButtonType: 'secondary',
				onConfirm: () => {
					ModalService.close();
					deleteImpressTemplate(templateId, resources);
				}
			}
		);
	}

	onTemplateAdminActionRelease(template) {
		invoiz
			.request(`${config.resourceHost}admin/impress/${template.id}`, {
				auth: true,
				method: 'PUT',
				data: {
					isImpressTemplate: !template.isImpressTemplate
				}
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
				modalClass: 'image-crop-modal'
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

		templates.forEach(existingTemplate => {
			if (existingTemplate.id === template.id) {
				templateTitle = existingTemplate.title;
			}
		});

		if (templateTitle !== null && templateTitle.trim().length === 0) {
			NotificationService.show({
				message: resources.titleError,
				type: 'error'
			});

			this.setState({ currentEditingTemplateId: null, templates: templatesOriginal });

			return;
		}

		if (templateTitle) {
			templatesOriginal.forEach(existingTemplate => {
				if (existingTemplate.id === template.id && existingTemplate.title.trim() === templateTitle.trim()) {
					isTemplateTitleChanged = false;
				}
			});
		}

		if (isTemplateTitleChanged) {
			renameImpressOffer(
				templateTitle,
				template.id,
				newTemplateId => {
					if (!template.isOwner) {
						templates.forEach(existingTemplate => {
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

		templates.forEach(template => {
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

			templatesOriginal.forEach(template => {
				if (template.id === currentEditingTemplateId) {
					templateOriginalTitle = template.title;
					templateInput = this.refs && this.refs[`template-title-${template.id}`];
				}
			});

			if (templateOriginalTitle) {
				templates.forEach(template => {
					if (template.id === currentEditingTemplateId) {
						template.title = templateOriginalTitle;
					}
				});

				this.setState({ currentEditingTemplateId: null, templates, ignoreTemplateTitleBlur: true }, () => {
					templateInput && templateInput.refs['template-input'].blur();
				});
			}
		} else if (evt.keyCode === KEY_CODE_ENTER) {
			evt.preventDefault();

			templates.forEach(template => {
				if (template.id === currentEditingTemplateId) {
					templateInput = this.refs && this.refs[`template-title-${template.id}`];
				}
			});

			templateInput && templateInput.refs['template-input'].blur();
		}
	}

	render() {
		const { isLoading, errorOccurred, resources } = this.props;
		const { currentEditingTemplateId, templates, canCreateImprezzOffer,
			canViewImprezzOffer,
			canUpdateImprezzOffer,
			canDeleteImprezzOffer } = this.state;

		const returnToImpressOfferList = SharedDataService.get('offer-impress-templates-returnToImpressOfferList');

		if (isLoading || errorOccurred) {
			if (isLoading) {
				return (
					<div className="offer-impress-templates-loading">
						<LoaderComponent text={resources.str_loadingTemplates} visible={true} />
					</div>
				);
			}

			return null;
		}

		return (
			<div className="offer-impress-templates-component-wrapper">
				<TopbarComponent
					title={resources.str_impressOffer}
					// titleSup={resources.str_beta}
					backButtonRoute={returnToImpressOfferList ? '/offers/impress' : '/offers'}
				/>

				<div className="impress-templates-head">
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
				</div>

				<div className="impress-templates-wrapper">
					<div className="templates-column create-own-template" onClick={() => createImpressTemplate(resources)}>
						<div className="icon icon-close2" />
						<div className="title">{resources.offerCreateOwnText}</div>
					</div>

					{templates.map((template, idx) => {
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
												disabled={false}
											/>
											<ButtonComponent
												customCssClass="create-offer-button"
												label={resources.str_createOffer}
												buttonIcon={"icon icon-check"}
												dataQsId="impressTemplates-btn-createOffer"
												type="default"
												callback={(evt) => createImpressOffer(template.id, evt)}
												disabled={false}
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
					{/* {templates.map((template, idx) => {
						console.log('id', idx)
						return (
							<div key={`template-${idx}`} className="templates-column">
								<div
									// onClick={evt => createImpressOffer(template.id, evt)}
									className={`preview-image ${template.thumbnailUrl ? '' : 'custom-template'} ${
										invoiz.user.isAdmin ? 'admin-template' : ''
									}`}
									style={{
										backgroundImage: template.thumbnailUrl
											? `url(${config.resourceHost}${template.thumbnailUrl})`
											: null
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
												onClick={() => this.onTemplateAdminActionUploadThumbnail(template, resources)}
											>
												<span className="icon icon-upload" />
												<span>{resources.str_uploadThumbnail}</span>
											</div>
										</div>
									) : null}
									{template.thumbnailUrl ? null : <div>{resources.str_ownTemplate}</div>}
									<ButtonComponent
										label={resources.str_createOffer}
										buttonIcon={'icon icon-check'}
										dataQsId="impressTemplates-btn-createOffer"
									/>
								</div>
								<div className="footer">
									<div
										className={`title outlined ${
											currentEditingTemplateId === template.id ? 'outlined-focus' : ''
										}`}
									>
										<TextInputExtendedComponent
											ref={`template-title-${template.id}`}
											name="template-input"
											value={template.title}
											onChange={val => this.onTemplateTitleChanged(val, template.id)}
											onKeyDown={evt => this.onTemplateTitleKeyDown(evt)}
											onFocus={() => this.onTemplateTitleFocus(template.id)}
											onBlur={() => this.onTemplateTitleBlur(template, resources)}
											maxLength={255}
											placeholder={resources.str_title}
										/>
									</div>
									<div className="icons">
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
									</div>
								</div>
							</div>
						);
					})} */}
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

const mapStateToProps = state => {
	const { isLoading, errorOccurred, templates } = state.offer.impressTemplates;
	const { resources } = state.language.lang;
	return {
		isLoading,
		errorOccurred,
		templates,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchTemplates: () => {
			dispatch(fetchTemplates());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(OfferImpressTemplatesComponent);
