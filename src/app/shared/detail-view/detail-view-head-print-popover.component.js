import React from 'react';
import invoiz from 'services/invoiz.service';
import PopoverComponent from 'shared/popover/popover.component';
import TransactionPrintSetting from 'enums/transaction-print-setting.enum';

class DetailViewHeadPrintPopoverComponent extends React.Component {
	onPopoverItemClicked(action, selected) {
		if (!selected) {
			invoiz
				.request(this.props.printSettingUrl, {
					auth: true,
					method: 'PUT',
					data: {
						printCustomDocument: action === TransactionPrintSetting.CUSTOM_LETTER_PAPER,
					},
				})
				.then(() => {
					this.setState({ letterPaperType: action });
					this.props.letterPaperChangeCallback && this.props.letterPaperChangeCallback(action);
				});
		}

		this.refs['detail-head-print-settings-popover'].hide();
	}

	show() {
		this.refs['detail-head-print-settings-popover'].show();
	}

	render() {
		const { arrowOffset, elementId, offsetTop, offsetLeft, letterPaperType, resources } = this.props;

		const detailHeadPrintSettingsPopoverItems = (
			<div>
				<div
					className="popover-entry popover-entry-no-hover"
					onClick={() =>
						this.onPopoverItemClicked(
							TransactionPrintSetting.CUSTOM_LETTER_PAPER,
							letterPaperType === TransactionPrintSetting.CUSTOM_LETTER_PAPER
						)
					}
					data-qs-id="invoiceDetail-popoverItem-letterPaperSetting-custom"
				>
					<div
						className={`popover-entry-circle-indicator ${
							letterPaperType === TransactionPrintSetting.CUSTOM_LETTER_PAPER ? 'selected' : ''
						}`}
					/>
					<div className="popover-entry-label">{resources.printPopoverOwnStationaryText}</div>
				</div>
				<div
					className="popover-entry popover-entry-no-hover"
					onClick={() =>
						this.onPopoverItemClicked(
							TransactionPrintSetting.DEFAULT_LETTER_PAPER,
							letterPaperType === TransactionPrintSetting.DEFAULT_LETTER_PAPER
						)
					}
					data-qs-id="invoiceDetail-popoverItem-letterPaperSetting-default"
				>
					<div
						className={`popover-entry-circle-indicator ${
							letterPaperType === TransactionPrintSetting.DEFAULT_LETTER_PAPER ? 'selected' : ''
						}`}
					/>
					<div className="popover-entry-label">{resources.printPopoverBlankStationaryText}</div>
				</div>
			</div>
		);

		return (
			<PopoverComponent
				elementId={elementId}
				arrowOffset={arrowOffset}
				offsetTop={offsetTop}
				offsetLeft={offsetLeft}
				ref={'detail-head-print-settings-popover'}
			>
				{detailHeadPrintSettingsPopoverItems}
			</PopoverComponent>
		);
	}
}

DetailViewHeadPrintPopoverComponent.defaultProps = {
	elementId: 'detail-head-print-settings-popover-anchor',
	arrowOffset: 100,
	offsetTop: 20,
	offsetLeft: 95,
	letterPaperType: TransactionPrintSetting.DEFAULT_LETTER_PAPER,
};

export default DetailViewHeadPrintPopoverComponent;
