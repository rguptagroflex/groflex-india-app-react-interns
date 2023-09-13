import React from "react";
import _ from "lodash";
import ModalService from "services/modal.service";
import ButtonComponent from "shared/button/button.component";
import TextInputExtendedComponent from "shared/inputs/text-input-extended/text-input-extended.component";

const DEFAULT_OPTIONS = {
	customHeadline: null,
	customFooter: null,
	confirmButtonType: "primary",
	confirmLabel: "",
	confirmIcon: "",
	cancelLabel: "",
	isCloseable: false,
	isCloseableViaOverlay: false,
	loadingOnConfirmUntilClose: false,
	headline: "",
	modalClass: "",
	width: 500,
	resizePopupOnWindowResize: false,
	padding: null,
	onConfirm: null,
	afterClose: () => {
		return;
	},
	afterOpen: () => {
		return;
	},
};

class ModalBaseComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			open: false,
			content: null,
			confirmDisabled: false,
			loading: false,
			options: DEFAULT_OPTIONS,
			viewportHeight: window.innerHeight,
			inputFieldValue: "",
		};

		this.debounceResize = null;
		this.resizeInterval = null;
		this.handleResize = this.handleResize.bind(this);
	}

	componentWillReceiveProps(props) {
		this.setState({ confirmDisabled: !!props.confirmDisabled });
	}

	render() {
		const { options, viewportHeight, inputFieldValue } = this.state;

		const style = {
			width: options.width || "auto",
			padding: options.padding,
		};

		if (options.noTransform) {
			style.transform = "none";
		}

		const footer = options.customFooter ? (
			options.customFooter
		) : options.cancelLabel || options.confirmLabel ? (
			<div className="modal-base-footer">
				{options.confirmLabel ? (
					<div className="modal-base-confirm">
						<ButtonComponent
							buttonIcon={options.confirmIcon}
							loading={this.state.loading}
							type={options.confirmButtonType}
							disabled={options.confirmDisabled || this.state.confirmDisabled}
							callback={() => this.onConfirm()}
							label={options.confirmLabel}
							dataQsId="modal-btn-confirm"
						/>
					</div>
				) : null}
				{options.cancelLabel ? (
					<div className="modal-base-cancel" style={{ color: "green !important" }}>
						<ButtonComponent
							type="cancel"
							callback={() => ModalService.close(true)}
							label={options.cancelLabel}
							dataQsId="modal-btn-cancel"
						/>
					</div>
				) : null}
			</div>
		) : null;

		let modalWrapperClass = `modal-base ${options.modalClass} ${this.state.open ? "modal-base-show" : ""} ${
			!footer ? "no-footer" : ""
		}`;

		if ($(".modal-base-view")[0] && options.resizePopupOnWindowResize) {
			const modalMarginTop = parseInt($(".modal-base-view").css("margin-top"));
			const modalHeight = $(".modal-base-view").height();

			if (modalHeight >= viewportHeight - modalMarginTop - 100) {
				modalWrapperClass += " resized";
				$(".modal-base-view").height(viewportHeight - modalMarginTop - 100);
			} else {
				$(".modal-base-view").height("auto");
			}
		}

		return (
			<div className={modalWrapperClass}>
				<div className="modal-base-overlay" onClick={() => this.onOverlayClick()} />
				<div className="modal-base-view" style={style}>
					{options.headline ? (
						<div className="modal-base-headline">{options.headline}</div>
					) : (
						options.customHeadline
					)}

					<div className="modal-base-content">{this.state.content}</div>

					{options.inputFieldOptions ? (
						<div>
							<TextInputExtendedComponent
								value={inputFieldValue}
								placeholder={options.inputFieldOptions.placeholder || ""}
								onChange={(val) =>
									this.setState({
										inputFieldValue: val,
										confirmDisabled: !val || val.trim().length === 0,
									})
								}
							/>
						</div>
					) : null}

					{options.noFooter ? null : footer}

					{options.isCloseable ? (
						<div className="modal-base-close" onClick={() => ModalService.close(true)} />
					) : null}
				</div>
			</div>
		);
	}

	handleResize() {
		clearTimeout(this.debounceResize);
		window.clearInterval(this.resizeInterval);

		this.debounceResize = setTimeout(() => {
			this.setState({ viewportHeight: window.innerHeight }, () => {
				setTimeout(() => {
					this.setState({ viewportHeight: window.innerHeight });
				}, 0);
			});

			this.resizeInterval = setInterval(() => {
				this.setState({ viewportHeight: window.innerHeight });
			}, 1000);
		}, 300);
	}

	open(content, opts) {
		const options = _.assign({}, DEFAULT_OPTIONS, opts || {});
		let confirmDisabled = false;

		window.addEventListener("resize", this.handleResize);
		this.handleResize();

		if (options.inputFieldOptions) {
			confirmDisabled = true;
		}

		this.setState({ content, options, confirmDisabled }, () => {
			setTimeout(() => {
				this.setState({ open: true }, () => {
					setTimeout(() => {
						this.state.options.afterOpen();
					}, 100);

					$(".modal-base-view").scrollTop(0);
				});
			}, 250);
		});
	}

	close(isFromCancel) {
		window.removeEventListener("resize", this.handleResize);
		window.clearInterval(this.resizeInterval);

		if (this.state.options.loadingOnConfirmUntilClose) {
			this.setState({ loading: false });
		}

		this.setState({ open: false }, () => {
			this.state.options.afterClose(isFromCancel);

			setTimeout(() => {
				this.setState({ content: null, options: DEFAULT_OPTIONS, inputFieldValue: "" });
			}, 250);
		});
	}

	onConfirm() {
		if (this.state.options.onConfirm) {
			if (this.state.options.loadingOnConfirmUntilClose) {
				this.setState({ loading: true });
			}

			this.state.options.onConfirm(this.state.inputFieldValue);

			setTimeout(() => {
				this.setState({ inputFieldValue: "" });
			}, 250);
		}
	}

	onOverlayClick() {
		if (this.state.options.isCloseableViaOverlay) {
			if (this.state.options.loadingOnConfirmUntilClose) {
				this.setState({ loading: false });
			}
			ModalService.close(true);
		}
	}
}

export default ModalBaseComponent;
