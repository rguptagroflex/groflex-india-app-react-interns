import invoiz from 'services/invoiz.service';
import { Link } from 'react-router-dom';
import React from 'react';
import TopbarComponent from 'shared/topbar/topbar.component';
import DetailViewHeadComponent from 'shared/detail-view/detail-view-head.component';
import config from 'config';
import CancellationInvoiceAction from 'enums/cancellation-invoice/cancellation-invoice-action.enum';
import DetailViewHeadPrintPopoverComponent from 'shared/detail-view/detail-view-head-print-popover.component';
import DetailViewHeadPrintTooltipComponent from 'shared/detail-view/detail-view-head-print-tooltip.component';
import TransactionPrintSetting from 'enums/transaction-print-setting.enum';
import { printPdf } from 'helpers/printPdf';
import { downloadPdf } from 'helpers/downloadPdf';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatApiDate, formatClientDate } from 'helpers/formatDate';

const createDetailViewHeadObjects = (cancellation, activeAction, resources) => {
	const object = {
		leftElements: [],
		rightElements: [],
		actionElements: []
	};
	object.actionElements.push(
		{
			name: resources.str_sendEmail,
			icon: 'icon-mail',
			action: CancellationInvoiceAction.EMAIL,
			dataQsId: 'cancellation-head-action-email'
		},
		{
			name: resources.str_pdf,
			icon: 'icon-pdf',
			action: CancellationInvoiceAction.DOWNLOAD_PDF,
			actionActive: activeAction === CancellationInvoiceAction.DOWNLOAD_PDF,
			dataQsId: 'cancellation-head-action-downloadPdf'
		},
		{
			name: resources.str_print,
			icon: 'icon-print2',
			action: CancellationInvoiceAction.PRINT,
			actionActive: activeAction === CancellationInvoiceAction.PRINT,
			dataQsId: 'cancellation-head-action-print',
			controlsItemClass: 'item-print',
			id: 'detail-head-print-anchor'
		},
		// {
		// 	name: '',
		// 	icon: 'icon-arr_down',
		// 	action: CancellationInvoiceAction.SHOW_PRINT_SETTINGS_POPOVER,
		// 	dataQsId: 'cancellation-head-action-printSettings',
		// 	controlsItemClass: 'item-print-settings',
		// 	id: 'detail-head-print-settings-popover-anchor'
		// }
	);

	object.leftElements.push({
		headline: cancellation.metaData.type === "invoice" ? resources.str_customer : `Payee`,
		value: cancellation.displayCustomerNumber < 0 ? cancellation.displayName : <Link to={'/customer/' + cancellation.customerId}>{cancellation.displayName}</Link>,
	});

	const amount = formatCurrency(cancellation.totalGross);
	const amountCredited = formatCurrency(cancellation.paidAmount);
	const refundType = cancellation.metaData.type === "invoice" ? cancellation.refundType === `credits` ? cancellation.paidAmount > 0 ? `Added to balance` : `Not added to credits` : `Refunded to source` : 
	cancellation.refundType === `debits` ? cancellation.paidAmount > 0 ? `Added to balance` : `Not added to debit sum` : `Refunded to source`
	if(cancellation.metaData.type === "invoice" )
	object.rightElements.push(
		{
		headline: `Available amount`,
		value: formatCurrency(cancellation.refundAvailable)
		})


	object.rightElements.push(
		{
			headline: `Amount paid`,
			value: amountCredited
		}
		
	);
	cancellation.metaData.type === "invoice" 
	? object.rightElements.push(
		{
			headline: `Refund type`,
			value: refundType
		},
		// {
		// 	headline: cancellation.metaData.type === "invoice" ? resources.invoiceDate : `Date of expense`,
		// 	value: formatClientDate(cancellation.deliveryDate)
		// }
	)
	:object.rightElements.push(
		{
		headline: cancellation.metaData.type === "invoice" ? resources.invoiceDate : `Date of expense`,
		value: formatClientDate(cancellation.deliveryDate)
		}
	)



	return object;
};

class CancellationInvoiceDetailComponent extends React.Component {
	constructor(props) {
		super(props);

		const cancellation = this.props.cancellation || {};

		this.state = {
			viewportWidth: window.innerWidth,
			cancellation,
			downloading: false,
			printing: false,
			letterPaperType: cancellation.printCustomDocument
				? TransactionPrintSetting.CUSTOM_LETTER_PAPER
				: TransactionPrintSetting.DEFAULT_LETTER_PAPER
		};
	}

	componentDidMount() {
		const { cancellation } = this.state;
		invoiz
			.request(`${config.resourceHost}${cancellation.metaData.type === "invoice" ? 'cancellation/' : 'expenseCancellation/'}${parseInt(this.state.cancellation.id, 10)}/document`, {
				auth: true,
				method: 'POST',
				data: {
					isPrint: false
				}
			})
			.then(pdfPathResponse => {
				const { path } = pdfPathResponse.body.data;
				cancellation.pdfPath = config.imageResourceHost + path;
				fetch(cancellation.pdfPath, {
					method: 'GET'
				})
					.then(response => response.arrayBuffer())
					.then(arrayBuffer => PDFJS.getDocument(arrayBuffer))
					.then(pdf => {
						let currentPage = 1;
						const numPages = pdf.numPages;
						const myPDF = pdf;

						const handlePages = page => {
							const wrapper = document.getElementById('invoice-detail-pdf-wrapper');
							const canvas = document.createElement('canvas');
							canvas.width = '925';
							const context = canvas.getContext('2d');
							const viewport = page.getViewport(canvas.width / page.getViewport(1.0).width);
							canvas.height = viewport.height;
							page.render({
								canvasContext: context,
								viewport
							});
							wrapper.appendChild(canvas);
							currentPage++;
							if (currentPage <= numPages) {
								myPDF.getPage(currentPage).then(handlePages);
							}
						};

						myPDF.getPage(currentPage).then(handlePages);
					});
			});
	}

	render() {
		const { resources } = this.props;
		const { cancellation } = this.state;
		const activeAction = this.state.downloading
			? CancellationInvoiceAction.DOWNLOAD_PDF
			: this.state.printing
				? CancellationInvoiceAction.PRINT
				: null;
		const { letterPaperType } = this.state;
		const headContents = createDetailViewHeadObjects(this.state.cancellation, activeAction, resources);
		const detailHeadContent = (
			<div>
				<DetailViewHeadComponent
					controlActionCallback={action => this.onHeadControlClick(action)}
					actionElements={headContents.actionElements}
					leftElements={headContents.leftElements}
					rightElements={headContents.rightElements}
				/>
				<DetailViewHeadPrintTooltipComponent letterPaperType={letterPaperType} resources = {resources}/>
			</div>
		);
		const subtitle = (
			<div>
				({`For ${cancellation.metaData.type === "invoice" ? 'invoice' : 'expense'} number`}{' '}
				<Link to={`${cancellation.metaData.type === "invoice" ? `/invoice/${this.state.cancellation.invoiceId}` : `/expense/edit/${this.state.cancellation.expenseId}`}`}>
					{cancellation.metaData.type === "invoice" ? this.state.cancellation.metaData.invoiceNumber : this.state.cancellation.metaData.expenseNumber}
				</Link>
				)
			</div>
		);

		const images = [];
		let count = 0;
		this.state.cancellation.thumbnails.forEach(thumbnail => {
			thumbnail.imageUrls.forEach(url => {
				count++;
				images.push(<img key={`cancellation-invoice-image-${count}`} src={config.imageResourceHost + url} />);
			});
		});

		return (
			<div className="cancellation-invoice-detail-wrapper wrapper-has-topbar">
				<TopbarComponent
					title={`${cancellation.metaData.type === "invoice" ? resources.str_invoiceCancellation : `Debit note`} ${this.state.cancellation.number}`}
					subtitle={subtitle}
					backButtonRoute={`${cancellation.refundType === `credits` ? `cancellations` : `expenses/cancellations`}`}
				/>

				<div className="detail-view-head-container">
					<DetailViewHeadPrintPopoverComponent
						printSettingUrl={`${config.resourceHost}cancellation/${
							this.state.cancellation.id
						}/print/setting`}
						letterPaperType={letterPaperType}
						letterPaperChangeCallback={letterPaperType => {
							this.setState({ letterPaperType });
						}}
						ref="detail-head-print-settings-popover"
						resources = {resources}
					/>
					{detailHeadContent}
				</div>

				<div className="detail-view-document">
					{/* {images} */}
					<img className="detail-view-preview" src="/assets/images/invoice-preview.png" />
					<div id="invoice-detail-pdf-wrapper" />
				</div>

				<div className="detail-view-box">
					<div className="notes_heading text-h4">{resources.str_reversalReason}</div>
					<p>{this.state.cancellation.notes}</p>
				</div>
			</div>
		);
	}

	onHeadControlClick(action) {
		const { resources } = this.props;
		switch (action) {
			case CancellationInvoiceAction.EMAIL:
				invoiz.router.navigate(`cancellation/send/${this.state.cancellation.id}`);
				break;

			case CancellationInvoiceAction.DOWNLOAD_PDF:
				this.setState({ downloading: true }, () => {
					invoiz
						.request(`${config.resourceHost}cancellation/${this.state.cancellation.id}/document`, {
							auth: true,
							method: 'POST',
							data: {
								isPrint: false
							}
						})
						.then(response => {
							const { path } = response.body.data;
							const title = this.state.cancellation.number;
							downloadPdf({
								pdfUrl: config.imageResourceHost + path,
								title: `${resources.str_invoiceCancellation} ${title}`,
								isPost: false,
								callback: () => {
									this.setState({ downloading: false });
								}
							});
						});
				});
				break;

			case CancellationInvoiceAction.PRINT:
				this.setState({ printing: true }, () => {
					invoiz
						.request(`${config.resourceHost}cancellation/${this.state.cancellation.id}/document`, {
							auth: true,
							method: 'POST',
							data: {
								isPrint: true
							}
						})
						.then(response => {
							const { path } = response.body.data;
							printPdf({
								pdfUrl: config.imageResourceHost + path,
								isPost: false,
								callback: () => {
									this.setState({ printing: false });
								}
							});
						});
				});
				break;

			case CancellationInvoiceAction.SHOW_PRINT_SETTINGS_POPOVER:
				this.refs['detail-head-print-settings-popover'].show();
				break;
		}
	}
}

export default CancellationInvoiceDetailComponent;
