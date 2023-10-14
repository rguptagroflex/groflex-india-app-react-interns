import React from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField"; // Import TextField for the search bar
import GlobalSearchModalComponent from "../modals/global-search-modal.component";

const useStyles = makeStyles({
	list: {
		width: 250,
	},
	fullList: {
		width: "auto",
	},
	closeButton: {
		marginTop: "10px",
	},
});

export default function SearchComponent() {
	const classes = useStyles();
	const [state, setState] = React.useState({
		left: false, // Only left sidebar
	});

	const toggleDrawer = (anchor, open) => (event) => {
		if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
			return;
		}

		setState({ ...state, [anchor]: open });
	};

	const closeDrawer = (anchor) => () => {
		setState({ ...state, [anchor]: false });
	};

	const list = (anchor) => (
		<div
			className={clsx(classes.list, {
				[classes.fullList]: anchor === "left", // Only apply styling for left sidebar
			})}
			role="presentation"
		>
			<GlobalSearchModalComponent />
			<Button variant="contained" color="primary" className={classes.closeButton} onClick={closeDrawer(anchor)}>
				Close
			</Button>
		</div>
	);

	return (
		<div>
			{/* Only render the left sidebar */}
			<React.Fragment key={"left"}>
				<Button onClick={toggleDrawer("left", true)}>Left</Button>
				<Drawer anchor={"left"} open={state["left"]} onClose={toggleDrawer("left", false)}>
					{list("left")}
				</Drawer>
			</React.Fragment>
		</div>
	);
}
