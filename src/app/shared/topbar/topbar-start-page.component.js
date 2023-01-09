import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import ButtonComponent from 'shared/button/button.component';
import PopoverComponent from 'shared/popover/popover.component';
import SVGInline from 'react-svg-inline';
import UpgradeModalComponent from '../modals/upgrade-modal.component';
import ModalService from '../../services/modal.service';
const inviteIcon = require(`./../../../assets/images/svg/quick-links/invite-users.svg`);

class TopbarComponent extends React.Component {
	constructor(props) {
		super(props);

		const buttons = this.createButtons(props);
		this.resources = props.resources || {};

		this.state = {
			backButtonRoute: this.props.backButtonRoute || null,
			backButtonCallback: this.props.backButtonCallback || null,
			hasCancelButton: this.props.hasCancelButton || null,
			cancelButtonCallback: this.props.cancelButtonCallback || null,
			dropdownEntries: this.props.dropdownEntries || null,
			dropdownCallback: this.props.dropdownCallback || null,
			buttons,
			buttonCallback: this.props.buttonCallback || null,
			title: this.props.title || null,
			titleSup: this.props.titleSup || null,
			subtitle: this.props.subtitle || null,
			viewIcon: this.props.viewIcon || null,
			fullPageWidth: this.props.fullPageWidth || null,
			tenant: {
				companyAddress: {}
			},
			companyLogo: null
		};
	}

	componentWillReceiveProps(props) {
		const buttons = this.createButtons(props);

		this.setState({
			backButtonRoute: props.backButtonRoute || null,
			backButtonCallback: props.backButtonCallback || null,
			hasCancelButton: props.hasCancelButton || null,
			cancelButtonCallback: props.cancelButtonCallback || null,
			dropdownEntries: props.dropdownEntries || null,
			dropdownCallback: props.dropdownCallback || null,
			buttons,
			buttonCallback: props.buttonCallback || null,
			title: props.title || null,
			titleSup: props.titleSup || null,
			subtitle: props.subtitle || null,
			viewIcon: props.viewIcon || null,
			fullPageWidth: props.fullPageWidth || null
		});
	}

	// async fetchTenantDetails() {
	// 	const tenantURL = `${config.resourceHost}tenant`;
	// 	const response = (await invoiz.request(tenantURL, { auth: true })).body.data;
	// 	this.setState({tenant: response})
	// }

	// componentDidMount() {
	// 	this.fetchProfilePic();
	// 	this.fetchTenantDetails()
	// }

	// fetchProfilePic() {
	// 	try {
	// 		invoiz
	// 			.request(`${config.resourceHost}setting/laterPaperSetting`, {
	// 				auth: true,
	// 				method: 'GET'
	// 			})
	// 			.then((response) => {
	// 					if(response.body.data) {
	// 						if(response.body.data.header.length) {
	// 							if(response.body.data.header[0].metaData) {
	// 								if(response.body.data.header[0].metaData.imageUrl) {
	// 									console.log('company logo', response.body.data.header[0].metaData.imageUrl)
	// 									this.setState({
	// 										companyLogo: response.body.data.header[0].metaData.imageUrl
	// 									})
	// 								}
	// 							}
	// 						}
	// 					}
	// 				}
	// 			);
	// 	} catch(error) {
	// 		throw error;
	// 	}
	// }

	render() {
		let backButton = null;
		let viewIcon = null;
		if (this.state.backButtonRoute || this.state.backButtonCallback) {
			backButton = (
				<div
					className="topbar-back-button"
					onClick={() => this.onBackButtonClick()}
					data-qs-id="global-topbar-btn-back"
				>
					<div className="icon icon-back_arrow" />
				</div>
			);
		} else if (this.state.hasCancelButton) {
			backButton = (
				<div
					className="topbar-back-button"
					onClick={() => this.onCancelButtonClick()}
					data-qs-id="global-topbar-btn-close"
				>
					<div className="icon icon-close" />
				</div>
			);
		}

		if (this.state.viewIcon && !backButton) {
			viewIcon = (
				<div className="topbar-view-icon">
					<div className={`icon ${this.state.viewIcon}`} />
				</div>
			);
		}

		let dropdownMenuButton = null;
		if (this.state.dropdownEntries && this.state.dropdownEntries.length && this.state.dropdownEntries.length > 0) {
			dropdownMenuButton = (
				<div
					className="topbar-dropdown-menu-button"
					id="topbar-dropdown-anchor"
					onClick={() => this.onDropdownClick()}
				>
					<div className="icon icon-menu" />

					<PopoverComponent
						entries={this.state.dropdownEntries}
						elementId={'topbar-dropdown-anchor'}
						arrowOffset={22}
						ref={'topbar-popover'}
						onClick={entry => this.handleDropdownClick(entry)}
					/>
				</div>
			);
		}

		return (
			<div className={`topbar-wrapper ${this.state.fullPageWidth ? 'full-page-width' : ''}`}>
				{backButton}
				{viewIcon}

				<div
					className={`topbar-content ${!backButton ? 'no-back-button' : ''} ${
						!dropdownMenuButton ? 'no-dropdown-menu-button' : ''
					}`}
				>
					{this.props.children || (
						<div>
							<div className="topbar-title">
								{this.state.title}
								{this.state.titleSup ? (
									<span>
										{' '}
										<sup>{this.state.titleSup}</sup>
									</span>
								) : null}
								<div className="topbar-subtitle">{this.state.subtitle}</div>
							</div>
						</div>
					)}

{/* <button onClick={() => {
							ModalService.open(<UpgradeModalComponent title={this.resources.str_timeToStart} resources={this.resources} subscriptionDetail={invoiz.user.subscriptionData}/>, {
								width: 1196,
								padding: 0,
								isCloseable: true,
								isCloseableViaOverlay: true,
							});
						}} className="start-upgrade-btn">Upgrade Plan</button> */}
					{/* <div className="topbar-buttons">
						
						<button className="start-profile-logo" onClick={() => invoiz.router.navigate('/settings/account')}>
							{this.state.companyLogo 
								? <img className="start-profile-logo-small" src={config.resourceHost + this.state.companyLogo} />
								: <SVGInline className="start-profile-logo-small-svg" svg={inviteIcon} />
							}
							<div className="start-profile-popup">
								{this.state.companyLogo 
									? <img className="start-profile-logo-big" src={config.resourceHost + this.state.companyLogo} />
									: <SVGInline className="start-profile-logo-big-svg" svg={inviteIcon} />
								}
								<p className="start-profile-name">{this.state.tenant.companyAddress.companyName || 'Business Name'}</p>
								<p className="start-profile-email">{this.state.tenant.email || 'Email Id'}</p>
								<p className="start-profile-mobile-user-type"><span className="start-profile-mobile">{this.state.tenant.mobile}</span> | <span className="start-profile-user-type">Owner</span></p>
							</div>
						</button>
					</div> */}
				</div>

				{dropdownMenuButton}
			</div>
		);
	}

	handleButtonClick(event, button) {
		if (typeof this.state.buttonCallback === 'function') {
			this.state.buttonCallback(event, button);
		}
	}

	handleDropdownClick(entry) {
		if (typeof this.state.dropdownCallback === 'function') {
			this.state.dropdownCallback(entry);
		}
	}

	onDropdownClick() {
		this.refs['topbar-popover'].show();
	}

	onBackButtonClick() {
		if (this.state.backButtonRoute) {
			invoiz.router.navigate(this.state.backButtonRoute);
		} else if (typeof this.state.backButtonCallback === 'function') {
			this.state.backButtonCallback();
		}
	}

	onCancelButtonClick() {
		if (this.state.cancelButtonCallback) {
			this.state.cancelButtonCallback();
		} else {
			window.history.back();
		}
	}

	createButtons(props) {
		const buttons = [];

		if (props.buttons) {
			props.buttons.forEach((button, i) => {
				buttons.push(
					<ButtonComponent
						id={button.id}
						key={`topbar-button-${i}`}
						loading={button.loading}
						disabled={button.disabled}
						isWide={button.isWide}
						buttonIcon={button.buttonIcon}
						label={button.label}
						callback={event => this.handleButtonClick(event, button)}
						type={button.type}
						dataQsId={button.dataQsId}
						customCssClass={button.customCssClass}
					/>
				);
			});
		}

		return buttons;
	}
}

export default TopbarComponent;
