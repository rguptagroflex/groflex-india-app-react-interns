import React from "react";
import store from "redux/store";
import { Provider, connect } from "react-redux";
import DeliveryChallanListNewComponent from "./delivery-challan-list-new.component";

const DeliveryChallanListWrapper = (props) => {
	const { resources } = props;
	return <DeliveryChallanListNewComponent resources={resources} />;
};

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return {
		resources,
	};
};

export default connect(mapStateToProps)(DeliveryChallanListWrapper);
