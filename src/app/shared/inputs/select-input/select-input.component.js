import React from 'react';
import PropTypes from 'prop-types';
import Highlighter from 'react-highlight-words';
import { default as Select, AsyncCreatable, Async, Creatable } from 'react-select';
import { getResource } from 'helpers/resource';
import SVGInline from 'react-svg-inline';

import { default as VirtualizedSelect} from "react-virtualized-select";
class SelectInput extends React.Component {
	constructor(props) {
		super(props);

		const {
			options: { multi }
		} = props;

		this.state = {
			input: '',
			value: multi ? props.value || [] : props.value,
			className: 'selectInput'
		};
	}

	componentWillReceiveProps(newProps) {
		const { value } = newProps;
		const { value: currentValue } = this.state;
		if (value !== currentValue) {
			this.setState({ value });
		}
	}

	handleOnChange(option) {
		const {
			options: { multi, handleChange, valueKey }
		} = this.props;
		const valueProp = valueKey || 'value';

		const valueBefore = this.state.value;
		const newValue = option ? option[valueProp] : '';
		let value = newValue;

		if (option && option.isDummy) {
			value = '';
		}

		if (multi) {
			value = valueBefore;
			value.push(newValue);
		}
		this.setState({ value }, () => {
			handleChange && handleChange(option, valueBefore, this.props.inputId);
		});
	}

	handleFocus() {
		this.setState({ className: 'selectInput selectInput-active' });
		if (this.props.onFocus) {
			this.props.onFocus();
		}
	}

	handleBlur(evt) {
		const { value } = this.state;
		this.setState({ className: 'selectInput' });
		if (this.props.onBlur) {
			this.props.onBlur(evt, value);
		}
	}

	handleInputChange(input) {
		this.setState({ input });
		if (this.props.onInputChange) {
			this.props.onInputChange(input);
		}
		return input;
	}

	getSelectInput() {
		const { name } = this.props;
		return this.refs[name] || null;
	}

	render() {
		const {
			options,
			name,
			title,
			containerClass,
			allowCreate,
			disabled,
			notAsync,
			loadedOptions,
			dataQsId,
			noResultsText,
			loadingPlaceholder,
			icon
		} = this.props;
		const { className, value, input } = this.state;
		const { labelKey, getCustomLabelToHighlight } = options;
		const defaultOptions = {
			searchable: true,
			openOnFocus: true,
			closeOnSelect: true,
			placeholder: getResource('str_chooseUpperCase'),
			noResultsText: noResultsText || getResource('str_noMatches'),
			loadingPlaceholder: loadingPlaceholder || getResource('str_loadingPlaceholder'),
			clearValueText: getResource('str_removeSelection'),
			searchPromptText: '',
			multi: false,
			promptTextCreator: label => `${getResource('str_add')}... '${label}'`,
			onBlur: this.handleBlur.bind(this),
			onFocus: this.handleFocus.bind(this),
			onInputChange: this.handleInputChange.bind(this),
			optionRenderer: option => {
				// call function to get custom label if it exists
				const label = getCustomLabelToHighlight
					? getCustomLabelToHighlight(option)
					: option[labelKey || 'label'];
				return (
					// for highlighting matching text in options
					<div className={`${option.isDummy ? 'dummy' : ''}`}>
						<Highlighter
							autoEscape={true}
							searchWords={[input]}
							textToHighlight={label}
							highlightClassName="selectInputText-matched"
						/>
					</div>
				);
			}
		};

		// combine options
		const selectOptions = Object.assign({}, defaultOptions, options);
		let select;
		if (notAsync) {
			select = allowCreate ? (
				<Creatable
					value={value}
					options={loadedOptions}
					disabled={disabled}
					onChange={this.handleOnChange.bind(this)}
					{...selectOptions}
				/>
			) : (
				<Select
					ref={name}
					value={value}
					options={loadedOptions}
					disabled={disabled}
					onChange={this.handleOnChange.bind(this)}
					isOptionDisabled={(option) => option.disabled === true}
					{...selectOptions}
				/>
			);
		} else {
			select = allowCreate ? (
				<AsyncCreatable
					ref={name}
					value={value}
					disabled={disabled}
					onChange={this.handleOnChange.bind(this)}
					{...selectOptions}
				/>
				// <VirtualizedSelect 
				// // backspaceRemoves={false}
				// // labelKey='label'
				// loadOptions={options.loadOptions}
				// //minimumInput={1}
				// onChange={this.handleOnChange.bind(this)}
				// //onValueClick={this._goToGithubUser}
				// options={loadedOptions}
				// value={value}
				// //valueKey='value'
				// selectComponent={AsyncCreatable}
				// {...selectOptions}
				// />
			) : (
				<Async
					ref={name}
					value={value}
					disabled={disabled}
					onChange={this.handleOnChange.bind(this)}
					{...selectOptions}
				/>
			);
		}
		return (
			<div className={`${className} ${containerClass || ''}`} data-qs-id={dataQsId}>
				{ icon && <SVGInline svg={icon} className="input-icon" height="14px" width="14px" style={{}} /> }
				{select}
				<span className="selectInput_bar" />
				{title ? <label className="selectInput_label">{title}</label> : null}
			</div>
		);
	}
}

SelectInput.propTypes = {
	options: PropTypes.object.isRequired,
	disabled: PropTypes.bool
};

SelectInput.defaultProps = {
	value: '',
	options: {},
	allowCreate: true,
	disabled: false
};

export default SelectInput;
