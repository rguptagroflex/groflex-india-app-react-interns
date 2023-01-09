import React from 'react';

class ListAdvancedSearchComponent extends React.Component {
	render() {
		const { value, placeholder, onChange } = this.props;

		return (
			<div className="list-advanced-search-component">
				<div className="input-search">
					<input
						type="text"
						placeholder={placeholder}
						value={value}
						onChange={(evt) => {
							onChange && onChange(evt.target.value);
						}}
					/>
				</div>

				<div className="icon icon-search" />
			</div>
		);
	}
}

ListAdvancedSearchComponent.defaultProps = {
	value: '',
	placeholder: '',
};

export default ListAdvancedSearchComponent;
