import invoiz from 'services/invoiz.service';
import React from 'react';
import { Link } from 'react-router-dom';
import TopbarComponent from 'shared/topbar/topbar.component';
import _ from 'lodash';
// import moment from 'moment';
import Uploader from 'fine-uploader';
import Decimal from 'decimal.js';
import accounting from 'accounting';
import { format } from 'util';
import config from 'config';
import CheckboxInputComponent from 'shared/inputs/checkbox-input/checkbox-input.component';
import CurrencyInputComponent from 'shared/inputs/currency-input/currency-input.component';
import DateInputComponent from 'shared/inputs/date-input/date-input.component';
import RadioInputComponent from 'shared/inputs/radio-input/radio-input.component';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import PopoverComponent from 'shared/popover/popover.component';
import { handleImageError } from 'helpers/errors';
import ChangeDetection from 'helpers/changeDetection';
import { formatApiDate } from 'helpers/formatDate';
import userPermissions from 'enums/user-permissions.enum';

const changeDetection = new ChangeDetection();

const calculateNetGrossPrice = (price, vatPercent, calculateGross) => {
	const calculatedVat = 1 + vatPercent / 100;
	const basePrice = new Decimal(price);
	let calculatedPrice = 0;

	if (calculateGross) {
		calculatedPrice = basePrice.times(calculatedVat);
	} else {
		calculatedPrice = basePrice.dividedBy(calculatedVat);
	}

	return calculatedPrice.toDP(2).toNumber();
};

class ExpenseEditComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			expense: this.props.expense || {},
			isPaid: this.props.expense && this.props.expense.payKind !== 'open',
			isModal: this.props.isModal,
			uploadedReceipts: [],
			amountInvalid: false
		};

		this.vatPercentOptions = {
			loadOptions: (input, callback) => {
				callback(null, {
					options: invoiz.user.vatCodes,
					complete: true
				});
			},
			clearable: false,
			backspaceRemoves: false,
			labelKey: 'name',
			valueKey: 'value',
			matchProp: 'name',
			handleChange: this.onVatPercentChange.bind(this)
		};

		this.filesToDelete = [];
	}

	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_EXPENSE)) {
			invoiz.user.logout(true);
		}
		setTimeout(() => {
			this.initDragAndDropUploader();
			this.initManualUploader();
			this.onTextAreaChange();

			setTimeout(() => {
				const dataOriginal = JSON.parse(JSON.stringify(this.state.expense));
				dataOriginal.receiptCount = this.state.expense.receipts.length;

				changeDetection.bindEventListeners();

				changeDetection.setModelGetter(() => {
					const currentData = JSON.parse(JSON.stringify(this.state.expense));
					currentData.receiptCount = this.state.uploadedReceipts.length;

					return {
						original: dataOriginal,
						current: currentData
					};
				});
			}, 0);
		});
	}

	componentWillUnmount() {
		this.isUnmounted = true;
		changeDetection.unbindEventListeners();
	}

	render() {
		const { resources } = this.props;
		const topbar = this.state.isModal ? null : (
			<TopbarComponent
				title={this.state.expense.id ? resources.str_editOutput : resources.str_createOutput }
				hasCancelButton={true}
				cancelButtonCallback={() => this.onCancel()}
				buttonCallback={(evt, button) => this.onTopbarButtonClick(button.action)}
				buttons={[
					{
						type: 'default',
						label: resources.expenseEditSaveAndCaptureButtonText,
						buttonIcon: 'icon-check',
						action: 'saveAndCreate',
						dataQsId: 'expense-topbar-button-save-and-create'
					},
					{
						type: 'primary',
						label: resources.str_toSave,
						buttonIcon: 'icon-check',
						action: 'save',
						dataQsId: 'expense-topbar-button-save'
					}
				]}
			/>
		);

		const isPaidElements =
			this.state.expense.payKind !== 'open' ? (
				<div>
					<div className="paykind-wrapper">
						<label className="paykind-radio-label">{resources.str_payment}</label>

						<RadioInputComponent
							wrapperClass={`paykind-radio-wrapper`}
							options={[{ label: resources.str_cash, value: 'cash' }, { label: resources.str_bank, value: 'bank' }]}
							value={this.state.expense.payKind || 'cash'}
							onChange={() => this.onPaykindChange()}
							dataQsId="expense-edit-paykind"
						/>
					</div>
					<div className="payment-date">
						<div className="dateInput dateInput_label-left">
							<label className="dateInput_label">{resources.expenseEditPaymentDateLabel}</label>
							<DateInputComponent
								name={'expense-pay-date'}
								value={this.state.expense.displayPayDate}
								required={this.state.expense.payKind === 'bank'}
								onChange={(name, value, date) => this.onDateChange(name, value, date)}
								dataQsId="expense-edit-date"
							/>
						</div>

						{this.state.expense.financeApiBankTransactionId ? (
							<Link
								className="payment-transaction-link"
								to={`/banking/transactions/${this.state.expense.financeApiBankTransactionId}`}
							>
								{resources.expenseEditPaymentLinkText}
							</Link>
						) : null}
					</div>
				</div>
			) : null;

		let vatPercentElement = null;

		const vatPercent = _.find(invoiz.user.vatCodes, vatPercent => {
			return parseInt(vatPercent.value, 10) === this.state.expense.vatPercent;
		});

		vatPercentElement = (
			<div className="vat-percent-wrapper">
				<label>{resources.str_vatRate}</label>
				<SelectInputComponent
					allowCreate={false}
					value={vatPercent}
					options={this.vatPercentOptions}
					dataQsId="expense-edit-vat-percent"
				/>
			</div>
		);

		let receiptList = null;
		const allReceipts = this.state.expense.receipts.concat(this.state.uploadedReceipts);
		if (allReceipts && allReceipts.length > 0) {
			const receipts = allReceipts.map((receipt, index) => {
				const popoverEntries = [
					{
						label: resources.str_clear,
						action: 'delete',
						dataQsId: `expense-upload-delete-${index}`
					}
				];

				if (receipt.url) {
					popoverEntries.push({
						label: resources.str_preview,
						action: 'preview',
						dataQsId: `expense-upload-preview-${index}`
					});
				}

				return (
					<div className="expenseEdit_fileListRow" key={`receipt-item-${index}`}>
						<div className="expenseEdit_fileIcon icon icon-attachment" />
						<div className="list_item">{receipt.name}</div>
						{this.state.isModal ? (
							<div
								className="list_item list_control icon icon-close"
								onClick={() => this.onUploadDropdownEntryClick(index, { action: 'delete' })}
							/>
						) : (
							<div
								onClick={() => this.onUploadDropdownClick(index)}
								id={`expense-upload-dropdown-anchor-${index}`}
								className="list_item list_control icon icon-arr_down"
							>
								<PopoverComponent
									entries={[popoverEntries]}
									elementId={`expense-upload-dropdown-anchor-${index}`}
									offsetLeft={23}
									offsetTop={10}
									arrowOffset={22}
									ref={`expense-upload-popover-${index}`}
									onClick={entry => this.onUploadDropdownEntryClick(index, entry)}
								/>
							</div>
						)}
					</div>
				);
			});
			receiptList = <div className="expense-receipt-list">{receipts}</div>;
		}

		const errorMessage = this.state.amountInvalid ? resources.errorCodesWithMessages['REQUIRED'] : null;

		return (
			<div className="expense-edit-component-wrapper">
				{topbar}

				<div className={`${this.state.isModal ? '' : 'box wrapper-has-topbar-with-margin'}`}>
					<div className="row u_pb_40 u_pt_60">
						<div className="col-xs-4 form_groupheader_edit text-h4">{resources.str_details}</div>
						<div className="col-xs-8">
							<TextInputExtendedComponent
								dataQsId="expense-edit-payee"
								value={this.state.expense.payee}
								label={resources.str_payee}
								onChange={value => this.onPayeeChange(value)}
							/>

							<div className="textarea">
								<label className="textarea_label">{resources.str_description}</label>
								<textarea
									data-qs-id="expense-edit-description"
									id="expense-edit-textarea"
									className="textarea_input"
									rows="3"
									defaultValue={this.state.expense.description}
									placeholder={resources.str_pasteYourDataHere}
									onChange={() => this.onTextAreaChange()}
								/>
								<span className="textarea_bar" />
							</div>

							<div className="u_pt_6">
								<div className="dateInput dateInput_label-left">
									<label className="dateInput_label">{resources.str_documentDate}</label>
									<DateInputComponent
										dataQsId="expense-edit-booking-date"
										name={'expense-booking-date'}
										value={this.state.expense.displayDate}
										required={true}
										onChange={(name, value, date) => this.onDateChange(name, value, date)}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="row u_pb_40 u_pt_60">
						<div className="col-xs-4 form_groupheader_edit text-h4">{resources.str_amount}</div>
						<div className="col-xs-8">
							{vatPercentElement}
							<div className="expense-price-div">
								<CurrencyInputComponent
									dataQsId="expense-edit-pricenet"
									errorMessage={errorMessage}
									value={this.state.expense.price}
									onBlur={value => this.onAmountBlur(value, true)}
									label={resources.expenseEditNetInputLabel}
									required={true}
									hasBorder={true}
									leftLabel={true}
									willReceiveNewValueProps={true}
								/>
							</div>
							<div className="expense-price-div">
								<CurrencyInputComponent
									dataQsId="expense-edit-pricetotal"
									errorMessage={errorMessage}
									value={this.state.expense.priceTotal}
									onBlur={value => this.onAmountBlur(value)}
									label={resources.expenseEditGrossInputLabel}
									required={true}
									hasBorder={true}
									leftLabel={true}
									willReceiveNewValueProps={true}
								/>
							</div>

							<div className="u_pt_40">
								<CheckboxInputComponent
									dataQsId="expense-edit-ispaid"
									name={'isPaid'}
									label={resources.str_paid}
									checked={this.state.isPaid}
									onChange={() => this.onPaidChange()}
								/>
							</div>

							{isPaidElements}
						</div>
					</div>

					<div className="row u_pb_40 u_pt_60">
						<div className="col-xs-4 form_groupheader_edit text-h4">{resources.expenseEditDocumentHeading}</div>
						<div className="col-xs-8">
							{receiptList}

							<div
								id="expense-receipt-dropbox"
								className="expense-edit-drop-box drop-box text-center u_p_20 u_mb_4"
								data-qs-id="expense-edit-receipt-upload"
							>
								<label className="text-muted">
									<p>{resources.expenseEditDocumentDragAndDropText}</p>
									<p>{resources.expenseEditDocumentReciptText}</p>
									<p>{resources.str_select}</p>
									<input
										className="u_hidden"
										type="file"
										onChange={this.addSelectedFile.bind(this)}
									/>
								</label>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	onAmountBlur(value, isNet) {
		const { expense } = this.state;

		value = value.toString().replace(/-/gi, '');

		if (isNet) {
			// expense.price = accounting.unformat(value, ',');
			expense.price = accounting.unformat(value, config.currencyFormat.decimal);
			// expense.priceTotal = calculateNetGrossPrice(accounting.unformat(value, ','), expense.vatPercent, true);
			expense.priceTotal = calculateNetGrossPrice(accounting.unformat(value, config.currencyFormat.decimal), expense.vatPercent, true);
			expense.calculationBase = 'net';
		} else {
			// expense.priceTotal = accounting.unformat(value, ',');
			expense.priceTotal = accounting.unformat(value, config.currencyFormat.decimal);
			// expense.price = calculateNetGrossPrice(accounting.unformat(value, ','), expense.vatPercent, false);
			expense.price = calculateNetGrossPrice(accounting.unformat(value, config.currencyFormat.decimal), expense.vatPercent, false);
			expense.calculationBase = 'gross';
		}

		this.setState({ expense, amountInvalid: !value || value <= 0 });
	}

	onUploadDropdownClick(index) {
		this.refs[`expense-upload-popover-${index}`].show();
	}

	onUploadDropdownEntryClick(index, entry) {
		if (entry.action === 'delete') {
			const receipts = this.state.expense.receipts.concat(this.state.uploadedReceipts);
			this.filesToDelete.push(receipts[index].id);

			const { expense } = this.state;
			expense.receipts = this.state.expense.receipts.filter(receipt => {
				return this.filesToDelete.indexOf(receipt.id) === -1;
			});

			const uploadedReceipts = this.state.uploadedReceipts.filter(receipt => {
				return this.filesToDelete.indexOf(receipt.id) === -1;
			});

			this.setState({ uploadedReceipts, expense });
		} else if (entry.action === 'preview') {
			const url = `${config.resourceHost}${this.state.expense.receipts[index].url}`;
			window.open(url);
		}
	}

	onPaidChange() {
		let { isPaid } = this.state;
		const { expense } = this.state;

		isPaid = !isPaid;

		if (isPaid) {
			expense.payKind = 'cash';
			// expense.payDate = moment().format('YYYY-MM-DD');
			expense.payDate = formatApiDate();
		} else {
			expense.payKind = 'open';
			expense.payDate = null;
		}

		this.setState({ expense, isPaid });
	}

	onDateChange(name, value, date) {
		const { expense } = this.state;
		switch (name) {
			case 'expense-booking-date':
				// expense.date = moment(date).format('YYYY-MM-DD');
				expense.date = formatApiDate(date);
				break;
			case 'expense-pay-date':
				// expense.payDate = moment(date).format('YYYY-MM-DD');
				expense.payDate = formatApiDate(date);
				break;
		}
	}

	onPayeeChange(value) {
		const { expense } = this.state;

		expense.payee = value;

		this.setState({ expense });
	}

	onPaykindChange() {
		const { expense } = this.state;

		expense.payKind = expense.payKind === 'cash' ? 'bank' : 'cash';

		this.setState({ expense });
	}

	onVatPercentChange(selectedOption) {
		if (!selectedOption) {
			return;
		}

		const { expense } = this.state;

		expense.vatPercent = parseInt(selectedOption.value);
		expense.priceTotal = calculateNetGrossPrice(expense.price, expense.vatPercent, true);

		this.setState({
			expense
		});
	}

	onTextAreaChange() {
		const { expense } = this.state;
		const value = $('#expense-edit-textarea').val();
		const rows = Math.max(1 + (value.match(/\n/g) || []).length, 3);

		expense.description = value && value.trim();

		$('#expense-edit-textarea').attr('rows', rows);

		if (!this.isUnmounted) {
			this.setState({ expense });
		}
	}

	onTopbarButtonClick(action) {
		const { resources } = this.props;
		switch (action) {
			case 'save':
				this.save();
				break;

			case 'saveAndCreate':
				this.save(true);
				invoiz.page.showToast({ message: resources.expenseSaveSuccessMessage });
				break;
		}
	}

	saveFromModal() {
		const { resources } = this.props;
		return new Promise((resolve, reject) => {
			if (!this.state.expense.priceTotal || this.state.expense.priceTotal <= 0) {
				this.setState({ amountInvalid: true });
				reject(new Error());
				return;
			}

			const { expense } = this.state;
			expense.receipts = this.state.uploadedReceipts;

			if (expense.payKind === 'open') {
				delete expense.payDate;
			}
			if (expense.payee === null) {
				expense.payee = '';
			}

			const expenseUrl = expense.id
				? `${config.expense.resourceUrl}/${expense.id}`
				: `${config.expense.resourceUrl}`;

			invoiz
				.request(expenseUrl, {
					auth: true,
					method: expense.id ? 'PUT' : 'POST',
					data: expense
				})
				.then(() => {
					if (!this.filesToDelete || this.filesToDelete.length === 0) {
						resolve();
						return;
					}

					const requests = this.filesToDelete.map(id => {
						return invoiz.request(`${config.expense.endpoints.receiptUrl}/${id}`, {
							auth: true,
							method: 'DELETE'
						});
					});

					Promise.all(requests)
						.then(() => {
							resolve();
						})
						.catch(() => {
							reject(new Error());
							invoiz.showNotification({ type: 'error', message: resources.str_saveErrorMessage });
						});
				})
				.catch(() => {
					reject(new Error());
					invoiz.showNotification({ type: 'error', message: resources.str_saveErrorMessage });
				});
		});
	}

	save(createNew) {
		const { resources } = this.props;
		if (!this.state.expense.priceTotal || this.state.expense.priceTotal <= 0) {
			this.setState({ amountInvalid: true });
			return;
		}

		const { expense } = this.state;
		expense.receipts = this.state.uploadedReceipts;

		if (expense.payKind === 'open') {
			delete expense.payDate;
		}
		if (expense.payee === null) {
			expense.payee = '';
		}
		const expenseUrl = expense.id ? `${config.expense.resourceUrl}/${expense.id}` : `${config.expense.resourceUrl}`;

		invoiz
			.request(expenseUrl, {
				auth: true,
				method: expense.id ? 'PUT' : 'POST',
				data: expense
			})
			.then(() => {
				if (!this.filesToDelete || this.filesToDelete.length === 0) {
					if (createNew) {
						invoiz.router.navigate('/expense/new', true, true);
					} else {
						invoiz.router.navigate('/expenses');
					}
				}
				const requests = this.filesToDelete.map(id => {
					return invoiz.request(`${config.expense.endpoints.receiptUrl}/${id}`, {
						auth: true,
						method: 'DELETE'
					});
				});
				Promise.all(requests)
					.then(() => {
						if (createNew) {
							invoiz.router.navigate('/expense/new', true, true);
						} else {
							invoiz.router.navigate('/expenses');
						}
					})
					.catch(() => {
						invoiz.showNotification({ type: 'error', message: resources.str_saveErrorMessage });
					});
			})
			.catch(() => {
				invoiz.showNotification({ type: 'error', message: resources.str_saveErrorMessage });
			});
	}

	onCancel() {
		if (this.state.uploadedReceipts.length > 0) {
			const requests = this.state.uploadedReceipts.map(receipt => {
				invoiz.request(`${config.expense.endpoints.receiptUrl}/${receipt.id}`, {
					auth: true,
					method: 'DELETE'
				});
			});
			Promise.all(requests).then(() => {
				this.setState({ uploadedReceipts: [] });
			});
		}
		invoiz.router.navigate('/expenses');
	}

	addFile(files) {
		if (!files) {
			return;
		}

		_.each(files, file => {
			this.manualUploader.addFiles([file]);
		});
	}

	addSelectedFile(event) {
		const file = event.target.files[0];
		this.addFile([file]);
		event.target.value = '';
	}

	initDragAndDropUploader() {
		Uploader.DragAndDrop({
			dropZoneElements: [document.getElementById('expense-receipt-dropbox')],
			callbacks: {
				processingDroppedFilesComplete: files => {
					this.addFile(files);
				}
			}
		});
	}

	initManualUploader() {
		const { resources } = this.props;
		this.manualUploader = new Uploader.FineUploaderBasic(
			_.assign({}, config.expense.fineUploader, {
				autoUpload: true,
				multiple: true,
				messages: {
					minSizeError: resources.expenseFileMinSizeError,
					sizeError: resources.expenseFileMaxSizeError,
					typeError: resources.expenseFileTypeError
				},
				request: {
					customHeaders: { authorization: `Bearer ${invoiz.user.token}` },
					endpoint: config.expense.endpoints.receiptUrl,
					inputName: 'receipt',
					filenameParam: 'filename'
				},
				callbacks: {
					onComplete: (id, fileName, response) => {
						if (!response.success) {
							return;
						}
						const { name } = this.manualUploader.getFile(id);
						const obj = { id: response.data.id, name };
						const { uploadedReceipts } = this.state;
						uploadedReceipts.push(obj);
						this.setState({ uploadedReceipts });

						if (!this.state.isModal) {
							invoiz.page.showToast({ message: resources.str_fileUploadSuccessMessage });
						}
					},
					onError: (id, name, errorReason, xhr) => {
						if (xhr) {
							const { meta: error } = JSON.parse(xhr.response);
							return handleImageError(this, error);
						}

						invoiz.page.showToast({
							type: 'error',
							message: format(errorReason, name) || resources.expenseEditImageUploadError
						});
					}
				}
			})
		);
	}
}

export default ExpenseEditComponent;
