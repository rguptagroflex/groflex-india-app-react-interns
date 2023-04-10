import React, { useState, useEffect } from "react";
import NumberInputComponent from "../../shared/inputs/number-input/number-input.component";
import ButtonComponent from "../../shared/button/button.component";
import ModalService from "../../services/modal.service";
import TextInputComponent from "../../shared/inputs/text-input/text-input.component";
import SelectInput from "../../shared/inputs/select-input/select-input.component";
import OvalToggleComponent from "../../shared/oval-toggle/oval-toggle.component";

const accountOptions = [
	{ label: "Assets", value: "assets" },
	{ label: "Liability", value: "liability" },
	{ label: "Equity", value: "equity" },
	{ label: "Income", value: "income" },
	{ label: "Expenses", value: "expenses" },
];

const assets = [
	{ value: "inventory", label: "Inventory" },
	{ value: "accountReceivable", label: "Account receivable" },
	{ value: "customerDeposits", label: "Customer deposits" },
	{ value: "prepaidExpenses", label: "Prepaid expenses" },
	{ value: "vendorCredits", label: "Vendor credits" },
	{ value: "propertyPlantAndEquipment", label: "Property plant and equipment" },
	{ value: "deposits", label: "deposits" },
];

const liabilities = [
	{ value: "salesTaxes", label: "Sales taxes" },
	{ value: "customerCredits", label: "Customer credits" },
	{ value: "accountPayable", label: "Account payable" },
	{ value: "unearnedRevenue", label: "Unearned revenue" },
];

const equity = [
	{ value: "ownerInvestmentDrawings", label: "Owner investment drawings" },
	{ value: "openingBalance", label: "Opening balance" },
	{ value: "retainedEarnings", label: "Retained earnings" },
];

const income = [
	{ value: "sales", label: "Sales" },
	{ value: "discounts", label: "Discounts" },
	{ value: "otherIncomes", label: "Other Incomes" },
];

const expenses = [
	{ value: "costOfGoodsSold", label: "Cost of goods sold" },
	{ value: "operatingExpenses", label: "Operating expenses" },
	{ value: "payrollExpenses", label: "Payroll expenses" },
	{ value: "salesTaxesPayment", label: "Sales taxes payment" },
	{ value: "utilies", label: "Utilies" },
	{ value: "advertising", label: "Advertising" },
	{ value: "transportExpenses", label: "Transport expenses" },
	{ value: "employeeBenefits", label: "Employee benefits" },
	{ value: "officeExpenses", label: "Office expenses" },
	{ value: "uncategorizedExpenses", label: "Uncategorized expenses" },
];

function ChartOfAccountPersonModalComponent({ onConfirm, previousData }) {
	useEffect(() => {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		if (previousData.status === "active") {
			previousData.status = true;
			setActive(true);
		} else {
			previousData.status = false;
			setActive(false);
		}
		setChartData(previousData);

		return () => {
			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
		};
	}, []);

	const [active, setActive] = useState(true);
	const [chartData, setChartData] = useState({
		accountType: "",
		accountSubType: "",
		status: "",
		accountCode: "",
		accountName: "",
		description: "",
		id: "",
	});

	const [accountNameError, setAccountNameError] = useState(false);
	const [accountTypeError, setAccountTypeError] = useState(false);

	const handleAccountCodeChange = (value) => {
		setChartData({ ...chartData, accountCode: value });
	};

	const handleAccountStatus = (newValue) => {
		setActive(newValue);
		setChartData((prevChartData) => {
			return {
				...prevChartData,
				status: newValue ? "active" : "inactive",
			};
		});
	};
	const handleAccountSubTypeChange = (types) => {
		if (!types) {
			return;
		}
		setChartData({ ...chartData, accountSubType: types.value });
	};

	const handleAccountNameChange = (event) => {
		setChartData({ ...chartData, accountName: event.target.value });
	};

	const handleAccountTypeChange = (option) => {
		if (!option) {
			return;
		}
		setChartData({ ...chartData, accountType: option.value });
	};

	const handleDescriptionChange = (event) => {
		setChartData({ ...chartData, description: event.target.value });
	};

	const handleSave = () => {
		if (!chartData.accountName || !chartData.accountType) {
			setAccountNameError(!chartData.accountName);
			setAccountTypeError(!chartData.accountType);
			return;
		}
		setAccountNameError(false);
		setAccountTypeError(false);
		onConfirm(chartData);

		ModalService.close();
	};

	return (
		<div className="add-chart-modal-container" style={{ minHeight: "200px" }}>
			<div
				style={{
					padding: "20px",
					boxShadow: "0px 1px 4px 0px #0000001F",
				}}
				className="modal-base-headline"
			>
				Edit account
			</div>
			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }}>
				<div style={{ padding: "35px 30px", backgroundColor: "white" }}>
					<div>
						<SelectInput
							allowCreate={false}
							notAsync={true}
							loadedOptions={accountOptions}
							name="accountType"
							value={chartData.accountType}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Account type",
								handleChange: handleAccountTypeChange,
							}}
							style={{ marginLeft: "-15px" }}
							aria-invalid={accountTypeError}
							aria-describedby={accountTypeError ? "accountTypeError" : null}
						/>
						<div style={{ marginTop: "10px" }}>
							{accountTypeError && (
								<span id="accountTypeError" style={{ color: "red" }}>
									This is a mandatory field.
								</span>
							)}
						</div>
					</div>

					<div>
						<SelectInput
							allowCreate={false}
							notAsync={true}
							name="accountSubType"
							loadedOptions={
								chartData.accountType === "assets"
									? assets
									: chartData.accountType === "liability"
									? liabilities
									: chartData.accountType === "equity"
									? equity
									: chartData.accountType === "income"
									? income
									: chartData.accountType === "expenses"
									? expenses
									: []
							}
							value={
								chartData.accountSubType && chartData.accountType === "assets"
									? assets.find((option) => option.value === chartData.accountSubType)
									: chartData.accountSubType && chartData.accountType === "liability"
									? liabilities.find((option) => option.value === chartData.accountSubType)
									: chartData.accountSubType && chartData.accountType === "equity"
									? equity.find((option) => option.value === chartData.accountSubType)
									: chartData.accountSubType && chartData.accountType === "income"
									? income.find((option) => option.value === chartData.accountSubType)
									: chartData.accountSubType && chartData.accountType === "expenses"
									? expenses.find((option) => option.value === chartData.accountSubType)
									: null
							}
							filterOption={(option, searchText) =>
								option.label.toLowerCase().startsWith(searchText.toLowerCase())
							}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Account sub type",
								handleChange: handleAccountSubTypeChange,
							}}
							aria-invalid={accountTypeError}
							aria-describedby={accountTypeError ? "accountTypeError" : null}
						/>
						<div style={{ marginTop: "10px" }}>
							{accountTypeError && (
								<span id="accountTypeError" style={{ color: "red" }}>
									This is a mandatory field.
								</span>
							)}
						</div>
					</div>

					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col-xs-6 ">
							<TextInputComponent
								name="accountName"
								required
								value={chartData.accountName}
								onChange={handleAccountNameChange}
								aria-invalid={accountNameError}
								aria-describedby={accountNameError ? "accountNameError" : null}
								label="Account name"
							/>
							<div style={{ marginTop: "-5px" }}>
								{accountNameError && (
									<span id="accountNameError" style={{ color: "red" }}>
										This is a mandatory field.
									</span>
								)}
							</div>
						</div>
						<div style={{ width: "100%", marginLeft: "15px" }} className="col-xs-6 ">
							<NumberInputComponent
								name="accountCode"
								value={chartData.accountCode}
								onChange={handleAccountCodeChange}
								label="Account code"
							/>
						</div>
					</div>
					<div style={{ paddingTop: "10px" }} className="textarea">
						<label style={{ fontSize: "16px" }} className="textarea_label">
							Description
						</label>
						<textarea
							className="textarea_input"
							rows="3"
							onChange={handleDescriptionChange}
							value={chartData.description}
						/>
						<span className="textarea_bar" />
					</div>
					<div className="row" style={{ paddingTop: "10px" }}>
						<div className="col-xs-10 ">
							<label className="notes-alert-label">
								Activate account(Active accounts only will appear in dropdown )
							</label>
						</div>
						<div>
							<OvalToggleComponent
								checked={active}
								items={[{ label: "Active" }, { label: "Inactive" }]}
								onChange={handleAccountStatus}
								value={chartData.status}
							/>
						</div>
					</div>
				</div>
			</div>
			<div style={{ position: "relative" }} className="modal-base-footer">
				<div className="modal-base-cancel">
					<ButtonComponent callback={() => ModalService.close()} type="cancel" label={"Cancel"} />
				</div>
				<div className="modal-base-confirm">
					<ButtonComponent buttonIcon="icon-check" callback={handleSave} label={"Save"} />
				</div>
			</div>
		</div>
	);
}
export default ChartOfAccountPersonModalComponent;
