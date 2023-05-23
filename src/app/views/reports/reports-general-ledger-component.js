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
// import calenderIcon from "../../../assets/images/icons/calender.svg";
import DateInputComponent from "../../shared/inputs/date-input/date-input.component";
const ReportsGeneralLedger = (props) => {
	LicenseManager.setLicenseKey(
		"CompanyName=Buhl Data Service GmbH,LicensedApplication=invoiz,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=1,LicensedProductionInstancesCount=1,AssetReference=AG-008434,ExpiryDate=8_June_2021_[v2]_MTYyMzEwNjgwMDAwMA==f2451b642651a836827a110060ebb5dd"
	);
	// const { account } = props;

	// const [account, setAccount] = useState(null);

	// useEffect(() => {
	//   // Fetch the account data here and set it using setAccount
	//   const fetchAccountData = async () => {
	//     try {
	//       const response = await fetch('API_ENDPOINT/account');
	//       const accountData = await response.json();
	//       setAccount(accountData);
	//     } catch (error) {
	//       console.error('Error fetching account data:', error);
	//     }
	//   };

	//   fetchAccountData();
	// }, []);

	// if (!account) {
	//   // Display a loading message or spinner while account data is being fetched
	//   return null;
	// }
	// console.log("Account:", account);
	// // console.log("Company Name:", account?.companyAddress?.companyName);
	// const companyName = account?.companyAddress?.companyName || '';

	const gridRef = useRef();
	const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
	const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
	const [rowData, setRowData] = useState();
	const [columnDefs, setColumnDefs] = useState([
		// { field: "country", rowGroup: true, hide: true },
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
		{ field: "chartOfAccount.accountTypeId" },
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
		{ field: "chartOfAccount.accountSubTypeId", filter: false },
		{ field: "debits", filter: false },
		{ field: "credits", filter: false },
		{ field: "balance", filter: false },
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
			// filter: 'agGroupColumnFilter',
		};
	}, []);

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

	const updateSelectedDate = (option) => {
		if (!option) {
			setSelectedDate(null);
			// setProcessStationStatus({ ...processStationStatus, timePeriod: "active" });
			return;
		}

		switch (option.value) {
			case "custom":
				// this.props.onDateChange(option.value, [dateData.customStartDate, dateData.customEndDate]);
				setDateData({ ...dateData, showCustomDateRangeSelector: true, dateFilterValue: option.value });
				setSelectedDate(
					`From ${dateData.customStartDate.format("DD MMMM YYYY")} to ${dateData.customEndDate.format(
						"DD MMMM YYYY"
					)}`
				);
				break;
			default:
				// this.props.onDateChange(option.value);
				setSelectedDate(option.label);
				setDateData({ ...dateData, showCustomDateRangeSelector: false, dateFilterValue: option.value });
				break;
		}
	};
	const handleStartDateChange = (name, value) => {
		const startDate = moment(value, "DD-MM-YYYY");
		setDateData({ ...dateData, customStartDate: startDate });
		// updateSelectedDate({ value: "custom" });
	};

	const handleEndDateChange = (name, value) => {
		const endDate = moment(value, "DD-MM-YYYY");
		setDateData({ ...dateData, customEndDate: endDate });
		// updateSelectedDate({ value: "custom" });
	};

	return (
		<div style={containerStyle}>
			<TopbarComponent
				title={"General Ledger"}
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
					// marginRight: "50px",
					width: "200px",
					// height: "50px",
					// border: "1px solid white",
					// borderRadius: "30px",
					// borderColor: "black",
					// display: "flex",
					display: "inline-block",
				}}
			>
				<div
					className="time-period-select-container"
					style={{ width: "100%", display: "flex", justifyContent: "space-between" }}
				>
					{/* <Label
    label="Select time period"
    sublabel="Please select a time period for viewing transactions."
    style={{ flex: "1", marginRight: "10px" }}
  /> */}
					{/* {showCategoryFilter && ( */}
					<div style={{ flex: "1.5" }} className="time-period-select">
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
								handleChange: (option) => {
									updateSelectedDate(option);
								},
							}}
						/>
						{dateData.showCustomDateRangeSelector && (
							<div
								id="general-ledger-date-picker-container"
								className="start-end-date-selector-group"
								style={{ display: "flex" }}
							>
								<DateInputComponent
									name={"startDate"}
									value={dateData.customStartDate.format("DD-MM-YYYY")}
									required={true}
									label={"Start Date"}
									noBorder={true}
									// onChange={(name, value) => {
									// 	console.log("setting custom start date", value, moment(value, "DD-MM-YYYY"));
									// 	setDateData({
									// 		...dateData,
									// 		customStartDate: moment(value, "DD-MM-YYYY"),
									// 	});
									// 	updateSelectedDate({ value: "custom" });
									// }}
									onChange={handleStartDateChange}
									dateFormat="DD-MM-YYYY"
								/>
								<DateInputComponent
									name={"endDate"}
									value={dateData.customEndDate.format("DD-MM-YYYY")}
									required={true}
									label={"End Date"}
									noBorder={true}
									// onChange={(name, value) => {
									// 	console.log("setting custom end date", value, moment(value, "DD-MM-YYYY"));
									// 	setDateData({
									// 		...dateData,
									// 		customEndDate: moment(value, "DD-MM-YYYY"),
									// 	});
									// 	updateSelectedDate({ value: "custom" });
									// }}
									onChange={handleEndDateChange}
									dateFormat="DD-MM-YYYY"
								/>
							</div>
						)}
					</div>
				</div>

				<div
					style={{
						display: "flex",
						// marginTop: "110px",
						marginLeft: "1200px",
						// marginRight: "50px",
						width: "600px",
						// height: "20px",
						// border: "1px solid white",
						// borderRadius: "30px",
						// borderColor: "black",
						// display: "flex",
						// display: "inline-block",
					}}
				>
					{/* <button onClick={sendEmail}> */}
					<div className="icon-mail" style={{ marginRight: "10px" }} onClick={sendEmail}>
						<span className="pdf_mail"></span>
						<span className="icon-text">Send email</span>
					</div>
					{/* </button> */}
					<div className="icon-print2" onClick={onBtPrint} style={{ marginRight: "10px" }}>
						<span className="pdf_print"></span>
						<span className="icon-text">Print</span>
					</div>
					<div className="icon-download" style={{ marginRight: "10px" }} onClick={onBtExport}>
						<span className="download"></span>
						<span className="icon-text">Export</span>
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
					// width: "80vw",
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
				<div className="general-heading" style={{ 
					// width: "80vw", 
					padding: "20px" 
					}}>
					<div>
						<h3>
							{invoiz.user.companyAddress.companyName.charAt(0).toUpperCase() +
								invoiz.user.companyAddress.companyName.slice(1)}{" "}
							General Ledger
						</h3>
					</div>
					{/* <p style={{ color: "#C6C6C6" }}>From 01 Mar 2023 to 31 Mar 2023</p> */}
					{selectedDate && <p> {selectedDate}</p>}
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
};
export default ReportsGeneralLedger;
