import React from "react";
import TeamsComponent from "./teams.component";

class TeamsWrapperComponent extends React.Component {
	render() {
		return <TeamsComponent resources={this.resources} />;
	}
}

export default TeamsWrapperComponent;
