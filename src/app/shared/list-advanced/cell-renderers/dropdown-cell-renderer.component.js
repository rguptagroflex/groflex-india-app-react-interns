import React, { Component } from 'react';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import invoiz from 'services/invoiz.service';

export default class SelectCellRendererComponent extends Component {
    constructor(props) {
		super(props);
		this.state = {
			actions: [	
			{id: '1', value: 'Outgoing'},
			{id: '2', value: 'Incoming'}
			],
			selectedAction: ''
		}
	  }
	  
	  handleOnChange (value) {
		let { selectedAction } = this.state;
		// if (!value) {
		// 	businessCategory = null;
		// } else {

		//}
		//this.props.onBusinessCategoryChanged(businessCategory, regStep);
		this.setState({ selectedAction: value });
	}

	handleBlur(evt) {
		const { value } = this.state;
		this.setState({ className: 'selectInput' });
		if (this.props.onBlur) {
			this.props.onBlur(evt, value);
		}
	}

      getOptions() {
		const { resources } = this.props;
		const {actions} = this.state;
		let optionsList = []  

		return {
			loadOptions: (input, callback) => {
				callback(null, {
					options: actions,
					complete: true
				});
			},
			searchable: true,
			clearable: false,
			backspaceRemoves: false,
			labelKey: 'value',
			valueKey: 'id',
			placeholder: `No values...`,
			handleChange: option => this.handleOnChange(option),
			openOnFocus: true
		};
      }

      render() {
		  const { actions, selectedAction } = this.state;
        return (
            <div className="inventory-manual-select">
					<SelectInputComponent
						name={`dropdown`}
						allowCreate={false}
						notAsync={true}
						value={selectedAction}
						options={{
							labelKey: 'value',
							valueKey: 'id',
							handleChange: value => {
								if (!value || (value && !value.isDummy && value.name)) {
									this.handleOnChange(value, true)
								}
							}
						}}
						loadedOptions={actions}
						// onBlur= {this.handleBlur.bind(this)}
						// disabled= {disabled}
					/>
            </div>
        )
      }
}
