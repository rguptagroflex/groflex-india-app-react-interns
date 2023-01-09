import React from 'react';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import CanvasColorPickerComponent from 'shared/canvas-color-picker/canvas-color-picker.component';
import RadioInputComponent from 'shared/inputs/radio-input/radio-input.component';
import CheckboxInputComponent from 'shared/inputs/checkbox-input/checkbox-input.component';
import ElementTypes from 'enums/impress/element-types.enum';

class ImpressBlockSettingsModalComponent extends React.Component {
	constructor(props) {
		super(props);

		const block = JSON.parse(JSON.stringify(props.block));

		this.state = {
			block,
			isBlockBackgroundTransparent: block && block.background && block.background.toLowerCase() === 'transparent'
		};

		this.blockColor = (props.block && props.block.background) || '#ffffff';
		this.separatorLineColor = (props.block && props.block.separatorLineColor) || '#cccccc';
		this.onConfirm = props.onConfirm;
		this.onConfirmButtonClick = this.onConfirmButtonClick.bind(this);
		this.onCancelButtonClick = this.onCancelButtonClick.bind(this);
	}

	onConfirmButtonClick() {
		const block = JSON.parse(JSON.stringify(this.state.block));

		block.background = this.blockColor;
		block.separatorLineColor = this.separatorLineColor;

		ModalService.close();
		this.onConfirm && this.onConfirm(block);
	}

	onCancelButtonClick() {
		ModalService.close();
	}

	render() {
		const { resources } = this.props;
		const { isBlockBackgroundTransparent } = this.state;
		const block = JSON.parse(JSON.stringify(this.state.block));

		const blockLineColorRow = (
			<div className="impress-block-settings-row margin-bottom">
				<span className="left-col">{resources.str_selectLineColor}</span>
				<CanvasColorPickerComponent
					onChange={color => {
						this.separatorLineColor = color.toLowerCase() === '#cccccc' ? null : color;
					}}
					visible={true}
					value={block.separatorLineColor || '#cccccc'}
				/>
			</div>
		);

		const blockBackgroundRow = (
			<div className="impress-block-settings-row flex">
				<div>
					<span className="left-col">{resources.str_selectBackgroundColor}</span>
					<CanvasColorPickerComponent
						onChange={color => {
							this.blockColor = color;
						}}
						disabled={!!isBlockBackgroundTransparent}
						visible={true}
						value={
							isBlockBackgroundTransparent
								? 'transparent'
								: block.background
									? block.background === 'transparent'
										? '#ffffff'
										: block.background
									: '#ffffff'
						}
					/>
				</div>
				<div className="block-background-automatic">
					<CheckboxInputComponent
						label={resources.str_automatically}
						checked={!!isBlockBackgroundTransparent}
						onChange={checked => {
							this.blockColor = checked
								? 'transparent'
								: block.background
									? block.background === 'transparent'
										? '#ffffff'
										: block.background
									: '#ffffff';
							this.setState({ isBlockBackgroundTransparent: checked });
						}}
					/>
				</div>
			</div>
		);

		return (
			<div className="impress-block-settings-modal-content">
				{block.type === ElementTypes.TEXT ||
				block.type === ElementTypes.ARTICLES ||
				block.type === ElementTypes.SEPARATOR ? (
						<div>
							{block.type !== ElementTypes.SEPARATOR ? (
								<div className="impress-block-settings-row">
									<span>{resources.str_blockLayout}</span>
									<RadioInputComponent
										useCustomStyle={true}
										options={[{ label: resources.str_normal, value: 'default' }, { label: resources.str_wide, value: 'wide' }]}
										value={block.layout || 'default'}
										onChange={val => {
											block.layout = val === 'default' ? null : val;
											block.background = this.blockColor;
											block.separatorLineColor = this.separatorLineColor;
											this.setState({ block });
										}}
									/>
								</div>
							) : null}
							{block.type === ElementTypes.SEPARATOR ? (
								<div>
									<div className="flex-cols">
										<div className="impress-block-settings-row separator-line-width">
											<span>{resources.str_lineThickness}</span>
											<RadioInputComponent
												useCustomStyle={true}
												options={[
													{ label: resources.str_veryThin, value: '1' },
													{ label: resources.str_thin, value: '2' },
													{ label: resources.str_medium, value: '3' },
													{ label: resources.str_thick, value: '4' },
													{ label: resources.str_veryThick, value: '5' }
												]}
												value={block.separatorLineWidth || '1'}
												onChange={val => {
													block.separatorLineWidth = val === '1' ? null : val;
													block.background = this.blockColor;
													block.separatorLineColor = this.separatorLineColor;
													this.setState({ block });
												}}
											/>
										</div>
										<div className="impress-block-settings-row separator-line-style">
											<span>{resources.str_lineStyle}</span>
											<RadioInputComponent
												useCustomStyle={true}
												options={[
													{ label: resources.str_pulledBy, value: 'solid' },
													{ label: resources.str_strokes, value: 'dashed' },
													{ label: resources.str_points, value: 'dotted' }
												]}
												value={block.separatorLineStyle || 'solid'}
												onChange={val => {
													block.separatorLineStyle = val === 'solid' ? null : val;
													block.background = this.blockColor;
													block.separatorLineColor = this.separatorLineColor;
													this.setState({ block });
												}}
											/>
										</div>
									</div>
									{blockLineColorRow}
								</div>
							) : null}
							{blockBackgroundRow}
						</div>
					) : null}

				{block.type === ElementTypes.IMAGE ? <div>{blockBackgroundRow}</div> : null}

				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent type="cancel" callback={() => this.onCancelButtonClick()} label={resources.str_abortStop} />
					</div>

					<div className="modal-base-confirm">
						<ButtonComponent callback={() => this.onConfirmButtonClick()} label={resources.str_toSave} />
					</div>
				</div>
			</div>
		);
	}
}

export default ImpressBlockSettingsModalComponent;
