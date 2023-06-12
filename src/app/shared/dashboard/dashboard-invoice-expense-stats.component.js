import React from 'react';
import config from 'config';
import moment from 'moment';
import { connect } from 'react-redux';
import userPermissions from "enums/user-permissions.enum";
import WidgetComponent from 'shared/dashboard/components/widget.component';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import invoiz from 'services/invoiz.service';
import ChartTabCardComponent from './components/chart-tab-card.component';
import InvoiceState from '../../enums/invoice/invoice-state.enum';
import WebStorageKey from 'enums/web-storage-key.enum';
import AddAdvancedListComponentFilters from '../../helpers/addAdvancedListComponentFilters';
import { DateFilterType } from '../../helpers/constants';

class DashboardInvoiceExpenseStatsComponent extends React.Component {
    constructor(props) {
        super(props);

        this.chartColors = ['EF476F', 'FFD166', '06D6A0', '118AB2'];
        this.allowedInvoiceStates = [
            InvoiceState.LOCKED,
            InvoiceState.PARTIALLY_PAID,
            InvoiceState.PAID,
            InvoiceState.CANCELLED
        ]

        this.state = {
            isLoading: false,
            errorOccurred: false,

            invoiceList: [],
            expenseList: [],
            invoiceChartData: {},
            expenseChartData: {},
            activeTab: 0,
            selectedDateFilterType: DateFilterType.FISCAL_YEAR,
            canViewExpense: false
        }

        this.invoiceStateMap = {
            locked: 'Open',
            paid: 'Paid',
            partiallyPaid: 'Partially Paid',
            cancelled: 'Cancelled'
        }

        this.expenseStateMap = {
            open: 'Open',
            paid: 'Paid',
            cancelled: 'Cancelled'
        }

        this.stateColors = {
            open: 'EF476F',
            locked: 'EF476F',
            paid: 'FFD166',
            partiallyPaid: '06D6A0',
            cancelled: '118AB2',
        }

        this.stateColorShades = {
            open: ['F7A1B5', 'F47C98', 'EF476F', 'EB1E4E', 'BC1038', '830B27'],
            locked: ['F7A1B5', 'F47C98', 'EF476F', 'EB1E4E', 'BC1038', '830B27'],
            paid: ['FFE099', 'FFD166', 'FFC233', 'F5AB00', 'BB8811', '7A5600'],
            partiallyPaid: ['60FBD2', '24F9C1', '06D6A0', '05B384', '048B67', '03634A'],
            cancelled: ['8FDBF5', '57C9EF', '1FB7EA', '118AB2', '0E7395', '09485D']
        }
    }

    addDateQueryParam() {
        const { selectedDateFilterType } = this.state;
        let query = '', startDate = null, endDate = null;

        switch(selectedDateFilterType) {
            case DateFilterType.CURR_MONTH:
                startDate = moment().startOf('month').toJSON();
                endDate = moment().endOf('month').toJSON();
                query = `?startDate=${startDate}&endDate=${endDate}`;
                break;
            
            case DateFilterType.LAST_MONTH:
                startDate = moment().subtract(1, 'months').startOf('month').toJSON();
                endDate = moment().subtract(1, 'months').endOf('month').toJSON();
                query = `?startDate=${startDate}&endDate=${endDate}`;
                break;
                
            case DateFilterType.SECOND_LAST_MONTH:
                startDate = moment().subtract(2, 'months').startOf('month').toJSON();
                endDate = moment().subtract(2, 'months').endOf('month').toJSON();
                query = `?startDate=${startDate}&endDate=${endDate}`;
                break;
                
            case DateFilterType.CURR_QUARTER:
                startDate = moment().startOf('quarter').toJSON();
                endDate = moment().toJSON();
                query = `?startDate=${startDate}&endDate=${endDate}`;
                break;
            
            case DateFilterType.LAST_QUARTER:
                startDate = moment().subtract(1, 'quarter').startOf('quarter').toJSON();
                endDate = moment().subtract(1, 'quarter').endOf('quarter').toJSON();
                query = `?startDate=${startDate}&endDate=${endDate}`;
                break;

            case DateFilterType.SECOND_LAST_QUARTER:
                startDate = moment().subtract(2, 'quarter').startOf('quarter').toJSON();
                endDate = moment().subtract(2, 'quarter').endOf('quarter').toJSON();
                query = `?startDate=${startDate}&endDate=${endDate}`;
                break;

            case DateFilterType.FISCAL_YEAR:
                const financialYearMonthStart = moment().utc().set('month', 2).set('date', 31);
                startDate = financialYearMonthStart < moment().utc()
                    ? financialYearMonthStart
                    : financialYearMonthStart.set('year', moment().utc().year() - 1);
                endDate = endDate ? moment(endDate).utc() : moment().utc();
                query = `?startDate=${startDate.toJSON()}&endDate=${endDate.toJSON()}`;
                break;
                                    
            case DateFilterType.CUSTOM:
                query = `?startDate=${this.state.startDate.toJSON()}&endDate=${this.state.endDate.toJSON()}`;
                break;
        }
        return query;
    }

    async fetchInvoiceList() {

        try {
            const url = `${config.resourceHost}invoice` + this.addDateQueryParam();
            let invoiceList = (await invoiz.request(url, {auth: true})).body.data;
    
            // Accepts only allowed invoice states
            invoiceList = invoiceList.filter(invoice => this.allowedInvoiceStates.includes(invoice.state));

            // Renames locked state to open
            // invoiceList.forEach(invoice => invoice.state = invoice.state === InvoiceState.LOCKED ? 'open' : invoice.state);

            this.setState({invoiceList});
        } catch(error) {
            console.error(error);
            this.setState({errorOccurred: true});
        }
    }

    async fetchExpenseList() {
        try {
            const url = `${config.resourceHost}expense` + this.addDateQueryParam();
            const expenseList = (await invoiz.request(url, {auth: true})).body.data;
            this.setState({expenseList});
        } catch(error) {
            console.error(error);
            this.setState({errorOccurred: true});
        }
    }

    createInvoiceChartData() {
        const { invoiceList } = this.state;
		const series = [];
        const colorMap = {
            locked: 'EF476F',
            paid: 'FFD166',
            partiallyPaid: '06D6A0',
            cancelled: '118AB2'
        }

        invoiceList.forEach((invoice, index) => { 

            if(!invoice.totalGross) return;

            let seriesExist = false;
            let seriesIndex = -1;
            for(let item in series) {
                if(series[item].meta !== invoice.state) continue;
                seriesExist = true;
                seriesIndex = item;
                break;
            }

            if(!seriesExist || !seriesIndex) {
                const name = this.invoiceStateMap[invoice.state];
                series.push({
                    name,
                    meta: invoice.state,
                    className: `pie-${series.length + 1}`,
                    data: invoice.totalGross,
                    color: colorMap[invoice.state],
                    onClick: invoice => {
                        AddAdvancedListComponentFilters({
                            webStorageKey: WebStorageKey.INVOICE_LIST_SETTINGS, 
                            filterItems: {
                                state: {
                                    filterType: "set",
                                    values: [invoice.meta]
                                }
                            }, 
                            url: '/invoices'
                        });
                    },
                    subSeriesData: {
                        name: name,
                        totalValue: 0,
                        series: [],
                        chartTitle: name + ' Invoices',
                    },
                    count: 1,
                });
                return;
            }
            series[seriesIndex].data += invoice.totalGross;
            series[seriesIndex].count++;
        });

        series.forEach(seriesItem => {
            invoiceList.forEach(invoice => {
                if(seriesItem.meta !== invoice.state) return;
                if(!invoice.totalGross) return;

                // Others
                if(seriesItem.subSeriesData.series.length >= 5) {
                    const othersIndex = seriesItem.subSeriesData.series.findIndex(item => item.state === 'others');
                    if(othersIndex === -1) {
                        seriesItem.subSeriesData.series.push({
                            name: 'Others',
                            data: invoice.totalGross,
                            state: 'others',
                            className: `pie-${seriesItem.subSeriesData.series.length + 1}`,
                            color: this.stateColorShades[invoice.state][seriesItem.subSeriesData.series.length],
                            count: 1,
                            onClick: invoice => {
                                AddAdvancedListComponentFilters({
                                    webStorageKey: WebStorageKey.INVOICE_LIST_SETTINGS, 
                                    filterItems: {
                                        customerName: {
                                            filterType: "set",
                                            values: Array.from(new Set(invoiceList.map(invoice => invoice.customerData.companyName || invoice.customerData.name)))
                                                .filter(item => !seriesItem.subSeriesData.series.map(seriesItem => seriesItem.name).includes(item)),
                                        }
                                    }, 
                                    url: '/invoices'
                                });
                            },
                        });
                        return;
                    }

                    seriesItem.subSeriesData.series[othersIndex].data += invoice.totalGross;
                    seriesItem.subSeriesData.series[othersIndex].count++;
                    return;
                }

                const subSeriesIndex = seriesItem.subSeriesData.series.findIndex(item => item.name === invoice.customerData.companyName || item.name === invoice.customerData.name);
                if(subSeriesIndex === -1) {
                    seriesItem.subSeriesData.series.push({
                        name: invoice.customerData.companyName || invoice.customerData.name,
                        data: invoice.totalGross,
                        state: invoice.state,
                        className: `pie-${seriesItem.subSeriesData.series.length + 1}`,
                        color: this.stateColorShades[invoice.state][seriesItem.subSeriesData.series.length],
                        onClick: invoice => {
                            // console.log(invoice)
                            AddAdvancedListComponentFilters({
                                webStorageKey: WebStorageKey.INVOICE_LIST_SETTINGS, 
                                filterItems: {
                                    state: {
                                        filterType: "set",
                                        values: [invoice.state]
                                    },
                                    customerName: {
                                        filterType: "set",
                                        values: [invoice.name]
                                    },
                                    
                                },
                                url: '/invoices'
                            });
                        },
                        count: 1
                    });
                    return;
                }
                if(!seriesItem.subSeriesData.series[subSeriesIndex].data) return;

                seriesItem.subSeriesData.series[subSeriesIndex].data += invoice.totalGross;
                seriesItem.subSeriesData.series[subSeriesIndex].count++;
            })
            seriesItem.subSeriesData.series = seriesItem.subSeriesData.series.filter(seriesItem => seriesItem.data !== 0);
            seriesItem.subSeriesData.totalValue = seriesItem.data;
        })

        const totalValue = series.reduce((sum, item) => {
            if(item.meta === 'cancelled') return sum + 0;
            return sum + item.data;
        }, 0);

        const chartData = { series, totalValue, chartTitle: 'Total Sales' };

        this.setState({invoiceChartData: chartData});
        return chartData;
	}

    createExpenseChartData() {
        const { expenseList } = this.state;
		const series = [];

        const colorMap = {
            open: 'EF476F',
            paid: 'FFD166',
            partiallyPaid: '06D6A0',
            cancelled: '118AB2'
        }

        expenseList.forEach((expense, index) => { 

            if(!expense.totalGross) return;

            // Checks if state already exists in the list
            let seriesExist = false;
            let seriesIndex = null;
            for(let item in series) {
                if(series[item].meta !== expense.status) continue;
                seriesExist = true;
                seriesIndex = item;
                break;
            }

            if(!seriesExist && !seriesIndex) {
                const name = this.expenseStateMap[expense.status];
                series.push({
                    name,
                    meta: expense.status,
                    className: `pie-${series.length + 1}`,
                    data: expense.totalGross,
                    // value: expense.totalGross,
                    color: colorMap[expense.status],
                    onClick: expense => {
                        AddAdvancedListComponentFilters({
                            webStorageKey: WebStorageKey.EXPENSE_LIST_SETTINGS, 
                            filterItems: {
                                status: {
                                    filterType: "set",
                                    values: [expense.meta]
                                }
                            }, 
                            url: '/expenses'
                        });
                    },
                    subSeriesData: {
                        name,
                        totalValue: 0,
                        series: [],
                        chartTitle: name + ' Expenditure',
                    },
                    count: 1,
                });
                return;
            }
            series[seriesIndex].data += expense.totalGross;
            series[seriesIndex].count++;
        });

        series.forEach(seriesItem => {
            expenseList.forEach(expense => {
                if(seriesItem.meta !== expense.status) return;
                if(!expense.totalGross) return;

                // Others
                if(seriesItem.subSeriesData.series.length >= 5) {
                    const othersIndex = seriesItem.subSeriesData.series.findIndex(item => item.state === 'others');
                    if(othersIndex === -1) {
                        seriesItem.subSeriesData.series.push({
                            name: 'Others',
                            data: expense.totalGross,
                            state: 'others',
                            className: `pie-${seriesItem.subSeriesData.series.length + 1}`,
                            color: this.stateColorShades[expense.status][seriesItem.subSeriesData.series.length],
                            count: 1,
                            onClick: expense => {
                                AddAdvancedListComponentFilters({
                                    webStorageKey: WebStorageKey.EXPENSE_LIST_SETTINGS, 
                                    filterItems: {
                                        'customerData.name': {
                                            filterType: "set",
                                            values: Array.from(new Set(expenseList.map(expense => expense.customerData.companyName || expense.customerData.name)))
                                                .filter(item => !seriesItem.subSeriesData.series.map(seriesItem => seriesItem.name).includes(item)),
                                        }
                                    }, 
                                    url: '/expenses'
                                });
                            },
                        });
                        return;
                    }

                    seriesItem.subSeriesData.series[othersIndex].data += expense.totalGross;
                    seriesItem.subSeriesData.series[othersIndex].count++;
                    return;
                }

                const companyName = expense.customerData.companyName || expense.customerData.name;
                const subSeriesIndex = seriesItem.subSeriesData.series.findIndex(item => item.name === companyName);
                if(subSeriesIndex === -1) {
                    seriesItem.subSeriesData.series.push({
                        name: companyName,
                        data: expense.totalGross,
                        // value: expense.totalGross,
                        meta: companyName.replaceAll(' ', '_'),
                        className: `pie-${series.length + 1}`,
                        state: expense.status,
                        color: this.stateColorShades[expense.status][seriesItem.subSeriesData.series.length],
                        onClick: expense => {
                            AddAdvancedListComponentFilters({
                                webStorageKey: WebStorageKey.EXPENSE_LIST_SETTINGS, 
                                filterItems: {
                                    'customerData.name': {
                                        filterType: "set",
                                        values: [companyName]
                                    },
                                    state: {
                                        filterType: "set",
                                        values: [expense.state]
                                    }
                                }, 
                                url: '/expenses'
                            });
                        },
                        count: 1,
                    });
                    return;
                }
                seriesItem.subSeriesData.series[subSeriesIndex].data += expense.totalGross;
                seriesItem.subSeriesData.series[subSeriesIndex].count++;
            })
            seriesItem.subSeriesData.series = seriesItem.subSeriesData.series.filter(seriesItem => seriesItem.value !== 0)
            seriesItem.subSeriesData.totalValue = seriesItem.data
            seriesItem.subSeriesData.series.filter(seriesItem => seriesItem.value !== 0)
        })
        
        const totalValue = series.reduce((sum, item) => {
            if(item.meta === 'cancelled') return sum + 0;
            return sum + item.data;
        }, 0);
        const chartData = { series, totalValue, chartTitle: 'Total Expenditure' };
        this.setState({expenseChartData: chartData});
        return chartData;
	}

    async fetchDataAndCreateChart() {
        await this.fetchInvoiceList();
        await this.fetchExpenseList();
    }

    async onDateChange(type, dateRange) {
        type = type ? type : DateFilterType.FISCAL_YEAR;

        switch (type) {
            case DateFilterType.CUSTOM:
                await this.setState({startDate: dateRange[0], endDate: dateRange[1]})
                break;
        }
        
        await this.setState({selectedDateFilterType: type});
        this.fetchDataAndCreateChart();
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState.invoiceList !== this.state.invoiceList) {
            this.createInvoiceChartData();
        } 
        else if(prevState.expenseList !== this.state.expenseList) {
            this.createExpenseChartData();
        }
    }

    componentDidMount() {
        this.fetchDataAndCreateChart();
        this.setState({
			canViewExpense: invoiz.user && invoiz.user.hasPermission(userPermissions.VIEW_EXPENSE),
		});
    }

    render() {
        const { isLoading, errorOccurred, selectedDateFilterType, canViewExpense } = this.state;
        const { resources } = this.props;
        let tabs = []
        if(canViewExpense) {
            tabs = [
            { name: 'Invoices', chartData: this.state.invoiceChartData, refresh: this.createInvoiceChartData.bind(this) },
            { name: 'Expenses', chartData: this.state.expenseChartData, refresh: this.createExpenseChartData.bind(this) },
        ];
        } else {
            tabs = [
                { name: 'Invoices', chartData: this.state.invoiceChartData, refresh: this.createInvoiceChartData.bind(this) },
            ];
        }
        

        // const tabs = [
        //     { name: 'Invoices', chartData: this.state.invoiceChartData, refresh: this.createInvoiceChartData.bind(this) },
        //     // { name: 'Expenses', chartData: this.state.expenseChartData, refresh: this.createExpenseChartData.bind(this) },
        // ];

        const content = errorOccurred ? (
            <WidgetErrorComponent
				reason={resources.saleDefaultErrorText}
				buttonTitle={resources.str_updateNow}
				onButtonClick={this.fetchInvoiceList.bind(this)}
			/>
        ) : (
            <ChartTabCardComponent 
                showDateFilter
                selectedDateFilterType={selectedDateFilterType}
                onDateChange={this.onDateChange.bind(this)}
                tabs={tabs}
                demoButtonText={"Create Invoice"}
                demoButtonLink={'/invoice/new'}
            />
        )
                
        return (
            <div className="dashboard-chart-tab-card-container dashboard-invoice-expense-stats">
                <WidgetComponent
                    loaderText={'Loading'}
                    loading={isLoading}
                    containerClass="box-large-bottom"
                >{content}</WidgetComponent>
            </div>
        )
    }
}

const mapStateToProps = state => {
    const { invoiceList } = state.invoice;
    const { expenseList } = state.expense;
    const isLoading = invoiceList.isLoading && expenseList.isLoading;
    const errorOccurred = invoiceList.errorOccurred || expenseList.errorOccurred;
    
    const { resources } = state.language.lang;
    return {
        isLoading,
        errorOccurred,
        invoiceList,
        expenseList,
        resources
    }
}

export default connect(mapStateToProps)(DashboardInvoiceExpenseStatsComponent);
