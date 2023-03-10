import React from 'react';
import HtmlInputComponent from 'shared/inputs/html-input/html-input.component';
import LetterFooterSignatureComponent from './letter-footer-signature.component';

const KEY_CODE_ESCAPE = 27;

class LetterFooterComponent extends React.Component {
	constructor(props) {
		super(props);
		const { columns } = props;
		this.state = {
			letter: columns
		};
		this.reset = false;
		this.onChangeTimer = null;
		this.forcingBlur = false;
	}

	render() {
		const { columns, resources } = this.props;

		const elements = [];
		columns.map((column, index) => {
			if (index < 2) {
				const {
					sortId,
					metaData: { html }
				} = column;
				elements[sortId - 1] = (
					<div className="letter-footer-column" key={`letter-footer-column-${index}`}>
						<HtmlInputComponent
							ref={`letter-footer-column-${index}`}
							displayBlueLine={false}
							placeholder={`${resources.str_column} ${sortId}`}
							value={html}
							onFocus={() => this.onFocus(column)}
							onBlur={({ quill, value }) => this.onBlur(value, column)}
							onKeyUp={({ event, quill }) => this.onKeyUp(event, quill)}
							formats={['bold', 'italic', 'underline']}
						/>
					</div>
				);
			}
		});
		const signatureElement = columns.slice(2);
		return 	<div className="letter-footer-component-wrapper">			
			<div className="letter-footer-first-two-section col-xs-8">		
				<div className="letter-footer-component-wrapper outlined">
				<span className="edit-icon"/>
					{elements}
				</div>
			</div>
			<div className="footerSignatureText" dangerouslySetInnerHTML={{ __html: signatureElement[0].metaData.html }}></div>
			<div className="footerSignatureWrapper col-xs-4">
				<LetterFooterSignatureComponent
					resources={resources}
					items={signatureElement}
					onFinish={elements => this.onLetterFooterSignatureEdited(elements)}/>
			</div>
		</div>;
	}

	onLetterFooterSignatureEdited(elements) {
		const { columns } = this.props;
		const newArray = columns.slice(0, 2);
		const footerElements = newArray.concat(elements);
		this.props.onChange && this.props.onChange(footerElements);
		this.props.onSave && this.props.onSave(footerElements);
	}

	forceBlur() {
		this.forcingBlur = true;
		this.props.columns.forEach((column, index) => {
			if (index < 2) {
				this.refs[`letter-footer-column-${index}`].blur();
			}
		});
	}

	onFocus(column) {
		column.focused = true;
		clearTimeout(this.onChangeTimer);
	}

	onBlur(value, column) {
		value = value.trim();
		delete column.focused;

		if (this.forcingBlur || (!this.reset && column.metaData.html !== value)) {
			column.metaData.html = value;
			this.props.onChange && this.props.onChange(this.props.columns);

			if (this.forcingBlur) {
				this.onChange();
			} else {
				this.onChangeTimer = setTimeout(() => {
					this.onChange();
				}, 1000);
			}
		}

		this.reset = false;
	}

	onChange() {
		const { columns } = this.props;
		const focusedColumns = columns.filter(col => col.focused);

		if (focusedColumns.length === 0) {
			this.forcingBlur = false;
			this.props.onSave && this.props.onSave(columns);
		}
	}

	onKeyUp(event, quill) {
		if (event.keyCode === KEY_CODE_ESCAPE) {
			this.reset = true;
			this.props.onReset && this.props.onReset();
			quill.blur();
		}
	}
}

export default LetterFooterComponent;
