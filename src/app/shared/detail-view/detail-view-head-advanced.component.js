import React from "react";
import IconButtonComponent from "shared/button/icon-button.component";

const DetailViewHeadAdvancedComponent = (props) => {
	const { actionCallback, actionElements, leftElements, rightElements, canvasWidth } = props;
	const onControlClick = (controlAction, isActive) => {
		if (!isActive && actionCallback) {
			actionCallback(controlAction);
		}
	};

	let divStyle = { width: `${canvasWidth}px` };

	if (
		!window.matchMedia(`(min-width:1200px)`).matches ||
		window.matchMedia(`(min-width:1300px) and (max-width:1400px)`).matches
	) {
		divStyle = { width: `auto` };
	}

	return (
		<div className="detail-view-head-advanced-component">
			<div className="detail-view-head-advanced-infos" style={divStyle}>
				<div className="detail-view-head-advanced-infos-wrapper">
					<div className="detail-view-head-advanced-infos-left">
						{leftElements &&
							leftElements.map((element, index) => {
								return (
									<div
										className="detail-view-head-advanced-infos-left-item u_mr_20"
										key={`detail-view-left-item-${index}`}
									>
										<div className="info-item-headline text-truncate u_mb_4">
											{element.headline}
										</div>
										<div className="info-item-value u_mb_8">{element.value}</div>
										{element.subValue && (
											<div className="info-item-sub-value">{element.subValue}</div>
										)}
									</div>
								);
							})}
					</div>
					<div className="detail-view-head-advanced-infos-right">
						{rightElements &&
							rightElements.map((element, index) => {
								return (
									<div
										className="detail-view-head-advanced-infos-right-item u_ml_20"
										key={`detail-view-right-item-${index}`}
									>
										<div className="info-item-headline text-truncate u_mb_4">
											{element.headline}
										</div>
										<div className="info-item-value text-truncate">{element.value}</div>
									</div>
								);
							})}
					</div>
				</div>
				{leftElements.map((element, index) => {
					return (
						<React.Fragment key={`value-detail-${index}`}>
							{element.valueDetails && (
								<div className="info-item-value-details">{element.valueDetails}</div>
							)}
						</React.Fragment>
					);
				})}
			</div>
			<div className="detail-view-head-advanced-actions">
				{actionElements &&
					actionElements.map((element, index) => {
						let labelAction, hint;

						if (element.labelAction) {
							labelAction = () => onControlClick(element.labelAction);
						}

						if (element.labelHint) {
							hint = element.labelHint;
						}

						return (
							<IconButtonComponent
								key={index}
								id={element.id}
								dataQsId={element.dataQsId}
								icon={element.icon}
								label={element.name}
								labelAction={labelAction}
								hint={hint}
								size="large"
								type="primary"
								wrapperClass="u_ml_16"
								callback={() => onControlClick(element.action, element.actionActive)}
							/>
						);
					})}
			</div>
		</div>
	);
};

export default DetailViewHeadAdvancedComponent;
