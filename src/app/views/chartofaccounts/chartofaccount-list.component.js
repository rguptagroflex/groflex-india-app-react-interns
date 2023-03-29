import invoiz from 'services/invoiz.service';
import React from 'react';
import TopbarComponent from 'shared/topbar/topbar.component';
import {
	fetchCustomerList,
	sortCustomerList,
	paginateCustomerList,
	searchCustomerList,
	deleteCustomer,
	selectAllCustomers,
	selectCustomer,
	deleteSelectedCustomers
} from 'redux/ducks/customer/customerList';
import { connect, Provider } from 'react-redux';
import store from 'redux/store';
import ListComponent from 'shared/list/list.component';
import ListSearchComponent from 'shared/list-search/list-search.component';
import PopoverComponent from 'shared/popover/popover.component';
import PaginationComponent from 'shared/pagination/pagination.component';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import CustomerDeleteModal from 'shared/modals/customer-delete-modal.component';

import userPermissions from 'enums/user-permissions.enum';

class ChartofaccountListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			canCreateCustomer: null,
			canUpdateCustomer: null,
			canDeleteCustomer: null
		};
	}
	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_CUSTOMER)) {
			invoiz.user.logout(true);
		}
		this.props.fetchCustomerList(true);
		this.setState({
			canCreateCustomer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_CUSTOMER),
			canUpdateCustomer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_CUSTOMER),
			canDeleteCustomer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_CUSTOMER)
		});
	}

	render() {
		const {
			isLoading,
			columns,
			currentPage,
			totalPages,
			customerListData: { customers },
			allSelected,
			selectedItems,
			searchText,
			resources
		} = this.props;

		const tableRows = this.createTableRows(customers);

		const { canCreateCustomer, canUpdateCustomer, canDeleteCustomer } = this.state;

		const listContent = (
			<div>
				<ListComponent
					allSelected={allSelected}
					selectable={canDeleteCustomer}
					selectedCallback={(id, isChecked) => this.onSelected(id, isChecked)}
					selectedAllCallback={isChecked => this.onAllSelected(isChecked)}
					clickable={true}
					rowCallback={customerId => this.onRowClick(customerId)}
					sortable={true}
					columns={columns}
					rows={tableRows}
					columnCallback={column => this.onSort(column)}
					resources={resources}
				/>

				{totalPages > 1 ? (
					<div className="customer-list-pagination">
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
				<div className="text-placeholder icon icon-customer" />
				<div className="text-h2">{resources.contactEmptyListHeadingText}</div>
				<div className="">{resources.contactEmptyListCreateContactText}</div>
				<ButtonComponent
					label={resources.contactCreateButtonText}
					buttonIcon="icon-plus"
					dataQsId="empty-list-create-button"
					callback={() => invoiz.router.navigate('/customer/new')}
					disabled={!canCreateCustomer}
				/>
				{/* <ButtonComponent
					label={resources.customerImportButtonText}
					buttonIcon="icon-plus"
					dataQsId="empty-list-import-button"
					callback={() => invoiz.router.navigate('/settings/data-import/customers/1')}
				/> */}
			</div>
		);

		const topbarButtons = [];

		if (selectedItems && selectedItems.length > 0) {
			topbarButtons.push({
				type: 'danger',
				label: resources.str_clear,
				buttonIcon: 'icon-trashcan',
				action: 'delete-customers'
			});
		}
		if (canCreateCustomer) {
			topbarButtons.push({
				type: 'primary',
				label: resources.contactCreateButtonText,
				buttonIcon: 'icon-plus',
				action: 'create'
			});
		}
		// if (!isLoading && (!customers || customers.length === 0)) {
		// 	topbarButtons.push({
		// 		type: 'primary',
		// 		label: resources.customerImportButtonText,
		// 		buttonIcon: 'icon-plus',
		// 		action: 'import'
		// 	});
		// }

		const topbar = (
			<TopbarComponent
				title={resources.str_contacts}
				viewIcon={`icon-customer`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
				buttons={topbarButtons}
			/>
		);

		return (
			<div className="customer-list-component-wrapper">
				{topbar}

				<div className="customer-list-head">
					<div className="customer-list-head-content">
						<ListSearchComponent
							value={searchText}
							placeholder={resources.contactSearchPlaceholderText}
							onChange={val => this.onSearch(val)}
						/>
					</div>
				</div>

				<div className="box customer-list-wrapper">
					{isLoading ? null : customers && customers.length > 0 > 0 ? (
						listContent
					) : searchText.trim().length > 0 ? (
						<div className="empty-list-box">{resources.contactEmptyListHeadingText}</div>
					) : isLoading ? null : (
						emptyListContent
					)}
				</div>
			</div>
		);
	}

	onTopbarButtonClick(action) {
		const { resources } = this.props;
		switch (action) {
			case 'create':
				this.createCustomer();
				break;
			case 'import':
				invoiz.router.navigate('/settings/data-import/customers/1');
				break;
			case 'delete-customers':
				ModalService.open(
					<Provider store={store}>
						<CustomerDeleteModal onConfirm={() => this.onDeleteConfirmSelected()} resources={resources} />
					</Provider>,
					{
						width: 500,
						headline: resources.contactDeletePopupHeading
					}
				);
				break;
		}
	}

	onSelected(id, checked) {
		this.props.selectCustomer(id, checked);
	}

	onAllSelected(checked) {
		this.props.selectAllCustomers(checked);
	}

	onDeleteConfirmSelected() {
		ModalService.close();
		this.props.fetchCustomerList(true);
	}

	onRowClick(customerId) {
		invoiz.router.navigate(`/customer/${customerId}`);
	}

	onDropdownEntryClick(customer, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case 'edit':
				setTimeout(() => {
					invoiz.router.navigate(`/customer/edit/${customer.id}`);
				});
				break;

			case 'delete':
				ModalService.open(`${resources.contactDeleteConfirmText} ${resources.str_undoneMessage}`, {
					width: 500,
					headline: resources.contactDeletePopupHeading,
					cancelLabel: resources.str_abortStop,
					confirmIcon: 'icon-trashcan',
					confirmLabel: resources.str_clear,
					confirmButtonType: 'secondary',
					onConfirm: () => {
						ModalService.close();
						this.props.deleteCustomer(customer.id);
					}
				});
				break;
		}
	}

	onPaginate(page) {
		this.props.paginateCustomerList(page);
		window.scrollTo(0, 0);
	}

	onSort(column) {
		this.props.sortCustomerList(column);
	}

	onSearch(searchText) {
		this.props.searchCustomerList(searchText);
	}

	createCustomer() {
		invoiz.router.navigate('/customer/new');
	}

	createTableRows(customers) {
		const { resources } = this.props;
		const { canUpdateCustomer, canDeleteCustomer } = this.state;
		const rows = [];

		const dropdownEntries = [
			{
				dataQsId: `customer-list-item-dropdown-entry-edit`,
				label: resources.str_toEdit,
				action: 'edit'
			},
			{
				dataQsId: `customer-list-item-dropdown-entry-delete`,
				label: resources.str_clear,
				action: 'delete'
			}
		];

		let dropdown;

		if (customers) {
			customers.forEach((customer, index) => {
				if (canUpdateCustomer && canDeleteCustomer) {
					dropdown = (
						<div
							className="customer-list-cell-dropdown icon icon-arr_down"
							id={`customer-list-dropdown-anchor-${index}`}
						>
							<PopoverComponent
								showOnClick={true}
								contentClass={`customer-list-cell-dropdown-content`}
								entries={[dropdownEntries]}
								onClick={entry => this.onDropdownEntryClick(customer, entry)}
								elementId={`customer-list-dropdown-anchor-${index}`}
								offsetLeft={-3}
								offsetTop={10}
							/>
						</div>
					);
				}				
				const type = (<span className="capitalize">{customer.type}</span>)
				let tell = '';
				if (customer.phone1) {
					tell = customer.phone1.trim() !== '' ? `${customer.phone1}` : ''
				}
				if (customer.phone2) {
					tell += customer.phone2.trim() !== '' ? tell !== '' ? ` / ${customer.phone2}` : `${customer.phone2}` : ''
				}
				if (customer.mobile) {
					tell += customer.mobile.trim() !== '' ? tell !== '' ? ` / ${customer.mobile}` : `${customer.mobile}` : ''
				}

				rows.push({
					id: customer.id,
					customer,
					selected: customer.selected,
					cells: [
						{ value: customer.number },
						{ value: customer.displayName },
						{ value: customer.address.street },
						{ value: type },
						{ value: tell },
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
		allSelected,
		selectedItems,
		customerListData,
		searchText
	} = state.customer.customerList;

	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		allSelected,
		selectedItems,
		customerListData,
		searchText,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchCustomerList: reset => {
			dispatch(fetchCustomerList(reset));
		},
		paginateCustomerList: page => {
			dispatch(paginateCustomerList(page));
		},
		sortCustomerList: column => {
			dispatch(sortCustomerList(column));
		},
		searchCustomerList: searchText => {
			dispatch(searchCustomerList(searchText));
		},
		deleteCustomer: id => {
			dispatch(deleteCustomer(id));
		},
		selectCustomer: (id, checked) => {
			dispatch(selectCustomer(id, checked));
		},
		selectAllCustomers: selected => {
			dispatch(selectAllCustomers(selected));
		},
		deleteSelectedCustomers: () => {
			dispatch(deleteSelectedCustomers());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(ChartofaccountListComponent);
