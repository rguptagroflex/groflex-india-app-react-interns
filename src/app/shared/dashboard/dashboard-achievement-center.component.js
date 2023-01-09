import React from 'react';
import { connect } from 'react-redux';
import invoiz from 'services/invoiz.service';
import { format } from 'util';
import WidgetComponent from 'shared/dashboard/components/widget.component';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import CircleProgressBarComponent from 'shared/circle-progress-bar/circle-progress-bar.component';
import ButtonComponent from 'shared/button/button.component';
import ModalService from 'services/modal.service';
import AchievementCenterHintModalComponent from 'shared/modals/achievement-center-hint-modal.component';
import ChargebeePlan from 'enums/chargebee-plan.enum';
import SubscriptionVendor from 'enums/subscription-vendor.enum';
import { fetchAchievementData, resetAchievementData, postAchievementData } from 'redux/ducks/dashboard/achievements';
import { getAchievementRank, getAchievementNextActivationCountdown } from 'helpers/achievementCenterHelpers';
import { isPayingUser, isChargebeeSubscriber, isZohoSubscriber } from 'helpers/subscriptionHelpers';
import { checkAchievementNotification } from 'helpers/checkAchievementNotification';

class DashboardAchievementCenterComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isUserModelLoaded: false,
			showActivationHint: false
		};

		invoiz.on('userModelSubscriptionDataSet', () => {
			this.checkSubscriptionData(() => {
				this.refresh();
			});
		});
	}

	componentDidMount() {
		this.checkSubscriptionData(() => {
			this.setState({ isUserModelLoaded: true }, () => {
				this.refresh();
			});
		});
		checkAchievementNotification();
	}

	componentWillUnmount() {
		this.props.resetAchievementData();
	}

	checkSubscriptionData(callback) {
		if (
			!this.state.isUserModelLoaded &&
			invoiz.user.subscriptionData &&
			isPayingUser() &&
			(isChargebeeSubscriber())
		) {
			callback && callback();
		} else if (
			!this.state.isUserModelLoaded &&
			invoiz.user.subscriptionData &&
			isPayingUser() &&
			(isZohoSubscriber())
		) {
			callback && callback();
		} else if (!this.state.isUserModelLoaded) {
			if (this.refs.achievementWrapper || this.refs.widgetWrapper) {
				this.setState({
					isLoading: false
				});
			}
		}
	}

	onActivateFreeMonthClick() {
		this.props.postAchievementData();
	}

	openModal(rankTitle, maxPoints) {
		ModalService.open(
			<AchievementCenterHintModalComponent
				achievementRank={rankTitle}
				maxPoints={maxPoints}
				closeModal={() => ModalService.close()}
				resources= {this.props.resources}
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
		const { showActivationHint } = this.state;
		const { isLoading, errorOccurred, achievementData, resources } = this.props;

		if (
			!invoiz.user.subscriptionData ||
			(invoiz.user.subscriptionData && invoiz.user.subscriptionData.planId === ChargebeePlan.TRIAL) ||
			(invoiz.user.subscriptionData && invoiz.user.subscriptionData.planId === ChargebeePlan.TRIAL_21) ||
			(invoiz.user.subscriptionData && invoiz.user.subscriptionData.vendor === SubscriptionVendor.AMAZON)
		) {
			return null;
		}

		let showCountdown = false;
		let countdownTime = null;

		const { rankTitle, minPoints, maxPoints } = getAchievementRank(
			achievementData.points,
			achievementData.activateFreeMonth
		);

		if (!achievementData.activateFreeMonth && achievementData.points >= 3000) {
			return null;
		}

		if (!achievementData.activateFreeMonth && achievementData.freeMonthActivatedAt) {
			countdownTime = getAchievementNextActivationCountdown(achievementData.freeMonthActivatedAt);
			showCountdown = true;
		}

		const content = errorOccurred ? (
			<div>
				<WidgetErrorComponent
					reason={resources.str_dataDefaultError}
					buttonTitle={resources.str_updateNow}
					onButtonClick={this.refresh.bind(this)}
				/>
			</div>
		) : (
			<div className="row" ref="achievementWrapper">
				<div className="col-xs-7 dashboard-achievement-center-left">
					<div className="text-h4 u_mb_0">{format(resources.achievementRankTitleText, rankTitle)}</div>
					<div className="text-muted widget-subheadline">
						{format(resources.achievementMaxPointsText, maxPoints)}
					</div>
					<ul>
						<li>{resources.achievementCollectPointText}</li>
						<li>{resources.achievementSpecialAwardsText}</li>
					</ul>
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
								callback={() => this.showActivationHint()}
							/>
						)}
						{showActivationHint ? (
							<div className="achievement-activation-hint">{resources.achievementFullScoreText}</div>
						) : null}
					</div>
					{showCountdown ? (
						<div className="remaining-time">
							{resources.str_availableIn}{' '}
							<strong>
								{countdownTime.remainingMonths}{' '}
								{countdownTime.remainingMonths === 1 ? resources.str_month : resources.str_months} {resources.str_and}{' '}
								{countdownTime.remainingDays} {countdownTime.remainingDays === 1 ? resources.str_day : resources.str_days}
							</strong>
						</div>
					) : null}
				</div>
				<div className="col-xs-5 dashboard-achievement-center-right">
					<div className="big-icon">
						<CircleProgressBarComponent
							canvasSize={200}
							circleRadius={75}
							circleLineWidth={10}
							circleColorBackground={'#2F87F3'}
							circleColorOuter={'#7EB6FF'}
							circleColorProgress={'#ffffff'}
							valueCircleFill={'#ffffff'}
							valueCircleStrokeWidth={4}
							valueCircleTextStyle={'600 14px Segoe UI'}
							valueCircleTextColor={'#1c7bf1'}
							valueCircleTextOffsetY={5}
							valueCircleRadius={19}
							animationSpeed={3}
							minValue={minPoints}
							reachedValue={achievementData.points}
							maxValue={maxPoints}
						/>
						<img src="/assets/images/svg/auszeichnung.svg" width="80" height="80" />
					</div>
					<h4 className="text-h4">{resources.achievementCurrentScoreText}</h4>
					<div className="dashboard-achievement-center-subheadline">
						<span className="text-content" onClick={() => this.openModal(rankTitle, maxPoints)}>
							<span className="text">{resources.achievementCanScoreButton}</span>{' '}
							<span className="right-arrow">&rsaquo;</span>
						</span>
					</div>
				</div>
			</div>
		);

		return (
			<div ref="widgetWrapper">
				<WidgetComponent
					loaderText={resources.str_dataLoader}
					loading={isLoading}
					containerClass={`box-large-bottom dashboard-achievement-center-component-wrapper ${
						errorOccurred || isLoading ? 'loading' : ''
					}`}
				>
					{content}
				</WidgetComponent>
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
)(DashboardAchievementCenterComponent);
