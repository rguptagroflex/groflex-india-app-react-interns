import React from "react";
import SettingsUserComponent from "views/settings/settings-user.component";

class SettingsUserWrapper extends React.Component {
	render() {
		return <SettingsUserComponent resources={this.resources} />;
		// return (<div>User setting dashboard</div>);
	}
}

export default SettingsUserWrapper;
