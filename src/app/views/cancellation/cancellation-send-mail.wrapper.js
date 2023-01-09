import invoiz from 'services/invoiz.service';
import React from 'react';
import q from 'q';
import config from 'config';
import Invoice from 'models/invoice.model';
import TransactionEmail from 'models/transaction-email.model';
import EmailViewComponent from 'shared/email-view/email-view.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class CancellationSendMailWrapper extends React.Component {
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

		if (!id) return;

		const fetchData = () => {
			const requests = [
				invoiz.request(`${config.invoice.endpoints.cancellationUrl}/${parseInt(id, 10)}`, { auth: true }),
				invoiz.request(`${config.resourceHost}setting/textModule`, { auth: true })
			];

			return q.all(requests);
		};

		const showEmailView = ([cancellationResponse, textModuleResponse]) => {
			const {
				body: {
					data: { cancellation }
				}
			} = cancellationResponse;

			const { invoiceId } = cancellation;

			invoiz
				.request(`${config.invoice.resourceUrl}/${invoiceId}`, { auth: true })
				.then(invoiceResponse => {
					const {
						body: {
							data: { invoice: invoiceData }
						}
					} = invoiceResponse;
					const {
						body: {
							data: { cancellation: invoiceTexts }
						}
					} = textModuleResponse;

					const invoiceModel = new Invoice(invoiceData);

					const emailModel = new TransactionEmail({
						type: 'cancellation'
					});

					emailModel.cancellation = cancellation;
					emailModel.invoice = invoiceModel;

					try {
						if (!this.ignoreLastFetch) {
							this.setState({
								preFetchData: {
									model: emailModel,
									customerId: invoiceData.customerId,
									emailText: invoiceTexts.email
								}
							});
						}
					} catch (err) {
						console.log(err);
					}
				})
				.catch(() => {
					invoiz.router.navigate(`/cancellation/${parseInt(id, 10)}`);
					invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
				});
		};

		const onFetchError = error => {
			invoiz.router.navigate(`/cancellation/${parseInt(id, 10)}`);
			invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
			throw error;
		};

		q.fcall(fetchData)
			.then(showEmailView)
			.catch(onFetchError)
			.done();
	};

    render() {
		const { resources } = this.props;
		const { preFetchData } = this.state;

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

export default connect(mapStateToProps)(CancellationSendMailWrapper);
