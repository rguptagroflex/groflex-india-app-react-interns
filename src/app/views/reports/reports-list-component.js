import React from "react";
import TopbarComponent from "../../shared/topbar/topbar.component";
import invoiz from "../../services/invoiz.service";
import SVGInline from "react-svg-inline";
import Vector from "../../../assets/images/icons/Vector.png";

function ReportsListComponent() {
	return (
		<div>
			<div>
				<TopbarComponent title={"Reports"} viewIcon={`icon-banking`} />
			</div>

			<div
				style={{
					display: "block",
					position: "absolute",
					left: "38%",
					right: "38%",
					fontSize: "17px",
					padding: "10px",
					fontWeight: "600",
				}}
			>
				{/* <span>All Reports Comming Soon..!</span> */}
			</div>
			<div
				style={{
					// height: "530px",
					height: "365px",
					// width: "76vw",

					border: "1px solid #ccc",
					borderRadius: "8px",
					// borderTop: "100px solid white",
					// margin: "25px",
					// marginTop: "120px",
					margin: " 120px 60px 25px",
					// marginLeft: "50px",
					backgroundColor: "#fff",
					fontWeight: "600",
					width: "1120px",
				}}
			>
				<div>
					<div>
						<div
							style={{
								display: "grid",
								height: "2vh",
								gridTemplateColumns: "repeat(2,1fr)",
								justifyItems: "center",
								alignItems: "center",
								// justifyItems: "space-between",
								// alignItems: "space-between",
								// padding: "50px",
								padding: "25px",
							}}
						>
							<div
								style={{
									height: "144px",
									width: "512px",
									border: "1px solid  #F2F2F2",
									color: "#00A353",
									borderRadius: "4px",
									padding: "20px",
									// width: "30vw",
									borderColor: "#C6C6C6",
									// display: "flex",
									// alignItems: "center",
								}}
							>
								<div
									style={{
										// border: "1px dashed #000",
										// border: "1px solid  #F2F2F2",
										// color: "#00A353",
										// padding: "20px",
										// width: "30vw",
										// borderColor: "#C6C6C6",
										display: "flex",
										alignItems: "center",
									}}
									onClick={() => {
										// invoiz.router.navigate("/expenses/reports/balance-sheet");
										invoiz.router.navigate("/expenses/reports/general-ledger");
									}}
								>
									<i
										className="icon-copy"
										style={{
											marginRight: "10px",
											borderRadius: "50%",
											// border: "1px solid #00A353",
											padding: "8px",
										}}
									></i>
									{/* <SVGInline className="overlay-image" svg={Vector} alt={"Could not load image!"} /> */}
									{/* <span style={{ cursor: "pointer" }}>Balance Sheet</span> */}
									<span
										style={{ cursor: "pointer" }}
										onClick={() => {
											invoiz.router.navigate("/expenses/reports/general-ledger");
										}}
									>
										General ledger
									</span>
								</div>
								<p style={{ color: "#272D30", marginTop: "10px", fontSize: "14px" }}>
									A record of all the financial transactions of your company using double-entry
									bookkeeping, including all accounts.
								</p>
							</div>
							<div
								style={{
									height: "144px",
									width: "512px",
									border: "1px solid  #F2F2F2",
									color: "#00A353",
									padding: "20px",
									// width: "30vw",
									borderColor: "#C6C6C6",
									borderRadius: "4px",
									// display: "flex",
									// alignItems: "center",
								}}
							>
								<div
									style={{
										// border: "1px dashed #000",
										// border: "1px solid  #F2F2F2",
										// color: "#00A353",
										// padding: "20px",
										// width: "30vw",
										// borderColor: "#C6C6C6",
										display: "flex",
										alignItems: "center",
									}}
									onClick={() => {
										// invoiz.router.navigate("/expenses/reports/cash-flow-statement");
										invoiz.router.navigate("/expenses/reports/balance-sheet");
									}}
								>
									<i
										className="icon-copy"
										style={{
											marginRight: "10px",
											borderRadius: "50%",
											// border: "1px solid #00A353",
											padding: "8px",
										}}
									></i>
									<span
										style={{ cursor: "pointer" }}
										onClick={() => {
											invoiz.router.navigate("/expenses/reports/balance-sheet");
										}}
									>
										Balance Sheet
									</span>
								</div>
								<p style={{ color: "#272D30", marginTop: "10px", fontSize: "14px" }}>
									A snapshot of your company's financial position at a specific point in time showing
									assets, liabilities, and equity.
								</p>
							</div>
						</div>
						<div
							style={{
								display: "grid",
								height: "2vh",
								gridTemplateColumns: "repeat(2,1fr)",
								justifyItems: "center",
								alignItems: "center",
								// padding: "50px",
								padding: "25px",
								marginTop: "120px",
							}}
						>
							<div
								style={{
									height: "144px",
									width: "512px",
									borderRadius: "4px",
									border: "1px solid  #F2F2F2",
									color: "#00A353",
									padding: "20px",
									// width: "30vw",
									borderColor: "#C6C6C6",
									// display: "flex",
									// alignItems: "center",
								}}
							>
								<div
									style={{
										// border: "1px dashed #000",
										// border: "1px solid  #F2F2F2",
										// color: "#00A353",
										// padding: "20px",
										// width: "30vw",
										// borderColor: "#C6C6C6",
										display: "flex",
										alignItems: "center",
									}}
									onClick={() => {
										invoiz.router.navigate("/expenses/reports/profit-and-loss");
									}}
								>
									<i
										className="icon-copy"
										style={{
											marginRight: "10px",
											borderRadius: "50%",
											// border: "1px solid #00A353",
											padding: "8px",
										}}
									></i>
									<span style={{ cursor: "pointer" }}>Profit and Loss</span>
								</div>
								<p style={{ color: "#272D30", marginTop: "10px", fontSize: "14px" }}>
									A report showing your company's revenues, expenses, gains, and losses over a
									specified period of time.
								</p>
							</div>
							<div
								style={{
									height: "144px",
									width: "512px",
									border: "1px solid  #F2F2F2",
									borderRadius: "4px",
									color: "#00A353",
									padding: "20px",
									// width: "30vw",
									borderColor: "#C6C6C6",
									// display: "flex",
									// alignItems: "center",
								}}
							>
								<div
									style={{
										// border: "1px dashed #000",
										// border: "1px solid  #F2F2F2",
										// color: "#00A353",
										// padding: "20px",
										// width: "30vw",
										// borderColor: "#C6C6C6",
										display: "flex",
										alignItems: "center",
									}}
									onClick={() => {
										invoiz.router.navigate("/expenses/reports/cash-flow-statement");
									}}
								>
									<i
										className="icon-copy"
										style={{
											marginRight: "10px",
											borderRadius: "50%",
											// border: "1px solid #00A353",
											padding: "8px",
										}}
									></i>
									<span style={{ cursor: "pointer" }}>Cash Flow Statement</span>
								</div>
								<p style={{ color: "#272D30", marginTop: "10px", fontSize: "14px" }}>
									A report showing the inflows and outflows of cash and cash equivalents for a
									specified period of time.
								</p>
							</div>
						</div>
						<div
							style={{
								display: "grid",
								height: "2vh",
								gridTemplateColumns: "repeat(2,1fr)",
								justifyItems: "center",
								alignItems: "center",
								padding: "50px",
								marginTop: "60px",
							}}
						>
							{/* <div
							style={{
								height: "144px",
								width: "512px",
								border: "1px solid  #F2F2F2",
								color: "#00A353",
								padding: "20px",
								// width: "30vw",
								borderColor: "#C6C6C6",
								borderRadius: "4px",
								// display: "flex",
								// alignItems: "center",
							}}
						>
							<div
								style={{
									// border: "1px dashed #000",
									// border: "1px solid  #F2F2F2",
									// color: "#00A353",
									// padding: "20px",
									// width: "30vw",
									// borderColor: "#C6C6C6",
									display: "flex",
									alignItems: "center",
								}}
								// onClick={() => {
								// 	invoiz.router.navigate("/expenses/reports/profit-and-loss");
								// }}
							>
								<i
									className="icon-copy"
									style={{
										marginRight: "10px",
										borderRadius: "50%",
										// border: "1px solid #00A353",
										padding: "8px",
									}}
								></i>
								<span style={{ cursor: "pointer" }}>GST Report</span>
							</div>
							{/* <div
							style={{
								border: "1px dashed #000",
								color: "#00A353",
								padding: "20px",
								width: "30vw",
								borderColor: "#C6C6C6",
								display: "flex",
								alignItems: "center",
							}}
							// onClick={() => {
							// 	invoiz.router.navigate("/expenses/reports/profit-and-loss");
							// }}
						>
							<i
								className="icon-copy"
								style={{
									marginRight: "10px",
									borderRadius: "50%",
									border: "1px solid #00A353",
									padding: "8px",
								}}
							></i>
							<span style={{ cursor: "pointer" }}>Trial Balance</span>
						</div> */}
							{/* </div> */}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ReportsListComponent;
