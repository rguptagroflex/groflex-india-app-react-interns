import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import TopbarComponent from 'shared/topbar/topbar.component';
import {
	fetchRecurringInvoiceList,
	sortRecurringInvoiceList,
	paginateRecurringInvoiceList,
	filterRecurringInvoiceList,
	deleteRecurringInvoice,
	selectAllRecurringInvoices,
	selectRecurringInvoice,
	searchRecurringInvoiceList
} from 'redux/ducks/recurring-invoice/recurringInvoiceList';
import { connect, Provider } from 'react-redux';
import store from 'redux/store';
import ListComponent from 'shared/list/list.component';
import ListSearchComponent from 'shared/list-search/list-search.component';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatDate } from 'helpers/formatDate';
import PopoverComponent from 'shared/popover/popover.component';
import PaginationComponent from 'shared/pagination/pagination.component';
import FilterComponent from 'shared/filter/filter.component';
import ModalService from 'services/modal.service';
import { copyAndEditTransaction } from 'helpers/transaction/copyAndEditTransaction';
import { updateSubscriptionDetails } from 'helpers/updateSubsciptionDetails';
import ButtonComponent from 'shared/button/button.component';
import RecurringInvoiceMultiActionComponent from 'shared/recurring-invoice-multi-action/recurring-invoice-multi-action.component';
import RecurringInvoiceState from 'enums/recurring-invoice/recurring-invoice-state.enum';
import LoadingService from 'services/loading.service';
import RecurringInvoice from 'models/recurring-invoice.model';

import userPermissions from 'enums/user-permissions.enum';

class RecurringInvoiceListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			canCreateRecurringInvoice: null,
			canUpdateRecurringInvoice: null,
			canDeleteRecurringInvoice: null,
			canViewRecurringInvoice: null,
			canStartRecurringInvoice: null,
			canFinishRecurringInvoice: null
		};
	}
	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_RECURRING_INVOICE)) {
			invoiz.user.logout(true);
		}
		this.props.fetchRecurringInvoiceList(true);
		this.setState({
			canCreateRecurringInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_RECURRING_INVOICE),
			canDeleteRecurringInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_RECURRING_INVOICE),
			canUpdateRecurringInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_RECURRING_INVOICE),
			canViewRecurringInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_RECURRING_INVOICE),
			canStartRecurringInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.START_RECURRING_INVOICE),
			canFinishRecurringInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.FINISH_RECURRING_INVOICE)
		});
	}

	render() {
		const {
			isLoading,
			columns,
			currentPage,
			totalPages,
			filterItems,
			recurringInvoiceListData: { recurringInvoices, meta },
			allSelected,
			selectedItems,
			searchText,
			resources
		} = this.props;

		const { canCreateRecurringInvoice } = this.state;

		const tableRows = this.createTableRows(recurringInvoices);
		const allCount = meta && meta.filter && meta.filter.all && meta.filter.all.count;

		const listContent = (
			<div>
				<ListComponent
					allSelected={allSelected}
					selectable={true}
					selectedCallback={(id, isChecked) => this.onSelected(id, isChecked)}
					selectedAllCallback={isChecked => this.onAllSelected(isChecked)}
					clickable={true}
					rowCallback={recurringInvoiceId => this.onRowClick(recurringInvoiceId)}
					sortable={true}
					columns={columns}
					rows={tableRows}
					columnCallback={column => this.onSort(column)}
					resources={resources}
				/>

				{totalPages > 1 ? (
					<div className="recurring-invoice-list-pagination">
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
				<div className="text-placeholder icon icon-rechnung" />
				<div className="text-h2">{resources.recurringEmptyListHeadingText}</div>
				<div className="">{resources.createRecurringText}</div>
				<ButtonComponent
					label={resources.str_hereWeGo}
					buttonIcon="icon-plus"
					dataQsId="empty-list-create-button"
					callback={() => invoiz.router.navigate('/recurringinvoice/new')}
					disabled={!canCreateRecurringInvoice}
				/>
			</div>
		);

		const topbarButtons = [];
		if (selectedItems && selectedItems.length > 0) {
			let allDeletable = true;
			selectedItems.forEach(invoice => {
				if (invoice.state !== RecurringInvoiceState.DRAFT) {
					allDeletable = false;
				}
			});

			if (allDeletable) {
				topbarButtons.push({
					type: 'danger',
					label: resources.str_clear,
					buttonIcon: 'icon-trashcan',
					action: 'delete-recurring-invoices'
				});
			}
		}

		if (canCreateRecurringInvoice) {
			topbarButtons.push({
				type: 'primary',
				label: resources.createInvoiceSubscription,
				buttonIcon: 'icon-plus',
				action: 'create'
			});
		 }
		const topbar = (
			<TopbarComponent
				title={resources.str_recurringBills}
				viewIcon={`icon-rechnung`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
				buttons={topbarButtons}
			/>
		);

		return (
			<div className="recurring-invoice-list-component-wrapper">
				{topbar}

				<div className="recurring-invoice-list-head">
					<div className="recurring-invoice-list-head-content">
						<ListSearchComponent
							value={searchText}
							placeholder={resources.recurringSearchText}
							onChange={val => this.onSearch(val)}
						/>
						{isLoading ? null : allCount > 0 ? (
							<FilterComponent items={filterItems} onChange={filter => this.onFilterList(filter)} resources={resources} />
						) : null}{' '}
					</div>
				</div>

				<div className="box recurring-invoice-list-wrapper">
					{isLoading ? null : allCount > 0 ? (
						listContent
					) : searchText.trim().length > 0 ? (
						<div className="empty-list-box">{resources.recurringEmptyListText}</div>
					) : isLoading ? null : (
						emptyListContent
					)}
				</div>
			</div>
		);
	}

	onTopbarButtonClick(action) {
		switch (action) {
			case 'create':
				this.createRecurringInvoice();
				break;
			case 'delete-recurring-invoices':
				ModalService.open(
					<Provider store={store}>
						<RecurringInvoiceMultiActionComponent onConfirm={() => this.onMultiActionConfirmed()} />
					</Provider>,
					{
						width: 500,
						headline: 'Abo-Rechnungen löschen'
					}
				);
				break;
		}
	}

	onSelected(id, checked) {
		this.props.selectRecurringInvoice(id, checked);
	}

	onAllSelected(checked) {
		this.props.selectAllRecurringInvoices(checked);
	}

	onMultiActionConfirmed() {
		ModalService.close();
		this.props.fetchRecurringInvoiceList(true);
	}

	onRowClick(recurringInvoiceId) {
		invoiz.router.navigate(`/recurringinvoice/${recurringInvoiceId}`);
	}

	onDropdownEntryClick(recurringInvoice, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case 'copyAndEdit':
				LoadingService.show(resources.recurringCopyInvoice);
				copyAndEditTransaction({
					invoiceModel: {
						type: 'recurringInvoice',
						recurrence: recurringInvoice.recurrence,
						id: recurringInvoice.id
					},
					onCopySuccess: () => {
						LoadingService.hide();
					},
					onCopyError: () => {
						LoadingService.hide();
					}
				});
				break;

			case 'finish':
				const formattedCosts = formatCurrency(recurringInvoice.totalGross);

				ModalService.open(
					<div className="ampersand-delete-modal-content">
						<div>{resources.recurringFinishConfirmText}</div>
						<ul>
							<li>
								<b>{resources.str_receiver}:</b> <span>{recurringInvoice.name}</span>
							</li>
							<li>
								<b>{resources.str_amount}:</b> <span>{formattedCosts}</span>
							</li>
							<li>
								<b>{resources.str_repeat}:</b> <span>{recurringInvoice.displayRecurrence}</span>
							</li>
						</ul>
					</div>,
					{
						width: 500,
						headline: resources.recurringFinishConfirmCaption,
						cancelLabel: resources.str_abortStop,
						confirmIcon: 'icon-check',
						confirmLabel: resources.str_breakUp,
						confirmButtonType: 'secondary',
						onConfirm: () => {
							ModalService.close();
							invoiz
								.request(`${config.recurringInvoice.resourceUrl}/${recurringInvoice.id}/finish`, {
									auth: true,
									method: 'PUT'
								})
								.then(() => {
									updateSubscriptionDetails();
									this.props.fetchRecurringInvoiceList();
									invoiz.showNotification({ message: resources.recurringInvoiceFinishSuccessMessage });
								})
								.catch(xhr => {
									if (xhr) {
										invoiz.showNotification({
											type: 'error',
											message: resources.recurringInvoiceFinishErrorMessage
										});
									}
								});
						}
					}
				);
				break;

			case 'delete':
				const model = new RecurringInvoice(recurringInvoice);

				ModalService.open(resources.recurringDeleteMessage, {
					headline: resources.recurringDeleteInvoiceText,
					cancelLabel: resources.str_abortStop,
					confirmLabel: resources.str_clear,
					confirmIcon: 'icon-trashcan',
					confirmButtonType: 'secondary',
					onConfirm: () => {
						invoiz
							.request(`${config.recurringInvoice.resourceUrl}/${model.id}`, {
								auth: true,
								method: 'DELETE'
							})
							.then(() => {
								ModalService.close();
								invoiz.showNotification(resources.recurringDeleteSuccessMessage);
								this.props.fetchRecurringInvoiceList();
							})
							.catch(xhr => {
								if (xhr) {
									invoiz.showNotification({
										type: 'error',
										message: resources.defaultErrorMessage
									});
								}
							});
					}
				}
				);
				break;
		}
	}

	onFilterList(filter) {
		this.props.filterRecurringInvoiceList(filter);
	}

	onPaginate(page) {
		this.props.paginateRecurringInvoiceList(page);
		window.scrollTo(0, 0);
	}

	onSort(column) {
		this.props.sortRecurringInvoiceList(column);
	}

	onSearch(searchText) {
		this.props.searchRecurringInvoiceList(searchText);
	}

	createRecurringInvoice() {
		invoiz.router.navigate('/recurringinvoice/new');
	}

	createTableRows(recurringInvoices) {
		const rows = [];
		const { resources } = this.props;
		const { canCreateRecurringInvoice, canDeleteRecurringInvoice, canUpdateRecurringInvoice } = this.state;
		if (recurringInvoices) {
			recurringInvoices.forEach((recurringInvoice, index) => {
				const dropdownEntries = [
					{
						dataQsId: `recurring-invoice-list-item-dropdown-entry-copy-and-edit`,
						label: resources.str_copy_edit,
						action: 'copyAndEdit'
					}
				];

				if (recurringInvoice.state === 'draft') {
					dropdownEntries.push({
						dataQsId: `recurring-invoice-list-item-dropdown-entry-delete`,
						label: resources.str_clear,
						action: 'delete'
					});
				}

				if (recurringInvoice.state === 'started') {
					dropdownEntries.push({
						dataQsId: `recurring-invoice-list-item-dropdown-entry-finish`,
						label: resources.str_endSubscription,
						action: 'finish'
					});
				}
				let dropdown;

				if (canCreateRecurringInvoice && canDeleteRecurringInvoice && canUpdateRecurringInvoice) {
					dropdown = (
						<div
							className="recurring-invoice-list-cell-dropdown icon icon-arr_down"
							id={`recurring-invoice-list-dropdown-anchor-${index}`}
						>
							<PopoverComponent
								showOnClick={true}
								contentClass={`recurring-invoice-list-cell-dropdown-content`}
								entries={[dropdownEntries]}
								onClick={entry => this.onDropdownEntryClick(recurringInvoice, entry)}
								elementId={`recurring-invoice-list-dropdown-anchor-${index}`}
								offsetLeft={-3}
								offsetTop={10}
							/>
						</div>
					);
				}
				rows.push({
					id: recurringInvoice.id,
					recurringInvoice,
					selected: recurringInvoice.selected,
					additionalClass: recurringInvoice.state,
					cells: [
						{ value: recurringInvoice.name },
						{ value: formatDate(recurringInvoice.startDate) },
						{ value: recurringInvoice.displayRecurrence },
						{ value: recurringInvoice.displayNextDate },
						{
							value: invoiz.user.isSmallBusiness
								? formatCurrency(recurringInvoice.totalNet)
								: formatCurrency(recurringInvoice.totalGross)
						},
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
		allSelected,
		selectedItems,
		recurringInvoiceListData,
		searchText
	} = state.recurringInvoice.recurringInvoiceList;
	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		filterItems,
		allSelected,
		selectedItems,
		recurringInvoiceListData,
		searchText,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchRecurringInvoiceList: reset => {
			dispatch(fetchRecurringInvoiceList(reset));
		},
		paginateRecurringInvoiceList: page => {
			dispatch(paginateRecurringInvoiceList(page));
		},
		sortRecurringInvoiceList: column => {
			dispatch(sortRecurringInvoiceList(column));
		},
		filterRecurringInvoiceList: filterItem => {
			dispatch(filterRecurringInvoiceList(filterItem));
		},
		searchRecurringInvoiceList: searchText => {
			dispatch(searchRecurringInvoiceList(searchText));
		},
		deleteRecurringInvoice: id => {
			dispatch(deleteRecurringInvoice(id));
		},
		selectRecurringInvoice: (id, checked) => {
			dispatch(selectRecurringInvoice(id, checked));
		},
		selectAllRecurringInvoices: selected => {
			dispatch(selectAllRecurringInvoices(selected));
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(RecurringInvoiceListComponent);
