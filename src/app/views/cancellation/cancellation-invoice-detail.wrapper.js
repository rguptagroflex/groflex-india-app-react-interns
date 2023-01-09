import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import Cancellation from 'models/cancellation.model';
import LoaderComponent from 'shared/loader/loader.component';
import CancellationInvoiceDetailComponentnent from 'views/cancellation/cancellation-invoice-detail.component';
import { connect } from 'react-redux';

class CancellationInvoiceDetailWrapper extends React.Component {
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
		const { resources, location } = this.props;
		const id = this.props && this.props.match && this.props.match.params && this.props.match.params.id;
		let cancelType = location.pathname.includes("/expenses/cancellation/") ? 'debitNotes' : 'creditNotes';
		let requestUrl = cancelType === 'debitNotes' ? config.expense.endpoints.cancellationUrl : config.invoice.endpoints.cancellationUrl;
		const showCancellationDetails = response => {
			const {
				body: {
					data: { cancellation }
				}
			} = response;
			try {
				if (!this.ignoreLastFetch) {
					this.setState({
						preFetchData: {
							cancellation: new Cancellation(cancellation)
						}
					});
				}
			} catch (err) {
				console.log(err);
			}
		};

		const onFetchError = response => {
			invoiz.router.navigate(`${cancelType === 'debitNotes' ? '/expenses' : '/invoices'}`);
			this.showNavigation({ message: resources.defaultErrorMessage, type: 'error' });
		};

		invoiz
			.request(`${requestUrl}/${id}`, { auth: true })
			.then(showCancellationDetails)
			.catch(onFetchError);
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<CancellationInvoiceDetailComponentnent cancellation={preFetchData.cancellation} resources={resources} />
		) : (
			<div className="box main">
				<LoaderComponent text={resources.str_loadingCancellationInvoice} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return {
		resources
	};
};

export default connect(mapStateToProps)(CancellationInvoiceDetailWrapper);
