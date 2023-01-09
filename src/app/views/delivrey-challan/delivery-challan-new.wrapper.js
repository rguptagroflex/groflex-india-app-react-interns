import invoiz from "services/invoiz.service";
import React from "react";
import _ from "lodash";
import config from "config";
import Customer from "models/customer.model";
import Letter from "models/letter/letter.model";
import { getPayConditions, getMiscellaneousData } from "helpers/getSettingsData";
import TransactionEditComponent from "shared/transaction/transaction-edit.component";
import LoaderComponent from "shared/loader/loader.component";
import { connect } from "react-redux";
import DeliveryChallan from "../../models/delivery-challan.model";

class DeliveryChallanNewWrapper extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			preFetchData: null,
		};
	}

	componentDidMount() {
		this.preFetchCustomer()
			.then((customerData) => {
				this.preFetch(customerData);
			})
			.catch(() => {});
	}

	componentWillUnmount() {
		this.ignoreLastFetch = true;
	}

	preFetchCustomer() {
		const { resources } = this.props;
		const customerId = this.props && this.props.match && this.props.match.params && this.props.match.params.id;
		return new Promise((resolve, reject) => {
			if (customerId) {
				invoiz
					.request(`${config.resourceHost}customer/${customerId}`, {
						method: "GET",
						auth: true,
					})
					.then((response) => {
						const {
							body: { data: customerData },
						} = response;
						resolve(customerData);
					})
					.catch((err) => {
						invoiz.router.navigate(`/customer/${customerId}`);
						invoiz.showNotification({ type: "error", message: resources.defaultErrorMessage });
						reject(err);
					});
			} else {
				resolve(null);
			}
		});
	}

	preFetch(customerData) {
		const { resources } = this.props;
		customerData = typeof customerData === "string" ? null : customerData;
		Promise.all([
			invoiz.request(config.deliveryChallan.endpoints.getNewChallan, { auth: true }),
			invoiz.request(config.settings.endpoints.getNumerationSettings, { auth: true, method: "GET" }),
			getPayConditions(),
			getMiscellaneousData(),

			// invoiz.request(`${config.resourceHost}tenant/payment/setting`, { auth: true }),
			invoiz.request(config.settings.endpoints.account, { auth: true, method: "GET" }),
		])
			.then(
				([
					newChallanResponse,
					numerationsResponse,
					payConditionsResponse,
					miscDataResponse,
					accountResponse,
				]) => {
					const {
						body: {
							data: { challan: challanData, letterElements },
						},
					} = newChallanResponse;

					const {
						body: {
							data: { invoice: numerationOptions },
						},
					} = numerationsResponse;

					const {
						body: { data: miscOptions },
					} = miscDataResponse;

					const {
						body: { data: payConditions },
					} = payConditionsResponse;

					const {
						body: { data: accountData },
					} = accountResponse;

					// const {
					// 	body: { data: paymentSetting },
					// } = paymentSettingResponse;
					const challan = new DeliveryChallan(challanData);
					const letter = new Letter(letterElements);

					// if (!invoice.invoizPayData) {
					// 	invoice.setInvoizPayData(accountData);
					// }

					if (customerData) {
						challan.setCustomer(new Customer(customerData));
						if (customerData.address.countryIso !== "IN") {
							challan.baseCurrency = customerData.baseCurrency;
							challan.exchangeRate = customerData.exchangeRate;
							challan.priceKind = "net";
							challan.customerData.indiaState = {};
						}
					} else {
						challan.customerData = _.isEmpty(challan.customerData)
							? undefined
							: Object.assign({}, challan.customerData, { id: challan.customerId });
					}

					try {
						if (!this.ignoreLastFetch) {
							this.setState(
								{
									preFetchData: {
										challan,
										letter,
										numerationOptions,
										miscOptions,
										payConditions,
										isDeliveryChallan: true,
									},
								}
							);
						}
					} catch (e) {
						console.log(e);
					}
				}
			)
			.catch((e) => {
				console.log(e, "error");
				invoiz.router.navigate("/deliverychallans");
				invoiz.showNotification({ type: "error", message: resources.defaultErrorMessage });
			});
	}
	render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;
		return preFetchData ? (
			<TransactionEditComponent
				transaction={preFetchData.challan}
				letter={preFetchData.letter}
				numerationOptions={preFetchData.numerationOptions}
				miscOptions={preFetchData.miscOptions}
				payConditions={preFetchData.payConditions}
				isDeliveryChallan={true}
				// paymentSetting={preFetchData.paymentSetting}
				resources={resources}
			/>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.str_loadingChallan} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(DeliveryChallanNewWrapper);
