import invoiz from "services/invoiz.service";
import React from "react";
import ButtonComponent from "shared/button/button.component";
import PopoverComponent from "shared/popover/popover.component";
import { connect } from "react-redux";
class TopbarComponent extends React.Component {
	constructor(props) {
		super(props);

		const buttons = this.createButtons(props);

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
			fullPageWidth: props.fullPageWidth || null,
		});
	}

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
						elementId={"topbar-dropdown-anchor"}
						arrowOffset={22}
						ref={"topbar-popover"}
						onClick={(entry) => this.handleDropdownClick(entry)}
					/>
				</div>
			);
		}

		const classLeft =
			this.props.sideBarVisibleStatic["invoices"].sidebarVisible ||
			this.props.sideBarVisibleStatic["expenditure"].sidebarVisible
				? "alignLeft"
				: "";

		return (
			<div className={`topbar-wrapper ${this.state.fullPageWidth ? "full-page-width" : ""} ${classLeft}`}>
				{backButton}
				{viewIcon}
				<div
					className={`topbar-content ${!backButton ? "no-back-button" : ""} ${
						!dropdownMenuButton ? "no-dropdown-menu-button" : ""
					}`}
				>
					{this.props.children || (
						<div>
							<div className="topbar-title">
								{this.state.title}
								{}
								{this.state.titleSup ? (
									<span>
										{" "}
										<sup>{this.state.titleSup}</sup>
									</span>
								) : null}
								<div className="topbar-subtitle">{this.state.subtitle}</div>
							</div>
						</div>
					)}

					<div className="topbar-buttons">{this.state.buttons}</div>
				</div>
				{dropdownMenuButton}
			</div>
		);
	}

	handleButtonClick(event, button) {
		if (typeof this.state.buttonCallback === "function") {
			this.state.buttonCallback(event, button);
		}
	}

	handleDropdownClick(entry) {
		if (typeof this.state.dropdownCallback === "function") {
			this.state.dropdownCallback(entry);
		}
	}

	onDropdownClick() {
		this.refs["topbar-popover"].show();
	}

	onBackButtonClick() {
		if (this.state.backButtonRoute) {
			invoiz.router.navigate(this.state.backButtonRoute);
		} else if (typeof this.state.backButtonCallback === "function") {
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
						callback={(event) => this.handleButtonClick(event, button)}
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

const mapStateToProps = (state) => {
	const sideBarVisibleStatic = state.global.sideBarVisibleStatic;
	return {
		sideBarVisibleStatic,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(TopbarComponent);
// export default TopbarComponent;
