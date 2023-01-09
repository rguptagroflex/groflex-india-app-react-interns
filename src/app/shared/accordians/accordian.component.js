import React from 'react';

const Head = () => null;
const Body = () => null;

class AccordianComponent extends React.Component {
    constructor(props){
        super(props);
    }

    findSubComponent(children, component) {
        const result = [];
        const type = component.displayName || component.name;
        React.Children.forEach(children, child => {
            const childType = child && child.type && (child.type.displayName || child.type.name);
            if(type.includes(childType)) {
                result.push(child)
            }
        })
        return result[0]
    }

    toggleAccordian() {
        this.props.onToggle(!this.props.active);
    }

    renderHead() {
        const head = this.findSubComponent(this.props.children, Head);
        if(!head) return;
        return (
            <div onClick={() => this.toggleAccordian()}>
                {head.props.children}
            </div>
        )
    }

    renderBody () {
        const body = this.findSubComponent(this.props.children, Body);
        if(!body) return null;
        return (
            <div>{body.props.children}</div>
        )
    }

    render() {
        return (
            <div style={{background: 'white', marginBottom: '14px', cursor: 'pointer', border: '0.8px solid #DDDDDD', borderRadius: '4px'}}>
                {this.renderHead()}

                { this.props.active && 
                    this.renderBody()
                }
            </div>
        )
    }
}

AccordianComponent.Head = Head;
AccordianComponent.Body = Body;
export default AccordianComponent;