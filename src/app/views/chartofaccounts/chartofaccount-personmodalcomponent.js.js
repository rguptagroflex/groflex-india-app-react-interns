import React, { useState, useEffect } from "react";
import NumberInputComponent from "../../shared/inputs/number-input/number-input.component";
import ButtonComponent from "../../shared/button/button.component";
import ModalService from "../../services/modal.service";
import DualToggleComponent from "../../shared/oval-toggle/dual-toggle.component";
import TextInputComponent from "../../shared/inputs/text-input/text-input.component";
import SelectInput from "../../shared/inputs/select-input/select-input.component";
import OvalToggleComponent from "../../shared/oval-toggle/oval-toggle.component";
import config from "../../../config";
import invoiz from "../../services/invoiz.service";

function ChartOfAccountPersonModalComponent({ onConfirm }) {
	useEffect(() => {
		document.getElementsByClassName("modal-base-view")[0].style.padding = 0;
		document.getElementsByClassName("modal-base-content")[0].style.margin = 0;
		return () => {
			document.getElementsByClassName("modal-base-view")[0].style.padding = "40px 40px 110px";
			document.getElementsByClassName("modal-base-content")[0].style.margin = "20px 0 0";
		};
	});

	const [active, setActive] = useState(false);
	const [accountType, setAccountType] = useState("");
	const [accountSubType, setAccountSubType] = useState("");
	const [chartData, setChartData] = useState({
		accountTypeId: "",
		accountSubTypeId: "",
		status: "",
		accountCode: "",
		accountName: "",
		description: "",
	});
	const [accountNameError, setAccountNameError] = useState(false);
	const [accountTypeError, setAccountTypeError] = useState(false);
	const handleDescriptionChange = (event) => {
		setChartData({ ...chartData, description: event.target.value });
	};

	const [allAccountSubTypeOptions, setAllAccountSubTypeOptions] = useState({});
	const [requiredSubtypeOptions, setRequiredSubtypeOptions] = useState({});
	const [accountTypeOptions, setAccountTypeOptions] = useState([]);
	useEffect(() => {
		getAccoutTyeAndSubtypes();
	}, []);
	useEffect(() => {
		setChartData((prevChartData) => ({
			...prevChartData,
			accountCode: generateRandomNumber(),
		}));
	}, []);
	const generateRandomNumber = () => {
		const randomNumber = Math.floor(Math.random() * 9000000) + 1000000;
		return randomNumber.toString();
	};

	const getAccoutTyeAndSubtypes = () => {
		invoiz
			.request(`${config.resourceHost}accountType?offset=0&searchText=&limit=9999999&orderBy=name&desc=false`, {
				auth: true,
			})
			.then((res) => {
				console.log(res.body.data, "Response for acc type get");
				const accSubtypeObject = {};
				const accountTypeList = res.body.data.map((accType) => {
					return {
						value: accType.id,
						label: accType.name,
					};
				});
				setAccountTypeOptions([...accountTypeList]);
				res.body.data.forEach((accType) => {
					accSubtypeObject[accType.id] = accType.accountSubType.map((subType) => {
						return {
							value: subType.id,
							label: subType.name,
						};
					});
				});
				setAllAccountSubTypeOptions({ ...accSubtypeObject });
			});
	};

	
	const handleAccountCodeChange = (value) => {
		setChartData({ ...chartData, accountCode: value });
	};

	const handleAccountNameChange = (event) => {
		setChartData({ ...chartData, accountName: event.target.value });
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


	const handleAccountTypeChange = (option) => {
		setAccountType(option.value);
		setRequiredSubtypeOptions(allAccountSubTypeOptions[option.value]);
	};

	const handleAccountSubTypeChange = (option) => {
		setAccountSubType(option.value);
	};

	const handleSave = () => {
	
		const accountData = {
			...chartData,
			accountTypeId: accountType,
			accountSubTypeId: accountSubType,
		};
		console.log(accountData, "accountdata");
		onConfirm(accountData);
		ModalService.close();
	};
	console.log(accountTypeOptions, "Acc type options");
	console.log(allAccountSubTypeOptions, "All subtype options");
	console.log(requiredSubtypeOptions, "required subtype options");
	return (
		<div className="add-chart-modal-container" style={{ minHeight: "200px" }}>
			<div
				style={{
					padding: "20px",
					boxShadow: "0px 1px 4px 0px #0000001F",
				}}
				className="modal-base-headline"
			>
				Add account
			</div>
			<div style={{ padding: "10px", backgroundColor: "#f5f5f5" }}>
				<div style={{ padding: "35px 30px", backgroundColor: "white" }}>
					<div>
						<SelectInput
							allowCreate={false}
							notAsync={true}
							loadedOptions={accountTypeOptions}
							name="accountType"
							value={accountType}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: "Account type",
								handleChange: handleAccountTypeChange,
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
					{requiredSubtypeOptions.length ? (
						<div style={{ margin: 0 }}>
							<SelectInput
								style={{ margin: "0px" }}
								allowCreate={false}
								notAsync={true}
								name="accountSubType"
								loadedOptions={requiredSubtypeOptions}
								value={accountSubType ? accountSubType : ""}
								options={{
									clearable: false,
									noResultsText: false,
									labelKey: "label",
									valueKey: "value",
									matchProp: "label",
									placeholder: "Account sub type",
									handleChange: handleAccountSubTypeChange,
								}}
								//aria-invalid={accountTypeError}
								//aria-describedby={accountTypeError ? "accountTypeError" : null}
							/>
							<div style={{ marginTop: "10px" }}>
								{accountTypeError && (
									<span id="accountTypeError" style={{ color: "red" }}>
										This is a mandatory field.
									</span>
								)}
							</div>
						</div>
					) : null}

					<div style={{ flexWrap: "nowrap", margin: "0" }} className="row">
						<div style={{ width: "100%", marginRight: "15px" }} className="col-xs-6 ">
							<TextInputComponent
								style={{ padding: "0px" }}
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
								disabled
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
						<div className="col-xs-2 ">
							<OvalToggleComponent
								checked={active}
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
