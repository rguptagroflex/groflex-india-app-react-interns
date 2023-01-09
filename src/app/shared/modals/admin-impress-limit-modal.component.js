import React from 'react';
import ButtonComponent from 'shared/button/button.component';
import ModalService from 'services/modal.service';
import NumberInputComponent from 'shared/inputs/number-input/number-input.component';

class AdminImpressLimitModal extends React.Component {
	constructor(props) {
		super(props);

		const {
			user: { impressOfferLimit }
		} = this.props;

		this.state = {
			limit: impressOfferLimit >= 0 ? impressOfferLimit : 0
		};
	}

	render() {
		const { user } = this.props;
		const { limit } = this.state;
		const { resources } = this.props;

		return (
			<div className="admin-impress-limit-modal">
				<div className="admin-impress-limit-entry">
					<span className="admin-impress-limit-label">{resources.str_tenantId}:</span>
					<span className="admin-impress-limit-value">{user.tenantId}</span>
				</div>

				<div className="admin-impress-limit-entry">
					<span className="admin-impress-limit-label">{resources.str_email}:</span>
					<span className="admin-impress-limit-value">{user.email}</span>
				</div>

				<div className="admin-impress-limit-date inline">
					<span className="admin-impress-limit-label">{resources.str_limit}:</span>
					<NumberInputComponent
						name="limit"
						precision={0}
						min={0}
						isDecimal={true}
						selectOnFocus={true}
						value={limit}
						onChange={value => this.onChange(value)}
					/>
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
							label={resources.str_establish}
							dataQsId="modal-btn-confirm"
						/>
					</div>
				</div>
			</div>
		);
	}

	onConfirm() {
		const { onConfirm } = this.props;
		const { limit } = this.state;
		onConfirm && onConfirm(limit);
		ModalService.close();
	}

	onChange(value) {
		this.setState({ limit: value });
	}
}

export default AdminImpressLimitModal;
