import React from 'react';

class PaginationComponent extends React.Component {
	constructor (props) {
		super(props);

		this.state = {
			currentPage: this.props.currentPage,
			totalPages: this.props.totalPages,
			onPaginate: this.props.onPaginate
		};
	}

	componentWillReceiveProps (props) {
		this.setState({
			currentPage: props.currentPage,
			totalPages: props.totalPages
		});
	}

	render () {
		const { currentPage, totalPages } = this.state;
		const controls = [];

		controls.push(
			<div
				onClick={() => this.previousPage()}
				key={`pagination-page-previous`}
				className={`pagination-page ${currentPage === 1 ? 'disabled' : ''}`}
			>
				<div className="icon icon-arr_left" />
			</div>
		);

		controls.push(
			<div
				onClick={() => this.toPage(1)}
				key={`pagination-page-${1}`}
				className={`pagination-page ${currentPage === 1 ? 'active' : ''}`}
			>
				{1}
			</div>
		);

		if (totalPages <= 5) {
			for (let i = 2; i <= totalPages - 1; i++) {
				controls.push(
					<div
						onClick={() => this.toPage(i)}
						key={`pagination-page-${i}`}
						className={`pagination-page ${currentPage === i ? 'active' : ''}`}
					>
						{i}
					</div>
				);
			}
		} else {
			let from = Math.max(2, Math.min(currentPage - 2, totalPages - 5));
			let to = Math.min(from + 4, totalPages - 1);
			let hasEndingDots = false;

			if (from > 2) {
				from++;
				controls.push(
					<div key={`pagination-page-dots-start`} className={`pagination-page pagination-page-dots`}>
						...
					</div>
				);
			}

			if (to < totalPages - 1) {
				to--;
				hasEndingDots = true;
			}

			for (let i = from; i <= to; i++) {
				controls.push(
					<div
						onClick={() => this.toPage(i)}
						key={`pagination-page-${i}`}
						className={`pagination-page ${currentPage === i ? 'active' : ''}`}
					>
						{i}
					</div>
				);
			}

			if (hasEndingDots) {
				controls.push(
					<div key={`pagination-page-dots-end`} className={`pagination-page pagination-page-dots`}>
						...
					</div>
				);
			}
		}

		controls.push(
			<div
				onClick={() => this.toPage(totalPages)}
				key={`pagination-page-${totalPages}`}
				className={`pagination-page ${currentPage === totalPages ? 'active' : ''}`}
			>
				{totalPages}
			</div>
		);

		controls.push(
			<div
				onClick={() => this.nextPage()}
				key={`pagination-page-next`}
				className={`pagination-page ${currentPage === totalPages ? 'disabled' : ''}`}
			>
				<div className="icon icon-arr_right" />
			</div>
		);

		return <div className="pagination-component-wrapper">{controls}</div>;
	}

	toPage (page) {
		this.setState({ currentPage: page }, () => {
			if (this.state.onPaginate) {
				this.state.onPaginate(this.state.currentPage);
			}
		});
	}

	previousPage () {
		this.toPage(this.state.currentPage - 1);
	}

	nextPage () {
		this.toPage(this.state.currentPage + 1);
	}
}

export default PaginationComponent;
