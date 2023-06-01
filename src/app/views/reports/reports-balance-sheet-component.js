import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { AllModules, LicenseManager } from "@ag-grid-enterprise/all-modules";
import TopbarComponent from "../../shared/topbar/topbar.component";
import SelectInputComponent from "../../shared/inputs/select-input/select-input.component";
import calenderIcon from "../../../assets/images/icons/calender.svg";
import invoiz from "../../services/invoiz.service";
import BalanceSheetSendEmail from "./balance-sheet-send-email";
import config from "../../../config";
import ModalService from "../../services/modal.service";
import OfferAction from "enums/offer/offer-action.enum";
import moment from "moment";
import DateInputComponent from "../../shared/inputs/date-input/date-input.component";

function ReportBalanceSheet() {
	LicenseManager.setLicenseKey(
		"CompanyName=Buhl Data Service GmbH,LicensedApplication=invoiz,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=1,LicensedProductionInstancesCount=1,AssetReference=AG-008434,ExpiryDate=8_June_2021_[v2]_MTYyMzEwNjgwMDAwMA==f2451b642651a836827a110060ebb5dd"
	);
	// var callCount = 1;
	// var totalValueGetter = function (params) {
	// 	var credits = params.getValue("credits");
	// 	var debits = params.getValue("debits");

	// 	var result = credits + debits;
	// 	console.log(
	// 		"Total Value Getter (" +
	// 			callCount +
	// 			", " +
	// 			params.column.getId() +
	// 			"): " +
	// 			[credits, debits].join(", ") +
	// 			" = " +
	// 			result
	// 	);
	// 	callCount++;
	// 	return result;
	// };

	// const formatNumber = (params) => {
	// 	var number = params.value;
	// 	return Math.floor(number)
	// 		.toString()
	// 		.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
	// };

	const gridRef = useRef();
	const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
	const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
	const [rowData, setRowData] = useState();
	const [columnDefs, setColumnDefs] = useState([
		// {
		// 	field: "chartOfAccount.accountTypeId",
		// 	rowGroup: true,
		// 	enableRowGroup: true,
		// 	hide: true,
		// 	valueFormatter: function (params) {
		// 		var value = params.value;
		// 		return value.charAt(0).toUpperCase() + value.slice(1);
		// 	},
		// },
		{
			headerName: "Account",
			field: "chartOfAccount.accountTypeId",
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
			headerName: "Total",
			// field: "chartOfAccount.accountSubTypeId",
			filter: false,
		},
	]);
	// const columnTypes = useMemo(() => {
	// 	return {
	// 		quarterFigure: {
	// 			editable: true,
	// 			cellClass: "number-cell",
	// 			aggFunc: "sum",
	// 			valueFormatter: formatNumber,
	// 			valueParser: function numberParser(params) {
	// 				return Number(params.newValue);
	// 			},
	// 		},
	// 	};
	// }, []);
	// const getRowId = useMemo(() => {
	// 	return (params) => {
	// 		return params.data.id;
	// 	};
	// }, []);

	// const onCellValueChanged = useCallback(() => {
	// 	console.log("onCellValueChanged");
	// }, []);
	const onBtExport = useCallback(() => {
		gridRef.current.api.exportDataAsExcel();
	}, []);
	// const onFirstDataRendered = useCallback(() => {
	// 	if (gridRef.current) {
	// 		gridRef.current.api.expandAll();
	// 	}
	// }, []);
	// const setPrinterFriendly = useCallback((api) => {
	// 	const eGridDiv = document.querySelector("#myGrid");
	// 	if (eGridDiv) {
	// 		eGridDiv.style.width = "";
	// 		eGridDiv.style.height = "";
	// 		api.setDomLayout("print");
	// 	}
	// }, []);
	// const setNormal = useCallback((api) => {
	// 	const eGridDiv = document.querySelector("#myGrid");
	// 	if (eGridDiv) {
	// 		eGridDiv.style.width = "700px";
	// 		eGridDiv.style.height = "200px";
	// 		api.setDomLayout();
	// 	}
	// }, []);

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
	// useEffect(() => {
	// 	const eGridDiv = document.querySelector("#myGrid");
	// 	if (eGridDiv) {
	// 	}
	// }, []);

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
			minWidth: 50,
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
		ModalService.open(<BalanceSheetSendEmail />, {
			modalClass: "edit-contact-person-modal-component",
			width: 630,
		});
	};
	const activeAction = OfferAction.PRINT;
	const DateFilterType = {
		FISCAL_YEAR: "fiscalYear",
		TODAY: "today",
	};
	const [selectedDate, setSelectedDate] = useState(null);
	const currentDate = moment().format("DD-MM-YYYY");

	// const [dateData, setDateData] = useState({
	// 	currentMonthName: moment().format("MMMM"),
	// 	lastMonthName: moment().subtract(1, "months").format("MMMM"),
	// 	secondLastMonth: moment().subtract(2, "months").format("MMMM"),
	// 	currQuarter: moment().startOf("quarter").format("Q/YYYY"),
	// 	lastQuarter: moment().subtract(3, "months").startOf("quarter").format("Q/YYYY"),
	// 	secondLastQuarter: moment().subtract(6, "months").startOf("quarter").format("Q/YYYY"),
	// 	customStartDate: moment().subtract(1, "months"),
	// 	customEndDate: moment(),
	// 	showCustomDateRangeSelector: false,
	// 	dateFilterValue: DateFilterType.FISCAL_YEAR,
	// 	categoryFilterValue: "",
	// 	activeChartData: { series: [] },
	// 	selectedDateFilterType: DateFilterType.FISCAL_YEAR,
	// });
	const dateOptions = [
		{ label: "Today", value: DateFilterType.TODAY, group: "date" },
		// { label: dateData.currentMonthName, value: "currMonth", group: "month" },
		// { label: dateData.lastMonthName, value: "lastMonth", group: "month" },
		// { label: dateData.secondLastMonth, value: "secondLastMonth", group: "month" },
		// { label: `Quarter ${dateData.currQuarter}`, value: "currQuarter", group: "quarter" },
		// { label: `Quarter ${dateData.lastQuarter}`, value: "lastQuarter", group: "quarter" },
		// { label: `Quarter ${dateData.secondLastQuarter}`, value: "secondLastQuarter", group: "quarter" },
		// { label: "Fiscal Year", value: DateFilterType.FISCAL_YEAR, group: "year" },
		// { label: "Custom", value: "custom", group: "custom" },
	];

	const updateSelectedDate = (option) => {
		if (!option) {
			setSelectedDate(null);
			// setProcessStationStatus({ ...processStationStatus, timePeriod: "active" });
			return;
		}

		switch (option.value) {
			case "custom":
				// this.props.onDateChange(option.value, [dateData.customStartDate, dateData.customEndDate]);
				// setDateData({ ...dateData, showCustomDateRangeSelector: true, dateFilterValue: option.value });
				setSelectedDate(option.value);
				// setSelectedDate(
				// 	`From ${dateData.customStartDate.format("DD MMMM YYYY")} to ${dateData.customEndDate.format(
				// 		"DD MMMM YYYY"
				// 	)}`
				// );
				break;
			case DateFilterType.TODAY:
				// Handle today's date selection
				setSelectedDate(DateFilterType.TODAY);
				break;
			default:
				// this.props.onDateChange(option.value);
				// setSelectedDate(option.label);
				// setDateData({ ...dateData, showCustomDateRangeSelector: false, dateFilterValue: option.value });
				setSelectedDate(option.value);
				break;
		}
	};
	// const handleStartDateChange = (name, value) => {
	// 	const startDate = moment(value, "DD-MM-YYYY");
	// 	setDateData({ ...dateData, customStartDate: startDate });
	// 	// updateSelectedDate({ value: "custom" });
	// };

	// const handleEndDateChange = (name, value) => {
	// 	const endDate = moment(value, "DD-MM-YYYY");
	// 	setDateData({ ...dateData, customEndDate: endDate });
	// 	// updateSelectedDate({ value: "custom" });
	// };
	return (
		<div>
			<TopbarComponent
				title={"Balance Sheet"}
				hasCancelButton={true}
				cancelButtonCallback={() => {
					window.history.back();
				}}
			/>
			<div
				className="balance-sheet-component"
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
						width: "200px",
						display: "flex",
						justifyContent: "space-between",
					}}
				>
					<div style={{ flex: "1.5" }} className="time-period-select">
						{/* <SelectInputComponent
							allowCreate={false}
							notAsync={true}
							loadedOptions={dateOptions}
							// value={dateData.dateFilterValue}
							value={selectedDate}
							icon={calenderIcon}
							containerClass="date-input"
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Today",
								handleChange: (option) => {
									updateSelectedDate(option);
								},
							}}
						/> */}
						<DateInputComponent
							// name="date"
							placeholder="Today"
							icon={calenderIcon}
							value={selectedDate ? selectedDate : currentDate} // Pass the selected date value here
							required={true}
							label="Today"
							noBorder={true}
							onChange={(name, value) => {
								setSelectedDate(value);
								// Handle the date change here if needed
							}}
						/>
						{/* {selectedDate && <div>As of {selectedDate}</div>} */}
					</div>

					{/* {dateData.showCustomDateRangeSelector && (
						<div
							style={{
								// marginLeft: "10px",
								display: "flex",
								flex: "1",
								flexDirection: "column",
								alignItems: "flex-start",
								marginLeft: "10px",
								//  alignItems: "center"
							}}
						>
							<div style={{ marginRight: "10px" }}>
								<label htmlFor="startDate">Start Date</label>
								<DateInputComponent
									name="startDate"
									value={dateData.customStartDate.format("DD-MM-YYYY")}
									required={true}
									noBorder={true}
									onChange={handleStartDateChange}
									dateFormat="DD-MM-YYYY"
								/>
							</div>
							<div
							//  style={{  marginRight: "10px"}}
							>
								<label htmlFor="endDate">End Date</label>
								<DateInputComponent
									name="endDate"
									value={dateData.customEndDate.format("DD-MM-YYYY")}
									required={true}
									noBorder={true}
									onChange={handleEndDateChange}
									dateFormat="DD-MM-YYYY"
								/>
							</div>
						</div>
					)} */}
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
					// position: "absolute",
					width: "80vw",
					height: "500px",
					// top: "180px",
					// left: "334px",
					backgroundColor: "#fff",
					marginTop: "30px",
					marginLeft: "50px",
					marginRight: "50px",
					fontWeight: "600",
				}}
			>
				<div className="balance-heading" style={{ width: "80vw", padding: "20px" }}>
					<div>
						<h3>
							{invoiz.user.companyAddress.companyName.charAt(0).toUpperCase() +
								invoiz.user.companyAddress.companyName.slice(1)}{" "}
							Balance Sheet
						</h3>
					</div>
					{selectedDate && <p> As of {selectedDate}</p>}
				</div>

				<div style={gridStyle} className="ag-theme-alpine">
					<AgGridReact
						ref={gridRef}
						rowData={rowData}
						columnDefs={columnDefs}
						defaultColDef={defaultColDef}
						autoGroupColumnDef={autoGroupColumnDef}
						// columnTypes={columnTypes}
						animateRows={true}
						onGridReady={onGridReady}
						modules={AllModules}
						// groupDisplayType={"groupRows"}
						// onFirstDataRendered={onFirstDataRendered}
						// gridOptions={gridOptions}
						// valueCache={true}
						// valueCacheNeverExpires={true}
						// suppressAggFuncInHeader={true}
						// enableCellChangeFlash={true}
						// groupDefaultExpanded={1}
						// getRowId={getRowId}
						// onCellValueChanged={onCellValueChanged}
					></AgGridReact>
				</div>
			</div>{" "}
		</div>
	);
}

export default ReportBalanceSheet;
