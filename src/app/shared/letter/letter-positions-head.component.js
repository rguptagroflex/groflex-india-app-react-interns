import invoiz from 'services/invoiz.service';
import React from 'react';
import PropTypes from 'prop-types';
import PopoverComponent from 'shared/popover/popover.component';
import Direction from 'enums/direction.enum';
// import { formatDate, formatApiDate } from 'helpers/formatDate';
import { formatApiDate } from 'helpers/formatDate';
import moment from 'moment';
import config from 'config';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import ModalService from 'services/modal.service';

import EditColumnModal from 'shared/modals/edit-column.modal.component';

class LetterPositionsHeadComponent extends React.Component {
	constructor(props) {
		super(props);

		// const userRegisteredAt = formatDate(invoiz.user.registeredAt, 'YYYY-MM-DD', 'YYYY-MM-DD');
		const userRegisteredAt = formatApiDate(invoiz.user.registeredAt, config.dateFormat.api);
		const editableColumns = moment(new Date(userRegisteredAt)).isSameOrBefore(moment(new Date('2018-09-06')));
		this.state = {
			editableColumns,
			editingColumns: false,
			columns: props.columns,
			positions: props.positions
		};
	}

	componentDidMount() {
		invoiz.on('documentClicked', () => this.onDocumentClick());
		const { columns, positions, isPurchaseOrder, customerData } = this.props;
		this.initializeColumns(columns, positions, customerData);
		const forcePriceAndDiscountColumn = positions.filter(pos => pos.discountPercent > 0).length > 0;
		if (isPurchaseOrder && !forcePriceAndDiscountColumn) this.onColumnRemove('discount');
	}

	componentWillReceiveProps(newProps) {
		const { columns, positions, customerData } = newProps;
		this.initializeColumns(columns, positions, customerData);
	}

	initializeColumns(columns, positions, customerData) {
		const diffVatValues = [];
		positions.forEach(pos => {
			if (diffVatValues.indexOf(pos.vat) === -1) {
				diffVatValues.push(pos.vat);
			}
		});

		const priceColumn = columns.find(col => col.name === 'price');

		const forceVatColumn = diffVatValues.length > 1;
		const forceAmountColumn = positions.filter(pos => pos.amount > 1).length > 0;
		const forcePriceAndDiscountColumn = positions.filter(pos => pos.discountPercent > 0).length > 0;
		const totalEditable = !priceColumn || (!priceColumn.active && !forceAmountColumn);
		columns.forEach(column => {
			switch (column.name) {
				case 'description': {
					column.active = true;
					column.required = true;
					column.editable = false;
					break;
				}
				case 'hsnSacCode': {
					column.active = forceVatColumn ? true : column.active;
					column.required = false;
					column.editable = false;
					break;
				}
				case 'amount': {
					column.active = forceAmountColumn ? true : column.active;
					column.required = !!forceAmountColumn;
					column.editable = true;
					break;
				}

				case 'vat': {
					if (invoiz.user.isSmallBusiness) {
						column.active = false;
						column.required = true;
						column.hidden = true;
						column.editable = false;
					} else if (customerData && customerData.countryIso !== "IN") {
						column.editable = false;
						column.active = false;
						column.foreign = true;
						column.required = false;
					} else {
						column.active = forceVatColumn ? true : column.active;
						column.required = !!forceVatColumn;
						column.editable = false;
						column.foreign = false;
					}
					break;
				}

				case 'price': {
					column.active = forcePriceAndDiscountColumn ? true : column.active;
					column.required = !!forcePriceAndDiscountColumn;
					column.editable = true;
					break;
				}

				case 'discount': {
					column.active = forcePriceAndDiscountColumn ? true : column.active;
					column.required = !!forcePriceAndDiscountColumn;
					column.editable = false;
					break;
				}

				case 'total': {
					column.editable = totalEditable;
				}
			}
		});

		this.setState({
			columns,
			positions
		});
	}

	render() {
		const { columns } = this.props;
		const { editableColumns, editingColumns } = this.state;
		const displayedColumns = columns
			.filter(column => column.active)
			.map((column, index) => {
				if (column.hidden) {
					return null;
				}
				return (
					<div
						className={`letter-positions-head-column letter-positions-head-column-${column.name}`}
						key={`letter-positions-head-column-${index}`}
					>
						{editableColumns && editingColumns ? (
							<div className="letter-positions-head-column-value letter-positions-head-column-edit-label inline">
								<TextInputExtendedComponent
									value={column.label}
									onChange={val => this.onColumnLabelChange(column.name, val)}
								/>
							</div>
						) : (
							<div className="letter-positions-head-column-value">{column.label}</div>
						)}
						{!column.required ? (
							<div
								className="letter-positions-head-column-remove icon icon-close"
								onClick={() => this.onColumnRemove(column.name)}
							/>
						) : null}
					</div>
				);
			});

		const contextMenu = this.createContextMenu();

		return (
			<div className={`letter-positions-head-component-wrapper outlined`}>
				<div className="letter-positions-head-wrapper">
					<div
						className={`letter-positions-head ${editingColumns ? 'letter-positions-head-editing' : ''}`}
						onClick={ev => this.onLetterHeadClick(ev)}
					>
						{displayedColumns}
						{/* {contextMenu} */}
						<span className="edit-icon"/>
					</div>
				</div>
			</div>
		);
	}

	onDocumentClick() {
		if (this.state.editingColumns) {
			this.onLetterHeadEditClose();
		}
	}

	onColumnLabelChange(name, value) {
		const { columns } = this.state;
		const updatedColumns = columns.map(col => {
			if (col.name === name) {
				col.label = value;
			}

			return col;
		});
		this.setState({ columns: updatedColumns });
	}

	onLetterHeadEditClose() {
		const { onColumnsClose } = this.props;

		this.setState({ editingColumns: false }, () => {
			onColumnsClose && onColumnsClose(this.state.columns);
		});
	}

	onLetterHeadClick(ev) {
		const e = ev.nativeEvent;
		const { columns } = this.state;
		const { onColumnsClose } = this.props;
		e.stopPropagation();
		e.stopImmediatePropagation();

		// if (!this.state.editingColumns) {
		// 	this.setState({ editingColumns: true });
		// }
		ModalService.open(<EditColumnModal key={columns} columns={columns} propColumns={this.props.columns} onColumnsClose={this.props.onColumnsClose} />, {
			headline: 'Modify columns',
			isCloseable: false,
			width: 500,
			padding: 40,
			noTransform: true
		});
	}

	onColumnRemove(name) {
		const { onColumnsClose } = this.props;
		const { columns } = this.state;
		const column = columns.find(c => c.name === name);
		if (column) {
			column.active = false;
		}
		this.setState({ columns }, () => {
			onColumnsClose && onColumnsClose(this.state.columns);
		});
	}

	onContextMenuClick(entry) {
		const { onColumnsClose } = this.props;
		const { columns } = this.state;

		columns.forEach(col => {
			if (col.name === entry.name) {
				col.active = true;
			}
		});

		this.setState({ columns }, () => {
			onColumnsClose && onColumnsClose(this.state.columns);
		});
	}

	createContextMenu() {
		const { columns } = this.state;
		const missingColumns = columns.filter(col => !col.active && !col.hidden && col.name != 'number');
		const showMenu = missingColumns.length > 0;
		let menu = null;

		if (showMenu) {
			const entries = [];
			entries.push(
				missingColumns.map(col => {
					return {
						label: col.label,
						name: col.name,
						dataQsId: `letter-positions-menu-column-${col.label}`
					};
				})
			);

			menu = (
				<div className="letter-positions-head-context-menu">
					<span className="icon icon-plus" id="letter-positions-head-context-menu-icon" />
					<PopoverComponent
						alignment={Direction.LEFT}
						arrowAlignment={Direction.LEFT}
						offsetTop={15}
						offsetLeft={-9}
						entries={entries}
						elementId={'letter-positions-head-context-menu-icon'}
						showOnClick={true}
						onClick={entry => this.onContextMenuClick(entry)}
					/>
				</div>
			);
		}

		return menu;
	}
}

LetterPositionsHeadComponent.propTypes = {
	onColumnsClose: PropTypes.func
};

export default LetterPositionsHeadComponent;
