import React from 'react';
import CurrencyInputComponent from 'shared/inputs/currency-input/currency-input.component';
import DateInputComponent from 'shared/inputs/date-input/date-input.component';
import HtmlInputComponent from 'shared/inputs/html-input/html-input.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
// import moment from 'moment';
import config from 'config';
import sanitizeNumber from 'helpers/sanitizeNumber';
import { formatApiDate } from 'helpers/formatDate';
import ChangeDetection from 'helpers/changeDetection';

const changeDetection = new ChangeDetection();

class ProjectSettingsComponent extends React.Component {

	componentDidMount() {
		const { project } = this.props;
		setTimeout(() => {
			window.scrollTo(0, 0);
		}, 0);
		setTimeout(() => {
			const original = JSON.parse(JSON.stringify(project));
			changeDetection.bindEventListeners();
			changeDetection.setModelGetter(() => {
				const current = JSON.parse(JSON.stringify(project));

				return {
					original,
					current
				};
			});
		}, 0);
	}

	componentWillUnmount() {
		changeDetection.unbindEventListeners();
	}

	render() {
		const { project, resources } = this.props;

		return (
			<div className="box project-settings">
				<div className="row">
					<div className="col-xs-4 project-settings-left-wrapper">
						<div className="project-settings-left">
							<div className="project-settings-headline">
								{resources.str_project} {project.id ? resources.str_toEdit : resources.str_createSmall}
							</div>
						</div>
					</div>
					<div className="col-xs-8 project-form">
						<div className="row">
							<div className="col-xs-6 project-title">
								<TextInputExtendedComponent
									value={project.title}
									label={resources.str_projectName}
									onChange={val => this.onChange('title', val)}
								/>
							</div>
							<div className="col-xs-6">
								<DateInputComponent
									label={resources.str_projectStart}
									name="startDate"
									value={project.displayStartDate}
									required={true}
									onChange={(name, value) => this.onChange(name, value)}
								/>
							</div>
						</div>

						<div className="row project-settings-budget-row">
							<div className="col-xs-12">
								<CurrencyInputComponent
									value={project.budget}
									label={resources.str_totalBudgetNet}
									onChange={val => this.onChange('budget', val)}
								/>
							</div>
						</div>

						<div className="row">
							<div className="col-xs-12">
								<HtmlInputComponent
									value={project.description}
									label={resources.str_projectDescription}
									onTextChange={val => this.onChange('description', val)}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	onChange(key, value) {
		if (key === 'startDate') {
			// value = moment(value, 'DD.MM.YYYY').format(config.dateFormat.api);
			value = formatApiDate(value);
		}
		if (key === 'budget') {
			const sanitized = sanitizeNumber(value, { precision: config.currencyFormat.precision, thousand: '', decimal: config.currencyFormat.decimal });
			value = (sanitized && sanitized.value) || 0;
		}
		const { project, onChange } = this.props;
		project[key] = value;
		onChange && onChange(project);
	}
}

export default ProjectSettingsComponent;
