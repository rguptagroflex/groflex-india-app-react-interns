import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import _ from 'lodash';
import Invoice from 'models/invoice.model';
import DunningInvoiceDetailComponent from './dunning-invoice-detail.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class DunningInvoiceDetailWrapper extends React.Component {
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
		const invoiceId =
			this.props && this.props.match && this.props.match.params && this.props.match.params.invoiceId;
		const dunningId =
			this.props && this.props.match && this.props.match.params && this.props.match.params.dunningId;

		const onSuccess = ([
			{
				body: { data: dunningData }
			},
			{
				body: { data: invoiceData }
			}
		]) => {
			const data = _.find(dunningData, item => item.id === parseInt(dunningId, 10));
			data.invoiceId = invoiceId;

			try {
				this.setState({
					preFetchData: {
						dunning: data,
						invoice: new Invoice(invoiceData.invoice)
					}
				});
			} catch (e) {
				console.log(e);
			}
		};

		Promise.all([
			invoiz.request(`${config.resourceHost}dunning/${parseInt(invoiceId, 10)}`, { auth: true }),
			invoiz.request(`${config.invoice.resourceUrl}/${parseInt(invoiceId, 10)}`, { auth: true })
		])
			.then(onSuccess)
			.catch(error => {
				throw error;
			});
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<DunningInvoiceDetailComponent dunning={preFetchData.dunning} invoice={preFetchData.invoice} resources={resources} />
		) : (
			<div className="box main">
				<LoaderComponent text={resources.str_loadingReminder} visible={true} />
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

export default connect(mapStateToProps)(DunningInvoiceDetailWrapper);
