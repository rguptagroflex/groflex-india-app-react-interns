import React from 'react';
import PropTypes from 'prop-types';
import Highlighter from 'react-highlight-words';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import TextWithTagsInput from 'shared/inputs/text-with-tags-input/text-with-tags-input.component';

class TextWithCategoriesInput extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			category: props.defaultOption,
		};
	}

	render() {
		const { category } = this.state;
		const { onSubmit, onCategoryAdd, options, placeholder, dataQsId } = this.props;

		return (
			<div className="text-with-categories-input-wrapper">
				{!!options.length && (
					<SelectInputComponent
						notAsync={true}
						allowCreate={true}
						options={{
							clearable: false,
							searchable: true,
							labelKey: 'name',
							valueKey: 'name',
							placeholder: 'Kategorie hinzufügen',
							handleChange: (option) => {
								if (!option || (option && !option.isDummy && option.name)) {
									if (option && option.name && !option.isExisting) {
										onCategoryAdd &&
											onCategoryAdd(option.name, () => {
												this.setState({ category: option.name });
											});
									} else {
										this.setState({ category: option.name });
									}
								}
							},
							getCustomMarkup: (option, input, label) => {
								return (
									<div className={`category-item u_vc ${option.isDummy ? 'dummy' : ''}`}>
										{option.icon && (
											<div className={`icon ${option.icon} text-primary u_mr_6`}></div>
										)}
										<div className="text-truncate">
											<Highlighter
												autoEscape={true}
												searchWords={[input]}
												textToHighlight={label}
												highlightClassName="selectInputText-matched"
											/>
										</div>
									</div>
								);
							},
							valueRenderer: (value) => {
								return (
									<div className="category-value u_vc">
										{value.icon && <div className={`icon ${value.icon} text-primary u_mr_6`}></div>}
										<div className="category-value-name text-truncate">{value.name}</div>
									</div>
								);
							},
						}}
						loadedOptions={options}
						value={category}
						variant="outlined-rounded"
						dataQsId={dataQsId}
					/>
				)}
				<div className="text-with-tags-input-component-wrapper">
					<TextWithTagsInput
						hasDateSelect={false}
						focusOnRender={true}
						tagifySettings={{ placeholder }}
						onTagSubmit={(text) => {
							onSubmit && onSubmit({ text: text.text, category });
						}}
					/>
				</div>
			</div>
		);
	}
}

TextWithCategoriesInput.propTypes = {
	dataQsId: PropTypes.string,
	defaultOption: PropTypes.string,
	placeholder: PropTypes.string,
	options: PropTypes.array,
	onSubmit: PropTypes.func,
	onCategoryAdd: PropTypes.func,
};

TextWithCategoriesInput.defaultProps = {
	dataQsId: '',
	options: [],
	placeholder: 'Aktivität hinzufügen und per Enter bestätigen',
};

export default TextWithCategoriesInput;
