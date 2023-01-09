import React from 'react';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';

const PAGINATION_DEFAULT_PAGE_SIZE = 50;

const PaginationDefaultPageSizes = [
	{ label: '50', value: 50 },
	{ label: '100', value: 100 },
	{ label: '250', value: 250 },
	{ label: '1000', value: 1000 },
];

class ListAdvancedPaginationComponent extends React.Component {
	constructor(props) {
		super(props);

		const gridOptions = props.gridOptions;

		if (gridOptions) {
			gridOptions.pagination = true;
			gridOptions.paginationPageSize = PAGINATION_DEFAULT_PAGE_SIZE;

			gridOptions.onPaginationChanged = () => {
				this.updatePaginationArrows();
				this.updatePaginationNumbers();
			};

			gridOptions.onPaginationChanged = gridOptions.onPaginationChanged.bind(this);
		}

		this.state = {
			isPaginationArrowPrevEnabled: false,
			isPaginationArrowNextEnabled: false,
			paginationPageSize: PAGINATION_DEFAULT_PAGE_SIZE,
		};
	}

	componentDidUpdate(prevProps) {
		const { gridOptions } = this.props;
		const { paginationPageSize } = this.state;

		if (gridOptions && gridOptions.paginationPageSize && gridOptions.paginationPageSize !== paginationPageSize) {
			this.setState({
				paginationPageSize: gridOptions.paginationPageSize,
			});
		}
	}

	componentWillUnmount() {
		this.isUnmounted = true;
	}

	addPaginationNumberElement(pageIndex, addDots, prependDots) {
		const { gridOptions } = this.props;
		let paginationCurrentPage = null;
		let paginationNumberElm = null;

		if (gridOptions.api && gridOptions.api.paginationIsLastPageFound() && this.refs && this.refs.pageNumbers) {
			paginationCurrentPage = gridOptions.api.paginationGetCurrentPage();

			if (addDots && prependDots) {
				paginationNumberElm = $('<div/>', {
					html: '&hellip;',
					class: 'not-clickable',
				});

				paginationNumberElm.appendTo(this.refs.pageNumbers);
			}

			paginationNumberElm = $('<div/>', {
				html: pageIndex + 1,
				'data-number': pageIndex,
				class: pageIndex === paginationCurrentPage ? 'active' : '',
			});

			paginationNumberElm.on('click', () => {
				gridOptions.api.paginationGoToPage(pageIndex);
			});

			paginationNumberElm.appendTo(this.refs.pageNumbers);

			if (addDots && !prependDots) {
				paginationNumberElm = $('<div/>', {
					html: '&hellip;',
					class: 'not-clickable',
				});

				paginationNumberElm.appendTo(this.refs.pageNumbers);
			}
		}
	}

	onPaginatePrevClick() {
		const { gridOptions } = this.props;

		if (gridOptions && gridOptions.api) {
			gridOptions.api.paginationGoToPreviousPage();
		}
	}

	onPaginateNextClick() {
		const { gridOptions } = this.props;

		if (gridOptions && gridOptions.api) {
			gridOptions.api.paginationGoToNextPage();
		}
	}

	updatePaginationArrows() {
		const { gridOptions } = this.props;
		let isPaginationArrowPrevEnabled = true;
		let isPaginationArrowNextEnabled = true;

		if (gridOptions && gridOptions.api) {
			isPaginationArrowPrevEnabled = gridOptions.api.paginationGetCurrentPage() !== 0;
			isPaginationArrowNextEnabled =
				gridOptions.api.paginationGetCurrentPage() !== gridOptions.api.paginationGetTotalPages() - 1;
		}

		if (!this.isUnmounted) {
			this.setState({
				isPaginationArrowPrevEnabled,
				isPaginationArrowNextEnabled,
			});
		}
	}

	updatePaginationNumbers() {
		const { gridOptions } = this.props;

		let currentPagePrevNumber = null;
		let currentPageNextNumber = null;
		let paginationTotalPages = 0;
		let paginationCurrentPage = 0;

		if (gridOptions.api && gridOptions.api.paginationIsLastPageFound() && this.refs && this.refs.pageNumbers) {
			$(this.refs.pageNumbers).html('');
			paginationTotalPages = gridOptions.api.paginationGetTotalPages();
			paginationCurrentPage = gridOptions.api.paginationGetCurrentPage();

			if (paginationTotalPages > 1) {
				currentPagePrevNumber = paginationCurrentPage - 1;
				currentPageNextNumber = paginationCurrentPage + 1;

				if (currentPagePrevNumber > 0) {
					this.addPaginationNumberElement(0, currentPagePrevNumber > 1);
				}

				if (currentPagePrevNumber >= 0) {
					this.addPaginationNumberElement(currentPagePrevNumber);
				}

				this.addPaginationNumberElement(paginationCurrentPage);

				if (currentPageNextNumber < paginationTotalPages) {
					this.addPaginationNumberElement(currentPageNextNumber);
				}

				if (currentPageNextNumber < paginationTotalPages - 1) {
					this.addPaginationNumberElement(
						paginationTotalPages - 1,
						currentPageNextNumber < paginationTotalPages - 2,
						true
					);
				}
			} else {
				this.addPaginationNumberElement(paginationCurrentPage);
			}
		}
	}

	render() {
		const { gridOptions, visible, usePagination } = this.props;
		const { isPaginationArrowPrevEnabled, isPaginationArrowNextEnabled, paginationPageSize } = this.state;

		return usePagination ? (
			<div className={`list-advanced-pagination-component ${visible ? '' : 'hidden'}`}>
				<div>Entries per page</div>

				<SelectInputComponent
					allowCreate={false}
					value={paginationPageSize}
					options={{
						loadOptions: (input, callback) => {
							callback(null, {
								options: PaginationDefaultPageSizes,
							});
						},
						searchable: false,
						clearable: false,
						backspaceRemoves: false,
						labelKey: 'label',
						valueKey: 'value',
						matchProp: 'label',
						handleChange: (option) => {
							if (gridOptions && gridOptions.api && option.value) {
								gridOptions.api.paginationSetPageSize(Number(option.value));

								this.setState(
									{
										paginationPageSize: Number(option.value),
									},
									() => {
										this.updatePaginationArrows();
										this.updatePaginationNumbers();
									}
								);
							}
						},
					}}
				/>

				<div
					className={`icon icon-arr_left ${isPaginationArrowPrevEnabled ? '' : 'disabled'}`}
					onClick={() => this.onPaginatePrevClick()}
				></div>
				<div className="page-numbers" ref="pageNumbers"></div>
				<div
					className={`icon icon-arr_right ${isPaginationArrowNextEnabled ? '' : 'disabled'}`}
					onClick={() => this.onPaginateNextClick()}
				></div>
			</div>
		) : null;
	}
}

export default ListAdvancedPaginationComponent;
