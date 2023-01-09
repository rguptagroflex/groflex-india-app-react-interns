import invoiz from 'services/invoiz.service';
import React from 'react';
import config from 'config';
import q from 'q';
import { getMiscellaneousData } from 'helpers/getSettingsData';
import Article from 'models/article.model';
import ArticleEditComponent from './article-edit.component';
import LoaderComponent from 'shared/loader/loader.component';
import { connect } from 'react-redux';

class ArticleNewWrapper extends React.Component {
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
		const fetchData = () => {
			const requests = [
				invoiz.request(config.article.endpoints.nextArticleNumber, { auth: true }),
				getMiscellaneousData()
			];
			return q.all(requests);
		};

		const onFetchError = response => {
			invoiz.router.navigate('/articles');
			this.showToast({ message: resources.defaultErrorMessage, type: 'error' });
		};

		const showNew = (nextNumber, miscellaneousData) => {
			const article = new Article();
			article.unit = miscellaneousData.body.data.articleUnits[0];

			if (!this.ignoreLastFetch) {
				this.setState({
					preFetchData: {
						article,
						nextArticleNumber: nextNumber.body.data,
						units: miscellaneousData.body.data.articleUnits,
						categories: miscellaneousData.body.data.articleCategories
					}
				});
			}
		};

		q.fcall(fetchData)
			.catch(onFetchError)
			.spread(showNew)
			.done();
	};

    render() {
		const { preFetchData } = this.state;
		const { resources } = this.props;

		return preFetchData ? (
			<ArticleEditComponent
				nextArticleNumber={preFetchData.nextArticleNumber}
				article={preFetchData.article}
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

export default connect(mapStateToProps)(ArticleNewWrapper);
