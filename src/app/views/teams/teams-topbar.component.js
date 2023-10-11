import invoiz from "services/invoiz.service";
import React from "react";
// import ButtonComponent from "shared/button/button.component";
import PopoverComponent from "shared/popover/popover.component";
import CustomButtonComponent from "../transactions/custom-button.component";
import OnClickOutside from "../../shared/on-click-outside/on-click-outside.component";

class TeamsTopbarComponent extends React.Component {
	constructor(props) {
		super(props);

		// const buttons = this.createButtons(props, false);

		this.state = {
			topbarDropdown: false,
			backButtonRoute: this.props.backButtonRoute || null,
			backButtonCallback: this.props.backButtonCallback || null,
			hasCancelButton: this.props.hasCancelButton || null,
			cancelButtonCallback: this.props.cancelButtonCallback || null,
			// buttons,
			buttonCallback: this.props.buttonCallback || null,
			title: this.props.title || null,
			titleSup: this.props.titleSup || null,
			subtitle: this.props.subtitle || null,
			viewIcon: this.props.viewIcon || null,
			fullPageWidth: this.props.fullPageWidth || null,
		};
	}

	componentWillReceiveProps(props) {
		// const buttons = this.createButtons(props, this.state.topbarDropdown);

		this.setState({
			topbarDropdown: false,
			onDropDownClick: props.onDropDownClick || null,
			backButtonRoute: props.backButtonRoute || null,
			backButtonCallback: props.backButtonCallback || null,
			hasCancelButton: props.hasCancelButton || null,
			cancelButtonCallback: props.cancelButtonCallback || null,
			dropdownEntries: props.dropdownEntries || null,
			dropdownCallback: props.dropdownCallback || null,
			// buttons,
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

		// console.log(this.state, "TOPBAR STATE");
		return (
			<div className={`topbar-wrapper ${this.state.fullPageWidth ? "full-page-width" : ""}`}>
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

					<div className="topbar-buttons">
						{/* {this.state.buttons} */}
						<div style={{ display: "flex", flexDirection: "column" }}>
							<CustomButtonComponent
								// id={button.id}
								key={`topbar-button-1`}
								// loading={button.loading}
								// disabled={button.disabled}
								// isWide={button.isWide}
								// buttonIcon={"icon-plus"}
								label={"Invite new user"}
								callback={(event) => {
									// this.handleButtonClick(event, button);
									// console.log("Hua log bindndnd");
									this.openTopbarDropdown();
								}}
								type={"primary"}
								// dataQsId={button.dataQsId}
								// customCssClass={button.customCssClass}
								// rightIcon={"icon-arrow_solid_down"}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	handleButtonClick(event, button) {
		if (typeof this.state.buttonCallback === "function") {
			this.state.buttonCallback(event, button);
		}
	}

	onBackButtonClick() {
		if (this.state.backButtonRoute) {
			invoiz.router.navigate(this.state.backButtonRoute);
		} else if (typeof this.state.backButtonCallback === "function") {
			this.state.backButtonCallback();
		}
	}
}

export default TeamsTopbarComponent;
