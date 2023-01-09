import invoiz from 'services/invoiz.service';
import _ from 'lodash';
import React from 'react';
import config from 'config';
import HtmlInputComponent from 'shared/inputs/html-input/html-input.component';
import ElementTypes from 'enums/impress/element-types.enum';
import ModalService from 'services/modal.service';
import NotificationService from 'services/notification.service';
import ImageCropModalComponent from 'shared/modals/image-crop-modal.component';
import ImpressBlockSettingsModalComponent from 'shared/modals/impress-block-settings-modal.component';
import LoaderComponent from 'shared/loader/loader.component';
import PopoverComponent from 'shared/popover/popover.component';
import LetterPositionsHeadComponent from 'shared/letter/letter-positions-head.component';
import LetterPositionsComponent from 'shared/letter/letter-positions.component';
import LetterPositionsTotalComponent from 'shared/letter/letter-positions-total.component';
import Direction from 'enums/direction.enum';
import { sortObjectArrayByProperty } from 'helpers/sortObjectArrayByProperty';
import { scrollToElement, scrollToTop } from 'helpers/scrollToTop';
import { addElementButtonPositionFixer } from 'helpers/impress/addElementButtonPositionFixer';
import dragula from 'react-dragula';
import store from 'redux/store';
import { generateUuid } from 'helpers/generateUuid';
import { convertToWords } from 'helpers/convertRupeesIntoWords';
import { formatCurrencyRounding } from 'helpers/formatCurrency';

const COLOR_PICKER_VALUES = [
	'',
	'#e60000',
	'#ff9900',
	'#ffff00',
	'#008a00',
	'#0066cc',
	'#9933ff',
	'#ffffff',
	'#facccc',
	'#ffebcc',
	'#ffffcc',
	'#cce8cc',
	'#cce0f5',
	'#ebd6ff',
	'#bbbbbb',
	'#f06666',
	'#ffc266',
	'#ffff66',
	'#66b966',
	'#66a3e0',
	'#c285ff',
	'#888888',
	'#a10000',
	'#b26b00',
	'#b2b200',
	'#006100',
	'#0047b2',
	'#6b24b2',
	'#000000',
	'#5c0000',
	'#663d00',
	'#666600',
	'#003700',
	'#002966',
	'#3d1466'
];

class ImpressContentSectionComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			blocks: this.props.blocks || null,
			pages: this.props.pages || null,
			isLoadingBlocks: this.props.isLoadingBlocks || null,
			blocksErrorOccurred: this.props.blocksErrorOccurred || null,
			offerId: this.props.offerId || null,
			standardOfferData: this.props.standardOfferData || null,
			miscellaneousData: this.props.miscellaneousData || null,
			globalSettings: this.props.globalSettings || null,
			isAddElementsPopoverVisible: false
		};

		this.blocksLoaded = false;
		this.debounceResize = null;
		this.bodyScrollRaf = null;
		this.currentMousePosition = null;
		this.isDraggingContentBlock = false;
		this.handleResize = this.handleResize.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);

		this.storeSubscriber = store.subscribe(() => {
			if (store.getState().offer.impressEdit.offerData) {
				if (store.getState().offer.impressEdit.isLoadingBlocks) {
					this.blocksLoaded = false;
				} else if (!store.getState().offer.impressEdit.isLoadingBlocks && !this.blocksLoaded) {
					this.blocksLoaded = true;

					this.destroyDragula();
					this.initDragula();
				}
			}
		});
	}

	componentDidMount() {
		window.addEventListener('resize', this.handleResize);
		document.addEventListener('mousemove', this.handleMouseMove);

		setTimeout(() => {
			this.handleResize();
		}, 0);
	}

	componentWillUnmount() {
		this.storeSubscriber && this.storeSubscriber();
		this.destroyDragula();
		window.removeEventListener('resize', this.handleResize);
		document.removeEventListener('mousemove', this.handleMouseMove);
	}

	componentWillReceiveProps(props) {
		this.setState({
			blocks: props.blocks || null,
			pages: props.pages || null,
			isLoadingBlocks: props.isLoadingBlocks || null,
			blocksErrorOccurred: props.blocksErrorOccurred || null,
			offerId: props.offerId || null,
			standardOfferData: props.standardOfferData || null,
			miscellaneousData: props.miscellaneousData || null,
			globalSettings: props.globalSettings || null
		});
	}

	addElement(action, hasArticleList) {
		const { resources } = this.props;
		const blocks = this.state.blocks.concat();
		const newBlockPosition = blocks.length + 1;

		switch (action) {
			case ElementTypes.TEXT:
				blocks.push({
					content: resources.str_newBlock,
					type: ElementTypes.TEXT,
					position: newBlockPosition,
					background: null,
					layout: null,
					tempId: generateUuid()
				});
				break;

			case ElementTypes.IMAGE:
				ModalService.open(
					<ImageCropModalComponent
						offerId={this.state.offerId}
						onFinish={imageData => this.onImageUploaded(imageData)}
						resources={resources}
					/>,
					{
						headline: resources.str_choosePicture,
						width: 800,
						modalClass: 'image-crop-modal'
					}
				);
				break;

			case ElementTypes.SEPARATOR:
				blocks.push({
					type: ElementTypes.SEPARATOR,
					position: newBlockPosition,
					background: null,
					layout: null,
					tempId: generateUuid()
				});
				break;

			case ElementTypes.ARTICLES:
				if (hasArticleList) {
					NotificationService.show({
						message: resources.articleListExistError,
						type: 'error'
					});
				} else {
					blocks.push({
						content:
							`<strong class="ql-size-large">${resources.str_myServices}</strong><p><br/></p><p>${resources.offerServiceText}</p>`,
						type: ElementTypes.ARTICLES,
						position: newBlockPosition,
						background: null,
						layout: null,
						tempId: generateUuid()
					});
				}
				break;
		}

		this.setState({ blocks }, () => {
			this.refs && this.refs.addElementPopover && this.refs.addElementPopover.hide();

			this.props.onBlocksChange && this.props.onBlocksChange(this.state.blocks);

			setTimeout(() => {
				if (action === ElementTypes.ARTICLES) {
					this.props.onGlobalSettingsChange &&
						this.props.onGlobalSettingsChange({
							positionsBlockExists: true
						});
				}

				if (this.refs && this.refs[newBlockPosition] && this.refs[newBlockPosition].quillRef) {
					this.refs[newBlockPosition].quillRef.focus();
					this.refs[newBlockPosition].quillRef.setSelection(0, Number.MAX_SAFE_INTEGER);
				}

				scrollToTop($(document).height());
				addElementButtonPositionFixer();
			}, 0);
		});
	}

	destroyDragula() {
		this.drake && this.drake.destroy();
	}

	getHtmlInput(block) {
		const { resources } = this.props;
		return (
			<HtmlInputComponent
				ref={block.position}
				placeholder={resources.str_insertText}
				value={block.content}
				onTextChange={value => this.onBlockTextInputChange(value, block)}
				wrapperClass="inline"
				displayBlueLine={false}
				formats={[
					['bold', 'italic', 'underline'],
					[{ list: 'bullet' }],
					[{ size: ['small', false, 'large', 'huge'] }],
					[{ color: COLOR_PICKER_VALUES }],
					[
						{
							font: [
								'',
								'sourceserifpro',
								'caveat',
								'dancingscript',
								'economica',
								'gruppo',
								'kalam',
								'merriweathersans',
								'opensanscondensed',
								'ptsansnarrow',
								'shadowsintolight',
								'tulpenone',
								'voltaire'
							]
						}
					],
					[{ align: ['', 'center', 'right'] }]
				]}
			/>
		);
	}

	handleMouseMove(event) {
		this.currentMousePosition = event.pageY - $(document).scrollTop();
		this.isDraggingContentBlock = this.drake && this.drake.dragging;
	}

	handleResize() {
		clearTimeout(this.debounceResize);

		this.debounceResize = setTimeout(() => {
			addElementButtonPositionFixer();
		}, 100);
	}

	initDragula() {
		this.drake = dragula([document.querySelector('.impress-content')], {
			moves: function(el, container, handle) {
				return (
					handle.className &&
					handle.className.indexOf &&
					handle.className.indexOf('impress-edit--content-block-draggable') >= 0
				);
			}
		});

		this.drake.on('drag', this.onContentBlockDrag.bind(this));
		this.drake.on('dragend', this.onContentBlockDragEnd.bind(this));
		this.drake.on('drop', this.onContentBlockDrop.bind(this));
	}

	onContentBlockDrag() {
		const topbarHeight = 65;
		const margin = 50;
		const scrollSpeed = 10;

		this.bodyScrollRaf = window.requestAnimationFrame(() => {
			if (this.isDraggingContentBlock) {
				if (this.currentMousePosition <= topbarHeight + margin) {
					$(document).scrollTop($(document).scrollTop() - scrollSpeed);
				} else if (this.currentMousePosition >= window.innerHeight - margin) {
					$(document).scrollTop($(document).scrollTop() + scrollSpeed);
				}
			}

			this.onContentBlockDrag();
		});
	}

	onContentBlockDragEnd() {
		window.cancelAnimationFrame(this.bodyScrollRaf);
	}

	onContentBlockDrop(el, target, source, sibling) {
		const blocks = JSON.parse(JSON.stringify(this.state.blocks));
		const currentBlocks = this.refs['impressContentBlocks'].childNodes;
		const currentPositions = Array.from(currentBlocks).map(elem => elem.dataset.position);
		const newBlocks = currentPositions.map(position =>
			blocks.find(block => block.position === parseInt(position, 10))
		);

		newBlocks.forEach((block, blockIndex) => {
			block.position = blockIndex + 1;
		});

		this.setState({ blocks: newBlocks }, () => {
			this.props.onBlocksChange && this.props.onBlocksChange(this.state.blocks);
		});
	}

	onImageUploaded(imageData, isEditImage, imageId) {
		const { resources } = this.props;
		const blocks = this.state.blocks.concat();
		if (isEditImage) {
			blocks.forEach(block => {
				if (block.type === ElementTypes.IMAGE && block.imageId === imageId) {
					block.imageId = imageData.id;
					block.imageKey = imageData.key;
					block.path = imageData.path;
					block.pathOriginal = imageData.pathOriginal;
					block.cropData = imageData.cropData;
				}
			});

			this.setState({ blocks }, () => {
				this.props.onBlocksChange && this.props.onBlocksChange(this.state.blocks);

				NotificationService.show({
					message: resources.pictureSaveSuccessMessage,
					type: 'success'
				});
			});
		} else {
			if (!imageData) {
				return;
			}

			blocks.push({
				path: imageData.path,
				pathOriginal: imageData.pathOriginal,
				cropData: imageData.cropData,
				imageId: imageData.id,
				imageKey: imageData.key,
				type: ElementTypes.IMAGE,
				position: blocks.length + 1,
				tempId: generateUuid()
			});

			this.setState({ blocks }, () => {
				this.props.onBlocksChange && this.props.onBlocksChange(this.state.blocks);

				setTimeout(() => {
					addElementButtonPositionFixer();
					scrollToTop($(document).height());
				}, 0);
			});
		}
	}

	onBlockDeleteClicked(block) {
		const { resources } = this.props;
		ModalService.open(<div>{resources.deleteBlockConfirmMessage}</div>, {
			width: 500,
			headline: resources.str_deleteBlock,
			cancelLabel: resources.str_abortStop,
			confirmIcon: 'icon-trashcan',
			confirmLabel: resources.str_clear,
			confirmButtonType: 'secondary',
			onConfirm: () => {
				const standardOfferData = _.clone(this.state.standardOfferData, true);
				let wasArticlesDeleted = false;
				const prevBlocks = JSON.parse(JSON.stringify(this.state.blocks));

				const nextBlocks = prevBlocks.filter(prevBlock => {
					if (prevBlock.position === block.position && block.type === ElementTypes.ARTICLES) {
						wasArticlesDeleted = true;
					}

					return prevBlock.position !== block.position;
				});

				nextBlocks.forEach((nextBlock, index) => {
					nextBlock.position = index + 1;
				});

				ModalService.close();

				this.setState({ blocks: nextBlocks }, () => {
					this.props.onBlocksChange && this.props.onBlocksChange(this.state.blocks);

					setTimeout(() => {
						addElementButtonPositionFixer();
					}, 0);

					if (wasArticlesDeleted) {
						standardOfferData.positions = [];
						standardOfferData.totalGross = 0;
						standardOfferData.totalNet = 0;
						this.props.onStandardOfferDataChange && this.props.onStandardOfferDataChange(standardOfferData);

						setTimeout(() => {
							this.props.onGlobalSettingsChange &&
								this.props.onGlobalSettingsChange({
									positionsBlockExists: false
								});
						}, 0);
					}
				});
			}
		});
	}

	onBlockDuplicateClicked(block) {
		const { resources } = this.props;
		if (block.type === ElementTypes.IMAGE) {
			invoiz
				.request(`${config.resourceHost}impress/${this.state.offerId}/images/${block.imageId}`, {
					method: 'POST',
					auth: true
				})
				.then(({ body: { data } }) => {
					this.onBlockDuplicateSuccess(block, data);
				})
				.catch(() => {
					invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
				});
		} else {
			this.onBlockDuplicateSuccess(block);
		}
	}

	onBlockDuplicateSuccess(block, imageData) {
		const { resources } = this.props;
		const blockDuplicate = JSON.parse(JSON.stringify(block));
		const blocks = JSON.parse(JSON.stringify(this.state.blocks));
		const blockIndex = blocks.findIndex(currentBlock => currentBlock.position === block.position);

		if (block.type === ElementTypes.IMAGE && imageData) {
			blockDuplicate.cropData = imageData.cropData;
			blockDuplicate.imageId = imageData.id;
			blockDuplicate.imageKey = imageData.key;
			blockDuplicate.path = imageData.path;
			blockDuplicate.pathOriginal = imageData.pathOriginal;
		}

		blocks.splice(blockIndex + 1, 0, blockDuplicate);

		blocks.forEach((currentBlock, index) => {
			currentBlock.position = index + 1;
			currentBlock.tempId = generateUuid();
		});

		this.setState({ blocks }, () => {
			NotificationService.show({
				title: resources.str_duplicate,
				message: resources.str_dublicatedBlock,
				type: 'success'
			});

			if (this.refs[`block-${blockIndex}`]) {
				scrollToElement($(this.refs[`block-${blockIndex}`]), 0, 300);
			}

			this.props.onBlocksChange && this.props.onBlocksChange(this.state.blocks);

			setTimeout(() => {
				addElementButtonPositionFixer();
			}, 0);
		});
	}

	onBlockSettingsChanged(editedBlock) {
		const blocks = this.state.blocks.concat();

		blocks.forEach(block => {
			if (block.position === editedBlock.position) {
				block.background = editedBlock.background;
				block.layout =
					block.type === ElementTypes.TEXT || block.type === ElementTypes.ARTICLES
						? editedBlock.layout
						: null;

				if (block.type === ElementTypes.SEPARATOR) {
					block.separatorLineColor = editedBlock.separatorLineColor;
					block.separatorLineWidth = editedBlock.separatorLineWidth;
					block.separatorLineStyle = editedBlock.separatorLineStyle;
				}
			}
		});

		this.setState({ blocks }, () => {
			this.props.onBlocksChange && this.props.onBlocksChange(this.state.blocks);
		});
	}

	onBlockSettingsClicked(block) {
		const { resources } = this.props;
		if (block.type === ElementTypes.IMAGE) {
			ModalService.open(
				<ImageCropModalComponent
					offerId={this.state.offerId}
					onFinish={(imageData, isEditImage, imageId) =>
						this.onImageUploaded(imageData, isEditImage, imageId)
					}
					imagePath={block.pathOriginal}
					cropData={block.cropData}
					imageId={block.imageId}
					resources={resources}
				/>,
				{
					headline: resources.str_editImage,
					width: 800,
					modalClass: 'image-crop-modal'
				}
			);
		} else {
			ModalService.open(
				<ImpressBlockSettingsModalComponent
					block={block}
					onConfirm={block => this.onBlockSettingsChanged(block)}
					resources={resources}
				/>,
				{
					headline: resources.str_blockSettings,
					width: 600
				}
			);
		}
	}

	onBlockTextInputChange(value, editedBlock) {
		const blocks = this.state.blocks.concat();

		blocks.forEach(block => {
			if (block.tempId === editedBlock.tempId) {
				block.content = value;
			}
		});

		this.setState({ blocks }, () => {
			this.props.onBlocksChange && this.props.onBlocksChange(this.state.blocks);

			setTimeout(() => {
				addElementButtonPositionFixer();
			}, 100);
		});
	}

	onLetterPositionsChange(positions) {
		const standardOfferData = _.clone(this.state.standardOfferData, true);
		standardOfferData.positions = positions;
		standardOfferData.totalGross = positions.reduce((a, b) => a + b.totalGrossAfterDiscount, 0) || 0;
		standardOfferData.totalNet = positions.reduce((a, b) => a + b.totalNetAfterDiscount, 0) || 0;
		this.props.onStandardOfferDataChange && this.props.onStandardOfferDataChange(standardOfferData);
	}

	onLetterPositionsColumnsChange(columns) {
		const standardOfferData = _.clone(this.state.standardOfferData, true);
		standardOfferData.columns = columns;
		this.props.onStandardOfferDataChange && this.props.onStandardOfferDataChange(standardOfferData);
	}

	onLetterPriceKindChange(priceKind) {
		const standardOfferData = _.clone(this.state.standardOfferData, true);
		standardOfferData.priceKind = priceKind;
		this.props.onStandardOfferDataChange && this.props.onStandardOfferDataChange(standardOfferData);
	}

	render() {
		const { resources, customerData } = this.props;
		const { isLoadingBlocks, blocksErrorOccurred, blocks, miscellaneousData, globalSettings } = this.state;
		const standardOfferData = _.clone(this.state.standardOfferData, true);

		if (!blocks) {
			return null;
		}

		if (isLoadingBlocks) {
			return (
				<div className="impress-content">
					<LoaderComponent visible={true} />
				</div>
			);
		}

		const blocksSorted = blocks.length > 0 ? sortObjectArrayByProperty(blocks, 'position') : [];

		const blockElements = blocksSorted.map((block, blockIdx) => {
			return (
				<div
					key={`block-${block.tempId}`}
					ref={`block-${blockIdx}`}
					className={`impress-content-block-wrapper ${block.type}`}
					data-position={block.position}
					style={{ backgroundColor: block.background || null }}
				>
					<div
						className={`impress-content-block ${
							(block.type === ElementTypes.TEXT || block.type === ElementTypes.ARTICLES) &&
							block.layout === 'wide'
								? 'impress-content-block-wide'
								: ''
						}`}
					>
						<div className={`impress-edit--content-block-flyover-menu`}>
							<div id={`offer-impress-block-icon-move-${blockIdx}`} className="icon icon-move impress-edit--content-block-draggable">
								{this.createTooltip(
									`offer-impress-block-icon-move-${blockIdx}`,
									resources.str_move
								)}
							</div>
							{block.type !== ElementTypes.ARTICLES ? (
								<div id={`offer-impress-block-icon-duplicate-${blockIdx}`} className="icon icon-duplicate" onClick={() => this.onBlockDuplicateClicked(block)}>
									{this.createTooltip(
										`offer-impress-block-icon-duplicate-${blockIdx}`,
										resources.str_duplicate
									)}
								</div>
							) : null}
							<div id={`offer-impress-block-icon-settings-${blockIdx}`} className="icon icon-settings" onClick={() => this.onBlockSettingsClicked(block)}>
								{this.createTooltip(
									`offer-impress-block-icon-settings-${blockIdx}`,
									resources.str_toEdit
								)}
							</div>
							<div id={`offer-impress-block-icon-delete-${blockIdx}`} className="icon icon-trashcan" onClick={() => this.onBlockDeleteClicked(block)}>
								{this.createTooltip(
									`offer-impress-block-icon-delete-${blockIdx}`,
									resources.str_clear
								)}
							</div>
						</div>
						{block.type === ElementTypes.TEXT ? this.getHtmlInput(block) : null}
						{block.type === ElementTypes.IMAGE ? (
							block.path ? (
								<img src={`${config.resourceHost}${block.path}`} className="block-image" />
							) : null
						) : null}
						{block.type === ElementTypes.ARTICLES ? (
							<div>
								<div className="impress-edit--content-block-articles-header">
									{this.getHtmlInput(block)}
								</div>
								{standardOfferData.columns ? (
									<div>
										<LetterPositionsHeadComponent
											customerData={customerData}
											positions={standardOfferData.positions}
											columns={standardOfferData.columns}
											onColumnsClose={columns => this.onLetterPositionsColumnsChange(columns)}
										/>
										<LetterPositionsComponent
											transaction={standardOfferData}
											customerData={customerData}
											columns={standardOfferData.columns}
											positions={standardOfferData.positions}
											discount={standardOfferData.discount}
											miscOptions={miscellaneousData}
											priceKind={standardOfferData.priceKind}
											onPositionsChanged={positions => this.onLetterPositionsChange(positions)}
											onPriceKindChange={priceKind => this.onLetterPriceKindChange(priceKind)}
											resources={resources}
											activeComponentAction={this.props.activeComponentHandler}
											isActiveComponentHasError={this.props.isActiveComponentHasError}
											activeComponent={this.props.activeComponent}
										/>
										<LetterPositionsTotalComponent
											transaction={standardOfferData}
											onChange={value => this.onLetterPriceKindChange(value)}
											positions={standardOfferData.positions}
											totalDiscount={standardOfferData.totalDiscount}
											additionalCharges={standardOfferData.additionalCharges}
											priceKind={standardOfferData.priceKind}
											resources={resources}
											customerData={customerData}
											activeComponentAction={this.props.activeComponentAction}
											isActiveComponentHasError={this.props.isActiveComponentHasError}
											activeComponent={this.props.activeComponent}
										/>
										<div className="impress-edit-positions-totalInWords">
											{standardOfferData.totalGross ? `${resources.str_totalInWords}: ${convertToWords(formatCurrencyRounding(standardOfferData.totalGross))} ${resources.str_only}` : ''}
										</div>
									</div>
								) : (
									<div className="impress-edit--content-block-articles-placeholder">
										&lt;{resources.insertArticleOfferText}&gt;
									</div>
								)}
							</div>
						) : null}
						{block.type === ElementTypes.SEPARATOR ? (
							<hr
								style={{
									borderColor: block.separatorLineColor || null,
									borderWidth: block.separatorLineWidth
										? `${
											block.separatorLineStyle && block.separatorLineStyle !== 'solid'
												? parseFloat(parseInt(block.separatorLineWidth) / 2)
												: block.separatorLineWidth
										  }px`
										: null,
									borderStyle: block.separatorLineStyle || null
								}}
							/>
						) : null}
					</div>
				</div>
			);
		});

		let hasArticleList = globalSettings.positionsBlockExists;

		if (!hasArticleList) {
			hasArticleList = standardOfferData.positions && standardOfferData.positions.length > 0;
		}

		const addElementsContainer = (
			<div className="impress-add-elements">
				<div className="impress-edit--content-add-element-area-fixed-space" />
				<div className="impress-edit--content-add-element-area">
					<div
						id="impress-content-section-btn-add-elements"
						className={`impress-edit--content-add-btn ${
							this.state.isAddElementsPopoverVisible ? 'active' : ''
						}`}
					>
						{!this.state.isAddElementsPopoverVisible ? (
							<div className="add-btn-content">
								<span className="icon icon-plus" /> {resources.str_addItem}
							</div>
						) : null}
						{this.state.isAddElementsPopoverVisible ? (
							<div className="add-btn-content">
								<span className="icon icon-close" /> {resources.str_closeElement}
							</div>
						) : null}
					</div>
				</div>
				<PopoverComponent
					ref={'addElementPopover'}
					showOnClick={true}
					onElementClicked={() => this.setState({ isAddElementsPopoverVisible: true })}
					onPopoverHide={() => this.setState({ isAddElementsPopoverVisible: false })}
					elementId={`impress-content-section-btn-add-elements`}
					fixedWidth={650}
					fixedHeight={260}
					offsetLeft={330 - 270 / 2}
					offsetTop={20}
					arrowOffset={320}
					arrowAlignment={Direction.LEFT}
				>
					<div className="impress-edit--add-elements-popover">
						<div className="popover-separator-left" />
						<div className="popover-separator-middle" />
						<div className="popover-separator-right" />
						<div className="impress-edit--add-elements-popover-row">
							<div
								className="impress-edit--add-elements-popover-col"
								onClick={() => this.addElement(ElementTypes.TEXT, hasArticleList)}
								data-qs-id="impress-topbar-addElementsDropdown-item-text"
							>
								<div>
									<img src="/assets/images/svg/impress_text.svg" height="38" />
								</div>
								<div className="popover-label">{resources.str_addText}</div>
							</div>
							<div
								className="impress-edit--add-elements-popover-col"
								onClick={() => this.addElement(ElementTypes.IMAGE, hasArticleList)}
								data-qs-id="impress-topbar-addElementsDropdown-item-image"
							>
								<div>
									<img src="/assets/images/svg/impress_bild.svg" height="38" />
								</div>
								<div className="popover-label">{resources.str_addPictutre}</div>
							</div>
						</div>
						<div className="impress-edit--add-elements-popover-row">
							<div
								className="impress-edit--add-elements-popover-col"
								onClick={() => this.addElement(ElementTypes.SEPARATOR, hasArticleList)}
								data-qs-id="impress-topbar-addElementsDropdown-item-text"
							>
								<div>
									<img src="/assets/images/svg/impress_trenner.svg" height="38" />
								</div>
								<div className="popover-label">{resources.str_insertDividingLine}</div>
							</div>
							<div
								className={`impress-edit--add-elements-popover-col ${hasArticleList ? 'disabled' : ''}`}
								onClick={() => this.addElement(ElementTypes.ARTICLES, hasArticleList)}
								data-qs-id="impress-topbar-addElementsDropdown-item-separator"
							>
								<div>
									<img src="/assets/images/svg/impress_artikelliste.svg" height="38" />
								</div>
								<div className="popover-label">{resources.str_createArticleList}</div>
							</div>
						</div>
					</div>
				</PopoverComponent>
			</div>
		);

		return blocksErrorOccurred ? (
			<div className="impress-content">
				<div className="offer-impress-error">
					<div className="error-headline">
						<h1>{resources.errorOccuredMessage}</h1>
					</div>
				</div>
			</div>
		) : (
			<div className="impress-content-container">
				<div className="impress-content" ref="impressContentBlocks">
					{blockElements}
				</div>
				{addElementsContainer}
			</div>
		);
	}

	createTooltip(elementId, text) {
		return (
			<PopoverComponent
				key={elementId}
				html={text}
				showOnHover={true}
				offsetTop="10px"
				offsetLeft="50%"
				elementId={elementId}
			/>
		);
	}
}

export default ImpressContentSectionComponent;
