import React, { Component } from 'react';
import config from 'config';

import ModalService from 'services/modal.service';
import NumberInputComponent from 'shared/inputs/number-input/number-input.component';
import ButtonComponent from 'shared/button/button.component';
import invoiz from '../../../services/invoiz.service';
import inventoryActions from '../../../enums/inventory/inventory-action.enum';

class TrackArticleModal extends Component {
    constructor(props) {
        super(props);
        
        this.article = this.props.article;
        this.state = { 
            openingBalance: 0,
            minBalance: 0
        }
    }

    async onSave() {
        try {
            await this.createInventory();
            await this.updateArticle();
        } catch(error) {
            console.error(error);
        } finally {
            ModalService.close(true);
            this.props.onSuccess();

        }
    }

    async createInventory() {
        const url = `${config.resourceHost}inventory`;
        const data = {
            action: inventoryActions.INCOMING,
            articleId: this.article.id,
            source: '',
            lowStockAlert: false,
            openingBalance: this.state.openingBalance || 0,
            currentStock: this.state.openingBalance || 0,
            minimumBalance: this.state.minBalance || 0,
            category: this.category || "",
            price: this.article.price || 0,
            grossPrice: this.article.grossPrice || 0,
            purchasePrice: this.article.purchasePrice || 0,
            purchasePriceGross: this.article.purchasePriceGross || 0,
            quantity: this.state.openingBalance || 0,
            title: this.article.title,
            unit: this.article.unit,
            value: this.article.value || 0,
            vatPercent: this.article.vatPercent || 0
        };

        await invoiz.request(url, {auth: true, method: 'POST', data});
    }

    async updateArticle() {
        const url = `${config.resourceHost}article/${this.article.id}`;
        await invoiz.request(url, {auth: true, method: 'PUT', data: {...this.article, trackedInInventory: true}});
    }

    render() { 
        return ( 
            <div>
                <div style={{marginBottom: '40px'}}>
                    <NumberInputComponent
                        label="Article opening balance (in pcs.)"
                        value={this.state.openingBalance}
                        name="openingBalance"
                        isDecimal={false}
                        onChange={value => this.setState({openingBalance: value})}
                        defaultNonZero={false}
                    />
                    <NumberInputComponent
                        label="Article minimum balance (in pcs.)"
                        value={this.state.minBalance}
                        name="minimumBalance"
                        isDecimal={false}
                        onChange={value => this.setState({minBalance: value})}
                        defaultNonZero={false}
                    />
                </div>
                <div className="modal-base-footer">
                    <div className="modal-base-cancel">
                        <ButtonComponent
                            type="cancel"
                            callback={() => ModalService.close(true)}
                            label="Cancel"
                            dataQsId="modal-btn-cancel"
                        />
                    </div>
                    <div className="modal-base-confirm">
                        <ButtonComponent
                            // buttonIcon={'icon-check'}
                            type={'primary'}
                            callback={() => this.onSave()}
                            label="Save"
                            dataQsId="modal-btn-confirm"
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default TrackArticleModal;