import React from "react";
import CheckboxInputComponent from "shared/inputs/checkbox-input/checkbox-input.component";
import LinesEllipsis from "react-lines-ellipsis";
import ListAdvancedComponent from "../list-advanced/list-advanced.component";

class ListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			title: this.props.title || null,
			clickable: !!this.props.clickable,
			rowCallback: this.props.rowCallback || null,
			columns: this.props.columns || [],
			columnCallback: this.props.columnCallback || null,
			expandable: !!this.props.expandable,
			expandableHeight: this.props.expandableHeight || "200px",
			selectable: !!this.props.selectable,
			selectedAllCallback: this.props.selectedAllCallback || null,
			selectedCallback: this.props.selectedCallback || null,
			allSelected: !!this.props.allSelected,
			sortable: !!this.props.sortable,
			rows: this.props.rows || [],
			placeholderRow: this.props.placeholderRow || null,
			tableId: this.props.tableId || "",
			emptyFallbackElement: this.props.emptyFallbackElement || null,
		};
	}

	componentWillReceiveProps(props) {
		this.setState({
			title: props.title || null,
			clickable: !!props.clickable,
			rowCallback: props.rowCallback || null,
			columns: props.columns || [],
			columnCallback: props.columnCallback || null,
			expandable: !!props.expandable,
			expandableHeight: props.expandableHeight || "200px",
			selectable: !!props.selectable,
			selectedAllCallback: props.selectedAllCallback || null,
			selectedCallback: props.selectedCallback || null,
			allSelected: !!props.allSelected,
			sortable: !!props.sortable,
			rows: props.rows || [],
			placeholderRow: props.placeholderRow || null,
			tableId: props.tableId || "",
			emptyFallbackElement: props.emptyFallbackElement || null,
		});
	}

	render() {
		const columns = [];
		const { resources } = this.props;

		if (this.state.selectable) {
			columns.push(
				<td className="list-table-head-cell list-table-cell column-selectable" key={`column-selectable`}>
					<CheckboxInputComponent
						checked={this.state.allSelected}
						onChange={(checked) => this.onToggleSelectAll(checked)}
					/>
				</td>
			);
		}

		this.state.columns.forEach((column, index) => {
			const columnStyle = {
				// width: column.width || 'auto',
				width: index === 4 ? "28%" : "18%",
				minWidth: column.minWidth || "0",
				textAlign: column.align || "left",
			};
			const customStyle = column.headStyle;
			columns.push(
				<td
					className={`list-table-head-cell list-table-cell ${
						this.state.sortable && !column.notSortable ? "column-sortable" : ""
					} ${!column.notSortable && column.sorted ? "column-sorted" : ""}`}
					key={`${this.state.tableId}-column-${index}`}
					onClick={() => this.handleColumnClick(column)}
					style={customStyle || columnStyle}
				>
					{/* {column.title} */}
					{resources.columnHeader[column.resourceKey]}
					{this.state.sortable && !column.notSortable ? (
						<div className={`icon ${column.sorted === "desc" ? "icon-sort_down" : "icon-sort_up"}`} />
					) : null}
				</td>
			);
		});

		const rows = [];
		let count = 0;
		this.state.rows.forEach((row, rowIndex) => {
			const cells = [];
			const rowStyle = row.style || null;

			if (this.state.selectable) {
				cells.push(
					<td
						className={`list-table-cell cell-selectable ${row.selected ? "visible" : ""}`}
						key={`selectable-checkbox-column-${rowIndex}`}
					>
						<CheckboxInputComponent
							checked={row.selected}
							onChange={(checked) => this.onToggleSelect(row.id, checked)}
						/>
					</td>
				);
			}

			if (row.cells) {
				row.cells.forEach((cell, index) => {
					const column = this.state.columns[index];
					const ellipsis = column && column.ellipsis;

					count++;
					const clickable = this.state.columns[index] && !this.state.columns[index].notClickable;
					const cellStyle = {
						textAlign: this.state.columns[index] && this.state.columns[index].align,
					};

					const subValueStyle =
						cell.subValueStyle || (this.state.columns[index] && this.state.columns[index].subValueStyle);
					const valueStyle =
						cell.valueStyle || (this.state.columns[index] && this.state.columns[index].valueStyle);
					let subCell = null;
					if (cell.subValue) {
						subCell = (
							<div
								className="list-table-cell-subvalue"
								key={`${this.state.tableId}-cell-subvalue-${count}`}
								style={subValueStyle || cellStyle}
							>
								{cell.subValue}
							</div>
						);
					}
					cells.push(
						<td
							className="list-table-cell"
							onClick={(evt) => this.handleRowClick(clickable, row.id, row, evt)}
							key={`${this.state.tableId}-cell-${count}`}
							style={valueStyle || cellStyle}
						>
							{cell.value && ellipsis ? <LinesEllipsis text={cell.value} {...ellipsis} /> : cell.value}
							{subCell && ellipsis ? <LinesEllipsis text={subCell} {...ellipsis} /> : subCell}
						</td>
					);
				});
			}

			const displayElement = (
				<tr
					className={`list-table-row ${row.additionalClass || ""}`}
					style={rowStyle}
					key={`${this.state.tableId}-row-${rowIndex}`}
				>
					{cells}
				</tr>
			);

			rows.push(displayElement);

			if (row.expanded) {
				rows.push(
					<tr
						className={`list-table-row list-table-row-expanded`}
						key={`${this.state.tableId}-row-expanded-${rowIndex}`}
					>
						<td
							className="list-table-cell no-border"
							style={{ height: this.state.expandableHeight }}
							colSpan={cells.length}
						>
							<div className={`list-table-row-expanded-content`}>
								{row.expandedContent}
								<div
									onClick={() => this.handleRowExpand(row, true)}
									className="icon icon-close list-table-row-expanded-close"
								/>
							</div>
						</td>
					</tr>
				);
			}
		});

		let fallbackContent = null;
		if (rows.length === 0) {
			if (this.state.emptyFallbackElement) {
				fallbackContent =
					rows.length > 0 ? null : <div className="list-fallback">{this.state.emptyFallbackElement}</div>;
			}

			let count = 0;
			const cells = [];

			if (this.state.placeholderRow && this.state.placeholderRow.cells) {
				this.state.placeholderRow.cells.forEach((cell, index) => {
					count++;
					const cellStyle = { textAlign: this.state.columns[index] && this.state.columns[index].align };
					let subCell = null;
					if (cell.subValue) {
						subCell = (
							<div
								className="list-table-cell-subvalue"
								key={`${this.state.tableId}-cell-subvalue-${count}`}
								style={cellStyle}
							>
								{cell.subValue}
							</div>
						);
					}
					cells.push(
						<td className="list-table-cell" key={`${this.state.tableId}-cell-${count}`} style={cellStyle}>
							{cell.value}
							{subCell}
						</td>
					);
				});
			}

			rows.push(
				<tr className="list-table-row list-table-placeholder-row" key={`${this.state.tableId}-row-0`}>
					{cells}
				</tr>
			);
		}

		const tableHead = <tr className="list-table-head list-table-row">{columns}</tr>;

		return (
			<div className="list-component">
				{this.state.title && <div className="text-h4">{this.state.title}</div>}

				<table
					className={`list-table ${this.state.clickable ? "list-table-hoverable" : ""} ${
						this.state.selectable ? "list-table-selectable" : ""
					}`}
				>
					<thead>{tableHead}</thead>
					<tbody>{rows}</tbody>
				</table>

				{fallbackContent}
			</div>
		);
	}

	onToggleSelectAll(isChecked) {
		if (this.state.selectedAllCallback) {
			this.state.selectedAllCallback(isChecked);
		}
	}

	onToggleSelect(id, isChecked) {
		if (this.state.selectedCallback) {
			this.state.selectedCallback(id, isChecked);
		}
	}

	handleRowExpand(row, close) {
		const { rows } = this.state;
		const newRows = rows.map((r) => {
			r.expanded = false;

			if (!close && r.id === row.id) {
				r.expanded = true;
			}

			return r;
		});
		this.setState({ rows: newRows });
	}

	handleRowClick(clickable, id, row, evt) {
		if (this.state.expandable) {
			this.handleRowExpand(row);
		}
		if (!clickable) {
			return;
		}
		if (this.state.rowCallback && this.state.clickable) {
			this.state.rowCallback(id, row, evt.nativeEvent);
		}
	}

	handleColumnClick(column) {
		if (column.notClickable) {
			return;
		}
		if (this.state.columnCallback) {
			this.state.columnCallback(column);
		}
	}
}

export default ListComponent;
