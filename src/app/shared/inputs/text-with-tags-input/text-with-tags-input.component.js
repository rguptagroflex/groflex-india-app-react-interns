import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import Tagify from 'shared/inputs/react-tagify/react-tagify';
import SelectDatesInputComponent from 'shared/inputs/select-dates-input/select-dates-input.component';
import { setTextRangeAtStartEnd } from 'helpers/setTextRangeAtStartEnd';
import TooltipComponent from 'shared/tooltip/tooltip.component';

class TextWithTagsInput extends React.Component {
	constructor(props) {
		super(props);

		const tagifySettings = Object.assign({}, props.tagifySettings, {
			mode: 'mix',
		});

		if (props.tagifySettings && props.tagifySettings.pattern) {
			tagifySettings.whitelist = [];
			tagifySettings.enforceWhitelist = true;
			tagifySettings.editTags = 0;

			tagifySettings.dropdown = {
				highlightFirst: true,
			};

			tagifySettings.templates = {
				dropdownItem(item) {
					const iconPerson = `<img src='/assets/images/svg/user.svg' width='20' />`;
					const iconCompany = `<div class='icon-round'><div class='icon icon-factory'></div></div>`;

					return `<div class='tagify__dropdown__item ${item.class ? item.class : ''}'
								tabindex="0"
								role="option">
									<div class='col-left'>
										${item.isCompany ? iconCompany : iconPerson}
									</div>
									<div class='col-right'>
										<div class='row-top'>${item.value}</div>
										<div class='row-bottom'>Kd-Nr. ${item.customerNumber}</div>
									</div>
								</div>`;
				},
			};
		}

		this.state = {
			isSubmitting: false,
			tagifyContent: '',
			tagifyTags: [],
			selectedDate: null,
			hasDateSelect: props.hasDateSelect && props.hasDateSelect === true,
			tagifySettings,
		};

		this.inputRef = React.createRef();
		this.focusTextInput = this.focusTextInput.bind(this);
		this.debounceSearch = null;
	}

	componentDidMount() {
		if (this.props.focusOnRender) {
			setTimeout(() => {
				this.focusTextInput();
			}, 0);
		}
	}

	focusTextInput() {
		if (this.inputRef && this.inputRef.current && this.inputRef.current.tagify) {
			this.inputRef.current.tagify.DOM.input.focus();
		}
	}

	onHashClick() {
		const currentTagContent = this.inputRef.current.tagify.DOM.input.textContent;

		this.inputRef.current.tagify.DOM.input.textContent = currentTagContent + '#';
		this.inputRef.current.tagify.update();

		this.setState(
			{
				tagifyContent: this.inputRef.current.tagify.DOM.input.textContent,
			},
			() => {
				this.focusTextInput();
				this.inputRef.current.tagify.dropdown.showEmptyState();

				setTimeout(() => {
					setTextRangeAtStartEnd(false, this.inputRef.current.tagify.DOM.input);
				}, 0);
			}
		);
	}

	onInput(evt, tags) {
		const { tagifySettings } = this.state;
		const tagInputValue = evt.detail.value;
		let whitespaceAfterTagInputValue = false;
		let hasCustomerTag = false;

		// hack necessary because tagify keeps an line break when you delete a text with line breaks
		// -> the placeholder wont't be shown without resetting the content of tagify
		if (evt.detail.textContent.length === 0 && this.inputRef.current.tagify.DOM.originalInput.value.length > 0) {
			this.inputRef.current.tagify.DOM.originalInput.value = '';
			this.inputRef.current.tagify.DOM.input.innerHTML = '';
			this.inputRef.current.tagify.DOM.input.innerText = '';
		}

		this.setState(
			{
				tagifyContent: this.inputRef.current.tagify.DOM.originalInput.value,
				tagifyTags: tags,
				tagifySettings,
			},
			() => {
				whitespaceAfterTagInputValue = tagInputValue && tagInputValue.match(new RegExp('\\s', 'gi'));

				hasCustomerTag = tags && tags.find((tag) => tag.isCustomer);

				clearTimeout(this.debounceSearch);

				if (
					!whitespaceAfterTagInputValue &&
					!hasCustomerTag &&
					tagifySettings.pattern &&
					tagInputValue &&
					tagInputValue.length > 0 &&
					evt.detail.textContent.match(tagifySettings.pattern + tagInputValue)
				) {
					this.debounceSearch = setTimeout(() => {
						this.inputRef.current.tagify.loading(true).dropdown.hide.call(this.inputRef.current.tagify);

						invoiz
							.request(`${config.resourceHost}search/customers/${tagInputValue}`, {
								auth: true,
							})
							.then((response) => {
								const { isSubmitting } = this.state;
								const { data } = response.body;

								if (!isSubmitting) {
									tagifySettings.whitelist = data.customers.map((customer) => {
										const isCompany = !!(customer.companyName && customer.companyName.length > 0);

										return {
											isCustomer: true,
											isCompany,
											id: customer.id,
											customerNumber: customer.number,
											searchBy: customer.number,
											value:
												customer.firstName || customer.lastName
													? `${customer.firstName} ${customer.lastName}`
													: customer.companyName,
										};
									});

									if (tagifySettings.whitelist.length === 0) {
										this.inputRef.current.tagify.dropdown.showEmptyState();
									}

									this.setState(
										{
											tagifySettings,
										},
										() => {
											this.inputRef.current.tagify
												.loading(false)
												.dropdown.show.call(this.inputRef.current.tagify, tagInputValue);
										}
									);
								}
							});
					}, 300);
				}
			}
		);
	}

	onTagSubmit() {
		const { onTagSubmit } = this.props;
		const { tagifyTags, selectedDate } = this.state;
		let tagifyContent = this.state.tagifyContent;

		if (tagifyContent.length > 0) {
			if (tagifyTags.length > 0) {
				tagifyTags.forEach((tag) => {
					tagifyContent = tagifyContent.replace(
						JSON.stringify(tag),
						JSON.stringify({ id: tag.id, value: tag.value })
					);
				});
			}

			if (selectedDate) {
				this.setState(
					{
						isSubmitting: true,
					},
					() => {
						onTagSubmit &&
							onTagSubmit({
								date: selectedDate.format(config.dateFormat.api),
								text: tagifyContent,
								tags: tagifyTags,
							});
					}
				);
			} else {
				this.setState(
					{
						isSubmitting: true,
					},
					() => {
						onTagSubmit &&
							onTagSubmit({
								text: tagifyContent,
								tags: tagifyTags,
							});
					}
				);
			}
		}
	}

	render() {
		const { hasDateSelect, isSubmitting, tagifyContent, tagifySettings, tagifyTags } = this.state;
		const hasTagifyContent = tagifyContent.length > 0;
		const hasCustomerTag = tagifyTags && tagifyTags.find((tag) => tag.isCustomer);

		return (
			<React.Fragment>
				<div
					className={`text-with-tags-input-component ${hasDateSelect ? '' : 'no-date-select'} ${
						hasTagifyContent ? (isSubmitting ? 'disabled' : 'active') : ''
					}`}
				>
					{hasDateSelect ? (
						<SelectDatesInputComponent
							onInit={(selectedDate) => {
								this.setState({
									selectedDate,
								});
							}}
							onChange={(selectedDate) => {
								this.setState({
									selectedDate,
								});
							}}
						/>
					) : null}

					<div
						id="text-with-tags-input"
						className={`text-with-tags-input-wrapper ${hasDateSelect && 'u_ml_20 has-date-select'}`}
					>
						<div className={`tag-input ${isSubmitting ? 'disabled' : ''}`}>
							<Tagify
								ref={this.inputRef}
								wrapperSelector="#text-with-tags-input"
								className="tagify-wrapper"
								mode="textarea"
								disabled={isSubmitting}
								settings={tagifySettings}
								autofocus={true}
								onInput={(evt, tags) => {
									this.onInput(evt, tags);
								}}
								onKeyPressEnter={(evt, isTagAdd) => {
									if (!isTagAdd) {
										this.onTagSubmit();
									}
								}}
								onChange={(evt) => {
									this.setState({
										tagifyContent: this.inputRef.current.tagify.DOM.input.textContent,
										tagifyTags: this.inputRef.current.tagify.value,
									});
								}}
								onTagRemove={(evt) => {
									this.setState({
										tagifyContent: this.inputRef.current.tagify.DOM.input.textContent,
										tagifyTags: this.inputRef.current.tagify.value,
									});
								}}
							/>
						</div>

						{isSubmitting ? null : (
							<div
								className={`tag-btn-submit ${hasTagifyContent ? 'visible' : ''} ${
									tagifySettings.pattern ? 'has-hash' : ''
								}`}
							>
								{tagifySettings.pattern ? (
									<React.Fragment>
										<div
											id="text-with-tags-btn-hash"
											className={`btn-hash ${hasCustomerTag ? 'hidden' : ''}`}
											onClick={() => {
												this.onHashClick();
											}}
										>
											#
										</div>

										<TooltipComponent
											elementId="text-with-tags-btn-hash"
											attachment="top right"
											targetAttachment="bottom right"
											offset={'-5px -9px'}
											translateX="53px"
											additionalClass="compact"
										>
											<div className="text-with-tags-btn-hash-tooltip">Markiere einen Kunden</div>
										</TooltipComponent>
									</React.Fragment>
								) : null}
								<div className="icon icon-enter_arrow" onClick={() => this.onTagSubmit()}></div>
							</div>
						)}
					</div>
				</div>
				<div
					className={`text-with-tags-hint text-light text-small text-right u_mt_2 ${
						hasTagifyContent && 'show-hint'
					}`}
				>
					<div>
						<span className="text-bold">Enter</span> zum Hinzufügen
					</div>
					<div className="u_ml_16">
						<span className="text-bold">Umschalttaste (Shift) + Enter</span> für eine neue Zeile
					</div>
				</div>
			</React.Fragment>
		);
	}
}

export default TextWithTagsInput;
