import React from 'react';
import { deleteSelectedArticles } from 'redux/ducks/article/articleList';
import { connect } from 'react-redux';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';

class ArticleDeleteComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			deleting: false
		};
	}

	componentWillReceiveProps(props) {
		const { selectedItems, onConfirm, finishedDeletingItems } = props;
		if (finishedDeletingItems) {
			const successfulItems = selectedItems.filter(item => item.deleteSuccess);
			if (successfulItems && successfulItems.length === selectedItems.length) {
				onConfirm();
			}
		}
	}

	render() {
		const { selectedItems, onConfirm, finishedDeletingItems, resources } = this.props;

		if (selectedItems) {
			const list = selectedItems.map(article => {
				return (
					<div className="article-delete-list-item" key={`article-delete-list-item-${article.id}`}>
						<span className="list-item-first-col">{article.number}</span>
						<span className="list-item-second-col">{article.title}</span>
						{finishedDeletingItems && article.deleteSuccess ? (
							<span className="icon icon-check" />
						) : finishedDeletingItems && !article.deleteSuccess ? (
							<span className="icon icon-close" />
						) : null}
					</div>
				);
			});

			return (
				<div className="article-delete-component-wrapper">
					<div>{resources.articlesDeleteConfirmText} {resources.str_undoneMessage}</div>

					<div className="article-delete-list">{list}</div>

					<div className="modal-base-footer">
						<div className="modal-base-cancel">
							{finishedDeletingItems ? null : (
								<ButtonComponent
									type="cancel"
									callback={() => ModalService.close(true)}
									label={resources.str_abortStop}
									dataQsId="modal-btn-cancel"
								/>
							)}
						</div>
						<div className="modal-base-confirm">
							{finishedDeletingItems ? (
								<ButtonComponent
									buttonIcon={'icon-check'}
									type={'primary'}
									callback={() => onConfirm && onConfirm()}
									label={resources.str_shutdown}
									dataQsId="modal-btn-confirm"
								/>
							) : (
								<ButtonComponent
									buttonIcon={this.state.deleting ? 'loader_spinner' : 'icon-trashcan'}
									type={'secondary'}
									disabled={this.state.deleting}
									callback={() => this.onDeleteSelectedConfirm()}
									label={resources.str_clear}
									dataQsId="modal-btn-confirm"
								/>
							)}
						</div>
					</div>
				</div>
			);
		}
	}

	onDeleteSelectedConfirm() {
		this.setState({ deleting: true });
		this.props.deleteSelectedArticles();
	}
}

const mapDispatchToProps = dispatch => {
	return {
		deleteSelectedArticles: () => {
			dispatch(deleteSelectedArticles());
		}
	};
};

const mapStateToProps = state => {
	const { selectedItems, finishedDeletingItems } = state.article.articleList;
	const { resources } = state.language.lang;

	return {
		selectedItems,
		finishedDeletingItems,
		resources
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(ArticleDeleteComponent);
