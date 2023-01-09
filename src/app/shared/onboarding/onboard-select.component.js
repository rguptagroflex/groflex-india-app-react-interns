import React from 'react';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import { connect } from 'react-redux';
import { fetchRegistrationList } from 'redux/ducks/registrationOnboarding/registrationOnboardingValues';

import TextInputErrorComponent from 'shared/inputs/text-input/text-input-error.component';

class OnboardInputComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			businessCategory: {
				id: this.props.businessCategoryId || '',
				businessCategory: '',
				dropdownType: ''
			},
			regStep: this.props.regStep
		};
	}

	componentDidMount() {
		const { registrationListData, regStep, businessturnover, businesscategory, businesstype } = this.props;

		if ((businesstype && businesstype.length === 0) || (businessturnover && businessturnover.length === 0) || (businesscategory && businesscategory.length === 0)) {
			this.props.fetchRegistrationList();
		}
	}

	componentDidUpdate(prevProps) {

		if (this.props.regStep !== prevProps.regStep) {
			this.props.fetchRegistrationList();

		}
	}

	getOptions () {
		const { resources, regStep, businesscategory, businessturnover, businesstype } = this.props;

		let businessList = null;
		if (regStep === 'businesstype') {
			businessList = businesstype;
		} else if (regStep === 'businessturnover') {
			businessList = businessturnover;
		} else if (regStep === 'businesscategory') {
			businessList = businesscategory;
		}
		return {
			loadOptions: (input, callback) => {
				callback(null, {
					options: businessList,
					complete: true
				});
			},
			searchable: true,
			clearable: false,
			backspaceRemoves: false,
			labelKey: 'value',
			valueKey: 'id',
			placeholder: resources.str_businessSelectEmpty,
			handleChange: option => this.handleOnChange(option),
			openOnFocus: true
		};

	}

	handleOnChange (value) {
		let { businessCategory, regStep } = this.state;
		if (!value) {
			businessCategory = null;
		} else {
			businessCategory = {
				id: value.id,
				value: value.value,
				dropdownType: value.dropdownType
			};
		}
		this.props.onBusinessCategoryChanged(businessCategory, regStep);
		this.setState({ businessCategory });
	}

	handleBlur(evt) {
		const { value } = this.state;
		this.setState({ className: 'selectInput' });
		if (this.props.onBlur) {
			this.props.onBlur(evt, value);
		}
	}

	render() {
		const { regStep, businesscategory, businessturnover, businesstype, errorMessage, title, disabled } = this.props;
		const { businessCategory } = this.state;
		let businessList = null;
		if (regStep === 'businesstype') {
			businessList = businesstype;
		} else if (regStep === 'businessturnover') {
			businessList = businessturnover;
		} else if (regStep === 'businesscategory') {
			businessList = businesscategory;
		}
		return (

			<div className={`${errorMessage ? 'selectInput-invalid' : 'selectInput'}`}>
				{businessList.length !== 0 ? (
					<SelectInputComponent
						name={title}
						title={title}
						allowCreate={false}
						value={businessCategory && businessCategory.id}
						options={this.getOptions()}
						onBlur= {this.handleBlur.bind(this)}
						disabled= {disabled}
					/>
				) : null }
				<TextInputErrorComponent visible={!!errorMessage} errorMessage={errorMessage} />
			</div>


		);
	}
}

const mapStateToProps = state => {
	 const { resources } = state.language.lang;
	const { registrationListData, businesscategory, businessturnover, businesstype } = state.registrationOnboarding.registrationOnboardingValues;
	return {
		resources,
		registrationListData,
		businesscategory,
		businessturnover,
		businesstype
	};
};

const mapDispatchToProps = (dispatch, ownProps) => {
	return {
		fetchRegistrationList: () => {
			dispatch(fetchRegistrationList(ownProps.regStep));
		}
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(OnboardInputComponent);
