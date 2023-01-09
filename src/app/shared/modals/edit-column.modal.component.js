import invoiz from 'services/invoiz.service';
import React from 'react';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import config from 'config';

class EditColumnModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			columns: props.columns,
			wasColumnChanged: false,
			isSubmitting: false
		};
	}

	onColumnBlur() {
		this.setState({ wasColumnChanged: true });
	}

	onColumnValueChange(val, column) {
		const { columns } = this.state;
		if (val !== column.label) {
			column.label = val;
			this.setState({columns});
		}
	}

	onSubmitClicked() {
		const { columns } = this.state;
		const { onColumnsClose } = this.props;
		onColumnsClose && onColumnsClose(this.state.columns);
		invoiz.page.showToast({ message: 'Successfully modified columns!' });
		ModalService.close(true);
	}

	onCloseClicked() {
		this.forceUpdate();
		ModalService.close(true)    
	}

	onColumnVisibility(col) {
		const { columns } = this.state;
		const { onColumnsClose, customerData } = this.props;
		 if (col.foreign === true) {
			invoiz.page.showToast({ message: 'Cannot deselect GST because a foreign customer is selected!' , type: `error` });
		} else if (col.required === false) {
			col.active = !col.active;
			this.setState({columns});
		}
	}

	render() {
		const { columns, isSubmitting } = this.state;
		// const { resources } = this.props;

		const cols = columns.filter(col => col.name !== 'number');
		return (
			<div className="edit-column-modal">
				{
					cols.map(column =>
						<div key={column.name} className={!column.editable ? 'column-row' : 'column-row disabled'}>
							<TextInputExtendedComponent
								customWrapperClass={'col-xs-11'}
								key={column.name}
								name={column.name}
								value={column.label}
								disabled={!column.editable}
								autoComplete="off"
								onBlur={() => this.onColumnBlur()}
								onChange={(val) => this.onColumnValueChange(val, column)}
							/>
							<span key={column.required} onClick= {() => this.onColumnVisibility(column)} className={column.active ? (column.required ? 'icon-visible required' : 'icon-visible') : 'icon-invisible'} />
						</div>
					)

				}
				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							type="cancel"
							callback={() => this.onCloseClicked()}
							label={'Close'}
							dataQsId="modal-btn-cancel"
						/>
					</div>
					<div className="modal-base-confirm">
						<ButtonComponent
							buttonIcon={'icon-check'}
							type={'primary'}
							disabled={this.state.isSubmitting}
							callback={() => this.onSubmitClicked()}
							label={'Save'}
							dataQsId="modal-btn-confirm"
						/>
					</div>
				</div>
			</div>
		);
	}
}

export default EditColumnModal;
