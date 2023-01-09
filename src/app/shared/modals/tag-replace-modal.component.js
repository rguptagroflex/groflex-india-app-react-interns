import invoiz from 'services/invoiz.service';
import React from 'react';
import SelectInputComponent from 'shared/inputs/select-input/select-input.component';
import ButtonComponent from 'shared/button/button.component';
import { format } from 'util';

class TagReplaceModal extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isSaveDisabled: false,
			subject: props.subject,
			dataProp: props.dataProp,
			type: props.type,
			tags: props.tags,
			tagToDelete: props.tagToDelete,
			replaceTag: (props.tags && props.tags[0]) || '',
			replaceUrl: props.replaceUrl,
			onSaveClick: props.onSaveClick,
			onCancelClick: props.onCancelClick
		};
	}

	onTagChange(tag) {
		if (!tag) {
			this.setState({ isSaveDisabled: true, replaceTag: null });
		} else {
			this.setState({ isSaveDisabled: false, replaceTag: tag.value });
		}
	}

	onSubmitClicked() {
		const { resources } = this.props;
		const { dataProp, onSaveClick, replaceTag, replaceUrl, tagToDelete, type } = this.state;
		const data = {};

		data[dataProp] = replaceTag;

		invoiz
			.request(`${replaceUrl}/${tagToDelete}`, {
				auth: true,
				method: 'PUT',
				data
			})
			.then(response => {
				onSaveClick(true);
			})
			.catch(() => {
				invoiz.page.showToast({
					type: 'error',
					message: format(resources.tagDeleteErrorMessage, type, tagToDelete)
				});

				onSaveClick(false);
			});
	}

	render() {
		const { subject, tags, type, tagToDelete, isSaveDisabled, replaceTag, onCancelClick } = this.state;
		const { resources } = this.props;
		return (
			<div className="tag-replace-modal-component">
				<div>
					<div className="text-muted u_mt_24" dangerouslySetInnerHTML={{ __html: format(resources.tagReplaceHeading, subject, type, tagToDelete) }}>
					</div>

					<div className="text-muted u_mbt_24">
						{format(resources.tagReplaceCaption, type, subject)}
					</div>

					<div className="tagReplaceInput">
						<SelectInputComponent
							allowCreate={false}
							notAsync={true}
							loadedOptions={tags.map(tag => {
								return {
									label: tag,
									value: tag
								};
							})}
							value={replaceTag}
							options={{
								multi: false,
								clearable: true,
								searchable: true,
								backspaceRemoves: true,
								noResultsText: false,
								labelKey: 'label',
								valueKey: 'value',
								matchProp: 'label',
								handleChange: this.onTagChange.bind(this)
							}}
						/>
					</div>

					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							<ButtonComponent
								type="cancel"
								callback={() => {
									onCancelClick();
								}}
								label={resources.str_abortStop}
								dataQsId="modal-btn-cancel"
							/>
						</div>
						<div className="modal-base-confirm">
							<ButtonComponent
								buttonIcon={'icon-check'}
								type={'primary'}
								disabled={isSaveDisabled}
								callback={() => this.onSubmitClicked()}
								label={resources.str_replace}
								dataQsId="modal-btn-confirm"
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default TagReplaceModal;
