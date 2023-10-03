import React from "react";
import TopbarComponent from "shared/topbar/topbar.component";
import accounting from "accounting";
import invoiz from "services/invoiz.service";
import config from "config";
import { convertMinutesToTimeString } from "helpers/timetracking";
import timetrackingWatchIcon from "assets/images/svg/timetracking-watch-1.svg";
import alarmOutlined from "assets/images/icons/alarmOutlined.svg";
import SVGInline from "react-svg-inline";
import ListComponent from "shared/list/list.component";
import PopoverComponent from "shared/popover/popover.component";
import ModalService from "services/modal.service";
import userPermissions from "enums/user-permissions.enum";

class TimetrackingBillingComponent extends React.Component {
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

		const { trackedTimes } = this.props;
		trackedTimes.forEach((tracking) => {
			tracking.selected = true;
		});

		this.state = {
			trackedTimes,
			totalMoney,
			totalTime,
			allSelected: true,
		};
	}

	componentDidMount() {
		if (
			!invoiz.user.hasPermission(userPermissions.VIEW_TIMESHEET) &&
			!invoiz.user.hasPermission(userPermissions.UPDATE_TIMESHEET)
		) {
			invoiz.user.logout(true);
		}
	}

	render() {
		const { trackedTimes, totalTime, totalMoney, allSelected } = this.state;
		const { customer, resources } = this.props;

		const tableColumns = [
			{ title: resources.str_date, resourceKey: "date" },
			{
				title: resources.str_activity,
				width: "30%",
				valueStyle: { fontWeight: 600 },
				subValueStyle: { fontWeight: "normal", fontSize: "14px", color: "#666" },
				resourceKey: "activity",
			},
			{ title: resources.str_duration, align: "right", resourceKey: "duration" },
			{ title: resources.str_amount, align: "right", resourceKey: "amountTitle" },
			{ title: "", width: "50px", resourceKey: "" },
		];

		const tableRows = [];
		trackedTimes.forEach((tracking, index) => {
			const dropdownEntries = [
				{
					label: resources.str_toEdit,
					action: "edit",
					dataQsId: "timetracking-billing-dropdown-edit",
				},
				{
					label: resources.str_clear,
					action: "delete",
					dataQsId: "timetracking-billing-dropdown-delete",
				},
			];

			const dropdown = (
				<div
					className="timetracking-billing-cell-dropdown icon icon-arr_down"
					id={`timetracking-billing-dropdown-anchor-${index}`}
				>
					<PopoverComponent
						showOnClick={true}
						contentClass={`timetracking-billing-cell-dropdown-content`}
						entries={[dropdownEntries]}
						onClick={(entry) => this.onDropdownEntryClick(tracking, entry.action)}
						elementId={`timetracking-billing-dropdown-anchor-${index}`}
						offsetLeft={-3}
						offsetTop={10}
					/>
				</div>
			);

			tableRows.push({
				cells: [
					{ value: tracking.humanizedDate },
					{ value: tracking.taskDescriptionPrefix, subValue: tracking.taskDescription },
					{ value: tracking.trackedTimeString },
					{ value: tracking.summedUpCost },
					{ value: dropdown },
				],
				id: tracking.id,
				selected: tracking.selected,
			});
		});

		const topbarButtons = [
			{
				type: "default",
				label: resources.str_makeBillText,
				buttonIcon: "icon-check",
				action: "createInvoice",
				dataQsId: "timetracking-billing-createInvoice",
			},
			{
				type: "primary",
				label: resources.str_recordTime,
				buttonIcon: "icon-plus",
				action: "createTracking",
				dataQsId: "timetracking-billing-createTracking",
			},
		];

		return (
			<div className="timetracking-billing-component wrapper-has-topbar-with-margin">
				<TopbarComponent
					backButtonRoute="/invoices/timetracking"
					title={customer.displayName}
					buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
					buttons={topbarButtons}
				/>

				<div className="detail-view-content-wrapper">
					<div className="detail-view-content-left">
						<div className="detail-view-box-new u_mt_20">
							<ListComponent
								title={"Time records"}
								tableId="timetracking-billing-component-table"
								allSelected={allSelected}
								selectable={true}
								selectedCallback={(id, isChecked) => this.onSelected(id, isChecked)}
								selectedAllCallback={(isChecked) => this.onAllSelected(isChecked)}
								columns={tableColumns}
								rows={tableRows}
								resources={resources}
							/>
						</div>
					</div>
					<div className="detail-view-content-right">
						<div className="detail-view-box-new u_mt_20">
							<div className="row">
								<div className="col-xs-8">
									<div className="text-h2">{"Customer details"}</div>
									<div className="u_pt_40">
										<div className="text-bold">{customer.displayName}</div>
										<div>{customer.address.street}</div>
										<div>{customer.address.zipCode + " " + customer.address.city}</div>
									</div>
								</div>
								<div className="col-xs-4 timetracking-watch-wrapper">
									{/* <SVGInline svg={timetrackingWatchIcon} className="timetracking-watch" /> */}
									<SVGInline svg={alarmOutlined} className="timetracking-watch" />
									<div className="timetracking-watch-text">
										<div className="text-h1">{totalTime}</div>
										<div className="text-bold text-light">{totalMoney}</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	onTopbarButtonClick(action) {
		const { customer } = this.props;
		const { trackedTimes } = this.state;
		const selected = trackedTimes.filter((tracking) => tracking.selected);
		switch (action) {
			case "createInvoice":
				invoiz.cache = invoiz.cache || {};
				invoiz.cache.invoice = invoiz.cache.invoice || {};
				invoiz.cache.invoice.customer = customer;
				invoiz.cache.invoice.times = selected;
				invoiz.router.navigate("/invoice/new");
				break;
			case "createTracking":
				invoiz.router.navigate(`/timetracking/new/${customer.id}`);
				break;
		}
	}

	onDropdownEntryClick(tracking, action) {
		const { customer, resources } = this.props;

		switch (action) {
			case "edit":
				invoiz.router.navigate(`/timetracking/edit/${tracking.id}`);
				break;
			case "delete":
				ModalService.open(
					<div className="ampersand-delete-modal-content">
						<div>{resources.timeTrackingDeleteConfirmText}</div>
						<ul>
							<li>
								<b>{resources.str_customer}:</b> <span>{customer.name}</span>
							</li>
							<li>
								<b>{resources.str_date}:</b> <span>{tracking.date}</span>
							</li>
							<li>
								<b>{resources.str_duration}:</b> <span>{tracking.trackedTimeString}</span>
							</li>
							<li>
								<b>{resources.str_totalAmount}:</b> <span>{tracking.summedUpCost}</span>
							</li>
						</ul>
					</div>,
					{
						width: 300,
						headline: resources.timeTrackingDeleteConfirmCaption,
						cancelLabel: resources.str_abortStop,
						confirmIcon: "icon-trashcan",
						confirmLabel: resources.str_clear,
						confirmButtonType: "primary",
						onConfirm: () => {
							ModalService.close();
							invoiz
								.request(`${config.resourceHost}trackedTime/${tracking.id}`, {
									method: "DELETE",
									auth: true,
								})
								.then(() => {
									invoiz.page.showToast(resources.timeTrackingDeleteSuccessMessage);
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
				break;
		}
	}

	onSelected(id, checked) {
		const { trackedTimes } = this.state;
		const tracking = trackedTimes.find((trackedTime) => trackedTime.id === id);

		if (tracking) {
			tracking.selected = checked;
		}

		const selectedItems = trackedTimes.filter((tracking) => tracking.selected);
		const allSelected = selectedItems && selectedItems.length === trackedTimes.length;

		this.setState({ trackedTimes, allSelected });
	}

	onAllSelected(checked) {
		const { trackedTimes } = this.state;

		trackedTimes.forEach((tracking) => {
			tracking.selected = checked;
		});

		this.setState({ allSelected: checked, trackedTimes });
	}
}

export default TimetrackingBillingComponent;
