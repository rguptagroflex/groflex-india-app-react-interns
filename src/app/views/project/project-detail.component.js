import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import { createDetailViewInvoiceListObjects } from 'helpers/invoice/createDetailViewInvoiceListObjects';
import ProjectAction from 'enums/project/project-action.enum';
import ListComponent from 'shared/list/list.component';
import NotesComponent from 'shared/notes/notes.component';
import TopbarComponent from 'shared/topbar/topbar.component';
import DetailViewHeadComponent from 'shared/detail-view/detail-view-head.component';
import PopoverComponent from 'shared/popover/popover.component';
import Direction from 'enums/direction.enum';
import { formatCurrency } from 'helpers/formatCurrency';
import { format } from 'util';
import { Link } from 'react-router-dom';

const createTopbarButtons = (project, resources) => {
	const buttons = [];

	if (project.permissions.allowDepositInvoice) {
		buttons.push({
			type: 'primary',
			label: resources.str_partialInvoice,
			buttonIcon: 'icon-plus',
			action: ProjectAction.CREATE_DEPOSIT_INVOICE,
			dataQsId: 'projectDetail-topbar-btn-createDepositInvoice'
		});
	}

	if (project.permissions.allowClosingInvoice) {
		buttons.push({
			type: 'primary',
			label: resources.str_financialStatement,
			buttonIcon: 'icon-plus',
			action: ProjectAction.CREATE_CLOSING_INVOICE,
			dataQsId: 'projectDetail-topbar-btn-createClosingInvoice'
		});
	} else if (project.canBeEdited) {
		buttons.push({
			type: 'default',
			label: resources.str_toEdit,
			buttonIcon: 'icon-edit2',
			action: ProjectAction.EDIT,
			dataQsId: 'projectDetail-topbar-btn-edit'
		});
	}

	return buttons;
};

const createTopbarDropdown = (project, resources) => {
	const items = [];

	if (project.permissions.allowClosingInvoice && project.canBeEdited) {
		items.push([{ label: resources.str_toEdit, action: ProjectAction.EDIT, dataQsId: 'project-topbar-popoverItem-copy' }]);
	}

	return items;
};

const createDetailViewHeadObjects = (project, resources) => {
	const object = {
		leftElements: [],
		rightElements: [],
		actionElements: []
	};

	let description = null;
	let descriptionText = project.description;
	let tooltip = null;

	if (descriptionText) {
		descriptionText = descriptionText.replace(/<(?:.|\n)*?>/gm, '');

		if (descriptionText.length > 40) {
			descriptionText = descriptionText.substring(0, 40) + ' ...';
			tooltip = (
				<PopoverComponent
					text={project.description}
					offsetTop={20}
					offsetLeft={-10}
					arrowAlignment={Direction.LEFT}
					contentClass={'detail-view-project-popover-content'}
					alignment={Direction.LEFT}
					showOnHover={true}
					elementId={'detail-view-project-subvalue'}
				/>
			);
		}
		description = (
			<div className="detail-view-project-description">
				<div className={'detail-view-project-text'} dangerouslySetInnerHTML={{ __html: descriptionText }} />{' '}
				{tooltip}
			</div>
		);
	}

	let offer = null;
	if (project.offerId && project.offerNumber) {
		offer = (
			<div>
				{resources.str_offer}: <Link to={`/offer/${project.offerId}`}>{project.offerNumber}</Link>
			</div>
		);
	}

	let subValue = null;
	if (offer && description) {
		subValue = (
			<div id="detail-view-project-subvalue" className="detail-view-project-has-offer-and-description">
				{offer}
				{description}
			</div>
		);
	} else {
		subValue = <div id="detail-view-project-subvalue">{offer || description || null}</div>;
	}

	object.leftElements.push({
		headline: 'Titel',
		value: project.title,
		subValue
	});

	const amount = formatCurrency(project.budget);
	const outstandingBudget = formatCurrency(project.outstandingBudget);
	const paidAmount = formatCurrency(project.appliedPayments);

	object.rightElements.push(
		{
			headline: resources.str_start,
			value: project.displayStartDate || '-'
		},
		{
			headline: resources.str_budget,
			value: amount
		},
		{
			headline: resources.str_residualValue,
			value: outstandingBudget
		},
		{
			headline: resources.str_paid,
			value: paidAmount
		}
	);

	return object;
};

class ProjectDetailComponent extends React.Component {
	constructor(props) {
		super(props);

		const project = this.props.project || {};

		this.state = {
			viewportWidth: window.innerWidth,
			project
		};
	}

	render() {
		const { resources } = this.props;
		const topbarButtons = createTopbarButtons(this.state.project, resources);
		const topbarDropdownItems = createTopbarDropdown(this.state.project, resources);
		const headContents = createDetailViewHeadObjects(this.state.project, resources);
		const invoicesTable = createDetailViewInvoiceListObjects(this.state.project.invoices);

		const detailHeadContent = (
			<DetailViewHeadComponent
				leftElements={headContents.leftElements}
				rightElements={headContents.rightElements}
			/>
		);

		return (
			<div className="project-detail-wrapper wrapper-has-topbar">
				<TopbarComponent
					title={resources.str_project}
					buttonCallback={(event, button) => this.handleTopbarButtonClick(event, button)}
					backButtonRoute={'invoices/project'}
					dropdownEntries={topbarDropdownItems.length > 0 ? topbarDropdownItems : null}
					dropdownCallback={entry => this.handleTopbarDropdownClick(entry)}
					buttons={topbarButtons}
				/>

				<div className="detail-view-head-container">{detailHeadContent}</div>

				<div className="detail-view-document" style={{ visibility: 'hidden' }} />

				<div className="detail-view-box">
					<ListComponent
						title={resources.str_createdBills}
						clickable={true}
						rowCallback={id => this.onInvoiceRowClick(id)}
						columns={invoicesTable.columns}
						rows={invoicesTable.rows}
						tableId={`invoices`}
						resources={resources}
					/>
				</div>

				<div className="detail-view-box">
					<NotesComponent
						heading={resources.str_remarks}
						data={{ notes: this.state.project.notes }}
						onSave={value => this.onNotesChange(value.notes)}
						resources={resources}
						placeholder={format(resources.defaultCommentsPlaceholderText, resources.str_projectSmall)}
						defaultFocus={true}
					/>
				</div>
			</div>
		);
	}

	onNotesChange(notes) {
		invoiz.request(`${config.project.resourceUrl}/${this.state.project.id}/notes`, {
			auth: true,
			method: 'PUT',
			data: {
				notes
			}
		});
	}

	onInvoiceRowClick(invoiceId) {
		invoiz.router.navigate(`/invoice/${invoiceId}`);
	}

	edit() {
		invoiz.router.navigate(`/project/edit/${this.state.project.id}`);
	}

	handleTopbarButtonClick(event, button) {
		switch (button.action) {
			case ProjectAction.CREATE_DEPOSIT_INVOICE:
				invoiz.router.navigate(`/depositInvoice/new/${this.state.project.id}`);
				break;

			case ProjectAction.CREATE_CLOSING_INVOICE:
				invoiz.router.navigate(`/closingInvoice/new/${this.state.project.id}`);
				break;

			case ProjectAction.EDIT:
				this.edit();
				break;
		}
	}

	handleTopbarDropdownClick(item) {
		switch (item.action) {
			case ProjectAction.EDIT:
				this.edit();
				break;
		}
	}
}

export default ProjectDetailComponent;
