import React from "react";
import _ from "lodash";
import q from "q";
import config from "config";
import invoiz from "services/invoiz.service";
import { fabric } from "fabric";
import PropTypes from "prop-types";
import { FineUploaderBasic as Uploader } from "fine-uploader";
import LetterFooterState from "enums/letter/letter-footer-state.enum";
import LoaderComponent from "shared/loader/loader.component";
import LetterElement from "models/letter/letter-element.model";
import {
	letterElementsToFabricObjects,
	fabricObjectToImageLetterElement,
	fabricObjectToTextLetterElement,
	fabricObjectToShapeLetterElement,
} from "helpers/letterHeaderHelpers";
import SVGInline from "react-svg-inline";
import plusSvgGreen from "../../../assets/images/icons/plusSvgGreen.svg";

const KEY_CODES = config.KEY_CODES;

const DEFAULT_FONT_SIZE = 28;
const DEFAULT_FONT_FAMILY = "Caveat";
const DEFAULT_FONT_COLOR = "#272d30";
const DEFAULT_FONT_WEIGHT = 400;
const CANVAS_HEIGHT = 100;
const CANVAS_WIDTH = 226;
const OFFSET = 0;

const CANVAS_ZINDEX_OFFSET = 3;
const BOUNDING_BOX = {
	left: OFFSET,
	top: OFFSET,
	width: CANVAS_WIDTH - OFFSET * 2,
	height: CANVAS_HEIGHT - OFFSET * 2,
};
const CENTER = {
	x: BOUNDING_BOX.left + BOUNDING_BOX.width / 2,
	y: BOUNDING_BOX.top + BOUNDING_BOX.height / 2,
};
const H_SNAP_POINTS = [OFFSET, CENTER.y, CANVAS_WIDTH - OFFSET, CENTER.y];
const V_SNAP_POINTS = [CENTER.x, OFFSET, CENTER.x, CANVAS_HEIGHT - OFFSET];

class LetterFooterSignatureComponent extends React.Component {
	constructor(props) {
		super(props);
		const { items } = props;
		this.state = {
			items,
			footerState: items.length > 1 ? LetterFooterState.DISPLAY : LetterFooterState.EDIT,
			loading: false,
			deleteButtonActive: false,
			hSnapVisible: false,
			vSnapVisible: false,
			wrapperVisible: false,
			fabricObjects: [],
			showClearButton: false,
			imageSelected: false,
			textSelected: false,
			signatureText: "",
		};
		this.uploader = undefined;
		this.vSnap = undefined;
		this.hSnap = undefined;
		this.whenImageUploaded = q.defer();
		this.isSaving = false;
		this.footerStateEdit = false;
	}
	render() {
		let content;
		const { resources, items } = this.props;
		switch (this.state.footerState) {
			case LetterFooterState.DISPLAY:
				const displayItems = this.state.items.map((item, index) => {
					const {
						type,
						metaData: { font, html, imageUrl },
					} = item;

					switch (type) {
						case "image":
							return (
								<img
									src={`${config.imageResourceHost}${imageUrl}`}
									className="footerSignatureImage"
									key={`letter-footer-item-${index}`}
								/>
							);
						case "text":
							// return (
							// 	<div className={`${font === DEFAULT_FONT_FAMILY ? 'footerSignatureName' : 'footerSignatureText'}`} key={`letter-footer-item-${index}`} dangerouslySetInnerHTML={{ __html: html }}></div>
							// );
							if (font === DEFAULT_FONT_FAMILY) {
								return (
									<div
										className="footerSignatureName"
										key={`letter-footer-item-${index}`}
										dangerouslySetInnerHTML={{ __html: html }}
									></div>
								);
							}
					}
				});
				content = (
					<div className="footerDisplay" onClick={() => this.onFooterDisplayClick()}>
						{displayItems}
					</div>
				);
				break;
			case LetterFooterState.EDIT:
				this.setOpacity("hSnap", +this.state.hSnapVisible);
				this.setOpacity("vSnap", +this.state.vSnapVisible);
				this.setOpacity("wrapper", +this.state.wrapperVisible);
				const uploadButton = (
					<div ref={"uploadButton"} className="signatureEmpty">
						{/* <div className="icon icon-rounded icon-plus" /> */}
						<div>
							<SVGInline
								width="17px"
								height="17px"
								svg={plusSvgGreen}
								className="vertically-middle u_mt_3"
							/>
							<span className="signatureEmpty_label" ref="uploadButton">
								{/* {resources.letterFooterSignatureUploadLogoText} */}
								Upload
							</span>
						</div>
						<div className="or-div">Or Drop a file</div>
					</div>
				);
				content = (
					<div>
						{/* <div className="footerSignatureText" dangerouslySetInnerHTML={{ __html: items[0].metaData.html }}></div> */}
						<LoaderComponent text="" visible={this.state.loading} />
						<div className={`footerEdit ${this.state.wrapperVisible ? "footerEdit-active" : ""}`}>
							<div>
								<form ref="form" className="form letterFooter_tools">
									<button ref="formSubmit" className="u_hidden" />
									<div className="uploadButtonRow">
										{/* <div className="u_vc"> */}
										{this.state.showClearButton === false ? uploadButton : null}
										{/* </div> */}
									</div>
								</form>
								{this.state.showClearButton === false ? (
									<div className="orSection">
										{/* {resources.letterFooterSignatureTextTitle} */}
										Or
									</div>
								) : null}
							</div>
							{this.state.imageSelected === false ? (
								<div className="signature-text-div">
									<input
										type="text"
										placeholder={resources.str_namePlaceholder}
										onBlur={(event) => this.onBlur(event)}
										onKeyDown={(event) => this.onKeyDown(event)}
									/>
								</div>
							) : null}
							<div className="canvas-upper-div">
								<canvas ref="canvas" />
							</div>
						</div>
					</div>
				);
				break;
		}

		return (
			<div className="footerSignatureItems" onClick={(event) => this.onFooterWrapperClick(event)}>
				{/* <span disabled={!this.state.deleteButtonActive}
					className={`icon icon-close signatureClose ${this.state.items.length > 1 || this.state.showClearButton ? '' : 'signatureCloseHide'}`}
					onClick={() => this.deleteObject(content)} /> */}
				<button
					className={`button-icon-close signatureClose_btn ${
						this.state.items.length > 1 || this.state.showClearButton ? "signatureClose" : ""
					}`}
					onClick={() => this.deleteObject()}
				/>
				{this.state.footerState !== LetterFooterState.EDIT ? (
					<div className="footerSignatureContainer">{content}</div>
				) : (
					content
				)}
			</div>
		);
	}
	onKeyDown(event) {
		const { keyCode } = event;
		if (keyCode === KEY_CODES.ENTER) {
			this.onBlur(event);
		}
	}
	onBlur(event) {
		if (event.target.value.trim() !== "") {
			this.setState({ signatureText: event.target.value }, () => {
				if (!this.footerStateEdit) {
					this.isSaving = false;
					this.footerStateEdit = true;
				}
				this.onDocumentClick(event);
			});
			this.setState({ deleteButtonActive: true, showClearButton: true, textSelected: true });
		}
	}
	getTextObject() {
		const textObject = {
			id: undefined,
			metaData: {
				bold: false,
				color: DEFAULT_FONT_COLOR,
				font: DEFAULT_FONT_FAMILY,
				fontSize: DEFAULT_FONT_SIZE,
				fontWeight: DEFAULT_FONT_WEIGHT,
				html: this.state.signatureText,
				italic: false,
				underline: false,
			},
			sortId: 4,
			type: "text",
			x: 0.3662109375,
			y: 58.875,
		};
		return textObject;
	}
	initialState() {
		if (this.state.footerState === LetterFooterState.EDIT) {
			this.setState({ showClearButton: false });
			this.onFooterEditClick();
		} else if (this.state.footerState === LetterFooterState.DISPLAY) {
			this.setState({ showClearButton: true });
			this.onFooterDisplayClick();
		}
	}
	componentWillMount() {
		$(document).on("mousedown", this.onDocumentClick.bind(this));
		$(document).on("keydown", this.onDocumentKeydown.bind(this));
		this.initialState();
	}
	onFooterWrapperClick(event) {
		const e = event.nativeEvent;
		e.stopPropagation();
		e.stopImmediatePropagation();
	}
	onFooterDisplayClick() {
		this.setState({ footerState: LetterFooterState.DISPLAY }, () => {
			this.initEditMode();
		});
	}
	onFooterEditClick() {
		this.setState({ footerState: LetterFooterState.EDIT }, () => {
			this.initEditMode();
		});
	}
	initEditMode() {
		// $(document).on('mousedown', this.onDocumentClick.bind(this));
		// $(document).on('keydown', this.onDocumentKeydown.bind(this));
		// invoiz.on('documentClicked', this.saveLetterElements.bind(this));

		this.uploader = this.initUploader();
		this.initCanvas();
		letterElementsToFabricObjects(this.state.items).then((fabricObjects) => {
			this.setState({ fabricObjects }, () => {
				this.addFabricObjectsToCanvas();
			});
			const images = this.canvas.getObjects("image");
			if (images && images.length !== 0) {
				return;
			}
		});
	}
	addFabricObjectsToCanvas() {
		const { fabricObjects } = this.state;
		const isImage = this.state.items.find((x) => x.type === "image");
		this.setState({ showClearButton: isImage !== undefined });
		fabricObjects.forEach((fabricObject) => {
			fabricObject.setColor(fabricObject.color);
			fabricObject.lockMovementX = true;
			fabricObject.lockMovementY = true;
			this.canvas.insertAt(fabricObject, fabricObject._sortId, false);
		});
		this.canvas.renderAll();
	}
	initCanvas() {
		this.canvas = new fabric.Canvas(this.refs.canvas, { selection: false })
			.setWidth(CANVAS_WIDTH)
			.setHeight(CANVAS_HEIGHT);
		const lineOptions = { stroke: "#ddd", fill: "transparent", selectable: false, opacity: 0 };
		const wrapperOptions = Object.assign({}, BOUNDING_BOX, lineOptions);
		// Hack: Show border from wrapper container (Canvas renders 0.5 pixels)
		wrapperOptions.width--;
		wrapperOptions.height--;
		const snapOptions = Object.assign({}, { strokeDashArray: [5] }, lineOptions);
		this.wrapper = new fabric.Rect(wrapperOptions);
		this.vSnap = new fabric.Line(V_SNAP_POINTS, snapOptions);
		this.hSnap = new fabric.Line(H_SNAP_POINTS, snapOptions);
		// initialize canvas with events
		this.canvas
			.add(this.wrapper, this.hSnap, this.vSnap)
			.on("object:selected", this.onCanvasObjectSelected.bind(this));
		this.addDeselectHandlers();
	}
	addDeselectHandlers() {
		$(".canvas-container").on("mousedown", this.stopPropagation);
		// $('.footerEdit').on('mousedown', this.deactivateAll);
	}
	stopPropagation(event) {
		event.stopPropagation();
	}
	onCanvasObjectSelected(obj) {
		this.canvas.discardActiveObject();
		this.canvas.renderAll();
	}
	initUploader() {
		const { resources } = this.props;
		return new Uploader(
			Object.assign({}, config.letter.fineUploader, {
				autoUpload: false,
				multiple: false,
				button: this.refs.uploadButton,
				messages: {
					minWidthImageError: resources.logoUploadMinWidthError,
					maxWidthImageError: resources.logoUploadMaxWidthError,
					minHeightImageError: resources.logoUploadMinHeightError,
					maxHeightImageError: resources.logoUploadMaxHeightError,
					minSizeError: resources.logoUploadMinSizeError,
					sizeError: resources.logoUploadMaxSizeError,
					typeError: resources.logoUploadFileTypeError,
				},
				callbacks: {
					onError: (id, name, reason, xhr) => this.onUploadError(id, name, reason, xhr),
					onSubmit: (id) => this.onFileSubmit(id),
					onSubmitted: (id) => this.onFileSubmitted(id),
					onComplete: (id, name, response) => this.onUploadComplete(id, name, response),
				},
				request: {
					endpoint: config.letter.endpoints.saveLetterPaperImageUrl,
					customHeaders: { Authorization: `Bearer ${invoiz.user.token}` },
					inputName: "image",
				},
			})
		);
	}
	onUploadError(id, name, reason, xhr) {
		if (name && reason) {
			invoiz.page.showToast({ type: "error", message: reason });
		}
	}
	onFileSubmit(id) {
		const uploads = this.uploader.getUploads();
		if (uploads.length > 1) {
			for (let i = 0, il = uploads.length; i < il; i++) {
				uploads[i].id !== id && this.uploader.cancel(uploads[i].id);
			}
		}
	}
	onFileSubmitted(id) {
		const url = URL.createObjectURL(this.uploader.getFile(id));
		this.addImage(url, id);
	}
	addImage(url, uploadId) {
		const activeObject = this.canvas.getActiveObject();
		this.canvas.discardActiveObject();
		activeObject && activeObject.remove();
		fabric.Image.fromURL(url, (image) => {
			const images = this.canvas.getObjects("image");
			_.forEach(images, (img) => {
				img.setSrc("");
				img.remove();
			});

			const imageOptions = {
				width: image.width,
				height: image.height,
				left: image.left + OFFSET,
				top: image.top + OFFSET,
				_sortId: 4,
			};
			const fabricImageOptions = _.assign(imageOptions, config.letter.fabricOptions);
			image.set(fabricImageOptions).setCoords();
			image._uploadId = uploadId;
			image.lockMovementX = true;
			image.lockMovementY = true;
			this.canvas.insertAt(image, image._sortId);
			this.adjustImage(image);
			if (!this.footerStateEdit) {
				this.isSaving = false;
				this.footerStateEdit = true;
			}
			// this.canvas.setActiveObject(this.canvas.item(image._sortId));
		});
		this.setState({ deleteButtonActive: true, showClearButton: true, imageSelected: true, textSelected: false });
	}
	adjustImage(image) {
		const maxWidth = CANVAS_WIDTH - OFFSET * 2 - 40;
		const maxHeight = CANVAS_HEIGHT - OFFSET * 2 - 40;
		const imageOffset = 20;

		if (image.width > maxWidth || image.height > maxHeight) {
			const fitToWidth = image.width / maxWidth > image.height / maxHeight;
			image
				.set({
					width: fitToWidth ? maxWidth : (image.width / image.height) * maxHeight + imageOffset,
					height: fitToWidth ? (image.height / image.width) * maxWidth : maxHeight + imageOffset,
				})
				.setCoords();
		}

		image
			.set({
				left: 0,
				top: (CANVAS_HEIGHT - image.height) / 2,
			})
			.setCoords();
		this.canvas.renderAll();
	}
	onUploadComplete(id, name, response) {
		const { data } = response;
		const letterElement = new LetterElement({
			id: data.id,
			sortId: data.sortId,
			type: data.type,
			metaData: data.metaData,
			x: data.x,
			y: data.y,
		});
		this.whenImageUploaded.resolve(letterElement);
	}
	setOpacity(prop, value) {
		if (this.canvas && this[prop] instanceof fabric.Object) {
			this[prop].opacity = value;
			this.canvas.renderAll();
		}
	}
	onDocumentClick(event) {
		if (
			$(event.target).closest(".footerSignatureItems").length === 0 &&
			!this.isSaving &&
			this.footerStateEdit === true
		) {
			this.isSaving = true;
			this.footerStateEdit = false;
			this.saveLetterElements();
		}
	}
	onDocumentKeydown(event) {
		const { keyCode } = event;
		if (keyCode === KEY_CODES.ENTER) {
			if (this.state.imageSelected) {
				this.isSaving = true;
				this.footerStateEdit = false;
				this.saveLetterElements();
			}
		}
	}
	createImages() {
		if (this.prepareImageUploads()) {
			this.uploader.uploadStoredFiles();
		} else {
			this.whenImageUploaded.resolve();
		}
		return this.whenImageUploaded.promise;
	}
	prepareImageUploads() {
		const images = _.filter(this.canvas.getObjects("image"), (image) => !image._letterElementId);
		if (!images.length) {
			return false;
		}

		_.forEach(images, (image) => {
			this.uploader.setParams(
				{
					sortId: image._sortId,
					section: "footer",
					x: parseFloat(image.left - OFFSET),
					y: parseFloat(image.top - OFFSET),
					metaData: {
						width: parseFloat(image.getWidth()),
						height: parseFloat(image.getHeight()),
					},
				},
				image._uploadId
			);
		});
		return true;
	}
	parseFabricObjects(fabricObjects) {
		const { resources } = this.props;
		const letterElements = fabricObjects.reduce((letterElementList, obj, index) => {
			const letterElementModel = obj._letterElementId
				? this.state.items.find((item) => {
						return item.id === obj._letterElementId;
				  })
				: undefined;
			obj._sortId = index + CANVAS_ZINDEX_OFFSET;

			const objectType = obj.get("type");
			switch (objectType) {
				case "image":
					if (!letterElementModel) {
						return letterElementList;
					}
					const imageElement = fabricObjectToImageLetterElement(obj, letterElementModel);
					letterElementList.push(imageElement);
					break;
				case "i-text":
					const textElement = fabricObjectToTextLetterElement(obj, letterElementModel);
					if (textElement.metaData.html && textElement.metaData.html !== resources.str_namePlaceholder) {
						letterElementList.push(textElement);
					}
					break;
				case "rect":
					const rectangleElement = fabricObjectToShapeLetterElement(obj, letterElementModel);
					letterElementList.push(rectangleElement);
					break;
			}
			if (this.state.textSelected) {
				const textObject = this.getTextObject();
				letterElementList.push(textObject);
			}
			return letterElementList;
		}, []);

		return letterElements;
	}
	saveLetterElements() {
		if (this.isSaving) {
			let fabricObjects = this.canvas.getObjects();
			fabricObjects = fabricObjects.slice(CANVAS_ZINDEX_OFFSET);
			const parsedFabrics = this.parseFabricObjects(fabricObjects);
			this.createImages().then((letterImage) => {
				if (letterImage) {
					parsedFabrics.push(letterImage);
				}
				letterElementsToFabricObjects(parsedFabrics).then((fabricObjects) => {
					this.exitEditMode();
					this.props.onFinish(parsedFabrics);
					this.setState({
						fabricObjects,
						items: parsedFabrics,
						footerState: parsedFabrics.length > 1 ? LetterFooterState.DISPLAY : LetterFooterState.EDIT,
					});
				});
			});
			this.isSaving = false;
		}
	}
	deleteObject() {
		this.canvas.clear();
		const textElementIndex = this.state.items.findIndex((element) => element.metaData.font === DEFAULT_FONT_FAMILY);
		const imageElementIndex = this.state.items.findIndex((element) => element.type === "image");
		if (textElementIndex !== -1) {
			this.state.items.splice(textElementIndex, 1);
		} else if (imageElementIndex !== -1) {
			this.state.items.splice(imageElementIndex, 1);
		}
		this.props.onFinish(this.state.items);
		this.setState({ deleteButtonActive: false, showClearButton: false, imageSelected: false });
		this.setState({ footerState: LetterFooterState.EDIT }, () => {
			this.initialState();
		});
		this.canvas.renderAll();
	}
	exitEditMode() {
		// invoiz.off('documentClicked', this.saveLetterElements.bind(this));
		$(document).off("mousedown", this.onDocumentClick.bind(this));
		$(document).off("keydown", this.onDocumentKeydown.bind(this));
		this.removeDeselectHandlers();
		this.canvas.clear().dispose();
		this.uploader.reset();
		this.whenImageUploaded = q.defer();
		this.uploader = undefined;
		this.vSnap = undefined;
		this.hSnap = undefined;
		this.isSaving = false;
		this.footerStateEdit = false;
		this.setState({
			footerState: this.state.items.length > 1 ? LetterFooterState.DISPLAY : LetterFooterState.EDIT,
			imageSelected: false,
			textSelected: false,
		});
		this.initialState();
	}
	removeDeselectHandlers() {
		$(".canvas-container").off("mousedown", this.stopPropagation);
		// $('.footerEdit').off('mousedown', this.deactivateAll);
	}
}

LetterFooterSignatureComponent.propTypes = {
	items: PropTypes.array,
	onFinish: PropTypes.func,
};

export default LetterFooterSignatureComponent;
