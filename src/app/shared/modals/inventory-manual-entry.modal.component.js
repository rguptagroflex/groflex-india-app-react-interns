import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import ModalService from 'services/modal.service';
import ButtonComponent from 'shared/button/button.component';
import LetterPositionsHeadComponent from 'shared/letter/letter-positions-head-inventory-manual.component.js';
import LetterPositionsInventoryManualComponent from 'shared/letter/letter-positions-inventory-manual.component.js';
import inventoryActionEnum from '../../enums/inventory/inventory-action.enum';

class InventoryManualEntryModalComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			columns: [
				{	active: true,
					editable: false,
					label: "Article name",
					name: "title"
				},
				
				{	active: true,
					editable: false,
					label: "Action",
					name: "action"
				},
				{	active: true,
					editable: false,
					label: "Quantity",
					name: "quantity"
				},
				// {	active: true,
				// 	editable: false,
				// 	label: "Sender/Receiver",
				// 	name: "customer"
				// },
				{	active: true,
					editable: false,
					label: "Date Modified",
					name: "itemModifiedDate"
				},
				{	active: true,
					editable: false,
					label: "Purchase price",
					name: "purchasePrice"
				},
				{	active: true,
					editable: false,
					label: "Sales price",
					name: "salesPrice"
				}
			],
			positions: [],
			miscOptions: {
				inventoryActions: [inventoryActionEnum.INCOMING, inventoryActionEnum.OUTGOING],
				customers: null
			},
			customersList: null,
			trackedArticlesInventory: null,
			isLoading: true
		};
	}

	componentDidMount() {
		invoiz
		.request(`${config.resourceHost}/customer/`, { auth: true, method: 'GET' })
		.then(({ body: { data } }) => {
			this.setState({customersList: data}, () => {
				let payeeList = this.state.customersList.filter((customer) => {
					return customer.type === "payee"
				})
				this.setState({miscOptions: {...this.state.miscOptions, customers: payeeList}})
			})
			invoiz
			.request(`${config.resourceHost}inventory/?offset=0&searchText=&limit=9999999&orderBy=articleId&desc=false`, { auth: true, method: 'GET' })
			.then(({ body: { data } }) => {
				this.setState({trackedArticlesInventory: data, isLoading: false});
			}).catch((error)=>{
				invoiz.showNotification({ type: 'error', message: 'Something went wrong!' });
			})
		});


	}

	onLetterPositionsChange(positions) {
		this.setState({positions});
	}

	onFetchCustomers(action) {
		if (action.name === inventoryActionEnum.INCOMING) {
			let payeeList = this.state.customersList.filter((customer) => {
				return customer.type === "payee"
			})
			this.setState({miscOptions: {...this.state.miscOptions, customers: payeeList}})
		} else if (action.name === inventoryActionEnum.OUTGOING) {
			let customerList = this.state.customersList.filter((customer) => {
				return customer.type === "customer"
			})
			this.setState({miscOptions: {...this.state.miscOptions, customers: customerList}})
		}
	}

	handleSubmitClick () {
		const { positions } = this.state;
		const { onClose } = this.props;
		invoiz.request(`${config.resourceHost}inventory/`, {
			auth: true,
			method: 'PUT',
			data: {
				positions
			}
		}).then((response) => {
			onClose(response.body.data);
		}).catch(() => {
			invoiz.showNotification({ type: 'error', message: 'Could not add entries!' });
		})
		// const { seats } = this.state;
		// const { planId, tenant } = this.props;
		// const seatValues = { seats, pendingSeatInvites: seats };
		// const { resources } = this.props;
		// this.setState({
		// 	isLoading: true
		// }, () => {
		// 	invoiz.request(`${config.resourceHost}user/buyusers`, {
		// 		auth: true,
		// 		method: 'POST',
		// 		data: {
		// 			tenant,
		// 			seatValues,
		// 			planId
		// 		}
		// 	}).then((response) => {
		// 		this.props.onConfirm && this.props.onConfirm(seats, false, false);
		// 		this.setState(
		// 			{
		// 				isLoading: false
		// 			},
		// 			() => {
		// 				ModalService.close();
		// 			}
		// 		);
		// 	}).catch((response) => {
		// 		invoiz.showNotification({ type: 'error', message: 'Payment failed!' });
		// 		ModalService.close();
		// 	});
		// });
	}

	render() {
		const { isLoading, resources, tenantId } = this.props;
		return (
			<div className="inventory-manual-entry-modal">
			<div className="has-footer ">
				<div className="user-invite-modal-content" style={{height: 800}}>
                    <div className="user-invite-modal-headline text-semibold">New manual entry</div>
					<span style={{fontWeight: 600, fontSize: 13}}>Note: </span><span style={{fontSize: 13}}>Adding untracked articles will automatically track them in stock movement</span>
                    <div className="inventory-manual-body">
					<LetterPositionsHeadComponent
						positions={this.state.positions}
						columns={this.state.columns}
						onPositionsChanged={positions => this.onLetterPositionsChange(positions)}
						// onColumnsClose={columns => this.onLetterPositionsColumnsChange(columns)} 
					/>
					{!this.state.isLoading ? 					<LetterPositionsInventoryManualComponent
								columns={this.state.columns}
								positions={this.state.positions}
								onPositionsChanged={positions => this.onLetterPositionsChange(positions)}
								resources={resources}
								miscOptions={this.state.miscOptions}
								onFetchCustomers={(action) => this.onFetchCustomers(action)}
								trackedArticlesInventory={this.state.trackedArticlesInventory}
							//	activeComponent={this.state.activeComponent}				
					/> : null }

					</div>
                    <div className="modal-base-footer">
                        		<div className="modal-base-cancel">
                        			<ButtonComponent
                        				type="cancel"
                        				callback={() => ModalService.close()}
                        				label={resources.str_cancel}
                        				dataQsId="manual-entries-btn-close"
                        				// loading={isLoading}
                        			/>
                        		</div>
                        		<div className="modal-base-confirm">
                        			<ButtonComponent
                        				type="primary"
                        				callback={() => this.handleSubmitClick()}
                        				label={'Add'}
                        				dataQsId="manual-entries-btn-add"
                        				//loading={isLoading}
                        				//disabled={seats === 0 || seats === '' || errors.seatQuantity !== ''}
                        			/>
                        		</div>
                        	</div>
				</div>
			</div>
			</div>

		);
	}
}

export default InventoryManualEntryModalComponent;
