import React from "react";
import invoiz from "services/invoiz.service";
import config from "config";
import { format } from "util";
import ModalService from "services/modal.service";
import ButtonComponent from "shared/button/button.component";

class CreateDunningModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isDunning: false,
		};
	}

	render() {
		const { isDunning } = this.state;
		const { nextDunningLevel, resources } = this.props;

		let dunningType = "";
		switch (nextDunningLevel.dunningLevel) {
			case "paymentReminder":
				dunningType = resources.str_paymentReminder;
				break;
			case "firstReminder":
				dunningType = resources.str_theFirstReminder;
				break;
			case "secondReminder":
				dunningType = resources.str_theSecondReminder;
				break;
			case "lastReminder":
				dunningType = resources.str_theLastReminder;
				break;
		}

		return (
			<div>
				<div className="modal-base-close" onClick={() => ModalService.close()} />
				{format(resources.invoicePaymentReminderMessage, dunningType)}
				<div className="modal-base-footer">
					<div className="modal-base-confirm create-dunning-modal-send">
						<ButtonComponent
							buttonIcon="icon-mail"
							dataQsId="dunInvoice-btn-sendmail"
							loading={isDunning}
							callback={() => this.createDunning(true)}
							label={resources.str_sendViaEmail}
						/>
					</div>
					<div className="modal-base-confirm create-dunning-modal-show">
						<ButtonComponent
							buttonIcon="icon-pdf"
							dataQsId="dunInvoice-btn-showdetail"
							loading={isDunning}
							callback={() => this.createDunning(false)}
							label={resources.str_showPdf}
						/>
					</div>
					<div className="modal-base-cancel">
						<ButtonComponent
							dataQsId="dunInvoice-btn-cancel"
							callback={() => ModalService.close()}
							type="cancel"
							label={resources.str_abortStop}
						/>
					</div>
				</div>
			</div>
		);
	}

	createDunning(sendMail) {
		const { isDunning } = this.state;
		const { invoice, nextDunningLevel, resources } = this.props;

		if (isDunning) {
			return;
		}

		this.setState({ isDunning: true }, () => {
			invoiz
				.request(`${config.resourceHost}dunning/${invoice.id}`, {
					method: "POST",
					auth: true,
					data: { dunningLevel: nextDunningLevel.dunningLevel },
				})
				.then((response) => {
					const {
						body: {
							data: { id },
						},
					} = response;
					let route = "";

					if (sendMail) {
						invoiz.page.showToast({
							message: resources.dunningCreateSuccessMessage,
						});
						route = `/dunning/send/${invoice.id}/${id}`;
					} else {
						invoiz.page.showToast({ message: resources.dunningCreateSuccessMessage });
						route = `/dunning/${invoice.id}/${id}`;
					}

					ModalService.close();
					invoiz.router.navigate(route);
				})
				.catch(() => {
					invoiz.page.showToast({ type: "error", message: resources.dunningCreateErrorMessage });
					ModalService.close();
				});
		});
	}
}

export default CreateDunningModalComponent;
