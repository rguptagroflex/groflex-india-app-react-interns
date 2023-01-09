import React from 'react';
import moment from 'moment';

import Invoiz from '../../services/invoiz.service';
import config from 'config';
import StackedBarChartCardComponent from './components/stacked-bar-chart-card.component';
import AddAdvancedListComponentFilters from '../../helpers/addAdvancedListComponentFilters';
import WebStorageKey from '../../enums/web-storage-key.enum';
class DashboardReceivablesStatsComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            invoices: [],
            totalAmount: 0,
            overdue3Days: 0,
            overdue15Days: 0,
            overdue45days: 0,
            overdueAbove45days: 0
        }
        this.colors = ['FFC9C6', 'FF9792', 'FF5E54', 'D94339'];
    }

    findTotalAmount(invoices) {
        return invoices.reduce((sum, item) => sum + item.outstandingAmount, 0);
    }
    
    findOverdueByDays(days, invoices) {
        return invoices.reduce((sum, item) => {
            const noOfDaysDue = moment().diff(item.dueToDate, 'days');
            if(noOfDaysDue > days) return sum + 0;
            return sum + item.outstandingAmount;
        }, 0);
    }

    async fetchInvoices() {
        // Fetch invoice datas
        const response = await Invoiz.request(config.invoice.resourceUrl, {auth: true});
        const invoices = response.body.data;
        const lockedInvoices = invoices.filter(invoice => invoice.state === 'locked')

        const totalAmount = this.findTotalAmount(invoices);
        const overdue3Days = this.findOverdueByDays(3, invoices);
        const overdue15Days = this.findOverdueByDays(15, invoices) - overdue3Days;
        const overdue45Days = this.findOverdueByDays(45, invoices) - this.findOverdueByDays(15, invoices);
        const overdueAbove45days = totalAmount - this.findOverdueByDays(45, invoices);

        this.setState({
            invoices: lockedInvoices,
            totalAmount,
            overdue3Days: overdue3Days > 0 ? overdue3Days : 0,
            overdue15Days: overdue15Days > 0 ? overdue15Days : 0,
            overdue45Days: overdue45Days > 0 ? overdue45Days : 0,
            overdueAbove45days: overdueAbove45days > 0 ? overdueAbove45days : 0
        });
    }
    
    componentDidMount() {
        this.fetchInvoices()
    }

    render() {
        const {
            invoices,
            totalAmount, 
            overdue3Days, 
            overdue15Days,
            overdue45Days,
            overdueAbove45days 
        } = this.state;

        const dummyChartData = [
            { meta: 'overdue3Days', className: 'bar-1', value: [34360], name: '0-3 days' },
            { meta: 'overdue15Days', className: 'bar-2', value: [15050], name: '3-15 days' },
            { meta: 'overdue45days', className: 'bar-3', value: [18023], name: '15-45 days' },
            { meta: 'overdueAbove45days', className: 'bar-4', value: [13441], name: '> 45 days' },
        ]
        const chartData = [
            { meta: 'overdue3Days', className: 'bar-1', value: [overdue3Days], name: '0-3 days', 
                onClick: () => {
                    AddAdvancedListComponentFilters({
                        webStorageKey: WebStorageKey.INVOICE_LIST_SETTINGS, 
                        filterItems: {
                            dueSince: {
                                filterType: "number",
                                type: "lessThanOrEqual",
                                filter: 3
                            }
                        }, 
                        url: '/invoices'
                    });
                }
            },
            { meta: 'overdue15Days', className: 'bar-2', value: [overdue15Days], name: '3-15 days', 
                onClick: () => {
                    AddAdvancedListComponentFilters({
                        webStorageKey: WebStorageKey.INVOICE_LIST_SETTINGS, 
                        filterItems: {
                            dueSince: {
                                filterType: "number",
                                type: "inRange",
                                filter: 4,
                                filterTo: 15
                            }
                        }, 
                        url: '/invoices'
                    });
                }
            },
            { meta: 'overdue45days', className: 'bar-3', value: [overdue45Days], name: '15-45 days',
                onClick: () => {
                    AddAdvancedListComponentFilters({
                        webStorageKey: WebStorageKey.INVOICE_LIST_SETTINGS, 
                        filterItems: {
                            dueSince: {
                                filterType: "number",
                                type: "inRange",
                                filter: 16,
                                filterTo: 45
                            }
                        }, 
                        url: '/invoices'
                    });
                }
            },
            { meta: 'overdueAbove45days', className: 'bar-4', value: [overdueAbove45days], name: '> 45 days',
                onClick: () => {
                    AddAdvancedListComponentFilters({
                        webStorageKey: WebStorageKey.INVOICE_LIST_SETTINGS, 
                        filterItems: {
                            dueSince: {
                                filterType: "number",
                                type: "greaterThan",
                                filter: 45,
                            }
                        },  
                        url: '/invoices'
                    });
                }
            },
        ]

        return invoices.length
            ? <StackedBarChartCardComponent
                totalAmount={totalAmount}
                title="To Receive"
                desc="Receivables from unpaid invoices"
                chartData={chartData}
                viewBtnCallback={() => {
                    AddAdvancedListComponentFilters({
                        webStorageKey: WebStorageKey.CUSTOMER_LIST_SETTINGS, 
                        filterItems: {
                            outstandingAmount: {
                                filterType: "number",
                                type: "greaterThan",
                                filter: 0,
                            }
                        },  
                        url: '/customers'
                    });
                }}
                overdue={{
                    days3: overdue3Days,
                    days15: overdue15Days,
                    days45: overdue45Days,
                    daysAbove45: overdueAbove45days
                }}
            />
            : <StackedBarChartCardComponent
                totalAmount={80874}
                title="To Receive"
                desc="Receivables from unpaid invoices"
                chartData={dummyChartData}
                demoMode
                demoText={"Start your sales to open charts"}
                demoButtonText={"Create Invoice"}
                demoButtonLink={'/invoice/new'}
                overdue={{
                    days3: 34360,
                    days15: 15050,
                    days45: 18023,
                    daysAbove45: 13441
                }}
            />
    }
}
 
export default DashboardReceivablesStatsComponent;