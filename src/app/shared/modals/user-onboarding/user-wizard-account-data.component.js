import React from 'react';
import lang from 'lang';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';

const UserWizardAccountDataCompoment = (props) => {
	const { companyAddress } = props.accountData;
	const { onInputChange, resources } = props;
	return (
		<React.Fragment>
			<h5 className="headline text-h5 u_mb_12">{`Complete your profile`}</h5>
			{/* <div className="u_mb_10">{`Please fill in additional details below`}</div> */}
			<div className="row">
				<TextInputExtendedComponent
					customWrapperClass="col-xs-6"
					name="firstName"
					label={resources.str_firstName}
					value={companyAddress.firstName}
					onChange={(value, name) => onInputChange(value, name)}
					autoComplete="off"
					spellCheck="false"
					variant="outlined-rounded"
				/>

				<TextInputExtendedComponent
					customWrapperClass="col-xs-6"
					name="lastName"
					label={resources.str_surName}
					value={companyAddress.lastName}
					onChange={(value, name) => onInputChange(value, name)}
					autoComplete="off"
					spellCheck="false"
					variant="outlined-rounded"
				/>

				<TextInputExtendedComponent
					customWrapperClass="col-xs-6"
					name="companyName"
					label={resources.str_companyName}
					value={companyAddress.companyName}
					onChange={(value, name) => onInputChange(value, name)}
					autoComplete="off"
					spellCheck="false"
					variant="outlined-rounded"
				/>

				<TextInputExtendedComponent
					customWrapperClass="col-xs-6"
					name="street"
					label={`Company address`}
					value={companyAddress.street}
					onChange={(value, name) => onInputChange(value, name)}
					autoComplete="off"
					spellCheck="false"
					variant="outlined-rounded"
				/>

				{/* <TextInputExtendedComponent
					customWrapperClass="col-xs-2 u_mb_10"
					name="zipCode"
					label={lang.zipCode}
					value={companyAddress.zipCode}
					onChange={(value, name) => onInputChange(value, name)}
					autoComplete="off"
					spellCheck="false"
					variant="outlined-rounded"
				/> */}

				{/* <div className="col-xs-10 u_mb_10">
					<div className="customer-edit-city-select">
						<SelectInputComponent
							name="indiaStateId"
							allowCreate={true}
							notAsync={true}
							// options={{
							// 	labelKey: 'label',
							// 	valueKey: 'value',
							// 	matchProp: 'label',
							// 	placeholder: 'State',
							// 	handleChange: (option) => onCityChange(option && option.value),
							// }}
							value={props.accountData.indiaStateId}
							//loadedOptions={cityOptions}
							//onChange={(value) => onCityChange(value)}
							title="State"
							variant="outlined-rounded"
							disabled={true}
						/>
					</div>
				</div> */}

				{/* <TextInputExtendedComponent
					customWrapperClass="col-xs-6 u_mb_10"
					name="phone"
					label={lang.phone}
					value={mobile}
					onChange={(value, name) => onInputChange(value, name)}
					autoComplete="off"
					spellCheck="false"
					variant="outlined-rounded"
					formatType="phone"
					disabled={true}
				/> */}

				<TextInputExtendedComponent
					customWrapperClass="col-xs-6 u_mb_40"
					name="gstNumber"
					label={resources.str_gstNumber}
					value={companyAddress.gstNumber}
					onChange={(value, name) => onInputChange(value, name)}
					autoComplete="off"
					spellCheck="false"
					variant="outlined-rounded"
				/>
				<TextInputExtendedComponent
					customWrapperClass="col-xs-6 u_mb_40"
					name="cinNumber"
					label={resources.str_cinNumber}
					value={companyAddress.cinNumber}
					onChange={(value, name) => onInputChange(value, name)}
					autoComplete="off"
					spellCheck="false"
					variant="outlined-rounded"
				/>
			</div>
		</React.Fragment>
	);
};

export default UserWizardAccountDataCompoment;
