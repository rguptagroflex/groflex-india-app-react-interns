import React from 'react';
import invoiz from 'services/invoiz.service';
import TopbarComponent from 'shared/topbar/topbar.component';
import ButtonComponent from 'shared/button/button.component';
import { connect } from 'react-redux';

import userPermissions from 'enums/user-permissions.enum';

class DataImportOverviewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			canImportContacts: invoiz.user && invoiz.user.hasPermission(userPermissions.CUSTOMER_IMPORT),
			canImportArticle: invoiz.user && invoiz.user.hasPermission(userPermissions.ARTICLE_IMPORT)
		};
	}
	render() {
		const { resources } = this.props;
		const { canImportArticle, canImportContacts } = this.state;
		return (
			<div className="data-import-overview-component">
				<TopbarComponent title="Import" viewIcon="icon-settings" />

				<div className="data-import-type">
					<div className="icon icon-customer data-import-type-icon" />
					<ButtonComponent
						callback={() => this.onCustomerImportClick()}
						label={resources.str_importContact}
						buttonIcon="icon-plus"
						disabled={!canImportContacts}
					/>
				</div>

				<div className="data-import-type">
					<div className="icon icon-article data-import-type-icon" />
					<ButtonComponent
						callback={() => this.onArticleImportClick()}
						label={resources.str_importArticle}
						buttonIcon="icon-plus"
						disabled={!canImportArticle}
					/>
				</div>
			</div>
		);
	}

	onCustomerImportClick() {
		invoiz.router.navigate('/settings/data-import/customers/1');
	}

	onArticleImportClick() {
		invoiz.router.navigate('/settings/data-import/articles/1');
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return {
		resources
	};
};

export default connect(mapStateToProps)(DataImportOverviewComponent);
