import React, { Component } from 'react';
import SVGInline from 'react-svg-inline';

import StartExploreAccordian from './start-explore-accordian.component';

const StartExploreHeroImg = require('assets/images/svg/start/start-explore-hero-img.svg');

class StartExploreComponent extends Component {
    constructor(props) {
        super(props);

        this.accordianList = [
            {title: 'Create invoice', content: 'Checkout how to create invoices with Groflex.', link: '/invoice/new'},
            {title: 'Create articles', content: 'Checkout how to add your article details', link: '/article/new'},
            // {title: 'Add stocks to inventory', content: 'Never run out of stock. Checkout how to track them.', link: '/invoice/new'},
            {title: 'Create contacts', content: 'Checkout how to add your contact details', link: '/customer/new'},
            // {title: 'Create expenditure', content: 'Add your expenses and keep track of your cash flow', link: '/expense/new'}
        ]

        this.state = {
            openAccordian: 0
        }
    }

    setActive(index) {
        this.setState({
            openAccordian: index
        })
    }

    render() { 
        return ( 
            <div className="start-explore-component col-xs-12">
                <div className="widgetContainer box">
                    <div className="row">
                        <div className="col-md-6 text-center" style={{marginTop: 'auto', marginBottom: 'auto'}}>
                            <p className="text-h2 start-explore-heading">Explore Groflex</p>
                            <div style={{margin: '70px auto'}}>
                                <SVGInline svg={StartExploreHeroImg} />
                            </div>
                            {/* <p className="start-explore-subheading">Don’t know where to start? Let’s start a quick tour</p> */}
                        </div>
                        <div className="col-md-6">
                            <div className="box box-lightblue box-noShadow text-left">
                                <p className="text-h6">What do you like to explore?</p>
                                {this.accordianList.map((item, index) => (
                                    <StartExploreAccordian 
                                        key={index} 
                                        active={index === this.state.openAccordian} 
                                        setActive={() => this.setActive(index)}
                                        title={item.title} 
                                        content={item.content}
                                        link={item.link}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
 
export default StartExploreComponent;