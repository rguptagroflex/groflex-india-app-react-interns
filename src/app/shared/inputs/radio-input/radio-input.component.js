import React from 'react';
import PropTypes from 'prop-types';

class RadioInputComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			selectedValue: props.value
		};
	}

	handleItemClick(event) {
		const {
			target: { value }
		} = event;
		this.setState({ selectedValue: value }, () => {
			this.props.onChange(value);
		});
	}

	render() {
		const { wrapperClass, options, itemClass, name, dataQsId, useCustomStyle, disabled } = this.props;
		const { selectedValue } = this.state;

		const radioOptions = options.map((option, index) => {
			const { value, inputClass, label, labelClass, extraLabelClass, extraLabel, id, disabled } = option;
			const extraLabelEl = extraLabel ? (
				<span className={`radio_label ${extraLabelClass}`}>{extraLabel}</span>
			) : null;

			return useCustomStyle ? (
				<div className="radio-custom-wrapper" key={index}>
					<div className="radio-custom-circle-wrapper">
						<input
							id={`radio-input-${id || value}`}
							type="radio"
							name={name}
							value={value}
							className="radio-custom"
							checked={selectedValue === value}
							onClick={this.handleItemClick.bind(this)}
							readOnly={true}
							disabled={disabled}
						/>
						<span className="radio-custom-circle" />
					</div>
					<div className={`radio-custom-label-wrapper ${disabled ? 'disabled' : ''}`}>
						<label htmlFor={`radio-input-${id || value}`} data-qs-id={dataQsId || ''}>
							{label}
						</label>
					</div>
					{extraLabelEl}
				</div>
			) : (
				<label data-qs-id={dataQsId || ''} key={index} className={`radio_inputs ${itemClass || ''}`} id={value}>
					<input
						type="radio"
						name={name}
						value={value}
						className={inputClass}
						checked={selectedValue === value}
						onClick={this.handleItemClick.bind(this)}
						readOnly={true}
						disabled={this.props.disabled}
					/>
					<span id={id} className={`radio_label ${labelClass}`}>
						{label}
					</span>
					{extraLabelEl}
				</label>
			);
		});

		return <div className={`form_input radio ${wrapperClass || ''}`}>{radioOptions}</div>;
	}
}

RadioInputComponent.propTypes = {
	name: PropTypes.string,
	value: PropTypes.string,
	options: PropTypes.array,
	onChange: PropTypes.func.isRequired,
	itemClass: PropTypes.string,
	wrapperClass: PropTypes.string
};

RadioInputComponent.defaultProps = {
	name: '',
	value: '',
	options: [],
	itemClass: '',
	wrapperClass: ''
};

export default RadioInputComponent;
