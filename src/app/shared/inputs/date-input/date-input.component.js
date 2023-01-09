import React from 'react';
import PropTypes from 'prop-types';
import config from 'config';
import moment from 'moment';
import Pikaday from 'pikaday';
import TextInputLabelComponent from 'shared/inputs/text-input/text-input-label.component';
import { getResource } from 'helpers/resource';
import { formatClientDate, formatApiDate } from 'helpers/formatDate';

const getWrapperClass = (state, props) => {
	const { inputStyle, leftLabel, hasBorder, noBorder } = props;

	if (leftLabel && hasBorder) {
		return 'input-boxBorder input-leftLabel';
	} else if (leftLabel && !hasBorder) {
		return 'input-leftLabel';
	} else if (!leftLabel && hasBorder) {
		return 'input-boxBorder';
	} else if (noBorder) {
		return 'dateInput-noBorder';
	}

	return inputStyle || '';
};

class DateInputComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			value: props.value,
			errorMessage: props.errorMessage,
			emptyMessage: getResource('mandatoryFieldValidation'),
			inputClass: ''
		};

		this.handleLabelClick = this.handleLabelClick.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
	}

	componentDidMount() {
		const { isRangeStart, isRangeEnd, rangeStart, rangeEnd } = this.props;
		let value = this.props.value;
		const {
			pikaday,
			// dateFormat: { client: clientFormat, api: apiFormat }
			 dateFormat: { client: clientFormat }
		} = config;

		this.setState({ isFocused: this.props.focused });

		this.picker = new Pikaday(
			Object.assign({}, pikaday, {
				i18n: {
					...pikaday.i18n,
					months: getResource('monthNames'),
					weekdays: getResource('weekdayNames'),
					weekdaysShort: getResource('weekdaysShort'),
					previousMonth: getResource('str_back'),
			        nextMonth: getResource('str_before')
				},
				yearRange: 25,
				field: this.refs.input,
				format: clientFormat,
				onSelect: this.handleSelect
			})
		);

		if ((isRangeStart || isRangeEnd) && rangeStart && rangeEnd) {
			this.picker.setStartRange(new Date(rangeStart));
			this.picker.setEndRange(new Date(rangeEnd));

			if (isRangeEnd) {
				this.picker.setMinDate(new Date(rangeStart));
			}
		}
		// if (moment(value, clientFormat).format(clientFormat) !== value) {
		// 	value = moment(value).format(clientFormat);
		// }
		if (formatClientDate(value, clientFormat) !== value) {
			value = formatClientDate(value, clientFormat);
		}
		// this.picker.setDate(moment(value, clientFormat).format(apiFormat));
		 this.picker.setDate(formatApiDate(value, clientFormat));
	}

	componentWillUnmount() {
		if (this.picker) {
			this.picker.destroy();
		}
		this.picker = null;
	}

	clean(value) {
		// return moment(value).format(config.dateFormat.client);
		return formatClientDate(value);
	}

	clear() {
		this.setValue(moment());
	}

	handleLabelClick(event) {
		this.picker.show();
	}

	handleSelect(date) {
		this.setValue(date);

		const { name, onChange, isRangeStart, isRangeEnd, onRangeChange } = this.props;
		const { value } = this.state;

		if (onChange) {
			onChange(name, value, date);
		}

		if ((isRangeStart || isRangeEnd) && onRangeChange) {
			onRangeChange(name, value, date);
		}
	}

	handleBlur(event) {
		const { value } = this.state;
		// sets value to oldValue if current value is undefined or empty
		if (!event.target.value || event.target.value === '') {
			// const oldValue = moment(value, 'DD.MM.YYYY');
			const oldValue = formatClientDate(value);
			this.setDate(oldValue);
		}
	}

	setDate(date) {
		const {
			// dateFormat: { client: clientFormat, api: apiFormat }
			dateFormat: { client: clientFormat }
		} = config;

		this.setValue(date);
		// this.picker.setDate(moment(date, clientFormat).format(apiFormat));
		this.picker.setDate(formatApiDate(date, clientFormat));
	}

	setValue(value) {
		this.setState({ value: this.clean(value) });
	}

	render() {
		const { name, placeholder, label, labelPosition, disabled, required, dataQsId } = this.props;

		const finalInputStyle = getWrapperClass(this.state, this.props);
		const disabledClassName = disabled ? 'u_disabled' : '';
		const labelPositionClass = labelPosition === 'above' ? 'dateInput_label-above' : '';

		return (
			<div className={`dateInput ${finalInputStyle}`} data-qs-id={dataQsId || ''}>
				<TextInputLabelComponent
					className={`dateInput_label ${labelPositionClass}`}
					text={label}
					onClick={this.handleLabelClick}
				/>
				<div className={`dateInput_wrapper ${disabledClassName}`}>
					<input
						ref="input"
						type="text"
						name={name}
						placeholder={placeholder}
						required={required}
						className="dateInput_input"
						autoComplete="off"
						spellCheck="false"
						onBlur={this.handleBlur}
					/>
				</div>
			</div>
		);
	}
}

DateInputComponent.propTypes = {
	value: PropTypes.string,
	name: PropTypes.string.isRequired,
	label: PropTypes.string,
	labelPosition: PropTypes.string,
	placeholder: PropTypes.string,
	required: PropTypes.bool,
	disabled: PropTypes.bool,
	isRangeStart: PropTypes.bool,
	isRangeEnd: PropTypes.bool,
	rangeStart: PropTypes.string,
	rangeEnd: PropTypes.string,
	onChange: PropTypes.func,
	onRangeChange: PropTypes.func
};

DateInputComponent.defaultProps = {
	value: '',
	name: '',
	label: '',
	labelPosition: 'above',
	placeholder: null,
	required: false,
	disabled: false,
	isRangeStart: false,
	isRangeEnd: false,
	rangeStart: '',
	rangeEnd: ''
};

export default DateInputComponent;
