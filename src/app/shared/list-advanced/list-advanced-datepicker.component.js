import React, { Component } from 'react';
import config from 'config';
import moment from 'moment';
import DateInputComponent from 'shared/inputs/date-input/date-input.component';

class ListAdvancedDatePickerComponent extends Component {
	constructor(props) {
		super(props);

		this.state = {
			date: null,
		};
	}

	formatAsString(value) {
		return moment(value).format(config.dateFormat.client);
	}

	getDate() {
		return this.state.date;
	}

	onDateChanged(selectedDate) {
		this.setState({ date: selectedDate }, this.props.onDateChanged);
	}

	setDate(date) {
		this.setState({ date }, () => {
			if (this.refs.customDatePickerInput) {
				this.refs.customDatePickerInput.setDate(date ? moment(date, config.dateFormat.client).toDate() : null);
			}
		});
	}

	render() {
		const { date } = this.state;

		return (
			<DateInputComponent
				ref="customDatePickerInput"
				name="date"
				allowClear={true}
				placeholder={moment().format(config.dateFormat.client)}
				value={date ? date.toISOString() : null}
				onChange={(name, value, date) => {
					this.onDateChanged(date ? moment(date, config.dateFormat.client).toDate() : null);
				}}
				onBlur={(newDate) => {
					if (date !== newDate) {
						this.onDateChanged(newDate ? moment(newDate, config.dateFormat.client).toDate() : null);
					}
				}}
			/>
		);
	}
}

export default ListAdvancedDatePickerComponent;
