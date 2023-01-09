import React from 'react';
import SVGInline from 'react-svg-inline';

import AccordianComponent from 'shared/accordians/accordian.component';
import invoiz from 'services/invoiz.service';
import ButtonComponent from '../../../shared/button/button.component';

const plus = require(`assets/images/svg/plus_black.svg`)
const minus = require(`assets/images/svg/minus_black.svg`)

class StartExploreAccordian extends React.Component {
    constructor(props){
        super(props);
    }

    getTextColor() {
        return this.props.active  
            ? {color: '#0079B3'}
            : {color: 'inherit'}
    }

    onToggle(state) {
        if(state) this.props.setActive()
    }

    render() {
        return (
            <AccordianComponent active={this.props.active} onToggle={(state) => this.onToggle(state)}>
                <AccordianComponent.Head>
                    <div className="start-explore-accordian-head">
                        <p style={this.getTextColor()}><strong>{this.props.title}</strong></p>
                        {this.props.active ? <SVGInline width="auto" height="auto" svg={minus} className="down-arrow-icon" /> : 
                        <SVGInline width="auto" height="auto" svg={plus} className="down-arrow-icon" />}
                    </div>
                </AccordianComponent.Head>
                <AccordianComponent.Body>
                    <p style={{margin: '0 0 10px 0', padding: '3px 15px'}}>{this.props.content}</p> 
                    <ButtonComponent callback={() => invoiz.router.navigate(this.props.link)} isSquare isWide label="Get Started" />
                </AccordianComponent.Body>
            </AccordianComponent>
        )
    }
}

export default StartExploreAccordian;