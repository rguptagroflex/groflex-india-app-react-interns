import React from 'react';

class FilterComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			items: this.props.items || [],
			onChange: this.props.onChange
		};
	}

	componentWillReceiveProps(props) {
		this.setState({
			items: props.items || [],
			onChange: props.onChange
		});
	}

	render() {
		const { resources } = this.props;
		const elements = [];
		this.state.items.forEach((filter, index) => {
			elements.push(
				<li
					key={`filter-item-${index}`}
					className={`filter-item ${filter.active ? 'filter-item-active' : ''}`}
					onClick={() => this.onClick(filter)}
				>
					{/* {filter.title} */}
					{resources.filterHeader[filter.resouceKey]} {this.props.hideCount ? null : <span className="filter-count">{filter.count}</span>}
				</li>
			);
		});
		return (
			<div className="filter-component-wrapper">
				<ul>{elements}</ul>
			</div>
		);
	}

	onClick(filter) {
		if (!filter.active && this.state.onChange) {
			this.state.onChange(filter);
		}
	}
}

export default FilterComponent;
