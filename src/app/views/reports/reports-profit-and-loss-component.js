import React from 'react'
import TopbarComponent from '../../shared/topbar/topbar.component';

function ReportsProfitAndLoss() {
  return (
    <div>
      <TopbarComponent
				title={"Profit and loss"}
				hasCancelButton={true}
				cancelButtonCallback={() => {
					window.history.back();
				}}
			/>
    </div>
  )
}

export default ReportsProfitAndLoss