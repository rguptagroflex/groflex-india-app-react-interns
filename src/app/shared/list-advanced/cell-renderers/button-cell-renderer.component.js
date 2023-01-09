import React, { Component } from 'react';

export default class BtnCellRendererComponent extends Component {
    constructor(props) {
        super(props);
      }
      render() {
        const { data, resources } = this.props;
        return (
          <React.Fragment>
            {
              data.trackedInInventory ? (
                <div className="stock-buttons">
                    <div className="stock-button-link-left">
                         <a>{resources.str_addToStock}</a>
                     </div>
                     {data.currentStock <=0 ? null : (<div className="stock-button-link-right">
                        <a>{resources.str_removeFromStock}</a>
                      </div>)}

                </div>
              ) : (
                <div className="stock-buttons">
                    <div className="stock-button-link-left">
                      <a>{resources.str_trackInInventory}</a>
                    </div>
                </div>
              )
            }

          </React.Fragment>
        )
      }
}
