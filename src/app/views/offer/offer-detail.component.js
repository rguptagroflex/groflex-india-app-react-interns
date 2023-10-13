import React from "react";
import TopbarComponent from "shared/topbar/topbar.component";
import TimelineComponent from "shared/timeline/timeline.component";
import OfferState from "enums/offer/offer-state.enum";
import OfferAction from "enums/offer/offer-action.enum";
import invoiz from "services/invoiz.service";
import config from "config";
import { copyAndEditTransaction } from "helpers/transaction/copyAndEditTransaction";
import NotesComponent from "shared/notes/notes.component";
import DetailViewHeadComponent from "shared/detail-view/detail-view-head.component";
import { DetailViewConstants } from "helpers/constants";
import ModalService from "services/modal.service";
import DetailViewHeadPrintPopoverComponent from "shared/detail-view/detail-view-head-print-popover.component";
import DetailViewHeadPrintTooltipComponent from "shared/detail-view/detail-view-head-print-tooltip.component";
import TransactionPrintSetting from "enums/transaction-print-setting.enum";
import { printPdf } from "helpers/printPdf";
import { downloadPdf } from "helpers/downloadPdf";
import { formatCurrency } from "helpers/formatCurrency";
// import { formatDate } from 'helpers/formatDate';
import { formatClientDate } from "helpers/formatDate";
import OfferTypes from "enums/impress/offer-types.enum";
import PopoverComponent from "shared/popover/popover.component";
import LoadingService from "services/loading.service";
import InvoiceState from "enums/invoice/invoice-state.enum";
import { format } from "util";
import { Link } from "react-router-dom";

import userPermissions from "enums/user-permissions.enum";
import abbreviationDateFormat from "../../helpers/abbreviationDateFormat";
import { capitalize } from "lodash";
import { connect } from "react-redux";

const createTopbarDropdown = (offer, resources) => {
	const items = [];

	switch (offer.state) {
		case OfferState.OPEN:
			items.push(
				[
					{
						label: resources.str_convertToBill,
						action: OfferAction.INVOICE,
						dataQsId: "offer-topbar-popoverItem-createInvoice",
					},
					{
						label: resources.str_declined,
						action: OfferAction.REJECT,
						dataQsId: "offer-topbar-popoverItem-reject",
					},
				],
				[
					{
						label: resources.str_copyEdit,
						action: OfferAction.COPY_AND_EDIT,
						dataQsId: "offer-topbar-popoverItem-copyAndEdit",
					},
					{
						label: resources.str_clear,
						action: OfferAction.DELETE,
						dataQsId: "offer-topbar-popoverItem-delete",
					},
				]
			);
			break;

		case OfferState.ACCEPTED:
			items.push(
				[
					// {
					// 	label: resources.str_createBudgetBill,
					// 	action: OfferAction.PROJECT,
					// 	dataQsId: 'offer-topbar-popoverItem-createProject'
					// },
					{
						label: resources.str_setToOpen,
						action: OfferAction.RESET,
						dataQsId: "offer-topbar-popoverItem-reset",
					},
					{
						label: resources.str_declined,
						action: OfferAction.REJECT,
						dataQsId: "offer-topbar-popoverItem-reject",
					},
				],
				[
					{
						label: resources.str_copyEdit,
						action: OfferAction.COPY_AND_EDIT,
						dataQsId: "offer-topbar-popoverItem-copyAndEdit",
					},
					{
						label: resources.str_clear,
						action: OfferAction.DELETE,
						dataQsId: "offer-topbar-popoverItem-delete",
					},
				]
			);
			break;

		case OfferState.REJECTED:
			items.push(
				[
					{
						label: resources.str_convertToBill,
						action: OfferAction.INVOICE,
						dataQsId: "offer-topbar-popoverItem-createInvoice",
					},
					{
						label: resources.str_setToOpen,
						action: OfferAction.RESET,
						dataQsId: "offer-topbar-popoverItem-reset",
					},
				],
				[
					{
						label: resources.str_copyEdit,
						action: OfferAction.COPY_AND_EDIT,
						dataQsId: "offer-topbar-popoverItem-copyAndEdit",
					},
					{
						label: resources.str_clear,
						action: OfferAction.DELETE,
						dataQsId: "offer-topbar-popoverItem-delete",
					},
				]
			);
			break;

		case OfferState.PROJECT_CREATED:
		case OfferState.INVOICED:
			items.push([
				{
					label: resources.str_copyEdit,
					action: OfferAction.COPY_AND_EDIT,
					dataQsId: "offer-topbar-popoverItem-copyAndEdit",
				},
				{ label: resources.str_clear, action: OfferAction.DELETE, dataQsId: "offer-topbar-popoverItem-delete" },
			]);
			break;

		case OfferState.DRAFT:
			items.push([
				{
					label: resources.str_copyEdit,
					action: OfferAction.COPY_AND_EDIT,
					dataQsId: "offer-topbar-popoverItem-copyAndEdit",
				},
				{ label: resources.str_clear, action: OfferAction.DELETE, dataQsId: "offer-topbar-popoverItem-delete" },
			]);
			break;
	}

	return items;
};

const createTopbarButtons = (offer, state, options, resources) => {
	const buttons = [];
	switch (offer.state) {
		case OfferState.OPEN:
		case OfferState.REJECTED:
			buttons.push({
				type: "default",
				label: resources.str_toEdit,
				buttonIcon: "icon-edit2",
				action: OfferAction.EDIT,
				dataQsId: "offerDetail-topbar-btn-edit",
			});
			buttons.push({
				type: "primary",
				label: resources.str_accepted,
				buttonIcon: "icon-check",
				action: OfferAction.ACCEPT,
				loading: options.acceptButtonLoading,
				dataQsId: "offerDetail-topbar-btn-accept",
				disabled: !state.canAcceptOffer,
			});
			break;

		case OfferState.ACCEPTED:
			buttons.push({
				type: "default",
				label: resources.str_toEdit,
				buttonIcon: "icon-edit2",
				action: OfferAction.EDIT,
				dataQsId: "offerDetail-topbar-btn-edit",
			});
			buttons.push({
				type: "primary",
				label: resources.str_convertToBill,
				buttonIcon: "icon-check",
				action: OfferAction.INVOICE,
				dataQsId: "offerDetail-topbar-btn-createInvoice",
				disabled: !state.canConvertToInvoice,
			});
			break;

		case OfferState.DRAFT:
			buttons.push({
				type: "default",
				label: resources.str_toEdit,
				buttonIcon: "icon-edit2",
				action: OfferAction.EDIT_IMPRESS_OFFER,
				dataQsId: "offerDetail-topbar-btn-edit",
			});
			buttons.push({
				type: "primary",
				label: resources.str_finalize,
				disabled: !options.hasCustomerAndPositions || !state.canFinalizeImprezzOffer,
				buttonIcon: "icon-check",
				action: OfferAction.FINALIZE_IMPRESS_OFFER,
				dataQsId: "offerDetail-topbar-btn-finalize",
			});
			break;
	}

	return buttons;
};

const createTimelineObjects = (offer, resources) => {
	const entries = [
		{
			label: resources.str_started,
		},
		{
			label: resources.str_accepted,
		},
		{
			label: resources.str_createAccount,
		},
	];

	offer.history.forEach((entry) => {
		// const date = formatDate(entry.date, 'YYYY-MM-DD', 'DD.MM.YYYY');
		const date = formatClientDate(entry.date);

		switch (entry.state) {
			case OfferState.OPEN:
				entries[0].dateText = date;
				entries[0].done = true;
				break;
			case OfferState.ACCEPTED:
				entries[1].dateText = date;
				entries[1].done = true;
				break;
			case OfferState.INVOICED:
				entries[2] = {
					dateText: date,
					done: true,
					label: resources.str_createAccount,
				};
				break;
			case OfferState.PROJECT_CREATED:
				entries[2] = {
					dateText: date,
					done: true,
					label: resources.offerInvoiceCreatedText,
				};
				break;
			case OfferState.REJECTED:
				entries[2] = {
					dateText: date,
					done: true,
					label: resources.str_declined,
				};
				break;
		}
	});

	return entries;
};

const createDetailViewHeadObjects = (offer, activeAction, resources) => {
	const object = {
		leftElements: [],
		rightElements: [],
		actionElements: [],
	};

	object.actionElements.push(
		{
			name: resources.str_sendEmail,
			icon: "icon-mail",
			action: OfferAction.EMAIL,
			dataQsId: "offerDetail-head-action-email",
		},
		{
			name: resources.str_pdf,
			icon: "icon-pdf",
			action: OfferAction.DOWNLOAD_PDF,
			actionActive: activeAction === OfferAction.DOWNLOAD_PDF,
			dataQsId: "offerDetail-head-action-download",
		},
		{
			name: resources.str_print,
			icon: "icon-print2",
			action: OfferAction.PRINT,
			actionActive: activeAction === OfferAction.PRINT,
			dataQsId: "offerDetail-head-action-print",
			controlsItemClass: "item-print",
			id: "detail-head-print-anchor",
		},
		{
			name: "",
			icon: "icon-arr_down",
			action: OfferAction.SHOW_PRINT_SETTINGS_POPOVER,
			dataQsId: "offerDetail-head-action-printSettings",
			controlsItemClass: "item-print-settings",
			id: "detail-head-print-settings-popover-anchor",
		}
	);

	// if (offer.state !== OfferState.DRAFT) {
	// 	object.actionElements.push({
	// 		name: resources.str_copyANGLink,
	// 		icon: "icon-copy",
	// 		action: OfferAction.SHOW_COPY_LINK_POPOVER,
	// 		dataQsId: "offerDetail-head-action-copylink",
	// 		controlsItemClass: "item-copy",
	// 		id: "detail-head-copy-link-popover-anchor",
	// 	});
	// }

	let subHeadline = null;
	if (offer.invoice && offer.invoice.id) {
		const id = offer.invoice.id;
		const title = offer.invoice.state === InvoiceState.DRAFT ? resources.str_draft : offer.invoice.number;
		subHeadline = (
			<div>
				{resources.str_invoice}: <Link to={`/invoice/${id}`}>{title}</Link>
			</div>
		);
	}

	if (offer.project) {
		const id = offer.project.id;
		const title = offer.project.title;
		subHeadline = (
			<div>
				{resources.str_project}: <Link to={`/project/${id}`}>{title}</Link>
			</div>
		);
	}

	object.leftElements.push({
		headline: resources.str_customer,
		value: <Link to={"/customer/" + offer.customerId}>{offer.displayName}</Link>,
		subValue: subHeadline,
	});

	const amount = formatCurrency(offer.totalGross);
	object.rightElements.push(
		{
			headline: resources.str_amount,
			value: amount,
		},
		{
			headline: resources.str_offerDate,
			value: offer.displayDate,
		}
	);

	return object;
};

const createTopbarPermissionButtons = (topbarButtons, permissions, resources) => {
	const {
		canCreateOffer,
		canDeleteOffer,
		canUpdateOffer,
		canCreateImprezzOffer,
		canAcceptOffer,
		canRejectOffer,
		canConvertToInvoice,
		canUpdateImprezzOffer,
		canFinalizeImprezzOffer,
	} = permissions;

	if (canUpdateOffer) {
		topbarButtons.filter((btn) => btn.label === resources.str_toEdit);
		return topbarButtons;
	}

	if (canUpdateOffer && canAcceptOffer) {
		topbarButtons.filter((btn) => btn.label === resources.str_accepted && btn.label === resources.str_toEdit);
		return topbarButtons;
	}

	if (canUpdateOffer && canConvertToInvoice) {
		topbarButtons.filter((btn) => btn.label === resources.str_convertToBill && btn.label === resources.str_toEdit);
		return topbarButtons;
	}

	if (canUpdateImprezzOffer && canFinalizeImprezzOffer) {
		topbarButtons.filter((btn) => btn.label === resources.str_finalize && btn.label === resources.str_toEdit);
		return topbarButtons;
	}
};

class OfferDetailComponent extends React.Component {
	constructor(props) {
		super(props);

		const offer = this.props.offer || {};

		this.state = {
			customerCenterLink: "",
			acceptButtonLoading: false,
			viewportWidth: window.innerWidth,
			offer,
			downloading: false,
			printing: false,
			letterPaperType: offer.printCustomDocument
				? TransactionPrintSetting.CUSTOM_LETTER_PAPER
				: TransactionPrintSetting.DEFAULT_LETTER_PAPER,
			offerTexts: null,
			canCreateOffer: null,
			canDeleteOffer: null,
			canUpdateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_OFFER),
			canAcceptOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.ACCEPT_OFFER),
			canRejectOffer: null,
			canCreateImprezzOffer: null,
			canDeleteImprezzOffer: null,
			canUpdateImprezzOffer: null,
			canAcceptImprezzOffer: null,
			canRejectImprezzOffer: null,
			canConvertToInvoice: null,
			canFinalizeImprezzOffer: null,
		};

		this.debounceResize = null;
		this.handleResize = this.handleResize.bind(this);
	}

	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_OFFER)) {
			invoiz.user.logout(true);
		}
		window.addEventListener("resize", this.handleResize);
		this.setState({
			canCreateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_OFFER),
			canDeleteOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_OFFER),
			canUpdateOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_OFFER),
			canAcceptOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.ACCEPT_OFFER),
			canRejectOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.REJECT_OFFER),
			canCreateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_IMPREZZ_OFFER),
			canDeleteImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_IMPREZZ_OFFER),
			canUpdateImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_IMPREZZ_OFFER),
			canAcceptImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.ACCEPT_IMPREZZ_OFFER),
			canRejectImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.REJECT_IMPREZZ_OFFER),
			canConvertToInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.SET_OPEN_OFFER),
			canFinalizeImprezzOffer: invoiz.user && invoiz.user.hasPermission(userPermissions.FINALIZE_IMPREZZ_OFFER),
		});

		const { offer } = this.state;
		invoiz
			.request(`${config.offer.resourceUrl}/${parseInt(offer.id, 10)}/document`, {
				auth: true,
				method: "POST",
				data: {
					isPrint: false,
				},
			})
			.then((pdfPathResponse) => {
				const { path } = pdfPathResponse.body.data;
				offer.pdfPath = config.imageResourceHost + path;
				fetch(offer.pdfPath, {
					method: "GET",
				})
					.then((response) => response.arrayBuffer())
					.then((arrayBuffer) => PDFJS.getDocument(arrayBuffer))
					.then((pdf) => {
						let currentPage = 1;
						const numPages = pdf.numPages;
						const myPDF = pdf;

						const handlePages = (page) => {
							const wrapper = document.getElementById("invoice-detail-pdf-wrapper");
							const canvas = document.createElement("canvas");
							// canvas.width = "925";
							canvas.width = "658";
							const context = canvas.getContext("2d");
							const viewport = page.getViewport(canvas.width / page.getViewport(1.0).width);
							canvas.height = viewport.height;
							page.render({
								canvasContext: context,
								viewport,
							});
							if (wrapper) wrapper.appendChild(canvas);
							currentPage++;
							if (currentPage <= numPages) {
								myPDF.getPage(currentPage).then(handlePages);
							}
						};

						myPDF.getPage(currentPage).then(handlePages);
					});
			});
		invoiz.request(`${config.resourceHost}setting/textModule`, { auth: true }).then((textModuleResponse) => {
			const {
				body: {
					data: { offer: offerTexts },
				},
			} = textModuleResponse;
			offerTexts.email = offerTexts.email.replace(/<\/?[^>]+>/gi, "");
			offerTexts.email = offerTexts.email.replace("<br>", "%0D%0A");
			this.setState({ offerTexts });
		});
	}

	componentWillUnmount() {
		window.removeEventListener("resize", this.handleResize);
	}

	hasCustomerAndPositions() {
		const { offer } = this.state;
		return (
			offer.customerData &&
			Object.keys(offer.customerData).length > 0 &&
			offer.positions &&
			offer.positions.length > 0
		);
	}

	render() {
		const { resources } = this.props;
		const timelineEntries = createTimelineObjects(this.state.offer, resources);
		const topbarButtons = createTopbarButtons(
			this.state.offer,
			this.state,
			{
				acceptButtonLoading: this.state.acceptButtonLoading,
				hasCustomerAndPositions: this.hasCustomerAndPositions(),
			},
			resources
		);
		const topbarPermittedButtons = createTopbarPermissionButtons(topbarButtons, this.state, resources);
		const topbarDropdownItems = createTopbarDropdown(this.state.offer, resources);
		const activeAction = this.state.downloading
			? OfferAction.DOWNLOAD_PDF
			: this.state.printing
			? OfferAction.PRINT
			: null;
		const headContents = createDetailViewHeadObjects(this.state.offer, activeAction, resources);
		const title =
			this.state.offer.state === OfferState.DRAFT ? `(${resources.str_draft})` : this.state.offer.displayNumber;
		const badge = this.createStateBadge();

		const timelineIsHorizontal = this.state.viewportWidth <= DetailViewConstants.VIEWPORT_BREAKPOINT;
		const timeline = (
			<div className={`offer-detail-timeline ${timelineIsHorizontal ? "offer-detail-timeline-horizontal" : ""}`}>
				<TimelineComponent entries={timelineEntries} isHorizontal={timelineIsHorizontal} />
			</div>
		);

		let images = [];
		let count = 0;
		this.state.offer.thumbnails.forEach((thumbnail) => {
			thumbnail.imageUrls.forEach((url) => {
				count++;
				images.push(<img key={`offer-image-${count}`} src={config.imageResourceHost + url} width="100%" />);
			});
		});

		const { letterPaperType, canUpdateOffer, canDeleteOffer } = this.state;

		if (!this.hasCustomerAndPositions() || this.state.offer.state === OfferState.DRAFT) {
			headContents.actionElements = null;
		}

		if (!this.hasCustomerAndPositions()) {
			images = [
				<div key="offer-image-dummy" className="offer-image-draft-state-hint">
					{resources.offerCustomerMessage}
				</div>,
			];
		}

		const detailHeadContent = (
			<div>
				<DetailViewHeadPrintPopoverComponent
					printSettingUrl={`${config.offer.resourceUrl}/${this.state.offer.id}/print/setting`}
					letterPaperType={letterPaperType}
					letterPaperChangeCallback={(letterPaperType) => {
						invoiz
							.request(`${config.offer.resourceUrl}/${this.state.offer.id}/document`, {
								auth: true,
								method: "POST",
								data: {
									isPrint: true,
								},
							})
							.then((response) => {
								const { path } = response.body.data;
								const { offer } = this.state;
								offer.pdfPath = config.imageResourceHost + path;
								this.setState({ letterPaperType, offer });
							});
					}}
					ref="detail-head-print-settings-popover"
					resources={resources}
				/>
				<DetailViewHeadPrintTooltipComponent letterPaperType={letterPaperType} resources={resources} />
				<PopoverComponent
					elementId={"detail-head-copy-link-popover-anchor"}
					arrowOffset={160}
					width={300}
					offsetTop={20}
					offsetLeft={95}
					showOnClick={true}
					onElementClicked={() => {
						if (!this.state.customerCenterLink) {
							invoiz
								.request(`${config.offer.resourceUrl}/${this.state.offer.id}/external/link`, {
									auth: true,
								})
								.then((response) => {
									const {
										body: {
											data: { linkToOfferCustomerCenter },
										},
									} = response;
									this.setState({ customerCenterLink: linkToOfferCustomerCenter }, () => {
										this.refs["detail-head-copy-link-input"].focus();
									});
								});
						} else {
							setTimeout(() => {
								this.refs["detail-head-copy-link-input"].focus();
							});
						}
					}}
					html={
						<div className="detail-head-copy-link-popover">
							<input
								type="text"
								className="detail-head-copy-link-content"
								value={this.state.customerCenterLink}
								onFocus={(e) => e.target.select()}
								readOnly
								ref={`detail-head-copy-link-input`}
							/>
							<div
								className="icon icon-rounded icon-duplicate"
								onClick={() => this.onHeadControlClick(OfferAction.COPY_CUSTOMERCENTER_LINK)}
							/>
							{/* <a
									href={`mailto:?subject=Ihr%20Angebot%20${
									this.state.offer.number
									}&body=Sehr%20geehrte%20Damen%20und%20Herren,%0D%0A%0D%0Aanbei%20finden%20Sie%20das%20aktuelle%20Angebot:%0D%0A${
									this.state.customerCenterLink
									}%0D%0AMit%20freundlichen%20Grüßen%0D%0A`}
									className="icon icon-rounded icon-mail"
								/>
							*/}
							<a
								href={`mailto:?subject=${resources.str_offerNumber}%20${this.state.offer.number}&body=${
									this.state.offerTexts && this.state.offerTexts.email
										? encodeURIComponent(this.state.offerTexts.email)
										: ""
								}%0D%0A%0D%0A${this.state.customerCenterLink}%0D%0A%0D%0A${
									resources.str_yourSincerely
								}`}
								className="icon icon-rounded icon-mail"
							/>
						</div>
					}
					ref={"detail-head-copy-link-popover"}
				/>
				<DetailViewHeadComponent
					controlActionCallback={(action) => this.onHeadControlClick(action)}
					actionElements={headContents.actionElements}
					leftElements={headContents.leftElements}
					rightElements={headContents.rightElements}
				/>
			</div>
		);

		// console.log(headContents, "HEAD CONTENTS");
		// console.log(timelineEntries, "TIMELINE ENTRIES");
		let newTimelineEntries = timelineEntries.filter((item) => item.done);
		newTimelineEntries = newTimelineEntries.slice().reverse();

		return (
			<div
				className={`offer-detail-wrapper wrapper-has-topbar ${!timelineIsHorizontal ? "viewport-large" : ""} ${
					this.props.isSubmenuVisible ? "offerDetailOnSidebarActive" : ""
				}`}
			>
				{canUpdateOffer && canDeleteOffer ? (
					<TopbarComponent
						title={`${resources.str_offerUpperCase} ${title}`}
						buttonCallback={(event, button) => this.handleTopbarButtonClick(event, button)}
						backButtonRoute={"offers"}
						dropdownEntries={topbarDropdownItems}
						dropdownCallback={(entry) => this.handleTopbarDropdownClick(entry)}
						buttons={topbarPermittedButtons}
					/>
				) : (
					<TopbarComponent
						title={`${resources.str_offerUpperCase} ${title}`}
						buttonCallback={(event, button) => this.handleTopbarButtonClick(event, button)}
						backButtonRoute={"offers"}
						// dropdownEntries={topbarDropdownItems}
						// dropdownCallback={entry => this.handleTopbarDropdownClick(entry)}
						buttons={topbarPermittedButtons}
					/>
				)}

				<div className="detail-view-head-container">
					{/* {timeline} */}
					{detailHeadContent}
				</div>
				<div className="detail-view-content-wrapper">
					<div className="detail-view-content-left">
						<div className="detail-view-document">
							{badge}
							<img className="detail-view-preview" src="/assets/images/invoice-preview.png" />
							{images}
							<div id="invoice-detail-pdf-wrapper" />
						</div>
					</div>

					<div className="detail-view-content-right">
						{/* <div className="detail-view-box"> */}
						<div className="invoice-info u_p_16">
							<div className="invoice-info-label font-14px">Quotation Amount</div>
							<h3 className="invoice-amount">{headContents.rightElements[0].value}</h3>
							<div className="customer-name-container font-14px">
								<div>Vendor</div>
								<div className="customer-name">{headContents.leftElements[0].value}</div>
							</div>
							{headContents.rightElements.map((item, index) => {
								if (index === 0) return;
								return (
									<div
										key={`invoice-info-item-${index}`}
										style={{ color: item.headline === "payment overdue" ? "#FFAA2C" : null }}
										className="date-of-invoice-container font-14px"
									>
										<div>
											{capitalize(item.headline) === "Quotation date"
												? "Date of PO"
												: capitalize(item.headline)}
										</div>
										{/* Last element is alway date */}
										<div
											className={
												index === headContents.rightElements.length - 1
													? "date-of-invoice"
													: "invoice-info-item"
											}
										>
											{index === headContents.rightElements.length - 1
												? abbreviationDateFormat(item.value)
												: item.value}
										</div>
									</div>
								);
							})}
						</div>
						<div className="offer-timeline-container box u_p_16">
							<div className="text-semibold">Activities: </div>
							<div className="offer-timeline-content u_pr_20">
								{newTimelineEntries.map((item, index) => {
									if (item.dateText) {
										return (
											<div key={`offer-timeline-item-${index}`} className="offer-timeline-item">
												<span className="timeline-date">
													{abbreviationDateFormat(item.dateText)}
												</span>
												<div className={index === 0 ? "greenCircle" : "greyCircleSolid"} />
												<span className="timeline-text">{item.label}</span>
											</div>
										);
									}
								})}
							</div>
						</div>
						<div className="detail-view-box box">
							<NotesComponent
								heading={resources.str_remarks}
								data={{ notes: this.state.offer.notes }}
								onSave={(value) => this.onNotesChange(value.notes)}
								resources={resources}
								placeholder={format(
									resources.defaultCommentsPlaceholderText,
									resources.str_quotationSmall
								)}
								defaultFocus={true}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	onHeadControlClick(action) {
		const { resources } = this.props;
		switch (action) {
			case OfferAction.EMAIL:
				invoiz.router.navigate(`/offer/send/${this.state.offer.id}`);
				break;

			case OfferAction.SHOW_PRINT_SETTINGS_POPOVER:
				this.refs["detail-head-print-settings-popover"].show();
				break;

			case OfferAction.DOWNLOAD_PDF: {
				const offer = this.state.offer;

				this.setState({ downloading: true }, () => {
					invoiz
						.request(`${config.offer.resourceUrl}/${parseInt(offer.id, 10)}/document`, {
							auth: true,
							method: "POST",
							data: {
								isPrint: false,
							},
						})
						.then((response) => {
							const { path } = response.body.data;
							offer.pdfPath = config.imageResourceHost + path;
							downloadPdf({
								pdfUrl: offer.pdfPath,
								title: `${resources.str_offerUpperCase} ${offer.number}`,
								isPost: false,
								callback: () => {
									this.setState({ downloading: false });
								},
							});
						})
						.catch(() => {
							invoiz.showNotification({ message: resources.defaultErrorMessage, type: "error" });
						});
				});
				break;
			}

			case OfferAction.PRINT:
				const offer = this.state.offer;

				this.setState({ printing: true }, () => {
					invoiz
						.request(`${config.offer.resourceUrl}/${parseInt(offer.id, 10)}/document`, {
							auth: true,
							method: "POST",
							data: {
								isPrint: true,
							},
						})
						.then((response) => {
							const { path } = response.body.data;
							offer.pdfPath = config.imageResourceHost + path;
							printPdf({
								pdfUrl: offer.pdfPath,
								isPost: false,
								callback: () => {
									this.setState({ printing: false });
								},
							});
						})
						.catch(() => {
							invoiz.showNotification({ message: resources.defaultErrorMessage, type: "error" });
						});
				});
				break;

			case OfferAction.COPY_CUSTOMERCENTER_LINK:
				const customerCenterLinkElm = $("<input />", {
					value: this.state.customerCenterLink,
				});
				customerCenterLinkElm.appendTo("body");
				customerCenterLinkElm[0].select();
				document.execCommand("copy");
				customerCenterLinkElm.remove();
				invoiz.showNotification({ message: resources.offerLinkCopiedText });
				break;

			case OfferAction.SHOW_COPY_LINK_POPOVER:
				$("#detail-head-copy-link-popover-anchor").click();
				break;
		}
	}

	onNotesChange(notes) {
		invoiz.request(`${config.offer.resourceUrl}/${this.state.offer.id}/notes`, {
			auth: true,
			method: "PUT",
			data: {
				notes,
			},
		});
	}

	accept(state) {
		const { resources } = this.props;
		this.setState({ acceptButtonLoading: true });
		invoiz
			.request(`${config.offer.resourceUrl}/${this.state.offer.id}/state`, {
				method: "PUT",
				auth: true,
				data: { state: state || "accepted" },
			})
			.then(() => {
				this.setState({ acceptButtonLoading: false });
				invoiz.router.reload();
			})
			.catch(() => {
				this.setState({ acceptButtonLoading: false });
				invoiz.showNotificationt({ type: "error", message: resources.defaultErrorMessage });
			});
	}

	createProject() {
		invoiz.router.navigate(`/project/new/${this.state.offer.id}`);
	}

	copyAndEdit() {
		const { resources } = this.props;
		LoadingService.show(resources.str_offerCopy);
		copyAndEditTransaction({
			invoiceModel: {
				type: "offer",
				id: this.state.offer.id,
			},
			onCopySuccess: () => {
				LoadingService.hide();
			},
			onCopyError: () => {
				LoadingService.hide();
			},
		});
	}

	delete() {
		const { resources } = this.props;
		ModalService.open(resources.offerDeleteConfirmText, {
			headline: resources.str_deleteOffer,
			cancelLabel: resources.str_abortStop,
			confirmLabel: resources.str_clear,
			confirmIcon: "icon-trashcan",
			confirmButtonType: "secondary",
			onConfirm: () => {
				ModalService.close();

				invoiz
					.request(`${config.offer.resourceUrl}/${this.state.offer.id}`, {
						auth: true,
						method: "DELETE",
					})
					.then(() => {
						invoiz.showNotification(resources.offerDeleteSuccessMessage);
						invoiz.router.navigate("/offers");
					})
					.catch((xhr) => {
						if (xhr) {
							invoiz.showNotification({
								type: "error",
								message: resources.defaultErrorMessage,
							});
						}
					});
			},
		});
	}

	edit() {
		const isImpress = this.state.offer.offerType === OfferTypes.IMPRESS;

		invoiz.router.navigate(
			isImpress ? `/offer/impress/edit/${this.state.offer.id}` : `offer/edit/${this.state.offer.id}`
		);
	}

	invoice() {
		const { resources } = this.props;
		invoiz
			.request(`${config.offer.resourceUrl}/${this.state.offer.id}/state`, {
				method: "PUT",
				auth: true,
				data: { state: "invoiced" },
			})
			.then(
				({
					body: {
						data: { invoiceId },
					},
				}) => {
					invoiz.router.navigate(`invoice/${invoiceId}`);
				}
			)
			.catch(() => {
				invoiz.showNotification({ type: "error", message: resources.defaultErrorMessage });
			});
	}

	reset() {
		const { resources } = this.props;
		invoiz
			.request(`${config.offer.resourceUrl}/${this.state.offer.id}/state`, {
				method: "PUT",
				auth: true,
				data: { state: "open" },
			})
			.then(() => {
				invoiz.router.reload();
			})
			.catch(() => {
				invoiz.showNotification({ type: "error", message: resources.defaultErrorMessage });
			});
	}

	reject() {
		const { resources } = this.props;
		invoiz
			.request(`${config.offer.resourceUrl}/${this.state.offer.id}/state`, {
				method: "PUT",
				auth: true,
				data: { state: "rejected" },
			})
			.then(() => {
				invoiz.router.reload();
			})
			.catch(() => {
				invoiz.showNotification({ type: "error", message: resources.defaultErrorMessage });
			});
	}

	handleTopbarButtonClick(event, button) {
		switch (button.action) {
			case OfferAction.ACCEPT:
				this.accept();
				break;

			case OfferAction.EDIT:
			case OfferAction.EDIT_IMPRESS_OFFER:
				this.edit();
				break;

			case OfferAction.INVOICE:
				this.invoice();
				break;
			case OfferAction.FINALIZE_IMPRESS_OFFER:
				this.accept("open");
				break;
		}
	}

	handleTopbarDropdownClick(item) {
		switch (item.action) {
			case OfferAction.COPY_AND_EDIT:
				this.copyAndEdit();
				break;

			case OfferAction.DELETE:
				this.delete();
				break;

			case OfferAction.REJECT:
				this.reject();
				break;

			case OfferAction.INVOICE:
				this.invoice();
				break;

			case OfferAction.RESET:
				this.reset();
				break;

			case OfferAction.PROJECT:
				this.createProject();
				break;
		}
	}

	handleResize() {
		clearTimeout(this.debounceResize);
		this.debounceResize = setTimeout(() => {
			this.setState({ viewportWidth: window.innerWidth });
		}, 100);
	}

	createStateBadge() {
		const { resources } = this.props;
		let badgeString = "";
		let iconClass = "";
		let badgeClass = "";
		switch (this.state.offer.state) {
			case OfferState.OPEN:
				iconClass = "icon-offen";
				badgeString = resources.str_openSmall;
				break;
			case OfferState.ACCEPTED:
				iconClass = "icon-check";
				badgeString = resources.str_accepted;
				badgeClass = "detail-view-badge-accepted";
				break;
			case OfferState.INVOICED:
				iconClass = "icon-rechnung";
				badgeString = resources.str_createAccount;
				badgeClass = "detail-view-badge-invoiced";
				break;
			case OfferState.PROJECT_CREATED:
				iconClass = "icon-rechnung";
				badgeString = resources.offerInvoiceCreatedText;
				badgeClass = "detail-view-badge-invoiced";
				break;
			case OfferState.REJECTED:
				iconClass = "icon-ueberfaellig";
				badgeString = resources.str_declined;
				badgeClass = "detail-view-badge-rejected";
				break;
			case OfferState.DRAFT:
				iconClass = "icon-offen";
				badgeString = resources.str_draft;
				break;
		}

		return (
			<div className={`detail-view-badge ${badgeClass}`}>
				<i className={`icon ${iconClass}`} />
				<div className="detail-view-badge-text">{badgeString}</div>
			</div>
		);
	}
}
const mapStateToProps = (state) => {
	const isSubmenuVisible = state.global.isSubmenuVisible;

	return {
		isSubmenuVisible,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		submenuVisible: (payload) => {
			dispatch(submenuVisible(payload));
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(OfferDetailComponent);
