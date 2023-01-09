import invoiz from 'services/invoiz.service';
import React from 'react';
import { connect } from 'react-redux';
import { dateConstants } from 'helpers/constants';
import ButtonComponent from 'shared/button/button.component';
import ModalService from 'services/modal.service';
import TaxEstimationConfigurationComponent from 'shared/modals/dashboard-tax-estimation-configuration.component';
import config from 'config';
import WidgetComponent from 'shared/dashboard/components/widget.component';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import TabInputComponent from 'shared/inputs/tab-input/tab-input.component';
import TaxEstimationDonutChart from 'shared/dashboard/components/tax-estimation-donut-chart.component';
import TaxEstimationSummaryTable from 'shared/dashboard/components/tax-estimation-summary-table.component';
import { checkAchievementNotification } from 'helpers/checkAchievementNotification';

import { toggleState, fetchTaxEstimationStats } from 'redux/ducks/dashboard/taxEstimationStats';

const { YEAR: STATE_YEAR, MONTH: STATE_MONTH } = dateConstants;

class DashboardTaxEstimationStatsComponent extends React.Component {
	constructor(props) {
		super(props);
		this.title = this.props.resources.taxTitle;
		this.subTitle = '';

		this.openConfigModal = this.openConfigModal.bind(this);
		this.initConfigModal = this.initConfigModal.bind(this);
	}

	componentDidMount() {
		this.props.changeTabInputValue(STATE_YEAR);
		this.refresh();

		invoiz.off('triggerDashboardTaxEstimationModal');

		invoiz.on('triggerDashboardTaxEstimationModal', () => {
			this.initConfigModal();
		});
	}

	initConfigModal() {
		const year = new Date().getFullYear();
		invoiz
			.request(`${config.resourceHost}setting/account`, {
				auth: true,
				method: 'GET'
			})
			.then(companyTypeResponse => {
				const { companyType } = companyTypeResponse.body.data;

				invoiz
					.request(`${config.resourceHost}estimationSetting/year/${year}`, {
						auth: true,
						method: 'GET'
					})
					.then(response => {
						const {
							id,
							companyAddress: { zipCode, city },
							incomeTaxRate,
							totalProfit
						} = response.body.data;
						this.openConfigModal({ id, companyType, zipCode, city, incomeTaxRate, totalProfit });
					})
					.catch(() => {
						this.openConfigModal({ companyType });
					});
			});
	}

	openConfigModal(settings) {
		const { resources } = this.props;
		ModalService.open(
			<TaxEstimationConfigurationComponent
				resources={resources}
				data={settings}
				onSave={modalResponse => {
					const {
						id,
						companyType,
						zip,
						city,
						estimatedProfit,
						taxRate,
						isCapitalCompanySelected
					} = modalResponse;
					const year = new Date().getFullYear();
					const method = id ? 'PUT' : 'POST';

					let url = `${config.resourceHost}estimationSetting`;
					url += id ? '/' + id : '';

					invoiz
						.request(`${config.resourceHost}setting/account`, {
							auth: true,
							method: 'POST',
							data: {
								companyType
							}
						})
						.then(() => {
							invoiz
								.request(url, {
									auth: true,
									method,
									data: {
										year,
										companyAddress: {
											zipCode: zip,
											city
										},
										totalProfit: isCapitalCompanySelected ? 0 : estimatedProfit,
										incomeTaxRate: isCapitalCompanySelected ? 0 : taxRate
									}
								})
								.then(response => {
									invoiz.router.reload();
									this.refresh();
									checkAchievementNotification();
								});
						});
				}}
			/>,
			{
				width: 500,
				padding: '40px 40px 40px',
				isCloseable: false
			}
		);
	}

	render() {
		const {
			isLoading,
			statsErrorOccurred,
			isEstimationActivated,
			tradeTaxCalculationNotPossible,
			salesData: salesDataProps,
			headerData: headerDataProps,
			changeTabInputValue,
			toggleState,
			resources
		} = this.props;

		this.subTitle = headerDataProps[toggleState];

		const salesData = salesDataProps[toggleState];
		const isCapitalCompany = salesData.corporateTax > 0 && salesData.solidarityTax > 0;

		const chartData = {
			series: [
				{
					name: 'netProfit',
					meta: 'Deins',
					className: 'ct-series-netProfit',
					data: salesData.netProfit
				},
				{
					name: 'incomeTax',
					meta: isCapitalCompany ? 'Körperschaftssteuer inkl. Solidaritätszuschlag' : 'Einkommensteuer',
					className: 'ct-series-incomeTax',
					data: isCapitalCompany ? salesData.corporateTax + salesData.solidarityTax : salesData.incomeTax
				},
				{
					name: 'tradeTax',
					meta: 'Gewerbesteuer',
					className: 'ct-series-tradeTax',
					data: salesData.tradeTax
				},
				{
					name: 'salesTax',
					meta: 'Umsatzsteuer',
					className: 'ct-series-salesTax',
					data: salesData.salesTax
				},
				{
					name: 'expenses',
					meta: 'Ausgaben',
					className: 'ct-series-expenses',
					data: salesData.grossExpenses
				}
			]
		};

		const rightComponents = [
			<TabInputComponent
				key="toggleYearMonth"
				items={[{ label: resources.str_year, value: STATE_YEAR }, { label: resources.str_month, value: STATE_MONTH }]}
				value={STATE_YEAR}
				componentClass="dashboard-tab-input"
				onChange={changeTabInputValue}
				dataQsId="dashboard-taxEstimation-tabs-yearMonth"
			/>
		];

		const content = statsErrorOccurred ? (
			<div>
				<div className="btn-edit-tax-estimation">
					<button
						className="button button-square button-primary button-icon-pencil notes_editButton"
						onClick={this.initConfigModal}
						data-qs-id="dashboard-taxEstimation-btn-corner-configure-1"
					/>
				</div>
				<WidgetErrorComponent
					reason={resources.saleDefaultErrorText}
					buttonTitle={resources.str_updateNow}
					onButtonClick={this.refresh.bind(this)}
				/>
			</div>
		) : (
			<div>
				{isEstimationActivated ? (
					<div className="btn-edit-tax-estimation">
						<button
							className="button button-square button-inverted-grey button-icon-pencil notes_editButton"
							onClick={this.initConfigModal}
							data-qs-id="dashboard-taxEstimation-btn-corner-configure-2"
						/>
					</div>
				) : null}
				<div className="tax-estimation-container">
					<div className="u_mb_32">
						<div className="row chartHeader">
							<div className="col-xs-6">
								<div className="text-h4 u_mb_0">{this.title}</div>
								<div className="text-muted widget-subheadline">{this.subTitle}</div>
							</div>
							<div className="col-xs-6">{isEstimationActivated ? rightComponents : null}</div>
						</div>
					</div>
					{isEstimationActivated ? (
						<div className="row">
							{salesData.netProfit <= 0 ||
							tradeTaxCalculationNotPossible ||
							(salesData.grossExpenses === 0 && salesData.grossTurnover === 0) ? (
									<div className="col-xs-7">
										<div className="donut-chart-wrapper">
											<div className="tax-estimation-placeholder-chart">
												{tradeTaxCalculationNotPossible ? (
													<div className="tax-estimation-placeholder-info">
														{resources.noBusinessTaxRateText}
														<br />
														<br />
														{resources.tradeTaxNotCalculateText1}
														<br />
														{resources.tradeTaxNotCalculateText2}
													</div>
												) : salesData.grossExpenses === 0 && salesData.grossTurnover === 0 ? (
													<div className="tax-estimation-placeholder-info">
														{resources.noViewingPperiodText}
														<br />
														<br />
														{resources.presentationNotPossibleText}
													</div>
												) : (
													<div className="tax-estimation-placeholder-info">
														{resources.representationNotPossibleText}
														<br />
														<br />
														{resources.greaterThanSalesText}
													</div>
												)}
											</div>
										</div>
									</div>
								) : (
									<TaxEstimationDonutChart
										target="taxEstimationStats"
										data={chartData}
										netProfit={salesData.netProfit}
										grossTurnover={salesData.grossTurnover}
										resources={resources}
									/>
								)}
							<TaxEstimationSummaryTable data={salesData} resources={resources} />
						</div>
					) : (
						<div className="tax-estimation-placeholder-box">
							<div className="tax-estimation-placeholder-info">
								{resources.taxEstimatorText}
							</div>
							<ButtonComponent
								callback={() => this.initConfigModal()}
								dataQsId="dashboard-taxEstimation-btn-configure"
								label={resources.str_startedNow}
							/>
						</div>
					)}
				</div>
			</div>
		);

		return (
			<WidgetComponent
				loaderText={resources.saleLoaderText}
				loading={isLoading}
				containerClass={'box-small-padding box-large-bottom dashboard-tax-estimation-wrapper'}
			>
				{content}
			</WidgetComponent>
		);
	}

	refresh() {
		this.props.fetchTaxEstimationStats();
	}
}

const mapStateToProps = state => {
	const {
		isLoading,
		statsErrorOccurred,
		isEstimationActivated,
		tradeTaxCalculationNotPossible,
		toggleState,
		salesData,
		headerData
	} = state.dashboard.taxEstimationStats;

	const { resources } = state.language.lang;

	return {
		isLoading,
		statsErrorOccurred,
		isEstimationActivated,
		tradeTaxCalculationNotPossible,
		toggleState,
		headerData,
		salesData,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		changeTabInputValue: value => {
			dispatch(toggleState(value));
		},
		fetchTaxEstimationStats: () => {
			dispatch(fetchTaxEstimationStats());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(DashboardTaxEstimationStatsComponent);
