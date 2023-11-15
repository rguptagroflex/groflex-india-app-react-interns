import invoiz from "services/invoiz.service";
import React from "react";
import _, { capitalize } from "lodash";
import config from "config";
import lang from "lang";
import accounting from "accounting";
import TopbarComponent from "shared/topbar/topbar.component";
import InvoiceState from "enums/invoice/invoice-state.enum";
import InvoiceAction from "enums/invoice/invoice-action.enum";
import { format } from "util";
import { formatDate } from "helpers/formatDate";
import { formatCurrency } from "helpers/formatCurrency";
import { formatClientDate, formatApiDate } from "helpers/formatDate";
import { copyAndEditTransaction } from "helpers/transaction/copyAndEditTransaction";
import Payment from "models/payment.model";
import HistoryItem from "models/history-item.model";
// import Todo from 'models/todo.model';
import InvoiceAutodunningComponent from "shared/invoice-autodunning/invoice-autodunning.component";
import NotesComponent from "shared/notes/notes.component";
import ErrorCodes from "enums/error-codes.enum";
import ListComponent from "shared/list/list.component";
import ModalService from "services/modal.service";
import { DetailViewConstants, errorCodes } from "helpers/constants";
import { updateSubscriptionDetails } from "helpers/updateSubsciptionDetails";
import { handleTransactionErrors } from "helpers/errors";
import { handleNotificationErrorMessage } from "helpers/errorMessageNotification";
import { checkAchievementNotification } from "helpers/checkAchievementNotification";
// import { checkOnboardingNotification } from 'helpers/checkOnboardingNotification';
import DetailViewHeadPrintPopoverComponent from "shared/detail-view/detail-view-head-print-popover.component";
import TransactionPrintSetting from "enums/transaction-print-setting.enum";
import { printPdf, printPdfPrepare } from "helpers/printPdf";
import { downloadPdf } from "helpers/downloadPdf";
import PopoverComponent from "shared/popover/popover.component";
import LoadingService from "services/loading.service";
import CancelInvoiceModalComponent from "shared/modals/cancel-invoice-modal.component";
import DeleteCancelInvoiceModalComponent from "shared/modals/delete-cancel-invoice-modal.component";
import DunningRecipientModalComponent from "shared/modals/dunning-recipient-modal.component";
import PaymentCreateModalComponent from "shared/modals/payment-create-modal.component";
import ClearDuesModalComponent from "shared/modals/clear-dues.modal.component";
import { connect, Provider } from "react-redux";
import CreateDunningModalComponent from "shared/modals/create-dunning-modal.component";
//import DeletePaymentModalComponent from 'shared/modals/delete-payment-modal.component';
// import DeliveryNote from 'models/delivery-note.model';
// import FeedbackModalComponent from 'shared/modals/feedback-modal.component';
import IconButtonComponent from "shared/button/icon-button.component";
import { createActivityOptions } from "helpers/createActivityOptions";
// import TodoActivityTabsComponent from 'shared/todo-activity-tabs/todo-activity-tabs.component';
// import TodoItem from 'shared/todo/todo-item.component';
import HistoryItemComponent from "shared/history/history-item.component";
import PdfPreviewComponent from "shared/pdf-preview/pdf-preview.component";
import PerfectScrollbar from "perfect-scrollbar";
import LoaderComponent from "shared/loader/loader.component";
import { Link } from "react-router-dom";
import Customer from "models/customer.model";
import {
	PAYMENT_TYPE_LESS_BANKCHARGE,
	PAYMENT_TYPE_LESS_DISCOUNT,
	PAYMENT_TYPE_LESS_TDSCHARGE,
} from "../../helpers/constants";
import planPermissions from "enums/plan-permissions.enum";
import abbreviationDateFormat, { dateObjToAbbreviation } from "../../helpers/abbreviationDateFormat";
import DetailViewHeadAdvancedComponent from "shared/detail-view/detail-view-head-advanced.component";
import DetailViewHeadComponent from "../../shared/detail-view/detail-view-head.component";
import DetailViewHeadPrintTooltipComponent from "../../shared/detail-view/detail-view-head-print-tooltip.component";

const createTopbarDropdown = (invoice, resources) => {
	const items = [];
	switch (invoice.state) {
		case InvoiceState.DRAFT:
			items.push([
				{
					label: resources.str_copy_edit,
					action: InvoiceAction.COPY_AND_EDIT,
					dataQsId: "invoice-topbar-popoverItem-copyAndEdit",
				},
				{
					label: resources.str_clear,
					action: InvoiceAction.DELETE,
					dataQsId: "invoice-topbar-popoverItem-delete",
				},
			]);
			break;

		case InvoiceState.LOCKED:
			if (invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_CREDIT_NOTE)) {
				items.push([
					{
						label: resources.str_cancel + "/" + resources.str_clear,
						action: InvoiceAction.DELETE_AND_CANCEL,
						dataQsId: "invoice-topbar-popoverItem-delete",
					},
				]);
			} else {
				items.push([
					{
						label: resources.str_copy_edit,
						action: InvoiceAction.COPY_AND_EDIT,
						dataQsId: "invoice-topbar-popoverItem-copyAndEdit",
					},
					{
						label: resources.str_cancel + "/" + resources.str_clear,
						action: InvoiceAction.DELETE_AND_CANCEL,
						dataQsId: "invoice-topbar-popoverItem-delete",
					},
				]);
			}
			break;

		case InvoiceState.DUNNED:
			items.push([
				{
					label: resources.str_copy_edit,
					action: InvoiceAction.COPY_AND_EDIT,
					dataQsId: "invoice-topbar-popoverItem-copyAndEdit",
				},
				{
					label: resources.str_cancel + "/" + resources.str_clear,
					action: InvoiceAction.DELETE_AND_CANCEL,
					dataQsId: "invoice-topbar-popoverItem-delete",
				},
			]);
			break;

		case InvoiceState.PAID:
		case InvoiceState.PARTIALLY_PAID:
			if (invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_CREDIT_NOTE)) {
				items.push([
					{
						label: resources.str_copy_edit,
						action: InvoiceAction.COPY_AND_EDIT,
						dataQsId: "invoice-topbar-popoverItem-copyAndEdit",
					},
				]);
			} else {
				items.push(
					[
						{
							label: resources.str_copy_edit,
							action: InvoiceAction.COPY_AND_EDIT,
							dataQsId: "invoice-topbar-popoverItem-copyAndEdit",
						},
					],
					[
						{
							label: resources.str_cancel,
							action: InvoiceAction.CANCEL,
							dataQsId: "invoice-topbar-popoverItem-cancel",
						},
					]
				);
			}

			break;

		case InvoiceState.CANCELLED:
			items.push([
				{
					label: resources.str_copy_edit,
					action: InvoiceAction.COPY_AND_EDIT,
					dataQsId: "invoice-topbar-popoverItem-copyAndEdit",
				},
			]);
			break;
	}

	return items;
};

const allowedPaymentTypesForCancel = [
	PAYMENT_TYPE_LESS_BANKCHARGE,
	PAYMENT_TYPE_LESS_DISCOUNT,
	PAYMENT_TYPE_LESS_TDSCHARGE,
];

const createTopbarButtons = (invoice, state, options, resources) => {
	const buttons = [];
	if (invoice.isOverDue) {
		buttons.push({
			type: "default",
			label: resources.str_createRemainder,
			buttonIcon: "icon-mahnen",
			action: InvoiceAction.DUN,
			dataQsId: "invoiceDetail-topbar-btn-createDunning",
			//disabled: !state.canCreateReminder
		});
	}

	switch (invoice.state) {
		case InvoiceState.DRAFT:
			buttons.push({
				type: "default",
				label: resources.str_toEdit,
				buttonIcon: "icon-edit2",
				action: InvoiceAction.EDIT,
				dataQsId: "invoiceDetail-topbar-btn-editInvoice",
			});
			buttons.push({
				type: "primary",
				label: resources.str_toLock,
				buttonIcon: "icon-check",
				action: InvoiceAction.LOCK,
				dataQsId: "invoiceDetail-topbar-btn-lockInvoice",
				//disabled: !state.canCloseInvoice
			});
			break;

		case InvoiceState.LOCKED:
		case InvoiceState.DUNNED:
		case InvoiceState.PARTIALLY_PAID:
			buttons.push({
				type: "primary",
				label: resources.str_registerPayment,
				buttonIcon: "icon-check",
				action: InvoiceAction.CREATE_PAYMENT,
				dataQsId: "invoiceDetail-topbar-btn-createPayment",
			});
			break;
	}

	// if (invoice.isOverDue) {
	// 	buttons.push({
	// 		type: 'danger',
	// 		label: resources.str_createRemainder,
	// 		buttonIcon: 'icon-mahnen',
	// 		action: InvoiceAction.DUN,
	// 		dataQsId: 'invoiceDetail-topbar-btn-createDunning',
	// 		//disabled: !state.canCreateReminder
	// 	});
	// }

	return buttons;
};

const createDetailViewHeadObjects = (invoice, activeAction, letterPaperType, resources) => {
	//const { email, phone1, phone2, mobile } = invoice.customer;
	//const phone = phone1 || phone2 || mobile;
	const object = {
		leftElements: [],
		rightElements: [],
		actionElements: [],
	};
	let subHeadline = null;
	let valueDetails = null;

	//	if ((invoice.customer && email) || phone) {
	// valueDetails = (
	// 	<React.Fragment>
	// 		{/* {email && ( */}
	// 			<div className="u_vc">
	// 				Send e-mail
	// 				<IconButtonComponent
	// 					dataQsId="invoiceDetail-head-action-email-customer"
	// 					icon="icon-mail"
	// 					size="medium"
	// 					wrapperClass="u_ml_10"
	// 					callback={() => invoiz.router.navigate(`invoice/send/${invoice.id}`)}
	// 				/>
	// 			</div>
	// 		{/* )} */}
	// 		{/* {phone && <div className="u_mt_10">Tel.: {phone}</div>} */}
	// 	</React.Fragment>
	// );
	//}

	// if (invoice.project) {
	// 	const projectId = invoice.project.id;
	// 	const projectName = invoice.project.title;

	// 	subHeadline = (
	// 		<div className="detail-view-head-sub-value-project">
	// 			<span>Projekt:</span>{' '}
	// 			{invoiz.user.isAppEnabledProjects() ? (
	// 				<a onClick={() => invoiz.router.redirectTo(`/project/${projectId}`, false, false, true)}>
	// 					{projectName}
	// 				</a>
	// 			) : (
	// 				<a
	// 					onClick={() =>
	// 						invoiz.showNotification({
	// 							type: 'error',
	// 							message:
	// 								'Modul nicht freigeschaltet. Bitte aktiviere das Modul "Abschläge" im App Store.',
	// 						})
	// 					}
	// 				>
	// 					{projectName}
	// 				</a>
	// 			)}
	// 		</div>
	// 	);
	// }

	if (invoice.recurringInvoiceId) {
		// subHeadline = (
		// 	<div>
		// 		{invoiz.user.isAppEnabledRecurringInvoices() ? (
		// 			<a
		// 				onClick={() =>
		// 					invoiz.router.redirectTo(
		// 						`/recurringinvoice/${invoice.recurringInvoiceId}`,
		// 						false,
		// 						false,
		// 						true
		// 					)
		// 				}
		// 			>
		// 				Aus Abo-Rechnung erstellt
		// 			</a>
		// 		) : (
		// 			<a
		// 				onClick={() =>
		// 					invoiz.showNotification({
		// 						type: 'error',
		// 						message:
		// 							'Modul nicht freigeschaltet. Bitte aktiviere das Modul "Abo-Rechnungen" im App Store.',
		// 					})
		// 				}
		// 			>
		// 				Aus Abo-Rechnung erstellt
		// 			</a>
		// 		)}
		// 	</div>
		// );
		subHeadline = (
			<div>
				<Link to={`/recurringinvoice/${invoice.recurringInvoiceId}`}>
					{resources.subscriptionInvoiceCreateText}
				</Link>
			</div>
		);
	}

	if (invoice.offer) {
		const id = invoice.offer.id;
		const title = invoice.offer.number;
		const isImpress = invoice.offer.type === "impress";

		subHeadline = (
			<div>
				Quotation:{" "}
				<a
					onClick={() =>
						invoiz.router.redirectTo(`/offer/${isImpress ? "impress/" : ""}${id}`, false, false, true)
					}
				>
					{title}
				</a>
			</div>
		);
	}

	// if (invoice.state !== InvoiceState.DRAFT) {
	// 	object.actionElements.push({
	// 		name: 'Copy or e-mail invoice link',
	// 		icon: 'icon-copy',
	// 		action: InvoiceAction.COPY_CUSTOMERCENTER_LINK,
	// 		dataQsId: 'invoiceDetail-head-action-copylink',
	// 		controlsItemClass: 'item-copy',
	// 		id: 'detail-head-copy-link-popover-anchor',
	// 	});
	// }

	if (invoice.state !== InvoiceState.DRAFT) {
		object.actionElements.push({
			name: "Send e-mail",
			icon: "icon-mail",
			action: InvoiceAction.EMAIL,
			dataQsId: "invoiceDetail-head-action-email",
		});
	}

	object.actionElements.push(
		{
			name: "Save PDF",
			icon: "icon-pfeil icon-rotate-180",
			action: InvoiceAction.DOWNLOAD_PDF,
			actionActive: activeAction === InvoiceAction.DOWNLOAD_PDF,
			dataQsId: "invoiceDetail-head-action-download",
		},
		{
			name: "Print",
			icon: "icon-print2",
			action: InvoiceAction.PRINT,
			actionActive: activeAction === InvoiceAction.PRINT,
			dataQsId: "invoiceDetail-head-action-print",
			controlsItemClass: "item-print",
			id: "detail-head-print-anchor",
			labelAction: InvoiceAction.SHOW_PRINT_SETTINGS_POPOVER,
			labelHint:
				letterPaperType === TransactionPrintSetting.DEFAULT_LETTER_PAPER ? "Blank paper" : "Own stationery",
		}
	);

	object.leftElements.push({
		headline: resources.str_customer,
		value:
			invoice.displayCustomerNumber < 0 ? (
				invoice.displayName
			) : (
				<a onClick={() => invoiz.router.redirectTo("/customer/" + invoice.customerId, false, false, true)}>
					{invoice.displayName}
				</a>
			),
		subValue: subHeadline,
		valueDetails,
	});

	const amount = formatCurrency(invoice.totalGross);
	const outstandingAmount = formatCurrency(invoice.outstandingAmount);
	const paidAmount = formatCurrency(invoice.totalGross - invoice.outstandingAmount);
	object.rightElements.push({
		headline: invoice.state === InvoiceState.PARTIALLY_PAID ? resources.outstandingBalanceText : `Invoice amount`,
		value: invoice.state === InvoiceState.PARTIALLY_PAID ? outstandingAmount : amount,
	});

	if (invoice.state === InvoiceState.PARTIALLY_PAID) {
		object.rightElements.push({
			headline: resources.str_alreadyPaid,
			value: paidAmount,
		});
	}

	if (invoice.state === InvoiceState.CANCELLED) {
		object.rightElements.push({
			headline: resources.str_alreadyPaid,
			value: paidAmount,
		});
		object.rightElements.push({
			headline: resources.outstandingBalanceText,
			value: outstandingAmount,
		});
	}

	if (
		invoice.state !== InvoiceState.DRAFT &&
		invoice.state !== InvoiceState.PAID &&
		invoice.state !== InvoiceState.CANCELLED
	) {
		object.rightElements.push({
			headline: invoice.dueDateKind,
			value: invoice.dueDateSubString,
		});
	}

	if (invoice.state !== InvoiceState.DRAFT) {
		object.rightElements.push({
			headline: resources.invoiceDate,
			value: invoice.displayDate,
		});
	}
	return object;
};

class InvoiceDetailNewComponent extends React.Component {
	constructor(props) {
		super(props);

		const invoice = this.props.invoice || {};
		const dunnings = this.props.dunnings || [];

		this.state = {
			customerCenterLink: "",
			viewportWidth: window.innerWidth,
			dunnings,
			invoice,
			downloading: false,
			printing: false,
			autoDunningChanged: false,
			letterPaperType: invoice.printCustomDocument
				? TransactionPrintSetting.CUSTOM_LETTER_PAPER
				: TransactionPrintSetting.DEFAULT_LETTER_PAPER,
			pdf: null,
			showPdfPreview: false,
			activeTab: "activity",
			activityOptions: props.activityCategories ? createActivityOptions(props.activityCategories) : [],
			activityCategories: props.activityCategories,
			historyIsLoading: true,
			historyItems: [],
			// todoItems: [],
			// hideTodoActivityTabs: false,
			canvasWidth: null,
			submenuVisible: this.props.isSubmenuVisible,
		};

		this.perfectScrollbar = null;
		this.debounceResize = null;

		this.handleResize = this.handleResize.bind(this);
		this.onCategoryAdd = this.onCategoryAdd.bind(this);
		this.onTodoSubmit = this.onTodoSubmit.bind(this);
		this.onActivitySubmit = this.onActivitySubmit.bind(this);
		this.onChangeToDone = this.onChangeToDone.bind(this);
		this.onDeleteTodo = this.onDeleteTodo.bind(this);
		this.onChangeDueDate = this.onChangeDueDate.bind(this);
		this.onShowDunning = this.onShowDunning.bind(this);
		this.onSendDunning = this.onSendDunning.bind(this);
		this.onDeleteActivity = this.onDeleteActivity.bind(this);
		this.clearDues = this.clearDues.bind(this);
		this.registerInvoicePayment = this.registerInvoicePayment.bind(this);
		this.skipAndContinue = this.skipAndContinue.bind(this);

		this.pdfWrapper = React.createRef();
	}

	componentDidMount() {
		window.addEventListener("resize", this.handleResize);

		const { invoice } = this.state;
		//const { documentPath, triggerMe } = this.props;

		this.perfectScrollbar = new PerfectScrollbar(".invoice-history-scroll-container", {
			suppressScrollX: true,
		});

		this.getHistory();

		invoiz
			.request(`${config.invoice.resourceUrl}/${parseInt(invoice.id, 10)}/document`, {
				auth: true,
				method: "POST",
				data: {
					isPrint: false,
				},
			})
			.then((pdfPathResponse) => {
				const { path } = pdfPathResponse.body.data;
				invoice.pdfPath = config.imageResourceHost + path;
				fetch(invoice.pdfPath, {
					method: "GET",
				})
					.then((response) => response.arrayBuffer())
					.then((arrayBuffer) => PDFJS.getDocument(arrayBuffer))
					.then((pdf) => {
						this.setState({ pdf }, () => {
							this.renderPdf();
						});
					});
				// const { path } = pdfPathResponse.body.data;
				// invoice.pdfPath = config.imageResourceHost + path;
				// fetch(invoice.pdfPath, {
				// 	method: 'GET'
				// })
				// 	.then(response => response.arrayBuffer())
				// 	.then(arrayBuffer => PDFJS.getDocument(arrayBuffer))
				// 	.then(pdf => {
				// 		let currentPage = 1;
				// 		const numPages = pdf.numPages;
				// 		const myPDF = pdf;

				// 		const handlePages = page => {
				// 			const wrapper = document.getElementById('invoice-detail-pdf-wrapper');
				// 			const canvas = document.createElement('canvas');
				// 			canvas.width = '925';
				// 			const context = canvas.getContext('2d');
				// 			const viewport = page.getViewport(canvas.width / page.getViewport(1.0).width);
				// 			canvas.height = viewport.height;
				// 			page.render({
				// 				canvasContext: context,
				// 				viewport
				// 			});
				// 			wrapper.appendChild(canvas);
				// 			currentPage++;
				// 			if (currentPage <= numPages) {
				// 				myPDF.getPage(currentPage).then(handlePages);
				// 			}
				// 		};

				// 		myPDF.getPage(currentPage).then(handlePages);
				// 	});
			});

		// if (triggerMe) {
		// 	this.handleRatingModal();
		// }
	}

	componentWillUnmount() {
		window.removeEventListener("resize", this.handleResize);
	}
	componentDidUpdate(prevProps) {
		const { isSubmenuVisible } = this.props;

		if (prevProps.isSubmenuVisible !== isSubmenuVisible) {
			this.setState({ submenuVisible: isSubmenuVisible });
		}
	}

	getHistory() {
		invoiz
			.request(`${config.resourceHost}invoice/${this.state.invoice.id}/history`, {
				auth: true,
			})
			.then(({ body: { items } }) => {
				// const todoItems = openTodos.map((todo) => {
				// 	return new Todo(todo);
				// });
				const historyItems = items.map((item) => {
					return new HistoryItem(item);
				});

				this.setState({ historyItems, historyIsLoading: false }, () => {
					this.perfectScrollbar.update();
				});
			})
			.catch(({ body: { meta } }) => {
				handleNotificationErrorMessage(meta);
			});
	}

	getCustomerBalanceCreditNotes() {
		invoiz
			.request(`${config.customer.resourceUrl}/${customerId}`, {
				auth: true,
			})
			.then(() => {});
	}

	renderPdf() {
		let currentPage = 1;
		const { pdf } = this.state;
		const numPages = pdf.numPages;
		const myPDF = pdf;
		const wrapper = this.pdfWrapper && this.pdfWrapper.current;
		wrapper.innerHTML = "";

		const handlePages = (page) => {
			if (wrapper) {
				const canvas = document.createElement("canvas");
				// canvas.width = wrapper.getBoundingClientRect().width;
				canvas.width = "658";
				const context = canvas.getContext("2d");
				const viewport = page.getViewport(canvas.width / page.getViewport(1.0).width);
				canvas.height = viewport.height;
				page.render({
					canvasContext: context,
					viewport,
				});
				wrapper.appendChild(canvas);
				if (currentPage === 1) {
					this.setState({
						canvasWidth: canvas.width,
					});
				}
				currentPage++;
				if (currentPage <= numPages) {
					myPDF.getPage(currentPage).then(handlePages);
				}
			}
		};

		myPDF.getPage(currentPage).then(handlePages);
	}

	handleModalClose() {
		ModalService.close();
		setTimeout(() => {
			$(".modal-base-view").removeClass("narrow-modal");
		}, 300);
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
						method: "PUT",
						data: {
							autoDunningEnabled: value,
							dunningRecipients: this.state.invoice.dunningRecipients,
						},
					})
					.then(() => {
						const invoice = this.state.invoice;
						invoice.autoDunningEnabled = value;

						this.setState({ invoice });

						invoiz.showNotification({
							message: `Auto reminder setting was ${value ? "activated" : "deactivated"}`,
						});
					})
					.catch((response) => {
						const error = response.body && response.body.meta;

						if (error && error.dunningRecipients[0].code === ErrorCodes.NOT_EMPTY) {
							invoiz.showNotification({
								type: "error",
								message: resources.dunninRecipientEmptyRecipientsErrorMessage,
							});

							this.openDunningRecipientModal(true);
						} else {
							invoiz.showNotification({
								type: "error",
								message: `An error occurred while ${
									value ? "activating" : "deactivating"
								} the auto reminder setting!`,
							});
						}
					});
			}
		});
	}

	onHeadControlClick(action) {
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
							method: "POST",
							data: {
								isPrint: false,
							},
						})
						.then((pdfPathResponse) => {
							const { path } = pdfPathResponse.body.data;
							invoice.pdfPath = config.imageResourceHost + path;
							downloadPdf({
								pdfUrl: invoice.pdfPath,
								title: `Invoice ${invoice.state !== InvoiceState.DRAFT ? invoice.number : "Draft"}`,
								isPost: false,
								callback: () => {
									invoice.history.push({
										date: new Date(Date.now()).toISOString(),
										state: InvoiceState.DOWNLOADED,
									});

									this.getHistory();

									this.setState({ invoice, downloading: false });
								},
							});
						});
				});
				break;
			}

			case InvoiceAction.PRINT:
				const { invoice } = this.state;

				this.setState({ printing: true }, () => {
					printPdfPrepare({
						url: `${config.invoice.resourceUrl}/${parseInt(invoice.id, 10)}/document`,
						callback: (res) => {
							const { path } = res.body.data;

							printPdf({
								pdfUrl: config.imageResourceHost + path,
								isPost: false,
								callback: () => {
									invoice.history.push({
										date: new Date(Date.now()).toISOString(),
										state: InvoiceState.PRINTED,
									});

									this.getHistory();

									this.setState({ invoice, printing: false });
								},
							});
						},
					});
				});
				break;

			case InvoiceAction.SHOW_PRINT_SETTINGS_POPOVER:
				this.refs["detail-head-print-settings-popover"].show();
				break;

			case InvoiceAction.COPY_CUSTOMERCENTER_LINK:
				const customerCenterLinkElm = $("<input />", {
					value: this.state.customerCenterLink,
				});
				customerCenterLinkElm.appendTo("body");
				customerCenterLinkElm[0].select();
				document.execCommand("copy");
				customerCenterLinkElm.remove();
				invoiz.page.showToast({ message: "Copied invoice link" });
				break;
		}
	}

	onNotesChange(notes) {
		invoiz.request(`${config.invoice.resourceUrl}/${this.state.invoice.id}/notes`, {
			auth: true,
			method: "PUT",
			data: {
				notes,
			},
		});
	}

	addPayment() {
		const { customerId } = this.state.invoice;
		invoiz
			.request(`${config.customer.resourceUrl}/${customerId}`, {
				auth: true,
			})
			.then((response) => {
				const customer = new Customer(response.body.data);
				this.setState({ customer });
				/* if(customer.balance<0)
		  this.clearDues(customer)
		else this.registerInvoicePayment(customer)   */

				this.registerInvoicePayment(customer);
			});
	}

	skipAndContinue() {
		this.registerInvoicePayment(this.state.customer);
	}

	clearDues(customer) {
		let { displayName, id, balance } = customer;
		let { resources } = this.props;

		const openAmount = parseFloat(accounting.toFixed(-balance, 2), 10);

		const payment = new Payment({
			customerName: displayName,
			amount: openAmount,
			custId: id,
			notes: resources.duesNoteText,
		});

		const handlePaymentChange = (key, value) => (payment[key] = value);

		ModalService.open(
			<ClearDuesModalComponent
				customer={customer}
				handlePaymentChange={handlePaymentChange}
				skipAndContinue={this.skipAndContinue}
				payment={payment}
				resources={this.props.resources}
				onSave={() => invoiz.router.reload()}
			/>,
			{
				width: 600,
				modalClass: "payment-create-modal-component",
				afterOpen: () => {
					setTimeout(() => {
						$(".create-payment-amount-wrapper input").focus();
					});
				},
			}
		);
	}

	registerInvoicePayment(customer) {
		const openAmount = parseFloat(accounting.toFixed(this.state.invoice.outstandingAmount, 2), 10);
		const { id, displayName, number, type, customerId } = this.state.invoice;
		const { dunnings, invoice } = this.state;

		const payment = new Payment({
			customerName: displayName,
			invoiceId: id,
			invoiceNumber: number,
			invoiceType: type,
			amount: openAmount,
			custId: customerId,
			outstandingBalance: openAmount,
		});

		const dunning = dunnings.length > 0 && dunnings[0];

		if (dunning) {
			dunning.label = !_.isEmpty(invoice.metaData.currentDunning) ? invoice.metaData.currentDunning.label : "";
		}

		const handlePaymentChange = (key, value) => (payment[key] = value);

		setTimeout(() => {
			ModalService.open(
				<PaymentCreateModalComponent
					invoice={invoice}
					customer={customer}
					handlePaymentChange={handlePaymentChange}
					payment={payment}
					resources={this.props.resources}
					dunning={dunning}
					onSave={() => invoiz.router.reload()}
				/>,
				{
					width: 600,
					modalClass: "payment-create-modal-component",
					afterOpen: () => {
						setTimeout(() => {
							$(".create-payment-amount-wrapper input").focus();
						});
					},
				}
			);
		}, 500);
	}

	lock() {
		const { resources } = this.props;
		ModalService.open(resources.invoiceLockModalContentText, {
			headline: resources.invoiceLockModalHeading,
			confirmLabel: resources.str_finishNow,
			confirmIcon: "icon-check",
			cancelLabel: resources.str_abortStop,
			loadingOnConfirmUntilClose: true,
			onConfirm: () => {
				const url = `${config.invoice.resourceUrl}/${this.state.invoice.id}/lock`;
				invoiz
					.request(url, { auth: true, method: "PUT" })
					.then(() => {
						ModalService.close();
						invoiz.router.reload();
						invoiz.page.showToast({ message: resources.invoiceLockSuccessMessage });
						checkAchievementNotification();

						amplitude.getInstance().logEvent("created_invoice");
					})
					.then(updateSubscriptionDetails())
					.catch((error) => {
						ModalService.close();

						if (
							error.body.meta.useAdvancedPaymentOptions &&
							error.body.meta.useAdvancedPaymentOptions[0].code === errorCodes.INVALID
						) {
							invoiz.page.showToast({
								type: "error",
								message: resources.invoizPayInvoiceEditErrorMessage,
							});

							return;
						} else if (error.body.meta.number && error.body.meta.number[0].code === errorCodes.EXISTS) {
							invoiz.page.showToast({
								type: "error",
								message: resources.invoiceNumberAlreadyExistMessage,
							});
							return;
						} else if (error.body.meta.number && error.body.meta.number[0].code === errorCodes.TOO_MANY) {
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

	cancel() {
		const { invoice } = this.state;
		const { resources } = this.props;
		ModalService.open(<CancelInvoiceModalComponent invoice={invoice} resources={resources} />, {
			//headline: format(resources.invoiceCancelHeading, invoice.number),
			width: 800,
		});
	}

	copyAndEdit() {
		LoadingService.show("Copying invoice");
		copyAndEditTransaction({
			invoiceModel: this.state.invoice,
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
		ModalService.open(resources.deleteInvoiceWarningMessage, {
			headline: resources.str_deleteInvoice,
			cancelLabel: resources.str_abortStop,
			confirmLabel: resources.str_clear,
			confirmIcon: "icon-trashcan",
			confirmButtonType: "secondary",
			onConfirm: () => {
				ModalService.close();

				invoiz
					.request(`${config.invoice.resourceUrl}/${this.state.invoice.id}`, {
						auth: true,
						method: "DELETE",
					})
					.then(() => {
						invoiz.showNotification(resources.invoiceDeleteConfirmationMessage);
						invoiz.router.navigate("/invoices");
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

	deleteAndCancel() {
		const { invoice } = this.state;
		ModalService.open(
			<DeleteCancelInvoiceModalComponent invoice={invoice} isFromList={false} resources={this.props.resources} />,
			{
				width: 800,
				modalClass: "delete-cancel-invoice-modal-component",
			}
		);
	}

	dun() {
		const { resources } = this.props;
		if (_.isEmpty(this.state.invoice.metaData.nextDunning)) {
			invoiz.page.showToast({ type: "error", message: resources.dunningLastActiveDunningLevelReachedMessage });
			return;
		}

		const {
			metaData: { nextDunning: nextDunningLevel },
		} = this.state.invoice;

		ModalService.open(
			<CreateDunningModalComponent
				invoice={this.state.invoice}
				nextDunningLevel={nextDunningLevel}
				resources={resources}
			/>,
			{
				headline: resources.str_createPaymentReminder,
				modalClass: "create-dunning-modal-component",
				width: 650,
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
		const { invoice } = this.state;

		switch (item.action) {
			// case InvoiceAction.CREATE_DELIVERY_NOTE:
			// 	invoiz
			// 		.request(`${config.resourceHost}deliveryNote/${invoice.id}/convertFromInvoice`, {
			// 			method: 'POST',
			// 			auth: true,
			// 		})
			// 		.then((res) => {
			// 			const {
			// 				data: { id },
			// 			} = res.body;
			// 			invoiz.showNotification({
			// 				message: 'Der Lieferschein wurde erfolgreich erstellt',
			// 			});
			// 			invoiz.router.navigate(`/deliveryNote/${id}`, false, false, true);
			// 		})
			// 		.catch(() => {
			// 			invoiz.showNotification({
			// 				type: 'error',
			// 				message: lang.defaultErrorMessage,
			// 			});
			// 		});
			// 	break;

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
			this.renderPdf();
		}, 100);
	}

	createPaymentTable() {
		const paymentTable = {
			columns: [{ title: "", width: "92px" }, { title: "" }, { title: "", width: "90px", align: "right" }],
			rows: [],
		};

		if (this.state.invoice.state !== InvoiceState.CANCELLED) {
			paymentTable.columns.push({ title: "", width: "50px" });
		}

		if (this.state.invoice.payments) {
			this.state.invoice.payments.forEach((payment) => {
				payment = new Payment(payment);
				const amount = formatCurrency(payment.amount);
				const cells = [{ value: payment.displayDate }, { value: payment.notes }, { value: amount }];
				const isAllowed = _.includes(allowedPaymentTypesForCancel, payment.type);
				cells.push({
					value:
						!payment.cancellationPaymentId && isAllowed ? (
							<IconButtonComponent
								icon="icon-close"
								size="medium"
								wrapperClass="payment-cancel-button"
								callback={() => this.deletePayment(payment)}
							/>
						) : (
							""
						),
				});

				paymentTable.rows.push({ cells });
			});
		}

		return paymentTable;
	}

	deletePayment(payment) {
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
						.request(`${config.invoice.resourceUrl}/${this.state.invoice.id}/payment/${payment.id}`, {
							auth: true,
							method: "DELETE",
						})
						.then(() => {
							invoiz.router.reload();
						})
						.catch(() => {
							invoiz.page.showToast({
								type: "error",
								message: resources.defaultErrorMessage,
							});
						});
				},
			}
		);
	}

	createDeliveryNotesTable() {
		const {
			invoice: { deliveryNote },
		} = this.state;

		const deliveryNotesTable = {
			columns: [
				{ title: "Datum", width: "92px" },
				{ title: "Lieferschein-Nr." },
				{ title: "Lieferdatum" },
				{ title: "", width: "35px", align: "right" },
			],
			rows: [],
		};

		if (deliveryNote) {
			deliveryNote.forEach((dN) => {
				const note = new DeliveryNote(dN);
				const cells = [
					{ value: note.displayDate },
					{ value: note.displayNumber },
					{ value: note.displayDeliveryDate },
					{
						value: (
							<IconButtonComponent
								icon="icon-view"
								size="medium"
								wrapperClass="u_ml_10"
								callback={() =>
									invoiz.router.redirectTo(`/deliveryNote/${note.id}`, false, false, true)
								}
							/>
						),
					},
				];

				deliveryNotesTable.rows.push({ cells });
			});
		}

		return deliveryNotesTable;
	}

	createDunningTable() {
		const { resources } = this.props;
		const { canCreateReminder } = this.state;
		const dunningTable = {
			columns: [
				{ title: resources.str_date, width: "20%", resourceKey: "date" },
				{ title: resources.str_dunningLevel, resourceKey: "dunningLevel" },
				{ title: resources.str_actions, width: "25%", align: "right", resourceKey: "actions" },
			],
			rows: [],
		};

		if (this.state.dunnings) {
			this.state.dunnings.forEach((dunning) => {
				// const date = formatDate(dunning.date, 'YYYY-MM-DD', 'DD.MM.YYYY');
				// const date = formatClientDate(dunning.date);
				// console.log(dunning.date, "dunning");
				const date = dateObjToAbbreviation(dunning.date);

				const actions = (
					<div>
						<Link to={`/dunning/${this.state.invoice.id}/${dunning.id}`}>{resources.str_show}</Link>
						{canCreateReminder ? (
							this.state.invoice.state === InvoiceState.CANCELLED ? null : (
								<Link
									style={{ marginLeft: "10px" }}
									to={`/dunning/send/${this.state.invoice.id}/${dunning.id}`}
								>
									{resources.str_send}
								</Link>
							)
						) : null}
					</div>
				);
				const dunningLevel = dunning.positions && dunning.positions[0] && dunning.positions[0].dunningLevel;
				let dunningLabel = "";

				switch (dunningLevel) {
					case "paymentReminder":
						dunningLabel = resources.str_paymentRemainder;
						break;
					case "firstReminder":
						dunningLabel = `1. + ${resources.str_warning}`;
						break;
					case "secondReminder":
						dunningLabel = `2. + ${resources.str_warning}`;
						break;
					case "lastReminder":
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
		let badgeString = "";
		let iconClass = "";
		let badgeClass = "";

		switch (this.state.invoice.state) {
			case InvoiceState.DRAFT:
				badgeString = resources.str_draft;
				iconClass = "icon-edit2";
				badgeClass = "detail-view-badge-draft";
				break;
			case InvoiceState.LOCKED:
				iconClass = "icon-offen";
				badgeString = resources.str_openSmall;
				break;
			case InvoiceState.PARTIALLY_PAID:
				iconClass = "icon-teilbezahlt";
				badgeString = resources.str_partiallyPaid;
				break;
			case InvoiceState.PAID:
				iconClass = "icon-check";
				badgeString = resources.str_paid;
				badgeClass = "detail-view-badge-paid";
				break;
			case InvoiceState.CANCELLED:
				iconClass = "icon-storniert";
				badgeString = resources.str_canceled;
				badgeClass = "detail-view-badge-cancelled";
				break;
			case InvoiceState.DUNNED:
				iconClass = "icon-ueberfaellig";
				badgeString = resources.str_calledFor;
				badgeClass = "detail-view-badge-overdue";
				break;
		}

		if (this.state.invoice.isOverDue) {
			iconClass = "icon-ueberfaellig";
			badgeString = resources.str_overdue;
			badgeClass = "detail-view-badge-overdue";
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
				this.refs["autoDunningToggle"].setChecked(false);
			}
		});
	}

	openDunningRecipientModal(activateAfterClose) {
		const { invoice } = this.state;

		ModalService.open(
			<DunningRecipientModalComponent
				invoice={invoice}
				onError={() => {}}
				onSave={(recipients) => {
					invoice.dunningRecipients = recipients;
				}}
				resources={this.props.resources}
			/>,
			{
				width: 440,
				modalClass: "dunning-recipient-modal-component",
				afterClose: () => {
					this.afterDunningRecipientModalClose(activateAfterClose, invoice);
				},
			}
		);
	}

	onCategoryAdd(category, callback) {
		const categories = [...this.state.activityCategories, category];
		invoiz
			.request(config.settings.endpoints.activity, {
				auth: true,
				method: "POST",
				data: { categories },
			})
			.then(() => {
				invoiz.page.showToast({
					message: format(lang.tagAddSuccessMessage, "Aktivität", category),
				});

				this.setState({
					activityOptions: createActivityOptions(categories),
					activityCategories: categories,
				});
				callback && callback();
			})
			.catch(({ body: { meta } }) => {
				handleNotificationErrorMessage(meta);
			});
	}

	// reloadTodoActivityTabs() {
	// 	this.setState({ hideTodoActivityTabs: true }, () => {
	// 		this.setState({ hideTodoActivityTabs: false });
	// 	});
	// }

	onActivitySubmit(activity) {
		invoiz
			.request(`${config.resourceHost}history/activity`, {
				auth: true,
				method: "POST",
				data: {
					title: activity.text,
					category: activity.category,
					invoiceId: this.state.invoice.id,
				},
			})
			.then(() => {
				invoiz.showNotification({ message: "Die Aktivität wurde erfolgreich angelegt." });
				this.getHistory();
				this.setState({ activeTab: "activity" }, () => {
					this.reloadTodoActivityTabs();
				});
			})
			.catch((error) => {
				const meta = error.body && error.body.meta;
				handleNotificationErrorMessage(meta);
			});
	}

	onTodoSubmit(todo) {
		invoiz
			.request(`${config.resourceHost}todo`, {
				auth: true,
				method: "POST",
				data: {
					title: todo.text,
					date: todo.date,
					invoiceId: this.state.invoice.id,
				},
			})
			.then(() => {
				invoiz.showNotification({ message: "Das To-Do wurde erfolgreich angelegt." });
				this.getHistory();
				this.setState({ activeTab: "todo" }, () => {
					this.reloadTodoActivityTabs();
				});
			})
			.catch((error) => {
				const meta = error.body && error.body.meta;
				handleNotificationErrorMessage(meta);
			});
	}

	onChangeToDone(id) {
		invoiz
			.request(`${config.resourceHost}todo/${id}/doneAt`, {
				auth: true,
				method: "PUT",
			})
			.then(() => {
				invoiz.page.showToast({ message: lang.todoDoneSuccessMessage });
				this.getHistory();
			})
			.catch((error) => {
				const meta = error.body && error.body.meta;
				handleNotificationErrorMessage(meta);
			});
	}

	onDeleteTodo(id) {
		invoiz
			.request(`${config.resourceHost}todo/${id}`, {
				auth: true,
				method: "DELETE",
			})
			.then(() => {
				invoiz.page.showToast({ message: lang.todoDeleteSuccessMessage });
				this.getHistory();
			})
			.catch((error) => {
				const meta = error.body && error.body.meta;
				handleNotificationErrorMessage(meta);
			});
	}

	onChangeDueDate(id, date) {
		invoiz
			.request(`${config.resourceHost}todo/${id}/date`, {
				auth: true,
				method: "PUT",
				data: {
					date,
				},
			})
			.then(() => {
				invoiz.page.showToast({ message: lang.todoNewDueDateSuccessMessage });
				this.getHistory();
			})
			.catch((error) => {
				const meta = error.body && error.body.meta;
				handleNotificationErrorMessage(meta);
			});
	}

	onShowDunning(id) {
		invoiz.router.redirectTo(`/dunning/${this.state.invoice.id}/${id}`, false, false, true);
	}

	onSendDunning(id) {
		invoiz.router.redirectTo(`/dunning/send/${this.state.invoice.id}/${id}`, false, false, true);
	}

	onDeleteActivity(id) {
		invoiz
			.request(`${config.resourceHost}history/${id}`, {
				auth: true,
				method: "DELETE",
			})
			.then(() => {
				invoiz.page.showToast({ message: lang.activityDeleteSuccessMessage });
				this.getHistory();
			})
			.catch((error) => {
				const meta = error.body && error.body.meta;
				handleNotificationErrorMessage(meta);
			});
	}

	render() {
		const { pdf, historyItems, todoItems, letterPaperType, submenuVisible } = this.state;
		const { resources } = this.props;
		const topbarButtons = createTopbarButtons(this.state.invoice, this.state, null, resources);
		const topbarDropdownItems = createTopbarDropdown(this.state.invoice, resources);
		const activeAction = this.state.downloading
			? InvoiceAction.DOWNLOAD_PDF
			: this.state.printing
			? InvoiceAction.PRINT
			: null;
		const headContents = createDetailViewHeadObjects(this.state.invoice, activeAction, letterPaperType, resources);

		const paymentTable = this.createPaymentTable();
		const dunningTable = this.createDunningTable();
		//const deliveryNotesTable = this.createDeliveryNotesTable();

		const title = this.state.invoice.state === InvoiceState.DRAFT ? "Draft" : this.state.invoice.displayNumber;
		// console.log(headContents.leftElements, "headContents.leftElements");
		// console.log(headContents.rightElements, "headContents.rightElements");
		let subtitle = null;
		if (this.state.invoice.state === InvoiceState.CANCELLED) {
			const cancellationId =
				this.state.invoice.metaData.cancellation && this.state.invoice.metaData.cancellation.id;
			const cancellationNumber =
				this.state.invoice.metaData.cancellation && this.state.invoice.metaData.cancellation.number;
			const refundType =
				this.state.invoice.metaData.cancellation && this.state.invoice.metaData.cancellation.refundType;

			refundType === `credits` || refundType === null
				? (subtitle = (
						<div>
							(Credit note no.{" "}
							<a
								onClick={() =>
									invoiz.router.redirectTo(`/cancellation/${cancellationId}`, false, false, true)
								}
							>
								{cancellationNumber}
							</a>{" "}
							{this.state.invoice.metaData.cancellation.paidAmount > 0
								? `available for utilization`
								: null}
							)
						</div>
				  ))
				: (subtitle = (
						<div>
							(Amount refunded to{" "}
							<a
								onClick={() =>
									invoiz.router.redirectTo(
										`/customer/${this.state.invoice.customerId}`,
										false,
										false,
										true
									)
								}
							>
								customer credit balance
							</a>
							)
						</div>
				  ));
		}

		let dunningRecipientsString =
			this.state.invoice.dunningRecipients.length > 0 ? this.state.invoice.dunningRecipients[0] : "";
		if (dunningRecipientsString.length > 23) {
			dunningRecipientsString = dunningRecipientsString.slice(0, 20) + "...";
		}

		const dunningRecipientsSuffix =
			this.state.invoice.dunningRecipients.length > 1
				? " +" + (this.state.invoice.dunningRecipients.length - 1).toString()
				: "";

		const dunningRecipients = (
			<div className="invoice-detail-dunning-recipients">
				<span className="invoice-detail-dunning-label">
					<i className="icon icon-edit2" onClick={() => this.openDunningRecipientModal()} /> Will be sent to:
				</span>
				<span className="invoice-detail-dunning-value">
					{dunningRecipientsString + dunningRecipientsSuffix}
				</span>
			</div>
		);

		const badge = this.createStateBadge();
		const timelineIsHorizontal = this.state.viewportWidth <= DetailViewConstants.VIEWPORT_BREAKPOINT;

		const headerContent = (
			<div
				className={`detail-view-head-wrapper-new ${
					this.props.sideBarVisibleStatic["invoices"].sidebarVisible ||
					this.props.sideBarVisibleStatic["expenditure"].sidebarVisible
						? "detailHeadOnSidebarActive"
						: ""
				}`}
			>
				<PopoverComponent
					elementId={"detail-head-copy-link-popover-anchor"}
					arrowOffset={160}
					width={300}
					offsetTop={38}
					offsetLeft={150}
					showOnClick={true}
					onElementClicked={() => {
						if (!this.state.customerCenterLink) {
							invoiz
								.request(`${config.invoice.resourceUrl}/${this.state.invoice.id}/external/link`, {
									auth: true,
								})
								.then((response) => {
									const {
										body: {
											data: { linkToInvoiceCustomerCenter },
										},
									} = response;
									const { invoice } = this.state;

									invoice.history.push({
										date: new Date(Date.now()).toISOString(),
										state: InvoiceState.PRINTED,
									});

									this.getHistory();

									this.setState({ invoice, customerCenterLink: linkToInvoiceCustomerCenter }, () => {
										this.refs["detail-head-copy-link-input"].focus();
									});
								});
						} else {
							setTimeout(() => {
								this.refs["detail-head-copy-link-input"].focus();
							});
						}
					}}
					html={
						<div className="detail-head-copy-link-popover">
							<input
								type="text"
								className="detail-head-copy-link-content"
								value={this.state.customerCenterLink}
								onFocus={(e) => e.target.select()}
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
								}&body=${
									this.state.invoiceTexts && this.state.invoiceTexts.email
										? encodeURIComponent(this.state.invoiceTexts.email)
										: ""
								}%0D%0A%0D%0A${this.state.customerCenterLink}%0D%0A%0D%0A${
									resources.str_yourSincerely
								}`}
								className="icon icon-rounded icon-mail"
							/>
						</div>
					}
					ref={"detail-head-copy-link-popover"}
				/>
				<DetailViewHeadPrintPopoverComponent
					printSettingUrl={`${config.invoice.resourceUrl}/${this.state.invoice.id}/print/setting`}
					letterPaperType={letterPaperType}
					letterPaperChangeCallback={(letterPaperType) => {
						invoiz
							.request(`${config.invoice.resourceUrl}/${this.state.invoice.id}/document`, {
								auth: true,
								method: "POST",
								data: {
									isPrint: true,
								},
							})
							.then((response) => {
								const { path } = response.body.data;
								const { invoice } = this.state;
								invoice.pdfPath = config.imageResourceHost + path;
								this.setState({ letterPaperType, invoice });
							});
					}}
					elementId="detail-head-print-anchor"
					arrowOffset={25}
					offsetTop={35}
					offsetLeft={15}
					ref="detail-head-print-settings-popover"
					resources={resources}
				/>

				{/* <DetailViewHeadAdvancedComponent
					actionCallback={(action) => this.onHeadControlClick(action)}
					actionElements={headContents.actionElements}
					leftElements={headContents.leftElements}
					rightElements={headContents.rightElements}
					canvasWidth={this.state.canvasWidth}
				/> */}
				<DetailViewHeadPrintTooltipComponent letterPaperType={letterPaperType} resources={resources} />
				<DetailViewHeadComponent
					controlActionCallback={(action) => this.onHeadControlClick(action)}
					actionElements={headContents.actionElements.concat({
						action: "showPrintSettingsPopover",
						controlsItemClass: "item-print-settings",
						dataQsId: "offerDetail-head-action-printSettings",
						icon: "icon-arr_down",
						id: "detail-head-print-settings-popover-anchor",
						name: "",
					})}
					leftElements={headContents.leftElements}
					rightElements={headContents.rightElements}
				/>

				{/* {invoiz.user.isAppEnabledAutoDunning() &&
				(this.state.invoice.autoDunningEnabled ||
					this.state.autoDunningChanged ||
					(this.state.invoice.payConditionData && this.state.invoice.payConditionData.dueDays > 0)) ? (
					<div className="invoice-detail-autodunning-wrapper">
						<div className="invoice-detail-autodunning">
							<InvoiceAutodunningComponent
								ref={`autoDunningToggle`}
								onChange={(value) => {
									this.onAutoDunningChange(value);
								}}
								enabled={this.state.invoice.autoDunningEnabled}
							/>
							{this.state.invoice.autoDunningEnabled ? dunningRecipients : null}
						</div>
					</div>
				) : null} */}
				{this.state.invoice.autoDunningEnabled ||
				this.state.autoDunningChanged ||
				(this.state.invoice.payConditionData && this.state.invoice.payConditionData.dueDays > 0) ? (
					<div className="invoice-detail-autodunning-wrapper">
						<div className="invoice-detail-autodunning">
							<InvoiceAutodunningComponent
								ref={`autoDunningToggle`}
								onChange={(value) => {
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
		);

		const paymentAndDeliveryNoteContent = (
			<React.Fragment>
				{paymentTable.rows.length > 0 && (
					// <div className="detail-view-box-new u_mt_40 box">
					<div className="detail-view-box-new u_mt_16 box">
						<ListComponent
							title="Payments received"
							columns={paymentTable.columns}
							rows={paymentTable.rows}
							tableId={`payments`}
							resources={this.props.resources}
						/>
					</div>
				)}

				{/* {deliveryNotesTable.rows.length > 0 && (
					<div className="detail-view-box-new u_mt_30">
						<ListComponent
							title="Lieferscheine"
							columns={deliveryNotesTable.columns}
							rows={invoiz.user.isAppEnabledDeliveryNote() ? deliveryNotesTable.rows : []}
							tableId={`deliveryNotes`}
						/>
					</div>
				)} */}
			</React.Fragment>
		);
		const classLeft = submenuVisible ? "alignLeftDetail" : "";

		return (
			<div
				className={`invoice-detail-wrapper wrapper-has-topbar ${!timelineIsHorizontal ? "viewport-large" : ""}`}
			>
				<TopbarComponent
					title={`${resources.str_invoice} ${title}`}
					subtitle={subtitle}
					buttonCallback={(event, button) => this.handleTopbarButtonClick(event, button)}
					backButtonRoute={"invoices"}
					dropdownEntries={topbarDropdownItems}
					dropdownCallback={(entry) => this.handleTopbarDropdownClick(entry)}
					buttons={topbarButtons}
				/>

				<div className="detail-view-background"></div>

				{headerContent}

				<div className={`detail-view-content-wrapper ${classLeft}`}>
					<div className="detail-view-content-left">
						<div className="badge-wrapper u_c">{badge}</div>
						<div className="detail-view-document-wrapper">
							{!this.state.pdf && (
								<img className="detail-view-preview" src="/assets/images/invoice-preview.png" />
							)}
							<div
								className="detail-view-pdf-wrapper"
								ref={this.pdfWrapper}
								data-qs-id="transaction-detail-canvas-wrapper"
								onClick={() => {
									this.setState({ showPdfPreview: true });
								}}
							/>
							{this.state.pdf && (
								<PdfPreviewComponent
									pdf={this.state.pdf}
									show={this.state.showPdfPreview}
									onClose={() => {
										this.setState({ showPdfPreview: false });
									}}
								/>
							)}
						</div>

						{pdf && pdf.pdfInfo.numPages === 1 && window.innerWidth > 1250 && paymentAndDeliveryNoteContent}
					</div>
					<div className="detail-view-content-right">
						{/* {!this.state.hideTodoActivityTabs && (
							<TodoActivityTabsComponent
								activeTab={this.state.activeTab}
								activityOptions={this.state.activityOptions}
								onActivitySubmit={this.onActivitySubmit}
								onCategoryAdd={this.onCategoryAdd}
								onTodoSubmit={this.onTodoSubmit}
							/>
						)} */}

						<div className="invoice-info u_p_16">
							<div className="invoice-info-label font-14px">Invoice Amount</div>
							<h3 className="invoice-amount">{headContents.rightElements[0].value}</h3>
							<div className="customer-name-container font-14px">
								<div>Customer</div>
								<div className="customer-name">{headContents.leftElements[0].value}</div>
							</div>
							{headContents.rightElements.map((item, index) => {
								if (index === 0) return;
								return (
									<div
										key={`invoice-info-item-${index}`}
										style={{ color: item.headline === "payment overdue" ? "#FFAA2C" : null }}
										className="date-of-invoice-container font-14px"
									>
										<div>{capitalize(item.headline)}</div>
										<div
											className={
												index === headContents.rightElements.length - 1
													? "date-of-invoice"
													: "invoice-info-item"
											}
										>
											{index === headContents.rightElements.length - 1
												? abbreviationDateFormat(item.value)
												: item.value}
										</div>
									</div>
								);
							})}
						</div>

						<div className="detail-view-box-new box-history u_mt_30">
							<div className="invoice-history-scroll-container">
								{this.state.historyIsLoading ? (
									<LoaderComponent visible={true} text="Loading invoice activities" />
								) : (
									<React.Fragment>
										{/* {todoItems.length > 0 && (
											<React.Fragment>
												<div className="text-semibold">Offene To-Dos</div>
												<div>
													{todoItems.map((todo, index) => {
														return (
															<TodoItem
																key={`document-todo-item-${index}`}
																todo={todo}
																changeToDone={this.onChangeToDone}
																onDelete={this.onDeleteTodo}
																changeDueDate={this.onChangeDueDate}
															/>
														);
													})}
												</div>
												<div className="u_mb_24"></div>
											</React.Fragment>
										)} */}
										{historyItems.length > 0 && (
											<React.Fragment>
												<div className="text-semibold">Activities:</div>
												{historyItems.map((item, index) => {
													return (
														<HistoryItemComponent
															index={index}
															key={`document-history-item-${index}`}
															item={item}
															onCancelPayment={(id) => {
																this.state.invoice.payments.find((payment) => {
																	if (payment.id === id) {
																		payment = new Payment(payment);
																		this.deletePayment(payment);
																	}
																});
															}}
															onShowDunning={this.onShowDunning}
															onSendDunning={this.onSendDunning}
															onDeleteActivity={this.onDeleteActivity}
														/>
													);
												})}
											</React.Fragment>
										)}
									</React.Fragment>
								)}
							</div>
						</div>

						{dunningTable.rows.length > 0 && (
							<div className="detail-view-box-new u_mt_20">
								<ListComponent
									title={resources.str_remainders}
									columns={dunningTable.columns}
									rows={dunningTable.rows}
									tableId={`dunnings`}
									resources={resources}
								/>
							</div>
						)}

						{pdf &&
							(pdf.pdfInfo.numPages > 1 || window.innerWidth <= 1250) &&
							paymentAndDeliveryNoteContent}

						<div className="detail-view-box-new u_mt_20">
							<NotesComponent
								heading={resources.str_remarks}
								data={{ notes: this.state.invoice.notes }}
								onSave={(value) => this.onNotesChange(value.notes)}
								placeholder={format(
									resources.defaultCommentsPlaceholderText,
									resources.str_invoiceSmall
								)}
								resources={resources}
								defaultFocus={true}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	const isSubmenuVisible = state.global.isSubmenuVisible;
	const sideBarVisibleStatic = state.global.sideBarVisibleStatic;
	return {
		resources,
		isSubmenuVisible,
		sideBarVisibleStatic,
	};
};
const mapDispatchToProps = (dispatch) => {
	return {
		submenuVisible: (payload) => {
			dispatch(submenuVisible(payload));
		},
	};
};

// export default InvoiceDetailNewComponent;
export default connect(mapStateToProps, mapDispatchToProps)(InvoiceDetailNewComponent);
