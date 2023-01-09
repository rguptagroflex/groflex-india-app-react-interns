import React from "react";
import invoiz from "services/invoiz.service";
import _ from "lodash";
import config from "config";
import ButtonComponent from "shared/button/button.component";
import { errorCodes } from "helpers/constants";
import ModalService from "services/modal.service";
import AssetLock from "assets/images/svg/access_lock.svg";
import SVGInline from "react-svg-inline";
import store from "redux/store";
import UpgradeModalComponent from "shared/modals/upgrade-modal.component";
import { connect } from "react-redux";
import { redirectToChargebee } from "../../helpers/redirectToChargebee";
import ChargebeePlan from "enums/chargebee-plan.enum";

class RestrictedOverlayComponent extends React.Component {
    constructor(props) {
		super(props);
		this.state = {
            visible: false,
            message: this.props.message || '',
            owner: this.props.owner || false,
            showButton: this.props.showButton !== null || this.props.showButton !== undefined ? this.props.showButton : true
		};
	}

    componentDidMount() {

    }

    render() {
        const { message, owner, showButton } = this.state;
        const { resources } = this.props;

        return (
			<div className="restricted-overlay-wrapper">
                <div className="restricted-overlay-component">
                <SVGInline className="icon-lock" height="50px" svg={AssetLock} />
				<span className="message">{message}</span>
                {
                    owner && showButton ? (
                        <ButtonComponent
                            buttonIcon={"icon-check"}
                            type="primary"
                            isWide={false}
                            callback={() => {
                                // ModalService.open(<UpgradeModalComponent title={resources.str_timeToStart} resources={resources}/>, {
                                //     width: 1196,
                                //     padding: 0,
                                //     isCloseable: true,
                                // })
                                redirectToChargebee(ChargebeePlan.FREE_PLAN_2021)
                            }}
                            label={this.props.buttonLabel || "Upgrade"}
                            dataQsId="settings-account-btn-subscription"
                        />
                    ) : null
                }
           
                </div>
     
			</div>
		);
    }
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(RestrictedOverlayComponent);