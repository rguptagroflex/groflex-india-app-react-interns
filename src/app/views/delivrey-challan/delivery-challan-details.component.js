import React from "react";
import TopbarComponent from "shared/topbar/topbar.component";
import TimelineComponent from "shared/timeline/timeline.component";
// import OfferState from "enums/offer/offer-state.enum";
// import OfferAction from "enums/offer/offer-action.enum";
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
import PopoverComponent from "shared/popover/popover.component";
import LoadingService from "services/loading.service";
import InvoiceState from "enums/invoice/invoice-state.enum";
import { format } from "util";
import { Link } from "react-router-dom";
import userPermissions from "enums/user-permissions.enum";
import DeliveryChallanState from "../../enums/delivery-challan/delivery-challan-state.enum";
import DeliveryChallanAction from "../../enums/delivery-challan/delivery-challan-action.enum";

const createTopbarDropdown = (challan, resources) => {
	const items = [];

	switch (challan.state) {
		case DeliveryChallanState.OPEN:
			items.push(
				[
					{
						label: resources.str_convertToBill,
						action: DeliveryChallanAction.INVOICE,
						dataQsId: "offer-topbar-popoverItem-createInvoice",
					},
					{
						label: resources.str_declined,
						action: DeliveryChallanAction.REJECT,
						dataQsId: "offer-topbar-popoverItem-reject",
					},
				],
				[
					{
						label: resources.str_copyEdit,
						action: DeliveryChallanAction.COPY_AND_EDIT,
						dataQsId: "offer-topbar-popoverItem-copyAndEdit",
					},
					{
						label: resources.str_clear,
						action: DeliveryChallanAction.DELETE,
						dataQsId: "offer-topbar-popoverItem-delete",
					},
				]
			);
			break;

		case DeliveryChallanState.DELIVERED:
			items.push(
				[
					// {
					// 	label: resources.str_createBudgetBill,
					// 	action: OfferAction.PROJECT,
					// 	dataQsId: 'offer-topbar-popoverItem-createProject'
					// },
					{
						label: resources.str_setToOpen,
						action: DeliveryChallanAction.RESET,
						dataQsId: "offer-topbar-popoverItem-reset",
					},
					{
						label: resources.str_declined,
						action: DeliveryChallanAction.REJECT,
						dataQsId: "offer-topbar-popoverItem-reject",
					},
				],
				[
					{
						label: resources.str_copyEdit,
						action: DeliveryChallanAction.COPY_AND_EDIT,
						dataQsId: "offer-topbar-popoverItem-copyAndEdit",
					},
					{
						label: resources.str_clear,
						action: DeliveryChallanAction.DELETE,
						dataQsId: "offer-topbar-popoverItem-delete",
					},
				]
			);
			break;

		case DeliveryChallanState.DECLINED:
			items.push(
				[
					{
						label: resources.str_convertToBill,
						action: DeliveryChallanAction.INVOICE,
						dataQsId: "offer-topbar-popoverItem-createInvoice",
					},
					{
						label: resources.str_setToOpen,
						action: DeliveryChallanAction.RESET,
						dataQsId: "offer-topbar-popoverItem-reset",
					},
				],
				[
					{
						label: resources.str_copyEdit,
						action: DeliveryChallanAction.COPY_AND_EDIT,
						dataQsId: "offer-topbar-popoverItem-copyAndEdit",
					},
					{
						label: resources.str_clear,
						action: DeliveryChallanAction.DELETE,
						dataQsId: "offer-topbar-popoverItem-delete",
					},
				]
			);
			break;

		case DeliveryChallanState.INVOICED:
			items.push([
				{
					label: resources.str_copyEdit,
					action: DeliveryChallanAction.COPY_AND_EDIT,
					dataQsId: "offer-topbar-popoverItem-copyAndEdit",
				},
				{
					label: resources.str_clear,
					action: DeliveryChallanAction.DELETE,
					dataQsId: "offer-topbar-popoverItem-delete",
				},
			]);
			break;
	}

	return items;
};

const createTopbarButtons = (challan, state, options, resources) => {
	const buttons = [];
	switch (challan.state) {
		case DeliveryChallanState.OPEN:
		case DeliveryChallanState.DECLINED:
			buttons.push({
				type: "default",
				label: resources.str_toEdit,
				buttonIcon: "icon-edit2",
				action: DeliveryChallanAction.EDIT,
				dataQsId: "offerDetail-topbar-btn-edit",
			});
			buttons.push({
				type: "primary",
				label: resources.str_accepted,
				buttonIcon: "icon-check",
				action: DeliveryChallanAction.ACCEPT,
				loading: options.acceptButtonLoading,
				dataQsId: "offerDetail-topbar-btn-accept",
				disabled: !state.canDeliverChallan,
			});
			break;

		case DeliveryChallanState.DELIVERED:
			buttons.push({
				type: "default",
				label: resources.str_toEdit,
				buttonIcon: "icon-edit2",
				action: DeliveryChallanAction.EDIT,
				dataQsId: "offerDetail-topbar-btn-edit",
			});
			buttons.push({
				type: "primary",
				label: resources.str_convertToBill,
				buttonIcon: "icon-check",
				action: DeliveryChallanAction.INVOICE,
				dataQsId: "offerDetail-topbar-btn-createInvoice",
				disabled: !state.canConvertToInvoice,
			});
			break;
	}

	return buttons;
};

const createTimelineObjects = (challan, resources) => {
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

	// challan.history.forEach((entry) => {
	// 	// const date = formatDate(entry.date, 'YYYY-MM-DD', 'DD.MM.YYYY');
	// 	const date = formatClientDate(entry.date);

	// 	switch (entry.state) {
	// 		case DeliveryChallanState.OPEN:
	// 			entries[0].dateText = date;
	// 			entries[0].done = true;
	// 			break;
	// 		case DeliveryChallanState.DELIVERED:
	// 			entries[1].dateText = date;
	// 			entries[1].done = true;
	// 			break;
	// 		case DeliveryChallanState.INVOICED:
	// 			entries[2] = {
	// 				dateText: date,
	// 				done: true,
	// 				label: resources.str_createAccount,
	// 			};
	// 			break;
	// 		case DeliveryChallanState.DECLINED:
	// 			entries[2] = {
	// 				dateText: date,
	// 				done: true,
	// 				label: resources.str_declined,
	// 			};
	// 			break;
	// 	}
	// });

	return entries;
};

const createDetailViewHeadObjects = (challan, activeAction, resources) => {
	const object = {
		leftElements: [],
		rightElements: [],
		actionElements: [],
	};

	object.actionElements.push(
		{
			name: resources.str_sendEmail,
			icon: "icon-mail",
			action: DeliveryChallanAction.EMAIL,
			dataQsId: "offerDetail-head-action-email",
		},
		{
			name: resources.str_pdf,
			icon: "icon-pdf",
			action: DeliveryChallanAction.DOWNLOAD_PDF,
			actionActive: activeAction === DeliveryChallanAction.DOWNLOAD_PDF,
			dataQsId: "offerDetail-head-action-download",
		},
		{
			name: resources.str_print,
			icon: "icon-print2",
			action: DeliveryChallanAction.PRINT,
			actionActive: activeAction === DeliveryChallanAction.PRINT,
			dataQsId: "offerDetail-head-action-print",
			controlsItemClass: "item-print",
			id: "detail-head-print-anchor",
		},
		{
			name: "",
			icon: "icon-arr_down",
			action: DeliveryChallanAction.SHOW_PRINT_SETTINGS_POPOVER,
			dataQsId: "offerDetail-head-action-printSettings",
			controlsItemClass: "item-print-settings",
			id: "detail-head-print-settings-popover-anchor",
		},
		// {
		// 	name: resources.str_copyANGLink,
		// 	icon: "icon-copy",
		// 	action: DeliveryChallanAction.SHOW_COPY_LINK_POPOVER,
		// 	dataQsId: "offerDetail-head-action-copylink",
		// 	controlsItemClass: "item-copy",
		// 	id: "detail-head-copy-link-popover-anchor",
		// }
	);

	// if (offer.state !== OfferState.DRAFT) {
	// 	object.actionElements.push({
	// 		name: resources.str_copyANGLink,
	// 		icon: "icon-copy",
	// 		action: DeliveryChallanAction.SHOW_COPY_LINK_POPOVER,
	// 		dataQsId: "offerDetail-head-action-copylink",
	// 		controlsItemClass: "item-copy",
	// 		id: "detail-head-copy-link-popover-anchor",
	// 	});
	// }

	let subHeadline = null;
	// if (challan.invoice && offer.invoice.id) {
	// 	const id = offer.invoice.id;
	// 	const title = offer.invoice.state === InvoiceState.DRAFT ? resources.str_draft : offer.invoice.number;
	// 	subHeadline = (
	// 		<div>
	// 			{resources.str_invoice}: <Link to={`/invoice/${id}`}>{title}</Link>
	// 		</div>
	// 	);
	// }

	object.leftElements.push({
		headline: resources.str_customer,
		value: <Link to={"/customer/" + challan.customerId}>{challan.displayName}</Link>,
		subValue: subHeadline,
	});

	const amount = formatCurrency(challan.totalGross);
	object.rightElements.push(
		{
			headline: resources.str_amount,
			value: amount,
		},
		{
			headline: resources.str_offerDate,
			value: challan.displayDate,
		}
	);

	return object;
};

const createTopbarPermissionButtons = (topbarButtons, permissions, resources) => {
	const {
		canCreateChallan,
		canDeleteChallan,
		canUpdateChallan,
		canDeliverChallan,
		canRejectChallan,
		canConvertToInvoice,
	} = permissions;

	if (canUpdateChallan) {
		topbarButtons.filter((btn) => btn.label === resources.str_toEdit);
		return topbarButtons;
	}

	if (canUpdateChallan && canDeliverChallan) {
		topbarButtons.filter((btn) => btn.label === resources.str_accepted && btn.label === resources.str_toEdit);
		return topbarButtons;
	}

	if (canUpdateChallan && canConvertToInvoice) {
		topbarButtons.filter((btn) => btn.label === resources.str_convertToBill && btn.label === resources.str_toEdit);
		return topbarButtons;
	}
};

class DeliveryChallanDetailComponent extends React.Component {
	constructor(props) {
		super(props);

		const challan = this.props.challan || {};

		this.state = {
			customerCenterLink: "",
			acceptButtonLoading: false,
			viewportWidth: window.innerWidth,
			challan,
			downloading: false,
			printing: false,
			letterPaperType: challan.printCustomDocument
				? TransactionPrintSetting.CUSTOM_LETTER_PAPER
				: TransactionPrintSetting.DEFAULT_LETTER_PAPER,
			challanTexts: null,
			canCreateChallan: null,
			canDeleteChallan: null,
			canUpdateChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_CHALLAN),
			canDeliverChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.ACCEPT_CHALLAN),
			canDeclineChallan: null,
			canConvertToInvoice: null,
		};

		this.debounceResize = null;
		// this.handleResize = this.handleResize.bind(this);
	}

	// componentDidMount() {
	// 	if (!invoiz.user.hasPermission(userPermissions.VIEW_CHALLAN)) {
	// 		invoiz.user.logout(true);
	// 	}
	// 	// window.addEventListener("resize", this.handleResize);
	// 	// this.setState({
	// 	// 	canCreateChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_CHALLAN),
	// 	// 	canDeleteChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_CHALLAN),
	// 	// 	canUpdateChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_CHALLAN),
	// 	// 	canDeliverChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.ACCEPT_CHALLAN),
	// 	// 	canDeclineChallan: invoiz.user && invoiz.user.hasPermission(userPermissions.DECLINE_CHALLAN),
	// 	// 	canConvertToInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.SET_OPEN_CHALLAN),
	// 	// });

	// 	// const { challan } = this.state;
	// 	// invoiz
	// 	// 	.request(`${config.deliveryChallan.resourceUrl}/${parseInt(challan.id, 10)}/document`, {
	// 	// 		auth: true,
	// 	// 		method: "POST",
	// 	// 		data: {
	// 	// 			isPrint: false,
	// 	// 		},
	// 	// 	})
	// 	// 	.then((pdfPathResponse) => {
	// 	// 		const { path } = pdfPathResponse.body.data;
	// 	// 		challan.pdfPath = config.imageResourceHost + path;
	// 	// 		fetch(challan.pdfPath, {
	// 	// 			method: "GET",
	// 	// 		})
	// 	// 			.then((response) => response.arrayBuffer())
	// 	// 			.then((arrayBuffer) => PDFJS.getDocument(arrayBuffer))
	// 	// 			.then((pdf) => {
	// 	// 				let currentPage = 1;
	// 	// 				const numPages = pdf.numPages;
	// 	// 				const myPDF = pdf;

	// 	// 				const handlePages = (page) => {
	// 	// 					const wrapper = document.getElementById("invoice-detail-pdf-wrapper");
	// 	// 					const canvas = document.createElement("canvas");
	// 	// 					canvas.width = "925";
	// 	// 					const context = canvas.getContext("2d");
	// 	// 					const viewport = page.getViewport(canvas.width / page.getViewport(1.0).width);
	// 	// 					canvas.height = viewport.height;
	// 	// 					page.render({
	// 	// 						canvasContext: context,
	// 	// 						viewport,
	// 	// 					});
	// 	// 					if (wrapper) wrapper.appendChild(canvas);
	// 	// 					currentPage++;
	// 	// 					if (currentPage <= numPages) {
	// 	// 						myPDF.getPage(currentPage).then(handlePages);
	// 	// 					}
	// 	// 				};

	// 	// 				myPDF.getPage(currentPage).then(handlePages);
	// 	// 			});
	// 	// 	});
	// 	// invoiz.request(`${config.resourceHost}setting/textModule`, { auth: true }).then((textModuleResponse) => {
	// 	// 	const {
	// 	// 		body: {
	// 	// 			data: { challan: challanTexts },
	// 	// 		},
	// 	// 	} = textModuleResponse;
	// 	// 	challanTexts.email = challanTexts.email.replace(/<\/?[^>]+>/gi, "");
	// 	// 	challanTexts.email = challanTexts.email.replace("<br>", "%0D%0A");
	// 	// 	this.setState({ challanTexts });
	// 	// });
	// }

	// componentWillUnmount() {
	// 	// window.removeEventListener("resize", this.handleResize);
	// }

	hasCustomerAndPositions() {
		const { challan } = this.state;
		return (
			challan.customerData &&
			Object.keys(challan.customerData).length > 0 &&
			challan.positions &&
			challan.positions.length > 0
		);
	}

	render() {
		const { resources } = this.props;
		const timelineEntries = createTimelineObjects(this.state.challan, resources);
		const topbarButtons = createTopbarButtons(
			this.state.challan,
			this.state,
			{
				acceptButtonLoading: this.state.acceptButtonLoading,
				hasCustomerAndPositions: this.hasCustomerAndPositions(),
			},
			resources
		);
		const topbarPermittedButtons = createTopbarPermissionButtons(topbarButtons, this.state, resources);
		const topbarDropdownItems = createTopbarDropdown(this.state.challan, resources);
		const activeAction = this.state.downloading
			? DeliveryChallanAction.DOWNLOAD_PDF
			: this.state.printing
			? DeliveryChallanAction.PRINT
			: null;
		const headContents = createDetailViewHeadObjects(this.state.challan, activeAction, resources);
		const title = this.state.challan.state === this.state.challan.displayNumber;
		const badge = this.createStateBadge();

		const timelineIsHorizontal = this.state.viewportWidth <= DetailViewConstants.VIEWPORT_BREAKPOINT;
		const timeline = (
			<div className={`offer-detail-timeline ${timelineIsHorizontal ? "offer-detail-timeline-horizontal" : ""}`}>
				<TimelineComponent entries={timelineEntries} isHorizontal={timelineIsHorizontal} />
			</div>
		);

		let images = [];
		let count = 0;
		// this.state.challan.thumbnails.forEach((thumbnail) => {
		// 	thumbnail.imageUrls.forEach((url) => {
		// 		count++;
		// 		images.push(<img key={`challan-image-${count}`} src={config.imageResourceHost + url} width="100%" />);
		// 	});
		// });

		const { letterPaperType, canUpdateChallan, canDeleteChallan } = this.state;

		if (!this.hasCustomerAndPositions()) {
			headContents.actionElements = null;
		}

		if (!this.hasCustomerAndPositions()) {
			images = [
				<div key="offer-image-dummy" className="offer-image-draft-state-hint">
					{resources.challanCustomerMessage}
				</div>,
			];
		}

		const detailHeadContent = (
			<div>
				<DetailViewHeadPrintPopoverComponent
					printSettingUrl={`${config.deliveryChallan.resourceUrl}/${this.state.challan.id}/print/setting`}
					letterPaperType={letterPaperType}
					letterPaperChangeCallback={(letterPaperType) => {
						invoiz
							.request(`${config.deliveryChallan.resourceUrl}/${this.state.challan.id}/document`, {
								auth: true,
								method: "POST",
								data: {
									isPrint: true,
								},
							})
							.then((response) => {
								const { path } = response.body.data;
								const { challan } = this.state;
								challan.pdfPath = config.imageResourceHost + path;
								this.setState({ letterPaperType, challan });
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
								.request(`${config.deliveryChallan.resourceUrl}/${this.state.challan.id}/external/link`, {
									auth: true,
								})
								.then((response) => {
									const {
										body: {
											data: { linkToChallanCustomerCenter },
										},
									} = response;
									this.setState({ customerCenterLink: linkToChallanCustomerCenter }, () => {
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
								onClick={() => this.onHeadControlClick(DeliveryChallanAction.COPY_CUSTOMERCENTER_LINK)}
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
								href={`mailto:?subject=${resources.str_challanNumber}%20${
									this.state.challan.number
								}&body=${
									this.state.challanTexts && this.state.challanTexts.email
										? encodeURIComponent(this.state.challanTexts.email)
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

		return (
			<div className={`offer-detail-wrapper wrapper-has-topbar ${!timelineIsHorizontal ? "viewport-large" : ""}`}>
				{canUpdateChallan && canDeleteChallan ? (
					<TopbarComponent
						title={`${resources.str_offerUpperCase} ${title}`}
						buttonCallback={(event, button) => this.handleTopbarButtonClick(event, button)}
						backButtonRoute={"deliverychallans"}
						dropdownEntries={topbarDropdownItems}
						dropdownCallback={(entry) => this.handleTopbarDropdownClick(entry)}
						buttons={topbarPermittedButtons}
					/>
				) : (
					<TopbarComponent
						title={`${resources.str_offerUpperCase} ${title}`}
						buttonCallback={(event, button) => this.handleTopbarButtonClick(event, button)}
						backButtonRoute={"deliverychallans"}
						// dropdownEntries={topbarDropdownItems}
						// dropdownCallback={entry => this.handleTopbarDropdownClick(entry)}
						buttons={topbarPermittedButtons}
					/>
				)}

				<div className="detail-view-head-container">
					{timeline}
					{detailHeadContent}
				</div>

				<div className="detail-view-document">
					{badge}
					<img className="detail-view-preview" src="/assets/images/invoice-preview.png" />
					{images}
					<div id="invoice-detail-pdf-wrapper" />
				</div>

				<div className="detail-view-box">
					<NotesComponent
						heading={resources.str_remarks}
						data={{ notes: this.state.challan.notes }}
						onSave={(value) => this.onNotesChange(value.notes)}
						resources={resources}
						placeholder={format(resources.defaultCommentsPlaceholderText, resources.str_quotationSmall)}
						defaultFocus={true}
					/>
				</div>
			</div>
		);
	}

	onHeadControlClick(action) {
		const { resources } = this.props;
		switch (action) {
			case DeliveryChallanAction.EMAIL:
				invoiz.router.navigate(`/challan/send/${this.state.challan.id}`);
				break;

			case DeliveryChallanAction.SHOW_PRINT_SETTINGS_POPOVER:
				this.refs["detail-head-print-settings-popover"].show();
				break;

			case DeliveryChallanAction.DOWNLOAD_PDF: {
				const challan = this.state.challan;

				this.setState({ downloading: true }, () => {
					invoiz
						.request(`${config.challan.resourceUrl}/${parseInt(challan.id, 10)}/document`, {
							auth: true,
							method: "POST",
							data: {
								isPrint: false,
							},
						})
						.then((response) => {
							const { path } = response.body.data;
							challan.pdfPath = config.imageResourceHost + path;
							downloadPdf({
								pdfUrl: challan.pdfPath,
								title: `${resources.str_challanUpperCase} ${challan.number}`,
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

			case DeliveryChallanAction.PRINT:
				const challan = this.state.challan;

				this.setState({ printing: true }, () => {
					invoiz
						.request(`${config.challan.resourceUrl}/${parseInt(challan.id, 10)}/document`, {
							auth: true,
							method: "POST",
							data: {
								isPrint: true,
							},
						})
						.then((response) => {
							const { path } = response.body.data;
							challan.pdfPath = config.imageResourceHost + path;
							printPdf({
								pdfUrl: challan.pdfPath,
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

			case DeliveryChallanAction.COPY_CUSTOMERCENTER_LINK:
				const customerCenterLinkElm = $("<input />", {
					value: this.state.customerCenterLink,
				});
				customerCenterLinkElm.appendTo("body");
				customerCenterLinkElm[0].select();
				document.execCommand("copy");
				customerCenterLinkElm.remove();
				invoiz.showNotification({ message: resources.offerLinkCopiedText });
				break;

			case DeliveryChallanAction.SHOW_COPY_LINK_POPOVER:
				$("#detail-head-copy-link-popover-anchor").click();
				break;
		}
	}

	onNotesChange(notes) {
		invoiz.request(`${config.challan.resourceUrl}/${this.state.challan.id}/notes`, {
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
			.request(`${config.challan.resourceUrl}/${this.state.challan.id}/state`, {
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

	// createProject() {
	// 	invoiz.router.navigate(`/project/new/${this.state.challan.id}`);
	// }

	copyAndEdit() {
		const { resources } = this.props;
		LoadingService.show(resources.str_challanCopy);
		copyAndEditTransaction({
			invoiceModel: {
				type: "challan",
				id: this.state.challan.id,
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
		ModalService.open(resources.challanDeleteConfirmText, {
			headline: resources.str_deleteChallan,
			cancelLabel: resources.str_abortStop,
			confirmLabel: resources.str_clear,
			confirmIcon: "icon-trashcan",
			confirmButtonType: "secondary",
			onConfirm: () => {
				ModalService.close();

				invoiz
					.request(`${config.challan.resourceUrl}/${this.state.challan.id}`, {
						auth: true,
						method: "DELETE",
					})
					.then(() => {
						invoiz.showNotification(resources.challanDeleteSuccessMessage);
						invoiz.router.navigate("/deliverychallans");
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
		invoiz.router.navigate(`challan/edit/${this.state.challan.id}`);
	}

	invoice() {
		const { resources } = this.props;
		invoiz
			.request(`${config.challan.resourceUrl}/${this.state.challan.id}/state`, {
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
			.request(`${config.challan.resourceUrl}/${this.state.challan.id}/state`, {
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

	declined() {
		const { resources } = this.props;
		invoiz
			.request(`${config.challan.resourceUrl}/${this.state.challan.id}/state`, {
				method: "PUT",
				auth: true,
				data: { state: "declined" },
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
			case DeliveryChallanAction.ACCEPT:
				this.accept();
				break;

			case DeliveryChallanAction.EDIT:
				this.edit();
				break;

			case DeliveryChallanAction.INVOICE:
				this.invoice();
				break;
		}
	}

	handleTopbarDropdownClick(item) {
		switch (item.action) {
			case DeliveryChallanAction.COPY_AND_EDIT:
				this.copyAndEdit();
				break;

			case DeliveryChallanAction.DELETE:
				this.delete();
				break;

			case DeliveryChallanAction.REJECT:
				this.declined();
				break;

			case DeliveryChallanAction.INVOICE:
				this.invoice();
				break;

			case DeliveryChallanAction.RESET:
				this.reset();
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
		switch (this.state.challan.state) {
			case DeliveryChallanState.OPEN:
				iconClass = "icon-offen";
				badgeString = resources.str_openSmall;
				break;
			case DeliveryChallanState.DELIVERED:
				iconClass = "icon-check";
				badgeString = resources.str_deliveredSmall;
				badgeClass = "detail-view-badge-accepted";
				break;
			case DeliveryChallanState.INVOICED:
				iconClass = "icon-rechnung";
				badgeString = resources.str_createAccount;
				badgeClass = "detail-view-badge-invoiced";
				break;
			case DeliveryChallanState.DECLINED:
				iconClass = "icon-ueberfaellig";
				badgeString = resources.str_declined;
				badgeClass = "detail-view-badge-rejected";
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

export default DeliveryChallanDetailComponent;
