import React from 'react';
import config from 'config';
import moment from 'moment';
import { connect } from 'react-redux';

import WidgetComponent from 'shared/dashboard/components/widget.component';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import invoiz from 'services/invoiz.service';
import ChartTabCardComponent from './components/chart-tab-card.component';
import WebStorageKey from '../../enums/web-storage-key.enum';
import AddAdvancedListComponentFilters from '../../helpers/addAdvancedListComponentFilters';
import { DateFilterType } from '../../helpers/constants';

class DashboardQuotationsPurchaseOrderStatsComponent extends React.Component {
    constructor(props) {
        super(props);

        this.chartColors = ['EF476F', 'FFD166', '06D6A0', 'FFD166'];
        this.state = {
            isLoading: false,
            errorOccurred: false,

            quotationList: [],
            purchaseOrderList: [],
            quotationChartData: {},
            purchaseOrderChartData: {},
            selectedDateFilterType: DateFilterType.FISCAL_YEAR,
            activeTab: 0
        }

        this.quotationState = {
            open: 'Open',
            accepted: 'Accepted',
            rejected: 'Rejected',
            invoiced: 'Invoiced',
        }

        this.purchaseOrderState = {
            open: 'Open',
            accepted: 'Accepted',
            rejected: 'Rejected',
            expensed: 'Expensed'
        }

        this.stateColorShades = {
            open: ['F7A1B5', 'F47C98', 'EF476F', 'EB1E4E', 'BC1038', '830B27'],
            accepted: ['60FBD2', '24F9C1', '06D6A0', '05B384', '048B67', '03634A'],
            expensed: ['60FBD2', '24F9C1', '06D6A0', '05B384', '048B67', '03634A'],
            rejected: ['8FDBF5', '57C9EF', '1FB7EA', '118AB2', '0E7395', '09485D'],
            invoiced: ['FFE099', 'FFD166', 'FFC233', 'F5AB00', 'BB8811', '7A5600'],
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

    async fetchQuotations() {
        try {
            const url = `${config.resourceHost}offer` + this.addDateQueryParam();
            let quotationList = (await invoiz.request(url, {auth: true})).body.data;
            quotationList = quotationList.filter(quotation => quotation.state !== 'draft')
            this.setState({quotationList});
        } catch(error) {
            console.error(error);
            this.setState({errorOccurred: true});
        }
    }

    async fetchPurchaseOrders() {
        try {
            const url = `${config.resourceHost}purchaseOrder` + this.addDateQueryParam();
            const purchaseOrderList = (await invoiz.request(url, {auth: true})).body.data;
            this.setState({purchaseOrderList});
        } catch(error) {
            console.error(error);
            this.setState({errorOccurred: true});
        }
    }

    createQuotationsChartData() {
        const { quotationList } = this.state;
		let series = [];

        const colorMap = {
            open: 'EF476F',
            accepted: '06D6A0',
            invoiced: 'FFD166',
            rejected: '118AB2'
        }

        quotationList.forEach(quotation => {

            if(!quotation.totalGross) return;

            // Checks if state already exists in the list
            let seriesExist = false;
            let seriesIndex = null;
            for(let item in series) {
                if(series[item].meta !== quotation.state) continue;
                seriesExist = true;
                seriesIndex = item;
                break;
            }

            if(!seriesExist && !seriesIndex) {
                const name = this.quotationState[quotation.state];
                series.push({
                    name,
                    meta: quotation.state,
                    className: `pie-${series.length + 1}`,
                    data: quotation.totalGross,
                    color: colorMap[quotation.state],

                    onClick: quotation => {
                        AddAdvancedListComponentFilters({
                            webStorageKey: WebStorageKey.OFFER_LIST_SETTINGS, 
                            filterItems: {
                                state: {
                                    filterType: "set",
                                    values: [quotation.meta]
                                }
                            }, 
                            url: '/offers'
                        });
                    },
                    subSeriesData: {
                        name,
                        totalValue: 0,
                        series: [],
                        chartTitle: name
                    },
                    count: 1,
                });
                return;
            }

            series[seriesIndex].data += quotation.totalGross;
            series[seriesIndex].count++;
        });

        series.forEach(seriesItem => {
            quotationList.forEach(quotation => {
                if(seriesItem.meta !== quotation.state) return;
                if(!quotation.totalGross) return;

                // Others
                if(seriesItem.subSeriesData.series.length >= 5) {
                    const othersIndex = seriesItem.subSeriesData.series.findIndex(item => item.state === 'others');
                    if(othersIndex === -1) {
                        seriesItem.subSeriesData.series.push({
                            name: 'Others',
                            data: quotation.totalGross,
                            state: 'others',
                            className: `pie-${seriesItem.subSeriesData.series.length + 1}`,
                            color: this.stateColorShades[quotation.state][seriesItem.subSeriesData.series.length],
                            count: 1,
                            onClick: quotation => {
                                AddAdvancedListComponentFilters({
                                    webStorageKey: WebStorageKey.OFFER_LIST_SETTINGS, 
                                    filterItems: {
                                        customerName: {
                                            filterType: "set",
                                            values: Array.from(new Set(quotationList.map(quotation => quotation.customerData.companyName || quotation.customerData.name)))
                                                .filter(item => !seriesItem.subSeriesData.series.map(seriesItem => seriesItem.name).includes(item)),
                                        }
                                    }, 
                                    url: '/offers'
                                });
                            },
                        });
                        return;
                    }

                    seriesItem.subSeriesData.series[othersIndex].data += quotation.totalGross;
                    seriesItem.subSeriesData.series[othersIndex].count++;
                    return;
                }
                
                const companyName = quotation.customerData.companyName || quotation.customerData.name;
                const subSeriesIndex = seriesItem.subSeriesData.series.findIndex(item => item.name === companyName);
                if(subSeriesIndex === -1) {
                    seriesItem.subSeriesData.series.push({
                        name: companyName,
                        data: quotation.totalGross,
                        meta: companyName.replaceAll(' ', '_'),
                        className: `pie-${seriesItem.subSeriesData.series.length + 1}`,
                        color: this.stateColorShades[quotation.state][seriesItem.subSeriesData.series.length],
                        state: quotation.state,
                        onClick: quotation => {
                            AddAdvancedListComponentFilters({
                                webStorageKey: WebStorageKey.OFFER_LIST_SETTINGS, 
                                filterItems: {
                                    customerName: {
                                        filterType: "set",
                                        values: [companyName]
                                    },
                                    state: {
                                        filterType: "set",
                                        values: [quotation.state]
                                    }
                                }, 
                                url: '/offers'
                            });
                        },
                        count: 1,
                    });
                    return;
                }
                seriesItem.subSeriesData.series[subSeriesIndex].data += quotation.totalGross;
                seriesItem.subSeriesData.series[subSeriesIndex].count++;
            })
            seriesItem.subSeriesData.series = seriesItem.subSeriesData.series.filter(seriesItem => seriesItem.data !== 0)
            seriesItem.subSeriesData.totalValue = seriesItem.data;
        })

        const totalValue = series.reduce((sum, item) => sum + item.data, 0);
        const chartData = { series, totalValue, chartTitle: 'Quotations' };
        this.setState({quotationChartData: chartData});
        return chartData;
	}

    createPurchaseOrderChartData() {
        const { purchaseOrderList } = this.state;
		const series = [];

        purchaseOrderList.forEach((purchaseOrder, index) => { 

            if(!purchaseOrder.totalGross) return;
            
            // Checks if state already exists in the list
            let seriesExist = false;
            let seriesIndex = null;
            for(let item in series) {
                if(series[item].name.toLowerCase() !== purchaseOrder.state.toLowerCase()) continue;
                seriesExist = true;
                seriesIndex = item;
                break;
            }

            if(!seriesExist && !seriesIndex) {
                const name = this.purchaseOrderState[purchaseOrder.state];
                series.push({
                    name,
                    meta: purchaseOrder.state,
                    className: `pie-${series.length + 1}`,
                    data: purchaseOrder.totalGross,
                    color: this.chartColors[series.length],
                    onClick: purchaseOrder => {
                        AddAdvancedListComponentFilters({
                            webStorageKey: WebStorageKey.PURCHASEORDER_LIST_SETTINGS, 
                            filterItems: {
                                state: {
                                    filterType: "set",
                                    values: [purchaseOrder.meta]
                                }
                            }, 
                            url: '/purchase-orders'
                        });
                    },
                    subSeriesData: {
                        name,
                        totalValue: 0,
                        series: [],
                        chartTitle: name
                    },
                    count: 1,
                });
                return;
            }

            series[seriesIndex].data += purchaseOrder.totalGross;
            series[seriesIndex].count++;
        });

        series.forEach(seriesItem => {
            purchaseOrderList.forEach(purchaseOrder => {
                if(seriesItem.meta !== purchaseOrder.state) return;
                if(!purchaseOrder.totalGross) return;

                // Others
                if(seriesItem.subSeriesData.series.length >= 5) {
                    const othersIndex = seriesItem.subSeriesData.series.findIndex(item => item.state === 'others');
                    if(othersIndex === -1) {
                        seriesItem.subSeriesData.series.push({
                            name: 'Others',
                            data: purchaseOrder.totalGross,
                            state: 'others',
                            className: `pie-${seriesItem.subSeriesData.series.length + 1}`,
                            color: this.stateColorShades[purchaseOrder.state][seriesItem.subSeriesData.series.length],
                            count: 1,
                            onClick: purchaseOrder => {
                                AddAdvancedListComponentFilters({
                                    webStorageKey: WebStorageKey.OFFER_LIST_SETTINGS, 
                                    filterItems: {
                                        'customerData.name': {
                                            filterType: "set",
                                            values: Array.from(new Set(purchaseOrderList.map(purchaseOrder => purchaseOrder.customerData.companyName || purchaseOrder.customerData.name)))
                                                .filter(item => !seriesItem.subSeriesData.series.map(seriesItem => seriesItem.name).includes(item)),
                                        }
                                    }, 
                                    url: '/offers'
                                });
                            },
                        });
                        return;
                    }

                    seriesItem.subSeriesData.series[othersIndex].data += purchaseOrder.totalGross;
                    seriesItem.subSeriesData.series[othersIndex].count++;
                    return;
                }

                const companyName = purchaseOrder.customerData.companyName || purchaseOrder.customerData.name;
                const subSeriesIndex = seriesItem.subSeriesData.series.findIndex(item => item.name === companyName);
                if(subSeriesIndex === -1) {
                    seriesItem.subSeriesData.series.push({
                        name: companyName,
                        data: purchaseOrder.totalGross,
                        meta: companyName.replaceAll(' ', '_'),
                        className: `pie-${series.length + 1}`,
                        color: this.stateColorShades[purchaseOrder.state][seriesItem.subSeriesData.series.length],
                        state: purchaseOrder.state,
                        onClick: purchaseOrder => {
                            AddAdvancedListComponentFilters({
                                webStorageKey: WebStorageKey.PURCHASEORDER_LIST_SETTINGS, 
                                filterItems: {
                                    'customerData.name': {
                                        filterType: "set",
                                        values: [companyName]
                                    },
                                    state: {
                                        filterType: "set",
                                        values: [purchaseOrder.state]
                                    }
                                }, 
                                url: '/purchase-orders'
                            });
                        },
                        count: 1,
                    });
                    return;
                }
                seriesItem.subSeriesData.series[subSeriesIndex].data += purchaseOrder.totalGross;
                seriesItem.subSeriesData.series[subSeriesIndex].count++;
            })
            seriesItem.subSeriesData.series = seriesItem.subSeriesData.series.filter(seriesItem => seriesItem.data !== 0);
            seriesItem.subSeriesData.totalValue = seriesItem.data;
        })

        const totalValue = series.reduce((sum, item) => sum + item.data, 0);
        const chartData = { series, totalValue, chartTitle: 'Purchase Order' };
        this.setState({purchaseOrderChartData: chartData});
        return chartData;
	}

    async fetchDataAndCreateChart() {
        await this.fetchQuotations();
        // await this.fetchPurchaseOrders();
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
        if(prevState.quotationList !== this.state.quotationList) {
            this.createQuotationsChartData();
        } 
        // else if(prevState.purchaseOrderList !== this.state.purchaseOrderList) {
        //     this.createPurchaseOrderChartData();
        // }
    }

    componentDidMount() {
        this.fetchDataAndCreateChart();
    }

    render() {
        const { isLoading, errorOccurred, selectedDateFilterType } = this.state;
        const { resources } = this.props;

        const tabs = [
            { name: 'Estimates', chartData: this.state.quotationChartData, refresh: this.createQuotationsChartData.bind(this) },
            // { name: 'Purchase Order', chartData: this.state.purchaseOrderChartData, refresh: this.createPurchaseOrderChartData.bind(this) },
        ];

        const content = errorOccurred ? (
            <WidgetErrorComponent
				reason={resources.saleDefaultErrorText}
				buttonTitle={resources.str_updateNow}
				onButtonClick={this.fetchDataAndCreateChart.bind(this)}
			/>
        ) : (
            <ChartTabCardComponent
                showDateFilter
                selectedDateFilterType={selectedDateFilterType}
                onDateChange={this.onDateChange.bind(this)}
                tabs={tabs}
                demoButtonText={"Create Estimates"}
                demoButtonLink={'/offer/new'}
            />
        )
                
        return (
            <div className="dashboard-chart-tab-card-container dashboard-quotations-purchase-order-stats">
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

export default connect(mapStateToProps)(DashboardQuotationsPurchaseOrderStatsComponent);
