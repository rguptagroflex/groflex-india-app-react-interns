import React from "react";
import invoiz from "services/invoiz.service";
import lang from "lang";
import moment from "moment";
import _ from "lodash";
import config from "config";
import { getLabelForCountry } from "helpers/getCountries";
// import TopbarComponent from "shared/topbar/topbar.component";
import { formatCurrency } from "helpers/formatCurrency";
import ModalService from "services/modal.service";
import DeleteRowsModal from "shared/modals/list-advanced/delete-rows-modal.component";
import ListAdvancedComponent from "shared/list-advanced/list-advanced.component";
import ButtonComponent from "shared/button/button.component";
// import UpgradeFullscreenModalComponent from 'shared/modals/upgrade-fullscreen-modal.component';
import ChargebeePlan from "enums/chargebee-plan.enum";
// import AppType from 'enums/apps/app-type.enum';
// import { navigateToAppId } from 'helpers/apps/navigateToAppId';
import { customerTypes, ListAdvancedDefaultSettings } from "helpers/constants";
import { localeCompare, localeCompareNumeric } from "helpers/sortComparators";
import { getScaledValue } from "helpers/getScaledValue";
import WebStorageKey from "enums/web-storage-key.enum";
import WebStorageService from "services/webstorage.service";
import { isNil } from "helpers/isNil";
import userPermissions from "enums/user-permissions.enum";
import { connect, Provider } from "react-redux";
import store from "redux/store";
import Customer from "../../models/customer.model";
import { formatCurrencySymbolDisplayInFront } from "helpers/formatCurrency";
import CustomTopbarComponent from "./custom-topbar.component";
import MoneyInModalComponent from "./money-in-modal.component";
import MoneyOutModalComponent from "./money-out-modal.component";

const LABEL_COMPANY = "Company";
const LABEL_PERSON = "Individual";
const LABEL_CONTACTPERSON = "Contact person";

class TransactionsListComponent extends React.Component {
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

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	createTopbar() {
		const { customerData, isLoading, selectedRows, canCreateCustomer, canDeleteCustomer } = this.state;

		const topbarButtons = [];

		if (!isLoading) {
			topbarButtons.push({
				type: "primary",
				label: "New Transactions",
				buttonIcon: "icon-plus",
				// action: "create",
				action: "drop-down",
				disabled: !canDeleteCustomer,
				rightIcon: "icon-arrow_solid_down",
			});
		}

		const topbar = (
			<CustomTopbarComponent
				onDropDownClick={this.onTopbarButtonClick}
				title={`Transactions`}
				viewIcon={`icon-coins`}
				// buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
				buttonCallback={this.onTopbarButtonClick}
				buttons={topbarButtons}
				openMoneyInModal={this.openMoneyInModal}
				openMoneyOutModal={this.openMoneyOutModal}
			/>
		);

		return topbar;
	}

	getCompanyPersonIcon(value, personIconWidth, blankContactPersonIcon, isMainContact) {
		const masterDetailArrowClass = !isNil(isMainContact) && isMainContact.toString() === "false" ? "grey" : "";

		return value === customerTypes.PERSON
			? `<span class="icon-user-wrapper"><img src="/assets/images/svg/user.svg" width="${personIconWidth}" /></span>`
			: value === ListAdvancedDefaultSettings.CUSTOMER_TYPE_CONTACTPERSON
			? blankContactPersonIcon
				? ""
				: `<span class="icon icon-arrow_right2 master-detail-arrow ${masterDetailArrowClass}"></span>`
			: `<span class="icon icon-factory"></span>`;
	}

	onActionCellPopupItemClick(chartofaccount, entry) {
		console.log(chartofaccount, "kfjgfkmbfkk");
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
				console.log(chartofaccount.status, "chartofaccount");
				this.handleEditStatus(chartofaccount);

				break;
		}
	}
	onAddNewAccounts() {
		const handleNewAccount = (newAccountData) => {
			invoiz
				.request("https://dev.groflex.in/api/chartofaccount", {
					auth: true,
					method: "POST",
					data: { ...newAccountData },
				})
				.then((res) => {
					console.log("RSPOINSE FORPOST", res);
					this.setState({ ...this.state, refreshData: !this.state.refreshData });
				});
			ModalService.close();
		};

		ModalService.open(<ChartOfAccountPersonModalComponent onConfirm={handleNewAccount} />, {
			modalClass: "edit-contact-person-modal-component",
			width: 630,
		});
	}

	handleEditStatus(chartofaccount) {
		invoiz
			.request(`https://dev.groflex.in/api/chartofaccount/${chartofaccount.id}`, {
				auth: true,
				method: "PUT",
				data: { ...chartofaccount },
			})
			.then((res) => {
				console.log("RESPONSE FOR status", res);
				this.setState({ ...this.state, refreshData: !this.state.refreshData });
			});
	}

	openEditAccountsModals(chartofaccount) {
		console.log("sfggjrjgk", chartofaccount);
		const handleEditChart = (editedChartData) => {
			invoiz
				.request(`https://dev.groflex.in/api/chartofaccount/${chartofaccount.id}`, {
					auth: true,
					method: "PUT",
					data: { ...editedChartData },
				})
				.then((res) => {
					console.log("RESPONSE FOR PUT", res);
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

	/*Used functions*/
	openMoneyInModal() {
		const handleAddTransaction = (moneyInData) => {
			invoiz
				.request("https://dev.groflex.in/api/bankTransaction", {
					auth: true,
					method: "POST",
					data: { ...moneyInData },
				})
				.then((res) => {
					console.log("RSPOINSE FOR POST MONEY IN TRANSACTION", res);
					this.setState({ ...this.state, refreshData: !this.state.refreshData });
				});
			ModalService.close();
		};

		ModalService.open(<MoneyInModalComponent onConfirm={handleAddTransaction} />, {
			width: 630,
		});
	}

	openMoneyOutModal() {
		const handleAddTransaction = (moneyOutData) => {
			invoiz
				.request("https://dev.groflex.in/api/bankTransaction", {
					auth: true,
					method: "POST",
					data: { ...moneyOutData },
				})
				.then((res) => {
					console.log("RSPOINSE FOR POST MONEY OUT TRANSACTION", res);
					this.setState({ ...this.state, refreshData: !this.state.refreshData });
				});
			ModalService.close();
		};

		ModalService.open(<MoneyOutModalComponent onConfirm={handleAddTransaction} />, {
			width: 630,
		});
	}

	onTopbarButtonClick(action) {
		// const { resources } = this.props;
		// const { canCreateCustomer, canDeleteCustomer, canUpdateCustomer } = this.state;
		// let selectedRowsData = null;
		// let allRowsData = null;

		switch (action) {
			case "money-in":
				console.log("Dropped down");
				this.addTransactions();
				break;
			case "money-out":
				console.log("Dropped down");
				ModalService.open(<MoneyOutModalComponent onConfirm={() => {}} />, {
					width: 630,
				});
				break;
			// case "create":
			// 	this.onAddNewAccounts();
			// 	break;

			// case "import":
			// 	this.onCustomerImportClick();
			// 	break;

			// case "delete-customers":
			// if (this.refs.listAdvanced) {
			// 	allRowsData = this.refs.listAdvanced.getAllRows();

			// 	selectedRowsData = this.refs.listAdvanced.getSelectedRows({
			// 		prop: "number",
			// 		sort: "asc",
			// 	});

			// 	selectedRowsData = _.uniq(selectedRowsData, "id");
			// 	selectedRowsData.sort((a, b) => localeCompareNumeric(a.number, b.number));

			// 	selectedRowsData.forEach((selectedColData, index) => {
			// 		let relatedCompanyObject = null;

			// 		if (selectedColData.kind === ListAdvancedDefaultSettings.CUSTOMER_TYPE_CONTACTPERSON) {
			// 			relatedCompanyObject = allRowsData.find(
			// 				(colData) => colData.kind === customerTypes.COMPANY && colData.id === selectedColData.id
			// 			);

			// 			if (relatedCompanyObject) {
			// 				selectedRowsData[index] = relatedCompanyObject;
			// 			}
			// 		}
			// 	});

			// 	ModalService.open(
			// 		<DeleteRowsModal
			// 			deleteUrlPrefix={`${config.resourceHost}customer/`}
			// 			text="Do you really want to delete the following contact(s)? This action cannot be undone!"
			// 			firstColLabelFunc={(item) => item.number}
			// 			secondColLabelFunc={(item) => item.name}
			// 			selectedItems={selectedRowsData}
			// 			getErrorMessage={(errors) => {
			// 				const { body } = errors;

			// 				return body.meta.id && body.meta.id[0].code === "NOT_ALLOWED"
			// 					? resources.customersDeleteNotAllowedMessage
			// 					: resources.defaultErrorMessage;
			// 			}}
			// 			onConfirm={() => {
			// 				invoiz.router.reload();

			// 				ModalService.close();
			// 			}}
			// 		/>,
			// 		{
			// 			width: 500,
			// 			headline: "Delete contact(s)",
			// 		}
			// 	);
			// }
		}
	}

	render() {
		const { resources } = this.props;
		const { canCreateCustomer, canUpdateCustomer, canDeleteCustomer, customerData } = this.state;
		return (
			<div className="transaction-list-component-wrapper">
				{this.createTopbar()}

				<div className="transaction-list-wrapper">
					<ListAdvancedComponent
						refreshData={this.state.refreshData}
						ref="listAdvanced"
						columnDefs={[
							{
								headerName: "Opening balance",
								field: "openingBalance",
								sort: "asc",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(210, window.innerWidth, 1600),
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
							},
							{
								headerName: "IFSC code",
								field: "IFSCCode",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(210, window.innerWidth, 1600),
								filterParams: {
									suppressAndOrCondition: true,
								},
								cellRenderer: (evt) => {
									return evt.value.toUpperCase();
								},

								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},

							{
								headerName: "Account number",
								field: "accountNumber",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(210, window.innerWidth, 1600),
								filterParams: {
									suppressAndOrCondition: true,
								},
								// cellRenderer: (evt) => {
								// 	const subType = evt.value.replace(/([A-Z])/g, " $1").trim();
								// 	return subType.charAt(0).toUpperCase() + subType.slice(1).toLowerCase();
								// },
								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
							// {
							// 	headerName: "Account name",
							// 	field: "accountName",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	comparator: localeCompare,
							// 	filterParams: {
							// 		suppressAndOrCondition: true,
							// 	},
							// 	cellRenderer: (evt) => {
							// 		return evt.value
							// 			.toLowerCase()
							// 			.split(" ")
							// 			.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
							// 			.join(" ");
							// 	},
							// },
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
								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
							{
								headerName: "Bank name",
								field: "bankName",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								// hide: true,
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
							// `${config.resourceHost}chartofaccount?offset=0&searchText=&limit=9999999&orderBy=accountName&desc=false`,
							`https://dev.groflex.in/api/bank`,
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
						exportFilename={`Exported contacts list ${moment().format(config.dateFormat.client)}`}
						gatherRemovedSelectedRowsBy="id"
						multiSelect={true}
						usePagination={true}
						searchFieldPlaceholder={lang.customerSearchCategory}
						loadingRowsMessage={"Loading Transactions list..."}
						noFilterResultsMessage={"No Transactions match the filter"}
						webStorageKey={WebStorageKey.CHARTOFACCOUNT_LIST_SETTING}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								const entries = [];
								let customer = null;

								if (item) {
									customer = new Customer(item);
									if (canUpdateCustomer && canDeleteCustomer) {
										entries.push({
											dataQsId: `transaction-list-item-dropdown-entry-delete`,
											label: resources.str_clear,
											action: "delete",
										});

										// entries.push({
										// 	dataQsId: `transaction-list-item-dropdown-entry-edit`,
										// 	label: resources.str_toEdit,
										// 	action: "edit",
										// });
										// console.log(resources, "resources");
										// let label = "Mark as active";
										// console.log(item, "item");
										// if (item.status == "active") {
										// 	console.log("ifcondition");
										// 	label = "Mark as inactive";
										// }
										// entries.push({
										// 	dataQsId: "transaction-list-item-dropdown-entry-status",
										// 	label: label,
										// 	action: "state",
										// });
									}
									// if (entries.length === 0) {
									// 	entries.push({
									// 		label: "No action available",
									// 		customEntryClass: "popover-entry-disabled",
									// 	});
									// }
								}

								return [entries];
							},

							onPopupItemClicked: (itemData, popupEntry) => {
								console.log(itemData, "itemdata");
								console.log(popupEntry, "popupEntry");
								this.onActionCellPopupItemClick(itemData, popupEntry);
							},
						}}
						settingPopup={{
							settingPopupEntriesFunc: (item) => {
								const entries = [];
								entries.push({
									label: "Import as CSV",
									action: "customercategory",
									dataQsId: "setting-list-item-dropdown-customercategory",
								});
								entries.push({
									label: "Export as CSV",
									action: "moresettings",
									dataQsId: "setting-list-item-dropdown-moresettings",
								});

								return [entries];
							},
							onSettingPopupItemClicked: (popupEntry) => {
								this.onActionSettingPopupItemClick(popupEntry);
							},
						}}
						onRowDataLoaded={(customerData) => {
							if (!this.isUnmounted) {
								this.setState({
									customerData,
									isLoading: false,
								});
							}
						}}
						onRowClicked={(chartofaccount) => {
							invoiz.router.navigate(`/chartofaccount/${chartofaccount.id}`);
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

export default connect(mapStateToProps)(TransactionsListComponent);
