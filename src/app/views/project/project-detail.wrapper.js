import invoiz from 'services/invoiz.service';
import React from 'react';
import q from 'q';
import config from 'config';
import Project from 'models/project.model';
import LoaderComponent from 'shared/loader/loader.component';
import ProjectDetailComponent from 'views/project/project-detail.component';
import { connect } from 'react-redux';

class ProjectDetailWrapper extends React.Component {
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

		const fetchInvoiceData = () => {
			return invoiz.request(`${config.resourceHost}project/${id}`, { auth: true });
		};

		const showDetailsView = ({ body: { data: project } }) => {
			try {
				if (!this.ignoreLastFetch) {
					this.setState({
						preFetchData: {
							project: new Project(project)
						}
					});
				}
			} catch (err) {
				console.log(err);
			}
		};

		const onFetchError = response => {
			invoiz.router.navigate(`/invoices/project`);
			invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
		};

		q.fcall(fetchInvoiceData)
			.then(showDetailsView)
			.catch(onFetchError)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<ProjectDetailComponent project={preFetchData.project} resources={resources} />
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

export default connect(mapStateToProps)(ProjectDetailWrapper);
