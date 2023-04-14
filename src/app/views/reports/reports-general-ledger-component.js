import React, { useState, useEffect } from "react";
import moment from "../../../../node_modules/moment/moment";
import TopbarComponent from "../../shared/topbar/topbar.component";
import SelectInputComponent from "../../shared/inputs/select-input/select-input.component";
import CalenderIcon from "../../../assets/images/icons/calender.svg";
import DateInputComponent from "../../shared/inputs/date-input/date-input.component";
function ReportsGeneralLedger(props) {
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
				className="time-period-select"
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
				}}
			>
				{/* {showCategoryFilter && ( */}
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
						// handleChange: (option) => {
						// 	this.updateSelectedDate(option);
						// },
					}}
				/>
				{/* )} */}
				{/* //////////////////////////// */}
				{/* {showDateFilter && (
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
				)} */}
			</div>

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
					<p>
						<h3>AK Enterprises General Ledger</h3>
					</p>
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
						<SelectInputComponent
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
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ReportsGeneralLedger;
