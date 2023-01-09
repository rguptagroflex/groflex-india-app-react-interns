import React from 'react';
import ReactDOM from 'react-dom';

class PdfPreviewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			show: this.props.show || false,
		};

		this.wrapperRef = React.createRef();
		this.open = this.open.bind(this);
		this.close = this.close.bind(this);
		this.onEscape = this.onEscape.bind(this);
		this.renderPdf = this.renderPdf.bind(this);
	}

	componentDidMount() {
		this.renderPdf();

		window.addEventListener('resize', this.renderPdf);
		document.addEventListener('keydown', this.onEscape);
		document.body.style.overflow = this.state.open ? 'hidden' : '';
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.renderPdf);
		document.removeEventListener('keydown', this.onEscape);
	}

	componentDidUpdate(prevProps) {
		if (prevProps.show !== this.props.show && this.props.show !== this.state.show) {
			this.setState({ show: this.props.show }, () => {
				if (this.state.show) {
					this.open();
				} else {
					this.close();
				}
			});
		}
	}

	renderPdf() {
		const { pdf } = this.props;
		let currentPage = 1;
		const numPages = pdf.numPages;
		const myPDF = pdf;
		const wrapper = this.wrapperRef && this.wrapperRef.current;
		wrapper.innerHTML = '';

		const handlePages = (page) => {
			const canvas = document.createElement('canvas');
			const context = canvas.getContext('2d');
			canvas.width = window.innerWidth > 1005 ? 925 : window.innerWidth - 120;
			const viewport = page.getViewport(canvas.width / page.getViewport(1.0).width);
			canvas.height = viewport.height;
			page.render({
				canvasContext: context,
				viewport,
			});
			wrapper.appendChild(canvas);
			currentPage++;
			if (currentPage <= numPages) {
				myPDF.getPage(currentPage).then(handlePages);
			}
		};

		myPDF.getPage(currentPage).then(handlePages);
	}

	open() {
		this.setState({ show: true });
		document.addEventListener('click', this.close);
		document.body.style.overflow = 'hidden';
	}

	close() {
		this.setState({ show: false }, () => {
			this.props.onClose && this.props.onClose();
			document.removeEventListener('click', this.close);
			document.body.style.overflow = '';
		});
	}

	onEscape(event) {
		if (event.key === 'Escape' || event.keyCode === 27) {
			this.close();
		}
	}

	render() {
		const { show } = this.state;
		const pdfPreview = (
			<div className={`pdf-preview-component ${show ? '' : 'hide-pdf-preview'}`}>
				<div className="icon icon-close2" onClick={this.close}></div>
				<div className="pdf-preview-wrapper" ref={this.wrapperRef}></div>
			</div>
		);

		return ReactDOM.createPortal(pdfPreview, document.body);
	}
}

export default PdfPreviewComponent;
