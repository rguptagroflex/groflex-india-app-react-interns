import React from 'react';
import PropTypes from 'prop-types';
import TextInputLabelComponent from 'shared/inputs/text-input/text-input-label.component';

class CheckboxInputComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			checked: props.checked,
			focused: false
		};

		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
	}

	componentWillReceiveProps(props) {
		this.setState({
			checked: props.checked
		});
	}

	handleFocus() {
		if (!this.props.disabled) {
			this.setState({ focused: true });
		}
	}

	handleBlur() {
		if (!this.props.disabled) {
			this.setState({ focused: false });
		}
	}

	handleClick() {
		if (!this.props.disabled) {
			this.setState({ checked: !this.state.checked });
			this.props.onChange && this.props.onChange(!this.state.checked);
		}
	}

	handleKeyDown(e) {
		if (e.keyCode === 32 && this.state.focused) {
			e.preventDefault();
			this.setState({ checked: !this.state.checked });
			this.props.onChange && this.props.onChange(!this.state.checked);
		}
	}

	render() {
		const { disabled, name, label, labelClass, labelLink, labelLinkClass, link, dataQsId } = this.props;

		let labelStyle = 'checkbox';
		if (this.state.focused) {
			labelStyle += ' checkbox-focused';
		} else if (disabled) {
			labelStyle += ' checkbox-disabled';
		}

		const inputStyle = `checkbox_input${disabled ? ' checkbox-disabled' : ''}`;
		return (
			<div
				data-qs-id={dataQsId || ''}
				className="form_input"
				tabIndex="0"
				onFocus={this.handleFocus}
				onBlur={this.handleBlur}
				onKeyDown={this.handleKeyDown}
			>
				<label className={labelStyle} onMouseDown={this.handleClick}>
					<input
						ref={name}
						name={name}
						type="checkbox"
						className={inputStyle}
						checked={this.state.checked}
						readOnly={true}
						disabled={disabled}
					/>
					<span className="checkbox_visual" />
					<div style={{ display: 'flex' }}>
						<TextInputLabelComponent className={`checkbox_label ${labelClass || ''}`} text={label} />

						{labelLink && link ? (
							<a className={`checkbox_labelLink ${labelLinkClass || ''}`} target="_blank" href={link}>
								{labelLink}
							</a>
						) : null}
					</div>
				</label>
			</div>
		);
	}
}

CheckboxInputComponent.propTypes = {
	name: PropTypes.string.isRequired,
	label: PropTypes.string,
	checked: PropTypes.bool,
	disabled: PropTypes.bool
};

CheckboxInputComponent.defaultProps = {
	name: '',
	label: '',
	checked: false,
	disabled: false,
	onChange: function() {}
};

export default CheckboxInputComponent;
