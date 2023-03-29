import React from "react";
import invoiz from "services/invoiz.service";
import lang from "lang";
import moment from "moment";
import _ from "lodash";
import config from "config";
// import { getLabelForCountry } from "helpers/getCountries";
import TopbarComponent from "shared/topbar/topbar.component";
import { formatCurrency } from "helpers/formatCurrency";
import ModalService from "services/modal.service";
import DeleteRowsModal from "shared/modals/list-advanced/delete-rows-modal.component";
import ListAdvancedComponent from "shared/list-advanced/list-advanced.component";
import ButtonComponent from "shared/button/button.component";
// import UpgradeFullscreenModalComponent from 'shared/modals/upgrade-fullscreen-modal.component';
import ChargebeePlan from "enums/chargebee-plan.enum";
// import AppType from 'enums/apps/app-type.enum';
// import { navigateToAppId } from 'helpers/apps/navigateToAppId';
import { customerTypes, ListAdvancedDefaultSettings } from "helpers/constants";
import { localeCompare, localeCompareNumeric } from "helpers/sortComparators";
import { getScaledValue } from "helpers/getScaledValue";
import WebStorageKey from "enums/web-storage-key.enum";
import WebStorageService from "services/webstorage.service";
import { isNil } from "helpers/isNil";
import userPermissions from "enums/user-permissions.enum";
import ChartOfAccountPersonModalComponent from "./chartofaccount-personmodalcomponent.js";
import { connect, Provider } from "react-redux";
import store from "redux/store";
import Customer from "../../models/customer.model";
import { formatCurrencySymbolDisplayInFront } from "helpers/formatCurrency";

const LABEL_COMPANY = "Company";
const LABEL_PERSON = "Individual";
const LABEL_CONTACTPERSON = "Contact person";

class ChartofaccountNewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			customerData: null,
			selectedRows: [],
			canCreateCustomer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_CUSTOMER),
			canUpdateCustomer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_CUSTOMER),
			canDeleteCustomer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_CUSTOMER),
		};
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	createTopbar() {
		const { customerData, isLoading, selectedRows, canCreateCustomer, canDeleteCustomer } = this.state;

		const topbarButtons = [];

		if (!isLoading) {
			// topbarButtons.push({
			// 	type: 'danger',
			// 	label: 'Delete',
			// 	buttonIcon: 'icon-trashcan',
			// 	action: 'delete-customers',
			// 	disabled: !selectedRows || (selectedRows && selectedRows.length === 0) || !canDeleteCustomer,
			// });

			topbarButtons.push({
				type: "primary",
				label: "New accounts",
				buttonIcon: "icon-plus",
				action: "create",
				disabled: !canDeleteCustomer,
			});
		}

		// if (!isLoading && (!customerData || customerData.length === 0)) {
		// 	topbarButtons.push({
		// 		type: 'primary',
		// 		label: 'Import customer',
		// 		buttonIcon: 'icon-plus',
		// 		action: 'import',
		// 	});
		// }

		const topbar = (
			<TopbarComponent
				title={`Chart of accounts`}
				// viewIcon={`icon-customer`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
				// onClick={(button) => this.onEditChartOfAccount(button.index)}
				// callback={()=> this.onAddNewAccounts()}
				buttons={topbarButtons}

				// viewIconLongClickAction={() => {
				// 	ModalService.open(<div>Möchtest du die alte Kundenliste wieder aktivieren?</div>, {
				// 		headline: 'Alte Kundenliste aktivieren',
				// 		cancelLabel: 'Nein',
				// 		confirmLabel: 'Ja',
				// 		confirmIcon: 'icon-check',
				// 		confirmButtonType: 'primary',
				// 		onConfirm: () => {
				// 			ModalService.close();
				// 			WebStorageService.removeItem(WebStorageKey.USE_NEW_CUSTOMERLIST);
				// 			invoiz.router.navigate('/customers');
				// 		},
				// 	});
				// }}
			/>
		);

		return topbar;
	}

	getCompanyPersonIcon(value, personIconWidth, blankContactPersonIcon, isMainContact) {
		const masterDetailArrowClass = !isNil(isMainContact) && isMainContact.toString() === "false" ? "grey" : "";

		return value === customerTypes.PERSON
			? `<span class="icon-user-wrapper"><img src="/assets/images/svg/user.svg" width="${personIconWidth}" /></span>`
			: value === ListAdvancedDefaultSettings.CUSTOMER_TYPE_CONTACTPERSON
			? blankContactPersonIcon
				? ""
				: `<span class="icon icon-arrow_right2 master-detail-arrow ${masterDetailArrowClass}"></span>`
			: `<span class="icon icon-factory"></span>`;
	}
	// onEditChartOfAccount(index) {
	// 	const { customer, salutations, titles } = this.state;
	// 	const { jobTitles, resources } = this.props;
	// 	const cP = new ContactPerson(customer.contactPersons[index]);

	// 	ModalService.open(
	// 		<ChartOfAccountPersonModalComponent
	// 			contactPerson={cP}
	// 			salutations={salutations}
	// 			titles={titles}
	// 			jobTitles={jobTitles}
	// 			onSalutationsChange={(salutations) => this.setState({ salutations })}
	// 			onTitlesChange={(titles) => this.setState({ titles })}
	// 			onSave={(contactPerson) => {
	// 				ModalService.close();
	// 				customer.contactPersons[index] = contactPerson;
	// 				this.setState({ customer });
	// 			}}
	// 			resources={resources}
	// 		/>,
	// 		{
	// 			modalClass: "edit-contact-person-modal-component",
	// 			width: 800,
	// 		}
	// 	);
	// }

	onActionCellPopupItemClick(customer, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case "edit":
				if (this.refs.listAdvanced) {
					this.refs.listAdvanced.writePaginationRestoreState();
				}

				invoiz.router.navigate(`/customer/edit/${customer.id}`);
				break;

			case "delete":
				ModalService.open(resources.customerDeleteConfirmText, {
					width: 500,
					headline: "Delete contact",
					cancelLabel: "Cancel",
					confirmIcon: "icon-trashcan",
					confirmLabel: "Delete",
					confirmButtonType: "danger",
					onConfirm: () => {
						invoiz
							.request(`${config.resourceHost}customer/${customer.id}`, {
								auth: true,
								method: "DELETE",
							})
							.then(() => {
								invoiz.page.showToast({ message: resources.customerDeleteSuccessMessage });

								ModalService.close();

								if (this.refs.listAdvanced) {
									this.refs.listAdvanced.removeSelectedRows([customer]);
								}
							})
							.catch((res) => {
								const { body } = res;

								const errorMessage =
									body.meta.id && body.meta.id[0].code === "NOT_ALLOWED"
										? resources.customerDeleteNotAllowedMessage
										: resources.defaultErrorMessage;

								invoiz.page.showToast({ type: "error", message: errorMessage });
							});
					},
				});
				break;
		}
	}

	// onCustomerImportClick() {
	// 	if (invoiz.user.subscriptionData.planId !== ChargebeePlan.TRIAL && !invoiz.user.isAppEnabledImport()) {
	// 		navigateToAppId(AppType.IMPORT);

	// 		invoiz.showNotification({
	// 			message: 'Du musst diese App buchen, um sie zu nutzen',
	// 			type: 'error',
	// 		});
	// 	} else if (invoiz.user.subscriptionData.planId === ChargebeePlan.TRIAL && !invoiz.user.isAppEnabledImport()) {
	// 		invoiz.showNotification({
	// 			message: 'Du musst invoiz freischalten, um den Import nutzen zu können.',
	// 			type: 'error',
	// 		});

	// 		ModalService.open(<UpgradeFullscreenModalComponent title="Zeit durchzustarten" />, {
	// 			isFullscreen: true,
	// 			isCloseable: true,
	// 		});
	// 	} else {
	// 		invoiz.router.navigate('/settings/data-import/customers/1', null, null, true);
	// 	}
	// }

	onAddNewAccounts() {
		// const { customer, salutations, titles } = this.state;
		// const { jobTitles, resources } = this.props;

		ModalService.open(<ChartOfAccountPersonModalComponent />, {
			modalClass: "edit-contact-person-modal-component",
			width: 630,
		});
	}

	onTopbarButtonClick(action) {
		const { resources } = this.props;
		const { canCreateCustomer, canDeleteCustomer, canUpdateCustomer } = this.state;
		let selectedRowsData = null;
		let allRowsData = null;

		// ModalService.open(<onAddNewAccounts />);

		switch (action) {
			case "create":
				// invoiz.router.navigate("/customer/new");
				this.onAddNewAccounts();
				break;

			case "import":
				this.onCustomerImportClick();
				break;

			case "delete-customers":
				if (this.refs.listAdvanced) {
					allRowsData = this.refs.listAdvanced.getAllRows();

					selectedRowsData = this.refs.listAdvanced.getSelectedRows({
						prop: "number",
						sort: "asc",
					});

					selectedRowsData = _.uniq(selectedRowsData, "id");
					selectedRowsData.sort((a, b) => localeCompareNumeric(a.number, b.number));

					selectedRowsData.forEach((selectedColData, index) => {
						let relatedCompanyObject = null;

						if (selectedColData.kind === ListAdvancedDefaultSettings.CUSTOMER_TYPE_CONTACTPERSON) {
							relatedCompanyObject = allRowsData.find(
								(colData) => colData.kind === customerTypes.COMPANY && colData.id === selectedColData.id
							);

							if (relatedCompanyObject) {
								selectedRowsData[index] = relatedCompanyObject;
							}
						}
					});

					ModalService.open(
						<DeleteRowsModal
							deleteUrlPrefix={`${config.resourceHost}customer/`}
							text="Do you really want to delete the following contact(s)? This action cannot be undone!"
							firstColLabelFunc={(item) => item.number}
							secondColLabelFunc={(item) => item.name}
							selectedItems={selectedRowsData}
							getErrorMessage={(errors) => {
								const { body } = errors;

								return body.meta.id && body.meta.id[0].code === "NOT_ALLOWED"
									? resources.customersDeleteNotAllowedMessage
									: resources.defaultErrorMessage;
							}}
							onConfirm={() => {
								invoiz.router.reload();

								ModalService.close();
							}}
						/>,
						{
							width: 500,
							headline: "Delete contact(s)",
						}
					);
				}

				break;
		}
	}

	onActionSettingPopupItemClick(entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case "customercategory":
				invoiz.router.navigate("/settings/more-settings/customer-categories");
				break;
			case "moresettings":
				invoiz.router.navigate("/settings/more-settings/customer");
				break;
		}
	}
	render() {
		const { resources } = this.props;
		const { canCreateCustomer, canUpdateCustomer, canDeleteCustomer, customerData } = this.state;
		return (
			<div className="customer-list-component-wrapper">
				{this.createTopbar()}

				<div className="customer-list-wrapper">
					<ListAdvancedComponent
						ref="listAdvanced"
						columnDefs={[
							{
								headerName: "Code",
								field: "number",
								sort: "asc",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(86, window.innerWidth, 1600),
								comparator: localeCompareNumeric,
								cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
								filter: "agNumberColumnFilter",
								filterParams: {
									suppressAndOrCondition: true,
								},
								customProps: {
									longName: "Number",
									convertNumberToTextFilterOnDemand: true,
								},
							},
							// {
							// 	headerName: "Type",
							// 	field: "kind",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	width: getScaledValue(60, window.innerWidth, 1600),
							// 	cellRenderer: (evt) => {
							// 		return this.getCompanyPersonIcon(evt.value, 20, true);
							// 	},
							// 	filterParams: {
							// 		suppressMiniFilter: true,
							// 		comparator: (a, b) => {
							// 			let pos = 0;

							// 			if (
							// 				a === customerTypes.COMPANY ||
							// 				a === ListAdvancedDefaultSettings.CUSTOMER_TYPE_CONTACTPERSON
							// 			) {
							// 				pos = 1;
							// 			}

							// 			if (a === customerTypes.PERSON) {
							// 				pos = 0;
							// 			}

							// 			return pos;
							// 		},
							// 		valueFormatter: (evt) => {
							// 			return evt.value === customerTypes.PERSON
							// 				? LABEL_PERSON
							// 				: evt.value === customerTypes.COMPANY
							// 				? LABEL_COMPANY
							// 				: LABEL_CONTACTPERSON;
							// 		},
							// 	},
							// 	customProps: {
							// 		longName: "Contact kind",
							// 		disableContextMenuCopyItem: true,
							// 		filterListItemValueRenderer: (value, listItemHtml) => {
							// 			const iconHtml = this.getCompanyPersonIcon(value, 15);
							// 			$(iconHtml).insertBefore($(listItemHtml).find(".ag-set-filter-item-value"));
							// 		},
							// 	},
							// },
							{
								headerName: "Account type",
								field: "type",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(100, window.innerWidth, 500),
								cellRenderer: (evt) => {
									return evt.data.type === `customer` ? `Customer` : `Payee`;
								},
								comparator: localeCompare,
								customProps: {
									longName: "Contact type",
								},
							},
							{
								headerName: "Account Sub Type",
								field: "name",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								width: getScaledValue(210, window.innerWidth, 1600),
								cellRenderer: (evt) => {
									return (
										(evt.data.kind === ListAdvancedDefaultSettings.CUSTOMER_TYPE_CONTACTPERSON
											? `${this.getCompanyPersonIcon(
													evt.data.kind,
													20,
													false,
													evt.data.isMainContact
											  )} `
											: "") + evt.value
									);
								},
								comparator: localeCompare,
								...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							},
							// {
							// 	headerName: "Outstanding amount",
							// 	field: "outstandingAmount",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	comparator: localeCompareNumeric,
							// 	cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Currency,
							// 	valueFormatter: (evt) => {
							// 		return formatCurrency(evt.value);
							// 	},
							// 	filter: "agNumberColumnFilter",
							// 	filterParams: {
							// 		suppressAndOrCondition: true,
							// 	},
							// 	customProps: {
							// 		calculateHeaderSum: true,
							// 	},
							// },
							// {
							// 	headerName: 'Outstanding Balance',
							// 	field: 'outstandingAmount',
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	width: getScaledValue(150, window.innerWidth, 1600),
							// 	comparator: localeCompareNumeric,
							// 	filterParams: {
							// 		suppressMiniFilter: true,
							// 	},
							// 	valueFormatter: (evt) => {
							// 		console.log('evt', evt)
							// 		return evt.value === '' || evt.value === null ? 'INR' : formatCurrencySymbolDisplayInFront(evt.value);
							// 	},
							// },
							// {
							// 	headerName: "First name",
							// 	field: "firstName",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	hide: true,
							// 	comparator: localeCompare,
							// 	...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							// },
							// {
							// 	headerName: "Last name",
							// 	field: "lastName",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	hide: true,
							// 	comparator: localeCompare,
							// },
							// {
							// 	headerName: "Status",
							// 	field: "street",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	width: getScaledValue(225, window.innerWidth, 1600),
							// 	comparator: localeCompare,
							// 	cellRenderer: "inlineActionCellRenderer",
							// 	...Object.assign({}, ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS, {
							// 		customProps: {
							// 			...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS.customProps,
							// 			inlineActionType: ListAdvancedDefaultSettings.CellInlineActionType.MAPS,
							// 		},
							// 	}),
							// },
							// {
							// 	headerName: 'Country',
							// 	field: 'country',
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	hide: true,
							// 	comparator: localeCompare,
							// },
							// {
							// 	headerName: "E-Mail",
							// 	field: "email",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	width: getScaledValue(220, window.innerWidth, 1600),
							// 	cellRenderer: "inlineActionCellRenderer",
							// 	customProps: {
							// 		inlineActionType: ListAdvancedDefaultSettings.CellInlineActionType.MAIL,
							// 	},
							// },
							// {
							// 	headerName: "Website",
							// 	field: "website",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	hide: true,
							// 	...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS,
							// 	cellRenderer: "inlineActionCellRenderer",
							// 	...Object.assign({}, ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS, {
							// 		customProps: {
							// 			...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS.customProps,
							// 			inlineActionType: ListAdvancedDefaultSettings.CellInlineActionType.WEBSITE,
							// 		},
							// 	}),
							// },
							// {
							// 	headerName: "Telephone",
							// 	field: "phone1",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	width: getScaledValue(160, window.innerWidth, 1600),
							// 	cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
							// 	...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS_PHONE,
							// },
							// {
							// 	headerName: "Telephone 2",
							// 	field: "phone2",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
							// 	hide: true,
							// 	...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS_PHONE,
							// },
							// {
							// 	headerName: "Mobile number",
							// 	field: "mobile",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
							// 	...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS_PHONE,
							// },
							// {
							// 	headerName: "Fax",
							// 	field: "fax",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.String,
							// 	hide: true,
							// 	...ListAdvancedDefaultSettings.TEXT_FILTER_OPTIONS_PHONE,
							// },
							// {
							// 	headerName: 'Main contact person',
							// 	field: 'isMainContact',
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	hide: true,
							// 	cellRenderer: (evt) => {
							// 		return isNil(evt.value) ? '' : evt.value.toString() === 'true' ? 'Ja' : 'Nein';
							// 	},
							// 	filterParams: {
							// 		suppressMiniFilter: true,
							// 		valueFormatter: (evt) => {
							// 			return isNil(evt.value)
							// 				? '(Read)'
							// 				: evt.value.toString() === 'true'
							// 				? 'Yes'
							// 				: 'No';
							// 		},
							// 	},
							// },
							{
								headerName: "Description",
								field: "category",
								minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
								comparator: localeCompare,
								filterParams: {
									suppressMiniFilter: true,
								},
							},
							// {
							// 	headerName: "Status",
							// 	field: "category",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	comparator: localeCompare,
							// 	filterParams: {
							// 		suppressMiniFilter: true,
							// 	},
							// },
							// {
							// 	headerName: "Currency",
							// 	field: "baseCurrency",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	comparator: localeCompare,
							// 	valueFormatter: (evt) => {
							// 		return evt.value === "" || evt.value === null ? "INR" : evt.value;
							// 	},
							// 	filterParams: {
							// 		suppressMiniFilter: true,
							// 		valueFormatter: (evt) => {
							// 			return !evt.value ? `INR` : evt.value;
							// 		},
							// 	},
							// },
							// {
							// 	headerName: "GST number",
							// 	field: "address.gstNumber",
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	comparator: localeCompare,
							// 	filterParams: {
							// 		suppressMiniFilter: true,
							// 	},
							// },
							// {
							// 	headerName: 'Payment term',
							// 	field: 'payCondition',
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	hide: true,
							// 	comparator: localeCompare,
							// 	filterParams: {
							// 		suppressMiniFilter: true,
							// 	},
							// },
							// {
							// 	headerName: 'Discount',
							// 	field: 'discount',
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	hide: true,
							// 	valueFormatter: function (params) {
							// 		return params.value + '%';
							// 	},
							// 	cellClass: ListAdvancedDefaultSettings.EXCEL_STYLE_IDS.Percentage,
							// },
							// {
							// 	headerName: 'Zipcode',
							// 	field: 'address.zipCode',
							// 	hide: true,
							// 	width: getScaledValue(80, window.innerWidth, 1600),
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	comparator: localeCompareNumeric,
							// 	filter: 'agNumberColumnFilter',
							// 	filterParams: {
							// 		suppressAndOrCondition: true,
							// 	},
							// },
							// {
							// 	headerName: 'City',
							// 	field: 'address.city',
							// 	hide: true,
							// 	width: getScaledValue(160, window.innerWidth, 1600),
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	comparator: localeCompare,
							// },
							// {
							// 	headerName: 'status',
							// 	field: 'notes',
							// 	minWidth: ListAdvancedDefaultSettings.COLUMN_MIN_WIDTH,
							// 	hide: true,
							// 	comparator: localeCompare,
							// },
						]}
						defaultSortModel={{
							colId: "number",
							sort: "asc",
						}}
						emptyState={{
							iconClass: "icon-customer",
							headline: resources.contactEmptyListHeadingText,
							subHeadline: resources.contactEmptyListCreateContactText,
							buttons: (
								<React.Fragment>
									<ButtonComponent
										label={resources.contactCreateButtonText}
										buttonIcon="icon-plus"
										dataQsId="empty-list-create-button"
										callback={() => invoiz.router.navigate("/customer/new")}
										disabled={!canCreateCustomer}
									/>
									{/* <ButtonComponent
										label="Kunde importieren"
										buttonIcon="icon-plus"
										dataQsId="empty-list-import-button"
										callback={() => this.onCustomerImportClick()}
									/> */}
								</React.Fragment>
							),
						}}
						fetchUrls={[
							`${config.resourceHost}customer?offset=0&searchText=&limit=9999999&orderBy=name&desc=false`,
							config.settings.endpoints.payConditions,
						]}
						responseDataMapFunc={(customers, payConditions) => {
							const contactPersons = [];

							customers = customers.map((customer, cIndex) => {
								customer = new Customer(customer);
								const payCondition = payConditions.find(
									(payCondition) => payCondition.id === customer.payConditionId
								);

								const numberBeginsWithZero = customer.number.toString().substr(0, 1) === "0";

								customer.number =
									isNaN(Number(customer.number)) || numberBeginsWithZero
										? customer.number
										: Number(customer.number);

								customer.city = customer.address && customer.address.city;
								customer.street = customer.address && customer.address.street;
								customer.zip =
									customer.address && customer.address.zipCode
										? isNaN(Number(customer.address.zipCode))
											? customer.address.zipCode
											: Number(customer.address.zipCode)
										: "";
								// customer.country =
								// 	customer.address &&
								// 	customer.address.countryIso &&
								// 	getLabelForCountry(customer.address.countryIso).label;
								//	customer.country = customer.getCountry;
								customer.phone1 = customer.phone1 || "";
								customer.phone2 = customer.phone2 || "";
								customer.mobile = customer.mobile || "";
								customer.fax = customer.fax || "";

								customer.payCondition = payCondition ? payCondition.name : "Standard";
								customer.notes = customer.notes ? $(`<div>${customer.notes}</div>`).text() : "";
								customer.name = customer.displayName;
								return customer;
							});

							customers.forEach((customer) => {
								if (
									customer.contactPersons &&
									customer.contactPersons.length &&
									customer.contactPersons.length > 0
								) {
									customer.contactPersons.forEach((contactPerson) => {
										const name =
											(contactPerson.salutation ? `${contactPerson.salutation} ` : "") +
											(contactPerson.title ? `${contactPerson.title} ` : "") +
											contactPerson.name +
											(customer.name ? ` | ${customer.name}` : "");

										contactPersons.push(
											Object.assign({}, customer, {
												kind: ListAdvancedDefaultSettings.CUSTOMER_TYPE_CONTACTPERSON,
												name,
												firstName: contactPerson.firstName || "",
												lastName: contactPerson.lastName || "",
												city: "",
												street: "",
												zip: "",
												country: "",
												email: contactPerson.email || "",
												phone1: contactPerson.phone1 || "",
												phone2: contactPerson.phone2 || "",
												mobile: contactPerson.mobile || "",
												fax: contactPerson.fax || "",
												isMainContact: contactPerson.isMainContact,
												hideCheckboxCell: true,
												hideActionPopupCell: true,
											})
										);
									});
								}
							});

							customers = customers.concat(contactPersons);
							return customers;
						}}
						exportExcelCallbacks={{
							processCellCallback: (params) => {
								let value = params.value;

								if (params.column.colId === "kind") {
									value =
										value === customerTypes.PERSON
											? LABEL_PERSON
											: value === customerTypes.COMPANY
											? LABEL_COMPANY
											: LABEL_CONTACTPERSON;
								}

								if (params.column.colId === "isMainContact") {
									value = isNil(value) ? "" : value.toString() === "true" ? "Ja" : "Nein";
								}

								return value;
							},
						}}
						exportFilename={`Exported contacts list ${moment().format(config.dateFormat.client)}`}
						gatherRemovedSelectedRowsBy="id"
						multiSelect={true}
						usePagination={true}
						searchFieldPlaceholder={lang.customerSearchCategory}
						loadingRowsMessage={"Loading contacts list..."}
						noFilterResultsMessage={"No contacts match the filter"}
						webStorageKey={WebStorageKey.CUSTOMER_LIST_SETTINGS}
						actionCellPopup={{
							popupEntriesFunc: (item) => {
								const entries = [];
								let customer = null;

								if (item) {
									customer = new Customer(item);
									if (canUpdateCustomer && canDeleteCustomer) {
										entries.push({
											dataQsId: `customer-list-item-dropdown-entry-delete`,
											label: resources.str_clear,
											action: "delete",
										});

										entries.push({
											dataQsId: `customer-list-item-dropdown-entry-edit`,
											label: resources.str_toEdit,
											action: "edit",
										});
									}
									if (entries.length === 0) {
										entries.push({
											label: "No action available",
											customEntryClass: "popover-entry-disabled",
										});
									}
								}

								return [entries];
							},
							// popupEntries: [
							// 	[
							// 		{
							// 			dataQsId: `customer-list-item-dropdown-entry-edit`,
							// 			label: 'Edit',
							// 			action: 'edit',
							// 		},
							// 		{
							// 			dataQsId: `customer-list-item-dropdown-entry-delete`,
							// 			label: 'Delete',
							// 			action: 'delete',
							// 		},
							// 	],
							// ],
							onPopupItemClicked: (itemData, popupEntry) => {
								this.onActionCellPopupItemClick(itemData, popupEntry);
							},
						}}
						settingPopup={{
							settingPopupEntriesFunc: (item) => {
								const entries = [];
								entries.push({
									label: "Customer category",
									action: "customercategory",
									dataQsId: "setting-list-item-dropdown-customercategory",
								});
								entries.push({
									label: "More settings",
									action: "moresettings",
									dataQsId: "setting-list-item-dropdown-moresettings",
								});

								return [entries];
							},
							onSettingPopupItemClicked: (popupEntry) => {
								this.onActionSettingPopupItemClick(popupEntry);
							},
						}}
						onRowDataLoaded={(customerData) => {
							if (!this.isUnmounted) {
								this.setState({
									customerData,
									isLoading: false,
								});
							}
						}}
						onRowClicked={(customer) => {
							invoiz.router.navigate(`/customer/${customer.id}`);
						}}
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

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return {
		resources,
	};
};

export default connect(mapStateToProps)(ChartofaccountNewComponent);
