import invoiz from 'services/invoiz.service';
import React from 'react';
import _ from 'lodash';
import q from 'q';
import config from 'config';
import Invoice from 'models/invoice.model';
import ReceiptDetailComponent from './receipt-detail.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';
import { format } from 'util';
import { errorCodes } from 'helpers/constants';

const { NOT_FOUND } = errorCodes;

class ReceiptDetailWrapper extends React.Component {
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

		const fetchInvoiceData = () => {
			return Promise.all([invoiz.request(`${config.invoice.resourceUrl}/${parseInt(id, 10)}`, { auth: true })]);
		};

		const fetchDunningList = ([invoiceStateResponse]) => {
			const noDunningsExists = _.isEmpty(invoiceStateResponse.body.data.invoice.metaData.currentDunning);
			if (noDunningsExists) {
				return [invoiceStateResponse];
			}

			const {
				body: {
					data: {
						invoice: { id: invoiceId }
					}
				}
			} = invoiceStateResponse;
			return Promise.all([
				invoiceStateResponse,
				invoiz.request(`${config.resourceHost}dunning/${invoiceId}`, { auth: true })
			]);
		};

		const whenRequestsDone = ([invoiceStateResponse, dunningListResponse]) => {
			const dunnings = dunningListResponse ? dunningListResponse.body.data : [];

			const {
				body: {
					data: { invoice }
				}
			} = invoiceStateResponse;

			try {
				if (!this.ignoreLastFetch) {
					this.setState({
						preFetchData: {
							invoice: new Invoice(invoice),
							dunnings
						}
					});
				}
			} catch (error) {
				console.log(error);
			}
		};

		const onFetchError = error => {
			const errorCode = error.body.meta && error.body.meta.id && error.body.meta.id[0] && error.body.meta.id[0].code;
			if (errorCode === NOT_FOUND) {
				const filteredError = resources.errorCodesWithMessages[errorCode];
				invoiz.showNotification({ message: format(filteredError, resources.str_invoice), type: 'error' });
			} else {
				invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
			}
			invoiz.router.navigate(`/invoices`);
		};

		q.fcall(fetchInvoiceData)
			.then(fetchDunningList)
			.then(whenRequestsDone)
			.catch(onFetchError)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<InvoiceDetailNewComponent invoice={preFetchData.invoice} dunnings={preFetchData.dunnings} resources={resources} />
		) : (
			<div className="box main">
				<LoaderComponent text={resources.str_loadingBill} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(ReceiptDetailWrapper);
