import React from 'react';
import moment from 'moment';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import DateInputComponent from 'shared/inputs/date-input/date-input.component';
import SelectDatesValue from 'enums/select-dates-value.enum';
import { isNil } from 'helpers/isNil';

const dateOptionCustomLabel = 'Benutzerdefiniert';

const dateOptions = [
	{ label: 'Heute', value: SelectDatesValue.TODAY },
	{ label: 'Morgen', value: SelectDatesValue.TOMORROW },
	{ label: 'In einer Woche', value: SelectDatesValue.WEEK },
	{ label: 'In einem Monat', value: SelectDatesValue.MONTH },
	{ label: dateOptionCustomLabel, value: SelectDatesValue.CUSTOM }
];

class SelectDatesInput extends React.Component {
	constructor(props) {
		super(props);

		this.dateSelectOptions = {
			clearable: false,
			searchable: false,
			labelKey: 'label',
			valueKey: 'value',
			matchProp: 'label',
			handleChange: date => {
				let selectedDatePrev = date;

				if (date.value === SelectDatesValue.CUSTOM) {
					selectedDatePrev = this.state.selectedDate;
				}

				this.setState({ selectedDate: date, selectedDatePrev }, () => {
					this.onChange();

					if (date.value === SelectDatesValue.CUSTOM) {
						if (this.refs.customDatePickerInput) {
							this.refs.customDatePickerInput.handleLabelClick();
						}
					}
				});
			}
		};

		this.state = {
			disabled: !!props.disabled,
			initialSelectedDate: isNil(props.defaultValue) ? dateOptions[1] : props.defaultValue,
			selectedDate: isNil(props.defaultValue) ? dateOptions[1] : props.defaultValue,
			selectedDatePrev: null,
			dateCustom: null,
			resetPicker: false
		};
	}

	componentDidMount() {
		this.onChange(true);
	}

	componentWillReceiveProps(props) {
		if (props.hasOwnProperty('disabled')) {
			this.setState({
				disabled: props.props
			});
		}
	}

	componentWillUnmount() {
		dateOptions[dateOptions.length - 1].label = dateOptionCustomLabel;
	}

	onChange(isInit) {
		const { selectedDate, dateCustom } = this.state;
		let outputDate = null;

		switch (selectedDate.value) {
			case SelectDatesValue.TODAY:
				outputDate = moment();
				break;

			case SelectDatesValue.TOMORROW:
				outputDate = moment().add(1, 'days');
				break;

			case SelectDatesValue.WEEK:
				outputDate = moment().add(7, 'days');
				break;

			case SelectDatesValue.MONTH:
				outputDate = moment().add(1, 'months');
				break;

			case SelectDatesValue.CUSTOM:
				outputDate = moment(dateCustom);
				break;
		}

		if (isInit) {
			this.props.onInit && this.props.onInit(outputDate);
		} else {
			this.props.onChange && this.props.onChange(outputDate);
		}
	}

	reset() {
		this.setState(
			{
				initialSelectedDate: isNil(this.props.defaultValue) ? dateOptions[1] : this.props.defaultValue,
				selectedDate: isNil(this.props.defaultValue) ? dateOptions[1] : this.props.defaultValue,
				selectedDatePrev: null,
				dateCustom: null
			},
			() => {
				dateOptions[dateOptions.length - 1].label = dateOptionCustomLabel;

				this.setState(
					{
						resetPicker: true
					},
					() => {
						this.setState({
							resetPicker: false
						});
					}
				);
			}
		);
	}

	render() {
		const { children, useChildrenAsLabel } = this.props;
		const { disabled, selectedDate, selectedDatePrev, resetPicker } = this.state;

		return (
			<div className="select-dates-input-wrapper">
				<div className="date-custom-input">
					{resetPicker ? null : (
						<DateInputComponent
							ref="customDatePickerInput"
							required={true}
							minDate={new Date()}
							name="date"
							dataQsId="create-todo-customDate"
							value={null}
							onChange={(name, value) => {
								dateOptions[dateOptions.length - 1].label = value;

								this.setState(
									{
										dateCustom: moment(value, 'DD.MM.YYYY').toDate()
									},
									() => {
										this.onChange();
									}
								);
							}}
							onClose={value => {
								let selectedDate = this.state.selectedDate;
								const dateCustom = value ? moment(value, 'DD.MM.YYYY').toDate() : null;

								if (!value) {
									selectedDate = selectedDatePrev || this.state.initialSelectedDate;

									this.setState(
										{
											dateCustom,
											selectedDate
										},
										() => {
											this.onChange();
										}
									);
								}
							}}
						/>
					)}
				</div>

				<div className="date-select">
					<div className={`${useChildrenAsLabel ? 'hidden-select-dates-input' : ''}`}>
						<SelectInputComponent
							notAsync={true}
							loadedOptions={dateOptions}
							value={selectedDate}
							options={this.dateSelectOptions}
							disabled={disabled}
							variant={'outlined'}
							dataQsId="create-todo-selectDate"
						/>
					</div>

					{useChildrenAsLabel ? <div className="custom-label">{children}</div> : null}
				</div>
			</div>
		);
	}
}

export default SelectDatesInput;
