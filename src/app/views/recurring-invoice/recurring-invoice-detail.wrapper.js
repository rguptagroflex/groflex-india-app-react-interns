import invoiz from 'services/invoiz.service';
import React from 'react';
import q from 'q';
import config from 'config';
import RecurringInvoice from 'models/recurring-invoice.model';
import LoaderComponent from 'shared/loader/loader.component';
import RecurringInvoiceDetailComponent from 'views/recurring-invoice/recurring-invoice-detail.component';
import { connect } from 'react-redux';

class RecurringInvoiceDetailWrapper extends React.Component {
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

		const fetchRecurringInvoice = () => {
			return invoiz.request(`${config.recurringInvoice.resourceUrl}/${parseInt(id, 10)}`, { auth: true });
		};

		const showDetailView = ({ body: { data } }) => {
			try {
				if (!this.ignoreLastFetch) {
					this.setState({
						preFetchData: {
							recurringInvoice: new RecurringInvoice(data)
						}
					});
				}
			} catch (err) {
				console.log(err);
			}
		};

		q.fcall(fetchRecurringInvoice)
			.then(showDetailView)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<RecurringInvoiceDetailComponent recurringInvoice={preFetchData.recurringInvoice} resources={resources} />
		) : (
			<div className="box main">
				<LoaderComponent text={resources.recurringLoadingSubscriptionInvoice} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(RecurringInvoiceDetailWrapper);
