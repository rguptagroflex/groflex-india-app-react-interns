import React, { Component } from 'react';
import config from 'config';

import ModalService from 'services/modal.service';
import NumberInputComponent from 'shared/inputs/number-input/number-input.component';
import ButtonComponent from 'shared/button/button.component';
import invoiz from '../../../services/invoiz.service';
import inventoryActions from '../../../enums/inventory/inventory-action.enum';
import SVGInline from 'react-svg-inline';

const checkMarkIcon = require('assets/images/svg/check-marks/check_mark.svg')

class TryImprezzAppModal extends Component {
    constructor(props) {
        super(props);
        
        this.state = { }
    }

    render() { 
        return (
            <div>
                <div className="row">
                    <div className="try-mobile-app-left-pane col-sm-6 text-center">
                        <h1 className="modal-heading">Use Imprezz Mobile</h1>
                        <p>Try our newly launched Android App and enjoy more benefits</p>
                        <img className="try-mobile-img" src="/assets/images/mobile-app/try_mobile_app.jpg" />
                        <div className="benefits text-left">
                            <ul>
                                <li><SVGInline svg={checkMarkIcon} /><span>Scan barcodes to bill your customers</span></li>
                                <li><SVGInline svg={checkMarkIcon} /><span>Receive online payments instantly</span></li>
                                <li><SVGInline svg={checkMarkIcon} /><span>Data synchronization between web and mobile</span></li>
                                <li><SVGInline svg={checkMarkIcon} /><span>Share receipts via whatsapp</span></li>
                            </ul>
                        </div>
                    </div>
                    <div className="try-mobile-app-right-pane col-sm-6 text-center">
                        <p>Scan QR Code to Download Android App</p>
                        <img className="qr-code" src="/assets/images/mobile-app/mobile_app_qr_code.png" />
                        <img className="google-play-btn" src="/assets/images/mobile-app/google_play.png" />
                    </div>
                </div>
            </div>
        );
    }
}

export default TryImprezzAppModal;