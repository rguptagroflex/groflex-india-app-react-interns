import invoiz from "services/invoiz.service";
import React from "react";
// import ButtonComponent from "shared/button/button.component";
import PopoverComponent from "shared/popover/popover.component";
import CustomButtonComponent from "./custom-button.component";
import OnClickOutside from "../../shared/on-click-outside/on-click-outside.component";
import ModalService from "../../services/modal.service";
import MoneyInModalComponent from "./money-in-modal.component";

class CustomTopbarComponent extends React.Component {
	constructor(props) {
		super(props);

		// const buttons = this.createButtons(props, false);

		this.state = {
			topbarDropdown: false,
			onDropDownClick: this.props.onDropDownClick || null,
			backButtonRoute: this.props.backButtonRoute || null,
			backButtonCallback: this.props.backButtonCallback || null,
			hasCancelButton: this.props.hasCancelButton || null,
			cancelButtonCallback: this.props.cancelButtonCallback || null,
			dropdownEntries: this.props.dropdownEntries || null,
			dropdownCallback: this.props.dropdownCallback || null,
			// buttons,
			buttonCallback: this.props.buttonCallback || null,
			title: this.props.title || null,
			titleSup: this.props.titleSup || null,
			subtitle: this.props.subtitle || null,
			viewIcon: this.props.viewIcon || null,
			fullPageWidth: this.props.fullPageWidth || null,
		};

		this.openTopbarDropdown = this.openTopbarDropdown.bind(this);
		this.closeTopbarDropdown = this.closeTopbarDropdown.bind(this);
	}

	// componentDidUpdate(){

	// }

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

	openTopbarDropdown() {
		this.setState({ ...this.state, topbarDropdown: true });
	}

	closeTopbarDropdown() {
		this.setState({ ...this.state, topbarDropdown: false });
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
								buttonIcon={"icon-plus"}
								label={"New Transactions"}
								callback={(event) => {
									// this.handleButtonClick(event, button);
									// console.log("Hua log bindndnd");
									this.openTopbarDropdown();
								}}
								type={"primary"}
								// dataQsId={button.dataQsId}
								// customCssClass={button.customCssClass}
								rightIcon={"icon-arrow_solid_down"}
							/>
							{this.state.topbarDropdown ? (
								<OnClickOutside onClickOutside={this.closeTopbarDropdown}>
									<div
										style={{
											backgroundColor: "white",
											border: "1px solid #C6C6C6",
											borderRadius: "0px 0px 4px 4px",
											borderWidth: "0px 1px 1px 1px",
										}}
									>
										<div
											onClick={() => {
												this.closeTopbarDropdown();
												this.props.openMoneyInModal();
											}}
											className="drop-down-opt"
											style={{
												cursor: "pointer",
												margin: 0,
												lineHeight: "25px",
												borderBottom: "1px solid #C6C6C6",
												padding: "7px 0 7px 15px",
												color: "#747474",
											}}
										>
											Money In
										</div>
										<div
											onClick={() => {
												this.closeTopbarDropdown();
												// this.props.onDropDownClick("money-out");
												this.props.openMoneyOutModal();
											}}
											className="drop-down-opt"
											style={{
												cursor: "pointer",
												margin: 0,
												lineHeight: "25px",
												padding: "7px 0 7px 15px",
												color: "#747474",
											}}
										>
											Money Out
										</div>
									</div>
								</OnClickOutside>
							) : null}
						</div>
					</div>
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

	// createButtons(props, dropDownActive) {
	// 	const buttons = [];
	// 	let dropDownOptions = null;
	// if (dropDownActive) {
	// 	console.log("True is true");
	// 	dropDownOptions = (
	// 		<div
	// 			style={{
	// 				backgroundColor: "white",
	// 				border: "1px solid #C6C6C6",
	// 				borderRadius: "0px 0px 4px 4px",
	// 				borderWidth: "0px 1px 1px 1px",
	// 			}}
	// 		>
	// 			<div
	// 				style={{
	// 					margin: 0,
	// 					lineHeight: "25px",
	// 					borderBottom: "1px solid #C6C6C6",
	// 				}}
	// 			>
	// 				Hi htis is
	// 			</div>
	// 			<div style={{ margin: 0, lineHeight: "25px" }}>Hi htis is</div>
	// 		</div>
	// 	);
	// }

	// 	if (props.buttons) {
	// 		props.buttons.forEach((button, i) => {
	// 			buttons.push(
	// 				<div style={{ display: "flex", flexDirection: "column" }}>
	// 					<OnClickOutside onClickOutside={this.closeTopbarDropdown}>
	// 						<CustomButtonComponent
	// 							id={button.id}
	// 							key={`topbar-button-${i}`}
	// 							loading={button.loading}
	// 							disabled={button.disabled}
	// 							isWide={button.isWide}
	// 							buttonIcon={button.buttonIcon}
	// 							label={button.label}
	// 							callback={(event) => {
	// 								// this.handleButtonClick(event, button);
	// 								console.log("Hua log bindndnd");
	// 								this.openTopbarDropdown();
	// 							}}
	// 							type={button.type}
	// 							dataQsId={button.dataQsId}
	// 							customCssClass={button.customCssClass}
	// 							rightIcon={button.rightIcon}
	// 						/>
	// 					</OnClickOutside>
	// 				</div>
	// 			);
	// 		});
	// 	}
	// 	return buttons;
	// }
}

export default CustomTopbarComponent;
