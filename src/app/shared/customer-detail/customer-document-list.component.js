import invoiz from 'services/invoiz.service';
import React from 'react';

import LoaderComponent from 'shared/loader/loader.component';

import ButtonComponent from 'shared/button/button.component';
import ListComponent from 'shared/list/list.component';
import PaginationComponent from 'shared/pagination/pagination.component';
import FilterComponent from 'shared/filter/filter.component';

import {
	fetchCustomerDocumentList,
	filterCustomerDocumentList,
	sortCustomerDocumentList,
	paginateCustomerDocumentList,
	updateFilterItems
} from 'redux/ducks/customer/customerDocumentList';
import { connect } from 'react-redux';

class CustomerDocumentListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			customer: props.customer
		};
	}

	componentDidMount() {
		if (this.props && this.props.customer && this.props.customer.id) {
			this.props.fetchCustomerDocumentList(this.props.customer.id, true);
			this.props.updateFilterItems(this.props.customer.type);
		}
	}

	createCustomerDocumentTableRows(customerDocumentItems) {
		const rows = [];

		if (customerDocumentItems) {
			customerDocumentItems.forEach(customerDocumentItem => {
				rows.push({
					id: customerDocumentItem.id,
					customerDocumentItem,
					cells: [
						{ value: customerDocumentItem.displayDate },
						{ value: customerDocumentItem.displayType },
						{ value: customerDocumentItem.displayNumber },
						{ value: customerDocumentItem.displayState },
						{ value: customerDocumentItem.displayPrice },
						{
							value:
								customerDocumentItem.type === 'deliveryNote' ? (
									<span>&mdash;</span>
								) : (
									customerDocumentItem.displayTotalGross
								)
						}
					]
				});
			});
		}

		return rows;
	}

	onFilterDocumentList(filter) {
		this.props.filterCustomerDocumentList(this.state.customer.id, filter);
	}

	onRowClick(row) {
		invoiz.router.navigate(row.customerDocumentItem.itemUrl, false, false, true);
	}

	onPaginateDocument(page) {
		this.props.paginateCustomerDocumentList(this.state.customer.id, page);
	}

	onSort(column) {
		this.props.sortCustomerDocumentList(this.state.customer.id, column);
	}

	updateDocumentListFilterItems() {
		this.props.updateDocumentFilterItems();
	}

	render() {
		const {
			isLoading,
			filterItems,
			totalPages,
			currentPage,
			errorOccurred,
			columns,
			customerDocumentListData: { customerDocumentItems },
			resources
		} = this.props;
		return (
			<div className="box box-rounded customer-document-wrapper">
				<div className="pagebox_content customerDocument_container">
					{errorOccurred ? (
						<div className="customer-document-error">
							<div className="error-headline">
								<h1>An error occurred!</h1>
							</div>
							<div>
								<ButtonComponent callback={() => invoiz.router.reload()} label={'Reload'} />
							</div>
						</div>
					) : (
						<div>
							<div className="customer-document-list-head-content">
								<div className="text-h4">Documents</div>
								{isLoading ? null : (
									<FilterComponent
										items={filterItems}
										onChange={filter => this.onFilterDocumentList(filter)}
										resources={resources}
									/>
								)}
							</div>

							<div className="customerDocument_list">
								{isLoading ? (
									<LoaderComponent visible={true} />
								) : (
									<div>
										<ListComponent
											clickable={true}
											rowCallback={(id, row) => this.onRowClick(row)}
											sortable={true}
											columns={columns}
											rows={this.createCustomerDocumentTableRows(customerDocumentItems)}
											columnCallback={column => this.onSort(column)}
											emptyFallbackElement={'No documents available'}
											resources={resources}
										/>

										{totalPages > 1 ? (
											<div className="customer-document-list-pagination">
												<PaginationComponent
													currentPage={currentPage}
													totalPages={totalPages}
													onPaginate={page => this.onPaginateDocument(page)}
												/>
											</div>
										) : null}
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const {
		isLoading,
		errorOccurred,
		currentPage,
		totalPages,
		filterItems,
		customerDocumentListData,
		columns
	} = state.customer.customerDocumentList
	
	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		filterItems,
		customerDocumentListData,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchCustomerDocumentList: (customerId, reset) => {
			dispatch(fetchCustomerDocumentList(customerId, reset));
		},
		filterCustomerDocumentList: (customerId, filter) => {
			dispatch(filterCustomerDocumentList(customerId, filter));
		},
		sortCustomerDocumentList: (customerId, column) => {
			dispatch(sortCustomerDocumentList(customerId, column));
		},
		paginateCustomerDocumentList: (customerId, page) => {
			dispatch(paginateCustomerDocumentList(customerId, page));
		},
		updateFilterItems: (customerType) => {
			dispatch(updateFilterItems(customerType));
		}
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(CustomerDocumentListComponent);
