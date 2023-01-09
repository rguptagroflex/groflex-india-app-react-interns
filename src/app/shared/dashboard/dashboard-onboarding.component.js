import invoiz from 'services/invoiz.service';
import React from 'react';
import moment from 'moment';
import WidgetComponent from 'shared/dashboard/components/widget.component';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import ChargebeePlan from 'enums/chargebee-plan.enum';
import SubscriptionVendor from 'enums/subscription-vendor.enum';
import partyIcon from 'assets/images/svg/party-white-blue.svg';
import SVGInline from 'react-svg-inline';
import { connect } from 'react-redux';
import { fetchOnboardingData, resetOnboardingData } from 'redux/ducks/dashboard/onboarding';
import { addLeadingZero } from 'helpers/addLeadingZero';
import ModalService from 'services/modal.service';
import UpgradeModalComponent from 'shared/modals/upgrade-modal.component';
import { isPayingUser } from 'helpers/subscriptionHelpers';
import { isChromeSafari } from 'helpers/isBrowser';
import TooltipComponent from 'shared/tooltip/tooltip.component';

const isOnboardingDebugUser = () => {
	return (
		(invoiz.releaseStage === 'local' || invoiz.releaseStage === 'development') &&
		invoiz.user.subscriptionData &&
		invoiz.user.subscriptionData.tenantId === 35
	);
};

class DashboardOnboardingComponent extends React.Component {
	constructor(props) {
		super(props);

		this.remainingMinutesCountdown = null;

		this.state = {
			isUserModelLoaded: false,
			remainingMinutes: 0,
			remainingSeconds: 0,
			showActivationHint: false
		};

		invoiz.on('userModelSubscriptionDataSet', () => {
			if (!this.state.isUserModelLoaded) {
				if (!isPayingUser()) {
					this.startRemainingMinutesCountdown();
					this.refresh();
				} else if (isOnboardingDebugUser()) {
					this.setState({ remainingMinutes: 99, remainingSeconds: 99, isUserModelLoaded: true }, () => {
						this.refresh(true);
					});
				}
			}
		});

		this.onProceedAccountDataClicked = this.onProceedAccountDataClicked.bind(this);
		this.onProceedBankingClicked = this.onProceedBankingClicked.bind(this);
		this.onProceedInvoiceClicked = this.onProceedInvoiceClicked.bind(this);
	}

	componentDidMount() {
		if (invoiz.user && invoiz.user.subscriptionData && !isPayingUser()) {
			const remainingTime = this.getRemainingTime();

			this.setState(
				{
					remainingMinutes: remainingTime.minutes,
					remainingSeconds: remainingTime.seconds,
					isUserModelLoaded: true
				},
				() => {
					this.startRemainingMinutesCountdown();
					this.refresh();
				}
			);
		} else if (isOnboardingDebugUser()) {
			this.setState({ remainingMinutes: 99, isUserModelLoaded: true }, () => {
				this.refresh(true);
			});
		}
	}

	componentWillUnmount() {
		this.props.resetOnboardingData();
		clearInterval(this.remainingMinutesCountdown);
	}

	getRemainingTime() {
		const startDateTime = moment();
		let endDateTime = moment(new Date(invoiz.user.registeredAt)).add(1, 'h');
		let timeLeft = endDateTime.diff(startDateTime, 'milliseconds', true);
		const remainingMinutes = Math.floor(moment.duration(timeLeft).asMinutes());

		endDateTime = endDateTime.subtract(remainingMinutes, 'minutes');
		timeLeft = endDateTime.diff(startDateTime, 'milliseconds', true);

		const remainingSeconds = Math.floor(moment.duration(timeLeft).asSeconds());

		return {
			minutes: remainingMinutes,
			seconds: remainingSeconds
		};
	}

	navigateToPage(pageLink, callback) {
		invoiz.router.navigate(pageLink);

		setTimeout(() => {
			callback && callback();
		}, 0);
	}

	onProceedAccountDataClicked() {
		this.navigateToPage('/settings/account?pendo=PXmBHAlUvVy7pRmU9FivHZKQA30');
	}

	onProceedBankingClicked() {
		this.navigateToPage('?pendo=YuR7q50aOGJNCCZUCr-mpsJTwVY', () => this.openBankAccountSetupModal());
	}

	onProceedInvoiceClicked() {
		this.navigateToPage('/invoice/new?pendo=1xXiuPHdL5--0PrdMEIXSao8n_4');
	}

	openUpgradeModal() {
		const { resources } = this.props;
		// ModalService.open(<UpgradeModalComponent title={resources.str_timeToStart} resources={resources} />, {
		// 	width: 1196,
		// 	padding: 0,
		// 	isCloseable: true
		// });
	}

	openBankAccountSetupModal() {
		invoiz.trigger('triggerDashboardBankAccountSetupModal', () => {
			this.refresh();
		});
	}

	refresh(isDebug) {
		this.props.fetchOnboardingData(isDebug);
	}

	startRemainingMinutesCountdown() {
		let remainingTime = this.getRemainingTime();

		this.setState(
			{
				remainingMinutes: remainingTime.minutes,
				remainingSeconds: remainingTime.seconds,
				isUserModelLoaded: true
			},
			() => {
				this.remainingMinutesCountdown = setInterval(() => {
					remainingTime = this.getRemainingTime();

					if (this.refs.onboardingWrapper) {
						this.setState({
							remainingMinutes: remainingTime.minutes,
							remainingSeconds: remainingTime.seconds
						});
					}

					if (remainingTime.minutes < 1 && remainingTime.seconds < 1) {
						clearInterval(this.remainingMinutesCountdown);
					}
				}, 1000);
			}
		);
	}

	render() {
		const { remainingMinutes, remainingSeconds } = this.state;
		const { isLoading, errorOccurred, onboardingData, resources } = this.props;

		if (!onboardingData.hasConfirmedEmail || !invoiz.user.subscriptionData) {
			return null;
		}

		const { planId, trialEndAt, vendor } = invoiz.user.subscriptionData;
		const isTrialEnded = moment(new Date()).isAfter(new Date(trialEndAt));

		if (
			(planId !== ChargebeePlan.TRIAL || planId !== ChargebeePlan.TRIAL_21 || isTrialEnded || vendor === SubscriptionVendor.AMAZON) &&
			!onboardingData.isDebug
		) {
			return null;
		}

		const progressData = {
			email: onboardingData.hasConfirmedEmail,
			accountData: onboardingData.hasUpdatedCompanyAddress,
			invoices: onboardingData.hasLockedInvoce,
			banking: onboardingData.hasSetupAccount,
			appInstall: onboardingData.hasDownloadedApp
		};

		let currentProgressStep = '';

		if (!progressData.accountData) {
			currentProgressStep = 'accountData';
		} else if (!progressData.invoices) {
			currentProgressStep = 'invoices';
		} else if (!progressData.banking) {
			currentProgressStep = 'banking';
		} else if (!progressData.appInstall) {
			currentProgressStep = 'appInstall';
		}

		const progressFulfilledItems = Object.keys(progressData).filter(itemKey => progressData[itemKey] === true)
			.length;
		const progressPercentage = Math.round((progressFulfilledItems / (Object.keys(progressData).length + 1)) * 100);

		let progressHeaderText = '';
		let progressSubheaderText = '';
		let progressContentText = '';
		let buttonTitle = '';
		let buttonAction = null;

		let welcomeName = invoiz.user.companyAddress
			? invoiz.user.companyAddress.firstName || invoiz.user.companyAddress.companyName
			: '';

		if (welcomeName) {
			welcomeName = (currentProgressStep === 'appInstall' ? ',' : '') + ' ' + welcomeName;
		}

		if (onboardingData.finished) {
			progressHeaderText = resources.onBoardingProgressHeaderFinishedText;
			progressSubheaderText = resources.onBoardingProgressSubHeaderFinishedText;
			progressContentText = (
				<span>
					{resources.onBoardingProgressContentFinishedText1}
					<br />
					{resources.onBoardingProgressContentFinishedText2}
					<br />
					{resources.onBoardingProgressContentFinishedText3}
					<span id={`onboarding-progress-tooltip-finished`} className="btn-tooltip">
						?
					</span>
					<TooltipComponent
						elementId={`onboarding-progress-tooltip-finished`}
						keepOpenOnHover={true}
						maxWidth="400px"
						attachment="top right"
						targetAttachment="bottom right"
						offset="7px -7px"
						translateX="35px"
					>
						<div className="onboarding-progress-tooltip">
							<div className="tooltip-row1">
								{resources.onBoardingProgressTooltipFinishedText1}
							</div>
							<div className="tooltip-row2">
								{resources.onBoardingProgressTooltipFinishedText2}
								<br />
								<span className="tooltip-action" onClick={() => window.zE && window.zE.activate()}>
									{resources.onBoardingProgressTooltipFinishedText3} <span className="icon icon-arrow_right" />
								</span>
							</div>
						</div>
					</TooltipComponent>
				</span>
			);
			buttonTitle = resources.str_selectPlanNow;
			buttonAction = this.openUpgradeModal;
		} else {
			switch (currentProgressStep) {
				case 'accountData':
					progressHeaderText = resources.onBoardingProgressHeaderAccountDataText;
					progressSubheaderText = resources.onBoardingProgressSubHeaderAccountDataText;
					progressContentText = (
						<span>
							{resources.onBoardingProgressContentAccountDataText1}
							<br />
							{resources.onBoardingProgressContentAccountDataText2}{' '}
							<strong>{resources.onBoardingProgressContentAccountDataText3}</strong>.
						</span>
					);
					buttonTitle = resources.str_completeProfile;
					buttonAction = this.onProceedAccountDataClicked;
					break;

				case 'invoices':
					progressHeaderText = `${resources.onBoardingProgressHeaderInvoicesText}${welcomeName}!`;
					progressSubheaderText = resources.onBoardingProgressSubHeaderInvoicesText;
					progressContentText = (
						<span>
							{resources.onBoardingProgressContentInvoicesText1}
							<br />
							{resources.onBoardingProgressContentInvoicesText1}
						</span>
					);
					buttonTitle = resources.str_writeABill;
					buttonAction = this.onProceedInvoiceClicked;
					break;

				case 'banking':
					progressHeaderText = resources.onBoardingProgressHeaderBankingText;
					progressSubheaderText = resources.onBoardingProgressSubHeaderBankingText;
					progressContentText = (
						<span>
							{resources.onBoardingProgressContentBankingText1}
							<br />
							{resources.onBoardingProgressContentBankingText2}
							<br />
							{resources.onBoardingProgressContentBankingText3}
							<span id={`onboarding-progress-tooltip-banking`} className="btn-tooltip">
								?
							</span>
							<TooltipComponent
								elementId={`onboarding-progress-tooltip-banking`}
								keepOpenOnHover={true}
								maxWidth="350px"
								attachment="top right"
								targetAttachment="bottom right"
								offset="7px -7px"
								translateX="15px"
							>
								<div className="onboarding-progress-tooltip">
									<div className="tooltip-row1">
										{resources.onBoardingProgressooltipBankingText1}
									</div>
									<div className="tooltip-row2">
										{resources.onBoardingProgressooltipBankingText1}
										<br />
										<span
											className="tooltip-action"
											onClick={() => window.zE && window.zE.activate()}
										>
											{resources.onBoardingProgressooltipBankingText1} <span className="icon icon-arrow_right" />
										</span>
									</div>
								</div>
							</TooltipComponent>
						</span>
					);
					buttonTitle = resources.str_linkBankAccount;
					buttonAction = this.onProceedBankingClicked;
					break;

				case 'appInstall':
					progressHeaderText = `${resources.onBoardingProgressHeaderAppInstallText}${welcomeName}!`;
					progressSubheaderText = resources.onBoardingProgressSubHeaderAppInstallText;
					progressContentText = (
						<span>
							{resources.onBoardingProgressContentAppInstallText1}
							<br />
							{resources.onBoardingProgressContentAppInstallText1}
						</span>
					);
					buttonTitle = resources.str_smartphoneApp;
					break;
			}
		}

		const content = errorOccurred ? (
			<div>
				<WidgetErrorComponent
					reason={resources.str_dataDefaultError}
					buttonTitle={resources.str_updateNow}
					onButtonClick={this.refresh.bind(this)}
				/>
			</div>
		) : (remainingMinutes < 0 || (remainingMinutes < 1 && remainingSeconds < 1)) &&
		  !onboardingData.finished ? null : (
				<div className={`row`} ref={'onboardingWrapper'}>
					<div className={`col-xs-12 onboarding-col-left`}>
						<div className="box-content">
							{onboardingData.finished ? (
								<div className="onboarding-finished-icon">
									<SVGInline width="70px" height="70px" svg={partyIcon} />
								</div>
							) : (
								<div className="onboarding-header-image" />
							)}
							<div className="onboarding-header1">{progressHeaderText}</div>
							<div className="onboarding-header2">{progressSubheaderText}</div>
							<div className="onboarding-header3">{progressContentText}</div>
							{/* <div className="onboarding-header4">
								<button
									className="button button-rounded button-primary"
									onClick={() => buttonAction && buttonAction()}
									data-qs-id="dashboard-onboarding-btn-proceed"
								>
									{buttonTitle}
								</button>
							</div> */}
						</div>
					</div>
					{/* <div className={`col-xs-5 onboarding-col-right ${isChromeSafari() ? 'chrome' : ''}`}>
						<div className="col-xs-12 col-no-gutter-left">
							<div className="table-header">{resources.str_firstStep}</div>
							<div className="table-header-percentage">
								<div className={`c100 small center bg-fafafa p${progressPercentage}`}>
									<span>{progressPercentage}%</span>
									<div className="slice">
										<div className="bar" />
										<div className="fill" />
									</div>
								</div>
							</div>
							<div className="table-row">
								<div className="table-col-left">
									<span className={`icon ${progressData.email ? 'icon-check_medium' : 'circle-full'}`} />
								</div>
								<div className="table-col-right">
									<span>{resources.onboardingProgressBtnText1}</span>
								</div>
							</div>
							<div
								className="table-row"
								onClick={() => this.onProceedAccountDataClicked()}
								data-qs-id="dashboard-onboarding-btn-progress-item1"
							>
								<div className="table-col-left">
									<span
										className={`icon ${
											progressData.accountData
												? 'icon-check_medium'
												: currentProgressStep === 'accountData'
													? 'circle-full'
													: 'circle-empty'
										}`}
									/>
								</div>
								<div className="table-col-right">
									<span className={`${currentProgressStep === 'accountData' ? 'bold' : ''}`}>
										{resources.onboardingProgressBtnText2}
									</span>
								</div>
							</div>
							<div
								className="table-row"
								onClick={() => this.onProceedInvoiceClicked()}
								data-qs-id="dashboard-onboarding-btn-progress-item2"
							>
								<div className="table-col-left">
									<span
										className={`icon ${
											progressData.invoices
												? 'icon-check_medium'
												: currentProgressStep === 'invoices'
													? 'circle-full'
													: 'circle-empty'
										}`}
									/>
								</div>
								<div className="table-col-right">
									<span className={`${currentProgressStep === 'invoices' ? 'bold' : ''}`}>
										{resources.onboardingProgressBtnText3}
									</span>
								</div>
							</div>
							<div
								className="table-row"
								onClick={() => this.onProceedBankingClicked()}
								data-qs-id="dashboard-onboarding-btn-progress-item3"
							>
								<div className="table-col-left">
									<span
										className={`icon ${
											progressData.banking
												? 'icon-check_medium'
												: currentProgressStep === 'banking'
													? 'circle-full'
													: 'circle-empty'
										}`}
									/>
								</div>
								<div className="table-col-right">
									<span className={`${currentProgressStep === 'banking' ? 'bold' : ''}`}>
										{resources.onboardingProgressBtnText4}
									</span>
								</div>
							</div>
							<div className="table-row">
								<div className="table-col-left">
									<span
										className={`icon ${
											progressData.appInstall
												? 'icon-check_medium'
												: currentProgressStep === 'appInstall'
													? 'circle-full'
													: 'circle-empty'
										}`}
									/>
								</div>
								<div className="table-col-right">
									<span className={`${currentProgressStep === 'appInstall' ? 'bold' : ''}`}>
										{resources.onboardingProgressBtnText5}
									</span>
								</div>
							</div>
							<div className="table-row" onClick={() => this.openUpgradeModal()}>
								<div className="table-col-left">
									<span
										className={`icon ${
											onboardingData.finished ? 'icon-gift_filled' : 'icon-gift_outlined'
										}`}
									/>
								</div>
								<div className="table-col-right">
									<span className={`${onboardingData.finished ? 'bold' : ''}`}>
										{resources.onboardingProgressBtnText6}
									</span>
								</div>
							</div>
						</div>
						<div className="onboarding-countdown">
							{resources.str_youHave}{' '}
							<strong className="one-minute-remaining">
								{addLeadingZero(remainingMinutes, 2)}:{addLeadingZero(remainingSeconds, 2)} {resources.str_minutes}{' '}
							</strong>
							{resources.str_time}
						</div>
					</div> */}
				</div>
			);

		return !content ? null : (
			<WidgetComponent
				loaderText={resources.str_dataLoader}
				loading={isLoading}
				containerClass={`${
					errorOccurred ? '' : 'box-small-padding box-large-bottom dashboard-onboarding-wrapper'
				} ${onboardingData.finished ? 'onboarding-finished' : ''}`}
			>
				{content}
			</WidgetComponent>
		);
	}
}

const mapStateToProps = state => {
	const { isLoading, errorOccurred, onboardingData } = state.dashboard.onboarding;
	const { resources } = state.language.lang;
	return {
		isLoading,
		errorOccurred,
		onboardingData,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchOnboardingData: isDebug => {
			dispatch(fetchOnboardingData(isDebug));
		},
		resetOnboardingData: () => {
			dispatch(resetOnboardingData());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(DashboardOnboardingComponent);
