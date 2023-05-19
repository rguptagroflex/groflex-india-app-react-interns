import React, { useEffect, useState } from "react";
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
import { formatApiDate } from "../../helpers/formatDate";
import { capitalize } from "lodash";

const Label = ({ label, style, sublabel = "" }) => {
	return (
		<label style={{ fontSize: "16px", color: "#272D30", fontWeight: "400", ...style }} className="textarea_label">
			{label}
			<span style={{ fontWeight: "400", fontSize: "14px", color: "#747474" }}>{" " + sublabel}</span>
		</label>
	);
};

const MoneyOutModalComponent = ({ onConfirm, bankList, chartOfAccounts }) => {
	useEffect(() => {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		return () => {
			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
		};
	}, []);

	const [moneyOutData, setMoneyOutData] = useState({
		reconcileStatus: false,
		type: "out",
		notes: "",
		date: "",
		credits: 0,
		debits: 0, //debits will be edited in this modal
		bankDetailId: null,
		chartOfAccountId: null,
	});
	const [formErrors, setFormErrors] = useState({
		dateError: "",
		debitsError: "",
		bankDetailIdError: "",
		chartOfAccountIdError: "",
	});

	const handleAccountNameChange = (option) => {
		if (!option) {
			setMoneyOutData({ ...moneyOutData, chartOfAccountId: null });
			setFormErrors({ ...formErrors, chartOfAccountIdError: "" });
			return;
		}
		setMoneyOutData({ ...moneyOutData, chartOfAccountId: option.value });
		setFormErrors({ ...formErrors, chartOfAccountIdError: "" });
	};

	const handlePaymentMethodChange = (option) => {
		if (!option) {
			setMoneyOutData({ ...moneyOutData, bankDetailId: "" });
			return;
		}
		setMoneyOutData({ ...moneyOutData, bankDetailId: option.value });
		setFormErrors({ ...formErrors, bankDetailIdError: "" });
	};
	const handleDebitsChange = (value) => {
		if (!value) {
			setMoneyOutData({ ...moneyOutData, debits: 0 });
			setFormErrors({ ...formErrors, debitsError: "Amount can not be 0" });
			return;
		}
		setMoneyOutData({ ...moneyOutData, debits: value });
		setFormErrors({ ...formErrors, debitsError: "" });
	};
	const handleNotesChange = (event) => {
		setMoneyOutData({ ...moneyOutData, notes: event.target.value });
	};

	// Extra Form validation function
	const checkForEmptyFields = () => {
		let emptyFlag = false;
		if (!moneyOutData.chartOfAccountId) {
			setFormErrors({ ...formErrors, chartOfAccountIdError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!moneyOutData.bankDetailId) {
			setFormErrors({ ...formErrors, bankDetailIdError: "This is a mandatory field" });
			emptyFlag = true;
		}
		if (!moneyOutData.debits) {
			setFormErrors({ ...formErrors, debitsError: "This is a mandatory field" });
			emptyFlag = true;
		}
		return emptyFlag;
	};

	// Handle Save
	const handleSave = () => {
		//Check for empty fields
		if (checkForEmptyFields()) return;

		//Finally submitting if no errors of any type
		if (Object.values(formErrors).every((error) => error === "")) {
			onConfirm({ ...moneyOutData });
		}
	};

	const paymentMethodOptions = [...bankList].map((bank) => ({
		label: capitalize(bank.bankName),
		value: bank.id,
	}));
	const chartofaccountOptions = chartOfAccounts.map((account) => ({
		label: capitalize(account.accountName),
		value: account.id,
	}));
	console.log(chartofaccountOptions, "COA options from modal");
	console.log(moneyOutData, "Money out data from modal");

	return (
		<div className="money-in-modal-container" style={{ minHeight: "200px" }}>
			<div style={{ padding: "20px", boxShadow: "0px 1px 4px 0px #0000001F" }} className="modal-base-headline">
				Money Out
			</div>

			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }} className="money-in-modal-body-container">
				<div style={{ padding: "35px 30px", backgroundColor: "white" }} className="money-in-modal-body">
					<div
						style={{ marginBottom: "20px", backgroundColor: !moneyOutData.accountType ? "#f9f9f9" : null }}
					>
						<SelectInput
							allowCreate={false}
							notAsync={true}
							loadedOptions={chartofaccountOptions}
							value={moneyOutData.chartOfAccountId}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Account name",
								handleChange: handleAccountNameChange,
							}}
						/>
						<div style={{ marginTop: "18px" }}>
							<TextInputErrorComponent
								errorMessage={formErrors.chartOfAccountIdError}
								visible={!!formErrors.chartOfAccountIdError}
							/>
						</div>
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0 0 5px 0" }} className="row">
						<div
							style={{
								width: "100%",
								marginRight: "15px",
								paddingTop: "5px",
							}}
							className="col_xs_6"
						>
							<DateInputComponent
								name={"date"}
								value={moneyOutData.date}
								required={true}
								label={"Date"}
								noBorder={true}
								onChange={(name, value, date) => {
									// setMoneyOutData({ ...moneyOutData, date: moment(value, "DD-MM-YYYY") });
									setMoneyOutData({ ...moneyOutData, date: formatApiDate(value, "DD-MM-YYYY") });
								}}
							/>
							<div style={{ width: "100%", borderTop: "1px solid #C6C6C6", marginBottom: "18px" }} />
						</div>
					</div>
					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px", paddingTop: "11px" }} className="col_xs_6">
							<SelectInput
								allowCreate={false}
								notAsync={true}
								loadedOptions={paymentMethodOptions}
								value={moneyOutData.bankDetailId}
								options={{
									clearable: false,
									noResultsText: false,
									labelKey: "label",
									valueKey: "value",
									matchProp: "label",
									placeholder: "Payment method",
									handleChange: handlePaymentMethodChange,
								}}
							/>
							<div style={{ marginTop: "18px" }}>
								<TextInputErrorComponent
									errorMessage={formErrors.bankDetailIdError}
									visible={!!formErrors.bankDetailIdError}
								/>
							</div>
						</div>

						<div style={{ width: "100%", marginLeft: "15px" }} className="col_xs_6">
							<NumberInputComponent
								defaultNonZero
								errorMessage={formErrors.debitsError}
								label="Amount"
								value={moneyOutData.debits}
								onChange={handleDebitsChange}
							/>
							<div style={{ marginTop: "18px" }}></div>
						</div>
					</div>
					<div style={{ paddingTop: "10px" }} className="textarea">
						<Label label="Notes" style={{ color: "#747474" }} />
						<textarea
							className="textarea_input"
							rows="4"
							onChange={handleNotesChange}
							value={moneyOutData.notes}
						/>
						<span className="textarea_bar" />
					</div>
				</div>
			</div>

			<div style={{ position: "relative" }} className="modal-base-footer">
				<div className="modal-base-cancel">
					<ButtonComponent callback={() => ModalService.close()} type="cancel" label={"Cancel"} />
				</div>
				<div className="modal-base-confirm">
					<ButtonComponent disabled={false} buttonIcon="icon-check" callback={handleSave} label={"Save"} />
				</div>
			</div>
		</div>
	);
};

export default MoneyOutModalComponent;
