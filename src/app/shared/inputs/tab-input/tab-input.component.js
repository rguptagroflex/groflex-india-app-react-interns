import React from 'react';
import PropTypes from 'prop-types';

class TabInputComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: this.props.items[0].value || '',
			checked: false
		};
	}

	componentWillMount() {
		if (this.props.value) {
			switch (this.props.value) {
				case this.props.items[0].value:
					this.setState({
						value: this.props.items[0].value,
						checked: false
					});
					return;
				case this.props.items[1].value:
					this.setState({
						value: this.props.items[1].value,
						checked: true
					});
					return;
			}
		}
	}

	handleLabelClick(e) {
		if (this.props.disabled) {
			return;
		}

		this.setState(
			{
				value: !this.state.checked ? this.props.items[1].value : this.props.items[0].value,
				checked: !this.state.checked
			},
			() => {
				if (this.props.onChange) {
					this.props.onChange(this.state.value);
				}
			}
		);
	}

	render() {
		let componentClass = `switchInput${this.props.componentClass ? ' ' + this.props.componentClass : ''}`;
		const label1 = this.props.items[0];
		const value1 = this.props.items[0].value;
		const label2 = this.props.items[1];
		const value2 = this.props.items[1].value;

		const { dataQsId } = this.props;

		if (this.props.disabled) {
			componentClass += ' switchInput-disabled';
		}

		return (
			<div className={componentClass}>
				<div
					className="switchInput_radioToggle"
					onClick={this.handleLabelClick.bind(this)}
					data-qs-id={dataQsId}
				>
					<input
						checked={this.state.value === value1}
						className="input switchInput_input"
						type="radio"
						value={this.props.items[0].value}
						readOnly={true}
					/>
					<label className="switchInput_label">{label1.label}</label>
					<input
						checked={this.state.value === value2}
						className="input switchInput_input"
						type="radio"
						value={this.props.items[1].value}
						readOnly={true}
					/>
					<label className="switchInput_label">{label2.label}</label>
					<a className={this.state.value === value1 ? '' : 'onLastRadioChecked'} />
				</div>
			</div>
		);
	}
}

TabInputComponent.propTypes = {
	value: PropTypes.string,
	label: PropTypes.string,
	items: PropTypes.array,
	disabled: PropTypes.bool
};

TabInputComponent.defaultProps = {
	value: '',
	label: '',
	items: [],
	disabled: false
};
export default TabInputComponent;
