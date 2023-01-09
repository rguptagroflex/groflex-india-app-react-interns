import React from 'react';
import TopbarComponent from 'shared/topbar/topbar.component';
import invoiz from 'services/invoiz.service';
import {
	fetchArticleList,
	sortArticleList,
	paginateArticleList,
	searchArticleList,
	deleteArticle,
	selectAllArticles,
	selectArticle,
	deleteSelectedArticles
} from 'redux/ducks/article/articleList';
import { connect, Provider } from 'react-redux';
import store from 'redux/store';
import ListComponent from 'shared/list/list.component';
import ListSearchComponent from 'shared/list-search/list-search.component';
import { formatCurrency } from 'helpers/formatCurrency';
import PopoverComponent from 'shared/popover/popover.component';
import PaginationComponent from 'shared/pagination/pagination.component';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import ArticleDeleteComponent from 'shared/article-delete/article-delete.component';

import userPermissions from 'enums/user-permissions.enum';

class ArticleListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			canCreateArticle: null,
			canDeleteArticle: null,
			canUpdateArticle: null
		};
	}
	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_ARTICLE)) {
			invoiz.user.logout(true);
		}
		this.props.fetchArticleList(true);
		this.setState({
			canCreateArticle: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_ARTICLE),
			canUpdateArticle: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_ARTICLE),
			canDeleteArticle: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_ARTICLE)
		});
	}

	render() {
		const {
			isLoading,
			columns,
			currentPage,
			totalPages,
			articleListData: { articles },
			allSelected,
			selectedItems,
			searchText,
			resources
		} = this.props;

		const { canCreateArticle, canDeleteArticle } = this.state;

		const tableRows = this.createTableRows(articles);

		const listContent = (
			<div>
				<ListComponent
					allSelected={allSelected}
					selectable={canDeleteArticle}
					selectedCallback={(id, isChecked) => this.onSelected(id, isChecked)}
					selectedAllCallback={isChecked => this.onAllSelected(isChecked)}
					clickable={true}
					rowCallback={articleId => this.onRowClick(articleId)}
					sortable={true}
					columns={columns}
					rows={tableRows}
					columnCallback={column => this.onSort(column)}
					resources={resources}
				/>

				{totalPages > 1 ? (
					<div className="article-list-pagination">
						<PaginationComponent
							currentPage={currentPage}
							totalPages={totalPages}
							onPaginate={page => this.onPaginate(page)}
						/>
					</div>
				) : null}
			</div>
		);

		const emptyListContent = (
			<div className="empty-list-box">
				<div className="text-placeholder icon icon-article" />
				<div className="text-h2">{resources.articleNotAvailableText}</div>
				<div className="">{resources.createOrImportArticalText}</div>
				<ButtonComponent
					label={resources.createArticle}
					buttonIcon="icon-plus"
					dataQsId="empty-list-create-button"
					callback={() => invoiz.router.navigate('/article/new')}
					disabled={!canCreateArticle}
				/>
				{/* <ButtonComponent
					label={resources.importArticle}
					buttonIcon="icon-plus"
					dataQsId="empty-list-import-button"
					callback={() => invoiz.router.navigate('/settings/data-import/articles/1')}
				/> */}
			</div>
		);

		const topbarButtons = [];
		if (selectedItems && selectedItems.length > 0) {
			topbarButtons.push({
				type: 'danger',
				label: resources.str_clear,
				buttonIcon: 'icon-trashcan',
				action: 'delete-articles'
			});
		}

		if (canCreateArticle) {
			topbarButtons.push({
				type: 'primary',
				label: resources.createArticle,
				buttonIcon: 'icon-plus',
				action: 'create'
			});
		}	
		// if (!isLoading && (!articles || articles.length === 0)) {
		// 	topbarButtons.push({
		// 		type: 'primary',
		// 		label: resources.importArticle,
		// 		buttonIcon: 'icon-plus',
		// 		action: 'import'
		// 	});
		// }

		const topbar = (
			<TopbarComponent
				title={resources.str_article}
				viewIcon={`icon-article`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
				buttons={topbarButtons}
			/>
		);

		return (
			<div className="article-list-component-wrapper">
				{topbar}

				<div className="article-list-head">
					<div className="article-list-head-content">
						<ListSearchComponent
							value={searchText}
							placeholder={resources.searchArticle}
							onChange={val => this.onSearch(val)}
						/>
					</div>
				</div>

				<div className="box article-list-wrapper">
					{isLoading ? null : articles && articles.length > 0 ? (
						listContent
					) : searchText.trim().length > 0 ? (
						<div className="empty-list-box">{resources.articleEmptySearchText}</div>
					) : isLoading ? null : (
						emptyListContent
					)}
				</div>
			</div>
		);
	}

	onTopbarButtonClick(action) {
		const { resources } = this.props;
		switch (action) {
			case 'create':
				this.createArticle();
				break;
			case 'import':
				invoiz.router.navigate('/settings/data-import/articles/1');
				break;
			case 'delete-articles':
				ModalService.open(
					<Provider store={store}>
						<ArticleDeleteComponent onConfirm={() => this.onDeleteConfirmSelected()} />
					</Provider>,
					{
						width: 500,
						headline: resources.articleDelete
					}
				);
				break;
		}
	}

	onSelected(id, checked) {
		this.props.selectArticle(id, checked);
	}

	onAllSelected(checked) {
		this.props.selectAllArticles(checked);
	}

	onDeleteConfirmSelected() {
		ModalService.close();
		this.props.fetchArticleList(true);
	}

	onRowClick(articleId) {
		invoiz.router.navigate(`/article/${articleId}`);
	}

	onDropdownEntryClick(article, entry) {
		const { resources } = this.props;
		switch (entry.action) {
			case 'edit':
				setTimeout(() => {
					invoiz.router.navigate(`/article/edit/${article.id}`);
				});
				break;

			case 'delete':
				ModalService.open(`${resources.articleDeleteConfirmText} ${resources.str_undoneMessage}`, {
					width: 500,
					headline: resources.articleDelete,
					cancelLabel: resources.str_abortStop,
					confirmIcon: 'icon-trashcan',
					confirmLabel: resources.str_clear,
					confirmButtonType: 'secondary',
					onConfirm: () => {
						ModalService.close();
						this.props.deleteArticle(article.id);
					}
				});
				break;
		}
	}

	onPaginate(page) {
		this.props.paginateArticleList(page);
		window.scrollTo(0, 0);
	}

	onSort(column) {
		this.props.sortArticleList(column);
	}

	onSearch(searchText) {
		this.props.searchArticleList(searchText);
	}

	createArticle() {
		invoiz.router.navigate('/article/new');
	}

	createTableRows(articles) {
		const rows = [];
		const { resources } = this.props;
		const { canUpdateArticle, canDeleteArticle } = this.state;
		const dropdownEntries = [
			{
				dataQsId: `article-list-item-dropdown-entry-edit`,
				label: resources.str_toEdit,
				action: 'edit'
			},
			{
				dataQsId: `article-list-item-dropdown-entry-delete`,
				label: resources.str_clear,
				action: 'delete'
			}
		];
		let dropdown;
		if (articles) {
			articles.forEach((article, index) => {
				if (canUpdateArticle && canDeleteArticle) {
					dropdown = (
						<div
							className="article-list-cell-dropdown icon icon-arr_down"
							id={`article-list-dropdown-anchor-${index}`}
						>
							<PopoverComponent
								showOnClick={true}
								contentClass={`article-list-cell-dropdown-content`}
								entries={[dropdownEntries]}
								onClick={entry => this.onDropdownEntryClick(article, entry)}
								elementId={`article-list-dropdown-anchor-${index}`}
								offsetLeft={-3}
								offsetTop={10}
							/>
						</div>
					);
				}				
				rows.push({
					id: article.id,
					selected: article.selected,
					article,
					cells: [
						{ value: article.number },
						{ value: article.title },
						{ value: article.hsnSacCode },
						{ value: formatCurrency(article.price) },
						{ value: formatCurrency(article.priceGross) },
						{ value: dropdown }
					]
				});
			});
		}

		return rows;
	}
}

const mapStateToProps = state => {
	const {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		allSelected,
		selectedItems,
		articleListData,
		searchText
	} = state.article.articleList;

	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		allSelected,
		selectedItems,
		articleListData,
		searchText,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchArticleList: reset => {
			dispatch(fetchArticleList(reset));
		},
		paginateArticleList: page => {
			dispatch(paginateArticleList(page));
		},
		sortArticleList: column => {
			dispatch(sortArticleList(column));
		},
		searchArticleList: searchText => {
			dispatch(searchArticleList(searchText));
		},
		deleteArticle: id => {
			dispatch(deleteArticle(id));
		},
		selectArticle: (id, checked) => {
			dispatch(selectArticle(id, checked));
		},
		selectAllArticles: selected => {
			dispatch(selectAllArticles(selected));
		},
		deleteSelectedArticles: () => {
			dispatch(deleteSelectedArticles());
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(ArticleListComponent);
