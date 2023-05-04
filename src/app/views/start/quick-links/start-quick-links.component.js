import React, { Component } from 'react';
import {
    SortableContainer,
    SortableElement
} from "react-sortable-hoc";
import SVGInline from 'react-svg-inline';
import userPermissions from 'enums/user-permissions.enum';
import config from 'config'
import invoiz from 'services/invoiz.service';

const quickLinksMap = [
    { name: 'Create Sales', linkId: 'create-sales', link: '/invoice/new' },
    { name: 'Add Stocks', linkId: 'add-stocks', link: '/' },
    { name: 'Add Article', linkId: 'add-articles', link: '/article/new' },
    { name: 'Create Contact', linkId: 'create-contacts', link: '/customer/new' },
    { name: 'Add Expense', linkId: 'add-expenses', link: '/expense/new' },
    { name: 'Invite Users', linkId: 'invite-users', link: '/settings/user' },
    { name: 'Create Quotations', linkId: 'create-quotations', link: '/offer/new' },
    { name: 'Create Timesheets', linkId: 'create-timesheets', link: '/timetracking/new' },
    { name: 'Create Purchase Orders', linkId: 'create-purchase-orders', link: '/purchase-order/new' },
]

const checkIcon = require(`assets/images/icons/tick_icon.svg`)
const editIcon = require(`assets/images/icons/edit_icon.svg`)

const QuickLinkItem = SortableElement(props => {
    const {value: item} = props;
    const icon = require(`assets/images/svg/quick-links/${item.linkId}.svg`)
    return (
        <div className="col-xs-2 text-center" onClick={() => invoiz.router.navigate(item.link)} style={{userSelect: 'none', cursor: 'pointer'}}>
            <span>
                <SVGInline width="88px" height="auto" svg={icon} />
            </span>
            <p>{item.name}</p>
        </div>
    )
})

const QuickLinkList = SortableContainer(props => {
    let {items, disabled, ...restProps} = props;
    if(disabled) {
        items = items.slice(0, 6)
    }

    return (
        <div className="row">
            {items.map((item, index) => (
                <QuickLinkItem
                    key={index}
                    index={index}
                    value={item}
                    disabled={disabled}
                    {...restProps}
                />
            ))}
        </div>
    )
})

class StartQuickLinksComponent extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            quickLinks: [],
            quickLinksEditable: false,
            canViewExpense:false
        }
    }

    onSortEnd({oldIndex, newIndex}) {
        let {quickLinks} = this.state;
        const itemToMove = quickLinks[oldIndex];
        quickLinks.splice(oldIndex, 1);
        quickLinks.splice(newIndex, 0, itemToMove);
        quickLinks = quickLinks.map((link, order) => ({...link, order}));
        this.setState({quickLinks: quickLinks});
    }

    async toggleQuickLinksEditable() {
        if(this.state.quickLinksEditable) await this.updateQuickLinks();
        this.setState({quickLinksEditable: !this.state.quickLinksEditable})
    }

    async fetchQuickLinks() {
        try {
            let links = (await invoiz.request(`${config.resourceHost}quick-links`, {auth: true})).body.data.links;
            
            if(!this.state.canViewExpense) {
                links = links.filter(x => x.linkId != 'create-purchase-orders' && x.linkId != 'add-expenses' && x.linkId != 'add-stocks' );
            }

            if(this.state.canViewExpense) {
                if(!links.find(x => x.linkId == 'add-expenses')) {
                    links.push({ name: 'Add Expense', linkId: 'add-expenses', link: '/expense/new' })
                }
            }
            
            links = links.map(linkItem => {                
                const {name, link} = quickLinksMap.find(item => item.linkId === linkItem.linkId);
                return {...linkItem, name, link}
            })
            this.setState({quickLinks: links})

        } catch(error) {
            throw error;
        }
    }

    async updateQuickLinks() {
        try {
            const response = await invoiz.request(`${config.resourceHost}quick-links`, {
                auth: true, method: 'PUT', data: this.state.quickLinks
            });
        } catch(error) {
            invoiz.page.showToast({ type: 'error', message: "Couldn't update quick links!" });
        }
    }

    componentDidMount() {
        this.fetchQuickLinks();
        this.setState({
			canViewExpense: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_EXPENSE),
		});
    }

    render() { 

        const { quickLinks, quickLinksEditable } = this.state;
        return (
            <div className="start-quick-links-container">
                <div className="widgetContainer box">
                    <div style={{marginBottom: '20px'}}>
                        <p className="text-h5" style={{display: 'inline', marginTop: 0}}>Quick Links</p>
                        <div onClick={async () => await this.toggleQuickLinksEditable()} style={{display: 'inline-block', marginTop: 0, float: 'right'}}>
                            <p style={{color: '#0079B3', margin: 0, cursor: 'pointer'}}>
                                <span>{!quickLinksEditable ? 'Edit' : 'Save'}</span>
                                <SVGInline width="20px" height="15px" svg={quickLinksEditable ? checkIcon : editIcon} className="edit-icon" />
                            </p>
                        </div>
                        {quickLinksEditable && <p>Click & Drag to switch buttons</p>}
                    </div>

                    <QuickLinkList
                        items={quickLinks}
                        onSortEnd={res => this.onSortEnd(res)}
                        axis="xy"
                        disabled={!quickLinksEditable}
                    />
                </div>
            </div>
        );
    }
}
 
export default StartQuickLinksComponent;