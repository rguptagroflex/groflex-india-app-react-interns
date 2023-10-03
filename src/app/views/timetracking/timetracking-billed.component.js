import React from "react";
import { Link } from "react-router-dom";
import TopbarComponent from "shared/topbar/topbar.component";
import accounting from "accounting";
import config from "config";
import { convertMinutesToTimeString } from "helpers/timetracking";
import timetrackingWatchIcon from "assets/images/svg/timetracking-watch-2.svg";
import alarmOutlined from "assets/images/icons/alarmOutlined.svg";
import SVGInline from "react-svg-inline";
import ListComponent from "shared/list/list.component";

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
		const { resources } = this.props;
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

		return (
			<div className="timetracking-billed-component wrapper-has-topbar-with-margin">
				<TopbarComponent backButtonRoute="/invoices/timetracking" title={resources.str_billedTimes} />

				<div className="box">
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
							{/* <SVGInline svg={timetrackingWatchIcon} className="timetracking-watch" /> */}
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
				</div>
			</div>
		);
	}
}

export default TimetrackingBilledComponent;
