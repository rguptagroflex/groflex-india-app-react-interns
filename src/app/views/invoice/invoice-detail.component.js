import invoiz from 'services/invoiz.service';
import React from 'react';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import config from 'config';
import accounting from 'accounting';
import TopbarComponent from 'shared/topbar/topbar.component';
import TimelineComponent from 'shared/timeline/timeline.component';
import InvoiceState from 'enums/invoice/invoice-state.enum';
import InvoiceAction from 'enums/invoice/invoice-action.enum';
import { formatClientDate, formatApiDate } from 'helpers/formatDate';
import { formatCurrency } from 'helpers/formatCurrency';
import { copyAndEditTransaction } from 'helpers/transaction/copyAndEditTransaction';
import Payment from 'models/payment.model';
import InvoiceAutodunningComponent from 'shared/invoice-autodunning/invoice-autodunning.component';
import NotesComponent from 'shared/notes/notes.component';
import ErrorCodes from 'enums/error-codes.enum';
import ListComponent from 'shared/list/list.component';
import DetailViewHeadComponent from 'shared/detail-view/detail-view-head.component';
import ModalService from 'services/modal.service';
import { DetailViewConstants, errorCodes } from 'helpers/constants';
import { updateSubscriptionDetails } from 'helpers/updateSubsciptionDetails';
import { handleTransactionErrors } from 'helpers/errors';
import { checkAchievementNotification } from 'helpers/checkAchievementNotification';
import DetailViewHeadPrintPopoverComponent from 'shared/detail-view/detail-view-head-print-popover.component';
import DetailViewHeadPrintTooltipComponent from 'shared/detail-view/detail-view-head-print-tooltip.component';
import TransactionPrintSetting from 'enums/transaction-print-setting.enum';
import { printPdf } from 'helpers/printPdf';
import { downloadPdf } from 'helpers/downloadPdf';
import PopoverComponent from 'shared/popover/popover.component';
import LoadingService from 'services/loading.service';
import CancelInvoiceModalComponent from 'shared/modals/cancel-invoice-modal.component';
import DeleteCancelInvoiceModalComponent from 'shared/modals/delete-cancel-invoice-modal.component';
import DunningRecipientModalComponent from 'shared/modals/dunning-recipient-modal.component';
import PaymentCreateModalComponent from 'shared/modals/payment-create-modal.component';
import CreateDunningModalComponent from 'shared/modals/create-dunning-modal.component';
import { format } from 'util';

import userPermissions from 'enums/user-permissions.enum';

const createTopbarDropdown = (invoice, resources) => {
	const items = [];

	switch (invoice.state) {
		case InvoiceState.DRAFT:
			items.push([
				{
					label: resources.str_copy_edit,
					action: InvoiceAction.COPY_AND_EDIT,
					dataQsId: 'invoice-topbar-popoverItem-copyAndEdit'
				},
				{ label: resources.str_clear, action: InvoiceAction.DELETE, dataQsId: 'invoice-topbar-popoverItem-delete' }
			]);
			break;

		case InvoiceState.LOCKED:
			items.push([
				{
					label: resources.str_copy_edit,
					action: InvoiceAction.COPY_AND_EDIT,
					dataQsId: 'invoice-topbar-popoverItem-copyAndEdit'
				},
				{
					label: resources.str_cancel + '/' + resources.str_clear,
					action: InvoiceAction.DELETE_AND_CANCEL,
					dataQsId: 'invoice-topbar-popoverItem-delete'
				}
			]);

			break;

		case InvoiceState.DUNNED:
			items.push([
				{
					label: resources.str_copy_edit,
					action: InvoiceAction.COPY_AND_EDIT,
					dataQsId: 'invoice-topbar-popoverItem-copyAndEdit'
				},
				{
					label: resources.str_cancel + '/' + resources.str_clear,
					action: InvoiceAction.DELETE_AND_CANCEL,
					dataQsId: 'invoice-topbar-popoverItem-delete'
				}
			]);
			break;

		case InvoiceState.PAID:
		case InvoiceState.PARTIALLY_PAID:
			items.push(
				[
					{
						label: resources.str_copy_edit,
						action: InvoiceAction.COPY_AND_EDIT,
						dataQsId: 'invoice-topbar-popoverItem-copyAndEdit'
					}
				],
				[{ label: resources.str_cancel, action: InvoiceAction.CANCEL, dataQsId: 'invoice-topbar-popoverItem-cancel' }]
			);
			break;

		case InvoiceState.CANCELLED:
			items.push([
				{
					label: resources.str_copy_edit,
					action: InvoiceAction.COPY_AND_EDIT,
					dataQsId: 'invoice-topbar-popoverItem-copyAndEdit'
				}
			]);
			break;
	}

	return items;
};

const createTopbarButtons = (invoice, state, options, resources) => {
	const buttons = [];
	switch (invoice.state) {
		case InvoiceState.DRAFT:
			buttons.push({
				type: 'default',
				label: resources.str_toEdit,
				buttonIcon: 'icon-edit2',
				action: InvoiceAction.EDIT,
				dataQsId: 'invoiceDetail-topbar-btn-editInvoice'
			});
			buttons.push({
				type: 'primary',
				label: resources.str_toLock,
				buttonIcon: 'icon-check',
				action: InvoiceAction.LOCK,
				dataQsId: 'invoiceDetail-topbar-btn-lockInvoice',
				disabled: !state.canCloseInvoice
			});
			break;

		case InvoiceState.LOCKED:
		case InvoiceState.DUNNED:
		case InvoiceState.PARTIALLY_PAID:
			buttons.push({
				type: 'primary',
				label: resources.str_registerPayment,
				buttonIcon: 'icon-erfassen',
				action: InvoiceAction.CREATE_PAYMENT,
				dataQsId: 'invoiceDetail-topbar-btn-createPayment'
			});
			break;
	}

	if (invoice.isOverDue) {
		buttons.push({
			type: 'danger',
			label: resources.str_createRemainder,
			buttonIcon: 'icon-mahnen',
			action: InvoiceAction.DUN,
			dataQsId: 'invoiceDetail-topbar-btn-createDunning',
			disabled: !state.canCreateReminder
		});
	}

	return buttons;
};

const createTimelineObjects = (invoice, resources) => {
	const entries = [
		{
			label: resources.str_started
		},
		{
			label: resources.str_completed
		},
		{
			label: resources.str_sent
		},
		{
			label: resources.str_paid
		}
	];

	const isSent = invoice.history.find(entry => {
		return entry.state === InvoiceState.SENT;
	});

	const isPaid = invoice.history.find(entry => {
		return entry.state === InvoiceState.PAID;
	});

	invoice.history.forEach(entry => {
		// const date = formatDate(entry.date, 'YYYY-MM-DD', 'DD.MM.YYYY');
		const date = formatClientDate(entry.date);

		switch (entry.state) {
			case InvoiceState.DRAFT:
				entries[0].dateText = date;
				entries[0].done = true;
				break;
			case InvoiceState.LOCKED:
				entries[1].dateText = date;
				entries[1].done = true;
				break;
			case InvoiceState.SENT:
				if (!entries[2].done) {
					entries[2].dateText = date;
					entries[2].done = true;
				}
				break;
			case InvoiceState.PRINTED:
				if (!isSent && invoice.state !== InvoiceState.DRAFT) {
					entries[2].dateText = date;
					entries[2].done = true;
				}
				break;
			case InvoiceState.PAID:
				entries[3] = {
					dateText: date,
					done: true,
					label: resources.str_paid
				};
				break;
			case InvoiceState.DUNNED:
				entries[3] = {
					dateText: date,
					done: true,
					label: resources.str_calledFor
				};
				break;
			case InvoiceState.CANCELLED:
				entries[3] = {
					dateText: date,
					done: true,
					label: resources.str_canceled
				};
				break;
		}
	});

	if (
		!isPaid &&
		invoice.autoDunningEnabled &&
		invoice.metaData &&
		invoice.metaData.nextDunning &&
		invoice.metaData.nextDunning.date
	) {
		entries[3] = {
			// dateText: formatDate(invoice.metaData.nextDunning.date, 'YYYY-MM-DD', 'DD.MM.YYYY'),
			dateText: formatClientDate(invoice.metaData.nextDunning.date),
			done: false,
			label: invoice.metaData.nextDunning.label
		};
	}

	return entries;
};

const createDetailViewHeadObjects = (invoice, activeAction, resources) => {
	const object = {
		leftElements: [],
		rightElements: [],
		actionElements: []
	};

	let subHeadline = null;

	if (invoice.project) {
		const projectId = invoice.project.id;
		const projectName = invoice.project.title;
		subHeadline = (
			<div className="detail-view-head-sub-value-project">
				<span>{resources.str_project}:</span> <Link to={`/project/${projectId}`}>{projectName}</Link>
			</div>
		);
	}

	if (invoice.recurringInvoiceId) {
		subHeadline = (
			<div>
				<Link to={`/recurringinvoice/${invoice.recurringInvoiceId}`}>{resources.subscriptionInvoiceCreateText}</Link>
			</div>
		);
	}

	if (invoice.offer) {
		const id = invoice.offer.id;
		const title = invoice.offer.number;
		const isImpress = invoice.offer.type === 'impress';

		subHeadline = (
			<div>
				{resources.str_offer}: <Link to={`/offer/${isImpress ? 'impress/' : ''}${id}`}>{title}</Link>
			</div>
		);
	}

	if (invoice.state !== InvoiceState.DRAFT) {
		object.actionElements.push({
			name: resources.str_sendEmail,
			icon: 'icon-mail',
			action: InvoiceAction.EMAIL,
			dataQsId: 'invoiceDetail-head-action-email'
		});
	}

	object.actionElements.push(
		{
			name: resources.str_pdf,
			icon: 'icon-pdf',
			action: InvoiceAction.DOWNLOAD_PDF,
			actionActive: activeAction === InvoiceAction.DOWNLOAD_PDF,
			dataQsId: 'invoiceDetail-head-action-download'
		},
		{
			name: resources.str_print,
			icon: 'icon-print2',
			action: InvoiceAction.PRINT,
			actionActive: activeAction === InvoiceAction.PRINT,
			dataQsId: 'invoiceDetail-head-action-print',
			controlsItemClass: 'item-print',
			id: 'detail-head-print-anchor'
		},
		{
			name: '',
			icon: 'icon-arr_down',
			action: InvoiceAction.SHOW_PRINT_SETTINGS_POPOVER,
			dataQsId: 'invoiceDetail-head-action-printSettings',
			controlsItemClass: 'item-print-settings',
			id: 'detail-head-print-settings-popover-anchor'
		}
	);

	if (invoice.state !== InvoiceState.DRAFT) {
		object.actionElements.push({
			name: resources.str_copyRelink,
			icon: 'icon-copy',
			action: InvoiceAction.SHOW_COPY_LINK_POPOVER,
			dataQsId: 'invoiceDetail-head-action-copylink',
			controlsItemClass: 'item-copy',
			id: 'detail-head-copy-link-popover-anchor'
		});
	}

	object.leftElements.push({
		headline: resources.str_customer,
		value: <Link to={'/customer/' + invoice.customerId}>{invoice.displayName}</Link>,
		subValue: subHeadline
	});

	const amount = formatCurrency(invoice.totalGross);
	const outstandingAmount = formatCurrency(invoice.outstandingAmount);
	const paidAmount = formatCurrency(invoice.totalGross - invoice.outstandingAmount);

	object.rightElements.push({
		headline: invoice.state === InvoiceState.PARTIALLY_PAID ? resources.outstandingBalanceText : resources.str_amount,
		value: invoice.state === InvoiceState.PARTIALLY_PAID ? outstandingAmount : amount
	});

	if (invoice.state === InvoiceState.PARTIALLY_PAID) {
		object.rightElements.push({
			headline: resources.str_alreadyPaid,
			value: paidAmount
		});
	}

	if (
		invoice.state !== InvoiceState.DRAFT &&
		invoice.state !== InvoiceState.PAID &&
		invoice.state !== InvoiceState.CANCELLED
	) {
		object.rightElements.push({
			headline: invoice.dueDateKind,
			value: invoice.dueDateSubString
		});
	}

	if (invoice.state !== InvoiceState.DRAFT) {
		object.rightElements.push({
			headline: resources.invoiceDate,
			value: invoice.displayDate
		});
	}

	return object;
};

const createTopbarPermissionButtons = (topbarButtons, permissions, resources) => {
	const { canUpdateInvoice, canCloseInvoice, canDeleteInvoice, canCreateReminder, canRegisterPayment } = permissions;
	if (canUpdateInvoice) {
		topbarButtons.filter(btn => btn.label === resources.str_toEdit);
		return topbarButtons;
	}

	if (canUpdateInvoice && canCloseInvoice) {
		topbarButtons.filter(btn => btn.label === resources.str_toLock && btn.label === resources.str_toEdit);
		return topbarButtons;
	}

	if (canCreateReminder && canRegisterPayment) {
		topbarButtons.filter(btn => btn.label === resources.str_registerPayment && btn.label === resources.str_createRemainder);
		return topbarButtons;
	}
};

class InvoiceDetailComponent extends React.Component {
	constructor(props) {
		super(props);

		const invoice = this.props.invoice || {};
		const dunnings = this.props.dunnings || [];

		this.state = {
			customerCenterLink: '',
			viewportWidth: window.innerWidth,
			dunnings,
			invoice,
			downloading: false,
			printing: false,
			autoDunningChanged: false,
			letterPaperType: invoice.printCustomDocument
				? TransactionPrintSetting.CUSTOM_LETTER_PAPER
				: TransactionPrintSetting.DEFAULT_LETTER_PAPER,
			invoiceTexts: null,
			canDownloadInvoice: null,
			canSendInvoice: null,
			canCopyInvoice: null,
			canPrintInvoice: null,
			canCloseInvoice: null,
			canUpdateInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_INVOICE),
			canDeleteInvoice: null,
			canCreateReminder: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_INVOICE_REMINDER),
			canRegisterPayment: null
		};

		this.debounceResize = null;
		this.handleResize = this.handleResize.bind(this);
	}

	componentDidMount() {
		this.setState({
			canDownloadInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.DOWNLOAD_INVOICE),
			canPrintInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.PRINT_INVOICE),
			canSendInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.SEND_INVOICE),
			canCopyInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.COPY_LINK_INVOICE),
			canDeleteInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_INVOICE),
			canCloseInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.CLOSE_INVOICE),
			canUpdateInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_INVOICE),
			canCreateReminder: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_INVOICE_REMINDER),
			canRegisterPayment: invoiz.user && invoiz.user.hasPermission(userPermissions.ENTER_INVOICE_PAYMENT)
		});
		window.addEventListener('resize', this.handleResize);

		const { invoice } = this.state;
		invoiz
			.request(`${config.invoice.resourceUrl}/${parseInt(invoice.id, 10)}/document`, {
				auth: true,
				method: 'POST',
				data: {
					isPrint: false
				}
			})
			.then(pdfPathResponse => {
				const { path } = pdfPathResponse.body.data;
				invoice.pdfPath = config.imageResourceHost + path;
				fetch(invoice.pdfPath, {
					method: 'GET'
				})
					.then(response => response.arrayBuffer())
					.then(arrayBuffer => PDFJS.getDocument(arrayBuffer))
					.then(pdf => {
						let currentPage = 1;
						const numPages = pdf.numPages;
						const myPDF = pdf;

						const handlePages = page => {
							const wrapper = document.getElementById('invoice-detail-pdf-wrapper');
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
					data: { invoice: invoiceTexts }
				}
			} = textModuleResponse;
			invoiceTexts.email = invoiceTexts.email.replace(/<\/?[^>]+>/ig, '');
			invoiceTexts.email = invoiceTexts.email.replace('<br>', '%0D%0A');
			this.setState({ invoiceTexts });
		});
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.handleResize);
	}
	
	render() {
		const { resources } = this.props;
		const timelineEntries = createTimelineObjects(this.state.invoice, resources);
		const topbarButtons = createTopbarButtons(this.state.invoice, this.state, null, resources);
		const topbarPermittedButtons = createTopbarPermissionButtons(topbarButtons, this.state, resources);
		const topbarDropdownItems = createTopbarDropdown(this.state.invoice, resources);
		const activeAction = this.state.downloading
			? InvoiceAction.DOWNLOAD_PDF
			: this.state.printing
				? InvoiceAction.PRINT
				: null;
		const headContents = createDetailViewHeadObjects(this.state.invoice, activeAction, resources);

		const paymentTable = this.createPaymentTable();
		const dunningTable = this.createDunningTable();

		const title = this.state.invoice.state === InvoiceState.DRAFT ? resources.str_draft : this.state.invoice.displayNumber;

		let subtitle = null;
		if (this.state.invoice.state === InvoiceState.CANCELLED) {
			const cancellationId =
				this.state.invoice.metaData.cancellation && this.state.invoice.metaData.cancellation.id;
			const cancellationNumber =
				this.state.invoice.metaData.cancellation && this.state.invoice.metaData.cancellation.number;
			subtitle = (
				<div>
					({resources.cancellationInvoiceNumber} <Link to={`/cancellation/${cancellationId}`}>{cancellationNumber}</Link>)
				</div>
			);
		}

		let dunningRecipientsString =
			this.state.invoice.dunningRecipients.length > 0 ? this.state.invoice.dunningRecipients[0] : '';
		if (dunningRecipientsString.length > 27) {
			dunningRecipientsString = dunningRecipientsString.slice(0, 23) + '...';
		}

		const dunningRecipientsSuffix =
			this.state.invoice.dunningRecipients.length > 1
				? ' +' + (this.state.invoice.dunningRecipients.length - 1).toString()
				: '';

		const dunningRecipients = (
			<div className="invoice-detail-dunning-recipients">
				<span className="invoice-detail-dunning-label">
					<i className="icon icon-edit2" onClick={() => this.openDunningRecipientModal()} /> {resources.str_willBeSentOn}:
				</span>
				<span className="invoice-detail-dunning-value">
					{dunningRecipientsString + dunningRecipientsSuffix}
				</span>
			</div>
		);

		const badge = this.createStateBadge();

		const timelineIsHorizontal = this.state.viewportWidth <= DetailViewConstants.VIEWPORT_BREAKPOINT;
		const timeline = (
			<div
				className={`invoice-detail-timeline ${
					timelineIsHorizontal ? 'invoice-detail-timeline-horizontal' : ''
				}`}
			>
				<TimelineComponent entries={timelineEntries} isHorizontal={timelineIsHorizontal} />
			</div>
		);

		const images = [];
		let count = 0;
		this.state.invoice.thumbnails.forEach(thumbnail => {
			thumbnail.imageUrls.forEach(url => {
				count++;
				images.push(<img key={`invoice-image-${count}`} src={config.imageResourceHost + url} />);
			});
		});

		const { letterPaperType, canCopyInvoice, canDownloadInvoice, canPrintInvoice, canSendInvoice, canUpdateInvoice, canDeleteInvoice } = this.state;

		const detailHeadContent = (
			<div>
				<DetailViewHeadPrintPopoverComponent
					printSettingUrl={`${config.invoice.resourceUrl}/${this.state.invoice.id}/print/setting`}
					letterPaperType={letterPaperType}
					letterPaperChangeCallback={letterPaperType => {
						invoiz
							.request(`${config.invoice.resourceUrl}/${this.state.invoice.id}/document`, {
								auth: true,
								method: 'POST',
								data: {
									isPrint: true
								}
							})
							.then(response => {
								const { path } = response.body.data;
								const { invoice } = this.state;
								invoice.pdfPath = config.imageResourceHost + path;
								this.setState({ letterPaperType, invoice });
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
								.request(`${config.invoice.resourceUrl}/${this.state.invoice.id}/external/link`, {
									auth: true
								})
								.then(response => {
									const {
										body: {
											data: { linkToInvoiceCustomerCenter }
										}
									} = response;
									const { invoice } = this.state;
									invoice.history.push({
										date: new Date(Date.now()).toISOString(),
										state: InvoiceState.PRINTED
									});
									this.setState({ invoice, customerCenterLink: linkToInvoiceCustomerCenter }, () => {
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
								onClick={() => this.onHeadControlClick(InvoiceAction.COPY_CUSTOMERCENTER_LINK)}
							/>
							<a
								href={`mailto:?subject=${resources.str_invoiceNumber}%20${
									this.state.invoice.number
								}&body=${this.state.invoiceTexts && this.state.invoiceTexts.email ? encodeURIComponent(this.state.invoiceTexts.email) : ''}%0D%0A%0D%0A${
									this.state.customerCenterLink
								}%0D%0A%0D%0A${resources.str_yourSincerely}`}
								className="icon icon-rounded icon-mail"
							/>
						</div>
					}
					ref={'detail-head-copy-link-popover'}
				/>
				{ (canSendInvoice && canDownloadInvoice && canCopyInvoice && canPrintInvoice) ? <DetailViewHeadComponent
					controlActionCallback={action => this.onHeadControlClick(action)}
					actionElements={headContents.actionElements}
					leftElements={headContents.leftElements}
					rightElements={headContents.rightElements}
				/> : <DetailViewHeadComponent
				controlActionCallback={action => this.onHeadControlClick(action)}
				// actionElements={headContents.actionElements}
				leftElements={headContents.leftElements}
				rightElements={headContents.rightElements}
			/> }				
			</div>
		);

		return (
			<div
				className={`invoice-detail-wrapper wrapper-has-topbar ${!timelineIsHorizontal ? 'viewport-large' : ''}`}
			> { canUpdateInvoice && canDeleteInvoice ? <TopbarComponent
				title={`${resources.str_invoice} ${title}`}
				subtitle={subtitle}
				buttonCallback={(event, button) => this.handleTopbarButtonClick(event, button)}
				backButtonRoute={'invoices'}
				dropdownEntries={topbarDropdownItems}
				dropdownCallback={entry => this.handleTopbarDropdownClick(entry)}
				buttons={topbarPermittedButtons}
			/> : <TopbarComponent
			title={`${resources.str_invoice} ${title}`}
			subtitle={subtitle}
			buttonCallback={(event, button) => this.handleTopbarButtonClick(event, button)}
			backButtonRoute={'invoices'}
			buttons={topbarPermittedButtons} />
		}


				<div className={`detail-view-head-container`}>
					{timeline}

					{detailHeadContent}

					{this.state.invoice.autoDunningEnabled ||
					this.state.autoDunningChanged ||
					(this.state.invoice.payConditionData && this.state.invoice.payConditionData.dueDays > 0) ? (
							<div className="invoice-detail-autodunning-wrapper">
								<div className="invoice-detail-autodunning">
									<InvoiceAutodunningComponent
										ref={`autoDunningToggle`}
										onChange={value => {
											this.onAutoDunningChange(value);
										}}
										enabled={this.state.invoice.autoDunningEnabled}
										resources={resources}
									/>
									{this.state.invoice.autoDunningEnabled ? dunningRecipients : null}
								</div>
							</div>
						) : null}
				</div>

				<div className="detail-view-document">
					{badge}
					<img className="detail-view-preview" src="/assets/images/invoice-preview.png" />
					{/* {images} */}
					<div id="invoice-detail-pdf-wrapper" />
				</div>

				<div className="detail-view-box">
					<ListComponent
						title={resources.receivedPayments}
						columns={paymentTable.columns}
						rows={paymentTable.rows}
						tableId={`payments`}
						resources={resources}
					/>
				</div>

				<div className="detail-view-box">
					<ListComponent
						title={resources.str_remainders}
						columns={dunningTable.columns}
						rows={dunningTable.rows}
						tableId={`dunnings`}
						resources={resources}
					/>
				</div>

				<div className="detail-view-box">
					<NotesComponent
						heading={resources.str_remarks}
						data={{ notes: this.state.invoice.notes }}
						onSave={value => this.onNotesChange(value.notes)}
						placeholder={format(resources.defaultCommentsPlaceholderText, resources.str_invoiceSmall)}
						resources={resources}
						defaultFocus={true}
					/>
				</div>
			</div>
		);
	}

	onAutoDunningChange(value) {
		const { resources } = this.props;
		this.setState({ autoDunningChanged: true }, () => {
			if (value && this.state.invoice.dunningRecipients.length === 0) {
				this.openDunningRecipientModal(true);
			} else {
				invoiz
					.request(`${config.invoice.resourceUrl}/${this.state.invoice.id}/dunning/setting`, {
						auth: true,
						method: 'PUT',
						data: {
							autoDunningEnabled: value,
							dunningRecipients: this.state.invoice.dunningRecipients
						}
					})
					.then(() => {
						const invoice = this.state.invoice;
						invoice.autoDunningEnabled = value;

						this.setState({ invoice });

						invoiz.showNotification({
							message: `${resources.emailReminderSuccessMessage} ${
								value ? resources.str_activated : resources.str_deactivated
							}`
						});
					})
					.catch(response => {
						const error = response.body && response.body.meta;

						if (error && error.dunningRecipients[0].code === ErrorCodes.NOT_EMPTY) {
							invoiz.showNotification({
								type: 'error',
								message: resources.dunninRecipientEmptyRecipientsErrorMessage
							});

							this.openDunningRecipientModal(true);
						} else {
							invoiz.showNotification({
								type: 'error',
								message: `${resources.str_atThe} ${
									value ? resources.str_activate : resources.str_deactivate
								} ${resources.automaticEmalSendingError}`
							});
						}
					});
			}
		});
	}

	onHeadControlClick(action) {
		const { resources } = this.props;
		switch (action) {
			case InvoiceAction.EMAIL:
				invoiz.router.navigate(`invoice/send/${this.state.invoice.id}`);
				break;

			case InvoiceAction.DOWNLOAD_PDF: {
				const { invoice } = this.state;

				this.setState({ downloading: true }, () => {
					invoiz
						.request(`${config.invoice.resourceUrl}/${parseInt(invoice.id, 10)}/document`, {
							auth: true,
							method: 'POST',
							data: {
								isPrint: false
							}
						})
						.then(pdfPathResponse => {
							const { path } = pdfPathResponse.body.data;
							invoice.pdfPath = config.imageResourceHost + path;
							downloadPdf({
								pdfUrl: invoice.pdfPath,
								title: `${resources.str_invoice} ${invoice.state !== InvoiceState.DRAFT ? invoice.number : resources.str_draft}`,
								isPost: false,
								callback: () => {
									invoice.history.push({
										date: new Date(Date.now()).toISOString(),
										state: InvoiceState.PRINTED
									});

									this.setState({ invoice, downloading: false });
								}
							});
						});
				});
				break;
			}

			case InvoiceAction.PRINT:
				const { invoice } = this.state;

				this.setState({ printing: true }, () => {
					invoiz
						.request(`${config.invoice.resourceUrl}/${parseInt(invoice.id, 10)}/document`, {
							auth: true,
							method: 'POST',
							data: {
								isPrint: true
							}
						})
						.then(pdfPathResponse => {
							const { path } = pdfPathResponse.body.data;
							invoice.pdfPath = config.imageResourceHost + path;
							printPdf({
								pdfUrl: invoice.pdfPath,
								isPost: false,
								callback: () => {
									invoice.history.push({
										date: new Date(Date.now()).toISOString(),
										state: InvoiceState.PRINTED
									});

									this.setState({ invoice, printing: false });
								}
							});
						});
				});
				break;

			case InvoiceAction.SHOW_PRINT_SETTINGS_POPOVER:
				this.refs['detail-head-print-settings-popover'].show();
				break;

			case InvoiceAction.COPY_CUSTOMERCENTER_LINK:
				const customerCenterLinkElm = $('<input />', {
					value: this.state.customerCenterLink
				});
				customerCenterLinkElm.appendTo('body');
				customerCenterLinkElm[0].select();
				document.execCommand('copy');
				customerCenterLinkElm.remove();
				invoiz.page.showToast({ message: resources.billingLinkCopyMessage });
				break;

			case InvoiceAction.SHOW_COPY_LINK_POPOVER:
				$('#detail-head-copy-link-popover-anchor').click();
				break;
		}
	}

	onNotesChange(notes) {
		invoiz.request(`${config.invoice.resourceUrl}/${this.state.invoice.id}/notes`, {
			auth: true,
			method: 'PUT',
			data: {
				notes
			}
		});
	}

	addPayment() {
		const openAmount = parseFloat(accounting.toFixed(this.state.invoice.outstandingAmount, 2), 10);
		const { resources } = this.props;
		const { id, displayName, number, type, customerId } = this.state.invoice;
		const { dunnings, invoice } = this.state;

		const payment = new Payment({
			customerName: displayName,
			date: formatApiDate(new Date()),
			invoiceId: id,
			invoiceNumber: number,
			invoiceType: type,
			amount: openAmount,
			custId: customerId,
			outstandingBalance: openAmount
		});

		const dunning = dunnings.length > 0 && dunnings[0];

		if (dunning) {
			dunning.label = !_.isEmpty(invoice.metaData.currentDunning) ? invoice.metaData.currentDunning.label : '';
		}

		ModalService.open(
			<PaymentCreateModalComponent invoice={invoice} payment={payment} dunning={dunning} onSave={() => invoiz.router.reload()} resources={resources} />,
			{
				width: 700,
				modalClass: 'payment-create-modal-component',
				afterOpen: () => {
					setTimeout(() => {
						$('.create-payment-amount-wrapper input').focus();
					});
				}
			}
		);
	}

	lock() {
		const { resources } = this.props;
		ModalService.open(resources.invoiceLockModalContentText, {
			headline: resources.invoiceLockModalHeading,
			confirmLabel: resources.str_finishNow,
			confirmIcon: 'icon-check',
			cancelLabel: resources.str_abortStop,
			loadingOnConfirmUntilClose: true,
			onConfirm: () => {
				const url = `${config.invoice.resourceUrl}/${this.state.invoice.id}/lock`;
				invoiz
					.request(url, { auth: true, method: 'PUT' })
					.then(() => {
						ModalService.close();
						invoiz.router.reload();
						invoiz.page.showToast({ message: resources.invoiceLockSuccessMessage });
						checkAchievementNotification();
					})
					.then(updateSubscriptionDetails())
					.catch(error => {
						ModalService.close();

						if (
							error.body.meta.useAdvancedPaymentOptions &&
							error.body.meta.useAdvancedPaymentOptions[0].code === errorCodes.INVALID
						) {
							invoiz.page.showToast({
								type: 'error',
								message: resources.invoizPayInvoiceEditErrorMessage
							});

							return;
						} else if (error.body.meta.number && error.body.meta.number[0].code === errorCodes.EXISTS) {
							invoiz.page.showToast({
								type: 'error',
								message: resources.invoiceNumberAlreadyExistMessage
							});
							return;
						} else if (error.body.meta.number && error.body.meta.number[0].code === errorCodes.TOO_MANY) {
							invoiz.page.showToast({
								type: 'error',
								message: resources.invoiceNumberRangeExceedMessage
							});
							return;
						}
						handleTransactionErrors(error.body.meta);
					});
			}
		});
	}

	cancel() {
		const { invoice } = this.state;
		const { resources } = this.props;
		ModalService.open(<CancelInvoiceModalComponent invoice={invoice} resources={resources} />, {
			headline: format(resources.invoiceCancelHeading, invoice.number),
			width: 800
		});
	}

	copyAndEdit() {
		const { resources } = this.props;
		LoadingService.show(resources.copyInvoice);
		copyAndEditTransaction({
			invoiceModel: this.state.invoice,
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
		ModalService.open(resources.deleteInvoiceWarningMessage, {
			headline: resources.str_deleteInvoice,
			cancelLabel: resources.str_abortStop,
			confirmLabel: resources.str_clear,
			confirmIcon: 'icon-trashcan',
			confirmButtonType: 'secondary',
			onConfirm: () => {
				ModalService.close();

				invoiz
					.request(`${config.invoice.resourceUrl}/${this.state.invoice.id}`, {
						auth: true,
						method: 'DELETE'
					})
					.then(() => {
						invoiz.showNotification(resources.invoiceDeleteConfirmationMessage);
						invoiz.router.navigate('/invoices');
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

	deleteAndCancel() {
		const { resources } = this.props;
		const { invoice } = this.state;
		ModalService.open(<DeleteCancelInvoiceModalComponent invoice={invoice} isFromList={false} resources={resources} />, {
			width: 800,
			modalClass: 'delete-cancel-invoice-modal-component'
		});
	}

	dun() {
		const { resources } = this.props;
		if (_.isEmpty(this.state.invoice.metaData.nextDunning)) {
			invoiz.page.showToast({ type: 'error', message: resources.dunningLastActiveDunningLevelReachedMessage });
			return;
		}

		const {
			metaData: { nextDunning: nextDunningLevel }
		} = this.state.invoice;

		ModalService.open(
			<CreateDunningModalComponent invoice={this.state.invoice} nextDunningLevel={nextDunningLevel} resources={resources} />,
			{
				headline: resources.str_createPaymentReminder,
				modalClass: 'create-dunning-modal-component',
				width: 650
			}
		);
	}

	edit() {
		invoiz.router.navigate(`invoice/edit/${this.state.invoice.id}`);
	}

	handleTopbarButtonClick(event, button) {
		switch (button.action) {
			case InvoiceAction.LOCK:
				this.lock();
				break;

			case InvoiceAction.CREATE_PAYMENT:
				this.addPayment();
				break;

			case InvoiceAction.EDIT:
				this.edit();
				break;

			case InvoiceAction.DUN:
				this.dun();
				break;
		}
	}

	handleTopbarDropdownClick(item) {
		switch (item.action) {
			case InvoiceAction.COPY_AND_EDIT:
				this.copyAndEdit();
				break;

			case InvoiceAction.DELETE:
				this.delete();
				break;

			case InvoiceAction.DELETE_AND_CANCEL:
				this.deleteAndCancel();
				break;

			case InvoiceAction.CANCEL:
				this.cancel();
				break;
		}
	}

	handleResize() {
		clearTimeout(this.debounceResize);
		this.debounceResize = setTimeout(() => {
			this.setState({ viewportWidth: window.innerWidth });
		}, 100);
	}

	createPaymentTable() {
		const { resources } = this.props;
		const { canRegisterPayment } = this.state;
		const paymentTable = {
			columns: [
				{ title: resources.str_date, width: '15%', resourceKey: 'date' },
				{ title: resources.str_remarks, width: '40%', resourceKey: 'remarks' },
				{ title: resources.str_amount, align: 'right', resourceKey: 'amount' }
			],
			rows: []
		};

		if (this.state.invoice.state !== InvoiceState.CANCELLED) {
			paymentTable.columns.push({ title: resources.str_actions, width: '25%', align: 'right', resourceKey: 'actions' });
		}

		if (this.state.invoice.payments) {
			this.state.invoice.payments.forEach(payment => {
				payment = new Payment(payment);

				const amount = formatCurrency(payment.amount);

				const cells = [{ value: payment.displayDate }, { value: payment.notes }, { value: amount }];

				if (canRegisterPayment) {
					if (this.state.invoice.state !== InvoiceState.CANCELLED && !payment.cancellationPaymentId) {
						cells.push({
							value: (
								<div>
									<a onClick={() => this.deletePayment(payment.id)}>{resources.str_cancelPayment}</a>
								</div>
							)
						});
					}
				}
				paymentTable.rows.push({ cells });
			});
		}

		return paymentTable;
	}

	deletePayment(paymentId) {
		const { resources } = this.props;
		ModalService.open(
			<div>
				{resources.cancelPaymentHeadline}
				<br />
				{resources.str_undoneMessage}
			</div>,
			{
				headline: resources.str_cancelPayment,
				confirmLabel: resources.str_cancel,
				cancelLabel: resources.str_back,
				onConfirm: () => {
					ModalService.close();
					invoiz
						.request(`${config.invoice.resourceUrl}/${this.state.invoice.id}/payment/${paymentId}`, {
							auth: true,
							method: 'DELETE'
						})
						.then(() => {
							invoiz.router.reload();
						})
						.catch(() => {
							invoiz.page.showToast({
								type: 'error',
								message: resources.defaultErrorMessage
							});
						});
				}
			}
		);
	}

	createDunningTable() {
		const { resources } = this.props;
		const { canCreateReminder } = this.state;
		const dunningTable = {
			columns: [
				{ title: resources.str_date, width: '15%', resourceKey: 'date' },
				{ title: resources.str_dunningLevel, resourceKey: 'dunningLevel' },
				{ title: resources.str_actions, width: '25%', align: 'right', resourceKey: 'actions' }
			],
			rows: []
		};

		if (this.state.dunnings) {
			this.state.dunnings.forEach(dunning => {
				// const date = formatDate(dunning.date, 'YYYY-MM-DD', 'DD.MM.YYYY');
				const date = formatClientDate(dunning.date);
				const actions = (
					<div>
						<Link to={`/dunning/${this.state.invoice.id}/${dunning.id}`}>{resources.str_show}</Link>						
						{ canCreateReminder ? this.state.invoice.state === InvoiceState.CANCELLED ? null : (
							<Link
								style={{ marginLeft: '10px' }}
								to={`/dunning/send/${this.state.invoice.id}/${dunning.id}`}
							>
								{resources.str_send}
							</Link>
						) : null
						}
					</div>
				);
				const dunningLevel = dunning.positions && dunning.positions[0] && dunning.positions[0].dunningLevel;
				let dunningLabel = '';

				switch (dunningLevel) {
					case 'paymentReminder':
						dunningLabel = resources.str_paymentRemainder;
						break;
					case 'firstReminder':
						dunningLabel = `1. + ${resources.str_warning}`;
						break;
					case 'secondReminder':
						dunningLabel = `2. + ${resources.str_warning}`;
						break;
					case 'lastReminder':
						dunningLabel = `${resources.str_latest} ${resources.str_warning}`;
						break;
				}

				const cells = [{ value: date }, { value: dunningLabel }, { value: actions }];
				dunningTable.rows.push({ cells });
			});
		}

		return dunningTable;
	}

	createStateBadge() {
		const { resources } = this.props;
		let badgeString = '';
		let iconClass = '';
		let badgeClass = '';

		switch (this.state.invoice.state) {
			case InvoiceState.DRAFT:
				badgeString = resources.str_draft;
				iconClass = 'icon-edit2';
				badgeClass = 'detail-view-badge-draft';
				break;
			case InvoiceState.LOCKED:
				iconClass = 'icon-offen';
				badgeString = resources.str_openSmall;
				break;
			case InvoiceState.PARTIALLY_PAID:
				iconClass = 'icon-teilbezahlt';
				badgeString = resources.str_partiallyPaid;
				break;
			case InvoiceState.PAID:
				iconClass = 'icon-check';
				badgeString = resources.str_paid;
				badgeClass = 'detail-view-badge-paid';
				break;
			case InvoiceState.CANCELLED:
				iconClass = 'icon-storniert';
				badgeString = resources.str_canceled;
				badgeClass = 'detail-view-badge-cancelled';
				break;
			case InvoiceState.DUNNED:
				iconClass = 'icon-ueberfaellig';
				badgeString = resources.str_calledFor;
				badgeClass = 'detail-view-badge-overdue';
				break;
		}

		if (this.state.invoice.isOverDue) {
			iconClass = 'icon-ueberfaellig';
			badgeString = resources.str_overdue;
			badgeClass = 'detail-view-badge-overdue';
		}

		return (
			<div className={`detail-view-badge ${badgeClass}`}>
				<i className={`icon ${iconClass}`} />
				<div className="detail-view-badge-text">{badgeString}</div>
			</div>
		);
	}

	afterDunningRecipientModalClose(activateAfterClose, invoice) {
		this.setState({ invoice }, () => {
			if (activateAfterClose && !invoice.autoDunningEnabled && invoice.dunningRecipients.length > 0) {
				this.onAutoDunningChange(true);
			} else if (invoice.dunningRecipients.length === 0) {
				invoice.autoDunningEnabled = false;
				this.setState({ invoice });
				this.refs['autoDunningToggle'].setChecked(false);
			}
		});
	}

	openDunningRecipientModal(activateAfterClose) {
		const { invoice } = this.state;
		const { resources } = this.props;
		ModalService.open(
			<DunningRecipientModalComponent
				invoice={invoice}
				onError={() => {}}
				onSave={recipients => {
					invoice.dunningRecipients = recipients;
				}}
				resources={resources}
			/>,
			{
				width: 440,
				modalClass: 'dunning-recipient-modal-component',
				afterClose: () => {
					this.afterDunningRecipientModalClose(activateAfterClose, invoice);
				}
			}
		);
	}
}

export default InvoiceDetailComponent;
