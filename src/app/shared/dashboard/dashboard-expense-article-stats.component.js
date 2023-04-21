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

class DashboardExpenseArticleStatsComponent extends React.Component {
    constructor(props) {
        super(props);

        this.chartColors = ['FBC3B1', 'F78C6B', 'F5683D', 'E9400C', 'C2350A', '882507'];
        this.state = {
            isLoading: false,
            errorOccurred: false,
            
            activeTab: 0,
            articleExpenseData: [],
            expensesByArticleChartData: {},
            expensesByPayeeChartData: {},
            selectedDateFilterType: DateFilterType.FISCAL_YEAR,
            selectedFilter: ChartFilter.NAME,
            startDate: moment(),
            endDate: moment()
        }
    }

    async updateCategoryFilter(option) {
        await this.setState({selectedFilter: option});
        // this.createExpensesByArticleChartData();
    }

    async fetchArticleExpenseData() {
        const { selectedDateFilterType } = this.state;
        let startDate = null, endDate = null;
        
        try {
            let url = `${config.dashboard.endpoints.stats}expenseByArticle`;
            switch(selectedDateFilterType) {
                case DateFilterType.CURR_MONTH:
                    startDate = moment().startOf('month').toJSON();
                    endDate = moment().endOf('month').toJSON();
                    url += `?startDate=${startDate}&endDate=${endDate}`;
                    break;
                
                case DateFilterType.LAST_MONTH:
                    startDate = moment().subtract(1, 'months').startOf('month').toJSON();
                    endDate = moment().subtract(1, 'months').endOf('month').toJSON();
                    url += `?startDate=${startDate}&endDate=${endDate}`;
                    break;
                    
                case DateFilterType.SECOND_LAST_MONTH:
                    startDate = moment().subtract(2, 'months').startOf('month').toJSON();
                    endDate = moment().subtract(2, 'months').endOf('month').toJSON();
                    url += `?startDate=${startDate}&endDate=${endDate}`;
                    break;
                    
                case DateFilterType.CURR_QUARTER:
                    startDate = moment().startOf('quarter').toJSON();
                    endDate = moment().toJSON();
                    url += `?startDate=${startDate}&endDate=${endDate}`;
                    break;
                
                case DateFilterType.LAST_QUARTER:
                    startDate = moment().subtract(1, 'quarter').startOf('quarter').toJSON();
                    endDate = moment().subtract(1, 'quarter').endOf('quarter').toJSON();
                    url += `?startDate=${startDate}&endDate=${endDate}`;
                    break;
    
                case DateFilterType.SECOND_LAST_QUARTER:
                    startDate = moment().subtract(2, 'quarter').startOf('quarter').toJSON();
                    endDate = moment().subtract(2, 'quarter').endOf('quarter').toJSON();
                    url += `?startDate=${startDate}&endDate=${endDate}`;
                    break;

                case DateFilterType.FISCAL_YEAR:
                    const financialYearMonthStart = moment().utc().set('month', 2).set('date', 31);
                    startDate = financialYearMonthStart < moment().utc()
                        ? financialYearMonthStart
                        : financialYearMonthStart.set('year', moment().utc().year() - 1);
                    endDate = endDate ? moment(endDate).utc() : moment().utc();
                    url += `?startDate=${startDate.toJSON()}&endDate=${endDate.toJSON()}`;
                    break;
                      
                case DateFilterType.CUSTOM:
                    url += `?startDate=${this.state.startDate.toJSON()}&endDate=${this.state.endDate.toJSON()}`;
                    break;
            }

            const { body: { data } } = await invoiz.request(url, { auth: true });
            await this.setState({ articleExpenseData: { byArticle: data.expensesByArticle, byPayee: data.expensesByPayee }});

        } catch(error) {
            console.error(error)
            return invoiz.showNotification({type: 'error', message: 'Failed to fetch article sales data'})
        }
    }

    createExpensesByArticleChartData() {
        const { articleExpenseData, selectedFilter } = this.state;
        let series = [];
        let newArticleExpenseData = articleExpenseData.byArticle;
        
        if(selectedFilter === ChartFilter.CATEGORY) {
            const articleExpenseByCategory = [];
            newArticleExpenseData.forEach(article => {
                const existingIndex = articleExpenseByCategory.findIndex(articleItem => article.category === articleItem.category);
                if(existingIndex == -1) {
                    articleExpenseByCategory.push({...article, title: article.category || 'N/A'});
                    return;
                }
                articleExpenseByCategory[existingIndex].totalGross += article.totalGross;
            });
            newArticleExpenseData = articleExpenseByCategory;
        }

        newArticleExpenseData.forEach(article => {
            const value = parseFloat(article.totalGross);
            if(!value) return;

            // Others
            if(series.length >= 5) {
                const othersIndex = series.findIndex(item => item.meta === 'others');
                if(othersIndex === -1) {
                    series.push({
                        name: 'Others',
                        data: value,
                        meta: 'others',
                        className: `pie-${series.length + 1}`,
                        color: this.chartColors[series.length],
                        count: 1
                    });
                    return;
                }

                series[othersIndex].data += value;
                series[othersIndex].count++;
                return;
            }
            
            series.push({
                meta: article.title,
                className: `pie-${series.length + 1}`,
                data: value,
                name: article.title,
                onClick: article => {
                    AddAdvancedListComponentFilters({
                        webStorageKey: WebStorageKey.ARTICLE_LIST_SETTINGS, 
                        filterItems: {
                            title: {
                                filterType: "text",
                                type: "contains",
                                filter: article.title
                            }
                        }, 
                        url: '/articles'
                    });
                },
                color: this.chartColors[series.length]
            });
        });

        const totalValue = series.reduce((sum, item) => sum + item.data, 0).toFixed(2);
        series = series.slice(0, 6)
        const chartData = { 
            series, 
            totalValue, 
            chartTitle: 'Total Expense',
            updateCategoryFilter: this.updateCategoryFilter.bind(this)
        };
        this.setState({expensesByArticleChartData: chartData});
        return chartData;
    }
    
    createExpensesByPayeeChartData() {
        const { articleExpenseData, selectedFilter } = this.state;
        let newArticleExpenseData = articleExpenseData.byPayee;
        let series = [];

        if(selectedFilter === ChartFilter.CATEGORY) {
            const articleExpenseByCategory = [];
            newArticleExpenseData.forEach(article => {
                const existingIndex = articleExpenseByCategory.findIndex(articleItem => article.category === articleItem.category);
                // console.log('expenese by payee index', existingIndex)
                if(existingIndex == -1) {
                    articleExpenseByCategory.push({...article, customerData: {name: article.category || 'N/A'}});
                    return;
                }
                articleExpenseByCategory[existingIndex].totalGross += article.totalGross;
            });
            newArticleExpenseData = articleExpenseByCategory;
        }
        
        newArticleExpenseData.forEach(article => {
            const value = parseFloat(article.totalGross);
            if(!value) return;

            // Others
            if(series.length >= 5) {
                const othersIndex = series.findIndex(item => item.meta === 'others');
                if(othersIndex === -1) {
                    series.push({
                        name: 'Others',
                        data: value,
                        meta: 'others',
                        className: `pie-${series.length + 1}`,
                        color: this.chartColors[series.length],
                        count: 1
                    });
                    return;
                }

                series[othersIndex].data += value;
                series[othersIndex].count++;
                return;
            }
            
            series.push({
                meta: article.customerData.name,
                className: `pie-${series.length + 1}`,
                data: value,
                name: article.customerData.name,
                onClick: article => {
                    // console.log('article', article)
                    AddAdvancedListComponentFilters({
                        webStorageKey: WebStorageKey.EXPENSE_LIST_SETTINGS, 
                        filterItems: {
                            'customerData.name': {
                                filterType: "text",
                                type: "contains",
                                filter: article.name
                            }
                        }, 
                        url: '/articles'
                    });
                },
                color: this.chartColors[series.length]
            });
        });
        
        const totalValue = series.reduce((sum, item) => sum + item.data, 0).toFixed(2);
        series = series.slice(0, 6);
        const chartData = { 
            series, 
            totalValue, 
            chartTitle: 'Total Expense',
            updateCategoryFilter: this.updateCategoryFilter.bind(this)
        };
        this.setState({expensesByPayeeChartData: chartData});
        return chartData;
    }
    
    componentDidUpdate(prevProps, prevState) {
        if(prevState.articleExpenseData !== this.state.articleExpenseData) {
            this.createExpensesByArticleChartData();
            this.createExpensesByPayeeChartData();
        }
    }
    
    componentDidMount() {
        this.fetchArticleExpenseData();
    }

    async onDateChange(type, dateRange) {
        type = type ? type : DateFilterType.FISCAL_YEAR;

        switch (type) {
            case DateFilterType.CUSTOM:
                await this.setState({startDate: dateRange[0], endDate: dateRange[1]})
                break;
        }
        
        await this.setState({selectedDateFilterType: type});
        await this.fetchArticleExpenseData();
    }

    render() {
        const { isLoading, errorOccurred, selectedDateFilterType } = this.state;
        const { resources } = this.props;

        const tabs = [
            {
                name: 'Expenses by Article',
                chartData: this.state.expensesByArticleChartData, 
                refresh: this.createExpensesByArticleChartData.bind(this),
            },
            {
                name: 'Expenses by Payee',
                chartData: this.state.expensesByPayeeChartData,
                refresh: this.createExpensesByPayeeChartData.bind(this)
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
                    demoButtonText={"Create Expense"}
                    demoButtonLink={'/expense/new'}
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

export default connect(mapStateToProps)(DashboardExpenseArticleStatsComponent);
