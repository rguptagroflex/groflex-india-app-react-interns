import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import TextInputComponent from 'shared/inputs/text-input/text-input.component';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatClientDate } from 'helpers/formatDate';
import Customer from 'models/customer.model';
import ContactPerson from 'models/contact-person.model';

const RESULT_TYPE = Object.freeze({
	ARTICLE: 'article',
	CUSTOMER: 'customer',
	INVOICE: 'invoice',
	OFFER: 'offer',
	PURCHASE_ORDER: 'purchaseOrder',
	EXPENSE: 'expense'
});

class GlobalSearchModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			hasResults: false,
			hasSearched: false,
			isSearching: false,
			results: {},
			searchText: '',
			selectedResult: null,
			selectedResultId: null,
			selectedResultType: null
		};

		this.searchTimeout = null;
	}

	render() {
		const { resources } = this.props;
		const { searchText, hasSearched, isSearching, hasResults } = this.state;

		const resultList = this.createResultList();
		const resultDetail = this.createResultDetail();
		const noResultsView = this.createNoResultsView();
		const redirectButton = this.createRedirectButton();

		return (
			<div>
				<div className="modal-base-close" onClick={() => ModalService.close()} />

				<div className="global-search-input">
					<div className={`icon icon-search ${isSearching || hasResults ? 'active' : ''}`} />
					<TextInputComponent
						value={searchText}
						id={'global-search-input'}
						autoComplete={'off'}
						placeholder={resources.globalSearchPlaceholder}
						noInputBar={true}
						onChange={ev => this.onSearchInput(ev.target.value)}
					/>
				</div>

				{!hasResults && hasSearched && noResultsView}

				{hasResults ? (
					<div className="global-search-results">
						{resultList}
						{resultDetail}
					</div>
				) : null}

				{hasResults ? (
					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							<ButtonComponent
								dataQsId="globalSearch-btn-cancel"
								callback={() => ModalService.close()}
								type="cancel"
								label={resources.str_abortStop}
							/>
						</div>

						<div className="modal-base-confirm">{redirectButton}</div>
					</div>
				) : null}
			</div>
		);
	}

	onSearchInput(searchText) {
		searchText = (searchText && searchText.trim()) || '';
		const validSearch = searchText.length >= 1;
		this.setState({ searchText, isSearching: validSearch }, () => {
			if (validSearch) {
				clearTimeout(this.searchTimeout);
				this.searchTimeout = setTimeout(() => {
					invoiz
						.request(`${config.resourceHost}search/${searchText}`, {
							auth: true,
							isConcurrent: true
						})
						.then(res => {
							const {
								body: { data: results }
							} = res;

							this.processResults(results);
						});
				}, 500);
			} else {
				clearTimeout(this.searchTimeout);
				this.setState({ results: {}, hasSearched: false, isSearching: false, hasResults: false });
			}
		});
	}

	processResults(results) {
		let hasResults = false;
		let selectedResult = null;
		let selectedResultId = null;
		let selectedResultType = null;

		const { articles, customers, invoices, offers, expenses, purchaseOrders } = results;

		if (articles && articles.length > 0) {
			selectedResultId = articles[0].id;
			selectedResult = articles[0];
			selectedResultType = RESULT_TYPE.ARTICLE;
			hasResults = true;
		} else if (customers && customers.length > 0) {
			selectedResultId = customers[0].id;
			selectedResult = customers[0];
			selectedResultType = RESULT_TYPE.CUSTOMER;
			hasResults = true;
		} else if (invoices && invoices.length > 0) {
			selectedResultId = invoices[0].id;
			selectedResult = invoices[0];
			selectedResultType = RESULT_TYPE.INVOICE;
			hasResults = true;
		} else if (offers && offers.length > 0) {
			selectedResultId = offers[0].id;
			selectedResult = offers[0];
			selectedResultType = RESULT_TYPE.OFFER;
			hasResults = true;
		} else if (purchaseOrders && purchaseOrders.length > 0) {
			selectedResultId = purchaseOrders[0].id;
			selectedResult = purchaseOrders[0];
			selectedResultType = RESULT_TYPE.PURCHASE_ORDER;
			hasResults = true;
		} else if (expenses && expenses.length > 0) {
			selectedResultId = expenses[0].id;
			selectedResult = expenses[0];
			selectedResultType = RESULT_TYPE.EXPENSE;
			hasResults = true;
		}

		this.setState({ hasResults, hasSearched: true, results, selectedResult, selectedResultId, selectedResultType });
	}

	createNoResultsView() {
		const { hasResults } = this.state;
		const { resources } = this.props;
		if (hasResults) {
			return null;
		}

		return (
			<div className="global-search-no-results">
				<div className="icon icon-no_results" />
				<div className="global-search-no-results-text">{resources.searchNoFoundMessage}</div>
			</div>
		);
	}

	createResultList() {
		const { hasResults, results, selectedResultId, selectedResultType } = this.state;
		const { resources } = this.props;
		if (!hasResults) {
			return null;
		}

		const { articles, customers, invoices, offers, expenses, purchaseOrders } = results;
		const elements = [];

		if (articles.length > 0) {
			const items = articles.map((article, index) => {
				const className = `global-search-list-item ${
					selectedResultType === RESULT_TYPE.ARTICLE && selectedResultId === article.id ? 'active' : ''
				}`;
				return (
					<div
						onClick={() =>
							this.setState({
								selectedResult: article,
								selectedResultId: article.id,
								selectedResultType: RESULT_TYPE.ARTICLE
							})
						}
						key={`global-search-list-item-article-${index}`}
						className={className}
					>
						<div className="global-search-list-item-title">{article.title}</div>
						<div className="global-search-list-item-description">{resources.str_articleNumber} {article.number}</div>
					</div>
				);
			});

			elements.push(
				<div key={`global-search-list-category-article`} className="global-search-list-category">
					<div className="global-search-list-headline">
						<i className="icon icon-article" />
						<span className="global-search-list-headline-text">{resources.str_articles}</span>
					</div>
					<div className="global-search-list-items">{items}</div>
				</div>
			);
		}

		if (customers.length > 0) {
			const items = customers.map((obj, index) => {
				const customer = new Customer(obj);
				const className = `global-search-list-item ${
					selectedResultType === RESULT_TYPE.CUSTOMER && selectedResultId === customer.id ? 'active' : ''
				}`;
				return (
					<div
						onClick={() =>
							this.setState({
								selectedResult: customer,
								selectedResultId: customer.id,
								selectedResultType: RESULT_TYPE.CUSTOMER
							})
						}
						key={`global-search-list-item-customer-${index}`}
						className={className}
					>
						<div className="global-search-list-item-title">{customer.displayName}</div>
						<div className="global-search-list-item-description">{resources.str_customerNumber} {customer.number}</div>
					</div>
				);
			});

			elements.push(
				<div key={`global-search-list-category-customer`} className="global-search-list-category">
					<div className="global-search-list-headline">
						<i className="icon icon-customer" />
						<span className="global-search-list-headline-text">{resources.str_contacts}</span>
					</div>
					<div className="global-search-list-items">{items}</div>
				</div>
			);
		}

		if (invoices.length > 0) {
			const items = invoices.map((invoice, index) => {
				const className = `global-search-list-item ${
					selectedResultType === RESULT_TYPE.INVOICE && selectedResultId === invoice.id ? 'active' : ''
				}`;
				return (
					<div
						onClick={() =>
							this.setState({
								selectedResult: invoice,
								selectedResultId: invoice.id,
								selectedResultType: RESULT_TYPE.INVOICE
							})
						}
						key={`global-search-list-item-invoice-${index}`}
						className={className}
					>
						<div className="global-search-list-item-title" />
						<div className="global-search-list-item-description">{resources.str_invoiceNumber} {invoice.number}</div>
					</div>
				);
			});

			elements.push(
				<div key={`global-search-list-category-invoice`} className="global-search-list-category">
					<div className="global-search-list-headline">
						<i className="icon icon-rechnung" />
						<span className="global-search-list-headline-text">{resources.str_bills}</span>
					</div>
					<div className="global-search-list-items">{items}</div>
				</div>
			);
		}

		if (offers.length > 0) {
			const items = offers.map((offer, index) => {
				const className = `global-search-list-item ${
					selectedResultType === RESULT_TYPE.OFFER && selectedResultId === offer.id ? 'active' : ''
				}`;
				return (
					<div
						onClick={() =>
							this.setState({
								selectedResult: offer,
								selectedResultId: offer.id,
								selectedResultType: RESULT_TYPE.OFFER
							})
						}
						key={`global-search-list-item-offer-${index}`}
						className={className}
					>
						<div className="global-search-list-item-title" />
						<div className="global-search-list-item-description">{resources.str_offerNumber} {offer.number}</div>
					</div>
				);
			});

			elements.push(
				<div key={`global-search-list-category-offer`} className="global-search-list-category">
					<div className="global-search-list-headline">
						<i className="icon icon-offer" />
						<span className="global-search-list-headline-text">{resources.str_deals}</span>
					</div>
					<div className="global-search-list-items">{items}</div>
				</div>
			);
		}

		if (purchaseOrders.length > 0) {
			const items = purchaseOrders.map((purchaseOrder, index) => {
				const className = `global-search-list-item ${
					selectedResultType === RESULT_TYPE.OFFER && selectedResultId === purchaseOrder.id ? 'active' : ''
				}`;
				return (
					<div
						onClick={() =>
							this.setState({
								selectedResult: purchaseOrder,
								selectedResultId: purchaseOrder.id,
								selectedResultType: RESULT_TYPE.PURCHASE_ORDER
							})
						}
						key={`global-search-list-item-purchaseOrder-${index}`}
						className={className}
					>
						<div className="global-search-list-item-title" />
						<div className="global-search-list-item-description">{resources.str_purchaseOrderNumber} {purchaseOrder.number}</div>
					</div>
				);
			});

			elements.push(
				<div key={`global-search-list-category-purchaseOrder`} className="global-search-list-category">
					<div className="global-search-list-headline">
						<i className="icon icon-order" />
						<span className="global-search-list-headline-text">{resources.str_purchaseOrders}</span>
					</div>
					<div className="global-search-list-items">{items}</div>
				</div>
			);
		}

		if (expenses.length > 0) {
			const items = expenses.map((expense, index) => {
				const className = `global-search-list-item ${
					selectedResultType === RESULT_TYPE.EXPENSE && selectedResultId === expense.id ? 'active' : ''
				}`;
				return (
					<div
						onClick={() =>
							this.setState({
								selectedResult: expense,
								selectedResultId: expense.id,
								selectedResultType: RESULT_TYPE.EXPENSE
							})
						}
						key={`global-search-list-item-expense-${index}`}
						className={className}
					>
						<div className="global-search-list-item-title" />
						<div className="global-search-list-item-description">{resources.str_expenseNumber} {expense.id}</div>
					</div>
				);
			});

			elements.push(
				<div key={`global-search-list-category-expense`} className="global-search-list-category">
					<div className="global-search-list-headline">
						<i className="icon icon-expense" />
						<span className="global-search-list-headline-text">{resources.str_expenditure}</span>
					</div>
					<div className="global-search-list-items">{items}</div>
				</div>
			);
		}

		return <div className="global-search-list">{elements}</div>;
	}

	createRedirectButton() {
		const { hasResults, selectedResult, selectedResultType } = this.state;
		const { resources } = this.props;
		if (!hasResults) {
			return null;
		}

		let redirectLabel = null;
		let redirectUrl = null;

		switch (selectedResultType) {
			case RESULT_TYPE.ARTICLE:
				redirectLabel = resources.toTheArticle;
				redirectUrl = `/article/${selectedResult.id}`;
				break;

			case RESULT_TYPE.CUSTOMER:
				redirectLabel = resources.toTheCustomer;
				redirectUrl = `/customer/${selectedResult.id}`;
				break;

			case RESULT_TYPE.INVOICE:
				redirectLabel = resources.toTheInvoice;
				redirectUrl = `/invoice/${selectedResult.id}`;
				break;

			case RESULT_TYPE.OFFER:
				redirectLabel = resources.toTheOffer;
				redirectUrl = `/offer/${selectedResult.id}`;
				break;
			case RESULT_TYPE.PURCHASE_ORDER:
				redirectLabel = resources.toThePurchaseOrder;
				redirectUrl = `/purchase-order/${selectedResult.id}`;
				break;
			case RESULT_TYPE.EXPENSE:
				redirectLabel = resources.toTheExpense;
				redirectUrl = `/expense/edit/${selectedResult.id}`;
				break;
		}

		return (
			<ButtonComponent
				buttonIcon="icon-arr_right"
				dataQsId="globalSearch-btn-redirect"
				callback={() => {
					invoiz.router.navigate(redirectUrl);
					ModalService.close();
				}}
				label={redirectLabel}
			/>
		);
	}

	createResultDetail() {
		const { resources } = this.props;
		const { hasResults, results, selectedResultType, selectedResultId } = this.state;
		const { isSmallBusiness } = invoiz.user;

		if (!hasResults) {
			return null;
		}

		let element = null;

		switch (selectedResultType) {
			case RESULT_TYPE.ARTICLE:
				const { articles } = results;
				const article = articles && articles.find(item => item.id === selectedResultId);

				element = (
					<div className="global-search-detail-content global-search-detail-article">
						<div className="global-search-detail-title">{article.title}</div>
						<div className="global-search-detail-description">{resources.str_articleNumber} {article.number}</div>
						<div className="global-search-detail-description">{article.description}</div>

						<div className="row">
							<div className="col-xs-12">
								{article.purchasePrice && (<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">
										{!isSmallBusiness ? `${resources.str_purchasePriceNet}:` : `${resources.str_purchasePrice}:`}
									</div>
									<div className="global-search-detail-item-value">
										{formatCurrency(article.purchasePrice)}
									</div>
								</div> )}
								{article.purchasePriceGross && (
									<div className="global-search-detail-item">
										<div className="global-search-detail-item-label">{resources.str_purchasePriceGross}:</div>
										<div className="global-search-detail-item-value">
											{formatCurrency(article.purchasePriceGross)}
										</div>
									</div>
								)}

								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">
										{!isSmallBusiness ? `${resources.str_salesPriceNet}:` : `${resources.str_sellingPrice}:`}
									</div>
									<div className="global-search-detail-item-value">
										{formatCurrency(article.price)}
									</div>
								</div>
								{!isSmallBusiness ? (
									<div className="global-search-detail-item">
										<div className="global-search-detail-item-label">{resources.str_salesPriceGross}:</div>
										<div className="global-search-detail-item-value">
											{formatCurrency(article.priceGross)}
										</div>
									</div>
								) : null}
								{article.notes && (
									<div className="global-search-detail-item global-search-detail-item-vertical">
										<div className="global-search-detail-item-label">{resources.str_remarks}</div>
										<div className="global-search-detail-item-value">{article.notes}</div>
									</div>
								)}
							</div>
						</div>
					</div>
				);
				break;

			case RESULT_TYPE.CUSTOMER:
				const { customers } = results;
				const customerObj = customers && customers.find(item => item.id === selectedResultId);
				const customer = new Customer(customerObj);
				const contactPerson =
					customer.contactPersons && customer.contactPersons.length > 0
						? new ContactPerson(customer.contactPersons[0])
						: null;

				element = (
					<div className="global-search-detail-content global-search-detail-customer">
						<div className="global-search-detail-title">{customer.displayName}</div>
						<div className="global-search-detail-description">{resources.str_customerNumber} {customer.number}</div>

						{customer.email && (
							<div className="global-search-detail-item">
								<div className="global-search-detail-item-label">{resources.str_email}</div>
								<div className="global-search-detail-item-value">
									<a href={`mailto:${customer.email}`} target="_self">
										{customer.email}
									</a>
								</div>
							</div>
						)}

						{customer.phone1 && (
							<div className="global-search-detail-item">
								<div className="global-search-detail-item-label">{resources.str_tel}</div>
								<div className="global-search-detail-item-value">{customer.phone1}</div>
							</div>
						)}

						{customer.phone2 && (
							<div className="global-search-detail-item">
								<div className="global-search-detail-item-label">{resources.str_tel}</div>
								<div className="global-search-detail-item-value">{customer.phone2}</div>
							</div>
						)}

						{customer.mobile && (
							<div className="global-search-detail-item">
								<div className="global-search-detail-item-label">{resources.str_mobile}</div>
								<div className="global-search-detail-item-value">{customer.mobile}</div>
							</div>
						)}

						{customer.fax && (
							<div className="global-search-detail-item">
								<div className="global-search-detail-item-label">{resources.str_fax}</div>
								<div className="global-search-detail-item-value">{customer.fax}</div>
							</div>
						)}

						{customer.address &&
							(customer.address.zipCode || customer.address.street || customer.address.city) && (
							<div className="global-search-detail-item global-search-detail-item-address">
								<div className="global-search-detail-item-label">{resources.str_address}</div>
								{customer.address.street ? (
									<div className="global-search-detail-item-value">{customer.address.street}</div>
								) : (
									<div className="global-search-detail-item-value">
										{`${customer.address.zipCode} ` || null}
										{customer.address.city || null}
									</div>
								)}
							</div>
						)}

						{customer.address &&
							(customer.address.street && (customer.address.zipCode || customer.address.city)) && (
							<div className="global-search-detail-item">
								<div className="global-search-detail-item-label" />
								<div className="global-search-detail-item-value">
									{`${customer.address.zipCode} ` || null}
									{customer.address.city || null}
								</div>
							</div>
						)}

						{contactPerson ? (
							<div className="global-search-detail-item global-search-detail-item-vertical global-search-detail-item-cp">
								<div className="global-search-detail-item-label">{resources.str_contactPerson}:</div>
								<div className="row global-search-detail-item-cp-content">
									<div className="col-xs-3">
										<div className="item cp_circle">{contactPerson.initials}</div>
									</div>

									<div className="col-xs-8 global-search-detail-item-cp-details">
										<div className="global-search-detail-title">{contactPerson.displayName}</div>
										{contactPerson.phone1 && (
											<div className="global-search-detail-item">
												<div className="global-search-detail-item-label">{resources.str_tel}</div>
												<div className="global-search-detail-item-value">
													{contactPerson.phone1}
												</div>
											</div>
										)}
										{customer.email && (
											<div className="global-search-detail-item">
												<div className="global-search-detail-item-label">{resources.str_email}</div>
												<div className="global-search-detail-item-value">
													<a href={`mailto:${contactPerson.email}`} target="_self">
														{contactPerson.email}
													</a>
												</div>
											</div>
										)}
									</div>
								</div>
							</div>
						) : null}
					</div>
				);
				break;

			case RESULT_TYPE.INVOICE:
				const { invoices } = results;
				const invoice = invoices && invoices.find(item => item.id === selectedResultId);

				element = (
					<div className="global-search-detail-content global-search-detail-invoice">
						<div className="global-search-detail-title">{resources.str_invoiceNumber} {invoice.number}</div>
						<div className="global-search-detail-description"></div>
						{/* <img className="global-search-detail-image" src="/assets/images/invoice-preview.png" /> */}
						{/* <img className="global-search-detail-image" src={config.imageResourceHost + invoice.thumb} /> */}

						<div className="row">
							<div className="col-xs-12">
								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">{resources.str_contact}</div>
									<div className="global-search-detail-item-value">{invoice.customerData.name}</div>
								</div>
								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">{resources.str_amount}</div>
									<div className="global-search-detail-item-value">{formatCurrency(invoice.totalGross)}</div>
								</div>
								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">{resources.invoiceDate}</div>
									<div className="global-search-detail-item-value">{formatClientDate(invoice.date, 'DD.MM.YYYY')}</div>
								</div>
								{invoice.notes && (
									<div className="global-search-detail-item global-search-detail-item-vertical">
										<div className="global-search-detail-item-label">{resources.str_remarks}</div>
										<div className="global-search-detail-item-value">{invoice.notes}</div>
									</div>
								)}
							</div>
						</div>

					</div>
				);
				break;

			case RESULT_TYPE.OFFER:
				const { offers } = results;
				const offer = offers && offers.find(item => item.id === selectedResultId);

				element = (
					<div className="global-search-detail-content global-search-detail-offer">
						<div className="global-search-detail-title">{resources.str_offerNumber} {offer.number}</div>
						<div className="global-search-detail-description"></div>
						{/* <img className="global-search-detail-image" src="/assets/images/invoice-preview.png" /> */}
						{/* <img className="global-search-detail-image" src={config.imageResourceHost + offer.thumb} /> */}

						<div className="row">
							<div className="col-xs-12">
								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">{resources.str_contact}</div>
									<div className="global-search-detail-item-value">{offer.customerData.name}</div>
								</div>
								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">{resources.str_amount}</div>
									<div className="global-search-detail-item-value">{formatCurrency(offer.totalGross)}</div>
								</div>
								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">{resources.str_offerDate}</div>
									<div className="global-search-detail-item-value">{formatClientDate(offer.date, 'DD.MM.YYYY')}</div>
								</div>
								{offer.notes && (
									<div className="global-search-detail-item global-search-detail-item-vertical">
										<div className="global-search-detail-item-label">{resources.str_remarks}</div>
										<div className="global-search-detail-item-value">{offer.notes}</div>
									</div>
								)}
							</div>
						</div>

					</div>
				);
				break;

			case RESULT_TYPE.PURCHASE_ORDER:
				const { purchaseOrders } = results;
				const purchaseOrder = purchaseOrders && purchaseOrders.find(item => item.id === selectedResultId);

				element = (
					<div className="global-search-detail-content global-search-detail-purchaseOrder">
						<div className="global-search-detail-title">{resources.str_purchaseOrderNumber} {purchaseOrder.number}</div>
						<div className="global-search-detail-description"></div>

						<div className="row">
							<div className="col-xs-12">
								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">{resources.str_contact}</div>
									<div className="global-search-detail-item-value">{purchaseOrder.customerData.name}</div>
								</div>
								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">{resources.str_amount}</div>
									<div className="global-search-detail-item-value">{formatCurrency(purchaseOrder.totalGross)}</div>
								</div>
								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">{resources.str_purchaseOrderDate}</div>
									<div className="global-search-detail-item-value">{formatClientDate(purchaseOrder.date, 'DD.MM.YYYY')}</div>
								</div>
								{purchaseOrder.notes && (
									<div className="global-search-detail-item global-search-detail-item-vertical">
										<div className="global-search-detail-item-label">{resources.str_remarks}</div>
										<div className="global-search-detail-item-value">{purchaseOrder.notes}</div>
									</div>
								)}
							</div>
						</div>

					</div>
				);
				break;

			case RESULT_TYPE.EXPENSE:
				const { expenses } = results;
				const expense = expenses && expenses.find(item => item.id === selectedResultId);

				element = (
					<div className="global-search-detail-content global-search-detail-expense">
						<div className="global-search-detail-title">{resources.str_expenseNumber} {expense.id}</div>
						<div className="global-search-detail-description"></div>
						{/* <img className="global-search-detail-image" src="/assets/images/invoice-preview.png" /> */}
						{/* <img className="global-search-detail-image" src={config.imageResourceHost + offer.thumb} /> */}

						<div className="row">
							<div className="col-xs-12">
								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">{resources.str_contact}</div>
									<div className="global-search-detail-item-value">{expense.customerData ? expense.customerData.name : ''}</div>
								</div>
								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">{resources.str_amount}</div>
									<div className="global-search-detail-item-value">{formatCurrency(expense.totalGross)}</div>
								</div>
								<div className="global-search-detail-item">
									<div className="global-search-detail-item-label">{resources.str_documentDate}</div>
									<div className="global-search-detail-item-value">{formatClientDate(expense.date, 'DD.MM.YYYY')}</div>
								</div>
							</div>
						</div>

					</div>
				);
				break;
		}

		return <div className="global-search-detail">{element}</div>;
	}
}

export default GlobalSearchModalComponent;
