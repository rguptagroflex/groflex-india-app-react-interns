import React from "react";
import invoiz from "services/invoiz.service";
import config from "config";
import { format } from "util";
import TopbarComponent from "shared/topbar/topbar.component";
import NumerationConfigComponent from "shared/numeration-config/numeration-config.component";
import ModalService from "services/modal.service";
import TagReplaceModal from "shared/modals/tag-replace-modal.component";
import { TagInputComponent } from "shared/inputs/tag-input/tag-input.component";
import { scrollToTop } from "helpers/scrollToTop";
import userPermissions from "enums/user-permissions.enum";

class SettingsMoreSettingsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			numerationOptionsData: props.numerationOptionsData,
			miscellaneousData: props.miscellaneousData,
			canEditNumericRange: null,
			canEditSalutations: null,
		};

		setTimeout(() => {
			scrollToTop();
		}, 0);
	}

	onTagChange(key, selectOptions) {
		const miscellaneousData = JSON.parse(JSON.stringify(this.state.miscellaneousData));
		const newTags = [];

		if (selectOptions && selectOptions.length > 0) {
			selectOptions.forEach((option) => {
				newTags.push(option);
			});
		}

		if (miscellaneousData.hasOwnProperty(key)) {
			miscellaneousData[key] = newTags.map((tag) => tag.value);
		}

		this.setState({
			miscellaneousData,
		});
	}

	componentDidMount() {
		this.setState({
			canEditNumericRange: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_NUMBER_RANGE),
			canEditSalutations: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_SALUTATIONS),
		});
	}

	onTopbarButtonClick(action) {
		window.history.back();
	}

	render() {
		const { numerationOptionsData, miscellaneousData, canEditNumericRange, canEditSalutations } = this.state;
		const { resources, pathName } = this.props;
		let bartitle = "";
		if (pathName == "/settings/more-settings/offer" || pathName == "/settings/more-settings/invoice") {
			bartitle = "Number range";
		} else if (pathName == "/settings/more-settings/customer-categories") {
			bartitle = resources.str_customerCategories;
		} else if (pathName == "/settings/more-settings/customer") {
			bartitle = resources.str_moreSettings;
		} else if (pathName == "/settings/more-settings/article") {
			bartitle = resources.str_units;
		} else if (pathName == "/settings/more-settings/article-categories") {
			bartitle = resources.str_articleCategories;
		}
		return (
			<div className="settings-more-settings-component wrapper-has-topbar-with-margin">
				<TopbarComponent
					title={bartitle}
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
					]}
				/>

				<div className="box">
					<div className="row">
						{pathName == "/settings/more-settings/offer" ||
						pathName == "/settings/more-settings/invoice" ? (
							<div className="col-xs-12">
								{/* <h2 className="u_pb_16">{resources.str_moreSettings}</h2> */}

								<NumerationConfigComponent
									numerationOptions={numerationOptionsData}
									onSave={() => false}
									isWrapped={true}
									resources={resources}
									disabled={!canEditNumericRange}
									pathName={pathName}
								/>
							</div>
						) : null}

						{pathName == "/settings/more-settings/customer-categories" ? (
							<div className="row">
								<div className="col-xs-12">
									<div className="text-h4">{resources.str_customerCategories}</div>
								</div>

								<div className="col-xs-12 u_pbt_20">
									<div className="col-xs-12 u_mb_16 text-muted">
										{resources.moreSettingsCustomerCategoryInfo}
									</div>
									<div className="col-xs-12">
										<TagInputComponent
											hintText={format(
												resources.tagDefaultHintMessage,
												resources.str_customerCategories
											)}
											tagType={resources.str_customerCategory}
											tags={miscellaneousData.customerCategories}
											hiddenTags={[`${resources.str_noInformation}`]}
											resources={resources}
											disabled={!canEditSalutations}
											onSaveTags={(categories) => {
												return invoiz.request(config.settings.endpoints.customer, {
													auth: true,
													method: "POST",
													data: { categories },
												});
											}}
											checkTagBeforeDelete={(tags, tag, callback) => {
												const tagsForDelete = tags.filter((existingTag) => {
													return existingTag !== tag;
												});

												invoiz
													.request(
														`${config.settings.endpoints.getCustomerCategory}/${tag}`,
														{
															auth: true,
														}
													)
													.then((response) => {
														const inUse = response.body.meta.count > 0;

														if (!inUse) {
															return callback(true);
														}

														ModalService.open(
															<TagReplaceModal
																subject={resources.str_customers}
																dataProp={"category"}
																type={resources.str_customerCategory}
																tags={tagsForDelete}
																tagToDelete={tag}
																replaceUrl={
																	config.settings.endpoints.replaceCustomerCategory
																}
																onSaveClick={(setting) => {
																	callback(setting);
																	ModalService.close();
																}}
																onCancelClick={() => {
																	callback(false);
																	ModalService.close();
																}}
																resources={resources}
															/>,
															{
																headline: resources.str_replaceCustomerCategory,
																isCloseable: false,
																width: 425,
																padding: 40,
																noTransform: true,
															}
														);
													});
											}}
										/>
									</div>
								</div>
							</div>
						) : null}
						{pathName == "/settings/more-settings/customer" ? (
							<div className="row u_pb_40">
								<div className="col-xs-12">
									<div className="text-h4">{resources.str_salutations}</div>
								</div>

								<div className="col-xs-12 u_pbt_20">
									<div className="col-xs-12 u_mb_16 text-muted">
										{resources.moreSettingsUpdateSalutationMessage}
									</div>
									<div className="col-xs-12">
										<TagInputComponent
											hintText={resources.moreSettingsUpdateSalutationInfo}
											tagType={resources.str_salutation}
											tags={miscellaneousData.salutations}
											onSaveTags={(salutations) => {
												return invoiz.request(config.settings.endpoints.contact, {
													auth: true,
													method: "POST",
													data: { salutations },
												});
											}}
											resources={resources}
											disabled={!canEditSalutations}
										/>
									</div>
								</div>
							</div>
						) : null}
						{pathName == "/settings/more-settings/customer" ? (
							<div className="row u_pb_40">
								<div className="col-xs-12">
									<div className="text-h4">{resources.str_title}</div>
								</div>

								<div className="col-xs-12 u_pbt_20">
									<div className="col-xs-12 u_mb_16 text-muted">
										{resources.moreSettingsUpdateTitleMessage}
									</div>
									<div className="col-xs-12">
										<TagInputComponent
											hintText={resources.moreSettingsUpdateTitleInfo}
											tagType={"Titel"}
											tags={miscellaneousData.titles}
											onSaveTags={(titles) => {
												return invoiz.request(config.settings.endpoints.contact, {
													auth: true,
													method: "POST",
													data: { titles },
												});
											}}
											resources={resources}
											disabled={!canEditSalutations}
										/>
									</div>
								</div>
							</div>
						) : null}
						{pathName == "/settings/more-settings/customer" ? (
							<div className="row">
								<div className="col-xs-12">
									<div className="text-h4">{resources.str_positions}</div>
								</div>

								<div className="col-xs-12 u_pbt_20">
									<div className="col-xs-12 u_mb_16 text-muted">
										{resources.moreSettingsPositionsInfo}
									</div>
									<div className="col-xs-12">
										<TagInputComponent
											hintText={resources.moreSettingsUpdatePositionsMessage}
											tagType={"Position"}
											tags={miscellaneousData.jobTitles}
											onSaveTags={(jobTitles) => {
												return invoiz.request(config.settings.endpoints.contact, {
													auth: true,
													method: "POST",
													data: { jobTitles },
												});
											}}
											resources={resources}
											disabled={!canEditSalutations}
										/>
									</div>
								</div>
							</div>
						) : null}
						{pathName == "/settings/more-settings/article" ? (
							<div className="row">
								<div className="col-xs-12">
									<div className="text-h4">{resources.str_units}</div>
								</div>

								<div className="col-xs-12 u_pbt_20">
									<div className="col-xs-12 u_mb_16 text-muted">
										{resources.moreSettingsUnitsInfo}
									</div>
									<div className="col-xs-12">
										<TagInputComponent
											hintText={format(
												resources.tagDefaultHintMessage,
												resources.str_articleUnits
											)}
											tagType={resources.str_itemUnit}
											tags={miscellaneousData.articleUnits}
											requiredTags={["Stk."]}
											resources={resources}
											disabled={!canEditSalutations}
											onSaveTags={(units) => {
												return invoiz.request(config.settings.endpoints.article, {
													auth: true,
													method: "POST",
													data: { units },
												});
											}}
											checkTagBeforeDelete={(tags, tag, callback) => {
												const tagsForDelete = tags.filter((existingTag) => {
													return existingTag !== tag;
												});

												invoiz
													.request(`${config.settings.endpoints.getArticleUnits}/${tag}`, {
														auth: true,
													})
													.then((response) => {
														const inUse = response.body.meta.count > 0;

														if (!inUse) {
															return callback(true);
														}

														ModalService.open(
															<TagReplaceModal
																subject={resources.str_article}
																dataProp={"unit"}
																type={resources.str_itemUnit}
																tags={tagsForDelete}
																tagToDelete={tag}
																replaceUrl={
																	config.settings.endpoints.replaceArtilceUnit
																}
																onSaveClick={(setting) => {
																	callback(setting);
																	ModalService.close();
																}}
																onCancelClick={() => {
																	callback(false);
																	ModalService.close();
																}}
																resources={resources}
															/>,
															{
																headline: resources.str_replaceItemUnit,
																isCloseable: false,
																width: 425,
																padding: 40,
																noTransform: true,
															}
														);
													});
											}}
										/>
									</div>
								</div>
							</div>
						) : null}
						{pathName == "/settings/more-settings/article-categories" ? (
							<div className="row">
								<div className="col-xs-12">
									<div className="text-h4">{resources.str_articleCategories}</div>
								</div>

								<div className="col-xs-12 u_pbt_20">
									<div className="col-xs-12 u_mb_16 text-muted">
										{resources.moreSettingsArticleCategoryInfo}
									</div>
									<div className="col-xs-12">
										<TagInputComponent
											hintText={format(
												resources.tagDefaultHintMessage,
												resources.str_articleCategories
											)}
											tagType={resources.str_articleCategory}
											tags={miscellaneousData.articleCategories}
											hiddenTags={[`${resources.str_noInformation}`]}
											resources={resources}
											disabled={!canEditSalutations}
											onSaveTags={(categories) => {
												return invoiz.request(config.settings.endpoints.article, {
													auth: true,
													method: "POST",
													data: { categories },
												});
											}}
											checkTagBeforeDelete={(tags, tag, callback) => {
												const tagsForDelete = tags.filter((existingTag) => {
													return existingTag !== tag;
												});

												invoiz
													.request(`${config.settings.endpoints.getArticleCategory}/${tag}`, {
														auth: true,
													})
													.then((response) => {
														const inUse = response.body.meta.count > 0;

														if (!inUse) {
															return callback(true);
														}

														ModalService.open(
															<TagReplaceModal
																subject={resources.str_articles}
																dataProp={"category"}
																type={resources.str_articleCategory}
																tags={tagsForDelete}
																tagToDelete={tag}
																replaceUrl={
																	config.settings.endpoints.replaceArticleCategory
																}
																onSaveClick={(setting) => {
																	callback(setting);
																	ModalService.close();
																}}
																onCancelClick={() => {
																	callback(false);
																	ModalService.close();
																}}
																resources={resources}
															/>,
															{
																headline: resources.str_replaceArticleCategory,
																isCloseable: false,
																width: 425,
																padding: 40,
																noTransform: true,
															}
														);
													});
											}}
										/>
									</div>
								</div>
							</div>
						) : null}
					</div>
				</div>
			</div>
		);
	}
}

export default SettingsMoreSettingsComponent;
