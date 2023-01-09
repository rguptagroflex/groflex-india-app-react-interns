import React from "react";
import InvoiceListComponent from "./invoice-list.component";
import InvoiceListNewComponent from "./invoice-list-new.component";
import WebStorageService from "services/webstorage.service";
import WebStorageKey from "enums/web-storage-key.enum";
import store from "redux/store";
import { Provider, connect } from "react-redux";

// const InvoiceListWrapper = React.createClass({
// 	render() {
// 		return (
// 			<Provider store={store}>
// 				{/* <InvoiceListComponent /> */}
// 				<InvoiceListComponent />
// 			</Provider>
// 		);
// 	}
// });

class InvoiceListWrapper extends React.Component {
	constructor(props) {
		super(props);

		// const settings = WebStorageService.getItem(WebStorageKey.INVOICE_VIEW_SETTINGS);

		// this.state = {
		// viewSettings: {
		// 	activeView: (settings && settings.activeView) || 'kanban',
		// 	totalDisplay: (settings && settings.totalDisplay) || 'totalGross'
		// }
		// };

		// this.setViewSettings = this.setViewSettings.bind(this);
	}

	// setViewSettings(settings) {
	// 	this.setState({ viewSettings: settings }, () => {
	// 		WebStorageService.setItem(WebStorageKey.INVOICE_VIEW_SETTINGS, settings);
	// 	});
	// }

	render() {
		// const { viewSettings } = this.state;
		const { resources } = this.props;
		return (
			<Provider store={store}>
				{/* {this.state.viewSettings.activeView === 'kanban' ? (
					<InvoiceKanbanComponent setViewSettings={this.setViewSettings} viewSettings={viewSettings} />
				) : (
					<InvoiceListNewComponent setViewSettings={this.setViewSettings} viewSettings={viewSettings} />
				)} */}
				{<InvoiceListNewComponent resources={resources} />}
			</Provider>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return {
		resources,
	};
};

export default connect(mapStateToProps)(InvoiceListWrapper);
