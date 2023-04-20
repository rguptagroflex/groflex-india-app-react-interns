import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import ImpressFrontendViewComponent from 'shared/impress/impress-frontend-view.component';
import TopbarComponent from 'shared/topbar/topbar.component';
import { formatCurrency } from 'helpers/formatCurrency';
import OfferState from 'enums/offer/offer-state.enum';
import OfferAction from 'enums/offer/offer-action.enum';
import ModalService from 'services/modal.service';
import { copyAndEditTransaction } from 'helpers/transaction/copyAndEditTransaction';
import OfferTypes from 'enums/impress/offer-types.enum';
import LoadingService from 'services/loading.service';
import PopoverComponent from 'shared/popover/popover.component';
import userPermissions from 'enums/user-permissions.enum';

class OfferImpressDetailComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			customerCenterLink: '',
			isAccepting: false,
			isInvoicing: false,
			offerTexts: null,
			canCreateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_IMPREZZ_OFFER),
			canUpdateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_IMPREZZ_OFFER),
			canDeleteImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_IMPREZZ_OFFER),
			canFinalizeImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.FINALIZE_IMPREZZ_OFFER),
			canConvertToInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.SET_OPEN_OFFER)
		};
	}

	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_IMPREZZ_OFFER)) {
			invoiz.user.logout(true);
		}
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
	}

	render() {
		const {
			offerData: { standardOfferData: offer },
			blocks,
			resources
		} = this.props;

		const topbar = this.createTopbar();

		return (
			<div className="offer-impress-detail-component">
				{topbar}
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
				<ImpressFrontendViewComponent
					offerId={offer.id}
					offerData={this.props.offerData}
					currentBlocks={blocks}
					backendRequest={invoiz.request}
					fetchPagesUrl={`${config.resourceHost}impress/${offer.id}/pages/`}
					apiUrl={config.resourceHost}
					formatCurrency={formatCurrency}
					resources={resources}
				/>
			</div>
		);
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

			case OfferAction.EMAIL:
				invoiz.router.navigate(`/offer/send/${offer.id}`);
				break;

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

		switch (offer.state) {
			case OfferState.DRAFT:
				stateText = offer.type !== OfferTypes.IMPRESS_TEMPLATE ? `(${resources.str_draft})` : '';

				topbarButtons.push({
					type: 'primary',
					label: resources.str_toEdit,
					buttonIcon: 'icon-edit',
					action: OfferAction.EDIT,
					loading: isAccepting
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
							dataQsId: 'impress-offer-topbar-popoverItem-delete'
						}
					]);
				}
				break;

			case OfferState.OPEN:
				stateText = `${offer.number} (${resources.str_open})`;

				if (offer.sentAt) {
					topbarButtons.push(
						{
							type: 'text',
							label: resources.str_sendEmail,
							buttonIcon: 'icon-mail',
							action: OfferAction.EMAIL
						},
						// {
						// 	type: 'text',
						// 	label: resources.str_copyANGLink,
						// 	buttonIcon: 'icon-copy',
						// 	action: OfferAction.SHOW_COPY_LINK_POPOVER,
						// 	id: 'detail-head-copy-link-popover-anchor'
						// },
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
							disabled: !canFinalizeImprezzOffer
						}
					);
				} else {
					topbarButtons.push(
						{
							type: 'text',
							label: resources.str_toEdit,
							buttonIcon: 'icon-edit',
							action: OfferAction.EDIT
						},
						// {
						// 	type: 'default',
						// 	label: resources.str_copyANGLink,
						// 	buttonIcon: 'icon-copy',
						// 	action: OfferAction.SHOW_COPY_LINK_POPOVER,
						// 	id: 'detail-head-copy-link-popover-anchor'
						// },
						{
							type: 'primary',
							label: resources.str_sendEmail,
							buttonIcon: 'icon-mail',
							action: OfferAction.EMAIL
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
						type: 'text',
						label: resources.str_sendEmail,
						buttonIcon: 'icon-mail',
						action: OfferAction.EMAIL
					},
					// {
					// 	type: 'text',
					// 	label: resources.str_copyANGLink,
					// 	buttonIcon: 'icon-copy',
					// 	action: OfferAction.SHOW_COPY_LINK_POPOVER,
					// 	id: 'detail-head-copy-link-popover-anchor'
					// },
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
						disabled: !canConvertToInvoice
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
						type: 'text',
						label: resources.str_sendEmail,
						buttonIcon: 'icon-mail',
						action: OfferAction.EMAIL
					},
					// {
					// 	type: 'text',
					// 	label: resources.str_copyANGLink,
					// 	buttonIcon: 'icon-copy',
					// 	action: OfferAction.SHOW_COPY_LINK_POPOVER,
					// 	id: 'detail-head-copy-link-popover-anchor'
					// },
					{
						type: 'primary',
						label: resources.str_accepted,
						buttonIcon: 'icon-check',
						action: OfferAction.ACCEPT,
						loading: isAccepting,
						disabled: !canFinalizeImprezzOffer
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
						type: 'text',
						label: resources.str_sendEmail,
						buttonIcon: 'icon-mail',
						action: OfferAction.EMAIL
					},
					// {
					// 	type: 'text',
					// 	label: resources.str_copyANGLink,
					// 	buttonIcon: 'icon-copy',
					// 	action: OfferAction.SHOW_COPY_LINK_POPOVER,
					// 	id: 'detail-head-copy-link-popover-anchor'
					// }
				);
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
		const backButtonRoute = offer.type === OfferTypes.IMPRESS_TEMPLATE ? '/' : `/offers`;///offer/impress/detail/${offer.id}
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
		// dropdownEntries={dropdownEntries}
		// dropdownCallback={entry => this.onTopbarAction(entry.action)}
		fullPageWidth={fullWidth}
	/> 
		);
	}
}

export default OfferImpressDetailComponent;
