import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import { formatMoney } from 'helpers/formatMoney';
import DocumentType from 'enums/document-type.enum';
import { customerTypes } from 'helpers/constants';
import { connect } from 'react-redux';
import LoaderComponent from 'shared/loader/loader.component';
import userPermissions from 'enums/user-permissions.enum';

class LastUsedDocumentsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			lastUsedDocuments: [],
			lastUsedCustomers: [],
			isLoading: true,
			canUpdateExpense: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_EXPENSE),
			canUpdatePurchaseOrder: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_PURCHASE_ORDER),
			canUpdateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_OFFER),
			canUpdateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_IMPREZZ_OFFER),
			canViewInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_INVOICE)
		};
	}

	componentDidMount() {
		const { resources } = this.props;
		invoiz
			.request(`${config.resourceHost}dashboard/lastDocumentsAndCustomers`, {
				auth: true,
				method: 'GET'
			})
			.then(
				({
					body: {
						data: { lastUsedCustomers, lastUsedDocuments },
					},
				}) => {
					if (!this.isUnmounted) {
						this.setState({
							lastUsedCustomers,
							lastUsedDocuments,
							isLoading: false
						});
					}
				}
			).catch(error => {
				invoiz.showNotification({ type: 'error', message: resources.str_dataDefaultError });
			});
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	onCustomerClick(customerId) {
		invoiz.router.navigate(`/customer/${customerId}`, false, false, true);
	}

	getDocumentIcon(document) {
		let icon = '';

		switch (document.type) {
			case DocumentType.OFFER:
				icon = 'icon-offer';
				break;

			case DocumentType.OFFER_IMPRESS:
				icon = 'icon-paint';
				break;

			case DocumentType.INVOICE:
				icon = 'icon-rechnung';
				break;

			case DocumentType.RECCURRING_INVOICE_TEMPLATE:
				icon = 'icon-abo_rechnungen';
				break;

			case DocumentType.RECCURRING_INVOICE:
				icon = 'icon-abo_rechnungen';
				break;

			case DocumentType.PURCHASE_ORDER:
				icon = 'icon-order';
				break;

			case DocumentType.EXPENSE:
				icon = 'icon-expense';
				break;

			// case DocumentType.ARTICLE:
			// 	icon = 'icon-article';
			// 	break;
		}

		return icon;
	}

	onDocumentClick(document) {
		switch (document.type) {
			case DocumentType.OFFER:
				invoiz.router.navigate(`/offer/${document.id}`, false, false, true);
				break;

			case DocumentType.OFFER_IMPRESS:
				invoiz.router.navigate(`/offer/impress/${document.id}`, false, false, true);
				break;

			case DocumentType.INVOICE:
			case DocumentType.RECCURRING_INVOICE:
			case DocumentType.DEPOSIT_INVOICE:
			case DocumentType.CLOSING_INVOICE:
				invoiz.router.navigate(`/invoice/${document.id}`, false, false, true);
				break;

			case DocumentType.RECCURRING_INVOICE_TEMPLATE:
				invoiz.router.navigate(`/recurringinvoice/${document.id}`, false, false, true);
				break;

			case DocumentType.PURCHASE_ORDER:
				invoiz.router.navigate(`/purchase-order/${document.id}`, false, false, true);
				break;

			case DocumentType.EXPENSE:
				invoiz.router.navigate(`/expense/edit/${document.id}`, false, false, true);
				break;
		}
	}

	getPermittedDocuments() {
		const { canUpdateExpense, canUpdateImprezzOffer, canViewInvoice, canUpdatePurchaseOrder, canUpdateOffer, lastUsedDocuments } = this.state;
		let permittedDocuments = lastUsedDocuments;
		if (!canUpdateExpense) {
			permittedDocuments = permittedDocuments.filter(document => document.type !== DocumentType.EXPENSE);
		}
		if (!canUpdateImprezzOffer) {
			permittedDocuments = permittedDocuments.filter(document => document.type !== DocumentType.OFFER_IMPRESS);
		}
		if (!canViewInvoice) {
			permittedDocuments = permittedDocuments.filter(document => document.type !== DocumentType.INVOICE);
		}
		if (!canUpdateOffer) {
			permittedDocuments = permittedDocuments.filter(document => document.type !== DocumentType.OFFER);
		}
		if (!canUpdatePurchaseOrder) {
			permittedDocuments = permittedDocuments.filter(document => document.type !== DocumentType.PURCHASE_ORDER);
		}
		return permittedDocuments;
	}

	render() {
		const { lastUsedCustomers, lastUsedDocuments, isLoading } = this.state;
		const { resources } = this.props;
		const permittedDocuments = this.getPermittedDocuments();
		// if (
		// 	(!lastUsedCustomers && !lastUsedDocuments) ||
		// 	(lastUsedCustomers && !lastUsedCustomers.length && lastUsedDocuments && !lastUsedDocuments.length)
		// ) {
		// 	return null;
		// }
		setTimeout(() => {
			$('.customer-item .fullname').dotdotdot({ height: 64, truncate: 'letter' });
		}, 0);

		if (isLoading) {
			return (
				<div className="content-row">
					<LoaderComponent text={resources.str_loadingRecentlyUsed} visible={true} />
				</div>
			);
		} else {

			return (
				<div className="content-row">
					<div className="col-left">
						{permittedDocuments.length === 0 ? (
							<div className="empty-col">
								<div className="icon icon-document"></div>
								<div>No documents to view</div>
							</div>
						) : (
							permittedDocuments.map((document, index) => (
								<div
									className="document-row u_vc"
									key={index}
									onClick={() => this.onDocumentClick(document)}
								>
									<div className="col-icon">
										<div className={`icon ${this.getDocumentIcon(document)}`}></div>
									</div>
									<div>
										<div className="u_vc">
											<div className="col-title text-highlight text-light u_mb_6">
												{resources.filterHeader[document.state] || document.state}
											</div>
											<div className="col-number text-highlight text-right text-truncate u_mb_6">
												{document.state === 'draft' ? '' : document.number}
											</div>
										</div>
										<div className="u_vc">
											<div className="col-title text-truncate">{document.name}</div>
											{document.type === DocumentType.ARTICLE ? null : (
												<div className="col-number text-semibold text-right">
													{formatMoney(document.value, config.currencyFormat)}
												</div>
											)}
										</div>
									</div>
								</div>
							))
						)}
					</div>

					<div className="col-right">
						{lastUsedCustomers.length === 0 ? (
							<div className="empty-col">
								<div className="icon icon-customer"></div>
								<div>No contacts to view</div>
							</div>
						) : (
							lastUsedCustomers.map((customer, index) => (
								<div
									className={`customer-item text-break-word ${
										customer.kind === customerTypes.PERSON &&
												customer.salutation.toLowerCase() === 'Mrs'
											? 'red'
											: ''
									} ${customer.kind === customerTypes.COMPANY ? 'company' : ''}`}
									key={index}
									onClick={() => this.onCustomerClick(customer.id)}
								>
									<div className="initials">
										{customer.kind === customerTypes.PERSON ? (
											customer.initials
										) : (
											<div className="icon icon-factory"></div>
										)}
									</div>
									<div className="fullname">{customer.name}</div>
								</div>
							))
						)}
					</div>
				</div>
			);
		}
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(LastUsedDocumentsComponent);
