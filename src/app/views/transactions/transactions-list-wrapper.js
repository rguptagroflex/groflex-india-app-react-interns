import React from "react";
import { Provider } from "react-redux";
import store from "redux/store";
import TransactionsListComponent from "./transactions-list.component";

const TransactionsListWrapper = ({ match }) => {
	return (
		<Provider store={store}>
			<TransactionsListComponent bankDetailId={match.params.bankDetailId} />
		</Provider>
	);
};

export default TransactionsListWrapper;
