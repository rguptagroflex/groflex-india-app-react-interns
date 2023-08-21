import React, { useEffect } from "react";
import loginBg from "../../../assets/images/login/loginpage_bg.png";
import groflexIcon from "assets/images/groflex_name_logo_color_no_tag.png";
import carousel1 from "../../../assets/images/login-carousal/carousel1.png";
import carousel2 from "../../../assets/images/login-carousal/carousel2.png";
import carousel3 from "../../../assets/images/login-carousal/carousel3.png";
import carousel4 from "../../../assets/images/login-carousal/carousel4.png";

import { Link } from "react-router-dom";

import Slider from "react-slick";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
const carouselImages = [carousel1, carousel2, carousel3, carousel4];
const FirstColumn = ({ settings }) => {
	const [carouselIndex, setCarouselIndex] = React.useState(0);

	useEffect(() => {
		const internvalId = setInterval(() => {
			setCarouselIndex((display) => {
				return (display + 1) % 4;
			});
		}, 2000);

		return () => {
			clearInterval(internvalId);
		};
	});

	const defaultSetting = {
		dots: true,
		infinite: true,
		slidesToShow: 1,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 2000,
		pauseOnFocus: false,
		fade: true,
		...settings,
	};

	// console.log(carouselIndex);

	return (
		<div
			style={{
				backgroundImage: `url(${loginBg})`,
			}}
			className="landing-sidebar"
		>
			<div style={{ width: "100%" }} className="imprezz-logo">
				<Link to="/account/login">
					<img
						style={{
							margin: "14px",
							width: "180px",
							objectFit: "cover",
						}}
						src={groflexIcon}
					/>
				</Link>
			</div>
			{/* Carousal */}

			<div
				style={{
					position: "relative",
					margin: "auto 0",
					height: "500px",
				}}
			>
				<img
					style={{
						margin: "0 auto",
						height: "350px",
						objectFit: "contain",
					}}
					src={carouselImages[carouselIndex]}
					alt="carousel"
				/>

				<h2 style={{ fontSize: "18px", textAlign: "center" }} className="is-bold">
					Best and Easiest Billing Software!
				</h2>
				<div style={{ fontSize: "14px", textAlign: "center" }}>Create GST compliant invoices</div>
			</div>
		</div>
	);
};

export default FirstColumn;
