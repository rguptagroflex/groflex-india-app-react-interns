import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import q from 'q';
import { getMiscellaneousData } from 'helpers/getSettingsData';
import Article from 'models/article.model';
import Inventory from 'models/inventory.model';
import ArticleEditComponent from './article-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class ArticleEditWrapper extends React.Component {
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
			const requests = [
				invoiz.request(`${config.article.resourceUrl}/${parseInt(id, 10)}`, { auth: true }),
				getMiscellaneousData()
			];

			return q.all(requests);
		};

		const onFetchError = response => {
			invoiz.router.navigate('/articles');
			invoiz.showNotification({ message: resources.defaultErrorMessage, type: 'error' });
		};

		const showEdit = (articleResponse, miscellaneousData) => {
			const {
				body: { data }
			} = articleResponse;

			const article = new Article(data);

			try {	
				if (!this.ignoreLastFetch) {
					// this.setState({
					// 	preFetchData: {
					// 		article,
					// 		units: miscellaneousData.body.data.articleUnits,
					// 		categories: miscellaneousData.body.data.articleCategories
					// 	}
					// });
					if (article['trackedInInventory']) {
						invoiz.request(`${config.inventory.resourceUrl}/${parseInt(id, 10)}`, { 
							auth: true 
						}).then((response) => {
							const inventory = new Inventory(response.body.data);
							this.setState({preFetchData: {inventory, article, units: miscellaneousData.body.data.articleUnits,
								categories: miscellaneousData.body.data.articleCategories}})
						})
						.catch((error) => {
							invoiz.showNotification({ type: 'error', message: resources.defaultErrorMessage });
						})

					} else {
						this.setState({
							preFetchData: {
								article,
								units: miscellaneousData.body.data.articleUnits,
								categories: miscellaneousData.body.data.articleCategories
							}
						})
					}
				}
			} catch (e) {
				console.log(e);
			}
		};

		q.fcall(fetchData)
			.catch(onFetchError)
			.spread(showEdit)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<ArticleEditComponent
				article={preFetchData.article}
				inventory={preFetchData.inventory}
				units={preFetchData.units}
				categories={preFetchData.categories}
				resources={resources}
			/>
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

export default connect(mapStateToProps)(ArticleEditWrapper);
