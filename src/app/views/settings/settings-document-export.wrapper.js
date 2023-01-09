import React from 'react';
import DocumentExportState from 'models/settings/document-export-state.model';
import SettingsDocumentExportComponent from './settings-document-export.component';
import store from 'redux/store';
import { Provider } from 'react-redux';

import userPermissions from 'enums/user-permissions.enum';

class SettingsDocumentExportWrapper extends React.Component {
    render() {
		const documentExportState = new DocumentExportState();

		return (
			<Provider store={store}>
				<div className="full-width-wrapper">
				<SettingsDocumentExportComponent documentExportState={documentExportState} />
				</div>
				
			</Provider>
		);
	}
}

export default SettingsDocumentExportWrapper;
