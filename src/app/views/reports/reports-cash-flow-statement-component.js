import React from 'react'
import TopbarComponent from '../../shared/topbar/topbar-start-page.component'

function ReportsCashFlowStatement() {
  return (
   <div>
    <TopbarComponent
				title={"Cash Flow Statement"}
				hasCancelButton={true}
				cancelButtonCallback={() => {
					window.history.back();
				}}
			/>

   </div>
  )
}

export default ReportsCashFlowStatement