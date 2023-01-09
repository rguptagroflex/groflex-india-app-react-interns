import React, { Component } from 'react';

const Slides = () => null;
const PageIndicators = () => null;
const PrevButton = () => null;
const NextButton = () => null;

class CarouselComponent extends Component {
    constructor(props) {
        super(props);

        this.slides = [];
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
        return result[0];
    }

    renderSlides() {
        this.slides = this.findSubComponent(this.props.children, Slides);
        if(!this.slides) return;

        return (
            <div className="carousel-content-wrapper">
                {this.slides.props.children.length > 1 && this.renderNextButton()}
                {this.slides.props.children.length > 1 && this.renderPrevButton()}
                {/* {this.slides.props.children.length > 1
                    ? this.renderNextButton() && this.renderPrevButton()
                    : null
                } */}
                <div className="carousel-inner" style={{transform: `translateX(-${this.props.activeSlide * 100}%)`}}>
                    { Array.isArray(this.slides.props.children)
                        ? this.slides.props.children.map(slide => <div className="carousel-item">{slide}</div> )
                        : this.slides.props.children
                    }
                </div>
            </div>
        )
    }

    renderPageIndicators() {
        const controllers = this.findSubComponent(this.props.children, PageIndicators);
        if(!controllers) return;
        return (
            <div className="carousel-controllers text-center">
                {controllers.props.children.length > 1 && controllers.props.children}
            </div>
        )
    }
    
    renderNextButton() {
        const nextButton = this.findSubComponent(this.props.children, NextButton);
        if(!nextButton) return;
        return <div className="carousel-next-btn" onClick={() => this.nextSlide()}>
            {nextButton.props.children}
        </div>;
    }

    renderPrevButton() {
        const prevbutton = this.findSubComponent(this.props.children, PrevButton);
        if(!prevbutton) return;
        return <div className="carousel-prev-btn" onClick={() => this.prevSlide()}>
            {prevbutton.props.children}
        </div>;
    }
    
    nextSlide() {
        let newIndex = this.props.activeSlide + 1;
        if(newIndex >= this.slides.props.children.length) newIndex = 0;
        this.props.updateActiveSlide(newIndex)
    }
    
    prevSlide() {
        let newIndex = this.props.activeSlide - 1;
        if(newIndex < 0) newIndex = this.slides.props.children.length - 1;
        this.props.updateActiveSlide(newIndex)
    }

    initAutoSlide() {
        if(this.props.interval === 0) return;   // disable auto slide
        const interval = this.props.interval || 5;  // 5 seconds by default
        setInterval(() => this.nextSlide(), 1000 * interval);
    }

    componentDidMount() {
        this.initAutoSlide();
    }

    render() {
        return <div className="carousel">
            {this.renderSlides()}
            {this.renderPageIndicators()}
        </div>;
    }
}

CarouselComponent.Slides = Slides;
CarouselComponent.PageIndicators = PageIndicators;
CarouselComponent.PrevButton = PrevButton;
CarouselComponent.NextButton = NextButton;

export default CarouselComponent;