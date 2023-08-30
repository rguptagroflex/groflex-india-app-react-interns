import React from "react";
// import moment from 'moment';
import config from "config";
import CheckboxInputComponent from "shared/inputs/checkbox-input/checkbox-input.component";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";
import HtmlInputComponent from "shared/inputs/html-input/html-input.component";
import DateInputComponent from "shared/inputs/date-input/date-input.component";
import { formatApiDate } from "helpers/formatDate";
import ChangeDetection from "helpers/changeDetection";

// const recurrenceOptions = [
// 	{ label: 'Wöchentlich', value: 'weekly' },
// 	{ label: '14-tägig', value: 'biweekly' },
// 	{ label: 'Monatlich', value: 'monthly' },
// 	{ label: '2-monatlich', value: 'bimonthly' },
// 	{ label: '3-monatlich', value: 'quarter' },
// 	{ label: 'halbjährlich', value: 'biyearly' },
// 	{ label: 'jährlich', value: 'yearly' }
// ];

const changeDetection = new ChangeDetection();

class RecurringInvoiceSettingsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			expanded: true,
		};
	}

	componentDidMount() {
		const { recurringInvoice } = this.props;
		setTimeout(() => {
			window.scrollTo(0, 0);
		}, 0);
		setTimeout(() => {
			const original = JSON.parse(JSON.stringify(recurringInvoice));
			changeDetection.bindEventListeners();
			changeDetection.setModelGetter(() => {
				const current = JSON.parse(JSON.stringify(recurringInvoice));

				return {
					original,
					current,
				};
			});
		}, 0);
	}

	componentWillUnmount() {
		changeDetection.unbindEventListeners();
	}

	render() {
		const { recurringInvoice, resources } = this.props;
		const recurrenceOptions = [
			{ label: resources.str_weekly, value: "weekly" },
			{ label: resources.str_fourteenDays, value: "biweekly" },
			{ label: resources.str_perMonth, value: "monthly" },
			{ label: resources.str_twoMonth, value: "bimonthly" },
			{ label: resources.str_threeMonth, value: "quarter" },
			{ label: resources.str_halfYearly, value: "biyearly" },
			{ label: resources.str_yearly, value: "yearly" },
		];
		return (
			<div className="box recurring-invoice-settings">
				<div className="row">
					<div className="recurring-invoice-settings-heading col-xs-12 text-h4 u_pb_20">
						<div className="recurring-invoice-settings-left">
							<div className="recurring-invoice-settings-headline">
								{resources.recurringInvoiceSettingsTitle}
							</div>
							{/* <div className="recurring-invoice-settings-description">
								{resources.recurringInvoiceSettingsDescription}
							</div> */}
						</div>
					</div>
					<div className="col-xs-12 recurring-invoice-form">
						<div className="row">
							<div className="col-xs-4">
								<DateInputComponent
									label={resources.firstRunText}
									name="startDate"
									value={recurringInvoice.displayStartDate}
									required={true}
									onChange={(name, value) => this.onChange(name, value)}
								/>
							</div>
							<div className="col-xs-4">
								<SelectInputComponent
									title={resources.str_repeat}
									name="recurrence"
									allowCreate={false}
									notAsync={true}
									options={{
										clearable: false,
										backspaceRemoves: false,
										handleChange: (option) => this.onChange("recurrence", option.value),
									}}
									value={recurringInvoice.recurrence}
									loadedOptions={recurrenceOptions}
								/>
							</div>
							<div className="col-xs-4 recurring-invoice-settings-email">
								<TextInputExtendedComponent
									ref="recInvoiceEmailInput"
									required={true}
									onBlur={(target, value) => this.onEmailBlur(value)}
									value={recurringInvoice.recipient}
									label={resources.recurringInvoiceEmailText}
									onChange={(val) => this.onChange("recipient", val)}
								/>
							</div>
						</div>

						{/* <div className="row recurring-invoice-settings-email">
							<div className="col-xs-6 recurring-invoice-settings-email">
								<TextInputExtendedComponent
									ref="recInvoiceEmailInput"
									required={true}
									onBlur={(target, value) => this.onEmailBlur(value)}
									value={recurringInvoice.recipient}
									label={resources.recurringInvoiceEmailText}
									onChange={(val) => this.onChange("recipient", val)}
								/>
							</div>
						</div> */}

						{!this.state.expanded ? null : (
							<div className="recurring-invoice-settings-advanced">
								<div className="row">
									<div className="col-xs-12">
										<TextInputExtendedComponent
											value={recurringInvoice.subject}
											label={resources.recurringInvoiceEmailSubject}
											onChange={(val) => this.onChange("subject", val)}
										/>
									</div>
								</div>

								<div className="row">
									<div className="col-xs-12">
										<HtmlInputComponent
											value={recurringInvoice.mailContent}
											label={resources.str_emailText}
											onTextChange={(val) => this.onChange("mailContent", val)}
										/>
									</div>
								</div>

								<div className="row">
									<div className="col-xs-12">
										<CheckboxInputComponent
											name={"sendCopy"}
											// label={resources.str_copyToMe}
											label={"Send me a copy"}
											checked={!!recurringInvoice.sendCopy}
											onChange={() => {
												this.onChange("sendCopy", !recurringInvoice.sendCopy);
											}}
										/>
									</div>
								</div>
							</div>
						)}

						{/* <div
							className="recurring-invoice-settings-toggle"
							onClick={() => this.setState({ expanded: !this.state.expanded })}
						>
							{this.state.expanded ? resources.str_hideTitle : resources.str_show}{" "}
							{resources.str_moreSettingsSmall}
						</div> */}
					</div>
				</div>
			</div>
		);
	}

	onEmailBlur(value) {
		const { recurringInvoice, onChange, resources } = this.props;

		if (!value) {
			recurringInvoice["recipient"] = null;
			onChange && onChange(recurringInvoice);
		}

		if (!config.emailCheck.test(value)) {
			this.refs["recInvoiceEmailInput"].setError(resources.validEmailError);
		}
	}

	onChange(key, value) {
		if (key === "startDate") {
			// value = moment(value, 'DD.MM.YYYY').format(config.dateFormat.api);
			value = formatApiDate(value);
		}
		const { recurringInvoice, onChange } = this.props;

		if (key === "recipient" && !config.emailCheck.test(value)) {
			return;
		}

		recurringInvoice[key] = value || null;
		onChange && onChange(recurringInvoice);
	}
}

export default RecurringInvoiceSettingsComponent;
