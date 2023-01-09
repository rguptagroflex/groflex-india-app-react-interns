import React from 'react';
import TooltipComponent from 'shared/tooltip/tooltip.component';
import TransactionPrintSetting from 'enums/transaction-print-setting.enum';

class DetailViewHeadPrintTooltipComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			letterPaperType: this.props.letterPaperType || null
		};
	}

	componentWillReceiveProps(props) {
		this.setState({
			letterPaperType: props.letterPaperType || TransactionPrintSetting.DEFAULT_LETTER_PAPER
		});
	}

	render() {
		const { letterPaperType } = this.state;
		const { offset, resources } = this.props;

		return (
			<TooltipComponent
				elementId="detail-head-print-anchor"
				attachment="bottom left"
				targetAttachment="top left"
				offset={offset}
			>
				{letterPaperType === TransactionPrintSetting.DEFAULT_LETTER_PAPER
					? resources.printPopoverBlankStationaryText
					: resources.printPopoverOwnStationaryText}
			</TooltipComponent>
		);
	}
}

export default DetailViewHeadPrintTooltipComponent;
