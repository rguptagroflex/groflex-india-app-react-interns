import React from 'react';
import Decimal from 'decimal.js';
import invoiz from 'services/invoiz.service';
import { convertToWords } from 'helpers/convertRupeesIntoWords';

// ---------------------------------------------------------------------------- //
//       This file must be copied 1:1 from app/impress to customer-center       //
// ---------------------------------------------------------------------------- //

class ImpressArticleListComponent extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			columns: props.columns,
			positions: props.positions,
			priceKind: props.priceKind,
			smallBusiness: props.smallBusiness
		};
	}

	componentWillReceiveProps (newProps) {
		const { columns, positions, smallBusiness } = newProps;

		const diffVatValues = [];
		positions.forEach(pos => {
			if (diffVatValues.indexOf(pos.vat) === -1) {
				diffVatValues.push(pos.vat);
			}
		});

		const priceColumn = columns.find(col => col.name === 'price');

		const forceVatColumn = diffVatValues.length > 1;
		const forceAmountColumn = positions.filter(pos => pos.amount > 1).length > 0;
		const forcePriceAndDiscountColumn = positions.filter(pos => pos.discountPercent > 0).length > 0;
		const totalEditable = !priceColumn || (!priceColumn.active && !forceAmountColumn);

		columns.forEach(column => {
			switch (column.name) {
				case 'amount': {
					column.active = forceAmountColumn ? true : column.active;
					column.required = !!forceAmountColumn;
					break;
				}

				case 'vat': {
					if (smallBusiness) {
						column.active = false;
						column.required = false;
						column.hidden = true;
					} else {
						column.active = forceVatColumn ? true : column.active;
						column.required = !!forceVatColumn;
					}
					break;
				}

				case 'price': {
					column.active = forcePriceAndDiscountColumn ? true : column.active;
					column.required = !!forcePriceAndDiscountColumn;
					break;
				}

				case 'discount': {
					column.active = forcePriceAndDiscountColumn ? true : column.active;
					column.required = !!forcePriceAndDiscountColumn;
					break;
				}

				case 'total': {
					column.editable = totalEditable;
				}
			}
		});

		this.setState({
			columns: newProps.columns,
			positions: newProps.positions
		});
	}

	createPositionColumn (position, column) {
		const { formatCurrency } = this.props;
		let element;

		switch (column.name) {
			case 'description': {
				const value = position['title'] || '';
				element = value;
				break;
			}

			case 'hsnSacCode': {
				element = position['hsnSacCode'] || '';
				break;
			}

			case 'number': {
				const { metaData } = position;
				element = (metaData && metaData.number) || position.number || <span>&mdash;</span>;
				break;
			}

			case 'amount': {
				const value = position[column.name] || 0;
				element = `${value} ${position.unit}`;
				break;
			}

			case 'vat': {
				const value = position['vatPercent'] || 0;
				element = `${value}%`;
				break;
			}

			case 'price': {
				const { priceKind, smallBusiness } = this.props;

				const price =
					smallBusiness || priceKind === 'net'
						? parseFloat(position.priceNet)
						: parseFloat(position.priceGross);
				element = formatCurrency(price);
				break;
			}

			case 'discount': {
				element = `${position.discountPercent}%`;
				break;
			}

			case 'total': {
				const { priceKind, smallBusiness } = this.props;

				element = formatCurrency(
					smallBusiness || priceKind === 'net'
						? position.totalNetAfterDiscount
						: position.totalGrossAfterDiscount
				);
				break;
			}
		}

		return element;
	}

	createPositionElements () {
		const { columns, positions } = this.props;

		const activeColumns = columns.filter(col => col.active);
		const positionItems = positions.map(position => {
			const cols = activeColumns.map((col, i) => {
				const element = this.createPositionColumn(position, col);
				return (
					<div
						className={`articles-item-column articles-item-column-${col.name} inline`}
						key={`articles-item-column-${i}`}
					>
						{element}
						{col.name === 'description' ? (
							<div dangerouslySetInnerHTML={{ __html: position.description }} className="description" />
						) : null}
					</div>
				);
			});

			return (
				<div className="articles-item" key={`articles-item-${position.id}`}>
					<div className="articles-item-columns">{cols}</div>
				</div>
			);
		});

		const positionItemsResponsive = positions.map(position => {
			return (
			  <div className="articles-item responsive" key={`articles-item-${position.id}`}>
				<div className="articles-item-columns-responsive">
				  {activeColumns.find(col => col.name === 'number') ? (
					<div className={`articles-item-column articles-item-column-number`}>
					  <span>{activeColumns.find(col => col.name === 'number').label}</span> {this.createPositionColumn(position, { name: 'number' })}
					</div>
				  ) : null}
	  
				  <div className="articles-item-columns-responsive-content">
					<div className="articles-item-column-left">
					  {activeColumns.find(col => col.name === 'description') ? (
						<div>
						  <div className={`articles-item-column articles-item-column-description`}>
							{activeColumns.find(col => col.name === 'amount') ? (
							  <span className="inline-amount">
								{this.createPositionColumn(position, { name: 'amount' })}{' '}
							  </span>
							) : null}
							{this.createPositionColumn(position, { name: 'description' })}
						  </div>
						  <div dangerouslySetInnerHTML={{ __html: position.description }} className="description" />
						</div>
					  ) : null}
					</div>
	  
					<div className="articles-item-column-right">
					  {activeColumns.find(col => col.name === 'total') ? (
						<div className={`articles-item-column articles-item-column-total`}>
						  {this.createPositionColumn(position, { name: 'total' })}
						</div>
					  ) : null}
	  
					  {activeColumns.find(col => col.name === 'vat') ? (
						<div className={`articles-item-column articles-item-column-vat`}>
						  <span>{activeColumns.find(col => col.name === 'vat').label}</span> {this.createPositionColumn(position, { name: 'vat' })}
						</div>
					  ) : null}
	  
					  {activeColumns.find(col => col.name === 'discount') ? (
						<div className={`articles-item-column articles-item-column-discount`}>
						  <span>{activeColumns.find(col => col.name === 'discount').label}</span> {this.createPositionColumn(position, { name: 'discount' })}
						</div>
					  ) : null}
					</div>
				  </div>
				</div>
			  </div>
			);
		  });

		// return positionItems;
		return (
			<div>
			  {positionItemsResponsive}
			  {positionItems}
			</div>
		  );
	}

	handleGstDetails (vatPercent, vatValue, vats) {
		const { customerData, resources } = this.props;
		const igstLable = resources.str_igst;
		const cgstLable = resources.str_cgst;
		const sgstLable = resources.str_sgst;
		if (customerData && customerData.indiaState && customerData.indiaState.id && invoiz.user.indiaStateId) {
			if (invoiz.user.indiaStateId === customerData.indiaState.id) {
				vats.push({ label: cgstLable, vatPercent: vatPercent / 2, value: vatValue / 2 });
				vats.push({ label: sgstLable, vatPercent: vatPercent / 2, value: vatValue / 2 });
			} else {
				vats.push({ label: igstLable, vatPercent, value: vatValue });
			}
		} else if (invoiz.user.indiaStateId) {
			vats.push({ label: cgstLable, vatPercent: vatPercent / 2, value: vatValue / 2 });
			vats.push({ label: sgstLable, vatPercent: vatPercent / 2, value: vatValue / 2 });
		}
	}

	createTotalElement () {
		const { priceKind, positions, smallBusiness, formatCurrency, resources } = this.props;

		if (!priceKind || !positions) {
			return null;
		}

		let totalNet = 0;
		let totalGross = 0;
		let totalNetElement = null;
		let totalGrossElement = null;
		let totalElement = null;
		const vats = [];
		const vatOptions = invoiz.user.vatCodes;
		if (smallBusiness || priceKind === 'net') {
			totalNet = positions.reduce((a, b) => a + b.totalNetAfterDiscount, 0);
			totalNetElement = (
				<div className="article-list-total article-list-total-net">
					<div className="column-left">{resources.str_totalNet}</div>
					<div className="column-right">{formatCurrency(totalNet)}</div>
				</div>
			);
			let newVat = null;
			positions && positions.length !== 0 && vatOptions.map(vatObj => {
				newVat = positions
					.filter(pos => pos.vatPercent === vatObj.value)
					.reduce(
						(a, b) => a + b.totalNetAfterDiscount * (vatObj.value / 100), 0);
				const vatValue = new Decimal(newVat).toDP(2).toNumber();
				if (vatValue > 0) {
					this.handleGstDetails(vatObj.value, vatValue, vats);
				}
			});

			// const vat19 = positions
			// 	.filter(pos => pos.vatPercent === 19)
			// 	.reduce((a, b) => a + b.totalNetAfterDiscount * 0.19, 0);
			// const vat7 = positions
			// 	.filter(pos => pos.vatPercent === 7)
			// 	.reduce((a, b) => a + b.totalNetAfterDiscount * 0.07, 0);
			// const vat19Value = new Decimal(vat19).toDP(2).toNumber();
			// const vat7Value = new Decimal(vat7).toDP(2).toNumber();
			// if (vat19Value > 0) {
			// 	vats.push({ vatPercent: 19, value: vat19Value });
			// }
			// if (vat7Value > 0) {
			// 	vats.push({ vatPercent: 7, value: vat7Value });
			// }

			const totalValue = smallBusiness ? totalNet : totalNet + vats.reduce((a, b) => a + b.value, 0);
			totalElement = (
				<div className="article-list-total">
					<div className="column-left">{resources.str_total}</div>
					<div className="column-right">{formatCurrency(totalValue)}</div>
				</div>
			);
		} else {
			totalGross = positions.reduce((a, b) => a + b.totalGrossAfterDiscount, 0);
			totalGrossElement = (
				<div className="article-list-total">
					<div className="column-left">{resources.str_total}</div>
					<div className="column-right">{formatCurrency(totalGross)}</div>
				</div>
			);
			let totalNetVat = null;
			positions && positions.length !== 0 && vatOptions.map(vatObj => {
				totalNetVat = positions
					.filter(pos => pos.vatPercent === vatObj.value)
					.reduce(
						(a, b) => a + (b.totalGrossAfterDiscount - b.totalGrossAfterDiscount / ((100 + vatObj.value) / 100)), 0);
				const vatValue = new Decimal(totalNetVat).toDP(2).toNumber();
				if (vatValue > 0) {
					this.handleGstDetails(vatObj.value, vatValue, vats);
				}
			});

			// const totalNet19 = positions
			// 	.filter(pos => pos.vatPercent === 19)
			// 	.reduce((a, b) => a + (b.totalGrossAfterDiscount - b.totalGrossAfterDiscount / 1.19), 0);
			// const totalNet7 = positions
			// 	.filter(pos => pos.vatPercent === 7)
			// 	.reduce((a, b) => a + (b.totalGrossAfterDiscount - b.totalGrossAfterDiscount / 1.07), 0);
			// const vat19Value = new Decimal(totalNet19).toDP(2).toNumber();
			// const vat7Value = new Decimal(totalNet7).toDP(2).toNumber();
			// if (vat19Value > 0) {
			// 	vats.push({ vatPercent: 19, value: vat19Value });
			// }
			// if (vat7Value > 0) {
			// 	vats.push({ vatPercent: 7, value: vat7Value });
			// }
		}
		const vatElements = vats.map(vatObj => {
			return (
				<div className="article-list-total-vat" key={`article-list-total-vat-${vatObj.vatPercent}-${vatObj.label}`}>
					<div className="column-left">
						{priceKind === 'net' ? '' : resources.str_contains} {vatObj.label} {vatObj.vatPercent}%
					</div>
					<div className="column-right">{formatCurrency(vatObj.value)}</div>
				</div>
			);
		});

		return (
			<div className="article-list-total-component">
				<div className="article-list-total-content">
					{!smallBusiness && totalNetElement}
					{!smallBusiness && totalGrossElement}
					{!smallBusiness && vatElements}
					{totalElement}
				</div>
			</div>
		);
	}

	createTotalInWordsElement() {
		const { totalGross, resources } = this.props;
		return (
			<div className="impress-edit-positions-totalInWords">
				{totalGross ? `${resources.str_totalInWords}: ${convertToWords(totalGross)} ${resources.str_only}` : ''}
			</div>
		);
	}

	render () {
		const { columns, positions, priceKind } = this.props;

		if (!priceKind || !positions || !columns) {
			return null;
		}

		const displayedColumns = columns
			.filter(column => column.active)
			.map((column, index) => {
				if (column.hidden) {
					return null;
				}
				return (
					<div
						className={`articles-head-column articles-head-column-${column.name}`}
						key={`articles-head-column-${index}`}
					>
						<div className="articles-head-column-value">{column.label}</div>
						{column.name === 'total' ? <div className="articles-head-column-value-responsive">Amount</div> : null}
					</div>
				);
			});

		return (
			<div className={`impress-article-list`}>
				<div className="articles-head">{displayedColumns}</div>

				<div className="articles-items">{this.createPositionElements()}</div>

				{this.createTotalElement()}

				{this.createTotalInWordsElement()}
			</div>
		);
	}
}

export default ImpressArticleListComponent;
