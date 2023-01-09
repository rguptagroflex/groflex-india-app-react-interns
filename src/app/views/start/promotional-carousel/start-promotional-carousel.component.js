import React, { Component } from 'react';

import config from 'config'
import invoiz from 'services/invoiz.service';
import Carousel from '../../../shared/carousel/Carousel.component';
import TryImprezzAppModal from 'shared/modals/try-app/try-imprezz-app-modal.component';
import ModalService from "services/modal.service";

class StartPromotionalCarouselComponent extends Component {
    constructor(props) {
        super(props);
        
        const banners = [
            // { title: 'Promotional Banners Web', onClick: () => this.openTryImprezzMobileModal() },
            { title: 'Try Mobile app Banner', onClick: () => this.openTryImprezzMobileModal(), src: '/assets/images/banners/try-mobile-app.jpg' },
        ]

        this.state = {
            promotionalBanners: banners,
            activeSlide: 0
        }
    }

    openTryImprezzMobileModal() {
        ModalService.open(<TryImprezzAppModal />, {
            width: 936,
            padding: 40,
            noTransform: true,
            isCloseable: true,
            isCloseableViaOverlay: true,
            modalClass: 'try-imprezz-app-modal-component'
        })
    }

    // async fetchBanners() {
    //     try {
    //         let banners = (await 
    //                 invoiz.request(`${config.resourceHost}promotional-banners`, {auth: true, param: {client: 'web'}})
    //             ).body.data.promotional;
    //         if(!banners.length) return;
    //         banners = banners.map(banner => {
    //             const onClick = this.carouselMap.find(item => item.title === banner.title).onClick || '/';
    //             return {...banner, onClick}
    //         })
    //         this.setState({promotionalBanners: banners})
    //     } catch(error) {
    //         throw error;
    //     }
    // }

    componentDidMount() {
        // this.fetchBanners();
    }

    updateActiveSlide(newSlideIndex) {
        this.setState({activeSlide: newSlideIndex})
    }

    render() { 
        //'block': 'none'
        return <div className="col-sm-6" style={{display: this.state.promotionalBanners.length ? 'none': 'none'}}> 
            <div className="start-promotional-carousel-container">
                <div className="widgetContainer box">
                    <Carousel activeSlide={this.state.activeSlide} updateActiveSlide={slide => this.updateActiveSlide(slide)}>
                        <Carousel.Slides>
                            {this.state.promotionalBanners.map((banner, index) => (
                                <img
                                    key={index}
                                    className="banner-image"
                                    src={banner.src}
                                    onClick={() => banner.onClick()}
                                />
                            ))}
                        </Carousel.Slides>
                        <Carousel.PageIndicators>
                            {this.state.promotionalBanners.map((banner, index) => (
                                <button
                                    key={index}
                                    className={index === this.state.activeSlide ? 'active':''}
                                    onClick={() => this.updateActiveSlide(index)}
                                />
                            ))}
                        </Carousel.PageIndicators>
                        <Carousel.NextButton><button>{">"}</button></Carousel.NextButton>
                        <Carousel.PrevButton><button>{"<"}</button></Carousel.PrevButton>
                    </Carousel>
                </div>
            </div>
        </div>
    }
}
 
export default StartPromotionalCarouselComponent;