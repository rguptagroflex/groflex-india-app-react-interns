import React, { useEffect, useState } from "react";
import TopbarComponent from "../../shared/topbar/topbar.component";
import invoiz from "../../services/invoiz.service";
import { useDispatch, useSelector } from "react-redux";
import store from "../../redux/store";
import { connect, Provider } from "react-redux";
const ReportsListComponent = (props) => {
	// const isSubmenuVisible = useSelector((state) => state.global.isSubmenuVisible);
	// const [submenVisible, setSubmenuVisible] = useState(isSubmenuVisible);

	// useEffect(() => {
	// 	setSubmenuVisible(isSubmenuVisible);
	// }, [isSubmenuVisible]);

	// const classLeft = submenVisible ? "leftAlignReport" : "";

	const { isSubmenuVisible } = store.getState().global;
	const submenVisible = props.isSubmenuVisible;
	// console.log("reports ", submenVisible);
	// console.log("Store: ", isSubmenuVisible);

	const classLeft = submenVisible ? "leftAlignReport" : "";
	const classHeading = submenVisible ? "leftAlignHeading" : "";

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
				className={`${classLeft}`}
				style={{
					height: "375px",
					width: "80vw",
					border: "1px solid white",
					// borderTop: "100px solid white",
					marginTop: "130px",
					marginLeft: "50px",
					backgroundColor: "#fff",
					fontWeight: "600",
				}}
			>
				<span style={{ marginLeft: "44%" }}>All Reports Comming Soon..!</span>
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
							padding: "50px",
						}}
					>
						<div
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
							// 	// invoiz.router.navigate("/expenses/reports/balance-sheet");
							// 	invoiz.router.navigate("/expenses/reports/general-ledger");
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
							{/* <span style={{ cursor: "pointer" }}>Balance Sheet</span> */}
							<span
								style={{ cursor: "pointer" }}
								// onClick={() => {
								// 	invoiz.router.navigate("/expenses/reports/general-ledger");
								// }}
							>
								General ledger
							</span>
						</div>
						<div
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
							// 	// invoiz.router.navigate("/expenses/reports/cash-flow-statement");
							// 	invoiz.router.navigate("/expenses/reports/balance-sheet");
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
							<span
								style={{ cursor: "pointer" }}
								// onClick={() => {
								// 	invoiz.router.navigate("/expenses/reports/balance-sheet");
								// }}
							>
								Balance Sheet
							</span>
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
						}}
					>
						<div
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
							<span style={{ cursor: "pointer" }}>Profit and Loss</span>
						</div>
						<div
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
						}}
					>
						<div
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
							<span style={{ cursor: "pointer" }}>GST Sales Report</span>
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
					</div>
				</div>
			</div>
		</div>
	);
};

const mapStateToProps = (state) => {
	const isSubmenuVisible = state.global.isSubmenuVisible;

	return {
		isSubmenuVisible,
	};
};

export default connect(mapStateToProps, null)(ReportsListComponent);
// export default ReportsListComponent;
