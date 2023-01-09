import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import Cropper from 'cropperjs';
import Uploader from 'fine-uploader';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import { getXhrBlob } from 'helpers/getXhrBlob';

class ImageCropModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			offerId: this.props.offerId || null,
			isImageCropping: false,
			isImageUploading: false,
			cropData: {
				width: 0,
				height: 0,
				top: 0,
				left: 0
			},
			originalImageCanvas: null,
			imageData: {},
			errorMessage: null,
			isEditImage: props.imagePath && this.props.imagePath.length > 0
		};

		this.cropper = null;
		this.file = null;
		this.manualUploader = null;
		this.isReplaceImage = false;
	}

	componentDidMount() {

		Uploader.DragAndDrop({
			dropZoneElements: [this.refs.imageDropzone],
			callbacks: {
				processingDroppedFilesComplete: (files, dropTarget) => {
					this.setImageToCrop(files);
				}
			}
		});
		this.manualUploader = this.initImageUploder();

		this.getBlobImageUrl();
	}

	getBlobImageUrl(blobURL) {
		const { isEditImage } = this.state;
		if (isEditImage) {
			this.setState(
				{
					isImageCropping: true
				},
				() => {
					getXhrBlob(`${config.resourceHost}${this.props.imagePath}`, blob => {
						this.setImageToCrop([blob]);
					});
				}
			);
		}
	}

	initImageUploder() {
		const { uploadEndpoint, resources } = this.props;
	 return new Uploader.FineUploaderBasic({
			multiple: false,
			request: {
				customHeaders: { authorization: `Bearer ${invoiz.user.token}` },
				endpoint: uploadEndpoint || `${config.resourceHost}impress/${this.state.offerId}/image`,
				inputName: 'image',
				params: {
					cropData: () => {
						return JSON.stringify({
							width: parseInt(this.state.cropData.width, 10),
							height: parseInt(this.state.cropData.height, 10),
							top: parseInt(this.state.cropData.top, 10),
							left: parseInt(this.state.cropData.left, 10)
						});
					}
				}
			},
			messages: {
				minSizeError: resources.image_minSizeError,
				sizeError: resources.image_sizeError,
				typeError: resources.image_typeError,
				emptyError: resources.image_emptyError
			},
			validation: {
				acceptFiles: ['image/jpg', 'image/jpeg', 'image/png', 'image/svg+xml'],
				allowedExtensions: ['jpg', 'jpeg', 'png', 'svg'],
				sizeLimit: 20 * 1024 * 1024
			},
			callbacks: {
				onError: (id, name, errorReason, xhr) => {
					this.setState({
						isImageUploading: false,
						isImageCropping: false,
						cropData: {
							width: 0,
							height: 0,
							top: 0,
							left: 0
						},
						originalImageCanvas: null,
						imageData: {},
						errorMessage: errorReason || resources.imageUploadError
					});

					this.cropper.destroy();
				},
				onComplete: (id, image, response) => {
					this.cropper.destroy();
					ModalService.close();
					if (this.isReplaceImage) {
						this.props.onFinish && this.props.onFinish(response.data, true, this.props.imageId);
					} else {
						this.props.onFinish && this.props.onFinish(response.data, false);
					}
				}
			}
		});
	}
	initImageCropper(image) {
		const { cropData } = this.props;

		this.cropper = new Cropper(image, {
			autoCropArea: 1,
			aspectRatio: 'free',
			minContainerWidth: 700,
			minContainerHeight: 430,
			minCropBoxWidth: 3,
			minCropBoxHeight: 3,
			movable: true,
			scalable: true,
			rotatable: true,
			checkOrientation: true,
			background: false,
			viewMode: 1,
			zoomOnWheel: false,

			ready: () => {
				this.cropper.moveTo(0);

				if (cropData && !this.isReplaceImage) {
					if (cropData.width && cropData.width < 3) {
						cropData.width = 3;
					}

					if (cropData.height && cropData.height < 3) {
						cropData.height = 3;
					}

					this.cropper.setData({
						width: parseInt(cropData.width || 0, 10),
						height: parseInt(cropData.height || 0, 10),
						x: parseInt(cropData.left || 0, 10),
						y: parseInt(cropData.top || 0, 10)
					});
				}

				const cData = this.cropper.getData();

				this.setState({
					cropData: {
						width: cData.width,
						height: cData.height,
						top: cData.y,
						left: cData.x
					},
					originalImageCanvas: this.cropper.getCroppedCanvas()
				});
			},
			cropend: () => {
				const cData = this.cropper.getData();
				this.cropper.setData(cData);

				this.setState({
					cropData: {
						width: cData.width,
						height: cData.height,
						top: cData.y,
						left: cData.x
					}
				});
			}
		});
	}

	onCancelClick() {
		this.manualUploader.cancelAll();
		ModalService.close(true);
	}

	onImageSelected(evt) {
		const files = evt.nativeEvent.target.files;
		this.setImageToCrop(files);
	}

	onUploadClick() {
		const { originalImageCanvas, cropData, offerId, isEditImage } = this.state;
		const { imageId, resources } = this.props;
		if (this.isReplaceImage) {
			if (originalImageCanvas.width > 12000 || originalImageCanvas.height > 12000) {
				this.setState({
					errorMessage: resources.imageSizeExceedError
				});

				return;
			}

			this.setState({ isImageUploading: true }, () => {
				this.manualUploader.addFiles([
					{
						canvas: this.state.originalImageCanvas,
						name: this.file.name || 'filename',
						quality: 100,
						type: this.file.type
					}
				]);
			});
		} else {
			if (isEditImage && imageId) {
				invoiz
					.request(`${config.resourceHost}impress/${offerId}/image/${imageId}`, {
						auth: true,
						method: 'PUT',
						data: {
							width: parseInt(cropData.width, 10),
							height: parseInt(cropData.height, 10),
							top: parseInt(cropData.top, 10),
							left: parseInt(cropData.left, 10)
						}
					})
					.then(({ body: { data } }) => {
						this.cropper.destroy();
						ModalService.close();
						this.props.onFinish && this.props.onFinish(data, true, imageId);
					})
					.catch(() => {
						invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
					});
			} else {
				if (originalImageCanvas.width > 12000 || originalImageCanvas.height > 12000) {
					this.setState({
						errorMessage: resources.imageSizeExceedError
					});

					return;
				}

				this.setState({ isImageUploading: true }, () => {
					this.manualUploader.addFiles([
						{
							canvas: this.state.originalImageCanvas,
							name: this.file.name || 'filename',
							quality: 100,
							type: this.file.type
						}
					]);
				});
			}
		}
	}

	setImageToCrop(files) {
		const { resources } = this.props;
		if (files && files.length) {
			this.file = files[0];

			const URL = window.URL || window.webkitURL;

			if (URL) {
				if (/^image\/\w+/.test(this.file.type)) {
					const blobURL = URL.createObjectURL(this.file);
					this.refs.imageTarget.setAttribute('src', blobURL);

					this.setState(
						{
							errorMessage: null
						},
						() => {
							this.validateImage();
						}
					);
				} else {
					this.setState({
						errorMessage: resources.imageFileExtentionError
					});
				}
			}
		}
	}

	validateImage() {
		const image = new Image();
		const imageTarget = this.refs.imageTarget;
		if (this.isReplaceImage) {
			this.cropper.destroy();
			// this.initImageCropper(imageTarget);
		}
		image.onload = () => {
			this.setState({ isImageCropping: true }, () => {
				this.initImageCropper(imageTarget);
			});
		};
		image.src = imageTarget.src;
	}

	onReplaceImageClick(evt) {
		const files = evt.nativeEvent.target.files;
		if (files) {
			this.isReplaceImage = true;
			this.setImageToCrop(files);
		}
	}

	render() {
		const { resources } = this.props;
		const { isImageCropping, errorMessage, isEditImage } = this.state;

		return (
			<div className="image-crop-modal-component">
				{isEditImage
					? <div className="image-crop-modal-replace">
						<input className="image-replace-input" type="file" onChange={evt => this.onReplaceImageClick(evt)} />
						<ButtonComponent
							// callback={evt => this.onReplaceImageClick(evt)}
							buttonIcon='icon-replace_image'
							label={resources.str_replaceImage}
						/>
					</div> : null}
				<div>
					<img ref="imageTarget" className={`image-target ${isImageCropping ? '' : 'hidden'}`} />
					<div className={`image-dropzone ${isImageCropping ? 'hidden' : ''}`} ref="imageDropzone">
						<label>
							<span className="image-dropzone-content">
								<div>
									<img src="/assets/images/svg/impress_bild.svg" height="80" />
								</div>
								<span className="upload-text">
									<strong>{resources.str_choosePicture}</strong> {resources.str_or} <strong>{resources.str_goHere}</strong>
								</span>
							</span>
							<input className="u_hidden" type="file" onChange={evt => this.onImageSelected(evt)} />
						</label>
					</div>
					{errorMessage ? <div className="image-crop-error-message">{errorMessage}</div> : null}
				</div>

				<div className="modal-footer">
					<div className="button-cancel" onClick={() => this.onCancelClick()}>
						{resources.str_abortStop}
					</div>
					{isImageCropping ? (
						<ButtonComponent
							callback={() => this.onUploadClick()}
							buttonIcon={`${isEditImage ? 'icon-check' : 'icon-plus'}`}
							label={`${isEditImage && this.isReplaceImage === false ? resources.str_toSave : resources.str_upload}`}
							loading={this.state.isImageUploading}
						/>
					) : (
						<ButtonComponent disabled={true} label={`${isEditImage ? resources.str_toSave : resources.str_upload}`} />
					)}
				</div>
			</div>
		);
	}
}

export default ImageCropModalComponent;
