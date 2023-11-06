import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { AllModules, LicenseManager } from "@ag-grid-enterprise/all-modules";
import TopbarComponent from "../../shared/topbar/topbar.component";
import SelectInputComponent from "../../shared/inputs/select-input/select-input.component";
import calenderIcon from "../../../assets/images/icons/calender.svg";
import invoiz from "../../services/invoiz.service";
import OfferSendMailWrapper from "../offer/offer-send-mail.wrapper";
import BalanceSheetSendEmail from "./balance-sheet-send-email";
import config from "../../../config";
import ModalService from "../../services/modal.service";
import OfferAction from "enums/offer/offer-action.enum";
import moment from "moment";
import SVGInline from "react-svg-inline";
import DateInputComponent from "../../shared/inputs/date-input/date-input.component";
import Arrow from "../../../assets/images/icons/chevrons-down.svg";
import ArrowSide from "../../../assets/images/icons/chevron.svg";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Divider from "@material-ui/core/Divider";
import { connect } from "react-redux";
import { formatApiDate } from "../../helpers/formatDate";
import SendEmailModalComponent from "../../shared/send-email/send-email-modal.component";
import PopoverComponent from "../../shared/popover/popover.component";

const ReportBalanceSheet = (props) => {
	LicenseManager.setLicenseKey(
		"CompanyName=Buhl Data Service GmbH,LicensedApplication=invoiz,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=1,LicensedProductionInstancesCount=1,AssetReference=AG-008434,ExpiryDate=8_June_2021_[v2]_MTYyMzEwNjgwMDAwMA==f2451b642651a836827a110060ebb5dd"
	);

	const gridRef = useRef();
	const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
	const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
	const [tableTotals, setTableTotal] = useState([]);
	const [rowData, setRowData] = useState([]);
	const [tableHeaders, setTableHeader] = useState([]);
	const [expandedAccountTypes, setExpandedAccountTypes] = useState([]);
	const [exportFormat, setExportFormat] = useState("");

	const CustomCellRenderer = ({ value, colDef }) => (
		<span>{colDef.field === "total" && value !== undefined ? `₹ ${value}` : value}</span>
	);

	const onBtExport = useCallback(() => {
		gridRef.current.api.exportDataAsExcel();
	}, []);
	const onFirstDataRendered = useCallback(() => {
		if (gridRef.current) {
			gridRef.current.api.expandAll();
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

	useEffect(() => {
		fetchData();
	}, []);
	const [responseData, setResponseData] = useState(null);
	const fetchData = async () => {
		let tableHeaders = [];
		// console.log("start: ", startDate);
		try {
			const response = await invoiz.request(
				`${config.resourceHost}accountingReport/balanceSheet/${moment(
					selectedDate.startDate
				).format()}/${moment(selectedDate.endDate).format()}?type=json`,
				{ auth: true }
			);
			const responseData = response.body.data;
			// console.log("Response Data:", responseData);
			if (responseData && responseData.summaryData && responseData.summaryData.transactions) {
				const transactions = responseData.summaryData.transactions;
				setTableTotal(responseData.summaryData);
				transactions.forEach((item) => {
					if (!tableHeaders.includes(item.accountTypeId)) {
						tableHeaders.push(item.accountTypeId);
					}
				});
				setTableHeader(tableHeaders);

				setRowData(transactions);
				setResponseData(responseData);
			} else {
				console.error("Data structure in the response is not as expected.");
			}
		} catch (error) {
			console.error("Error fetching data:", error);
		}
	};
	const [showAccountType, setShowAccountType] = useState(false);
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
		// console.log("CustomStart: ", startDate);
		setSelectedDate({ startDate, endDate });
		// console.log("startDate", startDate);
		return { startDate, endDate };
	};

	const handleSendBalanceSheetEmail = (modalData) => {
		const { emailTextAdditional, emails, regard, sendType } = modalData;
		// console.log(emailTextAdditional, emails, regard, sendType, "data friom modal emai lvierw");

		const url = `${config.resourceHost}accountingReport/sendAccountingReportEmail/BalanceSheet/${moment(
			selectedDate.startDate
		).format()}/${moment(selectedDate.endDate).format()}`;

		const method = "POST";
		const data = {
			recipients: emails.map((email) => email.value),
			subject: regard,
			text: emailTextAdditional,
			sendCopy: false,
			sendType: sendType,
		};

		invoiz
			.request(url, { auth: true, method, data })
			.then((res) => {
				// console.log("Response:  for send email modal", res);
				invoiz.showNotification({ type: "success", message: "Ledger email sent" });
				ModalService.close();
			})
			.catch(() => {
				invoiz.showNotification({ type: "error", message: "Couldn't send email" });
				ModalService.close();
			});
	};

	const sendEmail = () => {
		// ModalService.open(<BalanceSheetSendEmail selectedDate={selectedDate} />, {
		// 	modalClass: "edit-contact-person-modal-component",
		// 	width: 630,
		// });
		ModalService.open(
			<SendEmailModalComponent
				heading={"Send Balance Sheet"}
				fileNameWithoutExt={`BalanceSheet_${moment(selectedDate.startDate).format("DD-MM-YYYY")}_${moment(
					selectedDate.endDate
				).format("DD-MM-YYYY")}`}
				onSubmit={(data) => handleSendBalanceSheetEmail(data)}
			/>,
			{
				modalClass: "send-ledger-email-modal-component-wrapper",
				width: 630,
			}
		);
	};
	const activeAction = OfferAction.PRINT;
	const DateFilterType = {
		FISCAL_YEAR: "fiscalYear",
	};
	const [selectedDate, setSelectedDate] = useState("");

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
				setDateData({
					...dateData,
					showCustomDateRangeSelector: true,
					dateFilterValue: option.value,
				});
				// setSelectedDate({
				// 	startDate: dateData.customStartDate.format("DD MMMM YYYY"),
				// 	endDate: dateData.customEndDate.format("DD MMMM YYYY"),
				// });
				setSelectedDate({ startDate, endDate });
				// fetchData(startDate, endDate);

				break;
			default:
				// onDate(option.value);
				setDateData({
					...dateData,
					showCustomDateRangeSelector: false,
					dateFilterValue: option.value,
				});
				setSelectedDate({ startDate, endDate });
				// fetchData(startDate, endDate);

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
	useEffect(() => {
		// Fetch initial data with the default date filter
		const { startDate, endDate } = onDate(dateData.dateFilterValue);
		fetchData(startDate, endDate);
	}, []); //

	useEffect(() => {
		fetchData();
	}, [selectedDate]);

	// const exportButtonClick = async () => {
	// 	const endpoint = `${config.resourceHost}accountingReport/balanceSheet/${moment(
	// 		selectedDate.startDate
	// 	).format()}/${moment(selectedDate.endDate).format()}?type=csv`;
	// 	await invoiz.request(endpoint, { auth: true }).then((res) => {
	// 		console.log("Res: ", res);
	// 	});
	// };

	const exportButtonClick = () => {
		console.log("Export Format: ", exportFormat);
		const url = `${config.resourceHost}accountingReport/balanceSheet/${moment(
			selectedDate.startDate
		).format()}/${moment(selectedDate.endDate).format()}?type=${exportFormat}`;

		invoiz
			.request(url, {
				auth: true,
				method: "GET",
				headers: { "Content-Type": `application/${exportFormat}` },
			})
			.then(({ body }) => {
				console.log("Api Called", body);
				invoiz.page.showToast({ message: props.resources.ledgerExportCreateSuccess });
				var blob = new Blob([body], { type: "application/text" });
				console.log("Blob", blob);
				var link = document.createElement("a");
				link.href = window.URL.createObjectURL(blob);
				link.download = `${moment(selectedDate.startDate).format()}_${moment(
					selectedDate.endDate
				).format()}.${exportFormat}`;

				document.body.appendChild(link);

				link.click();

				document.body.removeChild(link);
				setExportFormat("");
			})
			.catch((err) => {
				setExportFormat("");
				invoiz.page.showToast({ type: "error", message: props.resources.ledgerExportCreateError });
			});
	};

	const submenVisible = props.isSubmenuVisible;
	const classLeft = submenVisible ? "leftAlignBalanceSheet" : "";
	const onExportButtonItemClicked = (entry) => {
		switch (entry.action) {
			case "pdf":
				setExportFormat("pdf");

				break;
			case "csv":
				setExportFormat("csv");

				break;
		}
	};

	useEffect(() => {
		if (exportFormat !== "") {
			exportButtonClick();
		}
	}, [exportFormat]);

	return (
		<div className="reports-balance-sheet-component">
			<TopbarComponent
				title={"Balance Sheet"}
				hasCancelButton={true}
				cancelButtonCallback={() => {
					window.history.back();
				}}
			/>
			<div className={`balance-sheet-component-wrapper ${classLeft}`}>
				<div className="general-ledger-component">
					<div
						className="time-period-select-container"
						style={{
							width: dateData.showCustomDateRangeSelector ? "500px" : "200px",
						}}
					>
						<div className="time-period-select">
							<div className="time-period-select-dropdown">
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

					<div className="balance-sheet-utility-icons">
						<div className="utilityIcons">
							<div className="icon-mail" onClick={sendEmail}>
								<span className="pdf_mail"></span>
								<span className="icon-text">Send email</span>
							</div>
							<div className="icon-separtor"></div>

							<div className="icon-download" id="Export-dropdown-btn">
								<span className="download"></span>
								<span className="icon-text">Export</span>
								<div className="export-btn-popup">
									<PopoverComponent
										showOnClick={true}
										contentClass={`Export-dropdown-content`}
										elementId={"Export-dropdown-btn"}
										entries={[
											[
												{
													label: "As CSV",
													action: "csv",
													dataQsId: "export-type-csv",
												},
												{
													label: "As PDF",
													action: "pdf",
													dataQsId: "export-type-pdf",
												},
											],
										]}
										onClick={(entry) => {
											onExportButtonItemClicked(entry);
										}}
										offsetLeft={7}
										offsetTop={7}
										useOverlay={true}
									/>
								</div>
							</div>
							<div className="icon-separtor_second"></div>
							<div className="icon-print2" onClick={onBtPrint}>
								<span className="pdf_print"></span>
								<span className="icon-text">Print</span>
							</div>
						</div>
					</div>
				</div>
				<div className="general-heading">
					<div>
						<h3>
							{invoiz.user.companyAddress.companyName.charAt(0).toUpperCase() +
								invoiz.user.companyAddress.companyName.slice(1)}{" "}
							Balance Sheet
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
					<div className="balance-sheet-table-header">
						<h6 className="headingLeft">Account</h6>
						<h6 className="headingRight">Total</h6>
					</div>

					{tableHeaders.map((item) => {
						return (
							<div>
								<Accordion elevation={0}>
									<AccordionSummary
										expandIcon={<ExpandMoreIcon />}
										aria-controls="panel1a-content"
										id="panel1a-header"
									>
										{" "}
										<h6>{item.charAt(0).toUpperCase() + item.slice(1)}</h6>{" "}
									</AccordionSummary>

									<AccordionDetails>
										<div className="balance-sheet-accordian-details">
											{rowData
												.filter((filteredItem) => filteredItem.accountTypeId === item)
												.map((subItem, index) => (
													<React.Fragment>
														<div className="accordian-details-row-entry">
															<div className="accordian-detail-name">
																{subItem.accountSubTypeId
																	.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
																	.charAt(0)
																	.toUpperCase() +
																	subItem.accountSubTypeId
																		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
																		.slice(1)}
															</div>
															<div className="accordian-detail-total">
																<div className="currency-container">
																	₹
																	{subItem.credits === 0
																		? parseFloat(subItem.debits).toFixed(2)
																		: parseFloat(subItem.credits).toFixed(2)}
																</div>
															</div>
														</div>
													</React.Fragment>
												))}
										</div>
									</AccordionDetails>
								</Accordion>
								<div className="Total-container">
									<React.Fragment>
										<div className="Total">
											<div className="totalName">Total {item}</div>
											<div className="totalValue">
												<div className="currency-container">
													<div>₹ {parseFloat(tableTotals[item + "Total"]).toFixed(2)}</div>
												</div>
											</div>
										</div>
									</React.Fragment>
								</div>
							</div>
						);
					})}
					<div className="balance-sheet-result">
						<div className="result-container">
							<h6 className="result-name">TOTAL BALANCE</h6>
							<h6 className="result-value">
								<div className="currency-container">
									₹ {parseFloat(tableTotals.finalBalanceTotal).toFixed(2)}
								</div>{" "}
							</h6>
						</div>
					</div>
				</div>
			</div>{" "}
		</div>
	);
};

const mapStateToProps = (state) => {
	const isSubmenuVisible = state.global.isSubmenuVisible;
	const { resources } = state.language.lang;
	return {
		isSubmenuVisible,
		resources,
	};
};

export default connect(mapStateToProps, null)(ReportBalanceSheet);
// export default ReportBalanceSheet;
