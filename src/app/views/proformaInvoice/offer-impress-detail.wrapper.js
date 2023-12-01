import invoiz from 'services/invoiz.service';
import React from 'react';
import OfferImpressDetailComponent from './offer-impress-detail.component';
import LoaderComponent from 'shared/loader/loader.component';
import { fetchImpressOfferData } from 'helpers/fetchImpressOfferData';
import { connect } from 'react-redux';
import { format } from 'util';

class OfferImpressDetailWrapper extends React.Component {
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
				onError: (error) => {
					invoiz.router.navigate('/');
					const errorCode = error.body.meta && error.body.meta.id && error.body.meta.id[0] && error.body.meta.id[0].code;
					const filteredError = resources.errorCodesWithMessages[errorCode];
					invoiz.showNotification({ message: format(filteredError, resources.str_impressOffer), type: 'error' });
					// invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
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

		return preFetchData ? (
			<OfferImpressDetailComponent
				offerData={preFetchData.offerData}
				blocks={preFetchData.blocks}
				fullWidth={false}
				resources={resources}
			/>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.offerDownloadImpressOffer} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(OfferImpressDetailWrapper);
