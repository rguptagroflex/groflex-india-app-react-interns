import React from 'react';
import {
	fetchAdminPanel,
	sortAdminPanel,
	paginateAdminPanel,
	selectAllUsers,
	selectUser,
	searchAdminPanel,
	filterAdminPanel,
	expandUserTrial,
	loginAsUser,
	setImpressLimit
} from 'redux/ducks/admin/adminPanel';
import { connect } from 'react-redux';
import ListComponent from 'shared/list/list.component';
import TopbarComponent from 'shared/topbar/topbar.component';
import PopoverComponent from 'shared/popover/popover.component';
import PaginationComponent from 'shared/pagination/pagination.component';
import { formatDate } from 'helpers/formatDate';
import FilterComponent from 'shared/filter/filter.component';
import ModalService from 'services/modal.service';
import AdminExpandTrialModal from 'shared/modals/admin-expand-trial-modal.component';
import AdminImpressLimitModal from 'shared/modals/admin-impress-limit-modal.component';
import ZohoPlan from 'enums/zoho-plan.enum';

class AdminPanelComponent extends React.Component {
	constructor(props) {
		super(props);

		this.searchTimer = null;
	}

	componentDidMount() {
		this.props.fetchAdminPanel(true);
	}

	render() {
		const {
			isLoading,
			columns,
			currentPage,
			totalPages,
			allSelected,
			adminPanelData: { users },
			filterItems,
			resources
		} = this.props;
		const tableRows = this.createTableRows(users);

		const listContent = (
			<div>
				<ListComponent
					allSelected={allSelected}
					selectable={false}
					selectedCallback={(id, isChecked) => this.onSelected(id, isChecked)}
					selectedAllCallback={isChecked => this.onAllSelected(isChecked)}
					clickable={false}
					sortable={true}
					columns={columns}
					rows={tableRows}
					emptyFallbackElement={resources.str_noUserFound}
					columnCallback={column => this.onSort(column)}
					resources={resources}
				/>

				{totalPages > 1 ? (
					<div className="admin-panel-pagination">
						<PaginationComponent
							currentPage={currentPage}
							totalPages={totalPages}
							onPaginate={page => this.onPaginate(page)}
						/>
					</div>
				) : null}
			</div>
		);

		const topbar = (
			<TopbarComponent
				title={resources.str_adminPanel}
				viewIcon={`icon-settings`}
				buttonCallback={(ev, button) => this.onTopbarButtonClick(button.action)}
			/>
		);

		return (
			<div className="admin-panel-component-wrapper">
				{topbar}

				<div className="admin-panel-head">
					<div className="admin-panel-head-content">
						<div className="icon icon-search" />
						<div className="input-search">
							<input
								type="text"
								placeholder={resources.str_searchTanents}
								onChange={evt => this.onSearchInput(evt)}
							/>
						</div>
						<FilterComponent
							hideCount={true}
							items={filterItems}
							onChange={filter => this.onFilterList(filter)}
							resources={resources}
						/>
					</div>
				</div>

				<div className="box admin-panel-list-wrapper">{isLoading ? null : listContent}</div>
			</div>
		);
	}

	onFilterList(filter) {
		this.props.filterAdminPanel(filter);
	}

	onSearchInput(event) {
		const {
			target: { value }
		} = event;
		clearTimeout(this.searchTimer);
		this.searchTimer = setTimeout(() => {
			this.props.searchAdminPanel(value);
		}, 1000);
	}

	onSelected(id, checked) {
		this.props.selectUser(id, checked);
	}

	onAllSelected(checked) {
		this.props.selectAllUsers(checked);
	}

	onDropdownEntryClick(user, entry) {
		const { expandUserTrial, loginAsUser, setImpressLimit, resources } = this.props;

		switch (entry.action) {
			case 'expandTrial':
				ModalService.open(
					<AdminExpandTrialModal
						user={user}
						onConfirm={date => {
							expandUserTrial(user, date);
						}}
						resources={resources}
					/>,
					{
						isCloseable: true,
						headline: resources.str_extentTestPhase,
						width: 500
					}
				);
				break;

			case 'loginAsUser':
				loginAsUser(user);
				break;

			case 'setImpressLimit':
				ModalService.open(
					<AdminImpressLimitModal
						user={user}
						onConfirm={limit => {
							setImpressLimit(user, limit);
						}}
						resources={resources}
					/>,
					{
						isCloseable: true,
						headline: resources.str_setImpressQuota,
						width: 500
					}
				);
				break;
		}
	}

	onPaginate(page) {
		this.props.paginateAdminPanel(page);
		window.scrollTo(0, 0);
	}

	onSort(column) {
		if (!column.notSortable) {
			this.props.sortAdminPanel(column);
		}
	}

	createTableRows(users) {
		const { resources } = this.props;
		const rows = [];

		if (users) {
			users.forEach((user, index) => {
				const dropdownEntries = [
					{
						dataQsId: `admin-panel-item-dropdown-entry-login-as-user`,
						label: resources.str_registerAsUser,
						action: 'loginAsUser'
					}
				];

				if (user.planId === ZohoPlan.TRIAL) {
					dropdownEntries.push({
						dataQsId: `admin-panel-item-dropdown-entry-expand-trial`,
						label: resources.str_extentTestPhase,
						action: 'expandTrial'
					});
				}

				// In imprezz india we do not allow to edit ImpressQuota limit
				// if (user.impressOfferLimit >= 0) {
				// 	dropdownEntries.push({
				// 		dataQsId: `admin-panel-item-dropdown-entry-increase-limit`,
				// 		label: resources.str_setImpressQuota,
				// 		action: 'setImpressLimit'
				// 	});
				// }

				const dropdown = (
					<div
						className="admin-panel-cell-dropdown icon icon-arr_down"
						id={`admin-panel-dropdown-anchor-${index}`}
					>
						<PopoverComponent
							showOnClick={true}
							contentClass={`admin-panel-cell-dropdown-content`}
							entries={[dropdownEntries]}
							onClick={entry => this.onDropdownEntryClick(user, entry)}
							elementId={`admin-panel-dropdown-anchor-${index}`}
							offsetLeft={-3}
							offsetTop={10}
						/>
					</div>
				);
				rows.push({
					id: user.tenantId,
					selected: user.selected,
					user,
					cells: [
						{ value: user.tenantId },
						{ value: user.email },
						{ value: user.state },
						{ value: user.planId },
						{ value: user.vendor },
						{ value: formatDate(user.trialEndAt) },
						{ value: user.impressOfferLimit },
						{ value: user.mobile },
						{ value: user.registrationStep },
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
		adminPanelData,
		filterItems
	} = state.admin.adminPanel;
	const { resources } = state.language.lang;

	return {
		isLoading,
		errorOccurred,
		columns,
		currentPage,
		totalPages,
		allSelected,
		selectedItems,
		adminPanelData,
		filterItems,
		resources
	};
};

const mapDispatchToProps = dispatch => {
	return {
		fetchAdminPanel: reset => {
			dispatch(fetchAdminPanel(reset));
		},
		paginateAdminPanel: page => {
			dispatch(paginateAdminPanel(page));
		},
		sortAdminPanel: column => {
			dispatch(sortAdminPanel(column));
		},
		searchAdminPanel: searchText => {
			dispatch(searchAdminPanel(searchText));
		},
		filterAdminPanel: filter => {
			dispatch(filterAdminPanel(filter));
		},
		selectUser: (id, checked) => {
			dispatch(selectUser(id, checked));
		},
		selectAllUsers: selected => {
			dispatch(selectAllUsers(selected));
		},
		expandUserTrial: (user, date) => {
			dispatch(expandUserTrial(user, date));
		},
		loginAsUser: user => {
			dispatch(loginAsUser(user));
		},
		setImpressLimit: (user, limit) => {
			dispatch(setImpressLimit(user, limit));
		}
	};
};

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(AdminPanelComponent);
