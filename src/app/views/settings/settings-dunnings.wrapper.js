import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import SettingsDunningsComponent from './settings-dunnings.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class SettingsDunningsWrapper extends React.Component {
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
		const showView = ({ body: { data } }) => {
			const dunningLevel = {
				paymentReminder: data.find(dunning => dunning.dunningLevel === 'paymentReminder'),
				firstReminder: data.find(dunning => dunning.dunningLevel === 'firstReminder'),
				secondReminder: data.find(dunning => dunning.dunningLevel === 'secondReminder'),
				lastReminder: data.find(dunning => dunning.dunningLevel === 'lastReminder')
			};

			if (!this.ignoreLastFetch) {
				this.setState({
					preFetchData: {
						dunningLevel
					}
				});
			}
		};

		const onFetchError = () => {
			invoiz.router.navigate('/');
			invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
		};

		invoiz
			.request(config.settings.endpoints.dunningLevel, { auth: true })
			.then(showView)
			.catch(onFetchError);
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<SettingsDunningsComponent dunningLevel={preFetchData.dunningLevel} resources={resources} />
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

export default connect(mapStateToProps)(SettingsDunningsWrapper);
