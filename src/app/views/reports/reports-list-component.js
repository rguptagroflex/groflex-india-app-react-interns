import React from "react";
import TopbarComponent from "../../shared/topbar/topbar.component";
import invoiz from "../../services/invoiz.service";
import SVGInline from "react-svg-inline";
import Vector from "../../../assets/images/icons/Reports.svg";

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
			</div>
			<div
				style={{
					height: "365px",
					border: "1px solid #ccc",
					borderRadius: "8px",
					margin: " 120px 60px 25px",
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
									borderColor: "#C6C6C6",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
									}}
									onClick={() => {
										invoiz.router.navigate("/expenses/reports/general-ledger");
									}}
								>
									<SVGInline
										style={{
											borderRadius: "50%",
											padding: "8px",
										}}
										className="overlay-image"
										svg={Vector}
										alt={"Could not load image!"}
									/>
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
									borderColor: "#C6C6C6",
									borderRadius: "4px",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
									}}
									onClick={() => {
										invoiz.router.navigate("/expenses/reports/balance-sheet");
									}}
								>
									<SVGInline
										style={{
											borderRadius: "50%",
											padding: "8px",
										}}
										className="overlay-image"
										svg={Vector}
										alt={"Could not load image!"}
									/>
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
									borderColor: "#C6C6C6",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
									}}
									onClick={() => {
										invoiz.router.navigate("/expenses/reports/profit-and-loss");
									}}
								>
									<SVGInline
										style={{
											borderRadius: "50%",
											padding: "8px",
										}}
										className="overlay-image"
										svg={Vector}
										alt={"Could not load image!"}
									/>
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
									borderColor: "#C6C6C6",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
									}}
									onClick={() => {
										invoiz.router.navigate("/expenses/reports/cash-flow-statement");
									}}
								>
									<SVGInline
										style={{
											borderRadius: "50%",
											padding: "8px",
										}}
										className="overlay-image"
										svg={Vector}
										alt={"Could not load image!"}
									/>
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
							
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ReportsListComponent;
