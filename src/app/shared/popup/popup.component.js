import React from 'react';
import ReactDOM, { render } from 'react-dom';
import ButtonComponent from 'shared/button/button.component';
import ModalService from 'services/modal.service';

class PopupComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			headline: props.headline || '',
			text: props.text || '',
			confirmLabel: props.confirmLabel || '',
			onConfirm: props.onConfirm,
			showPopup:props.showPopup || '',
		};
		this.togglePopupWindow = this.togglePopupWindow.bind(this);
	}
	togglePopupWindow() {
		const { showPopup } = this.state;
		this.setState({
			showPopup: !showPopup,
		});
	}
	render(){
		const { headline, text, confirmLabel, onConfirm } = this.state;
		return(
			<div className="popup-wrapper u_c">
				<div className="popup-content">
					<div className="popup-text-wrapper">
						<div className="popup-headline-text text-semibold">{headline}</div>
						<div className="popup-detail-text">{text}</div>
					</div>
					<div className="popup-buttons-wrapper u_c">
						<ButtonComponent
							type="text"
							label="Abort"
							callback={() => ModalService.close()}
						/>
						<ButtonComponent type="primary" label={confirmLabel} callback={() => onConfirm && onConfirm()} />
					</div>
				</div>
			</div>
		)
	}
}
export default PopupComponent;
