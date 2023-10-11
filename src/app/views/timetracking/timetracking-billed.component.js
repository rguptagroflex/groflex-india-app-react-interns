import React from "react";
import { Link } from "react-router-dom";
import TopbarComponent from "shared/topbar/topbar.component";
import accounting from "accounting";
import config from "config";
import { convertMinutesToTimeString } from "helpers/timetracking";
import timetrackingWatchIcon from "assets/images/svg/timetracking-watch-2.svg";
import alarmOutlined from "assets/images/svg/alarmOutlined.svg";
import SVGInline from "react-svg-inline";
import ListComponent from "shared/list/list.component";
import ListAdvancedComponent from "../../shared/list-advanced/list-advanced.component";
import { ListAdvancedDefaultSettings } from "../../helpers/constants";
import { dateCompareSort, localeCompare, localeCompareNumeric } from "../../helpers/sortComparators";
import ModalService from "../../services/modal.service";
import invoiz from "../../services/invoiz.service";

class TimetrackingBilledComponent extends React.Component {
	constructor(props) {
		super(props);

		const totalToBeInvoicedAmount = this.props.trackedTimes.reduce((totalMoney, currTimeTrackingModel) => {
			return totalMoney + currTimeTrackingModel.priceTotal;
		}, 0);

		const totalMoney = accounting.formatMoney(totalToBeInvoicedAmount, config.currencyFormat);

		const totalToBeInvoiceTime = this.props.trackedTimes.reduce((totalDurationInMinutes, currTimeTrackingModel) => {
			return totalDurationInMinutes + currTimeTrackingModel.durationInMinutes;
		}, 0);

		const totalTime = convertMinutesToTimeString(totalToBeInvoiceTime);

		this.state = {
			customer: this.props.customer,
			trackedTimes: this.props.trackedTimes,
			totalMoney,
			totalTime,
		};
	}

	render() {
		const { resources, customer } = this.props;
		const { trackedTimes, totalTime, totalMoney } = this.state;

		const tableColumns = [
			{ title: resources.str_date },
			{
				title: resources.str_activity,
				width: "30%",
				valueStyle: { fontWeight: 600 },
				subValueStyle: { fontWeight: "normal", fontSize: "14px", color: "#666" },
			},
			{ title: resources.str_duration, align: "right" },
			{ title: resources.str_amount, align: "right" },
			{ title: " ", align: "right" },
		];

		const tableRows = [];
		this.state.trackedTimes.forEach((tracking, index) => {
			tableRows.push({
				cells: [
					{ value: tracking.humanizedDate },
					{ value: tracking.taskDescriptionPrefix, subValue: tracking.taskDescription },
					{ value: tracking.trackedTimeString },
					{ value: tracking.summedUpCost },
					{
						value: tracking.invoice ? (
							<Link to={`/invoice/${tracking.invoice.id}`}>{resources.str_toTheBill}</Link>
						) : (
							""
						),
					},
				],
				id: index,
			});
		});

		// console.log(tableRows[0].cells[4].value.props.to, "tablerows");
		// console.log(tableRows);

		return (
			<div className="timetracking-billed-component wrapper-has-topbar-with-margin">
				<TopbarComponent backButtonRoute="/invoices/timetracking" title={resources.str_billedTimes} />

				{/* <div className="box">
					<div className="row">
						<div className="col-xs-8">
							<div className="text-h2">{resources.str_billedTimes}</div>
							<div className="u_pt_40">
								<div className="text-bold">{this.state.customer.displayName}</div>
								<div>{this.state.customer.address.street}</div>
								<div>
									{this.state.customer.address.zipCode + " " + this.state.customer.address.city}
								</div>
							</div>
						</div>
						<div className="col-xs-4 timetracking-watch-wrapper">
							<SVGInline svg={alarmOutlined} className="timetracking-watch" />
							<div className="timetracking-watch-text">
								<div className="text-h1">{this.state.totalTime}</div>
								<div className="text-bold text-light">{this.state.totalMoney}</div>
							</div>
						</div>
					</div>
				</div>

				<div className="box">
					<ListComponent
						tableId="timetracking-billed-component-table"
						columns={tableColumns}
						rows={tableRows}
						resources={resources}
					/>
				</div> */}

				<div className="detail-view-content-wrapper">
					{/* First row */}
					<div className="customer-and-time-tracking row">
						<div className="detail-view-content-left col-xs-5 box">
							<div className="text-h5 color-primary">{customer.companyName}</div>
							<div className="row left-content-wrapper">
								<div className="col-xs-5 first-half">
									<div className="sub-info-box">
										<div className="sub-info-title">Customer Number</div>
										<div className="sub-info-content">{customer.number}</div>
									</div>
									<div className="sub-info-box">
										<div className="sub-info-title">Email</div>
										<div className="sub-info-content">{customer.email}</div>
									</div>
								</div>
								<div className="col-xs-7 second-half">
									<div className="sub-info-box">
										<div className="sub-info-title">Address</div>
										<div className="sub-info-content">
											<div>{customer.address.street}</div>
											<div>{customer.address.city + " " + customer.address.zipCode}</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="detail-view-content-right col-xs-7 box">
							<div className="row">
								<div className="col-xs-9">
									<div className="text-h5">Track Time</div>
									{/* Filter date picker and Hours */}
									<div className="u_mt_20">
										<div className="filter-date-picker-container">
											{/* <div>Hi bro</div>
											<div>Hi bro</div> */}
										</div>
										<div className="total-hours-amount-container u_mt_20">
											<div className="total-hours">
												<div className="text-h5">Total hours</div>
												<div className="text-h5">{totalTime}</div>
											</div>
											<div className="total-amount">
												<div className="text-h5">Total amount</div>
												<div className="amount-value text-h5 color-primary">
													{totalMoney.split(" ").slice().reverse().join(" ")}
												</div>
											</div>
										</div>
									</div>
								</div>
								{/* Alarm Icon and it's text */}
								<div className="col-xs-3 timetracking-watch-wrapper">
									{/* <SVGInline svg={timetrackingWatchIcon} className="timetracking-watch" /> */}
									<SVGInline svg={alarmOutlined} className="timetracking-watch" />
									<div className="timetracking-watch-text">
										<div className="text-h1">{totalTime}</div>
										<div className="text-bold text-light">
											{totalMoney.split(" ").slice().reverse().join(" ")}
										</div>
									</div>
								</div>
							</div>
							{/* </div> */}
						</div>
					</div>
				</div>
				<div className="timetracking-list-wrapper ">
					<ListAdvancedComponent
						fetchUrls={[
							`${config.resourceHost}trackedTime/customer/${parseInt(customer.id, 10)}?status=invoiced`,
						]}
						responseDataMapFunc={(trackedTimeList) => {
							// console.log(trackedTimeList, "trackedTime");
							// console.log(tableRows, "tableRows");
							let newTrackedTimeList = [];
							newTrackedTimeList = trackedTimeList.map((trackedTime, index) => {
								trackedTime.date = tableRows[index].cells[0].value;
								trackedTime.activity = tableRows[index].cells[1].value;
								trackedTime.duration = tableRows[index].cells[2].value;
								trackedTime.amount = tableRows[index].cells[3].value;
								return trackedTime;
							});
							// console.log(newTrackedTimeList, "newTrackedTimeList");
							return newTrackedTimeList;
						}}
						refreshData={this.state.refreshData}
						ref="listAdvanced"
						defaultSortModel={{
							colId: "number",
							sort: "asc",
						}}
						columnDefs={[
							{
								headerName: "Date",
								field: "date",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agDateColumnFilter",
								comparator: (date1, date2) => dateCompareSort(date1, date2, config.dateFormat.client),
							},
							{
								headerName: "Activity",
								field: "activity",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter",
							},
							{
								headerName: "Duration",
								field: "duration",
								aggFunc: () => 455,
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								// width: getScaledValue(120, window.innerWidth, 1600),
								comparator: localeCompareNumeric,
								cellStyle: () => {
									return { textAlign: "right" };
								},
								valueGetter: (evt) => {
									// console.log(evt.data.duration);
									return evt.data.duration;
								},
								filter: "agTextColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									longName: "Duration",
									// calculateHeaderSum: true,
									calculateHeaderSumType: "time",
								},
							},
							{
								headerName: "Amount",
								field: "amount",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								// valueFormatter: (evt) => {
								// 	return formatCurrency(evt.data.amount.split(" ").slice().reverse()[1]);
								// },
								filter: "agDateColumnFilter",
								customProps: {
									calculateHeaderSum: true,
								},
								cellRenderer: (evt) => {
									// console.log(evt.data);
									return evt.data.amount.split(" ").slice().reverse().join(" ");
									// return Number(evt.data.amount.split(" ").slice().reverse()[1]);
								},
							},
						]}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								// console.log(item, "tracking action cell item");
								const entries = [];
								entries.push({
									label: "Go to Invoice",
									action: "goToInvoice",
								});

								return [entries];
							},
							onPopupItemClicked: (trackedTime, popupEntry) => {
								// console.log(itemData, "itemdata");
								// console.log(popupEntry, "popupEntry");
								// this.onActionCellPopupItemClick(trackedTime, popupEntry);
								switch (popupEntry.action) {
									case "goToInvoice":
										invoiz.router.navigate(tableRows[0].cells[4].value.props.to);
										break;
								}
							},
						}}
						onRowClicked={() => {
							invoiz.router.navigate(tableRows[0].cells[4].value.props.to);
						}}
						loadingRowsMessage={"Loading Tracked times list..."}
						usePagination={false}
						multiSelect={false}
					/>
				</div>
			</div>
		);
	}

	onActionCellPopupItemClick(tracking, entry) {
		const { resources, customer } = this.props;
		switch (entry.action) {
			case "goToInvoice":
				invoiz.router.navigate(tableRows[0].cells[4].value.props.to);
				break;
		}
	}
}

export default TimetrackingBilledComponent;
