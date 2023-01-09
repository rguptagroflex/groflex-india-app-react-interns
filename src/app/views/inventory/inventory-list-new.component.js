import React from 'react';
import invoiz from 'services/invoiz.service';
import lang from 'lang';
import moment from 'moment';
import config from 'config';
import _ from 'lodash';
import accounting from 'accounting';
import TopbarComponent from 'shared/topbar/topbar.component';
import ListAdvancedComponent from 'shared/list-advanced/list-advanced.component';
import ButtonComponent from 'shared/button/button.component';
import WebStorageKey from 'enums/web-storage-key.enum';
import Inventory from 'models/inventory.model';
import InventoryHistory from 'models/inventory-history.model';
import Payment from 'models/payment.model';
import LoadingService from 'services/loading.service';
import ModalService from 'services/modal.service';

import DeleteRowsModal from 'shared/modals/list-advanced/delete-rows-modal.component';
import { ListAdvancedDefaultSettings, transactionTypes } from 'helpers/constants';
import { localeCompare, localeCompareNumeric, dateCompare, dateCompareSort } from 'helpers/sortComparators';
import { getScaledValue } from 'helpers/getScaledValue';
import { formatCurrency } from 'helpers/formatCurrency';
import userPermissions from 'enums/user-permissions.enum';
import planPermissions from "enums/plan-permissions.enum";
import ChargebeePlan from "enums/chargebee-plan.enum";

import { updateStatusIconCellColumns } from 'helpers/list-advanced/updateStatusIconCellColumns';
import { connect, Provider } from 'react-redux';
import store from 'redux/store';
import { formatDate, formatApiDate, formatClientDate } from 'helpers/formatDate';
import InventoryManualEntryModalComponent from 'shared/modals/inventory-manual-entry.modal.component';
import RestrictedOverlayComponent from 'shared/overlay/restricted-overlay.component';

class InventoryListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			inventoryData: null,
			selectedRows: [],
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_OFFER),
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA)
		};
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}


	createTopbar() {
		const { isLoading, selectedRows} = this.state;
		const { resources } = this.props;
		const topbarButtons = [];

		if (!isLoading) {
            if (selectedRows && selectedRows.length > 0) {
                topbarButtons.push({
                    type: 'danger',
                    label: resources.str_clear,
                    buttonIcon: 'icon-trashcan',
					action: 'delete-inventory-entries',
                });
            }
    
                topbarButtons.push({
                    type: 'primary',
                    label: `New manual entry`,
                    buttonIcon: 'icon-plus',
					action: 'create',
                });
		}

		const topbar = (
			<TopbarComponent
            title={`Stock movement`}
            viewIcon={`icon-article`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action, selectedRows)}
				buttons={topbarButtons}
			/>
		);

		return topbar;
	}

	onActionCellPopupItemClick(inventoryItem, entry) {
		const { resources } = this.props;
		switch (entry.action) {

			case 'delete':
				ModalService.open(`${`Would you like to delete this stock movement entry?`} ${resources.str_undoneMessage}`, {
					width: 600,
					headline: `Remove entry from stock movement`,
					cancelLabel: resources.str_abortStop,
					confirmIcon: 'icon-trashcan',
					confirmLabel: resources.str_clear,
					confirmButtonType: 'secondary',
					onConfirm: () => {
						ModalService.close();
						invoiz
			.request(`${config.resourceHost}inventory/history/${inventoryItem.id}`, {
				auth: true,
				method: 'DELETE'
			})
			.then((response) => {
                invoiz.page.showToast({ message: `Successfully removed entry from stock movement!` });
				ModalService.close();
						if (this.refs.listAdvanced) {
						this.refs.listAdvanced.removeSelectedRows([inventoryItem]);
					}
					invoiz.router.reload();
			    });
			}
				});
				break;
		}
	}

	onTopbarButtonClick(action, selectedRows) {
		const { resources } = this.props;
		switch (action) {
			case 'create':
				ModalService.open(
					<InventoryManualEntryModalComponent
						resources={resources}
						onClose={() => {
							ModalService.close();
							// if (this.refs.listAdvanced) {
							// 	this.refs.listAdvanced.updateRowStockData(selectedRows, updateddata);
							// }
							invoiz.router.reload();
						}}
					/>,
					{
						isClosable: true,
						width: 850,
						padding: '10px 30px 10px',
						borderRadius: '6px'
					}
				);
				break;
			case 'delete-inventory-entries':
					if (this.refs.listAdvanced) {
						let selectedRowsData = this.refs.listAdvanced.getSelectedRows({
							prop: 'title',
							sort: 'asc',
						});
	
						selectedRowsData = selectedRowsData.map((item) => {
							return new InventoryHistory(item);
						});
	
						ModalService.open(
							<DeleteRowsModal
								deleteUrlPrefix={`${config.resourceHost}inventory/history/`}
								text="Are you sure you would like to delete the following stock movement entries? This action cannot be undone!"
								firstColLabelFunc={(item) => formatClientDate(item.itemModifiedDate)}
								secondColLabelFunc={(item) => item.title}
								selectedItems={selectedRowsData}
								onConfirm={(response) => {
									if (this.refs.listAdvanced) {
										this.refs.listAdvanced.removeSelectedRows();
									}
	
									ModalService.close();
									invoiz.router.reload();
								}}
							/>,
							{
								width: 500,
								headline: 'Delete stock movement entries',
							}
						);
					}
	
					break;
		}
	}

	render() {
		const { resources } = this.props;
		const { planRestricted, canChangeAccountData } = this.state;
		// const { canUpdateArticle, canDeleteArticle, canCreateArticle } = this.state;
		return (
			<div className="inventory-list-component-wrapper">
				{this.createTopbar()}

				{planRestricted ? (
					<RestrictedOverlayComponent
						message={
							canChangeAccountData
								? invoiz.user.planId === ChargebeePlan.FREE_PLAN_2021
									? 'Get access to unlimited quotations at ₹999'
									: `Currently you’re on the ${invoiz.user.planId === `Std_Yly_21` ? `Standard Yearly` : `Starter Yearly`} plan. Please upgrade your plan to create quotations`
								: `You don’t have permission to access quotations`
						}
						owner={canChangeAccountData}
					/>
				) : null}

				<div className="inventory-list-wrapper">
					<ListAdvancedComponent
						resources={this.props.resources}
						ref="listAdvanced"
						columnDefs={[
							{
								headerName: 'Article name',
								field: 'title',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
							{
								headerName: 'Date modified',
								field: 'itemModifiedDate',
								filter: true,
								//comparator: (date1, date2) => dateCompareSort(date1, date2, config.dateFormat.client),
								cellRenderer: (evt) => {
									return moment(evt.value).format(config.dateFormat.client)
								},
								// filterParams: {
								// 	suppressAndOrCondition: true,
								// 	//filterOptions: ListAdvancedDefaultSettings.DATE_FILTER_PARAMS_OPTIONS,
								// 	comparator: (filterLocalDateAtMidnight, cellValue) =>
								// 		dateCompare(filterLocalDateAtMidnight, moment(cellValue).format(config.dateFormat.client), config.dateFormat.client),
								// },
							},
                            {
								headerName: 'Action',
								field: 'action',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								cellStyle: () => {
									return {textTransform: 'capitalize'}
								},
								cellRenderer: (evt) => {
									// return evt.value === undefined || evt.value === null ? `Opening balance` : evt.value;
									return evt.value;
								},
								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
							{
								headerName: 'Quantity moved',
								field: 'openingQuantity',
								maxWidth: 200,
								comparator: localeCompareNumeric,
								// cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								cellRenderer: (evt) => {
									return evt.value === Infinity ? '' : (evt.data.action === 'incoming' || evt.data.action === null ? `+ ${evt.value} ${evt.data.unit}` : `- ${evt.value} ${evt.data.unit}`)
								},
								filter: 'agNumberColumnFilter',
								filterParams: {
									suppressAndOrCondition: true,
								},
								// customProps: {
								// 	calculateHeaderSum: true,
								// },
							},
							{
								headerName: 'Historical stock',
								field: 'currentStock',
								maxWidth: 200,
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(86, window.innerWidth, 1600),
								cellRenderer: (evt) => {
									return evt.value === Infinity ? '' : (`${evt.value} ${evt.data.unit}`)
								},
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
								filter: 'agNumberColumnFilter',
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									longName: 'Historical stock',
									convertNumberToTextFilterOnDemand: true,
								},
							},
							// {
							// 	headerName: 'Category',
							// 	hide:true,
							// 	field: 'category',
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	comparator: localeCompare,
							// 	...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
                            // },
							// {
							// 	headerName: 'Sales Price (gross)',
							// 	hide: true,
							// 	field: 'priceGross',
							// 	//suppressMovable: true,
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	comparator: localeCompareNumeric,
							// 	cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
							// 	valueFormatter: (evt) => {
							// 		return formatCurrency(evt.value);
							// 	},
							// 	filter: 'agNumberColumnFilter',
							// 	filterParams: {
							// 		suppressAndOrCondition: true,
							// 	},
							// 	customProps: {
							// 		calculateHeaderSum: true,
							// 	},
							// },
							{
								headerName: 'Purchase price',
								maxWidth: 250,
								field: 'purchasePrice',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								valueFormatter: (evt) => {
									return formatCurrency(evt.value);
								},
								cellRenderer: (evt) => {
									//return evt.data.action === 'outgoing' ? null : formatCurrency(evt.value);
									return evt.data.action === `outgoing` ? null : formatCurrency(evt.value);
								},
								filter: 'agNumberColumnFilter',
								filterParams: {
									suppressAndOrCondition: true,
								},
								cellStyle: (evt) => {
									return { textAlign: 'left' }
								},
								// customProps: {
								// 	calculateHeaderSum: true,
								// },
							},
							{
								headerName: 'Purchase value',
								field: 'value',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
								cellRenderer: (evt) => {
									return evt.data.action === 'outgoing' ? null : formatCurrency(evt.data.openingQuantity * evt.data.purchasePrice);
								},
								filter: 'agNumberColumnFilter',
								filterParams: {
									suppressAndOrCondition: true,
								},
								cellStyle: (evt) => {
									return { textAlign: 'left' }
								},
								// customProps: {
								// 	calculateHeaderSum: true,
								// },
							},

							{
								headerName: 'Source',
								field: 'source',
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								cellStyle: () => {
									return {textTransform: 'capitalize'}
								},
								cellRenderer: (evt) => {
									const sourceValues = evt.value !== null ? evt.value.split(",") : []
									if(sourceValues.length >= 2 && sourceValues !== null) {
										if (sourceValues[0] === 'invoice') {
											return `<a href=/${sourceValues[0]}/${sourceValues[2]}>${sourceValues[0]} ${sourceValues[1]}</a>`
										} else if (sourceValues[0] === 'expense') {
											return `<a href=/${sourceValues[0]}/edit/${sourceValues[2]}>${sourceValues[0]} ${sourceValues[1]}</a>`
										}	
									}  else if (sourceValues.length === 1 && evt.value === `manual`) {
										return `Manual`;
									} else {
										return `Opening Balance`;
									}

									// else if (evt.value === undefined || evt.value === null) {
									// 	return `Opening balance`;
									// }
									
								},
								// cellRenderer: 'btnCellRenderer',
								// cellRendererParams: {
								// 	resources,
								// 	type: `inventorySourceBtns`
								// },
								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
							// {
							// 	headerName: 'Default sales price',
							// 	field: 'price',
							// 	hide: true,
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	comparator: localeCompareNumeric,
							// 	cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
							// 	valueFormatter: (evt) => {
							// 		return formatCurrency(evt.value);
							// 	},
							// 	filter: 'agNumberColumnFilter',
							// 	filterParams: {
							// 		suppressAndOrCondition: true,
							// 	},
							// 	customProps: {
							// 		calculateHeaderSum: true,
							// 	},
							// 	cellStyle: (evt) => {
							// 		return { textAlign: 'left' }
							// 	},
							// },
						]}
						defaultSortModel={{
							colId: 'itemModifiedDate',
							sort: 'asc',
						}}
						emptyState={{
							iconClass: 'icon-article',
							headline: 'No stock movements yet',
							subHeadline: `Create articles and track them in your inventory`,
							buttons: (
								<React.Fragment>
									<ButtonComponent
					label={resources.createArticle}
					buttonIcon="icon-plus"
					dataQsId="empty-list-create-button"
					callback={() => invoiz.router.navigate('/article/new')}
					//disabled={!canCreateArticle}
				/>
								</React.Fragment>
							),
						}}
                        fetchUrls={[
							`${config.resourceHost}inventory/history?offset=0&searchText=&limit=9999999&orderBy=itemModifiedDate&desc=false`,
							`${config.resourceHost}inventory/?offset=0&searchText=&limit=9999999&orderBy=articleId&desc=false`
						]}
						onMultiRowData={(responses) => {
								responses = responses[0].map((item, index) => {
								item = new InventoryHistory(item);

								// item.itemModifiedDate = item.itemModifiedDate
								// ? moment(item.itemModifiedDate).format(config.dateFormat.client)
								// : '';

								responses[1].map((inventoryItem) => {
									if (item['inventoryId'] === inventoryItem['id']) {
										item['title'] = inventoryItem['title'];
										item['unit'] = inventoryItem['unit'];
										item['price'] = inventoryItem['price'];
										// if (index === 0) {
										// 		item['source'] = null;
										// 		item['action'] = null;
										// }
									}
								})

								return item;
							});

							return responses;
						}}
						exportExcelCallbacks={{
							processCellCallback: (params) => {
								let value = params.value;

								// if (params.column.colId === 'state') {
								// 	value = this.getStateIconLabel(value).text;
								// }

								// if (params.column.colId === 'type') {
								// 	value = this.getTypeLabel(value);
								// }

								return value;
							},
						}}
						columnsSettingsModalWidth={680}
						exportFilename={`Stock movement list ${moment().format(config.dateFormat.client)}`}
						multiSelect={true}
						usePagination={true}
						suppressRowClickSelection={true}
						searchFieldPlaceholder={'Stock movement'}
						loadingRowsMessage={'Loading stock movement ...'}
						noFilterResultsMessage={'No stock movement'}
						webStorageKey={WebStorageKey.INVENTORY_LIST_SETTINGS}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								const entries = [];
								let inventoryItem = null;

								if (item) {
									inventoryItem = new InventoryHistory(item);
								//	if (canUpdateArticle && canDeleteArticle) {
                                    entries.push(
                                        {
                                            dataQsId: `inventory-list-item-dropdown-entry-delete`,
                                            label: `Delete entry`,
                                            action: 'delete'
                                        }
                                    )
                                    
                                    // entries.push(
                                    //     {
                                    //         dataQsId: `article-list-item-dropdown-entry-edit`,
                                    //         label: resources.str_toEdit,
                                    //         action: 'edit'
                                    //     }
                                    // )
								//	}	
									if (entries.length === 0) {
										entries.push({
											label: 'No action available',
											customEntryClass: 'popover-entry-disabled',
										});
									}		
								}

								return [entries];
							},
							onPopupItemClicked: (itemData, popupEntry) => {
								this.onActionCellPopupItemClick(itemData, popupEntry);
							},
						}}
						onRowDataLoaded={(inventoryData) => {
							if (!this.isUnmounted) {
								this.setState({
									inventoryData,
									isLoading: false,
								});
							}
						}}
						// onRowClicked={(article) => {
						// 	invoiz.router.navigate(`/article/${article.articleId}`);
						// }}
						onRowSelectionChanged={(selectedRows) => {
							if (!this.isUnmounted) {
								this.setState({ selectedRows });
							}
						}}
					/>
				</div>
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return {
		resources
	};
};

export default connect(mapStateToProps)(InventoryListComponent);

