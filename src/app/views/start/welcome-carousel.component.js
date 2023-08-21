import React from "react";
import ReactSlickCarousel from "../../shared/react-slick-carousel/react-slick-carousel.component";
import { Link } from "react-router-dom";

const WelcomeCarouselComponent = () => {
	return (
		<ReactSlickCarousel settings={{ autoplaySpeed: 3000, pauseOnHover: true }}>
			<div className="welcome-carousel-div welcome1">
				<div className="welcome1-content">
					<h3>Welcome to Groflex!</h3>
					<p>Take a look to our Quick Start Guide below and learn how to unlock the potential of Groflex.</p>
				</div>
			</div>
			<div className="welcome-carousel-div welcome2">
				<div className="welcome2-content">
					<h3>Smart Dashboard</h3>
					<p>Get a quick overview of your day to day business activities at a glance.</p>
					<Link to="/dashboard" className="outlined-button">
						Go to Dashboard
					</Link>
				</div>
			</div>
			<div className="welcome-carousel-div welcome3">
				<div className="welcome3-content">
					<h3>Create professional invoices</h3>
					<p>Create customized invoices and automate your routing billing operations .</p>
					<Link to="/invoice/new" className="outlined-button">
						Create invoice
					</Link>
				</div>
			</div>
			{/* <div className="welcome-carousel-div welcome4">
				<div className="welcome4-content">
					<h3>Switch to digital payments</h3>
					<p>Complete your KYC to start reciving payments directly into your bank account.</p>
					<Link to="/invoice/new" className="outlined-button">
						Complete KYC form
					</Link>
				</div>
			</div> */}
			<div className="welcome-carousel-div welcome5">
				<div className="welcome5-content">
					<h3>Invite your team</h3>
					<p>
						Invite your Accountant and Sales people to Groflex and save time and effort in communications.{" "}
					</p>
					<Link to="/settings/user" className="outlined-button">
						Invite team
					</Link>
				</div>
			</div>
		</ReactSlickCarousel>
	);
};

export default WelcomeCarouselComponent;
