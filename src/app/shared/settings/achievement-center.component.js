import invoiz from 'services/invoiz.service';
import React from 'react';
import { connect } from 'react-redux';
import CircleProgressBarComponent from 'shared/circle-progress-bar/circle-progress-bar.component';
import ButtonComponent from 'shared/button/button.component';
import AchievementCenterHintModalComponent from 'shared/modals/achievement-center-hint-modal.component';
import ModalService from 'services/modal.service';
import ChargebeePlan from 'enums/chargebee-plan.enum';
import TooltipComponent from 'shared/tooltip/tooltip.component';
import { fetchAchievementData, resetAchievementData, postAchievementData } from 'redux/ducks/dashboard/achievements';
import { getAchievementRank, getAchievementNextActivationCountdown } from 'helpers/achievementCenterHelpers';
import { isPayingUser, isChargebeeSubscriber, isRazorpaySubscriber } from 'helpers/subscriptionHelpers';
import store from 'redux/store';
import { scrollToElement } from 'helpers/scrollToTop';
import { format } from 'util';

class AchievementCenterComponent extends React.Component {
	constructor() {
		super();

		this.state = {
			isUserModelLoaded: false,
			showActivationHint: false
		};

		invoiz.on('userModelSubscriptionDataSet', () => {
			if (!this.state.isUserModelLoaded) {
				if (
					invoiz.user &&
					invoiz.user.subscriptionData &&
					isPayingUser() &&
					(isChargebeeSubscriber()) &&
					(isRazorpaySubscriber())
				) {
					$('.account_section_achievements').show();
					this.refresh();
				} else {
					$('.account_section_achievements').hide();
				}
			}
		});

		this.storeSubscriber = store.subscribe(() => {
			if (!store.getState().dashboard.achievements.isLoading) {
				if (
					window.location.hash.indexOf('#achievements') !== -1 &&
					$('.account_section_achievements').length === 1
				) {
					scrollToElement($('.account_section_achievements'), 50, 500);
				}

				this.storeSubscriber();
			}
		});
	}

	componentDidMount() {
		if (
			invoiz.user &&
			invoiz.user.subscriptionData &&
			isPayingUser() &&
			(isChargebeeSubscriber()) &&
			(isRazorpaySubscriber())
		) {
			this.setState({ isUserModelLoaded: true }, () => {
				$('.account_section_achievements').show();
				this.refresh();
			});
		} else {
			setTimeout(() => {
				$('.account_section_achievements').hide();
			}, 0);
		}
	}

	componentWillUnmount() {
		this.props.resetAchievementData();
	}

	onActivateFreeMonthClick() {
		this.props.postAchievementData();
	}

	openModal(rankTitle, maxPoints) {
		const { resources } = this.props.resources;
		ModalService.open(
			<AchievementCenterHintModalComponent
				achievementRank={rankTitle}
				maxPoints={maxPoints}
				closeModal={() => ModalService.close()}
				resources={resources}
			/>,
			{
				width: 968,
				padding: 0,
				isCloseable: true
			}
		);
	}

	refresh() {
		this.props.fetchAchievementData();
	}

	showActivationHint() {
		const { showActivationHint } = this.state;

		if (!showActivationHint) {
			this.setState({ showActivationHint: true }, () => {
				setTimeout(() => {
					if (this.refs.achievementWrapper) {
						this.setState({ showActivationHint: false });
					}
				}, 5000);
			});
		}
	}

	render() {
		const { isLoading, errorOccurred, achievementData, resources } = this.props;
		const { showActivationHint } = this.state;

		let showCountdown = false;
		let countdownTime = null;

		if (
			isLoading ||
			errorOccurred ||
			!invoiz.user.subscriptionData ||
			((invoiz.user.subscriptionData && invoiz.user.subscriptionData.planId === ChargebeePlan.TRIAL) ||
			(invoiz.user.subscriptionData && invoiz.user.subscriptionData.planId === ChargebeePlan.TRIAL_21) ||
				(invoiz.user.subscriptionData) ||
				(!achievementData.activateFreeMonth && achievementData.points >= 3000))
		) {
			$('.account_section_achievements').hide();
			return null;
		}

		setTimeout(() => {
			$('.account_section_achievements').show();
		}, 0);

		if (!achievementData.activateFreeMonth && achievementData.freeMonthActivatedAt) {
			countdownTime = getAchievementNextActivationCountdown(achievementData.freeMonthActivatedAt);
			showCountdown = true;
		}

		const { rankTitle, minPoints, maxPoints } = getAchievementRank(
			achievementData.points,
			achievementData.activateFreeMonth
		);

		return (
			<div className="settings-achievement-center-component" ref="achievementWrapper">
				<div className="row u_pt_60 u_pb_40">
					<div className="col-xs-4 form_groupheader_edit text-h4">{resources.str_awards}</div>
					<div className="col-xs-8">
						<div className="headline">{format(resources.achievementRankTitleText, rankTitle)}</div>
						<div className="content">
							<div className="left-col">
								<CircleProgressBarComponent
									canvasSize={160}
									circleRadius={58}
									circleLineWidth={8}
									circleColorBackground={'#F1F8FF'}
									circleColorOuter={'#B8DCFE'}
									circleColorProgress={'#87BCFF'}
									valueCircleFill={'#ffffff'}
									valueCircleStrokeWidth={3}
									valueCircleTextStyle={'600 13px Segoe UI'}
									valueCircleTextColor={'#1c7bf1'}
									valueCircleTextOffsetY={4}
									valueCircleRadius={20}
									animationSpeed={3}
									minValue={minPoints}
									reachedValue={achievementData.points}
									maxValue={maxPoints}
								/>
								<img src="/assets/images/svg/auszeichnung.svg" width="60" height="60" />
							</div>
							<div className="right-col">
								<div className="row1">{format(resources.achievementMaxPointsText, maxPoints)}</div>
								<div className="button-wrapper">
									{achievementData.activateFreeMonth ? (
										<ButtonComponent
											label={resources.achievementRedeemPointsText}
											callback={() => this.onActivateFreeMonthClick()}
										/>
									) : (
										<ButtonComponent
											label={resources.achievementRedeemPointsText}
											customCssClass="disabled"
											id="settings-achievement-center-button-tooltip"
											callback={() => this.showActivationHint()}
										/>
									)}
									{showActivationHint ? (
										<div className="achievement-activation-hint">
											{resources.achievementFullScoreText}
										</div>
									) : null}
								</div>
								{showCountdown ? (
									<TooltipComponent
										elementId="settings-achievement-center-button-tooltip"
										maxWidth="400px"
										attachment="bottom left"
										targetAttachment="top left"
										offset="5px -105px"
									>
										Verfügbar in{' '}
										<strong>
											{countdownTime.remainingMonths}{' '}
											{countdownTime.remainingMonths === 1 ? 'Monat' : 'Monaten'} und{' '}
											{countdownTime.remainingDays}{' '}
											{countdownTime.remainingDays === 1 ? 'Tag' : 'Tagen'}
										</strong>
									</TooltipComponent>
								) : null}
								<div className="row3">
									<span className="text-content" onClick={() => this.openModal(rankTitle, maxPoints)}>
										<span className="text">{resources.achievementCanScoreButton}</span>{' '}
										<span className="right-arrow">&rsaquo;</span>
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { isLoading, errorOccurred, achievementData } = state.dashboard.achievements;
	const { resources } = state.language.lang;
	return {
		isLoading,
		errorOccurred,
		achievementData,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchAchievementData: () => {
			dispatch(fetchAchievementData());
		},
		resetAchievementData: () => {
			dispatch(resetAchievementData());
		},
		postAchievementData: () => {
			dispatch(postAchievementData());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(AchievementCenterComponent);
