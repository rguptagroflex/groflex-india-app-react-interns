import React from 'react';
import config from 'config';
import moment from 'moment';
import { connect } from 'react-redux';

import WidgetComponent from 'shared/dashboard/components/widget.component';
import WidgetErrorComponent from 'shared/dashboard/components/widget-error.component';
import invoiz from 'services/invoiz.service';
import ChartTabCardComponent from './components/chart-tab-card.component';
import AddAdvancedListComponentFilters from '../../helpers/addAdvancedListComponentFilters';
import WebStorageKey from '../../enums/web-storage-key.enum';
import { DateFilterType } from '../../helpers/constants';

const ChartFilter = Object.freeze({
    NAME: 'name',
    CATEGORY: 'category'
})

class DashboardSalesArticleCustomerStatsComponent extends React.Component {
    constructor(props) {
        super(props);

        this.chartColors = ['FBC3B1', 'F78C6B', 'F5683D', 'E9400C', 'C2350A', '882507'];
        this.state = {
            isLoading: false,
            errorOccurred: false,
            
            activeTab: 0,
            articleSalesList: [],
            articleSalesChartData: {},
            customerSalesList: [],
            customerSalesChartData: {},
            selectedDateFilterType: DateFilterType.FISCAL_YEAR,
            selectedFilter: ChartFilter.NAME,
            startDate: moment(),
            endDate: moment()
        }
    }

    updateCategoryFilter(option) {
        this.setState({selectedFilter: option});
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

    async fetchArticleSalesData() {
        try {
            let url = `${config.dashboard.endpoints.stats}turnoverCustomersArticles` + this.addDateQueryParam();

            const { body: { data } } = await invoiz.request(url, { auth: true });
            
            await this.setState({
                articleSalesList: { name: data.articles, category: data.articleCategories }
            });
        } catch(error) {
            console.error(error)
            return invoiz.showNotification({type: 'error', message: 'Failed to fetch article sales data'})
        }
    }

    createArticleSalesChartData() {
        const { articleSalesList, selectedFilter } = this.state;
        let series = [];

        articleSalesList[selectedFilter].custom.forEach(article => {
            if(!article.value) return;

            // Others
            if(series.length >= 5) {
                const othersIndex = series.findIndex(item => item.meta === 'others');
                if(othersIndex === -1) {
                    series.push({
                        name: 'Others',
                        data: article.value,
                        meta: 'others',
                        className: `pie-${series.length + 1}`,
                        color: this.chartColors[series.length],
                        count: 1,
                    });
                    return;
                }

                series[othersIndex].data += article.value;
                series[othersIndex].count++;
                return;
            }

            series.push({
                meta: article.name,
                className: `pie-${series.length + 1}`,
                data: article.value,
                name: article.name,
                onClick: article => {
                    AddAdvancedListComponentFilters({
                        webStorageKey: WebStorageKey.ARTICLE_LIST_SETTINGS, 
                        filterItems: {
                            title: {
                                filterType: "text",
                                type: "contains",
                                filter: article.meta
                            }
                        }, 
                        url: '/articles'
                    });
                },
                color: this.chartColors[series.length]
            });
        });

        const totalValue = series.reduce((sum, item) => sum + item.data, 0).toFixed(2) || 0;
        const chartData = {
            series, 
            totalValue, 
            chartTitle: 'Total Sales',
            updateCategoryFilter: this.updateCategoryFilter.bind(this)
        };
        this.setState({articleSalesChartData: chartData});
        return chartData;
    }

    async fetchCustomerSalesData() {
        try {
            const url = `${config.dashboard.endpoints.stats}turnoverCustomersArticles` + this.addDateQueryParam();
            const { body: { data } } = await invoiz.request(url, { auth: true });
            await this.setState({
                customerSalesList: { name: data.customers, category: data.customerCategories }
            });
        } catch(error) {
            return invoiz.showNotification({type: 'error', message: 'Failed to fetch customer sales data'})
        }
    }

    createCustomerSalesChartData() {
        const { customerSalesList, selectedFilter } = this.state;
        let series = [];

        customerSalesList[selectedFilter].custom.forEach(customer => {
            if(!customer.value) return;

            // Others
            if(series.length >= 5) {
                const othersIndex = series.findIndex(item => item.meta === 'others');
                if(othersIndex === -1) {
                    series.push({
                        name: 'Others',
                        data: customer.value,
                        meta: 'others',
                        className: `pie-${series.length + 1}`,
                        color: this.chartColors[series.length],
                        count: 1
                    });
                    return;
                }

                series[othersIndex].data += customer.value;
                series[othersIndex].count++;
                return;
            }

            series.push({
                meta: customer.name,
                className: `pie-${series.length + 1}`,
                data: customer.value,
                name: customer.name,
                color: this.chartColors[series.length],
                onClick: customer => {
                    AddAdvancedListComponentFilters({
                        webStorageKey: WebStorageKey.INVOICE_LIST_SETTINGS, 
                        filterItems: {
                            customerName: {
                                filterType: "text",
                                type: "contains",
                                filter: customer.name
                            }
                        }, 
                        url: '/invoices'
                    });
                },
            });
        });

        const totalValue = series.reduce((sum, item) => sum + item.data, 0).toFixed(2);
        const chartData = {
            series, 
            totalValue,
            chartTitle: 'Total Sales',
            updateCategoryFilter: this.updateCategoryFilter.bind(this)
        };
        this.setState({customerSalesChartData: chartData});
        return chartData;
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState.articleSalesList !== this.state.articleSalesList) {
            this.createArticleSalesChartData();
        } else if(prevState.customerSalesList != this.state.customerSalesList) {
            this.createCustomerSalesChartData();
        }
    }
    
    componentDidMount() {
        this.fetchArticleSalesData();
        this.fetchCustomerSalesData()
    }

    async onDateChange(type, dateRange) {
        type = type ? type : DateFilterType.FISCAL_YEAR;

        switch (type) {
            case DateFilterType.CUSTOM:
                await this.setState({startDate: dateRange[0], endDate: dateRange[1]})
                break;
        }
        
        await this.setState({selectedDateFilterType: type});
        this.fetchArticleSalesData();
        this.fetchCustomerSalesData();
    }

    render() {
        const { isLoading, errorOccurred, selectedDateFilterType } = this.state;
        const { resources } = this.props;

        const tabs = [
            {
                name: 'Sales by Article',
                chartData: this.state.articleSalesChartData, 
                refresh: this.createArticleSalesChartData.bind(this),
            },
            {
                name: 'Sales by Customer',
                chartData: this.state.customerSalesChartData,
                refresh: this.createCustomerSalesChartData.bind(this)
            }
        ];

        const content = errorOccurred ? (
            <WidgetErrorComponent
				reason={resources.saleDefaultErrorText}
				buttonTitle={resources.str_updateNow}
				onButtonClick={this.fetchArticleExpenseData.bind(this)}
			/>
        ) : (
                <ChartTabCardComponent 
                    showDateFilter
                    showCategoryFilter
                    selectedDateFilterType={selectedDateFilterType}
                    onDateChange={this.onDateChange.bind(this)}
                    tabs={tabs}
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

export default connect(mapStateToProps)(DashboardSalesArticleCustomerStatsComponent);
