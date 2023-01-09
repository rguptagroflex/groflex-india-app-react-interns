import invoiz from 'services/invoiz.service';
import React from 'react';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import TopbarComponent from 'shared/topbar/topbar.component';
import config from 'config';
import accounting from 'accounting';
import {
	fetchInvoiceList,
	sortInvoiceList,
	paginateInvoiceList,
	filterInvoiceList,
	searchInvoiceList,
	deleteInvoice,
	selectAllInvoices,
	selectInvoice,
	deleteSelectedInvoices
} from 'redux/ducks/invoice/invoiceList';
import { connect, Provider } from 'react-redux';
import store from 'redux/store';
import ListComponent from 'shared/list/list.component';
import PaginationComponent from 'shared/pagination/pagination.component';
import FilterComponent from 'shared/filter/filter.component';
import ListSearchComponent from 'shared/list-search/list-search.component';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatDate, formatApiDate } from 'helpers/formatDate';
import PopoverComponent from 'shared/popover/popover.component';
import ModalService from 'services/modal.service';
import { copyAndEditTransaction } from 'helpers/transaction/copyAndEditTransaction';
import InvoiceState from 'enums/invoice/invoice-state.enum';
import ButtonComponent from 'shared/button/button.component';
import InvoiceMultiActionComponent from 'shared/invoice-multi-action/invoice-multi-action.component';
import LoadingService from 'services/loading.service';
import Invoice from 'models/invoice.model';
import Payment from 'models/payment.model';
import CancelInvoiceModalComponent from 'shared/modals/cancel-invoice-modal.component';
import DeleteCancelInvoiceModalComponent from 'shared/modals/delete-cancel-invoice-modal.component';
import CreateDunningModalComponent from 'shared/modals/create-dunning-modal.component';
import PaymentCreateModalComponent from 'shared/modals/payment-create-modal.component';
import { format } from 'util';

import userPermissions from 'enums/user-permissions.enum';
import ListAdvanced from 'shared/list-advanced/list-advanced.component';

const PAYABLE_STATES = ['dunned', 'locked', 'partiallyPaid'];
const CANCEL_OR_DELETE_STATES = ['open', 'dunned', 'locked'];
const CANCEL_STATES = ['paid', 'partiallyPaid'];
const NOT_ALLOWED_TO_COPY = ['depositInvoice', 'closingInvoice'];

class InvoiceListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			canCreateInvoice: null,
			canUpdateInvoice: null,
			canDeleteInvoice: null
		};
	}
	componentDidMount() {
		this.props.fetchInvoiceList(true);
		this.setState({
			canCreateInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_INVOICE),
			canDeleteInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_INVOICE),
			canUpdateInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_INVOICE)
		});
	}

	render() {
		const {
			isLoading,
			columns,
			currentPage,
			totalPages,
			filterItems,
			invoiceListData: { invoices, meta },
			allSelected,
			selectedItems,
			searchText,
			resources
		} = this.props;

		const { canCreateInvoice, canUpdateInvoice, canDeleteInvoice } = this.state;

		const tableRows = this.createTableRows(invoices);
		const allCount = meta && meta.filter && meta.filter.all && meta.filter.all.count;

		const listContent = (
			<div>
				<ListComponent
					allSelected={allSelected}
					selectable={canDeleteInvoice}
					selectedCallback={(id, isChecked) => this.onSelected(id, isChecked)}
					selectedAllCallback={isChecked => this.onAllSelected(isChecked)}
					clickable={true}
					rowCallback={(invoiceId, row, evt) => this.onRowClick(invoiceId, evt)}
					sortable={true}
					columns={columns}
					rows={tableRows}
					columnCallback={column => this.onSort(column)}
					resources={resources}
				/>

				{totalPages > 1 ? (
					<div className="invoice-list-pagination">
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
				<div className="text-h2">{resources.invoiceEmptyListHeadingText}</div>
				<div className="">{resources.createBillText}</div>
				<ButtonComponent
					label={resources.str_hereWeGo}
					buttonIcon="icon-plus"
					dataQsId="empty-list-create-button"
					callback={() => invoiz.router.navigate('/invoice/new')}
					disabled={!canCreateInvoice}
				/>
			</div>
		);

		const topbarButtons = [];
		if (selectedItems && selectedItems.length > 0) {
			let allDeletable = true;
			selectedItems.forEach(invoice => {
				if (invoice.state !== InvoiceState.DRAFT) {
					allDeletable = false;
				}
			});

			if (allDeletable) {
				topbarButtons.push({
					type: 'danger',
					label: resources.str_clear,
					buttonIcon: 'icon-trashcan',
					action: 'delete-invoices'
				});
			}
		}
		 if (canCreateInvoice) {
			topbarButtons.push({
				type: 'primary',
				label: resources.str_makeBillText,
				buttonIcon: 'icon-plus',
				action: 'create'
			});
		 }
		 
		const topbar = (
			<TopbarComponent
				title={resources.str_bills}
				viewIcon={`icon-rechnung`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
				buttons={topbarButtons}
			/>
		);

		return (
			<div className="invoice-list-component-wrapper">
				{topbar}

				<div className="invoice-list-head">
					<div className="invoice-list-head-content">
						<ListSearchComponent
							value={searchText}
							placeholder={resources.searchBills}
							onChange={val => this.onSearch(val)}
						/>
						{isLoading ? null : allCount > 0 ? (
							<FilterComponent items={filterItems} onChange={filter => this.onFilterList(filter)} resources={resources} />
						) : null}
					</div>
				</div>

				<div className="box invoice-list-wrapper">
					{isLoading ? null : allCount > 0 ? (
						listContent
					) : searchText.trim().length > 0 ? (
						<div className="empty-list-box">{resources.invoiceEmptyListText}</div>
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
				this.createInvoice();
				break;
			case 'delete-invoices':
				ModalService.open(
					<Provider store={store}>
						<InvoiceMultiActionComponent onConfirm={() => this.onMultiActionConfirmed()} />
					</Provider>,
					{
						width: 500,
						headline: resources.str_deleteInvoices
					}
				);
				break;
		}
	}

	onSelected(id, checked) {
		this.props.selectInvoice(id, checked);
	}

	onAllSelected(checked) {
		this.props.selectAllInvoices(checked);
	}

	onMultiActionConfirmed() {
		ModalService.close();
		this.props.fetchInvoiceList(true);
	}

	onTopbarPopoverElementClick(element) {
		invoiz.router.navigate(element.url);
	}

	onRowClick(invoiceId, evt) {
		if (!(evt.target instanceof HTMLAnchorElement)) {
			invoiz.router.navigate(`/invoice/${invoiceId}`);
		}
	}

	onDropdownEntryClick(invoice, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case 'addPayment':
				this.addPayment(invoice);
				break;

			case 'dun':
				this.dun(invoice);
				break;

			case 'edit':
				setTimeout(() => {
					if (invoice.isCancelled) {
						invoiz.page.showToast({ message: resources.invoiceEditCanceledMessage, type: 'error' });
						return;
					}

					if (invoice.isLocked) {
						invoiz.page.showToast({ message: resources.invoiceEditLockedMessage, type: 'error' });
						return;
					}

					invoiz.router.navigate(`/invoice/edit/${invoice.id}`);
				});
				break;

			case 'copyAndEdit':
				LoadingService.show(resources.copyInvoice);
				copyAndEditTransaction({
					invoiceModel: {
						type: invoice.type,
						id: invoice.id
					},
					onCopySuccess: () => {
						LoadingService.hide();
					},
					onCopyError: () => {
						LoadingService.hide();
					}
				});
				break;

			case 'delete':
				invoice.hideInvoizPay = false;
				const model = new Invoice(invoice);

				if (invoice.invoiceType === 'cancellation') {
					return invoiz.page.showToast({ message: resources.cancellationDeleteErrorMessage, type: 'error' });
				} else if (!invoice.isLocked) {
					ModalService.open(resources.deleteInvoiceWarningMessage,
						{
							headline: resources.str_deleteInvoice,
							cancelLabel: resources.str_abortStop,
							confirmLabel: resources.str_clear,
							confirmIcon: 'icon-trashcan',
							confirmButtonType: 'secondary',
							onConfirm: () => {
								ModalService.close();
								this.props.deleteInvoice(model.id);
							}
						}
					);
				} else if (CANCEL_STATES.indexOf(invoice.state) > -1) {
					ModalService.open(<CancelInvoiceModalComponent invoice={invoice} resources={resources} />, {
						headline: format(resources.str_cancelInvoice, invoice.number),
						width: 800
					});
				} else {
					ModalService.open(<DeleteCancelInvoiceModalComponent invoice={invoice} isFromList={true} resources={resources} />, {
						width: 800,
						modalClass: 'delete-cancel-invoice-modal-component'
					});
				}
				break;
		}
	}

	onFilterList(filter) {
		this.props.filterInvoiceList(filter);
	}

	onPaginate(page) {
		this.props.paginateInvoiceList(page);
		window.scrollTo(0, 0);
	}

	onSort(column) {
		this.props.sortInvoiceList(column);
	}

	onSearch(searchText) {
		this.props.searchInvoiceList(searchText);
	}

	addPayment(invoice) {
		const { resources } = this.props;
		invoiz.request(`${config.resourceHost}invoice/${invoice.id}`, { auth: true }).then(response => {
			const {
				body: {
					data: { invoice: invoiceData }
				}
			} = response;
			invoice.outstandingAmount = invoiceData && invoiceData.outstandingAmount;
			const openAmount = parseFloat(accounting.toFixed(invoice.outstandingAmount, 2), 10);

			const payment = new Payment({
				customerName: invoice.displayName,
				date: formatApiDate(new Date()),
				invoiceId: invoice.id,
				invoiceNumber: invoice.number,
				invoiceType: invoice.type,
				amount: openAmount,
				custId: invoice.customerId,
				outstandingBalance: openAmount
			});

			invoiz.request(`${config.resourceHost}dunning/${invoice.id}`, { auth: true }).then(dunningListResponse => {
				const dunnings = dunningListResponse ? dunningListResponse.body.data : [];

				const dunning = dunnings.length > 0 && dunnings[0];
				if (dunning) {
					dunning.label = !_.isEmpty(invoice.metaData.currentDunning)
						? invoice.metaData.currentDunning.label
						: '';
				}
				ModalService.open(
					<PaymentCreateModalComponent
						payment={payment}
						dunning={dunning}
						onSave={() => invoiz.router.reload()}
						resources={resources}
					/>,
					{
						width: 800,
						modalClass: 'payment-create-modal-component',
						afterOpen: () => {
							setTimeout(() => {
								$('.create-payment-amount-wrapper input').focus();
							});
						}
					}
				);
			});
		});
	}

	dun(invoice) {
		const { resources } = this.props;
		if (_.isEmpty(invoice.metaData.nextDunning)) {
			invoiz.page.showToast({ type: 'error', message: resources.dunningLastActiveDunningLevelReachedMessage });
			return;
		}

		const {
			metaData: { nextDunning: nextDunningLevel }
		} = invoice;

		ModalService.open(<CreateDunningModalComponent invoice={invoice} nextDunningLevel={nextDunningLevel} resources={resources} />, {
			headline: resources.str_createPaymentReminder,
			modalClass: 'create-dunning-modal-component',
			width: 650
		});
	}

	createInvoice() {
		invoiz.router.navigate('/invoice/new');
	}

	createTableRows(invoices) {
		const rows = [];
		const { resources } = this.props;
		const { canCreateInvoice, canUpdateInvoice, canDeleteInvoice } = this.state;
		if (invoices) {
			invoices.forEach((invoice, index) => {
				const dropdownEntries = [];

				if (PAYABLE_STATES.includes(invoice.state)) {
					dropdownEntries.push({
						label: resources.str_registerPayment,
						action: 'addPayment',
						dataQsId: 'invoice-list-item-dropdown-addpayment'
					});
				}
				if (invoice.state === InvoiceState.DRAFT) {
					dropdownEntries.push({
						label: resources.str_toEdit,
						action: 'edit',
						dataQsId: 'invoice-list-item-dropdown-entry-edit'
					});
				}
				if (!NOT_ALLOWED_TO_COPY.includes(invoice.type)) {
					dropdownEntries.push({
						label: resources.str_copy_edit,
						action: 'copyAndEdit',
						dataQsId: 'invoice-list-item-dropdown-copyandedit'
					});
				}
				if (invoice.state === InvoiceState.DRAFT) {
					dropdownEntries.push({
						label: resources.str_clear,
						action: 'delete',
						dataQsId: 'invoice-list-item-dropdown-delete'
					});
				}
				if (!invoice.metaData.closingInvoiceExists) {
					if (CANCEL_OR_DELETE_STATES.includes(invoice.state)) {
						dropdownEntries.push({
							label: resources.str_cancel + '/' + resources.str_clear,
							action: 'delete',
							dataQsId: 'invoice-list-item-dropdown-delete'
						});
					} else if (CANCEL_STATES.includes(invoice.state)) {
						dropdownEntries.push({
							label: resources.str_cancel,
							action: 'delete',
							dataQsId: 'invoice-list-item-dropdown-delete'
						});
					}
				}
				if (invoice.isOverDue) {
					dropdownEntries.push({
						label: resources.createPaymentRemainderText,
						action: 'dun',
						dataQsId: 'invoice-list-item-dropdown-dun'
					});
				}

				if (dropdownEntries.length === 0) {
					dropdownEntries.push({
						label: resources.str_noActionAvailable,
						customEntryClass: 'popover-entry-disabled'
					});
				}

				let dropdown;

				if (canUpdateInvoice && canDeleteInvoice && canCreateInvoice) {
					dropdown = (<div
						className="invoice-list-cell-dropdown icon icon-arr_down"
						id={`invoice-list-dropdown-anchor-${index}`}
					>
						<PopoverComponent
							showOnClick={true}
							contentClass={`invoice-list-cell-dropdown-content`}
							entries={[dropdownEntries]}
							onClick={entry => this.onDropdownEntryClick(invoice, entry)}
							elementId={`invoice-list-dropdown-anchor-${index}`}
							offsetLeft={-3}
							offsetTop={10}
						/>
					</div>
					);
				}

				const { cancellation, currentDunning } = invoice.metaData;

				const nameSubValue =
					invoice.state === InvoiceState.CANCELLED ? (
						<div>
							{resources.str_canceledBy} <Link to={`/cancellation/${cancellation.id}`}>{cancellation.number}</Link>
						</div>
					) : invoice.state === InvoiceState.DUNNED ? (
						`${resources.str_paymentRemainder}: ${formatDate(currentDunning.date)}`
					) : null;

				const dateSubValue = invoice.state === InvoiceState.CANCELLED ? formatDate(cancellation.date) : null;
				const amountSubValue =
					invoice.state === InvoiceState.CANCELLED
						? invoiz.user.isSmallBusiness
							? formatCurrency(cancellation.totalNet)
							: formatCurrency(cancellation.totalGross)
						: null;

				rows.push({
					id: invoice.id,
					invoice,
					selected: invoice.selected,
					cells: [
						{
							value: invoice.isOverDue ? (
								<div className="list-cell-error-indicator">{invoice.displayNumber}</div>
							) : invoice.state === InvoiceState.PAID ? (
								<div className="list-cell-success-indicator">{invoice.displayNumber}</div>
							) : (
								invoice.displayNumber
							)
						},
						{
							value: invoice.displayName,
							subValue: nameSubValue
						},
						{
							value: formatDate(invoice.date),
							subValue: dateSubValue
						},
						{
							value: invoice.isOverDue ? (
								<div style={{ color: '#ee4b4c' }}>{invoice.displayDueToDate}</div>
							) : (
								invoice.displayDueToDate
							)
						},
						{
							value: invoiz.user.isSmallBusiness
								? formatCurrency(invoice.totalNet)
								: formatCurrency(invoice.totalGross),
							subValue: amountSubValue
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
		invoiceListData,
		searchText
	} = state.invoice.invoiceList;
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
		invoiceListData,
		searchText,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchInvoiceList: reset => {
			dispatch(fetchInvoiceList(reset));
		},
		paginateInvoiceList: page => {
			dispatch(paginateInvoiceList(page));
		},
		sortInvoiceList: column => {
			dispatch(sortInvoiceList(column));
		},
		filterInvoiceList: filterItem => {
			dispatch(filterInvoiceList(filterItem));
		},
		searchInvoiceList: searchText => {
			dispatch(searchInvoiceList(searchText));
		},
		deleteInvoice: id => {
			dispatch(deleteInvoice(id));
		},
		selectInvoice: (id, checked) => {
			dispatch(selectInvoice(id, checked));
		},
		selectAllInvoices: selected => {
			dispatch(selectAllInvoices(selected));
		},
		deleteSelectedInvoices: () => {
			dispatch(deleteSelectedInvoices());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(InvoiceListComponent);
