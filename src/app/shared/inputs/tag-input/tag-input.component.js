import invoiz from 'services/invoiz.service';
import React from 'react';
import q from 'q';
import _ from 'lodash';
import { format } from 'util';
import LoaderComponent from 'shared/loader/loader.component';

export class TagInputComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			loading: false,
			tags: props.tags || [],
			tagType: props.tagType || '',
			requiredTags: props.requiredTags || [],
			hiddenTags: props.hiddenTags || [],
			name: props.name || '',
			label: props.label || '',
			class: props.class || '',
			placeholder: props.placeholder || '',
			hintText: props.hintText,
			options: props.options,
			calledFunction: props.calledFunction || '',
			manuallyCalledDelete: props.manuallyCalledDelete || false,
			checkTagBeforeDelete: props.checkTagBeforeDelete,
			onSaveTags: props.onSaveTags
		};
	}

	componentDidMount() {
		this.initializeTagEditor();
	}

	backendRequest(successMessage) {
		const { onSaveTags, tags } = this.state;
		const { resources } = this.props;

		const onSaveSuccess = () => {
			if (successMessage) {
				invoiz.page.showToast({ message: successMessage });
			}
		};

		const onSaveError = () => {
			invoiz.page.showToast({ type: 'error', message: resources.tagAddErrorMessage });
		};

		q.fcall(() => onSaveTags(tags))
			.then(onSaveSuccess)
			.catch(onSaveError)
			.done(() => {
				this.setState({ loading: false });
			});
	}

	addTag(tag) {
		const { tags, tagType } = this.state;
		const { resources } = this.props;

		if (!tag) {
			return;
		}

		tags.push(tag);

		this.setState({ tags }, () => {
			this.backendRequest(format(resources.tagAddSuccessMessage, tagType, tag));
		});
	}

	beforeTagDelete(field, editor, newTags, tag) {
		const { checkTagBeforeDelete, manuallyCalledDelete } = this.state;

		this.setState({ calledFunction: 'removeTag', loading: true }, () => {
			if (checkTagBeforeDelete && !manuallyCalledDelete) {
				const onTagsChecked = canBeDeleted => {
					this.setState({ loading: false });

					if (canBeDeleted) {
						return this.callDelete(tag);
					}
				};

				checkTagBeforeDelete(newTags, tag, onTagsChecked);
			} else {
				this.removeTag(tag);
			}
		});

		if (checkTagBeforeDelete && !manuallyCalledDelete) {
			return false;
		}
	}

	beforeTagSave(field, editor, newTags, tag, val) {
		const { tags, tagType } = this.state;
		const { resources } = this.props;

		this.setState({ calledFunction: 'removeTag', loading: true }, () => {
			const index = tags.indexOf(tag);
			const newTagExists = tags.indexOf(val) > -1;

			if (!tag && newTagExists) {
				this.setState({ loading: false });
				invoiz.page.showToast({ type: 'error', message: format(resources.tagExistsMessage, tagType, val) });
				return false;
			}

			if (index > -1) {
				return this.updateTag(index, tag, val);
			}

			this.addTag(val);
		});
	}

	callDelete(tag) {
		this.setState({ manuallyCalledDelete: true }, () => {
			$(this.refs.tagInputElement).tagEditor('removeTag', tag);
			this.setState({ manuallyCalledDelete: false });
		});
	}

	checkHiddenTags(tagElements) {
		const { hiddenTags } = this.state;

		if (hiddenTags.length <= 0) return;

		if (this.refs && this.refs.tagInputWrapper) {
			tagElements.each((idx, elm) => {
				const $tag = $(elm);
				const currentTag = $tag.find('.tag-editor-tag').html();
				const tagFound = _.includes(hiddenTags, currentTag);

				if (tagFound) {
					$tag.addClass('tag-editor-hidden');
				}
			});
		}
	}

	checkRequiredTags(tagElements) {
		const { requiredTags } = this.state;

		if (requiredTags.length <= 0) return;

		if (this.refs && this.refs.tagInputWrapper) {
			tagElements.each((idx, elm) => {
				const $tag = $(elm);
				const $editorTag = $tag.find('.tag-editor-tag');
				const currentTag = $editorTag.html();
				const tagFound = _.includes(requiredTags, currentTag);

				if (tagFound) {
					$tag.addClass('tag-editor-required');
					$editorTag.addClass('tag-editor-tag-required');
				}
			});
		}
	}

	initializeTagEditor() {
		const { tags } = this.state;

		if (this.refs && this.refs.tagInputWrapper && this.refs.tagInputElement) {
			$(this.refs.tagInputElement).tagEditor({
				initialTags: tags,
				forceLowercase: false,
				placeholder: this.placeholder,
				onChange: this.onChange.bind(this),
				beforeTagSave: this.beforeTagSave.bind(this),
				beforeTagDelete: this.beforeTagDelete.bind(this)
			});

			const editorElement = $(this.refs.tagInputWrapper).find('.tag-editor');
			editorElement.attr('data-hook', 'tag-editor');

			const tagElements = $('li', $(this.refs.tagInputElement).tagEditor('getTags')[0].editor);
			this.checkRequiredTags(tagElements);
			this.checkHiddenTags(tagElements);

			if (editorElement) {
				const clickEventObj = _.find($._data(editorElement[0], 'events').click, {
					selector: '.tag-editor-tag'
				});

				if (clickEventObj) {
					editorElement.off('click', '.tag-editor-tag');
					editorElement.on('click', '.tag-editor-tag:not(.tag-editor-tag-required)', clickEventObj.handler);
				}
			}
		}
	}

	onChange(field, editor, newTags) {
		const { calledFunction } = this.state;

		const tagElements = $('li', $(this.refs.tagInputElement).tagEditor('getTags')[0].editor);
		this.checkRequiredTags(tagElements);

		if (calledFunction !== 'addTag' && calledFunction !== 'removeTag') {
			this.setState({ loading: true, tags: newTags }, () => {
				this.backendRequest();
			});
		}

		this.setState({ calledFunction: '' });
	}

	removeTag(tag) {
		const { tags, tagType } = this.state;
		const { resources } = this.props;

		if (!tag) {
			return;
		}

		const index = tags.indexOf(tag);
		tags.splice(index, 1);

		this.setState({ tags }, () => {
			this.backendRequest(format(resources.tagDeleteSuccessMessage, tagType, tag));
		});
	}

	updateTag(index, oldVal, newVal) {
		const { tags, tagType } = this.state;
		const { resources } = this.props;

		tags[index] = newVal;

		this.setState({ tags }, () => {
			this.backendRequest(format(resources.tagUpdateSuccessMessage, tagType));
		});
	}

	render() {
		const { hintText, loading, tags } = this.state;

		return (
			<div className="tagInput" ref="tagInputWrapper">
				<div className="tagInput_content">
					{loading ? <LoaderComponent visible={true} /> : ''}
					<label className="tagInput_label" />
					<input
						ref="tagInputElement"
						className="tagInput_input"
						value={tags.join(',')}
						onChange={() => true}
						tabIndex="0"
						type="text"
						autoComplete="false"
						spellCheck="false"
					/>
				</div>

				{hintText ? (
					<div className="tagInput_hint">
						<div className="text-small">{hintText}</div>
					</div>
				) : null}
			</div>
		);
	}
}
