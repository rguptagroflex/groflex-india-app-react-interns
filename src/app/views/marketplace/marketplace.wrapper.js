import React from "react";
import { connect } from "react-redux";
import MarketplaceComponent from "./maketplace.component";
import config from "config";

const MarketplaceWrapper = (props) => {
	const { resources } = props;
	return <MarketplaceComponent resources={resources} />;
};
const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return { resources };
};
export default connect(mapStateToProps)(MarketplaceWrapper);
