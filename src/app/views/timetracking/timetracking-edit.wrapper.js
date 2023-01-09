import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import q from 'q';
import Timetracking from 'models/timetracking.model';
import LoaderComponent from 'shared/loader/loader.component';
import TimetrackingEditComponent from 'views/timetracking/timetracking-edit.component';
import { connect } from 'react-redux';

class TimetrackingEditWrapper extends React.Component {
	constructor() {
		super();
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
		const id = this.props && this.props.match && this.props.match.params && this.props.match.params.id;
		const query = `?type=${recipientType}&search='${encodeURIComponent(searchTerm)}'`;

		const fetchData = () => {
			return q.all([
				invoiz.request(`${config.timetracking.resourceUrl}/${id}`, { auth: true }),
				invoiz.request(`${config.getAllCustomers}${query}`, { auth: true })
			]);
		};

		const showTimeTrackingView = data => {
			if (!this.ignoreLastFetch) {
				this.setState({
					preFetchData: {
						timeTracking: new Timetracking(data[0].body.data),
						customers: data[1].body.data
					}
				});
			}
		};

		q(this)
			.then(fetchData)
			.catch(() => {
				invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
				invoiz.router.navigate('/invoices/timetracking');
			})
			.then(showTimeTrackingView)
			.catch(() => {
				invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
				invoiz.router.navigate('/');
			})
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<TimetrackingEditComponent customers={preFetchData.customers} timeTracking={preFetchData.timeTracking} resources={resources} />
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

export default connect(mapStateToProps)(TimetrackingEditWrapper);
