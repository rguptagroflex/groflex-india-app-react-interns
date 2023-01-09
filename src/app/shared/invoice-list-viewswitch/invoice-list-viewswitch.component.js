import React from 'react';

class InvoiceListViewswitchComponent extends React.Component {
	render() {
		const { isKanbanActive } = this.props;

		return (
			<div className="invoice-list-viewswitch-component">
				<div className="invoice-list-viewswitch-text text-medium u_mr_6">Ansicht:</div>

				<div
					className="switch-icons"
					onClick={() => {
						this.props.onClick && this.props.onClick();
					}}
				>
					<div className={`icon icon-kanban ${isKanbanActive ? 'active' : ''}`}></div>
					<div className={`icon icon-list ${!isKanbanActive ? 'active' : ''}`}></div>
				</div>
			</div>
		);
	}
}

export default InvoiceListViewswitchComponent;
