import invoiz from 'services/invoiz.service';
import React from 'react';
import TopbarComponent from 'shared/topbar/topbar.component';
import ProjectSettingsComponent from 'shared/project-settings/project-settings.component';
import config from 'config';

class ProjectSettingsEditComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			project: props.project
		};
	}
	render() {
		const { project } = this.state;
		const { resources } = this.props;

		return (
			<div className="project-settings-edit wrapper-has-topbar-with-margin">
				<TopbarComponent
					title={resources.str_editProject}
					hasCancelButton={true}
					buttonCallback={() => this.save()}
					buttons={[
						{
							type: 'primary',
							label: resources.str_toSave,
							buttonIcon: 'icon-check'
						}
					]}
				/>

				<ProjectSettingsComponent
					project={project}
					onChange={project => {
						this.setState({ project });
					}}
					resources={resources}
				/>
			</div>
		);
	}

	save() {
		const { project } = this.state;
		const { resources } = this.props;
		invoiz
			.request(`${config.resourceHost}project/${project.id}`, { auth: true, method: 'PUT', data: project })
			.then(() => {
				invoiz.router.navigate(`/project/${project.id}`);
			})
			.catch(() => {
				invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
			});
	}
}

export default ProjectSettingsEditComponent;
