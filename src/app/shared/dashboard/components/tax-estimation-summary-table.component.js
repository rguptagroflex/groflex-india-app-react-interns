import React from 'react';
import { formatCurrency } from 'helpers/formatCurrency';

class TaxEstimationSummaryTable extends React.Component {
	constructor(props) {
		super(props);
		this.isNetProfitNegative = false;
		this.isCapitalCompany = false;
	}

	componentDidMount() {
		this.calculateMaxTaxValueWidth();
	}

	componentDidUpdate() {
		this.calculateMaxTaxValueWidth();
	}

	calculateMaxTaxValueWidth() {
		const taxValueWidths = [];
		let maxTaxValueWidth = 0;

		$('.net-profit-summary-table .tax-value').each((idx, elm) => {
			$(elm).width('auto');
			taxValueWidths.push($(elm).width());
		});

		maxTaxValueWidth = Math.max.apply(Math, taxValueWidths);

		$('.net-profit-summary-table .tax-value').each((idx, elm) => {
			$(elm).width(maxTaxValueWidth + 20);
		});
	}

	formatData(data) {
		this.tradeTax = formatCurrency(data.tradeTax);
		this.grossExpenses = formatCurrency(data.grossExpenses);
		this.netProfit = formatCurrency(data.netProfit);
		this.grossTurnover = formatCurrency(data.grossTurnover);
		this.salesTax = formatCurrency(data.salesTax);

		if (data.corporateTax > 0 && data.solidarityTax > 0) {
			this.isCapitalCompany = true;
			this.incomeTax = formatCurrency(data.corporateTax + data.solidarityTax);
		} else {
			this.isCapitalCompany = false;
			this.incomeTax = formatCurrency(data.incomeTax);
		}

		this.isNetProfitNegative = false;

		if (data.netProfit <= 0) {
			this.isNetProfitNegative = true;
			this.tradeTax = this.incomeTax = formatCurrency(0);
		}
	}

	render() {
		const { resources } = this.props;
		this.formatData(this.props.data);

		return (
			<div className="col-xs-5 net-profit-summary-table">
				<div className="col-xs-12 col-no-gutter-left">
					<div className="table-header">
						<div className="table-col-left">{resources.str_grossSales}</div>
						<div className="table-col-right">{this.grossTurnover}</div>
					</div>

					<div className="table-row">
						<div className="table-col-left">
							<div className="chart-legend-dot legend-expenses" />
							<span>{resources.str_expenses}</span>
						</div>
						<div className="table-col-right">
							<span className="tax-value">
								<span className="label-minus">-</span>
								{this.grossExpenses}
							</span>
						</div>
					</div>

					<div className="table-row">
						<div className="table-col-left">
							<div className="chart-legend-dot legend-salestax" />
							<span>{resources.str_valueAddedTax}</span>
						</div>
						<div className="table-col-right">
							<span className="tax-value">
								<span className="label-minus">-</span>
								{this.salesTax}
							</span>
						</div>
					</div>

					<div className="table-row">
						<div className="table-col-left">
							<div className="chart-legend-dot legend-tradetax" />
							<span>{resources.str_businessTax}</span>
						</div>
						<div className="table-col-right">
							<span className="tax-value">
								{this.isNetProfitNegative ? null : <span className="label-minus">-</span>}
								{this.tradeTax}
							</span>
						</div>
					</div>

					<div className="table-row">
						<div className="table-col-left">
							<div className="chart-legend-dot legend-incometax" />
							{this.isCapitalCompany ? (
								<span>
									{resources.str_corporateTaxText}
									<br />
									<span className="legend-small">{resources.str_solidaritySurcharge}</span>
								</span>
							) : (
								<span>{resources.str_incomeTax}</span>
							)}
						</div>
						<div className="table-col-right">
							<span className="tax-value">
								{this.isNetProfitNegative ? null : <span className="label-minus">-</span>}
								{this.incomeTax}
							</span>
						</div>
					</div>

					<div className={'table-footer ' + (this.isNetProfitNegative ? 'negative-value' : null)}>
						<div className="table-col-left">{resources.str_yours}</div>
						<div className="table-col-right">{this.netProfit}</div>
					</div>
				</div>
			</div>
		);
	}
}

export default TaxEstimationSummaryTable;
