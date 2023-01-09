import React from 'react';
import findSubComponent from 'helpers/findSubComponent';

const List = () => null;
const Contents = () => null;

class TabsComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeTab: 0
        }
    }

    componentWillReceiveProps(props) {
        this.setState({activeTab: props.activeTab})
    }

    renderList() {
        const list = findSubComponent(this.props.children, List);
        if(!list) return;
        return <React.Fragment>
            {list.props.children.map((tab, index) => (
                <div
                    key={index}
                    onClick={() => this.props.setActiveTab(index)} 
                    className={`tab ${
                        index === this.state.activeTab 
                        // && list.props.children.length > 1
                            ? 'active': ''}
                    `}
                >
                    {tab}
                </div>
            ))}
        </ React.Fragment>
    }

    renderContents() {
        const contents = findSubComponent(this.props.children, Contents);
        if(!contents) return;
        return <React.Fragment>
            {contents.props.children.map((content, index) => 
                this.state.activeTab === index
                    ? <div key={index} className="content">{content}</div>
                    : ''
            )}
        </React.Fragment>
    }

    render() { 
        return <div className="tabs">
            <div className="tab-list">
                {this.renderList()}
            </div>
            <div className="tab-contents">
                {this.renderContents()}
            </div>
        </div>;
    }
}

TabsComponent.List = List;
TabsComponent.Contents = Contents;
export default TabsComponent;