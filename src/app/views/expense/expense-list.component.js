import React from 'react';
import TopbarComponent from 'shared/topbar/topbar.component';
import invoiz from 'services/invoiz.service';
import {
	fetchExpenseList,
	sortExpenseList,
	paginateExpenseList,
	filterExpenseList,
	searchExpenseList,
	deleteExpense,
	selectAllExpenses,
	selectExpense,
	deleteSelectedExpenses
} from 'redux/ducks/expense/expenseList';
import { connect, Provider } from 'react-redux';
import ListComponent from 'shared/list/list.component';
import ListSearchComponent from 'shared/list-search/list-search.component';
import ExpensePayKind from 'enums/expense/expense-paykind.enum';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatDate } from 'helpers/formatDate';
import PopoverComponent from 'shared/popover/popover.component';
import PaginationComponent from 'shared/pagination/pagination.component';
import FilterComponent from 'shared/filter/filter.component';
import ModalService from 'services/modal.service';
import ExpenseDeleteModalComponent from 'shared/modals/expense-delete-modal.component';
import ButtonComponent from 'shared/button/button.component';
import store from 'redux/store';
import userPermissions from 'enums/user-permissions.enum';

class ExpenseListComponent extends React.Component {
	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_EXPENSE)) {
			invoiz.user.logout(true);
		}
		this.props.fetchExpenseList(true);
	}

	render() {
		const {
			isLoading,
			columns,
			currentPage,
			totalPages,
			filterItems,
			expenseListData: { expenses, meta },
			allSelected,
			selectedItems,
			searchText,
			resources
		} = this.props;

		const tableRows = this.createTableRows(expenses);
		const allCount = meta && meta.filter && meta.filter.all && meta.filter.all.count;

		const listContent = (
			<div>
				<ListComponent
					allSelected={allSelected}
					selectable={true}
					selectedCallback={(id, isChecked) => this.onSelected(id, isChecked)}
					selectedAllCallback={isChecked => this.onAllSelected(isChecked)}
					clickable={true}
					rowCallback={expenseId => this.onRowClick(expenseId)}
					sortable={true}
					columns={columns}
					rows={tableRows}
					columnCallback={column => this.onSort(column)}
					resources={resources}
				/>

				{totalPages > 1 ? (
					<div className="expense-list-pagination">
						<PaginationComponent
							currentPage={currentPage}
							totalPages={totalPages}
							onPaginate={page => this.onPaginate(page)}
						/>
					</div>
				) : null}
			</div>
		);

		const emptyListContent = (
			<div className="empty-list-box">
				<div className="text-placeholder icon icon-expense" />
				<div className="text-h2">{resources.expenseEmptyListHeadingText}</div>
				<div className="">{resources.expenseEmptyListCaptureText}</div>
				<ButtonComponent
					label={resources.str_hereWeGo}
					buttonIcon="icon-plus"
					dataQsId="empty-list-create-button"
					callback={() => invoiz.router.navigate('/expense/new')}
				/>
			</div>
		);

		const topbarButtons = [];
		if (selectedItems && selectedItems.length > 0) {
			topbarButtons.push({
				type: 'danger',
				label: resources.str_clear,
				buttonIcon: 'icon-trashcan',
				action: 'delete-expenses'
			});
		}
		topbarButtons.push({
			type: 'primary',
			label: resources.str_createOutput,
			buttonIcon: 'icon-plus',
			action: 'create-expense'
		});

		const topbar = (
			<TopbarComponent
				title={resources.str_expenditure}
				viewIcon={`icon-expense`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button)}
				buttons={topbarButtons}
			/>
		);

		return (
			<div className="expense-list-component-wrapper">
				{topbar}

				<div className="expense-list-head">
					<div className="expense-list-head-content">
						<ListSearchComponent
							value={searchText}
							placeholder={resources.expenseSearchPlaceholderText}
							onChange={val => this.onSearch(val)}
						/>
						{isLoading ? null : allCount > 0 ? (
							<FilterComponent items={filterItems} onChange={filter => this.onFilterList(filter)} resources={resources} />
						) : null}{' '}
					</div>
				</div>

				<div className="box expense-list-wrapper">
					{isLoading ? null : allCount > 0 ? (
						listContent
					) : searchText.trim().length > 0 ? (
						<div className="empty-list-box">{resources.expenseEmptySearchResultText}</div>
					) : isLoading ? null : (
						emptyListContent
					)}
				</div>
			</div>
		);
	}

	onTopbarButtonClick(button) {
		const { resources } = this.props;
		switch (button.action) {
			case 'create-expense':
				this.createExpense();
				break;
			case 'delete-expenses':
				ModalService.open(
					<Provider store={store}>
						<ExpenseDeleteModalComponent onConfirm={() => this.onDeleteConfirmSelected()} resources={resources} />
					</Provider>,
					{
						width: 500,
						headline: resources.expenseDeletePopupHeading
					}
				);
				break;
		}
	}

	onSelected(id, checked) {
		this.props.selectExpense(id, checked);
	}

	onAllSelected(checked) {
		this.props.selectAllExpenses(checked);
	}

	onRowClick(expenseId) {
		invoiz.router.navigate(`/expense/edit/${expenseId}`);
	}

	onDeleteConfirmSelected() {
		ModalService.close();
		this.props.fetchExpenseList(true);
	}

	onDeleteConfirm(expense) {
		ModalService.close();
		this.props.deleteExpense(expense.id);
	}

	onDropdownEntryClick(expense, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case 'edit':
				setTimeout(() => {
					invoiz.router.navigate(`/expense/edit/${expense.id}`);
				});
				break;

			case 'delete':
				ModalService.open(
					<Provider store={store}>
						<ExpenseDeleteModalComponent
							expense={expense}
							onConfirm={() => this.onDeleteConfirm(expense)}
							resources={resources}
						/>
					</Provider>,
					{
						width: 500,
						headline: resources.expenseDeleteConfirmCaption
					}
				);
				break;
		}
	}

	onFilterList(filter) {
		this.props.filterExpenseList(filter);
	}

	onPaginate(page) {
		this.props.paginateExpenseList(page);
		window.scrollTo(0, 0);
	}

	onSort(column) {
		this.props.sortExpenseList(column);
	}

	onSearch(searchText) {
		this.props.searchExpenseList(searchText);
	}

	createExpense() {
		invoiz.router.navigate('/expense/new');
	}

	createTableRows(expenses) {
		const { resources } = this.props;
		const rows = [];

		const dropdownEntries = [
			{
				dataQsId: `expense-list-item-dropdown-entry-edit`,
				label: resources.str_toEdit,
				action: 'edit'
			},
			{
				dataQsId: `expense-list-item-dropdown-entry-delete`,
				label: resources.str_clear,
				action: 'delete'
			}
		];

		if (expenses) {
			expenses.forEach((expense, index) => {
				const dropdown = (
					<div
						className="expense-list-cell-dropdown icon icon-arr_down"
						id={`expense-list-dropdown-anchor-${index}`}
					>
						<PopoverComponent
							showOnClick={true}
							contentClass={`expense-list-cell-dropdown-content`}
							entries={[dropdownEntries]}
							onClick={entry => this.onDropdownEntryClick(expense, entry)}
							elementId={`expense-list-dropdown-anchor-${index}`}
							offsetLeft={-3}
							offsetTop={10}
						/>
					</div>
				);
				let dateValue = '';
				if (expense.icon) {
					dateValue = (
						<div>
							{formatDate(expense.date)} <div className={`icon ${expense.icon}`} />
						</div>
					);
				} else {
					dateValue = formatDate(expense.date);
				}

				rows.push({
					id: expense.id,
					expense,
					selected: expense.selected,
					cells: [
						{
							value:
								expense.payKind !== ExpensePayKind.OPEN ? (
									<div className="list-cell-success-indicator">{dateValue}</div>
								) : (
									dateValue
								)
						},
						{ value: expense.displayName, subValue: expense.description },
						{ value: expense.payKind === ExpensePayKind.OPEN ? resources.str_open : resources.str_paid },
						{ value: formatCurrency(expense.totalGross) },
						{ value: dropdown }
					]
				});
			});
		}

		return rows;
	}
}

const mapStateToProps = state => {
	const {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		filterItems,
		expenseListData,
		allSelected,
		selectedItems,
		searchText
	} = state.expense.expenseList;

	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		filterItems,
		expenseListData,
		allSelected,
		selectedItems,
		searchText,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchExpenseList: reset => {
			dispatch(fetchExpenseList(reset));
		},
		paginateExpenseList: page => {
			dispatch(paginateExpenseList(page));
		},
		sortExpenseList: column => {
			dispatch(sortExpenseList(column));
		},
		filterExpenseList: filterItem => {
			dispatch(filterExpenseList(filterItem));
		},
		searchExpenseList: searchText => {
			dispatch(searchExpenseList(searchText));
		},
		deleteExpense: id => {
			dispatch(deleteExpense(id));
		},
		selectExpense: (id, checked) => {
			dispatch(selectExpense(id, checked));
		},
		selectAllExpenses: selected => {
			dispatch(selectAllExpenses(selected));
		},
		deleteSelectedExpenses: () => {
			dispatch(deleteSelectedExpenses());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(ExpenseListComponent);
