import React from "react";
import PropTypes from "prop-types";
import config from "config";
import invoiz from "services/invoiz.service";
import ModalService from "services/modal.service";
import TooltipComponent from "shared/tooltip/tooltip.component";
import EmailPreviewModalComponent from "shared/modals/email-preview-modal.component";
import ExtendedEmailModalComponent from "shared/modals/extended-email-modal-component";
import { formatMoney } from "helpers/formatMoney";
import { handleNotificationErrorMessage } from "helpers/errorMessageNotification";
import HistoryTypes from "enums/history-types.enum";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

class HistoryItemComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isOpen: false,
			showMore: false,
			actionButtons: [],
		};

		this.textRef = React.createRef();
		this.createActionButtons = this.createActionButtons.bind(this);
	}

	componentDidMount() {
		this.createActionButtons();
	}

	componentDidUpdate(prevProps) {
		if (this.props !== prevProps) {
			this.createActionButtons();
		}
	}

	createActionButtons() {
		const { item } = this.props;
		const { historyType } = this.props.item;
		const actionButtons = [];

		if (this.textRef && this.textRef.current) {
			if (this.textRef.current.getBoundingClientRect().height > 55) {
				this.setState({
					showMore: true,
				});
			}
		}

		if (historyType === HistoryTypes.EMAIL) {
			actionButtons.push({
				label: "View e-mail",
				cssClass: "text-primary",
				clickAction: () => this.showEmail(item),
			});

			if (item.metaData && item.metaData.date) {
				actionButtons.push({
					label: "Hide",
					cssClass: "secondary-action",
					clickAction: () => this.deleteEmail(item.id),
				});
			}
		} else if (historyType === HistoryTypes.ACTIVITY) {
			actionButtons.push({
				label: "Clear",
				cssClass: "secondary-action",
				clickAction: () => {
					this.deleteActivity(item.id);
				},
			});
		}
		// else if ((historyType === HistoryTypes.PAYMENT || historyType === HistoryTypes.TDS_CHARGE || historyType === HistoryTypes.DISCOUNT_CHARGE || historyType === HistoryTypes.BANK_CHARGE || historyType === HistoryTypes.MORE_SETTLE
		// 	|| historyType === HistoryTypes.MORE_SURCHARGE)
		// && !item.cancellationPaymentId && this.props.onCancelPayment) {
		// 	actionButtons.push({
		// 		label: 'Cancel payment',
		// 		cssClass: 'secondary-action',
		// 		clickAction: () => {
		// 			this.props.onCancelPayment(item.id);
		// 		},
		// 	});
		// }
		else if (historyType === HistoryTypes.DUNNING) {
			if (this.props.onShowDunning) {
				actionButtons.push({
					label: "Show",
					cssClass: "text-primary",
					clickAction: () => this.props.onShowDunning(item.id),
				});
			}
			if (this.props.onSendDunning) {
				actionButtons.push({
					label: "Send",
					cssClass: "secondary-action",
					clickAction: () => this.props.onSendDunning(item.id),
				});
			}
		}

		this.setState({ actionButtons });
	}

	formatTitle(item) {
		let oldTitle = item.formattedTitle;
		let newTitle;
		if (item && item.historyType === HistoryTypes.PAYMENT) {
			//newTitle = oldTitle.replace('Erledigt:', '<span class="text-semibold">Erledigt:</span>');
		}
		if ((item && item.historyType === HistoryTypes.EMAIL) || item.historyType === HistoryTypes.DOCUMENT) {
			const regex =
				/\{\{\s*(invoice|offer|deliveryNote|project|recurringInvoice|expense|purchaseOrder|payment|outstandingAmount|email|customer|subject|amount)\s*\}\}/g;
			oldTitle = oldTitle.replace(regex, "{{$1}}");
			newTitle = oldTitle.split(" ");
			for (let i = 0; i < newTitle.length; i++) {
				if (regex.test(newTitle[i])) {
					if (newTitle[i] === "{{email}}") {
						if (item.isOwnEmail) {
							newTitle[i] = item.metaData.to.join(", ");
						} else {
							newTitle[i] = item.metaData.email.to.join(", ");
						}
					} else if (newTitle[i] === "{{customer}}") {
						if (item.isOwnEmail && item.customerId === this.props.customer.id) {
							newTitle[i] = (
								<div className="own-email-item-address" key={`own-email-${i}`}>
									<span id={`own-email-item-${item.emailId}`}>
										{this.props.customer && this.props.customer.displayName}{" "}
									</span>
									<TooltipComponent
										key={`tooltip-${item.emailId}-${i}`}
										elementId={`own-email-item-${item.emailId}`}
										attachment="top left"
										targetAttachment="top left"
										offset={"10px 10px"}
										isTopMostZindex={true}
									>
										{this.props.customer && this.props.customer.email}
									</TooltipComponent>
								</div>
							);
						} else {
							newTitle[i] = item.metaData.customer && item.metaData.customer.name;
						}
					} else if (newTitle[i] === "{{amount}}") {
						newTitle[i] = formatMoney(item.metaData.payment.amount, config.currencyFormat);
					} else if (newTitle[i] === "{{subject}}") {
						if (item.isOwnEmail) {
							newTitle[i] = item.metaData.subject || "[No subject]";
						} else {
							newTitle[i] = (item.metaData.email && item.metaData.email.subject) || "[No subject]";
						}
					} else if (newTitle[i] === "{{payment}}") {
						newTitle[i] = formatMoney(item.metaData.invoice.payment, config.currencyFormat);
					} else if (newTitle[i] === "{{outstandingAmount}}") {
						newTitle[i] = formatMoney(item.metaData.invoice.outstandingAmount, config.currencyFormat);
					} else {
						let documentName, documentID, url;
						if (newTitle[i] === "{{invoice}}") {
							documentID =
								item && item.metaData && item.metaData.invoice && item.metaData.invoice.id
									? item.metaData.invoice.id
									: item.invoiceId;
							documentName = item.metaData.invoice.number || "";
							url = `invoice/${documentID}`;
						} else if (newTitle[i] === "{{offer}}") {
							documentID =
								item && item.metaData && item.metaData.offer && item.metaData.offer.id
									? item.metaData.offer.id
									: item.offerId;
							documentName = item.metaData.offer.number;
							url =
								item.metaData.offer.type === "standard" || item.historyType === HistoryTypes.EMAIL
									? `offer/${documentID}`
									: `offer/impress/${documentID}`;
						} else if (newTitle[i] === "{{expense}}") {
							documentID =
								item && item.metaData && item.metaData.expense && item.metaData.expense.id
									? item.metaData.expense.id
									: item.expenseId;
							documentName = item.metaData.expense.receiptNumber;
							url = `expense/edit/${documentID}`;
						} else if (newTitle[i] === "{{purchaseOrder}}") {
							documentID =
								item && item.metaData && item.metaData.purchaseOrder && item.metaData.purchaseOrder.id
									? item.metaData.purchaseOrder.id
									: item.purchaseOrderId;
							documentName = item.metaData.purchaseOrder.number;
							url = `purchase-order/${documentID}`;
						} else if (newTitle[i] === "{{deliveryNote}}") {
							documentID =
								item && item.metaData && item.metaData.deliveryNote && item.metaData.deliveryNote.id
									? item.metaData.deliveryNote.id
									: item.deliveryNoteId;
							documentName = item.metaData.deliveryNote.number;
							url = `deliverynote/${documentID}`;
						} else if (newTitle[i] === "{{project}}") {
							documentID =
								item && item.metaData && item.metaData.project && item.metaData.project.id
									? item.metaData.project.id
									: item.projectId;
							documentName = item.metaData.project.title;
							url = `project/${documentID}`;
						} else if (newTitle[i] === "{{recurringInvoice}}") {
							documentID =
								item &&
								item.metaData &&
								item.metaData.recurringInvoice &&
								item.metaData.recurringInvoice.id
									? item.metaData.recurringInvoice.id
									: item.recurringInvoiceId;
							documentName = `(${item.metaData.recurringInvoice.number})`;
							url = `recurringInvoice/${documentID}`;
						}

						const link = (
							<span
								onClick={() => invoiz.router.navigate(url, false, false, true)}
								className="history-link text-semibold"
							>
								{documentName}
							</span>
						);

						newTitle[i] = link;
					}
				}
			}
		}

		if (!newTitle) {
			newTitle = [oldTitle];
		}

		return newTitle;
	}

	showEmail(item) {
		if (
			item.isOwnEmail &&
			!item.invoiceId &&
			!item.deliveryNoteId &&
			!item.offerId &&
			!item.projectId &&
			!item.expenseId &&
			!item.purchaseOrderId
		) {
			invoiz
				.request(`${config.resourceHost}email/customer/${item.emailId}/${this.props.customerId}`, {
					auth: true,
				})
				.then(({ body: { data } }) => {
					ModalService.open(
						<ExtendedEmailModalComponent
							emailIdToShow={item.emailId}
							emailToShow={data}
							onConfirm={() => ModalService.close()}
							customerData={this.props.customer}
						/>,
						{
							width: 850,
							padding: "0",
						}
					);
				})
				.catch(({ body: { meta } }) => {
					handleNotificationErrorMessage(meta);
				});
		} else {
			ModalService.open(
				<EmailPreviewModalComponent
					emailId={item.emailId}
					//email={item.emailId ? item.metaData : item.metaData.email}
					email={item.metaData}
					date={item.date || item.updatedAt || item.createdAt}
					type={item.getType}
					item={item}
					onConfirm={() => ModalService.close()}
				/>,
				{
					width: 535,
					padding: "10px 0 30px",
				}
			);
		}
	}

	// deleteEmail(id) {
	// 	ModalService.open('Möchtest du deine E-Mail wirklich löschen?', {
	// 		headline: 'E-Mail löschen',
	// 		cancelLabel: 'Abbrechen',
	// 		confirmLabel: 'Löschen',
	// 		confirmIcon: 'icon-trashcan',
	// 		confirmButtonType: 'danger',
	// 		onConfirm: () => {
	// 			ModalService.close();
	// 			this.props.onDeleteEmail && this.props.onDeleteEmail(id);
	// 		},
	// 	});
	// }

	// deleteActivity(id) {
	// 	ModalService.open('Möchtest du deine Aktivität wirklich löschen?', {
	// 		headline: 'Aktivität löschen',
	// 		cancelLabel: 'Abbrechen',
	// 		confirmLabel: 'Löschen',
	// 		confirmIcon: 'icon-trashcan',
	// 		confirmButtonType: 'danger',
	// 		onConfirm: () => {
	// 			ModalService.close();
	// 			this.props.onDeleteActivity && this.props.onDeleteActivity(id);
	// 		},
	// 	});
	// }

	render() {
		const { item, customerId } = this.props;
		const { isOpen, showMore } = this.state;
		const { historyType, displayType, isOwnEmail, icon, cancellationDate, formattedCancellationDate } = item;
		const title = this.formatTitle(item);
		const date = new Date(item.date);
		const month = months[date.getMonth()];
		const day = date.getDate();
		const year = date.getFullYear();
		// console.log(historyType, "history type");
		// console.log(item, "ITEM");
		// console.log(title, "TITLE");
		return (
			customerId ? (
				<div className="history-item-icon-and-content">
					<div
						className={`history-icon-container ${
							historyType === HistoryTypes.EMAIL
								? 'type-email'
								: historyType === HistoryTypes.DOCUMENT
								? 'type-document'
								: ''
						} u_hc`}
					>
						<div className={`icon ${icon}`} />
					</div>
					<div className="history-content">
						<div className={`history-header ${historyType === HistoryTypes.TODO ? 'todo-header' : ''}`}>
							{displayType}
						</div>
						<React.Fragment>
							<div className={`history-body ${!isOpen ? 'truncated' : 'not-truncated'}`}>
								<span className="history-date">{item && item.getDateSubstring}: </span>
								<span
									ref={this.textRef}
									className={`history-text ${
										historyType === HistoryTypes.TODO ? `history-text-done-todo` : ''
									} ${isOwnEmail ? 'history-text-own-email' : ''}`}
								>
									{' '}
									{historyType === HistoryTypes.TODO || historyType === HistoryTypes.ACTIVITY ? (
										<span dangerouslySetInnerHTML={{ __html: title }}></span>
									) : (
										title.map((subItem, subIndex) => {
											return (
												<span key={`historyItem-${historyType}-${subIndex}-title`}>
													{subItem}&nbsp;
												</span>
											);
										})
									)}
								</span>
							</div>
							{/* {(historyType === HistoryTypes.TODO || historyType === HistoryTypes.ACTIVITY) && showMore && (
								<div
									onClick={(e) => this.setState({ isOpen: !isOpen })}
									className="text-semibold read-more-button"
								>
									{!isOpen ? 'mehr lesen ' : 'weniger lesen '}
									<div className={`icon icon-arr_down read-more-icon ${!isOpen ? '' : 'up'}`} />
								</div>
							)} */}
							{(historyType === HistoryTypes.PAYMENT || historyType === HistoryTypes.TDS_CHARGE || historyType === HistoryTypes.DISCOUNT_CHARGE || historyType === HistoryTypes.BANK_CHARGE || historyType === HistoryTypes.MORE_SETTLE
				|| historyType === HistoryTypes.MORE_SURCHARGE) && cancellationDate && (
								<div className="text-small">Cancelled on {formattedCancellationDate}</div>
							)}
						</React.Fragment>
						<div className="history-buttons">
							{this.state.actionButtons.map((button, index) => {
								return (
									<div
										key={`history-item-action-${index}`}
										onClick={button.clickAction}
										className={`text-semibold action-text ${button.cssClass}`}
									>
										{button.label}
									</div>
								);
							})}
						</div>
					</div>
				</div>
				) : (
				<div className="history-item-icon-and-content">
					<div className="history-content">
						<React.Fragment>
							<div className={`history-body ${!isOpen ? "truncated" : "not-truncated"}`}>
								<span className="history-date">{item && `${month} ${day}, ${year}`} </span>
								<div className={this.props.index === 0 ? "greenCircle" : "greyCircleSolid"} />
								<span
									ref={this.textRef}
									className={`history-text ${
										historyType === HistoryTypes.TODO ? `history-text-done-todo` : ""
									} ${isOwnEmail ? "history-text-own-email" : ""}`}
								>
									{" "}
									{historyType === HistoryTypes.TODO || historyType === HistoryTypes.ACTIVITY ? (
										<React.Fragment>
											<span
												className="payment-amount"
												dangerouslySetInnerHTML={{ __html: title.join(" ") }}
											/>
											<span className="payment-time">
												{date.toLocaleString("en-US", {
													hour: "numeric",
													minute: "numeric",
													hour12: true,
												})}
											</span>
										</React.Fragment>
									) : (
										<React.Fragment>
											<span className="payment-amount">{title.join(" ")}</span>
											<span className="payment-time">
												{date.toLocaleString("en-US", {
													hour: "numeric",
													minute: "numeric",
													hour12: true,
												})}
											</span>
										</React.Fragment>
									)}
								</span>
							</div>
							{(historyType === HistoryTypes.PAYMENT ||
								historyType === HistoryTypes.TDS_CHARGE ||
								historyType === HistoryTypes.DISCOUNT_CHARGE ||
								historyType === HistoryTypes.BANK_CHARGE ||
								historyType === HistoryTypes.MORE_SETTLE ||
								historyType === HistoryTypes.MORE_SURCHARGE) &&
								cancellationDate && (
									<div className="text-small">Cancelled on {formattedCancellationDate}</div>
								)}
						</React.Fragment>
						<div className="history-buttons">
							{this.state.actionButtons.map((button, index) => {
								return (
									<div
										key={`history-item-action-${index}`}
										onClick={button.clickAction}
										className={`text-semibold action-text ${button.cssClass}`}
									>
										{button.label}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)
		);
	}
}

HistoryItemComponent.propTypes = {
	item: PropTypes.object.isRequired,
	customerId: PropTypes.number,
	onCancelPayment: PropTypes.func,
	onShowDunning: PropTypes.func,
	onSendDunning: PropTypes.func,
	onDeleteActivity: PropTypes.func,
	onDeleteEmail: PropTypes.func,
};

export default HistoryItemComponent;
