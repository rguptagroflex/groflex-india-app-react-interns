import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { AllModules, LicenseManager } from "@ag-grid-enterprise/all-modules";
import TopbarComponent from "../../shared/topbar/topbar.component";
import SelectInputComponent from "../../shared/inputs/select-input/select-input.component";
import calenderIcon from "../../../assets/images/icons/calender.svg";
import invoiz from "../../services/invoiz.service";
import ProfitAndLossSendEmail from "./profit-and-loss-send-email";
import config from "../../../config";
import ModalService from "../../services/modal.service";
import OfferAction from "enums/offer/offer-action.enum";
import moment from "moment";
import DateInputComponent from "../../shared/inputs/date-input/date-input.component";

function ReportsProfitAndLoss() {
	LicenseManager.setLicenseKey(
		"CompanyName=Buhl Data Service GmbH,LicensedApplication=invoiz,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=1,LicensedProductionInstancesCount=1,AssetReference=AG-008434,ExpiryDate=8_June_2021_[v2]_MTYyMzEwNjgwMDAwMA==f2451b642651a836827a110060ebb5dd"
	);
	const gridRef = useRef();
	const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
	const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
	const [rowData, setRowData] = useState();
	const [columnDefs, setColumnDefs] = useState([
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
		{
			headerName: "Account Code",
			field: "chartOfAccount.accountCode",
			filter: false,
		},
		{ field: "Total", filter: false },
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
	useEffect(() => {
		const eGridDiv = document.querySelector("#myGrid");
		if (eGridDiv) {
			// Code to initialize the grid and set data
		}
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
			// filter: 'agGroupColumnFilter',
		};
	}, []);
	// const companyName = invoiz.user.companyAddress.companyName;
	// const capitalizedCompanyName = companyName
	// 	.split(" ")
	// 	.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
	// 	.join(" ");

	const onGridReady = useCallback((params) => {
		invoiz
			.request(
				`${config.resourceHost}bankTransaction?offset=0&searchText=&limit=9999999&orderBy=date&desc=true`,
				{ auth: true }
			)
			.then((res) => {
				console.log("response of data :", res.body.data);
				setRowData(res.body.data);
			});
	}, []);
	const sendEmail = () => {
		ModalService.open(<ProfitAndLossSendEmail />, {
			modalClass: "edit-contact-person-modal-component",
			width: 630,
		});
	};
	const activeAction = OfferAction.PRINT;
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
	const DateFilterType = {
		FISCAL_YEAR: "fiscalYear",
	};
	const [selectedDate, setSelectedDate] = useState(null);
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
		<div>
			<TopbarComponent
				title={"Profit and loss"}
				hasCancelButton={true}
				cancelButtonCallback={() => {
					window.history.back();
				}}
			/>
			<div
				className="general-ledger-component"
				style={{
					marginTop: "90px",
					marginLeft: "50px",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					className="time-period-select-container"
					style={{
						width: dateData.showCustomDateRangeSelector ? "500px" : "200px",
					 display: "flex", justifyContent: "space-between" }}
				>
					<div style={{ flex: "1.5", display: "flex", alignItems: "center" }} className="time-period-select">
						<div style={{ position: "relative", width: "100%" , flex: "1"}}>
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
								// 	handleChange: (option) => {
								// 		updateSelectedDate(option);
								// 	},
								// }}
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
								<div style={{ marginRight: "10px" }}>
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
					}}
				>
					<div
						className="icon-mail"
						style={{ display: "flex", alignItems: "center", marginRight: "10px" }}
						onClick={sendEmail}
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
						className="icon-print2"
						onClick={onBtPrint}
						style={{ display: "flex", alignItems: "center", marginRight: "10px" }}
					>
						<span
							className="pdf_print"
							style={{ display: "inline-block", fontSize: "16px", width: "1em", height: "1em" }}
						></span>
						<span className="icon-text" style={{ marginRight: "-5px" }}>
							Print
						</span>
					</div>
					<div
						className="icon-download"
						style={{ display: "flex", alignItems: "center", marginRight: "10px" }}
						onClick={onBtExport}
					>
						<span
							className="download"
							style={{ display: "inline-block", fontSize: "16px", width: "1em", height: "1em" }}
						></span>
						<span className="icon-text" style={{ marginLeft: "-5px" }}>
							Export
						</span>
					</div>
					{/* <div
						id="list-advanced-export-btn"
						className="icon-btn"
						onClick={() => {
							exportList(ListExportTypes.EXCEL);
						}}
					>
						<div className="icon icon-download2"></div>
						<div className="icon-label">Export</div>
					</div> */}
				</div>
			</div>
			<div
				style={{
					width: "80vw",
					height: "500px",
					backgroundColor: "#fff",
					marginTop: "30px",
					marginLeft: "50px",
					marginRight: "50px",
					fontWeight: "600",
				}}
			>
				<div className="general-heading" style={{ 
					// width: "80vw",
				 padding: "20px" }}>
					<div>
						<h3>
							{invoiz.user.companyAddress.companyName.charAt(0).toUpperCase() +
								invoiz.user.companyAddress.companyName.slice(1)}{" "}
							Profit and loss
						</h3>
					</div>
					{selectedDate && selectedDate.startDate && selectedDate.endDate && (
						<p>
							<span>From </span>
							<span className="date">{moment(selectedDate.startDate).format("DD MMMM YYYY")}</span>
							<span> to </span>
							<span className="date">{moment(selectedDate.endDate).format("DD MMMM YYYY")}</span>
						</p>
					)}
				</div>

				<div style={gridStyle} className="ag-theme-alpine">
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
}

export default ReportsProfitAndLoss;
