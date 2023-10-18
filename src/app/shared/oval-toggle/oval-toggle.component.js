import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';

class OvalToggleComponent extends React.Component {
	toggle(silent) {
		if (!silent && this.props.onChange) {
			this.props.onChange(!this.props.checked);
		}
	}

	render() {
		const { labelLeft, labelText, newStyle, customClass } = this.props;
		const { checked } = this.props;
		const id = _.uniqueId('ovalToggle');

		const label = labelText ? <label htmlFor={id}>{labelText}</label> : null;

		return (
			<div 	style={{width:"100%"}} className={`ovalToggle toggleSwitch ${newStyle === true ? 'newStyle' : ''} ${customClass || ''}`}>
				{labelLeft && label}
				<div className={`toggleSwitch_switch${checked ? ' checked' : ''}`}>
					<input
						id={id}
						type="checkbox"
						onChange={(evt, params) => this.toggle(params)}
						checked={checked ? 'checked' : ''}
					/>
					<div
						className="toggleSwitch_slider toggleSwitch_slider-round"
						onClick={(evt, params) => this.toggle(params)}
					/>
				</div>
				{!labelLeft && label}
			</div>
		);
	}
}

OvalToggleComponent.propTypes = {
	onChange: PropTypes.func.isRequired,
	checked: PropTypes.bool,
	labelLeft: PropTypes.bool,
	labelText: PropTypes.string
};

export default OvalToggleComponent;
