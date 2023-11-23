import invoiz from "services/invoiz.service";
import React, { useEffect, useRef, useState } from "react";
import config from "config";
import { getMiscellaneousData } from "helpers/getSettingsData";
import Expense from "models/expense.model";
import ExpenseEditComponent from "./expense1-edit.component";
import LoaderComponent from "shared/loader/loader.component";
import { connect } from "react-redux";
import _ from "lodash";
import ExpenseDetailComponent from "./expense-detail.component";

const ExpenseDetailWrapper = ({ resources, match }) => {
	const [preFetchData, setPrefetchData] = useState();
	const ignoreLastFetch = useRef(false);
	useEffect(() => {
		preFetch();
		return () => {
			ignoreLastFetch.current = true;
		};
	}, []);

	const preFetch = () => {
		const id = match && match.params && match.params.id;
		if (!id) return;

		Promise.all([
			invoiz.request(`${config.expense.resourceUrl}/${parseInt(id, 10)}`, { auth: true }),
			getMiscellaneousData(),
		])
			.then(([editExpenseResponse, miscDataResponse]) => {
				const {
					body: {
						data: { expense: expenseData },
					},
				} = editExpenseResponse;

				const {
					body: { data: miscOptions },
				} = miscDataResponse;
				const expense = new Expense(expenseData, true);
				expense.customerData = _.isEmpty(expense.customerData)
					? undefined
					: Object.assign({}, expense.customerData, { id: expense.customerId });
				if (expenseData.purchaseOrder) expense.purchaseOrder = expenseData.purchaseOrder;
				try {
					if (!ignoreLastFetch.current) {
						setPrefetchData({
							expense,
							miscOptions,
						});
					}
				} catch (e) {
					console.log(e);
				}
			})
			.catch(() => {
				invoiz.router.navigate("/expenses");
				invoiz.showNotification({ message: resources.defaultErrorMessage, type: "error" });
			});
	};

	return preFetchData ? (
		<ExpenseDetailComponent
			expense={preFetchData.expense}
			miscOptions={preFetchData.miscOptions}
			resources={resources}
		/>
	) : (
		<div className="box main">
			<LoaderComponent text={resources.str_loadExpense} visible={true} />
		</div>
	);
};

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(ExpenseDetailWrapper);
