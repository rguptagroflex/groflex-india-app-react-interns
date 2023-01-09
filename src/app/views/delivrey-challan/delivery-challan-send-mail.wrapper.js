import invoiz from "services/invoiz.service";
import React from "react";
import q from "q";
import config from "config";
import Offer from "models/offer.model";
import TransactionEmail from "models/transaction-email.model";
import EmailViewComponent from "shared/email-view/email-view.component";
import LoaderComponent from "shared/loader/loader.component";
import { connect } from "react-redux";

class DeliveryChallanSendMailWrapper extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			preFetchData: null,
		};
	}

	componentDidMount() {
		this.preFetch();
	}

	componentWillUnmount() {
		this.ignoreLastFetch = true;
	}

	preFetch() {
		const { resources } = this.props;
		const id = this.props && this.props.match && this.props.match.params && this.props.match.params.id;

		if (!id) return;

		const fetchData = () => {
			const requests = [
				invoiz.request(`${config.challan.resourceUrl}/${parseInt(id, 10)}`, { auth: true }),
				invoiz.request(`${config.resourceHost}setting/textModule`, { auth: true }),
			];
			return q.all(requests);
		};

		const showEmailView = ([
			{
				body: {
					data: { challan: challanData },
				},
			},
			{
				body: {
					data: { challan: challanTexts },
				},
			},
		]) => {
			// offerData.offerType = offerData.type;

			const challanModel = new Offer(challanData);

			const emailModel = new TransactionEmail({
				type: "challan",
			});

			emailModel.challan = challanModel;
			// emailModel.offer.offerType = emailModel.offer.type;

			if (!this.ignoreLastFetch) {
				this.setState({
					preFetchData: {
						model: emailModel,
						customerId: challanData.customerId,
						emailText: challanTexts.email,
					},
				});
			}
		};
		const onFetchError = (error) => {
			invoiz.router.navigate(`${config.challan.resourceUrl}/${parseInt(id, 10)}`);
			invoiz.showNotification({ type: "error", message: resources.defaultErrorMessage });
			throw error;
		};

		q.fcall(fetchData).then(showEmailView).catch(onFetchError).done();
	}

	render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<EmailViewComponent
				model={preFetchData.model}
				customerId={preFetchData.customerId}
				emailText={preFetchData.emailText}
				resources={resources}
			/>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.offerLoadingOffer} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(DeliveryChallanSendMailWrapper);
