import React from 'react';
import SettingsDataImportComponent from 'shared/settings/data-import.component';

class SettingsDataImportCustomersWrapper extends React.Component {
    render() {
		return <SettingsDataImportComponent importType={'customers'} />;
	}
}

export default SettingsDataImportCustomersWrapper;
