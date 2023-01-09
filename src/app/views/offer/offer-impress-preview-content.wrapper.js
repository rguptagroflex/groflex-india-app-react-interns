import invoiz from 'services/invoiz.service';
import React from 'react';
import OfferImpressDetailComponent from './offer-impress-detail.component';
import LoaderComponent from 'shared/loader/loader.component';
import { fetchImpressOfferData } from 'helpers/fetchImpressOfferData';
import { connect } from 'react-redux';
import config from 'config';
import ImpressFrontendViewComponent from 'shared/impress/impress-frontend-view.component';
import { formatCurrency } from 'helpers/formatCurrency';

class OfferImpressPreviewContentWrapper extends React.Component {
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
		const offerId = this.props && this.props.match && this.props.match.params && this.props.match.params.id;

		try {
			fetchImpressOfferData({
				offerId,
				onSuccess: (offerData, blocks) => {
					if (!this.ignoreLastFetch) {
						this.setState({
							preFetchData: {
								offerData,
								blocks
							}
						});
					}
				},
				onError: () => {
					invoiz.router.navigate('/');
					invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
				}
			});
		} catch (err) {
			invoiz.router.navigate('/');
			invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
		}
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;
		let offerId = null;
		if (preFetchData != null) {
			offerId = preFetchData.offerData.standardOfferData.id;
		}
		return preFetchData ? (
			<div className="iframe-impress-div">
				<ImpressFrontendViewComponent
					offerId
					offerData={preFetchData.offerData}
					currentBlocks={preFetchData.blocks}
					backendRequest={invoiz.request}
					fetchPagesUrl={`${config.resourceHost}impress/${offerId}/pages/`}
					apiUrl={config.resourceHost}
					formatCurrency={formatCurrency}
					resources={resources}
				/>
			</div>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.offerLoadImpressPreview} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(OfferImpressPreviewContentWrapper);
