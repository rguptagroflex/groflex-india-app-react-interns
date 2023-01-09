import React from 'react';
import LoaderComponent from 'shared/loader/loader.component';

const WidgetComponent = props => {
	const content = props.loading ? (
		<LoaderComponent text={props.loaderText} visible={props.loading} />
	) : (
		props.children
	);

	return <div className={`widgetContainer box ${props.containerClass || ''}`}>{content}</div>;
};

export default WidgetComponent;
