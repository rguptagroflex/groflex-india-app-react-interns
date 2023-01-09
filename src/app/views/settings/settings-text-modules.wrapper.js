import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import SettingsTextModulesComponent from './settings-text-modules.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class SettingsTextModulesWrapper extends React.Component {
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
		const showView = ({ body: { data: textModules } }) => {
			if (!this.ignoreLastFetch) {
				this.setState({
					preFetchData: {
						textModules
					}
				});
			}
		};

		const onFetchError = () => {
			invoiz.router.navigate(`/`);
			invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
		};

		invoiz
			.request(config.settings.endpoints.textModule, { auth: true })
			.then(showView)
			.catch(onFetchError);
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<SettingsTextModulesComponent textModules={preFetchData.textModules} resources={resources} />
		) : (
			<div className="box main">
				<LoaderComponent text={resources.settingsLoadTextModules} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(SettingsTextModulesWrapper);
