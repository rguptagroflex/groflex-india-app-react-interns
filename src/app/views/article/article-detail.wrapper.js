import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import q from 'q';
import store from 'redux/store';
import { Provider, connect } from 'react-redux';
import Article from 'models/article.model';
import Inventory from 'models/inventory.model';
import InventoryHistory from 'models/inventory-history.model';
import ArticleDetailComponent from './article-detail.component';
import LoaderComponent from 'shared/loader/loader.component';

class ArticleDetailWrapper extends React.Component {
    constructor(props) {
		super(props);
		
		this.state = {
			preFetchData: null
		};
	}

    componentDidMount() {
		this.preFetch();
	}

    componentWillUnmount() {
		this.ignoreLastFetch = true;
	}

    preFetch ()  {
		const { resources } = this.props;
		const id = this.props && this.props.match && this.props.match.params && this.props.match.params.id;

		const fetchData = () => {
			const articleId = parseInt(id, 10);

			const articleRequest = invoiz.request(`${config.article.resourceUrl}/${articleId}`, {
				auth: true
			});

			const salesRequest = invoiz.request(`${config.article.resourceUrl}/${articleId}/salesVolume`, {
				auth: true
			});

			return q.all([articleRequest, salesRequest]);
		};

		const showDetails = (articleResponse, salesResponse) => {
			const article = new Article(articleResponse.body.data);
			const salesVolumeData = salesResponse.body.data;

			if (!this.ignoreLastFetch) {
				// this.setState({
				// 	preFetchData: {
				// 		article,
				// 		salesVolumeData
				// 	}
				// }, () => {
					if (article['trackedInInventory']) {
						invoiz.request(`${config.inventory.resourceUrl}/${parseInt(id, 10)}`, { 
							auth: true 
						}).then((response) => {
							const inventory = new Inventory(response.body.data);
							//this.setState({preFetchData: {inventory, article, salesVolumeData}, })

							invoiz.request(`${config.resourceHost}inventory/history/${parseInt(response.body.data.id, 10)}`, {
								auth: true
							}).then((response) => {
								const inventoryHistory = response.body.data;
								this.setState({preFetchData: {inventory, inventoryHistory, article, salesVolumeData}})
							})
						})
						.catch((error) => {
							invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
						})

					} else {
						this.setState({
							preFetchData: {
								article,
								salesVolumeData
							}
						})
					}
				// });
			}
		};

		const onFetchError = () => {
			invoiz.router.navigate('/articles');
			invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
		};

		q.fcall(fetchData)
			.spread(showDetails)
			.catch(onFetchError)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;
		const inventoryHistoryColumns = [
			{key: "itemModifiedDate", resourceKey: "itemModifiedDate", sorted: "desc", title: "Date", width: "130px"},
			{key: "quantity", resourceKey: "quantity", sorted: "desc", title: "quantity", width: "130px"},
			{key: "currentStock", resourceKey: "currentStock", sorted: "desc", title: "Date", width: "130px"},
			// {key: "value", resourceKey: "value", sorted: "desc", title: "Date", width: "130px"},
			{key: "action", resourceKey: "action", sorted: "desc", title: "Date", width: "130px"},
			{key: "source", resourceKey: "source", sorted: "desc", title: "Date", width: "130px"}
		]
		return preFetchData ? (
			<Provider store={store}>
				<ArticleDetailComponent article={preFetchData.article} inventory={preFetchData.inventory} inventoryHistory={preFetchData.inventoryHistory} inventoryHistoryColumns={inventoryHistoryColumns} salesVolumeData={preFetchData.salesVolumeData} />
			</Provider>
		) : (
			<div className="box main">
				<LoaderComponent text={resources.articleLoadingArticle} visible={true} />
			</div>
		);
	}
}

const mapStateToProps = state => {
	const { resources } = state.language.lang;
	return { resources };
};

export default connect(mapStateToProps)(ArticleDetailWrapper);
