import React, { useEffect, useState } from "react";
import SelectInput from "../../shared/inputs/select-input/select-input.component";
import invoiz from "../../services/invoiz.service";
import ButtonComponent from "../../shared/button/button.component";
import modalService from "../../services/modal.service";
import config from "../../../config";
import { capitalize } from "lodash";
import TextInputComponent from "../../shared/inputs/text-input/text-input.component";
import DateInputComponent from "../../shared/inputs/date-input/date-input.component";
import { formatApiDate } from "../../helpers/formatDate";

const RegisterPaymentModalComponent = ({ expense, fromEdit = false, setEditState, editState }) => {
	useEffect(() => {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		return () => {
			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
		};
	}, []);

	useEffect(() => {
		getBanksList();
	}, []);

	const [modalState, setModalState] = useState({
		paymentMethod: null,
		bankDetailId: null,
		paymentMethodOptions: [],
		expense: { ...expense },
		paymentAmount: 0,
		paymentDate: null,
		description: "",
	});

	const getBanksList = () => {
		invoiz.request(`${config.resourceHost}bank`, { auth: true }).then((res) => {
			if (res.body.data.length === 0) {
				invoiz.page.showToast({ type: "error", message: "Please create Cash and Bank first" });
			}
			setModalState({
				...modalState,
				paymentMethodOptions: [...res.body.data].map((bank) => ({
					label: capitalize(bank.bankName),
					value: bank.id,
					type: bank.type,
				})),
			});
		});
	};

	const handlePaymentMethodChange = (option) => {
		if (!option) return;
		const newExpense = { ...modalState.expense };
		newExpense.payKind = option.type;
		newExpense.status = "paid";
		newExpense.bankDetailId = option.value;
		setModalState({ ...modalState, expense: newExpense, paymentMethod: option.value, bankDetailId: option.value });
	};

	const handlePaymentAmountChange = (e) => {
		let value = parseFloat(e.target.value.replace("₹", "")) || 0;

		// console.log(value, "value of amount");
		const numberRegex = /^-?\d+(\.\d+)?$/;
		if (!numberRegex.test(value)) return;

		setModalState({ ...modalState, paymentAmount: value });
	};

	const handleDateChange = (name, value, date) => {
		const newExpense = { ...modalState.expense };
		newExpense.payDate = formatApiDate(date);
		console.log("PAYMENT METHOD DATE", formatApiDate(date));
		setModalState({ ...modalState, expense: newExpense, paymentDate: formatApiDate(date) });
	};

	const handleDescriptionChange = (e) => {
		setModalState({ ...modalState, description: e.target.value });
	};

	const handleSubmitFromEdit = () => {
		setEditState({
			...editState,
			isPaid: true,
			expense: { ...modalState.expense },
			paymentMethod: modalState.bankDetailId,
		});
		modalService.close();
	};

	const handleSubmit = () => {
		if (fromEdit) {
			handleSubmitFromEdit();
			return;
		}
		invoiz
			.request(`${config.resourceHost}expense/${expense.id}`, {
				auth: true,
				method: "PUT",
				data: {
					...modalState.expense,
					payee: modalState.expense.payee === null ? "" : modalState.expense.payee,
				},
			})
			.then((res) => {
				invoiz.showNotification({ type: "success", message: "Payment Registered succesfully" });
				invoiz.router.reload();
				//TODO:
			})
			.catch((res) => {
				invoiz.showNotification({ type: "error", message: "Payment Registeration failed" });
			});
	};

	// const submitDisabled = () => {
	// 	let flag = false;
	// 	if(1){}
	// }

	console.log(modalState, "modal state");
	return (
		<div className="register-payment-modal">
			<div style={{ padding: "20px", borderBottom: "1px solid #C6C6C6" }} className="modal-base-headline">
				Register Payment
			</div>
			<div style={{ padding: "20px", backgroundColor: "white" }} className="register-payment-modal-body">
				{/* Payment Amount and adate */}
				<div className="row">
					<div className="col-xs-6">
						{/* <label>Payment Amount*</label> */}
						<TextInputComponent
							// errorMessage={formErrors.bankNameError}
							label="Payment Amount*"
							value={`₹ ${modalState.paymentAmount}`}
							onChange={handlePaymentAmountChange}
						/>
					</div>
					<div className="col-xs-6">
						<label className="dateInput_label">Payment Date*</label>
						<DateInputComponent
							name={"expense-pay-date"}
							value={modalState.expense.displayPayDate}
							required={true}
							onChange={(name, value, date) => handleDateChange(name, value, date)}
							dataQsId="expense-edit-date"
						/>
					</div>
				</div>
				{/* Paymentr method and acc type */}
				<div style={{ marginBottom: "20px" }} className="row">
					<div className="col-xs-6">
						<label className="dateInput_label">Payment Method*</label>
						<SelectInput
							allowCreate={false}
							notAsync={true}
							loadedOptions={modalState.paymentMethodOptions}
							value={modalState.paymentMethod}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Payment method",
								handleChange: (option) => handlePaymentMethodChange(option),
							}}
						/>
					</div>
					<div className="col-xs-6">
						<label className="dateInput_label">Account type</label>
						<SelectInput
							allowCreate={false}
							notAsync={true}
							loadedOptions={modalState.paymentMethodOptions}
							value={modalState.paymentMethod}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Account type",
								handleChange: (option) => handlePaymentMethodChange(option),
							}}
						/>
					</div>
				</div>
				{/* Outstanding amount */}
				<div style={{ marginBottom: "20px" }} className="row">
					<div className="col-xs-6">
						{/* <label className="dateInput_label">Outstanding amount</label> */}
						<TextInputComponent
							// errorMessage={formErrors.bankNameError}
							label="Outstanding Amount"
							value={`₹ ${expense.totalGross}`}
							disabled={true}
						/>
					</div>
				</div>
				<div className="textarea u_mb_20">
					<label className="dateInput_label">Description</label>
					<textarea
						className="textarea_input u_mt_6"
						rows="4"
						value={modalState.description}
						onChange={handleDescriptionChange}
					/>
					<span className="textarea_bar" />
				</div>
			</div>

			<div style={{ position: "relative" }} className="modal-base-footer">
				<div className="modal-base-confirm">
					<ButtonComponent dataQsId="cancelInvoice-btn-confirm" callback={handleSubmit} label={"Pay Now"} />
				</div>
				<div className="modal-base-cancel">
					<ButtonComponent
						dataQsId="cancelInvoice-btn-cancel"
						callback={() => {
							if (fromEdit) {
								// console.log("Ran in cancel");
								let tempExpense = { ...expense };
								delete tempExpense.bankDetailId;
								tempExpense = {
									...tempExpense,
									payKind: "open",
									status: "open",
									payDate: new Date().toLocaleDateString("IN").split("/").reverse().join("-"),
								};
								setEditState({ ...editState, expense: { ...tempExpense } });
							}
							modalService.close();
						}}
						type="cancel"
						label={"Cancel"}
					/>
				</div>
			</div>
		</div>
	);
};

export default RegisterPaymentModalComponent;
