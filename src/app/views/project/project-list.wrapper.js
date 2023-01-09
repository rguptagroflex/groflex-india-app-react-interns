import React from 'react';
import ProjectListComponent from './project-list.component';
import store from 'redux/store';
import { Provider } from 'react-redux';

class ProjectListWrapper extends React.Component {
    render() {
		return (
			<Provider store={store}>
				<ProjectListComponent />
			</Provider>
		);
	}
}

export default ProjectListWrapper;
