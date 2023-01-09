import React from 'react';
import ReactDOM from 'react-dom';
import ButtonComponent from 'shared/button/button.component';
import ModalService from 'services/modal.service';
import CheckboxInputComponent from 'shared/inputs/checkbox-input/checkbox-input.component';
import { createArrayGroups } from 'helpers/createArrayGroups';
import { sortObjectArrayByOtherArray } from 'helpers/sortObjectArrayByOtherArray';
import { sortObjectArrayByProperty } from 'helpers/sortObjectArrayByProperty';
import { isNil } from 'helpers/isNil';

class ColumnsSettingsModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			checkboxItems: [],
			checkboxItemsAdditional: [],
			resetColumnSorting: false,
		};
	}

	componentDidMount() {
		this.createCheckboxItems();
	}

	componentDidUpdate() {
		const $this = $(ReactDOM.findDOMNode(this));
		const checkboxItemsDOM = $this.find('.checkbox-items');

		const checkboxItemsWidths = [];

		if (checkboxItemsDOM.length > 0) {
			checkboxItemsDOM.each((itemsIdx, itemsElm) => {
				$(itemsElm)
					.find('.checkbox-col')
					.each((colIdx, colElm) => {
						$(colElm)
							.find('.form_input')
							.each((formInputIdx, formInputElm) => {
								if (!checkboxItemsWidths[colIdx]) {
									checkboxItemsWidths[colIdx] = [];
								}

								checkboxItemsWidths[colIdx].push($(formInputElm).outerWidth());
							});
					});
			});

			const checkboxItemsMaxWidths = checkboxItemsWidths.map((itemsWidthsArray) =>
				Math.max.apply(Math, itemsWidthsArray)
			);

			checkboxItemsMaxWidths.forEach((itemMaxWidth, index) => {
				checkboxItemsDOM.find(`.checkbox-col:eq(${index}) .form_input`).width(itemMaxWidth);

				checkboxItemsDOM.each((itemsIdx, itemsElm) => {
					const formInputElm = $(itemsElm).find(`.checkbox-col:eq(${index}) .form_input`);

					if (formInputElm.length === 0) {
						$('<div/>', {
							class: 'form_input',
							css: {
								width: itemMaxWidth,
							},
						}).appendTo($(itemsElm).find(`.checkbox-col:eq(${index})`));
					}
				});
			});
		}
	}

	areAllCheckboxesChecked() {
		const { checkboxItems, checkboxItemsAdditional } = this.state;
		const checkboxItemsAll = checkboxItems.concat(checkboxItemsAdditional);
		return checkboxItemsAll.length === checkboxItemsAll.filter((checkbox) => checkbox.checked === true).length;
	}

	createCheckboxItems(resetColumns, selectAll) {
		const { columnState } = this.props;
		const columnDefs = this.props.columnDefs;

		columnDefs.forEach((colDef) => {
			if (!colDef.hasOwnProperty('hide')) {
				colDef.hide = false;
			}
		});

		sortObjectArrayByProperty(columnDefs, 'hide');

		const columnStateOrdered = sortObjectArrayByOtherArray(columnState, columnDefs, 'colId', 'field');
		const checkboxItems = [];

		columnStateOrdered.forEach((stateObj) => {
			const refDef = columnDefs.find((defObj) => defObj.field === stateObj.colId);

			if (refDef) {
				checkboxItems.push({
					checked: resetColumns ? !refDef.hide : !stateObj.hide,
					isCoreData: !refDef.hide,
					label: (refDef.customProps && refDef.customProps.longName) || refDef.headerName,
					value: stateObj.colId,
				});
			}
		});

		if (!isNil(selectAll)) {
			checkboxItems.forEach((checkboxItem) => {
				checkboxItem.checked = selectAll;
			});
		}

		this.setState({
			checkboxItems: checkboxItems.filter((item) => item.isCoreData),
			checkboxItemsAdditional: checkboxItems.filter((item) => !item.isCoreData),
		});
	}

	createCheckboxItemsDOM(checkboxItems) {
		const checkboxItemsGroups = createArrayGroups(checkboxItems, 3, true);

		return checkboxItemsGroups.map((group, groupIndex) => {
			return (
				<div className="checkbox-col" key={groupIndex}>
					{group.map((item, itemIndex) => (
						<CheckboxInputComponent
							key={itemIndex}
							label={item.label}
							checked={item.checked}
							onChange={(checked) => this.onCheckboxToggled(item.value, checked)}
						/>
					))}
				</div>
			);
		});
	}

	onSave() {
		const { resetColumnSorting } = this.state;
		const columnState = [].concat(this.props.columnState);
		const { checkboxItems, checkboxItemsAdditional } = this.state;
		const checkboxItemsAll = [].concat(checkboxItems, checkboxItemsAdditional);

		columnState.forEach((def) => {
			checkboxItemsAll.forEach((item) => {
				if (def.colId === item.value) {
					def.hide = !item.checked;
				}
			});
		});

		ModalService.close();
		this.props.onSave && this.props.onSave(columnState, resetColumnSorting);
	}

	onCheckboxToggled(value, checked) {
		const checkboxItems = [].concat(this.state.checkboxItems);
		const checkboxItemsAdditional = [].concat(this.state.checkboxItemsAdditional);

		checkboxItems.forEach((item) => {
			if (item.value === value) {
				item.checked = checked;
			}
		});

		checkboxItemsAdditional.forEach((item) => {
			if (item.value === value) {
				item.checked = checked;
			}
		});

		this.setState({
			checkboxItems,
			checkboxItemsAdditional,
		});
	}

	onResetColumnsClicked() {
		this.setState(
			{
				resetColumnSorting: true,
			},
			() => {
				this.createCheckboxItems(true);
			}
		);
	}

	onToggleSelectAllClicked() {
		this.createCheckboxItems(false, !this.areAllCheckboxesChecked());
	}

	render() {
		const { checkboxItems, checkboxItemsAdditional } = this.state;

		const isCheckboxSelected =
			checkboxItems.concat(checkboxItemsAdditional).filter((checkbox) => checkbox.checked).length > 0;

		return checkboxItems.length === 0 ? null : (
			<div className="list-advanced-columns-settings-modal">
				<h1>Filter columns</h1>

				<div className="reset-controls">
					<div className="action-link" onClick={() => this.onToggleSelectAllClicked()}>
						{this.areAllCheckboxesChecked() ? 'Select all columns' : 'Deselect all columns'}
					</div>

					<div className="action-link" onClick={() => this.onResetColumnsClicked()}>
						Restore to default
					</div>
				</div>

				<div className="headline">Default columns</div>
				<div className="checkbox-items">{this.createCheckboxItemsDOM(checkboxItems)}</div>

				{checkboxItemsAdditional.length > 0 ? (
					<React.Fragment>
						<div className="headline additional">Additional columns</div>
						<div className="checkbox-items">{this.createCheckboxItemsDOM(checkboxItemsAdditional)}</div>
					</React.Fragment>
				) : null}

				<div className="modal-base-footer">
					<div className="modal-base-confirm">
						<ButtonComponent
							disabled={!isCheckboxSelected}
							buttonIcon={`icon-check`}
							type={'primary'}
							callback={() => this.onSave()}
							label={'Save'}
							dataQsId="modal-btn-confirm"
						/>
					</div>
					<div className="modal-base-cancel">
						<ButtonComponent
							type="default"
							callback={() => ModalService.close(true)}
							label={'Cancel'}
							dataQsId="modal-btn-cancel"
						/>
					</div>
				</div>
			</div>
		);
	}
}

export default ColumnsSettingsModal;
