import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
// import ImpressFrontendViewComponent from 'shared/impress/impress-frontend-view.component';
import TopbarComponent from 'shared/topbar/topbar.component';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatDate, formatClientDate } from 'helpers/formatDate';
import OfferState from 'enums/offer/offer-state.enum';
import OfferAction from 'enums/offer/offer-action.enum';
import ModalService from 'services/modal.service';
import { copyAndEditTransaction } from 'helpers/transaction/copyAndEditTransaction';
import OfferTypes from 'enums/impress/offer-types.enum';
import LoadingService from 'services/loading.service';
import PopoverComponent from 'shared/popover/popover.component';
import { DetailViewConstants } from 'helpers/constants';
import TransactionPrintSetting from 'enums/transaction-print-setting.enum';
import TimelineComponent from 'shared/timeline/timeline.component';
import DetailViewHeadPrintPopoverComponent from 'shared/detail-view/detail-view-head-print-popover.component';
import DetailViewHeadPrintTooltipComponent from 'shared/detail-view/detail-view-head-print-tooltip.component';
import DetailViewHeadComponent from 'shared/detail-view/detail-view-head.component';
import NotesComponent from 'shared/notes/notes.component';
import InvoiceState from 'enums/invoice/invoice-state.enum';
import { Link } from 'react-router-dom';
import { isImpressContingentUser } from 'helpers/subscriptionHelpers';
import ChargebeePlan from 'enums/chargebee-plan.enum';
import UpgradeModalComponent from 'shared/modals/upgrade-modal.component';
import ImpressFinalizeOfferModal from 'shared/modals/impress-finalize-offer-modal.component';
import { updateSubscriptionDetails } from 'helpers/updateSubsciptionDetails';
import { format } from 'util';
import userPermissions from 'enums/user-permissions.enum';

const createTimelineObjects = (offer, resources) => {
	const entries = [
		{
			label: resources.str_started
		},
		{
			label: resources.str_accepted
		},
		{
			label: resources.str_createAccount
		}
	];

	offer.history.forEach(entry => {
		// const date = formatDate(entry.date, 'YYYY-MM-DD', 'DD.MM.YYYY');
		const date = formatClientDate(entry.date);

		switch (entry.state) {
			case OfferState.OPEN:
				entries[0].dateText = date;
				entries[0].done = true;
				break;
			case OfferState.ACCEPTED:
				entries[1].dateText = date;
				entries[1].done = true;
				break;
			case OfferState.INVOICED:
				entries[2] = {
					dateText: date,
					done: true,
					label: resources.str_createAccount
				};
				break;
			case OfferState.PROJECT_CREATED:
				entries[2] = {
					dateText: date,
					done: true,
					label: resources.offerInvoiceCreatedText
				};
				break;
			case OfferState.REJECTED:
				entries[2] = {
					dateText: date,
					done: true,
					label: resources.str_declined
				};
				break;
		}
	});

	return entries;

};

const createDetailViewHeadObjects = (offer, activeAction, resources) => {
	const object = {
		leftElements: [],
		rightElements: [],
		actionElements: []
	};

	object.actionElements.push(
		{
			name: resources.str_sendEmail,
			icon: 'icon-mail',
			action: OfferAction.EMAIL,
			dataQsId: 'offerDetail-head-action-email'
		},
		{
			name: resources.str_copyANGLink,
			icon: 'icon-copy',
			action: OfferAction.SHOW_COPY_LINK_POPOVER,
			dataQsId: 'offerDetail-head-action-copylink',
			controlsItemClass: 'item-copy',
			id: 'detail-head-copy-link-popover-anchor'
		}
	);

	let subHeadline = null;
	if (offer.invoice && offer.invoice.id) {
		const id = offer.invoice.id;
		const title = offer.invoice.state === InvoiceState.DRAFT ? resources.str_draft : offer.invoice.number;
		subHeadline = (
			<div>
				{resources.str_invoice}: <Link to={`/invoice/${id}`}>{title}</Link>
			</div>
		);
	}

	// if (offer.project) {
	// 	const id = offer.project.id;
	// 	const title = offer.project.title;
	// 	subHeadline = (
	// 		<div>
	// 			{resources.str_project}: <Link to={`/project/${id}`}>{title}</Link>
	// 		</div>
	// 	);
	// }
	object.leftElements.push({
		headline: resources.str_customer,
		value: <Link to={'/customer/' + offer.customerId}>{offer.customerData.name}</Link>,
		subValue: subHeadline
	});
	const amount = formatCurrency(offer.totalGross);
	object.rightElements.push(
		{
			headline: resources.str_amount,
			value: amount
		},
		{
			headline: resources.str_offerDate,
			value: formatDate(offer.date)
		}
	);
	return object;
};

const createTopbarPermissionButtons = (topbarButtons, permissions, resources) => {
	const { canUpdateImprezzOffer, canFinalizeImprezzOffer } = permissions;
	
	// if (!canUpdateImprezzOffer) {
	// 	return null;
	// }
	return topbarButtons;
};

class OfferImpressDetailViewComponent extends React.Component {
	constructor(props) {
		super(props);

		const {
			offerData: { standardOfferData: offer }
		} = this.props || {};

		this.state = {
			customerCenterLink: '',
			isAccepting: false,
			isInvoicing: false,

			acceptButtonLoading: false,
			viewportWidth: window.innerWidth,
			offer,
			downloading: false,
			printing: false,
			letterPaperType: offer.printCustomDocument
				? TransactionPrintSetting.CUSTOM_LETTER_PAPER
				: TransactionPrintSetting.DEFAULT_LETTER_PAPER,
			offerTexts: null,
			canCreateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_IMPREZZ_OFFER),
			canUpdateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_IMPREZZ_OFFER),
			canDeleteImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_IMPREZZ_OFFER),
			canFinalizeImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.FINALIZE_IMPREZZ_OFFER),
			canConvertToInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.SET_OPEN_OFFER)
		};

		this.debounceResize = null;
		this.handleResize = this.handleResize.bind(this);

	}

	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_IMPREZZ_OFFER)) {
			invoiz.user.logout(true);
		}
		window.addEventListener('resize', this.handleResize);
	
		invoiz.request(`${config.resourceHost}setting/textModule`, { auth: true }).then(textModuleResponse => {
			const {
				body: {
					data: { offer: offerTexts }
				}
			} = textModuleResponse;
			offerTexts.email = offerTexts.email.replace(/<\/?[^>]+>/ig, '');
			offerTexts.email = offerTexts.email.replace('<br>', '%0D%0A');
			this.setState({ offerTexts });
		});
		this.hideIntercom()
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.handleResize);
	}

	render() {
		const {
			offerData: { standardOfferData: offer },
			// blocks,
			resources
		} = this.props;
		const topbar = this.createTopbar();
		const topbarPermittedButtons = createTopbarPermissionButtons(topbar, this.state, resources);
		const badge = this.createStateBadge();

		const timelineEntries = createTimelineObjects(this.state.offer, resources);

		const timelineIsHorizontal = this.state.viewportWidth <= DetailViewConstants.VIEWPORT_BREAKPOINT;
		const timeline = (
			<div className={`offer-detail-timeline ${timelineIsHorizontal ? 'offer-detail-timeline-horizontal' : ''}`}>
				<TimelineComponent entries={timelineEntries} isHorizontal={timelineIsHorizontal} />
			</div>
		);

		const activeAction = this.state.downloading
			? OfferAction.DOWNLOAD_PDF
			: this.state.printing
				? OfferAction.PRINT
				: null;

		const headContents = createDetailViewHeadObjects(this.state.offer, activeAction, resources);

		const { letterPaperType } = this.state;
		const detailHeadContent = (
			<div>
				<DetailViewHeadPrintPopoverComponent
					printSettingUrl={`${config.offer.resourceUrl}/${this.state.offer.id}/print/setting`}
					letterPaperType={letterPaperType}
					letterPaperChangeCallback={letterPaperType => {
						invoiz
							.request(`${config.offer.resourceUrl}/${this.state.offer.id}/document`, {
								auth: true,
								method: 'POST',
								data: {
									isPrint: true
								}
							})
							.then(response => {
								const { path } = response.body.data;
								const { offer } = this.state;
								offer.pdfPath = config.imageResourceHost + path;
								this.setState({ letterPaperType, offer });
							});
					}}
					ref="detail-head-print-settings-popover"
					resources = {resources}
				/>
				<DetailViewHeadPrintTooltipComponent letterPaperType={letterPaperType} resources= {resources}/>
				<PopoverComponent
					elementId={'detail-head-copy-link-popover-anchor'}
					arrowOffset={160}
					width={300}
					offsetTop={20}
					offsetLeft={95}
					showOnClick={true}
					onElementClicked={() => {
						if (!this.state.customerCenterLink) {
							invoiz
								.request(`${config.offer.resourceUrl}/${this.state.offer.id}/external/link`, {
									auth: true
								})
								.then(response => {
									const {
										body: {
											data: { linkToOfferCustomerCenter }
										}
									} = response;
									this.setState({ customerCenterLink: linkToOfferCustomerCenter }, () => {
										this.refs['detail-head-copy-link-input'].focus();
									});
								});
						} else {
							setTimeout(() => {
								this.refs['detail-head-copy-link-input'].focus();
							});
						}
					}}
					html={
						<div className="detail-head-copy-link-popover">
							<input
								type="text"
								className="detail-head-copy-link-content"
								value={this.state.customerCenterLink}
								onFocus={e => e.target.select()}
								readOnly
								ref={`detail-head-copy-link-input`}
							/>
							<div
								className="icon icon-rounded icon-duplicate"
								onClick={() => this.onHeadControlClick(OfferAction.COPY_CUSTOMERCENTER_LINK)}
							/>
							{/* <a
								href={`mailto:?subject=Ihr%20Angebot%20${
									this.state.offer.number
								}&body=Sehr%20geehrte%20Damen%20und%20Herren,%0D%0A%0D%0Aanbei%20finden%20Sie%20das%20aktuelle%20Angebot:%0D%0A${
									this.state.customerCenterLink
								}%0D%0AMit%20freundlichen%20Grüßen%0D%0A`}
								className="icon icon-rounded icon-mail"
							/> */}
							<a
								href={`mailto:?subject=${resources.str_offerNumber}%20${
									this.state.offer.number
								}&body=${this.state.offerTexts && this.state.offerTexts.email ? encodeURIComponent(this.state.offerTexts.email) : ''}%0D%0A%0D%0A${
									this.state.customerCenterLink
								}%0D%0A%0D%0A${resources.str_yourSincerely}`}
								className="icon icon-rounded icon-mail"
							/>

						</div>
					}
					ref={'detail-head-copy-link-popover'}
				/>

				<DetailViewHeadComponent
					controlActionCallback={action => this.onHeadControlClick(action)}
					actionElements={headContents.actionElements}
					leftElements={headContents.leftElements}
					rightElements={headContents.rightElements}
				/>
			</div>
		);
		return (
			<div className={`offer-impress-detail-component wrapper-has-topbar detail-view ${!timelineIsHorizontal ? 'viewport-large' : ''}`}>
				{topbar}
				<div className="detail-view-head-container">
					{timeline}
					{detailHeadContent}
				</div>
				<div className="detail-content-view-document">
					{/* {images} */}
					{badge}
					<iframe id="impressOfferIframeId" src={`/offer/impress/previewContent/${offer.id}`} name="iframe_impress_offer" width="100%" height="100%" scrolling="no" className="impress-offer-iframe"></iframe>
					{/* frameborder="0" */}
					{/* <ImpressFrontendViewComponent
						offerId={offer.id}
						offerData={this.props.offerData}
						currentBlocks={this.props.blocks}
						backendRequest={invoiz.request}
						fetchPagesUrl={`${config.resourceHost}impress/${offer.id}/pages/`}
						apiUrl={config.resourceHost}
						formatCurrency={formatCurrency}
						resources={resources}
					/> */}
				</div>
				<div className="detail-view-box">
					<NotesComponent
						heading={resources.str_remarks}
						data={{ notes: this.state.offer.notes }}
						onSave={value => this.onNotesChange(value.notes)}
						resources={resources}
						placeholder={format(resources.defaultCommentsPlaceholderText, resources.str_impressQuotationSmall)}
						defaultFocus={true}
					/>
				</div>
				<PopoverComponent
					elementId={'detail-head-copy-link-popover-anchor'}
					arrowOffset={160}
					width={300}
					offsetTop={20}
					offsetLeft={75}
					showOnClick={true}
					onElementClicked={() => {
						if (!this.state.customerCenterLink) {
							invoiz
								.request(`${config.resourceHost}offer/${offer.id}/external/link`, {
									auth: true
								})
								.then(({ body: { data } }) => {
									this.setState({ customerCenterLink: data.linkToOfferCustomerCenter }, () => {
										this.refs['detail-head-copy-link-input'].focus();
									});
								});
						} else {
							setTimeout(() => {
								this.refs['detail-head-copy-link-input'].focus();
							});
						}
					}}
					html={
						<div className="detail-head-copy-link-popover">
							<input
								type="text"
								className="detail-head-copy-link-content"
								value={this.state.customerCenterLink}
								onFocus={e => e.target.select()}
								readOnly
								ref={`detail-head-copy-link-input`}
							/>
							<div
								className="icon icon-rounded icon-duplicate"
								onClick={() => this.onTopbarAction(OfferAction.COPY_CUSTOMERCENTER_LINK)}
							/>
							{/* <a
								href={`mailto:?subject=Ihr%20Angebot%20${
									offer.number
								}&body=Sehr%20geehrte%20Damen%20und%20Herren,%0D%0A%0D%0Aanbei%20finden%20Sie%20das%20aktuelle%20Angebot:%0D%0A${
									this.state.customerCenterLink
								}%0D%0AMit%20freundlichen%20Grüßen%0D%0A`}
								className="icon icon-rounded icon-mail"
							/> */}
							<a
								href={`mailto:?subject=${resources.str_offerNumber}%20${
									offer.number
								}&body=${this.state.offerTexts && this.state.offerTexts.email ? encodeURIComponent(this.state.offerTexts.email) : ''}%0D%0A%0D%0A${
									this.state.customerCenterLink
								}%0D%0A%0D%0A${resources.str_yourSincerely}`}
								className="icon icon-rounded icon-mail"
							/>
						</div>
					}
					ref={'detail-head-copy-link-popover'}
				/>
			</div>
		);
	}

	hideIntercom(){

		//================== old-code
		$('iframe').load(function() {
			$('iframe').contents().find('.freshwidget-button')
			  .append($("<style type='text/css'> .freshwidget-button{display:none !important;} .fc-widget-normal{display:none !important;}</style>"));
		});

		//===================

/*
		var myIframe = document.getElementById('impressOfferIframeId');
		myIframe.addEventListener("load", function() {
			try {
				console.log("after loading");
				console.log(document.getElementById("impressOfferIframeId").contentDocument.getElementById("intercom-container"));
				document.getElementById("impressOfferIframeId").contentDocument.getElementById("intercom-container").style.display="none"
			console.log(				document.getElementById("impressOfferIframeId").contentDocument.getElementById("intercom-container").style.disply);
			
			} catch (error) {
				console.log(document.getElementById("impressOfferIframeId").contentDocument.getElementById("intercom-container"));

				console.log(error);
			}
		
		});
*/

	}

	onNotesChange(notes) {
		invoiz.request(`${config.offer.resourceUrl}/${this.state.offer.id}/notes`, {
			auth: true,
			method: 'PUT',
			data: {
				notes
			}
		});
	}

	onHeadControlClick(action) {
		const { resources } = this.props;
		switch (action) {
			case OfferAction.EMAIL:
				invoiz.router.navigate(`/offer/send/${this.state.offer.id}`);
				break;

			case OfferAction.SHOW_PRINT_SETTINGS_POPOVER:
				this.refs['detail-head-print-settings-popover'].show();
				break;

			case OfferAction.COPY_CUSTOMERCENTER_LINK:
				const customerCenterLinkElm = $('<input />', {
					value: this.state.customerCenterLink
				});
				customerCenterLinkElm.appendTo('body');
				customerCenterLinkElm[0].select();
				document.execCommand('copy');
				customerCenterLinkElm.remove();
				invoiz.showNotification({ message: resources.offerLinkCopiedText });
				break;

			case OfferAction.SHOW_COPY_LINK_POPOVER:
				$('#detail-head-copy-link-popover-anchor').click();
				break;
		}
	}

	onTopbarAction(action) {
		const {
			offerData: { standardOfferData: offer },
			resources
		} = this.props;

		switch (action) {
			case OfferAction.ACCEPT:
				this.setState({ isAccepting: true });
				invoiz
					.request(`${config.resourceHost}offer/${offer.id}/state`, {
						method: 'PUT',
						auth: true,
						data: { state: 'accepted' }
					})
					.then(() => {
						this.setState({ isAccepting: false });
						invoiz.router.reload();
					})
					.catch(() => {
						this.setState({ isAccepting: false });
						invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
					});
				break;

			case OfferAction.COPY_AND_EDIT:
				LoadingService.show(resources.str_offerCopy);
				copyAndEditTransaction({
					invoiceModel: {
						type: 'offer',
						id: offer.id
					},
					onCopySuccess: () => {
						LoadingService.hide();
					},
					onCopyError: () => {
						LoadingService.hide();
					}
				});
				break;

			case OfferAction.SAVE_IMPRESS_OFFER_AS_TEMPLATE:
				this.setState({ isAccepting: true });

				ModalService.open(resources.templateTitleValidation, {
					headline: resources.str_saveAsTemplate,
					cancelLabel: resources.str_abortStop,
					confirmLabel: resources.str_toSave,
					confirmIcon: 'icon-check',
					confirmButtonType: 'primary',
					inputFieldOptions: {
						placeholder: resources.str_templateName
					},
					onConfirm: val => {
						invoiz
							.request(`${config.resourceHost}impress/template`, {
								method: 'POST',
								auth: true,
								data: { offerId: offer.id, title: val || resources.str_newTemplate }
							})
							.then(() => {
								invoiz.router.navigate(`/`);
							})
							.catch(() => {
								this.setState({ isAccepting: false });
								invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
							});

						ModalService.close();
					},
					afterClose: isFromCancel => {
						if (isFromCancel) {
							this.setState({ isAccepting: false });
						}
					}
				});
				break;

			case OfferAction.DELETE:
				ModalService.open(resources.offerDeleteConfirmText,
					{
						headline: resources.str_deleteOffer,
						cancelLabel: resources.str_abortStop,
						confirmLabel: resources.str_clear,
						confirmIcon: 'icon-trashcan',
						confirmButtonType: 'secondary',
						onConfirm: () => {
							ModalService.close();
							invoiz
								.request(`${config.resourceHost}offer/${offer.id}`, {
									auth: true,
									method: 'DELETE'
								})
								.then(() => {
									invoiz.page.showToast(resources.offerDeleteSuccessMessage);
									invoiz.router.navigate('/offers');
								})
								.catch(xhr => {
									if (xhr) {
										invoiz.page.showToast({
											type: 'error',
											message: resources.defaultErrorMessage
										});
									}
								});
						}
					}
				);
				break;

			case OfferAction.EDIT:
				invoiz.router.navigate(`/offer/impress/edit/${offer.id}`);
				break;

			case OfferAction.PREVIEW:
				invoiz.router.navigate(`/offer/impress/preview/${offer.id}`);
				break;
			case OfferAction.FINALISE:
				if (isImpressContingentUser()) {
					this.openImpressFinalizeOfferModal();
				} else {
					this.finalizeImpressOffer(null, resources);
				}
				break;

			// case OfferAction.EMAIL:
			// 	invoiz.router.navigate(`/offer/send/${offer.id}`);
			// 	break;

			case OfferAction.COPY_CUSTOMERCENTER_LINK:
				const customerCenterLinkElm = $('<input />', {
					value: this.state.customerCenterLink
				});
				customerCenterLinkElm.appendTo('body');
				customerCenterLinkElm[0].select();
				document.execCommand('copy');
				customerCenterLinkElm.remove();
				invoiz.page.showToast({ message: resources.offerLinkCopiedText });
				break;

			case OfferAction.INVOICE:
				this.setState({ isInvoicing: true });
				invoiz
					.request(`${config.resourceHost}offer/${offer.id}/state`, {
						method: 'PUT',
						auth: true,
						data: { state: 'invoiced' }
					})
					.then(({ body: { data: { invoiceId } } }) => {
						this.setState({ isInvoicing: false });
						invoiz.router.navigate(`/invoice/${invoiceId}`);
					})
					.catch(() => {
						this.setState({ isInvoicing: false });
						this.showToast({ type: 'error', message: resources.defaultErrorMessage });
					});
				break;

			case OfferAction.REJECT:
				invoiz
					.request(`${config.resourceHost}offer/${offer.id}/state`, {
						method: 'PUT',
						auth: true,
						data: { state: 'rejected' }
					})
					.then(() => {
						invoiz.router.reload();
					})
					.catch(() => {
						this.showToast({ type: 'error', message: resources.defaultErrorMessage });
					});
				break;

			case OfferAction.RESET:
				invoiz
					.request(`${config.resourceHost}offer/${offer.id}/state`, {
						method: 'PUT',
						auth: true,
						data: { state: 'open' }
					})
					.then(() => {
						invoiz.router.reload();
					})
					.catch(() => {
						this.showToast({ type: 'error', message: resources.defaultErrorMessage });
					});
				break;

			case OfferAction.PROJECT:
				invoiz.router.navigate(`/project/new/${offer.id}`);
				break;
		}
	}

	openImpressFinalizeOfferModal() {
		const { resources } = this.props;
		const { planId } = invoiz.user.subscriptionData;

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
				resources={ resources }
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
					if (planId === isContingentDepleted) {
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

	finalizeImpressOffer(closeModal, resources) {
		this.setState({ isAcceptingOffer: true });
		const {
			offerData: { standardOfferData: offer }
		} = this.props;

		invoiz
			.request(`${config.offer.resourceUrl}/${offer.id}/state`, {
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
					invoiz.router.navigate(`/offer/impress/${offer.id}`);
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

	createTopbar() {
		const {
			offerData: { standardOfferData: offer },
			fullWidth,
			resources
		} = this.props;
		const { isAccepting, isInvoicing, canUpdateImprezzOffer, canDeleteImprezzOffer, canFinalizeImprezzOffer, canConvertToInvoice } = this.state;

		const dropdownEntries = [];
		const topbarButtons = [];
		let stateText = '';
		// topbarButtons.push(
		// 	{
		// 		label: resources.str_preview,
		// 		buttonIcon: 'icon-view',
		// 		disabled: this.state.isSaveDisabled || this.state.isAcceptingOffer,
		// 		type: 'text',
		// 		action: OfferAction.PREVIEW
		// 	});
		switch (offer.state) {
			case OfferState.DRAFT:
				stateText = offer.type !== OfferTypes.IMPRESS_TEMPLATE ? `(${resources.str_draft})` : '';

				topbarButtons.push(
					{
						label: resources.str_preview,
						buttonIcon: 'icon-view',
						disabled: this.state.isSaveDisabled || this.state.isAcceptingOffer,
						type: 'text',
						action: OfferAction.PREVIEW
					},
					{
						type: 'default',
						label: resources.str_toEdit,
						buttonIcon: 'icon-edit',
						action: OfferAction.EDIT,
						loading: isAccepting
					},
					{
						type: 'primary',
						label: resources.str_finalizeOffer,
						buttonIcon: 'icon-check',
						action: OfferAction.FINALISE,
						loading: this.state.isAcceptingOffer,
						disabled: this.state.isSaveDisabled || !this.state.canFinalizeImprezzOffer
					});

				if (offer.type !== OfferTypes.IMPRESS_TEMPLATE) {
					dropdownEntries.push([
						{
							label: resources.str_copyEdit,
							action: OfferAction.COPY_AND_EDIT,
							dataQsId: 'impress-offer-topbar-popoverItem-copyAndEdit'
						},
						{
							label: resources.str_saveAsTemplate,
							action: OfferAction.SAVE_IMPRESS_OFFER_AS_TEMPLATE,
							dataQsId: 'impress-offer-topbar-popoverItem-saveAsTemplate'
						},
						{
							label: resources.str_clear,
							action: OfferAction.DELETE,
							dataQsId: 'impress-offer-topbar-popoverItem-delete',
						}
					]);
				}
				break;

			case OfferState.OPEN:
				stateText = `${offer.number} (${resources.str_open})`;

				if (offer.sentAt) {
					topbarButtons.push(
						{
							label: resources.str_preview,
							buttonIcon: 'icon-view',
							disabled: this.state.isSaveDisabled || this.state.isAcceptingOffer,
							type: 'text',
							action: OfferAction.PREVIEW
						},
						{
							type: 'default',
							label: resources.str_toEdit,
							buttonIcon: 'icon-edit',
							action: OfferAction.EDIT
						},
						{
							type: 'primary',
							label: resources.str_accepted,
							buttonIcon: 'icon-check',
							action: OfferAction.ACCEPT,
							loading: isAccepting,
							disabled: !this.state.canFinalizeImprezzOffer
						}
					);
				} else {
					topbarButtons.push(
						{
							label: resources.str_preview,
							buttonIcon: 'icon-view',
							disabled: this.state.isSaveDisabled || this.state.isAcceptingOffer,
							type: 'default',
							action: OfferAction.PREVIEW
						},
						{
							type: 'primary',
							label: resources.str_toEdit,
							buttonIcon: 'icon-edit',
							action: OfferAction.EDIT
						}
					);
				}

				dropdownEntries.push(
					[
						{
							label: resources.str_convertToBill,
							action: 'invoice',
							dataQsId: 'impress-offer-topbar-popoverItem-createInvoice'
						},
						{
							label: resources.str_declined,
							action: OfferAction.REJECT,
							dataQsId: 'impress-offer-topbar-popoverItem-reject'
						}
					],
					[
						{
							label: resources.str_copyEdit,
							action: OfferAction.COPY_AND_EDIT,
							dataQsId: 'impress-offer-topbar-popoverItem-copyAndEdit'
						},
						{
							label: resources.str_saveAsTemplate,
							action: OfferAction.SAVE_IMPRESS_OFFER_AS_TEMPLATE,
							dataQsId: 'impress-offer-topbar-popoverItem-saveAsTemplate'
						},
						{
							label: resources.str_clear,
							action: OfferAction.DELETE,
							dataQsId: 'impress-offer-topbar-popoverItem-delete'
						}
					]
				);

				break;

			case OfferState.ACCEPTED:
				stateText = `${offer.number} (${resources.str_accepted})`;
				topbarButtons.push(
					{
						label: resources.str_preview,
						buttonIcon: 'icon-view',
						disabled: this.state.isSaveDisabled || this.state.isAcceptingOffer,
						type: 'text',
						action: OfferAction.PREVIEW
					},
					{
						type: 'default',
						label: resources.str_toEdit,
						buttonIcon: 'icon-edit',
						action: OfferAction.EDIT
					},
					{
						type: 'primary',
						label: resources.str_convertToBill,
						buttonIcon: 'icon-check',
						action: OfferAction.INVOICE,
						loading: isInvoicing,
						disabled: !this.state.canConvertToInvoice
					}
				);

				dropdownEntries.push(
					[
						{
							label: resources.str_createBudgetBill,
							action: OfferAction.PROJECT,
							dataQsId: 'impress-offer-topbar-popoverItem-createProject'
						},
						{
							label: resources.str_setToOpen,
							action: OfferAction.RESET,
							dataQsId: 'impress-offer-topbar-popoverItem-reset'
						},
						{
							label: resources.str_declined,
							action: OfferAction.REJECT,
							dataQsId: 'impress-offer-topbar-popoverItem-reject'
						}
					],
					[
						{
							label: resources.str_copyEdit,
							action: OfferAction.COPY_AND_EDIT,
							dataQsId: 'impress-offer-topbar-popoverItem-copyAndEdit'
						},
						{
							label: resources.str_saveAsTemplate,
							action: OfferAction.SAVE_IMPRESS_OFFER_AS_TEMPLATE,
							dataQsId: 'impress-offer-topbar-popoverItem-saveAsTemplate'
						},
						{
							label: resources.str_clear,
							action: OfferAction.DELETE,
							dataQsId: 'impress-offer-topbar-popoverItem-delete'
						}
					]
				);
				break;

			case OfferState.REJECTED:
				stateText = `${offer.number} (${resources.str_declined})`;
				topbarButtons.push(
					{
						label: resources.str_preview,
						buttonIcon: 'icon-view',
						disabled: this.state.isSaveDisabled || this.state.isAcceptingOffer,
						type: 'text',
						action: OfferAction.PREVIEW
					},
					{
						type: 'primary',
						label: resources.str_accepted,
						buttonIcon: 'icon-check',
						action: OfferAction.ACCEPT,
						loading: isAccepting,
						disabled: !this.state.canFinalizeImprezzOffer
					},
					{
						type: 'default',
						label: resources.str_toEdit,
						buttonIcon: 'icon-edit',
						action: OfferAction.EDIT
					}
				);

				dropdownEntries.push(
					[
						{
							label: resources.str_convertToBill,
							action: OfferAction.INVOICE,
							dataQsId: 'impress-offer-topbar-popoverItem-createInvoice'
						},
						{
							label: resources.str_setToOpen,
							action: OfferAction.RESET,
							dataQsId: 'impress-offer-topbar-popoverItem-reset'
						}
					],
					[
						{
							label: resources.str_copyEdit,
							action: OfferAction.COPY_AND_EDIT,
							dataQsId: 'impress-offer-topbar-popoverItem-copyAndEdit'
						},
						{
							label: resources.str_saveAsTemplate,
							action: OfferAction.SAVE_IMPRESS_OFFER_AS_TEMPLATE,
							dataQsId: 'impress-offer-topbar-popoverItem-saveAsTemplate'
						},
						{
							label: resources.str_clear,
							action: OfferAction.DELETE,
							dataQsId: 'impress-offer-topbar-popoverItem-delete'
						}
					]
				);
				break;

			case OfferState.PROJECT_CREATED:
			case OfferState.INVOICED:
				stateText = `${offer.number} (${resources.str_createAccount})`;
				topbarButtons.push(
					{
						label: resources.str_preview,
						buttonIcon: 'icon-view',
						disabled: this.state.isSaveDisabled || this.state.isAcceptingOffer,
						type: 'text',
						action: OfferAction.PREVIEW
					});
				dropdownEntries.push([
					{
						label: resources.str_copyEdit,
						action: OfferAction.COPY_AND_EDIT,
						dataQsId: 'impress-offer-topbar-popoverItem-copyAndEdit'
					},
					{
						label: resources.str_saveAsTemplate,
						action: OfferAction.SAVE_IMPRESS_OFFER_AS_TEMPLATE,
						dataQsId: 'impress-offer-topbar-popoverItem-saveAsTemplate'
					},
					{
						label: resources.str_clear,
						action: OfferAction.DELETE,
						dataQsId: 'impress-offer-topbar-popoverItem-delete'
					}
				]);
				break;
		}

		const backButtonRoute = offer.type === OfferTypes.IMPRESS_TEMPLATE ? '/' : '/offers';

		return (
			 canUpdateImprezzOffer && canDeleteImprezzOffer ? <TopbarComponent
			 title={resources.str_impressOffer}
			 subtitle={stateText}
			 backButtonRoute={backButtonRoute}
			 buttonCallback={(ev, button) => this.onTopbarAction(button.action)}
			 buttons={topbarButtons}
			 dropdownEntries={dropdownEntries}
			 dropdownCallback={entry => this.onTopbarAction(entry.action)}
			 fullPageWidth={fullWidth}
		 /> : <TopbarComponent
		 title={resources.str_impressOffer}
		 subtitle={stateText}
		 backButtonRoute={backButtonRoute}
		 buttonCallback={(ev, button) => this.onTopbarAction(button.action)}
		 buttons={topbarButtons}
		//  dropdownEntries={dropdownEntries}
		//  dropdownCallback={entry => this.onTopbarAction(entry.action)}
		 fullPageWidth={fullWidth}
	 /> 
		);
	}

	handleResize() {
		clearTimeout(this.debounceResize);
		this.debounceResize = setTimeout(() => {
			this.setState({ viewportWidth: window.innerWidth });
		}, 100);
	}

	createStateBadge() {
		const { resources } = this.props;
		let badgeString = '';
		let iconClass = '';
		let badgeClass = '';
		switch (this.state.offer.state) {
			case OfferState.OPEN:
				iconClass = 'icon-offen';
				badgeString = resources.str_openSmall;
				break;
			case OfferState.ACCEPTED:
				iconClass = 'icon-check';
				badgeString = resources.str_accepted;
				badgeClass = 'detail-view-badge-accepted';
				break;
			case OfferState.INVOICED:
				iconClass = 'icon-rechnung';
				badgeString = resources.str_createAccount;
				badgeClass = 'detail-view-badge-invoiced';
				break;
			case OfferState.PROJECT_CREATED:
				iconClass = 'icon-rechnung';
				badgeString = resources.offerInvoiceCreatedText;
				badgeClass = 'detail-view-badge-invoiced';
				break;
			case OfferState.REJECTED:
				iconClass = 'icon-ueberfaellig';
				badgeString = resources.str_declined;
				badgeClass = 'detail-view-badge-rejected';
				break;
			case OfferState.DRAFT:
				iconClass = 'icon-offen';
				badgeString = resources.str_draft;
				break;
		}

		return (
			<div className={`detail-view-badge ${badgeClass}`}>
				<i className={`icon ${iconClass}`} />
				<div className="detail-view-badge-text">{badgeString}</div>
			</div>
		);
	}
}

export default OfferImpressDetailViewComponent;
