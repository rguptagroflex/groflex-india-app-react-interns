import React from 'react';
import ButtonComponent from '../../button/button.component';
import { redirectToChargebee } from "helpers/redirectToChargebee";
import ChargebeePlan from "enums/chargebee-plan.enum";

class BuyAddonModalComponent extends React.Component {
    constructor(props){
        super();

        this.state = {
            heading: props.heading,
            subheading: props.subheading,
            features: props.features || [],
            price: props.price || 0,
            addon: props.addon,
        }
    }

    render() {
        const {
            heading,
            subheading,
            features,
            price,
            addon
        } = this.state;
        return (
            <div className="buy-addon-modal">
                <img src="/assets/images/svg/quotations.svg" />
                <p className="heading">{heading}</p>
                <p className="subheading">{subheading}</p>
                <div className="features row">
                    {
                        features.map(feature => 
                            <div className="feature col-xs-6">
                                <div>
                                    <img src="/assets/images/icons/green_check_mark.svg"/>
                                    <p>{feature}</p>
                                </div>
                            </div>
                        )
                    }
                </div>
                <ButtonComponent
                    callback={() => {
                        redirectToChargebee(ChargebeePlan.FREE_PLAN_2021, false, addon)
                    }}
                    customCssClass="buy-button"
                    label={`Buy Now @ ₹${price}/year`}
                />
            </div>
        )
    }
}

export default BuyAddonModalComponent;