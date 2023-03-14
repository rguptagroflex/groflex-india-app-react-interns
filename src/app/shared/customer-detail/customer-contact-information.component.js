import React from "react";
import ButtonComponent from "shared/button/button.component";
import PerfectScrollbar from "perfect-scrollbar";
import { normalizeHttpUrl } from "helpers/normalizeHttpUrl";

class CustomerContactInformationComponent extends React.Component {
	constructor(props) {
		super(props);

		this.perfectScrollbar = null;
	}

	componentDidMount() {
		this.perfectScrollbar = new PerfectScrollbar(".customer-contact-information-scroll-container", {
			suppressScrollX: true,
		});
	}

	componentWillUnmount() {
		if (this.perfectScrollbar) {
			this.perfectScrollbar.destroy();
		}
	}

	onShowExternalMapsClick() {
		const { customer } = this.props;
		window.open(`http://www.google.com/maps/search/${customer.mapData.mapAddress}`, "_blank");
	}

	onEmailClick(email) {
		window.open(`mailto:${email}`, "_self");
	}

	onWebsiteClick(website) {
		window.open(normalizeHttpUrl(website), "_blank");
	}

	render() {
		const customer = this.props.customer;

		return (
			<div className="box box-rounded customer-contact-information">
				{/* <div className="text-h4 u_mb_20">Contact information</div> */}
				<div className="customer-contact-information-scroll-container">
					<div className="row u_mb_0">
						<div className="col-xs-6 u_mb_10 u_mt_10">
							<div className="row">
								<div className="col-xs-4">
									<div className="text-muted">E-mail</div>
								</div>
								<div className="col-xs-5">
									<div className={`text-truncate ${!customer.email ? "text-placeholder" : null}`}>
										{customer.email || "Not available"}
									</div>
								</div>
								<div className="col-xs-3">
									{customer.email && (
										<ButtonComponent
											callback={() => {
												this.onEmailClick(customer.email);
											}}
											buttonIcon="icon-mail"
											type="secondary"
											wrapperClass="button-circle"
										/>
									)}
								</div>
							</div>
						</div>
						<div className="col-xs-6 u_mb_10 u_mt_10">
							<div className="row">
								<div className="col-xs-4">
									<div className="text-muted">Website</div>
								</div>
								<div className="col-xs-5">
									<div className={`text-truncate ${!customer.website ? "text-placeholder" : null}`}>
										{customer.website || "Not available"}
									</div>
								</div>
								<div className="col-xs-3">
									{customer.website && (
										<ButtonComponent
											callback={() => {
												this.onWebsiteClick(customer.website);
											}}
											buttonIcon="icon-weblink"
											type="primary"
											wrapperClass="button-circle"
										/>
									)}
								</div>
							</div>
						</div>
						<div className="col-xs-6 u_mb_10 u_mt_10">
							<div className="row">
								<div className="col-xs-4">
									<div className="text-muted">Telephone</div>
								</div>
								<div className="col-xs-5">
									<div className={customer.phone1 ? "" : "text-placeholder"}>
										{customer.phone1 || "Not available"}
									</div>
								</div>
								<div className="col-xs-3"></div>
							</div>
						</div>
						{customer.phone2 && (
							<div className="col-xs-6 u_mb_10 u_mt_10">
								<div className="row">
									<div className="col-xs-4">
										<div className="text-muted">Telephone 2</div>
									</div>
									<div className="col-xs-5">
										<div>{customer.phone2}</div>
									</div>
									<div className="col-xs-3"></div>
								</div>
							</div>
						)}
						{customer.fax && (
							<div className="col-xs-6 u_mb_10 u_mt_10">
								<div className="row">
									<div className="col-xs-4">
										<div className="text-muted">Fax</div>
									</div>
									<div className="col-xs-5">
										<div>{customer.fax}</div>
									</div>
									<div className="col-xs-3"></div>
								</div>
							</div>
						)}
						<div className="col-xs-6 u_mb_10 u_mt_10">
							<div className="row">
								<div className="col-xs-4">
									<div className="text-muted">Mobile</div>
								</div>
								<div className="col-xs-5">
									<div className={customer.mobile ? "" : "text-placeholder"}>
										{customer.mobile || "Not available"}
									</div>
								</div>
								<div className="col-xs-3"></div>
							</div>
						</div>
						<div className="col-xs-6 u_mb_10 u_mt_10">
							<div className="row">
								<div className="col-xs-4">
									<div className="text-muted">Address</div>
								</div>
								<div className="col-xs-5">
									{customer.address.city ||
									customer.country ||
									customer.address.street ||
									customer.address.zipCode ? (
										<React.Fragment>
											{customer.address.street && <div>{customer.address.street}</div>}
											{(customer.address.zipCode || customer.address.city) && (
												<div>
													{customer.address.zipCode} {customer.address.city}
												</div>
											)}
											{customer.country && <div>{customer.country}</div>}
										</React.Fragment>
									) : (
										<div className="text-placeholder">Not available</div>
									)}
								</div>
								<div className="col-xs-3">
									{customer.address.street && (
										<ButtonComponent
											callback={() => {
												this.onShowExternalMapsClick();
											}}
											buttonIcon="icon-pin"
											type="primary"
											wrapperClass="button-circle"
										/>
									)}
								</div>
							</div>
						</div>
					</div>
					{/* <div className="row u_mb_20">
						<div className="col-xs-9">
							<div className="text-muted text-medium">Website</div>
							<div className={`text-truncate ${!customer.website ? 'text-placeholder' : null}`}>
								{customer.website || 'Not available'}
							</div>
						</div>
						<div className="col-xs-3">
							{customer.website && (
								<ButtonComponent
									callback={() => {
										this.onWebsiteClick(customer.website);
									}}
									buttonIcon="icon-weblink"
									type="primary"
									wrapperClass="button-circle"
								/>
							)}
						</div>
					</div> */}
					{/* <div className="row u_mb_20">						
						 <div className="text-muted text-medium">Telephone</div>
							<div className={customer.phone1 ? '' : 'text-placeholder'}>
								{customer.phone1 || 'Not available'}
							</div> 
					</div> */}
					{/* {customer.phone2 && (
						<div className="row u_mb_20">
							<div className="col-xs-9">
								<div className="text-muted text-medium">Telephone 2</div>
								<div>{customer.phone2}</div>
							</div>
						</div>
					)} */}
					{/* {customer.fax && (
						<div className="row u_mb_20">
							<div className="col-xs-9">
								<div className="text-muted text-medium">Fax</div>
								<div>{customer.fax}</div>
							</div>
						</div>
					)} */}
					{/* <div className="row u_mb_20">
						<div className="col-xs-9">
							<div className="text-muted text-medium">Mobile</div>
							<div className={customer.mobile ? '' : 'text-placeholder'}>
								{customer.mobile || 'Not available'}
							</div>
						</div>
					</div> */}
					{/* <div className="row u_mb_20">
						<div className="col-xs-9">
							<div className="text-muted text-medium">Address</div>
							{customer.address.city ||
							customer.country ||
							customer.address.street ||
							customer.address.zipCode ? (
								<React.Fragment>
									{customer.address.street && <div>{customer.address.street}</div>}
									{(customer.address.zipCode || customer.address.city) && (
										<div>
											{customer.address.zipCode} {customer.address.city}
										</div>
									)}
									{customer.country && <div>{customer.country}</div>}
								</React.Fragment>
							) : (
								<div className="text-placeholder">Not available</div>
							)}
						</div>
						<div className="col-xs-3">
							{customer.address.street && (
								<ButtonComponent
									callback={() => {
										this.onShowExternalMapsClick();
									}}
									buttonIcon="icon-pin"
									type="primary"
									wrapperClass="button-circle"
								/>
							)}
						</div>
					</div> */}
				</div>
			</div>
		);
	}
}

export default CustomerContactInformationComponent;
