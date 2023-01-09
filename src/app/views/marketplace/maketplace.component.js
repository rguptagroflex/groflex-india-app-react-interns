import React, { Fragment, useEffect, useState } from "react";
import {
	Avatar,
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	MenuItem,
	Modal,
	Select,
} from "../../../../node_modules/@material-ui/core/index";
import SVGInline from "react-svg-inline";
import invoiz from "services/invoiz.service";
import config from "config";

// import CardComponentModal from "shared/cardModal/card-modal.component";
// import { red } from "@mui/material/colors";

import TopbarComponent from "../../shared/topbar/topbar.component";
import CardComponentModal from "../../shared/cardModal/card-modal.component";
import LoaderComponent from "../../shared/loader/loader.component";
const checkMarkIcon = require("assets/images/svg/check-marks/check_mark.svg");

const MarketplaceComponent = (props) => {
	const { resources } = props;
	const [open, setOpen] = useState(false);
	const [data, setData] = useState([]);
	const [yourData, setYourData] = useState([]);
	const [modalData, setModalData] = useState({});
	const [loading, setLoading] = useState(true);

	const handleOpen = (e) => {
		setModalData(e);
		setOpen(true);
	};

	const handleClose = () => setOpen(false);

	useEffect(() => {
		invoiz.request(config.apps.endpoints.getApps, { auth: true }).then((response) => {
			setData(response.body.data.apps);
			console.log(response.body.data.apps);
			setLoading(false);
		});
	}, []);
	useEffect(() => {
		invoiz.request(config.apps.endpoints.getAppsPerUser, { auth: true }).then((response) => {
			setYourData(response.body.data.apps);
			console.log(response.body.data.apps);
			setLoading(false);
		});
	}, []);

	const checkAppsSusbcription = (app) => {};
	// console.log({ data });
	const YourCards = () => (
		<div className="yourApps marketbasiccard ">
			{loading ? (
				<LoaderComponent visible={true} />
			) : (
				yourData.map((cardData) => {
					cardData.app.purchased = true;

					return (
						<Card key={cardData.app.appId} className="cardstyle" sx={{ width: 230 }}>
							<CardActions onClick={() => handleOpen(cardData.app)}>
								{/* <CardComponentModal open={open} onClose={handleClose} /> */}
								{/* {console.log(cardData.app)} */}
								<CardContent>
									<div className="marketcard__card">
										<div className="cardheader">
											<div className="cardheader__left">
												<div className="cardheader__icon">
													<img
														src={
															cardData.app.iconUrl === null
																? "/assets/images/zz_dummy.png"
																: "/api" + cardData.app.iconUrl
														}
														alt=""
													/>
												</div>
											</div>
											<div className="cardheader__right">
												<p className="cardheader__title">{cardData.app.name}</p>
												<p className="cardheader__price">
													{cardData.app.price === 0 ? "" : `"₹"`}
													{cardData.app.price === 0 ? "Free" : cardData.app.price}

													<span>Active</span>
												</p>
											</div>
										</div>
										<p className="card_content">{cardData.app.overview}</p>
									</div>
								</CardContent>
							</CardActions>
						</Card>
					);
				})
			)}
		</div>
	);
	const Cards = () => (
		<div className="yourApps marketbasiccard border-none ">
			{loading ? (
				<LoaderComponent visible={true} />
			) : (
				data.map((cardData) => {
					cardData.purchased = false;

					return (
						<Card key={cardData.appId} className="cardstyle" sx={{ width: 230 }}>
							<CardActions onClick={() => handleOpen(cardData)}>
								{/* <CardComponentModal open={open} onClose={handleClose} /> */}
								{/* {console.log(cardData)} */}
								<CardContent>
									<div className="marketcard__card">
										<div className="cardheader">
											<div className="cardheader__left">
												<div className="cardheader__icon">
													<img
														src={
															cardData.iconUrl === null
																? "/assets/images/zz_dummy.png"
																: "/api" + cardData.iconUrl
														}
														alt=""
													/>
												</div>
											</div>
											<div className="cardheader__right">
												<p className="cardheader__title">{cardData.name}</p>
												<p className="cardheader__price">
													{cardData.price === 0 ? "" : "₹"}
													{cardData.price === 0 ? "Free" : cardData.price}
													<span>Active</span>
												</p>
											</div>
										</div>
										<p className="card_content">{cardData.overview}</p>
									</div>
								</CardContent>
							</CardActions>
						</Card>
					);
				})
			)}
		</div>
	);
	return (
		<Fragment>
			<TopbarComponent title={resources.str_marketplace} viewIcon={`icon-marketplace`} resources={resources} />

			<div className="marketplace-bar__apps">
				<div className="marketplace-bar__yourApps">
					<h2>Your Apps</h2>
					<YourCards />
				</div>
				<div className="marketplace-bar__allApps">
					<h2>{resources.recommended}</h2>
					<Cards />
				</div>
			</div>
			<CardComponentModal
				modalData={modalData}
				open={open}
				handleClose={handleClose}
				// data={data}
				// yourData={yourData}
				handleOpen={handleOpen}
			/>
		</Fragment>
	);
};

export default MarketplaceComponent;
