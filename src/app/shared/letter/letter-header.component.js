import invoiz from 'services/invoiz.service';
import q from 'q';
import _ from 'lodash';
import { fabric } from 'fabric';
import React from 'react';
import config from 'config';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import SpinnerInputComponent from 'shared/inputs/spinner-input/spinner-input.component';
import LetterHeaderState from 'enums/letter/letter-header-state.enum';
import CanvasColorPickerComponent from 'shared/canvas-color-picker/canvas-color-picker.component';
import LoaderComponent from 'shared/loader/loader.component';
import { FineUploaderBasic as Uploader } from 'fine-uploader';
import PropTypes from 'prop-types';
import LetterElement from 'models/letter/letter-element.model';

import {
	buildLetterHeaderPosition,
	buildLetterHeaderStyles,
	letterElementsToFabricObjects,
	fabricObjectToImageLetterElement,
	fabricObjectToTextLetterElement,
	fabricObjectToShapeLetterElement,
	LetterFabricText
} from 'helpers/letterHeaderHelpers';

const DEFAULT_FONT_SIZE = 18;
const KEY_CODES = config.KEY_CODES;

const SHIFT_STEP = 10;
const CANVAS_HEIGHT = 198;
const CANVAS_WIDTH = 725;
const OFFSET = 0;
const CANVAS_ZINDEX_OFFSET = 3;
const BOUNDING_BOX = {
	left: OFFSET,
	top: OFFSET,
	width: CANVAS_WIDTH - OFFSET * 2,
	height: CANVAS_HEIGHT - OFFSET * 2
};
const CENTER = {
	x: BOUNDING_BOX.left + BOUNDING_BOX.width / 2,
	y: BOUNDING_BOX.top + BOUNDING_BOX.height / 2
};
const H_SNAP_POINTS = [OFFSET, CENTER.y, CANVAS_WIDTH - OFFSET, CENTER.y];
const V_SNAP_POINTS = [CENTER.x, OFFSET, CENTER.x, CANVAS_HEIGHT - OFFSET];

class LetterHeaderComponent extends React.Component {
	constructor(props) {
		super(props);
		const { items } = props;

		this.state = {
			items,
			headerState: items.length > 0 ? LetterHeaderState.DISPLAY : LetterHeaderState.EMPTY,
			loading: false,
			deleteButtonActive: false,
			textSelected: false,
			canHaveColor: false,
			hSnapVisible: false,
			vSnapVisible: false,
			wrapperVisible: false,
			textIsBold: false,
			textIsItalic: false,
			textIsUnderlined: false,
			textSupportsBold: false,
			textSupportsItalic: false,
			selectedFontSize: undefined,
			selectedFont: undefined,
			selectedFontColor: undefined,
			previousEl: undefined,
			fabricObjects: []
		};

		this.uploader = undefined;
		this.vSnap = undefined;
		this.hSnap = undefined;
		this.fonts = config.letter.fonts;
		this.whenImageUploaded = q.defer();
		this.isSaving = false;
		this.hasAddedText = false;
		this.addedTextAdditionalTop = 0;
		this.addedTextAdditionalLeft = 0;
	}

	componentDidUpdate(prevProps) {
		if (!_.isEqual(prevProps.items, this.props.items)) {
			this.setState({ items: this.props.items });
		}
	}

	render() {
		let content;
		const { resources } = this.props;

		switch (this.state.headerState) {
			case LetterHeaderState.DISPLAY:
				const displayItems = this.state.items.map((item, index) => {
					const {
						type,
						x,
						y,
						sortId,
						metaData: {
							font,
							fontSize,
							fontWeight,
							italic,
							underline,
							color,
							width,
							height,
							html,
							imageUrl
						}
					} = item;

					const position = buildLetterHeaderPosition({ x, y, width, height, sortId, type });

					let styles;

					switch (item.type) {
						case 'image':
							styles = position;
							return (
								<img
									src={`${config.imageResourceHost}${imageUrl}`}
									style={styles}
									key={`letter-header-item-${index}`}
								/>
							);
						case 'text':
							const styling = buildLetterHeaderStyles({
								font,
								fontSize,
								fontWeight,
								italic,
								underline,
								color
							});
							styles = Object.assign({}, position, styling);
							return (
								<span style={styles} key={`letter-header-item-${index}`}>
									{html}
								</span>
							);
						case 'rectangle':
							styles = Object.assign({}, position, { 'background-color': color });
							return <div style={styles} key={`letter-header-item-${index}`} />;
					}
				});

				content = (
					<div className="headerDisplay" onClick={() => this.onHeaderDisplayClick()}>
						{displayItems}
					</div>
				);
				break;
			case LetterHeaderState.EMPTY:
				content = (
					<div className="headerEmpty" onClick={() => this.onHeaderEmptyClick()}>
						{/* <div className="headerEmpty_title">
								<b>{resources.str_logo}</b>
							{resources.str_hereSmall}
						</div>
						<span className="headerEmpty_subtitle">{resources.letterHeaderUploadCreateText}</span> */}
						<div className="logo-upload-area letter-headerEmpty_title">
							<label>
								<p className="row1">
									<img src="/assets/images/svg/impress_bild.svg" height="50" />
								</p>
								<p className="row2">
									<span>{resources.str_logo}</span>{resources.str_hereSmall}
								</p>
								<p className="row3"><span className="headerEmpty_subtitle">{resources.letterHeaderUploadCreateText}</span></p>
							</label>
						</div>
					</div>
				);
				break;
			case LetterHeaderState.EDIT:
				const uploadButton = (
					<div
						ref="uploadButton"
						className="button button-primary button-small button-icon-picture button-rounded"
						disabled={this.state.loading}
					>
						{resources.letterHeaderUploadLogoText}
					</div>
				);

				this.setOpacity('hSnap', +this.state.hSnapVisible);
				this.setOpacity('vSnap', +this.state.vSnapVisible);
				this.setOpacity('wrapper', +this.state.wrapperVisible);

				const fontBoldControl = this.createFontBoldControl();
				const fontUnderlineControl = this.createFontUnderlineControl();
				const fontItalicControl = this.createFontItalicControl();
				const fontFamilyControl = this.createFontFamilyControl();
				const fontSizeControl = this.createFontSizeControl();

				content = (
					<div>
						<LoaderComponent text="" visible={this.state.loading} />
						<div
							className={`headerEdit document-edit ${
								this.state.wrapperVisible ? 'headerEdit-active' : ''
							}`}
						>
							<canvas ref="canvas" />
						</div>
						<form ref="form" className="form letterHeader_tools">
							<button ref="formSubmit" className="u_hidden" />
							<div className={'letterHeaderFontTools'}>
								<div className="letterHeaderTools_fontStyle">
									{fontBoldControl}
									{fontUnderlineControl}
									{fontItalicControl}
								</div>
								{fontFamilyControl}
								{fontSizeControl}
								<CanvasColorPickerComponent
									canvas={this.canvas}
									visible={this.state.canHaveColor || this.state.textSelected}
									value={this.state.selectedFontColor}
								/>
							</div>

							<div className="buttonRow">
								<div className="u_vc">
									{uploadButton}
									<button
										type="button"
										onClick={() => this.addText()}
										className="button button-primary button-small button-icon-font button-rounded"
									>
										{resources.str_text}
									</button>
									<button
										type="button"
										disabled={!this.state.deleteButtonActive}
										onClick={() => this.removeObject()}
										className="button button-primary button-small button-rounded"
									>
										{resources.str_clear}
									</button>
								</div>
							</div>
						</form>
					</div>
				);
				break;
		}

		return (
			<div className="headerWrapper" onClick={event => this.onHeaderWrapperClick(event)}>
				
				{this.state.headerState !== LetterHeaderState.EDIT ? (
					<div className="headerContainer header"><span className="edit-icon"/>{content}</div>
				) : (
					content
				)}
			</div>
		);
	}

	initEditMode() {
		$(document).on('mousedown', this.onDocumentClick.bind(this));
		$(document).on('keydown', this.onDocumentKeydown.bind(this));
		invoiz.on('documentClicked', this.saveLetterElements.bind(this));

		this.uploader = this.initUploader();
		this.initCanvas();

		letterElementsToFabricObjects(this.state.items).then(fabricObjects => {
			this.setState({ fabricObjects }, () => {
				this.addFabricObjectsToCanvas();
			});
		});
	}

	exitEditMode() {
		invoiz.off('documentClicked', this.saveLetterElements.bind(this));
		$(document).off('mousedown', this.onDocumentClick.bind(this));
		$(document).off('keydown', this.onDocumentKeydown.bind(this));
		this.removeDeselectHandlers();
		this.canvas.clear().dispose();
		this.uploader.reset();
		this.whenImageUploaded = q.defer();
		this.uploader = undefined;
		this.vSnap = undefined;
		this.hSnap = undefined;
		this.isSaving = false;
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
					typeError: resources.logoUploadFileTypeError
				},
				callbacks: {
					onError: (id, name, reason, xhr) => this.onUploadError(id, name, reason, xhr),
					onSubmit: id => this.onFileSubmit(id),
					onSubmitted: id => this.onFileSubmitted(id),
					onComplete: (id, name, response) => this.onUploadComplete(id, name, response)
				},
				request: {
					endpoint: config.letter.endpoints.saveLetterPaperImageUrl,
					customHeaders: { Authorization: `Bearer ${invoiz.user.token}` },
					inputName: 'image'
				}
			})
		);
	}

	initCanvas() {
		this.canvas = new fabric.Canvas(this.refs.canvas, { selection: false })
			.setWidth(CANVAS_WIDTH)
			.setHeight(CANVAS_HEIGHT);
		const lineOptions = { stroke: '#ddd', fill: 'transparent', selectable: false, opacity: 0 };
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
			.on('mouse:up', this.onCanvasMouseUp.bind(this))
			.on('object:moving', this.onCanvasObjectMoving.bind(this))
			.on('object:scaling', this.onCanvasObjectScaling.bind(this))
			.on('object:selected', this.onCanvasObjectSelected.bind(this))
			.on('selection:cleared', this.onCanvasSelectionCleared.bind(this));
		this.addDeselectHandlers();
	}

	addDeselectHandlers() {
		$('.canvas-container').on('mousedown', this.stopPropagation);
		$('.headerEdit').on('mousedown', this.deactivateAll);
	}

	removeDeselectHandlers() {
		$('.canvas-container').off('mousedown', this.stopPropagation);
		$('.headerEdit').off('mousedown', this.deactivateAll);
	}

	addFabricObjectsToCanvas() {
		const { fabricObjects } = this.state;

		fabricObjects.forEach(fabricObject => {
			fabricObject.setColor(fabricObject.color);
			this.canvas.insertAt(fabricObject, fabricObject._sortId, false);
		});

		this.canvas.renderAll();
	}

	addImage(url, uploadId) {
		fabric.Image.fromURL(url, image => {
			const images = this.canvas.getObjects('image');
			_.forEach(images, img => {
				img.setSrc('');
				img.remove();
			});

			const imageOptions = {
				width: image.width,
				height: image.height,
				left: image.left + OFFSET,
				top: image.top + OFFSET,
				_sortId: 3
			};

			const fabricImageOptions = _.assign(imageOptions, config.letter.fabricOptions);
			image.set(fabricImageOptions).setCoords();
			image._uploadId = uploadId;
			this.canvas.insertAt(image, image._sortId);

			this.adjustImage(image);

			this.canvas.setActiveObject(this.canvas.item(image._sortId));
		});
	}

	adjustImage(image) {
		const maxWidth = CANVAS_WIDTH - OFFSET * 2 - 40;
		const maxHeight = CANVAS_HEIGHT - OFFSET * 2 - 40;

		if (image.width > maxWidth || image.height > maxHeight) {
			const fitToWidth = image.width / maxWidth > image.height / maxHeight;
			image
				.set({
					width: fitToWidth ? maxWidth : (image.width / image.height) * maxHeight,
					height: fitToWidth ? (image.height / image.width) * maxWidth : maxHeight
				})
				.setCoords();
		}

		image
			.set({
				left: (CANVAS_WIDTH - image.width) / 2,
				top: (CANVAS_HEIGHT - image.height) / 2
			})
			.setCoords();

		this.canvas.renderAll();
	}

	addText() {
		const { resources } = this.props;
		const canvasCenterTop = CANVAS_HEIGHT / 2;
		const canvasCenterLeft = CANVAS_WIDTH / 2;

		let fabricObjects = this.canvas.getObjects();
		fabricObjects = fabricObjects.slice(CANVAS_ZINDEX_OFFSET);

		const textElements = fabricObjects.reduce((textElementList, obj, index) => {
			const objectType = obj.get('type');

			if (objectType === 'i-text' && !obj._letterElementId) {
				textElementList.push(obj);
			}

			return textElementList;
		}, []);

		const font = _.find(this.fonts, { default: true });

		const defaultOptions = {
			fontFamily: font.name,
			fontSize: DEFAULT_FONT_SIZE,
			fontStyle: 'normal',
			fontWeight: font.regular,
			left: canvasCenterLeft,
			top: canvasCenterTop,
			lockScalingX: true,
			lockScalingY: true,
			hasControls: false
		};

		const fabricTextOptions = _.assign({}, defaultOptions, config.letter.fabricOptions);
		const text = new LetterFabricText(resources.str_yourText, fabricTextOptions);

		if (this.hasAddedText && textElements.length <= 29) {
			this.addedTextAdditionalTop = textElements.length * 10;
			this.addedTextAdditionalLeft = textElements.length * 10;

			if (textElements.length >= 27) {
				this.addedTextAdditionalTop = textElements.length * 10 - 27 * 10;
			} else if (textElements.length >= 18) {
				this.addedTextAdditionalTop = textElements.length * 10 - 18 * 10;
			} else if (textElements.length >= 9) {
				this.addedTextAdditionalTop = textElements.length * 10 - 9 * 10;
			}
		}

		this.hasAddedText = true;

		text.top -= text.height / 2 - this.addedTextAdditionalTop;
		text.left -= text.width / 2 - this.addedTextAdditionalLeft;

		this.canvas.add(text);
		this.canvas.setActiveObject(text);
		text.enterEditing().selectAll();
	}

	onEscapePress() {
		this.setState(
			{
				headerState: this.state.items.length > 0 ? LetterHeaderState.DISPLAY : LetterHeaderState.EMPTY
			},
			() => {
				this.exitEditMode();
			}
		);
	}

	onDocumentClick(event) {
		if ($(event.target).closest('.headerWrapper').length === 0 && !this.isSaving) {
			this.isSaving = true;
			this.saveLetterElements();
		}
	}

	onDocumentKeydown(event) {
		const { keyCode } = event;
		const obj = this.canvas.getActiveObject();
		if (keyCode === KEY_CODES.ESCAPE) {
			return this.onEscapePress();
		}
		if (!obj) {
			return;
		}
		switch (keyCode) {
			case KEY_CODES.ENTER:
				if (obj instanceof fabric.IText) {
					obj.enterEditing().selectAll();
					event.preventDefault();
				}
				break;
			case KEY_CODES.DELETE:
				this.removeObject();
				break;
			case KEY_CODES.LEFT:
				obj.left -= event.shiftKey ? SHIFT_STEP : 1;
				break;
			case KEY_CODES.TOP:
				obj.top -= event.shiftKey ? SHIFT_STEP : 1;
				break;
			case KEY_CODES.RIGHT:
				obj.left += event.shiftKey ? SHIFT_STEP : 1;
				break;
			case KEY_CODES.DOWN:
				obj.top += event.shiftKey ? SHIFT_STEP : 1;
				break;
			case KEY_CODES.BACKSPACE:
				this.removeObject();
		}
		obj.setCoords();
		this.canvas.renderAll();
	}

	onCanvasObjectMoving(obj) {
		// restrict objects on canvas so they don't move out of the boundingBox and snap them
		// to the horizontal and vertical centers.

		const object = obj.target;
		object.set({
			padding: 0,
			backgroundColor: 'rgba(255, 255, 255, 0.7)'
		});

		// snap to center
		const center = object.getCenterPoint();
		const threshold = 8;
		const snapX = _.inRange(center.x, CENTER.x - threshold, CENTER.x + threshold);
		const snapY = _.inRange(center.y, CENTER.y - threshold, CENTER.y + threshold);
		this.setState({ hSnapVisible: snapY, vSnapVisible: snapX, wrapperVisible: true });
		object.setPositionByOrigin(
			new fabric.Point(snapX ? CENTER.x : center.x, snapY ? CENTER.y : center.y),
			'center',
			'center'
		);
	}

	onCanvasObjectScaling(obj) {
		// Images always have a height of 158 when newly added. So if it gets scaled bigger than 1137mm in height,
		// I set the scale to 7.2 so it wont become bigger.
		// After saving an image it gets its real height, so if the height of the picture is 1137mm or bigger, then it was added before.
		// Setting scale factor to 1 because this is the maximum width/height factor.
		const object = obj.target;
		object.set({
			padding: 0,
			backgroundColor: 'rgba(255, 255, 255, 0.7)'
		});

		if (object.scaleY >= 7.2) {
			object.set({ scaleY: 7.2, scaleX: 7.2 });
		} else if (object.height >= 1137) {
			object.set({ scaleY: 1, scaleX: 1 });
		}
		this.setState({ wrapperVisible: true });
	}

	onCanvasMouseUp({ e: event }) {
		const object = this.canvas.getActiveObject();
		const wrapThreshold = 20;

		if (object) {
			object.set({
				backgroundColor: 'transparent'
			});

			object.setCoords();

			if (object.getBoundingRect().top < 0 - object.getBoundingRect().height + wrapThreshold) {
				object.top = 0 - object.getBoundingRect().height + wrapThreshold;
			}

			if (object.getBoundingRect().left < 0 - object.getBoundingRect().width + wrapThreshold) {
				object.left = 0 - object.getBoundingRect().width + wrapThreshold;
			}

			if (object.getBoundingRect().top > object.canvas.height - wrapThreshold) {
				object.top = object.canvas.height - wrapThreshold;
			}

			if (object.getBoundingRect().left > object.canvas.width - wrapThreshold) {
				object.left = object.canvas.width - wrapThreshold;
			}

			object.setCoords();
		}

		this.setState({ hSnapVisible: false, vSnapVisible: false, wrapperVisible: false });
	}

	onCanvasObjectSelected(obj) {
		this.onCanvasSelectionCleared();
		let additionalState = {};
		const target = obj.target;
		const textSelected = target instanceof fabric.IText;
		const canHaveColor = target instanceof fabric.IText || target instanceof fabric.Rect;

		if (textSelected) {
			target.hasControls = false;
			const font = _.find(this.fonts, { name: target.getFontFamily() });
			additionalState = {
				selectedFont: font,
				selectedFontSize: target.getFontSize(),
				textIsBold: target.getFontWeight() === font.bold,
				textIsItalic: target.getFontStyle() === 'italic',
				textIsUnderlined: target.getTextDecoration() === 'underline',
				textSupportsItalic: font.italic,
				textSupportsBold: font.bold
			};
		}

		if (canHaveColor) {
			Object.assign(additionalState, { selectedFontColor: target.getFill() });
		}

		const state = Object.assign(
			{},
			{
				deleteButtonActive: true,
				previousEl: target,
				textSelected,
				canHaveColor
			},
			additionalState
		);

		this.setState(state);
	}

	onCanvasSelectionCleared() {
		const { previousEl } = this.state;

		this.setState(
			{
				selectedFont: undefined,
				selectedFontSize: undefined,
				selectedFontColor: undefined,
				deleteButtonActive: false,
				textSelected: false,
				canHaveColor: false,
				textIsBold: false,
				textIsItalic: false,
				textIsUnderlined: false,
				textSupportsBold: false,
				textSupportsItalic: false
			},
			() => {
				if (previousEl && previousEl.type === 'i-text') {
					// remove the active class from the font family select input because the blur event doesn't get triggered correctly
					const fontFamilyInput = $('.fontFamilySelect');
					fontFamilyInput.removeClass('selectInput-active');

					// set a invalid fontSize of the previous selected element to a valid size
					const fontSize = previousEl.getFontSize();
					if (fontSize > 100) {
						previousEl.setFontSize(100);
					} else if (fontSize < 10) {
						previousEl.setFontSize(10);
					}
				}
			}
		);
	}

	onUploadError(id, name, reason, xhr) {
		if (name && reason) {
			invoiz.page.showToast({ type: 'error', message: reason });
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

	onUploadComplete(id, name, response) {
		const { data } = response;
		const letterElement = new LetterElement({
			id: data.id,
			sortId: data.sortId,
			type: data.type,
			metaData: data.metaData,
			x: data.x,
			y: data.y
		});
		this.whenImageUploaded.resolve(letterElement);
	}

	onHeaderWrapperClick(event) {
		const e = event.nativeEvent;
		e.stopPropagation();
		e.stopImmediatePropagation();
	}

	onHeaderDisplayClick() {
		this.setState({ headerState: LetterHeaderState.EDIT }, () => {
			this.initEditMode();
		});
	}

	onHeaderEmptyClick() {
		this.setState({ headerState: LetterHeaderState.EDIT }, () => {
			this.initEditMode();
		});
	}

	onFontFamilyChange(value) {
		const { name } = value;

		const selectedFont = _.find(this.fonts, { name }) || {};
		selectedFont.selected = true;

		if (name === '') {
			return;
		}

		const obj = this.canvas.getActiveObject();
		const currentTextIsBold = obj.getFontWeight() === selectedFont.bold;
		const currentTextIsItalic = obj.getFontStyle() === 'italic';
		const textIsBold = !!selectedFont.bold && currentTextIsBold;
		const textIsItalic = !!selectedFont.italic && currentTextIsItalic;
		const fontWeight = textIsBold ? selectedFont.bold : selectedFont.regular;
		obj.exitEditing()
			.setFontFamily(selectedFont.name)
			.setFontWeight(fontWeight);
		obj.set('fontStyle', textIsItalic ? 'italic' : 'normal');
		obj._supportsBold = !!selectedFont.bold;
		obj._supportsItalic = selectedFont.italic;

		this.canvas.renderAll();
	}

	onFontSizeChange(value) {
		if (!this.canvas) {
			return;
		}
		let cleanedString = value.includes('px') ? value.replace('px', '') : value;
		let parsedValue = parseInt(cleanedString);
		const textElement = this.canvas.getActiveObject();
		if (!parsedValue || !textElement || !textElement.setFontSize) {
			return;
		}
		if (parsedValue === 0) {
			parsedValue = DEFAULT_FONT_SIZE;
		} else if (parsedValue > 100 || parsedValue < 10) {
			return;
		}

		textElement.set({ lockScalingX: false, lockScalingY: false });
		textElement.setFontSize(parsedValue);

		this.canvas.renderAll();
		textElement.set({ lockScalingX: true, lockScalingY: true });
	}

	onToggleBold() {
		if (!this.state.textSupportsBold || !this.state.textSelected) {
			return;
		}

		const obj = this.canvas.getActiveObject();
		const isDefault = obj.getFontWeight() === this.state.selectedFont.regular;

		obj.exitEditing().setFontWeight(isDefault ? this.state.selectedFont.bold : this.state.selectedFont.regular);
		obj._initDimensions();

		this.canvas.renderAll();
	}

	onToggleUnderline() {
		if (!this.state.textSupportsBold || !this.state.textSelected) {
			return;
		}

		const obj = this.canvas.getActiveObject();
		const isDefault = obj.getTextDecoration() === '';

		obj.exitEditing().setTextDecoration(isDefault ? 'underline' : '');

		this.canvas.renderAll();
	}

	onToggleItalic() {
		if (!this.state.textSupportsItalic || !this.state.textSelected) {
			return;
		}

		const obj = this.canvas.getActiveObject();
		const isDefault = obj.getFontStyle() === 'normal';

		obj.exitEditing().setFontStyle(isDefault ? 'italic' : 'normal');

		this.canvas.renderAll();
	}

	removeObject() {
		const activeObject = this.canvas.getActiveObject();
		this.canvas.discardActiveObject();
		activeObject.remove();
		this.canvas.renderAll();
	}

	setOpacity(prop, value) {
		if (this.canvas && this[prop] instanceof fabric.Object) {
			this[prop].opacity = value;
			this.canvas.renderAll();
		}
	}

	saveLetterElements() {
		let fabricObjects = this.canvas.getObjects();
		fabricObjects = fabricObjects.slice(CANVAS_ZINDEX_OFFSET);
		const parsedFabrics = this.parseFabricObjects(fabricObjects);

		this.createImages().then(letterImage => {
			if (letterImage) {
				parsedFabrics.push(letterImage);
			}

			letterElementsToFabricObjects(parsedFabrics).then(fabricObjects => {
				this.exitEditMode();
				this.props.onFinish(parsedFabrics);
				this.setState({
					fabricObjects,
					items: parsedFabrics,
					headerState: parsedFabrics.length > 0 ? LetterHeaderState.DISPLAY : LetterHeaderState.EMPTY
				});
			});
		});
	}

	parseFabricObjects(fabricObjects) {
		const letterElements = fabricObjects.reduce((letterElementList, obj, index) => {
			const letterElementModel = obj._letterElementId
				? this.state.items.find(item => {
					return item.id === obj._letterElementId;
				  })
				: undefined;
			obj._sortId = index + CANVAS_ZINDEX_OFFSET;

			const objectType = obj.get('type');

			switch (objectType) {
				case 'image':
					if (!letterElementModel) {
						return letterElementList;
					}
					const imageElement = fabricObjectToImageLetterElement(obj, letterElementModel);
					letterElementList.push(imageElement);
					break;
				case 'i-text':
					const textElement = fabricObjectToTextLetterElement(obj, letterElementModel);
					letterElementList.push(textElement);
					break;
				case 'rect':
					const rectangleElement = fabricObjectToShapeLetterElement(obj, letterElementModel);
					letterElementList.push(rectangleElement);
					break;
			}
			return letterElementList;
		}, []);

		return letterElements;
	}

	stopPropagation(event) {
		event.stopPropagation();
	}

	deactivateAll() {
		this.canvas.deactivateAllWithDispatch().renderAll();
	}

	prepareImageUploads() {
		const images = _.filter(this.canvas.getObjects('image'), image => !image._letterElementId);
		if (!images.length) {
			return false;
		}

		_.forEach(images, image => {
			this.uploader.setParams(
				{
					sortId: image._sortId,
					section: 'header',
					x: parseFloat(image.left - OFFSET),
					y: parseFloat(image.top - OFFSET),
					metaData: {
						width: parseFloat(image.getWidth()),
						height: parseFloat(image.getHeight())
					}
				},
				image._uploadId
			);
		});
		return true;
	}

	createImages() {
		if (this.prepareImageUploads()) {
			this.uploader.uploadStoredFiles();
		} else {
			this.whenImageUploaded.resolve();
		}
		return this.whenImageUploaded.promise;
	}

	createFontBoldControl() {
		const activeClass = this.state.textIsBold ? 'active' : '';
		const disabledClass = !this.state.textSupportsBold || !this.state.textSelected ? 'disabled' : '';

		return (
			<div
				className={`letterHeaderTools_action icon-bold ${activeClass} ${disabledClass}`}
				onClick={() => this.onToggleBold()}
			/>
		);
	}

	createFontUnderlineControl() {
		const activeClass = this.state.textIsUnderlined ? 'active' : '';
		const disabledClass = !this.state.textSupportsBold || !this.state.textSelected ? 'disabled' : '';

		return (
			<div
				className={`letterHeaderTools_action icon-underline ${activeClass} ${disabledClass}`}
				onClick={() => this.onToggleUnderline()}
			/>
		);
	}

	createFontItalicControl() {
		const activeClass = this.state.textIsItalic ? 'active' : '';
		const disabledClass = !this.state.textSupportsItalic || !this.state.textSelected ? 'disabled' : '';

		return (
			<div
				className={`letterHeaderTools_action icon-italic ${activeClass} ${disabledClass}`}
				onClick={() => this.onToggleItalic()}
			/>
		);
	}

	createFontFamilyControl() {
		const { resources } = this.props;
		return (
			<div className="letterHeaderTools_fontFamily">
				<SelectInputComponent
					name="fontFamily"
					containerClass="fontFamilySelect"
					value={this.state.selectedFont ? this.state.selectedFont.name : ''}
					allowCreate={false}
					disabled={!this.state.textSelected}
					options={{
						placeholder: resources.str_selectFont,
						labelKey: 'name',
						matchProp: 'name',
						valueKey: 'name',
						loadOptions: (input, callback) => {
							const fontOptions = this.fonts.map(({ name }) => {
								return { name };
							});
							return callback(null, { options: fontOptions, complete: true });
						},
						clearable: false,
						backspaceRemoves: false,
						containerClass: 'selectInput-leftLabel',
						handleChange: value => this.onFontFamilyChange(value),
						valueRenderer: option => {
							return <div style={{ fontFamily: option.name }}>{option.name}</div>;
						},
						optionRenderer: option => {
							return <div style={{ fontFamily: option.name }}>{option.name}</div>;
						}
					}}
				/>
			</div>
		);
	}

	createFontSizeControl() {
		const { resources } = this.props;
		const activeClass = this.state.textSelected ? '' : 'u_hidden';

		return (
			<div className={`letterHeaderTools_fontSize ${activeClass}`}>
				<SpinnerInputComponent
					label={resources.str_size}
					symbol="px"
					precision={0}
					min={10}
					max={100}
					leftLabel={true}
					hasBorder={true}
					selectOnFocus={true}
					value={this.state.selectedFontSize}
					onChange={value => this.onFontSizeChange(value)}
				/>
			</div>
		);
	}
}

LetterHeaderComponent.propTypes = {
	items: PropTypes.array,
	onCancel: PropTypes.func,
	onFinish: PropTypes.func
};

export default LetterHeaderComponent;
