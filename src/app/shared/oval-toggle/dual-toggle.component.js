import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';

class DualToggleComponent extends React.Component {
	toggle(silent) {
		if (!silent && this.props.onChange) {
			this.props.onChange(!this.props.checked);
		}
	}

	render() {
		const { checked, labelLeftText, labelRightText } = this.props;
		const id = _.uniqueId('dualSwitch')
		return (
	<div className="dualSwitchToggle">
			<label className="label-left">{labelLeftText}</label>
			<label className="dualSwitch">
			  <input type="checkbox" 	 
			  	id={id}					
			  	onChange={(evt, params) => this.toggle(params)}
	 			checked={checked ? 'checked' : ''}
			/>
  			<span className="slider round"></span>
			</label>
			<label className="label-right">{labelRightText}</label>
	</div>
		)
			

	}
}

DualToggleComponent.propTypes = {
	onChange: PropTypes.func.isRequired,
	checked: PropTypes.bool,
	labelLeftText: PropTypes.string,
	labelRightText: PropTypes.string
};

export default DualToggleComponent;
