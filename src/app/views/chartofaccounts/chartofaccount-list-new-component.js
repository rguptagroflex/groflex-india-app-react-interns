import React from "react";
import invoiz from "services/invoiz.service";
import lang from "lang";
import moment from "moment";
import _, { capitalize } from "lodash";
import config from "config";
import TopbarComponent from "shared/topbar/topbar.component";
import ModalService from "services/modal.service";
import DeleteRowsModal from "shared/modals/list-advanced/delete-rows-modal.component";
import ListAdvancedComponent from "shared/list-advanced/list-advanced.component";
import ButtonComponent from "shared/button/button.component";
import { customerTypes, ListAdvancedDefaultSettings } from "helpers/constants";
import { localeCompare, localeCompareNumeric } from "helpers/sortComparators";
import { getScaledValue } from "helpers/getScaledValue";
import WebStorageKey from "enums/web-storage-key.enum";
import WebStorageService from "services/webstorage.service";
import userPermissions from "enums/user-permissions.enum";
import ChartOfAccountEditModalomponent from "./chartofaccount-edit-modal-component";
import ChartOfAccountPersonModalComponent from "./chartofaccount-personmodalcomponent.js";
import { connect, Provider } from "react-redux";
import store from "redux/store";
import Customer from "../../models/customer.model";

const LABEL_COMPANY = "Company";
const LABEL_PERSON = "Individual";
const LABEL_CONTACTPERSON = "Contact person";

class ChartofaccountNewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			refreshData: false,
			isLoading: true,
			customerData: null,
			selectedRows: [],
			canCreateCustomer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_CUSTOMER),
			canUpdateCustomer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_CUSTOMER),
			canDeleteCustomer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_CUSTOMER),
		};
	}
	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_ACCOUNTING)) {
			invoiz.user.logout(true);
		}
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	createTopbar() {
		const { customerData, isLoading, selectedRows, canCreateCustomer, canDeleteCustomer } = this.state;

		const topbarButtons = [];

		if (!isLoading) {
			topbarButtons.push({
				type: "primary",
				label: "New accounts",
				buttonIcon: "icon-plus",
				action: "create",
				disabled: !canDeleteCustomer,
			});
		}

		const topbar = (
			<TopbarComponent
				title={`Chart of accounts`}
				viewIcon={`icon-coins`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
				buttons={topbarButtons}
			/>
		);

		return topbar;
	}

	onActionCellPopupItemClick(chartofaccount, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case "edit":
				this.openEditAccountsModals(chartofaccount);
				break;

			case "delete":
				ModalService.open(resources.chartofaccountDeleteConfirmText, {
					width: 600,

					headline: `Delete account`,

					cancelLabel: "Cancel",

					confirmLabel: `Delete`,

					confirmButtonType: "primary",
					onConfirm: () => {
						invoiz
							.request(`${config.resourceHost}chartofaccount/${chartofaccount.id}`, {
								auth: true,
								method: "DELETE",
							})
							.then(() => {
								invoiz.page.showToast({ message: resources.chartofaccountDeleteSuccessMessage });
								this.setState({ ...this.state, refreshData: !this.state.refreshData });
								ModalService.close();

								if (this.refs.listAdvanced) {
									this.refs.listAdvanced.removeSelectedRows([customer]);
								}
							})
							.catch((res) => {
								const { body } = res;

								const errorMessage =
									body.meta.id && body.meta.id[0].code === "NOT_ALLOWED"
										? resources.customerDeleteNotAllowedMessage
										: resources.defaultErrorMessage;

								invoiz.page.showToast({ type: "error", message: errorMessage });
							});
					},
				});
			case "state":
				chartofaccount.status = chartofaccount.status === "active" ? "inactive" : "active";
				this.handleEditStatus(chartofaccount);

				break;
		}
	}
	onAddNewAccounts() {
		const handleNewAccount = (newAccountData) => {
			invoiz
				.request(`${config.resourceHost}chartofaccount`, {
					auth: true,
					method: "POST",
					data: { ...newAccountData },
				})
				.then((res) => {
					this.setState({ ...this.state, refreshData: !this.state.refreshData });
				});
			ModalService.close();
		};

		ModalService.open(<ChartOfAccountPersonModalComponent onConfirm={handleNewAccount} />, {
			modalClass: "edit-contact-person-modal-component",
			width: 632,
			borderRadius: 8,
		});
	}

	handleEditStatus(chartofaccount) {
		invoiz
			.request(`${config.resourceHost}chartofaccount/${chartofaccount.id}`, {
				auth: true,
				method: "PUT",
				data: { ...chartofaccount },
			})
			.then((res) => {
				this.setState({ ...this.state, refreshData: !this.state.refreshData });
			});
	}

	openEditAccountsModals(chartofaccount) {
		const handleEditChart = (editedChartData) => {
			invoiz
				.request(`${config.resourceHost}chartofaccount/${chartofaccount.id}`, {
					auth: true,
					method: "PUT",
					data: { ...editedChartData },
				})
				.then((res) => {
					this.setState({ ...this.state, refreshData: !this.state.refreshData });
				});
			ModalService.close();
		};
		ModalService.open(
			<ChartOfAccountEditModalomponent onConfirm={handleEditChart} previousData={chartofaccount} />,
			{
				modalClass: "edit-contact-person-modal-component",
				width: 630,
			}
		);
	}

	onTopbarButtonClick(action) {
		const { resources } = this.props;
		const { canCreateCustomer, canDeleteCustomer, canUpdateCustomer } = this.state;
		let selectedRowsData = null;
		let allRowsData = null;

		switch (action) {
			case "create":
				this.onAddNewAccounts();
				break;

				// case "import":
				// 	this.onCustomerImportClick();
				// 	break;

				// case "delete-customers":
				// 	if (this.refs.listAdvanced) {
				// 		allRowsData = this.refs.listAdvanced.getAllRows();

				// 		selectedRowsData = this.refs.listAdvanced.getSelectedRows({
				// 			prop: "number",
				// 			sort: "asc",
				// 		});

				// 		selectedRowsData = _.uniq(selectedRowsData, "id");
				// 		selectedRowsData.sort((a, b) => localeCompareNumeric(a.number, b.number));

				// 		selectedRowsData.forEach((selectedColData, index) => {
				// 			let relatedCompanyObject = null;

				// 			if (selectedColData.kind === ListAdvancedDefaultSettings.CUSTOMER_TYPE_CONTACTPERSON) {
				// 				relatedCompanyObject = allRowsData.find(
				// 					(colData) => colData.kind === customerTypes.COMPANY && colData.id === selectedColData.id
				// 				);

				// 				if (relatedCompanyObject) {
				// 					selectedRowsData[index] = relatedCompanyObject;
				// 				}
				// 			}
				// 		});

				// 		ModalService.open(
				// 			<DeleteRowsModal
				// 				deleteUrlPrefix={`${config.resourceHost}customer/`}
				// 				text="Do you really want to delete the following contact(s)? This action cannot be undone!"
				// 				firstColLabelFunc={(item) => item.number}
				// 				secondColLabelFunc={(item) => item.name}
				// 				selectedItems={selectedRowsData}
				// 				getErrorMessage={(errors) => {
				// 					const { body } = errors;

				// 					return body.meta.id && body.meta.id[0].code === "NOT_ALLOWED"
				// 						? resources.customersDeleteNotAllowedMessage
				// 						: resources.defaultErrorMessage;
				// 				}}
				// 				onConfirm={() => {
				// 					invoiz.router.reload();

				// 					ModalService.close();
				// 				}}
				// 			/>,
				// 			{
				// 				width: 500,
				// 				headline: "Delete contact(s)",
				// 			}
				// 		);
				// 	}

				break;
		}
	}

	// onActionSettingPopupItemClick(entry) {
	// 	const { resources } = this.props;
	// 	switch (entry.action) {
	// 		case "Import as CSV":
	// 			// invoiz.router.navigate("/settings/more-settings/customer-categories");
	// 			break;
	// 		case "Export as CSV":
	// 			// invoiz.router.navigate("/settings/more-settings/customer");
	// 			break;
	// 	}
	// }
	render() {
		const { resources } = this.props;
		const { canCreateCustomer, canUpdateCustomer, canDeleteCustomer, customerData } = this.state;
		return (
			<div className="customer-list-component-wrapper">
				{this.createTopbar()}

				<div className="customer-list-wrapper">
					<ListAdvancedComponent
						refreshData={this.state.refreshData}
						ref="listAdvanced"
						columnDefs={[
							{
								headerName: "Code",
								field: "accountCode",
								sort: "asc",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(86, window.innerWidth, 1600),
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									longName: "Account Code",
									convertNumberToTextFilterOnDemand: true,
								},
								cellStyle: (params) => {
									if (params.data.status.toLowerCase() === "inactive") {
										return { backgroundColor: "#f2f2f2" };
									}
									return null;
								},
							},
							{
								headerName: "Account Type",
								field: "accountTypeId",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(210, window.innerWidth, 1600),
								filterParams: {
									suppressAndOrCondition: true,
								},
								cellRenderer: (evt) => {
									return evt.value
										.toLowerCase()
										.split(" ")
										.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
										.join(" ");
								},
								cellStyle: (params) => {
									if (params.data.status.toLowerCase() === "inactive") {
										return { backgroundColor: "#f2f2f2" };
									}
									return null;
								},

								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},

							{
								headerName: "Account Sub Type",
								field: "accountSubTypeId",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(210, window.innerWidth, 1600),
								filterParams: {
									suppressAndOrCondition: true,
								},
								cellRenderer: (evt) => {
									const subType = evt.value.replace(/([A-Z])/g, " $1").trim();
									return subType.charAt(0).toUpperCase() + subType.slice(1).toLowerCase();
								},
								cellStyle: (params) => {
									if (params.data.status.toLowerCase() === "inactive") {
										return { backgroundColor: "#f2f2f2" };
									}
									return null;
								},
								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},

							{
								headerName: "Status",
								field: "status",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filterParams: {
									suppressAndOrCondition: true,
								},
								cellRenderer: (evt) => {
									return evt.value
										.toLowerCase()
										.split(" ")
										.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
										.join(" ");
									// return (
									// 	<p style={{ color: "red" }}>{capitalize(evt.value)}</p>
									// );
								},
								cellStyle: (params) => {
									if (params.data.status.toLowerCase() === "inactive") {
										return { backgroundColor: "#f2f2f2" };
									}
									return null;
								},
							},
							{
								headerName: "Account Name",
								field: "accountName",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(210, window.innerWidth, 1600),
								cellRenderer: (evt) => {
									return evt.value
										.toLowerCase()
										.split(" ")
										.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
										.join(" ");
								},
								cellStyle: (params) => {
									if (params.data.status.toLowerCase() === "inactive") {
										return { backgroundColor: "#f2f2f2" };
									}
									return null;
								},
								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
							{
								headerName: "Description",
								field: "description",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								hide: true,
								width: getScaledValue(210, window.innerWidth, 1600),
								cellRenderer: (evt) => {
									return evt.value
										.split(" ")
										.map((s, index) =>
											index === 0
												? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
												: s.toLowerCase()
										)
										.join(" ");
								},
								cellStyle: (params) => {
									if (params.data.status.toLowerCase() === "inactive") {
										return { backgroundColor: "#f2f2f2" };
									}
									return null;
								},
								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
						]}
						defaultSortModel={{
							colId: "number",
							sort: "asc",
						}}
						emptyState={{
							iconClass: "icon-customer",
							headline: resources.chartofaccountEmptyListHeadingText,
							subHeadline: resources.chartofaccountEmptyListCreateContactText,
							buttons: (
								<React.Fragment>
									<ButtonComponent
										label={resources.chartofaccountCreateButtonText}
										buttonIcon="icon-plus"
										dataQsId="empty-list-create-button"
										callback={() => this.onAddNewAccounts()}
										disabled={!canCreateCustomer}
									/>
								</React.Fragment>
							),
						}}
						fetchUrls={[
							`${config.resourceHost}chartofaccount?offset=0&searchText=&limit=9999999&orderBy=accountName&desc=false`,
						]}
						exportExcelCallbacks={{
							processCellCallback: (params) => {
								let value = params.value;

								if (params.column.colId === "kind") {
									value =
										value === customerTypes.PERSON
											? LABEL_PERSON
											: value === customerTypes.COMPANY
											? LABEL_COMPANY
											: LABEL_CONTACTPERSON;
								}

								if (params.column.colId === "isMainContact") {
									value = isNil(value) ? "" : value.toString() === "true" ? "Ja" : "Nein";
								}

								return value;
							},
						}}
						exportFilename={`Exported chartofaccount list ${moment().format(config.dateFormat.client)}`}
						gatherRemovedSelectedRowsBy="id"
						multiSelect={false}
						usePagination={true}
						searchFieldPlaceholder={lang.customerSearchCategory}
						loadingRowsMessage={"Loading chartofaccount list..."}
						noFilterResultsMessage={"No chart of accounts  match the filter"}
						webStorageKey={WebStorageKey.CHARTOFACCOUNT_LIST_SETTING}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								const entries = [];
								let customer = null;

								if (item) {
									customer = new Customer(item);
									if (canUpdateCustomer && canDeleteCustomer) {
										entries.push({
											dataQsId: `chartofaccount-list-item-dropdown-entry-delete`,
											label: resources.str_clear,
											action: "delete",
										});

										entries.push({
											dataQsId: `chartofaccount-list-item-dropdown-entry-edit`,
											label: resources.str_toEdit,
											action: "edit",
										});
										let label = "Mark as active";
										if (item.status == "active") {
											label = "Mark as inactive";
										}
										entries.push({
											dataQsId: "chartofaccount-list-item-dropdown-entry-status",
											label: label,
											action: "state",
										});
									}
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
						// settingPopup={{
						// 	settingPopupEntriesFunc: (item) => {
						// 		const entries = [];
						// 		entries.push({
						// 			label: "Import as CSV",
						// 			action: "customercategory",
						// 			dataQsId: "setting-list-item-dropdown-customercategory",
						// 		});
						// 		entries.push({
						// 			label: "Export as CSV",
						// 			action: "moresettings",
						// 			dataQsId: "setting-list-item-dropdown-moresettings",
						// 		});

						// 		return [entries];
						// 	},
						// 	onSettingPopupItemClicked: (popupEntry) => {
						// 		this.onActionSettingPopupItemClick(popupEntry);
						// 	},
						// }}
						onRowDataLoaded={(customerData) => {
							if (!this.isUnmounted) {
								this.setState({
									customerData,
									isLoading: false,
								});
							}
						}}
						onRowClicked={(chartofaccount) => {
							this.onActionCellPopupItemClick(chartofaccount, { action: "edit" });
							//invoiz.router.navigate(`/chartofaccount/${chartofaccount.id}`);
						}}
						onRowSelectionChanged={(selectedRows) => {
							if (!this.isUnmounted) {
								this.setState({ selectedRows });
							}
						}}
					/>
				</div>
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return {
		resources,
	};
};

export default connect(mapStateToProps)(ChartofaccountNewComponent);
