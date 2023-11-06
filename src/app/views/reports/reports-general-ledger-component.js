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
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import { connect } from "react-redux";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import SendEmailModalComponent from "../../shared/send-email/send-email-modal.component";
import PopoverComponent from "../../shared/popover/popover.component";
const ReportsGeneralLedger = (props) => {
	LicenseManager.setLicenseKey(
		"CompanyName=Buhl Data Service GmbH,LicensedApplication=invoiz,LicenseType=SingleApplication,LicensedConcurrentDeveloperCount=1,LicensedProductionInstancesCount=1,AssetReference=AG-008434,ExpiryDate=8_June_2021_[v2]_MTYyMzEwNjgwMDAwMA==f2451b642651a836827a110060ebb5dd"
	);

	const gridRef = useRef();
	const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
	const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
	const [rowData, setRowData] = useState([]);
	const [tableHeaders, setTableHeader] = useState([]);
	const [exportFormat, setExportFormat] = useState("");

	// const CustomCellRenderer = ({ value, colDef }) => <span>{value !== undefined ? `₹ ${value}` : value}</span>;
	const CustomCellRenderer = ({ value, colDef }) => (
		<span>{value !== undefined ? (value !== "-" ? `₹ ${value}` : `${value}`) : ""}</span>
	);

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
					// return "";
					return value;
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
	const [selectedDate, setSelectedDate] = useState(moment().month("April").startOf("month").format("DD MMM YYYY"));

	const [customers, setCustomers] = useState([]);
	const [customerId, setCustomerID] = useState("");
	const [customerName, setCustomerName] = useState("");
	const setCustomerDropDown = (option) => {
		setCustomerID(option.value);
	};
	const fetchCustomers = () => {
		let customerDropDownValues = [];
		const endpoint = `${config.resourceHost}customer?offset=0`;
		invoiz.request(endpoint, { auth: true }).then((res) => {
			res.body.data.forEach((item) => {
				// customerDropDownValues = {
				// 	...customerDropDownValues,
				// 	[item.id]: item.name,
				// };
				customerDropDownValues.push({ name: item.name, value: item.id });
			});
			setCustomers(customerDropDownValues);
		});
	};

	useEffect(() => {
		fetchCustomers();
	}, []);

	const onGridReady = useEffect(
		(params) => {
			const startDate = moment(selectedDate.startDate).format("YYYY-MM-DD");
			const endDate = moment(selectedDate.endDate).format("YYYY-MM-DD");
			// console.log("Api ID: ", customerId);
			if (customerId === "") {
				setRowData([]);
			} else {
				invoiz

					.request(
						`${config.resourceHost}accountingReport/generalLedger/${startDate}/${endDate}?type=json&customerId=${customerId}`,

						{ auth: true }
					)
					.then((res) => {
						let filterdResponse = [];
						const transactions = res.body.data.summaryData.transactions;
						transactions.forEach((item) => {
							if (item.chartOfAccount) {
								if (
									Date.parse(item.date) >= Date.parse(selectedDate.startDate) &&
									Date.parse(item.date) <= Date.parse(selectedDate.endDate)
								) {
									filterdResponse.push(item);
								}
							}
						});
						filterdResponse.forEach((item) => {
							if (!tableHeaders.includes(item.chartOfAccount.accountTypeId)) {
								tableHeaders.push(item.chartOfAccount.accountTypeId);
							}
						});
						setTableHeader(tableHeaders);

						setCustomerName(res.body.data.summaryData.customer.name);
						// console.log("Filtered Response: ", filterdResponse);

						setRowData(filterdResponse);
					});
			}
		},
		[selectedDate, customerId]
	);
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
		// console.log("startDate", startDate);
		return { startDate, endDate };
	};

	const handleSendGeneralLedgerEmail = (modalData) => {
		const { emailTextAdditional, emails, regard, sendType } = modalData;
		// console.log(emailTextAdditional, emails, regard, sendType, "data friom modal emai lvierw");

		const url = `${config.resourceHost}accountingReport/sendAccountingReportEmail/GeneralLedger/${moment(
			selectedDate.startDate
		).format()}/${moment(selectedDate.endDate).format()}`;

		const method = "POST";
		const data = {
			recipients: emails.map((email) => email.value),
			subject: regard,
			text: emailTextAdditional,
			sendCopy: false,
			sendType: sendType,
			customerId: customerId,
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
		// ModalService.open(<GeneralLedgerSendEmail selectedDate={selectedDate} />, {
		// 	modalClass: "edit-contact-person-modal-component",
		// 	width: 630,
		// });
		ModalService.open(
			<SendEmailModalComponent
				heading={"Send General Ledger"}
				fileNameWithoutExt={`GeneralLedger_${moment(selectedDate.startDate).format("DD-MM-YYYY")}_${moment(
					selectedDate.endDate
				).format("DD-MM-YYYY")}`}
				onSubmit={(data) => handleSendGeneralLedgerEmail(data)}
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
				onDate(option.value);
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

	const submenVisible = props.isSubmenuVisible;
	const classLeft = submenVisible ? "leftAlignGeneralLedger" : "";
	// console.log("Table Heads: ", tableHeaders);
	// console.log("Row Data: ", rowData);

	const exportButtonClick = () => {
		console.log("Export Format: ", exportFormat);
		const startDate = moment(selectedDate.startDate).format("YYYY-MM-DD");
		const endDate = moment(selectedDate.endDate).format("YYYY-MM-DD");

		const url = `${config.resourceHost}accountingReport/generalLedger/${startDate}/${endDate}?type=${exportFormat}&customerId=${customerId}`;

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
		<div style={containerStyle} className="general-ledger-component-main">
			<TopbarComponent
				title={"General Ledger"}
				hasCancelButton={true}
				cancelButtonCallback={() => {
					window.history.back();
				}}
			/>
			<div className={`general-ledger-content ${classLeft}`}>
				<div className="general-ledger-component general-ledger-content-top">
					<div
						className="time-period-select-container"
						style={{
							width: dateData.showCustomDateRangeSelector ? "500px" : "200px",
						}}
					>
						<div className="time-period-select">
							<div className="customer-drop-down">
								{/* <FormControl>
									<Select
										value={customerId}
										onChange={setCustomerDropDown}
										displayEmpty
										disableUnderline
									>
										<MenuItem value="">None</MenuItem>

										{customers.map((customer) => (
											<MenuItem value={customer.id}>{customer.name}</MenuItem>
										))}
									</Select>
								</FormControl> */}
								<SelectInputComponent
									name="customer"
									notAsync={true}
									options={{
										clearable: false,
										searchable: true,
										labelKey: "name",
										valueKey: "value",
										handleChange: (option) => {
											if (!option) return;
											// this.onCustomerChange(option.customer);
											setCustomerDropDown(option);
											// console.log("Option", option);
										},
									}}
									title={"Customers"}
									value={customerId || null}
									loadedOptions={customers}
									dataQsId="timetracking-edit-customer"
								/>
							</div>
							<div className="date-select-drop-down">
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
									<div>
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

					{rowData.length > 0 ? (
						<div className="utility-icons-container">
							<div className="utility-icons">
								<div className="icon-mail" onClick={sendEmail}>
									<div className="pdf_mail"></div>
									<div className="icon-text">Send email</div>
								</div>
								<div className="icon-separtor-first"></div>
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
								<div className="icon-separtor-second"></div>
								<div className="icon-print2" onClick={onBtPrint}>
									<span className="pdf_print"></span>
									<span className="icon-text">Print</span>
								</div>
							</div>
						</div>
					) : (
						""
					)}
				</div>
				<div className="general-heading general-ledger-content-middle">
					<div>
						<h3>{customerName} General Ledger</h3>
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
					{/* <AgGridReact
						ref={gridRef}
						rowData={rowData}
						columnDefs={columnDefs}
						defaultColDef={defaultColDef}
						autoGroupColumnDef={autoGroupColumnDef}
						animateRows={true}
						onGridReady={onGridReady}
						modules={AllModules}
						onFirstDataRendered={onFirstDataRendered}
					></AgGridReact> */}

					{rowData.length > 0 ? (
						<div className="table-container">
							<div className="general-ledger-table-header">
								<h6 className="headingDate">Date</h6>
								<h6 className="headingAccount">Account</h6>
								<h6 className="headingDebit">Debit</h6>
								<h6 className="headingCredit">Credit</h6>
								<h6 className="headingBalance">Balance</h6>
							</div>

							{tableHeaders.map((item) => {
								return (
									<div style={{ borderBottom: "1px solid #ddd" }}>
										<Accordion elevation={0}>
											<AccordionSummary
												expandIcon={<ExpandMoreIcon />}
												aria-controls="panel1a-content"
												id="panel1a-header"
											>
												{" "}
												<h6 style={{ paddingLeft: "23px" }}>
													{item.charAt(0).toUpperCase() + item.slice(1)}
												</h6>{" "}
											</AccordionSummary>

											<AccordionDetails>
												<div className="general-ledger-accordian-details">
													{rowData
														.filter(
															(filteredItem) =>
																filteredItem.chartOfAccount.accountTypeId === item
														)
														.map((subItem, index) => (
															<React.Fragment>
																<div className="accordian-details-row-entry">
																	<div className="row-entry-date">
																		{moment(subItem.date).format("DD/MM/YYYY")}
																	</div>
																	<div className="row-entry-account">
																		{subItem.chartOfAccount.accountSubTypeId
																			.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
																			.charAt(0)
																			.toUpperCase() +
																			subItem.chartOfAccount.accountSubTypeId
																				.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
																				.slice(1)}
																	</div>
																	<div className="row-entry-debits">
																		<div className="currency-container">
																			₹ {parseFloat(subItem.debits).toFixed(2)}
																		</div>
																	</div>
																	<div className="row-entry-credits">
																		<div className="currency-container">
																			₹ {parseFloat(subItem.credits).toFixed(2)}
																		</div>
																	</div>
																	<div className="row-entry-balance">
																		<div className="currency-container">
																			₹ {parseFloat(subItem.balance).toFixed(2)}
																		</div>
																	</div>
																</div>
															</React.Fragment>
														))}
												</div>
											</AccordionDetails>
										</Accordion>
									</div>
								);
							})}
							<div></div>
						</div>
					) : (
						<h6 style={{ display: "flex", justifyContent: "center" }}>No rows to display</h6>
					)}
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

export default connect(mapStateToProps, null)(ReportsGeneralLedger);
// export default ReportsGeneralLedger;
