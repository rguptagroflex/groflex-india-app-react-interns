import React from 'react';
import TopbarComponent from 'shared/topbar/topbar.component';
import TimelineComponent from 'shared/timeline/timeline.component';
import PurchaseOrderState from 'enums/purchase-order/purchase-order-state.enum';
import PurchaseOrderAction from 'enums/purchase-order/purchase-order-action.enum';
import invoiz from 'services/invoiz.service';
import config from 'config';
import { copyAndEditTransaction } from 'helpers/transaction/copyAndEditTransaction';
import NotesComponent from 'shared/notes/notes.component';
import DetailViewHeadComponent from 'shared/detail-view/detail-view-head.component';
import { DetailViewConstants } from 'helpers/constants';
import ModalService from 'services/modal.service';
import DetailViewHeadPrintPopoverComponent from 'shared/detail-view/detail-view-head-print-popover.component';
import DetailViewHeadPrintTooltipComponent from 'shared/detail-view/detail-view-head-print-tooltip.component';
import TransactionPrintSetting from 'enums/transaction-print-setting.enum';
import { printPdf } from 'helpers/printPdf';
import { downloadPdf } from 'helpers/downloadPdf';
import { formatCurrency } from 'helpers/formatCurrency';
// import { formatDate } from 'helpers/formatDate';
import { formatClientDate } from 'helpers/formatDate';
import PopoverComponent from 'shared/popover/popover.component';
import LoadingService from 'services/loading.service';
import InvoiceState from 'enums/invoice/invoice-state.enum';
import { format } from 'util';
import { Link } from 'react-router-dom';
import userPermissions from 'enums/user-permissions.enum';
import planPermissions from "enums/plan-permissions.enum";

const createTopbarDropdown = (purchaseOrder, resources) => {
	const items = [];

	switch (purchaseOrder.state) {
		case PurchaseOrderState.OPEN:
			if (invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_EXPENDITURE)) { 
				items.push(
					[
						{
							label: resources.str_copyEdit,
							action: PurchaseOrderAction.COPY_AND_EDIT,
							dataQsId: 'purchaseOrder-topbar-popoverItem-copyAndEdit'
						},
						{ label: resources.str_clear, action: PurchaseOrderAction.DELETE, dataQsId: 'purchaseOrder-topbar-popoverItem-delete' }
					]
				);
			} else {
				items.push(
					[
						{
							label: resources.str_convertToExpense,
							action: PurchaseOrderAction.EXPENSE,
							dataQsId: 'purchaseOrder-topbar-popoverItem-createInvoice'
						},
						{ label: resources.str_declined, action: PurchaseOrderAction.REJECT, dataQsId: 'purchaseOrder-topbar-popoverItem-reject' }
					],
					[
						{
							label: resources.str_copyEdit,
							action: PurchaseOrderAction.COPY_AND_EDIT,
							dataQsId: 'purchaseOrder-topbar-popoverItem-copyAndEdit'
						},
						{ label: resources.str_clear, action: PurchaseOrderAction.DELETE, dataQsId: 'purchaseOrder-topbar-popoverItem-delete' }
					]
				);
			}
			break;

		case PurchaseOrderState.ACCEPTED:
			items.push(
				[
					// {
					// 	label: resources.str_createBudgetExpense,
					// 	action: PurchaseOrderAction.PROJECT,
					// 	dataQsId: 'purchaseOrder-topbar-popoverItem-createProject'
					// },
					{
						label: resources.str_setToOpen,
						action: PurchaseOrderAction.RESET,
						dataQsId: 'purchaseOrder-topbar-popoverItem-reset'
					},
					{ label: resources.str_declined, action: PurchaseOrderAction.REJECT, dataQsId: 'purchaseOrder-topbar-popoverItem-reject' }
				],
				[
					{
						label: resources.str_copyEdit,
						action: PurchaseOrderAction.COPY_AND_EDIT,
						dataQsId: 'purchaseOrder-topbar-popoverItem-copyAndEdit'
					},
					{ label: resources.str_clear, action: PurchaseOrderAction.DELETE, dataQsId: 'purchaseOrder-topbar-popoverItem-delete' }
				]
			);
			break;

		case PurchaseOrderState.REJECTED:
			if (invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_EXPENDITURE)) { 
				items.push(
					[
						{
							label: resources.str_copyEdit,
							action: PurchaseOrderAction.COPY_AND_EDIT,
							dataQsId: 'purchaseOrder-topbar-popoverItem-copyAndEdit'
						},
						{ label: resources.str_clear, action: PurchaseOrderAction.DELETE, dataQsId: 'purchaseOrder-topbar-popoverItem-delete' }
					]
				);
			} else {
				items.push(
					[
						{
							label: resources.str_convertToExpense,
							action: PurchaseOrderAction.EXPENSE,
							dataQsId: 'purchaseOrder-topbar-popoverItem-createInvoice'
						},
						{ label: resources.str_setToOpen, action: PurchaseOrderAction.RESET, dataQsId: 'purchaseOrder-topbar-popoverItem-reset' }
					],
					[
						{
							label: resources.str_copyEdit,
							action: PurchaseOrderAction.COPY_AND_EDIT,
							dataQsId: 'purchaseOrder-topbar-popoverItem-copyAndEdit'
						},
						{ label: resources.str_clear, action: PurchaseOrderAction.DELETE, dataQsId: 'purchaseOrder-topbar-popoverItem-delete' }
					]
				);
			}

			break;

		case PurchaseOrderState.PROJECT_CREATED:
		case PurchaseOrderState.EXPENSED:
			items.push([
				{
					label: resources.str_copyEdit,
					action: PurchaseOrderAction.COPY_AND_EDIT,
					dataQsId: 'purchaseOrder-topbar-popoverItem-copyAndEdit'
				},
				{ label: resources.str_clear, action: PurchaseOrderAction.DELETE, dataQsId: 'purchaseOrder-topbar-popoverItem-delete' }
			]);
			break;

		case PurchaseOrderState.DRAFT:
			items.push([
				{
					label: resources.str_copyEdit,
					action: PurchaseOrderAction.COPY_AND_EDIT,
					dataQsId: 'purchaseOrder-topbar-popoverItem-copyAndEdit'
				},
				{ label: resources.str_clear, action: PurchaseOrderAction.DELETE, dataQsId: 'purchaseOrder-topbar-popoverItem-delete' }
			]);
			break;
	}

	return items;
};

const createTopbarButtons = (purchaseOrder, options, resources) => {
	const buttons = [];

	switch (purchaseOrder.state) {
		case PurchaseOrderState.OPEN:
		case PurchaseOrderState.REJECTED:
			buttons.push({
				type: 'default',
				label: resources.str_toEdit,
				buttonIcon: 'icon-edit2',
				action: PurchaseOrderAction.EDIT,
				dataQsId: 'purchaseOrderDetail-topbar-btn-edit'
			});
			buttons.push({
				type: 'primary',
				label: resources.str_accepted,
				buttonIcon: 'icon-check',
				action: PurchaseOrderAction.ACCEPT,
				loading: options.acceptButtonLoading,
				dataQsId: 'purchaseOrderDetail-topbar-btn-accept'
			});
			break;

		case PurchaseOrderState.ACCEPTED:
			if (invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_EXPENDITURE)) { 
				buttons.push({
					type: 'default',
					label: resources.str_toEdit,
					buttonIcon: 'icon-edit2',
					action: PurchaseOrderAction.EDIT,
					dataQsId: 'purchaseOrderDetail-topbar-btn-edit'
				});
			} else {
				buttons.push({
					type: 'default',
					label: resources.str_toEdit,
					buttonIcon: 'icon-edit2',
					action: PurchaseOrderAction.EDIT,
					dataQsId: 'purchaseOrderDetail-topbar-btn-edit'
				});
				buttons.push({
					type: 'primary',
					label: resources.str_convertToExpense,
					buttonIcon: 'icon-check',
					action: PurchaseOrderAction.EXPENSE,
					dataQsId: 'purchaseOrderDetail-topbar-btn-createInvoice'
				});
			}

			break;

		case PurchaseOrderState.DRAFT:
			buttons.push({
				type: 'default',
				label: resources.str_toEdit,
				buttonIcon: 'icon-edit2',
				action: PurchaseOrderAction.EDIT_IMPRESS_OFFER,
				dataQsId: 'purchaseOrderDetail-topbar-btn-edit'
			});
			buttons.push({
				type: 'primary',
				label: resources.str_finalize,
				disabled: !options.hasCustomerAndPositions,
				buttonIcon: 'icon-check',
				action: PurchaseOrderAction.FINALIZE_IMPRESS_OFFER,
				dataQsId: 'purchaseOrderDetail-topbar-btn-finalize'
			});
			break;
	}

	return buttons;
};

const createTimelineObjects = (purchaseOrder, resources) => {
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

	purchaseOrder.history.forEach(entry => {
		// const date = formatDate(entry.date, 'YYYY-MM-DD', 'DD.MM.YYYY');
		const date = formatClientDate(entry.date);

		switch (entry.state) {
			case PurchaseOrderState.OPEN:
				entries[0].dateText = date;
				entries[0].done = true;
				break;
			case PurchaseOrderState.ACCEPTED:
				entries[1].dateText = date;
				entries[1].done = true;
				break;
			case PurchaseOrderState.EXPENSED:
				entries[2] = {
					dateText: date,
					done: true,
					label: resources.str_createAccount
				};
				break;
			case PurchaseOrderState.PROJECT_CREATED:
				entries[2] = {
					dateText: date,
					done: true,
					label: resources.expenseCreatedText
				};
				break;
			case PurchaseOrderState.REJECTED:
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

const createDetailViewHeadObjects = (purchaseOrder, activeAction, resources) => {
	const object = {
		leftElements: [],
		rightElements: [],
		actionElements: []
	};

	object.actionElements.push(
		{
			name: resources.str_sendEmail,
			icon: 'icon-mail',
			action: PurchaseOrderAction.EMAIL,
			dataQsId: 'purchaseOrderDetail-head-action-email'
		},
		{
			name: resources.str_pdf,
			icon: 'icon-pdf',
			action: PurchaseOrderAction.DOWNLOAD_PDF,
			actionActive: activeAction === PurchaseOrderAction.DOWNLOAD_PDF,
			dataQsId: 'purchaseOrderDetail-head-action-download'
		},
		{
			name: resources.str_print,
			icon: 'icon-print2',
			action: PurchaseOrderAction.PRINT,
			actionActive: activeAction === PurchaseOrderAction.PRINT,
			dataQsId: 'purchaseOrderDetail-head-action-print',
			controlsItemClass: 'item-print',
			id: 'detail-head-print-anchor'
		},
		{
			name: '',
			icon: 'icon-arr_down',
			action: PurchaseOrderAction.SHOW_PRINT_SETTINGS_POPOVER,
			dataQsId: 'purchaseOrderDetail-head-action-printSettings',
			controlsItemClass: 'item-print-settings',
			id: 'detail-head-print-settings-popover-anchor'
		}
	);

	if (purchaseOrder.state !== PurchaseOrderState.DRAFT) {
		object.actionElements.push({
			name: resources.str_copyANGLinkPurchaseOrder,
			icon: 'icon-copy',
			action: PurchaseOrderAction.SHOW_COPY_LINK_POPOVER,
			dataQsId: 'purchaseOrderDetail-head-action-copylink',
			controlsItemClass: 'item-copy',
			id: 'detail-head-copy-link-popover-anchor'
		});
	}

	let subHeadline = null;
	if (purchaseOrder.expense && purchaseOrder.expense.id) {
		const id = purchaseOrder.expense.id;
		const title = purchaseOrder.expense.state === InvoiceState.DRAFT ? resources.str_draft : purchaseOrder.expense.number;
		subHeadline = (
			<div>
				{resources.str_expense}: <Link to={`/expense/${id}`}>{title}</Link>
			</div>
		);
	}

	if (purchaseOrder.project) {
		const id = purchaseOrder.project.id;
		const title = purchaseOrder.project.title;
		subHeadline = (
			<div>
				{resources.str_project}: <Link to={`/project/${id}`}>{title}</Link>
			</div>
		);
	}

	object.leftElements.push({
		headline: resources.str_payee,
		value: <Link to={'/customer/' + purchaseOrder.customerId}>{purchaseOrder.displayName}</Link>,
		subValue: subHeadline
	});

	const amount = formatCurrency(purchaseOrder.totalGross);
	object.rightElements.push(
		{
			headline: resources.str_amount,
			value: amount
		},
		{
			headline: resources.str_purchaseOrderDate,
			value: purchaseOrder.displayDate
		}
	);

	return object;
};

const createTopbarPermissionButtons = (topbarButtons, permissions, resources) => {
	const { canAcceptPurchaseorder, canUpdatePurchaseorder, canConvertPurchaseorder } = permissions;
	if (canUpdatePurchaseorder && canAcceptPurchaseorder) {
		topbarButtons.filter(btn => btn.label === resources.str_accepted && btn.label === resources.str_toEdit);
		return topbarButtons;
	}

	if (canUpdatePurchaseorder && canConvertPurchaseorder) {
		topbarButtons.filter(btn => btn.label === resources.str_convertToExpense && btn.label === resources.str_toEdit);
		return topbarButtons;
	}
}

class PurchaseOrderDetailComponent extends React.Component {
	constructor(props) {
		super(props);
		const purchaseOrder = this.props.purchaseOrder || {};
		
		this.state = {
			customerCenterLink: '',
			acceptButtonLoading: false,
			viewportWidth: window.innerWidth,
			purchaseOrder,
			downloading: false,
			printing: false,
			letterPaperType: purchaseOrder.printCustomDocument
				? TransactionPrintSetting.CUSTOM_LETTER_PAPER
				: TransactionPrintSetting.DEFAULT_LETTER_PAPER,
			purchaseOrderTexts: null,
			canUpdatePurchaseorder: null,
			canAcceptPurchaseorder: null,
			canRejectPurchaseorder: null,
			canConvertPurchaseorder: null,
			canSetPurchaseOrderOpen: null,
			canDeletePurchaseOrder: null
		};

		this.debounceResize = null;
		this.handleResize = this.handleResize.bind(this);
	}

	componentDidMount() {
		window.addEventListener('resize', this.handleResize);
		if (!invoiz.user.hasPermission(userPermissions.VIEW_PURCHASE_ORDER)) {
			invoiz.user.logout(true);
		}
		this.setState({
			canUpdatePurchaseorder: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_PURCHASE_ORDER),
			canAcceptPurchaseorder: invoiz.user && invoiz.user.hasPermission(userPermissions.ACCEPT_PURCHASE_ORDER),
			canRejectPurchaseorder: invoiz.user && invoiz.user.hasPermission(userPermissions.REJECT_PURCHASE_ORDER),
			canConvertPurchaseorder: invoiz.user && invoiz.user.hasPermission(userPermissions.CONVERT_PURCHASE_ORDER),
			canSetPurchaseOrderOpen: invoiz.user && invoiz.user.hasPermission(userPermissions.SET_PURCHASE_ORDER_OPEN),
			canDeletePurchaseOrder: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_PURCHASE_ORDER)
		});

		const { purchaseOrder } = this.state;
		invoiz
			.request(`${config.purchaseOrder.resourceUrl}/${parseInt(purchaseOrder.id, 10)}/document`, {
				auth: true,
				method: 'POST',
				data: {
					isPrint: false
				}
			})
			.then(pdfPathResponse => {
				const { path } = pdfPathResponse.body.data;
				purchaseOrder.pdfPath = config.imageResourceHost + path;
				fetch(purchaseOrder.pdfPath, {
					method: 'GET'
				})
					.then(response => response.arrayBuffer())
					.then(arrayBuffer => PDFJS.getDocument(arrayBuffer))
					.then(pdf => {
						let currentPage = 1;
						const numPages = pdf.numPages;
						const myPDF = pdf;

						const handlePages = page => {
							const wrapper = document.getElementById('expense-detail-pdf-wrapper');
							const canvas = document.createElement('canvas');
							canvas.width = '925';
							const context = canvas.getContext('2d');
							const viewport = page.getViewport(canvas.width / page.getViewport(1.0).width);
							canvas.height = viewport.height;
							page.render({
								canvasContext: context,
								viewport
							});
							wrapper.appendChild(canvas);
							currentPage++;
							if (currentPage <= numPages) {
								myPDF.getPage(currentPage).then(handlePages);
							}
						};

						myPDF.getPage(currentPage).then(handlePages);
					});
			});
		invoiz.request(`${config.resourceHost}setting/textModule`, { auth: true }).then(textModuleResponse => {
			const {
				body: {
					data: { purchaseOrder: purchaseOrderTexts }
				}
			} = textModuleResponse;
			purchaseOrderTexts.email = purchaseOrderTexts.email.replace(/<\/?[^>]+>/ig, '');
			purchaseOrderTexts.email = purchaseOrderTexts.email.replace('<br>', '%0D%0A');
			this.setState({ purchaseOrderTexts });
		});
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.handleResize);
	}

	hasCustomerAndPositions() {
		const { purchaseOrder } = this.state;
		return (
			purchaseOrder.customerData &&
			Object.keys(purchaseOrder.customerData).length > 0 &&
			purchaseOrder.positions &&
			purchaseOrder.positions.length > 0
		);
	}

	render() {
		const { resources } = this.props;
		const timelineEntries = createTimelineObjects(this.state.purchaseOrder, resources);
		const topbarButtons = createTopbarButtons(this.state.purchaseOrder, {
			acceptButtonLoading: this.state.acceptButtonLoading,
			hasCustomerAndPositions: this.hasCustomerAndPositions()
		}, resources);
		const topbarPermittedButtons = createTopbarPermissionButtons(topbarButtons, this.state, resources);
		const topbarDropdownItems = createTopbarDropdown(this.state.purchaseOrder, resources);
		const activeAction = this.state.downloading
			? PurchaseOrderAction.DOWNLOAD_PDF
			: this.state.printing
				? PurchaseOrderAction.PRINT
				: null;
		const headContents = createDetailViewHeadObjects(this.state.purchaseOrder, activeAction, resources);
		const title = this.state.purchaseOrder.state === PurchaseOrderState.DRAFT ? `(${resources.str_draft})` : this.state.purchaseOrder.displayNumber;
		const badge = this.createStateBadge();

		const timelineIsHorizontal = this.state.viewportWidth <= DetailViewConstants.VIEWPORT_BREAKPOINT;
		const timeline = (
			<div className={`offer-detail-timeline ${timelineIsHorizontal ? 'offer-detail-timeline-horizontal' : ''}`}>
				<TimelineComponent entries={timelineEntries} isHorizontal={timelineIsHorizontal} />
			</div>
		);
		const { canUpdatePurchaseorder, canDeletePurchaseOrder } = this.state;
		let images = [];
		let count = 0;
		this.state.purchaseOrder.thumbnails.forEach(thumbnail => {
			thumbnail.imageUrls.forEach(url => {
				count++;
				images.push(<img key={`purchaseOrder-image-${count}`} src={config.imageResourceHost + url} width='100%' />);
			});
		});

		const { letterPaperType } = this.state;

		if (!this.hasCustomerAndPositions() || this.state.purchaseOrder.state === PurchaseOrderState.DRAFT) {
			headContents.actionElements = null;
		}

		if (!this.hasCustomerAndPositions()) {
			images = [
				<div key="purchaseOrder-image-dummy" className="offer-image-draft-state-hint">
					{resources.offerCustomerMessage}
				</div>
			];
		}

		const detailHeadContent = (
			<div>
				<DetailViewHeadPrintPopoverComponent
					printSettingUrl={`${config.purchaseOrder.resourceUrl}/${this.state.purchaseOrder.id}/print/setting`}
					letterPaperType={letterPaperType}
					letterPaperChangeCallback={letterPaperType => {
						invoiz
							.request(`${config.purchaseOrder.resourceUrl}/${this.state.purchaseOrder.id}/document`, {
								auth: true,
								method: 'POST',
								data: {
									isPrint: true
								}
							})
							.then(response => {
								const { path } = response.body.data;
								const { purchaseOrder } = this.state;
								purchaseOrder.pdfPath = config.imageResourceHost + path;
								this.setState({ letterPaperType, purchaseOrder });
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
								.request(`${config.purchaseOrder.resourceUrl}/${this.state.purchaseOrder.id}/external/link`, {
									auth: true
								})
								.then(response => {
									const {
										body: {
											data: { linkToPurchaseOrderCustomerCenter }
										}
									} = response;
									this.setState({ customerCenterLink: linkToPurchaseOrderCustomerCenter }, () => {
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
								onClick={() => this.onHeadControlClick(PurchaseOrderAction.COPY_CUSTOMERCENTER_LINK)}
							/>
							<a
								href={`mailto:?subject=${resources.str_purchaseOrderNumber}%20${
									this.state.purchaseOrder.number
								}&body=${this.state.purchaseOrderTexts && this.state.purchaseOrderTexts.email ? encodeURIComponent(this.state.purchaseOrderTexts.email) : ''}%0D%0A%0D%0A${
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
			<div className={`offer-detail-wrapper wrapper-has-topbar ${!timelineIsHorizontal ? 'viewport-large' : ''}`}>
				{ canUpdatePurchaseorder && canDeletePurchaseOrder ? <TopbarComponent
					title={`${resources.str_purchaseOrder} ${title}`}
					buttonCallback={(event, button) => this.handleTopbarButtonClick(event, button)}
					backButtonRoute={'purchase-orders'}
					dropdownEntries={topbarDropdownItems}
					dropdownCallback={entry => this.handleTopbarDropdownClick(entry)}
					buttons={topbarPermittedButtons}
				/> : 
				<TopbarComponent
					title={`${resources.str_purchaseOrder} ${title}`}
					buttonCallback={(event, button) => this.handleTopbarButtonClick(event, button)}
					backButtonRoute={'purchase-orders'}
					buttons={topbarPermittedButtons}
				/>}
				

				<div className="detail-view-head-container">
					{timeline}
					{detailHeadContent}
				</div>

				<div className="detail-view-document">
					{badge}
					<img className="detail-view-preview" src="/assets/images/invoice-preview.png" />
					{images}
					<div id="expense-detail-pdf-wrapper" />
				</div>

				<div className="detail-view-box">
					<NotesComponent
						heading={resources.str_remarks}
						data={{ notes: this.state.purchaseOrder.notes }}
						onSave={value => this.onNotesChange(value.notes)}
						resources={resources}
						placeholder={format(resources.defaultCommentsPlaceholderText, resources.str_purchaseOrderSmall)}
						defaultFocus={true}
					/>
				</div>
			</div>
		);
	}

	onHeadControlClick(action) {
		const { resources } = this.props;
		switch (action) {
			case PurchaseOrderAction.EMAIL:
				invoiz.router.navigate(`/purchase-order/send/${this.state.purchaseOrder.id}`);
				break;

			case PurchaseOrderAction.SHOW_PRINT_SETTINGS_POPOVER:
				this.refs['detail-head-print-settings-popover'].show();
				break;

			case PurchaseOrderAction.DOWNLOAD_PDF: {
				const purchaseOrder = this.state.purchaseOrder;

				this.setState({ downloading: true }, () => {
					invoiz
						.request(`${config.purchaseOrder.resourceUrl}/${parseInt(purchaseOrder.id, 10)}/document`, {
							auth: true,
							method: 'POST',
							data: {
								isPrint: false
							}
						})
						.then(response => {
							const { path } = response.body.data;
							purchaseOrder.pdfPath = config.imageResourceHost + path;
							downloadPdf({
								pdfUrl: purchaseOrder.pdfPath,
								title: `${resources.str_purchaseOrderUpperCase} ${purchaseOrder.number}`,
								isPost: false,
								callback: () => {
									this.setState({ downloading: false });
								}
							});
						})
						.catch(() => {
							invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
						});
				});
				break;
			}

			case PurchaseOrderAction.PRINT:
				const purchaseOrder = this.state.purchaseOrder;

				this.setState({ printing: true }, () => {
					invoiz
						.request(`${config.purchaseOrder.resourceUrl}/${parseInt(purchaseOrder.id, 10)}/document`, {
							auth: true,
							method: 'POST',
							data: {
								isPrint: true
							}
						})
						.then(response => {
							const { path } = response.body.data;
							purchaseOrder.pdfPath = config.imageResourceHost + path;
							printPdf({
								pdfUrl: purchaseOrder.pdfPath,
								isPost: false,
								callback: () => {
									this.setState({ printing: false });
								}
							});
						})
						.catch(() => {
							invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
						});
				});
				break;

			case PurchaseOrderAction.COPY_CUSTOMERCENTER_LINK:
				const customerCenterLinkElm = $('<input />', {
					value: this.state.customerCenterLink
				});
				customerCenterLinkElm.appendTo('body');
				customerCenterLinkElm[0].select();
				document.execCommand('copy');
				customerCenterLinkElm.remove();
				invoiz.showNotification({ message: resources.purchaseOrderLinkCopiedText });
				break;

			case PurchaseOrderAction.SHOW_COPY_LINK_POPOVER:
				$('#detail-head-copy-link-popover-anchor').click();
				break;
		}
	}

	onNotesChange(notes) {
		invoiz.request(`${config.purchaseOrder.resourceUrl}/${this.state.purchaseOrder.id}/notes`, {
			auth: true,
			method: 'PUT',
			data: {
				notes
			}
		});
	}

	accept(state) {
		const { resources } = this.props;
		this.setState({ acceptButtonLoading: true });
		invoiz
			.request(`${config.purchaseOrder.resourceUrl}/${this.state.purchaseOrder.id}/state`, {
				method: 'PUT',
				auth: true,
				data: { state: state || 'accepted' }
			})
			.then(() => {
				this.setState({ acceptButtonLoading: false });
				invoiz.router.reload();
			})
			.catch(() => {
				this.setState({ acceptButtonLoading: false });
				invoiz.showNotificationt({ type: 'error', message: resources.defaultErrorMessage });
			});
	}

	createProject() {
		invoiz.router.navigate(`/project/new/${this.state.purchaseOrder.id}`);
	}

	copyAndEdit() {
		const { resources } = this.props;
		LoadingService.show(resources.str_purchaseOrderCopy);
		copyAndEditTransaction({
			invoiceModel: {
				type: 'purchaseOrder',
				id: this.state.purchaseOrder.id,
				navPath: 'purchase-order'
			},
			onCopySuccess: () => {
				LoadingService.hide();
			},
			onCopyError: () => {
				LoadingService.hide();
			}
		});
	}

	delete() {
		const { resources } = this.props;
		ModalService.open(resources.purchaseOrderDeleteConfirmText, {
			headline: resources.str_deletePurchaseOrder,
			cancelLabel: resources.str_abortStop,
			confirmLabel: resources.str_clear,
			confirmIcon: 'icon-trashcan',
			confirmButtonType: 'secondary',
			onConfirm: () => {
				ModalService.close();

				invoiz
					.request(`${config.purchaseOrder.resourceUrl}/${this.state.purchaseOrder.id}`, {
						auth: true,
						method: 'DELETE'
					})
					.then(() => {
						invoiz.showNotification(resources.purchaseOrderDeleteSuccessMessage);
						invoiz.router.navigate('/purchase-orders');
					})
					.catch(xhr => {
						if (xhr) {
							invoiz.showNotification({
								type: 'error',
								message: resources.defaultErrorMessage
							});
						}
					});
			}
		});
	}

	edit() {

		invoiz.router.navigate(`purchase-order/edit/${this.state.purchaseOrder.id}`);
	}

	expense() {
		const { resources } = this.props;
		invoiz
			.request(`${config.purchaseOrder.resourceUrl}/${this.state.purchaseOrder.id}/state`, {
				method: 'PUT',
				auth: true,
				data: { state: 'expensed' }
			})
			.then(({ body: { data: { expenseId } } }) => {
				
				invoiz.router.navigate(`/expense/edit/${expenseId}`);
			})
			.catch(() => {
				invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
			});
	}

	reset() {
		const { resources } = this.props;
		invoiz
			.request(`${config.purchaseOrder.resourceUrl}/${this.state.purchaseOrder.id}/state`, {
				method: 'PUT',
				auth: true,
				data: { state: 'open' }
			})
			.then(() => {
				invoiz.router.reload();
			})
			.catch(() => {
				invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
			});
	}

	reject() {
		const { resources } = this.props;
		invoiz
			.request(`${config.purchaseOrder.resourceUrl}/${this.state.purchaseOrder.id}/state`, {
				method: 'PUT',
				auth: true,
				data: { state: 'rejected' }
			})
			.then(() => {
				invoiz.router.reload();
			})
			.catch(() => {
				invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
			});
	}

	handleTopbarButtonClick(event, button) {
		switch (button.action) {
			case PurchaseOrderAction.ACCEPT:
				this.accept();
				break;

			case PurchaseOrderAction.EDIT:
			case PurchaseOrderAction.EDIT_IMPRESS_OFFER:
				this.edit();
				break;

			case PurchaseOrderAction.EXPENSE:
				this.expense();
				break;
			case PurchaseOrderAction.FINALIZE_IMPRESS_OFFER:
				this.accept('open');
				break;
		}
	}

	handleTopbarDropdownClick(item) {
		switch (item.action) {
			case PurchaseOrderAction.COPY_AND_EDIT:
				this.copyAndEdit();
				break;

			case PurchaseOrderAction.DELETE:
				this.delete();
				break;

			case PurchaseOrderAction.REJECT:
				this.reject();
				break;

			case PurchaseOrderAction.EXPENSE:
				this.expense();
				break;

			case PurchaseOrderAction.RESET:
				this.reset();
				break;

			case PurchaseOrderAction.PROJECT:
				this.createProject();
				break;
		}
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
		switch (this.state.purchaseOrder.state) {
			case PurchaseOrderState.OPEN:
				iconClass = 'icon-offen';
				badgeString = resources.str_openSmall;
				break;
			case PurchaseOrderState.ACCEPTED:
				iconClass = 'icon-check';
				badgeString = resources.str_accepted;
				badgeClass = 'detail-view-badge-accepted';
				break;
			case PurchaseOrderState.EXPENSED:
				iconClass = 'icon-rechnung';
				badgeString =  resources.expenseCreatedText;
				badgeClass = 'detail-view-badge-expensed';
				break;
			case PurchaseOrderState.PROJECT_CREATED:
				iconClass = 'icon-rechnung';
				badgeString = resources.expenseCreatedText;
				badgeClass = 'detail-view-badge-expensed';
				break;
			case PurchaseOrderState.REJECTED:
				iconClass = 'icon-ueberfaellig';
				badgeString = resources.str_declined;
				badgeClass = 'detail-view-badge-rejected';
				break;
			case PurchaseOrderState.DRAFT:
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

export default PurchaseOrderDetailComponent;
