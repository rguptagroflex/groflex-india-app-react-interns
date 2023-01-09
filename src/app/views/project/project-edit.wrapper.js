import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import Project from 'models/project.model';
import ProjectEditComponent from 'views/project/project-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class ProjectEditWrapper extends React.Component {
    constructor(props) {
		super(props);
		
		this.state = {
			preFetchData: null
		};
	}

    componentDidMount() {
		this.preFetch();
	}

    componentWillUnmount() {
		this.ignoreLastFetch = true;
	}

    preFetch ()  {
		const { resources } = this.props;
		const id = this.props && this.props.match && this.props.match.params && this.props.match.params.id;

		if (!id) return;

		invoiz
			.request(`${config.resourceHost}project/${id}`, { auth: true })
			.then(response => {
				const { data } = response.body;
				const project = new Project(data);

				if (!this.ignoreLastFetch) {
					this.setState({
						preFetchData: {
							project
						}
					});
				}
			})
			.catch(() => {
				invoiz.router.navigate('/invoices/project');
				invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
			});
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<ProjectEditComponent project={preFetchData.project} resources={resources} />
		) : (
			<div className="box main">
				<LoaderComponent text={resources.projectLoadingProject} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(ProjectEditWrapper);
