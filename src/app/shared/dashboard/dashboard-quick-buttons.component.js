import React from 'react';
import invoiz from 'services/invoiz.service';
import ButtonComponent from 'shared/button/button.component';
// import ModalService from 'services/modal.service';
// import ReferralModalComponent from 'shared/modals/referral-modal.component';
// import { isPayingUser } from 'helpers/subscriptionHelpers';
import { connect } from 'react-redux';

class DashboardQuickButtonsComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			isLoading: true,
			isUpdate: false
		};

		invoiz.on('userModelSubscriptionDataSet', () => {
			if (this.refs.loadingRef || this.refs.wrapperRef) {
				this.setState({
					isLoading: false,
					isUpdate: true
				});
			}
		});
	}

	componentDidMount() {
		if (invoiz.user && invoiz.user.subscriptionData) {
			this.setState({ isLoading: false });
		}
	}

	// openReferralModal() {
	// 	const { resources } = this.props;
	// 	ModalService.open(<ReferralModalComponent resources={resources} />, {
	// 		width: 870,
	// 		padding: 0,
	// 		isCloseable: true,
	// 		resizePopupOnWindowResize: true,
	// 		modalClass: 'referral-modal-component-wrapper'
	// 	});
	// }

	render() {
		const { isLoading } = this.state;
		const { resources } = this.props;
		if (isLoading) {
			return <div ref="loadingRef" />;
		}

		// const content = isPayingUser() ? (
		// 	<div className="box-content">
		// 		<ButtonComponent
		// 			callback={() => {
		// 				invoiz.router.navigate('/invoice/new');
		// 			}}
		// 			label={resources.str_makeBill}
		// 			buttonIcon={'icon-plus'}
		// 		/>
		// 		<ButtonComponent
		// 			callback={() => {
		// 				invoiz.router.navigate('/timetracking/new');
		// 			}}
		// 			label={resources.str_recordTime}
		// 			buttonIcon={'icon-plus'}
		// 		/>
		// 		<ButtonComponent
		// 			callback={() => {
		// 				this.openReferralModal();
		// 			}}
		// 			label={resources.str_recommendThis}
		// 			buttonIcon={'icon-people'}
		// 			customCssClass={'referral-btn'}
		// 		/>
		// 	</div>
		// ) : (
		// 	<div className="box-content">
		// 		<ButtonComponent
		// 			callback={() => {
		// 				invoiz.router.navigate('/invoice/new');
		// 			}}
		// 			label={resources.str_makeBillText}
		// 			buttonIcon={'icon-plus'}
		// 		/>
		// 		<ButtonComponent
		// 			callback={() => {
		// 				invoiz.router.navigate('/offer/new');
		// 			}}
		// 			label={resources.str_createOffer}
		// 			buttonIcon={'icon-plus'}
		// 		/>
		// 		<ButtonComponent
		// 			callback={() => {
		// 				invoiz.router.navigate('/timetracking/new');
		// 			}}
		// 			label={resources.str_recordTime}
		// 			buttonIcon={'icon-plus'}
		// 		/>
		// 	</div>
		// );

		const content = (
			<div className="box-content">
				<ButtonComponent
					callback={() => {
						invoiz.router.navigate('/');
					}}
					label={resources.str_impressQuotation}
					buttonIcon={'icon-paint'}
					customCssClass={'referral-btn'}
				/>
				<ButtonComponent
					callback={() => {
						invoiz.router.navigate('/offer/new');
					}}
					label={resources.str_standardQuotation}
					buttonIcon={'icon-angebot_2'}
				/>
				<ButtonComponent
					callback={() => {
						invoiz.router.navigate('/invoice/new');
					}}
					label={resources.str_invoice}
					buttonIcon={'icon-plus'}
				/>
			</div>
		);

		return (
			<div className="row" ref="wrapperRef">
				<div className="col-xs-12">
					<div className="widgetContainer box box-large-bottom dashboard-quick-buttons">
						<div className="box-header">
							<div className="text-h5 u_mb_0">{resources.str_justStart}</div>
						</div>
						{content}
					</div>
				</div>
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;

	return { resources };
};

export default connect(
	mapStateToProps
)(DashboardQuickButtonsComponent);
