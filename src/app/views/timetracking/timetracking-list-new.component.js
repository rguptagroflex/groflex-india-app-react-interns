import React from "react";
import invoiz from "services/invoiz.service";
import moment from "moment";
import config from "config";
import TopbarComponent from "shared/topbar/topbar.component";
import ListAdvancedComponent from "shared/list-advanced/list-advanced.component";
import ButtonComponent from "shared/button/button.component";
import { ListAdvancedDefaultSettings } from "helpers/constants";
import { localeCompare, localeCompareNumeric } from "helpers/sortComparators";
import { getScaledValue } from "helpers/getScaledValue";
import WebStorageKey from "enums/web-storage-key.enum";
import Timetracking from "models/timetracking.model";
import { formatCurrency } from "helpers/formatCurrency";
import { convertMinutesToTimeString } from "helpers/timetracking";
import { updateStatusIconCellColumns } from "helpers/list-advanced/updateStatusIconCellColumns";
import userPermissions from "enums/user-permissions.enum";
import { connect, Provider } from "react-redux";
import store from "redux/store";
import ModalService from "services/modal.service";
import DeleteRowsModal from "shared/modals/list-advanced/delete-rows-modal.component";
import planPermissions from "enums/plan-permissions.enum";
import RestrictedOverlayComponent from "shared/overlay/restricted-overlay.component";

class TimeTrackingListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			timetracking: null,
			isLoading: true,
			selectedRows: [],
			printing: false,
			canCreateTimesheet: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_TIMESHEET),
			canUpdateTimesheet: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_TIMESHEET),
			canDeleteTimesheet: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_TIMESHEET),
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_TIMESHEET),
			submenuVisible: this.props.isSubmenuVisible,
		};
	}

	componentDidUpdate(prevProps) {
		const { isSubmenuVisible } = this.props;

		if (prevProps.isSubmenuVisible !== isSubmenuVisible) {
			this.setState({ submenuVisible: isSubmenuVisible });
		}
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	createTopbar() {
		const { isLoading, selectedRows, canCreateTimesheet, canDeleteTimesheet } = this.state;
		const { resources } = this.props;
		const topbarButtons = [];

		if (!isLoading) {
			topbarButtons.push({
				type: "primary",
				label: "Record time",
				buttonIcon: "icon-plus",
				action: "create",
				disabled: !canCreateTimesheet,
			});
		}
		// if (selectedRows && selectedRows.length > 0) {
		// 	topbarButtons.push({
		// 		type: 'danger',
		// 		label: resources.str_clear,
		// 		buttonIcon: 'icon-trashcan',
		// 		action: 'delete-timesheets',
		// 		disabled: !canDeleteTimesheet
		// 	});
		// }

		const topbar = (
			<TopbarComponent
				title={`Timesheets`}
				viewIcon={`icon-timetracking`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action, selectedRows)}
				buttons={topbarButtons}
			/>
		);

		return topbar;
	}

	onActionCellPopupItemClick(timetracking, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case "edit":
				this.onRowOrPopupClick(timetracking);
				break;
			case "delete":
				ModalService.open(`${resources.timeTrackingDeleteConfirmText}`, {
					width: 500,
					headline: "Delete timesheet",
					cancelLabel: resources.str_abortStop,
					confirmIcon: "icon-trashcan",
					confirmLabel: resources.str_clear,
					confirmButtonType: "secondary",
					onConfirm: () => {
						ModalService.close();
						invoiz
							.request(`${config.resourceHost}timetracking/${timetracking.customerId}`, {
								auth: true,
								method: "DELETE",
							})
							.then(() => {
								invoiz.page.showToast({ message: resources.timeTrackingDeleteSuccessMessage });
								ModalService.close();
								if (this.refs.listAdvanced) {
									this.refs.listAdvanced.removeSelectedRows([timetracking]);
								}
							});
					},
				});
				break;
		}
	}

	onTopbarButtonClick(action) {
		switch (action) {
			case "create":
				invoiz.router.navigate("/timetracking/new");
				break;
			case "delete-timesheets":
				if (this.refs.listAdvanced) {
					let selectedRowsData = this.refs.listAdvanced.getSelectedRows({
						prop: "customerName",
						sort: "asc",
					});

					selectedRowsData = selectedRowsData.map((timetracking) => {
						return new Timetracking(timetracking);
					});

					ModalService.open(
						<DeleteRowsModal
							deleteUrlPrefix={`${config.resourceHost}timetracking/`}
							text="Are you sure you would like to delete the following timesheets(s)? This action cannot be undone!"
							firstColLabelFunc={(item) => item.customerName}
							secondColLabelFunc={(item) => item.status}
							selectedItems={selectedRowsData}
							onConfirm={() => {
								if (this.refs.listAdvanced) {
									this.refs.listAdvanced.removeSelectedRows();
								}

								ModalService.close();
							}}
						/>,
						{
							width: 500,
							headline: "Delete timesheet(s)",
						}
					);
				}
		}
	}

	getTimetrackingStatusMarkup(value, statusIconWidth, withText) {
		let icon = "";
		let text = "";
		switch (value) {
			case "invoiced":
				icon = "rechnung";
				text = "Invoiced";
				break;
			case "open":
				icon = "offen";
				text = "Open";
				break;
			default:
				break;
		}

		return `<div class="cell-status-icon"><div class='icon icon-${icon}' width="${statusIconWidth}"></div> ${
			withText ? `<span class='cell-status-icon-text'>${text}</span>` : ""
		}</div>`;
	}

	onRowOrPopupClick(timetracking) {
		invoiz.router.navigate(
			`/timetracking/${timetracking.status === "open" ? "billing" : "billed"}/customer/${
				timetracking.customer.id
			}`
		);
	}

	render() {
		const { canUpdateTimesheet, canDeleteTimesheet, canChangeAccountData, planRestricted, submenuVisible } =
			this.state;

		const classLeft = submenuVisible ? "alignLeftContent" : "";
		return (
			<div className="timetracking-list-component-wrapper">
				{planRestricted ? (
					<RestrictedOverlayComponent
						message={
							canChangeAccountData
								? "Time sheets are not available in your current plan"
								: `You don’t have permission to access Time sheets`
						}
						owner={canChangeAccountData}
					/>
				) : null}
				{this.createTopbar()}

				<div className={`timetracking-list-wrapper ${classLeft}`}>
					<ListAdvancedComponent
						headTabbedFilterItemsFunc={(timetrackings) => {
							return [
								{
									filter: {
										field: "status",
										setNull: "true",
									},
									label: "All",
									count: timetrackings.length,
								},
								{
									filter: {
										field: "status",
										filterType: "set",
										values: ["open"],
									},
									label: "Open",
									count: timetrackings.filter((timetracking) => timetracking.status === "open")
										.length,
								},
								{
									filter: {
										field: "status",
										filterType: "set",
										values: ["invoiced"],
									},
									label: "Invoiced",
									count: timetrackings.filter((timetracking) => timetracking.status === "invoiced")
										.length,
								},
							];
						}}
						ref="listAdvanced"
						columnDefs={[
							{
								headerName: "Customer number",
								field: "customerId",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(200, window.innerWidth, 1600),
								comparator: localeCompareNumeric,
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									longName: "Customer number",
									convertNumberToTextFilterOnDemand: true,
								},
							},
							{
								headerName: "Status",
								field: "status",
								comparator: localeCompare,
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(155, window.innerWidth, 1600),
								cellRenderer: (evt) => {
									return this.getTimetrackingStatusMarkup(evt.value, 15, true);
								},
								filterParams: {
									suppressMiniFilter: true,
									valueFormatter: (evt) => {
										return evt.value === "open" ? "Open" : "Invoiced";
									},
									values: ["open", "invoiced"],
								},
								customProps: {
									longName: "Status",
									disableContextMenuCopyItem: true,
									filterListItemValueRenderer: (value, listItemHtml) => {
										const iconHtml = this.getTimetrackingStatusMarkup(value, 15, false);
										$(iconHtml).insertBefore($(listItemHtml).find(".ag-set-filter-item-value"));
									},
									onColumnResized: (evt) => {
										updateStatusIconCellColumns(evt, 96);
									},
								},
							},
							{
								headerName: "Customer",
								field: "customerName",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(310, window.innerWidth, 1600),
								customProps: {
									longName: "Customer",
								},
							},
							{
								headerName: "Expenses",
								field: "rowCount",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(200, window.innerWidth, 1600),
								comparator: localeCompareNumeric,
								cellRenderer: (evt) => {
									return evt.data.displayEffort;
								},
								customProps: {
									longName: "Expenses",
									calculateHeaderSum: true,
									calculateHeaderSumType: "effort",
								},
							},
							{
								headerName: "Duration",
								field: "durationInMinutes",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(120, window.innerWidth, 1600),
								comparator: localeCompareNumeric,
								cellStyle: () => {
									return { textAlign: "right" };
								},
								valueGetter: (evt) => {
									return evt.data.trackedTimeString;
								},
								filter: "agTextColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									longName: "Duration",
									calculateHeaderSum: true,
									calculateHeaderSumType: "time",
								},
							},
							{
								headerName: "Amount",
								field: "priceTotal",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								cellRenderer: (evt) => {
									return formatCurrency(evt.value);
								},
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									longName: "Amount",
									calculateHeaderSum: true,
								},
							},
						]}
						defaultSortModel={{
							colId: "customerName",
							sort: "asc",
						}}
						emptyState={{
							iconClass: "icon-timetracking",
							headline: "No timesheets created yet",
							subHeadline: "Create your first timesheet now",
							buttons: (
								<React.Fragment>
									<ButtonComponent
										label="Record time"
										// buttonIcon="icon-plus"
										dataQsId="empty-list-create-button"
										callback={() => invoiz.router.navigate("/timetracking/new")}
									/>
								</React.Fragment>
							),
						}}
						fetchUrls={[
							`${config.resourceHost}trackedTime?offset=0&searchText=&limit=9999999&orderBy=customerName&desc=true&filter=default`,
						]}
						responseDataMapFunc={(timetrackings) => {
							return timetrackings.map((timetracking) => {
								return new Timetracking(timetracking);
							});
						}}
						exportExcelCallbacks={{
							processCellCallback: (params) => {
								let value = params.value;

								switch (params.column.colId) {
									case "status":
										value = value === "invoiced" ? "Invoiced" : "Open";
										break;
									case "durationInMinutes":
										value = convertMinutesToTimeString(value);
										break;
									case "rowCount":
										value = params.node.data.displayEffort;
										break;
									default:
										break;
								}
								return value;
							},
						}}
						exportFilename={`Exported timesheet list ${moment().format(config.dateFormat.client)}`}
						multiSelect={true}
						restricted={planRestricted}
						usePagination={true}
						loadingRowsMessage={"Loading timesheets ..."}
						noFilterResultsMessage={"No timesheets matched the filter"}
						webStorageKey={WebStorageKey.TIMETRACKING_LIST_SETTINGS}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								const entries = [];
								let timetracking = null;

								if (item) {
									timetracking = new Timetracking(item);
									if (canUpdateTimesheet) {
										entries.push({
											label: "Edit",
											action: "edit",
											dataQsId: "timetracking-list-item-dropdown-entry-edit",
										});
									}
									// if (canDeleteTimesheet) {
									// 	entries.push({
									// 		label: 'Delete',
									// 		action: 'delete',
									// 		dataQsId: 'timetracking-list-item-dropdown-delete',
									// 	});
									// }
									if (entries.length === 0) {
										entries.push({
											label: "No action available",
											customEntryClass: "popover-entry-disabled",
										});
									}
								}

								return [entries];
							},
							onPopupItemClicked: (itemData, popupEntry) => {
								this.onActionCellPopupItemClick(itemData, popupEntry);
							},
						}}
						onRowDataLoaded={(timetracking) => {
							if (!this.isUnmounted) {
								this.setState({
									timetracking,
									isLoading: false,
								});
							}
						}}
						onRowClicked={(timetracking) => {
							this.onRowOrPopupClick(timetracking);
						}}
						onRowSelectionChanged={(selectedRows) => {
							if (!this.isUnmounted) {
								this.setState({ selectedRows });
							}
						}}
						searchFieldPlaceholder="Timesheets"
					/>
				</div>
			</div>
		);
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

const mapDispatchToProps = (dispatch) => {
	return {
		submenuVisible: (payload) => {
			dispatch(submenuVisible(payload));
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(TimeTrackingListComponent);
