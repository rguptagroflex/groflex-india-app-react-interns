import _ from "lodash";
import React from "react";
import debounce from "es6-promise-debounce";
import invoiz from "services/invoiz.service";
import config from "config";
import SelectInputComponent from "shared/inputs/select-input/select-input.component";
import { formatCurrency } from "helpers/formatCurrency";

class ArticleSearchSelectComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			articleTitle: this.props.article.title
				? { label: this.props.article.title, key: this.props.article.title }
				: this.props.article.title,
		};
	}

	handleOnBlur(event) {
		const { handleAddOption } = this.props;
		const newArticleName = event.target.value.trim();
		if (newArticleName.length > 0) {
			setTimeout(() => {
				handleAddOption({ value: newArticleName });
				this.setState({ articleTitle: newArticleName });
			}, 100);
		}
	}

	handleOnChange(value) {
		let { articleTitle } = this.state;

		articleTitle = value;
		this.props.handleChange(articleTitle);
		this.setState({ articleTitle });
	}

	getOptions() {
		const loadOptions = (searchTerm) => {
			if (searchTerm.trim().length >= 2) {
				return fetchEanRecords(searchTerm.trim());
			}
		};

		const fetchEanRecords = (searchTerm) => {
			searchTerm = searchTerm;
			return invoiz.request(`${config.getAllEanRecords}${searchTerm}`, { auth: true }).then((response) => {
				const {
					body: { data: eanRecords },
				} = response;
				const mappedOptions = eanRecords.map((eanData) => {
					const { mrp, name } = eanData;

					return { value: eanData.name, label: `${name}, ${formatCurrency(mrp)}`, eanData };
				});

				return { options: mappedOptions };
			});
		};

		return {
			placeholder: "Select or create an article",
			//handleChange,
			//autofocus: true,
			// getCustomLabelToHighlight: option => {
			// 	return `${option.displayLabel || option.label}`;
			// },
			// cache: false,
			labelKey: "label",
			valueKey: "value",
			loadOptions: debounce(loadOptions, 300),
			//onNewOptionClick: handleAddOption,
			handleChange: (option) => this.handleOnChange(option),
		};
	}

	render() {
		const { articleTitle } = this.state;
		return (
			<SelectInputComponent
				containerClass="articleSearchSelectInput"
				// options={options}
				options={this.getOptions()}
				//onBlur={(evt) => this.handleOnBlur(evt)}
				name={"selectInput"}
				value={articleTitle}
				allowCreate={true}
			/>
		);
	}
}

export default ArticleSearchSelectComponent;
