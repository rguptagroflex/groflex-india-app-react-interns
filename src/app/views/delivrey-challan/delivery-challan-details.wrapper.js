import invoiz from "services/invoiz.service";
import React from "react";
import _ from "lodash";
import q from "q";
import config from "config";
import Invoice from "models/invoice.model";
import LoaderComponent from "shared/loader/loader.component";
import { connect } from "react-redux";
import { format } from "util";
import { errorCodes } from "helpers/constants";
import DeliveryChallanDetailComponent from "./delivery-challan-details.component";
import DeliveryChallan from "../../models/delivery-challan.model";

const { NOT_FOUND } = errorCodes;

class DeliveryChallanDetailWrapper extends React.Component {
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

		const fetchChallanData = () => {
			return Promise.all([invoiz.request(`${config.deliveryChallan.resourceUrl}/${parseInt(id, 10)}`, { auth: true })]);
		};

		const whenRequestsDone = ([challanStateResponse]) => {
			const challan = challanStateResponse ? challanStateResponse.body.data : [];

			// const {
			// 	body: {
			// 		data: { challan },
			// 	},
			// } = challanStateResponse;

			try {
				if (!this.ignoreLastFetch) {
					this.setState({
						preFetchData: {
							challan: new DeliveryChallan(challan),
							// dunnings,
						},
					});
				}
			} catch (error) {
				console.log(error);
			}
		};

		const onFetchError = (error) => {
			const errorCode =
				error.body.meta && error.body.meta.id && error.body.meta.id[0] && error.body.meta.id[0].code;
			if (errorCode === NOT_FOUND) {
				const filteredError = resources.errorCodesWithMessages[errorCode];
				invoiz.showNotification({ message: format(filteredError, resources.str_challan), type: "error" });
			} else {
				invoiz.showNotification({ message: resources.defaultErrorMessage, type: "error" });
			}
			invoiz.router.navigate(`/deliverychallans`);
		};

		q.fcall(fetchChallanData).then(whenRequestsDone).catch(onFetchError).done();
	}

	render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<DeliveryChallanDetailComponent challan={preFetchData.challan} resources={resources} />
		) : (
			<div className="box main">
				<LoaderComponent text={resources.str_loadingBill} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(DeliveryChallanDetailWrapper);
