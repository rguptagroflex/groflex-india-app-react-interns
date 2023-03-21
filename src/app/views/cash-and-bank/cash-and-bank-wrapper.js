import React from "react";
import { Provider } from "react-redux";
import store from "redux/store";
import CashAndBankComponent from "./cash-and-bank.component";

const CashAndBankWrapper = () => {
	return (
		<Provider store={store}>
			<CashAndBankComponent />
		</Provider>
	);
};

export default CashAndBankWrapper;
