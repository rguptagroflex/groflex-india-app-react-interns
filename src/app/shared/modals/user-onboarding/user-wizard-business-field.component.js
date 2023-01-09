import React from 'react';
import lang from 'lang';
import CollapsableComponent from 'shared/collapsable/collapsable.component';
import TextInputExtendedComponent from 'shared/inputs/text-input-extended/text-input-extended.component';
import RadioInputComponent from 'shared/inputs/radio-input/radio-input.component';
import PerfectScrollbar from 'perfect-scrollbar';

class UserWizardBusinessFieldCompoment extends React.Component {
	constructor(props) {
		super(props);

		this.perfectScrollbar = null;
	}

	componentDidMount() {
		this.perfectScrollbar = new PerfectScrollbar('.user-wizard-modal-scroll-container', {
			suppressScrollX: false,
		});
	}

	componentWillUnmount() {
		if (this.perfectScrollbar) {
			this.perfectScrollbar.destroy();
		}
	}

	render() {
		const { onRadioChange, currentBusinessField, otherBusinessField, currentBusinessFieldExtension } = this.props;

		const collapsables = this.props.data.businessFields.map((businessFields, index) => {
			const radios = businessFields.businessFields.map((businessField, index) => {
				return (
					<React.Fragment key={index}>
						<div className="radio-custom-wrapper">
							<div className="radio-custom-circle-wrapper">
								<input
									id={`radio-input-${businessField}`}
									type="radio"
									tabIndex="0"
									name="businessField"
									value={businessField}
									className="radio-custom"
									checked={currentBusinessField === businessField}
									onChange={(event) => {
										onRadioChange(event.target.value);
									}}
								/>
								<span className="radio-custom-circle" />
							</div>
							<div className={`radio-custom-label-wrapper`}>
								<label htmlFor={`radio-input-${businessField}`}>{businessField}</label>
							</div>
						</div>
					</React.Fragment>
				);
			});

			return (
				<React.Fragment key={index}>
					<CollapsableComponent expandedByDefault={false}>
						<div data-collapsable-head>{businessFields.category}</div>
						<div data-collapsable-body>
							<div className="form_input radio">{radios}</div>
						</div>
					</CollapsableComponent>
					<hr />
				</React.Fragment>
			);
		});

		return (
			<React.Fragment>
				<h5 className="headline text-h6">{`Select the category that best describes your business`}</h5>
				<div className="business-category-field">
				<div className="user-wizard-modal-scroll-container">
					{collapsables}
					<CollapsableComponent expandedByDefault={false}>
						<div data-collapsable-head>{`Custom business category`}</div>
						<div data-collapsable-body>
							<div className="row">
								<TextInputExtendedComponent
									customWrapperClass={'col-xs-12'}
									name={'otherBusinessField'}
									label={`Enter your category`}
									value={otherBusinessField}
									onChange={(value) => {
										onRadioChange(value, 'otherBusinessField');
									}}
									autoComplete="off"
									spellCheck="false"
									variant="outlined-rounded"
								/>
							</div>
						</div>
					</CollapsableComponent>
				</div>
				</div>
			</React.Fragment>
		);
	}
}

export default UserWizardBusinessFieldCompoment;
