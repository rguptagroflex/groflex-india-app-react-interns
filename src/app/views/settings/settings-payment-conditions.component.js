import React from 'react';
import invoiz from 'services/invoiz.service';
import _, { set } from 'lodash';
import config from 'config';
import ModalService from 'services/modal.service';
import TopbarComponent from 'shared/topbar/topbar.component';
import PaymentOptionsModalComponent from 'shared/modals/payment-options-modal.component';
import PaymentOption from 'models/payment-option.model';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';

import userPermissions from 'enums/user-permissions.enum';

class SettingsPaymentConditionsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			payConditions: props.payConditions,
			viewPaymentTerms: null,
			updatePaymentTerms: null,
			deletePaymentTerms: null,
			setDefaultTerm: null
		};
	}

	componentDidMount () {
		this.setState({
			viewPaymentTerms: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_TERMS_PAYMENT),
			updatePaymentTerms: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_TERMS_PAYMENT),
			deletePaymentTerms: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_TERMS_PAYMENT),
			setDefaultTerm: invoiz.user && invoiz.user.hasPermission(userPermissions.SET_DEFAULT_TERM)
		});
	}

	onDefaultPaymentOptionChange(updatedId) {
		const { resources } = this.props;
		if (!updatedId) {
			return;
		}

		invoiz
			.request(`${config.resourceHost}setting/payCondition/${updatedId}`, {
				auth: true,
				method: 'PUT',
				data: {
					isDefault: true
				}
			})
			.then(response => {
				const { payConditions } = this.state;

				payConditions.forEach(payCondition => {
					payCondition.isDefault = payCondition.id === updatedId;
				});

				this.setState({ payConditions });
				invoiz.page.showToast(resources.paymentTermsChangeSuccess);
			});
	}

	onRemovePaymentConditionClick(deletedPayCondition) {
		const { resources } = this.props;
		if (deletedPayCondition.isDefault) {
			invoiz.page.showToast({ message: resources.payConditionDeleteDefaultErrorMessage, type: 'error' });
			return;
		}

		ModalService.open(resources.payConditionDeleteWarning,
			{
				headline: resources.payConditionDeleteText,
				cancelLabel: resources.str_abortStop,
				confirmIcon: 'icon-trashcan',
				confirmLabel: resources.str_clear,
				confirmButtonType: 'secondary',
				onConfirm: () => {
					ModalService.close();

					invoiz
						.request(`${config.settings.endpoints.payConditions}/${deletedPayCondition.id}`, {
							method: 'DELETE',
							auth: true
						})
						.then(() => {
							const payConditions = [];

							this.state.payConditions.forEach(payCondition => {
								if (payCondition.id !== deletedPayCondition.id) {
									payConditions.push(new PaymentOption(payCondition));
								}
							});

							this.setState({ payConditions });
							invoiz.page.showToast(resources.payConditionDeleteSuccessMessage);
						})
						.catch(error => {
							if (error instanceof Error) {
								invoiz.page.showToast({ type: 'error', message: resources.errorMsg });
							}
						});
				}
			}
		);
	}

	openPaymentOptionModal(editedPaymentOption) {
		const { resources } = this.props;
		const requestUrl =
			`${config.resourceHost}setting/payCondition` + (editedPaymentOption ? `/${editedPaymentOption.id}` : '');

		ModalService.open(
			<PaymentOptionsModalComponent
				invoiceText={''}
				paymentOption={editedPaymentOption}
				onSave={paymentOption => {
					invoiz
						.request(requestUrl, {
							auth: true,
							method: editedPaymentOption ? 'PUT' : 'POST',
							data: paymentOption
						})
						.then(response => {
							if (editedPaymentOption) {
								ModalService.close();
								invoiz.router.reload();
								invoiz.page.showToast(resources.payConditionSaveSuccessMessage);
								return;
							}

							const {
								body: { data: addedPaymentOption }
							} = response;

							let payConditions = this.state.payConditions;

							addedPaymentOption.isDefault = paymentOption.isDefault;

							if (addedPaymentOption.isDefault) {
								payConditions.forEach(payCondition => {
									payCondition.isDefault = false;
								});
							}

							payConditions.push(addedPaymentOption);
							payConditions = this.sortPaymentCondition(payConditions);

							payConditions = payConditions.map(payCondition => {
								return new PaymentOption(payCondition);
							});

							this.setState({ payConditions });

							ModalService.close();
						});
				}}
				resources={resources}
			/>,
			{
				isCloseable: false,
				width: 700,
				modalClass: 'payment-options-modal-component'
			}
		);
	}

	onTopbarButtonClick() {
		this.openPaymentOptionModal();
	}

	sortPaymentCondition(payConditions) {
		return _.sortByOrder(payConditions, ['isDefault', 'sortId', 'name'], ['desc', 'asc', 'asc']);
	}

	render() {
		const { payConditions, viewPaymentTerms, updatePaymentTerms, deletePaymentTerms, setDefaultTerm } = this.state;
		const { resources } = this.props;
		const defaultPaymentOption = payConditions.find(payCondition => payCondition.isDefault);

		return (
			<div className="settings-payment-conditions-component wrapper-has-topbar-with-margin">
				{ viewPaymentTerms ? <TopbarComponent
					title={resources.str_termsOfPaymentTitle}
					viewIcon={`icon-settings`}
					buttonCallback={(ev, button) => this.onTopbarButtonClick()}
					buttons={[
						{
							type: 'primary',
							label: resources.str_createTermsOfPayment,
							buttonIcon: 'icon-plus',
							action: 'create',
							dataQsId: 'settings-PaymentConditions-btn-createPayCondition',
							disabled: !updatePaymentTerms
						}
					]}
				/> : null }
				<div className="box">
					<div className="row">
						<div className="col-xs-12">
							<h2 className="u_pb_16">{resources.str_termsOfPaymentTitle}</h2>
							<div className="u_pb_40 text-muted">
								<p>
									{resources.payConditionTextDescription}
								</p>
								<p>
									{resources.payConditionSubHeadingDescription}
								</p>
							</div>
						</div>
					</div>

					<div className="row">
						<div className="col-xs-12">
							{payConditions.map(payCondition => {
								return payCondition.isBasic ? null : (
									<div
										key={payCondition.id}
										className="col-xs-12 paymentCondition_item"
										data-qs-id="settings-paymentConditions-item-customCondition"
									>
										<div className="row">
											<div className="col-xs-11 u_pbt_20 u_bor_t u_pl_0 paymentCondition_column">
												<div className="row">
													<div className="col-xs-12">
														<div className="text-h6 text-muted u_mb_16">
															{payCondition.name}{' '}
															{payCondition.isDefault ? <span> ({resources.str_standard})</span> : null}
														</div>
														<div className="row text-muted">
															<div className="col-md-6">
																{resources.str_paymentSmall}: {payCondition.displayDueDays}
															</div>
														</div>
														<p className="text-muted preText">{payCondition.invoiceText}</p>
													</div>
												</div>
											</div>
											<div className="col-xs-1 u_pbt_4 u_bor_t u_pr_0 paymentCondition_column u_vc">
												<div className="row">
													<div className="col-xs-12 text-right">
														 { updatePaymentTerms ? <button
															className="button button-square button-small button-primary button-icon-pencil u_mb_8 u_hidden"
															type="button"
															onClick={() => this.openPaymentOptionModal(payCondition)}
														>
															<span className="icon icon-pencil" />
														</button> : null
														}														
													</div>
													<div className="col-xs-12 text-right">
														{ deletePaymentTerms ? <button
															className="button button-square button-small button-secondary remove button-icon-trashcan u_mb_8 u_hidden"
															type="button"
															onClick={() =>
																this.onRemovePaymentConditionClick(payCondition)
															}
														>
															<span className="icon icon-trashcan" />
														</button> : null
														}	
													</div>
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					<div className="row">
						<div className="col-xs-12">
							<h4>{resources.str_standardPaymentTerms}</h4>
						</div>
						<div className="col-xs-12">
							<div className="text-muted u_mt_16">
								{resources.payConditionDefaultTextDescription}
							</div>
						</div>

						<div className="col-xs-6 select-default-option">
							
							<SelectInputComponent
								name="defaultPaymentCondition"
								notAsync={true}
								allowCreate={false}
								options={{
									clearable: true,
									searchable: true,
									labelKey: 'name',
									valueKey: 'value',
									handleChange: option => this.onDefaultPaymentOptionChange(option && option.value)
								}}
								value={defaultPaymentOption.id}
								loadedOptions={payConditions.map(payCondition => {
									return { name: payCondition.name, value: payCondition.id };
								})}
								dataQsId="settings-paymentConditions-editDefaultCondition"
								disabled={!setDefaultTerm}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default SettingsPaymentConditionsComponent;
