import invoiz from 'services/invoiz.service';
import React from 'react';
import TopbarComponent from 'shared/topbar/topbar.component';
import {
	fetchTimetrackingList,
	sortTimetrackingList,
	paginateTimetrackingList,
	filterTimetrackingList,
	deleteTimetracking,
	searchTimetrackingList
} from 'redux/ducks/timetracking/timetrackingList';
import { connect } from 'react-redux';
import ListComponent from 'shared/list/list.component';
import ListSearchComponent from 'shared/list-search/list-search.component';
import PaginationComponent from 'shared/pagination/pagination.component';
import FilterComponent from 'shared/filter/filter.component';
import ButtonComponent from 'shared/button/button.component';
import userPermissions from 'enums/user-permissions.enum';

class TimetrackingListComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			canCreateTimesheet: null,
			canUpdateTimesheet: null,
			canDeleteTimesheet: null
		};
	}
	componentDidMount() {
		if (!invoiz.user.hasPermission(userPermissions.VIEW_TIMESHEET)) {
			invoiz.user.logout(true);
		}
		this.props.fetchTimetrackingList(true);
		this.setState({			
			canCreateTimesheet: invoiz.user && invoiz.user.hasPermission(userPermissions.CREATE_TIMESHEET),
			canUpdateTimesheet: invoiz.user && invoiz.user.hasPermission(userPermissions.UPDATE_TIMESHEET),
			canDeleteTimesheet: invoiz.user && invoiz.user.hasPermission(userPermissions.DELETE_TIMESHEET)
		});
	}

	render() {
		const {
			isLoading,
			columns,
			currentPage,
			totalPages,
			filterItems,
			timetrackingListData: { timetrackings, meta },
			searchText,
			resources
		} = this.props;

		const { canCreateTimesheet, canDeleteTimesheet, canUpdateTimesheet } = this.state;

		const tableRows = this.createTableRows(timetrackings);
		const allCount = meta && meta.filter && meta.filter.default && meta.filter.default.count;

		const listContent = (
			<div>
				<ListComponent
					clickable={true}
					rowCallback={(timetrackingId, row) => this.onRowClick(timetrackingId, row)}
					sortable={true}
					columns={columns}
					rows={tableRows}
					columnCallback={column => this.onSort(column)}
					resources={resources}
				/>

				{totalPages > 1 ? (
					<div className="timetracking-list-pagination">
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
				<div className="text-placeholder icon icon-timetracking" />
				<div className="text-h2">{resources.timetrackingListHeadingText}</div>
				<div className="">{resources.timetrackingCreateNow}</div>
				<ButtonComponent
					label={resources.str_hereWeGo}
					buttonIcon="icon-plus"
					dataQsId="empty-list-create-button"
					callback={() => invoiz.router.navigate('/timetracking/new')}
					disabled={!canCreateTimesheet}
				/>
			</div>
		);

		const topbar = (
			<TopbarComponent
				title={resources.str_timesheets}
				viewIcon={`icon-timetracking`}
				buttonCallback={() => this.createTimetracking()}
				buttons={[
					{
						type: 'primary',
						label: resources.str_recordTime,
						buttonIcon: 'icon-plus'
					}
				]}
			/>
		);

		return (
			<div className="timetracking-list-component-wrapper">
				{topbar}

				<div className="timetracking-list-head">
					<div className="timetracking-list-head-content">
						<ListSearchComponent
							value={searchText}
							placeholder={resources.timetrackingSearchText}
							onChange={val => this.onSearch(val)}
						/>

						{isLoading ? null : allCount > 0 ? (
							<FilterComponent items={filterItems} onChange={filter => this.onFilterList(filter)} resources={resources} />
						) : null}
					</div>
				</div>

				<div className="box timetracking-list-wrapper">
					{isLoading ? null : allCount > 0 ? (
						listContent
					) : searchText.trim().length > 0 ? (
						<div className="empty-list-box">{resources.timetrackingEmptyListText}</div>
					) : isLoading ? null : (
						emptyListContent
					)}
				</div>
			</div>
		);
	}

	onRowClick(timetrackingId, row) {
		const { timetracking } = row;

		invoiz.router.navigate(
			`/timetracking/${timetracking.status !== 'invoiced' ? 'billing' : 'billed'}/customer/${
				timetracking.customer.id
			}`
		);
	}

	onFilterList(filter) {
		this.props.filterTimetrackingList(filter);
	}

	onPaginate(page) {
		this.props.paginateTimetrackingList(page);
		window.scrollTo(0, 0);
	}

	onSort(column) {
		this.props.sortTimetrackingList(column);
	}

	onSearch(searchText) {
		this.props.searchTimetrackingList(searchText);
	}

	createTimetracking() {
		invoiz.router.navigate('/timetracking/new');
	}

	createTableRows(timetrackings) {
		const rows = [];

		if (timetrackings) {
			timetrackings.forEach((timetracking, index) => {
				rows.push({
					id: timetracking.id,
					timetracking,
					selected: false,
					cells: [
						{ value: timetracking.customer.name },
						{ value: timetracking.displayEffort },
						{ value: timetracking.trackedTimeString },
						{ value: timetracking.summedUpCost }
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
		timetrackingListData,
		searchText
	} = state.timetracking.timetrackingList;
	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		filterItems,
		timetrackingListData,
		searchText,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchTimetrackingList: reset => {
			dispatch(fetchTimetrackingList(reset));
		},
		paginateTimetrackingList: page => {
			dispatch(paginateTimetrackingList(page));
		},
		sortTimetrackingList: column => {
			dispatch(sortTimetrackingList(column));
		},
		filterTimetrackingList: filterItem => {
			dispatch(filterTimetrackingList(filterItem));
		},
		searchTimetrackingList: searchText => {
			dispatch(searchTimetrackingList(searchText));
		},
		deleteTimetracking: id => {
			dispatch(deleteTimetracking(id));
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(TimetrackingListComponent);
