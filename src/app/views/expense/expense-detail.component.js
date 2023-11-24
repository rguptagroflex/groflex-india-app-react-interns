import React, { useEffect } from "react";
import { connect } from "react-redux";
import TopbarComponent from "../../shared/topbar/topbar.component";
import { capitalize } from "lodash";
import { Link } from "react-router-dom";
import abbreviationDateFormat, { dateObjToAbbreviation } from "../../helpers/abbreviationDateFormat";
import invoiz from "../../services/invoiz.service";
import CancelExpenseModalComponent from "../../shared/modals/cancel-expense-modal.component";
import ModalService from "../../services/modal.service";
import RegisterPaymentModalComponent from "./register-payment-modal.component";

const ExpenseDetailComponent = ({ expense, miscOptions, resources, isSubmenuVisible }) => {
	const handleTopbarDropdownClick = (item) => {
		switch (item.action) {
			case "copyAndEdit":
				invoiz.router.navigate(`/expense/edit/${expense.id}`);
				break;

			case "edit":
				invoiz.router.navigate(`/expense/edit/${expense.id}`);
				break;

			case "cancel":
				ModalService.open(<CancelExpenseModalComponent expense={expense} resources={resources} />, {
					width: 800,
				});
				break;
		}
	};

	const createTopbarDropdown = () => {
		const items = [];
		switch (expense.status) {
			case "cancelled":
				items.push([
					{
						label: "Edit",
						action: "edit",
						dataQsId: "expense-topbar-option-edit",
					},
				]);
				break;

			case "open":
				items.push([
					{
						label: "Copy and Edit",
						action: "copyAndEdit",
						dataQsId: "expense-topbar-option-copyAndEdit",
					},
					{
						label: "Cancel",
						action: "cancel",
						dataQsId: "expense-topbar-option-cancel",
					},
				]);
				break;

			case "paid":
				items.push([
					{
						label: "Copy and Edit",
						action: "copyAndEdit",
						dataQsId: "expense-topbar-option-copyAndEdit",
					},
					{
						label: "Cancel",
						action: "cancel",
						dataQsId: "expense-topbar-option-cancel",
					},
				]);
				break;

			default:
				break;
		}
		console.log(items, "topbar dropdown");
		return items;
	};

	const createStateBadge = () => {
		let badgeString = "";
		let iconClass = "";
		let badgeClass = "";
		switch (expense.type) {
			case "expense":
				// iconClass = "icon-offen";
				badgeString = "Expense";
				break;
			case "purchase":
				// iconClass = "icon-check";
				badgeString = "Purchase";
				// badgeClass = "detail-view-badge-accepted";
				break;
		}

		return (
			<div className={`detail-view-badge ${badgeClass}`}>
				<i className={`icon ${iconClass}`} />
				<div className="detail-view-badge-text">{badgeString}</div>
			</div>
		);
	};

	const createTopbarButtons = () => {
		const buttons = [];
		switch (expense.status) {
			case "open":
				buttons.push({
					type: "primary",
					label: "Register Payment",
					action: "registerPayment",
					dataQsId: "expense-Detail-topbar-btn-register-payment",
				});
				break;

			default:
				break;
		}

		return buttons;
	};

	const onTopbarButtonClick = (action) => {
		switch (action) {
			case "registerPayment":
				ModalService.open(<RegisterPaymentModalComponent expense={expense} />, {
					width: 630,
				});
				break;

			default:
				break;
		}
	};

	const getActivityDataList = () => {
		const activityData = {
			activityList: [],
			dateInfo: {
				label: "",
				value: "",
			},
		};

		activityData.activityList.push({
			formattedDate: dateObjToAbbreviation(expense.date),
			message: `Draft Created`,
		});

		switch (expense.status) {
			case "open":
				activityData.dateInfo = {
					label: "Date of Invoice",
					value: dateObjToAbbreviation(expense.date),
				};
				break;
			case "paid":
				activityData.activityList.push({
					formattedDate: dateObjToAbbreviation(expense.payDate),
					message: `Payment of ₹${expense.totalGross}`,
				});
				activityData.dateInfo = {
					label: "Date of purchase",
					value: dateObjToAbbreviation(expense.payDate),
				};
				break;
			case "cancelled":
				if (expense.payKind === "cash" || expense.payKind === "bank") {
					activityData.activityList.push({
						formattedDate: dateObjToAbbreviation(expense.payDate),
						message: `Payment of ₹${expense.totalGross}`,
					});
				}
				activityData.activityList.push({
					formattedDate: dateObjToAbbreviation(expense.metaData.expenseCancellation.date),
					message: `Cancelled`,
				});
				activityData.dateInfo = {
					label: "Date of Debit note",
					value: dateObjToAbbreviation(expense.metaData.expenseCancellation.date),
				};
				break;
			default:
				break;
		}
		activityData.activityList.reverse();
		return activityData;
	};
	const activityData = getActivityDataList();
	const subtitle = () => {
		return (
			<div>
				Debit note no.{" "}
				<a
					onClick={() =>
						invoiz.router.redirectTo(
							`/expenses/cancellation/${expense.metaData.expenseCancellation.id}`,
							false,
							false,
							true
						)
					}
				>
					{expense.metaData.expenseCancellation.number}
				</a>{" "}
				{expense.metaData.expenseCancellation.paidAmount > 0 ? `available for utilization` : null})
			</div>
		);
	};

	console.log(getActivityDataList(), "ACTIVITY DATA LIST");
	console.log(
		`%cExpense detail logfrom Expense detail`,
		"color: white; background-color: #3498db; padding: 8px; border-radius: 4px;",
		expense
	);
	return (
		<div className={`expense-detail-component-wrapper ${isSubmenuVisible ? "expenseDetailOnSidebarActive" : ""}`}>
			<TopbarComponent
				title={`Expenditure ${expense.receiptNumber}`}
				subtitle={expense.status === "cancelled" ? subtitle() : ""}
				buttonCallback={(event, button) => onTopbarButtonClick(button.action)}
				backButtonRoute={"/expenses"}
				dropdownEntries={createTopbarDropdown()}
				dropdownCallback={(entry) => handleTopbarDropdownClick(entry)}
				buttons={createTopbarButtons()}
			/>

			<div className="detail-view-content-wrapper">
				<div className="detail-view-content-left">
					<div className="detail-view-document">
						{createStateBadge()}
						<img className="detail-view-preview" src="/assets/images/invoice-preview.png" />
						{/* {images} */}
						<div id="invoice-detail-pdf-wrapper" />
					</div>
				</div>

				<div className="detail-view-content-right">
					<div className="invoice-info u_p_16">
						<div className="invoice-info-label font-14px">Invoice Amount:</div>
						<h3 className="invoice-amount">₹ {expense.totalGross}</h3>
						<div className="customer-name-container font-14px">
							<div>Vendor</div>
							<Link
								to={`/customer/${expense.customerData.id}`}
								className="customer-name color-primary font-600"
							>
								{expense.customerData.companyName}
							</Link>
						</div>
						<div className="date-of-invoice-container font-14px">
							<div>{activityData.dateInfo.label}</div>
							<div className={"date-of-invoice"}>{activityData.dateInfo.value}</div>
						</div>
					</div>
					<div className="offer-timeline-container box u_p_16">
						<div className="text-semibold">Activities: </div>
						<div className="offer-timeline-content u_pr_20">
							{activityData.activityList.map((activity, index) => (
								<div key={`activity-${index}`} className="offer-timeline-item">
									<span className="timeline-date">{activity.formattedDate}</span>
									<div className={index === 0 ? "greenCircle" : "greyCircleSolid"} />
									<span className="timeline-text">{activity.message}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const mapStateToProps = (state) => {
	const isSubmenuVisible = state.global.isSubmenuVisible;
	return {
		isSubmenuVisible,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		submenuVisible: (payload) => {
			dispatch(submenuVisible(payload));
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(ExpenseDetailComponent);
