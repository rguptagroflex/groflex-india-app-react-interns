import invoiz from 'services/invoiz.service';
import React from 'react';
import _ from 'lodash';
import TopbarComponent from 'shared/topbar/topbar.component';
import BarChartMonthsComponent from 'shared/charts/bar-chart-months.component';
import config from 'config';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatMoneyCode } from "helpers/formatMoney";
import LoaderComponent from 'shared/loader/loader.component';
import NotesComponent from 'shared/notes/notes.component';
import Customer from 'models/customer.model';
import ButtonComponent from 'shared/button/button.component';
import ListComponent from 'shared/list/list.component';
import PaginationComponent from 'shared/pagination/pagination.component';
import FilterComponent from 'shared/filter/filter.component';
import {
	fetchCustomerHistoryList,
//	sortCustomerHistoryList,
	paginateCustomerHistoryList,
	filterCustomerHistoryList
} from 'redux/ducks/customer/customerHistoryList';
import { connect } from 'react-redux';
import { contactTypes } from 'helpers/constants';
import userPermissions from 'enums/user-permissions.enum';

const TopbarActions = {
	EDIT: 1
};

class CustomerDetailComponent extends React.Component {
	constructor(props) {
		super(props);

		const customer = this.props.customer || {};
		const payCondition = this.props.payCondition || {};

		this.carousel = null;

		this.state = {
			customer,
			payCondition,
			canCreateInvoice: null,
			canCreateOffer: null,
			canUpdateCustomer: null,
			canCreateExpense: null,
			canCreatePurchaseOrder: null,
			canViewOffer: null
		};
	}

	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_CUSTOMER)) {
			invoiz.user.logout(true);
		}
		this.initCarousel();
		this.props.fetchCustomerHistoryList(this.state.customer.id, true);
		this.setState({
			canCreateInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_INVOICE),
			canCreateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_OFFER),
			canUpdateCustomer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_CUSTOMER),
			canCreateExpense: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_EXPENSE),
			canCreatePurchaseOrder: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_PURCHASE_ORDER),
			canViewOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_OFFER)
		});
	}

	createCustomerHistoryTableRows(customerHistoryItems) {
		const rows = [];

		if (customerHistoryItems) {
			customerHistoryItems.forEach((customerHistoryItem, index) => {
				rows.push({
					id: customerHistoryItem.id,
					customerHistoryItem,
					cells: [
						{ value: customerHistoryItem.displayDate },
						{ value: customerHistoryItem.displayType },
						{ value: customerHistoryItem.displayNumber },
						{ value: customerHistoryItem.displayTotalGross }
					]
				});
			});
		}

		return rows;
	}

	getBlock1Content() {
		const { customer, canCreateInvoice, canCreateOffer, canCreateExpense, canCreatePurchaseOrder } = this.state;
		const { resources } = this.props;
		return (
			<div className="box wrapper-has-topbar-with-margin">
				<div className="pagebox_heading text-h1">{customer.name}</div>
				<div className="pagebox_content-divided row">
					<div className="col-xs-7">
						<div className="pagebox_subheading text-muted">{customer.custNoString}</div>
						{
							customer.address.countryIso !== "IN" ? (
								<div className="pagebox_subheading text-muted">{`Currency: ${customer.baseCurrency} - ${formatMoneyCode(customer.exchangeRate)}`}</div>
							) : null
						}
						{customer.type == contactTypes.CUSTOMER ? (<div className="buttons">
							<ButtonComponent
								callback={() => this.onCreateOfferClick()}
								label={resources.str_offerUpperCase}
								buttonIcon={'icon-plus'}
								dataQsId="customerDetail-btn-createOffer"
								disabled={!canCreateOffer}
							/>
							<ButtonComponent
								callback={() => this.onCreateInvoiceClick()}
								label={resources.str_invoice}
								buttonIcon={'icon-plus'}
								dataQsId="customerDetail-btn-createInvoice"
								disabled={!canCreateInvoice}
							/>
						</div>) : (<div className="buttons">
							<ButtonComponent
								callback={() => this.onCreatePurchaseOrderClick()}
								label={resources.str_purchaseOrder}
								buttonIcon={'icon-plus'}
								dataQsId="ourchaseOrderDetail-btn-createExpense"
								disabled={!canCreatePurchaseOrder}
							/>
							<ButtonComponent
								callback={() => this.onCreateExpenseClick()}
								label={resources.str_expenses}
								buttonIcon={'icon-plus'}
								dataQsId="customerDetail-btn-createExpense"
								disabled={!canCreateExpense}
							/>
						</div>)}
					</div>

					<div className="col-xs-5">
						{customer.phone1 || customer.phone2 || customer.mobile || customer.fax ? (
							<div className="itemGroup">
								{customer.phone1 ? (
									<div className="item">
										<div className="item_label">{resources.str_tel} 1</div>
										<div className="item_text">{customer.phone1}</div>
									</div>
								) : null}
								{customer.phone2 ? (
									<div className="item">
										<div className="item_label">{resources.str_tel} 2</div>
										<div className="item_text">{customer.phone2}</div>
									</div>
								) : null}
								{customer.mobile ? (
									<div className="item">
										<div className="item_label">{resources.str_mobile}</div>
										<div className="item_text">{customer.mobile}</div>
									</div>
								) : null}
								{customer.fax ? (
									<div className="item">
										<div className="item_label">{resources.str_fax}</div>
										<div className="item_text">{customer.fax}</div>
									</div>
								) : null}
							</div>
						) : null}

						{customer.email || customer.website ? (
							<div className="itemGroup">
								{customer.website ? (
									<div className="item">
										<div className="item_label">{resources.str_web}</div>
										<div className="item_text">
											<a href={`http://${customer.website}`}>{customer.website}</a>
										</div>
									</div>
								) : null}
								{customer.email ? (
									<div className="item">
										<div className="item_label">{resources.str_mail}</div>
										<div className="item_text">
											<a href={`mailto:${customer.email}`} target="_self">
												{customer.email}
											</a>
										</div>
									</div>
								) : null}
							</div>
						) : null}

						{customer.vatId ? (
							<div className="itemGroup">
								<div className="item">
									<div className="item_label">{resources.str_vatId}</div>
									<div className="item_text">{customer.vatId}</div>
								</div>
							</div>
						) : null}

						{customer.address.city ||
						customer.country ||
						customer.indiaState ||
						customer.address.street ||
						customer.address.zipCode ? (
								<div className="itemGroup">
									<div className="item">
										<div className="item_label">{resources.str_address}</div>
										<div className="item_text">
											<div className="street-div">{customer.address.street}</div>
											<div>
												{customer.address.zipCode} {customer.address.city}
											</div>
											<div>
												{customer.indiaState && customer.indiaState.stateName
													? <span> {customer.indiaState.stateName}, </span> : null}<span>{customer.country}</span>
											</div>
										</div>
									</div>
								</div>
							) : null}

						{customer.kind === 'company' && customer.address.gstNumber ? (
							<div className="itemGroup">
								<div className="item">
									<div className="item_label">{resources.str_gstNumber}</div>
									<div className="item_text">{customer.address.gstNumber}</div>
								</div>
							</div>
						) : null}

						{customer.kind === 'company' && customer.address.cinNumber ? (
							<div className="itemGroup">
								<div className="item">
									<div className="item_label">{resources.str_cinNumber}</div>
									<div className="item_text">{customer.address.cinNumber}</div>
								</div>
							</div>
						) : null}
					</div>
				</div>
			</div>
		);
	}

	getBlock2Content() {
		const { customer } = this.state;
		const { resources } = this.props;

		return customer.contactPersons && customer.contactPersons.length > 0 ? (
			<div className="box contactPersonsCarousels">
				<div className="pagebox_content-divided row">
					<div className="col-xs-4 u_vc">
						<div className="cp_sbox">
							<div className="cp_scircle">
								<div className="pagebox_heading text-h4">{resources.str_contactPerson}</div>
								<div className="mlt-cont" ref="nameInitialsLeft">
									<ul className="uppercase">
										{customer.contactPersons.map((contactPerson, index) => {
											return (
												<li
													key={index}
													className={`${index === 0 ? 'active' : ''}`}
													onClick={evt => this.onNameInitialCircleClick(evt.nativeEvent)}
												>
													{contactPerson.initials}
												</li>
											);
										})}
									</ul>
								</div>
							</div>
						</div>
					</div>

					<div className="col-xs-8">
						<div className="carousel" ref="carousel">
							{customer.contactPersons.map((contactPerson, index) => {
								return (
									<div key={index} className="row u_vc">
										<div className="col-xs-3 col-xs-offset-1 cp_box">
											<div className="item cp_circle uppercase">{contactPerson.initials}</div>
										</div>

										<div className="col-xs-7 col-xs-offset-1 cp_text_box">
											<div className="cp_text-heading">
												<div>{contactPerson.salutationAndTitle}</div>
												<span className="text-h3 capitalize">{contactPerson.name}</span>
												<div className="text-muted">
													{contactPerson.job}
													{contactPerson.birthday && contactPerson.job ? ', ' : ''}
													{contactPerson.birthday ? `${resources.str_dob} ${contactPerson.displayDate}` : ''}
												</div>
											</div>

											{contactPerson.phone1 ||
											contactPerson.phone2 ||
											contactPerson.mobile ||
											contactPerson.fax ||
											contactPerson.email ? (
													<div className="itemGroup">
														{contactPerson.phone1 ? (
															<div className="item">
																<div className="item_label">{resources.str_tel} 1</div>
																<div className="item_text">{contactPerson.phone1}</div>
															</div>
														) : null}

														{contactPerson.phone2 ? (
															<div className="item">
																<div className="item_label">{resources.str_tel} 2</div>
																<div className="item_text">{contactPerson.phone2}</div>
															</div>
														) : null}

														{contactPerson.mobile ? (
															<div className="item">
																<div className="item_label">{resources.str_mobile}</div>
																<div className="item_text">{contactPerson.mobile}</div>
															</div>
														) : null}

														{contactPerson.fax ? (
															<div className="item">
																<div className="item_label">{resources.str_fax}</div>
																<div className="item_text">{contactPerson.fax}</div>
															</div>
														) : null}

														{contactPerson.email ? (
															<div className="item">
																<div className="item_label">{resources.str_mail}</div>
																<div className="item_text custom-text-ellipsis">
																	<a
																		href={`mailto:${contactPerson.email}`}
																		target="_self"
																	>
																		{contactPerson.email}
																	</a>
																</div>
															</div>
														) : null}
													</div>
												) : null}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		) : null;
	}

	getBlock3Content() {
		const { customer, payCondition } = this.state;
		const { resources } = this.props;

		return (
			<div className="box">
				<div className="pagebox_heading text-h4">{resources.str_salesOverview}</div>
				<div className="text-muted">{resources.str_salesLastTwelveMonth}</div>

				<div className="graph-cont row">
					<div className="col-xs-3">
						<div className="item item-vertical ">
							<div className="item_label">{resources.str_totalRevenue}</div>
							<div className="item_text">{formatCurrency(customer.salesVolumeData.turnoverTotal)}</div>
						</div>
						<div className="item item-vertical ">
							<div className="item_label">{resources.customerDetailNumberOfOrderText}</div>
							<div className="item_text">{customer.salesVolumeData.invoiceCount}</div>
						</div>
						<div className="item item-vertical ">
							<div className="item_label">{resources.customerDetailOutstandingPaymentsText}</div>
							<div className="item_text">{formatCurrency(customer.salesVolumeData.balance)}</div>
						</div>
						<div className="item item-vertical ">
							<div className="item_label">{resources.customerDetailPaymentInText}</div>
							<div className="item_text">
								<div className="text-muted">
									{customer.salesVolumeData.averagePaymentReceived}{' '}
									{customer.salesVolumeData.averagePaymentReceived === 1 ? resources.str_day : resources.str_days}
								</div>
							</div>
						</div>
					</div>

					<div className="col-xs-9">
						<BarChartMonthsComponent
							target="customerSalesVolumeStats"
							data={customer.salesVolumeData.chartData}
						/>
					</div>
				</div>

				<div className="pagebox_footer row">
					<div className="col-xs-4">
						<div className="item item-vertical item-description">
							<div className="item_label">{resources.str_conditions}</div>
							<div className="item_text">{resources.customerDetailCurrentCustomerConditions}</div>
						</div>
					</div>

					<div className="col-xs-8">
						<div className="row">
							<div className="col-xs-4">
								<div className="item item-vertical ">
									<div className="item_label">{resources.str_termsOfPayment}</div>
									<div className="item_text">{payCondition.name}</div>
								</div>
							</div>

							<div className="col-xs-4">
								<div className="item item-vertical ">
									<div className="item_label">{resources.str_discount}</div>
									<div className="item_text">{customer.discount}%</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	getBlock4Content() {
		const { customer } = this.state;
		const { resources } = this.props;

		return (
			<div className="box">
				<div className="row">
					<div className="address-map">
						<div className="mapInfo">
							<div className="mapInfo_heading text-h4">{customer.mapData.heading}</div>
							<div className="mapInfo_subheading">{customer.mapData.subHeading}</div>
							<div className="mapInfo_buttons">
								<ButtonComponent
									callback={() => this.onShowExternalMapsClick()}
									label={resources.customerDetailShowOnMaps}
									buttonIcon={'icon-pin'}
									dataQsId="customerDetail-btn-showMaps"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	handleCarouselSlideChange(event) {
		if (_.isNumber(event.item.index)) {
			const lis = $('li', $(this.refs.nameInitialsLeft));
			lis.removeClass('active');
			lis.eq(event.item.index).addClass('active');
		}
	}

	initCarousel() {
		const options = _.assign({}, config.owlCarousel, {
			items: 1,
			nav: true,
			dots: false,
			center: true,
			slideBy: 'page',
			onChanged: this.handleCarouselSlideChange.bind(this)
		});

		this.carousel = $(this.refs.carousel)
			.owlCarousel(options)
			.data('owl.carousel');
	}

	onCreateInvoiceClick() {
		const { customer } = this.state;
		invoiz.router.navigate(`invoice/new/customer/${customer.id}`);
	}

	onCreateOfferClick() {
		const { customer } = this.state;

		if (customer.id) {
			return invoiz.router.navigate(`offer/new/customer/${customer.id}`);
		} else {
			invoiz.router.navigate('offer/new');
		}
	}

	onCreateExpenseClick() {
		const { customer } = this.state;

		if (customer.id) {
			return invoiz.router.navigate(`expense/new/customer/${customer.id}`);
		} else {
			invoiz.router.navigate('expense/new');
		}
	}
	onCreatePurchaseOrderClick() {
		const { customer } = this.state;

		if (customer.id) {
			return invoiz.router.navigate(`purchase-order/new/customer/${customer.id}`);
		} else {
			invoiz.router.navigate('purchase-order/new');
		}
	}
	onNameInitialCircleClick(event) {
		if (!$(event.target).hasClass('active')) {
			this.carousel && this.carousel.to($(event.target).index());
		}
	}

	onFilterList(filter) {
		this.props.filterCustomerHistoryList(this.state.customer.id, filter);
	}

	onPaginate(page) {
		this.props.paginateCustomerHistoryList(this.state.customer.id, page);
	}

	onRowClick(row) {
		invoiz.router.navigate(row.customerHistoryItem.itemUrl);
	}

	onSort(column) {
		this.props.sortCustomerHistoryList(this.state.customer.id, column);
	}

	onSaveNotesClick({ notes, notesAlert }) {
		const { resources } = this.props;
		const customer = JSON.parse(JSON.stringify(this.state.customer));

		customer.notes = notes;
		customer.notesAlert = notesAlert;

		invoiz
			.request(`${config.resourceHost}customer/${customer.id}`, {
				auth: true,
				method: 'PUT',
				data: customer
			})
			.then(response => {
				invoiz.page.showToast({ message: resources.customerDetailProfileUpdateSuccessMessage });
				const customerUpdated = new Customer(customer);
				this.setState({ customer: customerUpdated });
			})
			.catch(() => {
				invoiz.page.showToast({ message: resources.defaultErrorMessage });
			});
	}

	onShowExternalMapsClick() {
		const { customer } = this.state;
		window.open(`http://www.google.com/maps/search/${customer.mapData.mapAddress}`, '_blank');
	}

	onTopbarButtonClick(action) {
		const { customer } = this.state;

		if (action === TopbarActions.EDIT) {
			invoiz.router.navigate(`/${config.customer.clientUrl.single}/edit/${customer.id}`);
		}
	}

	render() {
		const { customer, canUpdateCustomer, canViewOffer } = this.state;
		const {
			isLoading,
			errorOccurred,
			columns,
			currentPage,
			totalPages,
			filterItems,
			customerHistoryListData: { customerHistoryItems },
			resources
		} = this.props;
		let permittedfilterItems;
		if (!canViewOffer) {
			permittedfilterItems = filterItems.filter(item => item.key !== 'offer');
		} else {
			permittedfilterItems = filterItems;
		}
		return (
			<div className="customer-detail-wrapper wrapper-has-topbar">
				{ canUpdateCustomer ? <TopbarComponent
					title={customer.name}
					backButtonRoute={`/customers`}
					buttonCallback={(e, button) => this.onTopbarButtonClick(button.action)}
					buttons={[
						{ type: 'primary', label: resources.str_toEdit, buttonIcon: 'icon-edit2', action: TopbarActions.EDIT }
					]}
				/> : <TopbarComponent
					title={customer.name}
					backButtonRoute={`/customers`}
					buttonCallback={(e, button) => this.onTopbarButtonClick(button.action)}
				/> }

				{this.getBlock1Content()}

				{this.getBlock2Content()}

				{this.getBlock3Content()}

				{this.getBlock4Content()}

				<div className="notes box">
					<NotesComponent
						data={customer}
						heading={resources.str_remarks}
						placeholder={resources.customerDetailCommentsAboutCustomer}
						notesAlertLabel={resources.str_seeNoteConfirmationMessage}
						showToggleInput={true}
						onSave={({ notes, notesAlert }) => this.onSaveNotesClick({ notes, notesAlert })}
						resources={resources}
						defaultFocus={true}
					/>
				</div>

				<div className="box">
					<div className="pagebox_heading text-h4">{resources.str_history}</div>
					<div className="pagebox_content customerHistory_container">
						{errorOccurred ? (
							<div className="customer-history-error">
								<div className="error-headline">
									<h1>{resources.errorOccuredMessage}</h1>
								</div>
								<div>
									<ButtonComponent callback={() => invoiz.router.reload()} label={resources.str_reload} />
								</div>
							</div>
						) : (
							<div>
								<div className="customer-history-list-head-content">
									{isLoading ? null : (
										<FilterComponent
											items={permittedfilterItems}
											onChange={filter => this.onFilterList(filter)}
											resources={resources}
										/>
									)}
								</div>

								<div className="customerHistory_list">
									{isLoading ? (
										<LoaderComponent visible={true} />
									) : (
										<div>
											<ListComponent
												clickable={true}
												rowCallback={(id, row) => this.onRowClick(row)}
												sortable={true}
												columns={columns}
												rows={this.createCustomerHistoryTableRows(customerHistoryItems)}
												columnCallback={column => this.onSort(column)}
												emptyFallbackElement={resources.str_noDocumentAvailable}
												resources={resources}
											/>

											{totalPages > 1 ? (
												<div className="customer-history-list-pagination">
													<PaginationComponent
														currentPage={currentPage}
														totalPages={totalPages}
														onPaginate={page => this.onPaginate(page)}
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
			</div>
		);
	}
}

const mapStateToProps = state => {
	const {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		customerHistoryListData,
		filterItems
	} = state.customer.customerHistoryList;

	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		customerHistoryListData,
		filterItems,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchCustomerHistoryList: (customerId, reset) => {
			dispatch(fetchCustomerHistoryList(customerId, reset));
		},
		paginateCustomerHistoryList: (customerId, page) => {
			dispatch(paginateCustomerHistoryList(customerId, page));
		},
		sortCustomerHistoryList: (customerId, column) => {
			dispatch(sortCustomerHistoryList(customerId, column));
		},
		filterCustomerHistoryList: (customerId, filter) => {
			dispatch(filterCustomerHistoryList(customerId, filter));
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(CustomerDetailComponent);
