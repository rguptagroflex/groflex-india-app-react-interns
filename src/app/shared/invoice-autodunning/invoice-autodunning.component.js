import React from 'react';
import OvalToggleComponent from 'shared/oval-toggle/oval-toggle.component';

class InvoiceAutodunningComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			checked: !!this.props.enabled
		};
	}

	componentWillReceiveProps(newProps) {
		this.setState({ checked: newProps.enabled });
	}

	render() {
		const { resources } = this.props;
		return (
			<div className="invoice-autodunning-component">
				<div className="invoice-autodunning-label">{resources.automRemainder}</div>
				<div className="invoice-autodunning-toggle">
					<OvalToggleComponent
						ref={`oval-toggle`}
						labelLeft
						onChange={value => this.handleChange(value)}
						checked={this.state.checked}
						labelText=""
						newStyle={true}
					/>
				</div>
			</div>
		);
	}

	handleChange(value) {
		if (this.props.onChange) {
			this.props.onChange(value);
		}
	}

	setChecked(value) {
		this.setState({ checked: !!value }, () => {
			this.refs['oval-toggle'].toggle(true);
		});
	}
}

export default InvoiceAutodunningComponent;
