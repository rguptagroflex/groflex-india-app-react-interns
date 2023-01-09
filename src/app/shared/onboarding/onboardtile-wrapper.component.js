import React from "react";
import { connect } from "react-redux";
import { fetchRegistrationList } from "redux/ducks/registrationOnboarding/registrationOnboardingValues";
import OnboardTile from "./onboardtile.component";

class OnboardTileWrapper extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			tileClicked: {
				id: this.props.tileClicked || null,
				dropdownType: '',
				value: ''
			},
			regStep: this.props.regStep,
			isReady: false
		};
	}

	handleTileClick(data) {
		this.setState({ tileClicked: data }, () => this.props.onhandleTileChange(this.state.tileClicked));
	}

	componentDidMount() {
		const { businesstype, businessturnover, regStep } = this.props;
		this.setState({ isReady: true });
		if ((businesstype && businesstype.length === 0) || (businessturnover && businessturnover.length === 0)) {
			this.props.fetchRegistrationList();

			this.setState({ regStep });
		}
	}

	render() {
		const { businesstype, businessturnover, regStep } = this.props;
		const { isReady } = this.state;
		let businessList = null;
		if (regStep === "businesstype") {
			businessList = businesstype;
		} else if (regStep === "businessturnover") {
			businessList = businessturnover;
		}

		return (
			<div className="tile-selector-wrapper">
				{isReady ? (
					businessList.map((btype) => (
						<OnboardTile
							classes={
								btype.id === this.state.tileClicked.id ? "tileContainer selected" : "tileContainer"
							}
							key={btype.id}
							btype={btype}
							tileClick={this.handleTileClick.bind(this)}
						/>
					))
				) : (
					<div>Loading</div>
				)}
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	const { resources } = state.language.lang;
	const {
		registrationListData,
		businesscategory,
		businessturnover,
		businesstype,
	} = state.registrationOnboarding.registrationOnboardingValues;
	return {
		resources,
		registrationListData,
		businesscategory,
		businessturnover,
		businesstype,
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		fetchRegistrationList: () => {
			dispatch(fetchRegistrationList());
		},
	};
};

export default connect(mapStateToProps, mapDispatchToProps)(OnboardTileWrapper);
