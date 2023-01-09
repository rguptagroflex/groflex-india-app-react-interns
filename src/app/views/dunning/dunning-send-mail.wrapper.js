import invoiz from 'services/invoiz.service';
import React from 'react';
import q from 'q';
import config from 'config';
import _ from 'lodash';
import Dunning from 'models/dunning.model';
import Invoice from 'models/invoice.model';
import TransactionEmail from 'models/transaction-email.model';
import EmailViewComponent from 'shared/email-view/email-view.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class DunningSendMailWrapper extends React.Component {
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
		const dunningId =
			this.props && this.props.match && this.props.match.params && this.props.match.params.dunningId;
		const invoiceId =
			this.props && this.props.match && this.props.match.params && this.props.match.params.invoiceId;

		if (!invoiceId || !dunningId) return;

		const parsedInvoiceId = parseInt(invoiceId, 10);

		const fetchData = () => {
			const requests = [
				invoiz.request(`${config.resourceHost}dunning/${parsedInvoiceId}`, { auth: true }),
				invoiz.request(`${config.resourceHost}invoice/${parsedInvoiceId}`, { auth: true })
			];
			return q.all(requests);
		};
		const showEmailView = ([
			{
				body: { data: dunningData }
			},
			{
				body: {
					data: { invoice: invoiceData }
				}
			}
		]) => {
			const data = _.find(dunningData, item => item.id === parseInt(dunningId, 10));
			const dunningModel = new Dunning(data);
			const invoiceModel = new Invoice(invoiceData);

			const model = new TransactionEmail({
				type: dunningModel.type,
				thumbUrl: `${config.resourceHost}${data.paths[0]}`
			});

			model.dunning = dunningModel;
			model.invoice = invoiceModel;

			if (!this.ignoreLastFetch) {
				this.setState({
					preFetchData: {
						model,
						customerId: invoiceData.customerId,
						emailText: data.emailText
					}
				});
			}
		};
		const onFetchError = error => {
			invoiz.router.navigate(`/${config.invoice.resourceUrl}/${parsedInvoiceId}`);
			invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
			throw error;
		};

		q.fcall(fetchData)
			.then(showEmailView)
			.catch(onFetchError)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;
		return preFetchData ? (
			<EmailViewComponent
				model={preFetchData.model}
				customerId={preFetchData.customerId}
				emailText={preFetchData.emailText}
				resources={ resources }
			/>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.invoiceLoadingBill} visible={true} />
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

export default connect(mapStateToProps)(DunningSendMailWrapper);
