import React, { useState } from "react";
import TopbarComponent from "../../shared/topbar/topbar-start-page.component";
import SelectInputComponent from "../../shared/inputs/select-input/select-input.component";

function ReportBalanceSheet() {
	const [isExpanded, setIsExpanded] = useState(false);

	const handleToggleExpand = () => {
		setIsExpanded(!isExpanded);
	};
	return (
		<div>
			<TopbarComponent
				title={"Balance Sheet"}
				hasCancelButton={true}
				cancelButtonCallback={() => {
					window.history.back();
				}}
			/>
			<div
				className="general-ledger-component"
				style={{
					marginTop: "90px",
					marginLeft: "50px",
					// marginRight: "50px",
					width: "200px",
					// height: "50px",
					// border: "1px solid white",
					// borderRadius: "30px",
					// borderColor: "black",
					// display: "flex",
					display: "inline-block",
				}}
			>
				<div></div>
				{/* {showCategoryFilter && ( */}
				{/* <div className="time-period-select"> */}
				{/* <SelectInputComponent
					allowCreate={false}
					notAsync={true}
					loadedOptions={dateOptions}
					value={dateFilterValue}
					icon={CalenderIcon}
					containerClass="date-input"
					options={{
						clearable: false,
						noResultsText: false,
						labelKey: "label",
						valueKey: "value",
						matchProp: "label",
						placeholder: "This month",
						// handleChange: (option) => {
						// 	this.updateSelectedDate(option);
						// },
					}}
				/> */}
			</div>
			<div
				style={{
					// position: "absolute",
					width: "80vw",
					height: "1032px",
					// top: "180px",
					// left: "334px",
					backgroundColor: "#fff",
					marginTop: "20px",
					marginLeft: "50px",
					marginRight: "50px",
					fontWeight: "600",
				}}
			>
				<div className="general-heading" style={{ width: "80vw", padding: "20px" }}>
					<div>
						<h3>AK Enterprises Balance Sheet</h3>
					</div>
					<p style={{ color: "#C6C6C6" }}>As 24 Mar 2023</p>
				</div>
				<div
					style={{
						borderTop: "1px solid #C6C6C6",
						backgroundColor: "red",
						borderRadius: "4px",
						height: "0.5px",
					}}
					className="report-row-divider"
				>
					<div
						className="box"
						style={{
							// boxShadow: "0px 10px 10px 0px #cccccc",
							padding: 0,
							margin: 0,
							paddingLeft: "20px",
							display: "grid",
							gridTemplateColumns: "8fr 2fr",
							textAlign: "left",
							borderTop: "1px solid #C6C6C6",
						}}
					>
						<p style={{ justifySelf: "start" }}>Account</p>
						<p>Total</p>
					</div>
					<div
						style={{
							borderTop: "1px solid #C6C6C6",
							background: "#C6C6C6",
							// padding: 0,
							// margin: 0,
							// display: "grid",
							// gridTemplateColumns: "2fr 3fr 2fr 2fr 2fr ",
						}}
					>
						<div>
							<div className="container" style={{ width: "100%" }}>
								<div className="toggle-button" onClick={handleToggleExpand}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											backgroundColor: "#E3E3E3",
										}}
									>
										{isExpanded ? (
											<div
												className="icon icon-arr_down"
												style={{ margin: "5px", color: "#272D30" }}
											></div>
										) : (
											<div
												className="icon icon-arr_right"
												style={{ margin: "5px", color: "#272D30" }}
											></div>
										)}
										<span style={{ color: "#272D30" }}>Assets</span>
									</div>
								</div>
								{isExpanded && (
									<div
										className="dropdown-content expanded"
										style={{
											backgroundColor: "#FFFFFF",
										}}
									>
										<div
											className="box"
											style={{
												// boxShadow: "0px 10px 10px 0px #cccccc",
												padding: 0,
												margin: 0,
												paddingLeft: "20px",
												display: "grid",
												gridTemplateColumns: "8fr 2fr",
												textAlign: "left",
												borderBottom: "1px solid #E3E3E3",
											}}
										>
											<p style={{ justifySelf: "start" }}>Cash and Cash equivalents</p>
											<p> 25,000</p>
										</div>
									</div>
								)}
							</div>
						</div>
						<div>
							<div className="container" style={{ width: "100%" }}>
								<div className="toggle-button" onClick={handleToggleExpand}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											backgroundColor: "#E3E3E3",
										}}
									>
										{isExpanded ? (
											<div
												className="icon icon-arr_down"
												style={{ margin: "5px", color: "#272D30" }}
											></div>
										) : (
											<div
												className="icon icon-arr_right"
												style={{ margin: "5px", color: "#272D30" }}
											></div>
										)}
										<span style={{ color: "#272D30" }}>Liabilities</span>
									</div>
								</div>
								{isExpanded && (
									<div
										className="dropdown-content expanded"
										style={{
											backgroundColor: "#FFFFFF",
										}}
									>
										<div
											className="box"
											style={{
												// boxShadow: "0px 10px 10px 0px #cccccc",
												padding: 0,
												margin: 0,
												paddingLeft: "20px",
												display: "grid",
												gridTemplateColumns: "8fr 2fr",
												textAlign: "left",
												borderBottom: "1px solid #E3E3E3",
											}}
										>
											<p style={{ justifySelf: "start" }}>
												Account payable
											</p>
											<p> 25,000</p>
										</div>
										<div
											className="box"
											style={{
												// boxShadow: "0px 10px 10px 0px #cccccc",
												padding: 0,
												margin: 0,
												paddingLeft: "20px",
												display: "grid",
												gridTemplateColumns: "8fr 2fr",
												textAlign: "left",
												borderBottom: "1px solid #E3E3E3",
											}}
										>
											<p style={{ justifySelf: "start"}}>
												Current Liabilities
											</p>
											<p> 25,000</p>
										</div>
									</div>
								)}
							</div>
						</div>
						<div>
							<div className="container" style={{ width: "100%" }}>
								<div className="toggle-button" onClick={handleToggleExpand}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											backgroundColor: "#E3E3E3",
										}}
									>
										{isExpanded ? (
											<div
												className="icon icon-arr_down"
												style={{ margin: "5px", color: "#272D30" }}
											></div>
										) : (
											<div
												className="icon icon-arr_right"
												style={{ margin: "5px", color: "#272D30" }}
											></div>
										)}
										<span style={{ color: "#272D30" }}>Equity</span>
									</div>
								</div>
								{isExpanded && (
									<div
										className="dropdown-content expanded"
										style={{
											backgroundColor: "#FFFFFF",
										}}
									>
										<div
											className="box"
											style={{
												// boxShadow: "0px 10px 10px 0px #cccccc",
												padding: 0,
												margin: 0,
												paddingLeft: "20px",
												display: "grid",
												gridTemplateColumns: "8fr 2fr",
												textAlign: "left",
												borderBottom: "1px solid #E3E3E3",
											}}
										>
											<p style={{ justifySelf: "start" }}>Cash and Cash equivalents</p>
											<p> 25,000</p>
										</div>
									</div>
								)}
							</div>
						</div>
						<div>
							<div className="container" style={{ width: "100%" }}>
								<div className="toggle-button" onClick={handleToggleExpand}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											backgroundColor: "#E3E3E3",
										}}
									>
										{isExpanded ? (
											<div
												className="icon icon-arr_down"
												style={{ margin: "5px", color: "#272D30" }}
											></div>
										) : (
											<div
												className="icon icon-arr_right"
												style={{ margin: "5px", color: "#272D30" }}
											></div>
										)}
										<span style={{ color: "#272D30" }}>Revenue</span>
									</div>
								</div>
								{isExpanded && (
									<div
										className="dropdown-content expanded"
										style={{
											backgroundColor: "#FFFFFF",
										}}
									>
										<div
											className="box"
											style={{
												// boxShadow: "0px 10px 10px 0px #cccccc",
												padding: 0,
												margin: 0,
												paddingLeft: "20px",
												display: "grid",
												gridTemplateColumns: "8fr 2fr",
												textAlign: "left",
												borderBottom: "1px solid #E3E3E3",
											}}
										>
											<p style={{ justifySelf: "start" }}>Cash and Cash equivalents</p>
											<p> 25,000</p>
										</div>
									</div>
								)}
							</div>
						</div>
						<div>
							<div className="container" style={{ width: "100%" }}>
								<div className="toggle-button" onClick={handleToggleExpand}>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											backgroundColor: "#E3E3E3",
										}}
									>
										{isExpanded ? (
											<div
												className="icon icon-arr_down"
												style={{ margin: "5px", color: "#272D30" }}
											></div>
										) : (
											<div
												className="icon icon-arr_right"
												style={{ margin: "5px", color: "#272D30" }}
											></div>
										)}
										<span style={{ color: "#272D30" }}>Expenses</span>
									</div>
								</div>
								{isExpanded && (
									<div
										className="dropdown-content expanded"
										style={{
											backgroundColor: "#FFFFFF",
										}}
									>
										<div
											className="box"
											style={{
												// boxShadow: "0px 10px 10px 0px #cccccc",
												padding: 0,
												margin: 0,
												paddingLeft: "20px",
												display: "grid",
												gridTemplateColumns: "8fr 2fr",
												textAlign: "left",
												borderBottom: "1px solid #E3E3E3",
											}}
										>
											<p style={{ justifySelf: "start" }}>Cash and Cash equivalents</p>
											<p> 25,000</p>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ReportBalanceSheet;
