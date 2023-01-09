import React from 'react';
import StartImpressTemplatesComponent from './start-impress-templates.component';
import store from 'redux/store';
import { Provider } from 'react-redux';

class StartImpressTemplatesWrapper extends React.Component {
    render() {
		return (
			<Provider store={store}>
				<StartImpressTemplatesComponent />
			</Provider>
		);
	}
}

export default StartImpressTemplatesWrapper;
