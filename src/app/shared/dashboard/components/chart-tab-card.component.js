import React from 'react';
import Chartist from 'chartist';
import moment from 'moment';
import ChartistSliceDonutMargin from 'chartist-plugin-slicedonutmargin';
import SVGInline from 'react-svg-inline';

import Tabs from '../../tabs/tabs.component';
import { formatCurrencySymbolDisplayInFront } from '../../../helpers/formatCurrency';
import { createChartTooltip } from '../../../helpers/createChartTooltip';
import SelectInputComponent from '../../inputs/select-input/select-input.component';
import DateInputComponent from '../../inputs/date-input/date-input.component';

const redirectIcon = require(`assets/images/icons/arrow_up_right.svg`)
const calenderIcon = require('assets/images/icons/calender.svg');
const BarChartIcon = require('assets/images/svg/charts/bar-chart.svg');
const PieChartIcon = require('assets/images/svg/charts/pie-chart.svg');

class ChartTabCardComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: 0,
            chartTitle: props.chartTitle || 'Total',
            activeChartType: props.activeChartType || 'pie',
            activeChartData: {series: []},
            isSubSeriesActive: false,
            showCustomDateRangeSelector: false,
            customStartDate: moment().subtract(1, 'months'),
            customEndDate: moment(),
            dateFilterValue: props.selectedDateFilterType || '',
            categoryFilterValue: 'name',
            showCategoryFilter: props.showCategoryFilter || false,
            showDateFilter: props.showDateFilter || false,
            tabs: props.tabs || [],
            demoText: this.props.demoText || '',
            demoButtonLink: this.props.demoButtonLink || '',

            currentMonthName: moment().format('MMMM'),
            lastMonthName: moment().subtract(1, 'months').format('MMMM'),
            secondLastMonth: moment().subtract(2, 'months').format('MMMM'),
            currQuarter: moment().startOf('quarter').format('Q/YYYY'),
            lastQuarter: moment().subtract(3, 'months').startOf('quarter').format('Q/YYYY'),
            secondLastQuarter: moment().subtract(6, 'months').startOf('quarter').format('Q/YYYY'),
        }
    }

    createPieChart(name, chartData) {
        const chartClassName = `${name.replaceAll(' ', '_')}-pie-chart`;
        const chart = new Chartist.Pie(
            `.${chartClassName}`,
			{ series: chartData.series || [] },
			{
                donut: true,
                showLabel: false,
				labelOffset: 10,
                donutWidth: 40,
                width: 268.8,
                height: 270,
				plugins: [
                    ChartistSliceDonutMargin({
                        sliceMargin: chartData.length === 1 ? 0 : 4
					})
				]
			}
        );

        chart.on('draw', slice => {
            const node = slice.group._node;
            node.style.stroke = '#' + chartData.series[slice.index].color;
            node.onclick = event => {
                slice.series.subSeriesData.series.length 
                    ? this.subCategoryOnClick(name, slice.series.subSeriesData) 
                    : null
            }
        })

        createChartTooltip({
            target: chartClassName,
            tooltipSelector: '.ct-slice-donut',
            onMouseEnter: ($point, $toolTip) => {
                const seriesName = $point.parent().attr('ct:series-name');
                const value = $point.attr('ct:value');

                $toolTip.html(`
                    <div class='tooltip-wrapper'>
                        <p class='series-name'>${seriesName}</p>
                        <p class='series-value'>${formatCurrencySymbolDisplayInFront(value)}</p>
                    </div>
                `).show();
            }
        });
    }

    createBarChart(name, chartData) {
        const labels = chartData.series.map(item => item.name);
        
        const chartClassName = `${name.replaceAll(' ', '_')}-bar-chart`;
        const chart = new Chartist.Bar(
            `.${chartClassName}`,
			{
                series: chartData.series || [], 
                labels
            },
			{
                distributeSeries: true,
                showLine: false,
                axisX: {
                    showGrid: false,
                }
            }
        );

        chart.on('draw', bar => {
            const node = bar.element._node;
            if(!node.classList.contains('ct-bar')) return;
            node.style.stroke = '#' + chartData.series[bar.seriesIndex].color;
            node.style['stroke-width'] = 40;
            node.onclick = event => {
                console.log('event', event, bar)
                bar.series.subSeriesData.series.length 
                    ? this.subCategoryOnClick(name, bar.series.subSeriesData) 
                    : null
            }
        })

        createChartTooltip({
            target: chartClassName,
            tooltipSelector: '.ct-bar',
            onMouseEnter: ($point, $toolTip) => {
                const seriesName = $point.parent().attr('ct:series-name') || '';
                const value = $point.attr('ct:value');

                console.log('point', $point)

                $toolTip.html(`
                    <div class='tooltip-wrapper'>
                        <p class='series-name'>${seriesName}</p>
                        <p class='series-value'>${formatCurrencySymbolDisplayInFront(value)}</p>
                    </div>
                `).show();
            }
        });

        // createChartTooltip({
        //     target: chartClassName,
        //     tooltipSelector: '.ct-bar',
        //     onMouseEnter: ($point, $toolTip) => {
        //         console.log($point, $toolTip)
        //         const seriesName = $point.parent().attr('ct:series-name');
        //         const value = $point.attr('ct:value');

        //         console.log(seriesName, value)

        //         $toolTip.html(`
        //             <div class='tooltip-wrapper'>
        //                 <p class='series-name'>${seriesName}</p>
        //                 <p class='series-value'>${formatCurrencySymbolDisplayInFront(value)}</p>
        //             </div>
        //         `).show();
        //     }
        // });
    }

    createChart(name, chartData) {
        if(!chartData || !chartData.series) return;
        this.state.activeChartType === 'pie'
            ? this.createPieChart(name, chartData)
            : this.createBarChart(name, chartData)

        this.setState({activeChartData: chartData});
    }

    setActiveTab(tabIndex) {
        this.setState({
            activeTab: tabIndex,
            isSubSeriesActive: false
        });
        this.props.tabs[tabIndex].refresh();
    }

    toggleChartType() {
        this.setState({activeChartType: this.state.activeChartType === 'pie' ? 'bar' : 'pie'})
    }
    
    componentDidUpdate(prevProps, prevState) {
        if(prevState.tabs !== this.state.tabs || prevState.activeChartType !== this.state.activeChartType) {
            this.state.tabs.forEach((tab, index) => {
                this.state.activeTab === index
                    ? this.createChart(tab.name, tab.chartData)
                    : null
            });
        }
    }
    
    componentWillReceiveProps(newProps) {
        this.setState({tabs: newProps.tabs,  demoText: newProps.demoText || '',
        demoButtonText: newProps.demoButtonText || '',})
    }

    subCategoryOnClick(name, subSeriesData) {
        this.setState({isSubSeriesActive: true})
        this.createChart(name, subSeriesData)
    }

    async onBackPressed() {
        const activeTab = this.state.tabs[this.state.activeTab];
        await this.setState({
            activeChartData: activeTab.chartData,
            isSubSeriesActive: false
        });
        this.createChart(activeTab.name, activeTab.chartData)
    }

    async updateSelectedDate(option) {
        this.setState({dateFilterValue: option.value});

        switch(option.value) {
            case 'custom':
                this.props.onDateChange(option.value, [this.state.customStartDate, this.state.customEndDate])
                this.setState({showCustomDateRangeSelector: true});
                break;
            default:
                this.props.onDateChange(option.value)
                this.setState({showCustomDateRangeSelector: false})
                break;
        }
    }

    async updateCategoryFilter(option) {
        this.setState({categoryFilterValue: option.value});
        await this.state.activeChartData.updateCategoryFilter(option.value);
        this.state.tabs[this.state.activeTab].refresh();
    }

    componentDidMount() {
        this.state.showDateFilter && this.props.onDateChange(this.state.dateFilterValue);
    }

    render() {
        const { 
            isSubSeriesActive, 
            showCustomDateRangeSelector, 
            showDateFilter, 
            showCategoryFilter,
            dateFilterValue, 
            categoryFilterValue,
            customStartDate, 
            customEndDate,
            currentMonthName,
            lastMonthName,
            secondLastMonth,
            currQuarter,
            lastQuarter,
            secondLastQuarter,
            demoButtonText, demoButtonLink
        } = this.state;

        const dateOptions = [
            { label: currentMonthName, value: 'currMonth', group: 'month' },
			{ label: lastMonthName, value: 'lastMonth', group: 'month' },
			{ label: secondLastMonth, value: 'secondLastMonth', group: 'month' },
			{ label: `Quarter ${currQuarter}`, value: 'currQuarter', group: 'quarter' },
			{ label: `Quarter ${lastQuarter}`, value: 'lastQuarter', group: 'quarter' },
			{ label: `Quarter ${secondLastQuarter}`, value: 'secondLastQuarter', group: 'quarter' },
			{ label: 'Fiscal Year', value: 'fiscalYear', group: 'year' },
			{ label: 'Custom', value: 'custom', group: 'custom' },
        ]

        const filterOptions = [
            { label: 'Filter By Name', value: 'name' },
            { label: 'Filter By Category', value: 'category' }
        ]

        return <div className="chart-card-tab-component" style={{position: 'relative'}}>
            <Tabs activeTab={this.state.activeTab} setActiveTab={tab => this.setActiveTab(tab)}>
                <Tabs.List>
                    {this.props.tabs.map((tab, index) => (
                        <p key={index}>{tab.name}</p>
                    ))}
                </Tabs.List>
                <Tabs.Contents>
                    {this.props.tabs.map((tab, index) => (
                        <React.Fragment key={index}>
                            <button onClick={this.toggleChartType.bind(this)} className="chart-type-toggle">
                                {this.state.activeChartType === 'pie'
                                    ? <SVGInline svg={BarChartIcon} />
                                    : <SVGInline svg={PieChartIcon} />
                                }
                            </button>

                            {
                                showCategoryFilter &&
                                <div className="category-filter-select">
                                    <SelectInputComponent
                                        allowCreate={false}
                                        notAsync={true}
                                        loadedOptions={filterOptions}
                                        value={categoryFilterValue}
                                        options={{
                                            clearable: false,
                                            noResultsText: false,
                                            labelKey: 'label',
                                            valueKey: 'value',
                                            matchProp: 'label',
                                            placeholder: 'Select Date',
                                            handleChange: option => {
                                                this.updateCategoryFilter(option);
                                            }
                                        }}
                                    />
                                </div>
                            }

                            {showDateFilter && 
                                (
                                    <div className="time-period-select">
                                        <SelectInputComponent
                                            allowCreate={false}
                                            notAsync={true}
                                            loadedOptions={dateOptions}
                                            value={dateFilterValue}
                                            icon={calenderIcon}
                                            containerClass="date-input"
                                            options={{
                                                clearable: false,
                                                noResultsText: false,
                                                labelKey: 'label',
                                                valueKey: 'value',
                                                matchProp: 'label',
                                                placeholder: 'Select Date',
                                                handleChange: option => {
                                                    this.updateSelectedDate(option);
                                                }
                                            }}
                                        />

                                        {
                                            showCustomDateRangeSelector &&
                                            (
                                                <div className="start-end-date-selector-group">
                                                    <DateInputComponent
                                                        name={'date'}
                                                        value={customStartDate.format('DD-MM-YYYY')}
                                                        required={true}
                                                        label={'Start Date'}
                                                        noBorder={true}
                                                        onChange={(name, value) => {
                                                            console.log('setting custom start date')
                                                            this.setState({ customStartDate: moment(value, 'DD-MM-YYYY')})
                                                            this.updateSelectedDate({value: 'custom'})
                                                        }}
                                                    />
                                                    <DateInputComponent
                                                        name={'date'}
                                                        value={customEndDate.format('DD-MM-YYYY')}
                                                        required={true}
                                                        label={'End Date'}
                                                        noBorder={true}
                                                        onChange={(name, value) => {
                                                            this.setState({ customEndDate: moment(value, 'DD-MM-YYYY')})
                                                            this.updateSelectedDate({value: 'custom'})
                                                        }}
                                                    />
                                                </div>
                                            )
                                        }
                                    </div>
                                )
                            }
                            
                            {isSubSeriesActive && 
                                <div className="back-button" onClick={this.onBackPressed.bind(this)}>
                                    <span className="tab-name">{`< ${tab.name}`}</span>
                                    <span className="sub-series-name"> / {this.state.activeChartData.name}</span>
                                </div>
                            }

                            <div className={`donut-chart-wrapper`}>
                                {this.state.activeChartType === 'pie'
                                    ? <div>
                                            <div className={`${tab.name.replaceAll(' ', '_')}-pie-chart chartist-chart chartist-donut-chart text-center`} />
                                            <div className="chart-label chartLabel_totalSalesSum_value text-center">
                                                <p className="chart-label-text">{
                                                    parseFloat(this.state.activeChartData.totalValue)
                                                        ? this.state.activeChartData.chartTitle
                                                        : 'No data available for the selected period'
                                                }
                                                { parseFloat(this.state.activeChartData.totalValue) ? '' : <button className="icon icon-sales_outline" onClick={() => Invoiz.router.navigate(demoButtonLink)}>{demoButtonText}</button>}
                                                </p>
                                                <span className="chart-label-value">{
                                                    parseFloat(this.state.activeChartData.totalValue)
                                                        ? formatCurrencySymbolDisplayInFront(this.state.activeChartData.totalValue || 0)
                                                        : ''
                                                }</span>
                                            </div>
                                        </div>
                                    : <div className="chart-label text-center">
                                        <p className="chart-label-text">{
                                            parseFloat(this.state.activeChartData.totalValue)
                                                ? <div className={`${tab.name.replaceAll(' ', '_')}-bar-chart chartist-chart bar-chart text-center`} />
                                                : <p style={{
                                                        fontSize: '16px',
                                                        color: '#747474',
                                                        margin: '4px 0',
                                                        fontWeight: 600
                                                    }}>
                                                    No data available for the selected period
                                                    <button className="icon icon-sales_outline" onClick={() => Invoiz.router.navigate(demoButtonLink)}>{demoButtonText}</button>
                                                </p>
                                        }</p>
                                    </div>
                                }
                            </div>

                            {tab.chartData.series && 
                                <div 
                                    className="row value-categories"
                                    style={{justifyContent: 'space-between', padding: '0 50px'}}
                                >
                                    {this.state.activeChartData.series.map((category, index) => {
                                        if(!category.subSeriesData) category.subSeriesData = {series: []}
                                        return (
                                            <div 
                                                className="value-category col-sm-6"
                                                style={{padding: 0, minWidth: '180px'}}
                                                onClick={() => category.onClick(category) || null}
                                                key={index}
                                                // onClick={category.subSeriesData.series.length ? () => this.subCategoryOnClick(tab.name, category.subSeriesData) : null} 
                                            >
                                                <span className="value-category-dot" style={{backgroundColor: `#${category.color}`}}></span>
                                                <div>
                                                    <p className="value-category-text">{category.name}
                                                        {
                                                            category.count !== null && category.count !== undefined
                                                                ? ` (${category.count})`
                                                                : ''
                                                        }
                                                        <SVGInline width="10px" height="10px" style={{marginLeft: '7px'}} svg={redirectIcon} />
                                                    </p>
                                                    <p className="value-category-value">
                                                        {formatCurrencySymbolDisplayInFront(category.data)}
                                                        <span>| {((category.data * 100) / this.state.activeChartData.totalValue).toFixed(1)}%</span>
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            }
                        </React.Fragment>
                    ))}
                </Tabs.Contents>
            </Tabs>
        </div>;
    }
}
 
export default ChartTabCardComponent;