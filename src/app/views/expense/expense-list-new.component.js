import React from 'react';
import invoiz from 'services/invoiz.service';
import moment from 'moment';
import config from 'config';
import TopbarComponent from 'shared/topbar/topbar.component';
import ListAdvancedComponent from 'shared/list-advanced/list-advanced.component';
import ButtonComponent from 'shared/button/button.component';
import { ListAdvancedDefaultSettings } from 'helpers/constants';
import { localeCompare, localeCompareNumeric, dateCompare, dateCompareSort } from 'helpers/sortComparators';
import { getScaledValue } from 'helpers/getScaledValue';
import WebStorageKey from 'enums/web-storage-key.enum';
import Expense from 'models/expense.model';
import { formatCurrency } from 'helpers/formatCurrency';
import { convertMinutesToTimeString } from 'helpers/timetracking';
import { updateStatusIconCellColumns } from 'helpers/list-advanced/updateStatusIconCellColumns';
import userPermissions from 'enums/user-permissions.enum';
import { connect, Provider } from 'react-redux';
import store from 'redux/store';
import ModalService from 'services/modal.service';
import DeleteRowsModal from 'shared/modals/list-advanced/delete-rows-modal.component';
import { formatDate, formatApiDate, formateClientDateMonthYear } from 'helpers/formatDate';
import CancelExpenseModalComponent from 'shared/modals/cancel-expense-modal.component';
import planPermissions from "enums/plan-permissions.enum";
import RestrictedOverlayComponent from "shared/overlay/restricted-overlay.component";
class ExpenseListNewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			expense: null,
			isLoading: true,
			selectedRows: [],
			printing: false,
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_EXPENDITURE),
		};
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	componentDidMount () {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_EXPENSE)) {
			invoiz.user.logout(true);
		}
	}

	createTopbar() {
		const { isLoading, selectedRows } = this.state;
		const { resources } = this.props;
		const topbarButtons = [];

		if (!isLoading) {
			topbarButtons.push({
				type: 'primary',
				label: 'Create expenditure',
				buttonIcon: 'icon-plus',
				action: 'create',
			});
		}

		// if (selectedRows && selectedRows.length > 0) {
		// 	topbarButtons.push({
		// 		type: 'danger',
		// 		label: resources.str_clear,
		// 		buttonIcon: 'icon-trashcan',
		// 		action: 'delete-expenses'
		// 	});
		// }

		const topbar = (
			<TopbarComponent
				title={`Expenditures`}
				viewIcon={`icon-expense`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
				buttons={topbarButtons}
			/>
		);

		return topbar;
	}

	cancelExpense(expense) {
		const { resources } = this.props;

		if(expense.status==='cancelled')
		return

		ModalService.open(<CancelExpenseModalComponent expense={expense} resources={resources} />, {
			//headline: format(resources.invoiceCancelHeading, invoice.number),
			width: 800
		});
	}
	onActionCellPopupItemClick(expense, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case 'edit':
				this.onRowOrPopupClick(expense);
				break;
			case 'cancel':
				this.cancelExpense(expense);
				break;
			case 'delete':
				ModalService.open(`${resources.expenseDeleteConfirmText} ${resources.str_undoneMessage}`, {
					width: 500,
					headline: resources.expenseDeletePopupHeading,
					cancelLabel: resources.str_abortStop,
					confirmIcon: 'icon-trashcan',
					confirmLabel: resources.str_clear,
					confirmButtonType: 'secondary',
					onConfirm: () => {
						ModalService.close();
						invoiz
			.request(`${config.resourceHost}expense/${expense.id}`, {
				auth: true,
				method: 'DELETE'
			})
			.then(() => {
                invoiz.page.showToast({ message: resources.expenseDeleteSuccessMessage });
				ModalService.close();
						if (this.refs.listAdvanced) {
						this.refs.listAdvanced.removeSelectedRows([expense]);
				    }
			    });
			}
				});
				break;
		}
	}

	onTopbarButtonClick(action) {
		switch (action) {
			case 'create':
				invoiz.router.navigate('/expense/new');
				break;
			case 'delete-expenses':
				if (this.refs.listAdvanced) {
					let selectedRowsData = this.refs.listAdvanced.getSelectedRows({
						prop: 'date',
						sort: 'asc',
					});

					selectedRowsData = selectedRowsData.map((expense) => {
						return new Expense(expense);
					});

					ModalService.open(
						<DeleteRowsModal
							deleteUrlPrefix={`${config.resourceHost}expense/`}
							text="Are you sure you would like to delete the following expense(s)? This action cannot be undone!"
							firstColLabelFunc={(item) => item.date}
							secondColLabelFunc={(item) => item.customerData.name}
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
							headline: 'Delete expense(s)',
						}
					);
				}
		}
	}

	getTimetrackingStatusMarkup(value, statusIconWidth, withText) {
		let icon = '';
		let text = '';
		switch (value) {
			case "bank_paid":
			case "bank_cancelled":
			//case "paidBank":
				icon = "check_altered";
				text = "Paid - Bank";
				break;
			case "cash_paid":
			case "cash_cancelled":
			//case "paidCash":
				icon = "check_altered";
				text = "Paid - Cash";
				break;
			case "open":
				icon = "offen";
				text = "Open";
				break;
			case "cancelled":
				icon = "storniert";
				text = "Cancelled";
				break;
			case "paid":
				icon = "check_altered";
				text = "Paid";
				break;
			default:
				break;
		}

		return `<div class="cell-status-icon"><div class='icon icon-${icon}' width="${statusIconWidth}"></div> ${
			withText ? `<span class='cell-status-icon-text'>${text}</span>` : ''
		}</div>`;
	}

	onRowOrPopupClick(expense) {
		invoiz.router.navigate(
			`/expense/edit/${expense.id}`
		);
	}

	getReceiptsRenderer(receipts, width, number) {
		return ` ${receipts.length > 0 ? `<div class="cell-status-icon"><div class='icon icon-attachment' width="${width}"></div>` : ''} ${
			number ? `<span class='cell-status-icon-text'>${number}</span>` : ''
		}</div>`;
	}

	upperCaseFirstLetter(string){
		if(!string)return string
		return string.charAt(0).toLocaleUpperCase()+string.substr(1)
	}

	render() {
		const { resources } = this.props;
		const {
			canChangeAccountData,
			planRestricted,
		} = this.state;
		return (
			<div className="expense-list-component-wrapper">
						{planRestricted ? (
					<RestrictedOverlayComponent
						message={
							canChangeAccountData
							? 'Expenditures are not available in your current plan'
							: `You don’t have permission to access expenditures`
						}
						owner={canChangeAccountData}
					/>
				) : null}
				{this.createTopbar()}

				<div className="expense-list-wrapper">
					<ListAdvancedComponent
						headTabbedFilterItemsFunc={(expenses) => {
						
							return [
								{
									filter: {
										field: 'status',
										setNull: 'true',
									},
									label: 'All',
									count: expenses.length,
								},
								{
									filter: {
										field: 'status',
										filterType: 'set',
										values: ['open'],
									},
									label: 'Open',
									count: expenses.filter((expense) => expense.status === 'open')
										.length,
								},
								{
									filter: {
										field: 'status',
										filterType: 'set',
										values: ['paidBank'],
									},
									label: 'Paid - Bank',
									count: expenses.filter((expense) => expense.payKind === 'paidBank')
										.length,
								},
								{
									filter: {
										field: 'payKind',
										filterType: 'set',
										values: ['paidCash'],
									},
									label: 'Paid',
									count: expenses.filter((expense) => expense.status === 'paid')
										.length,
								},
								{
									filter: {
										field: 'payKind',
										filterType: 'set',
										values: ['bank_paid'],
									},
									label: 'Paid - Bank',
									count: expenses.filter((expense) => expense.payKind === 'bank_paid' )
										.length,
								},
								{
									filter: {
										field: 'payKind',
										filterType: 'set',
										values: ['cash_paid'],
									},
									label: 'Paid - Cash',
									count: expenses.filter((expense) => expense.payKind === 'cash_paid' )
										.length,
								},
								{
									filter: {
										field: 'status',
										filterType: 'set',
										values: ['cancelled'],
									},
									label: 'Cancelled',
									count: expenses.filter((expense) => expense.status === 'cancelled')
										.length,
								},
								{
									filter: {
										field: 'type',
										filterType: 'set',
										values: ['expense'],
									},
									label: 'Expenses',
									count: expenses.filter((expense) => expense.type === 'expense')
										.length,
								},
								{
									filter: {
										field: 'type',
										filterType: 'set',
										values: ['purchase'],
									},
									label: 'Purchases',
									count: expenses.filter((expense) => expense.type === 'purchase').length
								},
							];
						}}
						ref="listAdvanced"
						columnDefs={[
							{
								headerName: 'Receipt no.',
								field: 'receiptNumber',
								hide: true,
								maxWidth: 200,
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								cellRenderer: (evt) => {
									return this.getReceiptsRenderer(evt.data.receipts, 10, evt.value)
								},
								customProps: {
									longName: 'Receipt number',
								},
							},
							{
								headerName: 'Receipt date',
								field: 'date',
								filter: true,
								comparator: (date1, date2) => dateCompareSort(date1, date2, config.dateFormat.client),
								// filterParams: {
								// 	suppressAndOrCondition: true,
								// 	filterOptions: ListAdvancedDefaultSettings.DATE_FILTER_PARAMS_OPTIONS,
								// 	comparator: (filterLocalDateAtMidnight, cellValue) =>
								// 		dateCompare(filterLocalDateAtMidnight, cellValue, config.dateFormat.client),
								// },
								cellRenderer: (evt) => {
									return formatDate(evt.value);
								}
							},
							// {
							// 	headerName: 'Payee',
							// 	field: 'customerData.name',
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	width: getScaledValue(310, window.innerWidth, 1600),
							// 	customProps: {
							// 		longName: 'Payee',
							// 	},
							// },
							{
								headerName: 'Payee',
								field: 'customerData.name',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filter: "agSetColumnFilter"
							},
							{
								headerName: 'Type',
								field: 'type',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(310, window.innerWidth, 1600),
								// cellStyle: () => {
								// 	return {textTransform: 'capitalize'}
								// },
								cellRenderer: (evt) => {
									return evt.value === 'purchase' ? 'Purchase' : 'Expense';
								},
								filterParams: {
									suppressMiniFilter: true,
									valueFormatter: (evt) => {
										return evt.value === 'purchase' ? 'Purchase' : 'Expense';
									},
									values: ['expense', 'purchase', null]
								},
								cellStyle: {color: 'black'},
								customProps: {
									longName: 'Type',
								}
								
							},
							{
								headerName: 'Status',
								field: 'status',
								comparator: localeCompare,
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(155, window.innerWidth, 1600),
								cellRenderer: (evt) => {
									return this.getTimetrackingStatusMarkup(evt.value, 15, true);
								},
								filterParams: {
									suppressMiniFilter: true,
									valueFormatter: (evt) => {
										return evt.value === 'open' ? 'Open' : evt.value === 'paid' ? 'Paid' : 'Cancelled';
									},
									values: ['open', 'paid', 'cancelled'],
								},
								customProps: {
									longName: 'Status',
									disableContextMenuCopyItem: true,
									filterListItemValueRenderer: (value, listItemHtml) => {
										const iconHtml = this.getTimetrackingStatusMarkup(value, 15, false);
										$(iconHtml).insertBefore($(listItemHtml).find('.ag-set-filter-item-value'));
									},
									onColumnResized: (evt) => {
										updateStatusIconCellColumns(evt, 96);
									},
								},
							},
							{
								headerName: 'Pay type',
								field: 'payKind',
								comparator: localeCompare,
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(155, window.innerWidth, 1600),
								cellRenderer: (evt) => {
									return this.getTimetrackingStatusMarkup(evt.value, 15, true);
								},
								filterParams: {
									suppressMiniFilter: true,
									valueFormatter: (evt) => {
										//return evt.value === 'paidBank' ? 'Paid - Bank' : 'Paid - Cash';
										if(evt.value.includes('paid'))
										        return 'Paid - Bank'
										if(evt.value.includes('cash'))
											return 'Paid - Cash'				
									},
									values: ['bank_paid', 'cash_paid','cash_cancelled','bank_cancelled'],
								},
								customProps: {
									longName: 'Pay type',
									disableContextMenuCopyItem: true,
									filterListItemValueRenderer: (value, listItemHtml) => {
										const iconHtml = this.getTimetrackingStatusMarkup(value, 15, false);
										$(iconHtml).insertBefore($(listItemHtml).find('.ag-set-filter-item-value'));
									},
									onColumnResized: (evt) => {
										updateStatusIconCellColumns(evt, 96);
									},
								},
							},
							{
								headerName: 'Due Since',
								field: 'dueSince',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								filter: 'agNumberColumnFilter',
								filterParams: {
									suppressAndOrCondition: true,
								},
								valueFormatter: (evt) => {
									return evt.value ? evt.value + ' days' : '';
								}
							},
							{
								headerName: 'Total gross',
								field: 'totalGross',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								cellRenderer: (evt) => {
									return formatCurrency(evt.value);
								},
								filter: 'agNumberColumnFilter',
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									longName: 'Total gross',
									calculateHeaderSum: true,
								},
							},
							{
								headerName: 'Currency',
								field: 'baseCurrency',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								hide: true,
								filterParams: {
									suppressMiniFilter: true,
								},
								valueFormatter: (evt) => {
									return evt.value === '' || evt.value === null ? 'INR' : evt.value;
								}
							},
						]}
						defaultSortModel={{
							colId: 'date',
							sort: 'asc',
						}}
						emptyState={{
							iconClass: 'icon-expense',
							headline: resources.expenseEmptyListHeadingText,
							subHeadline: resources.expenseEmptyListCaptureText,
							buttons: (
								<React.Fragment>
									<ButtonComponent
										label="Create expenditure"
										buttonIcon="icon-plus"
										dataQsId="empty-list-create-button"
										callback={() => invoiz.router.navigate('/expense/new')}
									/>
								</React.Fragment>
							),
						}}
						fetchUrls={[
							`${config.resourceHost}expense?offset=0&searchText=&limit=9999999&orderBy=date&desc=true&filter=all`
						]}
						responseDataMapFunc={(expenses) => {
							expenses= expenses.map((expense) => {
								expense = new Expense(expense);
								console.log(moment().diff(moment(expense.payDate + 'T00:00:00.000Z'), 'days'), expense.payDate)
								expense.payee = expense.displayName;
								expense.dueSince = 
									expense.status === 'open'
										? moment().diff(expense.date, 'days') || null
										: null
								return expense;
							});
							return expenses;
						}}
						exportExcelCallbacks={{
						}}
						exportFilename={`Exported expenses list ${moment().format(config.dateFormat.client)}`}
						multiSelect={true}
						usePagination={true}
						loadingRowsMessage={'Loading expenses ...'}
						noFilterResultsMessage={'No expenses matched the filter'}
						webStorageKey={WebStorageKey.EXPENSE_LIST_SETTINGS}
						actionCellPopup={{
							popupEntries: [
								[
									{
										dataQsId: `expense-list-item-dropdown-entry-edit`,
										label: 'Edit',
										action: 'edit',
									},
									{
										dataQsId: `expense-list-item-dropdown-entry-cancel`,
										label: 'Cancel',
										action: 'cancel',
									},
									{
										dataQsId: `expense-list-item-dropdown-entry-edit`,
										label: 'Delete',
										action: 'delete',
									},
								],
							],
							onPopupItemClicked: (itemData, popupEntry) => {
								this.onActionCellPopupItemClick(itemData, popupEntry);
							},
						}}
						onRowDataLoaded={(expense) => {
							if (!this.isUnmounted) {
								this.setState({
									expense,
									isLoading: false,
								});
							}
						}}
						onRowClicked={(expense) => {
							this.onRowOrPopupClick(expense);
						}}
						onRowSelectionChanged={(selectedRows) => {
							if (!this.isUnmounted) {
								this.setState({ selectedRows });
							}
						}}
						searchFieldPlaceholder="Expenses"
					/>
				</div>
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return {
		resources
	};
};

export default connect(mapStateToProps)(ExpenseListNewComponent);
