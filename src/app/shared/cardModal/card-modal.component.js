import React, { useState } from "react";
import { Box, Button, Modal } from "../../../../node_modules/@material-ui/core/index";
import SVGInline from "react-svg-inline";
const checkMarkIcon = require("assets/images/svg/check-marks/check_mark.svg");
import { redirectToChargebee } from "helpers/redirectToChargebee";
import ChargebeeAddon from "../../enums/chargebee-addon.enum";
import ChargebeePlan from "enums/chargebee-plan.enum";
import Carousel from "../carousel/Carousel.component";
import close from "assets/images/icons/close-modal.svg";
import invoiz from "../../services/invoiz.service";
const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 845,
	height: "auto",
	bgcolor: "background.paper",
	boxShadow: 24,
	p: 6,
	paddingBottom: 16,
	paddingTop: 26,
	borderRadius: 5,
};
const appURL = {
	1: "/articles",
	2: "/dashboard",
	3: "/expenses",
	4: "/offers/impress/templates",
	5: "/invoices",
	6: "/purchase-orders",
	7: "/offer",
	8: "/settings/user",
	9: "/inventory",
	10:"/invoices/timetracking",
};
const CardComponentModal = ({ open, handleClose, handleOpen, modalData }) => {
	const banners = modalData.previewUrl || [];
	const [activeSlide, setActiveSlide] = useState(0);
	console.log(modalData);

	const handleSubscription = (addonId) => {
		redirectToChargebee(ChargebeePlan.FREE_PLAN_2021, null, addonId);
	};
	const redirectToApp = (appId) => {
		let url = appURL[appId];
		invoiz.router.navigate(url || "/");
	};
	const updateActiveSlide = (newSlideIndex) => {
		setActiveSlide(newSlideIndex);
	};

	return (
		<Modal
			className="modal"
			open={open}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box className="modal" sx={style}>
				<div className="modal__close" onClick={handleClose}>
					<SVGInline svg={close} />
				</div>
				<Box className="modal__header">
					<Box className="modal__header__left">
						<div className="modal__header__left__image">
							<img
								src={
									modalData.iconUrl === null
										? "/assets/images/zz_dummy.png"
										: "/api" + modalData.iconUrl
								}
								alt=""
							/>
						</div>
						<div className="modal__header__left__text">
							<p className="modal__header__left__text__title">{modalData.name}</p>
							<p className="modal__header__left__text__credits">{modalData.title}</p>
							<p className="modal__header__left__text__price">
								{modalData.price === 0 ? "" : "₹"}
								{modalData.price === 0 ? "Free" : modalData.price}
								<span>Active</span>
							</p>
						</div>
					</Box>
					<Box className="modal__header__right">
						<Button
							className="modal__header__right__button"
							onClick={
								modalData.purchased
									? () => redirectToApp(modalData.appId)
									: () => handleSubscription(modalData.chargebeeAddonId)
							}
						>
							{modalData.purchased ? "Take me there" : "Buy Now"}
						</Button>
					</Box>
				</Box>
				<Box className="modal__content">
					<Box className="modal__content__left">
						<p className="modal__content__left__title">Overview</p>
						<p className="modal__content__left__description">{modalData.description}</p>
						<p className="modal__content__left__features">Features</p>
						<div className="modal__features text-left">
							<ul>
								{modalData.features &&
									modalData.features.map((feature) => (
										<li>
											<SVGInline svg={checkMarkIcon} />
											<span className="mar-left10">{feature}</span>
										</li>
									))}
							</ul>
						</div>
						{banners.length > 0 && (
							<div className="modal__carousel">
								<Carousel
									activeSlide={activeSlide}
									updateActiveSlide={(slide) => updateActiveSlide(slide)}
								>
									<Carousel.Slides>
										{banners.map((banner, index) => (
											<img
												key={index}
												className="banner-image"
												src={"/api" + banner}
												onClick={() => banner.onClick()}
											/>
										))}
									</Carousel.Slides>
									<Carousel.PageIndicators>
										{banners.map((banner, index) => (
											<button
												key={index}
												className={index === activeSlide ? "active" : ""}
												onClick={() => updateActiveSlide(index)}
											/>
										))}
									</Carousel.PageIndicators>
									<Carousel.NextButton>
										<button>{">"}</button>
									</Carousel.NextButton>
									<Carousel.PrevButton>
										<button>{"<"}</button>
									</Carousel.PrevButton>
								</Carousel>
							</div>
						)}
					</Box>
					<Box className="modal__content__right">
						<p className="modal__content__right__title">App Information</p>
						<p className="modal__content__right__info">Categories</p>
						<div className="modal__content__right__categories">
							{modalData.categories &&
								modalData.categories.map((category) => (
									<Button className="disabled-categories" variant="contained" disabled>
										{category}
									</Button>
								))}
						</div>
					</Box>
				</Box>
			</Box>
		</Modal>
	);
};

export default CardComponentModal;
