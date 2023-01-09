import React, { Component } from 'react';
import { formatCurrency } from 'helpers/formatCurrency';
import { convertMinutesToTimeString } from 'helpers/timetracking';

class ListAdvancedCustomHeaderComponent extends Component {
	constructor(props) {
		super(props);

		this.state = {
			ascSort: false,
			descSort: false,
			isFilterActive: props.column && props.column.isFilterActive(),
		};

		props.api.addEventListener('filterChanged', this.onFilterChanged.bind(this));
		props.column.addEventListener('filterChanged', this.onFilterChanged.bind(this));
		props.column.addEventListener('sortChanged', this.onSortChanged.bind(this));
	}

	componentDidMount() {
		this.onSortChanged();
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	onFilterChanged() {
		setTimeout(() => {
			if (!this.isUnmounted) {
				this.setState({
					isFilterActive: this.props.column.isFilterActive(),
				});
			}
		}, 10);
	}

	onMenuClick() {
		this.props.showColumnMenu(this.menuButton);
	}

	onMenuClicked() {
		this.props.showColumnMenu(this.menuButton);
	}

	onSortChanged() {
		this.setState({
			ascSort: this.props.column.isSortAscending(),
			descSort: this.props.column.isSortDescending(),
		});
	}

	onSortRequested(event) {
		if (!this.isUnmounted) {
			this.props.setSort(this.props.column.isSortAscending() ? 'desc' : 'asc', event.shiftKey);
		}
	}

	render() {
		const { ascSort, descSort, isFilterActive } = this.state;

		const calculateHeaderSum =
			this.props.column.userProvidedColDef.customProps &&
			this.props.column.userProvidedColDef.customProps.calculateHeaderSum;

		const calculateHeaderSumType =
			this.props.column.userProvidedColDef.customProps &&
			this.props.column.userProvidedColDef.customProps.calculateHeaderSumType;

		let headerSum = 0;

		if (calculateHeaderSum && this.props.api.getModel().rowsToDisplay) {
			this.props.api.getModel().rowsToDisplay.forEach((row) => {
				if (row.data && row.data.hasOwnProperty(this.props.column.colId) && row.data[this.props.column.colId]) {
					headerSum += parseFloat(row.data[this.props.column.colId]);
				}
			});
		}

		return (
			<div className="ag-cell-label-container" role="presentation">
				<span className="ag-cell-grab-icon icon icon-grab2"></span>

				{this.props.enableMenu ? (
					<React.Fragment>
						<span
							ref={(menuButton) => {
								this.menuButton = menuButton;
							}}
							onClick={this.onMenuClicked.bind(this)}
							data-ref="eMenu"
							className="ag-header-icon ag-header-cell-menu-button"
						>
							<span className="icon icon-filter"></span>
						</span>
						<span
							data-ref="eFilter"
							className={`icon icon-filter ${isFilterActive ? '' : 'ag-hidden'}`}
						></span>
					</React.Fragment>
				) : null}

				{calculateHeaderSum ? (
					<span
						className="ag-header-cell-amount"
						onClick={this.onSortRequested.bind(this)}
						onTouchEnd={this.onSortRequested.bind(this)}
					>
						<span className="icon icon-sum_sign"></span>{' '}
						<span className="amount">
							{calculateHeaderSumType === 'time'
								? convertMinutesToTimeString(headerSum)
								: calculateHeaderSumType === 'effort'
								? headerSum
								: formatCurrency(headerSum)}
						</span>
					</span>
				) : null}

				<div
					data-ref="eLabel"
					className="ag-header-cell-label"
					role="presentation"
					onClick={this.onSortRequested.bind(this)}
					onTouchEnd={this.onSortRequested.bind(this)}
				>
					<span data-ref="eText" className="ag-header-cell-text" role="columnheader">
						{this.props.displayName}
					</span>

					{this.props.enableSorting ? (
						<React.Fragment>
							{ascSort ? (
								<span data-ref="eSortAsc" className="ag-header-icon ag-sort-ascending-icon">
									<span className="ag-icon ag-icon-asc"></span>
								</span>
							) : null}

							{descSort ? (
								<span data-ref="eSortDesc" className="ag-header-icon ag-sort-descending-icon">
									<span className="ag-icon ag-icon-desc"></span>
								</span>
							) : null}
						</React.Fragment>
					) : null}
				</div>
			</div>
		);
	}
}

export default ListAdvancedCustomHeaderComponent;
