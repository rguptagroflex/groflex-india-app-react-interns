import React from 'react';
import Chartist from 'chartist';

import Invoiz from 'services/invoiz.service';
import { formatCurrencySymbolDisplayInFront } from '../../../helpers/formatCurrency';
import { createChartTooltip } from '../../../helpers/createChartTooltip';
import WebStorageService from 'services/webstorage.service';
import WebStorageKey from 'enums/web-storage-key.enum';
import invoizService from 'services/invoiz.service';
import AddAdvancedListComponentFilters from '../../../helpers/addAdvancedListComponentFilters';
import SVGInline from 'react-svg-inline';
const redirectIcon = require(`assets/images/icons/arrow_up_right.svg`)

class StackedBarChartCardComponent extends React.Component {
    constructor(props) {
        super(props);

        this.defaultColors = ['FFC9C6', 'FF9792', 'FF5E54', 'D94339'];

        this.state = {
            invoiceData: {},
            demoMode: this.props.demoMode || false,
            title: this.props.title || '',
            desc: this.props.desc || '',
            demoText: this.props.demoText || '',
            demoButtonLink: this.props.demoButtonLink || '',
            demoButtonText: this.props.demoButtonText || '',
            chartData: this.props.chartData || [],
            totalAmount: this.props.totalAmount || 0,
            overdue3Days: this.props.overdue.days3 || 0,
            overdue15Days: this.props.overdue.days15 || 0,
            overdue45days: this.props.overdue.days45 || 0,
            overdueAbove45days: this.props.overdue.daysAbove45 || 0,
            colors: this.props.colors || this.defaultColors,
            viewBtnCallback: this.props.viewBtnCallback
        }
        
        this.target = `${this.props.title.toLowerCase().replaceAll(' ','_')}-stacked-bar-chart`;
    }

    onMouseEnter($point, $toolTip) {
        const isLabel = $point.hasClass('ct-label');

        if(!isLabel) {
            const value = $point.attr('ct:value');
			// const meta = $point.attr('ct:meta');
			const seriesName = $point.parent().attr('ct:series-name');
			$toolTip.html(`
                <div class='tooltip-wrapper'>
                    <p class='series-name'>${seriesName}</p>
                    <p class='series-value'>${formatCurrencySymbolDisplayInFront(value)}</p>
                </div>
            `).show();
        }
    }

    createChart() {
        const { 
            overdue3Days,
            overdue15Days,
            overdue45days,
            overdueAbove45days,
            totalAmount,
            chartData,
            colors,
        } = this.state;

        const chart = new Chartist.Bar(`.${this.target}`, {
            series: chartData
        }, {
            stackBars: true,
            horizontalBars: true,
            showPoint: false,
            showLine: false,
            showArea: true,
            fullWidth: true,
            showLabel: false,
            height: 20,
            high: totalAmount,
            width: '100%',
            chartPadding: 0,
            axisX: {
                showGrid: false,
                showLabel: false,
                offset: 0
            },
            axisY: {
              showGrid: false,
              showLabel: false,
              offset: 0
            },
        })

        if(!colors.length) return;
        chart.on('draw', bar => {
            const barElement = bar.element._node;
            barElement.style.stroke = `#${colors[bar.seriesIndex]}`;
            barElement.style.strokeWidth = '16px'
            barElement.onclick = event => bar.series.onClick()
        });

        createChartTooltip({
            target: this.target,
            tooltipSelector: '.ct-bar',
            onMouseEnter: this.onMouseEnter.bind(this)
        });
    }

    componentWillReceiveProps(newProps) {
        this.target = `${newProps.title.toLowerCase().replaceAll(' ','_')}-stacked-bar-chart`;
        this.setState({
            title: newProps.title,
            chartData: newProps.chartData,
            totalAmount: newProps.totalAmount,
            overdue3Days: newProps.overdue.days3,
            overdue15Days: newProps.overdue.days15,
            overdue45days: newProps.overdue.days45,
            overdueAbove45days: newProps.overdue.daysAbove45,
            colors: newProps.colors || this.defaultColors,
            demoMode: newProps.demoMode || false,
            demoText: newProps.demoText || '',
            demoButtonText: newProps.demoButtonText || '',
            viewBtnCallback: newProps.viewBtnCallback
        })
        
    }

    componentDidUpdate() {
        this.createChart()
    }

    render() {
        const { totalAmount, overdue3Days, title, desc, demoMode, demoText, demoButtonText, demoButtonLink, viewBtnCallback } = this.state;

        return <div className="stacked-bar-chart-card">
            <div className="box">
                <div className="head">
                    <p className="head-title">{title}</p>
                    {/* <a onClick={viewBtnCallback}>
                        View Customers
                        <SVGInline width="10px" height="10px" style={{marginLeft: '10px'}} svg={redirectIcon} />
                    </a> */}
                </div>
                <div className={`body ${demoMode ? 'demo' : ''}`}>
                    <div className="body-content">
                        <p className="body-desc">{desc}</p>
                        <div className="row">
                            <div className="col-xs-6 body-amount-col" style={{padding: '0 0.5rem'}}>
                                <p className="amount-text">TOTAL AMOUNT</p>
                                <p className="amount-value">{formatCurrencySymbolDisplayInFront(totalAmount)}</p>
                            </div>
                            <div className="col-xs-6 text-right body-overdue-col">
                                <p className="amount-text">OVER DUE (>3 DAYS)</p>
                                <p className="amount-value">{formatCurrencySymbolDisplayInFront(totalAmount - overdue3Days)}</p>
                            </div>
                        </div>
                        <hr />
                    </div>
                    <div className={`${this.target} stacked-bar-chart ${demoMode ? 'demo' : ''}`}></div>
                </div>
                {
                    demoMode &&
                    <div className="empty-placeholder-backdrop text-center">
                        <p>{demoText}</p>
                        <button className="icon icon-sales_outline" onClick={() => Invoiz.router.navigate(demoButtonLink)}>{demoButtonText}</button>
                    </div>
                }
            </div>
        </div>;
    }
}

export default StackedBarChartCardComponent;