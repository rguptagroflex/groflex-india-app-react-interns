import React, { Component } from 'react';

export default class ActionPopupCellRendererComponent extends Component {
	render() {
		if (!this.props.data) {
			return null;
		}

		const popupAnchorId = `ag-action-popup-cell-anchor-${this.props.data.id}`;

		return (
			!this.props.data.hideActionPopupCell && (
				<div className="ag-action-popup-cell">
					<div className="icon icon-menu" id={popupAnchorId}></div>
				</div>
			)
		);
	}
}
