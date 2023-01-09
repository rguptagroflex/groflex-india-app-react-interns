import invoiz from 'services/invoiz.service';
import config from 'config';
import _ from 'lodash';
import React from 'react';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import ModalService from 'services/modal.service';
import { sortObjectArrayByProperty } from 'helpers/sortObjectArrayByProperty';
import { moveArrayElement } from 'helpers/moveArrayElement';
import { customerTypes, recipientStates } from 'helpers/constants';
import RecipientComponent from 'shared/recipient/recipient.component';
import Uploader from 'fine-uploader';
import { handleImageError } from 'helpers/errors';
import { format } from 'util';
import OfferTypes from 'enums/impress/offer-types.enum';
import { addElementButtonPositionFixer } from 'helpers/impress/addElementButtonPositionFixer';
import ElementTypes from 'enums/impress/element-types.enum';
import ChangeDetection from 'helpers/changeDetection';
const changeDetection = new ChangeDetection();

const { RECIPIENT_STATE_FORM } = recipientStates;
const { COMPANY } = customerTypes;

const KEY_CODE_ENTER = 13;
const KEY_CODE_ESCAPE = 27;

const deleteLogo = (callback, resources) => {
	invoiz
		.request(`${config.resourceHost}tenant/logo`, {
			auth: true,
			method: 'DELETE'
		})
		.then(() => {
			invoiz.page.showToast({ message: resources.logoDeleteSuccessMessage });
			callback && callback();
		})
		.catch(() => {
			invoiz.page.showToast({ type: 'error', message: resources.defaultErrorMessage });
		});
};

class ImpressNavSectionComponent extends React.Component {
	constructor(props) {
		super(props);

		const pages = this.props.pages ? JSON.parse(JSON.stringify(this.props.pages)) : null;
		this.state = {
			pages,
			logo: (this.props.globalSettings && this.props.globalSettings.logo) || null,
			isPageEditing: false,
			customerData: props.customerData,
			standardOfferData: props.standardOfferData,
			recipientState: null
		};

		this.currentEditedPageTitle = null;
		this.currentEditedPageTitleReset = false;
		this.manualUploader = null;
		this.originalData = null;
	}

	componentDidMount() {
		document.addEventListener('click', this.onDocumentClicked);
		setTimeout(() => {
			this.initManualUploader();
		});
		setTimeout(() => {
			this.originalData = JSON.parse(JSON.stringify({
				logo: this.state.logo,
				customerData: this.state.customerData,
				standardOfferData: this.props.standardOfferData,
				pages: this.props.pages
			}));
			changeDetection.bindEventListeners();
			changeDetection.setModelGetter(() => {
				const current = JSON.parse(JSON.stringify({
					logo: this.state.logo,
					customerData: this.state.customerData,
					standardOfferData: this.state.standardOfferData,
					pages: this.state.pages
				}));
				const original = this.originalData; 
				return {
					original,
					current
				};
			});
		}, 0);
	}

	componentWillReceiveProps(props) {
		this.setState({
			pages: props.pages || null,
			logo: (props.globalSettings && props.globalSettings.logo) || null,
			standardOfferData: props.standardOfferData
		});
		if (props.isSaved) {
			this.originalData = JSON.parse(JSON.stringify({
				logo: this.state.logo,
				customerData: this.state.customerData,
				standardOfferData: this.state.standardOfferData,
				pages: this.state.pages
			}));
		}
	}

	componentWillUnmount() {
		document.removeEventListener('click', this.onDocumentClicked);
		changeDetection.unbindEventListeners();
	}

	addFile(files) {
		if (!files) {
			return;
		}

		_.each(files, file => {
			this.manualUploader.addFiles([file]);
		});
	}

	getSelectedPage() {
		const { pages } = this.state;
		const selectedPageIndex = pages.findIndex(existingPage => existingPage.selected === true);
		const selectedPage = pages[selectedPageIndex];
		return selectedPage;
	}

	initManualUploader() {
		const {resources} = this.props;
		const fineUploaderConfig = {
			messages: {
				minSizeError: resources.fileSizeMinimumLimit,
				sizeError: resources.fileSizeMaximumLimit,
				typeError: resources.invalidFileType
			},
			validation: {
				acceptFiles: ['image/jpg', 'image/jpeg', 'image/png'],
				allowedExtensions: ['jpg', 'jpeg', 'png'],
				sizeLimit: 25 * 1024 * 1024 // 25 mb
			},
			scaling: {
				sendOriginal: false,
				sizes: [{ name: '', maxSize: 3000 }]
			}
		};

		this.manualUploader = new Uploader.FineUploaderBasic(
			_.assign({}, fineUploaderConfig, {
				autoUpload: true,
				multiple: false,
				request: {
					customHeaders: { authorization: `Bearer ${invoiz.user.token}` },
					endpoint: `${config.resourceHost}tenant/logo`,
					inputName: 'image',
					filenameParam: 'qqfilename'
				},
				callbacks: {
					onComplete: (id, fileName, response) => {
						if (!response.success) {
							return;
						}

						invoiz.user.logoPath = response.data.path;
						this.setState({ logo: invoiz.user.logoPath }, () => {
							this.props.onLogoChange && this.props.onLogoChange(invoiz.user.logoPath);
						});
					},
					onError: (id, name, errorReason, xhr) => {
						if (xhr) {
							const { meta: error } = JSON.parse(xhr.response);
							return handleImageError(this, error);
						}

						invoiz.page.showToast({
							type: 'error',
							message: format(errorReason, name) || resources.logoUploadError
						});
					}
				}
			})
		);
	}

	isRecipientFormStateOpen() {
		return (
			this.refs.recipientComponent &&
			this.refs.recipientComponent.getRecipientState() &&
			this.refs.recipientComponent.getRecipientState() === RECIPIENT_STATE_FORM
		);
	}

	onLogoDeleteClick() {
		const { resources } = this.props;
		ModalService.open(resources.logoDeleteConfirmText, {
			width: 500,
			headline: resources.str_deleteLogo,
			cancelLabel: resources.str_abortStop,
			confirmIcon: 'icon-trashcan',
			confirmLabel: resources.str_clear,
			confirmButtonType: 'secondary',
			onConfirm: () => {
				ModalService.close();

				deleteLogo(() => {
					invoiz.user.logoPath = null;
					this.setState({ logo: null }, () => {
						this.props.onLogoChange && this.props.onLogoChange(null);
					});
				}, resources);
			}
		});
	}

	onLogoFileSelect(event) {
		const file = event.target.files[0];
		this.addFile([file]);
		event.target.value = '';
	}

	onCustomerDelete() {
		this.setState({ customerData: null }, () => {
			this.props.onCustomerChange && this.props.onCustomerChange(null);
		});
	}

	onCustomerCloseEditMode(customerData) {
		const { standardOfferData } = this.state;
		const { kind } = customerData;
		const { contact: contactData } = customerData;
		const propsToOmit =
			kind === COMPANY ? ['firstName', 'lastName'] : ['companyName', 'companyNameAffix', 'contact'];

		const omittedCustomerData = _.omit(customerData, propsToOmit);
		omittedCustomerData.id = standardOfferData.customerId;

		const newCustomerData = Object.assign({}, this.state.customerData, omittedCustomerData);

		this.setState({ customerData: newCustomerData }, () => {
			this.props.onCustomerChange && this.props.onCustomerChange(this.state.customerData, true);
		});

		this.props.activeComponentAction(this.props.activeComponent, false);

		if (kind !== COMPANY || !contactData) {
			return;
		}

		const omittedContactData = _.omit(contactData, ['name']);

		this.setState(
			{
				customerData: Object.assign({}, newCustomerData, {
					contact: omittedContactData,
					id: standardOfferData.customerId
				})
			},
			() => {
				this.props.onCustomerChange && this.props.onCustomerChange(this.state.customerData, true);
			}
		);
	}

	onCustomerChange(selectedOption) {
		const { resources } = this.props;
		this.setState({ customerData: null }, () => {
			this.props.onCustomerChange && this.props.onCustomerChange(null);
		});

		if (!selectedOption) {
			return;
		}

		const { customerData } = selectedOption;

		this.setState({ customerData }, () => {
			this.props.onCustomerChange && this.props.onCustomerChange(this.state.customerData);
		});

		if (customerData.notesAlert) {
			ModalService.open(<div dangerouslySetInnerHTML={{ __html: customerData.notes }} />, {
				headline: resources.str_cutomerNote,
				cancelLabel: resources.str_shutdown,
				confirmLabel: resources.str_ok,
				confirmIcon: 'icon-check',
				onConfirm: () => {
					ModalService.close();
				}
			});
		}
	}

	onDocumentClicked(e) {
		invoiz.trigger('documentClicked', e);
	}

	onPageAddClicked() {
		const { resources } = this.props;
		const pages = JSON.parse(JSON.stringify(this.state.pages));

		pages.push({ position: pages.length + 1, title: resources.str_newPage, isPageEditing: true });

		this.setState(
			{
				pages,
				isPageEditing: true
			},
			() => {
				if (
					this.refs[`pageTitle-${pages.length}`] &&
					this.refs[`pageTitle-${pages.length}`].refs['pageTitle']
				) {
					this.refs[`pageTitle-${pages.length}`].refs['pageTitle'].focus();
					this.refs[`pageTitle-${pages.length}`].refs['pageTitle'].select();
				}

				this.props.onNavChange && this.props.onNavChange(this.state.pages);
			}
		);
	}

	onPageClicked(page) {
		const pages = JSON.parse(JSON.stringify(this.state.pages));

		if (page.selected) {
			return;
		}

		pages.forEach(existingPage => {
			existingPage.selected = existingPage.position === page.position;
		});

		this.setState({ pages }, () => {
			this.props.onNavSelect && this.props.onNavSelect(this.getSelectedPage());

			setTimeout(() => {
				window.scrollTo(0, 0);
				addElementButtonPositionFixer();

				setTimeout(() => {
					window.scrollTo(0, 0);
					addElementButtonPositionFixer();
				}, 1000);
			}, 0);
		});
	}

	onPageDeleteClicked(evt, page) {
		const { resources } = this.props;
		evt.stopPropagation();

		ModalService.open(
			<div dangerouslySetInnerHTML={{ __html: format(resources.pageDeleteWarningMessage, page.title) }}>
			</div>,
			{
				width: 500,
				headline: resources.str_deletePage,
				cancelLabel: resources.str_abortStop,
				confirmIcon: 'icon-trashcan',
				confirmLabel: resources.str_clear,
				confirmButtonType: 'secondary',
				onConfirm: () => {
					const standardOfferData = _.clone(this.state.standardOfferData, true);
					let wasArticlesDeleted = false;
					let selectedPageChanged = false;

					if (page.blocks) {
						page.blocks.forEach(block => {
							if (block.type === ElementTypes.ARTICLES) {
								wasArticlesDeleted = true;
							}
						});
					}

					const prevPages = JSON.parse(JSON.stringify(this.state.pages));
					const nextPages = prevPages.filter(prevPage => {
						return prevPage.position !== page.position;
					});

					nextPages.forEach((nextPage, index) => {
						nextPage.position = index + 1;

						if (page.selected) {
							nextPage.selected = index === 0;
							selectedPageChanged = true;
						}
					});

					ModalService.close();

					this.setState({ pages: nextPages }, () => {
						if (selectedPageChanged) {
							this.props.onNavSelect && this.props.onNavSelect(this.getSelectedPage());
						}

						this.props.onNavChange && this.props.onNavChange(this.state.pages);

						if (wasArticlesDeleted) {
							standardOfferData.positions = [];
							standardOfferData.totalGross = 0;
							standardOfferData.totalNet = 0;
							this.props.onStandardOfferDataChange &&
								this.props.onStandardOfferDataChange(standardOfferData);

							setTimeout(() => {
								this.props.onGlobalSettingsChange &&
									this.props.onGlobalSettingsChange({
										positionsBlockExists: false
									});
							}, 0);
						}
					});
				}
			}
		);
	}

	onPageEditClicked(evt, page) {
		const pages = JSON.parse(JSON.stringify(this.state.pages));

		evt.stopPropagation();

		pages.forEach(existingPage => {
			if (existingPage.position === page.position) {
				existingPage.isPageEditing = true;
			}
		});

		this.setState(
			{
				pages,
				isPageEditing: true
			},
			() => {
				if (
					this.refs[`pageTitle-${page.position}`] &&
					this.refs[`pageTitle-${page.position}`].refs['pageTitle']
				) {
					this.refs[`pageTitle-${page.position}`].refs['pageTitle'].focus();
					this.refs[`pageTitle-${page.position}`].refs['pageTitle'].select();
				}
			}
		);
	}

	onPageSortClicked(evt, page, sortUp) {
		const pages = JSON.parse(JSON.stringify(this.state.pages));
		const pageIndex = pages.findIndex(existingPage => existingPage.position === page.position);

		evt.stopPropagation();

		moveArrayElement(pages, pageIndex, pageIndex + (sortUp ? -1 : 1));

		pages.forEach((page, pageIndex) => {
			page.position = pageIndex + 1;
		});

		this.setState(
			{
				pages
			},
			() => {
				this.props.onNavChange && this.props.onNavChange(this.state.pages);
			}
		);
	}

	onPageTitleChange(val) {
		this.currentEditedPageTitle = val;
	}

	onPageTitleBlur(page) {
		const pages = JSON.parse(JSON.stringify(this.state.pages));

		pages.forEach(existingPage => {
			existingPage.isPageEditing = false;

			if (
				existingPage.position === page.position &&
				this.currentEditedPageTitle &&
				this.currentEditedPageTitle.trim().length > 0 &&
				!this.currentEditedPageTitleReset
			) {
				existingPage.title = this.currentEditedPageTitle.trim();
			}
		});

		this.setState(
			{
				pages,
				isPageEditing: false
			},
			() => {
				this.currentEditedPageTitle = null;
				this.currentEditedPageTitleReset = false;
				window.getSelection().removeAllRanges();
				this.props.onNavChange && this.props.onNavChange(this.state.pages);
			}
		);
	}

	onPageTitleKeyDown(evt, page) {
		const keyCode = evt.keyCode || evt.which;

		if (this.refs[`pageTitle-${page.position}`] && this.refs[`pageTitle-${page.position}`].refs['pageTitle']) {
			if (keyCode === KEY_CODE_ENTER) {
				this.refs[`pageTitle-${page.position}`].refs['pageTitle'].blur();
			} else if (keyCode === KEY_CODE_ESCAPE) {
				this.currentEditedPageTitleReset = true;
				this.refs[`pageTitle-${page.position}`].refs['pageTitle'].blur();
			}
		}
	}

	onPageTitleClick(evt, page) {
		setTimeout(() => {
			this.onPageTitleBlur(page);
		});
	}

	render() {
		const { resources } = this.props;
		const { pages, isPageEditing, customerData, recipientState, standardOfferData } = this.state;
		let logo = this.state.logo;

		if (logo) {
			logo = config.resourceHost + logo;
		}

		if (!pages) {
			return null;
		}

		const pagesSorted = sortObjectArrayByProperty(pages, 'position');

		return (
			<div className="impress-nav">
				<div className={`impress-nav-container ${isPageEditing ? 'is-editing' : ''}`}>
					<div className="impress-nav-logo">
						{logo ? (
							<div>
								<img src={logo} />
								<div className="icon icon-close2" onClick={() => this.onLogoDeleteClick()} />
							</div>
						) : (
							<div className="logo-upload-area">
								<label>
									<p className="row1">
										<img src="/assets/images/svg/impress_bild.svg" height="50" />
									</p>
									<p className="row2">
										<span>{resources.str_logo}</span>{resources.str_hereSmall}
									</p>
									<p className="row3">{resources.str_uploadNow}</p>
									<input
										className="u_hidden"
										type="file"
										onChange={this.onLogoFileSelect.bind(this)}
									/>
								</label>
							</div>
						)}
					</div>

					{standardOfferData.type === OfferTypes.IMPRESS ? (
						<div className="impress-edit--nav-btn-recipient">
							<RecipientComponent
								ref="recipientComponent"
								customerData={customerData}
								recipientState={recipientState}
								onChange={val => this.onCustomerChange(val)}
								onCloseEditMode={val => this.onCustomerCloseEditMode(val)}
								onCustomerDelete={() => this.onCustomerDelete()}
								resources={resources}
								activeComponentAction={this.props.activeComponentAction}
								isActiveComponentHasError={this.props.isActiveComponentHasError}
								activeComponent={this.props.activeComponent}
								recipientType={'customer'}
								transaction={standardOfferData}
							/>
						</div>
					) : null}

					{pagesSorted.map((page, pageIdx) => {
						return (
							<div
								key={page.position}
								className={`impress-nav-item ${page.selected ? 'active' : ''}`}
								onClick={() => this.onPageClicked(page)}
							>
								{isPageEditing ? null : (
									<div className={`impress-edit--nav-flyover-menu`}>
										<div
											className="icon icon-edit"
											onClick={evt => this.onPageEditClicked(evt, page)}
										/>
										{pageIdx === 0 ? null : (
											<div
												className="icon icon-sort_up"
												onClick={evt => this.onPageSortClicked(evt, page, true)}
											/>
										)}
										{pageIdx >= pagesSorted.length - 1 ? null : (
											<div
												className="icon icon-sort_down"
												onClick={evt => this.onPageSortClicked(evt, page)}
											/>
										)}
										{pagesSorted.length > 1 ? (
											<div
												className="icon icon-trashcan"
												onClick={evt => this.onPageDeleteClicked(evt, page)}
											/>
										) : null}
									</div>
								)}
								<TextInputExtendedComponent
									ref={`pageTitle-${page.position}`}
									value={page.title}
									name="pageTitle"
									placeholder={resources.str_enterTitle}
									onChange={val => this.onPageTitleChange(val)}
									onBlur={() => this.onPageTitleBlur(page)}
									onKeyDown={evt => this.onPageTitleKeyDown(evt, page)}
									onClick={evt => this.onPageTitleClick(evt, page)}
									disabled={!page.isPageEditing}
									dataQsId="impress-edit-pageTitle"
								/>
							</div>
						);
					})}

					<div className="impress-nav-item impress-edit--nav-btn-addpage">
						{isPageEditing ? null : (
							<div className="btn-addpage" onClick={() => this.onPageAddClicked()}>
								<div className="icon icon-rounded icon-plus" />
								<div className="btn-label">{resources.str_addPage}</div>
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}
}

export default ImpressNavSectionComponent;
