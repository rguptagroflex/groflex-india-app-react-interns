import React from "react";
import invoiz from "services/invoiz.service";
import ButtonComponent from "shared/button/button.component";
import PopoverComponent from "shared/popover/popover.component";
import SVGInline from "react-svg-inline";
import CustomerPrivatMan from "assets/images/svg/customer-private-man.svg";
import CustomerPrivatWoman from "assets/images/svg/customer-private-woman.svg";
import CustomerPrivatFamily from "assets/images/svg/customer-private-family.svg";
import CustomerCompany from "assets/images/svg/customer-company.svg";
import ForeignCustomer from "assets/images/svg/foreign_customer.svg";
import Direction from "enums/direction.enum";
import { contactTypes } from "helpers/constants";

const CustomerMetadataComponent = (props) => {
	const customer = props.customer;
	const otherActions = [];
	let { bulkPayment, issueRefund } = props;
	const availableApps = [
		{
			label: "Quotation",
			icon: "icon-offer",
			isAvailable: customer.type == contactTypes.CUSTOMER ? true : false,
			url: `/offer/new/customer/${customer.id}`,
		},
		{
			label: "Invoice",
			icon: "icon-rechnung",
			isAvailable: customer.type == contactTypes.CUSTOMER ? true : false,
			url: `/invoice/new/customer/${customer.id}`,
		},
		{
			label: "Bulk payment",
			icon: "icon-bulk_payment1",
			isAvailable: customer.type == contactTypes.CUSTOMER ? true : false,
			action: () => {
				bulkPayment && bulkPayment();
			},
		},
		{
			label: "Issue refund",
			icon: "icon-rechnung",
			isAvailable: customer.type == contactTypes.CUSTOMER ? true : false,
			action: () => {
				issueRefund && issueRefund();
			},
		},
		{
			label: "Recurring invoice",
			icon: "icon-rechnung",
			isAvailable: customer.type == contactTypes.CUSTOMER ? true : false,
			url: `/recurringInvoice/new/customer/${customer.id}`,
		},
		{
			label: "Timesheet",
			icon: "icon-rechnung",
			isAvailable: customer.type == contactTypes.CUSTOMER ? true : false,
			url: `/timetracking/new/${customer.id}`,
		},
		// {
		// 	label: "Expenditure",
		// 	icon: "icon-expense",
		// 	isAvailable: customer.type == contactTypes.PAYEE ? true : false,
		// 	url: `/expense/new/customer/${customer.id}`,
		// },
		// {
		// 	label: "Purchase order",
		// 	icon: "icon-order",
		// 	isAvailable: customer.type == contactTypes.PAYEE ? true : false,
		// 	url: `/purchase-order/new/customer/${customer.id}`,
		// },
	];
	const buttonData = [];

	availableApps.forEach((app) => {
		if (app.isAvailable) {
			buttonData.push({
				label: app.label,
				buttonIcon: app.icon,
				url: app.url,
				action: app.action,
			});
		}
	});

	const onCreateButtonClick = (url, action) => {
		if (action) action();
		else invoiz.router.navigate(url, false, false, true);
	};

	const wrapperClass = buttonData.length === 1 ? "button-single" : "button-half";

	const buttons = buttonData.map((button, index) => {
		if (index <= 3) {
			return (
				<ButtonComponent
					key={index}
					callback={() => {
						onCreateButtonClick(button.url, button.action);
					}}
					label={button.label}
					type="default"
					buttonIcon={button.buttonIcon}
					dataQsId={`customerDetail-btn-${button.label}`}
					wrapperClass={wrapperClass}
				/>
			);
		} else {
			otherActions.push(button);
		}
	});

	const symmetricButtons = (buttons = []) => {
		let displayButtons = [];
		let buttonsLength = customer.type === `payee` ? buttons.length : buttons.length - 1;
		for (let i = 1; i < buttonsLength; i++) {
			displayButtons.push(
				<div className="buttons" key={`symmetric ${i}`}>
					{buttons[i - 1]} {buttons[i]}
				</div>
			);
			i++;
		}
		return displayButtons;
	};

	setTimeout(() => {
		$("#customer-detail-metadata-name").dotdotdot({ height: 68, truncate: "letter" });
	}, 0);
	return (
		<div
			style={{ minHeight: "98%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
			className="box box-rounded customer-metadata row"
		>
			<div className="row">
				<div className="customer-avatar col-xs-6 ">
					{customer.kind === "person" &&
						customer.salutation === "Familie" &&
						(customer.address.countryIso === `IN` ? (
							<SVGInline height="120px" svg={CustomerPrivatFamily} />
						) : (
							<SVGInline height="120px" svg={ForeignCustomer} />
						))}
					{customer.kind === "person" &&
						(customer.salutation === "Mr" || !customer.salutation) &&
						(customer.address.countryIso === `IN` ? (
							<SVGInline height="120px" svg={CustomerPrivatMan} />
						) : (
							<SVGInline height="120px" svg={ForeignCustomer} />
						))}
					{customer.kind === "person" &&
						customer.salutation === "Mrs" &&
						(customer.address.countryIso === `IN` ? (
							<SVGInline height="120px" svg={CustomerPrivatWoman} />
						) : (
							<SVGInline height="120px" svg={ForeignCustomer} />
						))}
					{customer.kind === "company" &&
						(customer.address.countryIso === `IN` ? (
							<SVGInline height="120px" svg={CustomerCompany} />
						) : (
							<SVGInline height="120px" svg={ForeignCustomer} />
						))}
				</div>
				<div className="customer-detail-metadata-name col-xs-6 ">
					<div
						id="customer-detail-metadata-name"
						className={`u_mb_10 ${customer.name.length < 26 ? "text-h3" : "text-h5"}`}
					>
						{customer.name}
					</div>
					<div className="text-muted ">
						{`${customer.custNoString} ${customer.category && "|"} ${customer.category} ${
							customer.address.countryIso !== `IN`
								? ` | Currency: 1 ${customer.baseCurrency} - ${customer.exchangeRate} INR`
								: ``
						}`}
					</div>
				</div>
			</div>

			<div>
				{symmetricButtons(buttons)}
				{/* <div className="buttons">{ symmetricButtons(buttons)}</div> */}
				{/* <div className="buttons">{buttons}</div> */}
				{!!otherActions.length && (
					<React.Fragment>
						<ButtonComponent
							id="customer-detail-other-button"
							type="primary"
							isWide="true"
							label={
								<div>
									Additional actions <div className="icon icon-arr_down"></div>
								</div>
							}
							wrapperClass="button-more"
							dataQsId="customerDetail-btn-other"
						/>
						<div className="popover-container">
							<PopoverComponent
								showOnClick={true}
								contentClass={`invoice-list-cell-dropdown-content`}
								entries={[otherActions]}
								onClick={(entry) => onCreateButtonClick(entry.url, entry.action)}
								elementId="customer-detail-other-button"
								arrowAlignment={Direction.CENTER}
								alignment={Direction.CENTER}
								fixedWidth={180}
								offsetTop={-7}
								keepOpenOnScroll={true}
								positionAbsolute={true}
							/>
						</div>
					</React.Fragment>
				)}
			</div>
		</div>
	);
};

export default CustomerMetadataComponent;
