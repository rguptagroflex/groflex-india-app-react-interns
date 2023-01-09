import React from 'react';
import { Provider } from 'react-redux';
import OfferListComponent from './offer-list.component';
import store from 'redux/store';
import invoiz from 'services/invoiz.service';
import OfferListNewComponent from './offer-list-new.component';
// import config from 'config';

class OfferListWrapper extends React.Component {
    // getInitialState() {
    // 	return {
    // 		preFetchData: null
    // 	};
    // },
    // componentWillMount() {
    // 	this.preFetch();
    // },
    // componentWillUnmount() {
    // 	this.ignoreLastFetch = true;
    // },
    // preFetch() {
    // 	const { resources } = this.props;

    // 	const fetchOfferData = (isImpressOfferList) => {
    // 		const limit = 20;
    // 		const offset = 0;
    // 		const isDesc = true;
    // 		const orderBy = 'date';
    // 		const currentFilter = 'all';
    // 		const searchText = '';
    // 		let queryString = `?offset=${offset}&searchText=${searchText}&limit=${limit}&orderBy=${orderBy}&desc=${isDesc}&filter=${currentFilter}`;
    // 		if (isImpressOfferList) {
    // 			queryString += `&type=impress`;
    // 		}
    // 		return Promise.all([invoiz.request(`${config.resourceHost}offer${queryString}`, {	auth: true })]);
    // 	};

    // 	const whenRequestsDone = ([offerStateResponse]) => {
    // 		const {
    // 			body: {
    // 				meta
    // 			}
    // 		} = offerStateResponse;

    // 		try {
    // 			if (!this.ignoreLastFetch) {
    // 				this.setState({
    // 					preFetchData: {
    // 						offerCount: meta.count
    // 					}
    // 				});
    // 				// this.handleNavigationComponent();
    // 			}
    // 		} catch (err) {
    // 			// console.log(err);
    // 		}
    // 	};

    // 	const onFetchError = response => {
    // 		invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
    // 	};

    // 	fetchOfferData(false)
    // 		.then(whenRequestsDone)
    // 		.catch(onFetchError);
    // },
    // handleNavigationComponent() {
    // 	const { preFetchData } = this.state;
    // 	if (!this.ignoreLastFetch && preFetchData) {
    // 		const { offerCount } = preFetchData;
    // 		if (offerCount === 0 && !invoiz.offerListNaviagtion) {
    // 			invoiz.router.navigate(`/`);
    // 			return;
    // 		}
    // 	}
    // },
    render() {
		// const { preFetchData } = this.state;
		// return ((preFetchData && preFetchData.offerCount !== 0) || invoiz.offerListNaviagtion) ? (
		return <Provider store={store}>
			<OfferListNewComponent isImpressOfferList={false} />
		</Provider>;
	}
}

export default OfferListWrapper;
