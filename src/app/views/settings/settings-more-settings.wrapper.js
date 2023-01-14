import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import _ from 'lodash';
import q from 'q';
import { getNumerationSettings } from 'helpers/getSettingsData';
import SettingsMoreSettingsComponent from './settings-more-settings.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class SettingsMoreSettingsWrapper extends React.Component {
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
		const fetchWithFallback = url => {
			return new Promise(resolve => {
				invoiz
					.request(url, { auth: true, method: 'GET' })
					.then(resolve)
					.catch(() => {
						resolve({ body: { data: { nextNumber: '1', lastNumber: null } } });
					});
			});
		};

		const fetchData = () => {
			const requests = [
				getNumerationSettings(),
				fetchWithFallback(`${config.offer.endpoints.getNextOfferNumber}`),
				fetchWithFallback(`${config.invoice.endpoints.getNextInvoiceNumber}`),
				fetchWithFallback(`${config.purchaseOrder.endpoints.getNextPurchaseOrderNumber}`),
				fetchWithFallback(`${config.invoice.endpoints.getNextReceiptNumber}`),
				invoiz.request(config.settings.endpoints.miscellaneousData, { auth: true })
			];

			return q.all(requests);
		};

		const showView = ([numerationSettings, nextOfferNumber, nextInvoiceNumber, nextPurchaseOrderNumber, nextReceiptNumber, miscellaneous]) => {
			const numerationOptionsData = numerationSettings.body.data;
			const nextOfferNumberData = nextOfferNumber.body.data;
			const nextInvoiceNumberData = nextInvoiceNumber.body.data;
			const nextPurchaseOrderNumberData = nextPurchaseOrderNumber.body.data;
			const nextReceiptNumberData = nextReceiptNumber.body.data;
			const miscellaneousData = miscellaneous.body.data;
			numerationOptionsData.offer.nextOfferNumber = nextOfferNumberData.nextNumber;
			numerationOptionsData.offer.lastOfferNumber = _.isEmpty(nextOfferNumberData.lastNumber)
				? ''
				: nextOfferNumberData.lastNumber.numberPart;


			numerationOptionsData.invoice.nextInvoiceNumber = nextInvoiceNumberData.nextNumber;
			numerationOptionsData.invoice.lastInvoiceNumber = _.isEmpty(nextInvoiceNumberData.lastNumber)
				? ''
				: nextInvoiceNumberData.lastNumber.numberPart;


			numerationOptionsData.purchaseOrder.nextPurchaseOrderNumber = nextPurchaseOrderNumberData.nextNumber;
			numerationOptionsData.purchaseOrder.lastPurchaseOrderNumber = _.isEmpty(nextPurchaseOrderNumberData.lastNumber)
				? ''
				: nextPurchaseOrderNumberData.lastNumber.numberPart;
			
				numerationOptionsData.pos_receipt.nextReceiptNumber = nextReceiptNumberData.nextNumber;
				numerationOptionsData.pos_receipt.lastReceiptNumber = _.isEmpty(nextReceiptNumberData.lastNumber)
					? ''
					: nextReceiptNumberData.lastNumber.numberPart;


			numerationOptionsData.pos_receipt.nextPos_receiptNumber = nextReceiptNumber.nextNumber;
			numerationOptionsData.pos_receipt.lastPos_receiptNumber = _.isEmpty(nextReceiptNumber.lastNumber)
				? ''
				: nextReceiptNumber.lastNumber.numberPart;

			if (!this.ignoreLastFetch) {
				this.setState({
					preFetchData: {
						numerationOptionsData,
						miscellaneousData
					}
				});
			}
		};

		const onFetchError = () => {
			invoiz.router.navigate('/');
			invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
		};

		fetchData()
			.then(showView)
			.catch(onFetchError)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources, location } = this.props;

		return preFetchData ? (
			<SettingsMoreSettingsComponent
				numerationOptionsData={preFetchData.numerationOptionsData}
				miscellaneousData={preFetchData.miscellaneousData}
				resources={resources} pathName={location.pathname}
			/>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.settingsLoadMoreSettings} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(SettingsMoreSettingsWrapper);
