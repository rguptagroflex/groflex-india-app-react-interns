import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { AllModules, LicenseManager } from "@ag-grid-enterprise/all-modules";
import TopbarComponent from "../../shared/topbar/topbar.component";
import SelectInputComponent from "../../shared/inputs/select-input/select-input.component";
import calenderIcon from "../../../assets/images/icons/calender.svg";
import invoiz from "../../services/invoiz.service";
import OfferSendMailWrapper from "../offer/offer-send-mail.wrapper";
import GeneralLedgerSendEmail from "./general-ledger-send-email";
import config from "../../../config";
import ModalService from "../../services/modal.service";
import OfferAction from "enums/offer/offer-action.enum";
import moment from "moment";
import DateInputComponent from "../../shared/inputs/date-input/date-input.component";
import { formatApiDate } from "../../helpers/formatDate";
const ReportsGeneralLedger = (props) => {
	LicenseManager.setLicenseKey(
		"CompanyName=Buhl Data Service GmbH,LicensedApplication=invoiz,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=1,LicensedProductionInstancesCount=1,AssetReference=AG-008434,ExpiryDate=8_June_2021_[v2]_MTYyMzEwNjgwMDAwMA==f2451b642651a836827a110060ebb5dd"
	);

	const gridRef = useRef();
	const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
	const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
	const [rowData, setRowData] = useState();

	const CustomCellRenderer = ({ value, colDef }) => <span>{value !== undefined ? `₹ ${value}` : value}</span>;

	const [columnDefs, setColumnDefs] = useState([
		{
			field: "chartOfAccount.accountTypeId",
			rowGroup: true,
			enableRowGroup: true,
			hide: true,
			valueFormatter: function (params) {
				var value = params.value;
				return value.charAt(0).toUpperCase() + value.slice(1);
			},
		},

		{
			field: "date",
			filter: false,
			valueFormatter: function (params) {
				var value = params.value;
				var date = new Date(value);

				if (!isNaN(date.getTime())) {
					var day = date.getDate();
					var month = date.getMonth() + 1;
					var year = date.getFullYear();

					day = day < 10 ? "0" + day : day;
					month = month < 10 ? "0" + month : month;

					return day + "/" + month + "/" + year;
				} else {
					return "";
				}
			},
		},
		{
			headerName: "Account",
			field: "chartOfAccount.accountSubTypeId",
			filter: false,
			valueFormatter: function (params) {
				if (params.value) {
					let formattedValue = params.value.replace(/([A-Z])/g, " $1");
					formattedValue = formattedValue.replace(/([A-Z][a-z])/g, " $1");
					formattedValue = formattedValue.charAt(0).toUpperCase() + formattedValue.slice(1);
					return formattedValue;
				}
				return params.value;
			},
			cellStyle: { whiteSpace: "normal" },
			autoHeight: true,
		},

		{ headerName: "Debit", field: "debits", filter: false, cellRendererFramework: CustomCellRenderer },
		{ headerName: "Credit", field: "credits", filter: false, cellRendererFramework: CustomCellRenderer },
		{ field: "balance", filter: false, cellRendererFramework: CustomCellRenderer },
	]);
	const onBtExport = useCallback(() => {
		gridRef.current.api.exportDataAsExcel();
	}, []);
	const onFirstDataRendered = useCallback(() => {
		if (gridRef.current) {
			gridRef.current.api.expandAll();
		}
	}, []);

	const setPrinterFriendly = useCallback((api) => {
		const eGridDiv = document.querySelector("#myGrid");
		if (eGridDiv) {
			eGridDiv.style.width = "";
			eGridDiv.style.height = "";
			api.setDomLayout("print");
		}
	}, []);
	const setNormal = useCallback((api) => {
		const eGridDiv = document.querySelector("#myGrid");
		if (eGridDiv) {
			eGridDiv.style.width = "700px";
			eGridDiv.style.height = "200px";
			api.setDomLayout();
		}
	}, []);

	const onBtPrint = useCallback(() => {
		if (gridRef.current) {
			const api = gridRef.current.api;
			setPrinterFriendly(api);
			setTimeout(function () {
				print();
				setNormal(api);
			}, 2000);
		}
	}, []);
	const getDefaultDateOption = () => {
		return dateOptions.find((option) => option.value === dateData.dateFilterValue);
	};

	useEffect(() => {
		updateSelectedDate(getDefaultDateOption());
	}, []);

	const defaultColDef = useMemo(() => {
		return {
			flex: 1,
			minWidth: 100,
			sortable: true,
			resizable: true,
			filter: true,
			floatingFilter: true,
		};
	}, []);
	const autoGroupColumnDef = useMemo(() => {
		return {
			minWidth: 200,
		};
	}, []);

	const onGridReady = useCallback((params) => {
		invoiz
			.request(
				`${config.resourceHost}bankTransaction?offset=0&searchText=&limit=9999999&orderBy=date&desc=true`,

				{ auth: true }
			)
			.then((res) => {
				// const resultTotal = {
				// 	totalCredits: res.body.data[0].credits + res.body.data[1].credits + res.body.data[2].credits,
				// };
				// const result = {
				// 	...res.body.data[0],
				// 	...resultTotal,
				// };
				// console.log("Total: ", result);

				var assetsTotalCredit = 0;
				var liablityTotalCredit = 0;
				var expenseTotalCredit = 0;
				var assetsTotalDebit = 0;
				var liablityTotalDebit = 0;
				var expenseTotalDebit = 0;
				var netMovement = 0;

				res.body.data.forEach((item) => {
					if (item.chartOfAccount.accountTypeId === "liability") {
						liablityTotalCredit += item.credits;
						liablityTotalDebit += item.debits;
					} else if (item.chartOfAccount.accountTypeId === "assets") {
						assetsTotalCredit += item.credits;
						assetsTotalDebit += item.debits;
					} else if (item.chartOfAccount.accountTypeId === "expenses") {
						expenseTotalCredit += item.credits;
						expenseTotalDebit += item.debits;
					}
				});

				const resultTotal = [
					{
						chartOfAccount: { accountTypeId: "liability" },
						credits: liablityTotalCredit,
						debits: liablityTotalDebit,
					},
					{
						chartOfAccount: { accountTypeId: "assets" },
						credits: assetsTotalCredit,
						debits: assetsTotalDebit,
					},
					{
						chartOfAccount: { accountTypeId: "expenses" },
						credits: expenseTotalCredit,
						debits: expenseTotalDebit,
					},
				];

				const result = [...res.body.data, ...resultTotal];
				console.log("New array", result);
				console.log("response of data :", res.body.data);
				// setRowData(res.body.data);
				setRowData(result);
			});
	}, []);
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const onDate = (value) => {
		let startDate = "";
		let endDate = "";

		switch (value) {
			case "currMonth":
				startDate = moment().startOf("month").format("DD MMMM YYYY");
				endDate = moment().endOf("month").format("DD MMMM YYYY");
				break;
			case "lastMonth":
				startDate = moment().subtract(1, "months").startOf("month").format("DD MMMM YYYY");
				endDate = moment().subtract(1, "months").endOf("month").format("DD MMMM YYYY");
				break;
			case "secondLastMonth":
				startDate = moment().subtract(2, "months").startOf("month").format("DD MMMM YYYY");
				endDate = moment().subtract(2, "months").endOf("month").format("DD MMMM YYYY");
				break;
			case "currQuarter":
				startDate = moment().startOf("quarter").format("DD MMMM YYYY");
				endDate = moment().endOf("quarter").format("DD MMMM YYYY");
				break;
			case "lastQuarter":
				startDate = moment().subtract(3, "months").startOf("quarter").format("DD MMMM YYYY");
				endDate = moment().subtract(3, "months").endOf("quarter").format("DD MMMM YYYY");
				break;
			case "secondLastQuarter":
				startDate = moment().subtract(6, "months").startOf("quarter").format("DD MMMM YYYY");
				endDate = moment().subtract(6, "months").endOf("quarter").format("DD MMMM YYYY");
				break;
			case DateFilterType.FISCAL_YEAR:
				const fiscalYearStartMonth = 4;
				const currentYear = moment().year();
				const fiscalYearStart = moment()
					.month(fiscalYearStartMonth - 1)
					.year(currentYear)
					.startOf("month");
				const fiscalYearEnd = moment()
					.month(fiscalYearStartMonth - 1)
					.year(currentYear + 1)
					.startOf("month")
					.subtract(1, "day");

				startDate = fiscalYearStart.format("DD MMMM YYYY");
				endDate = fiscalYearEnd.format("DD MMMM YYYY");
				break;
			// case "custom":
			// 	startDate = dateData.customStartDate.format("DD MMMM YYYY");
			// 	endDate = dateData.customEndDate.format("DD MMMM YYYY");
			// 	break;
			default:
				startDate = "";
				endDate = "";
				break;
		}
		setSelectedDate({ startDate, endDate });
		console.log("startDate", startDate);
		return { startDate, endDate };
	};

	const sendEmail = () => {
		ModalService.open(<GeneralLedgerSendEmail />, {
			modalClass: "edit-contact-person-modal-component",
			width: 630,
		});
	};
	const activeAction = OfferAction.PRINT;
	const DateFilterType = {
		FISCAL_YEAR: "fiscalYear",
	};
	const [selectedDate, setSelectedDate] = useState(null);

	const [showDateFilter, setShowDateFilter] = useState(props.showDateFilter || false);
	const [selectedDateFilter, setSelectedDateFilter] = useState("");
	const [dateData, setDateData] = useState({
		currentMonthName: moment().format("MMMM"),
		lastMonthName: moment().subtract(1, "months").format("MMMM"),
		secondLastMonth: moment().subtract(2, "months").format("MMMM"),
		currQuarter: moment().startOf("quarter").format("Q/YYYY"),
		lastQuarter: moment().subtract(3, "months").startOf("quarter").format("Q/YYYY"),
		secondLastQuarter: moment().subtract(6, "months").startOf("quarter").format("Q/YYYY"),
		customStartDate: moment().subtract(1, "months"),
		customEndDate: moment(),
		showCustomDateRangeSelector: false,
		dateFilterValue: DateFilterType.FISCAL_YEAR,
		categoryFilterValue: "",
		activeChartData: { series: [] },
		selectedDateFilterType: DateFilterType.FISCAL_YEAR,
	});
	const dateOptions = [
		{ label: dateData.currentMonthName, value: "currMonth", group: "month" },
		{ label: dateData.lastMonthName, value: "lastMonth", group: "month" },
		{ label: dateData.secondLastMonth, value: "secondLastMonth", group: "month" },
		{ label: `Quarter ${dateData.currQuarter}`, value: "currQuarter", group: "quarter" },
		{ label: `Quarter ${dateData.lastQuarter}`, value: "lastQuarter", group: "quarter" },
		{ label: `Quarter ${dateData.secondLastQuarter}`, value: "secondLastQuarter", group: "quarter" },
		{ label: "Fiscal Year", value: DateFilterType.FISCAL_YEAR, group: "year" },
		{ label: "Custom", value: "custom", group: "custom" },
	];
	const handleChange = (option) => {
		setSelectedDateFilter(option.value);
		updateSelectedDate(option);
	};

	const updateSelectedDate = (option) => {
		if (!option) {
			setSelectedDate(null);
			return;
		}

		switch (option.value) {
			case "custom":
				setDateData({ ...dateData, showCustomDateRangeSelector: true, dateFilterValue: option.value });
				setSelectedDate({
					startDate: dateData.customStartDate.format("DD MMMM YYYY"),
					endDate: dateData.customEndDate.format("DD MMMM YYYY"),
				});

				break;
			default:
				onDate(option.value);
				setDateData({
					...dateData,
					showCustomDateRangeSelector: false,
					dateFilterValue: option.value,
				});
				break;
		}
	};

	const handleStartDateChange = (name, value) => {
		const startDate = moment(value, "DD-MM-YYYY");
		setDateData({ ...dateData, customStartDate: startDate });
	};

	const handleEndDateChange = (name, value) => {
		const endDate = moment(value, "DD-MM-YYYY");
		setDateData({ ...dateData, customEndDate: endDate });
	};

	return (
		<div style={containerStyle} className="general-ledger-component-main">
			<TopbarComponent
				title={"General Ledger"}
				hasCancelButton={true}
				cancelButtonCallback={() => {
					window.history.back();
				}}
			/>
			<div
				className="general-ledger-content"
				style={{
					// height: "500px",
					height: "1186px",
					width: "1120px",
					backgroundColor: "#fff",
					border: "1px solid #ccc",
					marginTop: "30px",
					marginLeft: "50px",
					marginRight: "50px",
					fontWeight: "600",
					borderRadius: "8px",
					marginTop: "130px",
				}}
			>
				<div
					className="general-ledger-component general-ledger-content-top"
					style={{
						marginTop: "20px",
						marginLeft: "20px",
						display: "flex",
						flexDirection: "column",
						padding: "0px, 24px, 0px, 24px",
						justifyContent: "space-between",
					}}
				>
					<div
						className="time-period-select-container"
						style={{
							width: dateData.showCustomDateRangeSelector ? "500px" : "200px",
							display: "flex",
							justifyContent: "space-between",
						}}
					>
						<div
							style={{ flex: "1.5", display: "flex", alignItems: "center" }}
							className="time-period-select"
						>
							<div style={{ width: "170px", marginTop: "35px" }}>
								<SelectInputComponent
									// title={resources.str_title}
									// title={"A.K Enterprises"}
									name="title"
									title={
										invoiz.user.companyAddress.companyName.charAt(0).toUpperCase() +
										invoiz.user.companyAddress.companyName.slice(1)
									}
									value={invoiz.user.companyAddress.companyName}
									dataQsId={"customer-edit-title"}
									// value={customer.title}
									allowCreate={true}
									notAsync={true}
									options={{
										// placeholder: resources.str_choose,
										labelKey: "name",
										valueKey: "name",
										// handleChange: (value) => {
										// 	if (!value || (value && !value.isDummy && value.name)) {
										// 		this.onSalutationOrTitleChange(value, false);
										// 	}
										// },
									}}
									// loadedOptions={titleOptions}
								/>
							</div>
							<div style={{ position: "relative", width: "100%", flex: "1" }}>
								<SelectInputComponent
									allowCreate={false}
									notAsync={true}
									loadedOptions={dateOptions}
									value={dateData.dateFilterValue}
									icon={calenderIcon}
									containerClass="date-input"
									options={{
										clearable: false,
										noResultsText: false,
										labelKey: "label",
										valueKey: "value",
										matchProp: "label",
										placeholder: "Select Date",
										// handleChange: (option) => {
										// 	console.log(option.value, "Selected date value");
										// 	console.log(onDate(option.value), " by onDate");

										// 	updateSelectedDate(option);
										// },
										handleChange: handleChange,

										formatOptionLabel: ({ value, label }) => {
											if (value === "custom" && dateData.showCustomDateRangeSelector) {
												return (
													<div>
														{label}
														<div
															style={{
																whiteSpace: "normal",
																overflow: "hidden",
																textOverflow: "ellipsis",
															}}
														>
															Start Date: {dateData.customStartDate.format("DD-MM-YYYY")}
															<br />
															End Date: {dateData.customEndDate.format("DD-MM-YYYY")}
														</div>
													</div>
												);
											} else {
												return label;
											}
										},
									}}
									style={{ position: "absolute", width: "100%" }}
								/>
							</div>
							{dateData.showCustomDateRangeSelector && (
								<div
									id="general-ledger-date-picker-container"
									className="start-end-date-selector-group"
									style={{ display: "flex" }}
								>
									<div
									// style={{ marginRight: "10px" }}
									>
										<DateInputComponent
											name={"startDate"}
											value={dateData.customStartDate.format("DD-MM-YYYY")}
											required={true}
											label={"Start Date"}
											noBorder={true}
											onChange={handleStartDateChange}
											dateFormat="DD-MM-YYYY"
										/>
									</div>
									<div>
										<DateInputComponent
											name={"endDate"}
											value={dateData.customEndDate.format("DD-MM-YYYY")}
											required={true}
											label={"End Date"}
											noBorder={true}
											onChange={handleEndDateChange}
											dateFormat="DD-MM-YYYY"
										/>
									</div>
								</div>
							)}
						</div>
					</div>

					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "flex-end",
							padding: " 0px 16px 0px 16px",
							height: "32px",
							/* width: 326px; */

							position: "relative",
							borderRadius: "4px",
							gap: "16px",
						}}
					>
						<div
							style={{
								border: "1px solid #ccc",
								padding: "10px",
								display: "flex",
								alignItems: "center",
								position: "relative",
								borderRadius: "4px",
								marginTop: "-100px",
							}}
						>
							<div
								className="icon-mail"
								onClick={sendEmail}
								style={{
									display: "flex",
									alignItems: "center",
									cursor: "pointer",
									width: "101 px",
									height: " 18px",
									marginRight: "20px",
								}}
							>
								<span
									className="pdf_mail"
									style={{ display: "inline-block", fontSize: "16px", width: "1em", height: "1em" }}
								></span>
								<span className="icon-text" style={{ marginLeft: "-5px" }}>
									Send email
								</span>
							</div>
							<div
								style={{
									borderLeft: "1px solid #ccc",
									height: "100%",
									position: "absolute",
									left: "44%",
									top: "0",
									bottom: "0",
									transform: "translateX(-50%)",
								}}
							></div>
							<div
								className="icon-print2"
								onClick={onBtPrint}
								style={{
									display: "flex",
									alignItems: "center",
									cursor: "pointer",
									// marginLeft: "10px",
									width: "101 px",
									height: " 18px",
									marginRight: "20px",
									marginLeft: "5px",
								}}
							>
								<span
									className="pdf_print"
									style={{ display: "inline-block", fontSize: "16px", width: "1em", height: "1em" }}
								></span>
								<span className="icon-text" style={{ marginLeft: "-5px" }}>
									Print
								</span>
							</div>
							<div
								style={{
									borderLeft: "1px solid #ccc",
									height: "100%",
									position: "absolute",
									left: "70%",
									top: "0",
									bottom: "0",
									transform: "translateX(-50%)",
								}}
							></div>

							<div
								className="icon-download"
								onClick={onBtExport}
								style={{
									display: "flex",
									alignItems: "center",
									cursor: "pointer",
									// marginLeft: "10px",
									width: "101 px",
									height: " 18px",
								}}
							>
								<span
									className="download"
									style={{ display: "inline-block", fontSize: "16px", width: "1em", height: "1em" }}
								></span>
								<span className="icon-text" style={{ marginLeft: "-5px" }}>
									Export
								</span>
							</div>
						</div>
					</div>
				</div>
				<div
					className="general-heading general-ledger-content-middle"
					style={{
						// width: "80vw",
						// padding: "20px",
						marginLeft: "20px",
						marginBottom: "30px",
					}}
				>
					<div>
						<h3>
							{invoiz.user.companyAddress.companyName.charAt(0).toUpperCase() +
								invoiz.user.companyAddress.companyName.slice(1)}{" "}
							General Ledger
						</h3>
					</div>
					{selectedDate && selectedDate.startDate && selectedDate.endDate && (
						<p style={{ color: "#888787" }}>
							<span>From </span>
							<span className="date">{moment(selectedDate.startDate).format("DD MMMM YYYY")}</span>
							<span> to </span>
							<span className="date">{moment(selectedDate.endDate).format("DD MMMM YYYY")}</span>
						</p>
					)}
				</div>

				<div style={gridStyle} className="ag-theme-alpine general-ledger-content-bottom">
					{console.log("Row Data", rowData)}
					{console.log("Col: ", columnDefs)}
					<AgGridReact
						ref={gridRef}
						rowData={rowData}
						columnDefs={columnDefs}
						defaultColDef={defaultColDef}
						autoGroupColumnDef={autoGroupColumnDef}
						animateRows={true}
						onGridReady={onGridReady}
						modules={AllModules}
						// groupDisplayType={"groupRows"}
						onFirstDataRendered={onFirstDataRendered}
						// gridOptions={gridOptions}
					></AgGridReact>
				</div>
			</div>{" "}
		</div>
	);
};
export default ReportsGeneralLedger;
