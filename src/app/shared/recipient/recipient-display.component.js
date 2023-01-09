import React from 'react';
import PropTypes from 'prop-types';
import { getLabelForCountry } from 'helpers/getCountries';
import { customerTypes } from 'helpers/constants';
import { formatMoneyCode } from 'helpers/formatMoney';

const { COMPANY } = customerTypes;

class RecipientDisplayComponent extends React.Component {
	constructor(props) {
		super(props)

		this.getNameComponent = this.getNameComponent.bind(this);
	}

	componentWillReceiveProps(newProps) {
	}

	getNameComponent () {
		const { kind,
			salutation,
			title,
			firstName,
			lastName,
			companyName,
			companyNameAffix } = this.props.customerData;
			
		if (kind === COMPANY) {
			return (
				<div className="text-bold">
					<div>{companyName}</div>
					<div>{companyNameAffix}</div>
				</div>
			);
		} else {
			return (
				<div className="text-bold">
					<div>
						{salutation} {title}
					</div>
					<div>
						{firstName} {lastName}
					</div>
				</div>
			);
		}
	}


	render() {
		const { customerData, baseCurrency, exchangeRate, handleClick, handleRemoveClick, resources } = this.props;
		const {
			kind,
			contact,
			street,
			// zipCode,
			// city,
			countryIso,
			indiaState,
			gstNumber,
			cinNumber,
			mobile,
		} = customerData;

		let contactPersonDiv = '';
		const countryLabel = getLabelForCountry(countryIso);
		const countryDiv = countryIso ? <span>{countryLabel}</span> : null;
		if (contact && kind === COMPANY) {
			contactPersonDiv = contact ? (
				<div>
					{contact.salutation} {contact.title} {contact.firstName} {contact.lastName}
				</div>
			) : null;
		}
		return (
			<div className="recipientDisplay" onClick={handleClick}>
				{this.getNameComponent()}
				{contactPersonDiv}
				<div className="street-div">{street}</div>
				{/* <div>
					{zipCode} {city}
				</div> */}
				<div className="countryDisplay">
					{indiaState && indiaState.stateName
						? <span>{indiaState.stateName}, </span> : null}
					{countryDiv}
				</div>
				<button className="button-icon-close recipientDisplay_button" onClick={handleRemoveClick} />
				{mobile ? <div>{`Mobile: ${mobile}`}</div> : null}
				{ kind === COMPANY && gstNumber ? <div>{resources.str_gst}: {gstNumber}</div> : null}
				{kind === COMPANY && cinNumber ? <div>{resources.str_cin}: {cinNumber}</div> : null}
				{/* {countryIso !== "IN" ? <span className="currencyDisplay">{`1 ${exchangeRate ? baseCurrency : customerData.baseCurrency} = ${formatMoneyCode(exchangeRate ? exchangeRate : customerData.exchangeRate)}`}</span> : null} */}
				{/* {countryIso !== "IN" ? <span className="currencyDisplay">{`1 ${baseCurrency} = ${!exchangeRate ? formatMoneyCode(customerData.exchangeRate) : formatMoneyCode(exchangeRate)}`}</span> : null} */}
				{countryIso !== "IN" ? <span className="currencyDisplay">{`1 ${baseCurrency} = ${formatMoneyCode(exchangeRate)}`}</span> : null}
			</div>
		);
	}
}

// const RecipientDisplayComponent = ({ customerData, baseCurrency, exchangeRate, handleClick, handleRemoveClick, resources }) => {
// 	const {
// 		kind,
// 		salutation,
// 		title,
// 		firstName,
// 		lastName,
// 		companyName,
// 		companyNameAffix,
// 		contact,
// 		street,
// 		// zipCode,
// 		// city,
// 		countryIso,
// 		indiaState,
// 		gstNumber,
// 		cinNumber,
// 	} = customerData;
// 	let contactPersonDiv = '';
// 	const countryLabel = getLabelForCountry(countryIso);
// 	const countryDiv = countryIso ? <span>{countryLabel}</span> : null;
// 	if (contact && kind === COMPANY) {
// 		contactPersonDiv = contact ? (
// 			<div>
// 				{contact.salutation} {contact.title} {contact.firstName} {contact.lastName}
// 			</div>
// 		) : null;
// 	}

// 	const getNameComponent = () => {
// 		if (kind === COMPANY) {
// 			return (
// 				<div className="text-bold">
// 					<div>{companyName}</div>
// 					<div>{companyNameAffix}</div>
// 				</div>
// 			);
// 		} else {
// 			return (
// 				<div className="text-bold">
// 					<div>
// 						{salutation} {title}
// 					</div>
// 					<div>
// 						{firstName} {lastName}
// 					</div>
// 				</div>
// 			);
// 		}
// 	};
// 	return (
// 		<div className="recipientDisplay" onClick={handleClick}>
// 			{getNameComponent()}
// 			{contactPersonDiv}
// 			<div className="street-div">{street}</div>
// 			{/* <div>
// 				{zipCode} {city}
// 			</div> */}
// 			<div className="countryDisplay">
// 				{indiaState && indiaState.stateName
// 					? <span>{indiaState.stateName}, </span> : null}
// 				{countryDiv}
// 			</div>
// 			<button className="button-icon-close recipientDisplay_button" onClick={handleRemoveClick} />
// 			{ kind === COMPANY && gstNumber ? <div>{resources.str_gst}: {gstNumber}</div> : null}
// 			{kind === COMPANY && cinNumber ? <div>{resources.str_cin}: {cinNumber}</div> : null}
// 			{/* {countryIso !== "IN" ? <span className="currencyDisplay">{`1 ${exchangeRate ? baseCurrency : customerData.baseCurrency} = ${formatMoneyCode(exchangeRate ? exchangeRate : customerData.exchangeRate)}`}</span> : null} */}
// 			{countryIso !== "IN" ? <span className="currencyDisplay">{`1 ${customerData.baseCurrency} = ${formatMoneyCode(customerData.exchangeRate)}`}</span> : null}
// 		</div>
// 	);
// };

RecipientDisplayComponent.defaultProps = {
	customerData: {}
};

RecipientDisplayComponent.propTypes = {
	customerData: PropTypes.object,
	handleClick: PropTypes.func,
	handleRemoveClick: PropTypes.func
};

export default RecipientDisplayComponent;
