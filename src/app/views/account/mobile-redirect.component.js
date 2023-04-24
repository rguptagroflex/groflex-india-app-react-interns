import React from 'react';
import { connect } from 'react-redux';

class MobileRedirectComponent extends React.Component {
	render() {
		const { resources } = this.props;
		const badge = /android/.test(navigator.userAgent.toLowerCase()) ? (
			<a href="https://play.google.com/store/apps/details?id=com.deltra.invoiz&amp;hl=de&amp;pcampaignid=MKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1">
				<img
					alt="Jetzt bei Google Play"
					src="https://play.google.com/intl/en_us/badges/images/generic/de_badge_web_generic.png"
				/>
			</a>
		) : (
			<a href="https://itunes.apple.com/de/app/rechnung-schreiben-mit-invoiz/id1181968938">
				<img className="ios-badge" src="/assets/images/svg/appStore-badge.svg" />
			</a>
		);

		return (
			<div className="landing-wrapper mobile-redirect-wrapper">
				<div className="invoiz-logo">
					<img src="/assets/images/svg/groflex.svg" alt="Groflex" />
				</div>

				{/* <h2>{resources.str_useOurApp}</h2> */}
				<p>
					{resources.redirectToMobileAppText}
				</p>

				{/* {badge} */}
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return {
		resources
	};
};

export default connect(mapStateToProps)(MobileRedirectComponent);
