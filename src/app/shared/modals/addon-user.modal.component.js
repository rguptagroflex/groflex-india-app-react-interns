import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import { handleNotificationErrorMessage } from 'helpers/errorMessageNotification';
//import { isChargebeeSubscriber } from 'helpers/subscriptionHelpers';
import RoleSelectComponent from 'shared/multiuser/role-select.component';
import NumberInputComponent from 'shared/inputs/number-input/number-input.component';
import { redirectToChargebee } from 'helpers/redirectToChargebee';

class AddonUserModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: false,
			seats: 0,
			errors: {
				seatQuantity: ''
			},
			currentStep: 0
		};
	}

	handleSubmitClick () {
		const { seats } = this.state;
		const { planId, tenant } = this.props;
		const seatValues = { seats, pendingSeatInvites: seats };
		const { resources } = this.props;
		this.setState({
			isLoading: true
		}, () => {
			invoiz.request(`${config.resourceHost}user/buyusers`, {
				auth: true,
				method: 'POST',
				data: {
					tenant,
					seatValues,
					planId
				}
			}).then((response) => {
				this.props.onConfirm && this.props.onConfirm(seats, false, false);
				this.setState(
					{
						isLoading: false
					},
					() => {
						ModalService.close();
					}
				);
			}).catch((response) => {
				invoiz.showNotification({ type: 'error', message: 'Payment failed!' });
				ModalService.close();
			});
		});
	}

	onInputChange(value, name) {
		const { resources, userCount, maxUserCount, pendingSeatInvites } = this.props;
		if (value === 0 || value === null || value === undefined) {
			this.setState({ errors: {
				seatQuantity: 'Please enter a value greater than 0.'
			}});
		} else if (value > maxUserCount - (pendingSeatInvites + userCount)) {
			this.setState({ errors: {
				seatQuantity: `You have only ${maxUserCount - (pendingSeatInvites + userCount)} remaining seats to purchase!`
			}});
		} else {
			this.setState({ errors: {
				seatQuantity: ''
			} });
			this.setState({ seats: value });
		}
	}
    
	componentDidMount () {
		this.setState({currentStep: 0});
	}

	setStep() {
		this.setState({currentStep: 1})
	}

	render() {
		const { userCount, maxUserCount, canInviteUser, resources, inviteCAOnly, planId, owner } = this.props;
		const { seats, errors, isLoading, currentStep } = this.state;
		return (
			<div className="has-footer user-invite-modal">
				<div className="user-invite-modal-content">
					{canInviteUser && currentStep === 0 &&
                        (<div>
                        	<div className="user-invite-modal-headline text-semibold">Buy additional users</div>
                        	<div className="user-invite-modal-subheadline">Purchase seats to invite users at a cost of <span className="text-semibold">Rs. 149 exclusive of GST</span> per user monthly.</div>
                        	<div className="user-invite-modal-subheadline text-semibold">NOTE: Please enter the number of seats carefully as purchased users can only be deleted after sending an invitation!</div>
                        	<NumberInputComponent
                        		label="Number of seats"
                        		maxLength="2"
                        		value={parseInt(seats)}
                        		name="seats"
                        		isDecimal={false}
                        		errorMessage={errors.seatQuantity}
                        		onChange={(value, name) => this.onInputChange(value, name)}
                        		defaultNonZero={true}
                        		//disabled={!canChangeAccountData}
                        	/>
                        	<div className="modal-base-footer">
                        		<div className="modal-base-cancel">
                        			<ButtonComponent
                        				type="cancel"
                        				callback={() => ModalService.close()}
                        				label={resources.str_cancel}
                        				dataQsId="modal-user-invite-btn-close"
                        				loading={isLoading}
                        			/>
                        		</div>
                        		<div className="modal-base-confirm">
                        			<ButtonComponent
                        				type="primary"
                        				callback={() => this.setStep()}
                        				label={'Proceed'}
                        				dataQsId="modal-user-invite-btn-update-or-send"
                        				loading={isLoading}
                        				disabled={seats === 0 || seats === '' || errors.seatQuantity !== ''}
                        			/>
                        		</div>
                        	</div>
                        </div>)
					}
					{canInviteUser && currentStep === 1 && (
						<div>
							<div className="user-invite-modal-headline text-semibold">Confirm number of seats</div>
                    <div className="user-invite-modal-subheadline">Are you sure you would like to purchase <span className="text-semibold">{seats}</span> seat(s)? An invoice of <span className="text-semibold">{`Rs. ${149 * seats} exclusive of GST`}</span> would be generated immediately using your active payment method on file.</div>
							<div className="modal-base-footer">
								<div className="modal-base-cancel">
									<ButtonComponent
										type="cancel"
										callback={() => ModalService.close()}
										label={resources.str_cancel}
										dataQsId="modal-user-invite-btn-close"
										loading={isLoading}
									/>
								</div>
								<div className="modal-base-confirm">
									<ButtonComponent
										type="danger"
										callback={() => this.handleSubmitClick()}
										label={`Buy ${seats} seat(s)`}
										dataQsId="modal-user-invite-btn-purchase"
										loading={isLoading}
										//disabled={seats === 0 || seats === '' || errors.seatQuantity !== ''}
									/>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}
}

export default AddonUserModalComponent;
