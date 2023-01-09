import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import { format } from 'util';
// import moment from 'moment';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import ContactPerson from 'models/contact-person.model';
import CheckboxInputComponent from 'shared/inputs/checkbox-input/checkbox-input.component';
import DateInputComponent from 'shared/inputs/date-input/date-input.component';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import { formatApiDate } from 'helpers/formatDate';
import NumberInputComponent from 'shared/inputs/number-input/number-input.component';

class EditContactPersonModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			contactPerson: this.props.contactPerson || new ContactPerson(),
			salutations: this.props.salutations || [],
			titles: this.props.titles || [],
			errorMessageMobile: '',
			errorMessageEmail: ''
		};

		this.isEmailValid = false;
	}

	render() {
		const { contactPerson, salutations, titles, errorMessageMobile, errorMessageEmail } = this.state;
		const { jobTitles, resources } = this.props;

		const salutationOptions = salutations.map(title => {
			return { name: title, isExisting: true };
		});
		salutationOptions.push({
			name: 'Add salutation...',
			isDummy: true
		});
		const titleOptions = titles.map(title => {
			return { name: title, isExisting: true };
		});
		titleOptions.push({
			name: 'Add salutation...',
			isDummy: true
		});

		const jobOptions = jobTitles.map(job => {
			return { name: job };
		});

		return (
			<div>
				<div className="modal-base-close" onClick={() => this.onCancel()} />
				<div className="modal-base-headline">
					{contactPerson.id ? resources.customerContactEditContactHeading : resources.customerContactCreateContactHeading}
				</div>

				<div className="edit-contact-person-modal-content">
					<div className="edit-contact-person-details">
						<div className="row">
							<div className="col-xs-2">
								<SelectInputComponent
									title={resources.str_salutation}
									name="salutation"
									dataQsId={'contact-person-edit-salutation'}
									value={contactPerson.salutation}
									allowCreate={true}
									notAsync={true}
									options={{
										placeholder: resources.str_choose,
										labelKey: 'name',
										valueKey: 'name',
										handleChange: value => {
											if (!value || (value && !value.isDummy && value.name)) {
												this.onSalutationOrTitleChange(value, true);
											}
										}
									}}
									loadedOptions={salutationOptions}
								/>
							</div>
							<div className="col-xs-2">
								<SelectInputComponent
									title={resources.str_title}
									name="title"
									dataQsId={'contact-person-edit-title'}
									value={contactPerson.title}
									allowCreate={true}
									notAsync={true}
									options={{
										placeholder: resources.str_choose,
										labelKey: 'name',
										valueKey: 'name',
										handleChange: value => {
											if (!value || (value && !value.isDummy && value.name)) {
												this.onSalutationOrTitleChange(value, false);
											}
										}
									}}
									loadedOptions={titleOptions}
								/>
							</div>
							<div className="col-xs-4 edit-contact-person-names">
								<TextInputExtendedComponent
									name="firstName"
									dataQsId="contact-person-edit-firstName"
									value={contactPerson.firstName}
									label={resources.str_firstName}
									autoComplete={'new-password'}
									onChange={value => this.onContactPersonFieldChange('firstName', value)}
								/>
							</div>
							<div className="col-xs-4 edit-contact-person-names edit-contact-person-lastname-input">
								<TextInputExtendedComponent
									ref="contactPersonLastName"
									name="lastName"
									required={true}
									dataQsId="contact-person-edit-lastName"
									value={contactPerson.lastName}
									label={resources.str_surName}
									autoComplete={'new-password'}
									onChange={value => this.onContactPersonFieldChange('lastName', value)}
								/>
							</div>
						</div>

						<div className="row">
							<div className="col-xs-8">
								<h5 className="edit-contact-person-subheadline">{resources.str_communication}</h5>

								<div className="row">
									<div className="col-xs-12 edit-contact-person-email-input">
										<TextInputExtendedComponent
											name="email"
											ref="contactPersonEditEmailInput"
											dataQsId="contact-person-edit-email"
											value={contactPerson.email}
											label={resources.str_email}
											onBlur={(target, value) => this.onEmailBlur(value)}
											// onChange={value => this.onContactPersonFieldChange('email', value)}
											onChange={(value, name) => this.onInputChange(value, name)}
											errorMessage={errorMessageEmail}
										/>
									</div>
								</div>

								<div className="row">
									<div className="col-xs-6">
										<NumberInputComponent
											dataQsId="contact-person-edit-phone1"
											label={resources.str_phone}
											name={'phone1'}
											value={parseInt(contactPerson.phone1)}
											isDecimal={false}
											onChange={value => this.onContactPersonFieldChange('phone1', value)}
											defaultNonZero={true}
										/>
										{/* <TextInputExtendedComponent
											name="phone1"
											dataQsId="contact-person-edit-phone1"
											value={contactPerson.phone1}
											label={resources.str_phone + ' 1'}
											onChange={value => this.onContactPersonFieldChange('phone1', value)}
										/> */}
									</div>
									<div className="col-xs-6">
										<NumberInputComponent
											dataQsId="contact-person-edit-phone2"
											label={resources.str_phone + ' 2'}
											name={'phone2'}
											value={parseInt(contactPerson.phone2)}
											isDecimal={false}
											onChange={value => this.onContactPersonFieldChange('phone2', value)}
											defaultNonZero={true}
										/>
										{/* <TextInputExtendedComponent
											name="phone2"
											dataQsId="contact-person-edit-phone2"
											value={contactPerson.phone2}
											label={resources.str_phone + ' 2'}
											onChange={value => this.onContactPersonFieldChange('phone2', value)}
										/> */}
									</div>
								</div>

								<div className="row">
									<div className="col-xs-6 edit-contact-person-mobile-input">
										<NumberInputComponent
											dataQsId="contact-person-edit-mobile"
											ref="contactPersonEditMobileInput"
											label={resources.str_mobilePhone}
											name={'mobile'}
											maxLength="10"
											value={parseInt(contactPerson.mobile)}
											isDecimal={false}
											errorMessage={errorMessageMobile}
											onBlur={(value) => this.onMobileNumberBlur(value)}
											onChange={(value, name) => this.onInputChange(value, name)}
											defaultNonZero={true}
										/>
										{/* <TextInputExtendedComponent
											name="mobile"
											dataQsId="contact-person-edit-mobile"
											value={contactPerson.mobile}
											label={resources.str_mobilePhone}
											onChange={value => this.onContactPersonFieldChange('mobile', value)}
										/> */}
									</div>
									<div className="col-xs-6">
										<TextInputExtendedComponent
											name="fax"
											dataQsId="contact-person-edit-fax"
											value={contactPerson.fax}
											label={resources.str_fax}
											onChange={value => this.onContactPersonFieldChange('fax', value)}
										/>
									</div>
								</div>
							</div>

							<div className="col-xs-4">
								<h5 className="edit-contact-person-subheadline">{resources.customerContactFurtherData}</h5>

								<div className="row">
									<div className="col-xs-12 edit-contact-person-position-select">
										<SelectInputComponent
											title={resources.str_position}
											name="job"
											dataQsId={'contact-person-edit-job'}
											value={contactPerson.job}
											allowCreate={false}
											notAsync={true}
											options={{
												placeholder: resources.str_choose,
												labelKey: 'name',
												valueKey: 'name',
												handleChange: value =>
													this.onContactPersonFieldChange('job', value.name)
											}}
											loadedOptions={jobOptions}
										/>
									</div>
								</div>

								<div className="row">
									<div className="col-xs-12">
										<DateInputComponent
											label={resources.str_birthday}
											placeholder={resources.str_dateFormat}
											name="date"
											dataQsId="contact-person-edit-birthday"
											value={contactPerson.displayDate || null}
											onChange={(name, value) => {
												// value = moment(value, 'DD.MM.YYYY').format(config.dateFormat.api);
											    value = formatApiDate(value);
												this.onContactPersonFieldChange('birthday', value);
											}}
										/>
									</div>
								</div>

								<div className="row">
									<div className="col-xs-12 edit-contact-person-maincontact">
										<CheckboxInputComponent
											dataQsId="contact-person-edit-maincontact"
											name={'mainContact'}
											label={resources.str_primaryContact}
											checked={contactPerson.isMainContact}
											onChange={() => this.onCheckboxToggle()}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							dataQsId="edit-contact-person-cancel"
							type="cancel"
							callback={() => this.onCancel()}
							label={resources.str_abortStop}
						/>
					</div>

					<div className="modal-base-confirm">
						<ButtonComponent
							dataQsId="edit-contact-person-save"
							callback={() => this.onSave()}
							label={resources.str_finished}
							buttonIcon="icon-check"
						/>
					</div>
				</div>
			</div>
		);
	}

	onMobileNumberBlur(value) {
		if (value.toString().length !== 0) {
			const { resources } = this.props;
			if (value.length < 10 || !config.mobileNumberValidation.test(value)) {
				this.setState({ errorMessageMobile: resources.validMobileNumberError });
			} else {
				this.setState({ errorMessageMobile: '' });
			}
		}
	}

	onSave() {
		const { onSave } = this.props;
		const { contactPerson } = this.state;

		if (!contactPerson.lastName) {
			$('.edit-contact-person-lastname-input input').focus();
			setTimeout(() => {
				$('.edit-contact-person-lastname-input input').blur();
			});
		} else if (contactPerson.email && this.isEmailValid) {
			$('.edit-contact-person-email-input input').focus();
		} else {
			if (((contactPerson.mobile && contactPerson.mobile.toString().length > 0) && (contactPerson.mobile.toString().length < 10 || !config.mobileNumberValidation.test(contactPerson.mobile)))) {
				$('.edit-contact-person-mobile-input input').focus();
				return;
			}
			onSave && onSave(contactPerson);
		}
	}

	onCancel() {
		ModalService.close(true);
	}

	onCheckboxToggle() {
		const { contactPerson } = this.state;
		contactPerson.isMainContact = !contactPerson.isMainContact;
		this.setState({ contactPerson: new ContactPerson(contactPerson) });
	}

	onContactPersonFieldChange(key, value) {
		const { contactPerson } = this.state;
		contactPerson[key] = value;
		this.setState({ contactPerson: new ContactPerson(contactPerson) });
	}

	onInputChange(value, name) {
		const contactPerson = JSON.parse(JSON.stringify(this.state.contactPerson));
		if (name === 'mobile') {
			if (value.toString().length !== 0) {
				if (!config.mobileNumberValidation.test(value)) {
					const { resources } = this.props;
					this.setState({ errorMessageMobile: resources.validMobileNumberError });
				} else {
					this.setState({ errorMessageMobile: '' });
				}
			}
			contactPerson.mobile = value;
		}
		if (name === 'email') {
			const { resources } = this.props;
			if (!config.emailCheck.test(value)) {
				if (value.toString().length !== 0) {
					this.isEmailValid = true;
				}
				this.setState({ errorMessageEmail: resources.validEmailError });
			} else {
				this.setState({ errorMessageEmail: '' });
				this.isEmailValid = false;
			}
			contactPerson.email = value;
		}

		this.setState({ contactPerson });
	}

	onEmailBlur(value) {
		const { resources } = this.props;
		let { errorMessageEmail } = this.state;
		if (value.length !== 0 && !config.emailCheck.test(value)) {
			if (value.toString().length !== 0) {
				this.isEmailValid = true;
			}
			errorMessageEmail = resources.validEmailError;
			// this.refs['customerEditEmailInput'].setError(resources.validEmailError);
		} else {
			errorMessageEmail = '';
			this.isEmailValid = false;
		}
		this.setState({ errorMessageEmail });
	}

	onSalutationOrTitleChange(value, isSalutation) {
		const name = !value || !value.name ? '' : value.name;
		const { onSalutationsChange, onTitlesChange, resources } = this.props;
		const { contactPerson, salutations, titles } = this.state;

		if (isSalutation) {
			contactPerson.salutation = name;
		} else {
			contactPerson.title = name;
		}

		if (value && !value.isExisting) {
			const data = {};
			if (isSalutation) {
				salutations.push(value.name);
				data.salutations = salutations;
			} else {
				titles.push(value.name);
				data.titles = titles;
			}

			invoiz
				.request(`${config.resourceHost}setting/contact`, {
					auth: true,
					method: 'POST',
					data
				})
				.then(() => {
					invoiz.page.showToast({
						message: format(resources.tagAddSuccessMessage, isSalutation ? resources.str_salutation : resources.str_title, value.name)
					});
					if (isSalutation) {
						onSalutationsChange && onSalutationsChange(data.salutations);
					} else {
						onTitlesChange && onTitlesChange(data.titles);
					}
				});
		}

		this.setState({ contactPerson: new ContactPerson(contactPerson), salutations, titles });
	}
}

export default EditContactPersonModalComponent;
