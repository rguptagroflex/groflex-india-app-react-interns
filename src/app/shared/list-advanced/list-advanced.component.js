import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import moment from 'moment';
import _ from 'lodash';
import q from 'q';
import lang from 'lang';
import { AgGridReact } from '@ag-grid-community/react';
import { AllModules, LicenseManager } from '@ag-grid-enterprise/all-modules';
import LoaderComponent from 'shared/loader/loader.component';
import PopoverComponent from 'shared/popover/popover.component';
import ListAdvancedSearchComponent from 'shared/list-advanced/list-advanced-search.component';
import ListAdvancedPaginationComponent from 'shared/list-advanced/list-advanced-pagination.component';
import ActionPopupCellRendererComponent from 'shared/list-advanced/cell-renderers/action-popup-cell-renderer.component';
import InlineActionCellRendererComponent from 'shared/list-advanced/cell-renderers/inline-action-cell-renderer.component';
import ListAdvancedDatePickerComponent from 'shared/list-advanced/list-advanced-datepicker.component';
import ListAdvancedCustomHeaderComponent from 'shared/list-advanced/list-advanced-custom-header.component';
import InvoiceListViewswitchComponent from 'shared/invoice-list-viewswitch/invoice-list-viewswitch.component';
import ModalService from 'services/modal.service';
import ColumnsSettingsModal from 'shared/modals/list-advanced/columns-settings-modal.component';
import WebStorageService from 'services/webstorage.service';
import { ListAdvancedDefaultSettings } from 'helpers/constants';
import { parsePxToNumber } from 'helpers/parsePxToNumber';
import { normalizeHttpUrl } from 'helpers/normalizeHttpUrl';
import { sortObjectArrayByOtherArray } from 'helpers/sortObjectArrayByOtherArray';
import { updateStatusIconCellColumns } from 'helpers/list-advanced/updateStatusIconCellColumns';

import BtnCellRendererComponent from 'shared/list-advanced/cell-renderers/button-cell-renderer.component';
import SelectCellRendererComponent from 'shared/list-advanced/cell-renderers/dropdown-cell-renderer.component';

const ACTION_POPUP_CELL_CLASS = 'action-popup-cell';
const FIELD_ACTION_POPUP_CELL = 'actionPopupCell';
const FIELD_CHECKBOX_CELL = 'checkboxCell';
const INLINE_ACTION_CELL_CLASS = 'ag-inline-action-btn';
const INLINE_BUTTON_CELL_CLASS = 'stock-buttons';

const ListExportTypes = {
	EXCEL: 'excel',
};

const ColumnSystemCells = {
	checkboxCell: {
		headerName: '',
		field: FIELD_CHECKBOX_CELL,
		width: 40,
		headerClass: 'left-pinned-checkbox-cell',
		cellClass: 'left-pinned-checkbox-cell',
		filter: false,
		resizable: false,
		sortable: false,
		suppressMenu: true,
		suppressSizeToFit: true,
		headerCheckboxSelection: true,
		headerCheckboxSelectionFilteredOnly: true,
		checkboxSelection: true,
		pinned: 'left',
		lockPinned: true,
		lockPosition: true,
	},
	actionPopupCell: {
		headerName: '',
		field: FIELD_ACTION_POPUP_CELL,
		headerClass: ACTION_POPUP_CELL_CLASS,
		cellClass: ACTION_POPUP_CELL_CLASS,
		width: 45,
		filter: false,
		resizable: false,
		sortable: false,
		suppressMenu: true,
		suppressSizeToFit: true,
		pinned: 'right',
		lockPosition: true,
		cellRenderer: 'actionPopupCellRenderer',
	},
};

class ListAdvancedComponent extends React.Component {
	constructor(props) {
		super(props);

		LicenseManager.setLicenseKey(
			'CompanyName=Buhl Data Service GmbH,LicensedApplication=invoiz,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=1,LicensedProductionInstancesCount=1,AssetReference=AG-008434,ExpiryDate=8_June_2021_[v2]_MTYyMzEwNjgwMDAwMA==f2451b642651a836827a110060ebb5dd'
		);

		const columnDefs = props.columnDefs;

		if (columnDefs) {
			columnDefs.forEach((columnDef) => {
				const filterParams = columnDef.filterParams;

				columnDef.menuTabs = ['filterMenuTab'];

				columnDef.filterParams = {
					applyButton: true,
					closeOnApply: true,
					resetButton: true,
					cancelButton: true
				};

				if (filterParams) {
					columnDef.filterParams = Object.assign({}, columnDef.filterParams, filterParams);
				}
			});

			if (props.multiSelect) {
				columnDefs.unshift(ColumnSystemCells.checkboxCell);
			}

			if (
				props.actionCellPopup &&
				(props.actionCellPopup.popupEntries || props.actionCellPopup.popupEntriesFunc) &&
				props.actionCellPopup.onPopupItemClicked
			) {
				columnDefs.push(ColumnSystemCells.actionPopupCell);
			}
		}

		invoiz.off('historyNavigateBack', this.getPaginationRestoreState);
		invoiz.on('historyNavigateBack', this.getPaginationRestoreState, this);

		this.getPaginationRestoreState();

		const loadingRowsMessage = props.loadingRowsMessage || 'Loading data...';
		

		const gridOptions = {
			columnDefs,
			defaultColDef: {
				filter: true,
				sortable: true,
				resizable: true,
				headerComponentParams: {
					template:
						'<div class="ag-cell-label-container" role="presentation">' +
						'  <span class="ag-cell-grab-icon icon icon-grab2"></span>' +
						'  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
						'  <span ref="eFilter" class="icon icon-filter"></span>' +
						'  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
						'    <span ref="eText" class="ag-header-cell-text" role="columnheader"></span>' +
						'    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
						'    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
						'    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
						'    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
						' </div>' +
						'</div>',
				},
			},
			icons: {
				menu: '<span class="icon icon-filter" />',
				columnMovePin: '<span class="ag-icon ag-icon-right" />',
			},
			localeText: {
				// Context menu
				copy: 'Copy',
				ctrlC: ' ',

				// Filter
				selectAll: 'Select all',
				blanks: 'Blank',
				applyFilter: 'Apply',
				resetFilter: 'Clear filter',
				searchOoo: 'Filter term',
				dateFormatOoo: 'DD-MM-YYYY',
				// CSS selector (placeholder="Suchen") is used to display the search icon
				filterOoo: 'Filter term',
				equals: 'Equal to =',
				notEqual: 'Not equal to !=',
				lessThan: 'Less than <',
				greaterThan: 'Greater than >',
				lessThanOrEqual: 'Less than or equal <=',
				greaterThanOrEqual: 'Greater than or equal >=',
				inRange: 'From... to',
				inRangeStart: 'From',
				inRangeEnd: 'To',
				contains: 'Contains',
				notContains: 'Does not contain',
				startsWith: 'Starts with',
				endsWith: 'Ends with',

				// Common
				loadingOoo: loadingRowsMessage,
				noRowsToShow: props.noFilterResultsMessage || 'No data available',
			},
			animateRows: true,
			rowData: null,
			rowDeselection: true,
			rowSelection: 'multiple',
			sortingOrder: ['asc', 'desc'],
			suppressCopyRowsToClipboard: true,
			suppressPaginationPanel: true,
			suppressRowClickSelection: false,
			overlayLoadingTemplate:
				'<span class="ag-overlay-loading-center">' +
				'  <div class="loader">' +
				'    <div class="loader_content">' +
				'      <div class="loader_spinner"></div>' +
				`      <span class="loader_text">${loadingRowsMessage}</span>` +
				'    </div>' +
				'  </div>' +
				'</span>',
			excelStyles: [
				{
					id: 'header',
					interior: {
						color: '#eeeeee',
						pattern: 'Solid',
					},
					borders: {
						borderBottom: {
							color: '#bdbdbd',
							lineStyle: 'Continuous',
							weight: 1,
						},
						borderRight: {
							color: '#bdbdbd',
							lineStyle: 'Continuous',
							weight: 1,
						},
					},
				},
				{
					id: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
					dataType: 'number',
					numberFormat: { format: '₹ #,##0.00' },
				},
				{
					id: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Percentage,
					dataType: 'number',
					numberFormat: { format: '#,##0.00 \\%' },
				},
				{
					id: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
					dataType: 'string',
				},
			],
			getContextMenuItems: (evt) => {
				const disableContextMenuCopyItem =
					evt.column &&
					evt.column.userProvidedColDef &&
					evt.column.userProvidedColDef.customProps &&
					evt.column.userProvidedColDef.customProps.disableContextMenuCopyItem;

				return evt.value && !disableContextMenuCopyItem ? ['copy'] : [];
			},
			postProcessPopup: (evt) => {
				if (evt.type !== 'columnMenu') {
					return;
				}

				const popupOffsetLeft = 20;
				const sourceElm = $(evt.eventSource);
				const sourceElmLeft = sourceElm.offset().left - $('.ag-root-wrapper').offset().left;
				const popupElm = evt.ePopup;
				const popupElmLeft = parsePxToNumber(popupElm.style.left);

				if (
					evt.column &&
					evt.column.userProvidedColDef &&
					evt.column.userProvidedColDef.customProps &&
					evt.column.userProvidedColDef.customProps.isFilterBodyOnly
				) {
					$(evt.ePopup).addClass('ag-menu-filter-body-only');
				}

				popupElm.style.top = parsePxToNumber(popupElm.style.top) + 35 + 'px';
				popupElm.style.left = popupElmLeft - popupOffsetLeft + 'px';

				$(popupElm)
					.find('.ag-tabs-arrow')
					.css('left', sourceElmLeft + 2 - popupElmLeft + popupOffsetLeft);
			},
			onCellFocused: (e) => {
				const disableClickSelectionRenderers = ['btnCellRenderer'];
				if (e.column && disableClickSelectionRenderers.includes(e.column.colDef.cellRenderer)) {
					e.api.gridOptionsWrapper.gridOptions.suppressRowClickSelection = true;
					//gridOptions.api.onFilterChanged();
				}
				else {
					e.api.gridOptionsWrapper.gridOptions.suppressRowClickSelection = false;
				}
			},
			onCellContextMenu: (evt) => {
				let rowHoverElm = null;

				const disableContextMenuCopyItem =
					evt.column &&
					evt.column.userProvidedColDef &&
					evt.column.userProvidedColDef.customProps &&
					evt.column.userProvidedColDef.customProps.disableContextMenuCopyItem;

				if (evt.value && !disableContextMenuCopyItem) {
					rowHoverElm = $(evt.event.target).closest('.ag-row');

					this.showPopoverOverlay();

					if (rowHoverElm.length > 0) {
						$(evt.event.target).closest('.ag-cell').addClass('ag-cell-overlay-open');

						$(rowHoverElm)
							.add(`.ag-row[row-index="${rowHoverElm.attr('row-index')}"]`)
							.addClass('ag-row-hover-overlay-open');
					}
				}
			},
			onCellContextMenuClosed: (evt) => {
				this.showPopoverOverlay(true);
				$('.ag-row-hover-overlay-open').removeClass('ag-row-hover-overlay-open');
				$('.ag-cell-overlay-open').removeClass('ag-cell-overlay-open');
			},
			onCellMouseDown: (evt) => {
				const isInlineActionCellClicked =
					$(evt.event.target).closest(`.${INLINE_ACTION_CELL_CLASS}`).length > 0;

				const isActionPopupCellClicked = $(evt.event.target).closest(`.${ACTION_POPUP_CELL_CLASS}`).length > 0;
				const isButtonClicked = $(evt.event.target).closest(`.${INLINE_BUTTON_CELL_CLASS}`).length > 0;

				const inlineActionType =
					evt.colDef && evt.colDef.customProps && evt.colDef.customProps.inlineActionType;

				let googleMapsAddress;

				evt.api.setSuppressRowClickSelection(isInlineActionCellClicked || isActionPopupCellClicked || isButtonClicked);

				if (evt.event.button > 0) {
					return;
				}

				if (isInlineActionCellClicked && inlineActionType) {
					switch (inlineActionType) {
						case ListAdvancedDefaultSettings.CellInlineActionType.MAIL:
							window.open(`mailto:${evt.data.email}`, '_self');
							break;

						case ListAdvancedDefaultSettings.CellInlineActionType.MAPS:
							googleMapsAddress = `${evt.data.address.street},${evt.data.address.zipCode} ${evt.data.address.city}`;
							window.open(`http://www.google.com/maps/search/${googleMapsAddress}`, '_blank');
							break;

						case ListAdvancedDefaultSettings.CellInlineActionType.WEBSITE:
							window.open(normalizeHttpUrl(evt.data.website), '_blank');
							break;

						case ListAdvancedDefaultSettings.CellInlineActionType.VIEW:
							evt.colDef &&
								evt.colDef.customProps &&
								evt.colDef.customProps.inlineActionCallback &&
								evt.colDef.customProps.inlineActionCallback(evt.data);
							break;
					}
				}
			},
			onColumnPinned: (evt) => {
				if (evt.pinned) {
					evt.columnApi.setColumnPinned(evt.column, null);
				}
			},
			onColumnResized: (evt) => {
				if (evt.type === 'columnResized') {
					if (
						evt.column &&
						evt.column.userProvidedColDef.customProps &&
						evt.column.userProvidedColDef.customProps.onColumnResized
					) {
						evt.column.userProvidedColDef.customProps.onColumnResized(evt);
					}

					if (evt.finished === true && evt.source !== 'sizeColumnsToFit') {
						this.updateGridColumnsRowsAppearance();
					}
				}
			},
			onColumnVisible: (evt) => {
				this.updateGridColumnsRowsAppearance();
			},
			onDragStopped: (evt) => {
				this.updateLocalStorageSettings();
			},
			onFilterChanged: (evt) => {
				const rowCount = evt.api.getModel().rowsToDisplay.length;

				if (gridOptions && gridOptions.api) {
					if (rowCount === 0) {
						gridOptions.api.showNoRowsOverlay();
					} else if (rowCount > 0) {
						gridOptions.api.hideOverlay();
					}
				}

				if (!this.isUnmounted) {
					this.setState(
						{
							hasFilter:
								gridOptions &&
								gridOptions.api &&
								Object.keys(gridOptions.api.getFilterModel()).length > 0,
							rowCount,
						},
						() => {
							this.updateLocalStorageSettings();
							this.updateTabbedFilterItems();

							props.onFilterChanged &&
								props.onFilterChanged(
									gridOptions && gridOptions.api && gridOptions.api.getFilterModel()
								);

							setTimeout(() => {
								this.updateGridColumnsRowsAppearance();
							}, 500);
						}
					);
				}
			},
			onFirstDataRendered: (evt) => {
				const rowCount = evt.api.getModel().rowsToDisplay.length;
				const actionCellColumn = evt.columnApi.getColumn(FIELD_ACTION_POPUP_CELL);

				this.updateGridColumnsRowsAppearance();

				if (this.paginationRestoreState) {
					if (this.paginationRestoreState.currentPage) {
						evt.api.paginationGoToPage(this.paginationRestoreState.currentPage);
					}

					if (this.paginationRestoreState.pageSize) {
						evt.api.paginationSetPageSize(this.paginationRestoreState.pageSize);
					}
				}

				if (actionCellColumn) {
					actionCellColumn.addEventListener('leftChanged', () => {
						evt.columnApi.moveColumn(
							FIELD_ACTION_POPUP_CELL,
							evt.columnApi.getAllDisplayedColumns().length - 1
						);
					});
				}

				if (!evt.api.getSortModel().length && props.defaultSortModel) {
					evt.api.setSortModel([props.defaultSortModel]);
				}

				evt.columnApi.getAllColumns().forEach((col) => {
					col.addEventListener('menuVisibleChanged', (evt) => {
						this.showPopoverOverlay(!evt.column.menuVisible);
					});
				});

				this.clearFilterFromInvalidSettings();

				if (!this.isUnmounted) {
					this.setState(
						{
							isPaginationReady: !this.paginationRestoreState,
							rowCount,
						},
						() => {
							if (this.paginationRestoreState) {
								setTimeout(() => {
									this.setState({
										isPaginationReady: true,
									});
								}, 0);
							}
						}
					);
				}
			},
			onGridSizeChanged: (evt) => {
				this.updateGridColumnsRowsAppearance();
				this.updateLocalStorageSettings();
			},
			onCellClicked: (evt) => {
				const isButtonClicked = $(evt.event.target).closest(`.${INLINE_BUTTON_CELL_CLASS}`).length > 0;
				if (isButtonClicked) {
					props.onCellBtnClicked(evt.event.target.text, evt.data, evt);
					// gridOptions.api.setRowData()
				}
			},
			onRowClicked: (evt) => {
				const { gridOptions } = this.state;
				const isActionPopupCellClicked = $(evt.event.target).closest(`.${ACTION_POPUP_CELL_CLASS}`).length > 0;
				const isInlineActionCellClicked =
					$(evt.event.target).closest(`.${INLINE_ACTION_CELL_CLASS}`).length > 0;
				
				const isButtonClicked = $(evt.event.target).closest(`.${INLINE_BUTTON_CELL_CLASS}`).length > 0;
				evt.api.setSuppressRowClickSelection(isButtonClicked);

				const actionCellPopupId = evt.data && `ag-action-popup-cell-anchor-${evt.data.id}`;

				if (evt.event.ctrlKey || evt.event.shiftKey || isInlineActionCellClicked) {
					return;
				}
				if (isActionPopupCellClicked && this.refs.actionCellPopup && $(`#${actionCellPopupId}`).length > 0) {
					if (!this.isUnmounted) {
						this.setState(
							{
								currentActionCellPopupId: actionCellPopupId,
								currentActionCellPopupItemData: evt.data,
							},
							() => {
								this.refs.actionCellPopup.show();
							}
						);
					}
				} else if (isButtonClicked) {
					evt.api.setSuppressRowClickSelection(true);
				} else if (evt.type && evt.type === 'rowClicked') {
					this.writePaginationRestoreState();
					props.onRowClicked && props.onRowClicked(evt.data);
				}
			},
			onRowDataUpdated: (evt) => {
				if (!this.isUnmounted) {
					this.setState({
						hasNoRowData: this.getAllRows().length === 0,
					});
				}
			},
			onSelectionChanged: (evt) => {
				const rowsSelected = evt.api.getSelectedRows();

				if (!this.isUnmounted) {
					this.setState({ rowsSelected }, () => {
						props.onRowSelectionChanged && props.onRowSelectionChanged(rowsSelected);
					});
				}
			},
			onSortChanged: (evt) => {
				if (!evt.api.getSortModel().length && props.defaultSortModel) {
					evt.api.setSortModel([props.defaultSortModel]);
				}

				this.updateLocalStorageSettings();
				this.triggerUpdateStatusIconCellColumns();
			},
			onViewportChanged: () => {
				this.triggerUpdateStatusIconCellColumns();
			},
		};

		const gridOptionsProps = props.gridOptions;

		if (gridOptionsProps) {
			Object.keys(gridOptionsProps).forEach((key) => {
				gridOptions[key] = gridOptionsProps[key];
			});
		}

		this.updateLocalStorageSettingsTimeout = null;

		this.state = {
			currentActionCellPopupId: null,
			currentActionCellPopupItemData: null,
			frameworkComponents: {
				agColumnHeader: ListAdvancedCustomHeaderComponent,
				agDateInput: ListAdvancedDatePickerComponent,
				inlineActionCellRenderer: InlineActionCellRendererComponent,
				actionPopupCellRenderer: ActionPopupCellRendererComponent,
				btnCellRenderer: BtnCellRendererComponent,
				selectCellRenderer: SelectCellRendererComponent
			},
			gridOptions,
			hasNoRowData: false,
			hasFilter: false,
			isLoading: true,
			isPaginationReady: false,
			refreshGrid: false,
			rowCount: -1,
			rowCountMax: -1,
			rowsSelected: [],
			searchText: '',
			tabbedFilterItems: [],
			usePagination: props.usePagination || false,
		};
	}

	componentDidMount() {
		if (!this.props.noFetchOnInit) {
			this.fetchRows();
		}
	}

	componentWillUnmount() {
		this.isUnmounted = true;
		invoiz.off('historyNavigateBack', this.getPaginationRestoreState);
	}

	clearSelectedRows() {
		const { gridOptions } = this.state;

		if (gridOptions && gridOptions.api) {
			gridOptions.api.deselectAll();
			this.updateLocalStorageSettings();
		}
	}

	clearFilterFromInvalidSettings() {
		const { gridOptions } = this.state;

		let currentFilterModel;
		const newFilterModel = {};
		let isFilterModelChanged = false;

		if (gridOptions && gridOptions.api) {
			currentFilterModel = gridOptions.api.getFilterModel();

			Object.keys(currentFilterModel).forEach((filterKey) => {
				if (
					!currentFilterModel[filterKey].values ||
					(currentFilterModel[filterKey].values && currentFilterModel[filterKey].values.length > 0)
				) {
					newFilterModel[filterKey] = currentFilterModel[filterKey];
				}
			});

			isFilterModelChanged = !_.isEqual(_.cloneDeep(currentFilterModel), _.cloneDeep(newFilterModel));

			if (isFilterModelChanged) {
				gridOptions.api.setFilterModel(newFilterModel);
				this.updateLocalStorageSettings();
			}
		}
	}

	convertNumberToTextFilterOnDemand() {
		const { gridOptions } = this.state;
		let prevColumnState = null;
		let filterModel = null;
		const filterModelUpdated = {};
		let columnField = null;
		let wasFilterModelUpdated = false;
		let wasStringNumberFound = false;
		const localStorageSettings = this.getLocalStorageSettings();

		if (gridOptions && gridOptions.api) {
			prevColumnState = gridOptions.columnApi.getColumnState();
			filterModel = (localStorageSettings && localStorageSettings.filter) || gridOptions.api.getFilterModel();

			gridOptions.columnDefs = gridOptions.columnDefs.map((columnDef) => {
				wasStringNumberFound = false;

				if (columnDef.customProps && columnDef.customProps.convertNumberToTextFilterOnDemand) {
					columnField = columnDef.field;

					this.getAllRows().forEach((row) => {
						if (row.hasOwnProperty(columnDef.field) && !wasStringNumberFound) {
							wasStringNumberFound =
								typeof row[columnDef.field] === 'string' && row[columnDef.field].length > 0;
						}
					});

					if (wasStringNumberFound) {
						columnDef.filter = 'agTextColumnFilter';
					}

					if (Object.keys(filterModel).length > 0 && Object.keys(filterModel).indexOf(columnField) !== -1) {
						wasFilterModelUpdated = true;

						Object.keys(filterModel).forEach((filterKey) => {
							if (
								filterKey !== columnField ||
								(filterKey === columnField &&
									filterModel[filterKey].filterType === 'text' &&
									wasStringNumberFound) ||
								(filterKey === columnField &&
									filterModel[filterKey].filterType !== 'text' &&
									!wasStringNumberFound)
							) {
								filterModelUpdated[filterKey] = filterModel[filterKey];
							}
						});
					}
				}

				return columnDef;
			});

			gridOptions.api.setColumnDefs(gridOptions.columnDefs);

			if (wasFilterModelUpdated) {
				this.setState(
					{
						refreshGrid: true,
					},
					() => {
						setTimeout(() => {
							this.setState({
								refreshGrid: false,
							});

							if (wasFilterModelUpdated) {
								gridOptions.api.setFilterModel(filterModelUpdated);
								gridOptions.api.onFilterChanged();
								gridOptions.columnApi.setColumnState(prevColumnState);
							}
						}, 10);
					}
				);
			}
		}
	}

	exportList(type) {
		const { exportExcelCallbacks, exportFilename } = this.props;
		const { gridOptions } = this.state;
		const onlySelected = gridOptions.api.getSelectedRows().length > 0;

		const excelOptions = {
			fileName: `${exportFilename}.xlsx`,
			sheetName: exportFilename,
			onlySelected,
			columnKeys: gridOptions.columnApi
				.getAllDisplayedColumns()
				.filter(
					(columnDef) =>
						columnDef.colId !== FIELD_CHECKBOX_CELL && columnDef.colId !== FIELD_ACTION_POPUP_CELL
				)
				.map((columnDef) => columnDef.colId),
		};

		switch (type) {
			case ListExportTypes.EXCEL:
				if (gridOptions && gridOptions.api) {
					if (exportExcelCallbacks && exportExcelCallbacks.processCellCallback) {
						excelOptions.processCellCallback = exportExcelCallbacks.processCellCallback;
					}

					gridOptions.api.exportDataAsExcel(excelOptions);

					setTimeout(() => {
						invoiz.showNotification({
							message: onlySelected
								? 'The selected rows were successfully exported'
								: 'All rows were successfully exported',
						});
					}, 300);
				}
				break;
		}
	}

	fetchRows() {
		const { responseDataMapFunc, fetchUrls, onRowDataLoaded, resources, onMultiRowData } = this.props;

		const fetchRequests = () => {
			if (!this.props.restricted) {
				const requests = fetchUrls.map((url) => invoiz.request(url, { auth: true }));
				return q.all(requests);
			} else {
				this.setState({ hasNoRowData: true, isLoading: false, refreshGrid: false });
			}
			
		};

		const onFetchError = () => {
			invoiz.router.navigate('/');
			invoiz.showNotification({ message: 'Sorry, an error ocurred!', type: 'error' });
		};

		const proceed = (...args) => {
			let rowData = args && args[0] && args[0].body && args[0].body.data;
			const responses = args.map((res) => (res.body && res.body.data) || []);
			rowData = responseDataMapFunc ? responseDataMapFunc(...responses) : rowData;
			rowData = onMultiRowData ? onMultiRowData(responses) : rowData;
			if (!this.isUnmounted) {
				this.setState(
					{
						hasNoRowData: rowData.length === 0,
						isLoading: false,
						rowCountMax: rowData.length,
						rowData,
					},
					() => {
						this.updateLocalStorageSettings(true);
						onRowDataLoaded && onRowDataLoaded(this.state.rowData);
						this.updateTabbedFilterItems();
						this.convertNumberToTextFilterOnDemand();
					}
				);
			}
		};

		q.fcall(fetchRequests).catch(onFetchError).spread(proceed).done();
	}

	getAllRows() {
		const { gridOptions } = this.state;
		const rows = [];

		if (gridOptions && gridOptions.api) {
			gridOptions.api.forEachNode((rowNode) => {
				rows.push(rowNode.data);
			});
		}
		return rows;
	}

	getLocalStorageFilterModel() {
		const localStorageSettings = this.getLocalStorageSettings();
		return localStorageSettings && localStorageSettings.filter;
	}

	getLocalStorageSettings() {
		const { webStorageKey } = this.props;
		return WebStorageService.getItem(webStorageKey);
	}

	getPaginationRestoreState() {
		if (invoiz.cache && invoiz.cache.listAdvancedPaginationRestoreState) {
			this.paginationRestoreState = invoiz.cache.listAdvancedPaginationRestoreState;
			delete invoiz.cache.listAdvancedPaginationRestoreState;
		}
	}

	getSelectedRows(orderBy) {
		const { gridOptions } = this.state;
		let displayedRows = [];

		if (gridOptions && gridOptions.api.getModel() && gridOptions.api.getSelectedRows()) {
			displayedRows = gridOptions.api.getSelectedRows();

			if (orderBy && orderBy.prop) {
				displayedRows = _.sortBy(displayedRows, (item) => item[orderBy.prop]);

				if (orderBy.sort === 'desc') {
					displayedRows = displayedRows.reverse();
				}
			}
		}

		return displayedRows;
	}

	getTotalRowCount() {
		const { gridOptions } = this.state;
		let totalRowCount = 0;

		if (gridOptions && gridOptions.api) {
			gridOptions.api.forEachNode((rowNode) => {
				totalRowCount++;
			});
		}

		return totalRowCount;
	}

	onFilterClearClick() {
		const { webStorageKey } = this.props;
		const { gridOptions, hasFilter } = this.state;
		if (gridOptions && gridOptions.api && hasFilter) {
			gridOptions.api.setFilterModel(null);
			gridOptions.api.onFilterChanged();
			setTimeout(() => {
				if (Object.keys(gridOptions.api.getFilterModel()).length > 0) {
					gridOptions.api.setFilterModel(null);
					gridOptions.api.onFilterChanged();
				}

				this.updateLocalStorageSettings();
			});
		}
	}

	onShowColumnsSettingsModalClick() {
		const { gridOptions } = this.state;
		const { columnDefs, columnsSettingsModalWidth } = this.props;

		if (gridOptions && gridOptions.columnApi) {
			ModalService.open(
				<ColumnsSettingsModal
					columnDefs={columnDefs.filter(
						(columnDef) =>
							columnDef.field !== FIELD_CHECKBOX_CELL && columnDef.field !== FIELD_ACTION_POPUP_CELL
					)}
					columnState={gridOptions.columnApi.getColumnState()}
					onSave={(columnState, resetColumnSorting) => {
						const updatedColumnState = resetColumnSorting
							? sortObjectArrayByOtherArray(columnState, columnDefs, 'colId', 'field')
							: columnState;

						if (resetColumnSorting && gridOptions.columnDefs) {
							updatedColumnState.forEach((columnDef) => {
								gridOptions.columnDefs.forEach((columnDefDefault) => {
									if (columnDef.colId === columnDefDefault.field) {
										if (columnDefDefault.width) {
											columnDef.width = columnDefDefault.width;
										} else {
											delete columnDef.width;
										}
									}
								});
							});
						}

						gridOptions.columnApi.setColumnState(updatedColumnState);
						this.updateLocalStorageSettings();
					}}
				/>,
				{
					width: columnsSettingsModalWidth || 560,
					padding: '15px 40px 110px 40px',
				}
			);
		}
	}

	onSearch(searchText) {
		const { gridOptions } = this.state;

		if (gridOptions && gridOptions.api) {
			this.setState({ searchText }, () => {
				gridOptions.api.setQuickFilter(searchText);
			});
		}
	}

	onTabbedFilterItemClick(filterItem) {
		const { gridOptions } = this.state;

		let filterObject = {
			filterType: filterItem.filter.filterType,
			values: filterItem.filter.values,
		};

		if (gridOptions && gridOptions.api && filterItem.filter) {
			if (filterItem.filter.filterType === 'date') {
				filterObject = {
					filterType: 'date',
					type: filterItem.filter.type,
					dateFrom: filterItem.filter.dateFrom,
					dateTo: filterItem.filter.dateTo,
				};
			}

			gridOptions.api.setFilterModel(
				filterItem.filter.setNull
					? null
					: {
							[filterItem.filter.field]: filterObject,
					  }
			);

			gridOptions.api.onFilterChanged();

			setTimeout(() => {
				gridOptions.api.setFilterModel(
					filterItem.filter.setNull
						? null
						: {
								[filterItem.filter.field]: filterObject,
						  }
				);

				gridOptions.api.onFilterChanged();
				this.updateLocalStorageSettings();
			});
		}
	}

	updateRowStockData(rowId, updatedData) {
		const { gridOptions } = this.state;
		var itemsToUpdate = [];
		gridOptions.api.forEachNodeAfterFilterAndSort(function (rowNode, index) {

			if (rowId !== rowNode.id) {
				return;
			}
	  
		  var data = rowNode.data;
			//let newData = Object.assign(data, ...updatedData)
			data.trackedInInventory = true;
			data.currentStock = updatedData.currentStock;
			data.action = updatedData.action;
			data.price = updatedData.price;
			data.priceGross = updatedData.priceGross;
			//data.purchasePrice = updatedData.purchasePrice;
			data.purchasePriceGross = updatedData.purchasePriceGross;
			data.value = updatedData.value;
			data.updatedAt = updatedData.updatedAt;
			data.source = updatedData.source;
			data.quantity = updatedData.quantity;
			data.minimumBalance = updatedData.minimumBalance;
			data.avgPurchaseValue = updatedData.avgPurchaseValue;
			data.itemModifiedDate = updatedData.itemModifiedDate;
		  itemsToUpdate.push(data);
		});

	 	gridOptions.api.updateRowData({ update: itemsToUpdate});
	}

	removeSelectedRows(selectedRow) {
		const { gridOptions } = this.state;
		const { onRowDataLoaded, gatherRemovedSelectedRowsBy } = this.props;

		let selectedData = null;
		let removeResult = null;
		let rowData = null;
		let gatheredRemovedRowIds = [];
		let currentFilterModel = null;
		let allRows = null;

		if (gridOptions && gridOptions.api) {
			selectedData = selectedRow || gridOptions.api.getSelectedRows();

			if (gatherRemovedSelectedRowsBy) {
				gatheredRemovedRowIds = selectedData.map(
					(colData) =>
						colData.hasOwnProperty(gatherRemovedSelectedRowsBy) && colData[gatherRemovedSelectedRowsBy]
				);

				gridOptions.api.forEachNode((rowNode) => {
					if (
						rowNode.data.hasOwnProperty(gatherRemovedSelectedRowsBy) &&
						gatheredRemovedRowIds.indexOf(rowNode.data[gatherRemovedSelectedRowsBy]) !== -1
					) {
						selectedData.push(rowNode.data);
					}
				});
			}

			removeResult = gridOptions.api.applyTransaction({ remove: selectedData });
			allRows = this.getAllRows();

			if (removeResult && allRows) {
				rowData = allRows;
				currentFilterModel = gridOptions.api.getFilterModel();

				if (rowData.length === 0 && currentFilterModel && Object.keys(currentFilterModel).length > 0) {
					gridOptions.api.setFilterModel(null);
				}

				gridOptions.api.onFilterChanged();
				onRowDataLoaded && onRowDataLoaded(rowData);

				this.setState(
					{
						rowCount: gridOptions.api.getModel().rowsToDisplay.length,
						rowCountMax: this.getTotalRowCount(),
					},
					() => {
						this.clearFilterFromInvalidSettings();
						this.updateTabbedFilterItems();
					}
				);
			}
		}
	}

	showPopoverOverlay(hide) {
		let overlay;

		if (hide) {
			$('.popover-overlay').remove();
		} else {
			overlay = $('<div/>', { class: 'popover-overlay' });
			overlay.appendTo('body');
		}
	}

	triggerUpdateStatusIconCellColumns() {
		const { gridOptions } = this.state;

		if (gridOptions && gridOptions.api) {
			const statusIconColumns = gridOptions.columnApi
				.getAllDisplayedColumns()
				.filter(
					(columnDef) =>
						columnDef.userProvidedColDef &&
						columnDef.userProvidedColDef.customProps &&
						columnDef.userProvidedColDef.customProps.statusIconCellBreakpoint
				);

			statusIconColumns.forEach((statusIconColumn) => {
				updateStatusIconCellColumns(
					{ column: statusIconColumn },
					statusIconColumn.userProvidedColDef.customProps.statusIconCellBreakpoint
				);
			});
		}
	}

	updateGridColumnsRowsAppearance() {
		const { gridOptions } = this.state;

		if (gridOptions && gridOptions.api) {
			gridOptions.api.sizeColumnsToFit();
			gridOptions.api.resetRowHeights();
		}
	}

	updateLocalStorageSettings(isInit, updateDebounce) {
		const { gridOptions } = this.state;
		const { webStorageKey } = this.props;
		let webStorageSettings = null;
		if (gridOptions && gridOptions.columnApi && webStorageKey) {
			if (isInit) {
				webStorageSettings = WebStorageService.getItem(webStorageKey);

				if (webStorageSettings) {
					if (webStorageSettings.columns) {
						webStorageSettings.columns.forEach((column) => {
							if (
								column.colId === FIELD_CHECKBOX_CELL &&
								column.width !== ColumnSystemCells.checkboxCell.width
							) {
								column.width = ColumnSystemCells.checkboxCell.width;
							}
						});

						gridOptions.columnApi.setColumnState(webStorageSettings.columns);
					}

					if (webStorageSettings.filter) {
						gridOptions.api.setFilterModel(webStorageSettings.filter);
					}

					if (webStorageSettings.sort) {
						gridOptions.api.setSortModel(webStorageSettings.sort);
					}
				}

				if (webStorageSettings && !webStorageSettings.columns) {
					WebStorageService.removeItem(webStorageKey);
				}

				// if (webStorageSettings.filter.hasOwnProperty('date') || webStorageSettings.filter.hasOwnProperty('dueToDate')) {
				// 	WebStorageService.removeItem(webStorageKey);
				
				// }

				if (!this.isUnmounted && !webStorageSettings && gridOptions && gridOptions.columnApi) {
					WebStorageService.setItem(webStorageKey, {
						columns: gridOptions.columnApi.getColumnState(),
						filter: gridOptions.api.getFilterModel(),
						sort: gridOptions.api.getSortModel(),
					});
				}
			} else {
				clearTimeout(this.updateLocalStorageSettingsTimeout);

				this.updateLocalStorageSettingsTimeout = setTimeout(() => {
					if (!this.isUnmounted && gridOptions && gridOptions.columnApi) {
						WebStorageService.setItem(webStorageKey, {
							columns: gridOptions.columnApi.getColumnState(),
							filter: gridOptions.api.getFilterModel(),
							sort: gridOptions.api.getSortModel(),
						});
					}
				}, updateDebounce || 500);
			}
		}
	}

	updateRows(callback) {
		const { gridOptions } = this.state;
		const rowsToUpdate = [];

		if (gridOptions && gridOptions.api && callback) {
			gridOptions.api.forEachNodeAfterFilterAndSort((rowNode) => {
				const updatedRowData = callback && callback(rowNode.data);

				if (updatedRowData) {
					rowsToUpdate.push(updatedRowData);
				}
			});

			gridOptions.api.applyTransaction({ update: rowsToUpdate });
		}
	}

	updateTabbedFilterItems() {
		const { gridOptions } = this.state;
		const { headTabbedFilterItemsFunc } = this.props;
		let rowData = null;

		let tabbedFilterItems = [];
		let currentFilterModel;

		if (gridOptions && gridOptions.api && headTabbedFilterItemsFunc) {
			rowData = this.getAllRows();
			tabbedFilterItems = headTabbedFilterItemsFunc(rowData);
			currentFilterModel = gridOptions.api.getFilterModel();

			if (Object.keys(currentFilterModel).length > 0) {
				tabbedFilterItems.forEach((tabbedFilterItem) => {
					if (
						currentFilterModel.hasOwnProperty(tabbedFilterItem.filter.field) &&
						tabbedFilterItem.filter.filterType !== 'date'
					) {
						if (
							currentFilterModel[tabbedFilterItem.filter.field].values &&
							tabbedFilterItem.filter.values
						) {
							currentFilterModel[tabbedFilterItem.filter.field].values.forEach((filterValue) => {
								if (tabbedFilterItem.filter.values.indexOf(filterValue) !== -1) {
									tabbedFilterItem.active = true;
								}
							});
						} else if (!currentFilterModel.hasOwnProperty(tabbedFilterItem.filter.field)) {
							tabbedFilterItems.forEach((tabbedFilterItem) => {
								if (tabbedFilterItem.filter.setNull) {
									tabbedFilterItem.active = true;
								}
							});
						}
					} else if (
						currentFilterModel.hasOwnProperty(tabbedFilterItem.filter.field) &&
						tabbedFilterItem.filter.filterType === 'date' &&
						tabbedFilterItem.filter.specificType === 'next30days'
					) {
						if (
							currentFilterModel[tabbedFilterItem.filter.field].dateFrom &&
							currentFilterModel[tabbedFilterItem.filter.field].dateTo &&
							tabbedFilterItem.filter.dateFrom &&
							tabbedFilterItem.filter.dateTo &&
							tabbedFilterItem.filter.dateFrom === moment().format(config.dateFormat.api) &&
							tabbedFilterItem.filter.dateTo === moment().add(30, 'days').format(config.dateFormat.api)
						) {
							tabbedFilterItem.active = true;
						}
					}
				});
			} else {
				tabbedFilterItems.forEach((tabbedFilterItem) => {
					if (tabbedFilterItem.filter.setNull) {
						tabbedFilterItem.active = true;
					}
				});
			}

			this.setState({
				tabbedFilterItems,
			});
		}
	}

	writePaginationRestoreState() {
		const { gridOptions } = this.state;

		if (gridOptions && gridOptions.api) {
			invoiz.cache = invoiz.cache || {};

			invoiz.cache.listAdvancedPaginationRestoreState = {
				currentPage: gridOptions.api.paginationGetCurrentPage(),
				pageSize: gridOptions.api.paginationGetPageSize(),
			};
		}
	}

	render() {
		const {
			currentActionCellPopupId,
			currentActionCellPopupItemData,
			frameworkComponents,
			gridOptions,
			hasFilter,
			hasNoRowData,
			isLoading,
			isPaginationReady,
			refreshGrid,
			rowCount,
			rowCountMax,
			rowData,
			rowsSelected,
			searchText,
			tabbedFilterItems,
			usePagination,
		} = this.state;

		const {
			actionCellPopup,
			emptyState,
			headViewSwitchAction,
			loadingRowsMessage,
			replaceSearchFieldInFirstHeadBarWith,
			firstHeadBarControlsInSecondHeadBar,
			searchFieldInSecondHeadBar,
			searchFieldPlaceholder,
			showDisabledOverlay,
			resources,
			hasFirstHeadBar
		} = this.props;

		const hasNoFilterResults = rowCount === 0;
		const hasSecondHeadBar = tabbedFilterItems.length > 0 || headViewSwitchAction;

		const emptyListContent = emptyState ? (
			<div className="list-advanced-component-empty-list">
				<div className="empty-list-content">
					<div className={`text-placeholder icon ${emptyState.iconClass}`} />
					<div className="text-h2">{emptyState.headline}</div>
					<div>{emptyState.subHeadline}</div>
					<div>{emptyState.buttons}</div>
				</div>
			</div>
		) : null;

		const headBarControls = (
			<div className="right-col">
				<div className={`icon-btn ${hasFilter ? '' : 'disabled'}`} onClick={() => this.onFilterClearClick()}>
					<div className="icon icon-filter_reset"></div>
					<div className="icon-label">Clear</div>
				</div>

				<div className="icon-btn" onClick={() => this.onShowColumnsSettingsModalClick()}>
					<div className="icon icon-settings"></div>
					<div className="icon-label">Select columns</div>
				</div>

				<div
					id="list-advanced-export-btn"
					className="icon-btn"
					onClick={() => {
						this.exportList(ListExportTypes.EXCEL);
					}}
				>
					<div className="icon icon-download2"></div>
					<div className="icon-label">Export columns</div>
				</div>

				{/* TODO: coming soon */}
				{/* <div id="list-advanced-export-btn" className="icon-btn">
					<div className="icon icon-export"></div>
					<div>Exportieren als </div>
					<div className="icon icon-arr_down"></div>
				</div> */}

				{/* TODO: coming soon */}
				{/* <PopoverComponent
					showOnClick={true}
					contentClass={`list-advanced-export-dropdown-content`}
					elementId={'list-advanced-export-btn'}
					entries={[
						[
							{
								label: 'Excel',
								name: ListExportTypes.EXCEL,
								icon: 'icon icon-excel',
							},
						],
					]}
					onClick={(entry) => {
						this.exportList(entry.name);
					}}
					offsetLeft={7}
					offsetTop={7}
					useOverlay={true}
				/> */}
			</div>
		);

		const searchContent = (
			<React.Fragment>
				{rowCount > -1 && rowCountMax > -1 ? (
					<div className="search-results-info">
						<span className="bold">Displayed:</span> <span>{rowCount}</span> of <span>{rowCountMax}</span>
						{rowsSelected.length > 0 ? (
							<React.Fragment>
								<span className="bold"> | Selected:</span> <span>{rowsSelected.length}</span>
							</React.Fragment>
						) : null}
					</div>
				) : null}

				{ !firstHeadBarControlsInSecondHeadBar ? <ListAdvancedSearchComponent
					value={searchText}
					placeholder={`Search`}
					onChange={(val) => this.onSearch(val)}
				/> : null}
			</React.Fragment>
		);

		return isLoading || refreshGrid ? (
			<LoaderComponent visible={true} text={loadingRowsMessage} />
		) : hasNoRowData && emptyListContent ? (
			emptyListContent
		) : (
			<div
				className={`${!hasFirstHeadBar ? (`list-advanced-component ag-theme-alpine ${usePagination ? '' : 'no-pagination'} ${
					hasSecondHeadBar ? 'has-second-head-bar' : ''
				} ${searchFieldInSecondHeadBar ? 'search-field-in-second-head-bar' : ''}`) : (`list-advanced-component-manual-entry ag-theme-alpine no-pagination`)}`}
			>
				<div className="checkbox-images-preload"></div>
				<div className="list-advanced-head">
					{
						!hasFirstHeadBar ? (<div className="head-first-bar">
							{firstHeadBarControlsInSecondHeadBar ? null : headBarControls}

							<div className="left-col">
								{searchFieldInSecondHeadBar
									? replaceSearchFieldInFirstHeadBarWith
										? replaceSearchFieldInFirstHeadBarWith()
										: searchContent
									: searchContent}
							</div>
						
					</div>) : null
					}
					{hasSecondHeadBar ? (
						<div className="head-second-bar">
							{searchFieldInSecondHeadBar ? <div className="search-content">{searchContent}</div> : null}

							{tabbedFilterItems.length > 0 ? (
								<div className="tabbed-filter-items">
									{tabbedFilterItems.map((filterItem, index) => {
										return (
											<div
												key={index}
												className={`tabbed-filter-item ${filterItem.active ? 'active' : ''}`}
												onClick={() => this.onTabbedFilterItemClick(filterItem)}
											>
												<div>
													{filterItem.label} <span>{filterItem.count}</span>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div></div>
							)}

							{firstHeadBarControlsInSecondHeadBar ? headBarControls : null}

							{/* {headViewSwitchAction ? (
								<InvoiceListViewswitchComponent
									isKanbanActive={false}
									onClick={() => headViewSwitchAction()}
								/>
							) : null} */}
						</div>
					) : null}
				</div>

				{actionCellPopup &&
				(actionCellPopup.popupEntries || actionCellPopup.popupEntriesFunc) &&
				actionCellPopup.onPopupItemClicked ? (
					<PopoverComponent
						ref={'actionCellPopup'}
						contentClass={`customer-list-cell-dropdown-content`}
						elementId={currentActionCellPopupId}
						entries={
							actionCellPopup.popupEntries ||
							actionCellPopup.popupEntriesFunc(currentActionCellPopupItemData)
						}
						onClick={(entry) => {
							actionCellPopup.onPopupItemClicked(currentActionCellPopupItemData, entry);
						}}
						offsetLeft={13}
						offsetTop={5}
						useOverlay={true}
					/>
				) : null}

				<div className={`ag-grid-container ${showDisabledOverlay ? 'disabled' : ''}`}>
					<AgGridReact
						gridOptions={gridOptions}
						rowData={rowData}
						frameworkComponents={frameworkComponents}
						modules={AllModules}
					></AgGridReact>
				</div>

				{hasNoFilterResults ? null : (
					<ListAdvancedPaginationComponent
						gridOptions={gridOptions}
						visible={isPaginationReady}
						usePagination={usePagination}
					/>
				)}
			</div>
		);
	}
}

export default ListAdvancedComponent;
