import React from 'react';
import DateInputComponent from 'shared/inputs/date-input/date-input.component';
import { formatDate, formatApiDate } from 'helpers/formatDate';
import ButtonComponent from 'shared/button/button.component';
import ModalService from 'services/modal.service';

class AdminExpandTrialModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			date: formatDate(new Date())
		};
	}

	render() {
		const { user } = this.props;
		const { date } = this.state;
		const { resources } = this.props;
		return (
			<div className="admin-expand-trial-modal">
				<div className="admin-expand-trial-entry">
					<span className="admin-expand-trial-label">{resources.str_tenantId}:</span>
					<span className="admin-expand-trial-value">{user.tenantId}</span>
				</div>

				<div className="admin-expand-trial-entry">
					<span className="admin-expand-trial-label">{resources.str_email}:</span>
					<span className="admin-expand-trial-value">{user.email}</span>
				</div>

				<div className="admin-expand-trial-date inline">
					<span className="admin-expand-trial-label">{resources.str_extendTo}:</span>
					<DateInputComponent name="date" value={date} onChange={(name, value) => this.onChange(value)} />
				</div>
				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent
							type="cancel"
							callback={() => ModalService.close(true)}
							label={resources.str_abortStop}
							dataQsId="modal-btn-cancel"
						/>
					</div>
					<div className="modal-base-confirm">
						<ButtonComponent
							buttonIcon={`icon-check`}
							type={'primary'}
							callback={() => this.onConfirm()}
							label={resources.str_extent}
							dataQsId="modal-btn-confirm"
						/>
					</div>
				</div>
			</div>
		);
	}

	onConfirm() {
		const { onConfirm } = this.props;
		const { date } = this.state;
		onConfirm && onConfirm(date);
		ModalService.close();
	}

	onChange(value) {
		// const date = formatDate(value, 'DD.MM.YYYY', 'YYYY-MM-DD');
		const date = formatApiDate(value);
		this.setState({ date });
	}
}

export default AdminExpandTrialModal;
