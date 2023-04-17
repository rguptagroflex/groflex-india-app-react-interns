import { RouteTypes } from "helpers/constants";
import { UnmatchedRoute } from "helpers/routes";
import LoginWrapper from "views/account/login.wrapper";
import ForgotPasswordWrapper from "views/account/forgot-password.wrapper";
import ProcessGoogleAuthWrapper from "views/account/process-google-auth.wrapper";
import RegistrationWrapper from "views/account/registration.wrapper";
import RegistrationWithEmailWrapper from "views/account/registration-with-email.wrapper";
import RegistratioInvitationWrapper from "views/account/registration-invitation.wrapper";
import ResetPasswordWrapper from "views/account/reset-password.wrapper";
import MobileRedirectWrapper from "views/account/mobile-redirect.wrapper";
import DeleteAccountWrapper from "views/account/delete-account.wrapper";
import ChangeEmailAccountWrapper from "views/account/changeEmail-account.wrapper";
import DashboardWrapper from "views/dashboard/dashboard.wrapper";
import InvoiceListWrapper from "views/invoice/invoice-list.wrapper";
import RecurringInvoiceListWrapper from "views/recurring-invoice/recurring-invoice-list.wrapper";
import ProjectListWrapper from "views/project/project-list.wrapper";
import TimetrackingListWrapper from "views/timetracking/timetracking-list.wrapper";
import InvoiceDetailWrapper from "views/invoice/invoice-detail.wrapper";
import RecurringInvoiceDetailWrapper from "views/recurring-invoice/recurring-invoice-detail.wrapper";
import ProjectDetailWrapper from "views/project/project-detail.wrapper";
import TimetrackingBilledWrapper from "views/timetracking/timetracking-billed.wrapper";
import TimetrackingBillingWrapper from "views/timetracking/timetracking-billing.wrapper";
import TimetrackingNewWrapper from "views/timetracking/timetracking-new.wrapper";
import TimetrackingEditWrapper from "views/timetracking/timetracking-edit.wrapper";
import CancellationInvoiceDetailWrapper from "views/cancellation/cancellation-invoice-detail.wrapper";
import CancellationSendMailWrapper from "views/cancellation/cancellation-send-mail.wrapper";
import DunningSendMailWrapper from "views/dunning/dunning-send-mail.wrapper";
import DunningInvoiceDetailWrapper from "views/dunning/dunning-invoice-detail.wrapper";
import InvoiceNewWrapper from "views/invoice/invoice-new.wrapper";
import InvoiceEditWrapper from "views/invoice/invoice-edit.wrapper";
import InvoiceSendMailWrapper from "views/invoice/invoice-send-mail.wrapper";
import RecurringInvoiceNewWrapper from "views/recurring-invoice/recurring-invoice-new.wrapper";
import RecurringInvoiceEditWrapper from "views/recurring-invoice/recurring-invoice-edit.wrapper";
import ProjectNewWrapper from "views/project/project-new.wrapper";
import ProjectEditWrapper from "views/project/project-edit.wrapper";
import DepositInvoiceNewWrapper from "views/project/deposit-invoice-new.wrapper";
import ClosingInvoiceNewWrapper from "views/project/closing-invoice-new.wrapper";
import OfferListWrapper from "views/offer/offer-list.wrapper";
import OfferImpressListWrapper from "views/offer/offer-impress-list.wrapper";
import OfferImpressTemplatesWrapper from "views/offer/offer-impress-templates.wrapper";
import OfferNewWrapper from "views/offer/offer-new.wrapper";
import OfferDetailWrapper from "views/offer/offer-detail.wrapper";
import OfferEditWrapper from "views/offer/offer-edit.wrapper";
import OfferSendMailWrapper from "views/offer/offer-send-mail.wrapper";
import OfferImpressEditWrapper from "views/offer/offer-impress-edit.wrapper";
import OfferImpressDetailWrapper from "views/offer/offer-impress-detail.wrapper";
import OfferImpressDetailViewWrapper from "views/offer/offer-impress-detail-view.wrapper";
import OfferImpressPreviewWrapper from "views/offer/offer-impress-preview.wrapper";
import OfferImpressPreviewPageWrapper from "views/offer/offer-impress-preview-page.wrapper";
import OfferImpressPreviewContentWrapper from "views/offer/offer-impress-preview-content.wrapper";

import PurchaseOrderListWrapper from "views/purchase-order/purchase-order-list.wrapper";
import PurchaseOrderNewWrapper from "views/purchase-order/purchase-order-new.wrapper";
import PurchaseOrderEditWrapper from "views/purchase-order/purchase-order-edit.wrapper";
import PurchaseOrderDetailWrapper from "views/purchase-order/purchase-order-detail.wrapper";
import PurchaseOrderSendMailWrapper from "views/purchase-order/purchase-order-send-mail.wrapper";

// import BankingFinanceCockpitWrapper from "views/banking/banking-financecockpit.wrapper";
// import BankingEmptyStateWrapper from "views/banking/banking-empty-state.wrapper";
// import BankingTransactionsWrapper from "views/banking/banking-transactions.wrapper";

import ChartofaccountListWrapper from "views/chartofaccounts/chartofaccount-list.wrapper";
import CustomerListWrapper from "views/customer/customer-list.wrapper";
import CustomerDetailWrapper from "views/customer/customer-detail.wrapper";
import CustomerEditWrapper from "views/customer/customer-edit.wrapper";
import CustomerNewWrapper from "views/customer/customer-new.wrapper";
import ArticleListWrapper from "views/article/article-list.wrapper";
import ArticleDetailWrapper from "views/article/article-detail.wrapper";
import ArticleEditWrapper from "views/article/article-edit.wrapper";
import ArticleNewWrapper from "views/article/article-new.wrapper";
import ExpenseListWrapper from "views/expense/expense-list.wrapper";
import ExpenseEditWrapper from "views/expense/expense1-edit.wrapper";
import ExpenseNewWrapper from "views/expense/expense1-new.wrapper";
import AdminPanelWrapper from "views/admin-panel/admin-panel.wrapper";
import SettingsAccountWrapper from "views/settings/settings-account.wrapper";
import SettingsUserWrapper from "views/settings/settings-user.wrapper";
import SettingsDocumentExportWrapper from "views/settings/settings-document-export.wrapper";
import SettingsDataImportOverviewWrapper from "views/settings/settings-data-import-overview.wrapper";
import SettingsDataImportArticlesWrapper from "views/settings/settings-data-import-articles.wrapper";
import SettingsDataImportCustomersWrapper from "views/settings/settings-data-import-customers.wrapper";
import SettingsPaymentConditionsWrapper from "views/settings/settings-payment-conditions.wrapper";
import SettingsTextModulesWrapper from "views/settings/settings-text-modules.wrapper";
import SettingsDunningsWrapper from "views/settings/settings-dunnings.wrapper";
import SettingsMoreSettingsWrapper from "views/settings/settings-more-settings.wrapper";
import StartImpressTemplatesWrapper from "views/start/start-impress-templates.wrapper";
import InventoryListWrapper from "views/inventory/inventory-list.wrapper";
import CancellationListWrapper from "views/cancellation/cancellation-list.wrapper";

import RedirectComponent from "views/redirect/redirect.component";
import MarketplaceWrapper from "./app/views/marketplace/marketplace.wrapper";
import CashAndBankWrapper from "./app/views/cash-and-bank/cash-and-bank-wrapper";
import TransactionsListWrapper from "./app/views/transactions/transactions-list-wrapper";
// import DeliveryChallanListWrapper from "./app/views/delivrey-challan/delivery-challan-list.wrapper";
// import DeliveryChallanNewWrapper from "./app/views/delivrey-challan/delivery-challan-new.wrapper";
// import DeliveryChallanEditWrapper from "./app/views/delivrey-challan/delivery-challan-edit.wrapper";
// import DeliveryChallanDetailsWrapper from "./app/views/delivrey-challan/delivery-challan-details.wrapper";
// import DeliveryChallanSendMailWrapper from "./app/views/delivrey-challan/delivery-challan-send-mail.wrapper";

const PageClassNames = {
	NO_SIDE_MARGIN: "no-side-margin",
	NO_TOP_MARGIN: "no-top-margin",
	FULLSIZE_VIEW: "fullsize-view",
	FULLSIZE_BLANK_VIEW: "fullsize-blank-view",
	ONLY_SIDE_MARGIN: "only-side-margin",
};

const routes = [
	// Start
	{
		path: "/",
		type: RouteTypes.PRIVATE,
		component: StartImpressTemplatesWrapper,
		exact: true,
		title: "IMPRESS-Vorlagen",
		menuItem: "start",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "startPage",
	},

	// Account
	{
		path: "/account/login/:router?",
		type: RouteTypes.PUBLIC,
		component: LoginWrapper,
		exact: true,
		title: "Login",
		resourceKey: "login",
	},
	{
		path: "/oauth/google/callback",
		type: RouteTypes.PUBLIC,
		component: ProcessGoogleAuthWrapper,
		exact: false,
		title: "Mit Google anmelden",
		resourceKey: "googleSignIn",
	},
	{
		path: "/account/forgot_password",
		type: RouteTypes.PUBLIC,
		component: ForgotPasswordWrapper,
		exact: true,
		title: "Passwort vergessen",
		resourceKey: "forgotPassword",
	},
	{
		path: "/account/register/:viewState?",
		type: RouteTypes.PUBLIC,
		component: RegistrationWrapper,
		exact: false,
		title: "Registrierung",
		resourceKey: "registration",
	},
	{
		path: "/account/registerWithEmail",
		type: RouteTypes.PUBLIC,
		component: RegistrationWithEmailWrapper,
		exact: false,
		title: "Registrierung",
		resourceKey: "registration",
	},
	{
		path: "/account/registration/invitation/:code",
		type: RouteTypes.PUBLIC,
		component: RegistratioInvitationWrapper,
		exact: false,
		title: "registration",
	},
	{
		path: "/account/reset_password/:hash",
		type: RouteTypes.PUBLIC,
		component: ResetPasswordWrapper,
		exact: false,
		title: "Passwort zurücksetzen",
		resourceKey: "resetPassword",
	},
	{
		path: "/account/mobile",
		type: RouteTypes.PUBLIC,
		component: MobileRedirectWrapper,
		exact: false,
		title: "Nutze unsere App!",
		resourceKey: "useApp",
	},
	{
		path: "/account/delete/:token",
		type: RouteTypes.PUBLIC,
		component: DeleteAccountWrapper,
		exact: false,
		title: "Account löschen",
		resourceKey: "deleteAccount",
	},
	{
		path: "/account/approvechangeemail/:token",
		type: RouteTypes.PUBLIC,
		component: ChangeEmailAccountWrapper,
		exact: false,
		title: "Account Email Change",
		resourceKey: "deleteAccount",
	},

	// Invoice
	{
		path: "/invoice/new",
		type: RouteTypes.PRIVATE,
		component: InvoiceNewWrapper,
		exact: true,
		title: "Rechnung erstellen",
		menuItem: "invoices",
		submenuItem: "invoice",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "makeBill",
	},
	{
		path: "/invoice/new/customer/:id",
		type: RouteTypes.PRIVATE,
		component: InvoiceNewWrapper,
		exact: true,
		title: "Rechnung erstellen",
		menuItem: "invoices",
		submenuItem: "invoice",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "makeBill",
	},
	{
		path: "/invoice/edit/:id",
		type: RouteTypes.PRIVATE,
		component: InvoiceEditWrapper,
		exact: true,
		title: "Rechnung bearbeiten",
		menuItem: "invoices",
		submenuItem: "invoice",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "editInvoice",
	},
	{
		path: "/invoice/send/:id",
		type: RouteTypes.PRIVATE,
		component: InvoiceSendMailWrapper,
		exact: true,
		title: "Rechnung versenden",
		menuItem: "invoices",
		submenuItem: "invoice",
		resourceKey: "sendInvoice",
	},
	{
		path: "/invoice/:id",
		type: RouteTypes.PRIVATE,
		component: InvoiceDetailWrapper,
		exact: true,
		title: "Rechnungs-Details",
		menuItem: "invoices",
		submenuItem: "invoice",
		pageClass: PageClassNames.NO_TOP_MARGIN,
		resourceKey: "billingDetails",
	},
	//delivery-challan
	// {
	// 	path: "/challan/new",
	// 	type: RouteTypes.PRIVATE,
	// 	component: DeliveryChallanNewWrapper,
	// 	exact: true,
	// 	title: "Rechnung erstellen",
	// 	menuItem: "invoices",
	// 	submenuItem: "deliverychallan",
	// 	pageClass: PageClassNames.NO_SIDE_MARGIN,
	// 	resourceKey: "challans",
	// },
	// {
	// 	path: "/deliverychallans",
	// 	type: RouteTypes.PRIVATE,
	// 	component: DeliveryChallanListWrapper,
	// 	exact: true,
	// 	title: "Lieferung-Challan",
	// 	menuItem: "invoices",
	// 	submenuItem: "deliverychallan",
	// 	pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
	// 	resourceKey: "challans",
	// },
	// {
	// 	path: "/challan/edit/:id",
	// 	type: RouteTypes.PRIVATE,
	// 	component: DeliveryChallanEditWrapper,
	// 	exact: true,
	// 	title: "Rechnung bearbeiten",
	// 	menuItem: "invoices",
	// 	submenuItem: "deliverychallan",
	// 	pageClass: PageClassNames.NO_SIDE_MARGIN,
	// 	resourceKey: "editChallan",
	// },
	// {
	// 	path: "/challan/:id",
	// 	type: RouteTypes.PRIVATE,
	// 	component: DeliveryChallanDetailsWrapper,
	// 	exact: true,
	// 	title: "Angebots-Details",
	// 	menuItem: "invoices",
	// 	submenuItem: "deliverychallan",
	// 	pageClass: PageClassNames.NO_SIDE_MARGIN,
	// 	resourceKey: "offerDetails",
	// },
	// {
	// 	path: "/challan/send/:id",
	// 	type: RouteTypes.PRIVATE,
	// 	component: DeliveryChallanSendMailWrapper,
	// 	exact: true,
	// 	title: "Angebot versenden",
	// 	menuItem: "invoices",
	// 	submenuItem: "deliverychallan",
	// 	resourceKey: "offerSend",
	// },
	///////////////////////
	{
		path: "/invoices",
		type: RouteTypes.PRIVATE,
		component: InvoiceListWrapper,
		exact: true,
		title: "Rechnungen",
		menuItem: "invoices",
		submenuItem: "invoice",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "bills",
	},
	{
		path: "/invoices/recurringInvoice",
		type: RouteTypes.PRIVATE,
		component: RecurringInvoiceListWrapper,
		exact: true,
		title: "Abo-Rechnungen",
		menuItem: "invoices",
		submenuItem: "recurringInvoice",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "subscriptionBills",
	},
	{
		path: "/invoices/project",
		type: RouteTypes.PRIVATE,
		component: ProjectListWrapper,
		exact: true,
		title: "Abschläge",
		menuItem: "invoices",
		submenuItem: "project",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "discounts",
	},
	{
		path: "/invoices/timetracking",
		type: RouteTypes.PRIVATE,
		component: TimetrackingListWrapper,
		exact: true,
		title: "Zeiterfassungen",
		menuItem: "invoices",
		submenuItem: "timetracking",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "timesheets",
	},

	// Recurring Invoice
	{
		path: "/recurringinvoice/new",
		type: RouteTypes.PRIVATE,
		component: RecurringInvoiceNewWrapper,
		exact: true,
		title: "Abo-Rechnung erstellen",
		menuItem: "invoices",
		submenuItem: "recurringInvoice",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "createSubscriptionInvoice",
	},
	{
		path: "/recurringinvoice/new/customer/:id",
		type: RouteTypes.PRIVATE,
		component: RecurringInvoiceNewWrapper,
		exact: true,
		title: "Abo-Rechnung erstellen",
		menuItem: "invoices",
		submenuItem: "recurringInvoice",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "createSubscriptionInvoice",
	},
	{
		path: "/recurringinvoice/edit/:id",
		type: RouteTypes.PRIVATE,
		component: RecurringInvoiceEditWrapper,
		exact: true,
		title: "Abo-Rechnung bearbeiten",
		menuItem: "invoices",
		submenuItem: "recurringInvoice",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "editSubscriptionInvoice",
	},
	{
		path: "/recurringinvoice/:id",
		type: RouteTypes.PRIVATE,
		component: RecurringInvoiceDetailWrapper,
		exact: true,
		title: "Abo-Rechnung-Details",
		menuItem: "invoices",
		submenuItem: "recurringInvoice",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "subcriptionAccountDetail",
	},

	// Project
	{
		path: "/project/new/:offerId?",
		type: RouteTypes.PRIVATE,
		component: ProjectNewWrapper,
		exact: true,
		title: "Projekt erstellen",
		menuItem: "invoices",
		submenuItem: "project",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "projectCreate",
	},
	{
		path: "/project/edit/:id",
		type: RouteTypes.PRIVATE,
		component: ProjectEditWrapper,
		exact: true,
		title: "Projekt bearbeiten",
		menuItem: "invoices",
		submenuItem: "project",
		resourceKey: "projectEdit",
	},
	{
		path: "/project/:id",
		type: RouteTypes.PRIVATE,
		component: ProjectDetailWrapper,
		exact: true,
		title: "Projekt-Details",
		menuItem: "invoices",
		submenuItem: "project",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "projectDetails",
	},
	{
		path: "/depositInvoice/new/:id?",
		type: RouteTypes.PRIVATE,
		component: DepositInvoiceNewWrapper,
		exact: true,
		title: "Abschlagsrechnung erstellen",
		menuItem: "invoices",
		submenuItem: "project",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "createBudgetBill",
	},
	{
		path: "/closingInvoice/new/:id?",
		type: RouteTypes.PRIVATE,
		component: ClosingInvoiceNewWrapper,
		exact: true,
		title: "Schlussrechnung erstellen",
		menuItem: "invoices",
		submenuItem: "project",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "createFinalInvoice",
	},

	// Timetracking
	{
		path: "/timetracking/new/:customerId?",
		type: RouteTypes.PRIVATE,
		component: TimetrackingNewWrapper,
		exact: true,
		title: "Zeit erfassen",
		menuItem: "invoices",
		submenuItem: "timetracking",
		resourceKey: "recordTime",
	},
	{
		path: "/timetracking/edit/:id",
		type: RouteTypes.PRIVATE,
		component: TimetrackingEditWrapper,
		exact: true,
		title: "Erfasste Zeit bearbeiten",
		menuItem: "invoices",
		submenuItem: "timetracking",
		resourceKey: "recordTimeEdit",
	},
	{
		path: "/timetracking/billed/customer/:id",
		type: RouteTypes.PRIVATE,
		component: TimetrackingBilledWrapper,
		exact: true,
		title: "Abgerechnete Zeiten",
		menuItem: "invoices",
		submenuItem: "timetracking",
		resourceKey: "billedTimes",
	},
	{
		path: "/timetracking/billing/customer/:id",
		type: RouteTypes.PRIVATE,
		component: TimetrackingBillingWrapper,
		exact: true,
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		title: "Zeiten abrechnen",
		menuItem: "invoices",
		submenuItem: "timetracking",
		resourceKey: "settleTimes",
	},

	// Cancellation
	{
		path: "/cancellation/send/:id",
		type: RouteTypes.PRIVATE,
		component: CancellationSendMailWrapper,
		exact: true,
		title: "Stornorechnung versenden",
		menuItem: "invoices",
		submenuItem: "invoice",
		resourceKey: "cancellationInvoice",
	},
	{
		path: "/cancellation/:id",
		type: RouteTypes.PRIVATE,
		component: CancellationInvoiceDetailWrapper,
		exact: true,
		title: "Stornorechnungs-Details",
		menuItem: "invoices",
		submenuItem: "invoice",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "cancellationBillingDetails",
	},
	{
		path: "/cancellations",
		type: RouteTypes.PRIVATE,
		component: CancellationListWrapper,
		exact: true,
		title: "Stornorechnungs-Details",
		menuItem: "invoices",
		submenuItem: "creditNotes",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "creditNotes",
	},
	// Dunning
	{
		path: "/dunning/send/:invoiceId/:dunningId",
		type: RouteTypes.PRIVATE,
		component: DunningSendMailWrapper,
		exact: true,
		title: "Mahnung versenden",
		menuItem: "invoices",
		submenuItem: "invoice",
		resourceKey: "reminderSend",
	},
	{
		path: "/dunning/:invoiceId/:dunningId",
		type: RouteTypes.PRIVATE,
		component: DunningInvoiceDetailWrapper,
		exact: true,
		title: "Mahnung",
		menuItem: "invoices",
		submenuItem: "invoice",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "reminder",
	},

	// Offer
	{
		path: "/offers/impress",
		type: RouteTypes.PRIVATE,
		component: OfferImpressListWrapper,
		exact: true,
		title: "IMPRESS-Angebote",
		menuItem: "invoices",
		submenuItem: "offerImpress",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "impressOffers",
	},
	{
		path: "/offers",
		type: RouteTypes.PRIVATE,
		component: OfferListWrapper,
		exact: true,
		title: "Angebote",
		menuItem: "invoices",
		submenuItem: "offer",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "offers",
	},
	{
		path: "/offer/new/customer/:id",
		type: RouteTypes.PRIVATE,
		component: OfferNewWrapper,
		exact: true,
		title: "Angebot erstellen",
		menuItem: "invoices",
		submenuItem: "offer",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "offerCreate",
	},
	{
		path: "/offer/new",
		type: RouteTypes.PRIVATE,
		component: OfferNewWrapper,
		exact: true,
		title: "Angebot erstellen",
		menuItem: "invoices",
		submenuItem: "offer",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "offerCreate",
	},
	{
		path: "/offer/edit/:id",
		type: RouteTypes.PRIVATE,
		component: OfferEditWrapper,
		exact: true,
		title: "Angebot bearbeiten",
		menuItem: "invoices",
		submenuItem: "offer",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "offerEdit",
	},
	{
		path: "/offer/impress/templates",
		type: RouteTypes.PRIVATE,
		component: OfferImpressTemplatesWrapper,
		exact: true,
		title: "IMPRESS-Vorlagen",
		menuItem: "offers",
		submenuItem: "offerImpressTemplates",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "impressTemplate",
	},
	{
		path: "/offer/impress/edit/:id",
		type: RouteTypes.PRIVATE,
		component: OfferImpressEditWrapper,
		exact: true,
		title: "IMPRESS-Angebot bearbeiten",
		menuItem: "invoices",
		submenuItem: "offerImpress",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW} `,
		resourceKey: "impressOfferEdit",
	},
	{
		path: "/offer/impress/preview/:id",
		type: RouteTypes.PRIVATE,
		component: OfferImpressPreviewWrapper,
		exact: true,
		title: "IMPRESS-Vorschau",
		menuItem: "invoices",
		submenuItem: "offerImpress",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_BLANK_VIEW} `,
		resourceKey: "impressPreview",
	},
	{
		path: "/offer/impress/previewPage/:id",
		type: RouteTypes.PRIVATE,
		component: OfferImpressPreviewPageWrapper,
		exact: true,
		title: "IMPRESS-Vorschau",
		menuItem: "invoices",
		submenuItem: "offerImpress",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_BLANK_VIEW} `,
		resourceKey: "impressPreview",
	},
	{
		path: "/offer/impress/previewContent/:id",
		type: RouteTypes.PRIVATE,
		component: OfferImpressPreviewContentWrapper,
		exact: true,
		title: "IMPRESS-Vorschau",
		menuItem: "invoices",
		submenuItem: "offerImpress",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_BLANK_VIEW} `,
		resourceKey: "impressPreview",
	},
	{
		path: "/offer/impress/:id",
		type: RouteTypes.PRIVATE,
		component: OfferImpressDetailWrapper,
		exact: true,
		title: "IMPRESS-Angebotsdetails",
		menuItem: "invoices",
		submenuItem: "offerImpress",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW} `,
		resourceKey: "impressOfferDetails",
	},
	{
		path: "/offer/impress/detail/:id",
		type: RouteTypes.PRIVATE,
		component: OfferImpressDetailViewWrapper,
		exact: true,
		title: "IMPRESS-Angebotsdetails",
		menuItem: "invoices",
		submenuItem: "offerImpress",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW} `,
		resourceKey: "impressOfferDetails",
	},
	{
		path: "/offer/:id",
		type: RouteTypes.PRIVATE,
		component: OfferDetailWrapper,
		exact: true,
		title: "Angebots-Details",
		menuItem: "invoices",
		submenuItem: "offer",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "offerDetails",
	},
	{
		path: "/offer/send/:id",
		type: RouteTypes.PRIVATE,
		component: OfferSendMailWrapper,
		exact: true,
		title: "Angebot versenden",
		menuItem: "invoices",
		submenuItem: "offer",
		resourceKey: "offerSend",
	},

	// Purchase Order
	{
		path: "/purchase-orders",
		type: RouteTypes.PRIVATE,
		component: PurchaseOrderListWrapper,
		exact: true,
		title: "Purchase Orders",
		// menuItem: 'purchaseOrders',
		menuItem: "expenditure",
		submenuItem: "purchaseOrders",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "purchaseOrder",
	},
	{
		path: "/purchase-order/new/customer/:id",
		type: RouteTypes.PRIVATE,
		component: PurchaseOrderNewWrapper,
		exact: true,
		title: "Purchase Order New",
		// menuItem: 'purchaseOrders',
		menuItem: "expenditure",
		submenuItem: "purchaseOrders",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "purchaseOrderCreate",
	},
	{
		path: "/purchase-order/new",
		type: RouteTypes.PRIVATE,
		component: PurchaseOrderNewWrapper,
		exact: true,
		title: "Purchase Order New",
		// menuItem: 'purchaseOrders',
		menuItem: "expenditure",
		submenuItem: "purchaseOrders",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "purchaseOrderCreate",
	},
	{
		path: "/purchase-order/edit/:id",
		type: RouteTypes.PRIVATE,
		component: PurchaseOrderEditWrapper,
		exact: true,
		title: "Purchase Order Edit",
		// menuItem: 'purchaseOrders',
		menuItem: "expenditure",
		submenuItem: "purchaseOrders",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "purchaseOrderEdit",
	},
	{
		path: "/purchase-order/:id",
		type: RouteTypes.PRIVATE,
		component: PurchaseOrderDetailWrapper,
		exact: true,
		title: "Purchase Order Details",
		// menuItem: 'purchaseOrders',
		menuItem: "expenditure",
		submenuItem: "purchaseOrders",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "purchaseOrderDetails",
	},
	{
		path: "/purchase-order/send/:id",
		type: RouteTypes.PRIVATE,
		component: PurchaseOrderSendMailWrapper,
		exact: true,
		title: "Purchase Order Send Mail",
		// menuItem: 'purchaseOrders',
		// submenuItem: 'purchase-order',
		menuItem: "expenditure",
		submenuItem: "purchaseOrders",
		resourceKey: "purchaseOrderSend",
	},
	// Banking
	// {
	// 	path: "/banking/setup",
	// 	type: RouteTypes.PRIVATE,
	// 	component: BankingEmptyStateWrapper,
	// 	exact: true,
	// 	title: "Banking",
	// 	menuItem: "banking",
	// 	submenuItem: "bankingTransactions",
	// 	resourceKey: "banking",
	// },
	// {
	// 	path: "/banking/financecockpit",
	// 	type: RouteTypes.PRIVATE,
	// 	component: BankingFinanceCockpitWrapper,
	// 	exact: true,
	// 	title: "Banking",
	// 	menuItem: "banking",
	// 	submenuItem: "bankingFinanceCockpit",
	// 	resourceKey: "banking",
	// },
	// {
	// 	path: "/banking/transactions/:id?",
	// 	type: RouteTypes.PRIVATE,
	// 	component: BankingTransactionsWrapper,
	// 	exact: true,
	// 	title: "Banking",
	// 	menuItem: "banking",
	// 	submenuItem: "bankingTransactions",
	// 	pageClass: PageClassNames.NO_SIDE_MARGIN,
	// 	resourceKey: "banking",
	// },

	// Customer
	{
		path: "/customers",
		type: RouteTypes.PRIVATE,
		component: CustomerListWrapper,
		exact: true,
		title: "Kunden",
		menuItem: "customers",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "customer",
	},
	{
		path: "/customer/edit/:id",
		type: RouteTypes.PRIVATE,
		component: CustomerEditWrapper,
		exact: true,
		title: "Kunde bearbeiten",
		menuItem: "customers",
		resourceKey: "customerEdit",
	},
	{
		path: "/customer/new",
		type: RouteTypes.PRIVATE,
		component: CustomerNewWrapper,
		exact: true,
		title: "Kunde erstellen",
		menuItem: "customers",
		resourceKey: "customerCreate",
	},
	{
		path: "/customer/:id",
		type: RouteTypes.PRIVATE,
		component: CustomerDetailWrapper,
		exact: true,
		title: "Kunden-Details",
		menuItem: "customers",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.ONLY_SIDE_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "customerDetails",
	},

	// Article
	{
		path: "/articles",
		type: RouteTypes.PRIVATE,
		component: ArticleListWrapper,
		exact: true,
		title: "Artikel",
		menuItem: "articles",
		submenuItem: "articles",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "article",
	},
	{
		path: "/article/edit/:id",
		type: RouteTypes.PRIVATE,
		component: ArticleEditWrapper,
		exact: true,
		title: "Artikel bearbeiten",
		menuItem: "articles",
		resourceKey: "articleEdit",
	},
	{
		path: "/article/new",
		type: RouteTypes.PRIVATE,
		component: ArticleNewWrapper,
		exact: true,
		title: "Artikel erstellen",
		menuItem: "articles",
		resourceKey: "articleCreate",
	},
	{
		path: "/article/:id",
		type: RouteTypes.PRIVATE,
		component: ArticleDetailWrapper,
		exact: true,
		title: "Artikel-Details",
		menuItem: "articles",
		resourceKey: "articleDetails",
	},

	// Inventory

	{
		path: "/inventory",
		type: RouteTypes.PRIVATE,
		component: InventoryListWrapper,
		exact: true,
		title: "Stock Movement",
		menuItem: "articles",
		submenuItem: "inventory",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "inventory",
	},

	// Expense
	{
		path: "/expenses",
		type: RouteTypes.PRIVATE,
		component: ExpenseListWrapper,
		exact: true,
		title: "Ausgaben",
		menuItem: "expenditure",
		submenuItem: "expenditures",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "expenditures",
	},
	{
		path: "/expenses/cancellations",
		type: RouteTypes.PRIVATE,
		component: CancellationListWrapper,
		exact: true,
		title: "Ausgaben",
		menuItem: "expenditure",
		submenuItem: "debitNotes",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "",
	},
	{
		path: "/expenses/cancellation/:id",
		type: RouteTypes.PRIVATE,
		component: CancellationInvoiceDetailWrapper,
		exact: true,
		title: "Stornorechnungs-Details",
		menuItem: "expenditure",
		submenuItem: "debitNotes",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "",
	},
	{
		path: "/expense/new",
		type: RouteTypes.PRIVATE,
		component: ExpenseNewWrapper,
		exact: true,
		title: "Ausgabe erstellen",
		menuItem: "expenditure",
		submenuItem: "expenses",
		resourceKey: "expenseCreate",
	},
	{
		path: "/expense/new/customer/:id",
		type: RouteTypes.PRIVATE,
		component: ExpenseNewWrapper,
		exact: true,
		title: "Ausgabe erstellen",
		menuItem: "expenditure",
		submenuItem: "expenses",
		resourceKey: "expenseCreate",
	},
	{
		path: "/expense/edit/:id",
		type: RouteTypes.PRIVATE,
		component: ExpenseEditWrapper,
		exact: true,
		title: "Ausgabe bearbeiten",
		menuItem: "expenditure",
		submenuItem: "expenses",
		resourceKey: "expenseEdit",
	},
	// chart of accounts
	{
		path: "/expenses/chart-of-accounts",
		type: RouteTypes.PRIVATE,
		component: ChartofaccountListWrapper,
		exact: true,
		title: "Ausgabe ",
		menuItem: "expenditure",
		submenuItem: "chartOfAccounts",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "chartOfAccounts",
	},
	// Cash and bank
	{
		path: "/cash-and-bank",
		type: RouteTypes.PRIVATE,
		component: CashAndBankWrapper,
		exact: true,
		title: "Cash and Bank",
		menuItem: "expenditure",
		submenuItem: "cashAndBank",
		pageClass: PageClassNames.ONLY_SIDE_MARGIN,
		resourceKey: "cashAndBank",
	},
	// Transactions
	{
		path: "/transactions",
		type: RouteTypes.PRIVATE,
		component: TransactionsListWrapper,
		exact: true,
		title: "Transactions",
		menuItem: "expenditure",
		submenuItem: "transactions",
		// pageClass: PageClassNames.ONLY_SIDE_MARGIN,
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
		resourceKey: "transactions",
	},

	// GST Export
	{
		path: "/document-export",
		type: RouteTypes.PRIVATE,
		component: SettingsDocumentExportWrapper,
		exact: true,
		title: "GST Export",
		menuItem: "documentExport",
		resourceKey: "settingsTaxExport",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW}`,
	},

	// Settings
	{
		path: "/settings/account",
		type: RouteTypes.PRIVATE,
		component: SettingsAccountWrapper,
		exact: true,
		title: "Einstellungen - Account",
		menuItem: "settings",
		submenuItem: "account",
		resourceKey: "settingsAccount",
	},
	{
		path: "/settings/account-setting",
		type: RouteTypes.PRIVATE,
		component: SettingsAccountWrapper,
		exact: true,
		title: "Einstellungen - Account",
		menuItem: "account-setting",
		submenuItem: "account-setting",
		resourceKey: "accountSetting",
	},
	{
		path: "/settings/billing",
		type: RouteTypes.PRIVATE,
		component: SettingsAccountWrapper,
		exact: true,
		title: "Einstellungen - Billing",
		menuItem: "billing",
		submenuItem: "billing",
		resourceKey: "billing",
	},
	{
		path: "/settings/user",
		type: RouteTypes.PRIVATE,
		component: SettingsUserWrapper,
		exact: true,
		title: "Einstellungen - Benutzer",
		menuItem: "teamMembers",
		submenuItem: "user",
		// pageClass: PageClassNames.WIDTH_AUTO
	},
	// {
	// 	path: '/settings/document-export',
	// 	type: RouteTypes.PRIVATE,
	// 	component: SettingsDocumentExportWrapper,
	// 	exact: true,
	// 	title: 'Einstellungen - Steuerberater-Export',
	// 	menuItem: 'settings',
	// 	submenuItem: 'documentExport',
	// 	resourceKey: 'settingsTaxExport'
	// },
	{
		path: "/settings/data-import",
		type: RouteTypes.PRIVATE,
		component: SettingsDataImportOverviewWrapper,
		exact: true,
		title: "Einstellungen - Import",
		menuItem: "settings",
		submenuItem: "dataImport",
		resourceKey: "settingsImport",
	},
	{
		path: "/settings/data-import/articles/:step",
		type: RouteTypes.PRIVATE,
		component: SettingsDataImportArticlesWrapper,
		exact: true,
		title: "Einstellungen - Import",
		menuItem: "settings",
		submenuItem: "dataImport",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW} `,
		resourceKey: "settingsImport",
	},
	{
		path: "/settings/data-import/customers/:step",
		type: RouteTypes.PRIVATE,
		component: SettingsDataImportCustomersWrapper,
		exact: true,
		title: "Einstellungen - Import",
		menuItem: "settings",
		submenuItem: "dataImport",
		pageClass: `${PageClassNames.NO_SIDE_MARGIN} ${PageClassNames.NO_TOP_MARGIN} ${PageClassNames.FULLSIZE_VIEW} `,
		resourceKey: "settingsImport",
	},
	{
		path: "/settings/payment-conditions",
		type: RouteTypes.PRIVATE,
		component: SettingsPaymentConditionsWrapper,
		exact: true,
		title: "Einstellungen - Zahlungsbedingungen",
		menuItem: "settings",
		submenuItem: "paymentConditions",
		resourceKey: "settingsTermsOfPayment",
	},
	{
		path: "/settings/text-modules",
		type: RouteTypes.PRIVATE,
		component: SettingsTextModulesWrapper,
		exact: true,
		title: "Einstellungen - Textbausteine",
		menuItem: "settings",
		submenuItem: "textModules",
		resourceKey: "settingsTextModules",
	},
	{
		path: "/settings/text-modules/offer",
		type: RouteTypes.PRIVATE,
		component: SettingsTextModulesWrapper,
		exact: true,
		title: "Einstellungen - Textbausteine",
		menuItem: "invoices",
		submenuItem: "offer",
		resourceKey: "settingsTextModules",
	},
	{
		path: "/settings/text-modules/invoice",
		type: RouteTypes.PRIVATE,
		component: SettingsTextModulesWrapper,
		exact: true,
		title: "Einstellungen - Textbausteine",
		menuItem: "invoices",
		submenuItem: "invoice",
		resourceKey: "settingsTextModules",
	},
	{
		path: "/settings/dunning",
		type: RouteTypes.PRIVATE,
		component: SettingsDunningsWrapper,
		exact: true,
		title: "Einstellungen - Mahnwesen",
		menuItem: "invoices",
		submenuItem: "invoice",
		resourceKey: "settingsDunnig",
	},
	{
		path: "/settings/more-settings",
		type: RouteTypes.PRIVATE,
		component: SettingsMoreSettingsWrapper,
		exact: true,
		title: "Einstellungen - Weitere Einstellungen",
		menuItem: "settings",
		submenuItem: "moreSettings",
		resourceKey: "settingsMore",
	},
	{
		path: "/settings/more-settings/offer",
		type: RouteTypes.PRIVATE,
		component: SettingsMoreSettingsWrapper,
		exact: true,
		title: "Einstellungen - Weitere Einstellungen",
		menuItem: "invoices",
		submenuItem: "offer",
		resourceKey: "settingsMore",
	},
	{
		path: "/settings/more-settings/invoice",
		type: RouteTypes.PRIVATE,
		component: SettingsMoreSettingsWrapper,
		exact: true,
		title: "Einstellungen - Weitere Einstellungen",
		menuItem: "invoices",
		submenuItem: "invoice",
		resourceKey: "settingsMore",
	},
	{
		path: "/settings/more-settings/customer-categories",
		type: RouteTypes.PRIVATE,
		component: SettingsMoreSettingsWrapper,
		exact: true,
		title: "Einstellungen - Weitere Einstellungen",
		menuItem: "customers",
		submenuItem: "moreSettings",
		resourceKey: "settingsMore",
	},
	{
		path: "/settings/more-settings/customer",
		type: RouteTypes.PRIVATE,
		component: SettingsMoreSettingsWrapper,
		exact: true,
		title: "Einstellungen - Weitere Einstellungen",
		menuItem: "customers",
		submenuItem: "moreSettings",
		resourceKey: "settingsMore",
	},
	{
		path: "/settings/more-settings/article-categories",
		type: RouteTypes.PRIVATE,
		component: SettingsMoreSettingsWrapper,
		exact: true,
		title: "Einstellungen - Weitere Einstellungen",
		menuItem: "articles",
		submenuItem: "moreSettings",
		resourceKey: "settingsMore",
	},
	{
		path: "/settings/more-settings/article",
		type: RouteTypes.PRIVATE,
		component: SettingsMoreSettingsWrapper,
		exact: true,
		title: "Einstellungen - Weitere Einstellungen",
		menuItem: "articles",
		submenuItem: "moreSettings",
		resourceKey: "settingsMore",
	},
	// Short Urls / Redirect
	{
		path: "/redirect/:shortUrl",
		type: RouteTypes.ROUTE,
		component: RedirectComponent,
		exact: true,
		title: "Redirecting",
	},

	// Admin panel
	{
		path: "/admin-panel",
		type: RouteTypes.PRIVATE,
		component: AdminPanelWrapper,
		exact: true,
		title: "Admin Panel",
		menuItem: "admin-panel",
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		resourceKey: "adminPanel",
	},

	// Global
	{
		path: "/reload",
		type: RouteTypes.ROUTE,
		component: ({ history, location, match }) => {
			return null;
		},
		exact: false,
	},
	{
		path: "/dashboard",
		type: RouteTypes.PRIVATE,
		component: DashboardWrapper,
		exact: true,
		title: "Startseite",
		menuItem: "dashboard",
		resourceKey: "dashboard",
	},
	{
		path: "/marketplace",
		type: RouteTypes.PRIVATE,
		component: MarketplaceWrapper,
		pageClass: PageClassNames.NO_SIDE_MARGIN,
		exact: true,
		title: "Marktplatz",
		menuItem: "marketplace",
		resourceKey: "marketplace",
	},
	{
		type: RouteTypes.ROUTE,
		component: UnmatchedRoute,
		exact: false,
	},
];

export default routes;
