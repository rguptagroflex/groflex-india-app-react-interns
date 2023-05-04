import React, { useState, useEffect, useRef } from "react";
import moment from "../../../../node_modules/moment/moment";
import ModalService from "../../services/modal.service";
import TopbarComponent from "../../shared/topbar/topbar.component";
import SelectInputComponent from "../../shared/inputs/select-input/select-input.component";
import OfferState from "enums/offer/offer-state.enum";
import OfferAction from "enums/offer/offer-action.enum";
import CalenderIcon from "../../../assets/images/icons/calender.svg";
import DateInputComponent from "../../shared/inputs/date-input/date-input.component";
import ListAdvancedComponent from "../../shared/list-advanced/list-advanced.component";
import GeneralLedgerSendEmail from "./general-ledger-send-email";

import { printPdf } from "../../helpers/printPdf";
import DetailViewHeadAdvancedComponent from "../../shared/detail-view/detail-view-head-advanced.component";
import { downloadPdf } from "../../helpers/downloadPdf";
import CancellationInvoiceAction from "../../enums/cancellation-invoice/cancellation-invoice-action.enum";
import DetailViewHeadComponent from "../../shared/detail-view/detail-view-head.component";
import invoiz from "../../services/invoiz.service";
import config from "../../../config";
// const DetailView = ({ offer, activeAction, resources }) => {
// 	const [downloading, setDownloading] = useState(false);
//   const [printing, setPrinting] = useState(false);
//   const [customerCenterLink, setCustomerCenterLink] = useState(
//     // `${config.domain}/offers/${offer.id}/customer-center`
//   );
// 	const printSettingsPopoverRef = useRef(null);
// 	const onHeadControlClick = (action) => {
//     switch (action) {
//       case OfferAction.EMAIL:
//         invoiz.router.navigate(`/offer/send/${offer.id}`);
//         break;

//       case OfferAction.SHOW_PRINT_SETTINGS_POPOVER:
//         printSettingsPopoverRef.current.show();
//         break;

//       case OfferAction.DOWNLOAD_PDF:
//         setDownloading(true);
//         invoiz
//           .request(`${config.offer.resourceUrl}/${parseInt(offer.id, 10)}/document`, {
//             auth: true,
//             method: "POST",
//             data: {
//               isPrint: false,
//             },
//           })
//           .then((response) => {
//             const { path } = response.body.data;
//             offer.pdfPath = config.imageResourceHost + path;
//             downloadPdf({
//               pdfUrl: offer.pdfPath,
//               title: `${resources.str_offerUpperCase} ${offer.number}`,
//               isPost: false,
//               callback: () => {
//                 setDownloading(false);
//               },
//             });
//           })
//           .catch(() => {
//             invoiz.showNotification({
//               message: resources.defaultErrorMessage,
//               type: "error",
//             });
//           });
//         break;

//       case OfferAction.PRINT:
//         setPrinting(true);
//         invoiz
//           .request(`${config.offer.resourceUrl}/${parseInt(offer.id, 10)}/document`, {
//             auth: true,
//             method: "POST",
//             data: {
//               isPrint: true,
//             },
//           })
//           .then((response) => {
//             const { path } = response.body.data;
//             offer.pdfPath = config.imageResourceHost + path;
//             printPdf({
//               pdfUrl: offer.pdfPath,
//               isPost: false,
//               callback: () => {
//                 setPrinting(false);
//               },
//             });
//           })
//           .catch(() => {
//             invoiz.showNotification({
//               message: resources.defaultErrorMessage,
//               type: "error",
//             });
//           });
//         break;

//       case OfferAction.COPY_CUSTOMERCENTER_LINK:
//         const customerCenterLinkElm = document.createElement("input");
//         customerCenterLinkElm.value = customerCenterLink;
//         document.body.appendChild(customerCenterLinkElm);
//         customerCenterLinkElm.select();
//         document.execCommand("copy");
//         document.body.removeChild(customerCenterLinkElm);
//         invoiz.showNotification({ message: resources.offerLinkCopiedText });
//         break;

// 				case OfferAction.SHOW_COPY_LINK_POPOVER:
// 					document.querySelector("#detail-head-copy-link-popover-anchor").click();
// 					break;

//     }
//   };
// 	const createDetailViewHeadObjects = () => {
// 		const OfferState = {
// 			DRAFT: "DRAFT",
// 			SUBMITTED: "SUBMITTED",
// 			ACCEPTED: "ACCEPTED",
// 			DECLINED: "DECLINED",
// 			INVOICED: "INVOICED",
// 		};
//     const object = {
//       leftElements: [],
//       rightElements: [],
//       actionElements: [],
//     };

//     object.actionElements.push(
//       {
//         // name: resources.str_sendEmail,
//         icon: "icon-mail",
//         action: OfferAction.EMAIL,
//         dataQsId: "offerDetail-head-action-email",
//       },
//       {
//         // name: resources.str_pdf,
//         icon: "icon-pdf",
//         action: OfferAction.DOWNLOAD_PDF,
//         actionActive: activeAction === OfferAction.DOWNLOAD_PDF,
//         dataQsId: "offerDetail-head-action-download",
//       },
//       {
//         // name: resources.str_print,
//         icon: "icon-print2",
//         action: OfferAction.PRINT,
//         actionActive: activeAction === OfferAction.PRINT,
//         dataQsId: "offerDetail-head-action-print",
//         controlsItemClass: "item-print",
//         id: "detail-head-print-anchor",
//       },
//       {
//         name: "",
//         icon: "icon-arr_down",
//         action: OfferAction.SHOW_PRINT_SETTINGS_POPOVER,
//         dataQsId: "offerDetail-head-action-printSettings",
//         controlsItemClass: "item-print-settings",
//         id: "detail-head-print-settings-popover-anchor",
//       }
//     );

//     if (offer.state !== OfferState.DRAFT) {
//       object.actionElements.push({
//         name: resources.str_copyANGLink,
//         icon: "icon-copy",
//         action: OfferAction.SHOW_COPY_LINK_POPOVER,
//         dataQsId: "offerDetail-head-action-copylink",
//         controlsItemClass: "item-copy",
//         id: "detail-head-copy-link-popover-anchor",
//       });
//     }

//     const subHeadline = "subHeadline"; // Replace this with the actual subheadline value

//     object.leftElements.push({
//       headline: resources.str_customer,
//       value: <Link to={"/customer/" + offer.customerId}>{offer.displayName}</Link>,
//       subValue: subHeadline,
//     });

//     const amount = formatCurrency(offer.totalGross);
//     object.rightElements.push(
//       {
//         headline: resources.str_amount,
//         value: amount,
//       },
//       {
//         headline: resources.str_offerDate,
//         value: offer.displayDate,
//       }
//     );

//     if (!hasCustomerAndPositions() || offer.state === OfferState.DRAFT) {
//       object.actionElements = null;
//     }

//     return object;
//   };

//   const headContents = createDetailViewHeadObjects();

//   return (
// 		<DetailViewHeadComponent
//      controlActionCallback={onHeadControlClick}
//      actionElements={headContents.actionElements}
//      leftElements={headContents.leftElements}
//      rightElements={headContents.rightElements}
//    />
//     // JSX code for rendering the component using the headContents object
//   );
// };
const ListExportTypes = {
	EXCEL: "excel",
};

function ReportsGeneralLedger(props) {
	// const [gridOptions, setGridOptions] = useState({
	// 	api: null,
	// 	columnApi: null,
	// });
	const { gridOptions } = useState({ api: null, columnApi: null })[0];
	console.log(gridOptions);
	const exportList = (type) => {
		const { exportExcelCallbacks, exportFilename } = props;
		// const { gridOptions } = useState({ api: null, columnApi: null })[0];
		const onlySelected = gridOptions.api && gridOptions.api.getSelectedRows().length > 0;

		const excelOptions = {
			fileName: `${exportFilename}.xlsx`,
			sheetName: exportFilename,
			onlySelected,
			columnKeys: gridOptions.columnApi
				.getAllDisplayedColumns()
				.filter(
					(columnDef) =>
						columnDef.colId !== FIELD_CHECKBOX_CELL && columnDef.colId !== FIELD_ACTION_POPUP_CELL
				)
				.map((columnDef) => columnDef.colId),
		};

		// Call the exportExcelCallbacks function with excelOptions object
		exportExcelCallbacks(excelOptions);
	};
	const [general, setGeneral] = useState([]);
	const [liability, setLiability] = useState([]);
	const [assets, setAssets] = useState([]);
	const [expenses, setExpenses] = useState([]);
	const [revenue, setRevenue] = useState([]);
	const [equity, setEquity] = useState([]);
	useEffect(() => {
		getGeneralLedger();
	}, []);
	const getGeneralLedger = () => {
		invoiz
			.request(
				"https://dev.groflex.in/api/bankTransaction?offset=0&searchText=&limit=9999999&orderBy=date&desc=true",

				{ auth: true }
			)
			.then((res) => {
				console.log(res.body.data);
				setGeneral([...res.body.data.filter((item) => item.accountType === "income")]);
				setLiability([...res.body.data.filter((item) => item.accountType === "liability")]);
				setAssets([...res.body.data.filter((item) => item.accountType === "assets")]);
				setExpenses([...res.body.data.filter((item) => item.accountType === "expenses")]);
				setRevenue([...res.body.data.filter((item) => item.accountType === "revenue")]);
				setEquity([...res.body.data.filter((item) => item.accountType === "equity")]);
			});
	};
	// const { resources } = props;
	// const [downloading, setDownloading] = useState(false);
	// const [printing, setPrinting] = useState(false);
	// const [offer, setOffer] = useState(props.offer);
	// const [customerCenterLink, setCustomerCenterLink] = useState(props.customerCenterLink);
	// const detailHeadPrintSettingsPopoverRef = useRef(null);
	// const resources = {
	// 	str_sendEmail: "Send Email",
	// 	str_pdf: "PDF",
	// 	str_print: "Print",
	// };
	// const [activeTab, setActiveTab] = useState(0);
	// const [chartTitle, setChartTitle] = useState(props.chartTitle || 'Total');
	// const [activeChartType, setActiveChartType] = useState(props.activeChartType || 'pie');
	// const [activeChartData, setActiveChartData] = useState({ series: [] });
	// const [isSubSeriesActive, setIsSubSeriesActive] = useState(false);
	const [showCustomDateRangeSelector, setShowCustomDateRangeSelector] = useState(false);
	const [customStartDate, setCustomStartDate] = useState(moment().subtract(1, "months"));
	const [customEndDate, setCustomEndDate] = useState(moment());
	const [dateFilterValue, setDateFilterValue] = useState(props.selectedDateFilterType || "");
	// const [categoryFilterValue, setCategoryFilterValue] = useState("name");
	// const [showCategoryFilter, setShowCategoryFilter] = useState(props.showCategoryFilter || false);
	const [showDateFilter, setShowDateFilter] = useState(props.showDateFilter || false);
	// const [tabs, setTabs] = useState(props.tabs || []);
	// const [demoText, setDemoText] = useState(props.demoText || '');
	// const [demoButtonLink, setDemoButtonLink] = useState(props.demoButtonLink || '');
	const [isExpanded, setIsExpanded] = useState(false);
	const [isLiability, setIsLiabilityExpanded] = useState(false);
	const [isRevenue, setIsRevenueExpanded] = useState(false);
	const [isAssets, setIsAssetsExpanded] = useState(false);
	const [isEquity, setIsEquityExpanded] = useState(false);
	const [isExpenses, setIsExpensesExpanded] = useState(false);
	const handleToggleExpand = () => {
		setIsExpanded(!isExpanded);
	};
	const libalityToggleExpand = () => {
		setIsLiabilityExpanded(!isLiability);
	};

	const revenueToggleExpand = () => {
		setIsRevenueExpanded(!isRevenue);
	};
	const assetsToggleExpand = () => {
		setIsAssetsExpanded(!isAssets);
	};
	const equityToggleExpand = () => {
		setIsEquityExpanded(!isEquity);
	};
	const expensesToggleExpand = () => {
		setIsExpensesExpanded(!isExpenses);
	};

	const [currentMonthName, setCurrentMonthName] = useState(moment().format("MMMM"));
	const [lastMonthName, setLastMonthName] = useState(moment().subtract(1, "months").format("MMMM"));
	const [secondLastMonth, setSecondLastMonth] = useState(moment().subtract(2, "months").format("MMMM"));
	const [currQuarter, setCurrQuarter] = useState(moment().startOf("quarter").format("Q/YYYY"));
	const [lastQuarter, setLastQuarter] = useState(moment().subtract(3, "months").startOf("quarter").format("Q/YYYY"));
	const [secondLastQuarter, setSecondLastQuarter] = useState(
		moment().subtract(6, "months").startOf("quarter").format("Q/YYYY")
	);
	useEffect(() => {
		if (showDateFilter) {
			props.onDateChange(dateFilterValue);
		}
	}, [showDateFilter, dateFilterValue, props]);

	const filterOptions = [
		{ label: "Filter By Name", value: "name" },
		{ label: "Filter By Category", value: "category" },
	];
	const dateOptions = [
		{ label: currentMonthName, value: "currMonth", group: "month" },
		{ label: lastMonthName, value: "lastMonth", group: "month" },
		{ label: secondLastMonth, value: "secondLastMonth", group: "month" },
		{ label: `Quarter ${currQuarter}`, value: "currQuarter", group: "quarter" },
		{ label: `Quarter ${lastQuarter}`, value: "lastQuarter", group: "quarter" },
		{ label: `Quarter ${secondLastQuarter}`, value: "secondLastQuarter", group: "quarter" },
		{ label: "Fiscal Year", value: "fiscalYear", group: "year" },
		{ label: "Custom", value: "custom", group: "custom" },
	];
	// const onHeadControlClick = (action) => {
	// 	switch (action) {
	// 		case OfferAction.EMAIL:
	// 			invoiz.router.navigate(`/offer/send/${offer.id}`);
	// 			break;

	// 		case OfferAction.SHOW_PRINT_SETTINGS_POPOVER:
	// 			detailHeadPrintSettingsPopoverRef.current.show();
	// 			break;

	// 		case OfferAction.DOWNLOAD_PDF:
	// 			setDownloading(true);
	// 			invoiz
	// 				.request(`${config.offer.resourceUrl}/${parseInt(offer.id, 10)}/document`, {
	// 					auth: true,
	// 					method: "POST",
	// 					data: {
	// 						isPrint: false,
	// 					},
	// 				})
	// 				.then((response) => {
	// 					const { path } = response.body.data;
	// 					setOffer({ ...offer, pdfPath: config.imageResourceHost + path });
	// 					downloadPdf({
	// 						pdfUrl: offer.pdfPath,
	// 						title: `${resources.str_offerUpperCase} ${offer.number}`,
	// 						isPost: false,
	// 						callback: () => {
	// 							setDownloading(false);
	// 						},
	// 					});
	// 				})
	// 				.catch(() => {
	// 					invoiz.showNotification({ message: resources.defaultErrorMessage, type: "error" });
	// 				});
	// 			break;

	// 		case OfferAction.PRINT:
	// 			setPrinting(true);
	// 			invoiz
	// 				.request(`${config.offer.resourceUrl}/${parseInt(offer.id, 10)}/document`, {
	// 					auth: true,
	// 					method: "POST",
	// 					data: {
	// 						isPrint: true,
	// 					},
	// 				})
	// 				.then((response) => {
	// 					const { path } = response.body.data;
	// 					setOffer({ ...offer, pdfPath: config.imageResourceHost + path });
	// 					printPdf({
	// 						pdfUrl: offer.pdfPath,
	// 						isPost: false,
	// 						callback: () => {
	// 							setPrinting(false);
	// 						},
	// 					});
	// 				})
	// 				.catch(() => {
	// 					invoiz.showNotification({ message: resources.defaultErrorMessage, type: "error" });
	// 				});
	// 			break;

	// 		case OfferAction.COPY_CUSTOMERCENTER_LINK:
	// 			const customerCenterLinkElm = document.createElement("input");
	// 			customerCenterLinkElm.value = customerCenterLink;
	// 			document.body.appendChild(customerCenterLinkElm);
	// 			customerCenterLinkElm.select();
	// 			document.execCommand("copy");
	// 			document.body.removeChild(customerCenterLinkElm);
	// 			invoiz.showNotification({ message: resources.offerLinkCopiedText });
	// 			break;

	// 		case OfferAction.SHOW_COPY_LINK_POPOVER:
	// 			document.getElementById("detail-head-copy-link-popover-anchor").click();
	// 			break;

	// 		default:
	// 			break;
	// 	}
	// };
	const sendEmail = () => {
		ModalService.open(<GeneralLedgerSendEmail />, {
			modalClass: "edit-contact-person-modal-component",
			width: 630,
		});
	};

	const updateSelectedDate = (option) => {
		onDateChange(option.value);

		switch (option.value) {
			case "custom":
				setShowCustomDateRangeSelector(true);
				onDateChange(option.value, [customStartDate, customEndDate]);
				break;
			default:
				setShowCustomDateRangeSelector(false);
				break;
		}
	};
	return (
		<div>
			<TopbarComponent
				title={"General Ledger"}
				hasCancelButton={true}
				cancelButtonCallback={() => {
					window.history.back();
				}}
			/>
			<div>
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
					{/* {showCategoryFilter && ( */}
					<div className="time-period-select">
						<SelectInputComponent
							allowCreate={false}
							notAsync={true}
							loadedOptions={dateOptions}
							value={dateFilterValue}
							icon={CalenderIcon}
							containerClass="date-input"
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "This month",
								handleChange: (option) => {
									this.updateSelectedDate(option);
								},
							}}
						/>
					</div>
				</div>
				<div
					style={{
						display: "flex",
						marginTop: "0px",
						marginLeft: "1200px",
						// marginRight: "50px",
						width: "600px",
						// height: "50px",
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
					<div className="icon-print" style={{ marginRight: "10px" }}>
						<span className="pdf_print"></span>
						<span className="icon-text">Print</span>
					</div>
					<div className="icon-download" style={{ marginRight: "10px" }}>
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
			{showDateFilter && (
				<div className="time-period-select">
					<SelectInputComponent
						allowCreate={false}
						notAsync={true}
						loadedOptions={dateOptions}
						value={dateFilterValue}
						icon={CalenderIcon}
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

					{showCustomDateRangeSelector && (
						<div className="start-end-date-selector-group">
							<DateInputComponent
								name={"date"}
								value={customStartDate.format("DD-MM-YYYY")}
								required={true}
								label={"Start Date"}
								noBorder={true}
								onChange={(name, value) => {
									console.log("setting custom start date");
									setCustomStartDate(moment(value, "DD-MM-YYYY"));
									updateSelectedDate({ value: "custom" });
								}}
							/>
							<DateInputComponent
								name={"date"}
								value={customEndDate.format("DD-MM-YYYY")}
								required={true}
								label={"End Date"}
								noBorder={true}
								onChange={(name, value) => {
									setCustomEndDate(moment(value, "DD-MM-YYYY"));
									updateSelectedDate({ value: "custom" });
								}}
							/>
						</div>
					)}
				</div>
			)}
			{/* </div> */}
			{/* <div className={`assets ${isCollapsed ? "collapsed" : ""}`}>
				<div className="assets-header" onClick={handleToggleCollapse}>
					<span>Assets</span>
					{/* <FontAwesomeIcon icon={isCollapsed ? faAngleDown : faAngleUp} /> */}
			{/* </div> */}
			{/* <div className="assets-content">your assets fields here</div> */}
			{/* </div> */}

			<div
				style={{
					// position: "absolute",
					width: "80vw",
					height: "1032px",
					// top: "180px",
					// left: "334px",
					backgroundColor: "#fff",
					marginTop: "20px",
					marginLeft: "50px",
					marginRight: "50px",
					fontWeight: "600",
				}}
			>
				<div className="general-heading" style={{ width: "80vw", padding: "20px" }}>
					<div>
						<h3>AK Enterprises General Ledger</h3>
					</div>
					<p style={{ color: "#C6C6C6" }}>From 01 Mar 2023 to 31 Mar 2023</p>
				</div>
				<div
					style={{
						borderTop: "1px solid #C6C6C6",
						backgroundColor: "red",
						borderRadius: "4px",
						height: "0.5px",
					}}
					className="report-row-divider"
				>
					<div
						className="box"
						style={{
							// boxShadow: "0px 10px 10px 0px #cccccc",
							padding: 0,
							margin: 0,
							paddingLeft: "20px",
							display: "grid",
							gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr",
							textAlign: "left",
							borderTop: "1px solid #C6C6C6",
						}}
					>
						<p>Date</p>
						<p>Account</p>
						<p>Debit</p>
						<p>Credit</p>
						<p>Balance</p>
					</div>
					<div
						style={{
							borderTop: "1px solid #C6C6C6",
							background: "#C6C6C6",
							// padding: 0,
							// margin: 0,
							// display: "grid",
							// gridTemplateColumns: "2fr 3fr 2fr 2fr 2fr ",
						}}
					>
						<div className="container" style={{ width: "100%" }}>
							<div className="toggle-button" onClick={expensesToggleExpand}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										backgroundColor: "#E3E3E3",
									}}
								>
									{isExpenses ? (
										<div
											className="icon icon-arr_down"
											style={{ margin: "5px", color: "#272D30" }}
										></div>
									) : (
										<div
											className="icon icon-arr_right"
											style={{ margin: "5px", color: "#272D30" }}
										></div>
									)}
									{/* <span style={{ color: "#272D30" }}>{general[0].accountType}</span> */}
									{expenses && expenses.length > 0 && (
										<span style={{ color: "#272D30" }}>
											{expenses[0].accountType.charAt(0).toUpperCase() +
												expenses[0].accountType.slice(1)}
										</span>
									)}
								</div>
							</div>
							{isExpenses && (
								<div
									className="dropdown-content expanded"
									style={{
										backgroundColor: "#FFFFFF",
									}}
								>
									{/* <div
										className="box"
										style={{
											// boxShadow: "0px 10px 10px 0px #cccccc",
											padding: 0,
											margin: 0,
											paddingLeft: "20px",
											display: "grid",
											gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr",
											textAlign: "left",
											borderBottom: "1px solid #E3E3E3",
											// borderTop: "1px solid #C6C6C6",
										}}
									>
										<p>{general.date}</p>
										<p>{general.accountSubType}</p>
										<p>{general.debits}</p>
										<p>{general.credits}</p>
										<p>{general.bankDetailId}</p>
										{/* /////// */}
									{/* <p>{general.bankName}</p>
										<p>{general.accountNumber}</p>
										<p>{general.accountName}</p>
										<p>{general.IFSCCode}</p>
										<p>{general.openingBalance}</p> */}
									{/* </div> */}
									<div className="box" style={{ padding: 0, margin: 0 }}>
										{expenses.map((item, index) => (
											<div
												key={index}
												style={{
													display: "grid",
													gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr",
													textAlign: "left",
													borderBottom: "1px solid #E3E3E3",
												}}
											>
												<p style={{ paddingLeft: "15px" }}>
													{new Date(item.date).toLocaleDateString()}
												</p>
												<p>{item.accountSubType}</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.debits)}
												</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.credits)}
												</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.balance)}
												</p>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
						<div className="container" style={{ width: "100%" }}>
							<div className="toggle-button" onClick={equityToggleExpand}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										backgroundColor: "#E3E3E3",
									}}
								>
									{isEquity ? (
										<div
											className="icon icon-arr_down"
											style={{ margin: "5px", color: "#272D30" }}
										></div>
									) : (
										<div
											className="icon icon-arr_right"
											style={{ margin: "5px", color: "#272D30" }}
										></div>
									)}
									{/* <span style={{ color: "#272D30" }}>{general[0].accountType}</span> */}
									{equity && equity.length > 0 && (
										<span style={{ color: "#272D30" }}>
											{equity[0].accountType.charAt(0).toUpperCase() +
												equity[0].accountType.slice(1)}
										</span>
									)}
								</div>
							</div>
							{isEquity && (
								<div
									className="dropdown-content expanded"
									style={{
										backgroundColor: "#FFFFFF",
									}}
								>
									{/* <div
										className="box"
										style={{
											// boxShadow: "0px 10px 10px 0px #cccccc",
											padding: 0,
											margin: 0,
											paddingLeft: "20px",
											display: "grid",
											gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr",
											textAlign: "left",
											borderBottom: "1px solid #E3E3E3",
											// borderTop: "1px solid #C6C6C6",
										}}
									>
										<p>{general.date}</p>
										<p>{general.accountSubType}</p>
										<p>{general.debits}</p>
										<p>{general.credits}</p>
										<p>{general.bankDetailId}</p>
										{/* /////// */}
									{/* <p>{general.bankName}</p>
										<p>{general.accountNumber}</p>
										<p>{general.accountName}</p>
										<p>{general.IFSCCode}</p>
										<p>{general.openingBalance}</p> */}
									{/* </div> */}
									<div className="box" style={{ padding: 0, margin: 0 }}>
										{equity.map((item, index) => (
											<div
												key={index}
												style={{
													display: "grid",
													gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr",
													textAlign: "left",
													borderBottom: "1px solid #E3E3E3",
												}}
											>
												<p style={{ paddingLeft: "15px" }}>
													{new Date(item.date).toLocaleDateString()}
												</p>
												<p>{item.accountSubType}</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.debits)}
												</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.credits)}
												</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.balance)}
												</p>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
						<div className="container" style={{ width: "100%" }}>
							<div className="toggle-button" onClick={handleToggleExpand}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										backgroundColor: "#E3E3E3",
									}}
								>
									{isExpanded ? (
										<div
											className="icon icon-arr_down"
											style={{ margin: "5px", color: "#272D30" }}
										></div>
									) : (
										<div
											className="icon icon-arr_right"
											style={{ margin: "5px", color: "#272D30" }}
										></div>
									)}
									{/* <span style={{ color: "#272D30" }}>{general[0].accountType}</span> */}
									{general && general.length > 0 && (
										<span style={{ color: "#272D30" }}>
											{general[0].accountType.charAt(0).toUpperCase() +
												general[0].accountType.slice(1)}
										</span>
									)}
								</div>
							</div>
							{isExpanded && (
								<div
									className="dropdown-content expanded"
									style={{
										backgroundColor: "#FFFFFF",
									}}
								>
									{/* <div
										className="box"
										style={{
											// boxShadow: "0px 10px 10px 0px #cccccc",
											padding: 0,
											margin: 0,
											paddingLeft: "20px",
											display: "grid",
											gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr",
											textAlign: "left",
											borderBottom: "1px solid #E3E3E3",
											// borderTop: "1px solid #C6C6C6",
										}}
									>
										<p>{general.date}</p>
										<p>{general.accountSubType}</p>
										<p>{general.debits}</p>
										<p>{general.credits}</p>
										<p>{general.bankDetailId}</p>
										{/* /////// */}
									{/* <p>{general.bankName}</p>
										<p>{general.accountNumber}</p>
										<p>{general.accountName}</p>
										<p>{general.IFSCCode}</p>
										<p>{general.openingBalance}</p> */}
									{/* </div> */}
									<div className="box" style={{ padding: 0, margin: 0 }}>
										{general.map((item, index) => (
											<div
												key={index}
												style={{
													display: "grid",
													gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr",
													textAlign: "left",
													borderBottom: "1px solid #E3E3E3",
												}}
											>
												<p style={{ paddingLeft: "15px" }}>
													{new Date(item.date).toLocaleDateString()}
												</p>
												<p>{item.accountSubType}</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.debits)}
												</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.credits)}
												</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.balance)}
												</p>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
						<div className="container" style={{ width: "100%" }}>
							<div className="toggle-button" onClick={libalityToggleExpand}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										backgroundColor: "#E3E3E3",
									}}
								>
									{isLiability ? (
										<div
											className="icon icon-arr_down"
											style={{ margin: "5px", color: "#272D30" }}
										></div>
									) : (
										<div
											className="icon icon-arr_right"
											style={{ margin: "5px", color: "#272D30" }}
										></div>
									)}

									{liability && liability.length > 0 && (
										<span style={{ color: "#272D30" }}>
											{liability[0].accountType.charAt(0).toUpperCase() +
												liability[0].accountType.slice(1)}
										</span>
									)}
								</div>
							</div>
							{isLiability && (
								<div
									className="dropdown-content expanded"
									style={{
										backgroundColor: "#FFFFFF",
									}}
								>
									<div className="box" style={{ padding: 0, margin: 0 }}>
										{liability.map((item, index) => (
											<div
												key={index}
												style={{
													display: "grid",
													gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr",
													textAlign: "left",
													borderBottom: "1px solid #E3E3E3",
												}}
											>
												<p style={{ paddingLeft: "15px" }}>
													{new Date(item.date).toLocaleDateString()}
												</p>
												<p>{item.accountSubType}</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.debits)}
												</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.credits)}
												</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.balance)}
												</p>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
						<div className="container" style={{ width: "100%" }}>
							<div className="toggle-button" onClick={revenueToggleExpand}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										backgroundColor: "#E3E3E3",
									}}
								>
									{isRevenue ? (
										<div
											className="icon icon-arr_down"
											style={{ margin: "5px", color: "#272D30" }}
										></div>
									) : (
										<div
											className="icon icon-arr_right"
											style={{ margin: "5px", color: "#272D30" }}
										></div>
									)}
									{/* <span style={{ color: "#272D30" }}>{general[0].accountType}</span> */}
									{revenue && revenue.length > 0 && (
										<span style={{ color: "#272D30" }}>
											{revenue[0].accountType.charAt(0).toUpperCase() +
												revenue[0].accountType.slice(1)}
										</span>
									)}
								</div>
							</div>
							{isRevenue && (
								<div
									className="dropdown-content expanded"
									style={{
										backgroundColor: "#FFFFFF",
									}}
								>
									{/* <div
										className="box"
										style={{
											// boxShadow: "0px 10px 10px 0px #cccccc",
											padding: 0,
											margin: 0,
											paddingLeft: "20px",
											display: "grid",
											gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr",
											textAlign: "left",
											borderBottom: "1px solid #E3E3E3",
											// borderTop: "1px solid #C6C6C6",
										}}
									>
										<p>{general.date}</p>
										<p>{general.accountSubType}</p>
										<p>{general.debits}</p>
										<p>{general.credits}</p>
										<p>{general.bankDetailId}</p>
										{/* /////// */}
									{/* <p>{general.bankName}</p>
										<p>{general.accountNumber}</p>
										<p>{general.accountName}</p>
										<p>{general.IFSCCode}</p>
										<p>{general.openingBalance}</p> */}
									{/* </div> */}
									<div className="box" style={{ padding: 0, margin: 0 }}>
										{revenue.map((item, index) => (
											<div
												key={index}
												style={{
													display: "grid",
													gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr",
													textAlign: "left",
													borderBottom: "1px solid #E3E3E3",
												}}
											>
												<p style={{ paddingLeft: "15px" }}>
													{new Date(item.date).toLocaleDateString()}
												</p>
												<p>{item.accountSubType}</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.debits)}
												</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.credits)}
												</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.balance)}
												</p>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
						<div className="container" style={{ width: "100%" }}>
							<div className="toggle-button" onClick={assetsToggleExpand}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										backgroundColor: "#E3E3E3",
									}}
								>
									{isAssets ? (
										<div
											className="icon icon-arr_down"
											style={{ margin: "5px", color: "#272D30" }}
										></div>
									) : (
										<div
											className="icon icon-arr_right"
											style={{ margin: "5px", color: "#272D30" }}
										></div>
									)}
									{/* <span style={{ color: "#272D30" }}>{general[0].accountType}</span> */}
									{assets && assets.length > 0 && (
										<span style={{ color: "#272D30" }}>
											{assets[0].accountType.charAt(0).toUpperCase() +
												assets[0].accountType.slice(1)}
										</span>
									)}
								</div>
							</div>
							{isAssets && (
								<div
									className="dropdown-content expanded"
									style={{
										backgroundColor: "#FFFFFF",
									}}
								>
									<div className="box" style={{ padding: 0, margin: 0 }}>
										{assets.map((item, index) => (
											<div
												key={index}
												style={{
													display: "grid",
													gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr",
													textAlign: "left",
													borderBottom: "1px solid #E3E3E3",
												}}
											>
												<p style={{ paddingLeft: "15px" }}>
													{new Date(item.date).toLocaleDateString()}
												</p>
												<p>{item.accountSubType}</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.debits)}
												</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.credits)}
												</p>
												<p>
													{new Intl.NumberFormat("hi-IN", {
														style: "currency",
														currency: "INR",
													}).format(item.balance)}
												</p>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ReportsGeneralLedger;
