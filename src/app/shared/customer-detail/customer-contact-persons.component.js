import React from "react";
import config from "config";
import _ from "lodash";
import ButtonComponent from "shared/button/button.component";

class CustomerContactPersonsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.carousel = null;
	}

	componentDidMount() {
		const options = _.assign({}, config.owlCarousel, {
			items: 1,
			nav: true,
			dots: false,
			center: true,
			slideBy: "page",
			margin: 30,
			mouseDrag: this.props.contactPersons.length > 1,
			touchDrag: this.props.contactPersons.length > 1,
			onChanged: this.handleCarouselSlideChange.bind(this),
		});

		this.carousel = $(this.refs.carousel).owlCarousel(options).data("owl.carousel");
	}

	handleCarouselSlideChange(event) {
		if (_.isNumber(event.item.index)) {
			const lis = $("li", $(this.refs.nameInitialsLeft));
			lis.removeClass("active");
			lis.eq(event.item.index).addClass("active");
		}
	}

	onEmailClick(email) {
		window.open(`mailto:${email}`, "_self");
	}

	render() {
		const contactPersons = this.props.contactPersons;

		return (
			<div className=" box-rounded customer-contact-persons detail-wrap">
				<div className="carousel" ref="carousel">
					{contactPersons.map((contactPerson, index) => {
						return (
							<div key={index} style={{ padding: "10px" }}>
								<div className="text-muted text-small">
									{contactPerson.salutation} {contactPerson.title}
								</div>
								<div className="text-h4 text-truncate">
									{contactPerson.firstName} {contactPerson.lastName}
								</div>
								<div className="text-medium">{contactPerson.job}</div>
								{contactPerson.displayDate && (
									<div className="row u_mt_10">
										<div className="col-xs-10">
											<div className="text-muted text-small">Date of birth</div>
											<div className="text-medium">{contactPerson.displayDate}</div>
										</div>
									</div>
								)}
								<div className="row u_mt_10">
									<div className="col-xs-10">
										<div className="text-muted text-small">E-mail</div>
										<div
											className={
												contactPerson.email ? "text-medium" : "text-medium text-placeholder"
											}
										>
											{contactPerson.email || "Not available"}
										</div>
									</div>
									<div className="col-xs-2 button-wrapper">
										{contactPerson.email && (
											<ButtonComponent
												callback={() => {
													this.onEmailClick(contactPerson.email);
												}}
												buttonIcon="icon-mail"
												type="secondary"
												wrapperClass="button-circle"
											/>
										)}
									</div>
								</div>
								<div className="row u_mt_10">
									<div className="col-xs-10">
										<div className="text-muted text-small">Phone 1</div>
										<div
											className={
												contactPerson.phone1 ? "text-medium" : "text-medium text-placeholder"
											}
										>
											{contactPerson.phone1 || "Not available"}
										</div>
									</div>
								</div>
								{contactPerson.phone2 && (
									<div className="row u_mt_10">
										<div className="col-xs-10">
											<div className="text-muted text-small">Phone 2</div>
											<div className="text-medium">{contactPerson.phone2}</div>
										</div>
									</div>
								)}
								<div className="row u_mt_10">
									<div className="col-xs-10">
										<div className="text-muted text-small">Mobile no.</div>
										<div
											className={
												contactPerson.mobile ? "text-medium" : "text-medium text-placeholder"
											}
										>
											{contactPerson.mobile || "Not available"}
										</div>
									</div>
								</div>
								{contactPerson.fax && (
									<div className="row u_mt_10">
										<div className="col-xs-10">
											<div className="text-muted text-small">Fax</div>
											<div className="text-medium">{contactPerson.fax}</div>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		);
	}
}

export default CustomerContactPersonsComponent;
