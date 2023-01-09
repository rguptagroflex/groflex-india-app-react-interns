import React, { Component } from 'react';
import { ListAdvancedDefaultSettings } from 'helpers/constants';

export default class InlineActionCellRendererComponent extends Component {
	render() {
		const inlineActionType =
			this.props.column &&
			this.props.column.userProvidedColDef &&
			this.props.column.userProvidedColDef.customProps &&
			this.props.column.userProvidedColDef.customProps.inlineActionType;

		if (
			!this.props.value ||
			!inlineActionType ||
			(inlineActionType &&
				Object.keys(ListAdvancedDefaultSettings.CellInlineActionType).indexOf(
					inlineActionType.toUpperCase()
				) === -1)
		) {
			return null;
		}

		return (
			<React.Fragment>
				<div className="ag-cell-value">{this.props.value}</div>
				<div className={`ag-inline-action-btn ${inlineActionType}`}></div>
			</React.Fragment>
		);
	}
}
