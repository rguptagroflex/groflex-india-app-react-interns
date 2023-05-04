import React, { useEffect, useRef, useState } from "react";
import ModalService from "../../services/modal.service";
import ButtonComponent from "../../shared/button/button.component";
import NumberInputComponent from "../../shared/inputs/number-input/number-input.component";
import SelectInput from "../../shared/inputs/select-input/select-input.component";
import TextInputComponent from "../../shared/inputs/text-input/text-input.component";
import TextInputErrorComponent from "../../shared/inputs/text-input/text-input-error.component";
import DateInputComponent from "../../shared/inputs/date-input/date-input.component";
import moment from "moment";
import invoiz from "../../services/invoiz.service";
import TextInputLabelComponent from "../../shared/inputs/text-input/text-input-label.component";
import TextInputHintComponent from "../../shared/inputs/text-input/text-input-hint.component";
import { formatApiDate, formatDate } from "../../helpers/formatDate";
import SvgInline from "react-svg-inline";
import { formatCurrency } from "../../helpers/formatCurrency";
const calenderIcon = require("assets/images/icons/calender.svg");
const checkCircleIcon = require("assets/images/icons/check_circle.svg");
const trashcanIcon = require("assets/images/icons/trashcan.svg");
const greenUploadIcon = require("assets/images/icons/green-uplod.svg");
import { DateFilterType, ListAdvancedDefaultSettings } from "../../helpers/constants";
import config from "../../../config";
import ListAdvancedComponent from "../../shared/list-advanced/list-advanced.component";
import { localeCompare, localeCompareNumeric } from "../../helpers/sortComparators";
import lang from "../../../lang";
import transactionsExcel from "assets/Transactions_Import_Template.xlsx";
import NotificationService from "../../services/notification.service";
import * as XLSX from "xlsx";

const ExcelDateToJSDate = (serial) => {
	const utc_days = Math.floor(serial - 25569);
	const utc_value = utc_days * 86400;
	const date_info = new Date(utc_value * 1000);
	const day = ("0" + date_info.getDate()).slice(-2);
	const month = ("0" + (date_info.getMonth() + 1)).slice(-2);
	const year = date_info.getFullYear();
	return `${day}/${month}/${year}`;
};

const capitaliseText = (string) => {
	return string.charAt(0).toUpperCase() + string.slice(1);
};
const Label = ({ label, style, sublabel = "" }) => {
	return (
		<label style={{ fontSize: "16px", color: "#272D30", fontWeight: "600", ...style }} className="textarea_label">
			<span>{label}</span>
			<p style={{ fontWeight: "400", fontSize: "14px", color: "#747474", margin: "7px 0 0 0" }}>
				{" " + sublabel}
			</p>
		</label>
	);
};
const ProcessStation = ({ number = 1, text = "", status = "active", line = false }) => {
	let numberStampCss = {};
	switch (status) {
		case "active":
			numberStampCss = {
				color: "#F0F4F6",
				backgroundColor: "#BABABA",
			};
			break;
		case "inactive":
			numberStampCss = {
				color: "#BABABA",
				backgroundColor: "#F0F4F6",
				border: "1px solid #BABABA",
			};
			break;
		case "done":
			numberStampCss = {
				color: "#F0F4F6",
				backgroundColor: "#00A353",
			};
			break;
	}
	return (
		<div
			className="process-station"
			style={{
				margin: "0 10px 0 0px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<span
				style={{
					height: "30px",
					width: "30px",
					margin: "0 10px 0 0",
					borderRadius: "100%",
					lineHeight: "200%",
					textAlign: "center",
					fontWeight: "600",
					...numberStampCss,
				}}
			>
				{number}
			</span>
			<span>{text}</span>
			{line ? (
				<span
					style={{ height: "0.5px", width: "30px", borderTop: "0.5px solid #BABABA", marginLeft: "10px" }}
				/>
			) : (
				""
			)}
		</div>
	);
};

//Main Component-------------------------------------------------------------
const ReconcileModalComponent = ({ onConfirm, bankOptions }) => {
	const [bankId, setBankId] = useState("");
	const [processStationStatus, setProcessStationStatus] = useState({
		bank: "active",
		timePeriod: "inactive",
		import: "inactive",
		matchAndReconcile: "inactive",
	});
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
	const [bankStatementFile, setBankStatementFile] = useState();
	const [bankStatementArray, setBankStatementArray] = useState([]);
	const [selectedBankStatementTransactions, setSelectedBankStatementTransactions] = useState({});
	const [transactionsList, setTransactionsList] = useState([]);
	const [selectedTransactions, setSelectedTransactions] = useState({});
	const [formError, setFormError] = useState("");
	useEffect(() => {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		return () => {
			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
		};
	}, []);

	const handleBankStatementFileChange = (e) => {
		setBankStatementFile(e.target.files[0]);
	};

	const handleImportClick = (e) => {
		e.preventDefault();
		if (bankStatementFile) {
			makeBankStatementArray();
			setProcessStationStatus({
				...processStationStatus,
				import: "done",
				matchAndReconcile: "active",
			});
		}
	};

	const makeBankStatementArray = () => {
		const file = bankStatementFile;
		const regex = /^([a-zA-Z0-9\s_\\.\-\(\):])+(.csv|.xlsx|.xls)$/;

		if (regex.test(file.name.toLowerCase())) {
			const reader = new FileReader();
			reader.readAsArrayBuffer(file);
			const fromRow = 3;
			reader.onload = (event) => {
				const arrayString = new Uint8Array(event.target.result);
				const workBook = XLSX.read(arrayString, { type: "array" });
				const workSheetName = workBook.SheetNames[0];
				const workSheet = workBook.Sheets[workSheetName];
				const data = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
				const dataAfetrRemoveHeader = data.splice(fromRow, data.length - 1);
				// console.log(dataAfetrRemoveHeader, "bank statement without header uploaded");
				const newBankStatementArray = dataAfetrRemoveHeader.map((row, index) => {
					return {
						date: row[0],
						description: row[1],
						debits: row[2] ? row[2] : null,
						credits: row[3] ? row[3] : null,
						id: index.toString(),
					};
				});
				setBankStatementArray([...newBankStatementArray]);
				if (dataAfetrRemoveHeader.length <= 0) {
					return NotificationService.show({ message: "No data to import", type: "error" });
				}
			};
		} else {
			NotificationService.show({
				message: "Please upload a valid EXCEL or CSV file.",
				type: "error",
			});
		}
	};

	const handleBankChange = (option) => {
		if (!option) {
			setBankId("");
			setProcessStationStatus({ ...processStationStatus, bank: "active" });
			return;
		}
		setBankId(option.value);
		setProcessStationStatus({ ...processStationStatus, bank: "done", timePeriod: "active" });
	};

	const updateSelectedDate = (option) => {
		if (!option) {
			// setProcessStationStatus({ ...processStationStatus, timePeriod: "active" });
			return;
		}

		switch (option.value) {
			case "custom":
				// this.props.onDateChange(option.value, [dateData.customStartDate, dateData.customEndDate]);
				setDateData({ ...dateData, showCustomDateRangeSelector: true, dateFilterValue: option.value });
				break;
			default:
				// this.props.onDateChange(option.value);
				setDateData({ ...dateData, showCustomDateRangeSelector: false, dateFilterValue: option.value });
				break;
		}
	};

	const addDateQueryParam = () => {
		const { dateFilterValue } = dateData;
		let query = "",
			startDate = null,
			endDate = null;

		switch (dateFilterValue) {
			case DateFilterType.CURR_MONTH:
				startDate = moment().startOf("month").toJSON();
				endDate = moment().endOf("month").toJSON();
				query = `&startDate=${startDate}&endDate=${endDate}`;
				break;

			case DateFilterType.LAST_MONTH:
				startDate = moment().subtract(1, "months").startOf("month").toJSON();
				endDate = moment().subtract(1, "months").endOf("month").toJSON();
				query = `&startDate=${startDate}&endDate=${endDate}`;
				break;

			case DateFilterType.SECOND_LAST_MONTH:
				startDate = moment().subtract(2, "months").startOf("month").toJSON();
				endDate = moment().subtract(2, "months").endOf("month").toJSON();
				query = `&startDate=${startDate}&endDate=${endDate}`;
				break;

			case DateFilterType.CURR_QUARTER:
				startDate = moment().startOf("quarter").toJSON();
				endDate = moment().toJSON();
				query = `&startDate=${startDate}&endDate=${endDate}`;
				break;

			case DateFilterType.LAST_QUARTER:
				startDate = moment().subtract(1, "quarter").startOf("quarter").toJSON();
				endDate = moment().subtract(1, "quarter").endOf("quarter").toJSON();
				query = `&startDate=${startDate}&endDate=${endDate}`;
				break;

			case DateFilterType.SECOND_LAST_QUARTER:
				startDate = moment().subtract(2, "quarter").startOf("quarter").toJSON();
				endDate = moment().subtract(2, "quarter").endOf("quarter").toJSON();
				query = `&startDate=${startDate}&endDate=${endDate}`;
				break;

			case DateFilterType.FISCAL_YEAR:
				const financialYearMonthStart = moment().utc().set("month", 2).set("date", 31);
				startDate =
					financialYearMonthStart < moment().utc()
						? financialYearMonthStart
						: financialYearMonthStart.set("year", moment().utc().year() - 1);
				endDate = endDate ? moment(endDate).utc() : moment().utc();
				query = `&startDate=${startDate.toJSON()}&endDate=${endDate.toJSON()}`;
				break;

			case DateFilterType.CUSTOM:
				query = `&startDate=${dateData.customStartDate.toJSON()}&endDate=${dateData.customEndDate.toJSON()}`;
				break;
		}
		return query;
	};

	const handleSaveAndShowTransactions = () => {
		const endpoint = `${
			config.resourceHost
		}bankTransaction?offset=0&searchText=&limit=9999999&orderBy=date&desc=true&bankDetailId=${bankId}${addDateQueryParam()}`;

		// console.log("QUERY PARAM", endpoint);
		// setTransactionsEndpoint(endpoint);

		invoiz.request(endpoint, { auth: true }).then((res) => {
			// console.log("Bank transactions on save and show", res);
			setTransactionsList(res.body.data);
			setProcessStationStatus({
				...processStationStatus,
				timePeriod: "done",
				import: "active",
			});
		});
	};

	const handleDownloadSampleFile = () => {
		window.open(transactionsExcel, "_self");
	};

	const handleMatchAndReconcile = () => {
		const transactionAmount = selectedTransactions.debits
			? selectedTransactions.debits
			: selectedTransactions.credits;
		const bankStatementAmount = selectedBankStatementTransactions.debits
			? selectedBankStatementTransactions.debits
			: selectedBankStatementTransactions.credits;

		console.log(transactionAmount, bankStatementAmount);

		if (transactionAmount === bankStatementAmount) {
			setFormError("");
			console.log(selectedTransactions.id, "Transaction ID");
			invoiz
				.request(`${config.resourceHost}bankTransaction/reconcile/${selectedTransactions.id}`, {
					auth: true,
					method: "PUT",
					data: { reconcileStatus: true },
				})
				.then((res) => {
					console.log(res, "Reconcile ka response");
					NotificationService.show({
						message: "Transaction reconciled successfully",
						type: "success",
					});
				});
			ModalService.close();
		} else {
			setFormError("Transaction amount and bank statement amount do not match");
		}
	};

	const TransactionsListComponent = () => {
		const keys = Object.keys(transactionsList[0]);

		return (
			<div className="box csv-list">
				<Label label="Your Transactions" />
				<div style={{ boxShadow: "0 0 7px 0 #cccccc", overflowY: "scroll", height: "88%", marginTop: "15px" }}>
					<div
						// className="box"
						style={{
							fontWeight: "600",
							padding: 0,
							margin: 0,
							display: "grid",
							gridTemplateColumns: "1fr 2fr 2fr 2fr 2fr",
							textAlign: "center",
							borderBottom: "1px solid #E3E3E3",
						}}
					>
						<p>
							<input style={{ accentColor: "#00A353", display: "none" }} type="checkbox" />
						</p>
						<p>Date</p>
						<p>Name</p>
						<p>Debit</p>
						<p>Credit</p>
					</div>
					{transactionsList.map((transaction, index) => {
						const lastElement = transactionsList.length === index + 1;
						let disabledCheckbox = false;
						if (Object.keys(selectedTransactions).length) {
							if (selectedTransactions.id === transaction.id) {
								disabledCheckbox = false;
							} else {
								disabledCheckbox = true;
							}
						}
						return (
							<div
								key={index.toString()}
								style={{
									padding: 0,
									margin: 0,
									display: "grid",
									gridTemplateColumns: "1fr 2fr 2fr 2fr 2fr",
									textAlign: "center",
									justifyContent: "center",
									alignItems: "center",
									borderBottom: lastElement ? "" : "1px solid #E3E3E3",
								}}
							>
								<p>
									<input
										disabled={disabledCheckbox}
										checked={selectedTransactions.id === transaction.id ? true : false}
										onChange={() => {
											if (Object.keys(selectedTransactions).length) {
												setSelectedTransactions({});
											} else {
												setSelectedTransactions({ ...transaction });
											}
										}}
										style={{ accentColor: "#00A353" }}
										type="checkbox"
									/>
								</p>
								<p>{formatDate(transaction.date)}</p>
								<p>{transaction.customer.name}</p>
								<p>{transaction.debits ? formatCurrency(transaction.debits) : "-"}</p>
								<p>{transaction.credits ? formatCurrency(transaction.credits) : "-"}</p>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	const BankStatementListComponent = () => {
		console.log("slected tranasction", selectedTransactions);
		console.log("slected bank statement", selectedBankStatementTransactions);
		return (
			<div className="box csv-list">
				<Label label="Your bank statement" />
				<div style={{ boxShadow: "0 0 7px 0 #cccccc", overflowY: "scroll", height: "88%", marginTop: "15px" }}>
					<div
						// className="box"
						style={{
							fontWeight: "600",
							padding: 0,
							margin: 0,
							display: "grid",
							gridTemplateColumns: "1fr 2fr 3fr 2fr 2fr",
							textAlign: "center",
							borderBottom: "1px solid #E3E3E3",
						}}
					>
						<p>
							<input style={{ accentColor: "#00A353", display: "none" }} type="checkbox" />
						</p>
						<p>Date</p>
						<p>Description</p>
						<p>Debit</p>
						<p>Credit</p>
					</div>
					{bankStatementArray.map((row, index) => {
						const lastElement = bankStatementArray.length === index + 1;
						let disabledCheckbox = false;
						if (Object.keys(selectedBankStatementTransactions).length) {
							if (selectedBankStatementTransactions.id === row.id) {
								disabledCheckbox = false;
							} else {
								disabledCheckbox = true;
							}
						}
						return (
							<div
								key={index.toString()}
								style={{
									padding: 0,
									margin: 0,
									display: "grid",
									gridTemplateColumns: "1fr 2fr 3fr 2fr 2fr",
									textAlign: "center",
									justifyContent: "center",
									alignItems: "center",
									borderBottom: lastElement ? "" : "1px solid #E3E3E3",
								}}
							>
								<p>
									<input
										disabled={disabledCheckbox}
										checked={selectedBankStatementTransactions.id === row.id ? true : false}
										onChange={() => {
											if (Object.keys(selectedBankStatementTransactions).length) {
												setSelectedBankStatementTransactions({});
											} else {
												setSelectedBankStatementTransactions({ ...row });
											}
										}}
										style={{ accentColor: "#00A353" }}
										type="checkbox"
									/>
								</p>
								<p>{ExcelDateToJSDate(row.date)}</p>
								<p>{row.description}</p>
								<p>{row.debits ? formatCurrency(row.debits) : "-"}</p>
								<p>{row.credits ? formatCurrency(row.credits) : "-"}</p>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	const dateOptions = [
		{ label: dateData.currentMonthName, value: "currMonth", group: "month" },
		{ label: dateData.lastMonthName, value: "lastMonth", group: "month" },
		{ label: dateData.secondLastMonth, value: "secondLastMonth", group: "month" },
		{ label: `Quarter ${dateData.currQuarter}`, value: "currQuarter", group: "quarter" },
		{ label: `Quarter ${dateData.lastQuarter}`, value: "lastQuarter", group: "quarter" },
		{ label: `Quarter ${dateData.secondLastQuarter}`, value: "secondLastQuarter", group: "quarter" },
		{ label: "Fiscal Year", value: "fiscalYear", group: "year" },
		{ label: "Custom", value: "custom", group: "custom" },
	];
	let bankNameList = bankOptions.filter((bank) => bank.type === "bank");
	bankNameList = bankNameList.map((bank) => ({ label: bank.bankName, value: bank.id }));
	console.log(transactionsList, "Transactions list");
	return (
		<div className="match-and-reconcile-modal-container" style={{ minHeight: "200px" }}>
			<div style={{ padding: "20px", boxShadow: "0px 1px 4px 0px #0000001F" }} className="modal-base-headline">
				Match and reconcile
			</div>
			<div
				style={{ padding: "10px", backgroundColor: "#F0F4F6", width: "100%" }}
				className="match-and-reconcile-modal-body-container"
			>
				{/* process stations */}
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						margin: "10px 20px 20px 10px",
					}}
					className="process-timeline"
				>
					<ProcessStation number={1} text="Select the bank account" status={processStationStatus.bank} line />
					<ProcessStation
						number={2}
						text="Select time period"
						status={processStationStatus.timePeriod}
						line
					/>
					<ProcessStation number={3} text="Import bank statement" status={processStationStatus.import} line />
					<ProcessStation
						number={4}
						text="Match and reconcile"
						status={processStationStatus.matchAndReconcile}
					/>
				</div>

				<div className="match-and-reconcile-modal-body">
					{/* Fist row */}
					<div className="row" style={{ height: "245px" }}>
						<div className="col-xs-6 bank-and-time-period-column">
							<div
								style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
								className="box"
							>
								<div
									className="add-bank-select-container"
									style={{ width: "100%", display: "flex", justifyContent: "space-between" }}
								>
									<Label
										label={"Select Bank Account"}
										style={{ whiteSpace: "nowrap", marginTop: "7px", marginRight: "50px" }}
									/>
									<SelectInput
										allowCreate={false}
										notAsync={true}
										loadedOptions={bankNameList}
										value={bankId}
										options={{
											clearable: false,
											noResultsText: false,
											labelKey: "label",
											valueKey: "value",
											matchProp: "label",
											placeholder: "Select Bank",
											handleChange: handleBankChange,
										}}
									/>
								</div>
								<div
									className="time-period-select-container"
									style={{ width: "100%", display: "flex", justifyContent: "space-between" }}
								>
									<Label
										label="Select time period"
										sublabel="Please select a time period for viewing transactions."
										style={{ flex: "1", marginRight: "10px" }}
									/>
									{/* <div
										className="time-period-container"
										style={{ display: "flex", justifyContent: "space-between", height: "63%" }}
									> */}
									<div style={{ flex: "1.5" }} className="time-period-select">
										<SelectInput
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
												id="reconcile-date-picker-container"
												className="start-end-date-selector-group"
											>
												<DateInputComponent
													name={"date"}
													value={dateData.customStartDate.format("DD-MM-YYYY")}
													required={true}
													label={"Start Date"}
													noBorder={true}
													onChange={(name, value) => {
														console.log(
															"setting custom start date",
															value,
															moment(value, "DD-MM-YYYY")
														);
														setDateData({
															...dateData,
															customStartDate: moment(value, "DD-MM-YYYY"),
														});
														updateSelectedDate({ value: "custom" });
													}}
												/>
												<DateInputComponent
													name={"date"}
													value={dateData.customEndDate.format("DD-MM-YYYY")}
													required={true}
													label={"End Date"}
													noBorder={true}
													onChange={(name, value) => {
														console.log(
															"setting custom end date",
															value,
															moment(value, "DD-MM-YYYY")
														);
														setDateData({
															...dateData,
															customEndDate: moment(value, "DD-MM-YYYY"),
														});
														updateSelectedDate({ value: "custom" });
													}}
												/>
											</div>
										)}
										{/* </div> */}
									</div>
								</div>

								<div className="bank-and-time-button-container" style={{ float: "right" }}>
									<ButtonComponent
										disabled={!dateData.dateFilterValue || !bankId}
										label="Save and show"
										callback={handleSaveAndShowTransactions}
									/>
								</div>
							</div>
						</div>
						<div className="col-xs-6 import-bank-column">
							<div className="box upload-csv-box">
								<Label label="Import bank statement" />
								<div
									style={{
										border: "1px solid #c6c6c6",
										color: "#747474",
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
										borderBottom: bankStatementFile ? "4px solid #0BA84A" : "1px solid #c6c6c6",
									}}
								>
									{bankStatementFile ? (
										<div
											style={{
												height: "70px",
												width: "100%",
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
											}}
										>
											<p style={{ padding: "0 20px" }}>
												<SvgInline svg={checkCircleIcon} width="16px" fill="#0BA84A" />
											</p>
											<p>
												{/* <span>{csvFile.name.slice(0, -4)}</span>
												<span style={{ fontWeight: "700" }}>{csvFile.name.slice(-4)}</span> */}
												<span>{bankStatementFile.name}</span>
											</p>
											<p
												style={{ cursor: "pointer", padding: "0 20px" }}
												onClick={() => {
													setBankStatementFile(null);
													setProcessStationStatus({
														...processStationStatus,
														import:
															processStationStatus.timePeriod === "done"
																? "active"
																: "inactive",
													});
												}}
											>
												<SvgInline svg={trashcanIcon} width="16px" fill="#0079B3" />
											</p>
										</div>
									) : (
										<div>
											<p style={{ marginBottom: "5px" }}>
												<label
													htmlFor="csv-upload"
													style={{ fontWeight: 600, color: "#00A353", cursor: "pointer" }}
												>
													<SvgInline svg={greenUploadIcon} width="20px" height="21px" />
													<span style={{ marginLeft: "5px" }}>Upload </span>
												</label>
												<input
													id="csv-upload"
													className="u_hidden"
													type="file"
													// accept={".csv"}
													onChange={handleBankStatementFileChange}
												/>
												<span>or drop a file</span>
											</p>
											<p style={{ marginTop: "5px" }}>File type must be .xlsx/.xls/.csv</p>
										</div>
									)}
								</div>
								<div
									className="import-button-container"
									style={{
										margin: "53px 0 0 0",
										width: "100%",
										display: "flex",
										justifyContent: "space-between",
									}}
								>
									<ButtonComponent
										label="Download sample excel file"
										callback={handleDownloadSampleFile}
									/>
									<ButtonComponent
										callback={handleImportClick}
										label="Import"
										disabled={!bankStatementFile}
									/>
								</div>
							</div>
						</div>
					</div>
					{/* Second row */}
					<div className="row">
						<div className="col-xs-6 reconcile-transactions-table">
							{transactionsList.length ? (
								<TransactionsListComponent />
							) : (
								<div
									style={{
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
										color: "#747474",
									}}
									className="box"
								>
									Select bank and time period for showing transactions here
								</div>
							)}
						</div>
						<div className="col-xs-6 csv-table">
							{bankStatementArray.length ? (
								<BankStatementListComponent />
							) : (
								<div
									style={{
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
										color: "#747474",
									}}
									className="box"
								>
									Import a bank statement for showing the bank statement here
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
			<div style={{ marginLeft: "15px" }}>
				<TextInputErrorComponent errorMessage={formError} visible={!!formError} />
			</div>

			<div style={{ position: "relative" }} className="modal-base-footer">
				<div className="modal-base-cancel">
					<ButtonComponent callback={() => ModalService.close()} type="cancel" label={"Cancel"} />
				</div>
				<div className="modal-base-confirm">
					<ButtonComponent
						label={"Match and reconcile"}
						callback={handleMatchAndReconcile}
						disabled={
							!(
								Object.keys(selectedTransactions).length &&
								Object.keys(selectedBankStatementTransactions).length
							)
						}
					/>
				</div>
			</div>
		</div>
	);
};

export default ReconcileModalComponent;
