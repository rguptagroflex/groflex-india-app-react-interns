import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import { formatCurrency } from 'helpers/formatCurrency';
import check from 'assets/images/svg/check.svg';
import flieger from 'assets/images/svg/flieger.svg';
import geschenk from 'assets/images/svg/geschenk.svg';
import SVGInline from 'react-svg-inline';
import NotificationService from 'services/notification.service';
import { format } from 'util';

const REFERRAL_LINK_BASE = 'https://invoiz.de/r/__INVITATIONCODE__';
const REFERRAL_LINK_FACEBOOK =
	'https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Finvoiz.de%2Fr%2F__INVITATIONCODE__&quote=Registriere%20dich%20%C3%BCber%20meinen%20Link%20und%20bekomme%203%20Monate%20lang%2050%25%20Rabatt%20auf%20alle%20Pl%C3%A4ne%3A';
const REFERRAL_LINK_TWITTER =
	'https://twitter.com/intent/tweet?url=https://invoiz.de/r/__INVITATIONCODE__&text=Schreibe%20professionelle%20Rechnungen%20und%20Angebote%20mit%20invoiz,%20dem%20f%C3%BChrenden%20Rechnungsprogramm%20f%C3%BCr%20Selbstst%C3%A4ndige%20und%20kleine%20Unternehmer.';
const REFERRAL_LINK_XING =
	'https://www.xing.com/spi/shares/new?url=https://invoiz.de/r/__INVITATIONCODE__&follow_url=https://www.xing.com/xbp/pages/invoiz';
const REFERRAL_LINK_LINKEDIN =
	'https://www.linkedin.com/sharing/share-offsite/?url=https://invoiz.de/r/__INVITATIONCODE__';
const REFERRAL_LINK_MAIL =
	'mailto:?subject=Probiere%20invoiz%20zum%20Rechnungen%20schreiben%20aus&body=Schreibe%20professionelle%20Rechnungen%20und%20Angebote%20mit%20invoiz%2C%20dem%20f%C3%BChrenden%20Rechnungsprogramm%20f%C3%BCr%20Selbstst%C3%A4ndige%20und%20kleine%20Unternehmer.%0D%0ARegistriere%20dich%20%C3%BCber%20meinen%20Link%20und%20bekomm%203%20Monate%20lang%2050%25%20Rabatt%20auf%20alle%20Pl%C3%A4ne%3A%20https%3A%2F%2Finvoiz.de%2Fr%2F__INVITATIONCODE__';

class ReferralModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isBottomExpanded: props.isBottomExpanded || false,
			planSelectedUserCount: 0,
			promotionalCredits: 0,
			registeredUserCount: 0,
			referralCredits: 0
		};
	}

	componentDidMount() {
		invoiz
			.request(`${config.resourceHost}tenant/referral/info`, {
				auth: true
			})
			.then(({ body: { data } }) => {
				this.setState({
					planSelectedUserCount: data.planSelectedUserCount,
					promotionalCredits: data.promotionalCredits,
					registeredUserCount: data.registeredUserCount,
					referralCredits: data.referralCredits
				});
			});
	}

	generateReferralLink(baseLink) {
		return baseLink.replace(/__INVITATIONCODE__/gi, invoiz.user.invitationCode);
	}

	onCopyLinkClicked() {
		const { resources } = this.props;
		const referralLinkElm = this.refs.referralLink;
		referralLinkElm.select();
		document.execCommand('copy');

		NotificationService.show({
			title: '',
			type: 'success',
			message: resources.str_copiedToClipboard
		});
	}

	toggleBottomContainer() {
		const isBottomExpanded = this.state.isBottomExpanded;
		this.setState({ isBottomExpanded: !isBottomExpanded });
	}

	render() {
		const {
			isBottomExpanded,
			planSelectedUserCount,
			registeredUserCount,
			referralCredits
		} = this.state;
		const { resources } = this.props;

		return (
			<div className={`referral-modal-component ${isBottomExpanded ? 'bottom-expanded' : ''}`}>
				<div className="referral-top-container">
					<div className="referral-headline">{resources.recommendInvoicesFriends}</div>
					<div className="referral-subheadline">
						{format(resources.everySuccessfulReferralCreditsText, formatCurrency(referralCredits))}
						{resources.str_and} <br />
						{resources.friendsReferralDiscountText}
					</div>
				</div>

				<div className="referral-middle-container">
					<div className="referral-step-wizard">
						<div className="wizard-step">
							<div className="circle">
								<SVGInline width="32px" height="32px" svg={flieger} />
							</div>
							<div className="step-content">
								<div className="step-headline">{resources.str_linkSend}</div>
								<div className="step-text">
									{resources.sendPersonalLinkToFriendsText}
								</div>
							</div>
						</div>
						<div className="wizard-step">
							<div className="circle">
								<SVGInline width="26px" height="26px" svg={check} />
							</div>
							<div className="step-content">
								<div className="step-headline">{resources.str_toRegister}</div>
								<div className="step-text">
									{resources.registerAndSelectPaidPlanText}
								</div>
							</div>
						</div>
						<div className="wizard-step">
							<div className="circle">
								<SVGInline width="32px" height="32px" svg={geschenk} />
							</div>
							<div className="step-content">
								<div className="step-headline">{resources.str_credit}</div>
								<div className="step-text">{resources.creditAutomaticallyAssignedText}</div>
							</div>
						</div>
					</div>
					<div className="share-link-box">
						<div className="share-link-box-headline">{resources.str_personalLink}</div>
						<div className="share-link-box-links">
							<input
								ref="referralLink"
								className="share-link-input"
								type="text"
								readOnly
								value={this.generateReferralLink(REFERRAL_LINK_BASE)}
							/>
							<div className="share-link-copy-btn" onClick={() => this.onCopyLinkClicked()}>
								{resources.str_copyLink}
							</div>
							<div className="share-link-social-btns">
								<a
									className="share-link-social-btn mail"
									href={this.generateReferralLink(REFERRAL_LINK_MAIL)}
								>
									<span className="icon icon-mail" />
								</a>
								<a
									href={this.generateReferralLink(REFERRAL_LINK_FACEBOOK)}
									className="share-link-social-btn"
									target="_blank"
								>
									<img
										src="/assets/images/social/facebook.png"
										width="40px"
										height="40px"
										alt={resources.shareLinkOnFacebook}
									/>
								</a>
								<a
									href={this.generateReferralLink(REFERRAL_LINK_LINKEDIN)}
									className="share-link-social-btn"
									target="_blank"
								>
									<img
										src="/assets/images/social/linkedin.png"
										width="40px"
										height="40px"
										alt={resources.shareLinkOnTwitter}
									/>
								</a>
								<a
									href={this.generateReferralLink(REFERRAL_LINK_TWITTER)}
									className="share-link-social-btn"
									target="_blank"
								>
									<img
										src="/assets/images/social/twitter.png"
										width="40px"
										height="40px"
										alt={resources.shareLinkOnLinkedIn}
									/>
								</a>
								<a
									href={this.generateReferralLink(REFERRAL_LINK_XING)}
									className="share-link-social-btn"
									target="_blank"
								>
									<img
										src="/assets/images/social/xing.png"
										width="40px"
										height="40px"
										alt={resources.shareLinkOnXING}
									/>
								</a>
							</div>
						</div>
					</div>
				</div>

				<div className="referral-bottom-container">
					<div className="referral-headline" onClick={() => this.toggleBottomContainer()}>
						<span>{resources.str_yourRecommendations}</span>
						{isBottomExpanded ? (
							<span className="icon icon-sort_up" />
						) : (
								<span className="icon icon-sort_down" />
							)}
					</div>
					<div
						className={`referral-recommendations`}
					>
						<div className="referral-recommendation-row">
							<div className="referral-recommendation-col-left">
								<div className="col-headline">{resources.str_registrations}</div>
								<div className="col-text">
									{resources.peopleRegisteredThroughLinkText}
								</div>
							</div>
							<div className="referral-recommendation-col-right">{registeredUserCount}</div>
						</div>
						<div className="referral-recommendation-row">
							<div className="referral-recommendation-col-left">
								<div className="col-headline">{resources.str_customers}</div>
								<div className="col-text">
									{resources.peopleSelectedPaidPlanText}
								</div>
							</div>
							<div className="referral-recommendation-col-right">{planSelectedUserCount}</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default ReferralModalComponent;
