import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import Timetracking from 'models/timetracking.model';
import LoaderComponent from 'shared/loader/loader.component';
import TimetrackingEditComponent from 'views/timetracking/timetracking-edit.component';
import { connect } from 'react-redux';

class TimetrackingNewWrapper extends React.Component {
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

    preFetch (searchTerm) {
		const { resources } = this.props;
		let { recipientType } = this.props;
		recipientType = recipientType || 'customer';
		searchTerm = searchTerm || '*';
		const customerId = this.props && this.props.match && this.props.match.params && this.props.match.params.customerId;
		const query = `?type=${recipientType}&search='${encodeURIComponent(searchTerm)}'`;

		invoiz
			.request(`${config.getAllCustomers}${query}`, { auth: true })
			.then(res => {
				if (!this.ignoreLastFetch) {
					this.setState({
						preFetchData: {
							customers: res.body.data,
							customerId: customerId ? parseInt(customerId, 10) : null
						}
					});
				}
			})
			.catch(() => {
				invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
			});
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;
		return preFetchData ? (
			<TimetrackingEditComponent
				customers={preFetchData.customers}
				customerId={preFetchData.customerId}
				timeTracking={new Timetracking()}
				resources={resources}
			/>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.timeTrackingLoadedTime} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(TimetrackingNewWrapper);
