import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import q from 'q';
import Customer from 'models/customer.model';
import Timetracking from 'models/timetracking.model';
import LoaderComponent from 'shared/loader/loader.component';
import TimetrackingBillingComponent from 'views/timetracking/timetracking-billing.component';
import { connect } from 'react-redux';

class TimetrackingBillingWrapper extends React.Component {
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

		const fetchData = () => {
			return q.all([
				invoiz.request(`${config.resourceHost}customer/${parseInt(id, 10)}`, {
					auth: true
				}),
				invoiz.request(`${config.resourceHost}trackedTime/customer/${parseInt(id, 10)}?status=open`, {
					auth: true
				})
			]);
		};

		const showTimeTrackingBillingView = (responseCustomer, responseTimetracking) => {
			const {
				body: { data: customerData }
			} = responseCustomer;

			const {
				body: { data: trackedTimesRaw }
			} = responseTimetracking;

			const customer = new Customer(customerData);

			const trackedTimes = trackedTimesRaw.map(tracking => {
				return new Timetracking(tracking);
			});

			try {
				if (!this.ignoreLastFetch) {
					this.setState({
						preFetchData: {
							customer,
							trackedTimes
						}
					});
				}
			} catch (e) {
				console.log(e);
			}
		};

		q(this)
			.then(fetchData)
			.catch(() => {
				invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
				invoiz.router.navigate('/invoices/timetracking');
			})
			.spread(showTimeTrackingBillingView)
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
			<TimetrackingBillingComponent customer={preFetchData.customer} trackedTimes={preFetchData.trackedTimes} resources={resources} />
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

export default connect(mapStateToProps)(TimetrackingBillingWrapper);
