import React from "react";
import TopbarComponent from "../../shared/topbar/topbar.component";
import invoiz from "../../services/invoiz.service";
import SVGInline from "react-svg-inline";
import Vector from "../../../assets/images/icons/Reports.svg";
import { connect } from "react-redux";
function ReportsListComponent(props) {
	const classLeft =
		props.sideBarVisibleStatic["invoices"].sidebarVisible ||
		props.sideBarVisibleStatic["expenditure"].sidebarVisible
			? "leftAlignReports"
			: "";
	return (
		<div className={`reports-component ${classLeft}`}>
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
			></div>
			<div className="reports-content-wrapper">
				<div>
					<div className="reports-content-main">
						<div className="reports-content-top">
							<div className="reports-content-top-left">
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
								<p className="reports-content-detail">
									A record of all the financial transactions of your company using double-entry
									bookkeeping, including all accounts.
								</p>
							</div>
							<div className="reports-content-top-right">
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
								<p className="reports-content-detail">
									A snapshot of your company's financial position at a specific point in time showing
									assets, liabilities, and equity.
								</p>
							</div>
						</div>
						<div className="reports-content-middle">
							<div className="reports-content-middle-left">
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
								<p className="reports-content-detail">
									A report showing your company's revenues, expenses, gains, and losses over a
									specified period of time.
								</p>
							</div>
							<div className="reports-content-middle-right">
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
								<p className="reports-content-detail">
									A report showing the inflows and outflows of cash and cash equivalents for a
									specified period of time.
								</p>
							</div>
						</div>
						<div className="reports-content-bottom">
							<div className="reports-content-bottom-left">
								<div
									style={{
										display: "flex",
										alignItems: "center",
									}}
									onClick={() => {
										invoiz.router.navigate("/expenses/reports/gst-export");
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
									<span style={{ cursor: "pointer" }}>GST Reports</span>
								</div>
								<p className="reports-content-detail">
									A report showing your company's revenues, expenses, gains, and losses over a
									specified period of time.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

const mapStateToProps = (state) => {
	const sideBarVisibleStatic = state.global.sideBarVisibleStatic;
	return {
		sideBarVisibleStatic,
	};
};

export default connect(mapStateToProps, null)(ReportsListComponent);
// export default ReportsListComponent;
