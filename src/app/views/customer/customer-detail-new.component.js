import invoiz from "services/invoiz.service";
import React from "react";
import _ from "lodash";
import lang from "lang";

import TabsComponent from "../../shared/tabs/tabs.component";
import TopbarComponent from "shared/topbar/topbar.component";
import BarChartMonthsComponent from "shared/charts/bar-chart-months.component";
import config from "config";
import { formatCurrency, formatCurrencyMinusPlus } from "helpers/formatCurrency";
import { format } from "util";
import { createActivityOptions } from "helpers/createActivityOptions";

import NotesComponent from "shared/notes/notes.component";
import LedgerComponent from "shared/ledger/ledger.component";

import accounting from "accounting";
import CustomerHistoryListWrapper from "shared/customer-detail/customer-history-list.wrapper";
import CustomerDocumentListWrapper from "shared/customer-detail/customer-document-list.wrapper";

import CustomerMetadataComponent from "shared/customer-detail/customer-metadata.component";
import CustomerContactInformationComponent from "shared/customer-detail/customer-contact-information.component";
import CustomerContactPersonsComponent from "shared/customer-detail/customer-contact-persons.component";

import WebStorageService from "services/webstorage.service";
import WebStorageKey from "enums/web-storage-key.enum";
import userPermissions from "enums/user-permissions.enum";
import BulkPaymentModalComponent from "shared/modals/bulk-payment-modal.component";
import BulkRefundModalComponent from "shared/modals/bulk-refund-modal.component";

import Payment from "models/payment.model";
import ModalService from "services/modal.service";

import PayIncoming from "assets/images/svg/pay-incoming.svg";
import PayOutgoing from "assets/images/svg/pay-outgoing.svg";
import SVGInline from "react-svg-inline";
import ReceivablePayment from "../../../assets/images/icons/receive-payment-svgrepo-com 1.svg";
import Ellipse from "../../../assets/images/icons/Ellipse 16.svg";
import Coin from "../../../assets/images/icons/coins-stacked-04-svgrepo-com 1.svg";
import CreditNote from "../../../assets/images/icons/simple-notes-svgrepo-com 1.svg";
import IconQuoatation from "../../../assets/images/icons/icon_balance.svg";
import iconOpening from "../../../assets/images/icons/invoice-svgrepo-com 1.svg";
import EllipseGreen from "../../../assets/images/icons/Ellipse_green 16.svg";
import Quotataion from "../../../assets/images/icons/open_quotation.svg";

const TopbarActions = {
	EDIT: 1,
	FETCH_EMAILS: 2,
};
const tabs = ["Contact Overview", "Activities", "Documents"];
class CustomerDetailNewComponent extends React.Component {
	constructor(props) {
		super(props);

		const customer = this.props.customer || {};
		const payCondition = this.props.payCondition || {};

		this.carousel = null;
		this.state = {
			activeTab: "Contact Overview",
		};
		// this.setActiveTab = this.setActiveTab.bind(this);

		this.chartData = _.cloneDeep(customer.salesOrExpensesVolumeData.chartData);
		//this.chartData.splice(0, 6);

		this.state = {
			customer,
			payCondition,
			activeTab: "activities",
			forceReloadChild: false,
			activityOptions: props.activityCategories ? createActivityOptions(props.activityCategories) : [],
			emailStatus: props.emailStatus,
			fetchingEmails: false,
			activityCategories: props.activityCategories,
			canViewExpense: false,
		};

		this.toggleForceReloadState = this.toggleForceReloadState.bind(this);
		// this.checkEmailStatus = this.checkEmailStatus.bind(this);
		// this.getNewEmails = this.getNewEmails.bind(this);
		this.bulkPayment = this.bulkPayment.bind(this);
		this.bulkRefund = this.bulkRefund.bind(this);

		this.timeout = undefined;
		const totalBalanceSum =
			this.state.customer.salesOrExpensesVolumeData.outstandingAmount +
			parseInt(this.state.customer.credits) +
			this.state.customer.balance +
			this.state.customer.openingBalance;
		this.salesOrExpensesData = [
			{
				title: customer.type === `customer` ? `Total revenue` : `Total expenditure`,
				amount: this.state.customer.salesOrExpensesVolumeData.turnoverTotal,
				count:
					customer.type === `customer`
						? this.state.customer.salesOrExpensesVolumeData.invoiceCount
						: this.state.customer.salesOrExpensesVolumeData.expenseCount,
			},
			{
				title:
					customer.type === `customer`
						? totalBalanceSum > 0
							? `Outstanding receivable`
							: totalBalanceSum === 0
							? `Balance`
							: `Outstanding payable`
						: `Open expenditures`,
				amount:
					customer.type === `customer`
						? this.state.customer.balance + this.state.customer.credits
						: this.state.customer.salesOrExpensesVolumeData.openExpensesTurnOver +
						  this.state.customer.salesOrExpensesVolumeData.totalPurchasesTurnOver,
				count:
					customer.type === `customer`
						? null
						: this.state.customer.salesOrExpensesVolumeData.openExpensesCount,
			},
			{
				title: customer.type === `customer` ? null : `Debit notes`,
				amount: customer.type === `customer` ? null : this.state.customer.debits,
				count: customer.type === `customer` ? null : this.state.customer.salesOrExpensesVolumeData.debitsCount,
			},
			{
				title: customer.type === `customer` ? `Open quotations` : `Open purchase orders`,
				amount:
					customer.type === `customer`
						? this.state.customer.salesOrExpensesVolumeData.openOffersTurnOver
						: this.state.customer.salesOrExpensesVolumeData.openPurchaseOrdersTurnOver,
				count:
					customer.type === `customer`
						? this.state.customer.salesOrExpensesVolumeData.openOffersCount
						: this.state.customer.salesOrExpensesVolumeData.openPurchaseOrdersCount,
			},
		];

		invoiz.on("userModelSubscriptionDataSet", this.updateHistoryListFilterItems, this);
	}
	setActiveTab(tab) {
		this.setState({ activeTab: tab });
	}

	componentWillUnmount() {
		$(".layout-wrapper").removeClass("is-scrollable");

		invoiz.off("userModelSubscriptionDataSet", this.updateHistoryListFilterItems, this);
	}

	componentDidMount() {
		$(".layout-wrapper").addClass("is-scrollable");
		this.setState({
			canViewExpense: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_EXPENSE),
		});
		this.setState({ activeTab: "Contact Overview" });
	}

	onSaveNotesClick({ notes, notesAlert }) {
		const customer = _.cloneDeep(this.state.customer);

		customer.notes = notes;
		customer.notesAlert = notesAlert;

		invoiz
			.request(`${config.resourceHost}customer/${customer.id}`, {
				auth: true,
				method: "PUT",
				data: customer,
			})
			.then((response) => {
				invoiz.page.showToast({ message: "The customer has been updated successfully!" });
				const customerUpdated = new Customer(customer);
				this.setState({ customer: customerUpdated });
			})
			.catch(() => {
				// invoiz.page.showToast({ message: lang.defaultErrorMessage });
			});
	}

	onTopbarButtonClick(action) {
		const { customer } = this.state;

		if (action === TopbarActions.EDIT) {
			invoiz.router.navigate(`/${config.customer.clientUrl.single}/edit/${customer.id}`);
		}

		if (action === TopbarActions.FETCH_EMAILS) {
			this.getNewEmails();
		}
	}

	getNewEmails() {
		const {
			customer: { id },
		} = this.state;
		this.setState(
			{
				fetchingEmails: true,
			},
			() => {
				invoiz
					.request(`${config.resourceHost}email/new/${id}`, { auth: true })
					.then(({ body: { eventId } }) => {
						WebStorageService.setItem(`customerEmailEventId-${id}`, eventId, true);
					})
					.then(() => {
						this.checkEmailStatus();
					})
					.catch((err) => {
						console.log(err);
						this.setState({
							fetchingEmails: false,
						});
					});
			}
		);
	}

	getConditions() {
		const { customer, payCondition } = this.state;

		return (
			<React.Fragment>
				<div className="text-h4">Conditions</div>

				<div
					className="row u_mt_20 condition-box u_pt_20 u_pb_20 u_ml_2"
					style={{ display: " inline-flex", padding: "16px", alignItems: "flex-start", gap: "32px" }}
				>
					<div className="col-xs-6 " style={{ maxWidth: "33%" }}>
						<div className="text-muted text-medium u_mb_6">Payment terms</div>
						<div className="text-h6 ">{payCondition.name}</div>
					</div>
					<div className="col-xs-6 col-no-gutter-left">
						<div className="text-muted text-medium u_mb_6">Discount</div>
						<div className="text-h6">{customer.discount}%</div>
					</div>
				</div>
			</React.Fragment>
		);
	}
	renderOpeningBalance() {
		const { customer } = this.state;
		const formattedOpeningBalance = formatCurrencyMinusPlus(customer.openingBalance);

		return (
			<div className="opening-balance-container">
				<div style={{ marginTop: "-10%" }}>
					<SVGInline svg={IconQuoatation} alt={"Could not load image!"} />
				</div>
				<div className="text-muted text-medium u_mb_6">
					<span>Opening </span>
					<br />
					<span>balance</span>
				</div>
				<div className="text-h6 text-primary">{formattedOpeningBalance}</div>
			</div>
		);
	}

	renderOutstandingReceivables() {
		const { customer } = this.state;
		console.log("renderOutstandingReceivables:", customer.outstandingAmount);
		const formattedOutstandingReceivables = formatCurrencyMinusPlus(
			customer.salesOrExpensesVolumeData.outstandingAmount
		);

		return (
			<div className="outstanding-receivables-container">
				<SVGInline className="overlay-image-red" svg={ReceivablePayment} alt={"Could not load image!"} />
				<div className="text-muted text-medium u_mb_6 u_mt_10">
					<span>Outstanding</span>
					<br />
					<span>receivables</span>
				</div>
				<div className="text-h6 text-primary">
					{/* {formatCurrency(customer.salesOrExpensesVolumeData.outstandingAmount)} */}
					{formattedOutstandingReceivables}
				</div>
			</div>
		);
	}
	renderExcessPayment() {
		const { customer } = this.state;
		console.log("renderExcessPayment:", customer.balance);
		const formattedOutstandingReceivables = formatCurrencyMinusPlus(customer.balance);

		return (
			<div className="excess-payment-container">
				<SVGInline className="overlay-image-red" svg={Coin} alt={"Could not load image!"} />
				<div className="text-muted text-medium u_mb_6 u_mt_10">
					<span>Excess</span>
					<br />
					<span>payment</span>
				</div>
				<div className="text-h6 text-primary">
					{/* {formatCurrency(customer.salesOrExpensesVolumeData.outstandingAmount)} */}
					{formattedOutstandingReceivables}
				</div>
			</div>
		);
	}

	renderOpenQuotationSection(customer, index) {
		if (!customer || typeof customer.balance === "undefined" || typeof customer.openingBalance === "undefined") {
			console.log("Data not available for rendering Open Quotation section");
			return null;
		}

		console.log("Customer:", customer);
		const { balance, openingBalance } = customer;
		const balanceSumValue = balance + openingBalance;
		console.log("balanceSumValue:", balanceSumValue);

		return (
			<div key={index} className="open-quotation-container">
				<SVGInline className="overlay-image" svg={Quotataion} alt={"Could not load image!"} />
				<div className="text-muted text-medium u_mb_6 u_mt_10">
					<span>Open</span>
					<br />
					<span>quotations</span>
				</div>
				<div className="row">
					<div className="col-xs-12 col-gutter-right-30">
						<div className={`text-h6 text-primary `}>{formatCurrencyMinusPlus(balanceSumValue)}</div>
					</div>
				</div>
				{index < this.salesOrExpensesData.length - 1 && <hr className="u_mt_20 u_mb_20" />}
			</div>
		);
	}

	renderCreditNotesSection(customer) {
		if (!customer) {
			return null;
		}

		const creditsOrDebitsSum =
			customer.type === "customer"
				? formatCurrencyMinusPlus(this.state.customer.credits)
				: formatCurrencyMinusPlus(this.state.customer.debits);

		return (
			<div className="credit-notes-container">
				<SVGInline className="overlay-image-red" svg={CreditNote} alt={"Could not load image!"} />
				<div className="text-muted text-medium u_mb_6 u_mt_10">
					<span>Credit</span>
					<br />
					<span>notes</span>
				</div>
				<div className="text-h6 text-primary ">{creditsOrDebitsSum}</div>
			</div>
		);
	}

	renderOpenInvoicesSection(customer, index) {
		console.log("renderOpenInvoicesSection:", customer);
		if (!customer) {
			console.log("Customer is undefined or null");
			return null;
		}

		return (
			<div key={index} className="open-invoice-container">
				<SVGInline className="overlay-image" svg={iconOpening} alt={"Could not load image!"} />
				<div className="text-muted text-medium u_mb_6 u_mt_10">
					<span>Open</span>
					<br />
					<span>invoices</span>
				</div>
				<div className="text-h6 text-primary">
					{formatCurrency(customer.salesOrExpensesVolumeData.outstandingAmount)}
				</div>
			</div>
		);
	}

	getSalesOrExpenses() {
		const { customer } = this.state;
		console.log("Sales or Expenses Data:", this.salesOrExpensesData);

		return this.salesOrExpensesData.map((category, index) => {
			if (category.title === "Credit notes") {
				return this.renderCreditNotesSection(customer, index); // Pass the customer object here
			} else if (category.title === "Open quotation") {
				return this.renderOpenQuotationSection(customer, index); // Pass the customer object here
			} else if (category.title === "Open invoices") {
				return this.renderOpenInvoicesSection(customer, index); // Pass the customer object here
			}
		});
	}

	// /////////////////

	// getSalesOrExpenses() {
	// 	const { customer } = this.state;
	// 	console.log("Sales or Expenses Data:", this.salesOrExpensesData);
	// 	return this.salesOrExpensesData.map((category, index) => {
	// 		let onTitleClick = category.title;
	// 		let openInvoicesOrExpensesSum =
	// 			customer.type === `customer`
	// 				? formatCurrency(customer.salesOrExpensesVolumeData.outstandingAmount)
	// 				: formatCurrency(
	// 						customer.salesOrExpensesVolumeData.openExpensesTurnOver +
	// 							customer.salesOrExpensesVolumeData.totalPurchasesTurnOver
	// 				  );
	// 		let creditsOrDebitsSum =
	// 			customer.type === `customer`
	// 				? formatCurrencyMinusPlus(this.state.customer.credits)
	// 				: formatCurrencyMinusPlus(this.state.customer.debits);
	// 		let totalBalanceSum =
	// 			customer.type === `customer`
	// 				? formatCurrencyMinusPlus(
	// 						customer.salesOrExpensesVolumeData.outstandingAmount +
	// 							parseInt(this.state.customer.credits) +
	// 							this.state.customer.balance +
	// 							this.state.customer.openingBalance
	// 				  )
	// 				: formatCurrencyMinusPlus(
	// 						customer.salesOrExpensesVolumeData.openExpensesTurnOver +
	// 							customer.salesOrExpensesVolumeData.totalPurchasesTurnOver +
	// 							this.state.customer.debits +
	// 							this.state.customer.balance +
	// 							this.state.customer.openingBalance
	// 				  );
	// 		const balanceSumValue =
	// 			customer.salesOrExpensesVolumeData.outstandingAmount +
	// 			parseInt(this.state.customer.credits) +
	// 			this.state.customer.balance +
	// 			this.state.customer.openingBalance;
	// 		let balanceSubtitleRow1 = customer.type === `customer` ? `Open invoices` : `Open expenditures`;
	// 		let balanceSubtitleRow2 = customer.type === `customer` ? `Credit notes` : `Debit notes`;
	// 		if (category.title) {
	// 			return (
	// 				<div key={index} className="">
	// 					{customer.type === `customer` &&
	// 					(category.title === `Outstanding payable` ||
	// 						category.title === `Outstanding receivable` ||
	// 						category.title === `Balance`) ? (
	// 						<div className="balance-field">
	// 							<div className="text-h6 u_mb_10">{category.title}</div>
	// 						</div>
	// 					) : (
	// 						<div className="text-h6 u_mb_10">{category.title}</div>
	// 					)}
	// 					{customer.type === `customer` &&
	// 					(category.title === `Outstanding payable` ||
	// 						category.title === `Outstanding receivable` ||
	// 						category.title === `Balance`) ? (
	// 						<div className="row">
	// 							<div className="col-xs-7 col-gutter-right-30">
	// 								{/* <div className="text-muted text-medium u_mb_6">Sum of receivables and payables</div> */}
	// 								<div className={`text-h4 text-primary text-truncate`}>
	// 									{`${totalBalanceSum}`}
	// 									{
	// 										<SVGInline
	// 											height="21px"
	// 											width="26px"
	// 											svg={`${
	// 												balanceSumValue > 0
	// 													? PayIncoming
	// 													: balanceSumValue === 0
	// 													? ""
	// 													: PayOutgoing
	// 											}`}
	// 										/>
	// 									}
	// 								</div>
	// 							</div>
	// 							<div className="col-xs-6 col-gutter-right-30 u_mt_12">
	// 								<div className="text-muted text-medium u_mb_6">Opening Balance</div>
	// 								<div className="text-h4 text-primary text-truncate border-right u_mr_10">
	// 									{formatCurrencyMinusPlus(customer.openingBalance)}
	// 								</div>
	// 							</div>
	// 							<div className="col-xs-5 col-no-gutter-left u_mt_12">
	// 								<div className="text-muted text-medium u_mb_6">Excess payments</div>
	// 								<div className="text-h4 text-primary text-truncate">
	// 									{formatCurrencyMinusPlus(customer.balance)}
	// 								</div>
	// 							</div>
	// 							<div
	// 								className="col-xs-6 col-gutter-right-30 u_mt_12 box-clickable"
	// 								onClick={() => {
	// 									this.onSalesOrExpensesClick(balanceSubtitleRow1, category.count);
	// 								}}
	// 							>
	// 								<div className="text-muted text-medium u_mb_6">{balanceSubtitleRow1}</div>
	// 								<div className="text-h4 text-primary text-truncate border-right u_mr_10">
	// 									{openInvoicesOrExpensesSum}
	// 								</div>
	// 							</div>
	// 							<div
	// 								className="col-xs-5 col-no-gutter-left u_mt_12 box-clickable"
	// 								onClick={() => {
	// 									this.onSalesOrExpensesClick(balanceSubtitleRow2, category.count);
	// 								}}
	// 							>
	// 								<div className="text-muted text-medium u_mb_6">{balanceSubtitleRow2}</div>
	// 								<div className="text-h4 text-primary text-truncate">{creditsOrDebitsSum}</div>
	// 							</div>
	// 						</div>
	// 					) : (
	// 						<div
	// 							className="row"
	// 							onClick={() => {
	// 								this.onSalesOrExpensesClick(onTitleClick, category.count);
	// 							}}
	// 						>
	// 							<div className="col-xs-6 col-gutter-right-30 box-clickable">
	// 								<div className="text-muted text-medium u_mb_6">Amount</div>
	// 								<div className="text-h4 border-right text-primary text-truncate u_mr_10">
	// 									{formatCurrency(category.amount)}
	// 								</div>
	// 							</div>
	// 							<div className="col-xs-5 col-no-gutter-left box-clickable">
	// 								<div className="text-muted text-medium u_mb_6">Number</div>
	// 								<div className="text-h4">{category.count}</div>
	// 							</div>
	// 						</div>
	// 					)}
	// 					{index < this.salesOrExpensesData.length - 1 && <hr className="u_mt_20 u_mb_20" />}
	// 				</div>
	// 			);
	// 		}
	// 	});
	// }
	getTotalRevenue() {
		const { customer } = this.state;
		const totalRevenue =
			customer.type === "customer"
				? customer.salesOrExpensesVolumeData.outstandingAmount
				: customer.salesOrExpensesVolumeData.openExpensesTurnOver +
				  customer.salesOrExpensesVolumeData.totalPurchasesTurnOver;

		return (
			<div className="total-revenue-box">
				<div className="text-h6 u_mb_10">Total Revenue</div>
				<div className="row">
					<div className="col-xs-12 col-gutter-right-30">
						<div className="text-h4 text-primary text-truncate">
							{formatCurrency(totalRevenue)}
							{
								<SVGInline
									height="21px"
									width="26px"
									svg={`${totalRevenue > 0 ? PayIncoming : totalRevenue === 0 ? "" : PayOutgoing}`}
								/>
							}
						</div>
					</div>
				</div>
			</div>
		);
	}

	onSalesOrExpensesClick(category, count) {
		let url,
			webStorageKey,
			settings,
			currentFilter,
			orderBy,
			values = [],
			sort = [],
			customerName,
			filterItems = {};
		customerName = (this.state.customer.name || "").trim();

		if (category === "Total revenue") {
			url = "/invoices";
			webStorageKey = WebStorageKey.INVOICE_LIST_SETTINGS;
			sort.push({ colId: "customerName", sort: "asc" });
			filterItems = {
				customerName: {
					filterType: "text",
					type: "contains",
					filter: customerName,
				},
			};
		} else if (category === "Open invoices") {
			url = "/invoices";
			webStorageKey = WebStorageKey.INVOICE_LIST_SETTINGS;
			values.push("locked");
			sort.push({ colId: "customerName", sort: "asc" });
			filterItems = {
				customerName: {
					filterType: "text",
					type: "contains",
					filter: customerName,
				},
				state: {
					values: values,
					filterType: "set",
				},
			};
		} else if (category === "Open quotations") {
			url = "/offers";
			webStorageKey = WebStorageKey.OFFER_LIST_SETTINGS;
			values.push("open");
			sort.push({ colId: "customerName", sort: "asc" });
			filterItems = {
				customerName: {
					filterType: "text",
					type: "contains",
					filter: customerName,
				},
				state: {
					values: values,
					filterType: "set",
				},
			};
		} else if (category === "Open timesheets") {
			url = "/invoices/timetracking";
			webStorageKey = WebStorageKey.TIMETRACKING_LIST_SETTINGS;
			currentFilter = count === 0 ? "default" : "open";
			orderBy = "customerName";
		} else if (category === "Total expenditure") {
			url = "/expenses";
			webStorageKey = WebStorageKey.EXPENSE_LIST_SETTINGS;
			sort.push({ colId: "date", sort: "asc" });
			values.push(customerName);
			filterItems = {
				"customerData.name": {
					filterType: "text",
					type: "contains",
					filter: customerName,
				},
			};
		} else if (category === "Open expenditures") {
			url = "/expenses";
			webStorageKey = WebStorageKey.EXPENSE_LIST_SETTINGS;
			sort.push({ colId: "date", sort: "asc" });
			values.push(customerName);
			filterItems = {
				"customerData.name": {
					filterType: "text",
					type: "contains",
					filter: customerName,
				},
				status: {
					values: ["open"],
					filterType: "set",
				},
			};
		} else if (category === "Open purchase orders") {
			url = "/purchase-orders";
			webStorageKey = WebStorageKey.PURCHASEORDER_LIST_SETTINGS;
			sort.push({ colId: "date", sort: "asc" });
			values.push(customerName);
			filterItems = {
				"customerData.name": {
					filterType: "text",
					type: "contains",
					filter: customerName,
				},
				state: {
					values: ["open"],
					filterType: "set",
				},
			};
		} else if (category === "Credit notes") {
			url = "/cancellations";
			webStorageKey = WebStorageKey.CANCELLATION_LIST_SETTINGS;
			sort.push({ colId: "date", sort: "asc" });
			values.push(customerName);
			filterItems = {
				customerName: {
					filterType: "text",
					type: "contains",
					filter: customerName,
				},
			};
		} else if (category === "Debit notes") {
			url = "/expenses/cancellations";
			webStorageKey = WebStorageKey.DEBIT_CANCELLATION_LIST_SETTINGS;
			sort.push({ colId: "date", sort: "asc" });
			values.push(customerName);
			filterItems = {
				customerName: {
					filterType: "text",
					type: "contains",
					filter: customerName,
				},
			};
		} else {
			return;
		}
		settings = WebStorageService.getItem(webStorageKey);
		if (settings) {
			settings.filter = filterItems;
			settings.sort = sort;

			WebStorageService.setItem(webStorageKey, {
				filter: settings.filter,
				sort: settings.sort,
			});
		} else {
			settings;
		}

		invoiz.router.navigate(url);
	}

	onMouseEnter($point, $toolTip) {
		const value = $point.attr("ct:value");
		const seriesName = $point.parent().attr("ct:series-name");

		if (seriesName === "sales") {
			$toolTip.removeClass("tooltipLightblue").removeClass("tooltipDarkgray");
		} else {
			$toolTip.addClass("tooltipLightblue");
		}

		$toolTip.html(`${formatCurrency(value)}`).show();
	}

	onMouseMove(event, $toolTip) {
		const box = $(`.${this.target}`)[0].getBoundingClientRect();

		$toolTip.css({
			left: event.pageX - box.left - 10,
			top: event.pageY - box.top - window.pageYOffset + 60,
		});
	}

	onCreateTodoSubmit(todo, customerId) {
		invoiz
			.request(`${config.resourceHost}todo`, {
				auth: true,
				method: "POST",
				data: {
					title: todo.text,
					date: todo.date,
					customerId,
				},
			})
			.then(() => {
				this.toggleForceReloadState();
				invoiz.showNotification({ message: "Das To-Do wurde erfolgreich angelegt." });
			})
			.catch(() => {
				invoiz.showNotification({ type: "error", message: lang.defaultErrorMessage });
			});
	}

	onCreateAktivitySubmit(activity, customerId) {
		invoiz
			.request(`${config.resourceHost}history/activity`, {
				auth: true,
				method: "POST",
				data: {
					title: activity.text,
					category: activity.category,
					customerId,
				},
			})
			.then(() => {
				this.toggleForceReloadState();
				invoiz.showNotification({ message: "Die Aktivität wurde erfolgreich angelegt." });
			})
			.catch(() => {
				invoiz.showNotification({ type: "error", message: lang.defaultErrorMessage });
			});
	}

	toggleForceReloadState() {
		this.setState(
			{
				forceReloadChild: true,
			},
			() => {
				this.setState({
					forceReloadChild: false,
				});
			}
		);
	}

	checkEmailStatus() {
		const {
			customer: { id },
		} = this.state;
		const emailEventId = WebStorageService.getItem(WebStorageKey.EMAIL_EVENT_ID, true);
		const customerEmailEventId = WebStorageService.getItem(`customerEmailEventId-${id}`, true);
		const eventId = customerEmailEventId || emailEventId;

		if (eventId === "undefined" || eventId === "null" || eventId === undefined || eventId === null) {
			this.getNewEmails();
		} else if (invoiz.user && eventId !== "undefined") {
			invoiz
				.request(`${config.resourceHost}email/status/${eventId}`, {
					auth: true,
				})
				.then(({ body: { status } }) => {
					this.setState(
						{
							emailStatus: status,
							fetchingEmails: false,
						},
						() => {
							if (status === "started") {
								this.timeout !== undefined && clearTimeout(this.timeout);
								this.timeout = setTimeout(() => {
									this.checkEmailStatus();
								}, 5000);
							} else if (status === "finished") {
								WebStorageService.removeItem(WebStorageKey.EMAIL_EVENT_ID);
								WebStorageService.removeItem(`customerEmailEventId-${id}`);
								return;
							}
						}
					);
				})
				.catch((err) => {
					console.log(err);
					this.setState({
						fetchingEmails: false,
					});
				});
		}
	}

	createTopbarButtons() {
		const topbarButtons = [
			{
				type: "primary",
				label: "Edit",
				buttonIcon: "icon-edit2",
				action: TopbarActions.EDIT,
				dataQsId: "btn-customer-detail-edit-customer",
			},
		];

		const isStarted = this.state.emailStatus === "started";

		// invoiz.user.isAppEnabledArchiveMails() &&
		// 	this.props.isImapActivated &&
		// 	topbarButtons.unshift({
		// 		type: 'text',
		// 		label: 'E-Mail-Verlauf abrufen',
		// 		buttonIcon: 'icon-reload',
		// 		action: TopbarActions.FETCH_EMAILS,
		// 		disabled: isStarted,
		// 		loading: isStarted,
		// 		dataQsId: 'btn-customer-detail-fetch-emails',
		// 		customCssClass: 'button-fetch-emails',
		// 	});

		return topbarButtons;
	}

	bulkPayment() {
		const { customer } = this.state;
		const { resources } = this.props;
		const {
			displayName,
			customerId,
			salesOrExpensesVolumeData: { outstandingAmount },
			openingBalance,
		} = customer;
		const openAmount =
			openingBalance > 0
				? parseFloat(accounting.toFixed(outstandingAmount + openingBalance, 2), 10)
				: parseFloat(accounting.toFixed(outstandingAmount, 2), 10);

		const payment = new Payment({
			customerName: displayName,
			custId: customer.id,
			amount: openAmount,
			custId: customerId,
			notes: resources.bulkPaymentNoteText,
		});

		const handlePaymentChange = (key, value) => (payment[key] = value);

		ModalService.open(
			<BulkPaymentModalComponent
				customer={customer}
				handlePaymentChange={handlePaymentChange}
				invoiceOutstandingAmount={outstandingAmount}
				payment={payment}
				resources={resources}
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
	bulkRefund() {
		const { customer } = this.state;
		const { resources } = this.props;
		const {
			displayName,
			customerId,
			openingBalance,
			credits,
			balance,
			salesOrExpensesVolumeData: { outstandingAmount },
		} = customer;

		const totalDues = openingBalance > 0 ? openingBalance : 0;
		const previousBalance = parseFloat(
			accounting.toFixed(
				Math.abs(credits) + Math.abs(balance) + Math.abs(openingBalance < 0 ? openingBalance : 0),
				2
			),
			10
		);
		let amount = previousBalance;

		let isClearingDues = false;
		let clearingDues = 0;

		if (amount > 0) {
			isClearingDues = true;
			if (amount >= totalDues) {
				amount = parseFloat(accounting.toFixed(amount - totalDues, 2));
				clearingDues = totalDues;
			} else {
				clearingDues = amount;
				amount = 0;
			}
		}

		let isClearingInvoiceAmount = false;
		let clearingInvoiceAmount = 0;

		if (amount > 0) {
			isClearingInvoiceAmount = true;
			if (amount >= outstandingAmount) {
				amount = parseFloat(accounting.toFixed(amount - outstandingAmount, 2));
				clearingInvoiceAmount = outstandingAmount;
			} else {
				clearingInvoiceAmount = amount;
				amount = 0;
			}
		}

		const data = {
			invoiceOutstandingAmount: outstandingAmount,
			totalDues,
			previousBalance,
			isClearingDues,
			clearingDues,
			isClearingInvoiceAmount,
			clearingInvoiceAmount,
		};

		const payment = new Payment({
			customerName: displayName,
			custId: customer.id,
			amount,
			custId: customerId,
			notes: resources.bulkRefundNoteText,
		});
		const handlePaymentChange = (key, value) => (payment[key] = value);

		ModalService.open(
			<BulkRefundModalComponent
				customer={customer}
				handlePaymentChange={handlePaymentChange}
				data={data}
				payment={payment}
				resources={resources}
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

	render() {
		const { customer, forceReloadChild, activityOptions, activityCategories, canViewExpense } = this.state;
		const { activeTab } = this.state;

		const { resources } = this.props;
		const topbarButtons = this.createTopbarButtons();

		return (
			<div className="customer-detail-wrapper wrapper-has-topbar">
				<TopbarComponent
					title={customer.name}
					backButtonRoute={`/customers`}
					buttonCallback={(e, button) => this.onTopbarButtonClick(button.action)}
					buttons={topbarButtons}
				/>
				<div className="row">
					<div className="tabs-container" style={{ display: "flex", marginLeft: "10px", marginTop: "30px" }}>
						<TabsComponent activeTab={this.state.activeTab} setActiveTab={this.setActiveTab}>
							<TabsComponent.List>
								{tabs.map((tab, index) => (
									<div
										key={index}
										className={`tab-item ${this.state.activeTab === tab ? "active-tab" : ""}`}
										onClick={() => this.setActiveTab(tab)}
										style={{
											marginRight: "20px",
											cursor: "pointer",
											position: "relative",
											color: this.state.activeTab === tab ? "#00A353" : "#272D30",
										}}
									>
										{tab}
										{this.state.activeTab === tab && (
											<div>
												<div
													style={{
														content: "",
														display: "block",
														position: "absolute",
														bottom: "-7px",
														left: "0",
														width: "100%",
														height: "3px",
														backgroundColor: "#00A353",
													}}
												/>
												<div
													style={{
														content: "",
														display: "block",
														position: "absolute",
														bottom: "-8px",
														left:
															this.state.activeTab === "Contact Overview"
																? "0px"
																: this.state.activeTab === "Activities"
																? "-220%"
																: "-280%",

														width: "1112px",
														height: "1px",
														background: "#C6C6C6",
													}}
												/>
											</div>
										)}
									</div>
								))}
							</TabsComponent.List>
						</TabsComponent>
					</div>
				</div>
				<div className="wrap-detail-contact">
					{activeTab === "Contact Overview" && (
						<div>
							<div className="row">
								<div className="col-xs-3">
									<CustomerMetadataComponent
										customer={customer}
										bulkPayment={this.bulkPayment}
										issueRefund={this.bulkRefund}
										className="u_ml_2"
									/>
									<div className="row u_mt_16">
										<div className=" box-rounded customer-notes detail-wrap">
											<NotesComponent
												data={customer}
												heading={resources.str_remarks}
												// placeholder={resources.customerDetailCommentsAboutCustomer}
												// notesAlertLabel={resources.str_seeNoteConfirmationMessage}
												// showToggleInput={true}
												onSave={({ notes, notesAlert }) =>
													this.onSaveNotesClick({ notes, notesAlert })
												}
												resources={resources}
												defaultFocus={true}
											/>
										</div>
										<div
											className=" box-rounded customer-conditions detail-wrap u_mt_20 "
											style={{
												display: "flex",
												width: "291px",
												padding: "16px",
												flexDirection: "column",
												alignItems: "flex-start",
												gap: "8px",
											}}
										>
											{this.getConditions()}
										</div>
									</div>
								</div>
								<div className="col-xs-9">
									<div className="row wrap-colums-detail">
										<div className="col-xs-6 detail-wrap-column">
											<div className="row u_m_16 row-box-col">
												<div className=" col-xs-4 box-column">
													{" "}
													{this.renderOpenQuotationSection(customer)}
												</div>
												<div className="col-xs-4 box-column">{this.renderOpeningBalance()}</div>
												<div className="col-xs-4 box-column">
													{this.renderOpenInvoicesSection(customer)}
												</div>
											</div>

											<div className="row u_m_16 row-box-col">
												<div className=" col-xs-4 box-column">
													{this.renderOutstandingReceivables()}
												</div>
												<div className="col-xs-4 box-column">{this.renderExcessPayment()}</div>
												<div className="col-xs- box-column">
													{" "}
													{this.renderCreditNotesSection(this.state.customer)}
												</div>
											</div>
										</div>
										<div className="col-xs-6 ">
											<CustomerContactInformationComponent customer={customer} />
										</div>
									</div>
									<div className="row u_mt_16 u_ml_12" style={{ width: "780px" }}>
										<div className="col-xs-12 detail-wrap-column ">
											<div className=" customer-sales-chart u_p_16">
												<div className="row">
													<div className=" col-xs-9 ">
														<div className="text-h4">
															{customer.type === "customer"
																? `Sales overview`
																: `Expenditure overview`}
														</div>
														<div className="text-muted u_mt_16 u_mb_40">
															{customer.type === "customer"
																? `Sales over the last 12 months`
																: `Expenditure over the last 12 months`}
														</div>
													</div>
													<div className=" col-xs-2 detail-wrap-revenue total-revenue ">
														{" "}
														{this.getTotalRevenue()}
													</div>
												</div>

												<BarChartMonthsComponent
													target="customerSalesVolumeStats"
													data={this.chartData}
													// height="320px"
													// showTooltip={true}
													// onMouseEnter={this.onMouseEnter}
													// onMouseMove={this.onMouseMove}
												/>
											</div>
										</div>
									</div>
								</div>

								{/* /////////////////////////////////////
				<div className="col-xs-7 col-no-gutter-left flexible-height">
					<div className="row">
						<CustomerContactInformationComponent customer={customer} />
					</div>
					<div className={`row ${canViewExpense && customer.type === "customer" ? "" : "opacityLedger"}`}>
						{
							<div className="box box-rounded col-no-gutter-bottom customer-statements">
								{false && <div className="customer-statements-container-blank"></div>}
								<LedgerComponent customerId={customer.id} resources={resources} />
							</div>
						}
					</div>
					{/* {!forceReloadChild && (
							<div className="box box-rounded customer-todos-activities u_p_0">
								<div className="customer-tabs u_vc">
									<div
										className={`customer-tab uppercase ${
											activeTab === 'activities' ? 'active-tab' : ''
										}`}
										onClick={() => {
											this.setActiveTab('activities');
										}}
									>
										Aktivität
									</div>
									<div
										className={`customer-tab uppercase ${activeTab === 'todo' ? 'active-tab' : ''}`}
										onClick={() => {
											this.setActiveTab('todo');
										}}
									>
										To-Do
									</div>
								</div>
								<div className="customer-tab-content">
									{activeTab === 'todo' && (
										<TextWithTagsInput
											hasDateSelect={true}
											focusOnRender={true}
											tagifySettings={{
												placeholder: 'To-Do hinzufügen und per Enter bestätigen',
											}}
											onTagSubmit={(todo) => {
												this.onCreateTodoSubmit(todo, customer.id);
											}}
										/>
									)}
									{activeTab === 'activities' && (
										<TextWithCategoriesInput
											options={activityOptions}
											defaultOption="Notiz"
											dataQsId="create-activity-type-select"
											onCategoryAdd={(category, callback) => {
												const categories = [...activityCategories, category];

												invoiz
													.request(config.settings.endpoints.activity, {
														auth: true,
														method: 'POST',
														data: { categories },
													})
													.then(() => {
														invoiz.page.showToast({
															message: format(
																lang.tagAddSuccessMessage,
																'Aktivität',
																category
															),
														});

														this.setState({
															activityOptions: createActivityOptions(categories),
															activityCategories: categories,
														});
														callback && callback();
													})
													.catch(() => {
														invoiz.page.showToast({
															type: 'error',
															message: lang.defaultErrorMessage,
														});
													});
											}}
											onSubmit={(category) => {
												this.onCreateAktivitySubmit(category, customer.id);
											}}
										/>
									)}
								</div>
							</div>
						)} */}
								{/* </div> */}
								{/* //////////////////////////////////// */}
							</div>
						</div>
					)}
					{/* {activeTab === "Activities" && (
						<div className="row">
							<div className="col-xs-12">
								{customer.contactPersons && !!customer.contactPersons.length && (
									<CustomerContactPersonsComponent contactPersons={customer.contactPersons} />
								)}
							</div>
						</div>
					)} */}
					{activeTab === "Ledger" && (
						<div className="row">
							<div className="col-xs-7 col-no-gutter-left">
								<div className="box box-rounded customer-sales-chart">
									<div className="text-h4">
										{customer.type === "customer" ? `Sales overview` : `Expenditure overview`}
									</div>
									<div className="text-muted u_mt_10 u_mb_40">
										{customer.type === "customer"
											? `Sales over the last 12 months`
											: `Expenditure over the last 12 months`}
									</div>
									<BarChartMonthsComponent
										target="customerSalesVolumeStats"
										data={this.chartData}
										// height="320px"
										// showTooltip={true}
										// onMouseEnter={this.onMouseEnter}
										// onMouseMove={this.onMouseMove}
									/>
								</div>
							</div>
							<div className="col-xs-5 col-no-gutter-left customer-statements-adjustment-1">
								<div className="box box-rounded customer-sales">{this.getSalesOrExpenses()}</div>
							</div>
						</div>
					)}
					{activeTab === "Activities" && (
						<div className="row" style={{ marginTop: "-50%", width: "95%", marginLeft: "-50px" }}>
							<div className="col-xs-12 detail-wrap">
								<CustomerHistoryListWrapper
									customer={customer}
									forceReload={this.state.forceReloadChild}
									emailStatus={this.state.emailStatus}
									fetchingEmails={this.state.fetchingEmails}
									//checkEmailStatus={this.checkEmailStatus}
									isImapActivated={this.props.isImapActivated}
								/>
							</div>
							{/* // <div className="row"> */}
							{/* <div className="col-xs-12 " style={{ padding: "10px" }}>
								{customer.contactPersons && !!customer.contactPersons.length && (
									<CustomerContactPersonsComponent contactPersons={customer.contactPersons} />
								)}
							</div> */}
						</div>
					)}
					{activeTab === "Documents" && (
						<div className="col-xs-12 col-no-gutter-left">
							<CustomerDocumentListWrapper customer={customer} />
						</div>
					)}
					{/* </div> */}
				</div>
			</div>
		);
	}
}
export default CustomerDetailNewComponent;
