import React from "react";
import invoiz from "services/invoiz.service";
import q from "q";
import config from "config";
import sanitizeNumber from "helpers/sanitizeNumber";
import { format } from "util";
import TopbarComponent from "shared/topbar/topbar.component";
import CurrencyInputComponent from "shared/inputs/currency-input/currency-input.component";
import HtmlInputComponent from "shared/inputs/html-input/html-input.component";
import OvalToggleComponent from "shared/oval-toggle/oval-toggle.component";
import TextInputComponent from "shared/inputs/text-input/text-input.component";
import { scrollToTop } from "helpers/scrollToTop";
import ChangeDetection from "helpers/changeDetection";
import userPermissions from "enums/user-permissions.enum";

const changeDetection = new ChangeDetection();

class SettingsDunningsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			dunningLevel: props.dunningLevel,
			isSubmitting: false,
			canUpdateDunning: null,
		};

		setTimeout(() => {
			scrollToTop();
		}, 0);
	}

	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_DUNNING)) {
			invoiz.user.logout(true);
		}
		this.setState({
			canUpdateDunning: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_DUNNING),
		});
		setTimeout(() => {
			const dataOriginal = JSON.parse(JSON.stringify(this.state.dunningLevel));

			changeDetection.bindEventListeners();

			changeDetection.setModelGetter(() => {
				const currentData = JSON.parse(JSON.stringify(this.state.dunningLevel));

				return {
					original: dataOriginal,
					current: currentData,
				};
			});
		}, 0);
	}

	componentWillUnmount() {
		changeDetection.unbindEventListeners();
	}

	getReminderBlock(levelName, leftHeaderText, textModulePlaceholder) {
		const { dunningLevel, canUpdateDunning } = this.state;
		const { resources } = this.props;
		return (
			<div className="row dunningSettings_block">
				{/* <div className="col-xs-12 text-h4">{leftHeaderText}</div> */}
				<div className="col-xs-12 u_pbt_20">
					<div className="u_mt_8">
						{canUpdateDunning ? (
							<div className="dunningSettingsActive_toggle">
								<OvalToggleComponent
									labelLeft
									onChange={(val) => {
										this.updateValue(levelName, "active", val);
									}}
									checked={dunningLevel[levelName].active}
									labelText={format(
										resources.settingsDunningsActivatePaymentReminder,
										leftHeaderText
									)}
									newStyle={true}
									disabled={true}
								/>
							</div>
						) : null}
					</div>

					<div className="dunningSettingsDays">
						<div>{resources.settingsDunningsProposeCreation}</div>
						<div className="dunningSettingsDays_input">
							<TextInputComponent
								value={dunningLevel[levelName].daysTillAlert}
								onChange={(evt) =>
									this.updateValue(levelName, "daysTillAlert", Number(evt.target.value))
								}
								autoComplete="off"
								spellCheck="false"
								wrapperClass="box-border"
								disabled={!canUpdateDunning}
							/>
						</div>
						<div>
							{leftHeaderText !== resources.str_paymentRemainder
								? resources.settingsDunningsDaysAfterLastReminder
								: resources.settingsDunningsDaysAfterDue}
						</div>
					</div>

					<div className="dunningSettingsFees">
						<div>{resources.settingsDunningsOverdueFines}</div>
						<div className="dunningSettingsFees_input">
							<CurrencyInputComponent
								value={dunningLevel[levelName].charge}
								selectOnFocus={true}
								onChange={(val) => {
									const sanitized = sanitizeNumber(val, {
										precision: config.currencyFormat.precision,
										thousand: "",
										decimal: config.currencyFormat.decimal,
									});

									this.updateValue(levelName, "charge", sanitized.value);
								}}
								hasBorder={true}
								disabled={!canUpdateDunning}
							/>
						</div>
					</div>

					<div className="dunningSettings_textModules" ref={`textModules_${levelName}`}>
						<HtmlInputComponent
							label={resources.str_introductionText}
							placeholder={format(resources.settingsPlaceholderIntroductionText, textModulePlaceholder)}
							value={dunningLevel[levelName].introduction}
							onTextChange={(val) => this.updateValue(levelName, "introduction", val)}
							disabled={!canUpdateDunning}
						/>

						<HtmlInputComponent
							label={resources.str_closingText}
							placeholder={format(resources.settingsPlaceholderConclusionText, textModulePlaceholder)}
							value={dunningLevel[levelName].conclusion}
							onTextChange={(val) => this.updateValue(levelName, "conclusion", val)}
							disabled={!canUpdateDunning}
						/>

						<HtmlInputComponent
							label={resources.str_emailDispatch}
							placeholder={resources.settingsPlaceholderEmailText}
							value={dunningLevel[levelName].email}
							onTextChange={(val) => this.updateValue(levelName, "email", val)}
							disabled={!canUpdateDunning}
						/>
					</div>

					<div className="col-xs-offset-6">
						<a
							className="dunningSettings_link"
							onClick={(evt) =>
								this.onToggleTextModulesClick(`textModules_${levelName}`, evt.nativeEvent)
							}
						>
							{resources.str_show + " " + resources.str_textModulesSmall}
						</a>
					</div>
				</div>
			</div>
		);
	}

	onToggleTextModulesClick(ref, event) {
		const target = $(event.target);
		const textModules = this.refs && this.refs[ref];
		const { resources } = this.props;

		if (target[0] && textModules) {
			const linkCaption =
				($(textModules).is(":visible") ? ` ${resources.str_show}` : ` ${resources.str_hideTitle}`) +
				" " +
				resources.str_textModulesSmall;
			target.text(linkCaption);
			$(textModules).toggle("display");
		}
	}

	onTopbarButtonClick() {
		const { dunningLevel } = this.state;
		const { resources } = this.props;
		if (action === "save") {
			this.setState({ isSubmitting: true }, () => {
				const requests = [
					invoiz.request(`${config.settings.endpoints.dunningLevel}/${dunningLevel.paymentReminder.id}`, {
						auth: true,
						method: "PUT",
						data: {
							active: dunningLevel.paymentReminder.active,
							charge: dunningLevel.paymentReminder.charge,
							conclusion: dunningLevel.paymentReminder.conclusion,
							daysTillAlert: dunningLevel.paymentReminder.daysTillAlert,
							email: dunningLevel.paymentReminder.email,
							introduction: dunningLevel.paymentReminder.introduction,
						},
					}),
					invoiz.request(`${config.settings.endpoints.dunningLevel}/${dunningLevel.firstReminder.id}`, {
						auth: true,
						method: "PUT",
						data: {
							active: dunningLevel.firstReminder.active,
							charge: dunningLevel.firstReminder.charge,
							conclusion: dunningLevel.firstReminder.conclusion,
							daysTillAlert: dunningLevel.firstReminder.daysTillAlert,
							email: dunningLevel.firstReminder.email,
							introduction: dunningLevel.firstReminder.introduction,
						},
					}),
					invoiz.request(`${config.settings.endpoints.dunningLevel}/${dunningLevel.secondReminder.id}`, {
						auth: true,
						method: "PUT",
						data: {
							active: dunningLevel.secondReminder.active,
							charge: dunningLevel.secondReminder.charge,
							conclusion: dunningLevel.secondReminder.conclusion,
							daysTillAlert: dunningLevel.secondReminder.daysTillAlert,
							email: dunningLevel.secondReminder.email,
							introduction: dunningLevel.secondReminder.introduction,
						},
					}),
					invoiz.request(`${config.settings.endpoints.dunningLevel}/${dunningLevel.lastReminder.id}`, {
						auth: true,
						method: "PUT",
						data: {
							active: dunningLevel.lastReminder.active,
							charge: dunningLevel.lastReminder.charge,
							conclusion: dunningLevel.lastReminder.conclusion,
							daysTillAlert: dunningLevel.lastReminder.daysTillAlert,
							email: dunningLevel.lastReminder.email,
							introduction: dunningLevel.lastReminder.introduction,
						},
					}),
				];

				q.allSettled(requests)
					.then((results) => {
						let error = false;
						let errorPaymentReminder = false;
						let errorFirstReminder = false;
						let errorSecondReminder = false;
						let errorLastReminder = false;

						if (results[0].state === "rejected") {
							error = errorPaymentReminder = true;
							invoiz.page.showToast({
								type: "error",
								message: format(
									resources.settingsDunningsSaveErrorMessage,
									resources.str_paymentRemainder
								),
							});
						}

						if (results[1].state === "rejected") {
							error = errorFirstReminder = true;
							invoiz.page.showToast({
								type: "error",
								message: format(
									resources.settingsDunningsSaveErrorMessage,
									resources.settingsDunningsFirstReminder
								),
							});
						}

						if (results[2].state === "rejected") {
							error = errorSecondReminder = true;
							invoiz.page.showToast({
								type: "error",
								message: format(
									resources.settingsDunningsSaveErrorMessage,
									resources.settingsDunningsSecondReminder
								),
							});
						}

						if (results[3].state === "rejected") {
							error = errorLastReminder = true;
							invoiz.page.showToast({
								type: "error",
								message: format(
									resources.settingsDunningsSaveErrorMessage,
									resources.settingsDunningsLastReminder
								),
							});
						}

						if (!error) {
							invoiz.page.showToast({
								message: resources.str_editSuccessMessage,
							});
						} else {
							if (!errorPaymentReminder) {
								invoiz.page.showToast({
									message: format(
										resources.settingsDunningsSaveSuccessMessage,
										resources.str_paymentRemainder
									),
								});
							}
							if (!errorFirstReminder) {
								invoiz.page.showToast({
									message: format(
										resources.settingsDunningsSaveSuccessMessage,
										resources.settingsDunningsFirstReminder
									),
								});
							}
							if (!errorSecondReminder) {
								invoiz.page.showToast({
									message: format(
										resources.settingsDunningsSaveSuccessMessage,
										resources.settingsDunningsSecondReminder
									),
								});
							}
							if (!errorLastReminder) {
								invoiz.page.showToast({
									message: format(
										resources.settingsDunningsSaveSuccessMessage,
										resources.settingsDunningsLastReminder
									),
								});
							}
						}
					})
					.done(() => {
						const dataOriginal = JSON.parse(JSON.stringify(this.state.dunningLevel));

						changeDetection.setModelGetter(() => {
							const currentData = JSON.parse(JSON.stringify(this.state.dunningLevel));

							return {
								original: dataOriginal,
								current: currentData,
							};
						});

						this.setState({ isSubmitting: false });
					});
			});
		} else {
			window.history.back();
		}
	}

	updateValue(type, key, value) {
		const dunningLevel = JSON.parse(JSON.stringify(this.state.dunningLevel));

		if (dunningLevel.hasOwnProperty(type)) {
			if (dunningLevel[type].hasOwnProperty(key)) {
				dunningLevel[type][key] = value;
			}
		}

		this.setState({ dunningLevel });
	}

	render() {
		const { isSubmitting, canUpdateDunning } = this.state;
		const { resources } = this.props;

		return (
			<div className="settings-dunnings-component wrapper-has-topbar-with-margin">
				<TopbarComponent
					title={resources.str_dunning}
					viewIcon={`icon-settings`}
					buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
					buttons={[
						{
							type: "default",
							label: resources.str_cancel,
							// buttonIcon: "icon-check",
							action: "cancel",
							// disabled: isSubmitting || !canUpdateTextBlocks,
							dataQsId: "settings-textModules-btn-cancel",
						},
						{
							type: "primary",
							label: resources.str_toSave,
							buttonIcon: "icon-check",
							action: "save",
							disabled: isSubmitting || !canUpdateDunning,
							dataQsId: "settings-dunnings-btn-save",
						},
					]}
				/>

				<div className="box">
					<div className="row">
						<div className="col-xs-12">
							{/* <h2 className="u_pb_16">{resources.str_dunning}</h2> */}
							<div className="text-muted">
								<p>
									{resources.settingsDunningsSetReminderText}{" "}
									{resources.settingsDunningsSetAmountText}
								</p>
								{/* <p></p> */}
							</div>
						</div>
					</div>

					{this.getReminderBlock(
						"paymentReminder",
						resources.str_paymentRemainder,
						resources.settingsDunningsThePaymentReminder
					)}
					{this.getReminderBlock("firstReminder", `1. ${resources.str_warning}`, resources.str_firstReminder)}
					{this.getReminderBlock(
						"secondReminder",
						`2. ${resources.str_warning}`,
						resources.str_secondReminder
					)}
					{this.getReminderBlock("lastReminder", resources.str_lastReminder, resources.str_lastReminderSmall)}
				</div>
			</div>
		);
	}
}

export default SettingsDunningsComponent;
