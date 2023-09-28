import invoiz from "services/invoiz.service";
import React from "react";
import config from "config";
import moment from "moment";
import { createDetailViewInvoiceListObjects } from "helpers/invoice/createDetailViewInvoiceListObjects";
import RecurringInvoiceAction from "enums/recurring-invoice/recurring-invoice-action.enum";
import ListComponent from "shared/list/list.component";
import NotesComponent from "shared/notes/notes.component";
import TopbarComponent from "shared/topbar/topbar.component";
import DetailViewHeadComponent from "shared/detail-view/detail-view-head.component";
import { copyAndEditTransaction } from "helpers/transaction/copyAndEditTransaction";
import ButtonComponent from "shared/button/button.component";
import { formatCurrency } from "helpers/formatCurrency";
import RecurringInvoiceState from "enums/recurring-invoice/recurring-invoice-state.enum";
import ModalService from "services/modal.service";
import { updateSubscriptionDetails } from "helpers/updateSubsciptionDetails";
import { handleTransactionErrors } from "helpers/errors";
import { printPdf } from "helpers/printPdf";
import { downloadPdf } from "helpers/downloadPdf";
import LoadingService from "services/loading.service";
import { errorCodes } from "helpers/constants";
import { Link } from "react-router-dom";
import InvoiceAction from "enums/invoice/invoice-action.enum";
import { formatApiDate } from "helpers/formatDate";
import { format } from "util";
import { connect, Provider } from "react-redux";
import userPermissions from "enums/user-permissions.enum";

const createTopbarButtons = (recInvoice, resources) => {
	const buttons = [];

	switch (recInvoice.state) {
		case RecurringInvoiceState.DRAFT:
			buttons.push({
				type: "default",
				label: resources.str_toEdit,
				buttonIcon: "icon-edit2",
				action: RecurringInvoiceAction.EDIT,
				dataQsId: "recurringInvoiceDetail-topbar-btn-edit",
			});
			buttons.push({
				type: "primary",
				label: resources.str_startSubscription,
				buttonIcon: "icon-reload",
				action: RecurringInvoiceAction.START_SUBSCRIPTION,
				dataQsId: "recurringInvoiceDetail-topbar-btn-start",
			});
			break;

		case RecurringInvoiceState.STARTED:
			buttons.push({
				type: "primary",
				label: resources.str_endSubscription,
				buttonIcon: "icon-close",
				action: RecurringInvoiceAction.END_SUBSCRIPTION,
				dataQsId: "recurringInvoiceDetail-topbar-btn-close",
			});
			break;
	}

	return buttons;
};

const createTopbarDropdown = (recInvoice, resources) => {
	const items = [];

	switch (recInvoice.state) {
		case RecurringInvoiceState.DRAFT:
			items.push([
				{
					label: resources.str_copy_edit,
					action: RecurringInvoiceAction.COPY_AND_EDIT,
					dataQsId: "recurringInvoice-topbar-popoverItem-copyAndEdit",
				},
				{
					label: resources.str_clear,
					action: RecurringInvoiceAction.DELETE,
					dataQsId: "recurringInvoice-topbar-popoverItem-delete",
				},
			]);
			break;

		case RecurringInvoiceState.STARTED:
			items.push([
				{
					label: resources.str_copy_edit,
					action: RecurringInvoiceAction.COPY_AND_EDIT,
					dataQsId: "recurringInvoice-topbar-popoverItem-copyAndEdit",
				},
			]);
			break;

		case RecurringInvoiceState.FINISHED:
			items.push([
				{
					label: resources.str_copy_edit,
					action: InvoiceAction.COPY_AND_EDIT,
					dataQsId: "recurringInvoice-topbar-popoverItem-copyAndEdit",
				},
			]);
			break;
	}

	return items;
};

const createDetailViewHeadObjects = (recInvoice, activeAction, resources) => {
	const object = {
		leftElements: [],
		rightElements: [],
		actionElements: [],
	};

	object.actionElements.push(
		{
			name: resources.str_pdf,
			icon: "icon-pdf",
			action: RecurringInvoiceAction.DOWNLOAD_PDF,
			actionActive: activeAction === RecurringInvoiceAction.DOWNLOAD_PDF,
			dataQsId: "recurringInvoice-head-action-downloadPdf",
		},
		{
			name: resources.str_print,
			icon: "icon-print2",
			action: RecurringInvoiceAction.PRINT,
			actionActive: activeAction === RecurringInvoiceAction.PRINT,
			dataQsId: "recurringInvoice-head-action-print",
		}
	);

	const customerId = recInvoice.template && recInvoice.template.invoice && recInvoice.template.invoice.customerId;

	object.leftElements.push({
		headline: resources.str_customer,
		value: <Link to={"/customer/" + customerId}>{recInvoice.name}</Link>,
	});

	const totalGross = recInvoice.template.invoice.totalGross;
	const amount = formatCurrency(totalGross);

	object.rightElements.push(
		{
			headline: resources.str_amount,
			value: amount,
		},
		{
			headline: resources.str_aboStart,
			value: recInvoice.displayStartDate,
		},
		{
			headline: resources.str_repeat,
			value: recInvoice.displayRecurrence,
		},
		{
			headline: resources.str_next,
			value: recInvoice.displayNextDate,
		}
	);

	return object;
};

const createTopbarPermissionButtons = (topbarButtons, permissions, resources) => {
	const { canUpdateRecurringInvoice, canStartRecurringInvoice, canFinishRecurringInvoice } = permissions;
	if (canUpdateRecurringInvoice && canStartRecurringInvoice) {
		topbarButtons.filter(
			(btn) => btn.label === resources.str_toEdit && btn.label === resources.str_startSubscription
		);
		return topbarButtons;
	}

	if (canFinishRecurringInvoice) {
		topbarButtons.filter((btn) => btn.label === resources.str_endSubscription);
		return topbarButtons;
	}
};

class RecurringInvoiceDetailComponent extends React.Component {
	constructor(props) {
		super(props);

		const recInvoice = this.props.recurringInvoice || {};

		this.state = {
			viewportWidth: window.innerWidth,
			recInvoice,
			downloading: false,
			printing: false,
			canDownloadInvoice: null,
			canSendInvoice: null,
			canCopyInvoice: null,
			canPrintInvoice: null,
			canCreateRecurringInvoice: null,
			canUpdateRecurringInvoice: null,
			canDeleteRecurringInvoice: null,
			canViewRecurringInvoice: null,
			canStartRecurringInvoice: null,
			canFinishRecurringInvoice: null,
			submenuVisible: this.props.isSubmenuVisible,
		};
	}

	componentDidUpdate(prevProps) {
		const { isSubmenuVisible } = this.props;

		if (prevProps.isSubmenuVisible !== isSubmenuVisible) {
			this.setState({ submenuVisible: isSubmenuVisible });
		}
	}

	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_RECURRING_INVOICE)) {
			invoiz.user.logout(true);
		}
		this.setState({
			canDownloadInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.DOWNLOAD_INVOICE),
			canPrintInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.PRINT_INVOICE),
			canSendInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.SEND_INVOICE),
			canCopyInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.COPY_LINK_INVOICE),
			canCreateRecurringInvoice:
				invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_RECURRING_INVOICE),
			canDeleteRecurringInvoice:
				invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_RECURRING_INVOICE),
			canUpdateRecurringInvoice:
				invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_RECURRING_INVOICE),
			canViewRecurringInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_RECURRING_INVOICE),
			canStartRecurringInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.START_RECURRING_INVOICE),
			canFinishRecurringInvoice:
				invoiz.user && invoiz.user.hasPermission(userPermissions.FINISH_RECURRING_INVOICE),
		});
	}

	render() {
		const { resources } = this.props;
		const {
			canCopyInvoice,
			canDownloadInvoice,
			canPrintInvoice,
			canSendInvoice,
			canStartRecurringInvoice,
			canUpdateRecurringInvoice,
			canDeleteRecurringInvoice,
			submenuVisible,
		} = this.state;
		const topbarButtons = createTopbarButtons(this.state.recInvoice, resources);
		const topbarPermittedButtons = createTopbarPermissionButtons(topbarButtons, this.state, resources);
		const topbarDropdownItems = createTopbarDropdown(this.state.recInvoice, resources);
		const activeAction = this.state.downloading
			? RecurringInvoiceAction.DOWNLOAD_PDF
			: this.state.printing
			? RecurringInvoiceAction.PRINT
			: null;
		const headContents = createDetailViewHeadObjects(this.state.recInvoice, activeAction, resources);
		const invoicesTable = createDetailViewInvoiceListObjects(this.state.recInvoice.invoices);

		const detailHeadContent =
			canSendInvoice && canDownloadInvoice && canCopyInvoice && canPrintInvoice ? (
				<DetailViewHeadComponent
					controlActionCallback={(action) => this.onHeadControlClick(action)}
					actionElements={headContents.actionElements}
					leftElements={headContents.leftElements}
					rightElements={headContents.rightElements}
				/>
			) : (
				<DetailViewHeadComponent
					controlActionCallback={(action) => this.onHeadControlClick(action)}
					// actionElements={headContents.actionElements}
					leftElements={headContents.leftElements}
					rightElements={headContents.rightElements}
				/>
			);

		let emptyFallbackElement = null;

		if (this.state.recInvoice.state === RecurringInvoiceState.DRAFT) {
			emptyFallbackElement = (
				<div>
					<h3>{resources.recurringStartNow}</h3>
					<ButtonComponent
						buttonIcon={"icon-reload"}
						label={resources.str_startSubscription}
						callback={() => this.startSubscription()}
						disabled={!canStartRecurringInvoice}
					/>
				</div>
			);
		}

		const classLeft = submenuVisible ? "alignRecurringLeft" : "";

		return (
			<div className={`recurring-invoice-detail-wrapper wrapper-has-topbar ${classLeft}`}>
				{canUpdateRecurringInvoice && canDeleteRecurringInvoice ? (
					<TopbarComponent
						title={resources.str_subscriptionAccount}
						buttonCallback={(event, button) => this.handleTopbarButtonClick(event, button)}
						backButtonRoute={"invoices/recurringInvoice"}
						dropdownEntries={topbarDropdownItems.length > 0 ? topbarDropdownItems : null}
						dropdownCallback={(entry) => this.handleTopbarDropdownClick(entry)}
						buttons={topbarPermittedButtons}
					/>
				) : (
					<TopbarComponent
						title={resources.str_subscriptionAccount}
						buttonCallback={(event, button) => this.handleTopbarButtonClick(event, button)}
						backButtonRoute={"invoices/recurringInvoice"}
						buttons={topbarPermittedButtons}
					/>
				)}
				<div className="detail-view-head-container">
					{detailHeadContent}

					<div className="recurring-invoice-detail-recipient-wrapper">
						<div className="recurring-invoice-detail-recipient">
							<span class="icon icon-mail"></span>
							<span>{resources.str_willBeSentOn}:</span> {this.state.recInvoice.recipient}
						</div>
					</div>
				</div>
				<div className="detail-view-document" style={{ visibility: "hidden" }} />
				<div className="detail-view-content-wrapper">
					<div className="detail-view-content-left">
						<div className="detail-view-box-new u_mt_20">
							<ListComponent
								title={resources.str_createdBills}
								clickable={true}
								rowCallback={(id) => this.onInvoiceRowClick(id)}
								columns={invoicesTable.columns}
								rows={invoicesTable.rows}
								placeholderRow={{
									cells: [
										{ value: resources.str_automAward },
										{ value: this.state.recInvoice.displayStartDate },
										{ value: resources.str_draft },
										{ value: formatCurrency(this.state.recInvoice.template.invoice.totalGross) },
									],
								}}
								emptyFallbackElement={emptyFallbackElement}
								tableId={`invoices`}
								resources={resources}
							/>
						</div>
					</div>
					<div className="detail-view-content-right">
						<div className="detail-view-box-new u_mt_20">
							<NotesComponent
								heading={resources.str_remarks}
								data={{ notes: this.state.recInvoice.notes }}
								onSave={(value) => this.onNotesChange(value.notes)}
								resources={resources}
								placeholder={format(
									resources.defaultCommentsPlaceholderText,
									resources.str_recurringInvoiceSmall
								)}
								defaultFocus={true}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	onHeadControlClick(action) {
		const { resources } = this.props;
		switch (action) {
			case RecurringInvoiceAction.DOWNLOAD_PDF:
				this.setState({ downloading: true }, () => {
					invoiz
						.request(
							`${config.resourceHost}invoice/${this.state.recInvoice.template.invoice.id}/document`,
							{
								auth: true,
								method: "POST",
								data: {
									isPrint: false,
								},
							}
						)
						.then((response) => {
							const { path } = response.body.data;
							downloadPdf({
								pdfUrl: config.imageResourceHost + path,
								title: resources.str_subscriptionAccount,
								isPost: false,
								callback: () => {
									this.setState({ downloading: false });
								},
							});
						});
				});
				break;

			case RecurringInvoiceAction.PRINT:
				this.setState({ printing: true }, () => {
					invoiz
						.request(
							`${config.resourceHost}invoice/${this.state.recInvoice.template.invoice.id}/document`,
							{
								auth: true,
								method: "POST",
								data: {
									isPrint: true,
								},
							}
						)
						.then((response) => {
							const { path } = response.body.data;
							printPdf({
								pdfUrl: config.imageResourceHost + path,
								isPost: false,
								callback: () => {
									this.setState({ printing: false });
								},
							});
						});
				});
				break;
		}
	}

	onNotesChange(notes) {
		invoiz.request(`${config.recurringInvoice.resourceUrl}/${this.state.recInvoice.id}/notes`, {
			auth: true,
			method: "PUT",
			data: {
				notes,
			},
		});
	}

	onInvoiceRowClick(invoiceId) {
		invoiz.router.navigate(`invoice/${invoiceId}`);
	}

	edit() {
		invoiz.router.navigate(`/recurringinvoice/edit/${this.state.recInvoice.id}`);
	}

	copyAndEdit() {
		const { resources } = this.props;
		LoadingService.show(resources.recurringCopyInvoice);
		copyAndEditTransaction({
			invoiceModel: this.state.recInvoice,
			onCopySuccess: () => {
				LoadingService.hide();
			},
			onCopyError: () => {
				LoadingService.hide();
			},
		});
	}

	delete() {
		const { resources } = this.props;
		ModalService.open(resources.recurringDeleteMessage, {
			headline: resources.recurringDeleteInvoiceText,
			cancelLabel: resources.str_abortStop,
			confirmLabel: resources.str_clear,
			confirmIcon: "icon-trashcan",
			confirmButtonType: "secondary",
			onConfirm: () => {
				invoiz
					.request(`${config.offer.resourceUrl}/${this.state.recInvoice.id}`, {
						auth: true,
						method: "DELETE",
					})
					.then(() => {
						ModalService.close();
						invoiz.showNotification(resources.recurringDeleteSuccessMessage);
						invoiz.router.navigate("/invoices/recurringInvoice");
					})
					.catch((xhr) => {
						if (xhr) {
							invoiz.showNotification({
								type: "error",
								message: resources.defaultErrorMessage,
							});
						}
					});
			},
		});
	}

	startSubscription() {
		const { resources } = this.props;
		// const startDate = moment(this.state.recInvoice.startDate, config.dateFormat.client).format(
		// 	config.dateFormat.api
		// );
		const startDate = formatApiDate(this.state.recInvoice.startDate);
		// const today = moment().format(config.dateFormat.api);
		const today = formatApiDate();
		// if (moment(today).isAfter(startDate)) {
		// 	return invoiz.page.showToast({ type: 'error', message: resources.recurringInvoiceInvalidStartDateMessage });
		// }

		ModalService.open(resources.recurringLockModalContentText, {
			headline: resources.recurringLockModalHeading,
			confirmLabel: resources.str_startNow,
			confirmIcon: "icon-check",
			cancelLabel: resources.str_abortStop,
			loadingOnConfirmUntilClose: true,
			onConfirm: () => {
				invoiz
					.request(`${config.recurringInvoice.resourceUrl}/${this.state.recInvoice.id}/start`, {
						auth: true,
						method: "PUT",
					})
					.then(() => {
						ModalService.close();
						invoiz.router.reload();
						invoiz.page.showToast({ message: resources.recurringInvoiceStartSuccessMessage });
					})
					.then(updateSubscriptionDetails())
					.catch((error) => {
						ModalService.close();
						if (error.body.meta.number && error.body.meta.number[0].code === errorCodes.TOO_MANY) {
							invoiz.page.showToast({
								type: "error",
								message: resources.invoiceNumberRangeExceedMessage,
							});
							return;
						}
						handleTransactionErrors(error.body.meta);
					});
			},
		});
	}

	endSubscription() {
		const { resources } = this.props;
		const formattedCosts = formatCurrency(this.state.recInvoice.template.invoice.totalGross);

		ModalService.open(
			<div className="ampersand-delete-modal-content">
				<div>{resources.recurringFinishConfirmText}</div>
				<ul>
					<li>
						<b>{resources.str_recipient}:</b> <span>{this.state.recInvoice.name}</span>
					</li>
					<li>
						<b>{resources.str_amount}:</b> <span>{formattedCosts}</span>
					</li>
					<li>
						<b>{resources.str_repeat}:</b> <span>{this.state.recInvoice.displayRecurrence}</span>
					</li>
				</ul>
			</div>,
			{
				width: 500,
				headline: resources.recurringFinishConfirmCaption,
				cancelLabel: resources.str_abortStop,
				confirmIcon: "icon-check",
				confirmLabel: resources.str_breakUp,
				confirmButtonType: "secondary",
				onConfirm: () => {
					ModalService.close();
					invoiz
						.request(`${config.recurringInvoice.resourceUrl}/${this.state.recInvoice.id}/finish`, {
							auth: true,
							method: "PUT",
						})
						.then(() => {
							updateSubscriptionDetails();
							invoiz.router.reload();
							invoiz.page.showToast({ message: resources.recurringInvoiceFinishSuccessMessage });
						})
						.catch((xhr) => {
							if (xhr) {
								invoiz.page.showToast({
									type: "error",
									message: resources.recurringInvoiceFinishErrorMessage,
								});
							}
						});
				},
			}
		);
	}

	handleTopbarButtonClick(event, button) {
		switch (button.action) {
			case RecurringInvoiceAction.START_SUBSCRIPTION:
				this.startSubscription();
				break;

			case RecurringInvoiceAction.END_SUBSCRIPTION:
				this.endSubscription();
				break;

			case RecurringInvoiceAction.EDIT:
				this.edit();
				break;
		}
	}

	handleTopbarDropdownClick(item) {
		switch (item.action) {
			case RecurringInvoiceAction.EDIT:
				this.edit();
				break;

			case RecurringInvoiceAction.COPY_AND_EDIT:
				this.copyAndEdit();
				break;

			case RecurringInvoiceAction.DELETE:
				this.delete();
				break;
		}
	}
}

const mapStateToProps = (state) => {
	const isSubmenuVisible = state.global.isSubmenuVisible;
	const { resources } = state.language.lang;
	return {
		resources,
		isSubmenuVisible,
	};
};

export default connect(mapStateToProps, null)(RecurringInvoiceDetailComponent);

// export default RecurringInvoiceDetailComponent;
