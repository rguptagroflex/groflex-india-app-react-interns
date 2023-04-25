import React, { useState, useEffect, useRef } from "react";
import moment from "../../../../node_modules/moment/moment";
import TopbarComponent from "../../shared/topbar/topbar.component";
import SelectInputComponent from "../../shared/inputs/select-input/select-input.component";
import OfferState from "enums/offer/offer-state.enum";
import OfferAction from "enums/offer/offer-action.enum";
import CalenderIcon from "../../../assets/images/icons/calender.svg";
import DateInputComponent from "../../shared/inputs/date-input/date-input.component";

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
function ReportsGeneralLedger(props) {
	const [general, setGeneral] = useState([]);
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
				setGeneral([...res.body.data]);
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

	const handleToggleExpand = () => {
		setIsExpanded(!isExpanded);
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
						{/* <SelectInputComponent
							allowCreate={false}
							notAsync={true}
							// loadedOptions={accountOptions}
							name="Assets"
							// value={chartData.accountType}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Assets",
								// handleChange: handleAccountTypeChange,
							}}
							// style={{ marginLeft: "-15px" }}
							// aria-invalid={accountTypeError}
							// aria-describedby={accountTypeError ? "accountTypeError" : null}
						/> */}
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
									<span style={{ color: "#272D30" }}>Assets</span>
								</div>
							</div>
							{isExpanded && (
								<div
									className="dropdown-content expanded"
									style={{
										backgroundColor: "#FFFFFF",
									}}
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
											borderBottom: "1px solid #E3E3E3",
											// borderTop: "1px solid #C6C6C6",
										}}
									>
										<p>{general.date}</p>
										<p>{general.accountSubType}</p>
										<p>{general.debits}</p>
										<p>{general.credits}</p>
										<p>{general.reconcileStatus}</p>
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
									<span style={{ color: "#272D30" }}>Revenue</span>
								</div>
							</div>
							{isExpanded && (
								<div
									className="dropdown-content expanded"
									style={{
										backgroundColor: "#FFFFFF",
									}}
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
											borderBottom: "1px solid #E3E3E3",
											// borderTop: "1px solid #C6C6C6",
										}}
									>
										<p>01/03/2023</p>
										<p>Cash</p>
										<p>25,000</p>
										<p>-</p>
										<p>25,000</p>
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
									<span style={{ color: "#272D30" }}>Liabilities</span>
								</div>
							</div>
							{isExpanded && (
								<div
									className="dropdown-content expanded"
									style={{
										backgroundColor: "#FFFFFF",
									}}
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
											borderBottom: "1px solid #E3E3E3",
											// borderTop: "1px solid #C6C6C6",
										}}
									>
										<p>01/03/2023</p>
										<p>Cash</p>
										<p>25,000</p>
										<p>-</p>
										<p>25,000</p>
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
									<span style={{ color: "#272D30" }}>Expenses</span>
								</div>
							</div>
							{isExpanded && (
								<div
									className="dropdown-content expanded"
									style={{
										backgroundColor: "#FFFFFF",
									}}
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
											borderBottom: "1px solid #E3E3E3",
											// borderTop: "1px solid #C6C6C6",
										}}
									>
										<p>01/03/2023</p>
										<p>Cash</p>
										<p>25,000</p>
										<p>-</p>
										<p>25,000</p>
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
									<span style={{ color: "#272D30" }}>Equity</span>
								</div>
							</div>
							{isExpanded && (
								<div
									className="dropdown-content expanded"
									style={{
										backgroundColor: "#FFFFFF",
									}}
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
											borderBottom: "1px solid #E3E3E3",
											// borderTop: "1px solid #C6C6C6",
										}}
									>
										<p>01/03/2023</p>
										<p>Cash</p>
										<p>25,000</p>
										<p>-</p>
										<p>25,000</p>
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
