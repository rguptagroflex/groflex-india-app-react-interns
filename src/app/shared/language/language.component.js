import React from 'react';
import { connect } from 'react-redux';
import invoiz from 'services/invoiz.service';
import config from 'config';

class LanguageComponent extends React.Component {

	render() {
		const { resources, language, isLoading, errorOccurred } = this.props;
		const errorMessage = language === 'de' ? 'In der Sprachressource ist ein Fehler aufgetreten' : 'Error occured in Langugae resource';
		const children = resources ? this.props.children : (!isLoading && errorOccurred) ? <div>{errorMessage}</div> : null;
		const loader = document.querySelector('#app-loader');
		// hide loader after get the language resource file from store
		if (children != null) {
			loader && loader.parentNode.removeChild(loader);
		}
		return children;
	}
}

const mapStateToProps = state => {
	const {
		resources,
		language,
		isLoading,
		errorOccurred
	} = state.language.lang;
	return {
		resources,
		language,
		isLoading,
		errorOccurred
	};
};

export default connect(mapStateToProps)(LanguageComponent);
