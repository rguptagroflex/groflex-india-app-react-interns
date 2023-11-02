import React from "react";
import moment from "moment";
import config from "config";
import invoiz from "services/invoiz.service";
import ModalService from "services/modal.service";
import TopbarComponent from "shared/topbar/topbar.component";
import ButtonComponent from "shared/button/button.component";
import DateInputComponent from "shared/inputs/date-input/date-input.component";
import LoaderComponent from "shared/loader/loader.component";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import {
	fetchDocumentExportList,
	paginateDocumentExportList,
	updateDocumentExportList,
} from "redux/ducks/settings/documentExport";
import { connect } from "react-redux";
import ListComponent from "shared/list/list.component";
import PaginationComponent from "shared/pagination/pagination.component";
import DocumentExportSendModal from "shared/modals/document-export-send-modal.component";
import { checkAchievementNotification } from "helpers/checkAchievementNotification";
import { formatClientDate, formatApiDate } from "helpers/formatDate";
import RadioInputComponent from "shared/inputs/radio-input/radio-input.component";
import { exportOption } from "helpers/constants";
import userPermissions from "enums/user-permissions.enum";
import planPermissions from "enums/plan-permissions.enum";
import ChargebeePlan from "enums/chargebee-plan.enum";

import RestrictedOverlayComponent from "shared/overlay/restricted-overlay.component";

// const SERVER_DATEFORMAT = 'YYYY-MM-DD';
// const LOCAL_DATEFORMAT = 'DD.MM.YYYY';
const CUSTOM_DATE = "custom";

class SettingsDocumentExportComponent extends React.Component {
	constructor(props) {
		super(props);

		const currYear = moment().year();

		this.state = {
			tenant: null,
			documentExportState: props.documentExportState,
			selectedDate: null,
			customStartDate: `01-01-${currYear}`,
			customEndDate: `31-12-${currYear}`,
			requestStartDate: null,
			requestEndDate: null,
			exportPeriod: null,
			exportType: exportOption[1].value,
			// exportType: exportOption[2].value,
			canChangeAccountData: invoiz.user && invoiz.user.hasPermission(userPermissions.CHANGE_ACCOUNT_DATA),
			planRestricted: invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_GST_EXPORT),
			canCreateGstExports: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_GST_EXPORTS),
			exportFormat: null,
		};
	}

	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.MODIFY_SEE_GST_REPORTS)) {
			invoiz.user.logout(true);
		}
		this.props.fetchDocumentExportList(true);

		this.fetchTenantDetails();
	}

	createDocumentExportTableRows(items) {
		const rows = [];

		if (items) {
			items.forEach((documentExportItem, index) => {
				rows.push({
					id: documentExportItem.id,
					documentExportItem,
					cells: [
						{ value: documentExportItem.displayCreatedAt },
						{ value: documentExportItem.displayPeriod },
						{ value: documentExportItem.displayExportFormat },
						{ value: documentExportItem.displayExportType },
						{ value: documentExportItem.displayActions },
					],
				});
			});
		}
		return rows;
	}

	getSelectizeDateOptions() {
		const { resources } = this.props;
		this.state.documentExportState.currYear = moment().format("YYYY");
		this.state.documentExportState.currMonth = moment().format("MMMM");
		this.state.documentExportState.currQuarter = moment().quarter();

		const dateArray = [
			{ label: this.state.documentExportState.displayCurrMonth, value: "currMonth", group: "month" },
			{ label: this.state.documentExportState.displayLastMonth, value: "lastMonth", group: "month" },
			{ label: this.state.documentExportState.displaySecondLastMonth, value: "secondLastMonth", group: "month" },
			{
				label: this.state.documentExportState.displaySecondLastQuarter,
				value: "secondLastQuarter",
				group: "quarter",
			},
			{ label: this.state.documentExportState.displayLastQuarter, value: "lastQuarter", group: "quarter" },
			{ label: this.state.documentExportState.displayCurrQuarter, value: "currQuarter", group: "quarter" },
			{ label: resources.str_custom, value: CUSTOM_DATE, group: "custom" },
		];

		return dateArray;
	}

	getExportTypeOptios() {
		const exportArray = [
			{ label: `GSTR-1`, value: "gstr1" },
			{ label: `GSTR-3B`, value: "gstr3b" },
		];

		return exportArray;
	}

	onCreateExportClicked() {
		const { resources } = this.props;
		this.updateCreateExportDates(() => {
			const { requestStartDate, requestEndDate, exportPeriod, exportFormat } = this.state;

			// const data = {
			// 	startDate: moment(requestStartDate, LOCAL_DATEFORMAT).format(SERVER_DATEFORMAT),
			// 	endDate: moment(requestEndDate, LOCAL_DATEFORMAT).format(SERVER_DATEFORMAT),
			// 	exportPeriod
			// };
			const data = {
				startDate: formatApiDate(requestStartDate),
				endDate: formatApiDate(requestEndDate),
				exportPeriod,
				type: this.state.exportType,
				exportFormat,
			};
			invoiz
				.request(config.settings.endpoints.accountantExportUrl, {
					auth: true,
					data,
					method: "POST",
				})
				.then((res) => {
					invoiz.page.showToast({ message: resources.documentExportCreateSuccess });
					invoiz.router.reload();
					checkAchievementNotification();
				})
				.catch(() => {
					invoiz.page.showToast({ type: "error", message: resources.documentExportCreateError });
				});
		});
	}

	onDocumentExportListItemClicked(id, row, evt) {
		const action = evt && evt.target && evt.target.getAttribute("data-action");
		const { resources } = this.props;
		if (action) {
			if (action === "download") {
				const url = `${config.assetResourceHost}/${row.documentExportItem.documentUrl}`;
				window.location.assign(url);
			} else if (action === "send") {
				ModalService.open(
					<DocumentExportSendModal
						documentExportItem={row.documentExportItem}
						onSendDocumentExportSuccess={(item) => {
							this.props.updateDocumentExportList(item);
						}}
						resources={resources}
					/>,
					{
						headline: resources.str_submitData,
						isCloseable: false,
						width: 500,
						padding: 40,
						noTransform: true,
					}
				);
			}
		}
	}

	onPaginate(page) {
		this.props.paginateDocumentExportList(page);
	}

	updateCreateExportDates(callback) {
		const { documentExportState, selectedDate, customStartDate, customEndDate } = this.state;

		const state = {
			requestStartDate: null,
			requestEndDate: null,
			exportPeriod: null,
		};

		switch (selectedDate) {
			// case 'currMonth':
			// 	state.requestStartDate = moment()
			// 		.startOf('month')
			// 		.format(LOCAL_DATEFORMAT);
			// 	state.requestEndDate = moment()
			// 		.endOf('month')
			// 		.format(LOCAL_DATEFORMAT);
			// 	state.exportPeriod = documentExportState.displayCurrMonth;
			// 	break;
			case "currMonth":
				state.requestStartDate = formatClientDate(moment().startOf("month"));
				state.requestEndDate = formatClientDate(moment().endOf("month"));
				state.exportPeriod = documentExportState.displayCurrMonth;
				break;

			// case 'lastMonth':
			// 	state.requestStartDate = moment()
			// 		.subtract(1, 'M')
			// 		.startOf('month')
			// 		.format(LOCAL_DATEFORMAT);
			// 	state.requestEndDate = moment()
			// 		.subtract(1, 'M')
			// 		.endOf('month')
			// 		.format(LOCAL_DATEFORMAT);
			// 	state.exportPeriod = documentExportState.displayLastMonth;
			// 	break;
			case "lastMonth":
				state.requestStartDate = formatClientDate(moment().subtract(1, "M").startOf("month"));
				state.requestEndDate = formatClientDate(moment().subtract(1, "M").endOf("month"));
				state.exportPeriod = documentExportState.displayLastMonth;
				break;

			// case 'secondLastMonth':
			// 	state.requestStartDate = moment()
			// 		.subtract(2, 'M')
			// 		.startOf('month')
			// 		.format(LOCAL_DATEFORMAT);
			// 	state.requestEndDate = moment()
			// 		.subtract(2, 'M')
			// 		.endOf('month')
			// 		.format(LOCAL_DATEFORMAT);
			// 	state.exportPeriod = documentExportState.displaySecondLastMonth;
			// 	break;
			case "secondLastMonth":
				state.requestStartDate = formatClientDate(moment().subtract(2, "M").startOf("month"));
				state.requestEndDate = formatClientDate(moment().subtract(2, "M").endOf("month"));
				state.exportPeriod = documentExportState.displaySecondLastMonth;
				break;

			// case 'currQuarter':
			// 	state.requestStartDate = moment()
			// 		.startOf('quarter')
			// 		.format(LOCAL_DATEFORMAT);
			// 	state.requestEndDate = moment()
			// 		.endOf('quarter')
			// 		.format(LOCAL_DATEFORMAT);
			// 	state.exportPeriod = documentExportState.displayCurrQuarter;
			// 	break;
			case "currQuarter":
				state.requestStartDate = formatClientDate(moment().startOf("quarter"));
				state.requestEndDate = formatClientDate(moment().endOf("quarter"));
				state.exportPeriod = documentExportState.displayCurrQuarter;
				break;

			// case 'lastQuarter':
			// 	state.requestStartDate = moment()
			// 		.subtract(1, 'quarter')
			// 		.startOf('quarter')
			// 		.format(LOCAL_DATEFORMAT);
			// 	state.requestEndDate = moment()
			// 		.subtract(1, 'quarter')
			// 		.endOf('quarter')
			// 		.format(LOCAL_DATEFORMAT);
			// 	state.exportPeriod = documentExportState.displayLastQuarter;
			// 	break;
			case "lastQuarter":
				state.requestStartDate = formatClientDate(moment().subtract(1, "quarter").startOf("quarter"));
				state.requestEndDate = formatClientDate(moment().subtract(1, "quarter").endOf("quarter"));
				state.exportPeriod = documentExportState.displayLastQuarter;
				break;

			// case 'secondLastQuarter':
			// 	state.requestStartDate = moment()
			// 		.subtract(2, 'quarter')
			// 		.startOf('quarter')
			// 		.format(LOCAL_DATEFORMAT);
			// 	state.requestEndDate = moment()
			// 		.subtract(2, 'quarter')
			// 		.endOf('quarter')
			// 		.format(LOCAL_DATEFORMAT);
			// 	state.exportPeriod = documentExportState.displaySecondLastQuarter;
			// 	break;
			case "secondLastQuarter":
				state.requestStartDate = formatClientDate(moment().subtract(2, "quarter").startOf("quarter"));
				state.requestEndDate = formatClientDate(moment().subtract(2, "quarter").endOf("quarter"));
				state.exportPeriod = documentExportState.displaySecondLastQuarter;
				break;

			case CUSTOM_DATE:
				state.requestStartDate = customStartDate;
				state.requestEndDate = customEndDate;
				state.exportPeriod = `${customStartDate} - ${customEndDate}`;
				break;
		}

		this.setState(state, () => {
			callback && callback();
		});
	}
	onRadioChange(value) {
		this.setState({ exportType: value });
	}

	onUpdateExportFormat(value) {
		this.setState({ exportFormat: value });
	}

	fetchTenantDetails() {
		const tenantURL = `${config.resourceHost}tenant`;
		invoiz.request(tenantURL, { auth: true }).then((res) => {
			const {
				body: { data },
			} = res;
			this.setState({ tenant: data });
		});
	}

	render() {
		const {
			selectedDate,
			exportFormat,
			customStartDate,
			customEndDate,
			canChangeAccountData,
			canCreateGstExports,
			planRestricted,
			tenant,
		} = this.state;
		const {
			isLoading,
			errorOccurred,
			documentExportData: { data },
			columns,
			currentPage,
			totalPages,
			resources,
		} = this.props;

		console.log(tenant, "tenant from gst");

		return (
			<React.Fragment>
				{planRestricted ? (
					<RestrictedOverlayComponent
						message={
							canChangeAccountData
								? "GST Reports are not available in your current plan"
								: `You don’t have permission to access GST Exports`
							// ? `Currently you’re on the ${
							// 		invoiz.user.planId === `Std_Yly_21` ? `Standard Yearly` : `Starter Yearly`
							//   } plan.
							// Please upgrade your plan to create GST Exports`
							// : `You don’t have permission to access GST Exports`
						}
						owner={canChangeAccountData}
					/>
				) : null}

				<div
					className={`settings-document-export-component ${
						this.props.isSubmenuVisible ? "gstExportLeftAlign" : ""
					}`}
				>
					<TopbarComponent title={resources.str_accountantsExport} viewIcon={`icon-settings`} />

					<div className="box u_p_16">
						<div className="row col-xs-12 company-name-and-gst-in">
							<span className="color-primary font-600 font-15px u_mr_20">
								{tenant && tenant.companyAddress.companyName}
							</span>
							<span>
								{" "}
								<span className="gstin-label">GSTIN</span> {tenant && tenant.companyAddress.gstNumber}
							</span>
						</div>
						{/* <div className="u_pb_60 text-muted">
						{resources.documentExportHeading}
						<br />
						{resources.documentExportSubHeading}

						{this.state.exportType === exportOption[0].value && (
							<div className="tally-export-warning">
								<strong>{resources.str_waring}</strong>  {resources.documentExportTallyWarningMessage}
							</div>
						) }
					</div> */}

						<div className="document-export-configuration">
							<div className="document-export-type">
								<label className="font-14px font-600 export-type-label">GST-Report:</label>
								<SelectInputComponent
									allowCreate={false}
									notAsync={true}
									loadedOptions={this.getExportTypeOptios()}
									value={exportFormat}
									options={{
										clearable: false,
										noResultsText: false,
										labelKey: "label",
										valueKey: "value",
										matchProp: "label",
										placeholder: `Select export type`,
										handleChange: (option) => {
											this.setState({ exportFormat: option && option.value }, () => {
												this.updateCreateExportDates();
											});
										},
									}}
								/>
							</div>

							<div className="document-export-date u_ml_20">
								<SelectInputComponent
									allowCreate={false}
									notAsync={true}
									loadedOptions={this.getSelectizeDateOptions()}
									value={selectedDate}
									options={{
										clearable: false,
										noResultsText: false,
										labelKey: "label",
										valueKey: "value",
										matchProp: "label",
										placeholder: resources.str_selectPeriod,
										handleChange: (option) => {
											this.setState({ selectedDate: option && option.value }, () => {
												this.updateCreateExportDates();
											});
										},
									}}
								/>
							</div>

							{selectedDate === CUSTOM_DATE ? (
								<div className="document-export-datePicker">
									<DateInputComponent
										name={"date"}
										value={customStartDate}
										required={true}
										label={resources.str_startDate}
										noBorder={true}
										onChange={(name, value) => this.setState({ customStartDate: value })}
									/>

									<DateInputComponent
										name={"date"}
										value={customEndDate}
										required={true}
										label={resources.str_endDate}
										noBorder={true}
										onChange={(name, value) => this.setState({ customEndDate: value })}
									/>
								</div>
							) : null}

							{/* <div className='export-type'>
							<RadioInputComponent
								useCustomStyle={true}
								value={this.state.exportType}
								onChange={value => this.onRadioChange(value)}
								options={exportOption}
							/>
						</div> */}
						</div>
						<ButtonComponent
							wrapperClass="runReportBtnWrapper"
							type="primary"
							callback={() => {
								console.log("can create gst export", canCreateGstExports);
								if (canCreateGstExports) {
									return this.onCreateExportClicked();
								}
								this.setState({ planRestricted: true });
							}}
							label="Run Report"
							disabled={!selectedDate || !exportFormat}
							dataQsId="settings-documentExport-btn-createExport"
						/>
					</div>
					<div className="box u_p_16">
						<div className="text-h3 export-head u_mb_30">{resources.str_latestExports}</div>

						{errorOccurred ? (
							<div className="document-export-error">
								<div className="error-headline">
									<h1>{resources.errorOccuredMessage}</h1>
								</div>
								<div>
									<ButtonComponent
										callback={() => invoiz.router.reload()}
										label={resources.str_reload}
									/>
								</div>
							</div>
						) : (
							<div>
								{isLoading ? (
									<LoaderComponent visible={true} />
								) : (
									<div className="document-export-custom">
										<ListComponent
											sortable={false}
											clickable={true}
											columns={columns}
											rows={this.createDocumentExportTableRows(data)}
											rowCallback={(id, row, evt) =>
												this.onDocumentExportListItemClicked(id, row, evt)
											}
											emptyFallbackElement={resources.documentExportEmptyMessage}
											resources={resources}
										/>

										{totalPages > 1 ? (
											<div className="document-export-list-pagination">
												<PaginationComponent
													currentPage={currentPage}
													totalPages={totalPages}
													onPaginate={(page) => this.onPaginate(page)}
												/>
											</div>
										) : null}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</React.Fragment>
		);
	}
}

const mapStateToProps = (state) => {
	const { isLoading, errorOccurred, documentExportData, columns, currentPage, totalPages } =
		state.settings.documentExport;
	const { resources } = state.language.lang;
	const isSubmenuVisible = state.global.isSubmenuVisible;
	return {
		isLoading,
		errorOccurred,
		documentExportData,
		columns,
		currentPage,
		totalPages,
		resources,
		isSubmenuVisible,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		fetchDocumentExportList: (reset) => {
			dispatch(fetchDocumentExportList(reset));
		},
		paginateDocumentExportList: (page) => {
			dispatch(paginateDocumentExportList(page));
		},
		updateDocumentExportList: (item) => {
			dispatch(updateDocumentExportList(item));
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsDocumentExportComponent);
