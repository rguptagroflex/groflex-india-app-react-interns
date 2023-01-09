import React from 'react';

class ListSearchComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			value: this.props.value || '',
			placeholder: this.props.placeholder || '',
			onChange: this.props.onChange
		};
	}

	componentWillReceiveProps(props) {
		this.setState({
			value: props.value || '',
			placeholder: props.placeholder || '',
			onChange: props.onChange
		});
	}

	render() {
		const { value, placeholder, onChange } = this.state;

		return (
			<div className="list-search-component">
				<div className="icon icon-search" />
				<div className="input-search">
					<input
						type="text"
						placeholder={placeholder}
						value={value}
						onChange={evt => {
							onChange && onChange(evt.target.value);
						}}
					/>
				</div>
			</div>
		);
	}
}

export default ListSearchComponent;
