import invoiz from 'services/invoiz.service';
import React from 'react';
import q from 'q';
import config from 'config';
import Customer from 'models/customer.model';
import Timetracking from 'models/timetracking.model';
import LoaderComponent from 'shared/loader/loader.component';
import TimetrackingBilledComponent from 'views/timetracking/timetracking-billed.component';
import { connect } from 'react-redux';

class TimetrackingBilledWrapper extends React.Component {
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
		const id = this.props && this.props.match && this.props.match.params && this.props.match.params.id;

		const fetchData = () => {
			const options = {
				auth: true
			};

			return q.all([
				invoiz.request(`${config.resourceHost}customer/${id}`, options),
				invoiz.request(`${config.resourceHost}/trackedTime/customer/${id}?status=invoiced`, options)
			]);
		};

		const showTimeTrackingBillingView = (responseCustomer, timetrackingResponse) => {
			if (!this.ignoreLastFetch) {
				this.setState({
					preFetchData: {
						customer: new Customer(responseCustomer.body.data),
						trackedTimes: timetrackingResponse.body.data.map(timetracking => new Timetracking(timetracking))
					}
				});
			}
		};

		q.fcall(fetchData)
			.spread(showTimeTrackingBillingView)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<TimetrackingBilledComponent customer={preFetchData.customer} trackedTimes={preFetchData.trackedTimes} resources={resources} />
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

export default connect(mapStateToProps)(TimetrackingBilledWrapper);
