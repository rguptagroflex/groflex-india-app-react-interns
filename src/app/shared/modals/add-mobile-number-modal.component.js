import invoiz from 'services/invoiz.service';
import React from 'react';
import NumberInputComponent from 'shared/inputs/number-input/number-input.component';
import ButtonComponent from 'shared/button/button.component';
// import { redirectToZohoApi } from 'helpers/redirectToZohoApi';
import { redirectToChargebee } from 'helpers/redirectToChargebee';
import config from 'config';

class AddMobileNumberModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			mobile: invoiz.user.mobile,
			errorMessageMobile: ''
		};
	}

	onInputChange(value, name) {
		let { mobile } = this.state;
		if (name === 'mobile') {
			if (!config.mobileNumberValidation.test(value)) {
				const { resources } = this.props;
				this.setState({ errorMessageMobile: resources.validMobileNumberError });
			} else {
				this.setState({ errorMessageMobile: '' });
			}
			mobile = value;
		}

		this.setState({ mobile });
	}

	onMobileNumberBlur(value) {
		const { resources } = this.props;
		if (value.length < 10 || !config.mobileNumberValidation.test(value)) {
			this.setState({ errorMessageMobile: resources.validMobileNumberError });
		} else {
			this.setState({ errorMessageMobile: '' });
		}
	}

	onSubmitClicked() {
		const { zohoPlan, chargebeePlan, resources } = this.props;
		const { mobile } = this.state;
		if (!mobile) {
			return;
		} else {
			const data = {
				mobile
			};
			invoiz
				.request(config.settings.endpoints.account, {
					method: 'POST',
					data,
					auth: true
				})
				.then(({ body: { data: { mobile } } }) => {
					invoiz.user.mobile = mobile;
					invoiz.page.showToast({ message: resources.accountMobileNumberSuccessMessage });
					// redirectToZohoApi(zohoPlan);
					redirectToChargebee(chargebeePlan);
				})
				.catch(response => {
					invoiz.page.showToast({
						message: resources.accountMobileNumberErrorMessage,
						type: 'error'
					});
				});

		}
	}

	render() {
		const { mobile, errorMessageMobile } = this.state;
		const { resources } = this.props;

		return (
			<div>
				<div>{resources.upgradeMobileSubHeading}</div>
				<div className="add-mobile-number-modal">
					<div className="row">
						<NumberInputComponent
							ref="mobile-number-input"
							dataQsId="settings-account-mobile"
							label={resources.str_mobilePhone}
							name={'mobile'}
							maxLength="10"
							value={parseInt(mobile)}
							isDecimal={false}
							errorMessage={errorMessageMobile}
							onChange={(value, name) => this.onInputChange(value, name)}
							onBlur={value => this.onMobileNumberBlur(value)}
							defaultNonZero={true}
						/>
					</div>

					<div className="modal-base-footer">
						<div className="modal-base-confirm">
							<ButtonComponent
								// buttonIcon={'icon-check'}
								type={'primary'}
								disabled={(this.state.mobile && this.state.mobile.toString().length < 10) || !config.mobileNumberValidation.test(this.state.mobile)}
								callback={() => this.onSubmitClicked()}
								label={resources.str_continue}
								dataQsId="modal-btn-confirm"
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default AddMobileNumberModal;
