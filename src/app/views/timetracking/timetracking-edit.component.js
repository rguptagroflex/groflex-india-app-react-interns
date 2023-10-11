import invoiz from "services/invoiz.service";
import React from "react";
import TopbarComponent from "shared/topbar/topbar.component";
import config from "config";
import accounting from "accounting";
import moment from "moment";
import { convertStringToTimeObject, isValid24HourTimeObject } from "helpers/timetracking";
import ChangeDetection from "helpers/changeDetection";
import CurrencyInputComponent from "shared/inputs/currency-input/currency-input.component";
import DateInputComponent from "shared/inputs/date-input/date-input.component";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import userPermissions from "enums/user-permissions.enum";

const changeDetection = new ChangeDetection();

const ZERO_TIMEOBJECT = {
	hour: 0,
	minute: 0,
	second: 0,
	millisecond: 0,
};

class TimetrackingEditComponent extends React.Component {
	constructor(props) {
		super(props);

		const { customers, customerId, timeTracking } = this.props;

		if (!timeTracking.id) {
			if (customerId) {
				timeTracking.customer = customers.find((customer) => customer.id === customerId);
			}

			timeTracking.timeType = config.timeTypes.FROM_TO;
		}

		this.state = {
			timeTracking,
			fromError: null,
			toError: null,
			hourMinError: null,
			hoursMinutes: "00:00",
		};
	}

	componentDidMount() {
		if (
			!invoiz.user.hasPermission(userPermissions.VIEW_TIMESHEET) &&
			!invoiz.user.hasPermission(userPermissions.UPDATE_TIMESHEET)
		) {
			invoiz.user.logout(true);
		}
		const { timeTracking } = this.state;

		setTimeout(() => {
			const original = JSON.parse(JSON.stringify(timeTracking));
			changeDetection.bindEventListeners();
			changeDetection.setModelGetter(() => {
				const current = JSON.parse(JSON.stringify(timeTracking));

				return {
					original,
					current,
				};
			});
		}, 0);
	}

	componentWillUnmount() {
		changeDetection.unbindEventListeners();
	}

	render() {
		const { customers, resources } = this.props;
		const { timeTracking, hoursMinutes, fromError, toError, hourMinError } = this.state;

		// const customerOptions = customers.map(customer => {
		// 	return { name: customer.name, value: customer.id, customer };
		// });

		const customerOptions = customers.reduce(function (filtered, customer) {
			if (customer.address.countryIso === `IN` || !customer.baseCurrency) {
				const filteredCustomer = { name: customer.name, value: customer.id, customer };
				filtered.push(filteredCustomer);
			}
			return filtered;
		}, []);
		const trackingTypeOptions = [
			{
				name: resources.str_fromTo,
				value: config.timeTypes.FROM_TO,
			},
			{
				name: resources.str_hoursMin,
				value: config.timeTypes.H_MIN,
			},
		];

		const saveDisabled =
			!timeTracking.customer ||
			!timeTracking.durationInMinutes ||
			(timeTracking.timeType === config.timeTypes.FROM_TO && (fromError || toError)) ||
			hourMinError;
		const topbar = (
			<TopbarComponent
				title={timeTracking.id ? resources.str_editRecordedTime : resources.str_recordTime}
				hasCancelButton={true}
				cancelButtonCallback={() => this.onCancel()}
				buttonCallback={(evt, button) => this.onTopbarButtonClick(button.action)}
				buttons={[
					{
						type: "primary",
						label: resources.str_toSave,
						disabled: saveDisabled,
						buttonIcon: "icon-check",
						action: "save",
						dataQsId: "timetracking-topbar-button-save",
					},
				]}
			/>
		);

		const timeInputs =
			timeTracking.timeType === config.timeTypes.FROM_TO ? (
				<div className="row no-margin-bottom">
					<div className="col-xs-6">
						<TextInputExtendedComponent
							name="timeFrom"
							errorMessage={fromError}
							dataQsId="timetracking-edit-from"
							value={timeTracking.timeStart}
							label={resources.str_from}
							onBlur={(t, value) => this.onTimeChange(true, value)}
						/>
					</div>

					<div className="col-xs-6">
						<TextInputExtendedComponent
							name="timeTo"
							errorMessage={toError}
							dataQsId="timetracking-edit-to"
							value={timeTracking.timeEnd}
							label={resources.str_to}
							onBlur={(t, value) => this.onTimeChange(false, value)}
						/>
					</div>
				</div>
			) : (
				<div className="row">
					<div className="col-xs-12">
						<TextInputExtendedComponent
							name="hoursMinutes"
							dataQsId="timetracking-edit-hoursMinutes"
							errorMessage={hourMinError}
							value={hoursMinutes}
							label={resources.str_hoursMin}
							onBlur={(t, value) => this.onHoursMinutesChange(value)}
						/>
					</div>
				</div>
			);

		// console.log(timeTracking.customer, "hoursMinutes");
		return (
			<div className="timetracking-edit-component-wrapper">
				{topbar}

				<div className={`box wrapper-has-topbar-with-margin`}>
					<h4 className="time-tracking-title">
						{timeTracking.customer ? "Edit recorded time" : "Record time"}
					</h4>
					<div className="divider" />
					<div className="row">
						<div className="timetracking-edit-customer col-xs-6">
							<SelectInputComponent
								name="customer"
								notAsync={true}
								options={{
									clearable: false,
									searchable: true,
									labelKey: "name",
									valueKey: "value",
									handleChange: (option) => {
										if (!option) return;
										this.onCustomerChange(option.customer);
									},
								}}
								title={resources.str_customer}
								value={(timeTracking.customer && timeTracking.customer.id) || null}
								loadedOptions={customerOptions}
								dataQsId="timetracking-edit-customer"
							/>
						</div>
						<div className="col-xs-6">
							<div className="row">
								<div className="col-xs-6">
									<DateInputComponent
										label={resources.str_chooseDate}
										placeholder="TT.MM.JJJJ"
										name="date"
										dataQsId="timetracking-edit-date"
										value={timeTracking.date}
										onChange={(name, value) => {
											this.onDateChange(value);
										}}
									/>
								</div>
								<div className="col-xs-6">
									<CurrencyInputComponent
										name="pricePerHour"
										dataQsId="timetracking-edit-pricePerHour"
										value={timeTracking.pricePerHour}
										selectOnFocus={true}
										onBlur={(value) => this.onPriceChange(value)}
										label={resources.str_hourlyRateNet}
										willReceiveNewValueProps={true}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="row">
						<div className="timetracking-edit-type col-xs-6">
							<SelectInputComponent
								name="timeType"
								notAsync={true}
								options={{
									clearable: false,
									searchable: false,
									labelKey: "name",
									valueKey: "value",
									handleChange: (option) => this.onTimetypeChange(option.value),
								}}
								title={resources.str_type}
								value={timeTracking.timeType || config.timeTypes.FROM_TO}
								loadedOptions={trackingTypeOptions}
								dataQsId="timetracking-edit-timeType"
							/>
						</div>
						<div className="col-xs-6">{timeInputs}</div>
					</div>

					<div className="row no-margin-bottom">
						<div className="col-xs-12">
							<div className="textarea">
								<label className="textarea_label">{resources.str_jobDescription}</label>
								<textarea
									data-qs-id="timetracking-edit-notes"
									className="textarea_input"
									rows="4"
									value={timeTracking.taskDescription}
									onChange={(event) => {
										const { timeTracking } = this.state;
										timeTracking.taskDescription = event.target.value;
										this.setState({ timeTracking });
									}}
								/>
								<span className="textarea_bar" />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	onDateChange(value) {
		const { timeTracking } = this.state;

		const setFormattedDateTime = function (date, dateTime) {
			return moment(date, config.dateFormat.client)
				.add({
					hour: moment(dateTime).get("hour"),
					minute: moment(dateTime).get("minute"),
				})
				.format(config.datetimeFormat.api);
		};

		timeTracking.startDate = setFormattedDateTime(value, timeTracking.startDate);
		timeTracking.endDate = setFormattedDateTime(value, timeTracking.endDate);

		this.setState({ timeTracking });
	}

	onPriceChange(value) {
		const { timeTracking } = this.state;
		value = value.toString().replace(/-/gi, "");
		// value = accounting.unformat(value, ',');
		value = accounting.unformat(value, config.currencyFormat.decimal);
		timeTracking.pricePerHour = value;
		this.setState({ timeTracking });
	}

	onHoursMinutesChange(value) {
		const { timeTracking } = this.state;
		const { resources } = this.props;
		const timeObj = convertStringToTimeObject(value);
		const minutes = timeObj.minute;
		timeTracking.durationInMinutes = timeObj.hour * 60 + minutes;
		timeTracking.startDate = moment().set(ZERO_TIMEOBJECT).format(config.datetimeFormat.api);
		timeTracking.endDate = moment().set(ZERO_TIMEOBJECT).format(config.datetimeFormat.api);

		this.setState({
			hourMinError: minutes > 59 ? resources.timeTracking.VALIDATION_TIMESTRING_FORMAT : null,
			hoursMinutes: value,
			timeTracking,
		});
	}

	onTimeChange(isStart, value) {
		const { timeTracking } = this.state;
		const { resources } = this.props;
		const timeObj = convertStringToTimeObject(value);
		const isValid = isValid24HourTimeObject(timeObj);
		let error = isValid ? null : resources.timeTracking.VALIDATION_DATETIME_FORMAT;

		const updateValue = isValid ? timeObj : ZERO_TIMEOBJECT;
		const formatted = moment(isStart ? timeTracking.startDate : timeTracking.endDate)
			.set(updateValue)
			.format(config.datetimeFormat.api);

		if (isValid) {
			const startDate = isStart ? formatted : timeTracking.startDate;
			const endDate = !isStart ? formatted : timeTracking.endDate;

			if (moment(startDate).isAfter(endDate)) {
				error = resources.timeTracking.VALIDATION_DATETIME_COMPARISON;
			}
		}

		if (isStart) {
			timeTracking.startDate = formatted;
		} else {
			timeTracking.endDate = formatted;
		}

		const duration = moment.duration(moment(timeTracking.endDate).diff(moment(timeTracking.startDate)));
		const hours = Math.abs(parseInt(duration.asHours()));
		const minutes = Math.abs(parseInt(duration.asMinutes()) % 60);

		timeTracking.durationInMinutes = Math.abs(duration.asMinutes());

		this.setState({
			timeTracking,
			fromError: isStart ? error : null,
			toError: !isStart ? error : null,
			hoursMinutes: `${hours}:${minutes}`,
		});
	}

	onCustomerChange(customer) {
		const { timeTracking } = this.state;
		timeTracking.customer = { id: customer.id, name: customer.name };
		this.setState({ timeTracking });
	}

	onTimetypeChange(type) {
		const { timeTracking } = this.state;
		timeTracking.timeType = type;
		this.setState({ timeTracking });
		if (type === config.timeTypes.FROM_TO) {
			this.onTimeChange(true, timeTracking.timeStart);
			this.onTimeChange(false, timeTracking.timeEnd);
		}
	}

	onTopbarButtonClick(action) {
		switch (action) {
			case "save":
				this.onSave();
				break;
		}
	}

	onSave() {
		const { timeTracking } = this.state;

		timeTracking.priceTotal = (timeTracking.durationInMinutes / 60) * timeTracking.pricePerHour;
		timeTracking.startDate = new Date(timeTracking.startDate).toISOString();
		timeTracking.endDate = new Date(timeTracking.endDate).toISOString();
		if (timeTracking.timeType === config.timeTypes.H_MIN) {
			timeTracking.startDate = timeTracking.endDate;
		}
		const url = `${config.resourceHost}trackedTime${timeTracking.id ? `/${timeTracking.id}` : ""}`;
		const method = timeTracking.id ? "PUT" : "POST";

		invoiz
			.request(url, {
				auth: true,
				method,
				data: timeTracking,
			})
			.then(() => {
				invoiz.router.navigate(`/timetracking/billing/customer/${timeTracking.customer.id}`);
			});
	}

	onCancel() {
		window.history.back();
	}
}

export default TimetrackingEditComponent;
