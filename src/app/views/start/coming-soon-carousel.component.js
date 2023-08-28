import React from "react";
import comingSoonPng from "../../../assets/images/homePage/coming-soon/coming-soon.png";
import soon1 from "../../../assets/images/homePage/coming-soon/soon1.png";
import soon2 from "../../../assets/images/homePage/coming-soon/soon2.png";
import soon3 from "../../../assets/images/homePage/coming-soon/soon3.png";
import ReactSlickCarousel from "../../shared/react-slick-carousel/react-slick-carousel.component";

const ComingSoonCarouselComponent = () => {
	return (
		<div className="coming-soon-content">
			<div className="coming-soon-image-container">
				<h3>Coming Soon...!!</h3>
				<img src={comingSoonPng} className="coming-soon-image" />
			</div>

			<div className="coming-soon-carousel-container">
				<ReactSlickCarousel settings={{ pauseOnHover: true, autoplaySpeed: 2000 }}>
					<div className="coming-soon-carousel-item">
						<img src={soon1} />
						<div className="coming-soon-info-container">
							<h5>Suplay Chain Management</h5>
							<p>Track your inventory levels to avoid running out of stock and overstock</p>
							<p>
								Our Supply Chain Management software provides you with a real-time visibility into their
								inventory levels and order statuses.
							</p>
						</div>
					</div>
					<div className="coming-soon-carousel-item">
						<img src={soon2} />
						<div className="coming-soon-info-container">
							<h5>E-commerce</h5>
							<p>Expand your market at global scale</p>
							<p>
								Our E-comerce platform will provide will offer a fast payment processes, store
								management, integrate data consolidation, and analytic reports of customer behaviour and
								preferences.
							</p>
						</div>
					</div>
					<div className="coming-soon-carousel-item">
						<img src={soon1} />
						<div className="coming-soon-info-container">
							<h5>Point of Sales (PoS) - Billing Systems</h5>
							<p>Ensure that you're getting paid on time and in full.</p>
							<p>
								Organize all your processes better by managing article databases on mobile and desktop
								P.O.S system. Improve your cash flow and customers relationships.
							</p>
						</div>
					</div>
					<div className="coming-soon-carousel-item">
						<img src={soon3} />
						<div className="coming-soon-info-container">
							<h5>Customer Relationship Management (CRM)</h5>
							<p>Manage your relationship with your clients and professionally with our CRM features</p>
							<p>
								Groflex provides you CRM analytics, contact management, and reporting that can be
								customized based on your necessities.
							</p>
						</div>
					</div>
					<div className="coming-soon-carousel-item">
						<img src={soon3} />
						<div className="coming-soon-info-container">
							<h5>Human Resources Management (HRM)</h5>
							<p>
								Use our HRM tool to improve your employee engagement for better performance and
								decision-making.
							</p>
							<p>
								Centralize your employee's attendance tracking, payroll processing, performance
								management, employee engagement and more in our platform.
							</p>
						</div>
					</div>
				</ReactSlickCarousel>
			</div>
		</div>
	);
};

export default ComingSoonCarouselComponent;
