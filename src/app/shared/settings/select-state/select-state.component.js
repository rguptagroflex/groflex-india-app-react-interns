import React from "react";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import { connect } from "react-redux";
import { fetchStateList } from "redux/ducks/countryState/stateList";

import TextInputErrorComponent from "shared/inputs/text-input/text-input-error.component";

class SelectStateInputComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			indiaState: {
				id: this.props.stateId || "",
				stateName: "",
			},
		};
	}

	componentDidMount() {
		const { stateListData } = this.props;
		if (stateListData && stateListData.length === 0) {
			this.props.fetchStateList();
		}
	}

	getStateOptions() {
		const { resources, disabled } = this.props;
		return {
			loadOptions: (input, callback) => {
				callback(null, {
					options: this.props.stateListData,
					complete: true,
				});
			},
			searchable: true,
			clearable: false,
			backspaceRemoves: false,
			labelKey: "stateName",
			valueKey: "id",
			placeholder: resources.str_selectState,
			handleChange: (option) => this.handleOnChange(option),
			openOnFocus: true,
			disabled: disabled,
		};
	}

	handleOnChange(value) {
		let { indiaState } = this.state;
		if (!value) {
			indiaState = null;
		} else {
			indiaState = {
				id: value.id,
				stateName: value.stateName,
			};
		}
		this.props.onStateChanged(indiaState);
		this.setState({ indiaState });
	}

	handleBlur(evt) {
		const { value } = this.state;
		this.setState({ className: "selectInput" });
		if (this.props.onBlur) {
			this.props.onBlur(evt, value);
		}
	}

	render() {
		const { stateListData, title, errorMessage, disabled } = this.props;
		const { indiaState } = this.state;
		return (
			<div className={`${errorMessage ? "selectInput-invalid" : ""}`}>
				{stateListData.length !== 0 ? (
					<SelectInputComponent
						name="state"
						title={title}
						allowCreate={false}
						value={indiaState && indiaState.id}
						options={this.getStateOptions()}
						onBlur={this.handleBlur.bind(this)}
					/>
				) : null}
				<TextInputErrorComponent visible={!!errorMessage} errorMessage={errorMessage} />
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	const { stateListData } = state.countryState.stateList;
	return {
		resources,
		stateListData,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		fetchStateList: () => {
			dispatch(fetchStateList());
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(SelectStateInputComponent);
