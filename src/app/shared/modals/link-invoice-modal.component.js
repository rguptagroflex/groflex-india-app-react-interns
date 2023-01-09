import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import { formatCurrency } from 'helpers/formatCurrency';
import Invoice from 'models/invoice.model';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import Payment from 'models/payment.model';
import PaymentCreateModalComponent from 'shared/modals/payment-create-modal.component';

class LinkInvoiceModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			invoices: [],
			onConfirm: this.props.onConfirm || null,
			selectedInvoice: null,
			selectedIndex: null,
			searchValue: '',
			transaction: this.props.transaction || null,
			hasResults: true,
			paymentCallback: this.props.paymentCallback || null
		};

		this.searchTimer = null;
	}

	componentDidMount() {
		this.updateInvoices(true);
	}

	componentWillReceiveProps(props) {
		this.setState({
			searchValue: '',
			transaction: props.transaction
		});
	}

	onSearchInput(event) {
		this.setState({ searchValue: event.target.value }, () => {
			clearTimeout(this.searchTimer);
			this.searchTimer = setTimeout(() => {
				this.updateInvoices();
			}, 1000);
		});
	}

	onSelect(invoice, index) {
		if (this.state.selectedIndex === index) {
			this.setState({ selectedInvoice: null, selectedIndex: null });
		} else {
			this.setState({ selectedInvoice: invoice, selectedIndex: index });
		}
	}

	onLinkClicked() {
		const { resources } = this.props;
		const payment = new Payment({
			customerName: this.state.selectedInvoice.displayName,
			invoiceId: this.state.selectedInvoice.id,
			invoiceNumber: this.state.selectedInvoice.number,
			invoiceType: this.state.selectedInvoice.type,
			amount: this.state.transaction.bookingAmount,
			custId: this.state.selectedInvoice.customerId,
			outstandingBalance: this.state.selectedInvoice.outstandingAmount,
			financeApiBankTransactionId: this.state.transaction.id,
			date: new Date(this.state.transaction.bookingDate)
		});

		ModalService.close();

		setTimeout(() => {
			ModalService.open(
				<PaymentCreateModalComponent
					payment={payment}
					onSave={() => {
						invoiz.router.reload();

						if (this.state.paymentCallback) {
							this.state.paymentCallback();
						}
					}}
					resources={ resources }
				/>,
				{
					width: 600,
					modalClass: 'payment-create-modal-component',
					afterOpen: () => {
						setTimeout(() => {
							$('.create-payment-amount-wrapper input').focus();
						});
					}
				}
			);
		}, 500);
	}

	updateInvoices(initial) {
		const searchTerm = initial
			? this.state.transaction.purposeDescription || this.state.transaction.bookingAmount
			: this.state.searchValue;

		if (!searchTerm) {
			this.setState({
				selectedInvoice: null,
				selectedIndex: null,
				invoices: [],
				hasResults: true
			});
		} else {
			invoiz
				.request(`${config.resourceHost}invoice/search/${searchTerm}`, {
					auth: true
				})
				.then(response => {
					const {
						data: { invoices }
					} = response.body;

					const models = invoices.map(invoice => {
						return new Invoice(invoice);
					});

					this.setState({
						selectedInvoice: null,
						selectedIndex: null,
						invoices: models,
						hasResults: initial || (models && models.length > 0)
					});
				})
				.catch(() => {
					this.setState({
						selectedInvoice: null,
						selectedIndex: null,
						invoices: []
					});
				});
		}
	}

	render() {
		const { resources } = this.props;
		const invoiceRows = [];
		this.state.invoices.forEach((invoice, index) => {
			invoiceRows.push(
				<div
					className={`link-invoice-row ${this.state.selectedIndex === index ? 'active' : ''}`}
					key={`link-invoice-row-${index}`}
					onClick={() => this.onSelect(invoice, index)}
				>
					<div className="link-invoice-name">{invoice.displayName}</div>
					<div className="link-invoice-number">
						{resources.str_invoiceNumber} {invoice.number}, {invoice.displayDueToDate}
					</div>
					<div className="link-invoice-amount">{formatCurrency(invoice.totalGross)}</div>
				</div>
			);
		});

		const content = (
			<div className="link-invoice-modal-content">
				<div className="modal-base-headline">
					{resources.str_assignInvoice}
					<div className="link-invoice-search">
						<div className="icon icon-search" />
						<input
							type="text"
							placeholder={resources.str_searchByInvoice}
							value={this.state.searchValue}
							onChange={evt => this.onSearchInput(evt)}
						/>
					</div>
				</div>

				{invoiceRows.length > 0 ? (
					<div className="link-invoice-list">{invoiceRows}</div>
				) : !this.state.hasResults ? (
					<div className="link-invoice-no-matches">
						<div className="icon icon-no_results" />
						<div className="link-invoice-no-matches-text">{resources.searchNoFoundMessage}.</div>
					</div>
				) : null}

				{invoiceRows.length > 0 ? (
					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							<ButtonComponent
								type="cancel"
								callback={() => ModalService.close(true)}
								label={resources.str_abortStop}
								dataQsId="linkInvoiceModal-btn-cancel"
							/>
						</div>
						<div className="modal-base-confirm">
							<ButtonComponent
								type="primary"
								disabled={!this.state.selectedInvoice}
								callback={() => this.onLinkClicked()}
								label={resources.str_toAssign}
								dataQsId="linkInvoiceModal-btn-assign"
							/>
						</div>
					</div>
				) : null}
			</div>
		);

		return content;
	}
}

export default LinkInvoiceModalComponent;
