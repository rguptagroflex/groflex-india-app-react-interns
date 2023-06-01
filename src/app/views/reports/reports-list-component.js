import React from "react";
import TopbarComponent from "../../shared/topbar/topbar.component";
import invoiz from "../../services/invoiz.service";

function ReportsListComponent() {
	return (
		<div>
			<div>
				<TopbarComponent title={"Reports"} viewIcon={`icon-banking`} />
			</div>
			<div
				style={{
					height: "280px",
					width: "80vw",
					border: "1px solid white",
					// borderTop: "100px solid white",
					marginTop: "130px",
					marginLeft: "50px",
					backgroundColor: "#fff",
					fontWeight: "600",
				}}
			>
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
									border: "1px solid #00A353",
									padding: "8px",
								}}
							></i>
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
									border: "1px solid #00A353",
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
							onClick={() => {
								invoiz.router.navigate("/expenses/reports/profit-and-loss");
							}}
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

					</div>
				</div>
				
			</div>
		</div>
	);
}

export default ReportsListComponent;
