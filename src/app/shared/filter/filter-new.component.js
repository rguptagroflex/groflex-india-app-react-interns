import React from 'react';

class FilterNewComponent extends React.Component {
	render() {
		const { lastItemSeparator, items, hideCount } = this.props;
		const itemCount = items.length;
		const elements = [];
		items.forEach((filter, index) => {
			if (!!lastItemSeparator && index === itemCount - 1) {
				elements.push(<li className="last-item-separator" key={`filter-item-separator`}></li>);
			}

			elements.push(
				<li
					key={`filter-item-${index}`}
					className={`filter-item ${filter.active ? 'filter-item-active' : ''}`}
					onClick={() => this.onClick(filter)}
				>
					{filter.title} {hideCount ? null : <span className="filter-count">{filter.count}</span>}
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
		if (!filter.active && this.props.onChange) {
			this.props.onChange(filter);
		}
	}
}

FilterNewComponent.defaultProps = {
	items: [],
};

export default FilterNewComponent;
