import React from 'react';
import ImpressArticleListComponent from './impress-article-list.component';
import ImpressFooterNavComponent from './impress-footer-nav.component';
import { getLabelForCountry } from 'helpers/getCountries';

// ---------------------------------------------------------------------------- //
//       This file must be copied 1:1 from app/impress to customer-center       //
// ---------------------------------------------------------------------------- //

const ElementTypes = {
	TEXT: 'text',
	IMAGE: 'image',
	SEPARATOR: 'separator',
	ARTICLES: 'positions'
};

const updateListItemsColor = () => {
	$('.ql-editor ul li span').each(function(index, span) {
		const listItemColor = $(span).css('color');
		const parentListItem = $(span).closest('li');

		if (parentListItem.find('span').length === 1) {
			parentListItem.css({ color: listItemColor });
		}
	});
};

class ImpressFrontendViewComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			offerData: props.offerData || null,
			currentBlocks: props.currentBlocks || null,
			isResponsiveNavVisible: false
		};
	}

	componentDidMount() {
		setTimeout(() => {
			updateListItemsColor();
		}, 0);
	}

	componentWillReceiveProps(props) {
		this.setState({
			offerData: props.offerData || null,
			currentBlocks: props.currentBlocks || null
		});
	}

	navClickFinished() {
		const { isResponsiveNavVisible } = this.state;

		setTimeout(() => {
			updateListItemsColor();
			window.scrollTo(0, 0);

			if (isResponsiveNavVisible) {
				this.onToggleResponsiveNavClicked();
			}
		}, 0);
	}

	onNavClicked(pageId) {
		const { offerData } = JSON.parse(JSON.stringify(this.state));
		const { backendRequest, fetchPagesUrl, externalAssetToken } = this.props;
		const selectedPageIndex = offerData.pages.findIndex(page => page.id === pageId);

		if (offerData.pages[selectedPageIndex] && offerData.pages[selectedPageIndex].blocks) {
			offerData.pages.forEach(page => {
				page.selected = page.id === pageId;
			});

			this.setState(
				{
					offerData,
					currentBlocks: offerData.pages[selectedPageIndex].blocks
				},
				() => {
					this.navClickFinished();
				}
			);
		} else {
			backendRequest(fetchPagesUrl + pageId + (externalAssetToken ? `/${externalAssetToken}` : ''), {
				auth: true
			})
				.then(({ body: { data: { blocks } } }) => {
					offerData.pages.forEach(page => {
						page.selected = page.id === pageId;

						if (page.id === pageId) {
							page.blocks = blocks;
						}
					});

					this.setState(
						{
							offerData,
							currentBlocks: blocks
						},
						() => {
							this.navClickFinished();
						}
					);
				})
				.catch(err => {
					console.log(err);
				});
		}
	}

	onToggleResponsiveNavClicked() {
		const { isResponsiveNavVisible } = this.state;
		this.setState({ isResponsiveNavVisible: !isResponsiveNavVisible });
	}

	render() {
		const { apiUrl, formatCurrency, resources } = this.props;
		const { offerData, currentBlocks, isResponsiveNavVisible } = this.state;

		if (!offerData || !currentBlocks) {
			return;
		}

		const selectedPageIndex = offerData.pages.findIndex(page => page.selected === true);

		let logo = offerData && offerData.globalSettings && offerData.globalSettings.logo;
		const blocks = currentBlocks.length > 0 ? currentBlocks : [];

		if (logo) {
			logo = apiUrl + logo;
		}

		const blockElements = blocks.map((block, blockIdx) => {
			return (
				<div
					key={`block-${blockIdx}`}
					className={`impress-content-block-wrapper ${block.type}`}
					style={{ backgroundColor: block.background || null }}
				>
					<div
						className={`impress-content-block ${
							(block.type === ElementTypes.TEXT || block.type === ElementTypes.ARTICLES) &&
							block.layout === 'wide'
								? 'impress-content-block-wide'
								: ''
						}`}
					>
						{block.type === ElementTypes.TEXT ? (
							<div className="ql-editor" dangerouslySetInnerHTML={{ __html: block.content }} />
						) : null}
						{block.type === ElementTypes.IMAGE ? (
							block.path ? (
								<img src={`${apiUrl}${block.path}`} className="block-image" />
							) : null
						) : null}
						{block.type === ElementTypes.ARTICLES ? (
							<div>
								{block.content.trim().length > 0 ? (
									<div
										className="ql-editor articles-header"
										dangerouslySetInnerHTML={{ __html: block.content }}
									/>
								) : null}

								<ImpressArticleListComponent
									columns={offerData.standardOfferData.columns}
									positions={offerData.standardOfferData.positions}
									priceKind={offerData.standardOfferData.priceKind}
									smallBusiness={offerData.standardOfferData.smallBusiness}
									formatCurrency={formatCurrency}
									resources={resources}
									customerData={offerData.standardOfferData.customerData}
									totalGross={offerData.standardOfferData.totalGross}
								/>
							</div>
						) : null}
						{block.type === ElementTypes.SEPARATOR ? (
							<hr
								style={{
									borderColor: block.separatorLineColor || null,
									borderWidth: block.separatorLineWidth
										? `${
											block.separatorLineStyle && block.separatorLineStyle !== 'solid'
												? parseFloat(parseInt(block.separatorLineWidth) / 2)
												: block.separatorLineWidth
										  }px`
										: null,
									borderStyle: block.separatorLineStyle || null
								}}
							/>
						) : null}
					</div>
				</div>
			);
		});

		const customerData =
			offerData.standardOfferData.customerData && Object.keys(offerData.standardOfferData.customerData).length > 0
				? {
					name:
							offerData.standardOfferData.customerData.kind === 'person'
								? `${offerData.standardOfferData.customerData.firstName} ${
									offerData.standardOfferData.customerData.lastName
								  }`
								: offerData.standardOfferData.customerData.companyName,
					street: offerData.standardOfferData.customerData.street,
					city: `${offerData.standardOfferData.customerData.zipCode} ${
						offerData.standardOfferData.customerData.city
					}`,
					countryLabel: getLabelForCountry(offerData.standardOfferData.customerData.countryIso),
					indiaState: offerData.standardOfferData.customerData.indiaState,
					gstNumber: offerData.standardOfferData.customerData.gstNumber,
					cinNumber: offerData.standardOfferData.customerData.cinNumber
				  }
				: null;

		return (
			<div className="impress-wrapper">
				<div
					className={`impress-responsive-nav-toggle ${isResponsiveNavVisible ? 'nav-visible' : ''}`}
					onClick={() => this.onToggleResponsiveNavClicked()}
				>
					<div className="hamburger">
						<div className="hamburger-bar1" />
						<div className="hamburger-bar2" />
						<div className="hamburger-bar3" />
					</div>
					<div className="close">
						<div className="close-bar1" />
						<div className="close-bar2" />
					</div>
				</div>
				<div className="impress-template">
					<div className={`impress-nav ${isResponsiveNavVisible ? 'visible' : ''}`}>
						<div className="impress-nav-container">
							<div className="impress-nav-logo">{logo ? <img src={logo} /> : null}</div>
							{customerData ? (
								<div className="impress-nav-customer">
									<div className="customer-name">{customerData.name}</div>
									<div className="street-div">{customerData.street}</div>
									<div>
										{customerData.indiaState.stateName ? <span>{customerData.indiaState.stateName}, </span> : null}
									    <span>{customerData.countryLabel}</span>
									</div>
									{offerData.standardOfferData.customerData.kind === 'company' && customerData.gstNumber ? <div>{resources.str_gst}: {customerData.gstNumber}</div> : null}
									{offerData.standardOfferData.customerData.kind === 'company' && customerData.cinNumber ? <div>{resources.str_cin}: {customerData.cinNumber}</div> : null}
								</div>
							) : null}
							{offerData.pages.map(page => {
								return (
									<div
										key={page.id}
										className={`impress-nav-item ${page.selected ? 'active' : ''}`}
										onClick={() => this.onNavClicked(page.id)}
									>
										{page.title}
									</div>
								);
							})}
						</div>
					</div>
					<div
						className={`impress-responsive-nav-backgdrop ${isResponsiveNavVisible ? 'visible' : ''}`}
						onClick={() => this.onToggleResponsiveNavClicked()}
					/>
					<div className="impress-content-container">
						<div className="impress-content">
							{selectedPageIndex === 0 ? (
								<div className="impress-content-block-wrapper impress-responsive-first-page-intro">
									<div className="impress-intro-first-row">{resources.str_YourOfferOf}</div>
									<div className="impress-intro-second-row">
										{logo ? <img src={logo} /> : customerData && customerData.name}
									</div>
									<div className="impress-intro-third-row">
										{resources.str_offerNumberTitle} {offerData.standardOfferData.number}
									</div>
								</div>
							) : null}
							{blockElements}
						</div>
					</div>
				</div>
				<div className={`impress-responsive-footer-nav ${isResponsiveNavVisible ? 'nav-visible' : ''}`}>
					<ImpressFooterNavComponent
						onPrevClick={() => this.onFooterNavClicked(-1)}
						onNextClick={() => this.onFooterNavClicked(1)}
						isPrevDisabled={selectedPageIndex === 0}
						isNextDisabled={selectedPageIndex === offerData.pages.length - 1}
						resources={resources}
					/>
				</div>
			</div>
		);
	}

	onFooterNavClicked(direction) {
		const {
			offerData: { pages }
		} = this.state;
		const selectedPageIndex = pages.findIndex(page => page.selected === true);
		const newPageIndex = selectedPageIndex + direction;
		const newPage = pages.find((page, index) => index === newPageIndex);

		this.onNavClicked(newPage.id);
	}
}

export default ImpressFrontendViewComponent;
