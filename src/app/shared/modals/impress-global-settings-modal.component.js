import React from 'react';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import CanvasColorPickerComponent from 'shared/canvas-color-picker/canvas-color-picker.component';
import { impressThemes } from 'shared/impress/impress-themes';

// const CUSTOM_THEME_NAME = 'Eigenes Farbschema';

class ImpressGlobalSettingsModalComponent extends React.Component {
	constructor(props) {
		super(props);

		const themes = JSON.parse(JSON.stringify(impressThemes));

		if (props.additionalCustomTheme) {
			themes.push(props.additionalCustomTheme);
		}

		this.activeCustomTheme = null;

		this.state = {
			selectedUserTheme: this.getActiveUserTheme(themes),
			previewThemeColors: this.setPreviewThemeColors(this.getActiveUserTheme(themes)),
			themes
		};

		this.onConfirm = props.onConfirm;
		this.onConfirmButtonClick = this.onConfirmButtonClick.bind(this);
		this.onCancelButtonClick = this.onCancelButtonClick.bind(this);
	}

	componentDidMount() {
		const { resources } = this.props;
		const { themes } = this.state;
		const newThemes = JSON.parse(JSON.stringify(themes));

		if (this.activeCustomTheme) {
			newThemes.push(this.activeCustomTheme);

			this.setState(
				{
					themes: newThemes
				},
				() => {
					this.setActiveUserTheme(resources.str_colorScheme);
					this.activeCustomTheme = null;
				}
			);
		}
	}

	getActiveUserTheme(loadedThemes) {
		const { activeTheme, resources } = this.props;
		const themes = (this.state && this.state.themes) || loadedThemes;
		let activeUserTheme = themes.find(theme => theme.title.toLowerCase() === 'standard');
		let themeFound = false;

		if (activeTheme && activeTheme.items) {
			themes.forEach(theme => {
				if (!themeFound) {
					let foundThemeColors = 0;

					theme.items.forEach(item => {
						const hasThemeColor = activeTheme.items.find(userItem => {
							return (
								userItem.key === item.key && userItem.color.toLowerCase() === item.color.toLowerCase()
							);
						});

						if (hasThemeColor) {
							foundThemeColors++;
						}
					});

					if (foundThemeColors === theme.items.length) {
						themeFound = true;
						activeUserTheme = theme;
					}
				}
			});

			if (!themeFound && activeTheme.items.length > 5) {
				this.activeCustomTheme = activeUserTheme = {
					title: resources.str_colorScheme,
					items: activeTheme.items
				};
			}
		}

		return activeUserTheme;
	}

	getThemeItemName(key) {
		const { activeTheme, resources } = this.props;
		const { selectedUserTheme } = this.state;

		let itemName = '';
		let item = selectedUserTheme.items && selectedUserTheme.items.find(item => item.key === key);

		if (item && activeTheme && activeTheme.items) {
			item = activeTheme.items.find(activeItem => activeItem.key === item.key);
			itemName = item && item.name;

			if (!itemName) {
				itemName = resources.str_fontColorPage;
			}
		}

		return itemName;
	}

	onConfirmButtonClick() {
		const { themes } = this.state;
		const { activeTheme, resources } = this.props;
		const selectedUserTheme =
			this.state.selectedUserTheme && JSON.parse(JSON.stringify(this.state.selectedUserTheme));
		const customTheme = themes.find(theme => {
			return theme.title === resources.str_colorScheme;
		});

		ModalService.close();

		if (selectedUserTheme) {
			selectedUserTheme.items.forEach(item => {
				const activeItem = activeTheme.items.find(activeItem => activeItem.key === item.key);
				item.name = activeItem && activeItem.name;
			});

			delete selectedUserTheme.title;
		}

		this.onConfirm && this.onConfirm(selectedUserTheme, customTheme);
	}

	onCancelButtonClick() {
		ModalService.close();
	}

	onColorChange(color, themeColorKey) {
		const { resources } = this.props;
		const { selectedUserTheme, themes } = this.state;
		const newThemes = JSON.parse(JSON.stringify(themes));
		let customThemeExists = false;
		let customTheme = null;

		newThemes.forEach(theme => {
			if (theme.title === resources.str_colorScheme) {
				customThemeExists = true;
			}
		});

		if (customThemeExists) {
			customTheme = newThemes.find(theme => {
				return theme.title === resources.str_colorScheme;
			});

			if (customTheme && customTheme.items) {
				customTheme.items.forEach(item => {
					if (item.key === themeColorKey) {
						item.color = color;
					} else {
						if (selectedUserTheme.title !== resources.str_colorScheme) {
							const existingColor = selectedUserTheme.items.find(
								existingItem => existingItem.key === item.key
							);
							item.color = existingColor.color;
						}
					}
				});
			}
		} else {
			customTheme = {
				title: resources.str_colorScheme,
				items: selectedUserTheme.items
			};

			customTheme.items.forEach(item => {
				if (item.key === themeColorKey) {
					item.color = color;
				}
			});

			newThemes.push(customTheme);
		}

		this.setState(
			{
				themes: newThemes
			},
			() => {
				this.setActiveUserTheme(resources.str_colorScheme);
			}
		);
	}

	setActiveUserTheme(themeTitle) {
		const { themes } = this.state;
		const selectedTheme = themes.find(theme => theme.title.toLowerCase() === themeTitle.toLowerCase());

		this.setState({
			selectedUserTheme: selectedTheme,
			previewThemeColors: this.setPreviewThemeColors(selectedTheme)
		});
	}

	setPreviewThemeColors(selectedTheme) {
		const previewThemeColors = {};

		if (selectedTheme && selectedTheme.items) {
			selectedTheme.items.forEach(item => {
				previewThemeColors[item.key] = item.color;
			});
		}

		return previewThemeColors;
	}

	render() {
		const { resources } = this.props;
		const { previewThemeColors, themes } = this.state;

		const themesOptions = themes.map(theme => {
			return {
				label: theme.title,
				value: theme.title
			};
		});

		return (
			<div className="impress-global-settings-modal-content">
				<div className="modal-row margin-bottom text-muted">
					{resources.offerColorSelectionMessage}
				</div>

				<div className="modal-row margin-bottom">
					<div className="col-left">
						<strong>{resources.activeColorScheme}</strong>
					</div>
					<div className="col-right">
						<SelectInputComponent
							allowCreate={false}
							notAsync={true}
							loadedOptions={themesOptions}
							value={this.state.selectedUserTheme.title}
							options={{
								clearable: false,
								noResultsText: false,
								labelKey: 'label',
								valueKey: 'value',
								matchProp: 'value',
								placeholder: resources.str_chooseColorScheme,
								handleChange: option => {
									this.setActiveUserTheme((option && option.value) || 'standard');
								}
							}}
						/>
					</div>
				</div>

				<div className="modal-row">
					<strong>{resources.str_selectColors}</strong>
				</div>

				<div className="modal-row color-row">
					<div className="col-left">{this.getThemeItemName('backgroundPage')}</div>
					<div className="col-right">
						<div
							className="impress-global-setting-color-preview"
							style={{ backgroundColor: previewThemeColors['backgroundPage'] }}
						>
							<div className="icon icon-farbschema" />
							<CanvasColorPickerComponent
								onChange={color => {
									this.onColorChange(color, 'backgroundPage');
								}}
								visible={true}
								value={previewThemeColors['backgroundPage']}
							/>
						</div>
					</div>
				</div>
				<div className="modal-row color-row">
					<div className="col-left">{this.getThemeItemName('fontPage')}</div>
					<div className="col-right">
						<div
							className="impress-global-setting-color-preview"
							style={{ backgroundColor: previewThemeColors['fontPage'] }}
						>
							<div className="icon icon-farbschema" />
							<CanvasColorPickerComponent
								onChange={color => {
									this.onColorChange(color, 'fontPage');
								}}
								visible={true}
								value={previewThemeColors['fontPage']}
							/>
						</div>
					</div>
				</div>
				<div className="modal-row color-row">
					<div className="col-left">{this.getThemeItemName('backgroundNavigation')}</div>
					<div className="col-right">
						<div
							className="impress-global-setting-color-preview"
							style={{ backgroundColor: previewThemeColors['backgroundNavigation'] }}
						>
							<div className="icon icon-farbschema" />
							<CanvasColorPickerComponent
								onChange={color => {
									this.onColorChange(color, 'backgroundNavigation');
								}}
								visible={true}
								value={previewThemeColors['backgroundNavigation']}
							/>
						</div>
					</div>
				</div>
				<div className="modal-row color-row">
					<div className="col-left">{resources.colorDividingLines}</div>
					<div className="col-right">
						<div
							className="impress-global-setting-color-preview"
							style={{ backgroundColor: previewThemeColors['borderNavigation'] }}
						>
							<div className="icon icon-farbschema" />
							<CanvasColorPickerComponent
								onChange={color => {
									this.onColorChange(color, 'borderNavigation');
								}}
								visible={true}
								value={previewThemeColors['borderNavigation']}
							/>
						</div>
					</div>
				</div>
				<div className="modal-row color-row">
					<div className="col-left">{this.getThemeItemName('fontNavigation')}</div>
					<div className="col-right">
						<div
							className="impress-global-setting-color-preview"
							style={{ backgroundColor: previewThemeColors['fontNavigation'] }}
						>
							<div className="icon icon-farbschema" />
							<CanvasColorPickerComponent
								onChange={color => {
									this.onColorChange(color, 'fontNavigation');
								}}
								visible={true}
								value={previewThemeColors['fontNavigation']}
							/>
						</div>
					</div>
				</div>
				<div className="modal-row color-row">
					<div className="col-left">{this.getThemeItemName('activeNavigationItem')}</div>
					<div className="col-right">
						<div
							className="impress-global-setting-color-preview"
							style={{ backgroundColor: previewThemeColors['activeNavigationItem'] }}
						>
							<div className="icon icon-farbschema" />
							<CanvasColorPickerComponent
								onChange={color => {
									this.onColorChange(color, 'activeNavigationItem');
								}}
								visible={true}
								value={previewThemeColors['activeNavigationItem']}
							/>
						</div>
					</div>
				</div>

				<div className="modal-base-footer">
					<div className="modal-base-cancel">
						<ButtonComponent type="cancel" callback={() => this.onCancelButtonClick()} label={resources.str_abortStop} />
					</div>

					<div className="modal-base-confirm">
						<ButtonComponent callback={() => this.onConfirmButtonClick()} label={resources.str_apply} />
					</div>
				</div>
			</div>
		);
	}
}

export default ImpressGlobalSettingsModalComponent;
