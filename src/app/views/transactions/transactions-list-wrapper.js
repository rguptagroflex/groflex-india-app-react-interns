import React from "react";
import { Provider } from "react-redux";
import store from "redux/store";
import TransactionsListComponent from "./transactions-list.component";

const TransactionsListWrapper = () => {
	return (
		<Provider store={store}>
			<TransactionsListComponent />
		</Provider>
	);
};

export default TransactionsListWrapper;
