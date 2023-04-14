import React from "react";
import TopbarComponent from "../../shared/topbar/topbar-start-page.component";

function ReportBalanceSheet() {
	return (
		<div>
			<TopbarComponent
				title={"Balance Sheet"}
				hasCancelButton={true}
				cancelButtonCallback={() => {
					window.history.back();
				}}
			/>
		</div>
	);
}

export default ReportBalanceSheet;
