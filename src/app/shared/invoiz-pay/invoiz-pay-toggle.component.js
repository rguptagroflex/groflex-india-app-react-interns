import React from 'react';
import OvalToggleComponent from 'shared/oval-toggle/oval-toggle.component';
import TooltipComponent from 'shared/tooltip/tooltip.component';
import InvoizPaySetupModalComponent from 'shared/modals/invoiz-pay-setup-modal.component';
import ModalService from 'services/modal.service';

class InvoizPayToggleComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			activated: props.activated || false,
			initiallyActivated: props.activated || false,
			invoizPayData: props.invoizPayData,
			initialInvoizPayData: props.initialInvoizPayData,
			paymentSetting: props.paymentSetting
		};
	}

	componentWillReceiveProps(props) {
		this.setState({
			activated: props.activated || false,
			initiallyActivated: props.activated || false,
			invoizPayData: props.invoizPayData,
			initialInvoizPayData: props.initialInvoizPayData,
			paymentSetting: props.paymentSetting
		});
	}

	onInvoizPaySetupModalCancel() {
		const { initiallyActivated } = this.state;

		if (!initiallyActivated) {
			this.setState({ activated: false });
			this.props.onToggled && this.props.onToggled(null, null, true);
		}
	}

	onInvoizPaySetupModalFinish(invoizPayData, paymentSetting) {
		if (!invoizPayData && !paymentSetting) {
			this.setState({ activated: false });
			this.props.onToggled && this.props.onToggled(null, null);
			return;
		}

		const isTransferDataValid =
			paymentSetting.financeApiAccountId ||
			(invoizPayData.bankAccountBic &&
				invoizPayData.bankAccountBic.trim().length > 0 &&
				invoizPayData.bankAccountHolder &&
				invoizPayData.bankAccountHolder.trim().length > 0 &&
				invoizPayData.bankAccountIban &&
				invoizPayData.bankAccountIban.trim().length > 0);
		const isPaypalAndTransferDisabled = !paymentSetting.useTransfer && !paymentSetting.usePayPal;
		const isPaypalDisabled = paymentSetting.usePayPal && invoizPayData.paypalUserName.trim().length === 0;
		const isTransferDisabled = paymentSetting.useTransfer && !isTransferDataValid;

		if (isPaypalAndTransferDisabled || (isPaypalDisabled && isTransferDisabled)) {
			this.setState({ activated: false });
			this.props.onToggled && this.props.onToggled(null, null);
		} else {
			this.props.onToggled && this.props.onToggled(invoizPayData, paymentSetting);
		}
	}

	openInvoizPaySetupModal() {
		const { resources } = this.props;
		const { initialInvoizPayData, paymentSetting } = this.state;
		let invoizPayData = this.state.invoizPayData && JSON.parse(JSON.stringify(this.state.invoizPayData));

		if (!invoizPayData && initialInvoizPayData) {
			invoizPayData = initialInvoizPayData;
		}

		ModalService.open(
			<InvoizPaySetupModalComponent
				onCancel={() => this.onInvoizPaySetupModalCancel()}
				onFinish={(invoizPayData, paymentSetting) =>
					this.onInvoizPaySetupModalFinish(invoizPayData, paymentSetting)
				}
				invoizPayData={invoizPayData}
				paymentSetting={paymentSetting}
				onBankAccountSetupModalFinished={() => {
					setTimeout(() => {
						this.openInvoizPaySetupModal();
					}, 500);
				}}
				resources={resources}
			/>,
			{
				width: 700,
				isCloseable: false,
				modalClass: 'invoice-pay-setup-modal'
			}
		);
	}

	render() {
		const { activated, initiallyActivated } = this.state;
		const { resources } = this.props;

		return (
			<div className="invoice-pay-toggle-component">
				<div className="invoice-pay-toggle-content">
					<div className="text-content">
						<span className="title">
							<span className="colored">{resources.str_invoizPAY}</span> {activated ? resources.str_activated : resources.str_activate}
						</span>
						<span className="icon icon-info" id="invoice-pay-toggle-info-anchor" />
						<TooltipComponent
							elementId="invoice-pay-toggle-info-anchor"
							attachment="bottom left"
							targetAttachment="top left"
							offset={'0 7px'}
						>
							{resources.invoicePayToggleInfo}
							<br />
							{resources.invoicePayBankInfo}
							<br />
							{resources.invoicePayOptionInfo}
						</TooltipComponent>
					</div>
					<OvalToggleComponent
						labelLeft
						onChange={() =>
							this.setState({ activated: !activated }, () => {
								if (this.state.activated && !initiallyActivated) {
									this.openInvoizPaySetupModal();
								} else if (!this.state.activated) {
									this.props.onToggled && this.props.onToggled(null, null);
								}
							})
						}
						checked={!!activated}
						labelText=""
						newStyle={true}
					/>
				</div>
			</div>
		);
	}
}

export default InvoizPayToggleComponent;
