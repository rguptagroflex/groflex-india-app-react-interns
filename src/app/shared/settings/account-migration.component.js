import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import ButtonComponent from 'shared/button/button.component';
import { errorCodes } from 'helpers/constants';

const { INVALID } = errorCodes;

class AccountMigrationComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			currentPage: 1,
			totalPages: 0,
			limit: 20,
			error: '',
			currentProgress: ''
		};
	}
	async onAccountMigrateClicked() {
		const { currentPage, limit} = this.state;
		const offset = (currentPage - 1) * limit;
		const queryString = `?offset=${offset}&limit=${limit}&orderBy=tenantId&desc='desc'&planId=migration`;
		this.setState({ currentProgress: `fetching.... offset: ${offset} ` });
		await invoiz
			.request(`${config.resourceHost}admin/users${queryString}`, {
				auth: true
			})
			.then(async ({ body: { data, meta } }) => {
				const users = data; // todo: User / AdminPanelUser Class
				const totalPages = Math.ceil(meta.count / limit);
				this.setState({ totalPages: totalPages, currentProgress: `Completed User Get total ${users.length} ` });
			})
			.catch(() => {
				let message = 'An error ocures when user fetch'
				invoiz.page.showToast({ type: 'error', message });
				this.setState({ error: message });
			});
	}
	onAccountMigrateNextClicked() {
		const { currentPage } = this.state;
		const count = currentPage + 1;
		this.setState({ currentPage: count });
	}

	async onExpenseMigrateClicked() {
		const { currentPage, limit} = this.state;
		const offset = (currentPage - 1) * limit;
		const queryString = `?offset=${offset}&limit=${limit}&orderBy=tenantId&desc='desc'&planId=expensemigration`;
		this.setState({ currentProgress: `fetching.... offset: ${offset} ` });
		await invoiz
			.request(`${config.resourceHost}admin/users${queryString}`, {
				auth: true
			})
			.then(async ({ body: { data, meta } }) => {
				const users = data; // todo: User / AdminPanelUser Class
				const totalPages = Math.ceil(meta.count / limit);
				this.setState({ totalPages: totalPages, currentProgress: `Completed User Get total ${users.length} ` });
			})
			.catch(() => {
				let message = 'An error ocures when user fetch'
				invoiz.page.showToast({ type: 'error', message });
				this.setState({ error: message });
			});
	}

	render() {
		const { currentPage, totalPages, currentProgress, error } = this.state;
		return (
			<div className="settings-accountmigration-component">
				<div className="row u_pt_20"> {/*u_pt_60 u_pb_40 */}
					<div className="col-xs-12 text-h4 u_pb_20">Account Migration Component</div>
					<div className="col-xs-12">
						{/* <div className="col-xs-12"> */}
							{/* <div className="row">
								<div className="col-xs-12 deleteaccount-info">
									<b>TotalPages</b> : {totalPages} <br></br>
									<br></br>
									<b>CurrentPage</b> : {currentPage}
								</div>
							</div>
							<div className="row">
								<div className="col-xs-12 deleteaccount-info">
								<b>Current progress..</b> : {currentProgress} <br></br>
									<br></br>
									<b>error</b> : {error}
								</div>
							</div>
							<div className="row">
								<div className="col-xs-6 col-xs-offset-6">
									<ButtonComponent
										buttonIcon={'icon-check'}
										type="primary"
										callback={() => this.onAccountMigrateNextClicked()}
										label="Next Page"	
									/>
									<br></br>
									<br></br>
									<ButtonComponent
										buttonIcon={'icon-check'}
										type="primary"
										callback={() => this.onAccountMigrateClicked()}
										label="Start Migrate"	
									/>
								</div>
							</div> */}
							<div className="row">
								<div className="col-xs-12">
									<ButtonComponent
										buttonIcon={'icon-check'}
										type="primary"
										callback={() => this.onExpenseMigrateClicked()}
										label="Start Expense Migration"	
									/>
								</div>
							</div>
						{/* </div>						 */}
					</div>
				</div>
			</div>
		);
	}
}

export default AccountMigrationComponent;
