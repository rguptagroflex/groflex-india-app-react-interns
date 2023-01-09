import React from 'react';
import invoiz from 'services/invoiz.service';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import ButtonComponent from 'shared/button/button.component';
import ImportService from 'services/import.service';
import TopbarComponent from 'shared/topbar/topbar.component';
import articlePdf from 'assets/Article_Import_Template.xlsx';
import customerPdf from 'assets/Contact_Import_Template.xlsx';
import { connect } from 'react-redux';
import { format } from 'util';
import downloadExcelIcon from 'assets/images/svg/download-excel.svg';
import uploadExcelIcon from 'assets/images/svg/upload-excel-grey.svg';
import SVGInline from 'react-svg-inline';
// import Uploader from 'fine-uploader';
import * as XLSX from 'xlsx';
import NotificationService from 'services/notification.service';
const VIEW_STATE = {
	EDIT: '1',
	TABLE: '2',
	SUMMARY: '3',
	FINISH: '4'
};

class DataImportComponent extends React.Component {
	constructor(props) {
		super(props);
		const { resources } = this.props;
		this.state = {
			viewState: this.props.viewState || VIEW_STATE.EDIT,
			enteredValues: '',
			parsedValues: null,
			tableColumns: [],
			validatingTable: false,
			invalidFields: [],
			allFields: [],
			backendErrors: []
		};
		this.optionNoImport = { labelText: resources.str_doNotImport, label: <i>{resources.str_doNotImport}</i>, key: null };
		this.importError = '';
		this.importType = this.props.importType || 'articles';
		this.typeLabel = this.props.importType && this.props.importType === 'customers' ? resources.str_contacts : resources.str_articles;
		this.defaultTableColumns = ImportService.getDefaultColumns(this.importType);
		this.tableColumnSelectOptions = {
			clearable: false,
			backspaceRemoves: false,
			labelKey: 'label',
			valueKey: 'key',
			matchProp: 'label',
			getCustomLabelToHighlight: option => {
				return `${option.labelText || option.label}`;
			},
			handleChange: (option, optionBefore, inputId) => this.onColumnChange(option, optionBefore, inputId)
		};
	}

	render() {
		const { resources } = this.props;
		let contentArea;
		let continueButtonLabel;
		let cancelButtonLabel;
		let headline;
		let wrapperClass;
		let buttonDisabled;
		let buttonHide = false;

		switch (this.state.viewState) {
			case VIEW_STATE.EDIT:
				buttonHide = true;
				buttonDisabled = !this.state.enteredValues || this.state.enteredValues.length === 0;
				contentArea = this.createTextAreaMarkup();
				// headline = format(resources.str_importYour, this.importType === 'articles' ? resources.str_article : resources.str_customersAndPayees);
				headline = resources.str_downloadExcelTemplate;
				continueButtonLabel = resources.str_continue;
				break;

			case VIEW_STATE.TABLE:
				contentArea = this.createTableMarkup();
				wrapperClass = 'data-import-component-table-view';
				headline = resources.str_checkYourData;
				cancelButtonLabel = resources.str_back;
				continueButtonLabel = this.state.validatingTable ? resources.str_check : resources.str_import;
				break;

			case VIEW_STATE.SUMMARY:
				const errorCount = this.getErrorCount();
				const dataCount = Math.max(this.state.allFields.length - errorCount, 0);
				const adjustedTypeLabelValid =
					dataCount !== 1 ? this.typeLabel : this.importType === 'customers' ? resources.str_customer : resources.str_article;

				contentArea = this.createSummaryMarkup();
				headline = resources.somethingIsNotRightHere;
				continueButtonLabel = format(resources.str_onlyImport, dataCount, adjustedTypeLabelValid);
				buttonDisabled = dataCount === 0;
				cancelButtonLabel = resources.str_correctMistakes;
				break;

			case VIEW_STATE.FINISH:
				contentArea = this.createFinishedMarkup();
				continueButtonLabel = format(resources.str_toTheList, this.typeLabel);
				break;
		}

		return (
			<div className={`data-import-component ${wrapperClass}`}>
				<TopbarComponent
					title={`${resources.str_importTitle} ${this.typeLabel.toLowerCase()}`}
					hasCancelButton={true}
					cancelButtonCallback={() => {
						invoiz.router.navigate('/settings/data-import', true, true);
					}}
				/>
				<div className={`data-import-content`}>
					<h3 className="headline">{headline}</h3>

					<div className="content">{contentArea}</div>

					<div className="buttons buttons-import">
						{cancelButtonLabel ? (
							<ButtonComponent callback={() => this.onCancelButtonClick()} label={cancelButtonLabel} />
						) : null}
						{!buttonHide && (<ButtonComponent
							callback={() => this.onContinueButtonClick()}
							label={continueButtonLabel}
							disabled={buttonDisabled}
						/>)}
					</div>
				</div>
			</div>
		);
	}

	onCancelButtonClick() {
		this.setState({
			viewState: VIEW_STATE.EDIT,
			parsedValues: null,
			tableColumns: [],
			invalidFields: [],
			validatingTable: false,
			backendErrors: []
		});
	}

	onContinueButtonClick() {
		if (this.state.validatingTable) {
			return;
		}

		switch (this.state.viewState) {
			case VIEW_STATE.EDIT:
				this.completeEditMode();
				break;

			case VIEW_STATE.TABLE:
				this.importData();
				break;

			case VIEW_STATE.SUMMARY:
				this.importWithErrors();
				break;

			case VIEW_STATE.FINISH:
				invoiz.router.navigate(`/${this.importType}`);
				break;
		}
	}

	importRequest(data) {
		ImportService.import(data, this.importType)
			.then(response => {
				this.setState({
					allFields: data,
					backendErrors: [],
					validatingTable: false,
					viewState: VIEW_STATE.FINISH
				});
			})
			.catch(response => {
				const { meta } = response.body;
				const errors = [];

				if (meta) {
					for (const key in meta) {
						if (meta.hasOwnProperty(key) && key.indexOf('body') >= 0) {
							let index = key.split('[');
							index = index[1].split(']');
							index = parseInt(index[0]);

							const propertyKey = key.split('.')[2];
							const reason = meta[key][0].keyword;

							errors.push({ index, key: propertyKey, reason });
						}
					}
				}

				this.setState({
					allFields: data,
					backendErrors: ImportService.mapErrors(errors, this.importType),
					validatingTable: false,
					viewState: VIEW_STATE.SUMMARY
				});
			});
	}

	importData() {
		this.setState({ validatingTable: true }, () => {
			const rows = this.state.parsedValues && this.state.parsedValues.rows;
			const data = ImportService.createObjects(rows, this.state.tableColumns);
			const invalidFields = ImportService.validate(data, this.importType);
			if (!invalidFields || !invalidFields.length) {
				this.importRequest(data);
			} else {
				this.setState({
					allFields: data,
					invalidFields,
					validatingTable: false,
					backendErrors: []
				});
			}
		});
	}

	importWithErrors() {
		const errorIndexes = [];
		this.state.backendErrors.forEach(error => {
			const { index } = error;
			errorIndexes.push(index);
		});

		const validFields = [];
		this.state.allFields.forEach((field, idx) => {
			if (errorIndexes.indexOf(idx) === -1) {
				validFields.push(field);
			}
		});

		this.importRequest(validFields);
	}

	completeEditMode(input) {
		// const input = $('#data-import-textarea').val();
		const parsedInput = ImportService.parseInput(input);

		const values = {
			columnCount: parsedInput.columnCount,
			rowCount: parsedInput.rows.length,
			rows: parsedInput.rows
		};

		const tableColumns = [...this.defaultTableColumns];
		const additionalCount = values.columnCount - tableColumns.length;
		for (let i = 0; i < additionalCount; i++) {
			tableColumns.push(null);
		}

		this.setState({
			enteredValues: input,
			parsedValues: values,
			viewState: VIEW_STATE.TABLE,
			tableColumns
		});
	}

	onColumnChange(option, optionBefore, inputId) {
		const tableColumns = [...this.state.tableColumns];
		let indexBefore = null;

		if (option.key) {
			tableColumns.forEach((column, index) => {
				if (option && column && column.key === option.key) {
					indexBefore = index;
				}
			});
		}

		tableColumns[inputId] = option;

		if (indexBefore >= 0) {
			tableColumns[indexBefore] = this.optionNoImport;
		}

		this.setState({ tableColumns });
	}

	onDownloadClick() {
		switch (this.importType) {
			case 'articles':
				window.open(articlePdf, '_self');
				break;

			case 'customers':
				window.open(customerPdf, '_self');
				break;
		}
	}

	createFinishedMarkup() {
		const dataCount = this.state.allFields.length;
		const { resources } = this.props;
		return (
			<div className="data-import-finished">
				<div className="icon-background">
					<img src="/assets/images/svg/party-blue.svg" />
				</div>

				<h3 className="headline">
					{dataCount} {this.importType === 'articles' ? resources.str_article : dataCount > 1 ? resources.str_customers : resources.str_customer}{' '}
					{resources.dataImportSuccessMessage}
				</h3>
			</div>
		);
	}

	createSummaryMarkup() {
		const { resources } = this.props;
		const errorCount = this.getErrorCount();
		const dataCount = Math.max(this.state.allFields.length - errorCount, 0);

		const errors = [];
		this.state.backendErrors.forEach((error, index) => {
			errors.push(
				<div className="error-row" key={`error-row-${index}`}>
					<span className="icon icon-fehler" /> {error.description}
				</div>
			);
		});

		const adjustedTypeLabelError =
			errorCount !== 1 ? this.typeLabel : this.importType === 'customers' ? resources.str_customer : resources.str_article;
		const adjustedTypeLabelValid =
			dataCount !== 1 ? this.typeLabel : this.importType === 'customers' ? resources.str_customer : resources.str_article;

		const subHeadline = (
			<span>
				<b style={{ color: 'red' }}>
					{errorCount} {adjustedTypeLabelError} {resources.str_faulty}
				</b>{' '}
				|{' '}
				<b>
					{dataCount} {adjustedTypeLabelValid} {resources.str_correctly}
				</b>
			</span>
		);

		return (
			<div>
				<p>
					{subHeadline}
					<br />
					{format(resources.dataImportTextDescription, dataCount, this.typeLabel, this.typeLabel)}
					<br />
					{resources.dataImportCorrectErrorsTextDescription}
				</p>

				<div className="data-import-error-summary">
					<b>{resources.str_foundProblems}</b>
					<div>{errors}</div>
				</div>
			</div>
		);
	}

	createTableMarkup() {
		const { resources } = this.props;
		const columns = [];
		const rows = [];
		let foundErrors = false;
		let hasError;
		let ErrorMessage = '';
		let { tableColumns } = this.state;
		tableColumns = tableColumns.filter(Boolean);
		// const loadedOptions = [this.optionNoImport].concat(this.defaultTableColumns);

		tableColumns.forEach((column, index) => {
			const col = (
				<th key={`import-table-column-head-${index}`}>
					{/* <SelectInputComponent
						inputId={index}
						allowCreate={false}
						notAsync={true}
						options={this.tableColumnSelectOptions}
						value={column}
						loadedOptions={loadedOptions}
					/> */}
					<span className='data-import-overview'><label>{column.label}</label>
						{column && column.required ? <span className="required-indicator">*</span> : null}
					</span>
				</th>
			);

			columns.push(col);
		});

		this.state.parsedValues.rows.forEach((row, rowIndex) => {
			const cells = [];

			hasError = this.state.invalidFields.find(invalidField => {
				return invalidField.index === rowIndex;
			});

			if (hasError) {
				foundErrors = true;
				this.importError = hasError;
			}

			for (let columnIndex = 0; columnIndex < this.state.tableColumns.length; columnIndex++) {
				cells.push(<td key={`table-cell-${rowIndex}-${columnIndex}`}>{row[columnIndex] || ''}</td>);
			}

			rows.push(
				<tr key={`table-row-${rowIndex}`} className={hasError ? 'error' : ''}>
					{cells}
				</tr>
			);
		});

		if (foundErrors) {
			const { resources } = this.props;
			const { required, allowed, label, key } = this.importError && this.importError.invalidColumns[0];

			if (this.importType === 'customers') {
				if (required && allowed) {
					ErrorMessage = format(resources.invalidOfCustomer, label);
				} else if (required) {
					ErrorMessage = format(resources.ofCustomerIsRequired, label);
				} else if (key === 'discount') {
					ErrorMessage = resources.transactionDiscountPercentErrorMessage;
				} else {
					ErrorMessage = resources.dataImportTableError;
				}
			} else if (this.importType === 'articles') {
				if (required && label === 'Article') {
					ErrorMessage = resources.articleNameIsRequired;
				} else if (allowed) {
					ErrorMessage = format(resources.invalidOfArticle, label);
				} else if (required) {
					ErrorMessage = format(resources.ofArticleIsRequired, label);
				} else {
					ErrorMessage = resources.dataImportTableError;
				}
			} else {
				ErrorMessage = resources.dataImportTableError;
			}
		}

		return (
			<div className="data-import-table-view">
				<p>{resources.dataImportMessage}</p>

				<div className="data-import-table-wrapper">
					<table>
						<thead>
							<tr>{columns}</tr>
						</thead>
						<tbody>{rows}</tbody>
					</table>
				</div>

				{foundErrors ? (
					<div className="data-import-table-error">
						{/* {resources.dataImportTableError} */}
						{ErrorMessage}
					</div>
				) : null}
			</div>
		);
	}

	createTextAreaMarkup() {
		const { resources } = this.props;
		let importDocumentDragAndDropText;
		let importDocumentImportText;
		let importDataUseTemplateMessage;

		if (this.importType === 'articles') {
			importDocumentDragAndDropText = format(resources.str_importDocumentDragAndDropText, resources.str_articles.toLowerCase());
			importDocumentImportText = format(resources.str_importDocumentImportText, resources.str_articles.toLowerCase());
			importDataUseTemplateMessage = format(resources.dataImportUseTemplateMessage, resources.str_article.toLowerCase());
		} else {
			importDocumentDragAndDropText = format(resources.str_importDocumentDragAndDropText, resources.str_contacts.toLowerCase());
			importDocumentImportText = format(resources.str_importDocumentImportText, resources.str_contacts.toLowerCase());
			importDataUseTemplateMessage = format(resources.dataImportUseTemplateMessage, resources.str_contact.toLowerCase());
		}
		return (
			<div>
				<p>
					{importDataUseTemplateMessage}
				</p>
				<div>
					<SVGInline width="80px" height="80px" svg={downloadExcelIcon} />
				</div>
				<div className="data-import-download">
					<ButtonComponent label={resources.str_download} callback={ () => this.onDownloadClick()} />
				</div>
				<div className="row">
					<div className="col-xs-3"></div>
					<div className="col-xs-6">
						<div className="data-import-upload">
						 <h3 className="headline">{ resources.str_uploadFilledExcel }</h3>
						 </div>
						<div
							onDragOver={this.onDragOver.bind(this)}
							onDrop={this.addSelectedFile.bind(this)}
							id="data-import-dropbox"
							className="data-import-drop-box text-center"
							data-qs-id="data-import-upload"
						>
							<label className="text-muted">
								<p className="upload-image">
									<SVGInline width="80px" height="80px" svg={uploadExcelIcon} />
								</p>
								<p dangerouslySetInnerHTML={{ __html: importDocumentDragAndDropText }}></p>
								<p dangerouslySetInnerHTML={{ __html: importDocumentImportText }}></p>
								<input
									id="data-import-fileUpload"
									className="u_hidden"
									type="file"
									onChange={this.addSelectedFile.bind(this)}
								/>
							</label>
						</div>
					</div>
					<div className="col-xs-3"></div>
				</div>
			</div>
		);
	}

	onDragOver(event) {
	    event.preventDefault();
	}
	addSelectedFile(event) {
		event.preventDefault();
		const { resources } = this.props;
		const fileLength = (event.dataTransfer && event.dataTransfer.files.length) || (event.target && event.target.files.length);
		if (fileLength > 1) return NotificationService.show({ message: resources.str_importMultipalFileError, type: 'error' });

		const file = (event.dataTransfer && event.dataTransfer.files[0]) || (event.target && event.target.files[0]);
		const regex = /^([a-zA-Z0-9\s_\\.\-\(\):])+(.csv|.xlsx|.xls)$/;

		if (regex.test(file.name.toLowerCase())) {
			const reader = new FileReader();
			reader.readAsArrayBuffer(file);
			let fromRow;
			reader.onload = (event) => {
				const arrayString = new Uint8Array(event.target.result);
				const workBook = XLSX.read(arrayString, { type: 'array' });
				const workSheetName = workBook.SheetNames[0];
				const workSheet = workBook.Sheets[workSheetName];
				const data = XLSX.utils.sheet_to_json(workSheet, { header: 1 });

				// check contact and Article demo data
				if (this.importType === 'customers') {
					fromRow = data[4][2] && data[4][2].toString().trim() === resources.str_buhlDataServicPvtLtd ? 5 : 4;
				} else {
					fromRow = data[4][1] && data[4][1].toString().trim() === resources.str_articleDemoName ? 5 : 4;
				}

				const dataAfetrRemoveHeader = data.splice(fromRow, data.length - 1);
				if (dataAfetrRemoveHeader.length <= 0) return NotificationService.show({ message: resources.str_noDataToImport, type: 'error' });
				setTimeout(() => this.completeEditMode(dataAfetrRemoveHeader));
				this.setState({ enteredValues: dataAfetrRemoveHeader });
			};
		} else {
			NotificationService.show({
				message: resources.str_uploadFiletypeError,
				type: 'error'
			});
		}
	}

	getErrorCount() {
		const errorIndexes = [];
		this.state.backendErrors.forEach(error => {
			errorIndexes.push(error.index);
		});
		const uniqueIndexes = errorIndexes.filter((v, i, a) => a.indexOf(v) === i);
		return uniqueIndexes.length;
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return {
		resources
	};
};

export default connect(mapStateToProps)(DataImportComponent);
