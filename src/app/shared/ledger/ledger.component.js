import React from "react";
import PropTypes from "prop-types";
import invoiz from "services/invoiz.service";
import config from "config";
import moment from "moment";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import RadioInputComponent from "shared/inputs/radio-input/radio-input.component";
import DateInputComponent from "shared/inputs/date-input/date-input.component";
import ButtonComponent from "shared/button/button.component";
import { formatClientDate, formatApiDate } from "helpers/formatDate";
import modalService from "../../services/modal.service";
import SendEmailModalComponent from "../send-email-modal.component";

const exportOption = [
	{
		id: "pdf",
		label: "PDF",
		value: "pdf",
	},
	{
		id: "csv",
		label: "CSV",
		value: "csv",
	},
];

class LedgerComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			customerId: props.customerId,
			dateOption: null,
			fromDate: new Date(),
			toDate: new Date(),
			exportFormat: "pdf",
		};

		this.downloadLedger = this.downloadLedger.bind(this);
	}

	getQuarter(date) {
		let month = date.month();
		let year = date.year();
		let quarters = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
			[9, 10, 11],
		];

		let index = quarters.findIndex((quarter) => quarter.includes(month));

		return { quarter: index + 1, months: quarters[index], year, month };
	}
	getQuarterdates(quartersMonths, year) {
		let fromDate = moment().year(year).month(quartersMonths[0]).startOf("month");
		let toDate = moment().year(year).month(quartersMonths[2]).endOf("month");

		return { fromDate, toDate };
	}
	getQuarters() {
		let currentQuater = moment();
		let lastQuater = moment().subtract(3, "months");
		let secondlastQuater = moment().subtract(6, "months");

		let currentQuaterDetails = this.getQuarter(currentQuater);
		let lastQuaterDetails = this.getQuarter(lastQuater);
		let secondlastQuaterDetails = this.getQuarter(secondlastQuater);

		let currentQuaterDates = this.getQuarterdates(currentQuaterDetails.months, currentQuaterDetails.year);
		let lastQuaterDates = this.getQuarterdates(lastQuaterDetails.months, lastQuaterDetails.year);
		let secondlastQuaterDates = this.getQuarterdates(secondlastQuaterDetails.months, secondlastQuaterDetails.year);

		return {
			currentQuater: { ...currentQuaterDetails, ...currentQuaterDates },
			lastQuater: { ...lastQuaterDetails, ...lastQuaterDates },
			secondlastQuater: { ...secondlastQuaterDetails, ...secondlastQuaterDates },
		};
	}

	getSelectizeDateOptions() {
		const { resources } = this.props;

		let secondLastMonth = moment().subtract(2, "months").format("MMMM YYYY");
		let lastMonth = moment().subtract(1, "months").format("MMMM YYYY");
		let currMonth = moment().format("MMMM YYYY");

		let { currentQuater, lastQuater, secondlastQuater } = this.getQuarters();

		const dateArray = [
			{ label: currMonth, value: "currMonth", group: "month" },
			{ label: lastMonth, value: "lastMonth", group: "month" },
			{ label: secondLastMonth, value: "secondLastMonth", group: "month" },

			{
				label: `Quarter ${currentQuater.quarter}/${currentQuater.year}`,
				value: "currentQuater",
				group: "quarter",
				quarter: currentQuater,
			},
			{
				label: `Quarter ${lastQuater.quarter}/${lastQuater.year}`,
				value: "lastQuater",
				group: "quarter",
				quarter: lastQuater,
			},
			{
				label: `Quarter ${secondlastQuater.quarter}/${secondlastQuater.year}`,
				value: "secondlastQuater",
				group: "quarter",
				quarter: secondlastQuater,
			},

			{ label: "Custom", value: "custom", group: "custom" },
		];

		return dateArray;
	}

	getDates(state) {
		let { dateOption, fromDate, toDate } = state;

		switch (dateOption.value) {
			case "currMonth":
				fromDate = moment().startOf("months").format("YYYY-MM-DD");
				toDate = moment().endOf("months").format("YYYY-MM-DD");
				break;
			case "lastMonth":
				fromDate = moment().subtract(1, "months").startOf("months").format("YYYY-MM-DD");
				toDate = moment().subtract(1, "months").endOf("months").format("YYYY-MM-DD");

				break;
			case "secondLastMonth":
				fromDate = moment().subtract(2, "months").startOf("months").format("YYYY-MM-DD");
				toDate = moment().subtract(2, "months").endOf("months").format("YYYY-MM-DD");
				break;

			case "currentQuater":
			case "lastQuater":
			case "secondlastQuater":
				fromDate = dateOption.quarter.fromDate.format("YYYY-MM-DD");
				toDate = dateOption.quarter.toDate.format("YYYY-MM-DD");
				break;

			default:
				fromDate = moment(fromDate, "DD-MM-YYYY").format("YYYY-MM-DD");
				toDate = moment(toDate, "DD-MM-YYYY").format("YYYY-MM-DD");
				break;
		}

		return { fromDate, toDate };
	}
	downloadLedger() {
		let { exportFormat } = this.state;
		let { customerId, resources } = this.props;
		let { fromDate, toDate } = this.getDates(this.state);

		//console.log({fromDate,toDate});

		let url = `${config.customer.resourceUrl}/${customerId}/statement/${fromDate}/${toDate}?type=${exportFormat}`;

		invoiz
			.request(url, {
				auth: true,
				method: "GET",
				headers: { "Content-Type": `application/${exportFormat}` },
			})
			.then(({ body }) => {
				invoiz.page.showToast({ message: resources.ledgerExportCreateSuccess });
				var blob = new Blob([body], { type: "application/text" });
				var link = document.createElement("a");
				link.href = window.URL.createObjectURL(blob);
				link.download = `${fromDate}_${toDate}.${exportFormat}`;

				document.body.appendChild(link);

				link.click();

				document.body.removeChild(link);
			})
			.catch((err) => {
				invoiz.page.showToast({ type: "error", message: resources.ledgerExportCreateError });
			});
	}

	handleSendLedgerEmail(modalData) {
		const { emailTextAdditional, emails, regard, sendType } = modalData;
		console.log(emailTextAdditional, emails, regard, sendType, "data friom modal emai lvierw");

		const url = `${config.resourceHost}accountingReport/sendAccountingReportEmail/CustomerLedger/${moment(
			this.state.fromDate
		).format()}/${moment(this.state.endDate).format()}`;

		const method = "POST";
		const data = {
			recipients: emails.map((email) => email.value),
			subject: regard,
			text: emailTextAdditional,
			sendCopy: false,
			sendType: sendType,
			customerId: this.props.customerId,
		};

		invoiz
			.request(url, { auth: true, method, data })
			.then((res) => {
				console.log("Response:  for send email modal", res);
				invoiz.showNotification({ type: "success", message: "Ledger email sent" });
				modalService.close();
			})
			.catch(invoiz.showNotification({ type: "error", message: "Couldn't send email" }));
	}

	openSendLedgerEmailModal() {
		modalService.open(
			<SendEmailModalComponent
				heading={"Send Ledger"}
				fileNameWithoutExt={`${this.props.customerName}_${moment(this.state.fromDate).format(
					"DD-MM-YYYY"
				)}_${moment(this.state.toDate).format("DD-MM-YYYY")}`}
				onSubmit={(data) => this.handleSendLedgerEmail(data)}
			/>,
			{
				modalClass: "send-ledger-email-modal-component-wrapper",
				width: 630,
			}
		);
	}

	render() {
		let { resources } = this.props;

		let { dateOption, fromDate, toDate, exportFormat } = this.state;

		return (
			<div className="customer-statements-container">
				<div className="notes_heading text-h4">Ledger</div>
				<div className="text-muted text-medium u_mb_10">Export transaction details</div>
				<div className="row first-row col-no-gutter-left">
					<div className=" col-xs-5 col-no-gutter-left document-export-date">
						<SelectInputComponent
							allowCreate={false}
							notAsync={true}
							loadedOptions={this.getSelectizeDateOptions()}
							value={dateOption}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: "label",
								valueKey: "value",
								matchProp: "label",
								placeholder: resources.str_selectPeriod,
								handleChange: (value) => this.setState({ dateOption: value }), // this.handleSelectInput
							}}
						/>
					</div>
					<div className="col-xs-3 col-gutter-left-30 export-type">
						<RadioInputComponent
							useCustomStyle={true}
							value={exportFormat}
							onChange={(value) => this.setState({ exportFormat: value })}
							options={exportOption}
						/>
					</div>
					<div className="col-xs-2 col-gutter-left-60 statement-action">
						<ButtonComponent
							buttonIcon={""}
							type="secondaryNew"
							callback={() => this.downloadLedger()}
							label={"Export"}
							disabled={!dateOption}
							dataQsId="settings-documentExport-btn-createExport"
						/>
					</div>
					<div className="col-xs-2 col-gutter-left-60 statement-action">
						<ButtonComponent
							buttonIcon={""}
							type="secondaryNew"
							callback={() => this.openSendLedgerEmailModal()}
							label={"Email"}
							disabled={!dateOption}
							dataQsId="settings-documentExport-btn-createExport"
						/>
					</div>
				</div>
				<div className="row second-row u_mt_10">
					{dateOption && dateOption.value === "custom" ? (
						<div className=" col-xs-6 ">
							<div className="row">
								<div className=" col-xs-6 ">
									<DateInputComponent
										name={"date"}
										value={formatClientDate(fromDate)}
										required={true}
										label={resources.str_startDate}
										noBorder={true}
										onChange={(name, value) => this.setState({ fromDate: value })}
									/>
								</div>
								<div className=" col-xs-6 ">
									<DateInputComponent
										name={"date"}
										value={formatClientDate(toDate)}
										required={true}
										label={resources.str_endDate}
										noBorder={true}
										onChange={(name, value) => this.setState({ toDate: value })}
									/>
								</div>
							</div>
						</div>
					) : null}
				</div>
			</div>
		);
	}
}

LedgerComponent.propTypes = {};

export default LedgerComponent;
