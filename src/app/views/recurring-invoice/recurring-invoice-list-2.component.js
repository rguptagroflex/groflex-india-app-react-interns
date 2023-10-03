import React from "react";

const RecurringInvoiceList2Component = ({ invoicesList, onRowClick, placeholderInfo }) => {
	let notStarted = false;
	let newInvoicesList = invoicesList.rows.slice();
	let onlyOneItem = invoicesList.rows.length === 1;

	if (!invoicesList.rows.length) {
		newInvoicesList.push({ cells: placeholderInfo });
		// newInvoicesList.push({ cells: placeholderInfo });
		// newInvoicesList.push({ cells: placeholderInfo });
		notStarted = true;
		onlyOneItem = newInvoicesList.length === 1;
	}
	// console.log("invoicesList", invoicesList);
	// console.log("placeholderInfo", placeholderInfo);
	// console.log(newInvoicesList, "newInvoicesList");
	// console.log(notStarted, "notStarted");
	// console.log(onlyOneItem, "onlyOneItem");
	return (
		<div className="recurring-invoice-list">
			<h4 className="recurring-title">Invoices Created</h4>
			{newInvoicesList.map((invoice, index) => {
				return (
					<React.Fragment>
						<div
							style={{
								color: notStarted ? "#aaa" : "inherit",
							}}
							onClick={() => {
								if (notStarted) {
									return;
								}
								onRowClick(invoice.id);
							}}
							key={`recurring-invoice-list-item-${index}`}
							className={`recurring-invoice-list-item ${notStarted ? "" : "clickable-invoice"}`}
						>
							<div className="first-half">
								<div className="date-box info-box">
									<div className="info-title">Date</div>
									<div>-</div>
									<div className="info-value">{invoice.cells[1].value.replaceAll("-", "/")}</div>
								</div>
								<div className="payment-status-box info-box">
									<div className="info-title">Payment Status</div>
									<div>-</div>
									<div className="info-value">{invoice.cells[2].value}</div>
								</div>
							</div>
							<div className="second-half">
								<div className="invoice-no-box info-box">
									<div className="info-title">Invoice No.</div>
									<div>-</div>
									<div className="info-value">{invoice.cells[0].value}</div>
								</div>
								<div className="amount-box info-box">
									<div className="info-title">Amount</div>
									<div>-</div>
									<div className="info-value">{invoice.cells[3].value}</div>
								</div>
							</div>
						</div>
						{onlyOneItem || index === newInvoicesList.length - 1 ? "" : <div className="divider" />}
					</React.Fragment>
				);
			})}
		</div>
	);
};

export default RecurringInvoiceList2Component;
