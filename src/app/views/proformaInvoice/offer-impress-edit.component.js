import invoiz from 'services/invoiz.service';
import React from 'react';
import { connect } from 'react-redux';
import config from 'config';
import TopbarComponent from 'shared/topbar/topbar.component';
import ButtonComponent from 'shared/button/button.component';
import LoaderComponent from 'shared/loader/loader.component';
import ImpressNavSectionComponent from 'shared/impress/nav-section.component';
import ImpressContentSectionComponent from 'shared/impress/content-section.component';
import ImpressGlobalSettingsModalComponent from 'shared/modals/impress-global-settings-modal.component';
import ModalService from 'services/modal.service';
import {
	fetchOfferData,
	getCurrentContentBlocks,
	updateOfferData,
	updateOfferCustomerData,
	updateOfferStandardData
} from 'redux/ducks/offer/impressEdit';
import { fetchTemplates } from 'redux/ducks/offer/impressTemplates';
import { prepareCustomerDataForRequest } from 'helpers/prepareCustomerDataForRequest';
import OfferTypes from 'enums/impress/offer-types.enum';
import saveAndUpdateCustomer from 'helpers/transaction/saveAndUpdateCustomer';
import NotificationService from 'services/notification.service';
import ElementTypes from 'enums/impress/element-types.enum';
import { updateArticles } from 'helpers/transaction/updateArticles';
import ImpressFinalizeOfferModal from 'shared/modals/impress-finalize-offer-modal.component';
import OfferState from 'enums/offer/offer-state.enum';
import { isImpressContingentUser } from 'helpers/subscriptionHelpers';
import { updateSubscriptionDetails } from 'helpers/updateSubsciptionDetails';
import { applyTheme } from 'shared/impress/impress-themes';
import UpgradeModalComponent from 'shared/modals/upgrade-modal.component';
import { generateUuid } from 'helpers/generateUuid';
import PopoverComponent from 'shared/popover/popover.component';
import userPermissions from 'enums/user-permissions.enum';
import BuyAddonModalComponent from 'shared/modals/upgrade/buy-addon-modal.component';
import ChargebeeAddon from "enums/chargebee-addon.enum";

const saveImpressGlobalSettings = (offerId, globalSettings, successCallback, errorCallback, resources) => {
	invoiz
		.request(`${config.resourceHost}impress/template/${offerId}`, {
			auth: true,
			method: 'PUT',
			data: globalSettings
		})
		.then(() => {
			successCallback && successCallback();
		})
		.catch(() => {
			invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
			errorCallback && errorCallback();
		});
};

const saveImpressPages = (offerId, pages, successCallback, errorCallback, resources) => {
	invoiz
		.request(`${config.resourceHost}impress/${offerId}/pages`, {
			auth: true,
			method: 'PUT',
			data: {
				pages
			}
		})
		.then(() => {
			successCallback && successCallback();
		})
		.catch(() => {
			invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
			errorCallback && errorCallback();
		});
};

const saveAsOfferdata = (offerData) => {
	const pages = JSON.parse(JSON.stringify(offerData.pages));
	const standardOfferData = JSON.parse(JSON.stringify(offerData.standardOfferData));

	pages.forEach((page, pageIndex) => {
		pages[pageIndex] = {
			id: page.id,
			title: page.title,
			position: page.position,
			blocks: page.blocks
				? page.blocks.map(prevBlock => {
					const block = {
						position: prevBlock.position,
						type: prevBlock.type,
						background: prevBlock.background
					};

					if (prevBlock.type === ElementTypes.TEXT || block.type === ElementTypes.ARTICLES) {
						block.content = prevBlock.content;
						block.layout = prevBlock.layout;
					}

					if (prevBlock.type === ElementTypes.IMAGE) {
						block.imageId = prevBlock.imageId;
						block.imageKey = prevBlock.imageKey;
					}

					if (prevBlock.type === ElementTypes.SEPARATOR) {
						block.separatorLineColor = prevBlock.separatorLineColor;
						block.separatorLineWidth = prevBlock.separatorLineWidth;
						block.separatorLineStyle = prevBlock.separatorLineStyle;
					}

					return block;
				})
				: null
		};

		if (pages[pageIndex].blocks) {
			pages[pageIndex].blocks = pages[pageIndex].blocks.filter(block => {
				return (
					block.type === ElementTypes.TEXT ||
					(block.type === ElementTypes.IMAGE && block.imageId) ||
					block.type === ElementTypes.ARTICLES ||
					block.type === ElementTypes.SEPARATOR
				);
			});

			pages[pageIndex].blocks.forEach((block, blockIndex) => {
				pages[pageIndex].blocks[blockIndex].position = blockIndex + 1;
			});
		}

		if (!pages[pageIndex].blocks) {
			delete pages[pageIndex].blocks;
		}
	});

	standardOfferData.impressPages = pages;
	return {
		impressData: {
			theme: offerData.globalSettings.theme,
			positionsBlockExists: offerData.globalSettings.positionsBlockExists
		},
		pages
	}
}

const saveOfferData = (offerId, offerData, successCallback, errorCallback, resources) => {
	const pages = JSON.parse(JSON.stringify(offerData.pages));
	const standardOfferData = JSON.parse(JSON.stringify(offerData.standardOfferData));

	pages.forEach((page, pageIndex) => {
		pages[pageIndex] = {
			id: page.id,
			title: page.title,
			position: page.position,
			blocks: page.blocks
				? page.blocks.map(prevBlock => {
					const block = {
						position: prevBlock.position,
						type: prevBlock.type,
						background: prevBlock.background
					};

					if (prevBlock.type === ElementTypes.TEXT || block.type === ElementTypes.ARTICLES) {
						block.content = prevBlock.content;
						block.layout = prevBlock.layout;
					}

					if (prevBlock.type === ElementTypes.IMAGE) {
						block.imageId = prevBlock.imageId;
						block.imageKey = prevBlock.imageKey;
					}

					if (prevBlock.type === ElementTypes.SEPARATOR) {
						block.separatorLineColor = prevBlock.separatorLineColor;
						block.separatorLineWidth = prevBlock.separatorLineWidth;
						block.separatorLineStyle = prevBlock.separatorLineStyle;
					}

					return block;
				})
				: null
		};

		if (pages[pageIndex].blocks) {
			pages[pageIndex].blocks = pages[pageIndex].blocks.filter(block => {
				return (
					block.type === ElementTypes.TEXT ||
					(block.type === ElementTypes.IMAGE && block.imageId) ||
					block.type === ElementTypes.ARTICLES ||
					block.type === ElementTypes.SEPARATOR
				);
			});

			pages[pageIndex].blocks.forEach((block, blockIndex) => {
				pages[pageIndex].blocks[blockIndex].position = blockIndex + 1;
			});
		}

		if (!pages[pageIndex].blocks) {
			delete pages[pageIndex].blocks;
		}
	});

	standardOfferData.impressPages = pages;

	if (
		offerData.standardOfferData.type === OfferTypes.IMPRESS &&
		(!standardOfferData.positions || standardOfferData.positions.length === 0)
	) {
		NotificationService.show({
			message: resources.addAtleastOneArticleList,
			type: 'error'
		});

		errorCallback && errorCallback();

		return;
	} else if (
		offerData.standardOfferData.type === OfferTypes.IMPRESS &&
		(standardOfferData.positions && standardOfferData.positions.length > 0)
	) {
		standardOfferData.columns = standardOfferData.columns.map(col => {
			delete col.editable;
			return { ...col };
		});
	}

	if (
		offerData.standardOfferData.type === OfferTypes.IMPRESS &&
		(!standardOfferData.customerData || Object.keys(standardOfferData.customerData).length === 0)
	) {
		NotificationService.show({
			message: resources.customerValidationError,
			type: 'error'
		});

		errorCallback && errorCallback();
	} else if (
		offerData.standardOfferData.type === OfferTypes.IMPRESS &&
		Object.keys(standardOfferData.customerData).length > 0 &&
		!standardOfferData.customerDataChanged
	) {
		standardOfferData.customerData = prepareCustomerDataForRequest(standardOfferData.customerData);
		delete standardOfferData.customerData.email;

		updateArticles(standardOfferData.positions, standardOfferData.customerData)
			.then(() => {
				invoiz
					.request(`${config.resourceHost}offer/${offerId}`, {
						auth: true,
						method: 'PUT',
						data: standardOfferData
					})
					.then(({ body: { data } }) => {
						if (data.positions) {
							data.positions.forEach(pos => {
								pos.tempId = generateUuid();
							});
						}

						saveImpressPages(
							offerId,
							pages,
							() => {
								successCallback(data);
							},
							errorCallback,
							resources
						);
					})
					.catch(() => {
						invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
						errorCallback && errorCallback();
					});
			})
			.catch(() => {
				errorCallback && errorCallback();
			});
	} else if (offerData.standardOfferData.type === OfferTypes.IMPRESS) {
		saveAndUpdateCustomer({
			transaction: standardOfferData
		}).then(({ customerId, customerData }) => {
			updateArticles(standardOfferData.positions, standardOfferData.customerData)
				.then(() => {
					if (customerId && customerData) {
						standardOfferData.customerId = customerId;
						standardOfferData.customerData = prepareCustomerDataForRequest(standardOfferData.customerData);
						delete standardOfferData.customerData.email;

						if (standardOfferData.customerData.companyName && !standardOfferData.customerData.name) {
							standardOfferData.customerData.name = standardOfferData.customerData.companyName;
						} else if (standardOfferData.customerData.firstName && !standardOfferData.customerData.name) {
							standardOfferData.customerData.name = `${standardOfferData.customerData.firstName} ${standardOfferData.customerData.lastName
							}`;
						}
					}

					invoiz
						.request(`${config.resourceHost}offer/${offerId}`, {
							auth: true,
							method: 'PUT',
							data: standardOfferData
						})
						.then(({ body: { data } }) => {
							if (data.positions) {
								data.positions.forEach(pos => {
									pos.tempId = generateUuid();
								});
							}

							saveImpressPages(
								offerId,
								pages,
								() => {
									successCallback(data);
								},
								errorCallback,
								resources
							);
						})
						.catch(() => {
							invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
							errorCallback && errorCallback();
						});
				})
				.catch(() => {
					errorCallback && errorCallback();
				});
		});
	} else {
		saveImpressGlobalSettings(
			offerId,
			{
				impressData: {
					theme: offerData.globalSettings.theme,
					positionsBlockExists: offerData.globalSettings.positionsBlockExists
				}
			},
			() => {
				saveImpressPages(
					offerId,
					pages,
					() => {
						successCallback();
					},
					errorCallback,
					resources
				);
			},
			errorCallback,
			resources
		);
	}
};

const adjustTitle = (templates, title) => {
	let count = templates.filter(t => t.title == title)
	let counter = 0;
	while (count.length > 0) {
		counter++;
		const tempTitle = `${title} ${counter}`;
		count = templates.filter(t => t.title === tempTitle);
	}
	return counter > 0 ? `${title} ${counter}` : title;
}

class OfferImpressEditComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			saveAsTemplateName: '',
			additionalCustomTheme: null,
			isAcceptingOffer: false,
			isSaveDisabled: false,
			isSaveAndClose: false,
			isSaveAndClosePreview: false,
			isActiveComponentHasError: false,
			activeComponent: 'none',
			isSaved: false,
			canCreateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_IMPREZZ_OFFER),
		};

		this.saveImpressOffer = this.saveImpressOffer.bind(this);
		this.activeComponentHandler = this.activeComponentHandler.bind(this);
	}

	componentDidMount() {
		// if (!invoiz.user.hasPermission(userPermissions.CREATE_IMPREZZ_OFFER)) {
		// 	invoiz.user.logout(true);
		// }
		this.refresh();
	}

	componentWillUnmount() {
		invoiz.off('updateRecipientCustomerNumberFinished', this.saveImpressOffer);
	}

	finalizeImpressOffer(closeModal, resources) {
		this.setState({ isAcceptingOffer: true });

		invoiz
			.request(`${config.offer.resourceUrl}/${this.props.offerId}/state`, {
				method: 'PUT',
				auth: true,
				data: { state: 'open' }
			})
			.then(() => {
				updateSubscriptionDetails(() => {
					if (closeModal) {
						ModalService.close();
					}

					this.setState({ isAcceptingOffer: false });
					invoiz.router.navigate(`/offer/impress/${this.props.offerId}`);
				});
			})
			.catch(() => {
				if (closeModal) {
					ModalService.close();
				}

				this.setState({ isAcceptingOffer: false });
				invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
			});
	}

	onBlocksChange(blocks) {
		this.props.updateOfferData(null, blocks);
	}

	onCustomerChange(customer, setCustomerChanged) {
		this.props.updateOfferCustomerData(customer, setCustomerChanged);
	}

	onGlobalSettingsChange(globalSettings) {
		this.props.updateOfferData(null, null, globalSettings);
	}

	onLogoChange(logoPath) {
		this.props.updateOfferData(null, null, { logo: logoPath });
	}

	onNavChange(pages) {
		this.props.updateOfferData(pages);
	}

	onNavSelect(selectedPage) {
		this.refs && this.refs.contentSection && this.refs.contentSection.destroyDragula();

		setTimeout(() => {
			this.props.getCurrentContentBlocks(this.props.offerId, selectedPage);
		}, 100);
	}

	onStandardOfferDataChange(standardOfferData) {
		this.props.updateOfferStandardData(standardOfferData);
	}

	onTopbarButtonClick(button) {
		const { resources } = this.props;
		switch (button.action) {
			case 'globalSettings':
				this.openGlobalSettingsModal();
				break;

			case 'save':
				this.setState({ isSaveDisabled: true }, () => {
					this.triggerSaveImpressOffer();
				});
				break;
			case 'showCopyPopup':
				$('#detail-head-copy-template-popover-anchor').click();
				break;

			case 'saveAndClose':
			case 'saveAndClosePreview':
				this.setState(
					{
						isSaveDisabled: true,
						isSaveAndClose: true,
						isSaveAndClosePreview: button.action === 'saveAndClosePreview'
					},
					() => {
						this.triggerSaveImpressOffer();
					}
				);
				break;

			case 'finalize':
				this.setState({ isSaveDisabled: true }, () => {
					this.triggerSaveImpressOffer(() => {
						if (isImpressContingentUser()) {
							this.openImpressFinalizeOfferModal();
						} else {
							this.finalizeImpressOffer(null, resources);
						}
					}, true);
				});
				break;
		}
	}

	openImpressFinalizeOfferModal() {
		const { resources } = this.props;

		const isContingentDepleted =
			invoiz.user &&
			invoiz.user.subscriptionData &&
			(invoiz.user.subscriptionData.contingentLimitImpressOffers - invoiz.user.subscriptionData.usedContingentImpressOffers) === 0;
		ModalService.open(
			<ImpressFinalizeOfferModal
				onContingentUpgraded={() => {
					setTimeout(() => {
						this.openImpressFinalizeOfferModal();
					}, 500);
				}}
				resources={resources}
			/>,
			{
				headline: resources.offerImpressModalFinalizeText,
				confirmLabel: isContingentDepleted
					? resources.str_selectPlanNow
					: resources.str_finalizeNow,
				confirmIcon: 'icon-check',
				confirmDisabled: isContingentDepleted,
				cancelLabel: resources.str_abortStop,
				isCloseable: false,
				onConfirm: () => {
					if (isContingentDepleted) {
						ModalService.close();

						setTimeout(() => {
							// ModalService.open(<UpgradeModalComponent title={resources.str_timeToStart} resources={resources} />, {
							// 	width: 1196,
							// 	padding: 0,
							// 	isCloseable: true
							// });
						}, 500);
					} else {
						this.finalizeImpressOffer(true, resources);
					}
				}
			}
		);
	}

	openGlobalSettingsModal() {
		const { additionalCustomTheme } = this.state;
		const { offerData, resources } = this.props;
		const theme = offerData && offerData.globalSettings && offerData.globalSettings.theme;

		ModalService.open(
			<ImpressGlobalSettingsModalComponent
				activeTheme={theme}
				additionalCustomTheme={additionalCustomTheme}
				onConfirm={(theme, customTheme) => {
					applyTheme(theme);

					if (customTheme) {
						this.setState({ additionalCustomTheme: customTheme }, () => {
							this.props.updateOfferData(null, null, {
								theme
							});
						});
					} else {
						this.props.updateOfferData(null, null, {
							theme
						});
					}
				}}
				resources={resources}
			/>,
			{
				headline: resources.str_chooseColorScheme,
				width: 600,
				isCloseable: false
			}
		);
	}

	refresh() {
		this.props.fetchOfferData(this.props.offerId);
		if (this.props.templates && this.props.templates.length === 0) {
			this.props.fetchTemplates();
		}
	}

	saveImpressOffer(onSaveCallback, hideSuccessNotification) {
		const { isSaveAndClose, isSaveAndClosePreview } = this.state;
		const { resources } = this.props;
		setTimeout(() => {
			saveOfferData(
				this.props.offerId,
				this.props.offerData,
				offerDataResponse => {
					let newOfferData = null;

					if (offerDataResponse) {
						newOfferData = JSON.parse(JSON.stringify(offerDataResponse));
						this.props.updateOfferStandardData(newOfferData);
					}

					if (!hideSuccessNotification) {
						NotificationService.show({
							message:
								this.props.offerData.standardOfferData.type === OfferTypes.IMPRESS_TEMPLATE
									? resources.templateSaveSuccessMessage
									: resources.offerSaveSuccessMessage,
							type: 'success'
						});
					}

					if (isSaveAndClose) {
						if (this.props.offerData.standardOfferData.type === OfferTypes.IMPRESS_TEMPLATE) {
							invoiz.router.navigate(
								isSaveAndClosePreview
									? `/offer/impress/preview/${this.props.offerId}`
									: `/`
							);
						} else {
							invoiz.router.navigate(`/offer/impress/preview/${this.props.offerId}`);
						}
					} else {
						this.setState({ isSaveDisabled: false }, () => {
							onSaveCallback && onSaveCallback();
						});
						this.setState({ isSaved: true })
					}
				},
				() => {
					this.setState({ isSaveDisabled: false, isSaveAndClose: false, isSaveAndClosePreview: false });
				},
				resources
			);
		}, 0);
	}

	onSaveAsClick() {
		const { saveAsTemplateName } = this.state;
		const { offerId, templates, resources } = this.props;
		if (saveAsTemplateName.trim() === '') {
			NotificationService.show({
				message: 'Please enter a title',
				type: 'error'
			});
		} else if (templates.find(template => template.title === saveAsTemplateName.trim())) {
			NotificationService.show({
				message: 'Name already exists',
				type: 'error'
			});
		} else {
			this.setState({ isSaveDisabled: true }, () => {
				const modifiedData = saveAsOfferdata(this.props.offerData)
				const data = {
					title: saveAsTemplateName.trim(),
					...modifiedData
				};
				invoiz
					.request(`${config.resourceHost}impress/template/${offerId}/saveAs`, {
						auth: true,
						method: 'POST',
						data
					})
					.then(({ body: { data: { id } } }) => {
						invoiz.router.navigate(`/offer/impress/edit/${id}`);
						invoiz.router.reload();
						NotificationService.show({
							message: resources.templateDuplicateSuccessMessage,
							type: 'success'
						});
					})
					.catch(({ body }) => {
						if (body.meta && body.meta.title && body.meta.title[0] && body.meta.title[0].code === 'NO_STRING') {
							NotificationService.show({
								message: 'Please enter a title',
								type: 'error'
							});
						}
					});
				$('#detail-head-copy-template-popover-anchor').click();
			});
		}
	}

	triggerSaveImpressOffer(onSaveCallback, hideSuccessNotification) {

		const {canCreateOffer } = this.state;

		if(!canCreateOffer) {
			ModalService.open(
				<BuyAddonModalComponent
					price={1499}
					addon={ChargebeeAddon.CHARGEBEE_ADDON_IMPREZZ_QUOTATION}
					heading="Buy Imprezz Quotation Add-on"
					subheading="Create quotations in minutes with ready to roll-on quotation templates"
					features={[
						"Get professional looking templates",
						"Create and save your own templates",
						"Convert them into invoice in single click",
						"Get quotations overview in dashboard"
					]}
				/>,
				{
					width: 800,
					padding: 0,
					noTransform: true,
					isCloseable: true,
				}
			)
			return;
		}
		

		if (this.refs.navSection && this.refs.navSection.isRecipientFormStateOpen()) {
			invoiz.on('updateRecipientCustomerNumberFinished', this.saveImpressOffer);
		} else {
			this.saveImpressOffer(onSaveCallback, hideSuccessNotification);
		}
	}

	activeComponentHandler(activeComponent, error) {
		this.setState({
			activeComponent
		});
		if (typeof (error) !== 'undefined') {
			this.setState({
				isActiveComponentHasError: error
			});
		}
	}

	render() {
		const {
			isLoading,
			isLoadingBlocks,
			errorOccurred,
			blocksErrorOccurred,
			offerData,
			currentContentBlocks,
			miscellaneousData,
			resources,
			templates
		} = this.props;

		if (isLoading) {
			return <LoaderComponent visible={true} />;
		}
		const topbarButtons = [
			{
				label: resources.str_adjustColorScheme,
				buttonIcon: 'icon-farbschema',
				type: 'inverted',
				action: 'globalSettings',
				customCssClass: 'btn-global-settings'
			}
			// ,
			// {
			// 	label: resources.str_preview,
			// 	buttonIcon: 'icon-view',
			// 	disabled: this.state.isSaveDisabled || this.state.isAcceptingOffer,
			// 	type: 'text',
			// 	action: 'saveAndClosePreview'
			// }
			// ,
			// {
			// 	label: resources.str_toSave,
			// 	buttonIcon: 'icon-disk',
			// 	loading: this.state.isSaveDisabled,
			// 	disabled: this.state.isAcceptingOffer,
			// 	type: 'primary',
			// 	action: 'save'
			// }
		];

		if (
			offerData &&
			offerData.standardOfferData &&
			offerData.standardOfferData.type === OfferTypes.IMPRESS &&
			(offerData.standardOfferData.state === OfferState.DRAFT ||
				offerData.standardOfferData.state === OfferState.TEMP)
		) {
			topbarButtons.push({
				label: resources.str_preview,
				buttonIcon: 'icon-view',
				disabled: this.state.isSaveDisabled || this.state.isAcceptingOffer,
				type: 'text',
				action: 'saveAndClosePreview'
			});
			topbarButtons.push({
				label: resources.str_toSave,
				buttonIcon: 'icon-disk',
				loading: this.state.isSaveDisabled,
				disabled: this.state.isAcceptingOffer,
				type: 'default',
				action: 'save'
			});
			topbarButtons.push({
				label: resources.str_finalizeOffer,
				buttonIcon: 'icon-check',
				type: 'primary',
				action: 'finalize',
				loading: this.state.isAcceptingOffer,
				disabled: this.state.isSaveDisabled
			});
		} else if (
			offerData &&
			offerData.standardOfferData &&
			(offerData.standardOfferData.type === OfferTypes.IMPRESS_TEMPLATE ||
				offerData.standardOfferData.state === OfferState.ACCEPTED)
		) {
			topbarButtons.push({
				label: resources.str_preview,
				buttonIcon: 'icon-view',
				disabled: this.state.isSaveDisabled || this.state.isAcceptingOffer,
				type: 'text',
				action: 'saveAndClosePreview'
			});
			// topbarButtons.push({
			// 	label: resources.str_toSave,
			// 	buttonIcon: 'icon-disk',
			// 	loading: this.state.isSaveDisabled,
			// 	disabled: this.state.isAcceptingOffer,
			// 	type: 'default',
			// 	action: 'save'
			// });
			// topbarButtons.push({
			// 	label: resources.str_saveClose,
			// 	buttonIcon: 'icon-check',
			// 	type: 'primary',
			// 	action: 'saveAndClose',
			// 	disabled: this.state.isSaveDisabled
			// });
			topbarButtons.push({
				id: 'detail-head-copy-template-popover-anchor',
				label: 'Save as',
				buttonIcon: 'icon-disk',
				loading: this.state.isSaveDisabled,
				disabled: this.state.isAcceptingOffer,
				type: 'default',
				action: 'showCopyPopup'
			});
			topbarButtons.push({
				label: resources.str_toSave,
				buttonIcon: 'icon-check',
				loading: this.state.isSaveDisabled,
				disabled: this.state.isAcceptingOffer,
				type: 'primary',
				action: 'save'
			});
		} else if (
			offerData &&
			offerData.standardOfferData &&
			(offerData.standardOfferData.type === OfferTypes.IMPRESS_TEMPLATE ||
				offerData.standardOfferData.state === OfferState.ACCEPTED)
		) {
			topbarButtons.push({
				label: resources.str_preview,
				buttonIcon: 'icon-view',
				disabled: this.state.isSaveDisabled || this.state.isAcceptingOffer,
				type: 'default',
				action: 'saveAndClosePreview'
			});
			topbarButtons.push({
				label: resources.str_saveClose,
				buttonIcon: 'icon-check',
				type: 'primary',
				action: 'saveAndClose',
				disabled: this.state.isSaveDisabled
			});
		} else {
			topbarButtons.push({
				label: resources.str_preview,
				buttonIcon: 'icon-view',
				disabled: this.state.isSaveDisabled || this.state.isAcceptingOffer,
				type: 'default',
				action: 'saveAndClosePreview'
			});
			topbarButtons.push({
				label: resources.str_toSave,
				buttonIcon: 'icon-disk',
				loading: this.state.isSaveDisabled,
				disabled: this.state.isAcceptingOffer,
				type: 'primary',
				action: 'save'
			});
		}

		const content = errorOccurred ? (
			<div className="offer-impress-error">
				<div className="error-headline">
					<h1>{resources.errorOccuredMessage}</h1>
				</div>
				<div>
					<ButtonComponent callback={() => this.refresh()} label={resources.str_reload} />
				</div>
			</div>
		) : (
			<div className="offer-impress-edit-component-wrapper">
				<TopbarComponent
					title={
						offerData.standardOfferData.type === OfferTypes.IMPRESS_TEMPLATE
							? `${offerData.standardOfferData.title}`
							: offerData.standardOfferData.state === OfferState.OPEN
								? resources.str_impressOffer
								: offerData.standardOfferData.state === OfferState.ACCEPTED
									? resources.str_impressOffer
									: resources.str_impressOffer
					}
					subtitle={
						offerData.standardOfferData.type === OfferTypes.IMPRESS_TEMPLATE
							? ``
							: offerData.standardOfferData.state === OfferState.OPEN
								? `(${resources.str_open})`
								: offerData.standardOfferData.state === OfferState.ACCEPTED
									? `${offerData.standardOfferData.number}`
									: `(${resources.str_draft})`
					}
					hasCancelButton={true}
					cancelButtonCallback={() => {
						if (offerData.standardOfferData.state === OfferState.TEMP) {
							invoiz
								.request(`${config.resourceHost}impress/temp/${this.props.offerId}`, {
									auth: true,
									method: 'DELETE'
								})
								.then(() => {
									invoiz.router.navigate(`/`);
								})
								.catch(() => {
									invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
									invoiz.router.navigate(`/`);
								});
						} else if (offerData.standardOfferData.type === OfferTypes.IMPRESS_TEMPLATE) {
							invoiz.router.navigate(`/`);
						} else {
							invoiz.router.navigate(`/offer/impress/${this.props.offerId}`);
						}
					}}
					buttons={topbarButtons}
					buttonCallback={(event, button) => this.onTopbarButtonClick(button)}
				/>
				<div className={`impress-template impress-edit-mode`}>
					<ImpressNavSectionComponent
						ref={'navSection'}
						pages={offerData.pages}
						standardOfferData={offerData.standardOfferData}
						customerData={offerData.standardOfferData.customerData}
						globalSettings={offerData.globalSettings}
						onNavChange={pages => this.onNavChange(pages)}
						onNavSelect={selectedPage => this.onNavSelect(selectedPage)}
						onCustomerChange={(customer, setCustomerChanged) =>
							this.onCustomerChange(customer, setCustomerChanged)
						}
						onLogoChange={logoPath => this.onLogoChange(logoPath)}
						onStandardOfferDataChange={offerData => this.onStandardOfferDataChange(offerData)}
						onGlobalSettingsChange={globalSettings => this.onGlobalSettingsChange(globalSettings)}
						resources={resources}
						activeComponentAction={this.activeComponentHandler}
						isActiveComponentHasError={this.state.isActiveComponentHasError}
						activeComponent={this.state.activeComponent}
						isSaved={this.state.isSaved}
					/>
					<ImpressContentSectionComponent
						offerId={this.props.offerId}
						standardOfferData={offerData.standardOfferData}
						globalSettings={offerData.globalSettings}
						miscellaneousData={miscellaneousData}
						pages={offerData.pages}
						blocks={currentContentBlocks}
						isLoadingBlocks={isLoadingBlocks}
						blocksErrorOccurred={blocksErrorOccurred}
						onBlocksChange={blocks => this.onBlocksChange(blocks)}
						onStandardOfferDataChange={offerData => this.onStandardOfferDataChange(offerData)}
						onGlobalSettingsChange={globalSettings => this.onGlobalSettingsChange(globalSettings)}
						ref={'contentSection'}
						resources={resources}
						customerData={offerData.standardOfferData.customerData}
						activeComponentAction={this.activeComponentHandler}
						isActiveComponentHasError={this.state.isActiveComponentHasError}
						activeComponent={this.state.activeComponent}
					/>
				</div>
				<PopoverComponent
					elementId={'detail-head-copy-template-popover-anchor'}
					arrowOffset={160}
					width={300}
					offsetTop={20}
					offsetLeft={95}
					showOnClick={true}
					onElementClicked={() => {
						if (!this.state.saveAsTemplateName) {
							const templateName = `${offerData.standardOfferData.title} - Copy`;
							this.setState({ saveAsTemplateName: adjustTitle(templates, templateName) }, () => {
								this.refs['detail-head-copy-template-input'].focus();
							});
						} else {
							setTimeout(() => {
								this.refs['detail-head-copy-template-input'].focus();
							});
						}
					}}
					html={
						<div className="detail-head-copy-template-popover">
							<input
								type="text"
								className="detail-head-copy-template-content"
								value={this.state.saveAsTemplateName}
								placeholder="Enter template name here"
								onFocus={event => event.target.select()}
								onChange={event => this.setState({ saveAsTemplateName: event.target.value })}
								// readOnly
								ref={`detail-head-copy-template-input`}
							/>
							<div
								className="icon icon-rounded icon-close"
								onClick={() => {
									$('#detail-head-copy-template-popover-anchor').click();
								}}
							/>
							<div
								className="icon icon-rounded icon-check"
								onClick={() => this.onSaveAsClick()}
							/>
						</div>
					}
					ref={'detail-head-copy-template-popover'}
				/>
			</div>
		);

		return content;
	}
}

const mapStateToProps = state => {
	console.log(state)
	const {
		isLoading,
		isLoadingBlocks,
		errorOccurred,
		blocksErrorOccurred,
		offerData,
		currentContentBlocks,
		miscellaneousData
	} = state.offer.impressEdit;
	const { templates } = state.offer.impressTemplates;
	const { resources } = state.language.lang;
	return {
		isLoading,
		isLoadingBlocks,
		errorOccurred,
		blocksErrorOccurred,
		offerData,
		currentContentBlocks,
		miscellaneousData,
		resources,
		templates
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchOfferData: offerId => {
			dispatch(fetchOfferData(offerId));
		},
		getCurrentContentBlocks: (offerId, selectedPage) => {
			dispatch(getCurrentContentBlocks(offerId, selectedPage));
		},
		updateOfferData: (pages, blocks, globalSettings) => {
			dispatch(updateOfferData(pages, blocks, globalSettings));
		},
		updateOfferCustomerData: (customerData, setCustomerChanged) => {
			dispatch(updateOfferCustomerData(customerData, setCustomerChanged));
		},
		updateOfferStandardData: standardOfferData => {
			dispatch(updateOfferStandardData(standardOfferData));
		},
		fetchTemplates: () => {
			dispatch(fetchTemplates());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(OfferImpressEditComponent);
