import invoiz from 'services/invoiz.service';
import React from 'react';
import TopbarComponent from 'shared/topbar/topbar.component';
import {
	fetchProjectList,
	sortProjectList,
	searchProjectList,
	paginateProjectList,
	filterProjectList,
	deleteProject
} from 'redux/ducks/project/projectList';
import { connect } from 'react-redux';
import ListComponent from 'shared/list/list.component';
import { formatCurrency } from 'helpers/formatCurrency';
import PaginationComponent from 'shared/pagination/pagination.component';
import FilterComponent from 'shared/filter/filter.component';
import ButtonComponent from 'shared/button/button.component';
import ListSearchComponent from 'shared/list-search/list-search.component';

class ProjectListComponent extends React.Component {
	componentDidMount() {
		this.props.fetchProjectList(true);
	}

	render() {
		const {
			isLoading,
			columns,
			currentPage,
			totalPages,
			filterItems,
			projectListData: { projects, meta },
			searchText,
			resources
		} = this.props;

		const tableRows = this.createTableRows(projects);
		const allCount = meta && meta.filter && meta.filter.all && meta.filter.all.count;

		const listContent = (
			<div>
				<ListComponent
					clickable={true}
					rowCallback={projectId => this.onRowClick(projectId)}
					sortable={true}
					columns={columns}
					rows={tableRows}
					columnCallback={column => this.onSort(column)}
					resources={resources}
				/>

				{totalPages > 1 ? (
					<div className="project-list-pagination">
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
				<div className="text-placeholder icon icon-rechnung" />
				<div className="text-h2">{resources.projectEmptyListHeadingText}</div>
				<div className="">{resources.projectCreateNow}</div>
				<ButtonComponent
					label={resources.str_hereWeGo}
					buttonIcon="icon-plus"
					dataQsId="empty-list-create-button"
					callback={() => invoiz.router.navigate('/project/new')}
				/>
			</div>
		);

		const topbar = (
			<TopbarComponent
				title={resources.str_discounts}
				viewIcon={`icon-rechnung`}
				buttonCallback={() => this.createProject()}
				buttons={[
					{
						type: 'primary',
						label: resources.projectCreateText,
						buttonIcon: 'icon-plus'
					}
				]}
			/>
		);

		return (
			<div className="project-list-component-wrapper">
				{topbar}

				<div className="project-list-head">
					<div className="project-list-head-content">
						<ListSearchComponent
							value={searchText}
							placeholder={resources.projectSearch}
							onChange={val => this.onSearch(val)}
						/>
						{isLoading ? null : allCount > 0 ? (
							<FilterComponent items={filterItems} onChange={filter => this.onFilterList(filter)} resources={resources} />
						) : null}{' '}
					</div>
				</div>

				<div className="box project-list-wrapper">
					{isLoading ? null : allCount > 0 ? (
						listContent
					) : searchText.trim().length > 0 ? (
						<div className="empty-list-box">{resources.projectEmptyListText}</div>
					) : isLoading ? null : (
						emptyListContent
					)}
				</div>
			</div>
		);
	}

	onRowClick(projectId) {
		invoiz.router.navigate(`/project/${projectId}`);
	}

	onFilterList(filter) {
		this.props.filterProjectList(filter);
	}

	onPaginate(page) {
		this.props.paginateProjectList(page);
		window.scrollTo(0, 0);
	}

	onSort(column) {
		this.props.sortProjectList(column);
	}

	onSearch(searchText) {
		this.props.searchProjectList(searchText);
	}

	createProject() {
		invoiz.router.navigate('/project/new');
	}

	createTableRows(projects) {
		const rows = [];

		if (projects) {
			projects.forEach(project => {
				rows.push({
					id: project.id,
					project,
					selected: false,
					additionalClass: project.state,
					cells: [
						{ value: project.title },
						{ value: project.displayCustomerName },
						{ value: project.displayStartDate },
						{ value: formatCurrency(project.budget) }
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
		filterItems,
		projectListData,
		searchText
	} = state.project.projectList;
	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		filterItems,
		projectListData,
		searchText,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchProjectList: reset => {
			dispatch(fetchProjectList(reset));
		},
		paginateProjectList: page => {
			dispatch(paginateProjectList(page));
		},
		sortProjectList: column => {
			dispatch(sortProjectList(column));
		},
		searchProjectList: searchText => {
			dispatch(searchProjectList(searchText));
		},
		filterProjectList: filterItem => {
			dispatch(filterProjectList(filterItem));
		},
		deleteProject: id => {
			dispatch(deleteProject(id));
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(ProjectListComponent);
