import React from 'react';

const FunnelCompoment = props => {
	const { steps, activeStep } = props;

	const funnelItems = steps.map((step, index) => {
		const activeClassCircle = activeStep === index ? 'active' : activeStep > index ? 'previous' : null;
		const activeClassStep = activeStep && activeStep - 1 >= index ? 'active' : null;

		return (
			<div
				className={`funnel-step ${index < steps.length - 1 ? `has-rightbar` : null} ${activeClassStep}`}
				key={step.name}
			>
				<div className={`funnel-circle ${activeClassCircle}`}>
					{activeClassCircle === 'previous' ? (
						<span className="icon icon-check_medium" />
					) : (
						<span className="funnel-step-number">{index}</span>
					)}
				</div>
				<div className="funnel-text">{step.label}</div>
			</div>
		);
	});

	return (
		<div className="funnel-component-wrapper">
			<div className="funnel">{funnelItems}</div>
		</div>
	);
};

export default FunnelCompoment;
