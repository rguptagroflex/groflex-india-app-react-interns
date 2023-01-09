import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import modalService from 'services/modal.service';
import TrackArticleModal from 'shared/modals/articles/track-article-modal.component';
import planPermissions from "enums/plan-permissions.enum";
import Carousel from '../../../shared/carousel/Carousel.component';

class StartTrackArticlesComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            articles: [],
            articleSlides: [],
            activeSlide: 0,
			isInventoryActive: !(invoiz.user && invoiz.user.hasPlanPermission(planPermissions.NO_INVENTORY)),
         }
    }

    paginate (arr, size) {
        return arr.reduce((acc, val, i) => {
            let idx = Math.floor(i / size)
            let page = acc[idx] || (acc[idx] = [])
            page.push(val)
            
            return acc
        }, [])
    }
    
    async fetchArticles() {
        const    articlesURL = `${config.resourceHost}article?images=true`;
        const articleList = (await invoiz.request(articlesURL, { auth: true })).body.data;
        // const untrackedArticles = articleList
        const untrackedArticles = articleList.filter(article => !article.trackedInInventory);
        const articleSlides = this.paginate(untrackedArticles, 3)
        this.setState({articles: untrackedArticles, articleSlides});
    }

    onTrackComplete(article) {
        const articles = this.state.articles.filter(articleItem => articleItem.id !== article.id);
        const articleSlides = this.paginate(articles, 3);
        this.setState({articles, articleSlides})
    }

    openTrackArticleModal(article) {
        modalService.open(<TrackArticleModal article={article} onSuccess={() => this.onTrackComplete(article)} />, {
            headline: `Track Article`,
            width: 520,
            padding: 40,
            noTransform: true,
            isCloseableViaOverlay: true
        })
    }

    updateActiveSlide(newSlideIndex){
        this.setState({activeSlide: newSlideIndex})
    }

    componentDidMount() {
        this.fetchArticles()
    }

    render() { 
        return (
            <div className="col-sm-6" style={{display: this.state.articles.length ? 'block': 'none'}}>
                <div className="start-track-articles">
                    <div className="widgetContainer box">
                        <p className="text-h5" style={{marginTop: 0}}>Track Recent Articles</p>

                        <div className="articles-list">

                            <Carousel interval={0} activeSlide={this.state.activeSlide}>
                                <Carousel.Slides>
                                    {this.state.articleSlides.map((slide, slideIndex) => (
                                        <div key={slideIndex} className="article-slide" style={{width: '100%'}}>
                                            {slide.map((article, index) => (
                                                <div key={index} className="article" style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                                                    <img 
                                                        style={{width: '60px', height: 'max-content', marginRight: '10px'}}
                                                        src={(article.internalImageUrl 
                                                            ? `${config.imageResourceHost}${article.internalImageUrl}` 
                                                            : article.externalImageUrl
                                                            ) || "/assets/images/icons/article_img_placeholder.svg"
                                                        } 
                                                    />
                                                    <div style={{flexGrow: 100}}>
                                                        <div style={{padding: '0 0.5rem', display: 'flex', justifyContent: 'space-between'}}>
                                                            <p className="text-h6" style={{margin: 0, whiteSpace: 'break-spaces'}}>{article.title}</p>
                                                            {
                                                                this.state.isInventoryActive && (
                                                                    <button 
                                                                        className="track-btn"
                                                                        onClick={() => this.openTrackArticleModal(article)}
                                                                        style={{display: 'inline-block', float: 'right', background: 'none', border: '2px solid #0079B3', borderRadius: '15px', color: '#0079B3', padding: '5px 15px', fontWeight: 600}}
                                                                    >
                                                                        Track
                                                                    </button>
                                                                )
                                                            }
                                                        </div>
                                                        <div className="row" style={{width: '100%', margin: 0}}>
                                                            <div className="col-sm text-left">
                                                                <p className="text-muted" style={{marginTop: `5px`}}>MRP</p>
                                                                <p style={{marginTop: 0}}>₹{article.mrp || ''}</p>
                                                            </div>
                                                            <div className="col-sm text-center">
                                                                <p className="text-muted" style={{marginTop: `5px`}}>Selling Price</p>
                                                                <p style={{marginTop: 0}}>₹{article.priceGross}</p>
                                                            </div>
                                                            <div className="col-sm text-right">
                                                                <p className="text-muted" style={{marginTop: `5px`}}>Quantity</p>
                                                                <p style={{marginTop: 0}}>{article.quantity || "-"}</p>
                                                            </div>
                                                        </div>
                                                        {
                                                            ((this.state.articleSlides.length > 1 && index != slide.length - 1) 
                                                            || (this.state.articleSlides.length === 1 && index != slide.length - 1))
                                                            && <hr></hr>
                                                        }
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </Carousel.Slides>
                                <Carousel.PageIndicators>
                                    {this.state.articleSlides.map((article, index) => (
                                        <button
                                            key={index}
                                            className={index === this.state.activeSlide ? 'active':''}
                                            onClick={() => this.updateActiveSlide(index)}
                                        />
                                    ))}
                                </Carousel.PageIndicators>
                            </Carousel>

                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
 
export default StartTrackArticlesComponent;