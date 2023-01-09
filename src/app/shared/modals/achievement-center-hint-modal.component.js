import invoiz from 'services/invoiz.service';
import React from 'react';
import { format } from 'util';

class AchievementCenterHintModalComponent extends React.Component {
	navigateToPage(url) {
		const { closeModal } = this.props;
		invoiz.router.navigate(url);
		closeModal && closeModal();
	}

	triggerTaxEstimationModal() {
		const { closeModal } = this.props;
		invoiz.router.navigate('/');

		setTimeout(() => {
			invoiz.trigger('triggerDashboardTaxEstimationModal');
			closeModal && closeModal();
		}, 100);
	}

	render() {
		const { achievementRank, maxPoints, resources } = this.props;

		return (
			<div className="achievement-center-hint-modal-component">
				<div className="background-box">
					<h1 className="headline">{format(resources.achievementModdalHeadline, achievementRank)}</h1>
					<p className="claim">{format(resources.achievementMaxPointsText, maxPoints)}</p>
				</div>

				<div className="content-box">
					<div className="hint-box">
						<div className="hint-points">
							<div className="row1">15</div>
							<div className="row2">{resources.str_pts}</div>
						</div>

						<div className="middle-border" />

						<div className="hint-rules">
							<div className="hint-row" onClick={() => this.navigateToPage('/article/new')}>
								<span className="link">
									<span>{resources.str_per}</span> <strong>{resources.achievementHintRuleArticles}</strong>
								</span>
							</div>
							<div className="hint-row" onClick={() => this.navigateToPage('/expense/new')}>
								<span className="link">
									<span>{resources.str_per}</span> <strong>{resources.achievementHintRuleExpenses}</strong>
								</span>
							</div>
							<div className="hint-row" onClick={() => this.navigateToPage('/settings/document-export')}>
								<span className="link">
									<span>{resources.str_per}</span> <strong>{resources.achievementHintRuleTaxConsultant}</strong>
								</span>
							</div>
						</div>
					</div>

					<div className="hint-box">
						<div className="hint-points">
							<div className="row1">20</div>
							<div className="row2">{resources.str_pts}</div>
						</div>

						<div className="middle-border" />

						<div className="hint-rules">
							<div className="hint-row" onClick={() => this.navigateToPage('/offer/new')}>
								<span className="link">
									<span>{resources.str_per}</span> <strong>{resources.achievementhintOffers}</strong>
								</span>
							</div>
							<div className="hint-row" onClick={() => this.navigateToPage('/customer/new')}>
								<span className="link">
									<span>{resources.str_per}</span> <strong>{resources.achievementhintCustomers}</strong>
								</span>
							</div>
							<div className="hint-row" onClick={() => this.triggerTaxEstimationModal()}>
								<span className="link">
									<strong>{resources.achievementhintTax}</strong>
								</span>
							</div>
						</div>
					</div>

					<div className="hint-box">
						<div className="hint-points">
							<div className="row1">25</div>
							<div className="row2">{resources.str_pts}</div>
						</div>

						<div className="middle-border" />

						<div className="hint-rules">
							<div className="hint-row" onClick={() => this.navigateToPage('/invoice/new')}>
								<span className="link">
									<span>{resources.str_per}</span> <strong>{resources.achievementhintInvoices}</strong>
								</span>
							</div>
							<div className="hint-row" onClick={() => this.navigateToPage('/invoices')}>
								<span className="link">
									<span>{resources.str_per}</span> <strong>{resources.achievementhintPayment}</strong>
								</span>
							</div>
							<div className="hint-row">
								<span>{resources.str_per}</span> <strong>{resources.achievementhintLogin}</strong>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default AchievementCenterHintModalComponent;
