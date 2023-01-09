import React from 'react';
import invoiz from 'services/invoiz.service';
import config from 'config';
import ModalService from 'services/modal.service';
import InventoryAddRemoveModal from 'shared/modals/inventory-add-remove-modal.component';
import { connect } from 'react-redux';
import Carousel from '../../../shared/carousel/Carousel.component';

class StartArticlesLowOnStockComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            articles: [],
            articleSlides: [],
            activeSlide: 0
         }
    }

    onSuccess(article) {
        this.setState({
            articles: this.state.articles.filter(articleItem => articleItem.id !== article.id)
        })
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
        const inventoryURL = `${config.resourceHost}inventory?images=true`;
        const articlesURL = `${config.resourceHost}article`;
        const articleList = (await invoiz.request(articlesURL, { auth: true })).body.data;
        const inventoryList = (await invoiz.request(inventoryURL, { auth: true })).body.data;
        const articles = articleList.map((article, index) => {
            const inventoryItem = inventoryList.find(item => item.articleId === article.id);
            if(!inventoryItem) return;
            if(inventoryItem.currentStock > inventoryItem.minimumBalance) return;

            return {
                ...article,
                inventoryId: inventoryItem.id,
                currentStock: inventoryItem.currentStock,
                minimumBalance: inventoryItem.minimumBalance,
                value: inventoryItem.value,
                itemModifiedDate: inventoryItem.itemModifiedDate,
                unit: inventoryItem.unit,
                avgPurchaseValue: inventoryItem.avgPurchaseValue
            }
        }).filter(article => article)
        const articleSlides = this.paginate(articles, 3)
        this.setState({articles, articleSlides});
    }

    openLowStockArticleModal(article, type='Add') {
        ModalService.open(<InventoryAddRemoveModal resources={this.props.resources} actionType={type} btnSelectedRow={article} onConfirm={(response) => {
            const updatedData = response.body.data;
            invoiz.page.showToast({ message: `Successfully updated article stock!` });
            ModalService.close();
            invoiz.router.reload();
        }}/>, {
            headline: `${type} article stock`,
            width: 520,
            padding: 40,
            noTransform: true,
            isCloseableViaOverlay: false
        })
    }

    componentDidMount() {
        this.fetchArticles()
    }

    render() { 
        return (
            <div className="col-sm-6" style={{display: this.state.articleSlides.length ? 'block': 'none'}}>
                <div className="start-track-articles">
                    <div className="widgetContainer box">
                        <p className="text-h5" style={{marginTop: 0}}>Articles Low on Stock</p>

                        <div className="articles-list">
                            <Carousel interval={0} activeSlide={this.state.activeSlide}>
                                <Carousel.Slides>
                                    {this.state.articleSlides.map((slide, index) => (
                                        <div className="article-slide" style={{width: '100%'}}>
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
                                                            <button className="track-btn" onClick={() => this.openLowStockArticleModal(article)} style={{alignSelf: 'flex-start', background: 'none', border: '2px solid #0079B3', borderRadius: '20px', color: '#0079B3', padding: '5px 15px', fontWeight: 600}}>Add</button>
                                                        </div>
                                                        <div className="row" style={{width: '100%', margin: 0}}>
                                                            <div className="col-sm text-left">
                                                                <p className="text-muted" style={{marginTop: `5px`}}>MRP</p>
                                                                <p style={{marginTop: 0}}>₹{article.mrp || '-'}</p>
                                                            </div>
                                                            <div className="col-sm text-center">
                                                                <p className="text-muted" style={{marginTop: `5px`}}>Selling Price</p>
                                                                <p style={{marginTop: 0}}>₹{article.priceGross}</p>
                                                            </div>
                                                            <div className="col-sm text-right">
                                                                <p className="text-muted" style={{marginTop: `5px`}}>Quantity</p>
                                                                <p style={{marginTop: 0}}>{article.currentStock || "-"}</p>
                                                            </div>
                                                        </div>
                                                        {index !== this.state.articles.length - 1 && <hr></hr>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </Carousel.Slides>
                            </Carousel>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return {
		resources
	};
};

export default connect(mapStateToProps)(StartArticlesLowOnStockComponent);