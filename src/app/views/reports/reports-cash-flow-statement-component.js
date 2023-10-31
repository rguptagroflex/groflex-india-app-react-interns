import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { AllModules, LicenseManager } from "@ag-grid-enterprise/all-modules";
import TopbarComponent from "../../shared/topbar/topbar.component";
import SelectInputComponent from "../../shared/inputs/select-input/select-input.component";
import calenderIcon from "../../../assets/images/icons/calender.svg";
import invoiz from "../../services/invoiz.service";
import OfferSendMailWrapper from "../offer/offer-send-mail.wrapper";
import config from "../../../config";
import ModalService from "../../services/modal.service";
import OfferAction from "enums/offer/offer-action.enum";
import moment from "moment";
import CashAndFlowSendEmail from "./cash-and-flow-send-email";
import DateInputComponent from "../../shared/inputs/date-input/date-input.component";
import { formatApiDate } from "../../helpers/formatDate";
import { connect } from "react-redux";
const ReportsCashFlowStatement = (props) => {
	LicenseManager.setLicenseKey(
		"CompanyName=Buhl Data Service GmbH,LicensedApplication=invoiz,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=1,LicensedProductionInstancesCount=1,AssetReference=AG-008434,ExpiryDate=8_June_2021_[v2]_MTYyMzEwNjgwMDAwMA==f2451b642651a836827a110060ebb5dd"
	);

	const gridRef = useRef();
	const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
	const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
	const [rowData, setRowData] = useState([]);
	const [selectedDate, setSelectedDate] = useState(null);
	const [contentHeaders, setcontentHeaders] = useState([]);
	const CustomCellRenderer = ({ value, colDef }) => <span>{value !== undefined ? `₹ ${value}` : value}</span>;

	const [columnDefs, setColumnDefs] = useState([
		{
			field: "chartOfAccount.accountTypeId",
			rowGroup: true,
			enableRowGroup: true,
			hide: true,
			filter: false,
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
		{ headerName: "Code", field: "chartOfAccount.accountCode", filter: false },
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
		// { field: "balance", filter: false },
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
			case "custom":
				startDate = dateData.customStartDate.format("DD MMMM YYYY");
				endDate = dateData.customEndDate.format("DD MMMM YYYY");
				break;
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
		ModalService.open(<CashAndFlowSendEmail />, {
			modalClass: "edit-contact-person-modal-component",
			width: 630,
		});
	};
	const activeAction = OfferAction.PRINT;
	const DateFilterType = {
		FISCAL_YEAR: "fiscalYear",
	};

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

		const { startDate, endDate } = onDate(option.value);

		switch (option.value) {
			case "custom":
				setDateData({ ...dateData, showCustomDateRangeSelector: true, dateFilterValue: option.value });
				// setSelectedDate({
				// 	startDate: dateData.customStartDate.format("DD MMMM YYYY"),
				// 	endDate: dateData.customEndDate.format("DD MMMM YYYY"),
				// });
				setSelectedDate({ startDate, endDate });

				break;
			default:
				// onDate(option.value);
				setDateData({
					...dateData,
					showCustomDateRangeSelector: false,
					dateFilterValue: option.value,
				});
				setSelectedDate({ startDate, endDate });
				break;
		}
	};

	const handleStartDateChange = (name, value) => {
		const startDate = moment(value, "DD-MM-YYYY");
		// setDateData({ ...dateData, customStartDate: startDate });
		setSelectedDate({ ...selectedDate, startDate: startDate });
	};

	const handleEndDateChange = (name, value) => {
		const endDate = moment(value, "DD-MM-YYYY");
		// setDateData({ ...dateData, customEndDate: endDate });
		setSelectedDate({ ...selectedDate, endDate: endDate });
	};

	const fetchData = async () => {
		const endpoint = `${config.resourceHost}accountingReport/cashflow/${moment(
			selectedDate.startDate
		).format()}/${moment(selectedDate.endDate).format()}?type=json`;
		let headers = [];

		await invoiz.request(endpoint, { auth: true }).then((res) => {
			console.log("result: ", res.body.data);
			const response = res.body.data;
			if (response) {
				console.log(response.summaryData.transactions);
				response.summaryData.transactions.forEach((item) => {
					if (!headers.includes(item.accountTypeId)) {
						headers.push(item.accountTypeId);
					}
				});
				setcontentHeaders(headers);
				setRowData(response.summaryData.transactions);
			}
		});
	};
	useEffect(() => {
		fetchData();
	}, [selectedDate]);

	const submenVisible = props.isSubmenuVisible;
	const classLeft = submenVisible ? "leftAlignCashAndFlow" : "";

	return (
		<div className="reports-cash-flow-component">
			<TopbarComponent
				title={"Cash Flow Statement"}
				hasCancelButton={true}
				cancelButtonCallback={() => {
					window.history.back();
				}}
			/>
			<div className={`cash-flow-component-wrapper ${classLeft}`}>
				<div className="general-ledger-component">
					<div
						className="time-period-select-container"
						style={{
							width: dateData.showCustomDateRangeSelector ? "500px" : "200px",
						}}
					>
						<div className="time-period-select">
							<div className="time-period-select-subDiv">
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

					<div className="utility-icons-wrapper">
						<div className="utility-icons">
							<div className="icon-mail" onClick={sendEmail}>
								<span className="pdf_mail"></span>
								<span className="icon-text">Send email</span>
							</div>
							<div className="icon-separtor-first"></div>
							<div className="icon-print2" onClick={onBtPrint}>
								<span className="pdf_print"></span>
								<span className="icon-text">Print</span>
							</div>
							<div className="icon-separtor-second"></div>

							<div className="icon-download" onClick={onBtExport}>
								<span className="download"></span>
								<span className="icon-text">Export</span>
							</div>
						</div>
					</div>
				</div>
				<div className="general-heading">
					<div>
						<h3>
							{invoiz.user.companyAddress.companyName.charAt(0).toUpperCase() +
								invoiz.user.companyAddress.companyName.slice(1)}{" "}
							Cash Flow Statement
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
				{rowData.length > 0 ? (
					<div>
						<div className="cash-flow-content">
							{contentHeaders.map((item) => (
								<div className="cash-flow-content-wrapper">
									<div className="row-heading">
										<h6>
											{item
												.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
												.charAt(0)
												.toUpperCase() + item.replace(/([a-z0-9])([A-Z])/g, "$1 $2").slice(1)}
										</h6>
									</div>
									<div className="row-content">
										{rowData
											.filter((filteredItem) => filteredItem.accountTypeId === item)
											.map((subItem) => {
												const rowContentName =
													subItem.accountSubTypeId
														.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
														.charAt(0)
														.toUpperCase() +
													subItem.accountSubTypeId
														.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
														.slice(1);
												return (
													<div className="row-content-wrapper">
														{/* <div className="row-content-name">{string.split("Total")[0]}</div> */}
														<div className="row-content-name">{rowContentName}</div>
														<div className="row-content-value">
															₹ {parseFloat(subItem.total).toFixed(2)}
														</div>
													</div>
												);
											})}
									</div>
								</div>
							))}
						</div>
						<div className="cash-flow-result">
							<div className="year-beginning">
								<h6>CASH AT THE BEGINNING OF THE YEAR</h6>
								<h6 className="result-value">₹ {parseFloat("0").toFixed(2)}</h6>
							</div>
							<div className="year-ending">
								<h6>CASH AT THE END OF THE YEAR</h6>
								<h6 className="result-value">₹ {parseFloat("0").toFixed(2)}</h6>
							</div>
						</div>
					</div>
				) : (
					<h6 style={{ display: "flex", justifyContent: "center" }}>No rows to display</h6>
				)}
			</div>{" "}
		</div>
	);
};

const mapStateToProps = (state) => {
	const isSubmenuVisible = state.global.isSubmenuVisible;
	return {
		isSubmenuVisible,
	};
};

export default connect(mapStateToProps, null)(ReportsCashFlowStatement);
// export default ReportsCashFlowStatement;
