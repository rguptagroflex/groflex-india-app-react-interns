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
import { localeCompare, localeCompareNumeric, dateCompare, dateCompareSort } from "helpers/sortComparators";
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
import CustomButtonComponent from "./custom-button.component";
import OnClickOutside from "../../shared/on-click-outside/on-click-outside.component";
import { formatDate, formatApiDate, formateClientDateMonthYear } from "helpers/formatDate";

const LABEL_COMPANY = "Company";
const LABEL_PERSON = "Individual";
const LABEL_CONTACTPERSON = "Contact person";

class TransactionsListComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			createTransactionDropdown: false,
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
				// onDropDownClick={this.onTopbarButtonClick}
				title={`Transactions`}
				viewIcon={`icon-coins`}
				// buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
				// buttonCallback={this.onTopbarButtonClick}
				buttons={topbarButtons}
				openMoneyInModal={() => this.openMoneyInModal()}
				openMoneyOutModal={() => this.openMoneyOutModal()}
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

	onActionCellPopupItemClick(transaction, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case "delete":
				ModalService.open("Do you really want to delete the transaction?", {
					width: 600,
					headline: `Delete transaction`,
					cancelLabel: "Cancel",
					confirmLabel: `Delete`,
					confirmButtonType: "primary",
					onConfirm: () => {
						invoiz
							.request(`https://dev.groflex.in/api/bankTransaction/${transaction.id}`, {
								auth: true,
								method: "DELETE",
							})
							.then(() => {
								invoiz.page.showToast({ message: "The transaction was deleted successfully" });
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
		}
	}

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

	openCreateTransactionDropdown() {
		this.setState({ ...this.state, createTransactionDropdown: true });
	}

	closeCreateTransactionDropdown() {
		this.setState({ ...this.state, createTransactionDropdown: false });
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
								headerName: "Date",
								field: "date",
								filter: true,
								comparator: (date1, date2) => dateCompareSort(date1, date2, config.dateFormat.client),
								cellRenderer: (evt) => {
									return formatDate(evt.value);
								},
								...ListAdvancedDefaultSettings.DATE_FILTER_PARAMS_OPTIONS,
								// filterParams: {
								// 	suppressAndOrCondition: true,
								// },
							},
							{
								headerName: "Name",
								field: "customer.name",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter",
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
							{
								headerName: "Account type",
								field: "accountType",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter",
								cellRenderer: (evt) => {
									const str = evt.value;
									return str.charAt(0).toUpperCase() + str.slice(1);
								},
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
							{
								headerName: "Payment",
								field: "bankDetail.bankName",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter",
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
							// {
							// 	headerName: "Account type",
							// 	field: "accountType",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	width: getScaledValue(210, window.innerWidth, 1600),
							// 	filterParams: {
							// 		suppressAndOrCondition: true,
							// 	},
							// 	cellRenderer: (evt) => {
							// 		const str = evt.value;
							// 		return str.charAt(0).toUpperCase() + str.slice(1);
							// 	},
							// 	comparator: localeCompare,
							// 	...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							// },
							// {
							// 	headerName: "Payment",
							// 	field: "bankDetail",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	width: getScaledValue(210, window.innerWidth, 1600),
							// 	filterParams: {
							// 		suppressAndOrCondition: true,
							// 	},
							// 	cellRenderer: (evt) => {
							// 		return evt.value.bankName;
							// 	},
							// 	comparator: localeCompare,
							// 	...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							// },
							// {
							// 	headerName: "Debit",
							// 	field: "debits",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	width: getScaledValue(210, window.innerWidth, 1600),
							// 	cellRenderer: (evt) => {
							// 		if (evt.value) {
							// 			const amount = evt.value;
							// 			return `₹${Number(amount).toLocaleString("en", {
							// 				minimumFractionDigits: 2,
							// 				maximumFractionDigits: 2,
							// 			})}`;
							// 		}
							// 		return "-";
							// 	},
							// 	comparator: localeCompare,
							// 	...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							// },
							// {
							// 	headerName: "Credit",
							// 	field: "credits",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// hide: true,
							// 	width: getScaledValue(210, window.innerWidth, 1600),
							// 	cellRenderer: (evt) => {
							// 		if (evt.value) {
							// 			const amount = evt.value;
							// 			return `₹${Number(amount).toLocaleString("en", {
							// 				minimumFractionDigits: 2,
							// 				maximumFractionDigits: 2,
							// 			})}`;
							// 		}
							// 		return "-";
							// 	},
							// 	comparator: localeCompare,
							// 	...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							// },
							{
								headerName: "Debit",
								field: "debits",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								cellRenderer: (evt) => {
									if (evt.value) {
										return formatCurrency(evt.value);
									}
									return "-";
								},
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
							},

							{
								headerName: "Credit",
								field: "credits",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								cellRenderer: (evt) => {
									if (evt.value) {
										return formatCurrency(evt.value);
									}
									return "-";
								},
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
							},
							{
								headerName: "Balance",
								field: "balance",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								cellRenderer: (evt) => {
									if (evt.value) {
										return formatCurrency(evt.value);
									}
									return "-";
								},
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
							},
						]}
						defaultSortModel={{
							colId: "number",
							sort: "asc",
						}}
						emptyState={{
							iconClass: "icon-customer",
							headline: resources.transactionsEmptyListHeadingText,
							subHeadline: resources.transactionsEmptyListSubHeadingText,
							buttons: (
								<React.Fragment>
									<div style={{ display: "flex", flexDirection: "column" }}>
										<CustomButtonComponent
											key={`topbar-button-1`}
											buttonIcon={"icon-plus"}
											label={resources.transactionsCreateButtonText}
											callback={(event) => {
												this.openCreateTransactionDropdown();
											}}
											type={"primary"}
											rightIcon={"icon-arrow_solid_down"}
										/>
										{this.state.createTransactionDropdown ? (
											<OnClickOutside
												onClickOutside={() => this.closeCreateTransactionDropdown()}
											>
												<div
													style={{
														backgroundColor: "white",
														border: "1px solid #C6C6C6",
														borderRadius: "0px 0px 4px 4px",
														borderWidth: "0px 1px 1px 1px",
													}}
												>
													<div
														onClick={() => {
															this.closeCreateTransactionDropdown();
															this.openMoneyInModal();
														}}
														className="drop-down-opt"
														style={{
															cursor: "pointer",
															margin: 0,
															lineHeight: "25px",
															borderBottom: "1px solid #C6C6C6",
															padding: "7px 0 7px 15px",
															color: "#747474",
														}}
													>
														Money In
													</div>
													<div
														onClick={() => {
															this.closeCreateTransactionDropdown();
															this.openMoneyOutModal();
														}}
														className="drop-down-opt"
														style={{
															cursor: "pointer",
															margin: 0,
															lineHeight: "25px",
															padding: "7px 0 7px 15px",
															color: "#747474",
														}}
													>
														Money Out
													</div>
												</div>
											</OnClickOutside>
										) : null}
									</div>
								</React.Fragment>
							),
						}}
						fetchUrls={[
							`https://dev.groflex.in/api/bankTransaction?offset=0&searchText=&limit=9999999&orderBy=date&desc=true`,
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
						exportFilename={`Exported transactions list ${moment().format(config.dateFormat.client)}`}
						gatherRemovedSelectedRowsBy="id"
						multiSelect={true}
						usePagination={true}
						searchFieldPlaceholder={lang.customerSearchCategory}
						loadingRowsMessage={"Loading Transactions list..."}
						noFilterResultsMessage={"No Transactions match the filter"}
						webStorageKey={WebStorageKey.TRANSACTIONS_LIST_SETTING}
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
									}
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
						onRowClicked={(transaction) => {
							invoiz.router.navigate(`/transaction/${transaction.id}`);
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
