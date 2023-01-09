import React from 'react';
import invoiz from 'services/invoiz.service';
import TopbarComponent from 'shared/topbar/topbar.component';
import DetailViewHeadComponent from 'shared/detail-view/detail-view-head.component';
import config from 'config';
import DunningInvoiceAction from 'enums/dunning/dunning-invoice-action.enum';
import DetailViewHeadPrintPopoverComponent from 'shared/detail-view/detail-view-head-print-popover.component';
import DetailViewHeadPrintTooltipComponent from 'shared/detail-view/detail-view-head-print-tooltip.component';
import TransactionPrintSetting from 'enums/transaction-print-setting.enum';
import { printPdf } from 'helpers/printPdf';
import { downloadPdf } from 'helpers/downloadPdf';
import { formatCurrency } from 'helpers/formatCurrency';
import { formatDate } from 'helpers/formatDate';
import { Link } from 'react-router-dom';
import userPermissions from 'enums/user-permissions.enum';

const createDetailViewHeadObjects = (data, activeAction, resources) => {
	const object = {
		leftElements: [],
		rightElements: [],
		actionElements: []
	};

	const { dunning, invoice } = data;

	object.actionElements.push(
		{
			name: resources.str_sendEmail,
			icon: 'icon-mail',
			action: DunningInvoiceAction.EMAIL,
			dataQsId: 'dunning-head-action-email'
		},
		{
			name: resources.str_pdf,
			icon: 'icon-pdf',
			action: DunningInvoiceAction.DOWNLOAD_PDF,
			actionActive: activeAction === DunningInvoiceAction.DOWNLOAD_PDF,
			dataQsId: 'dunning-head-action-downloadPdf'
		},
		{
			name: resources.str_print,
			icon: 'icon-print2',
			action: DunningInvoiceAction.PRINT,
			actionActive: activeAction === DunningInvoiceAction.PRINT,
			dataQsId: 'dunning-head-action-print',
			controlsItemClass: 'item-print',
			id: 'detail-head-print-anchor'
		},
		{
			name: '',
			icon: 'icon-arr_down',
			action: DunningInvoiceAction.SHOW_PRINT_SETTINGS_POPOVER,
			dataQsId: 'dunning-head-action-printSettings',
			controlsItemClass: 'item-print-settings',
			id: 'detail-head-print-settings-popover-anchor'
		}
	);

	object.rightElements.push(
		{
			headline: resources.outstandingBalanceText,
			value: formatCurrency(invoice.outstandingAmount + dunning.charge)
		},
		{
			headline: resources.str_dunningCharge,
			value: formatCurrency(dunning.charge)
		},
		{
			headline: resources.str_dunningDate,
			value: formatDate(dunning.date)
		}
	);

	object.leftElements.push({
		headline: resources.str_customer,
		value: <Link to={'/customer/' + invoice.customerId}>{invoice.displayName}</Link>,
		subValue: (
			<div>
				{resources.str_invoice}: <Link to={`/invoice/${invoice.id}`}>{invoice.number}</Link>
			</div>
		)
	});

	return object;
};

class DunningInvoiceDetailComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			viewportWidth: window.innerWidth,
			canDownloadInvoice: null,
			canSendInvoice: null,
			canCopyInvoice: null,
			canPrintInvoice: null,
			downloading: false,
			printing: false,
			letterPaperType: this.props.dunning.printCustomDocument
				? TransactionPrintSetting.CUSTOM_LETTER_PAPER
				: TransactionPrintSetting.DEFAULT_LETTER_PAPER
		};
	}

	componentDidMount() {
		const { dunning, resources } = this.props;
		this.setState({
			canDownloadInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.DOWNLOAD_INVOICE),
			canPrintInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.PRINT_INVOICE),
			canSendInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.SEND_INVOICE),
			canCopyInvoice: invoiz.user && invoiz.user.hasPermission(userPermissions.COPY_LINK_INVOICE)
		})
		invoiz
			.request(`${config.resourceHost}dunning/${dunning.id}/document`, {
				auth: true,
				method: 'POST',
				data: {
					isPrint: false
				}
			})
			.then(pdfPathResponse => {
				const { path } = pdfPathResponse.body.data;
				dunning.pdfPath = config.imageResourceHost + path;
				fetch(dunning.pdfPath, {
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
		const { downloading, printing, letterPaperType, canCopyInvoice, canDownloadInvoice, canPrintInvoice, canSendInvoice } = this.state;
		const { dunning, invoice, resources } = this.props;

		const activeAction = downloading
			? DunningInvoiceAction.DOWNLOAD_PDF
			: printing
				? DunningInvoiceAction.PRINT
				: null;

		const headContents = createDetailViewHeadObjects({ dunning, invoice }, activeAction, resources);

		const detailHeadContent = (
			<div>
				{ (canSendInvoice && canDownloadInvoice && canCopyInvoice && canPrintInvoice) ? <DetailViewHeadComponent
					controlActionCallback={action => this.onHeadControlClick(action)}
					actionElements={headContents.actionElements}
					leftElements={headContents.leftElements}
					rightElements={headContents.rightElements}
				/> : <DetailViewHeadComponent
				controlActionCallback={action => this.onHeadControlClick(action)}
				// actionElements={headContents.actionElements}
				leftElements={headContents.leftElements}
				rightElements={headContents.rightElements}
			/> }
				<DetailViewHeadPrintTooltipComponent letterPaperType={letterPaperType} resources= {resources} />
			</div>
		);

		return (
			<div className="dunning-invoice-detail-wrapper wrapper-has-topbar">
				<TopbarComponent title={resources.str_paymentRemainder} backButtonCallback={() => window.history.back()} />

				<div className="detail-view-head-container">
					<DetailViewHeadPrintPopoverComponent
						printSettingUrl={`${config.resourceHost}dunning/${dunning.id}/print/setting`}
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
					<img className="detail-view-preview" src="/assets/images/invoice-preview.png" />
					{/* <img src={config.imageResourceHost + dunning.paths[0]} /> */}
					<div id="invoice-detail-pdf-wrapper" />
				</div>
			</div>
		);
	}

	onHeadControlClick(action) {
		const { dunning, resources } = this.props;

		switch (action) {
			case DunningInvoiceAction.EMAIL:
				invoiz.router.navigate(`dunning/send/${dunning.invoiceId}/${dunning.id}`);
				break;
			case DunningInvoiceAction.DOWNLOAD_PDF:
				this.setState({ downloading: true }, () => {
					invoiz
						.request(`${config.resourceHost}dunning/${dunning.id}/document`, {
							auth: true,
							method: 'POST',
							data: {
								isPrint: false
							}
						})
						.then(response => {
							const { path } = response.body.data;
							downloadPdf({
								pdfUrl: config.imageResourceHost + path,
								title: resources.str_paymentRemainder,
								isPost: false,
								callback: () => {
									this.setState({ downloading: false });
								}
							});
						});
				});
				break;
			case DunningInvoiceAction.PRINT:
				this.setState({ printing: true }, () => {
					invoiz
						.request(`${config.resourceHost}dunning/${dunning.id}/document`, {
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
			case DunningInvoiceAction.SHOW_PRINT_SETTINGS_POPOVER:
				this.refs['detail-head-print-settings-popover'].show();
				break;
		}
	}
}

export default DunningInvoiceDetailComponent;
