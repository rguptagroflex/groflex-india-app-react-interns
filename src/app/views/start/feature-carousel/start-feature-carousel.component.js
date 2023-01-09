import React, { Component } from 'react';
import config from 'config'

import invoiz from 'services/invoiz.service';
import Carousel from '../../../shared/carousel/Carousel.component';

const banners = [
    { title: 'Dashboard', link: '/dashboard', src: '/assets/images/banners/dashboard.jpg' },
    // { title: 'GST Report', link: '/dashboard', src: '/assets/images/banners/' },
    { title: 'KYC', link: '/settings/account', src: '/assets/images/banners/kyc.jpg' },
    { title: 'Teams', link: '/settings/user', src: '/assets/images/banners/invite-users.jpg' },
]

class StartFeatureCarouselComponent extends Component {
    constructor(props) {
        super(props);

        this.carousel = null;
        this.state = { 
            featureBanners: banners,
            activeSlide: 0
        }
    }

    async fetchBanners() {
        // try {
        //     let banners = (await 
        //             invoiz.request(`${config.resourceHost}promotional-banners`, {auth: true, param: {client: 'web'}})
        //         ).body.data.feature;
        //     if(!banners.length) return;
        //     banners = banners.map(banner => {
        //         const link = carouselMap.find(item => item.title === banner.title).link || '/';
        //         return {...banner, link}
        //     })
        //     this.setState({featureBanners: banners})
        // } catch(error) {
        //     throw error;
        // }

    }

    componentDidMount() {
        // this.fetchBanners();
    }

    updateActiveSlide(newSlideIndex) {
        this.setState({activeSlide: newSlideIndex})
    }

    render() {
        return <div className="start-feature-carousel-container">
            <div className="widgetContainer box">
                <p className="box_title">Latest Updates</p>
                <Carousel activeSlide={this.state.activeSlide} updateActiveSlide={slide => this.updateActiveSlide(slide)}>
                    <Carousel.Slides>
                        {this.state.featureBanners.map((banner, index) => (
                            <img 
                                key={index}
                                className="banner-image"
                                src={banner.src}
                                onClick={() => invoiz.router.navigate(banner.link)}
                            />
                        ))}
                    </Carousel.Slides>
                    <Carousel.PageIndicators>
                        {this.state.featureBanners.map((banner, index) => (
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
        </div>;
    }
}
 
export default StartFeatureCarouselComponent;