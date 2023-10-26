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
import SVGInline from "react-svg-inline";
import Arrow from "../../../assets/images/icons/chevrons-down.svg";
import ArrowSide from "../../../assets/images/icons/chevron.svg";

import DateInputComponent from "../../shared/inputs/date-input/date-input.component";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { connect } from "react-redux";
function ReportsProfitAndLoss(props) {
	LicenseManager.setLicenseKey(
		"CompanyName=Buhl Data Service GmbH,LicensedApplication=invoiz,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=1,LicensedProductionInstancesCount=1,AssetReference=AG-008434,ExpiryDate=8_June_2021_[v2]_MTYyMzEwNjgwMDAwMA==f2451b642651a836827a110060ebb5dd"
	);
	const gridRef = useRef();
	const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
	const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
	const [rowData, setRowData] = useState([]);
	const [expandedAccountTypes, setExpandedAccountTypes] = useState([]);
	const [tableHeaders, setTableHeaders] = useState([]);
	const [tableTotals, setTableTotal] = useState([]);
	const CustomCellRenderer = ({ value, colDef }) => (
		<span>{colDef.field === "balance" && value !== undefined ? `₹ ${value}` : value}</span>
	);

	const fetchData = async () => {
		const startDate = moment(selectedDate.startDate).format();
		const endDate = moment(selectedDate.endDate).format();
		console.log("Start Date: ", startDate);
		console.log("End Date: ", endDate);
		let tableHeaders = [];
		try {
			const response = await invoiz.request(
				`${config.resourceHost}accountingReport/profitandloss/${startDate}/${endDate}?type=json`,
				{ auth: true }
			);
			const responseData = response.body.data;

			if (responseData && responseData.summaryData && responseData.summaryData.transactions) {
				const transactions = responseData.summaryData.transactions;
				setTableTotal(responseData.summaryData);
				setRowData(transactions);

				transactions.forEach((item) => {
					if (!tableHeaders.includes(item.accountTypeId)) {
						tableHeaders.push(item.accountTypeId);
					}
				});

				setTableHeaders(tableHeaders);
			} else {
				console.error("Data structure in the response is not as expected.");
			}
		} catch (error) {
			console.error("Error fetching data:", error);
		}
	};

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
	const toggleAccountType = (accountType) => {
		// Check if the account type is expanded, and toggle it
		if (expandedAccountTypes.includes(accountType)) {
			setExpandedAccountTypes(expandedAccountTypes.filter((type) => type !== accountType));
		} else {
			setExpandedAccountTypes([...expandedAccountTypes, accountType]);
		}
	};

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
	const [showAccountType, setShowAccountType] = useState(false);
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
	useEffect(() => {
		console.log("selected Date: ", selectedDate);
		fetchData();
	}, [selectedDate]);

	const submenVisible = props.isSubmenuVisible;
	const classLeft = submenVisible ? "leftAlignProfitAndLoss" : "";

	return (
		<div className="profit-loss-component">
			<TopbarComponent
				title={"Profit and loss"}
				hasCancelButton={true}
				cancelButtonCallback={() => {
					window.history.back();
				}}
			/>
			<div className={`profit-loss-component-wrapper ${classLeft}`}>
				<div className="general-ledger-component">
					<div
						className="time-period-select-container"
						style={{
							width: dateData.showCustomDateRangeSelector ? "500px" : "200px",
						}}
					>
						<div className="time-period-select">
							<div className="date-selector">
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
							Profit and loss
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

				<div className="table-container">
					<div className="profit-loss-table-header">
						<h6 className="headingLeft">Account</h6>
						<h6 className="headinMiddle">Account Code</h6>
						<h6 className="headingRight">Amount</h6>
					</div>

					{tableHeaders.map((item) => {
						return (
							<div>
								<Accordion>
									<AccordionSummary
										expandIcon={<ExpandMoreIcon />}
										aria-controls="panel1a-content"
										id="panel1a-header"
									>
										<h6>{item.charAt(0).toUpperCase() + item.slice(1)}</h6>
									</AccordionSummary>

									<AccordionDetails>
										<div className="balance-sheet-accordian-details">
											{rowData
												.filter((filteredItem) => filteredItem.accountTypeId === item)
												.map((subItem, index) => (
													<React.Fragment>
														<div className="accordian-details-row-entry">
															<div className="accordian-detail-name">
																{subItem.accountSubTypeId}{" "}
															</div>
															<div className="accordian-detail-total">
																{subItem.credits === 0
																	? subItem.debits
																	: subItem.credits}{" "}
															</div>
														</div>

														{/* {index ===
														rowData.filter(
															(filteredItem) => filteredItem.accountTypeId === item
														).length -
															1 ? (
															<React.Fragment>
																<div className="Total">
																	<div>Total {item}</div>
																	<div className="totalValue">
																		{parseFloat(
																			tableTotals[item + "Total"]
																		).toFixed(2)}
																	</div>
																</div>
															</React.Fragment>
														) : (
															""
														)} */}
													</React.Fragment>
												))}
										</div>
									</AccordionDetails>
								</Accordion>
								<div className="Total-container">
									<React.Fragment>
										<div className="Total">
											<div>Total {item}</div>
											<div className="totalValue">
												{parseFloat(tableTotals[item + "Total"]).toFixed(2)}
											</div>
										</div>
									</React.Fragment>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

const mapStateToProps = (state) => {
	const isSubmenuVisible = state.global.isSubmenuVisible;
	return {
		isSubmenuVisible,
	};
};

export default connect(mapStateToProps, null)(ReportsProfitAndLoss);
// export default ReportsProfitAndLoss;
