import React from 'react';

class ImpressFooterNavComponent extends React.Component {
	render () {
		const { onPrevClick, onNextClick, isPrevDisabled, isNextDisabled, resources } = this.props;

		return (
			<div className="footer-nav">
				<div
					className={`footer-nav-prev ${isPrevDisabled ? 'disabled' : ''}`}
					onClick={() => {
						if (!isPrevDisabled) {
							onPrevClick && onPrevClick();
						}
					}}
				>
					<span className="footer-nav-label">{resources.str_backSmall}</span>
				</div>
				<div
					className={`footer-nav-next ${isNextDisabled ? 'disabled' : ''}`}
					onClick={() => {
						if (!isNextDisabled) {
							onNextClick && onNextClick();
						}
					}}
				>
					<span className="footer-nav-label">{resources.str_continueSmall}</span>
				</div>
			</div>
		);
	}
}

export default ImpressFooterNavComponent;
